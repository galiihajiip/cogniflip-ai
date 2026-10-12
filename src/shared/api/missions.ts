import { z } from "zod";

export const missionViewSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("predict"),
    id: z.string(),
    version: z.number().int(),
    title: z.string(),
    topic: z.string(),
    language: z.string(),
    code: z.string(),
    draft: z.boolean(),
  }),
  z.strictObject({
    kind: z.literal("debug"),
    id: z.string(),
    version: z.number().int(),
    title: z.string(),
    topic: z.string(),
    language: z.string(),
    difficulty: z.number().int(),
    intendedBehavior: z.string(),
    intendedOutput: z.string(),
    code: z.string(),
    draft: z.boolean(),
  }),
]);

export const missionListResponseSchema = z.strictObject({
  missions: z.array(missionViewSchema),
  correlationId: z.string(),
});
export const missionResponseSchema = z.strictObject({
  mission: missionViewSchema,
  correlationId: z.string(),
});

export const missionAttemptRequestSchema = z.strictObject({
  type: z.enum(["predict", "reflect", "diagnose"]),
  answer: z.string().trim().min(1).max(1_000),
  idempotencyKey: z.string().min(8).max(64),
});

export const missionAttemptResponseSchema = z.strictObject({
  result: z.discriminatedUnion("type", [
    z.strictObject({
      type: z.literal("predict"),
      outcome: z.enum(["correct", "incorrect"]),
      expectedOutput: z.string(),
      /** Always "reviewed_fixture" while execution is disabled. */
      outputSource: z.enum(["reviewed_fixture", "runtime"]),
      explanation: z.string(),
      hint: z.string().nullable(),
      nextStep: z.string().nullable(),
    }),
    z.strictObject({
      type: z.literal("reflect"),
      outcome: z.literal("recorded"),
    }),
    z.strictObject({
      type: z.literal("diagnose"),
      outcome: z.enum(["correct", "partial", "incorrect", "unclear"]),
      feedback: z.string().nullable(),
      hint: z.string().nullable(),
      answerKey: z
        .strictObject({ explanation: z.string(), fixedCode: z.string() })
        .nullable(),
    }),
  ]),
  correlationId: z.string(),
});
