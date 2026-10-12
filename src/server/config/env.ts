import "server-only";
import { z } from "zod";
import type { IntegrationName } from "@/shared/api/status";

/**
 * Server-side environment configuration.
 *
 * Every problem is reported by variable name only. Values are never placed in
 * error messages, logs or responses.
 */

export type EnvSource = Record<string, string | undefined>;

/** Variables whose values are credentials and must never leave the server. */
export const SECRET_VARIABLES = [
  "LLM_API_KEY",
  "DATABASE_URL",
  "STT_API_KEY",
  "TTS_API_KEY",
  "CODE_RUNNER_API_KEY",
  "ERROR_REPORTING_DSN",
] as const;

/** Integrations are all-or-nothing: a partially configured group is an error. */
export const INTEGRATION_GROUPS = {
  ai: ["LLM_PROVIDER", "LLM_API_KEY", "LLM_MODEL"],
  database: ["DATABASE_URL"],
  speechToText: ["STT_PROVIDER", "STT_API_KEY"],
  textToSpeech: ["TTS_PROVIDER", "TTS_API_KEY"],
  codeRunner: [
    "CODE_RUNNER_PROVIDER",
    "CODE_RUNNER_BASE_URL",
    "CODE_RUNNER_API_KEY",
  ],
  errorReporting: ["ERROR_REPORTING_DSN"],
} as const satisfies Record<IntegrationName, readonly string[]>;

export type { IntegrationName };

const httpUrl = z.url({ protocol: /^https?$/ });
const postgresUrl = z.url({ protocol: /^postgres(ql)?$/ });
const nonEmpty = z.string().min(1);
const limit = (fallback: number, max: number) =>
  z.coerce.number().int().min(1).max(max).default(fallback);

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_BASE_URL: httpUrl.optional(),

  // Providers with an implemented adapter (D-008: Gemini).
  LLM_PROVIDER: z.enum(["gemini"]).optional(),
  /** Deterministic mock AI for local development and tests; refused in production. */
  AI_MOCK_MODE: z.enum(["true", "false"]).optional(),
  /** Kill switch: no AI calls at all (cost or incident control). */
  AI_DISABLED: z.enum(["true", "false"]).optional(),
  /** Show unreviewed draft lessons for local testing; refused in production. */
  ALLOW_DRAFT_CONTENT: z.enum(["true", "false"]).optional(),
  LLM_API_KEY: nonEmpty.optional(),
  LLM_MODEL: z
    .string()
    .regex(/^[a-z0-9][a-z0-9.-]*$/)
    .optional(),
  /** Comma-separated backup models tried when LLM_MODEL is overloaded. */
  LLM_FALLBACK_MODELS: z
    .string()
    .regex(/^[a-z0-9][a-z0-9.-]*(,[a-z0-9][a-z0-9.-]*)*$/)
    .optional(),

  DATABASE_URL: postgresUrl.optional(),
  DATABASE_POOL_MAX: limit(5, 20),
  DATABASE_CONNECT_TIMEOUT_MS: limit(5_000, 30_000),
  DATABASE_STATEMENT_TIMEOUT_MS: limit(5_000, 60_000),

  STT_PROVIDER: nonEmpty.optional(),
  STT_API_KEY: nonEmpty.optional(),
  TTS_PROVIDER: nonEmpty.optional(),
  TTS_API_KEY: nonEmpty.optional(),

  CODE_RUNNER_PROVIDER: nonEmpty.optional(),
  CODE_RUNNER_BASE_URL: httpUrl.optional(),
  CODE_RUNNER_API_KEY: nonEmpty.optional(),

  ERROR_REPORTING_DSN: httpUrl.optional(),

  AI_MAX_REQUESTS_PER_MINUTE: limit(10, 600),
  AI_MAX_CALLS_PER_SESSION: limit(6, 50),
  AI_TIMEOUT_SECONDS: limit(30, 120),
  CODE_RUN_MAX_SECONDS: limit(5, 30),
  CODE_RUN_MAX_OUTPUT_BYTES: limit(65_536, 1_048_576),
});

export type ServerEnv = z.infer<typeof schema>;

export interface EnvProblem {
  variable: string;
  problem: string;
}

export class EnvValidationError extends Error {
  readonly problems: EnvProblem[];

