import "server-only";
import { getGatewayDeps } from "@/server/ai";
import {
  getServerEnv,
  isIntegrationConfigured,
  type ServerEnv,
} from "@/server/config/env";
import { getPool } from "@/server/db/client";
import {
  InMemoryMissionStore,
  MissionService,
  PostgresMissionStore,
} from "@/server/missions/service";

const globalForMissions = globalThis as typeof globalThis & {
  cogniflipMissions?: { persistent: boolean; service: MissionService };
};

/** PostgreSQL store when the database is configured, memory otherwise. */
export function getMissionService(env: ServerEnv): MissionService {
  const persistent = isIntegrationConfigured(env, "database");
  if (globalForMissions.cogniflipMissions?.persistent !== persistent) {
    const store = persistent
      ? new PostgresMissionStore(getPool())
      : new InMemoryMissionStore();
    globalForMissions.cogniflipMissions = {
      persistent,
      service: new MissionService(store, () => getGatewayDeps(getServerEnv())),
    };
  }
  return globalForMissions.cogniflipMissions.service;
}
