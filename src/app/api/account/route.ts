import { clearSessionCookie, requireUser } from "@/server/auth";
import { getServerEnv } from "@/server/config/env";
import { assertSameOrigin } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import {
  jsonResponse,
  withCookie,
  withErrorHandling,
} from "@/server/http/respond";
import { getProfileService } from "@/server/profile";
import { deleteAccountRequestSchema } from "@/shared/api/profile";

export const dynamic = "force-dynamic";

/** DELETE /api/account { password, confirm: "HAPUS" }: deletes the account. */
export const DELETE = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  const user = await requireUser(request, env);
  const { password } = parseInput(
    deleteAccountRequestSchema,
    await readJsonBody(request),
  );
  await getProfileService(env).deleteAccount(user, password);
  return withCookie(
    jsonResponse({ deleted: true, correlationId }, correlationId),
    clearSessionCookie(env),
  );
});
