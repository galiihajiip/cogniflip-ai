import "server-only";
import type { Rubric } from "@/server/assessment/rubric-schema";
import type { LessonVersion } from "@/server/learning/lesson-schema";
import {
  SESSION_LIMITS,
  compareAttempts,
  countedAttempts,
} from "@/server/learning/session/engine";
import type { TutorSession } from "@/server/learning/session/types";

/**
 * What the learner may see. Internal evaluator fields (rationales,
 * misconception ids, model names, prompt versions) are never included. The
 * full reference explanation appears only when the session is completed.
 */
export function toLearnerView(
  session: TutorSession,
  lesson: LessonVersion,
  rubric: Rubric,
) {
  const labels = new Map(rubric.criteria.map((c) => [c.key, c.learnerLabel]));
  const used = countedAttempts(session);
  const latestMode = [...session.attempts]
    .reverse()
    .find((a) => a.result && a.result.status !== "error");
  const mockMode =
    latestMode?.result && latestMode.result.status !== "error"
      ? latestMode.result.evaluator.mode === "mock"
      : false;

  return {
    sessionId: session.id,
    version: session.version,
    state: session.state,
    lesson: { id: lesson.id, version: lesson.version, title: lesson.title },
    attemptsUsed: used,
    attemptsLeft: Math.max(0, SESSION_LIMITS.maxCountedAttempts - used),
    canRevise:
      session.state === "assessed" && used < SESSION_LIMITS.maxCountedAttempts,
    /** True when answers were judged by the development mock, not real AI. */
    mockMode,
    attempts: session.attempts.map((a) => ({
      number: a.number,
      kind: a.kind,
      answer: a.answer,
      outcome:
        a.result === null
          ? { status: "evaluating" as const }
          : a.result.status === "assessed"
            ? {
                status: "assessed" as const,
                total: a.result.score.displayTotal,
                possible: a.result.score.possible,
                criteria: a.result.score.criteria.map((c) => ({
                  label: labels.get(c.criterionKey) ?? c.criterionKey,
                  level: c.level,
                  earned: c.earned,
                  possible: c.possible,
                })),
                hint: a.result.hint,
              }
            : a.result.status === "needs_clarification"
              ? {
                  status: "needs_clarification" as const,
                  question: a.result.question,
                }
              : {
                  status: "error" as const,
                  code: a.result.code,
                  retryable: a.result.retryable,
                },
    })),
    comparison: compareAttempts(session),
    referenceExplanation:
      session.state === "completed" ? lesson.referenceExplanation : null,
  };
}
