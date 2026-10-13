import "server-only";
import { getRubric } from "@/server/assessment/content";
import {
  MAX_ATTEMPTS,
  evaluateExplanation,
  type EvaluationResult,
} from "@/server/ai/gateway";
import { Orchestrator } from "@/server/ai/orchestrator";
import { getGatewayDeps } from "@/server/ai";
import {
  getServerEnv,
  isIntegrationConfigured,
  type ServerEnv,
} from "@/server/config/env";
import { getCurrentUser } from "@/server/auth";
import { getPool } from "@/server/db/client";
import {
  clientIp,
  existingGuestHash,
  guestIdentity,
  hashKey,
} from "@/server/http/guest";
import { isDemoHandle } from "@/shared/api/demo";
import { PostgresSessionStore } from "@/server/learning/session/pg-store";
import { AppError } from "@/server/http/errors";
import { getLessonCatalog } from "@/server/learning/content";
import { LESSONS } from "@/server/learning/content/lessons";
import { PATHS } from "@/server/learning/content/paths";
import type { LessonVersion } from "@/server/learning/lesson-schema";
import { TutorSessionEngine } from "@/server/learning/session/engine";
import {
  InMemorySessionStore,
  type SessionStore,
} from "@/server/learning/session/store";
import type { TutorSession } from "@/server/learning/session/types";

/**
 * Application service for lessons and tutor sessions (used by route
 * handlers). Content access: published lessons only, plus unreviewed drafts
 * unreviewed drafts unless ALLOW_DRAFT_CONTENT=false (D-013: drafts are
 * shown to every visitor, labelled "Draf", until they are reviewed).
 */

const allowDrafts = (env: ServerEnv) => env.ALLOW_DRAFT_CONTENT !== "false";

/** Lessons a learner may open, in learning-path order when a path exists. */
export function listLearnerLessons(env: ServerEnv): LessonVersion[] {
  const catalog = getLessonCatalog();
  const published = catalog.publishedLessons();
  if (!allowDrafts(env)) return published;
  const ids = new Set(published.map((l) => l.id));
  const drafts = LESSONS.filter((l) => l.status === "draft" && !ids.has(l.id))
    .map((l) => catalog.getVersion(l.id, l.version)!)
    .filter(Boolean);
  return [...published, ...drafts];
}

/** Learning tracks with the lessons this learner may open, in path order. */
export function listLearnerTracks(env: ServerEnv) {
  const visible = new Map(listLearnerLessons(env).map((l) => [l.id, l]));
  return PATHS.filter((p) => p.status === "published" || allowDrafts(env))
    .map((path) => ({
      id: path.id,
      title: path.title,
      description: path.description ?? "",
      lessons: path.lessons
        .map((id) => visible.get(id))
        .filter((l): l is LessonVersion => l !== undefined),
    }))
    .filter((track) => track.lessons.length > 0);
}

export function getLearnerLesson(env: ServerEnv, id: string): LessonVersion {
  const lesson = listLearnerLessons(env).find((l) => l.id === id);
  if (!lesson) throw new AppError("NOT_FOUND", "lesson not available");
  return lesson;
}

const globalForTutor = globalThis as typeof globalThis & {
  cogniflipTutor?: {
    key: string;
    engine: TutorSessionEngine;
    store: SessionStore;
  };
};

/**
 * Tutor engine bound to the configured AI gateway. Sessions are stored in
 * PostgreSQL when the database is configured; otherwise in process memory
 * (lost on restart, not shared between serverless instances).
 */
