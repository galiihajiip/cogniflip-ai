import { getServerEnv } from "@/server/config/env";
import { getHistoryService } from "@/server/history";
import { AppError } from "@/server/http/errors";
import { parseInput } from "@/server/http/request";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { requesterOwnerHash } from "@/server/learning/service";
import { LESSONS } from "@/server/learning/content/lessons";
import { historyResponseSchema } from "@/shared/api/history";
import { paginationQuerySchema } from "@/shared/schemas/pagination";

export const dynamic = "force-dynamic";

/** GET /api/history?limit=&cursor=: the requester's own sessions, newest first. */
export const GET = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  const query = parseInput(
    paginationQuerySchema,
    Object.fromEntries(new URL(request.url).searchParams),
  );
  const service = getHistoryService(env);
  const owner = await requesterOwnerHash(request, env);
  if (!owner) throw new AppError("UNAUTHENTICATED", "no learner identity");
  const titles = new Map(LESSONS.map((l) => [l.id, l.title]));
  const page = await service.history(owner, query.limit, query.cursor, titles);
  return contractResponse(
    historyResponseSchema,
    { ...page, correlationId },
    correlationId,
  );
});
