import { getAuthService, sessionCookie } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { assertSameOrigin, clientIp } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import {
  contractResponse,
  withCookie,
  withErrorHandling,
} from "@/server/http/respond";
import { credentialsRequestSchema, meResponseSchema } from "@/shared/api/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/register { handle, password } → signed in (201). */
export const POST = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  const service = getAuthService(env);
  const { handle, password } = parseInput(
    credentialsRequestSchema,
    await readJsonBody(request),
  );
  const { user, token } = await service.register(
    handle,
    password,
    clientIp(request),
  );
  return withCookie(
    contractResponse(
      meResponseSchema,
      { user: { handle: user.handle, role: user.role }, correlationId },
      correlationId,
      201,
    ),
    sessionCookie(token, env),
  );
});
