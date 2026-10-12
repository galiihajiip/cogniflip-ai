import "server-only";
import { z } from "zod";
import { levelSchema, type Rubric } from "@/server/assessment/rubric-schema";
import {
  scoreRatings,
  type AssessmentOutcome,
  type CriterionRating,
} from "@/server/assessment/scoring";
import type { LessonVersion } from "@/server/learning/lesson-schema";

/**
 * Contract for the evaluator model's output (BLOCK 16).
 *
 * The model may only describe criterion-level judgments and one hint or
 * question. It cannot send a score, XP, role, weights, tool calls or any
 * other field: every object is strict, so unknown fields are rejected.
 * Learner text is data; nothing in it can change this contract.
 */

export const OUTPUT_LIMITS = {
  rawBytes: 16 * 1024,
  quote: 300,
  rationale: 400,
  hint: 300,
  question: 200,
  reason: 300,
  misconceptions: 8,
  criteria: 8,
} as const;

const text = (max: number) => z.string().trim().min(1).max(max);
const key = z.string().min(1).max(64);

const evidenceSchema = z.discriminatedUnion("kind", [
  /** Verbatim excerpt from the learner's answer (optionally with offsets). */
  z.strictObject({
    kind: z.literal("quote"),
    text: text(OUTPUT_LIMITS.quote),
    start: z.number().int().min(0).optional(),
    end: z.number().int().min(1).optional(),
  }),
  /** Not a quote: the model's reading of the answer. Never earns credit. */
  z.strictObject({
    kind: z.literal("inference"),
    text: text(OUTPUT_LIMITS.quote),
  }),
  z.strictObject({ kind: z.literal("none") }),
]);

export const criterionJudgmentSchema = z.strictObject({
  criterionKey: key,
  rating: levelSchema,
  evidence: evidenceSchema,
  rationale: text(OUTPUT_LIMITS.rationale),
  uncertainty: z.enum(["low", "medium", "high"]),
});

export const assessmentOutputSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("assessed"),
    criteria: z
      .array(criterionJudgmentSchema)
      .min(1)
      .max(OUTPUT_LIMITS.criteria),
    misconceptionIds: z.array(key).max(OUTPUT_LIMITS.misconceptions),
    hint: text(OUTPUT_LIMITS.hint),
  }),
  z.strictObject({
    status: z.literal("needs_clarification"),
    targetCriterion: key,
    reason: text(OUTPUT_LIMITS.reason),
    question: text(OUTPUT_LIMITS.question),
  }),
]);
export type AssessmentOutput = z.infer<typeof assessmentOutputSchema>;

/** JSON Schema sent to the provider for constrained output. */
export const assessmentOutputJsonSchema = z.toJSONSchema(
  assessmentOutputSchema,
) as Record<string, unknown>;

export type ValidatedAssessment =
  | {
      ok: true;
      outcome: Extract<
        AssessmentOutcome,
        { status: "assessed" | "needs_clarification" }
      >;
      /** Shown to the learner (assessed): one hint; (clarification): one question. */
      message: string;
      misconceptionIds: string[];
      judgments?: AssessmentOutput & { status: "assessed" };
    }
  | { ok: false; problems: string[] };

const normalize = (s: string) =>
  s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

const words = (s: string) =>
  normalize(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** True when `candidate` repeats a run of `n` consecutive words of `source`. */
export function sharesRun(candidate: string, source: string, n = 8): boolean {
  const src = words(source);
  const cand = ` ${words(candidate).join(" ")} `;
  for (let i = 0; i + n <= src.length; i++)
    if (cand.includes(` ${src.slice(i, i + n).join(" ")} `)) return true;
  return false;
}

/** Parses raw provider text as JSON with a size limit; never throws. */
export function parseModelJson(
  raw: string,
): { ok: true; value: unknown } | { ok: false; problem: string } {
  if (new TextEncoder().encode(raw).byteLength > OUTPUT_LIMITS.rawBytes)
    return { ok: false, problem: "output exceeds size limit" };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, problem: "output is not valid JSON" };
  }
}

