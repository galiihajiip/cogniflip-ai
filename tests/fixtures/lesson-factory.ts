import type { LessonVersion } from "@/server/learning/lesson-schema";

/** Minimal synthetic lesson for model tests (not real curriculum content). */
export function makeLesson(
  overrides: Partial<LessonVersion> = {},
): LessonVersion {
  return {
    id: "contoh-urutan",
    version: 1,
    status: "published",
    locale: "id-ID",
    gradeBand: { min: 4, max: 6 },
    topic: "sequence",
    difficulty: 1,
    title: "Contoh urutan",
    summary: "Fixture pelajaran untuk pengujian.",
    objective: {
      id: "urutan-penting",
      text: "Learner explains that instruction order changes the result.",
    },
    prerequisites: [],
    concept: {
      explanation: "Instruksi dijalankan satu per satu dari atas ke bawah.",
      analogy: "Seperti memakai kaus kaki sebelum sepatu.",
    },
    example: {
      kind: "conceptual",
      content: "1. Maju\n2. Belok kanan",
      explanation: "Robot maju dulu, lalu belok.",
    },
    task: {
      prompt: "Jelaskan mengapa urutan penting.",
      instructions: "Tulis dengan kata-katamu sendiri.",
    },
    rubric: { rubricId: "contoh-urutan", version: 1 },
    acceptedEvidence: ["Mentions that changing order changes the result."],
    alternativeExplanations: ["Kalau urutannya ditukar, hasilnya beda."],
    misconceptions: [
      {
        id: "urutan-bebas",
        description: "Believes order does not matter.",
        signals: ["urutan tidak penting"],
      },
    ],
    hints: ["Apa yang terjadi kalau langkahnya ditukar?"],
    referenceExplanation: "Komputer menjalankan instruksi berurutan.",
    review: {
      status: "reviewed",
      reviewer: "fixture",
      reviewedOn: "2026-10-13",
      notes: "Synthetic test fixture.",
    },
    ...overrides,
  };
}
