import "server-only";
import type { GatewayErrorCode } from "@/server/ai/gateway";
import type { Level } from "@/server/assessment/rubric-schema";
import type { LearningScore } from "@/server/assessment/scoring";

/** Reverse Tutor session states (BLOCK 18). */
export const SESSION_STATES = [
  "lesson_chosen",
  "concept_viewed",
  "awaiting_explanation",
  "evaluating",
  "needs_clarification",
  "assessed",
  "awaiting_revision",
  "reassessing",
  "completed",
  "recoverable_error",
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

export type AttemptKind = "initial" | "clarification" | "revision";

export type AttemptResult =
  | {
      status: "assessed";
      score: LearningScore;
      hint: string;
      misconceptionIds: string[];
      evaluator: {
        mode: "live" | "mock";
        model: string;
        promptVersion: string;
      };
    }
  | {
      status: "needs_clarification";
      targetCriterion: string;
      question: string;
      evaluator: {
        mode: "live" | "mock";
        model: string;
        promptVersion: string;
      };
    }
  | { status: "error"; code: GatewayErrorCode; retryable: boolean };

export interface Attempt {
  number: number;
  kind: AttemptKind;
  /** Exactly what the learner submitted in this attempt (never overwritten). */
  answer: string;
  /** Text the evaluator judged (initial answer + clarification reply). */
  evaluatedText: string;
  idempotencyKey: string;
  submittedAt: string;
  result: AttemptResult | null;
}

export interface TutorSession {
  id: string;
  /**
   * SHA-256 of the owner's credential (guest cookie key or, later, user id).
   * Only the owner may read or change the session.
   */
  ownerKeyHash: string;
  /** Set when a signed-in user owns the session (history follows the account). */
  ownerUserId?: string;
  /** Content captured when the session starts; never changes afterwards. */
  lesson: { id: string; version: number; contentHash: string };
  rubric: { id: string; version: number };
  state: SessionState;
  /** Kind of the submission being evaluated or awaited after an error. */
  pending: AttemptKind | null;
  attempts: Attempt[];
  /** Clarification questions used in the current answer cycle. */
  clarificationsInCycle: number;
  /** AI evaluation calls made in this session (gateway attempts). */
  aiCalls: number;
  /** Optimistic-concurrency version; every change increments it. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CriterionChange {
  criterionKey: string;
  from: Level;
  to: Level;
}
