import "server-only";
import type pg from "pg";
import { z } from "zod";
import type { SessionStore } from "@/server/learning/session/store";
import {
  SESSION_STATES,
  type Attempt,
  type AttemptResult,
  type TutorSession,
} from "@/server/learning/session/types";

/**
 * PostgreSQL SessionStore (BLOCK 29). Stored JSON is re-validated on read;
 * `replace` is a conditional update on `version` inside one transaction, so
 * concurrent writers cannot overwrite each other.
 */

const level = z.enum(["belum_terlihat", "sebagian", "tepat"]);
const evaluator = z.strictObject({
  mode: z.enum(["live", "mock"]),
  model: z.string(),
  promptVersion: z.string(),
});
const attemptResultSchema: z.ZodType<AttemptResult> = z.discriminatedUnion(
  "status",
  [
    z.strictObject({
      status: z.literal("assessed"),
      score: z.strictObject({
        kind: z.literal("learning_understanding"),
        scoringVersion: z.literal("scoring-v1"),
        rubricId: z.string(),
        rubricVersion: z.number().int(),
        total: z.number(),
        displayTotal: z.number().int(),
        possible: z.number(),
        criteria: z.array(
          z.strictObject({
            criterionKey: z.string(),
            level,
            earned: z.number(),
            possible: z.number(),
          }),
        ),
      }),
      hint: z.string(),
      misconceptionIds: z.array(z.string()),
      evaluator,
    }),
    z.strictObject({
      status: z.literal("needs_clarification"),
      targetCriterion: z.string(),
      question: z.string(),
      evaluator,
    }),
    z.strictObject({
      status: z.literal("error"),
      code: z.enum([
        "PROVIDER_UNAVAILABLE",
        "PROVIDER_TIMEOUT",
        "INVALID_MODEL_OUTPUT",
        "RATE_LIMITED",
        "VALIDATION_ERROR",
      ]),
      retryable: z.boolean(),
    }),
  ],
);

interface SessionRow {
  id: string;
  owner_user_id: string | null;
  owner_guest_hash: string | null;
  owner_key_hash: string;
  lesson_id: string;
  lesson_version: number;
  lesson_content_hash: string;
  rubric_id: string;
  rubric_version: number;
  state: string;
  pending: string | null;
  clarifications_in_cycle: number;
  ai_calls: number;
  version: number;
  created_at: Date;
  updated_at: Date;
}

interface AttemptRow {
  number: number;
  kind: Attempt["kind"];
  answer: string;
  evaluated_text: string;
  idempotency_key: string;
  submitted_at: Date;
  result: unknown;
}

function toSession(row: SessionRow, attempts: AttemptRow[]): TutorSession {
  const state = z.enum(SESSION_STATES).parse(row.state);
  return {
    id: row.id,
    ownerKeyHash: row.owner_key_hash,
    ownerUserId: row.owner_user_id ?? undefined,
    lesson: {
      id: row.lesson_id,
      version: row.lesson_version,
      contentHash: row.lesson_content_hash,
    },
    rubric: { id: row.rubric_id, version: row.rubric_version },
    state,
    pending: (row.pending as TutorSession["pending"]) ?? null,
    clarificationsInCycle: row.clarifications_in_cycle,
    aiCalls: row.ai_calls,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    attempts: attempts.map((a) => ({
      number: a.number,
      kind: a.kind,
      answer: a.answer,
      evaluatedText: a.evaluated_text,
      idempotencyKey: a.idempotency_key,
      submittedAt: a.submitted_at.toISOString(),
      result: a.result === null ? null : attemptResultSchema.parse(a.result),
    })),
  };
}

export class PostgresSessionStore implements SessionStore {
  constructor(private readonly pool: pg.Pool) {}

  async get(id: string) {
    const sessions = await this.pool.query<SessionRow>(
      `select * from tutor_sessions where id = $1`,
      [id],
    );
    if (!sessions.rows[0]) return undefined;
    const attempts = await this.pool.query<AttemptRow>(
      `select number, kind, answer, evaluated_text, idempotency_key, submitted_at, result
         from tutor_attempts where session_id = $1 order by number`,
      [id],
    );
    return toSession(sessions.rows[0], attempts.rows);
  }

  async create(session: TutorSession) {
    await this.pool.query(
      `insert into tutor_sessions (id, owner_user_id, owner_guest_hash, owner_key_hash,
         lesson_id, lesson_version, lesson_content_hash, rubric_id, rubric_version,
         state, pending, clarifications_in_cycle, ai_calls, version, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        session.id,
        session.ownerUserId ?? null,
        session.ownerUserId ? null : session.ownerKeyHash,
        session.ownerKeyHash,
        session.lesson.id,
        session.lesson.version,
        session.lesson.contentHash,
        session.rubric.id,
        session.rubric.version,
        session.state,
        session.pending,
        session.clarificationsInCycle,
        session.aiCalls,
        session.version,
        session.createdAt,
        session.updatedAt,
      ],
    );
  }

  async replace(next: TutorSession, expectedVersion: number) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const updated = await client.query(
        `update tutor_sessions set state = $3, pending = $4, clarifications_in_cycle = $5,
           ai_calls = $6, version = $7, updated_at = $8
         where id = $1 and version = $2`,
        [
          next.id,
          expectedVersion,
          next.state,
          next.pending,
          next.clarificationsInCycle,
          next.aiCalls,
          next.version,
          next.updatedAt,
        ],
      );
      if (updated.rowCount !== 1) {
        await client.query("rollback");
        return false;
      }
      for (const a of next.attempts) {
        const assessed = a.result?.status === "assessed" ? a.result : null;
        // New attempts are inserted; an existing attempt may only gain its
        // result once (never rewritten afterwards).
        await client.query(
          `insert into tutor_attempts (session_id, number, kind, answer, evaluated_text,
             idempotency_key, submitted_at, result_status, result, score_total, scoring_version)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           on conflict (session_id, number) do update set
             result_status = excluded.result_status, result = excluded.result,
             score_total = excluded.score_total, scoring_version = excluded.scoring_version
           where tutor_attempts.result is null`,
          [
            next.id,
            a.number,
            a.kind,
            a.answer,
            a.evaluatedText,
            a.idempotencyKey,
            a.submittedAt,
            a.result?.status ?? null,
            a.result ? JSON.stringify(a.result) : null,
            assessed ? assessed.score.total : null,
            assessed ? assessed.score.scoringVersion : null,
          ],
        );
      }
      await client.query("commit");
      return true;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}

/** Retention: deletes guest sessions not updated for `days` days. */
export async function deleteStaleGuestSessions(
  pool: pg.Pool,
  days = 30,
): Promise<number> {
  const result = await pool.query(
    `delete from tutor_sessions
      where owner_guest_hash is not null and updated_at < now() - make_interval(days => $1)`,
    [days],
  );
  return result.rowCount ?? 0;
}
