import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RUBRICS } from "@/server/assessment/content/rubrics";
import { computeLock } from "@/server/learning/catalog";
import { getLessonCatalog } from "@/server/learning/content";
import { LESSONS } from "@/server/learning/content/lessons";
import { PATHS } from "@/server/learning/content/paths";
import { TEXT_LIMITS } from "@/shared/schemas/primitives";
import {
  ANSWER_FIXTURES,
  ANSWER_KINDS,
} from "@/server/assessment/benchmark/answers";

const LOCK_PATH = join(
  process.cwd(),
  "src/server/learning/content/lessons.lock.json",
);
const LEVELS = ["belum_terlihat", "sebagian", "tepat"];

const BASE_IDS = ["urutan-instruksi", "perulangan", "percabangan"];
const BASE = LESSONS.filter((l) => BASE_IDS.includes(l.id));

describe("lesson content", () => {
  it("builds a valid catalog from the real content", () => {
    expect(() => getLessonCatalog()).not.toThrow();
  });

  it("has the lock file in sync with published/archived content", () => {
    const expected = computeLock(LESSONS);
    // Publishing is a deliberate step: UPDATE_CONTENT_LOCK=1 npm run test
    if (process.env.UPDATE_CONTENT_LOCK === "1") {
      writeFileSync(LOCK_PATH, JSON.stringify(expected, null, 2) + "\n");
    }
    expect(JSON.parse(readFileSync(LOCK_PATH, "utf8"))).toEqual(expected);
  });

  it("starts with one robot-command lesson each for sequence, loops and conditions", () => {
    expect(BASE.map((l) => l.topic).sort()).toEqual([
      "conditions",
      "loops",
      "sequence",
    ]);
  });

  it("keeps AI-drafted lessons and rubrics unpublished until a human reviews them", () => {
    for (const lesson of LESSONS) {
      if (lesson.review.status !== "reviewed")
        expect(lesson.status).toBe("draft");
    }
    for (const rubric of RUBRICS) {
      if (rubric.review.status !== "reviewed")
        expect(rubric.status).toBe("draft");
    }
    expect(getLessonCatalog().paths()).toEqual(
      PATHS.filter((p) => p.status === "published"),
    );
  });

  it("links every lesson to its own rubric and every rubric totals 100", () => {
    for (const lesson of LESSONS) {
      const rubric = RUBRICS.find((r) => r.id === lesson.rubric.rubricId);
      expect(rubric?.lessonId).toBe(lesson.id);
      expect(rubric?.criteria.reduce((sum, c) => sum + c.weight, 0)).toBe(
        rubric?.totalPoints,
      );
    }
  });

  it("references only misconceptions the lesson defines", () => {
    for (const rubric of RUBRICS) {
      const lesson = LESSONS.find((l) => l.id === rubric.lessonId)!;
      const known = new Set(lesson.misconceptions.map((m) => m.id));
      for (const criterion of rubric.criteria)
        for (const id of criterion.misconceptionIds)
          expect(known.has(id), `${rubric.id}: ${id}`).toBe(true);
    }
  });
});

describe("answer fixtures", () => {
  it("has unique ids and every answer kind for every lesson", () => {
    const ids = ANSWER_FIXTURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Benchmark fixtures cover the robot-command lessons (the curriculum
    // lessons are covered by tests/unit/curriculum.test.ts).
    for (const lesson of BASE) {
      const kinds = ANSWER_FIXTURES.filter((f) => f.lessonId === lesson.id)
        .map((f) => f.kind)
        .sort();
      expect(kinds).toEqual([...ANSWER_KINDS].sort());
    }
  });

  it.each(ANSWER_FIXTURES.map((f) => [f.id, f] as const))(
    "%s has labels consistent with its rubric",
    (_id, fixture) => {
      const lesson = LESSONS.find((l) => l.id === fixture.lessonId)!;
      const rubric = RUBRICS.find((r) => r.id === lesson.rubric.rubricId)!;
      const keys = rubric.criteria.map((c) => c.key).sort();

      expect(fixture.answer.length).toBeGreaterThan(0);
      expect(fixture.answer.length).toBeLessThanOrEqual(
        TEXT_LIMITS.explanation,
      );
      expect(fixture.rationale.length).toBeGreaterThan(20);

      if (fixture.expected.status === "assessed") {
        // Every criterion is rated; none silently omitted.
        expect(Object.keys(fixture.expected.ratings).sort()).toEqual(keys);
        for (const level of Object.values(fixture.expected.ratings))
          expect(LEVELS).toContain(level);
        const known = lesson.misconceptions.map((m) => m.id);
        for (const id of fixture.expected.misconceptionIds)
          expect(known).toContain(id);
      } else {
        expect(keys).toContain(fixture.expected.clarifyCriterion);
      }
    },
  );

  it("labels ambiguous and off-topic answers for clarification, never a score", () => {
    for (const f of ANSWER_FIXTURES)
      if (f.kind === "ambiguous" || f.kind === "off_topic")
        expect(f.expected.status).toBe("needs_clarification");
  });

  it("never gives full marks to a prompt-injection answer", () => {
    for (const f of ANSWER_FIXTURES.filter(
      (x) => x.kind === "prompt_injection",
    )) {
      expect(f.expected.status).toBe("assessed");
      if (f.expected.status === "assessed")
        expect(Object.values(f.expected.ratings)).not.toEqual(
          Object.values(f.expected.ratings).map(() => "tepat"),
        );
    }
  });

  it("marks every label as proposed until the participant reviews it", () => {
    expect(ANSWER_FIXTURES.every((f) => f.labelStatus === "proposed")).toBe(
      true,
    );
  });
});
