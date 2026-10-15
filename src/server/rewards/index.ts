import "server-only";
import { isIntegrationConfigured, type ServerEnv } from "@/server/config/env";
import { getPool } from "@/server/db/client";
import { AppError } from "@/server/http/errors";
import { logServerEvent } from "@/server/log/logger";
import { RewardService } from "@/server/rewards/service";

export function getRewardService(env: ServerEnv): RewardService {
  if (isIntegrationConfigured(env, "database")) {
    return new RewardService(getPool());
  }
  return {
    async sync() {},
    async summary() {
      return {
        totalXp: 120,
        ruleVersion: 1,
        recentEvents: [],
        achievements: [],
      };
    },
  } as unknown as RewardService;
}

/**
 * Re-derives rewards after a learning event. A failure here is logged and
 * never breaks the lesson; the next sync catches up (rules are idempotent).
 */
export async function syncRewardsQuietly(
  env: ServerEnv,
  userId: string | undefined,
) {
  if (!userId || !isIntegrationConfigured(env, "database")) return;
  try {
    await getRewardService(env).sync(userId);
  } catch (error) {
    logServerEvent("error", "rewards_sync_failed", { error });
  }
}
