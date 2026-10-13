import "server-only";
import type { EvaluationResult } from "@/server/ai/gateway";
import type { Rubric } from "@/server/assessment/rubric-schema";
import { AppError } from "@/server/http/errors";
import type { LessonVersion } from "@/server/learning/lesson-schema";
import type { SessionStore } from "@/server/learning/session/store";
import type {
  Attempt,
  AttemptKind,
  AttemptResult,
  CriterionChange,
  SessionState,
  TutorSession,
} from "@/server/learning/session/types";
import { TEXT_LIMITS, boundedText } from "@/shared/schemas/primitives";

/** D-007: at most 3 counted attempts and 1 clarification per answer cycle. */
export const SESSION_LIMITS = {
  maxCountedAttempts: 3,
  maxClarificationsPerCycle: 1,
} as const;

const answerSchema = boundedText({ max: TEXT_LIMITS.explanation });
const idempotencyKeySchema = boundedText({ min: 8, max: 64 });

export interface EngineDeps {
  store: SessionStore;
  /** Usually the AI gateway's evaluateExplanation, bound to its deps. */
  evaluate: (input: {
    lesson: LessonVersion;
    rubric: Rubric;
    answer: string;
    /** Per-owner key for the AI rate limiter (a hash, never raw identity). */
    rateLimitKey: string;
  }) => Promise<EvaluationResult>;
  /** Resolves the exact lesson and rubric versions captured by the session. */
  resolve: (
    session: TutorSession,
  ) => { lesson: LessonVersion; rubric: Rubric } | undefined;
  maxAiCalls: number;
  now?: () => Date;
  newId?: () => string;
}

const SUBMITTABLE: Partial<Record<SessionState, AttemptKind | "pending">> = {
  awaiting_explanation: "initial",
  needs_clarification: "clarification",
  awaiting_revision: "revision",
  recoverable_error: "pending",
};

function conflict(message: string): AppError {
  return new AppError("CONFLICT", message);
}

/** Attempts that used one of the learner's tries (errors are not counted). */
export function countedAttempts(session: TutorSession): number {
  return session.attempts.filter(
    (a) => a.result !== null && a.result.status !== "error",
  ).length;
}

export class TutorSessionEngine {
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor(private readonly deps: EngineDeps) {
    this.now = deps.now ?? (() => new Date());
    this.newId = deps.newId ?? (() => crypto.randomUUID());
  }

  /** Starts a session pinned to this lesson version, content hash and rubric version. */
  async start(
    lesson: LessonVersion,
    rubric: Rubric,
    contentHash: string,
    ownerKeyHash: string,
    ownerUserId?: string,
  ): Promise<TutorSession> {
    if (
      lesson.rubric.rubricId !== rubric.id ||
      lesson.rubric.version !== rubric.version
    )
      throw new AppError(
        "INTERNAL_ERROR",
        "Rubric does not belong to lesson version",
      );
    const at = this.now().toISOString();
    const session: TutorSession = {
      id: this.newId(),
      ownerKeyHash,
      ...(ownerUserId ? { ownerUserId } : {}),
      lesson: { id: lesson.id, version: lesson.version, contentHash },
      rubric: { id: rubric.id, version: rubric.version },
      state: "lesson_chosen",
      pending: null,
      attempts: [],
      clarificationsInCycle: 0,
      aiCalls: 0,
      version: 1,
      createdAt: at,
      updatedAt: at,
    };
    await this.deps.store.create(session);
    return session;
  }

  async viewConcept(id: string, expectedVersion: number) {
    return this.transition(
      id,
      expectedVersion,
      ["lesson_chosen", "concept_viewed"],
      "concept_viewed",
    );
  }

  async beginExplanation(id: string, expectedVersion: number) {
    return this.transition(
      id,
      expectedVersion,
      ["concept_viewed"],
      "awaiting_explanation",
    );
  }

