import { z } from "zod";
import { pageSchema } from "@/shared/schemas/pagination";

export const historyItemSchema = z.strictObject({
  sessionId: z.string(),
  lesson: z.strictObject({
    id: z.string(),
    version: z.number().int(),
    title: z.string(),
  }),
  state: z.string(),
  startedAt: z.string(),
  updatedAt: z.string(),
  attempts: z.number().int(),
  /** Highest score among assessed attempts; null if none was assessed. */
  bestScore: z.number().int().nullable(),
});

export const historyResponseSchema = pageSchema(historyItemSchema).extend({
  correlationId: z.string(),
});

export const progressItemSchema = z.strictObject({
  lessonId: z.string(),
  title: z.string(),
  sessions: z.number().int(),
  assessedAttempts: z.number().int(),
  bestScore: z.number().int().nullable(),
  latestScore: z.number().int().nullable(),
});

export const progressResponseSchema = z.strictObject({
  lessons: z.array(progressItemSchema),
  recommendation: z
    .strictObject({
      lessonId: z.string(),
      title: z.string(),
      kind: z.enum(["start", "practice_again", "next"]),
      /** Plain description of the rule used; not a mastery claim. */
      rule: z.string(),
    })
    .nullable(),
  correlationId: z.string(),
});
