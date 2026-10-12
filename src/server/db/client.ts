import "server-only";
import pg from "pg";
import {
  getServerEnv,
  isIntegrationConfigured,
  type ServerEnv,
} from "@/server/config/env";
import { AppError } from "@/server/http/errors";
import { logServerEvent } from "@/server/log/logger";

/**
 * Server-only PostgreSQL pool. The connection string never leaves this module:
 * it is not logged, returned or exposed to client code.
 */

const globalForDb = globalThis as typeof globalThis & {
  cogniflipPool?: pg.Pool;
};

export function createPool(env: ServerEnv): pg.Pool {
  if (!isIntegrationConfigured(env, "database") || !env.DATABASE_URL) {
    throw new AppError("PROVIDER_UNAVAILABLE", "Database is not configured", {
      details: { integration: "database" },
    });
  }
  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    connectionTimeoutMillis: env.DATABASE_CONNECT_TIMEOUT_MS,
    statement_timeout: env.DATABASE_STATEMENT_TIMEOUT_MS,
    idle_in_transaction_session_timeout: env.DATABASE_STATEMENT_TIMEOUT_MS,
    application_name: "cogniflip",
  });
  // Idle-client errors would otherwise crash the process.
  pool.on("error", (error) => {
    logServerEvent("error", "db_pool_error", { error });
  });
  return pool;
}

/** Shared pool for request handlers (reused across dev hot reloads). */
export function getPool(): pg.Pool {
  globalForDb.cogniflipPool ??= createPool(getServerEnv());
  return globalForDb.cogniflipPool;
}
