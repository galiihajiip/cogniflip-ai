import "server-only";
import { getRubric } from "@/server/assessment/content";
import { AppError } from "@/server/http/errors";
import { getLessonCatalog } from "@/server/learning/content";
import type { TutorSession } from "@/server/learning/session/types";

/** The exact lesson and rubric versions a session captured at start. */
export function resolveSessionContent(session: TutorSession) {
  const lesson = getLessonCatalog().getVersion(
    session.lesson.id,
    session.lesson.version,
  );
  const rubric = getRubric(session.rubric.id, session.rubric.version);
  if (!lesson || !rubric)
    throw new AppError("INTERNAL_ERROR", "session content missing");
  return { lesson, rubric };
}
