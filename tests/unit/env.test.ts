import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  SECRET_VARIABLES,
  currentSecretValues,
  isIntegrationConfigured,
  parseServerEnv,
  type EnvSource,
} from "@/server/config/env";
import { PUBLIC_VARIABLES } from "@/config/public-env";

// Fake values, assembled at runtime so repository secret scans do not flag them.
const FAKE_KEY = ["fake", "llm", "key", "0123456789"].join("-");

function problemsOf(source: EnvSource) {
  try {
    parseServerEnv(source);
  } catch (error) {
    expect(error).toBeInstanceOf(EnvValidationError);
    return (error as EnvValidationError).problems;
  }
  throw new Error("expected parseServerEnv to throw");
}

describe("parseServerEnv", () => {
  it("accepts an empty development environment and applies limit defaults", () => {
    const env = parseServerEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.AI_MAX_CALLS_PER_SESSION).toBe(6);
    expect(env.AI_TIMEOUT_SECONDS).toBe(30);
    expect(env.CODE_RUN_MAX_OUTPUT_BYTES).toBe(65_536);
  });

  it("treats blank values copied from .env.example as unset", () => {
    const env = parseServerEnv({
      LLM_PROVIDER: "",
      LLM_API_KEY: "  ",
      LLM_MODEL: "",
    });
    expect(isIntegrationConfigured(env, "ai")).toBe(false);
  });

  it("requires APP_BASE_URL in production", () => {
    expect(problemsOf({ NODE_ENV: "production" })).toEqual([
      { variable: "APP_BASE_URL", problem: "is required in production" },
    ]);
  });

  it("rejects malformed URLs", () => {
    const problems = problemsOf({
      APP_BASE_URL: "not a url",
      DATABASE_URL: "https://db.example",
    });
    expect(problems.map((p) => p.variable).sort()).toEqual([
      "APP_BASE_URL",
      "DATABASE_URL",
    ]);
  });

  it("rejects an http code runner URL in production", () => {
    const problems = problemsOf({
      NODE_ENV: "production",
      APP_BASE_URL: "https://cogniflip.example",
      CODE_RUNNER_PROVIDER: "runner",
      CODE_RUNNER_BASE_URL: "http://runner.example",
      CODE_RUNNER_API_KEY: FAKE_KEY,
    });
    expect(problems).toEqual([
      {
        variable: "CODE_RUNNER_BASE_URL",
        problem: "must use https in production",
      },
    ]);
  });

  it.each([
    ["not a number", "abc"],
    ["zero", "0"],
    ["negative", "-5"],
    ["fractional", "1.5"],
    ["above the maximum", "51"],
  ])("rejects a numeric limit that is %s", (_label, value) => {
    expect(problemsOf({ AI_MAX_CALLS_PER_SESSION: value })).toEqual([
      expect.objectContaining({ variable: "AI_MAX_CALLS_PER_SESSION" }),
    ]);
  });

  it("rejects an unsupported AI provider", () => {
    const problems = problemsOf({
      LLM_PROVIDER: "unknown",
      LLM_API_KEY: FAKE_KEY,
      LLM_MODEL: "m",
    });
    expect(problems).toEqual([
      { variable: "LLM_PROVIDER", problem: "is not one of the allowed values" },
    ]);
  });

  it("names every missing variable of a partly configured integration", () => {
    const problems = problemsOf({ LLM_API_KEY: FAKE_KEY });
    expect(problems.map((p) => p.variable).sort()).toEqual([
      "LLM_MODEL",
      "LLM_PROVIDER",
    ]);
  });

  it("marks an integration configured only when its whole group is set", () => {
    const env = parseServerEnv({
      LLM_PROVIDER: "gemini",
      LLM_API_KEY: FAKE_KEY,
      LLM_MODEL: "example-model-1",
    });
    expect(isIntegrationConfigured(env, "ai")).toBe(true);
    expect(isIntegrationConfigured(env, "database")).toBe(false);
  });

  it("never includes variable values in the error message", () => {
    const malformedSecret = `${FAKE_KEY}-not-a-url`;
    try {
      parseServerEnv({
        LLM_API_KEY: FAKE_KEY,
        ERROR_REPORTING_DSN: malformedSecret,
        AI_TIMEOUT_SECONDS: "999",
      });
      throw new Error("expected parseServerEnv to throw");
    } catch (error) {
      const text = `${(error as Error).message} ${JSON.stringify((error as EnvValidationError).problems)}`;
      expect(text).toContain("ERROR_REPORTING_DSN");
      expect(text).not.toContain(FAKE_KEY);
      expect(text).not.toContain("999");
    }
  });
});

describe("public/secret separation", () => {
  it("keeps every secret out of the NEXT_PUBLIC_ namespace", () => {
    for (const name of SECRET_VARIABLES)
      expect(name.startsWith("NEXT_PUBLIC_")).toBe(false);
    for (const name of PUBLIC_VARIABLES)
      expect(SECRET_VARIABLES).not.toContain(name);
  });

  it("collects current secret values for log scrubbing, ignoring blanks", () => {
    expect(
      currentSecretValues({
        LLM_API_KEY: FAKE_KEY,
        TTS_API_KEY: "",
        APP_BASE_URL: "x",
      }),
    ).toEqual([FAKE_KEY]);
  });
});
