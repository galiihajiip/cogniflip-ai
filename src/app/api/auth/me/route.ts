import { getCurrentUser } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { meResponseSchema } from "@/shared/api/auth";

export const dynamic = "force-dynamic";

/** GET /api/auth/me: the signed-in user's public fields, or null. */
export const GET = withErrorHandling(async (request, correlationId) => {
  const user = await getCurrentUser(request, getServerEnv());
  return contractResponse(
    meResponseSchema,
    {
      user: user ? { handle: user.handle, role: user.role } : null,
      correlationId,
    },
    correlationId,
  );
});
