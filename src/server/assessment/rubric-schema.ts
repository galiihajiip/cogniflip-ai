import "server-only";
import { z } from "zod";
import { slugSchema } from "@/shared/schemas/primitives";

/**
 * Versioned rubric model (ADR-002, D-007). Each criterion is rated at one of
 * three levels; the application, not the model, turns ratings into points.
 */

export const LEVELS = ["belum_terlihat", "sebagian", "tepat"] as const;
export type Level = (typeof LEVELS)[number];
export const levelSchema = z.enum(LEVELS);

/** Share of a criterion's weight earned at each level, in halves (0, ½, 1). */
export const LEVEL_HALVES: Record<Level, 0 | 1 | 2> = {
  belum_terlihat: 0,
  sebagian: 1,
  tepat: 2,
};

const text = (max: number) => z.string().trim().min(1).max(max);
const perLevel = (max: number) =>
  z.strictObject({
    belum_terlihat: text(max),
    sebagian: text(max),
    tepat: text(max),
  });

export const criterionSchema = z.strictObject({
  key: slugSchema,
  /** For developers and reviewers. */
  label: text(120),
  /** Shown to learners. */
  learnerLabel: text(60),
  weight: z.number().int().min(1).max(100),
  evidenceRequired: text(400),
  levels: perLevel(400),
  /** Learner-friendly feedback guidance for each level. */
  feedback: perLevel(300),
  misconceptionIds: z.array(slugSchema).max(8),
});
export type Criterion = z.infer<typeof criterionSchema>;

export const rubricSchema = z
  .strictObject({
    id: slugSchema,
    version: z.number().int().min(1).max(10_000),
    status: z.enum(["draft", "published", "archived"]),
    lessonId: slugSchema,
    totalPoints: z.literal(100),
    criteria: z.array(criterionSchema).min(1).max(8),
    review: z.strictObject({
      status: z.enum(["unreviewed", "reviewed"]),
      reviewer: text(80),
      reviewedOn: z.iso.date(),
      notes: text(1_000),
    }),
  })
  .superRefine((rubric, ctx) => {
    const keys = rubric.criteria.map((c) => c.key);
    if (new Set(keys).size !== keys.length)
      ctx.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "criterion keys must be unique",
      });
    const sum = rubric.criteria.reduce((total, c) => total + c.weight, 0);
    if (sum !== rubric.totalPoints)
      ctx.addIssue({
        code: "custom",
        path: ["criteria"],
        message: `weights sum to ${sum}, expected ${rubric.totalPoints}`,
      });
    if (rubric.status === "published" && rubric.review.status !== "reviewed")
      ctx.addIssue({
        code: "custom",
        path: ["review", "status"],
        message: "published rubrics must be reviewed",
      });
  });
export type Rubric = z.infer<typeof rubricSchema>;
export type RubricInput = z.input<typeof rubricSchema>;
