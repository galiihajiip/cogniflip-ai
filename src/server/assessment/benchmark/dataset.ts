import "server-only";
import {
  ANSWER_FIXTURES,
  type AnswerKind,
  type ExpectedAssessment,
} from "@/server/assessment/benchmark/answers";

/**
 * Versioned benchmark dataset (BLOCK 15). Synthetic answers only; no real
 * learner data. Labels are `proposed` (AI-drafted) until the participant
 * reviews them; reports always state that.
 */
export const BENCHMARK_VERSION = "bench-v1";

export type BenchmarkKind =
  AnswerKind | "paraphrase" | "long_valid" | "empty" | "too_long";

export type BenchmarkExpected =
  | ExpectedAssessment
  /** Input validation rejects it; the model must never be called. */
  | { status: "rejected_before_model" };

export interface BenchmarkItem {
  id: string;
  lessonId: string;
  kind: BenchmarkKind;
  answer: string;
  expected: BenchmarkExpected;
  rationale: string;
  labelStatus: "proposed" | "reviewed";
}

const filler =
  "Hari ini aku bangun pagi, sarapan nasi, lalu berangkat sekolah naik sepeda bersama kakak. Di kelas kami belajar banyak hal. ";

const EXTRA_ITEMS: BenchmarkItem[] = [
  {
    id: "urutan-08-paraphrase",
    lessonId: "urutan-instruksi",
    kind: "paraphrase",
    answer:
      "robotnya ngikutin perintah 1 1 dari yg paling atas, kl dibalik nanti nyasar",
    expected: {
      status: "assessed",
      ratings: {
        "satu-per-satu": "tepat",
        "urutan-mengubah-hasil": "tepat",
        contoh: "belum_terlihat",
      },
      misconceptionIds: [],
    },
    rationale:
      "Informal spelling and abbreviations, but states one-by-one from the top and that reversing makes the robot end up in the wrong place ('nyasar'). Must not be failed for spelling.",
    labelStatus: "proposed",
  },
  {
    id: "perulangan-08-paraphrase",
    lessonId: "perulangan",
    kind: "paraphrase",
    answer:
      "jd perintahnya gak usah ditulis berkali2, cukup bilang ulangi 4x buat maju sm belok trs selesai",
    expected: {
      status: "assessed",
      ratings: {
        "apa-yang-diulang": "tepat",
        "berapa-kali-berhenti": "tepat",
        manfaat: "tepat",
      },
      misconceptionIds: [],
    },
    rationale:
      "Names the repeated pair (maju sm belok), the count and stopping (4x ... selesai), and the benefit (tidak ditulis berkali-kali), in informal language.",
    labelStatus: "proposed",
  },
  {
    id: "percabangan-08-paraphrase",
    lessonId: "percabangan",
    kind: "paraphrase",
    answer:
      "robot liat dulu ada tembok gak. klo iya belok klo ngga jalan lurus",
    expected: {
      status: "assessed",
      ratings: {
        "kondisi-benar-salah": "tepat",
        "tindakan-berbeda": "tepat",
        contoh: "tepat",
      },
      misconceptionIds: [],
    },
    rationale:
      "Yes/no check ('ada tembok gak', 'iya'/'ngga'), both branches, robot/wall example; informal spelling only.",
    labelStatus: "proposed",
  },
  {
    id: "urutan-09-long-valid",
    lessonId: "urutan-instruksi",
    kind: "long_valid",
    answer:
      filler.repeat(12) +
      "Komputer menjalankan perintah satu-satu dari atas. Kalau urutannya ditukar, hasilnya beda.",
    expected: {
      status: "assessed",
      ratings: {
        "satu-per-satu": "tepat",
        "urutan-mengubah-hasil": "tepat",
        contoh: "belum_terlihat",
      },
      misconceptionIds: [],
    },
    rationale:
      "Long, mostly irrelevant text (within the 2,000-character limit) ending with the same correct statement as the concise answer; the filler must neither help nor hurt.",
    labelStatus: "proposed",
  },
  {
    id: "urutan-10-empty",
    lessonId: "urutan-instruksi",
    kind: "empty",
    answer: "   ",
    expected: { status: "rejected_before_model" },
    rationale:
      "Whitespace only; input validation rejects it before any model call.",
    labelStatus: "proposed",
  },
  {
    id: "urutan-11-too-long",
    lessonId: "urutan-instruksi",
    kind: "too_long",
    answer: "a".repeat(2_001),
    expected: { status: "rejected_before_model" },
    rationale:
      "Over the 2,000-character explanation limit; rejected before any model call.",
    labelStatus: "proposed",
  },
];

export const BENCHMARK_ITEMS: BenchmarkItem[] = [
  ...ANSWER_FIXTURES,
  ...EXTRA_ITEMS,
];
