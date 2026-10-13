import "server-only";
import type pg from "pg";
import type { GatewayDeps } from "@/server/ai/gateway";
import type { ServerEnv } from "@/server/config/env";
import { AppError } from "@/server/http/errors";
import { diagnoseBug } from "@/server/missions/diagnose";
import {
  MISSIONS,
  type DebugMission,
  type Mission,
  type PredictMission,
} from "@/server/missions/content";

export type MissionOutcome =
  | "correct"
  | "incorrect"
  | "partial"
  | "unclear"
  | "runtime_unavailable"
  | "recorded"
  | "error";

export interface MissionAttempt {
  id: string;
  ownerKeyHash: string;
  ownerUserId?: string;
  missionId: string;
  missionVersion: number;
  kind: "predict" | "reflect" | "diagnose";
  answer: string;
  outcome: MissionOutcome;
  outputSource: "reviewed_fixture" | "runtime" | null;
  idempotencyKey: string;
  createdAt: string;
}

/** Storage port: PostgreSQL when configured, memory otherwise. */
export interface MissionStore {
  byKey(owner: string, key: string): Promise<MissionAttempt | undefined>;
  list(owner: string, missionId: string): Promise<MissionAttempt[]>;
  add(
    attempt: Omit<MissionAttempt, "id" | "createdAt">,
  ): Promise<MissionAttempt>;
}

export class InMemoryMissionStore implements MissionStore {
  private readonly rows: MissionAttempt[] = [];
  async byKey(owner: string, key: string) {
    return this.rows.find(
      (r) => r.ownerKeyHash === owner && r.idempotencyKey === key,
    );
  }
  async list(owner: string, missionId: string) {
    return this.rows.filter(
      (r) => r.ownerKeyHash === owner && r.missionId === missionId,
    );
  }
  async add(a: Omit<MissionAttempt, "id" | "createdAt">) {
    const row = {
      ...a,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.rows.push(row);
    return row;
  }
}

export class PostgresMissionStore implements MissionStore {
  constructor(private readonly pool: pg.Pool) {}
  private map = (r: Record<string, unknown>): MissionAttempt => ({
    id: r.id as string,
    ownerKeyHash: r.owner_key_hash as string,
    ownerUserId: (r.owner_user_id as string | null) ?? undefined,
    missionId: r.mission_id as string,
    missionVersion: r.mission_version as number,
    kind: r.kind as MissionAttempt["kind"],
    answer: r.answer as string,
    outcome: r.outcome as MissionOutcome,
    outputSource: (r.output_source as MissionAttempt["outputSource"]) ?? null,
    idempotencyKey: r.idempotency_key as string,
    createdAt: (r.created_at as Date).toISOString(),
  });
  async byKey(owner: string, key: string) {
    const { rows } = await this.pool.query(
      `select * from mission_attempts where owner_key_hash = $1 and idempotency_key = $2`,
      [owner, key],
    );
    return rows[0] ? this.map(rows[0]) : undefined;
  }
  async list(owner: string, missionId: string) {
    const { rows } = await this.pool.query(
      `select * from mission_attempts where owner_key_hash = $1 and mission_id = $2 order by created_at`,
      [owner, missionId],
    );
    return rows.map(this.map);
  }
  async add(a: Omit<MissionAttempt, "id" | "createdAt">) {
    const { rows } = await this.pool.query(
      `insert into mission_attempts (owner_user_id, owner_key_hash, mission_id, mission_version, kind,
         answer, outcome, output_source, idempotency_key)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (owner_key_hash, idempotency_key) do nothing
       returning *`,
      [
        a.ownerUserId ?? null,
        a.ownerKeyHash,
        a.missionId,
        a.missionVersion,
        a.kind,
        a.answer,
        a.outcome,
        a.outputSource,
        a.idempotencyKey,
      ],
    );
    // A concurrent duplicate already stored the attempt: return that one.
    return rows[0]
      ? this.map(rows[0])
      : (await this.byKey(a.ownerKeyHash, a.idempotencyKey))!;
  }
}

/** Compare outputs line by line, ignoring trailing spaces and trailing blank lines. */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n+$/, "")
    .trim();
}

export function listMissions(env: ServerEnv): Mission[] {
  const drafts = env.ALLOW_DRAFT_CONTENT !== "false"; // D-013
  return MISSIONS.filter((m) => m.status === "published" || drafts);
}

export function getMission(env: ServerEnv, id: string): Mission {
  const mission = listMissions(env).find((m) => m.id === id);
  if (!mission) throw new AppError("NOT_FOUND", "mission not available");
  return mission;
}

