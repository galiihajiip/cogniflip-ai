import "server-only";
import { isIntegrationConfigured, type ServerEnv } from "@/server/config/env";
import { getPool } from "@/server/db/client";
import { HistoryService } from "@/server/history/service";
import { AppError } from "@/server/http/errors";

/** History needs stored sessions; without a database it is unavailable. */
export function getHistoryService(env: ServerEnv): HistoryService {
  if (!isIntegrationConfigured(env, "database"))
    throw new AppError("PROVIDER_UNAVAILABLE", "history needs a database", {
      details: { integration: "database" },
    });
  return new HistoryService(getPool());
}
