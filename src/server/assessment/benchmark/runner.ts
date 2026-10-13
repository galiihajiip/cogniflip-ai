import "server-only";
import { getRubric } from "@/server/assessment/content";
import {
  BENCHMARK_ITEMS,
  BENCHMARK_VERSION,
  type BenchmarkItem,
} from "@/server/assessment/benchmark/dataset";
import {
  LEVEL_HALVES,
  type Level,
  type Rubric,
} from "@/server/assessment/rubric-schema";
import { LESSONS } from "@/server/learning/content/lessons";
import type { LessonVersion } from "@/server/learning/lesson-schema";
import { TEXT_LIMITS, boundedText } from "@/shared/schemas/primitives";

/** What an evaluator (live model, mock, or oracle) predicted for one item. */
export type Prediction =
  | {
      status: "assessed";
      ratings: Record<string, Level>;
      evidence: Record<string, string | null>;
      misconceptionIds: string[];
    }
  | { status: "needs_clarification"; clarifyCriterion?: string }
  | { status: "rejected_before_model" }
  | { status: "invalid_output" }
  | { status: "provider_error"; error: string };

export interface EvaluationResult {
  prediction: Prediction;
  latencyMs: number;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export type Evaluator = (input: {
  item: BenchmarkItem;
  lesson: LessonVersion;
  rubric: Rubric;
  answer: string;
}) => Promise<EvaluationResult>;

export interface PriceTable {
  inputPerMillion: number;
  outputPerMillion: number;
}

export interface ItemResult {
  id: string;
  kind: BenchmarkItem["kind"];
  expectedStatus: string;
  predictedStatus: Prediction["status"];
  calledModel: boolean;
  latencyMs: number | null;
  mismatchedCriteria: string[];
}

export interface BenchmarkMetrics {
  sampleSize: number;
  modelCalls: number;
  statusAgreement: number;
  criterionAgreement: number | null;
  falsePassRate: number | null;
  falseFailRate: number | null;
  injectionOverScoreRate: number | null;
  evidenceValidity: number | null;
  schemaValidity: number | null;
  providerErrors: number;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  approxCostUsd: number | null;
  hintHelpfulness: "MANUAL_REVIEW_REQUIRED";
}

export type BenchmarkReport =
  | {
      status: "NOT_RUN";
      benchmarkVersion: string;
      reason: string;
    }
  | {
      status: "COMPLETED";
      benchmarkVersion: string;
      ranAt: string;
      model: string;
      mode: "live" | "mock" | "oracle";
      labelStatus: "proposed" | "reviewed" | "mixed";
      caveat: string;
      metrics: BenchmarkMetrics;
      items: ItemResult[];
    };

const LEVEL_RANK = LEVEL_HALVES;
const answerSchema = boundedText({ max: TEXT_LIMITS.explanation });
const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  ];
}

function totalOf(rubric: Rubric, ratings: Record<string, Level>): number {
  return rubric.criteria.reduce(
    (sum, c) =>
      sum + (c.weight * LEVEL_RANK[ratings[c.key] ?? "belum_terlihat"]) / 2,
    0,
  );
}

export function notRun(reason: string): BenchmarkReport {
  return { status: "NOT_RUN", benchmarkVersion: BENCHMARK_VERSION, reason };
}

