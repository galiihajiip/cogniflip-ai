import "server-only";

/**
 * XP and achievement rules, version `xp-rules-v1` (BLOCK 31).
 *
 * Inputs are persisted, server-assessed attempts only; the client never
 * supplies an amount. Rules reward explaining and improving, not time spent,
 * and there are no streaks (docs/03 §8: no manipulative streak pressure).
 * Changing a rule means a new version; existing ledger rows keep their
 * rule_version and are never rewritten.
 */
/** v2 = v1 + mission events (prediction_correct, bug_diagnosed). */
export const XP_RULE_VERSION = "xp-rules-v2";

export const XP_RULES = {
  explanation_assessed: {
    delta: 10,
    description: "Penjelasanmu dinilai untuk pertama kali di sesi ini.",
  },
  strong_explanation: {
    delta: 5,
    description: "Skor penjelasan 80 atau lebih di sesi ini.",
  },
  improved_after_revision: {
    delta: 5,
    description: "Skor naik setelah kamu memperbaiki penjelasan.",
  },
  prediction_correct: {
    delta: 5,
    description: "Tebakan hasil program benar (sekali per misi).",
  },
  bug_diagnosed: {
    delta: 10,
    description: "Kamu menemukan penyebab bug (sekali per misi).",
  },
} as const;
export type XpEventType = keyof typeof XP_RULES;

export const ACHIEVEMENTS = {
  "penjelas-pertama": {
    title: "Penjelas Pertama",
    description: "Menyelesaikan penjelasan pertama yang dinilai.",
  },
  "tiga-pelajaran": {
    title: "Penjelajah Tiga Pelajaran",
    description: "Penjelasanmu dinilai di tiga pelajaran berbeda.",
  },
  "perbaikan-hebat": {
    title: "Perbaikan Hebat",
    description: "Skormu naik setelah memperbaiki penjelasan.",
  },
} as const;
export type AchievementKey = keyof typeof ACHIEVEMENTS;

/** One session's assessed scores in submission order (display totals). */
export interface SessionScores {
  sessionId: string;
  lessonId: string;
  assessedScores: number[];
}

/** First correct attempt of a mission kind (from mission_attempts). */
export interface MissionSuccess {
  missionId: string;
  kind: "predict" | "diagnose";
  attemptId: string;
}

export interface XpAward {
  type: XpEventType;
  source: { kind: "session" | "mission_attempt"; id: string };
  delta: number;
  idempotencyKey: string;
}

/** Deterministic: the same sessions always yield the same awards. */
export function eligibleAwards(
  sessions: readonly SessionScores[],
  missions: readonly MissionSuccess[] = [],
) {
  const xp: XpAward[] = [];
  const award = (type: XpEventType, sessionId: string) =>
    xp.push({
      type,
      source: { kind: "session", id: sessionId },
      delta: XP_RULES[type].delta,
      // Identifies the event, not the rule version: re-deriving with a newer
      // rule version must never award the same event twice.
      idempotencyKey: `${type}:${sessionId}`,
    });

  for (const s of sessions) {
    if (s.assessedScores.length === 0) continue;
    award("explanation_assessed", s.sessionId);
    if (Math.max(...s.assessedScores) >= 80)
      award("strong_explanation", s.sessionId);
    if (s.assessedScores.at(-1)! > s.assessedScores[0])
      award("improved_after_revision", s.sessionId);
  }

  // Missions: once per mission and kind, from the first correct attempt.
  const seenMission = new Set<string>();
  for (const m of missions) {
    const type = m.kind === "predict" ? "prediction_correct" : "bug_diagnosed";
    const key = `${type}:${m.missionId}`;
    if (seenMission.has(key)) continue;
    seenMission.add(key);
    xp.push({
      type,
      source: { kind: "mission_attempt", id: m.attemptId },
      delta: XP_RULES[type].delta,
      idempotencyKey: key,
    });
  }

  const achievements = new Set<AchievementKey>();
  const assessed = sessions.filter((s) => s.assessedScores.length > 0);
  if (assessed.length > 0) achievements.add("penjelas-pertama");
  if (new Set(assessed.map((s) => s.lessonId)).size >= 3)
    achievements.add("tiga-pelajaran");
  if (xp.some((a) => a.type === "improved_after_revision"))
    achievements.add("perbaikan-hebat");

  return { xp, achievements: [...achievements] };
}
