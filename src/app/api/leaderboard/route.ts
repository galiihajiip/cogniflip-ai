import { getCurrentUser } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { getPool } from "@/server/db/client";
import { parseInput } from "@/server/http/request";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { getRewardService } from "@/server/rewards";
import {
  LEADERBOARD_RULES,
  LeaderboardService,
} from "@/server/rewards/leaderboard";
import {
  leaderboardQuerySchema,
  leaderboardResponseSchema,
} from "@/shared/api/leaderboard";

export const dynamic = "force-dynamic";

/** GET /api/leaderboard?period=weekly|all&limit=&offset= */
export const GET = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  getRewardService(env); // PROVIDER_UNAVAILABLE without a database
  const query = parseInput(
    leaderboardQuerySchema,
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const service = new LeaderboardService(getPool());
  const user = await getCurrentUser(request, env);
  const [page, periodStart, me] = await Promise.all([
    service.page(query.period, query.limit, query.offset),
    service.periodStart(query.period),
    user ? service.me(user.id, query.period) : Promise.resolve(null),
  ]);
  const response = contractResponse(
    leaderboardResponseSchema,
    {
      period: query.period,
      periodStart,
      rules: LEADERBOARD_RULES,
      ...page,
      me,
      correlationId,
    },
    correlationId,
  );
  return response;
});
