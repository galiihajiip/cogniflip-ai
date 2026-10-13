import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  boundedText,
  sessionIdSchema,
  slugSchema,
  timestampSchema,
} from "@/shared/schemas/primitives";
import { pageSchema, paginationQuerySchema } from "@/shared/schemas/pagination";
import { errorEnvelopeSchema, MAX_FIELD_ISSUES } from "@/shared/api/errors";
import {
  databaseHealthResponseSchema,
  integrationStatusSchema,
  statusResponseSchema,
} from "@/shared/api/status";
import { AppError, type SafeDetails } from "@/server/http/errors";
import {
  DEFAULT_MAX_BODY_BYTES,
  parseInput,
  readJsonBody,
  toFieldIssues,
} from "@/server/http/request";
import {
  contractResponse,
  errorResponse,
  withErrorHandling,
} from "@/server/http/respond";
import { GET as getStatus } from "@/app/api/status/route";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function validationFields(run: () => unknown) {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("VALIDATION_ERROR");
    return (error as AppError).details?.fields ?? [];
  }
  throw new Error("expected VALIDATION_ERROR");
}

describe("identifier and timestamp schemas", () => {
  it.each([
    "",
    "123",
    "not-a-uuid",
    "'; drop table users; --",
    "00000000-0000-0000-0000-00000000000g",
  ])("rejects invalid session ID %j", (value) => {
    expect(sessionIdSchema.safeParse(value).success).toBe(false);
  });

  it("accepts a v4 UUID session ID", () => {
    expect(sessionIdSchema.safeParse(crypto.randomUUID()).success).toBe(true);
  });

  it.each([
    "Urutan",
    "urutan instruksi",
    "-urutan",
    "urutan-",
    "a".repeat(65),
    "urutan--x",
  ])("rejects invalid slug %j", (value) => {
    expect(slugSchema.safeParse(value).success).toBe(false);
  });

  it("accepts lower-kebab slugs", () => {
    expect(slugSchema.parse("urutan-instruksi-1")).toBe("urutan-instruksi-1");
  });

  it.each([
    "2026-10-13",
    "2026-10-13T01:02:03",
    "2026-10-13T01:02:03+07:00",
    "2026-13-01T00:00:00Z",
    "yesterday",
  ])("rejects non-UTC or malformed timestamp %j", (value) => {
    expect(timestampSchema.safeParse(value).success).toBe(false);
  });

  it("accepts UTC timestamps", () => {
    expect(timestampSchema.safeParse("2026-10-13T01:02:03.000Z").success).toBe(
      true,
    );
  });
});

describe("boundedText", () => {
  const explanation = boundedText({ max: 20 });

  it("trims and NFC-normalizes text and keeps line breaks", () => {
    expect(explanation.parse("  Robot\njalan  ")).toBe("Robot\njalan");
    expect(explanation.parse("Café")).toBe("Café");
  });

  it("rejects empty, whitespace-only and overlong text", () => {
    expect(explanation.safeParse("").success).toBe(false);
    expect(explanation.safeParse("   ").success).toBe(false);
    expect(explanation.safeParse("x".repeat(21)).success).toBe(false);
  });

  it("rejects control characters", () => {
    expect(explanation.safeParse("halo\u0000dunia").success).toBe(false);
    expect(explanation.safeParse("halo\u001bdunia").success).toBe(false);
  });
});

describe("pagination", () => {
  it("applies the default page size", () => {
    expect(paginationQuerySchema.parse({})).toEqual({ limit: 20 });
  });

  it("rejects oversized, non-numeric and unknown parameters", () => {
    expect(paginationQuerySchema.safeParse({ limit: "51" }).success).toBe(
      false,
    );
    expect(paginationQuerySchema.safeParse({ limit: "abc" }).success).toBe(
      false,
    );
    expect(paginationQuerySchema.safeParse({ cursor: "a b" }).success).toBe(
      false,
    );
    expect(paginationQuerySchema.safeParse({ offset: "0" }).success).toBe(
      false,
    );
  });

  it("bounds page size and requires an explicit nextCursor", () => {
    const page = pageSchema(z.string());
    expect(page.safeParse({ items: ["a"], nextCursor: null }).success).toBe(
      true,
    );
    expect(page.safeParse({ items: ["a"] }).success).toBe(false);
    expect(
      page.safeParse({ items: Array(51).fill("a"), nextCursor: null }).success,
    ).toBe(false);
  });
});

