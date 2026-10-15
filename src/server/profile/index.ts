import "server-only";
import { isIntegrationConfigured, type ServerEnv } from "@/server/config/env";
import { getPool } from "@/server/db/client";
import { AppError } from "@/server/http/errors";
import { ProfileService } from "@/server/profile/service";

export function getProfileService(env: ServerEnv): ProfileService {
  if (isIntegrationConfigured(env, "database")) {
    return new ProfileService(getPool());
  }
  return {
    async getProfile(userId: string) {
      return {
        handle: "demo",
        avatarKey: "bot-default",
        leaderboardOptIn: true,
      };
    },
    async updateProfile() {},
    async deleteAccount() {},
    async exportData() {
      return {
        user: { handle: "demo", role: "learner" },
        profile: { avatarKey: "bot-default", leaderboardOptIn: true },
        sessions: [],
        missionAttempts: [],
        xpEvents: [],
      };
    },
  } as unknown as ProfileService;
}
