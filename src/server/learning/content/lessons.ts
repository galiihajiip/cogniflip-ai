import "server-only";
import { CURRICULUM_LESSONS } from "@/server/learning/content/curriculum";
import type { LessonVersion } from "@/server/learning/lesson-schema";

/**
 * First CogniFlip lessons (D-007: grades 4–6, Indonesian "robot command"
 * steps, no programming language yet).
 *
 * Status: drafted by the AI coding assistant on 2026-10-13 and NOT yet
 * reviewed by a human. They stay `draft` until the participant reviews them
 * (docs/implementation/LESSON_REVIEW.md); only then may they be published.
 */

const AI_DRAFT_REVIEW = {
  status: "unreviewed",
  reviewer: "belum direview (draf asisten AI)",
  reviewedOn: "2026-10-13",
  notes:
    "Drafted by the AI coding assistant. Needs participant review of wording, age fit, rubric and answer key before publishing.",
} as const;

const BASE_LESSONS: LessonVersion[] = [
  {
    id: "urutan-instruksi",
    version: 1,
    status: "draft",
    locale: "id-ID",
    gradeBand: { min: 4, max: 6 },
    topic: "sequence",
    difficulty: 1,
    title: "Urutan Instruksi",
    summary: "Komputer menjalankan perintah satu per satu, sesuai urutan.",
    objective: {
      id: "urutan-menentukan-hasil",
      text: "The learner explains that a computer carries out instructions one at a time in the given order, and that changing the order can change the result.",
    },
    prerequisites: [],
    concept: {
      explanation:
        "Program adalah daftar perintah. Komputer membaca perintah dari atas ke bawah dan menjalankannya satu per satu. Komputer tidak menebak maksud kita. Kalau urutan perintahnya diubah, hasilnya bisa ikut berubah.",
      analogy:
        "Seperti memakai kaus kaki dan sepatu. Kaus kaki dulu, baru sepatu. Kalau sepatu dulu, kaus kakinya tidak bisa masuk!",
    },
    example: {
      kind: "conceptual",
      content:
        "Robot ada di petak awal. Perintahnya:\n1. Maju 2 langkah\n2. Belok kanan\n3. Maju 1 langkah\nRobot sampai di bintang.",
      explanation:
        "Robot maju 2 langkah dulu, lalu belok, lalu maju 1 langkah. Kalau perintah 2 dijalankan lebih dulu, robot belok sebelum maju dan sampai di tempat yang berbeda.",
    },
    task: {
      prompt:
        "FlipBot si robot ingin belajar. Jelaskan kepada FlipBot: mengapa urutan perintah itu penting?",
      instructions:
        "Tulis dengan kata-katamu sendiri. Kalau bisa, beri satu contoh.",
    },
    rubric: { rubricId: "urutan-instruksi", version: 1 },
    acceptedEvidence: [
      "States that instructions are carried out one by one / step by step / in order (from top to bottom).",
      "States that swapping or changing the order can change the result, or that the robot/computer ends up somewhere else or does the wrong thing.",
      "Gives a concrete example of order mattering (robot moves, daily routine, recipe, getting dressed).",
    ],
    alternativeExplanations: [
      "Komputer mengerjakan perintah satu-satu dari atas. Kalau ditukar, hasilnya beda.",
      "Kayak resep kue: telurnya harus dikocok dulu baru dipanggang. Kalau dibalik, kuenya gagal.",
      "Robot cuma menurut urutan. Kalau belok dulu baru maju, dia sampai di tempat lain.",
    ],
    misconceptions: [
      {
        id: "urutan-tidak-penting",
        description:
          "Believes the order does not matter as long as all instructions are present.",
        signals: [
          "urutan tidak penting",
          "yang penting semua perintah ada",
          "hasilnya pasti sama",
        ],
      },
      {
        id: "komputer-menebak-maksud",
        description:
          "Believes the computer understands what we mean and fixes the order by itself.",
        signals: [
          "komputer tahu maksud kita",
          "robot akan membetulkan sendiri",
          "komputer pintar jadi tidak masalah",
        ],
      },
      {
        id: "semua-sekaligus",
        description:
          "Believes all instructions run at the same time rather than one after another.",
        signals: ["semua perintah jalan bersamaan", "dijalankan sekaligus"],
      },
    ],
    hints: [
      "Lihat lagi contoh robot tadi. Perintah mana yang dijalankan lebih dulu?",
      "Coba bayangkan perintah 'belok kanan' ditaruh paling atas. Robot akan sampai di mana?",
      "Pikirkan kegiatanmu tiap pagi. Apa yang terjadi kalau urutannya dibalik?",
    ],
    referenceExplanation:
      "Komputer menjalankan perintah satu per satu, mulai dari yang paling atas. Ia tidak menebak maksud kita. Karena itu, kalau urutan perintah diubah, hasilnya juga bisa berubah. Contohnya, robot yang belok dulu baru maju akan sampai di tempat yang berbeda dengan robot yang maju dulu baru belok.",
    review: AI_DRAFT_REVIEW,
  },
  {
    id: "perulangan",
    version: 1,
    status: "draft",
    locale: "id-ID",
    gradeBand: { min: 4, max: 6 },
    topic: "loops",
    difficulty: 1,
    title: "Perulangan",
    summary:
      "Perintah yang sama bisa diulang beberapa kali tanpa ditulis berulang-ulang.",
    objective: {
      id: "perulangan-mengulang-kelompok",
      text: "The learner explains that a loop repeats a group of instructions a set number of times, says what is repeated and how many times, and why that is useful.",
    },
    prerequisites: ["urutan-instruksi"],
    concept: {
      explanation:
        "Kadang kita perlu memberi perintah yang sama berkali-kali. Daripada menulisnya berulang, kita pakai perulangan: 'ulangi 4 kali'. Perintah di dalam perulangan dijalankan lagi dan lagi, sampai jumlahnya tercapai, lalu berhenti.",
      analogy:
        "Seperti guru olahraga yang bilang 'lompat 10 kali'. Guru tidak perlu bilang 'lompat' sepuluh kali satu-satu.",
    },
    example: {
      kind: "conceptual",
      content:
        "Ulangi 4 kali:\n   Maju 1 langkah\n   Belok kanan\nRobot menggambar sebuah persegi.",
      explanation:
        "Dua perintah (maju dan belok kanan) diulang 4 kali. Hasilnya sama seperti menulis 8 perintah, tetapi jauh lebih pendek.",
    },
    task: {
      prompt:
        "Jelaskan kepada FlipBot: apa itu perulangan, dan mengapa perulangan berguna?",
      instructions:
        "Sebutkan apa yang diulang dan berapa kali. Pakai kata-katamu sendiri.",
    },
    rubric: { rubricId: "perulangan", version: 1 },
    acceptedEvidence: [
      "Identifies what is repeated: the group of instructions inside the loop (e.g. 'maju dan belok').",
      "Explains that the repetition happens a fixed number of times and then stops (e.g. 'diulang 4 kali lalu berhenti').",
      "Explains a benefit: shorter program, no need to write the same instruction again, fewer mistakes, or easier to change.",
    ],
    alternativeExplanations: [
      "Perulangan itu mengulang perintah yang sama beberapa kali, jadi kita tidak capek menulisnya lagi.",
      "Maju dan belok diulang 4 kali sampai jadi kotak, habis itu berhenti.",
      "Pakai 'ulangi' supaya programnya pendek dan tidak salah ketik.",
    ],
    misconceptions: [
      {
        id: "ulang-hanya-satu-perintah",
        description:
          "Believes only the first instruction inside the loop is repeated.",
        signals: ["cuma maju yang diulang", "hanya perintah pertama"],
      },
      {
        id: "ulang-tidak-berhenti",
        description:
          "Believes a counted loop repeats forever or until the computer is tired.",
        signals: [
          "diulang terus selamanya",
          "tidak pernah berhenti",
          "sampai komputernya capek",
        ],
      },
      {
        id: "perulangan-sama-dengan-urutan",
        description:
          "Thinks a loop just means listing instructions in order, without repetition.",
        signals: [
          "perulangan itu urutan perintah",
          "menjalankan dari atas ke bawah saja",
        ],
      },
    ],
    hints: [
      "Di contoh tadi, perintah apa saja yang ada di dalam 'ulangi 4 kali'?",
      "Setelah diulang 4 kali, apa yang dilakukan robot?",
      "Coba hitung: tanpa perulangan, berapa perintah yang harus ditulis?",
    ],
    referenceExplanation:
      "Perulangan menjalankan sekelompok perintah berkali-kali sesuai jumlah yang ditentukan, lalu berhenti. Di contoh, 'maju 1 langkah' dan 'belok kanan' diulang 4 kali sehingga robot membuat persegi. Perulangan berguna karena program jadi lebih pendek, kita tidak perlu menulis perintah yang sama berulang-ulang, dan lebih sedikit kesempatan salah.",
    review: AI_DRAFT_REVIEW,
  },
  {
    id: "percabangan",
    version: 1,
    status: "draft",
    locale: "id-ID",
    gradeBand: { min: 4, max: 6 },
    topic: "conditions",
    difficulty: 2,
    title: "Percabangan: Jika ... Maka ...",
    summary: "Program bisa memilih tindakan berdasarkan sebuah kondisi.",
    objective: {
      id: "percabangan-memilih-tindakan",
      text: "The learner explains that a program checks a condition that is either true or false and chooses a different action depending on the answer.",
    },
    prerequisites: ["urutan-instruksi"],
    concept: {
      explanation:
        "Kadang robot harus memilih. Program bisa bertanya: 'Apakah ada tembok di depan?' Jawabannya hanya ya (benar) atau tidak (salah). Kalau ya, robot melakukan satu hal. Kalau tidak, robot melakukan hal lain.",
      analogy:
        "Seperti sebelum berangkat sekolah: jika hujan, maka bawa payung. Jika tidak hujan, tidak perlu payung.",
    },
    example: {
      kind: "conceptual",
      content:
        "Jika ada tembok di depan:\n   Belok kanan\nJika tidak:\n   Maju 1 langkah",
      explanation:
        "Robot memeriksa dulu apakah ada tembok. Kalau ada (benar), ia belok kanan. Kalau tidak ada (salah), ia maju.",
    },
    task: {
      prompt:
        "Jelaskan kepada FlipBot: bagaimana 'jika ... maka ...' membantu robot memilih apa yang dilakukan?",
      instructions:
        "Ceritakan apa yang diperiksa robot dan apa yang terjadi untuk setiap jawaban.",
    },
    rubric: { rubricId: "percabangan", version: 1 },
    acceptedEvidence: [
      "Explains that a condition/question is checked and its answer is yes/no (true/false).",
      "Explains that a different action happens depending on that answer (one action if yes, another if no).",
      "Gives a concrete example with both a condition and an action (robot and wall, rain and umbrella, etc.).",
    ],
    alternativeExplanations: [
      "Robot bertanya dulu, ada tembok atau tidak. Kalau ada dia belok, kalau tidak ada dia jalan terus.",
      "Jika hujan maka bawa payung, kalau tidak ya tidak bawa. Program juga begitu, milih sesuai keadaan.",
      "Kondisinya bisa benar atau salah, terus programnya pilih jalan yang cocok.",
    ],
    misconceptions: [
      {
        id: "kedua-cabang-dijalankan",
        description:
          "Believes both the 'if' and the 'else' actions run every time.",
        signals: [
          "dua-duanya dijalankan",
          "belok lalu maju juga",
          "semua dijalankan",
        ],
      },
      {
        id: "kondisi-dipilih-acak",
        description:
          "Believes the program picks an action randomly or as it likes, not based on the condition.",
        signals: [
          "robot memilih sesukanya",
          "dipilih acak",
          "terserah robotnya",
        ],
      },
      {
        id: "kondisi-hanya-sekali-selamanya",
        description:
          "Believes once the condition is checked, the same choice is always made in future.",
        signals: ["sekali dicek selamanya sama", "tidak perlu dicek lagi"],
      },
    ],
    hints: [
      "Apa yang ditanyakan robot sebelum bergerak?",
      "Jawaban pertanyaan itu bisa apa saja? Ada berapa kemungkinan?",
      "Kalau tidak ada tembok, perintah mana yang dijalankan?",
    ],
    referenceExplanation:
      "Percabangan membuat program memeriksa sebuah kondisi, misalnya 'apakah ada tembok di depan?'. Jawabannya benar atau salah. Jika benar, program menjalankan satu tindakan (belok kanan); jika salah, program menjalankan tindakan lain (maju). Hanya satu cabang yang dijalankan setiap kali kondisi diperiksa.",
    review: AI_DRAFT_REVIEW,
  },
];

/** Robot-command basics followed by the multi-language curriculum (D-015). */
export const LESSONS: LessonVersion[] = [
  ...BASE_LESSONS,
  ...CURRICULUM_LESSONS,
];