  constructor(problems: EnvProblem[]) {
    super(
      "Invalid server configuration:\n" +
        problems.map((p) => `  - ${p.variable}: ${p.problem}`).join("\n") +
        "\nSee .env.example and README.md (Development setup).",
    );
    this.name = "EnvValidationError";
    this.problems = problems;
  }
}

/** Blank values (e.g. `KEY=` copied from .env.example) count as unset. */
function normalize(source: EnvSource): EnvSource {
  const out: EnvSource = {};
  for (const [key, value] of Object.entries(source)) {
    const trimmed = value?.trim();
    out[key] = trimmed ? trimmed : undefined;
  }
  return out;
}

// Messages are written here rather than taken from zod so that no input value
// can ever be echoed back.
function describeIssue(issue: z.core.$ZodIssue): string {
  switch (issue.code) {
    case "invalid_format":
      return issue.format === "url"
        ? "must be a valid URL with an allowed scheme"
        : "has an invalid format";
    case "invalid_value":
      return "is not one of the allowed values";
    case "too_small":
    case "too_big":
      return "is outside the allowed range";
    case "invalid_type":
      return "must be a whole number";
    default:
      return "is invalid";
  }
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** TLS is required in production unless the database is on the same host. */
function hasRequiredTls(databaseUrl: string): boolean {
  try {
    const url = new URL(databaseUrl);
    if (LOOPBACK_HOSTS.has(url.hostname)) return true;
    // A single-label host (e.g. "cogniflip-db") is a service name on a
    // private container network such as Dokploy/Docker, never the public
    // internet; TLS is required for every other host (D-017).
    if (/^[a-z0-9-]+$/i.test(url.hostname)) return true;
    const mode = url.searchParams.get("sslmode");
    return mode === "require" || mode === "verify-ca" || mode === "verify-full";
  } catch {
    return false; // malformed URLs are reported by the schema
  }
}

export function parseServerEnv(source: EnvSource): ServerEnv {
  const input = normalize(source);
  const problems: EnvProblem[] = [];

  const result = schema.safeParse(input);
  if (!result.success) {
    for (const issue of result.error.issues) {
      problems.push({
        variable: String(issue.path[0] ?? "(unknown)"),
        problem: describeIssue(issue),
      });
    }
  }

  for (const [group, variables] of Object.entries(INTEGRATION_GROUPS)) {
    const set = variables.filter((name) => input[name] !== undefined);
    if (set.length > 0 && set.length < variables.length) {
      for (const name of variables.filter((v) => input[v] === undefined)) {
        problems.push({
          variable: name,
          problem: `is required when the "${group}" integration is partly configured`,
        });
      }
    }
  }

  const isProduction = input.NODE_ENV === "production";
  if (isProduction && input.APP_BASE_URL === undefined) {
    problems.push({
      variable: "APP_BASE_URL",
      problem: "is required in production",
    });
  }
  if (
    isProduction &&
    input.DATABASE_URL &&
    !hasRequiredTls(input.DATABASE_URL)
  ) {
    problems.push({
      variable: "DATABASE_URL",
      problem:
        "must set sslmode=require, verify-ca or verify-full in production",
    });
  }
  if (isProduction && input.AI_MOCK_MODE === "true") {
    problems.push({
      variable: "AI_MOCK_MODE",
      problem: "must not be enabled in production",
    });
  }
  if (isProduction && input.CODE_RUNNER_BASE_URL?.startsWith("http://")) {
    problems.push({
      variable: "CODE_RUNNER_BASE_URL",
      problem: "must use https in production",
    });
  }

  if (problems.length > 0 || !result.success) {
    throw new EnvValidationError(problems);
  }
  return result.data;
}

/** Reads and validates the current process environment. */
export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env);
}

export function isIntegrationConfigured(
  env: ServerEnv,
  name: IntegrationName,
): boolean {
  const values = env as unknown as Record<string, unknown>;
  return INTEGRATION_GROUPS[name].every(
    (variable) => values[variable] !== undefined,
  );
}

/** Current secret values, used only to scrub them from server logs. */
export function currentSecretValues(source: EnvSource = process.env): string[] {
  return SECRET_VARIABLES.map((name) => source[name]?.trim()).filter(
    (value): value is string => typeof value === "string" && value.length >= 8,
  );
}
