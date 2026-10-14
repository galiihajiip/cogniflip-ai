import { getServerEnv } from "@/server/config/env";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { toLessonSummary } from "@/server/learning/dto";
import { listLearnerLessons } from "@/server/learning/service";
import { lessonListResponseSchema } from "@/shared/api/learning";

export const dynamic = "force-dynamic";

/** GET /api/lessons: lessons a learner may open (published only in production). */
export const GET = withErrorHandling((_request, correlationId) =>
  contractResponse(
    lessonListResponseSchema,
    {
      lessons: listLearnerLessons(getServerEnv()).map(toLessonSummary),
      correlationId,
    },
    correlationId,
  ),
);