export function getTutor(env: ServerEnv) {
  const persistent = isIntegrationConfigured(env, "database");
  const key = `${env.AI_MAX_CALLS_PER_SESSION}|${persistent}`;
  if (globalForTutor.cogniflipTutor?.key !== key) {
    const store: SessionStore = persistent
      ? new PostgresSessionStore(getPool())
      : new InMemorySessionStore();
    const catalog = getLessonCatalog();
    const engine = new TutorSessionEngine({
      store,
      // Read configuration at call time, not when the engine was created.
      evaluate: (input) => evaluateViaOrchestrator(getServerEnv(), input),
      resolve: (session) => {
        const lesson = catalog.getVersion(
          session.lesson.id,
          session.lesson.version,
        );
        const rubric = getRubric(session.rubric.id, session.rubric.version);
        if (
          !lesson ||
          !rubric ||
          catalog.contentHash(lesson) !== session.lesson.contentHash
        )
          return undefined;
        return { lesson, rubric };
      },
      maxAiCalls: env.AI_MAX_CALLS_PER_SESSION,
    });
    globalForTutor.cogniflipTutor = { key, engine, store };
  }
  return globalForTutor.cogniflipTutor;
}

/** Loads a session only for its owner; anyone else gets NOT_FOUND. */
export async function getOwnedSession(
  env: ServerEnv,
  id: string,
  ownerKeyHash: string | undefined,
): Promise<TutorSession> {
  const session = ownerKeyHash ? await getTutor(env).store.get(id) : undefined;
  if (!session || session.ownerKeyHash !== ownerKeyHash)
    throw new AppError("NOT_FOUND", "session not found");
  return session;
}

/** Owner key for a signed-in user; distinct from any guest key. */
export const userOwnerHash = (userId: string) => hashKey(`user:${userId}`);

/** Who is creating a session: the signed-in user, or a (new) guest. */
export async function requesterForCreate(request: Request, env: ServerEnv) {
  const user = await getCurrentUser(request, env);
  if (user) return { keyHash: userOwnerHash(user.id), userId: user.id };
  const guest = guestIdentity(request, env);
  return { keyHash: guest.keyHash, setCookie: guest.setCookie };
}

/**
 * Rate-limit bucket for a request: normally the owner. The shared demo
 * account is bucketed per client IP instead, so visitors using it at the
 * same time do not use up each other's quota (D-014). Ownership of data is
 * unchanged.
 */
export async function requesterRateKey(
  request: Request,
  env: ServerEnv,
  ownerKeyHash: string,
): Promise<string> {
  const user = await getCurrentUser(request, env);
  return user && isDemoHandle(user.handle)
    ? hashKey(`demo-rate:${clientIp(request)}`)
    : ownerKeyHash;
}

/** Owner key for reads/writes; never creates a new identity. */
export async function requesterOwnerHash(request: Request, env: ServerEnv) {
  const user = await getCurrentUser(request, env);
  return user ? userOwnerHash(user.id) : existingGuestHash(request);
}

/**
 * The tutor's `assess_explanation` workflow: one agent (the Understanding
 * Evaluator) under the orchestrator's call and wall-clock budget (BLOCK 50).
 */
export async function evaluateViaOrchestrator(
  env: ServerEnv,
  input: Parameters<typeof evaluateExplanation>[1],
): Promise<EvaluationResult> {
  const orchestrator = new Orchestrator("assess_explanation", {
    maxCalls: MAX_ATTEMPTS,
    maxWallMs: env.AI_TIMEOUT_SECONDS * 1000 * MAX_ATTEMPTS + 2_000,
  });
  let result: EvaluationResult | undefined;
  const step = await orchestrator.step(
    {
      name: "understanding_evaluator",
      responsibility:
        "Rate each rubric criterion with evidence from the answer.",
      maxCalls: MAX_ATTEMPTS,
      run: async (_input, signal) => {
        result = await evaluateExplanation(getGatewayDeps(env), {
          ...input,
          signal,
        });
        return result.ok
          ? {
              ok: true,
              value: result,
              mode: result.mode,
              model: result.model,
              attempts: result.attempts,
            }
          : result;
      },
    },
    input,
  );
  if (result && step.ok) return result;
  if (result && !result.ok) return result;
  // Budget exhausted or cancelled before a result: no score, retryable.
  return { ok: false, code: "PROVIDER_TIMEOUT", retryable: true, attempts: 0 };
}
