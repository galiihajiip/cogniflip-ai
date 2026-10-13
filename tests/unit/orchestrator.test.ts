import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StructuredOutcome } from "@/server/ai/gateway";
import { Orchestrator, type Agent } from "@/server/ai/orchestrator";

/** Deterministic test agents: no model calls. */
function agent<O>(
  name: string,
  outcome: StructuredOutcome<O>,
  delayMs = 0,
  maxCalls = 2,
): Agent<string, O> {
  return {
    name,
    responsibility: `test agent ${name}`,
    maxCalls,
    run: (_input, signal) =>
      new Promise((resolve) => {
        const t = setTimeout(() => resolve(outcome), delayMs);
        signal.addEventListener("abort", () => {
          clearTimeout(t);
          resolve({
            ok: false,
            code: "PROVIDER_TIMEOUT",
            retryable: true,
            attempts: 1,
          });
        });
      }),
  };
}
const ok = <O>(value: O, attempts = 1): StructuredOutcome<O> => ({
  ok: true,
  value,
  mode: "mock",
  model: "mock:deterministic",
  attempts,
});

let logs: string[];
beforeEach(() => {
  logs = [];
  for (const level of ["info", "warn", "error"] as const)
    vi.spyOn(console, level).mockImplementation(
      (l: string) => void logs.push(l),
    );
});
afterEach(() => vi.restoreAllMocks());

describe("Orchestrator", () => {
  it("runs steps in order and records a content-free trace", async () => {
    const o = new Orchestrator("test", { maxCalls: 4, maxWallMs: 1_000 });
    const a = await o.step(
      agent("evaluator", ok({ secretAnswerText: "jawaban murid rahasia" })),
      "jawaban murid rahasia",
    );
    const b = await o.step(agent("feedback", ok("hint")), "x");
    expect(a.ok && b.ok).toBe(true);
    expect(o.trace.map((t) => [t.agent, t.status, t.calls, t.mode])).toEqual([
      ["evaluator", "ok", 1, "mock"],
      ["feedback", "ok", 1, "mock"],
    ]);
    expect(logs.join("\n")).not.toContain("rahasia");
  });

  it("stops at a failing agent and never fabricates its result", async () => {
    const o = new Orchestrator("test", { maxCalls: 10, maxWallMs: 1_000 });
    const failed = await o.step(
      agent("evaluator", {
        ok: false,
        code: "INVALID_MODEL_OUTPUT",
        retryable: true,
        attempts: 2,
      } as StructuredOutcome<string>),
      "x",
    );
    expect(failed).toMatchObject({ ok: false, code: "INVALID_MODEL_OUTPUT" });
    expect("value" in failed).toBe(false);
  });

  it("refuses a step that would exceed the call budget", async () => {
    const o = new Orchestrator("test", { maxCalls: 3, maxWallMs: 1_000 });
    await o.step(agent("a", ok(1, 2)), "x");
    const r = await o.step(agent("b", ok(2), 0, 2), "x");
    expect(r).toMatchObject({ ok: false, code: "BUDGET_EXHAUSTED" });
    expect(o.trace.at(-1)).toMatchObject({
      agent: "b",
      status: "budget_exhausted",
      calls: 0,
    });
  });

  it("enforces the wall-clock budget on a slow agent", async () => {
    const o = new Orchestrator("test", { maxCalls: 10, maxWallMs: 30 });
    const r = await o.step(agent("slow", ok(1), 500), "x");
    expect(r).toMatchObject({ ok: false, code: "PROVIDER_TIMEOUT" });
  });

  it("propagates cancellation", async () => {
    const controller = new AbortController();
    const o = new Orchestrator(
      "test",
      { maxCalls: 10, maxWallMs: 5_000 },
      controller.signal,
    );
    const pending = o.step(agent("slow", ok(1), 500), "x");
    controller.abort();
    expect(await pending).toMatchObject({ ok: false, code: "CANCELLED" });
    expect(await o.step(agent("next", ok(1)), "x")).toMatchObject({
      ok: false,
      code: "CANCELLED",
    });
  });
});
