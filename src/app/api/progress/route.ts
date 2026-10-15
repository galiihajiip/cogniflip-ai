import { getServerEnv, isIntegrationConfigured } from "@/server/config/env";
import { getHistoryService } from "@/server/history";
import { AppError } from "@/server/http/errors";
import { contractResponse, withErrorHandling } from "@/server/http/respond";
import {
  listLearnerLessons,
  requesterOwnerHash,
} from "@/server/learning/service";
import { progressResponseSchema } from "@/shared/api/history";

export const dynamic = "force-dynamic";

/** GET /api/progress: per-lesson progress from stored assessments + a rule-based next step. */
export const GET = withErrorHandling(async (request, correlationId) => {
  const env = getServerEnv();
  const lessons = listLearnerLessons(env);
  if (!isIntegrationConfigured(env, "database")) {
    const items = lessons.map((l) => ({
      lessonId: l.id,
      title: l.title,
      sessions: 0,
      assessedAttempts: 0,
      bestScore: null,
      latestScore: null,
    }));
    return contractResponse(
      progressResponseSchema,
      {
        lessons: items,
        recommendation: {
          lessonId: items[0]?.lessonId ?? "urutan-instruksi",
          title: items[0]?.title ?? "Urutan Instruksi",
          kind: "start",
          rule: "Jalur awal belajar",
        },
        correlationId,
      },
      correlationId,
    );
  }
  const service = getHistoryService(env);
  const owner = await requesterOwnerHash(request, env);
  if (!owner) throw new AppError("UNAUTHENTICATED", "no learner identity");
  const result = await service.progress(owner, lessons);
  return contractResponse(
    progressResponseSchema,
    { ...result, correlationId },
    correlationId,
  );
});
