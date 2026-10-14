import type { z } from "zod";
import type { sessionViewSchema } from "@/shared/api/learning";

/**
 * Pure view-model helpers for the learner UI (unit-tested in
 * tests/unit/ui-view.test.ts). No React, no fetch.
 */

export type SessionView = z.infer<typeof sessionViewSchema>;
type Attempt = SessionView["attempts"][number];
type Outcome = Attempt["outcome"];
export type AssessedOutcome = Extract<Outcome, { status: "assessed" }>;

export function ringOffset(
  total: number,
  possible: number,
  circumference: number,
): number {
  if (possible <= 0) return circumference;
  const ratio = Math.min(Math.max(total / possible, 0), 1);
  return circumference * (1 - ratio);
}

export const LEVEL_LABEL = {
  tepat: "Tepat",
  sebagian: "Sebagian",
  belum_terlihat: "Belum terlihat",
} as const;

/** Colour is never the only signal: every level also has a label and icon. */
export const LEVEL_STYLE = {
  tepat: { tone: "tertiary", icon: "check_circle" },
  sebagian: { tone: "secondary", icon: "tips_and_updates" },
  belum_terlihat: { tone: "primary", icon: "help" },
} as const;

/**
 * Which Stitch screen the teach-the-robot flow shows for a session:
 * - `start` ST-06a, `clarify` ST-06b/06c, `evaluating` ST-06d,
 * - `result` ST-07, `needs_more` ST-07a, `error` ST-07b,
 * - `revise` ST-08, `done` completion.
 * `prepare` means the concept/begin actions still have to run.
 */
export type TeachPhase =
  | "prepare"
  | "start"
  | "clarify"
  | "evaluating"
  | "result"
  | "needs_more"
  | "error"
  | "revise"
  | "done";

export function latestAttempt(session: SessionView): Attempt | undefined {
  return session.attempts[session.attempts.length - 1];
}

export function latestAssessed(
  session: SessionView,
): { attempt: Attempt; outcome: AssessedOutcome } | undefined {
  for (let i = session.attempts.length - 1; i >= 0; i--) {
    const attempt = session.attempts[i]!;
    if (attempt.outcome.status === "assessed")
      return { attempt, outcome: attempt.outcome };
  }
  return undefined;
}

export function teachPhase(session: SessionView): TeachPhase {
  switch (session.state) {
    case "lesson_chosen":
    case "concept_viewed":
      return "prepare";
    case "awaiting_explanation":
      return "start";
    case "evaluating":
    case "reassessing":
      return "evaluating";
    case "needs_clarification":
      return "clarify";
    case "assessed":
      return "result";
    case "recoverable_error":
      return "error";
    case "completed":
      return "done";
    case "awaiting_revision":
      // After the clarification budget is used the learner rewrites with
      // guidance (ST-07a); after a scored attempt it is a revision (ST-08).
      return latestAttempt(session)?.outcome.status === "needs_clarification"
        ? "needs_more"
        : "revise";
  }
}

/** Answers written since the last scored attempt (what the learner is extending). */
export function currentCycleText(session: SessionView): string {
  let start = 0;
  session.attempts.forEach((a, i) => {
    if (a.outcome.status === "assessed") start = i + 1;
  });
  return session.attempts
    .slice(start)
    .filter((a) => a.outcome.status !== "error")
    .map((a) => a.answer)
    .join(" ");
}

/** The text a retry after a provider error should resend. */
export function pendingAnswer(session: SessionView): string {
  const last = latestAttempt(session);
  return last && last.outcome.status === "error" ? last.answer : "";
}

export function criterionKeyLabel(key: string): string {
  const text = key.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export const AVATAR_LABEL: Record<string, string> = {
  "robot-biru": "Robot biru",
  "robot-hijau": "Robot hijau",
  kucing: "Kucing",
  "burung-hantu": "Burung hantu",
  roket: "Roket",
  bintang: "Bintang",
};

export const AVATAR_ICON: Record<string, string> = {
  "robot-biru": "smart_toy",
  "robot-hijau": "smart_toy",
  kucing: "sentiment_satisfied",
  "burung-hantu": "school",
  roket: "rocket_launch",
  bintang: "star",
};

export const TOPIC_LABEL: Record<string, string> = {
  sequence: "Urutan",
  loops: "Perulangan",
  conditions: "Percabangan",
  events: "Event",
  variables: "Variabel",
  debugging: "Debugging",
  output: "Menampilkan",
  "data-types": "Tipe Data",
  strings: "Teks",
  operators: "Operator",
  collections: "Kumpulan Data",
  functions: "Fungsi",
  objects: "Objek",
  errors: "Error",
  "web-structure": "Struktur Web",
  "web-content": "Isi Web",
  forms: "Formulir",
  styling: "Gaya",
  layout: "Tata Letak",
  responsive: "Responsif",
  queries: "Query",
  filtering: "Menyaring",
  aggregation: "Merangkum",
  joins: "Menggabungkan",
  dom: "DOM",
  modules: "Modul",
};

export const LEVEL_NAME: Record<number, string> = {
  1: "Dasar",
  2: "Menengah",
  3: "Lanjutan",
};

/** File name and label for a lesson's code example. */
export const LANGUAGE_FILE: Record<string, { file: string; label: string }> = {
  python: { file: "contoh.py", label: "Python" },
  javascript: { file: "contoh.js", label: "JavaScript" },
  html: { file: "index.html", label: "HTML" },
  css: { file: "gaya.css", label: "CSS" },
  sql: { file: "query.sql", label: "SQL" },
  java: { file: "Main.java", label: "Java" },
  cpp: { file: "main.cpp", label: "C++" },
};

export function topicLabel(topic: string): string {
  return TOPIC_LABEL[topic] ?? topic.charAt(0).toUpperCase() + topic.slice(1);
}