describe("parseInput", () => {
  const body = z.strictObject({
    answer: boundedText({ max: 10 }),
    attempt: z.number().int().min(1),
  });

  it("returns typed data for valid input", () => {
    expect(parseInput(body, { answer: " ok ", attempt: 1 })).toEqual({
      answer: "ok",
      attempt: 1,
    });
  });

  it("reports unknown fields where strictness is required", () => {
    expect(
      validationFields(() =>
        parseInput(body, {
          answer: "ok",
          attempt: 1,
          score: 100,
          role: "admin",
        }),
      ),
    ).toEqual([
      { path: "score", issue: "unknown_field" },
      { path: "role", issue: "unknown_field" },
    ]);
  });

  it("distinguishes missing, mistyped, overlong and too-small fields", () => {
    expect(validationFields(() => parseInput(body, {}))).toEqual([
      { path: "answer", issue: "required" },
      { path: "attempt", issue: "required" },
    ]);
    expect(
      validationFields(() => parseInput(body, { answer: 5, attempt: "1" })),
    ).toEqual([
      { path: "answer", issue: "invalid_type" },
      { path: "attempt", issue: "invalid_type" },
    ]);
    expect(
      validationFields(() =>
        parseInput(body, { answer: "x".repeat(11), attempt: 0 }),
      ),
    ).toEqual([
      { path: "answer", issue: "too_long" },
      { path: "attempt", issue: "too_small" },
    ]);
  });

  it("never copies input values into the error", () => {
    const secretish = "my-private-answer-9876";
    try {
      parseInput(body, { answer: secretish.repeat(2), attempt: secretish });
    } catch (error) {
      const appError = error as AppError;
      expect(JSON.stringify(appError.details)).not.toContain(secretish);
      expect(appError.message).not.toContain(secretish);
    }
  });

  it("caps the number of reported issues", () => {
    const many = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [`k${i}`, i]),
    );
    expect(
      toFieldIssues(z.strictObject({}).safeParse(many).error!.issues),
    ).toHaveLength(MAX_FIELD_ISSUES);
  });
});

describe("readJsonBody", () => {
  const post = (body: BodyInit | null, headers: Record<string, string>) =>
    new Request("http://test/", { method: "POST", body, headers });
  const json = { "content-type": "application/json" };

  it("parses a valid JSON body", async () => {
    await expect(readJsonBody(post('{"answer":"ok"}', json))).resolves.toEqual({
      answer: "ok",
    });
  });

  it.each([
    [
      "wrong content type",
      post('{"a":1}', { "content-type": "text/plain" }),
      "invalid_type",
    ],
    ["malformed JSON", post('{"answer":', json), "invalid_format"],
    ["empty body", post("", json), "required"],
    [
      "invalid UTF-8",
      post(new Uint8Array([0x7b, 0xff, 0x7d]), json),
      "invalid_format",
    ],
  ])("rejects %s", async (_label, request, issue) => {
    const error = await readJsonBody(request).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("VALIDATION_ERROR");
    expect((error as AppError).details?.fields?.[0].issue).toBe(issue);
  });

  it("stops reading an oversized body even without Content-Length", async () => {
    const big = "x".repeat(DEFAULT_MAX_BODY_BYTES + 1);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`"${big}"`));
        controller.close();
      },
    });
    const request = new Request("http://test/", {
      method: "POST",
      body: stream,
      headers: json,
      duplex: "half",
    } as RequestInit);
    const error = (await readJsonBody(request).catch(
      (e: unknown) => e,
    )) as AppError;
    expect(error.details?.fields).toEqual([
      { path: "(body)", issue: "too_long" },
    ]);
  });
});

describe("safe serialization", () => {
  it("drops details that are outside the shared contract", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const unsafe = {
      stack: "at db.ts:12",
      userEmail: "x@example.test",
    } as unknown as SafeDetails;
    const response = errorResponse(
      new AppError("VALIDATION_ERROR", "x", { details: unsafe }),
      "corr-12345678",
    );
    const body = await response.json();
    expect(errorEnvelopeSchema.parse(body).error.details).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("example.test");
  });

  it("refuses to send a success body with fields outside its contract", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = withErrorHandling((_request, correlationId) =>
      contractResponse(
        databaseHealthResponseSchema,
        {
          status: "ok",
          latencyMs: 3,
          correlationId,
          host: "db.internal",
        } as never,
        correlationId,
      ),
    );
    const response = await handler(new Request("http://test/"));
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(errorEnvelopeSchema.parse(JSON.parse(text)).error.code).toBe(
      "INTERNAL_ERROR",
    );
    expect(text).not.toContain("db.internal");
  });

  it("emits error envelopes that match the published contract", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = errorResponse(new Error("boom"), "corr-abcdefgh");
    expect(errorEnvelopeSchema.safeParse(await response.json()).success).toBe(
      true,
    );
  });

  it("GET /api/status matches statusResponseSchema", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const response = await getStatus(new Request("http://test/"));
    expect(statusResponseSchema.safeParse(await response.json()).success).toBe(
      true,
    );
  });
});

describe("unsupported states", () => {
  it.each([
    { available: false, reason: "maybe" },
    { available: true, reason: "not_configured" },
    { available: "yes" },
    {},
  ])("rejects integration status %j", (value) => {
    expect(integrationStatusSchema.safeParse(value).success).toBe(false);
  });

  it("rejects an unknown database health status", () => {
    expect(
      databaseHealthResponseSchema.safeParse({
        status: "degraded",
        correlationId: "corr-12345678",
      }).success,
    ).toBe(false);
  });
});
