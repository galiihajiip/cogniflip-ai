import { afterEach, describe, expect, it, vi } from "vitest";
import { parseServerEnv } from "@/server/config/env";
import {
  IMPLEMENTED_INTEGRATIONS,
  getAllIntegrationStatuses,
  getIntegrationStatus,
} from "@/server/integrations/status";
import { GET } from "@/app/api/status/route";

const FAKE_KEY = ["fake", "llm", "key", "0123456789"].join("-");
const aiConfigured = {
  LLM_PROVIDER: "gemini",
  LLM_API_KEY: FAKE_KEY,
  LLM_MODEL: "example-model-1",
};

afterEach(() => vi.unstubAllEnvs());

describe("integration status", () => {
  it("reports an unconfigured integration as unavailable", () => {
    expect(getIntegrationStatus(parseServerEnv({}), "ai")).toEqual({
      available: false,
      reason: "not_configured",
    });
  });

  it("does not treat configuration alone as availability", () => {
    const notImplemented = { ...IMPLEMENTED_INTEGRATIONS, ai: false };
    expect(
      getIntegrationStatus(parseServerEnv(aiConfigured), "ai", notImplemented),
    ).toEqual({ available: false, reason: "not_implemented" });
  });

  it("reports the development mock as mock, and never in production", () => {
    expect(
      getIntegrationStatus(parseServerEnv({ AI_MOCK_MODE: "true" }), "ai"),
    ).toEqual({
      available: true,
      mode: "mock",
    });
  });

  it("reports available only when configured and implemented", () => {
    const implemented = { ...IMPLEMENTED_INTEGRATIONS, ai: true };
    expect(
      getIntegrationStatus(parseServerEnv(aiConfigured), "ai", implemented),
    ).toEqual({
      available: true,
    });
  });

  it("marks the AI and database adapters as implemented", () => {
    expect(IMPLEMENTED_INTEGRATIONS).toEqual({
      ai: true,
      database: true,
      speechToText: false,
      textToSpeech: false,
      codeRunner: false,
      errorReporting: false,
    });
    const statuses = getAllIntegrationStatuses(parseServerEnv({}));
    expect(Object.values(statuses).every((s) => !s.available)).toBe(true);
  });
});

describe("GET /api/status", () => {
  it("returns availability without exposing configuration values", async () => {
    for (const [name, value] of Object.entries(aiConfigured))
      vi.stubEnv(name, value);

    const response = await GET(new Request("http://test/api/status"));
    const text = await response.text();
    const body = JSON.parse(text);

    expect(response.status).toBe(200);
    expect(body.integrations.ai).toEqual({ available: true });
    expect(body.integrations.database).toEqual({
      available: false,
      reason: "not_configured",
    });
    expect(text).not.toContain(FAKE_KEY);
    expect(text).not.toContain("example-model-1");
    expect(text).not.toContain("LLM_");
  });

  it("returns the safe error envelope when configuration is invalid", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("AI_TIMEOUT_SECONDS", "abc");

    const response = await GET(new Request("http://test/api/status"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("AI_TIMEOUT_SECONDS");
  });
});
