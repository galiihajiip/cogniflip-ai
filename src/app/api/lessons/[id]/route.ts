import { getServerEnv } from "@/server/config/env";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import { toLessonDetail } from "@/server/learning/dto";
import { getLearnerLesson } from "@/server/learning/service";
import { lessonDetailResponseSchema } from "@/shared/api/learning";
import { slugSchema } from "@/shared/schemas/primitives";
import { parseInput } from "@/server/http/request";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/lessons/:id: concept, analogy, example and task (no answer key). */
export const GET = withErrorHandling<Ctx>(
  async (_request, correlationId, { params }) => {
    const id = parseInput(slugSchema, (await params).id);
    return contractResponse(
      lessonDetailResponseSchema,
      {
        lesson: toLessonDetail(getLearnerLesson(getServerEnv(), id)),
        correlationId,
      },
      correlationId,
    );
  },
);
