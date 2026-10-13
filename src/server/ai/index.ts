import "server-only";
import { isIntegrationConfigured, type ServerEnv } from "@/server/config/env";
import { createDevMockProvider } from "@/server/ai/dev-mock";
import { FallbackProvider } from "@/server/ai/fallback-provider";
import { GeminiProvider } from "@/server/ai/gemini-provider";
import type { AiProvider } from "@/server/ai/provider";
import { FixedWindowLimiter } from "@/server/ai/rate-limit";
import type { GatewayDeps } from "@/server/ai/gateway";

const cache = globalThis as typeof globalThis & {
  cogniflipAi?: { key: string; deps: GatewayDeps };
};

/**
 * The configured provider: the labelled dev mock when AI_MOCK_MODE=true
 * (refused in production by config validation), Gemini when the AI group is
 * configured, otherwise null (callers return PROVIDER_UNAVAILABLE).
 */
export function createAiProvider(env: ServerEnv): AiProvider | null {
  if (env.AI_DISABLED === "true") return null;
  if (env.AI_MOCK_MODE === "true" && env.NODE_ENV !== "production")
    return createDevMockProvider();
  if (isIntegrationConfigured(env, "ai") && env.LLM_PROVIDER === "gemini") {
    const models = [
      env.LLM_MODEL!,
      ...(env.LLM_FALLBACK_MODELS?.split(",") ?? []),
    ].filter((m, i, all) => all.indexOf(m) === i);
    const providers = models.map(
      (m) => new GeminiProvider(env.LLM_API_KEY!, m),
    );
    return providers.length === 1
      ? providers[0]!
      : new FallbackProvider(providers);
  }
  return null;
}

/** Gateway dependencies shared across requests in one server process. */
export function getGatewayDeps(env: ServerEnv): GatewayDeps {
  const key = [
    env.AI_DISABLED,
    env.AI_MOCK_MODE,
    env.LLM_PROVIDER,
    env.LLM_MODEL,
    env.LLM_FALLBACK_MODELS,
    env.AI_MAX_REQUESTS_PER_MINUTE,
    env.AI_TIMEOUT_SECONDS,
  ].join("|");
  if (cache.cogniflipAi?.key !== key) {
    cache.cogniflipAi = {
      key,
      deps: {
        provider: createAiProvider(env),
        limiter: new FixedWindowLimiter(env.AI_MAX_REQUESTS_PER_MINUTE, 60_000),
        timeoutMs: env.AI_TIMEOUT_SECONDS * 1000,
      },
    };
  }
  return cache.cogniflipAi.deps;
}