  async startRevision(id: string, expectedVersion: number) {
    const session = await this.load(id, expectedVersion);
    if (session.state !== "assessed")
      throw conflict(`cannot revise from ${session.state}`);
    if (countedAttempts(session) >= SESSION_LIMITS.maxCountedAttempts)
      throw conflict("no attempts left");
    return this.save(session, {
      state: "awaiting_revision",
      clarificationsInCycle: 0,
    });
  }

  async complete(id: string, expectedVersion: number) {
    return this.transition(
      id,
      expectedVersion,
      ["assessed", "awaiting_revision"],
      "completed",
    );
  }

  async submit(
    id: string,
    input: {
      expectedVersion: number;
      answer: string;
      idempotencyKey: string;
      /** AI rate-limit bucket; defaults to the session owner. */
      rateLimitKey?: string;
    },
  ): Promise<TutorSession> {
    const key = idempotencyKeySchema.safeParse(input.idempotencyKey);
    if (!key.success)
      throw new AppError("VALIDATION_ERROR", "invalid idempotency key", {
        details: {
          fields: [{ path: "idempotencyKey", issue: "invalid_format" }],
        },
      });
    const answer = answerSchema.safeParse(input.answer);
    if (!answer.success)
      throw new AppError("VALIDATION_ERROR", "invalid answer", {
        details: {
          fields: [
            {
              path: "answer",
              issue: input.answer.trim() === "" ? "required" : "too_long",
            },
          ],
        },
      });

    let session = await this.mustGet(id);
    // Same key again: return the stored outcome instead of re-evaluating.
    const repeat = session.attempts.find((a) => a.idempotencyKey === key.data);
    if (repeat) {
      if (repeat.result === null)
        throw conflict("this answer is still being evaluated");
      return session;
    }
    if (session.version !== input.expectedVersion)
      throw conflict("session changed; reload");

    const allowed = SUBMITTABLE[session.state];
    if (!allowed)
      throw conflict(`cannot submit an answer in state ${session.state}`);
    const kind: AttemptKind =
      allowed === "pending" ? session.pending! : allowed;
    if (session.aiCalls >= this.deps.maxAiCalls)
      throw new AppError(
        "RATE_LIMITED",
        "AI call budget for this session is used up",
      );

    const content = this.deps.resolve(session);
    if (!content)
      throw new AppError("NOT_FOUND", "captured lesson version is missing");

    // Clarification replies are judged together with the answer they clarify.
    const previous =
      kind === "clarification"
        ? [...session.attempts]
            .reverse()
            .find((a) => a.result?.status === "needs_clarification")
        : undefined;
    const evaluatedText = previous
      ? `${previous.evaluatedText}\n${answer.data}`
      : answer.data;
    if (evaluatedText.length > TEXT_LIMITS.explanation)
      throw new AppError("VALIDATION_ERROR", "combined explanation too long", {
        details: { fields: [{ path: "answer", issue: "too_long" }] },
      });

    const attempt: Attempt = {
      number: session.attempts.length + 1,
      kind,
      answer: answer.data,
      evaluatedText,
      idempotencyKey: key.data,
      submittedAt: this.now().toISOString(),
      result: null,
    };
    session = await this.save(session, {
      state: kind === "revision" ? "reassessing" : "evaluating",
      pending: kind,
      attempts: [...session.attempts, attempt],
    });

    const evaluation = await this.deps.evaluate({
      lesson: content.lesson,
      rubric: content.rubric,
      answer: evaluatedText,
      rateLimitKey: input.rateLimitKey ?? session.ownerKeyHash,
    });
    return this.applyEvaluation(session, attempt.number, evaluation);
  }

