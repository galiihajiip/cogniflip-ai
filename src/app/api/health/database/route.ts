import { getServerEnv } from "@/server/config/env";
import { checkDatabase } from "@/server/db/health";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { databaseHealthResponseSchema } from "@/shared/api/status";

export const dynamic = "force-dynamic";

/** 200 when `select 1` succeeds, otherwise 503 with a reason code only. */
export const GET = withErrorHandling(async (_request, correlationId) => {
  const health = await checkDatabase(getServerEnv());
  return contractResponse(
    databaseHealthResponseSchema,
    { ...health, correlationId },
    correlationId,
    health.status === "ok" ? 200 : 503,
  );
});
