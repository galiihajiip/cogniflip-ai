import "server-only";
import {
  LEVEL_HALVES,
  LEVELS,
  type Level,
  type Rubric,
} from "@/server/assessment/rubric-schema";

/**
 * Deterministic scoring (ADR-002). The total is computed only from validated
 * criterion ratings and the rubric; nothing else can produce a number.
 *
 * Rule `scoring-v1`:
 *   earned(criterion) = weight × {belum_terlihat: 0, sebagian: ½, tepat: 1}
 *   total             = Σ earned, exact to 0.5
 *   displayTotal      = total rounded half up to a whole number
 */
export const SCORING_VERSION = "scoring-v1";

export interface CriterionRating {
  criterionKey: string;
  level: Level;
  /** Excerpt from the learner's answer supporting the rating; null if none. */
  evidence: string | null;
}

export interface CriterionScore {
  criterionKey: string;
  level: Level;
  earned: number;
  possible: number;
}

/** Learning-understanding score. Code-quality ratings use a different kind. */
export interface LearningScore {
  kind: "learning_understanding";
  scoringVersion: typeof SCORING_VERSION;
  rubricId: string;
  rubricVersion: number;
  total: number;
  displayTotal: number;
  possible: number;
  criteria: CriterionScore[];
}

/**
 * The only outcome that carries a score is `assessed`. The other three have
 * no score field at all, so they cannot be shown or stored as a number.
 */
export type AssessmentOutcome =
  | { status: "assessed"; score: LearningScore }
  | { status: "needs_clarification"; targetCriterion: string }
  | { status: "invalid_assessment"; problems: string[] }
  | {
      status: "provider_error";
      code:
        "PROVIDER_UNAVAILABLE" | "PROVIDER_TIMEOUT" | "INVALID_MODEL_OUTPUT";
    };

/** Checks ratings against the rubric; returns problems (empty when valid). */
export function validateRatings(
  rubric: Rubric,
  ratings: readonly CriterionRating[],
): string[] {
  const problems: string[] = [];
  const known = new Set(rubric.criteria.map((c) => c.key));
  const seen = new Set<string>();

  for (const rating of ratings) {
    if (!known.has(rating.criterionKey)) {
      problems.push(`unknown criterion ${rating.criterionKey}`);
      continue;
    }
    if (seen.has(rating.criterionKey))
      problems.push(`criterion ${rating.criterionKey} rated more than once`);
    seen.add(rating.criterionKey);
    if (!(LEVELS as readonly string[]).includes(rating.level))
      problems.push(`criterion ${rating.criterionKey} has invalid level`);
    // Credit requires evidence: missing evidence is never full or partial credit.
    else if (
      rating.level !== "belum_terlihat" &&
      (rating.evidence === null || rating.evidence.trim() === "")
    )
      problems.push(
        `criterion ${rating.criterionKey} is rated ${rating.level} without evidence`,
      );
  }
  for (const key of known)
    if (!seen.has(key)) problems.push(`criterion ${key} was not rated`);
  return problems;
}

function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/** Scores a complete, valid set of ratings; otherwise `invalid_assessment`. */
export function scoreRatings(
  rubric: Rubric,
  ratings: readonly CriterionRating[],
): AssessmentOutcome {
  const problems = validateRatings(rubric, ratings);
  if (problems.length > 0) return { status: "invalid_assessment", problems };

  const byKey = new Map(ratings.map((r) => [r.criterionKey, r]));
  // Integer arithmetic in half-points, in rubric order (order-independent).
  let totalHalves = 0;
  const criteria = rubric.criteria.map((criterion) => {
    const level = byKey.get(criterion.key)!.level;
    const earnedHalves = criterion.weight * LEVEL_HALVES[level];
    totalHalves += earnedHalves;
    return {
      criterionKey: criterion.key,
      level,
      earned: earnedHalves / 2,
      possible: criterion.weight,
    };
  });
  const total = totalHalves / 2;

  return {
    status: "assessed",
    score: {
      kind: "learning_understanding",
      scoringVersion: SCORING_VERSION,
      rubricId: rubric.id,
      rubricVersion: rubric.version,
      total,
      displayTotal: roundHalfUp(total),
      possible: rubric.totalPoints,
      criteria,
    },
  };
}
