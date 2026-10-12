import "server-only";
import { isIntegrationConfigured, type ServerEnv } from "@/server/config/env";
import { getPool } from "@/server/db/client";
import { AppError } from "@/server/http/errors";
import { ProfileService } from "@/server/profile/service";

export function getProfileService(env: ServerEnv): ProfileService {
  if (!isIntegrationConfigured(env, "database"))
    throw new AppError("PROVIDER_UNAVAILABLE", "profiles need a database", {
      details: { integration: "database" },
    });
  return new ProfileService(getPool());
}
