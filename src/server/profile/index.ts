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
    async getOwn(user: { id: string; handle: string }) {
      return {
        handle: user.handle,
        avatarKey: "bot-default",
        leaderboardOptIn: true,
        preferences: {},
      };
    },
    async update(user: { id: string; handle: string }, patch: any) {
      return {
        handle: user.handle,
        avatarKey: patch.avatarKey ?? "bot-default",
        leaderboardOptIn: patch.leaderboardOptIn ?? true,
        preferences: patch.preferences ?? {},
      };
    },
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
