import "server-only";
import { currentSecretValues } from "@/server/config/env";
import { redact } from "@/server/log/redact";

type Level = "info" | "warn" | "error";

/**
 * Server-only structured logger. Every entry is redacted (sensitive keys,
 * token patterns and current secret values) before it is written. Do not log
 * learner answers, source code or audio here by default (docs/19).
 */
export function logServerEvent(
  level: Level,
  event: string,
  fields: Record<string, unknown> = {},
) {
  const entry = redact(
    { level, event, time: new Date().toISOString(), ...fields },
    currentSecretValues(),
  );
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
