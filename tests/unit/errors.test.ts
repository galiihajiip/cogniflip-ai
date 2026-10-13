import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AppError,
  ERROR_CODES,
  ERROR_DEFINITIONS,
  type ErrorEnvelope,
} from "@/server/http/errors";
import {
  CORRELATION_HEADER,
  errorResponse,
  getCorrelationId,
  withErrorHandling,
} from "@/server/http/respond";

const SECRET = ["fake", "secret", "value", "987654321"].join("-");

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("error definitions", () => {
  it("defines a status, retry flag and Indonesian message for every code", () => {
    for (const code of ERROR_CODES) {
      const definition = ERROR_DEFINITIONS[code];
      expect(definition.status).toBeGreaterThanOrEqual(400);
      expect(typeof definition.retryable).toBe("boolean");
      expect(definition.message.length).toBeGreaterThan(10);
    }
  });
});

describe("getCorrelationId", () => {
  it("reuses a well-formed incoming request ID", () => {
    const request = new Request("http://test/", {
      headers: { "x-request-id": "req-12345678" },
    });
    expect(getCorrelationId(request)).toBe("req-12345678");
  });

  it("replaces a malformed or missing ID with a UUID", () => {
    const bad = new Request("http://test/", {
      headers: { "x-request-id": "<script>" },
    });
    expect(getCorrelationId(bad)).toMatch(/^[0-9a-f-]{36}$/);
    expect(getCorrelationId(new Request("http://test/"))).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });
});

describe("errorResponse", () => {
  it("returns the stable envelope for an AppError", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = errorResponse(
      new AppError("VALIDATION_ERROR", "answer too long", {
        details: { field: "answer" },
      }),
      "corr-12345678",
    );
    expect(response.status).toBe(400);
    expect(response.headers.get(CORRELATION_HEADER)).toBe("corr-12345678");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = (await response.json()) as ErrorEnvelope;
    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: ERROR_DEFINITIONS.VALIDATION_ERROR.message,
        retryable: false,
        correlationId: "corr-12345678",
        details: { field: "answer" },
      },
    });
    expect(JSON.stringify(body)).not.toContain("answer too long");
  });

  it("hides unknown errors behind INTERNAL_ERROR and logs a redacted diagnostic", async () => {
    vi.stubEnv("LLM_API_KEY", SECRET);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = errorResponse(
      new Error(`db failed using ${SECRET}`),
      "corr-abcdefgh",
    );

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(JSON.parse(text).error.code).toBe("INTERNAL_ERROR");
    expect(text).not.toContain("db failed");
    expect(text).not.toContain(SECRET);

    expect(log).toHaveBeenCalledTimes(1);
    const logged = String(log.mock.calls[0][0]);
    expect(logged).toContain("corr-abcdefgh");
    expect(logged).toContain("db failed using [REDACTED]");
    expect(logged).not.toContain(SECRET);
  });
});

describe("withErrorHandling", () => {
  it("passes a correlation ID to the handler and converts thrown AppErrors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withErrorHandling((_request, correlationId) => {
      throw new AppError(
        "PROVIDER_UNAVAILABLE",
        `ai not configured (${correlationId})`,
        {
          details: { integration: "ai" },
        },
      );
    });
    const response = await handler(
      new Request("http://test/", { headers: { "x-request-id": "abcdefgh1" } }),
    );
    expect(response.status).toBe(503);
    const body = (await response.json()) as ErrorEnvelope;
    expect(body.error).toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      retryable: true,
      correlationId: "abcdefgh1",
      details: { integration: "ai" },
    });
  });
});
