import { describe, expect, it } from "vitest";
import { CURRICULUM_RUBRICS } from "@/server/learning/content/curriculum";
import { allRubrics, getRubric } from "@/server/assessment/content";
import {
  rubricSchema,
  type Level,
  type Rubric,
  type RubricInput,
} from "@/server/assessment/rubric-schema";
import {
  SCORING_VERSION,
  scoreRatings,
  validateRatings,
  type AssessmentOutcome,
  type CriterionRating,
} from "@/server/assessment/scoring";
import { ANSWER_FIXTURES } from "@/server/assessment/benchmark/answers";

const level = (l: string) => ({ belum_terlihat: l, sebagian: l, tepat: l });

function makeRubric(
  weights: number[],
  overrides: Partial<RubricInput> = {},
): RubricInput {
  return {
    id: "uji",
    version: 1,
    status: "draft",
    lessonId: "uji",
    totalPoints: 100,
    criteria: weights.map((weight, i) => ({
      key: `k${i + 1}`,
      label: `Criterion ${i + 1}`,
      learnerLabel: `Kriteria ${i + 1}`,
      weight,
      evidenceRequired: "Some evidence.",
      levels: level("desc"),
      feedback: level("saran"),
      misconceptionIds: [],
    })),
    review: {
      status: "unreviewed",
      reviewer: "test",
      reviewedOn: "2026-10-13",
      notes: "Synthetic rubric for tests.",
    },
    ...overrides,
  };
}

const rate = (rubric: Rubric, levels: Level[]): CriterionRating[] =>
  rubric.criteria.map((c, i) => ({
    criterionKey: c.key,
    level: levels[i],
    evidence: levels[i] === "belum_terlihat" ? null : "kutipan jawaban",
  }));

function assessed(outcome: AssessmentOutcome) {
  if (outcome.status !== "assessed")
    throw new Error(`expected assessed, got ${outcome.status}`);
  return outcome.score;
}

describe("rubric schema", () => {
  it("accepts weights that sum to 100", () => {
    expect(rubricSchema.safeParse(makeRubric([40, 40, 20])).success).toBe(true);
  });

  it.each([
    [[40, 40], "sum to 80"],
    [[50, 40, 20], "sum to 110"],
  ])("rejects weights %j", (weights, message) => {
    const result = rubricSchema.safeParse(makeRubric(weights));
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(message);
  });

  it("rejects zero/fractional weights, duplicate keys and unreviewed publication", () => {
    expect(rubricSchema.safeParse(makeRubric([0, 100])).success).toBe(false);
    expect(rubricSchema.safeParse(makeRubric([50.5, 49.5])).success).toBe(
      false,
    );
    const dup = makeRubric([50, 50]);
    dup.criteria[1].key = "k1";
    expect(rubricSchema.safeParse(dup).success).toBe(false);
    expect(
      rubricSchema.safeParse(makeRubric([100], { status: "published" }))
        .success,
    ).toBe(false);
  });

  it("validates every rubric in the content", () => {
    // 3 robot-command rubrics + one per curriculum lesson (D-015).
    expect(allRubrics()).toHaveLength(3 + CURRICULUM_RUBRICS.length);
  });
});

