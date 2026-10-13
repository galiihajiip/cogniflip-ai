import "server-only";

/**
 * Provider-neutral contract for structured model calls (ADR-005, ADR-007).
 * Domain code depends on this interface only, never on a vendor SDK.
 *
 * A provider returns raw text. Parsing, schema validation and semantic checks
 * happen in the gateway (BLOCK 16/17), so no provider output is trusted.
 */

export const PROVIDER_ERROR_CODES = [
  "not_configured",
  "timeout",
  "rate_limited",
  "unavailable",
  "refused",
  "cancelled",
  "bad_request",
  "output_truncated",
] as const;
export type ProviderErrorCode = (typeof PROVIDER_ERROR_CODES)[number];

/** Whether a failure may succeed if the same request is sent again. */
export const RETRYABLE: Record<ProviderErrorCode, boolean> = {
  not_configured: false,
  timeout: true,
  rate_limited: true,
  unavailable: true,
  refused: false,
  cancelled: false,
  bad_request: false,
  output_truncated: false,
};

export interface StructuredRequest {
  /** Which bounded task this is, for logs and budgets (e.g. "evaluate"). */
  purpose: string;
  /** Trusted instructions written by the application. */
  instructions: string;
  /**
   * Untrusted content (learner answer, code, post). Providers must send it as
   * separate, clearly delimited data, never concatenated into `instructions`.
   */
  untrustedInput: string;
  /** JSON Schema the response must follow (derived from a zod schema). */
  responseJsonSchema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export type ProviderResult =
  | {
      ok: true;
      text: string;
      model: string;
      usage: ProviderUsage;
      latencyMs: number;
    }
  | {
      ok: false;
      error: ProviderErrorCode;
      retryable: boolean;
      latencyMs: number;
    };

export interface AiProvider {
  readonly name: string;
  /** `mock` providers are for tests and local development only. */
  readonly mode: "live" | "mock";
  generateStructured(request: StructuredRequest): Promise<ProviderResult>;
}

export function providerError(
  error: ProviderErrorCode,
  latencyMs: number,
): ProviderResult {
  return { ok: false, error, retryable: RETRYABLE[error], latencyMs };
}
