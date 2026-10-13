import "server-only";
import {
  providerError,
  type AiProvider,
  type ProviderResult,
  type StructuredRequest,
} from "@/server/ai/provider";

/**
 * Tries providers (Gemini models) in order. It moves on when a model is
 * overloaded, rate limited or too slow; any other result, success or
 * failure, is returned as is, so configuration and output errors are never
 * masked. The request's time budget is shared: each model gets an equal
 * slice of what is left, so one stuck model cannot use all of it.
 */
export class FallbackProvider implements AiProvider {
  readonly name: string;
  readonly mode: "live" | "mock";

  constructor(
    private readonly providers: AiProvider[],
    private readonly now: () => number = () => performance.now(),
  ) {
    if (providers.length === 0) throw new Error("no providers");
    this.name = providers[0]!.name;
    this.mode = providers[0]!.mode;
  }

  async generateStructured(
    request: StructuredRequest,
  ): Promise<ProviderResult> {
    const started = this.now();
    let result: ProviderResult | undefined;
    for (let i = 0; i < this.providers.length; i++) {
      if (request.signal?.aborted) break;
      const remaining = request.timeoutMs - (this.now() - started);
      if (remaining <= 0) break;
      const slice = Math.floor(remaining / (this.providers.length - i));
      result = await this.providers[i]!.generateStructured({
        ...request,
        timeoutMs: slice,
      });
      if (result.ok) return result;
      if (!["unavailable", "rate_limited", "timeout"].includes(result.error))
        return result;
    }
    return result ?? providerError("timeout", Math.round(this.now() - started));
  }
}
