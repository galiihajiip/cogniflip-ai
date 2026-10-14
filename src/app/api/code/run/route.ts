import { getServerEnv } from "@/server/config/env";
import { resolveLanguage } from "@/server/code/capabilities";
import { DEFAULT_LIMITS, executionService } from "@/server/code/execution";
import { assertSameOrigin } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import { jsonResponse, withErrorHandling } from "@/server/http/respond";
import { codeRunRequestSchema } from "@/shared/api/code";

export const dynamic = "force-dynamic";

/**
 * POST /api/code/run { language, code, stdin? }
 * Execution is disabled until an isolated runner is verified (ADR-003), so
 * this returns UNSUPPORTED_TOOLCHAIN (422) and never runs anything. AI review
 * remains available at /api/code/review.
 */
export const POST = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  const input = parseInput(
    codeRunRequestSchema,
    await readJsonBody(request, 24 * 1024),
  );
  const language = resolveLanguage(input.language);
  const result = await executionService.run(
    {
      language: language.id,
      files: [{ path: "main", content: input.code }],
      stdin: input.stdin,
      limits: DEFAULT_LIMITS,
    },
    request.signal,
  );
  return jsonResponse({ result, correlationId }, correlationId);
});
