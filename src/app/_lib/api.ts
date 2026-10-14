import type { z } from "zod";
import { errorEnvelopeSchema, type ErrorCode } from "@/shared/api/errors";

/**
 * Browser-side API access. Every response is validated against the shared
 * contract; a body that does not match is treated as an error, never trusted.
 */

export type ApiFailure = {
  ok: false;
  status: number;
  /** `NETWORK` and `CONTRACT` are client-side failures, not server codes. */
  code: ErrorCode | "NETWORK" | "CONTRACT";
  retryable: boolean;
  retryAfterSeconds?: number;
  fields?: Array<{ path: string; issue: string }>;
  correlationId?: string;
  /** Server-provided, learner-safe message (ERROR_DEFINITIONS). */
  message?: string;
};
export type ApiResult<T> = { ok: true; status: number; data: T } | ApiFailure;

export async function apiFetch<S extends z.ZodType>(
  path: string,
  schema: S,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<ApiResult<z.infer<S>>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "content-type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: init?.signal,
    });
  } catch {
    return { ok: false, status: 0, code: "NETWORK", retryable: true };
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // Fall through: an unreadable body is a contract failure below.
  }

  if (response.ok) {
    const parsed = schema.safeParse(json);
    if (parsed.success)
      return { ok: true, status: response.status, data: parsed.data };
    return {
      ok: false,
      status: response.status,
      code: "CONTRACT",
      retryable: false,
    };
  }

  const envelope = errorEnvelopeSchema.safeParse(json);
  if (!envelope.success)
    return {
      ok: false,
      status: response.status,
      code: "CONTRACT",
      retryable: response.status >= 500,
    };
  const { error } = envelope.data;
  return {
    ok: false,
    status: response.status,
    code: error.code,
    retryable: error.retryable,
    retryAfterSeconds: error.details?.retryAfterSeconds,
    fields: error.details?.fields,
    correlationId: error.correlationId,
    message: error.message,
  };
}

/** Child-friendly Indonesian message; server messages are already written for children. */
export function failureMessage(failure: ApiFailure): string {
  if (failure.code === "NETWORK")
    return "Koneksi internet terputus. Periksa jaringanmu, lalu coba lagi ya.";
  if (failure.code === "CONTRACT")
    return "Jawaban dari server tidak sesuai yang diharapkan. Coba muat ulang halaman.";
  if (failure.code === "RATE_LIMITED" && failure.retryAfterSeconds)
    return `Terlalu banyak percobaan. Coba lagi dalam ${failure.retryAfterSeconds} detik.`;
  return failure.message ?? "Terjadi kendala. Coba lagi ya.";
}

/** Random key for idempotent submissions (8–64 chars per contract). */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
