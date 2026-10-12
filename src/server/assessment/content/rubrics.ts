import "server-only";
import { CURRICULUM_RUBRICS } from "@/server/learning/content/curriculum";
import type { RubricInput } from "@/server/assessment/rubric-schema";

/**
 * Rubric content for the first lessons (D-007: 100 points; levels
 * belum_terlihat / sebagian / tepat = 0 / 50 / 100 % of a criterion's weight).
 * Validated by rubricSchema (src/server/assessment/rubric-schema.ts).
 *
 * Drafted by the AI coding assistant on 2026-10-13; NOT yet human-reviewed.
 */

const AI_DRAFT_REVIEW = {
  status: "unreviewed",
  reviewer: "belum direview (draf asisten AI)",
  reviewedOn: "2026-10-13",
  notes:
    "Weights and level descriptions need participant review before the rubric is published.",
} as const;

const BASE_RUBRICS: RubricInput[] = [
  {
    id: "urutan-instruksi",
    version: 1,
    status: "draft",
    lessonId: "urutan-instruksi",
    totalPoints: 100,
    criteria: [
      {
        key: "satu-per-satu",
        label: "Instructions run one at a time, in order",
        learnerLabel: "Perintah dijalankan satu per satu",
        weight: 40,
        evidenceRequired:
          "An explicit statement that instructions are executed step by step / in sequence / from top to bottom.",
        levels: {
          belum_terlihat: "No mention of step-by-step execution.",
          sebagian:
            "Mentions order or steps vaguely (e.g. 'harus urut') without saying they are carried out one after another.",
          tepat:
            "Clearly says instructions are carried out one by one in the given order.",
        },
        feedback: {
          belum_terlihat:
            "Coba ceritakan bagaimana robot membaca perintah: sekaligus atau satu per satu?",
          sebagian:
            "Kamu sudah menyebut urutan. Tambahkan: komputer mengerjakannya satu per satu.",
          tepat: "Tepat! Komputer memang mengerjakan perintah satu per satu.",
        },
        misconceptionIds: ["semua-sekaligus"],
      },
      {
        key: "urutan-mengubah-hasil",
        label: "Changing the order can change the result",
        learnerLabel: "Urutan berubah, hasil bisa berubah",
        weight: 40,
        evidenceRequired:
          "States that swapping/changing the order leads to a different or wrong result.",
        levels: {
          belum_terlihat:
            "No link between order and result, or claims order does not matter.",
          sebagian:
            "Says order is important but does not say what happens when it changes.",
          tepat:
            "Says that a different order can give a different or wrong result.",
        },
        feedback: {
          belum_terlihat:
            "Bayangkan dua perintah ditukar. Apakah robot tetap sampai di tempat yang sama?",
          sebagian:
            "Kamu bilang urutan penting. Apa yang terjadi kalau urutannya ditukar?",
          tepat: "Bagus! Kalau urutan berubah, hasilnya memang bisa berubah.",
        },
        misconceptionIds: ["urutan-tidak-penting", "komputer-menebak-maksud"],
      },
      {
        key: "contoh",
        label: "Concrete example",
        learnerLabel: "Memberi contoh",
        weight: 20,
        evidenceRequired:
          "A concrete situation where order matters (robot moves, routine, recipe, clothes).",
        levels: {
          belum_terlihat: "No example.",
          sebagian:
            "An example is named but order does not visibly matter in it.",
          tepat:
            "An example in which changing the order clearly changes the result.",
        },
        feedback: {
          belum_terlihat:
            "Coba tambahkan satu contoh dari kegiatanmu sehari-hari.",
          sebagian:
            "Contohmu bagus. Tunjukkan apa yang terjadi kalau urutannya dibalik.",
          tepat: "Contohmu jelas sekali!",
        },
        misconceptionIds: [],
      },
    ],
    review: AI_DRAFT_REVIEW,
  },
  {
    id: "perulangan",
    version: 1,
    status: "draft",
    lessonId: "perulangan",
    totalPoints: 100,
    criteria: [
      {
        key: "apa-yang-diulang",
        label: "Identifies the repeated group of instructions",
        learnerLabel: "Apa yang diulang",
        weight: 40,
        evidenceRequired:
          "Says that the instruction(s) inside the loop are what gets repeated.",
        levels: {
          belum_terlihat:
            "Does not say what is repeated, or claims only part of the group (e.g. only the first instruction) is repeated.",
          sebagian:
            "Says instructions ('perintah') are repeated in general, without naming the group.",
          tepat:
            "Names the repeated group (e.g. maju dan belok kanan) or clearly describes it.",
        },
        feedback: {
          belum_terlihat: "Perintah apa saja yang ada di dalam 'ulangi'?",
          sebagian:
            "Hampir! Apakah hanya satu perintah yang diulang, atau semuanya?",
          tepat: "Benar, semua perintah di dalam perulangan diulang.",
        },
        misconceptionIds: [
          "ulang-hanya-satu-perintah",
          "perulangan-sama-dengan-urutan",
        ],
      },
      {
        key: "berapa-kali-berhenti",
        label: "Repeats a set number of times, then stops",
        learnerLabel: "Berapa kali dan kapan berhenti",
        weight: 30,
        evidenceRequired:
          "Mentions the count (e.g. 4 kali / beberapa kali sesuai jumlah) and that it stops afterwards.",
        levels: {
          belum_terlihat: "No count/stop, or claims it repeats forever.",
          sebagian:
            "Mentions repetition count or 'beberapa kali' but not that it stops.",
          tepat: "Says it repeats a set number of times and then stops.",
        },
        feedback: {
          belum_terlihat:
            "Berapa kali perintahnya diulang? Lalu apa yang terjadi?",
          sebagian:
            "Kamu menyebut jumlahnya. Setelah itu, apakah robot terus mengulang?",
          tepat: "Tepat, diulang sesuai jumlahnya lalu berhenti.",
        },
        misconceptionIds: ["ulang-tidak-berhenti"],
      },
      {
        key: "manfaat",
        label: "Explains why loops are useful",
        learnerLabel: "Mengapa berguna",
        weight: 30,
        evidenceRequired:
          "Gives a benefit: shorter program, no rewriting, fewer mistakes, easier to change.",
        levels: {
          belum_terlihat: "No benefit given.",
          sebagian:
            "A vague benefit ('lebih bagus', 'lebih mudah') without saying why.",
          tepat:
            "A concrete benefit such as a shorter program or not writing the same thing again.",
        },
        feedback: {
          belum_terlihat:
            "Bandingkan: menulis 8 perintah atau memakai 'ulangi 4 kali'. Mana yang lebih enak?",
          sebagian: "Lebih mudah karena apa? Coba sebutkan alasannya.",
          tepat:
            "Betul, programnya jadi lebih pendek dan tidak perlu menulis ulang.",
        },
        misconceptionIds: [],
      },
    ],
    review: AI_DRAFT_REVIEW,
  },
  {
    id: "percabangan",
    version: 1,
    status: "draft",
    lessonId: "percabangan",
    totalPoints: 100,
    criteria: [
      {
        key: "kondisi-benar-salah",
        label: "A condition is checked with a yes/no (true/false) answer",
        learnerLabel: "Memeriksa kondisi: ya atau tidak",
        weight: 40,
        evidenceRequired:
          "Says the program checks/asks something whose answer is yes/no or true/false.",
        levels: {
          belum_terlihat: "No condition or check is mentioned.",
          sebagian:
            "Mentions checking or 'jika' without the yes/no nature of the answer.",
          tepat:
            "Describes checking a condition that is either true (ya) or false (tidak).",
        },
        feedback: {
          belum_terlihat: "Apa yang ditanyakan robot sebelum memilih?",
          sebagian:
            "Jawaban pertanyaan itu bisa apa saja? Ada berapa kemungkinan?",
          tepat: "Tepat, kondisinya hanya bisa benar atau salah.",
        },
        misconceptionIds: ["kondisi-dipilih-acak"],
      },
      {
        key: "tindakan-berbeda",
        label: "Different action depending on the answer",
        learnerLabel: "Tindakan berbeda untuk tiap jawaban",
        weight: 40,
        evidenceRequired:
          "Says one action happens when the condition is true and another (or none) when it is false.",
        levels: {
          belum_terlihat:
            "No link between the answer and the action, or says both actions always run.",
          sebagian: "Describes only the 'yes' branch.",
          tepat:
            "Describes what happens for both answers (or that only the matching branch runs).",
        },
        feedback: {
          belum_terlihat:
            "Kalau jawabannya 'ya', robot melakukan apa? Kalau 'tidak'?",
          sebagian:
            "Kamu sudah menjelaskan saat 'ya'. Bagaimana kalau 'tidak'?",
          tepat: "Bagus! Setiap jawaban punya tindakannya sendiri.",
        },
        misconceptionIds: [
          "kedua-cabang-dijalankan",
          "kondisi-hanya-sekali-selamanya",
        ],
      },
      {
        key: "contoh",
        label: "Concrete example with a condition and an action",
        learnerLabel: "Memberi contoh",
        weight: 20,
        evidenceRequired:
          "An example containing both a condition and the resulting action (wall/turn, rain/umbrella).",
        levels: {
          belum_terlihat: "No example.",
          sebagian:
            "An example with a condition but no action, or an action but no condition.",
          tepat: "An example with both a condition and its action.",
        },
        feedback: {
          belum_terlihat:
            "Coba beri contoh 'jika ... maka ...' dari kehidupanmu.",
          sebagian: "Lengkapi contohmu: jika apa, maka melakukan apa?",
          tepat: "Contohmu lengkap!",
        },
        misconceptionIds: [],
      },
    ],
    review: AI_DRAFT_REVIEW,
  },
];

export const RUBRICS: RubricInput[] = [...BASE_RUBRICS, ...CURRICULUM_RUBRICS];
