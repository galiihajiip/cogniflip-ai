import { getAuthService, sessionCookie } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { assertSameOrigin, clientIp } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import {
  contractResponse,
  withCookie,
  withErrorHandling,
} from "@/server/http/respond";
import { loginRequestSchema, meResponseSchema } from "@/shared/api/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/login { handle, password }; failures are neutral (401). */
export const POST = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  const service = getAuthService(env);
  const { handle, password } = parseInput(
    loginRequestSchema,
    await readJsonBody(request),
  );
  const { user, token } = await service.login(
    handle,
    password,
    clientIp(request),
  );
  return withCookie(
    contractResponse(
      meResponseSchema,
      { user: { handle: user.handle, role: user.role }, correlationId },
      correlationId,
    ),
    sessionCookie(token, env),
  );
});
