import { getGatewayDeps } from "@/server/ai";
import { getServerEnv } from "@/server/config/env";
import { reviewCode } from "@/server/code/review";
import { AppError } from "@/server/http/errors";
import { assertSameOrigin, clientIp } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import {
  requesterOwnerHash,
  requesterRateKey,
} from "@/server/learning/service";
import {
  codeReviewRequestSchema,
  codeReviewResponseSchema,
} from "@/shared/api/code";

export const dynamic = "force-dynamic";

/**
 * POST /api/code/review { language, code, goal?, framework?, versions?, context? }
 * AI-only review (no code is executed). The code is never logged.
 */
export const POST = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  // 24 KiB body: up to 20 KiB of code plus small context fields.
  const input = parseInput(
    codeReviewRequestSchema,
    await readJsonBody(request, 24 * 1024),
  );
  const ownerHash = await requesterOwnerHash(request, env);
  const owner = ownerHash
    ? await requesterRateKey(request, env, ownerHash)
    : `ip:${clientIp(request)}`;
  const result = await reviewCode(getGatewayDeps(env), {
    ...input,
    rateLimitKey: owner,
  });
  if (!result.ok)
    throw new AppError(result.code, "code review failed", {
      details: result.retryAfterSeconds
        ? { retryAfterSeconds: result.retryAfterSeconds }
        : undefined,
    });
  return contractResponse(
    codeReviewResponseSchema,
    { ...result.value, correlationId },
    correlationId,
  );
});
