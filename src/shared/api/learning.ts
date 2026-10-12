import { z } from "zod";

/**
 * Learner-facing response contracts for lessons and tutor sessions.
 * Answer keys, accepted evidence, misconceptions and evaluator internals are
 * deliberately absent; strict objects make any such field a contract error.
 */

const levelSchema = z.enum(["belum_terlihat", "sebagian", "tepat"]);

export const lessonSummarySchema = z.strictObject({
  id: z.string(),
  version: z.number().int(),
  title: z.string(),
  summary: z.string(),
  topic: z.string(),
  difficulty: z.number().int(),
  prerequisites: z.array(z.string()),
  /** Only when draft content is explicitly enabled outside production. */
  draft: z.boolean(),
});

export const lessonListResponseSchema = z.strictObject({
  lessons: z.array(lessonSummarySchema),
  correlationId: z.string(),
});

export const lessonDetailResponseSchema = z.strictObject({
  lesson: lessonSummarySchema.extend({
    objective: z.string(),
    concept: z.strictObject({ explanation: z.string(), analogy: z.string() }),
    example: z.discriminatedUnion("kind", [
      z.strictObject({
        kind: z.literal("conceptual"),
        content: z.string(),
        explanation: z.string(),
      }),
      z.strictObject({
        kind: z.literal("code"),
        language: z.string(),
        languageVersion: z.string(),
        content: z.string(),
        expectedOutput: z.string(),
        explanation: z.string(),
      }),
    ]),
    task: z.strictObject({ prompt: z.string(), instructions: z.string() }),
  }),
  correlationId: z.string(),
});

const outcomeSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("evaluating") }),
  z.strictObject({
    status: z.literal("assessed"),
    total: z.number(),
    possible: z.number(),
    criteria: z.array(
      z.strictObject({
        label: z.string(),
        level: levelSchema,
        earned: z.number(),
        possible: z.number(),
      }),
    ),
    hint: z.string(),
  }),
  z.strictObject({
    status: z.literal("needs_clarification"),
    question: z.string(),
  }),
  z.strictObject({
    status: z.literal("error"),
    code: z.string(),
    retryable: z.boolean(),
  }),
]);

export const sessionViewSchema = z.strictObject({
  sessionId: z.string(),
  version: z.number().int(),
  state: z.enum([
    "lesson_chosen",
    "concept_viewed",
    "awaiting_explanation",
    "evaluating",
    "needs_clarification",
    "assessed",
    "awaiting_revision",
    "reassessing",
    "completed",
    "recoverable_error",
  ]),
  lesson: z.strictObject({
    id: z.string(),
    version: z.number().int(),
    title: z.string(),
  }),
  attemptsUsed: z.number().int(),
  attemptsLeft: z.number().int(),
  canRevise: z.boolean(),
  mockMode: z.boolean(),
  attempts: z.array(
    z.strictObject({
      number: z.number().int(),
      kind: z.enum(["initial", "clarification", "revision"]),
      answer: z.string(),
      outcome: outcomeSchema,
    }),
  ),
  comparison: z
    .strictObject({
      fromTotal: z.number(),
      toTotal: z.number(),
      changes: z.array(
        z.strictObject({
          criterionKey: z.string(),
          from: levelSchema,
          to: levelSchema,
        }),
      ),
      changed: z.boolean(),
    })
    .nullable(),
  referenceExplanation: z.string().nullable(),
});

export const sessionResponseSchema = z.strictObject({
  session: sessionViewSchema,
  correlationId: z.string(),
});

/** POST /api/sessions */
export const createSessionRequestSchema = z.strictObject({
  lessonId: z.string().min(1).max(64),
});

/** POST /api/sessions/:id/actions */
export const sessionActionRequestSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.enum(["view_concept", "begin", "revise", "complete"]),
    expectedVersion: z.number().int().min(1),
  }),
  z.strictObject({
    type: z.literal("submit"),
    expectedVersion: z.number().int().min(1),
    answer: z.string().max(4_000),
    idempotencyKey: z.string().min(8).max(64),
  }),
]);
