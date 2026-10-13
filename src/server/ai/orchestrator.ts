import "server-only";
import type { GatewayErrorCode, StructuredOutcome } from "@/server/ai/gateway";
import { logServerEvent } from "@/server/log/logger";

/**
 * Bounded multi-agent orchestrator (BLOCK 50, ADR-005, docs/08).
 *
 * An agent has one responsibility, typed input/output, and returns a
 * StructuredOutcome (already schema- and semantically validated by the
 * gateway). Agents receive only their input: no database, no authorization,
 * no XP, no rubric weights, no code execution. The orchestrator enforces a
 * per-run call budget and wall-clock budget, supports cancellation, stops at
 * the first failure (returning the partial trace), and logs a content-free
 * trace. It never fabricates a result for a failed step.
 */

export interface Agent<I, O> {
  name: string;
  responsibility: string;
  /** Upper bound on provider calls one invocation may use (gateway attempts). */
  maxCalls: number;
  run(input: I, signal: AbortSignal): Promise<StructuredOutcome<O>>;
}

export interface TraceEntry {
  agent: string;
  status: "ok" | GatewayErrorCode | "budget_exhausted" | "cancelled";
  durationMs: number;
  calls: number;
  model?: string;
  mode?: "live" | "mock";
}

export interface Budget {
  maxCalls: number;
  maxWallMs: number;
}

export type RunResult<O> =
  | { ok: true; value: O; trace: TraceEntry[] }
  | {
      ok: false;
      code: GatewayErrorCode | "BUDGET_EXHAUSTED" | "CANCELLED";
      retryable: boolean;
      trace: TraceEntry[];
    };

export class Orchestrator {
  private calls = 0;
  private readonly started = performance.now();
  readonly trace: TraceEntry[] = [];

  constructor(
    private readonly workflow: string,
    private readonly budget: Budget,
    private readonly signal: AbortSignal = new AbortController().signal,
  ) {}

  private remainingMs() {
    return this.budget.maxWallMs - (performance.now() - this.started);
  }

  /** Runs one agent step within the remaining budget. */
  async step<I, O>(agent: Agent<I, O>, input: I): Promise<RunResult<O>> {
    if (this.signal.aborted)
      return this.stop(agent, "cancelled", "CANCELLED", false);
    if (
      this.calls + agent.maxCalls > this.budget.maxCalls ||
      this.remainingMs() <= 0
    )
      return this.stop(agent, "budget_exhausted", "BUDGET_EXHAUSTED", false);

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    this.signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), this.remainingMs());
    const t0 = performance.now();
    try {
      const outcome = await agent.run(input, controller.signal);
      const durationMs = Math.round(performance.now() - t0);
      this.calls += Math.max(outcome.attempts, 0);
      if (this.signal.aborted)
        return this.stop(agent, "cancelled", "CANCELLED", false, durationMs);
      if (!outcome.ok) {
        this.record({
          agent: agent.name,
          status: outcome.code,
          durationMs,
          calls: outcome.attempts,
        });
        return {
          ok: false,
          code: outcome.code,
          retryable: outcome.retryable,
          trace: this.trace,
        };
      }
      this.record({
        agent: agent.name,
        status: "ok",
        durationMs,
        calls: outcome.attempts,
        model: outcome.model,
        mode: outcome.mode,
      });
      return { ok: true, value: outcome.value, trace: this.trace };
    } finally {
      clearTimeout(timer);
      this.signal.removeEventListener("abort", onAbort);
    }
  }

  private stop<O>(
    agent: { name: string },
    status: TraceEntry["status"],
    code: "BUDGET_EXHAUSTED" | "CANCELLED",
    retryable: boolean,
    durationMs = 0,
  ): RunResult<O> {
    this.record({ agent: agent.name, status, durationMs, calls: 0 });
    return { ok: false, code, retryable, trace: this.trace };
  }

  private record(entry: TraceEntry) {
    this.trace.push(entry);
    // Trace holds names, statuses, timings and model ids only: no content.
    logServerEvent(entry.status === "ok" ? "info" : "warn", "agent_step", {
      workflow: this.workflow,
      ...entry,
      callsUsed: this.calls,
    });
  }
}

/**
 * Registered workflows. Each is currently a single agent: ADR-005 allows more
 * agents only where a benchmark shows they add value (BLOCK 51, not run).
 */
export const WORKFLOWS = {
  assess_explanation: ["understanding_evaluator"],
  review_code: ["code_reviewer"],
  diagnose_bug: ["debug_diagnosis_checker"],
} as const;
