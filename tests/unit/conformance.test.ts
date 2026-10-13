import { describe, expect, it } from "vitest";
import {
  runConformance,
  type ConformancePrograms,
} from "@/server/code/conformance";
import type {
  ExecutionAdapter,
  ExecutionResult,
} from "@/server/code/execution";

/**
 * SIMULATORS ONLY: these test doubles return canned results chosen by the
 * program text and never execute anything. They exist to show that the
 * conformance suite passes a well-behaved adapter and fails a broken one.
 */
const programs: ConformancePrograms = {
  hello: { code: "HELLO", stdout: "halo" },
  syntaxError: "SYNTAX",
  runtimeError: "RUNTIME",
  infiniteLoop: "LOOP",
  outputFlood: "FLOOD",
  readEnv: "ENV",
};

const base = (o: Partial<ExecutionResult>): ExecutionResult => ({
  state: "completed",
  phase: "run",
  exitCode: 0,
  stdout: "",
  stderr: "",
  stdoutTruncated: false,
  stderrTruncated: false,
  durationMs: 1,
  tool: { name: "sim", version: "1.0.0" },
  ...o,
});

function simulator(broken: boolean): ExecutionAdapter {
  return {
    id: broken ? "sim-broken" : "sim-good",
    language: "python",
    tool: { name: "sim", version: "1.0.0" },
    phases: ["run"],
    run: (request, signal) => {
      const code = request.files[0].content;
      if (code === "LOOP")
        return new Promise((resolve) => {
          const t = setTimeout(
            () =>
              resolve(
                base({
                  state: broken ? "completed" : "timed_out",
                  exitCode: null,
                }),
              ),
            broken ? 10 : 200,
          );
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            resolve(
              base({
                state: broken ? "completed" : "cancelled",
                exitCode: null,
              }),
            );
          });
        });
      const r: Record<string, ExecutionResult> = {
        HELLO: base({ stdout: "halo\n" }),
        SYNTAX: base({
          state: broken ? "completed" : "failed",
          exitCode: broken ? 0 : 1,
          phase: "compile",
        }),
        RUNTIME: base({ state: "failed", exitCode: 1 }),
        FLOOD: base({
          stdout: "x".repeat(broken ? 100_000 : 4_096),
          stdoutTruncated: !broken,
        }),
        ENV: base({ stdout: broken ? String(process.env.CANARY_SECRET) : "" }),
      };
      return Promise.resolve(r[code]);
    },
  };
}

describe("adapter conformance suite (verified with simulators, no execution)", () => {
  it("passes a well-behaved adapter", async () => {
    const report = await runConformance(simulator(false), programs);
    expect(report.checks.filter((c) => !c.pass)).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.checks).toHaveLength(8);
  });

  it("fails an adapter that hides errors, ignores limits, leaks env or ignores cancel", async () => {
    const report = await runConformance(simulator(true), programs);
    expect(report.passed).toBe(false);
    expect(report.checks.filter((c) => !c.pass).map((c) => c.check)).toEqual([
      "reports a syntax error as a failure, not success",
      "stops an infinite loop as timed_out within the limit",
      "caps output",
      "honours cancellation",
      "does not expose host environment",
    ]);
  });

  it("fails an adapter without a declared tool version", async () => {
    const adapter = { ...simulator(false), tool: { name: "sim", version: "" } };
    const report = await runConformance(adapter, programs);
    expect(report.checks[0]).toMatchObject({
      check: "declares capabilities and tool version",
      pass: false,
    });
  });
});
