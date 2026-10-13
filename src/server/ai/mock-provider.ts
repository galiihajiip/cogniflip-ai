import "server-only";
import {
  providerError,
  type AiProvider,
  type ProviderErrorCode,
  type ProviderResult,
  type StructuredRequest,
} from "@/server/ai/provider";

/**
 * Deterministic, scripted provider for tests and local development.
 *
 * It never calls a model. Every result is labelled `mode: "mock"` and the
 * model name starts with `mock:`, so it cannot be mistaken for live AI. The
 * configuration layer refuses mock mode in production.
 */

export type MockStep =
  | { kind: "text"; text: string; delayMs?: number }
  | { kind: "error"; error: ProviderErrorCode; delayMs?: number }
  /** Waits until the request's timeout or abort signal fires. */
  | { kind: "hang" };

export const MOCK_MODEL = "mock:deterministic";

export class MockAiProvider implements AiProvider {
  readonly name = "mock";
  readonly mode = "mock" as const;
  readonly requests: StructuredRequest[] = [];
  private readonly steps: MockStep[];

  /**
   * @param script Responses returned in order; the last one repeats.
   *               Or a function that picks a response per request.
   */
  constructor(
    private readonly script:
      MockStep[] | ((request: StructuredRequest) => MockStep),
  ) {
    this.steps = Array.isArray(script) ? [...script] : [];
  }

  private next(request: StructuredRequest): MockStep {
    if (typeof this.script === "function") return this.script(request);
    const step = this.steps.length > 1 ? this.steps.shift()! : this.steps[0];
    if (!step) throw new Error("MockAiProvider has no scripted response");
    return step;
  }

  async generateStructured(
    request: StructuredRequest,
  ): Promise<ProviderResult> {
    this.requests.push(request);
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);
    const step = this.next(request);

    // `null` means "never finish on its own" (only timeout/abort end it).
    const wait = (ms: number | null) =>
      new Promise<"done" | "timeout" | "cancelled">((resolve) => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        const finish = (result: "done" | "timeout" | "cancelled") => {
          timers.forEach(clearTimeout);
          request.signal?.removeEventListener("abort", onAbort);
          resolve(result);
        };
        const onAbort = () => finish("cancelled");
        if (ms !== null) timers.push(setTimeout(() => finish("done"), ms));
        timers.push(setTimeout(() => finish("timeout"), request.timeoutMs));
        request.signal?.addEventListener("abort", onAbort, { once: true });
      });

    if (request.signal?.aborted) return providerError("cancelled", elapsed());
    const outcome = await wait(
      step.kind === "hang" ? null : (step.delayMs ?? 0),
    );
    if (outcome === "timeout") return providerError("timeout", elapsed());
    if (outcome === "cancelled") return providerError("cancelled", elapsed());

    if (step.kind === "error") return providerError(step.error, elapsed());
    if (step.kind === "hang") return providerError("timeout", elapsed());
    return {
      ok: true,
      text: step.text,
      model: MOCK_MODEL,
      usage: {},
      latencyMs: elapsed(),
    };
  }
}
