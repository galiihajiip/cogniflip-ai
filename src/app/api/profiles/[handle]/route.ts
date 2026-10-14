import { getServerEnv } from "@/server/config/env";
import { parseInput } from "@/server/http/request";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { getProfileService } from "@/server/profile";
import { handleSchema } from "@/shared/api/auth";
import { publicProfileResponseSchema } from "@/shared/api/profile";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ handle: string }> };

/** GET /api/profiles/:handle: handle + avatar, only if the learner opted in. */
export const GET = withErrorHandling<Ctx>(
  async (_request, correlationId, { params }) => {
    const handle = parseInput(handleSchema, (await params).handle);
    const profile = await getProfileService(getServerEnv()).getPublic(handle);
    return contractResponse(
      publicProfileResponseSchema,
      { profile, correlationId },
      correlationId,
    );
  },
);
