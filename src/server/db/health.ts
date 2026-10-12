import "server-only";
import type pg from "pg";
import { isIntegrationConfigured, type ServerEnv } from "@/server/config/env";
import { createPool } from "@/server/db/client";
import { logServerEvent } from "@/server/log/logger";

export type DatabaseHealth =
  | { status: "ok"; latencyMs: number }
  | { status: "unavailable"; reason: "not_configured" | "unreachable" };

/**
 * Live connectivity check (`select 1`). Returns a status and reason only;
 * connection details and driver messages go to the redacted server log.
 */
export async function checkDatabase(
  env: ServerEnv,
  makePool: (env: ServerEnv) => pg.Pool = createPool,
): Promise<DatabaseHealth> {
  if (!isIntegrationConfigured(env, "database")) {
    return { status: "unavailable", reason: "not_configured" };
  }
  const pool = makePool(env);
  const started = performance.now();
  try {
    await pool.query("select 1");
    return {
      status: "ok",
      latencyMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    logServerEvent("warn", "db_health_unreachable", { error });
    return { status: "unavailable", reason: "unreachable" };
  } finally {
    await pool.end().catch(() => {});
  }
}
