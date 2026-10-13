import { describe, expect, it } from "vitest";
import {
  BENCHMARK_ITEMS,
  BENCHMARK_VERSION,
} from "@/server/assessment/benchmark/dataset";
import {
  notRun,
  runBenchmark,
  type Evaluator,
  type Prediction,
} from "@/server/assessment/benchmark/runner";

/** Returns exactly the expected label, with evidence quoted from the answer. */
const oracle: Evaluator = async ({ item, rubric, answer }) => {
  const e = item.expected;
  let prediction: Prediction;
  if (e.status === "assessed") {
    const evidence = Object.fromEntries(
      rubric.criteria.map((c) => [
        c.key,
        e.ratings[c.key] === "belum_terlihat" ? null : answer.slice(0, 20),
      ]),
    );
    prediction = {
      status: "assessed",
      ratings: e.ratings,
      evidence,
      misconceptionIds: e.misconceptionIds,
    };
  } else if (e.status === "needs_clarification") {
    prediction = {
      status: "needs_clarification",
      clarifyCriterion: e.clarifyCriterion,
    };
  } else {
    prediction = { status: "rejected_before_model" };
  }
  return {
    prediction,
    latencyMs: 10,
    usage: { inputTokens: 1000, outputTokens: 200 },
  };
};

/** Gives full marks to everything, with invented evidence. */
const pushover: Evaluator = async ({ rubric }) => ({
  prediction: {
    status: "assessed",
    ratings: Object.fromEntries(rubric.criteria.map((c) => [c.key, "tepat"])),
    evidence: Object.fromEntries(
      rubric.criteria.map((c) => [c.key, "kalimat yang tidak ada"]),
    ),
    misconceptionIds: [],
  },
  latencyMs: 20,
});

describe("benchmark dataset", () => {
  it("is versioned, has unique ids and covers every required kind", () => {
    expect(BENCHMARK_VERSION).toBe("bench-v1");
    const ids = BENCHMARK_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const kinds = new Set(BENCHMARK_ITEMS.map((i) => i.kind));
    for (const kind of [
      "correct_concise",
      "correct_detailed",
      "paraphrase",
      "partial",
      "misconception",
      "ambiguous",
      "off_topic",
      "empty",
      "too_long",
      "long_valid",
      "prompt_injection",
    ])
      expect(kinds.has(kind as never), kind).toBe(true);
    expect(BENCHMARK_ITEMS).toHaveLength(27);
  });
});

describe("runBenchmark", () => {
  it("reports NOT_RUN, never PASS, when no provider is available", () => {
    expect(notRun("LLM provider not configured")).toEqual({
      status: "NOT_RUN",
      benchmarkVersion: "bench-v1",
      reason: "LLM provider not configured",
    });
  });

  it("scores a perfect oracle as perfect and never sends invalid input to the model", async () => {
    const calls: string[] = [];
    const report = await runBenchmark({
      evaluate: async (input) => {
        calls.push(input.item.id);
        return oracle(input);
      },
      model: "oracle",
      mode: "oracle",
      prices: { inputPerMillion: 0.75, outputPerMillion: 3.75 },
      now: () => new Date("2026-10-13T00:00:00Z"),
    });
    if (report.status !== "COMPLETED") throw new Error("not completed");
    expect(calls).not.toContain("urutan-10-empty");
    expect(calls).not.toContain("urutan-11-too-long");
    expect(report.metrics).toMatchObject({
      sampleSize: 27,
      modelCalls: 25,
      statusAgreement: 1,
      criterionAgreement: 1,
      falsePassRate: 0,
      falseFailRate: 0,
      injectionOverScoreRate: 0,
      evidenceValidity: 1,
      schemaValidity: 1,
      providerErrors: 0,
      hintHelpfulness: "MANUAL_REVIEW_REQUIRED",
    });
    expect(report.metrics.approxCostUsd).toBeCloseTo(
      (25 * 1000 * 0.75 + 25 * 200 * 3.75) / 1e6,
      10,
    );
    expect(report.labelStatus).toBe("proposed");
    expect(report.caveat).toMatch(/not statistically significant/);
  });

  it("exposes an evaluator that gives everyone full marks", async () => {
    const report = await runBenchmark({
      evaluate: pushover,
      model: "pushover",
      mode: "mock",
    });
    if (report.status !== "COMPLETED") throw new Error("not completed");
    expect(report.metrics.falsePassRate).toBe(1);
    expect(report.metrics.injectionOverScoreRate).toBe(1);
    expect(report.metrics.falseFailRate).toBe(0);
    expect(report.metrics.evidenceValidity).toBe(0);
    expect(report.metrics.criterionAgreement).toBeLessThan(1);
    expect(report.metrics.approxCostUsd).toBeNull(); // no prices, no usage
  });

  it("counts invalid output and provider errors without treating them as scores", async () => {
    let n = 0;
    const flaky: Evaluator = async () => ({
      prediction:
        n++ % 2 === 0
          ? { status: "invalid_output" }
          : { status: "provider_error", error: "timeout" },
      latencyMs: 5,
    });
    const report = await runBenchmark({
      evaluate: flaky,
      model: "flaky",
      mode: "mock",
    });
    if (report.status !== "COMPLETED") throw new Error("not completed");
    expect(report.metrics.schemaValidity).toBe(1 - 13 / 25);
    expect(report.metrics.providerErrors).toBe(12);
    expect(report.metrics.criterionAgreement).toBeNull();
    expect(report.metrics.falseFailRate).toBe(1);
  });
});
