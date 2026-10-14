import { getServerEnv } from "@/server/config/env";
import { getHistoryService } from "@/server/history";
import { AppError } from "@/server/http/errors";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import {
  listLearnerLessons,
  requesterOwnerHash,
} from "@/server/learning/service";
import { progressResponseSchema } from "@/shared/api/history";

export const dynamic = "force-dynamic";

/** GET /api/progress: per-lesson progress from stored assessments + a rule-based next step. */
export const GET = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  const service = getHistoryService(env);
  const owner = await requesterOwnerHash(request, env);
  if (!owner) throw new AppError("UNAUTHENTICATED", "no learner identity");
  const result = await service.progress(owner, listLearnerLessons(env));
  return contractResponse(
    progressResponseSchema,
    { ...result, correlationId },
    correlationId,
  );
});
