// Benchmark runner: `npm run benchmark` (live, needs the AI group in .env.local)
// or `BENCHMARK_MODE=mock npm run benchmark` (wiring check with the labelled mock).
// Writes a JSON report to benchmark/reports/. Never reports PASS without a run.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { it } from "vitest";
import { createDevMockProvider } from "@/server/ai/dev-mock";
import { evaluateExplanation } from "@/server/ai/gateway";
import { GeminiProvider } from "@/server/ai/gemini-provider";
import { FixedWindowLimiter } from "@/server/ai/rate-limit";
import {
  notRun,
  runBenchmark,
  type BenchmarkReport,
  type Evaluator,
  type Prediction,
} from "@/server/assessment/benchmark/runner";
import { isIntegrationConfigured, parseServerEnv } from "@/server/config/env";

const PRICES: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  // Paid-tier prices from https://ai.google.dev/gemini-api/docs/pricing (2026-10-13).
  "gemini-3.8-flash": { inputPerMillion: 0.75, outputPerMillion: 3.75 },
  "gemini-3.5-flash-lite": { inputPerMillion: 0.3, outputPerMillion: 2.5 },
};

it("runs the assessment benchmark", { timeout: 15 * 60_000 }, async () => {
  const env = parseServerEnv(process.env);
  const mock = process.env.BENCHMARK_MODE === "mock";
  let report: BenchmarkReport;

  if (!mock && !isIntegrationConfigured(env, "ai")) {
    report = notRun(
      "AI provider not configured (LLM_PROVIDER, LLM_API_KEY, LLM_MODEL)",
    );
  } else {
    const provider = mock
      ? createDevMockProvider()
      : new GeminiProvider(env.LLM_API_KEY!, env.LLM_MODEL!);
    const deps = {
      provider,
      limiter: new FixedWindowLimiter(1_000, 60_000),
      timeoutMs: env.AI_TIMEOUT_SECONDS * 1000,
    };
    const evaluate: Evaluator = async ({ lesson, rubric, answer }) => {
      const started = performance.now();
      const result = await evaluateExplanation(deps, {
        lesson,
        rubric,
        answer,
        rateLimitKey: "benchmark",
      });
      const latencyMs = Math.round(performance.now() - started);
      let prediction: Prediction;
      if (!result.ok)
        prediction =
          result.code === "INVALID_MODEL_OUTPUT"
            ? { status: "invalid_output" }
            : { status: "provider_error", error: result.code };
      else if (result.assessment.outcome.status === "needs_clarification")
        prediction = {
          status: "needs_clarification",
          clarifyCriterion: result.assessment.outcome.targetCriterion,
        };
      else {
        const judgments = result.assessment.judgments!.criteria;
        prediction = {
          status: "assessed",
          ratings: Object.fromEntries(
            judgments.map((j) => [j.criterionKey, j.rating]),
          ),
          evidence: Object.fromEntries(
            judgments.map((j) => [
              j.criterionKey,
              j.evidence.kind === "quote" ? j.evidence.text : null,
            ]),
          ),
          misconceptionIds: result.assessment.misconceptionIds,
        };
      }
      return { prediction, latencyMs };
    };
    report = await runBenchmark({
      evaluate,
      model: mock ? "mock:deterministic" : env.LLM_MODEL!,
      mode: mock ? "mock" : "live",
      prices: mock ? undefined : PRICES[env.LLM_MODEL!],
    });
  }

  const dir = join(process.cwd(), "benchmark", "reports");
  mkdirSync(dir, { recursive: true });
  const name =
    report.status === "NOT_RUN"
      ? "not-run.json"
      : `${report.ranAt.replace(/[:.]/g, "-")}-${report.mode}-${report.model.replace(/[^a-z0-9.-]/gi, "_")}.json`;
  writeFileSync(join(dir, name), JSON.stringify(report, null, 2) + "\n");
  console.log(
    `benchmark ${report.status}` +
      (report.status === "COMPLETED"
        ? ` (${report.mode}, ${report.model}): ${JSON.stringify(report.metrics)}`
        : `: ${report.reason}`) +
      `\nreport: benchmark/reports/${name}`,
  );
});