export async function runBenchmark(options: {
  evaluate: Evaluator;
  model: string;
  mode: "live" | "mock" | "oracle";
  prices?: PriceTable;
  items?: BenchmarkItem[];
  now?: () => Date;
}): Promise<BenchmarkReport> {
  const items = options.items ?? BENCHMARK_ITEMS;
  const results: Array<{
    item: BenchmarkItem;
    rubric: Rubric;
    result: EvaluationResult;
    called: boolean;
  }> = [];

  for (const item of items) {
    const lesson = LESSONS.find((l) => l.id === item.lessonId);
    const rubric =
      lesson && getRubric(lesson.rubric.rubricId, lesson.rubric.version);
    if (!lesson || !rubric)
      throw new Error(`benchmark item ${item.id} has no lesson/rubric`);

    // Same input validation the app uses: invalid input never reaches a model.
    const parsed = answerSchema.safeParse(item.answer);
    if (!parsed.success) {
      results.push({
        item,
        rubric,
        called: false,
        result: {
          prediction: { status: "rejected_before_model" },
          latencyMs: 0,
        },
      });
      continue;
    }
    const result = await options.evaluate({
      item,
      lesson,
      rubric,
      answer: parsed.data,
    });
    results.push({ item, rubric, result, called: true });
  }

  let criteriaCompared = 0;
  let criteriaMatched = 0;
  let credited = 0;
  let creditedWithValidEvidence = 0;
  let misconceptionItems = 0;
  let falsePasses = 0;
  let correctItems = 0;
  let falseFails = 0;
  let injectionItems = 0;
  let injectionOverScores = 0;
  let invalidOutputs = 0;
  let providerErrors = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let tokensKnown = true;
  const latencies: number[] = [];

  const itemResults: ItemResult[] = results.map(
    ({ item, rubric, result, called }) => {
      const { prediction } = result;
      const expected = item.expected;
      const mismatched: string[] = [];
      if (called) {
        latencies.push(result.latencyMs);
        if (
          result.usage?.inputTokens === undefined ||
          result.usage?.outputTokens === undefined
        )
          tokensKnown = false;
        inputTokens += result.usage?.inputTokens ?? 0;
        outputTokens += result.usage?.outputTokens ?? 0;
        if (prediction.status === "invalid_output") invalidOutputs++;
        if (prediction.status === "provider_error") providerErrors++;
      }

      if (expected.status === "assessed" && prediction.status === "assessed") {
        for (const criterion of rubric.criteria) {
          criteriaCompared++;
          const want = expected.ratings[criterion.key];
          const got = prediction.ratings[criterion.key];
          if (want === got) criteriaMatched++;
          else mismatched.push(criterion.key);
          if (got && got !== "belum_terlihat") {
            credited++;
            const evidence = prediction.evidence[criterion.key];
            if (
              evidence &&
              normalize(item.answer).includes(normalize(evidence))
            )
              creditedWithValidEvidence++;
          }
        }
      }

      if (item.kind === "misconception" && expected.status === "assessed") {
        misconceptionItems++;
        const over =
          prediction.status === "assessed" &&
          rubric.criteria.some(
            (c) =>
              LEVEL_RANK[prediction.ratings[c.key] ?? "belum_terlihat"] >
              LEVEL_RANK[expected.ratings[c.key]],
          );
        if (over) falsePasses++;
      }

      if (
        (item.kind === "correct_concise" ||
          item.kind === "correct_detailed" ||
          item.kind === "paraphrase") &&
        expected.status === "assessed"
      ) {
        correctItems++;
        const under =
          prediction.status !== "assessed" ||
          rubric.criteria.some(
            (c) =>
              LEVEL_RANK[prediction.ratings[c.key] ?? "belum_terlihat"] <
              LEVEL_RANK[expected.ratings[c.key]],
          );
        if (under) falseFails++;
      }

      if (item.kind === "prompt_injection" && expected.status === "assessed") {
        injectionItems++;
        if (
          prediction.status === "assessed" &&
          totalOf(rubric, prediction.ratings) >
            totalOf(rubric, expected.ratings)
        )
          injectionOverScores++;
      }

      return {
        id: item.id,
        kind: item.kind,
        expectedStatus: expected.status,
        predictedStatus: prediction.status,
        calledModel: called,
        latencyMs: called ? result.latencyMs : null,
        mismatchedCriteria: mismatched,
      };
    },
  );

  const modelCalls = results.filter((r) => r.called).length;
  const statusMatches = results.filter(
    (r) => r.result.prediction.status === r.item.expected.status,
  ).length;
  const labelStatuses = new Set(items.map((i) => i.labelStatus));

  return {
    status: "COMPLETED",
    benchmarkVersion: BENCHMARK_VERSION,
    ranAt: (options.now ?? (() => new Date()))().toISOString(),
    model: options.model,
    mode: options.mode,
    labelStatus:
      labelStatuses.size > 1
        ? "mixed"
        : ([...labelStatuses][0] as "proposed" | "reviewed"),
    caveat: `Small synthetic convenience sample (${items.length} items); results are indicative only and not statistically significant.`,
    metrics: {
      sampleSize: items.length,
      modelCalls,
      statusAgreement: statusMatches / items.length,
      criterionAgreement: ratio(criteriaMatched, criteriaCompared),
      falsePassRate: ratio(falsePasses, misconceptionItems),
      falseFailRate: ratio(falseFails, correctItems),
      injectionOverScoreRate: ratio(injectionOverScores, injectionItems),
      evidenceValidity: ratio(creditedWithValidEvidence, credited),
      schemaValidity: modelCalls === 0 ? null : 1 - invalidOutputs / modelCalls,
      providerErrors,
      latencyP50Ms: percentile(latencies, 50),
      latencyP95Ms: percentile(latencies, 95),
      approxCostUsd:
        options.prices && tokensKnown && modelCalls > 0
          ? (inputTokens * options.prices.inputPerMillion +
              outputTokens * options.prices.outputPerMillion) /
            1_000_000
          : null,
      hintHelpfulness: "MANUAL_REVIEW_REQUIRED",
    },
    items: itemResults,
  };
}
