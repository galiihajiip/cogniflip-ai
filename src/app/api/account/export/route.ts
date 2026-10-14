import { requireUser } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { jsonResponse, withErrorHandling } from "@/server/http/respond";
import { getProfileService } from "@/server/profile";

export const dynamic = "force-dynamic";

/** GET /api/account/export: the signed-in learner's stored data as JSON. */
export const GET = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  const user = await requireUser(request, env);
  const data = await getProfileService(env).export(user);
  const response = jsonResponse({ ...data, correlationId }, correlationId);
  response.headers.set(
    "content-disposition",
    'attachment; filename="cogniflip-data.json"',
  );
  return response;
});
