import { z } from "zod";

export const rewardsResponseSchema = z.strictObject({
  totalXp: z.number().int().min(0),
  ruleVersion: z.string(),
  recentEvents: z.array(
    z.strictObject({
      type: z.enum([
        "explanation_assessed",
        "strong_explanation",
        "improved_after_revision",
        "prediction_correct",
        "bug_diagnosed",
      ]),
      delta: z.number().int(),
      description: z.string(),
      at: z.string(),
    }),
  ),
  achievements: z.array(
    z.strictObject({
      key: z.string(),
      title: z.string(),
      description: z.string(),
      earnedAt: z.string().nullable(),
    }),
  ),
  correlationId: z.string(),
});
