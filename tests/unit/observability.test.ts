import { afterEach, describe, expect, it, vi } from "vitest";
import { createAiProvider } from "@/server/ai";
import { parseServerEnv } from "@/server/config/env";
import { getIntegrationStatus } from "@/server/integrations/status";
import { GET as status } from "@/app/api/status/route";
import { POST as review } from "@/app/api/code/review/route";
import { GET as history } from "@/app/api/history/route";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("AI kill switch", () => {
  it("disables every AI provider, including the mock, and reports it honestly", async () => {
    for (const level of ["info", "warn", "error"] as const)
      vi.spyOn(console, level).mockImplementation(() => {});
    const env = parseServerEnv({
      AI_DISABLED: "true",
      AI_MOCK_MODE: "true",
      LLM_PROVIDER: "gemini",
      LLM_API_KEY: "k-0123456789",
      LLM_MODEL: "gemini-3.8-flash",
    });
    expect(createAiProvider(env)).toBeNull();
    expect(getIntegrationStatus(env, "ai")).toEqual({
      available: false,
      reason: "disabled",
    });

    vi.stubEnv("AI_DISABLED", "true");
    vi.stubEnv("AI_MOCK_MODE", "true");
    expect(
      (await (await status(new Request("http://t/api/status"))).json())
        .integrations.ai,
    ).toEqual({ available: false, reason: "disabled" });
    const res = await review(
      new Request("http://localhost:3000/api/code/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: "py", code: "x = 1" }),
      }),
    );
    expect(res.status).toBe(503);
  });
});

describe("api_request log", () => {
  it("records method, path, status and duration without query, body or cookies", async () => {
    const lines: string[] = [];
    for (const level of ["info", "warn", "error"] as const)
      vi.spyOn(console, level).mockImplementation(
        (l: string) => void lines.push(l),
      );
    await history(
      new Request("http://t/api/history?cursor=SECRETCURSOR&limit=5", {
        headers: { cookie: "cf_guest=COOKIEVALUE" },
      }),
    );
    const entry = lines
      .map((l) => JSON.parse(l))
      .find((e) => e.event === "api_request");
    expect(entry).toMatchObject({
      method: "GET",
      path: "/api/history",
      status: 503,
    });
    expect(typeof entry.durationMs).toBe("number");
    expect(lines.join("\n")).not.toMatch(/SECRETCURSOR|COOKIEVALUE/);
  });
});
