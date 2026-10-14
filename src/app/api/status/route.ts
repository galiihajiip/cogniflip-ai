import { getServerEnv } from "@/server/config/env";
import { checkDatabase } from "@/server/db/health";
import { getAllIntegrationStatuses } from "@/server/integrations/status";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { statusResponseSchema } from "@/shared/api/status";

// Evaluate at request time so the response reflects the runtime environment.
export const dynamic = "force-dynamic";

/**
 * Reports which integrations are usable, as availability and a reason code only.
 * It never returns variable names, values or provider details. The database is
 * checked live, so a configured but unreachable database is not "available".
 */
export const GET = withErrorHandling(async (_request, correlationId) => {
  const env = getServerEnv();
  const integrations = getAllIntegrationStatuses(env);
  if (integrations.database.available) {
    const health = await checkDatabase(env);
    if (health.status !== "ok") {
      integrations.database = { available: false, reason: health.reason };
    }
  }
  return contractResponse(
    statusResponseSchema,
    { status: "ok", integrations, correlationId },
    correlationId,
  );
});