  private async applyEvaluation(
    session: TutorSession,
    attemptNumber: number,
    evaluation: EvaluationResult,
  ): Promise<TutorSession> {
    const result = toAttemptResult(evaluation);
    const attempts = session.attempts.map((a) =>
      a.number === attemptNumber ? { ...a, result } : a,
    );
    const aiCalls = session.aiCalls + evaluation.attempts;
    const updated = { ...session, attempts };
    const used = countedAttempts(updated);

    if (result.status === "error")
      return this.save(session, {
        attempts,
        aiCalls,
        state: "recoverable_error",
      });

    if (result.status === "assessed")
      return this.save(session, {
        attempts,
        aiCalls,
        state: "assessed",
        pending: null,
        clarificationsInCycle: 0,
      });

    // needs_clarification
    if (used >= SESSION_LIMITS.maxCountedAttempts)
      return this.save(session, {
        attempts,
        aiCalls,
        state: "completed",
        pending: null,
      });
    if (
      session.clarificationsInCycle < SESSION_LIMITS.maxClarificationsPerCycle
    )
      return this.save(session, {
        attempts,
        aiCalls,
        state: "needs_clarification",
        pending: "clarification",
        clarificationsInCycle: session.clarificationsInCycle + 1,
      });
    // Clarification budget used: ask for a fresh explanation instead of looping.
    return this.save(session, {
      attempts,
      aiCalls,
      state: "awaiting_revision",
      pending: null,
      clarificationsInCycle: 0,
    });
  }

  private async transition(
    id: string,
    expectedVersion: number,
    from: SessionState[],
    to: SessionState,
  ) {
    const session = await this.load(id, expectedVersion);
    if (!from.includes(session.state))
      throw conflict(`cannot move from ${session.state} to ${to}`);
    return this.save(session, { state: to });
  }

  private async mustGet(id: string): Promise<TutorSession> {
    const session = await this.deps.store.get(id);
    if (!session) throw new AppError("NOT_FOUND", "session not found");
    return session;
  }

  private async load(
    id: string,
    expectedVersion: number,
  ): Promise<TutorSession> {
    const session = await this.mustGet(id);
    if (session.version !== expectedVersion)
      throw conflict("session changed; reload");
    return session;
  }

  private async save(session: TutorSession, changes: Partial<TutorSession>) {
    const next: TutorSession = {
      ...session,
      ...changes,
      version: session.version + 1,
      updatedAt: this.now().toISOString(),
    };
    if (!(await this.deps.store.replace(next, session.version)))
      throw conflict("session changed; reload");
    return next;
  }
}

function toAttemptResult(evaluation: EvaluationResult): AttemptResult {
  if (!evaluation.ok)
    return {
      status: "error",
      code: evaluation.code,
      retryable: evaluation.retryable,
    };
  const evaluator = {
    mode: evaluation.mode,
    model: evaluation.model,
    promptVersion: evaluation.promptVersion,
  };
  const { outcome, message, misconceptionIds } = evaluation.assessment;
  if (outcome.status === "assessed")
    return {
      status: "assessed",
      score: outcome.score,
      hint: message,
      misconceptionIds,
      evaluator,
    };
  return {
    status: "needs_clarification",
    targetCriterion: outcome.targetCriterion,
    question: message,
    evaluator,
  };
}

/**
 * Compares the first and latest assessed attempts (same rubric version by
 * construction). `changed` is true only when the rubric results differ; it is
 * not a claim about long-term learning.
 */
export function compareAttempts(session: TutorSession) {
  const assessed = session.attempts.filter(
    (
      a,
    ): a is Attempt & {
      result: Extract<AttemptResult, { status: "assessed" }>;
    } => a.result?.status === "assessed",
  );
  if (assessed.length < 2) return null;
  const first = assessed[0].result.score;
  const latest = assessed[assessed.length - 1].result.score;
  const changes: CriterionChange[] = latest.criteria
    .map((c) => ({
      criterionKey: c.criterionKey,
      from: first.criteria.find((f) => f.criterionKey === c.criterionKey)!
        .level,
      to: c.level,
    }))
    .filter((c) => c.from !== c.to);
  return {
    fromTotal: first.displayTotal,
    toTotal: latest.displayTotal,
    changes,
    changed: changes.length > 0,
  };
}
