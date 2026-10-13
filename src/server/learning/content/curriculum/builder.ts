import "server-only";
import type { RubricInput } from "@/server/assessment/rubric-schema";
import type { LessonVersion } from "@/server/learning/lesson-schema";

/**
 * Compact authoring format for the multi-language curriculum (D-015).
 * One spec becomes one lesson version and its rubric, so every lesson has
 * the same structure: three explainable criteria, misconceptions, bounded
 * hints and a reference explanation for reviewers.
 *
 * Topic order follows the W3Schools tutorial sequence for each language as a
 * reference only; all text is original, written for Indonesian grade 4–6
 * learners. Drafted by the AI coding assistant on 2026-10-15; NOT
 * human-reviewed (status "draft").
 */

export interface CriterionSpec {
  key: string;
  /** Reviewer label (English). */
  label: string;
  /** Learner label (Indonesian, ≤ 60 chars). */
  learner: string;
  weight: number;
  /** What an answer must show (English, for the evaluator). */
  evidence: string;
  /** Guiding question when this criterion is missing (Indonesian). */
  ask: string;
  misconceptions?: string[];
}

export type ExampleSpec =
  | {
      language:
        "python" | "javascript" | "html" | "css" | "sql" | "java" | "cpp";
      code: string;
      /** Verified with a real interpreter in tests/unit/curriculum.test.ts. */
      output: string;
      explanation: string;
    }
  | { conceptual: string; explanation: string };

export interface LessonSpec {
  id: string;
  topic: LessonVersion["topic"];
  difficulty: 1 | 2 | 3;
  title: string;
  summary: string;
  objective: string;
  concept: string;
  analogy: string;
  example: ExampleSpec;
  prompt: string;
  instructions: string;
  criteria: [CriterionSpec, CriterionSpec, CriterionSpec];
  misconceptions: Array<{ id: string; description: string; signals: string[] }>;
  hints: string[];
  reference: string;
  alternatives: string[];
}

export interface TrackSpec {
  id: string;
  title: string;
  description: string;
  lessons: LessonSpec[];
}

const LANGUAGE_VERSION: Record<string, string> = {
  python: "3.13",
  javascript: "ES2023",
  html: "HTML5",
  css: "CSS3",
  sql: "SQLite-3",
  java: "21",
  cpp: "C++17",
};

const REVIEW = {
  status: "unreviewed",
  reviewer: "belum direview (draf asisten AI)",
  reviewedOn: "2026-10-15",
  notes:
    "Multi-language curriculum draft (D-015). Topic order referenced from W3Schools; text is original. Needs teacher review before publishing.",
} as const;

export function buildTrack(track: TrackSpec): {
  lessons: LessonVersion[];
  rubrics: RubricInput[];
} {
  const lessons: LessonVersion[] = [];
  const rubrics: RubricInput[] = [];
  track.lessons.forEach((spec, index) => {
    const previous = track.lessons[index - 1];
    lessons.push(buildLesson(spec, previous ? [previous.id] : []));
    rubrics.push(buildRubric(spec));
  });
  return { lessons, rubrics };
}

function buildLesson(spec: LessonSpec, prerequisites: string[]): LessonVersion {
  const example =
    "conceptual" in spec.example
      ? {
          kind: "conceptual" as const,
          content: spec.example.conceptual,
          explanation: spec.example.explanation,
        }
      : {
          kind: "code" as const,
          language: spec.example.language,
          languageVersion: LANGUAGE_VERSION[spec.example.language]!,
          content: spec.example.code,
          expectedOutput: spec.example.output,
          explanation: spec.example.explanation,
        };
  return {
    id: spec.id,
    version: 1,
    status: "draft",
    locale: "id-ID",
    gradeBand: { min: 4, max: 6 },
    topic: spec.topic,
    difficulty: spec.difficulty,
    title: spec.title,
    summary: spec.summary,
    objective: { id: `${spec.id}-tujuan`, text: spec.objective },
    prerequisites,
    concept: { explanation: spec.concept, analogy: spec.analogy },
    example,
    task: { prompt: spec.prompt, instructions: spec.instructions },
    rubric: { rubricId: spec.id, version: 1 },
    acceptedEvidence: spec.criteria.map((c) => c.evidence),
    alternativeExplanations: spec.alternatives,
    misconceptions: spec.misconceptions,
    hints: spec.hints,
    referenceExplanation: spec.reference,
    review: REVIEW,
  };
}

function buildRubric(spec: LessonSpec): RubricInput {
  return {
    id: spec.id,
    version: 1,
    status: "draft",
    lessonId: spec.id,
    totalPoints: 100,
    criteria: spec.criteria.map((c) => ({
      key: c.key,
      label: c.label,
      learnerLabel: c.learner,
      weight: c.weight,
      evidenceRequired: c.evidence,
      levels: {
        belum_terlihat: `No evidence for: ${c.label}.`,
        sebagian: `Mentions the idea of "${c.label}" vaguely or incompletely, without the explanation required: ${c.evidence}`,
        tepat: `Clearly shows: ${c.evidence}`,
      },
      feedback: {
        belum_terlihat: c.ask,
        sebagian: `Kamu sudah mulai menjelaskan "${c.learner}". Tambahkan sedikit lagi: ${c.ask}`,
        tepat: `Tepat! Kamu sudah menjelaskan "${c.learner}".`,
      },
      misconceptionIds: c.misconceptions ?? [],
    })),
    review: REVIEW,
  };
}
