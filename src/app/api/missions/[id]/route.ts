import { getServerEnv } from "@/server/config/env";
import { parseInput } from "@/server/http/request";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { getMission, toMissionView } from "@/server/missions/service";
import { missionResponseSchema } from "@/shared/api/missions";
import { slugSchema } from "@/shared/schemas/primitives";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/missions/:id */
export const GET = withErrorHandling<Ctx>(
  async (_request, correlationId, { params }) => {
    const id = parseInput(slugSchema, (await params).id);
    return contractResponse(
      missionResponseSchema,
      { mission: toMissionView(getMission(getServerEnv(), id)), correlationId },
      correlationId,
    );
  },
);
