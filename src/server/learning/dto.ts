import "server-only";
import type { LessonVersion } from "@/server/learning/lesson-schema";

/** Learner-safe lesson fields: no answer key, evidence list or misconceptions. */
export function toLessonSummary(lesson: LessonVersion) {
  return {
    id: lesson.id,
    version: lesson.version,
    title: lesson.title,
    summary: lesson.summary,
    topic: lesson.topic,
    difficulty: lesson.difficulty,
    prerequisites: lesson.prerequisites,
    draft: lesson.status !== "published",
  };
}

export function toLessonDetail(lesson: LessonVersion) {
  return {
    ...toLessonSummary(lesson),
    objective: lesson.summary,
    concept: lesson.concept,
    example: lesson.example,
    task: lesson.task,
  };
}
