import {
  clearSessionCookie,
  getAuthService,
  sessionToken,
} from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { assertSameOrigin } from "@/server/http/guest";
import {
  contractResponse,
  withCookie,
  withErrorHandling,
} from "@/server/http/respond";
import { meResponseSchema } from "@/shared/api/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout: revokes the session and clears the cookie. */
export const POST = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  await getAuthService(env).logout(sessionToken(request));
  return withCookie(
    contractResponse(
      meResponseSchema,
      { user: null, correlationId },
      correlationId,
    ),
    clearSessionCookie(env),
  );
});
