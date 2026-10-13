import "server-only";
import {
  ApiError,
  FinishReason,
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";
import { toGeminiJsonSchema } from "@/server/ai/gemini-schema";
import {
  providerError,
  type AiProvider,
  type ProviderResult,
  type StructuredRequest,
} from "@/server/ai/provider";

/** The subset of the SDK client this adapter uses (injectable for tests). */
export interface GeminiClient {
  models: {
    generateContent(
      params: GenerateContentParameters,
    ): Promise<GenerateContentResponse>;
  };
}

const UNTRUSTED_TAG = "jawaban_murid";

/**
 * Untrusted text goes in the user turn, wrapped in a tag whose closing form is
 * neutralised inside the text, so it cannot "close" the block and pose as
 * instructions. The system instruction tells the model it is data only.
 */
export function wrapUntrusted(text: string): string {
  const safe = text.replaceAll(`</${UNTRUSTED_TAG}`, `<\\/${UNTRUSTED_TAG}`);
  return `<${UNTRUSTED_TAG}>\n${safe}\n</${UNTRUSTED_TAG}>`;
}

const REFUSAL_REASONS = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.RECITATION,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
  FinishReason.LANGUAGE,
]);

/** Google Gemini adapter (D-008, ADR-007). Server-only; the key never leaves it. */
export class GeminiProvider implements AiProvider {
  readonly name = "gemini";
  readonly mode = "live" as const;
  private readonly client: GeminiClient;

  constructor(
    apiKey: string,
    private readonly model: string,
    client?: GeminiClient,
  ) {
    this.client = client ?? new GoogleGenAI({ apiKey });
  }

  async generateStructured(
    request: StructuredRequest,
  ): Promise<ProviderResult> {
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);
    if (request.signal?.aborted) return providerError("cancelled", elapsed());

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, request.timeoutMs);
    const onAbort = () => controller.abort();
    request.signal?.addEventListener("abort", onAbort, { once: true });

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text: wrapUntrusted(request.untrustedInput) }],
          },
        ],
        config: {
          systemInstruction: request.instructions,
          responseMimeType: "application/json",
          responseJsonSchema: toGeminiJsonSchema(request.responseJsonSchema),
          maxOutputTokens: request.maxOutputTokens,
          temperature: 0,
          candidateCount: 1,
          // Rubric rating needs little deliberation; deep thinking made
          // requests exceed the 30 s budget on Gemini 3.x (2026-10-15).
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: controller.signal,
          // Retries are owned by the gateway so they stay bounded in one place.
          httpOptions: {
            timeout: request.timeoutMs,
            retryOptions: { attempts: 1 },
          },
        },
      });

      if (response.promptFeedback?.blockReason)
        return providerError("refused", elapsed());
      const candidate = response.candidates?.[0];
      const finish = candidate?.finishReason;
      if (finish === FinishReason.MAX_TOKENS)
        return providerError("output_truncated", elapsed());
      if (finish && REFUSAL_REASONS.has(finish))
        return providerError("refused", elapsed());
      const text = response.text;
      if (!text) return providerError("refused", elapsed());

      const usage = response.usageMetadata;
      return {
        ok: true,
        text,
        model: response.modelVersion ?? this.model,
        usage: {
          inputTokens: usage?.promptTokenCount,
          outputTokens:
            usage?.candidatesTokenCount === undefined
              ? undefined
              : usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0),
        },
        latencyMs: elapsed(),
      };
    } catch (error) {
      if (timedOut) return providerError("timeout", elapsed());
      if (request.signal?.aborted) return providerError("cancelled", elapsed());
      if (error instanceof ApiError) {
        if (error.status === 429)
          return providerError("rate_limited", elapsed());
        if (error.status === 401 || error.status === 403)
          return providerError("not_configured", elapsed());
        if (error.status === 408 || error.status === 504)
          return providerError("timeout", elapsed());
        if (error.status >= 400 && error.status < 500)
          return providerError("bad_request", elapsed());
      }
      return providerError("unavailable", elapsed());
    } finally {
      clearTimeout(timer);
      request.signal?.removeEventListener("abort", onAbort);
    }
  }
}
