import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/server/config/env";
import { MOCK_MODEL, MockAiProvider } from "@/server/ai/mock-provider";
import {
  PROVIDER_ERROR_CODES,
  RETRYABLE,
  type StructuredRequest,
} from "@/server/ai/provider";

const request = (
  overrides: Partial<StructuredRequest> = {},
): StructuredRequest => ({
  purpose: "evaluate",
  instructions: "Rate the answer.",
  untrustedInput: "jawaban murid",
  responseJsonSchema: { type: "object" },
  maxOutputTokens: 500,
  timeoutMs: 1_000,
  ...overrides,
});

describe("MockAiProvider", () => {
  it("returns scripted text in order and labels itself as mock", async () => {
    const provider = new MockAiProvider([
      { kind: "text", text: '{"a":1}' },
      { kind: "text", text: '{"a":2}' },
    ]);
    expect(provider.mode).toBe("mock");
    const first = await provider.generateStructured(request());
    const second = await provider.generateStructured(request());
    const third = await provider.generateStructured(request());
    expect(first).toMatchObject({
      ok: true,
      text: '{"a":1}',
      model: MOCK_MODEL,
    });
    expect(second).toMatchObject({ ok: true, text: '{"a":2}' });
    expect(third).toMatchObject({ ok: true, text: '{"a":2}' }); // last repeats
    expect(MOCK_MODEL.startsWith("mock:")).toBe(true);
    expect(provider.requests).toHaveLength(3);
  });

  it("is deterministic for a per-request script", async () => {
    const provider = new MockAiProvider((req) => ({
      kind: "text",
      text: req.untrustedInput.length > 5 ? "long" : "short",
    }));
    const a = await provider.generateStructured(
      request({ untrustedInput: "panjang sekali" }),
    );
    const b = await provider.generateStructured(
      request({ untrustedInput: "x" }),
    );
    expect([a.ok && a.text, b.ok && b.text]).toEqual(["long", "short"]);
  });

  it.each(PROVIDER_ERROR_CODES)(
    "reports %s with the documented retry flag",
    async (code) => {
      const provider = new MockAiProvider([{ kind: "error", error: code }]);
      expect(await provider.generateStructured(request())).toMatchObject({
        ok: false,
        error: code,
        retryable: RETRYABLE[code],
      });
    },
  );

  it("times out a hanging call at the request timeout", async () => {
    const provider = new MockAiProvider([{ kind: "hang" }]);
    const started = Date.now();
    const result = await provider.generateStructured(
      request({ timeoutMs: 50 }),
    );
    expect(result).toMatchObject({
      ok: false,
      error: "timeout",
      retryable: true,
    });
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it("stops on cancellation", async () => {
    const provider = new MockAiProvider([{ kind: "hang" }]);
    const controller = new AbortController();
    const pending = provider.generateStructured(
      request({ timeoutMs: 5_000, signal: controller.signal }),
    );
    controller.abort();
    expect(await pending).toMatchObject({
      ok: false,
      error: "cancelled",
      retryable: false,
    });
    const already = await provider.generateStructured(
      request({ signal: controller.signal }),
    );
    expect(already).toMatchObject({ ok: false, error: "cancelled" });
  });
});

describe("AI configuration", () => {
  const ai = {
    LLM_PROVIDER: "gemini",
    LLM_API_KEY: "test-key-0123456789",
    LLM_MODEL: "gemini-3.8-flash",
  };

  it("accepts the Gemini provider and rejects providers without an adapter", () => {
    expect(() => parseServerEnv(ai)).not.toThrow();
    expect(() => parseServerEnv({ ...ai, LLM_PROVIDER: "anthropic" })).toThrow(
      /LLM_PROVIDER: is not one of the allowed values/,
    );
  });

  it("refuses mock AI in production but allows it in development", () => {
    expect(() => parseServerEnv({ AI_MOCK_MODE: "true" })).not.toThrow();
    expect(() =>
      parseServerEnv({
        NODE_ENV: "production",
        APP_BASE_URL: "https://cogniflip.example",
        AI_MOCK_MODE: "true",
      }),
    ).toThrow(/AI_MOCK_MODE: must not be enabled in production/);
  });
});
