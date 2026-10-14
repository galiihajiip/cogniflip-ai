import { getRubric } from "@/server/assessment/content";
import { getServerEnv } from "@/server/config/env";
import { FixedWindowLimiter } from "@/server/ai/rate-limit";
import { AppError } from "@/server/http/errors";
import { assertSameOrigin, clientIp } from "@/server/http/guest";
import { parseInput, readJsonBody } from "@/server/http/request";
import {
  contractResponse,
  withCookie,
  withErrorHandling,
} from "@/server/http/respond";
import { getLessonCatalog } from "@/server/learning/content";
import {
  getLearnerLesson,
  getTutor,
  requesterForCreate,
} from "@/server/learning/service";
import { toLearnerView } from "@/server/learning/session/view";
import {
  createSessionRequestSchema,
  sessionResponseSchema,
} from "@/shared/api/learning";

export const dynamic = "force-dynamic";

// Session creation per client IP (per server instance; see rate-limit.ts).
const createLimiter = new FixedWindowLimiter(20, 60_000);

/** POST /api/sessions { lessonId }: starts a tutor session for this guest. */
export const POST = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  assertSameOrigin(request, env);
  const limit = createLimiter.check(clientIp(request));
  if (!limit.allowed)
    throw new AppError("RATE_LIMITED", "too many sessions", {
      details: { retryAfterSeconds: limit.retryAfterSeconds },
    });

  const { lessonId } = parseInput(
    createSessionRequestSchema,
    await readJsonBody(request),
  );
  const lesson = getLearnerLesson(env, lessonId);
  const rubric = getRubric(lesson.rubric.rubricId, lesson.rubric.version);
  if (!rubric) throw new AppError("INTERNAL_ERROR", "lesson rubric missing");

  const identity = await requesterForCreate(request, env);
  const session = await getTutor(env).engine.start(
    lesson,
    rubric,
    getLessonCatalog().contentHash(lesson),
    identity.keyHash,
    identity.userId,
  );
  return withCookie(
    contractResponse(
      sessionResponseSchema,
      { session: toLearnerView(session, lesson, rubric), correlationId },
      correlationId,
      201,
    ),
    identity.setCookie,
  );
});
