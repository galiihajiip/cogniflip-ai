import { getServerEnv } from "@/server/config/env";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { listMissions, toMissionView } from "@/server/missions/service";
import { missionListResponseSchema } from "@/shared/api/missions";

export const dynamic = "force-dynamic";

/** GET /api/missions: Predict-before-Run and Debug Robot missions (no answers). */
export const GET = withErrorHandling((_request, correlationId) =>
  contractResponse(
    missionListResponseSchema,
    {
      missions: listMissions(getServerEnv()).map(toMissionView),
      correlationId,
    },
    correlationId,
  ),
);
