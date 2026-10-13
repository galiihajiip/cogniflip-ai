import "server-only";
import { z } from "zod";
import { localeSchema, slugSchema } from "@/shared/schemas/primitives";

/**
 * Lesson content model (docs/18 §2). Lessons are reviewed content stored in
 * the repository and versioned; they are never generated at runtime and never
 * mixed with UI code or AI prompt strings.
 */

const text = (max: number) => z.string().trim().min(1).max(max);

export const LESSON_TOPICS = [
  "sequence",
  "events",
  "loops",
  "conditions",
  "variables",
  "debugging",
  // Multi-language curriculum (D-015).
  "output",
  "data-types",
  "strings",
  "operators",
  "collections",
  "functions",
  "objects",
  "errors",
  "web-structure",
  "web-content",
  "forms",
  "styling",
  "layout",
  "responsive",
  "queries",
  "filtering",
  "aggregation",
  "joins",
  "dom",
  "modules",
] as const;

/** Languages a lesson's code example may use; outputs are verified in tests. */
export const EXAMPLE_LANGUAGES = [
  "python",
  "javascript",
  "html",
  "css",
  "sql",
  "java",
  "cpp",
] as const;

export const LESSON_STATUSES = ["draft", "published", "archived"] as const;

export const lessonIdSchema = slugSchema;
export const contentVersionSchema = z.number().int().min(1).max(10_000);

/** Reference to an exact rubric version (rubric schema: BLOCK 13). */
export const rubricRefSchema = z.strictObject({
  rubricId: slugSchema,
  version: contentVersionSchema,
});
export type RubricRef = z.infer<typeof rubricRefSchema>;

const exampleSchema = z.discriminatedUnion("kind", [
  // A plain-language or "robot command" example; not executable code.
  z.strictObject({
    kind: z.literal("conceptual"),
    content: text(800),
    explanation: text(600),
  }),
  // Executable source code with a reviewed expected output.
  z.strictObject({
    kind: z.literal("code"),
    language: z.enum(EXAMPLE_LANGUAGES),
    languageVersion: z.string().regex(/^[\w.+-]{1,20}$/),
    content: text(1_200),
    /** Exact program output (empty for HTML/CSS, which render instead). */
    expectedOutput: z.string().max(600),
    explanation: text(600),
  }),
]);

export const misconceptionSchema = z.strictObject({
  id: slugSchema,
  description: text(300),
  /** Phrases or ideas in a learner answer that suggest this misconception. */
  signals: z.array(text(160)).min(1).max(8),
});

export const lessonVersionSchema = z
  .strictObject({
    id: lessonIdSchema,
    version: contentVersionSchema,
    status: z.enum(LESSON_STATUSES),
    locale: localeSchema,
    gradeBand: z.strictObject({
      min: z.number().int().min(1).max(6),
      max: z.number().int().min(1).max(6),
    }),
    topic: z.enum(LESSON_TOPICS),
    difficulty: z.number().int().min(1).max(3),
    title: text(80),
    summary: text(200),
    objective: z.strictObject({
      id: slugSchema,
      /** One observable learning objective, phrased for adults/reviewers. */
      text: text(300),
    }),
    prerequisites: z.array(lessonIdSchema).max(5),
    concept: z.strictObject({
      explanation: text(800),
      analogy: text(500),
    }),
    example: exampleSchema,
    task: z.strictObject({
      /** What the learner is asked to explain, in simple Indonesian. */
      prompt: text(300),
      instructions: text(500),
    }),
    rubric: rubricRefSchema,
    acceptedEvidence: z.array(text(300)).min(1).max(10),
    alternativeExplanations: z.array(text(400)).min(1).max(10),
    misconceptions: z.array(misconceptionSchema).min(1).max(8),
    hints: z.array(text(300)).min(1).max(5),
    /** Answer key for reviewers and tests. Never sent to the learner. */
    referenceExplanation: text(800),
    review: z.strictObject({
      status: z.enum(["unreviewed", "reviewed"]),
      reviewer: text(80),
      reviewedOn: z.iso.date(),
      notes: text(1_000),
    }),
  })
  .superRefine((lesson, ctx) => {
    if (lesson.gradeBand.min > lesson.gradeBand.max) {
      ctx.addIssue({
        code: "custom",
        path: ["gradeBand"],
        message: "min must not exceed max",
      });
    }
    if (lesson.prerequisites.includes(lesson.id)) {
      ctx.addIssue({
        code: "custom",
        path: ["prerequisites"],
        message: "a lesson cannot require itself",
      });
    }
    const ids = lesson.misconceptions.map((m) => m.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        path: ["misconceptions"],
        message: "duplicate misconception id",
      });
    }
    if (lesson.status === "published" && lesson.review.status !== "reviewed") {
      ctx.addIssue({
        code: "custom",
        path: ["review", "status"],
        message: "published lessons must be reviewed",
      });
    }
  });
export type LessonVersion = z.infer<typeof lessonVersionSchema>;

export const learningPathSchema = z.strictObject({
  id: slugSchema,
  /** A draft path may list draft lessons; a published path only published ones. */
  status: z.enum(["draft", "published"]),
  title: text(80),
  /** One sentence shown on the learning page. */
  description: text(300).optional(),
  locale: localeSchema,
  /** Ordered lesson ids; the learner sees them in this order. */
  lessons: z.array(lessonIdSchema).min(1).max(30),
});
export type LearningPath = z.infer<typeof learningPathSchema>;