describe("scoreRatings", () => {
  const rubric = rubricSchema.parse(makeRubric([40, 40, 20]));

  it("scores boundary ratings", () => {
    expect(
      assessed(scoreRatings(rubric, rate(rubric, ["tepat", "tepat", "tepat"])))
        .total,
    ).toBe(100);
    expect(
      assessed(
        scoreRatings(
          rubric,
          rate(rubric, ["belum_terlihat", "belum_terlihat", "belum_terlihat"]),
        ),
      ).total,
    ).toBe(0);
  });

  it("records the per-criterion breakdown, rubric version and scoring version", () => {
    const score = assessed(
      scoreRatings(
        rubric,
        rate(rubric, ["tepat", "sebagian", "belum_terlihat"]),
      ),
    );
    expect(score).toEqual({
      kind: "learning_understanding",
      scoringVersion: SCORING_VERSION,
      rubricId: "uji",
      rubricVersion: 1,
      total: 60,
      displayTotal: 60,
      possible: 100,
      criteria: [
        { criterionKey: "k1", level: "tepat", earned: 40, possible: 40 },
        { criterionKey: "k2", level: "sebagian", earned: 20, possible: 40 },
        {
          criterionKey: "k3",
          level: "belum_terlihat",
          earned: 0,
          possible: 20,
        },
      ],
    });
  });

  it("keeps half points exact and rounds the display total half up", () => {
    const odd = rubricSchema.parse(makeRubric([25, 25, 25, 25]));
    const one = assessed(
      scoreRatings(
        odd,
        rate(odd, [
          "sebagian",
          "belum_terlihat",
          "belum_terlihat",
          "belum_terlihat",
        ]),
      ),
    );
    expect(one.total).toBe(12.5);
    expect(one.displayTotal).toBe(13);
    const two = assessed(
      scoreRatings(
        odd,
        rate(odd, ["sebagian", "sebagian", "belum_terlihat", "belum_terlihat"]),
      ),
    );
    expect(two.total).toBe(25);
    expect(two.displayTotal).toBe(25);
    const three = assessed(
      scoreRatings(
        odd,
        rate(odd, ["sebagian", "sebagian", "sebagian", "belum_terlihat"]),
      ),
    );
    expect(three.total).toBe(37.5);
    expect(three.displayTotal).toBe(38);
  });

  it("is reproducible and independent of rating order", () => {
    const ratings = rate(rubric, ["sebagian", "tepat", "sebagian"]);
    const first = scoreRatings(rubric, ratings);
    expect(scoreRatings(rubric, ratings)).toEqual(first);
    expect(scoreRatings(rubric, [...ratings].reverse())).toEqual(first);
  });

  it("returns invalid_assessment, never a score, for missing criteria", () => {
    const outcome = scoreRatings(
      rubric,
      rate(rubric, ["tepat", "tepat", "tepat"]).slice(0, 2),
    );
    expect(outcome).toEqual({
      status: "invalid_assessment",
      problems: ["criterion k3 was not rated"],
    });
    expect("score" in outcome).toBe(false);
  });

  it("rejects unknown criteria, duplicates and invalid levels", () => {
    const base = rate(rubric, ["tepat", "tepat", "tepat"]);
    expect(
      validateRatings(rubric, [
        ...base,
        { criterionKey: "bonus", level: "tepat", evidence: "x" },
      ]),
    ).toEqual(["unknown criterion bonus"]);
    expect(validateRatings(rubric, [...base, base[0]])).toEqual([
      "criterion k1 rated more than once",
    ]);
    const bad = [{ ...base[0], level: "sempurna" as Level }, base[1], base[2]];
    expect(validateRatings(rubric, bad)).toEqual([
      "criterion k1 has invalid level",
    ]);
  });

  it("never gives credit without evidence", () => {
    const ratings = rate(rubric, ["tepat", "sebagian", "belum_terlihat"]);
    ratings[0].evidence = null;
    ratings[1].evidence = "   ";
    expect(scoreRatings(rubric, ratings)).toEqual({
      status: "invalid_assessment",
      problems: [
        "criterion k1 is rated tepat without evidence",
        "criterion k2 is rated sebagian without evidence",
      ],
    });
  });
});

describe("assessment outcomes", () => {
  it("only the assessed status carries a score", () => {
    const outcomes: AssessmentOutcome[] = [
      { status: "needs_clarification", targetCriterion: "k1" },
      { status: "invalid_assessment", problems: ["x"] },
      { status: "provider_error", code: "PROVIDER_TIMEOUT" },
    ];
    for (const outcome of outcomes) expect("score" in outcome).toBe(false);
  });
});

describe("proposed fixture labels", () => {
  // The expected scores in docs/implementation/LESSON_REVIEW.md.
  const expectedTotals: Record<string, number> = {
    "urutan-01-concise": 80,
    "urutan-02-detailed": 100,
    "urutan-03-partial": 40,
    "urutan-04-misconception": 0,
    "urutan-07-injection": 40,
    "perulangan-01-concise": 100,
    "perulangan-02-detailed": 100,
    "perulangan-03-partial": 35,
    "perulangan-04-misconception": 0,
    "perulangan-07-injection": 20,
    "percabangan-01-concise": 100,
    "percabangan-02-detailed": 100,
    "percabangan-03-partial": 60,
    "percabangan-04-misconception": 0,
    "percabangan-07-injection": 60,
  };

  it.each(Object.entries(expectedTotals))("%s scores %i", (id, total) => {
    const fixture = ANSWER_FIXTURES.find((f) => f.id === id)!;
    if (fixture.expected.status !== "assessed") throw new Error("not assessed");
    const rubric = getRubric(fixture.lessonId, 1)!;
    const ratings = Object.entries(fixture.expected.ratings).map(
      ([criterionKey, lvl]) => ({
        criterionKey,
        level: lvl,
        evidence: lvl === "belum_terlihat" ? null : fixture.answer,
      }),
    );
    expect(assessed(scoreRatings(rubric, ratings)).total).toBe(total);
  });
});
