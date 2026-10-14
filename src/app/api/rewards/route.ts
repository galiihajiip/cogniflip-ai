import { requireUser } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { getRewardService } from "@/server/rewards";
import { rewardsResponseSchema } from "@/shared/api/rewards";

export const dynamic = "force-dynamic";

/** GET /api/rewards: the signed-in learner's XP, recent awards and achievements. */
export const GET = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  const user = await requireUser(request, env);
  const service = getRewardService(env);
  await service.sync(user.id);
  const summary = await service.summary(user.id);
  return contractResponse(
    rewardsResponseSchema,
    { ...summary, correlationId },
    correlationId,
  );
});