/** Learner view: no expected output or answer key before they are earned. */
export function toMissionView(m: Mission) {
  return m.kind === "predict"
    ? {
        kind: m.kind,
        id: m.id,
        version: m.version,
        title: m.title,
        topic: m.topic,
        language: m.language,
        code: m.code,
        draft: m.status !== "published",
      }
    : {
        kind: m.kind,
        id: m.id,
        version: m.version,
        title: m.title,
        topic: m.topic,
        language: m.language,
        difficulty: m.difficulty,
        intendedBehavior: m.intendedBehavior,
        intendedOutput: m.intendedOutput,
        code: m.buggyCode,
        draft: m.status !== "published",
      };
}

export const MAX_DIAGNOSE_TRIES_BEFORE_REVEAL = 3;

export class MissionService {
  constructor(
    private readonly store: MissionStore,
    private readonly gateway: () => GatewayDeps,
  ) {}

  /** Same idempotency key → the stored attempt, never a second evaluation. */
  private async existing(owner: string, key: string, missionId: string) {
    const found = await this.store.byKey(owner, key);
    if (found && found.missionId !== missionId)
      throw new AppError(
        "CONFLICT",
        "idempotency key reused for another mission",
      );
    return found;
  }

  async predict(
    owner: { keyHash: string; userId?: string },
    mission: PredictMission,
    prediction: string,
    key: string,
  ) {
    const stored =
      (await this.existing(owner.keyHash, key, mission.id)) ??
      (await this.store.add({
        ownerKeyHash: owner.keyHash,
        ownerUserId: owner.userId,
        missionId: mission.id,
        missionVersion: mission.version,
        kind: "predict",
        answer: prediction,
        outcome:
          normalizeOutput(prediction) ===
          normalizeOutput(mission.expectedOutput)
            ? "correct"
            : "incorrect",
        // Execution is disabled, so the comparison is always against the reviewed fixture.
        outputSource: "reviewed_fixture",
        idempotencyKey: key,
      }));
    const correct = stored.outcome === "correct";
    return {
      outcome: stored.outcome as "correct" | "incorrect",
      expectedOutput: mission.expectedOutput,
      outputSource: "reviewed_fixture" as const,
      explanation: mission.explanation,
      hint: correct ? null : mission.hint,
      nextStep: correct
        ? null
        : "Jelaskan mengapa hasilnya berbeda dari tebakanmu, lalu coba lagi.",
    };
  }

  async reflect(
    owner: { keyHash: string; userId?: string },
    mission: Mission,
    text: string,
    key: string,
  ) {
    await ((await this.existing(owner.keyHash, key, mission.id)) ??
      this.store.add({
        ownerKeyHash: owner.keyHash,
        ownerUserId: owner.userId,
        missionId: mission.id,
        missionVersion: mission.version,
        kind: "reflect",
        answer: text,
        outcome: "recorded",
        outputSource: null,
        idempotencyKey: key,
      }));
    return { outcome: "recorded" as const };
  }

  async diagnose(
    owner: { keyHash: string; userId?: string; rateKey?: string },
    mission: DebugMission,
    text: string,
    key: string,
  ) {
    const previous = (await this.store.list(owner.keyHash, mission.id)).filter(
      (a) => a.kind === "diagnose",
    );
    let stored = await this.existing(owner.keyHash, key, mission.id);
    let feedback: string | null = null;
    if (!stored) {
      const result = await diagnoseBug(
        this.gateway(),
        mission,
        text,
        owner.rateKey ?? owner.keyHash,
      );
      if (!result.ok)
        // Infrastructure failure is never recorded as a wrong diagnosis.
        throw new AppError(result.code, "diagnosis unavailable", {
          details: result.retryAfterSeconds
            ? { retryAfterSeconds: result.retryAfterSeconds }
            : undefined,
        });
      feedback = result.value.feedback;
      stored = await this.store.add({
        ownerKeyHash: owner.keyHash,
        ownerUserId: owner.userId,
        missionId: mission.id,
        missionVersion: mission.version,
        kind: "diagnose",
        answer: text,
        outcome: result.value.verdict,
        outputSource: null,
        idempotencyKey: key,
      });
      previous.push(stored);
    }
    const solved = previous.some((a) => a.outcome === "correct");
    const misses = previous.filter((a) => a.outcome !== "correct").length;
    const reveal = solved || misses >= MAX_DIAGNOSE_TRIES_BEFORE_REVEAL;
    return {
      outcome: stored.outcome as
        "correct" | "partial" | "incorrect" | "unclear",
      feedback,
      // One progressive hint at a time, never past the last one.
      hint: solved
        ? null
        : (mission.hints[Math.min(misses - 1, mission.hints.length - 1)] ??
          null),
      answerKey: reveal
        ? {
            explanation: mission.answerKey.explanation,
            fixedCode: mission.answerKey.fixedCode,
          }
        : null,
    };
  }
}
