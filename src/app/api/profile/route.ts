import { requireUser } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { assertSameOrigin } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { getProfileService } from "@/server/profile";
import {
  ownProfileResponseSchema,
  profileUpdateSchema,
} from "@/shared/api/profile";

export const dynamic = "force-dynamic";

/** GET /api/profile: the signed-in learner's own profile. */
export const GET = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  const user = await requireUser(request, env);
  const profile = await getProfileService(env).getOwn(user);
  return contractResponse(
    ownProfileResponseSchema,
    { profile, correlationId },
    correlationId,
  );
});

/** PATCH /api/profile { avatarKey?, leaderboardOptIn?, preferences? } */
export const PATCH = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  const user = await requireUser(request, env);
  const update = parseInput(profileUpdateSchema, await readJsonBody(request));
  const profile = await getProfileService(env).update(user, update);
  return contractResponse(
    ownProfileResponseSchema,
    { profile, correlationId },
    correlationId,
  );
});