/**
 * Structural + semantic validation, then deterministic scoring. A model can
 * never produce a score directly; it only becomes one through scoreRatings().
 */
export function validateAssessmentOutput(
  raw: string,
  context: { rubric: Rubric; lesson: LessonVersion; answer: string },
): ValidatedAssessment {
  const parsedJson = parseModelJson(raw);
  if (!parsedJson.ok) return { ok: false, problems: [parsedJson.problem] };
  const parsed = assessmentOutputSchema.safeParse(parsedJson.value);
  if (!parsed.success)
    return {
      ok: false,
      problems: parsed.error.issues.map(
        (i) => `schema: ${i.path.join(".") || "(root)"} ${i.code}`,
      ),
    };

  const output = parsed.data;
  const { rubric, lesson, answer } = context;
  const problems: string[] = [];
  const criterionKeys = new Set(rubric.criteria.map((c) => c.key));
  const reference = lesson.referenceExplanation;

  if (output.status === "needs_clarification") {
    if (!criterionKeys.has(output.targetCriterion))
      problems.push(`unknown target criterion ${output.targetCriterion}`);
    if ((output.question.match(/\?/g) ?? []).length !== 1)
      problems.push("clarification must be exactly one question");
    if (sharesRun(output.question, reference))
      problems.push("clarification reveals the reference answer");
    if (problems.length > 0) return { ok: false, problems };
    return {
      ok: true,
      outcome: {
        status: "needs_clarification",
        targetCriterion: output.targetCriterion,
      },
      message: output.question,
      misconceptionIds: [],
    };
  }

  const answerNorm = normalize(answer);
  const seen = new Set<string>();
  const ratings: CriterionRating[] = [];
  for (const judgment of output.criteria) {
    const k = judgment.criterionKey;
    if (!criterionKeys.has(k)) {
      problems.push(`unknown criterion ${k}`);
      continue;
    }
    if (seen.has(k)) problems.push(`criterion ${k} judged more than once`);
    seen.add(k);

    let evidence: string | null = null;
    const ev = judgment.evidence;
    if (ev.kind === "quote") {
      if (!answerNorm.includes(normalize(ev.text)))
        problems.push(`criterion ${k}: quoted evidence is not in the answer`);
      if (ev.start !== undefined || ev.end !== undefined) {
        const { start, end } = ev;
        if (
          start === undefined ||
          end === undefined ||
          start >= end ||
          end > answer.length
        )
          problems.push(`criterion ${k}: evidence span is out of bounds`);
        else if (normalize(answer.slice(start, end)) !== normalize(ev.text))
          problems.push(
            `criterion ${k}: evidence span does not match the quote`,
          );
      }
      evidence = ev.text;
    }
    if (judgment.rating !== "belum_terlihat" && ev.kind !== "quote")
      problems.push(`criterion ${k}: credit requires a quote from the answer`);
    ratings.push({ criterionKey: k, level: judgment.rating, evidence });
  }
  for (const k of criterionKeys)
    if (!seen.has(k)) problems.push(`criterion ${k} was omitted`);

  const knownMisconceptions = new Set(lesson.misconceptions.map((m) => m.id));
  for (const id of output.misconceptionIds)
    if (!knownMisconceptions.has(id))
      problems.push(`unknown misconception ${id}`);
  if (sharesRun(output.hint, reference))
    problems.push("hint reveals the reference answer");

  if (problems.length > 0) return { ok: false, problems };

  const outcome = scoreRatings(rubric, ratings);
  if (outcome.status !== "assessed")
    return {
      ok: false,
      problems:
        outcome.status === "invalid_assessment"
          ? outcome.problems
          : [outcome.status],
    };
  return {
    ok: true,
    outcome,
    message: output.hint,
    misconceptionIds: output.misconceptionIds,
    judgments: output,
  };
}
