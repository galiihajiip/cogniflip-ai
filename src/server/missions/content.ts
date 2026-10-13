import "server-only";

/**
 * Coding missions (BLOCK 40–41). Short Python 3 snippets for grades 4–6
 * (D-007). Expected outputs and bug answer keys are checked in the test
 * suite by running each snippet with a real CPython interpreter on the
 * development machine (tests/unit/missions.test.ts). The app itself never
 * runs code: learners compare against these reviewed fixtures.
 *
 * Status: drafted by the AI coding assistant on 2026-10-13; wording and
 * pedagogy are NOT yet human-reviewed, so missions stay `draft`.
 */

export interface PredictMission {
  kind: "predict";
  id: string;
  version: number;
  status: "draft" | "published";
  topic: "sequence" | "loops" | "conditions";
  title: string;
  objective: string;
  language: "python";
  languageVersion: "3";
  code: string;
  expectedOutput: string;
  /** Shown after the prediction is checked. */
  explanation: string;
  /** Shown only after a wrong prediction (one targeted hint). */
  hint: string;
}

export interface DebugMission {
  kind: "debug";
  id: string;
  version: number;
  status: "draft" | "published";
  topic: "sequence" | "loops" | "conditions";
  difficulty: 1 | 2 | 3;
  title: string;
  objective: string;
  language: "python";
  languageVersion: "3";
  /** What the program is supposed to do (shown to the learner). */
  intendedBehavior: string;
  intendedOutput: string;
  buggyCode: string;
  /** Answer key: never sent to the learner before they finish. */
  answerKey: {
    /** Reviewer-facing description (English). */
    bug: string;
    /** Learner-facing explanation, shown only after solving or 3 tries. */
    explanation: string;
    acceptedDescriptions: string[];
    fixedCode: string;
  };
  /** Progressive hints, one at a time. */
  hints: string[];
}

export type Mission = PredictMission | DebugMission;

export const PREDICT_MISSIONS: PredictMission[] = [
  {
    kind: "predict",
    id: "tebak-urutan-pagi",
    version: 1,
    status: "draft",
    topic: "sequence",
    title: "Tebak: Kegiatan Pagi",
    objective: "Predicts that print statements run from top to bottom.",
    language: "python",
    languageVersion: "3",
    code: 'print("Bangun")\nprint("Mandi")\nprint("Sarapan")',
    expectedOutput: "Bangun\nMandi\nSarapan",
    explanation:
      "Komputer menjalankan baris dari atas ke bawah, jadi yang tercetak juga berurutan.",
    hint: "Baris mana yang dijalankan pertama?",
  },
  {
    kind: "predict",
    id: "tebak-ulang-lompat",
    version: 1,
    status: "draft",
    topic: "loops",
    title: "Tebak: Lompat Tiga Kali",
    objective:
      "Predicts that a loop body runs a fixed number of times, then the code after it runs once.",
    language: "python",
    languageVersion: "3",
    code: 'for i in range(3):\n    print("Lompat!")\nprint("Selesai")',
    expectedOutput: "Lompat!\nLompat!\nLompat!\nSelesai",
    explanation:
      '"Lompat!" ada di dalam perulangan, jadi dicetak 3 kali. "Selesai" ada di luar, jadi hanya sekali.',
    hint: "Baris mana yang menjorok ke dalam? Hanya baris itu yang diulang.",
  },
  {
    kind: "predict",
    id: "tebak-ulang-bintang",
    version: 1,
    status: "draft",
    topic: "loops",
    title: "Tebak: Tangga Bintang",
    objective:
      "Predicts how a value that grows inside a loop changes each time.",
    language: "python",
    languageVersion: "3",
    code: 'bintang = ""\nfor i in range(4):\n    bintang = bintang + "*"\n    print(bintang)',
    expectedOutput: "*\n**\n***\n****",
    explanation:
      "Setiap putaran, satu bintang ditambahkan, lalu semua bintang dicetak.",
    hint: "Berapa bintang setelah putaran pertama? Setelah putaran kedua?",
  },
  {
    kind: "predict",
    id: "tebak-cabang-hujan",
    version: 1,
    status: "draft",
    topic: "conditions",
    title: "Tebak: Hujan atau Tidak",
    objective: "Predicts that only the branch matching the condition runs.",
    language: "python",
    languageVersion: "3",
    code: 'hujan = True\nif hujan:\n    print("Bawa payung")\nelse:\n    print("Pakai topi")',
    expectedOutput: "Bawa payung",
    explanation:
      "Kondisinya benar (hujan = True), jadi hanya cabang pertama yang dijalankan.",
    hint: "Apakah hujan bernilai benar atau salah?",
  },
];

export const DEBUG_MISSIONS: DebugMission[] = [
  {
    kind: "debug",
    id: "robot-debug-hitung",
    version: 1,
    status: "draft",
    topic: "loops",
    difficulty: 1,
    title: "Robot Debug: Menghitung 1 sampai 5",
    objective: "Identifies that range(5) starts at 0 and stops before 5.",
    language: "python",
    languageVersion: "3",
    intendedBehavior: "Program ini seharusnya mencetak angka 1 sampai 5.",
    intendedOutput: "1\n2\n3\n4\n5",
    buggyCode: "for angka in range(5):\n    print(angka)",
    answerKey: {
      bug: "range(5) produces 0,1,2,3,4: it starts at 0 and stops before 5, so 0 is printed and 5 is missing.",
      explanation:
        "range(5) mulai dari 0 dan berhenti sebelum 5, jadi yang tercetak 0 sampai 4. Pakai range(1, 6) agar mulai dari 1 sampai 5.",
      acceptedDescriptions: [
        "Mulainya dari 0, bukan 1.",
        "Angka 5 tidak dicetak karena range berhenti sebelum 5.",
        "Harusnya range(1, 6).",
      ],
      fixedCode: "for angka in range(1, 6):\n    print(angka)",
    },
    hints: [
      "Coba bayangkan: angka pertama yang dicetak itu berapa?",
      "range(5) memberi 5 angka. Angka berapa saja?",
      "Bagaimana caranya agar mulai dari 1 dan berhenti di 5?",
    ],
  },
  {
    kind: "debug",
    id: "robot-debug-lulus",
    version: 1,
    status: "draft",
    topic: "conditions",
    difficulty: 2,
    title: "Robot Debug: Nilai 70 Harus Lulus",
    objective:
      "Identifies that > excludes the boundary value and >= is needed.",
    language: "python",
    languageVersion: "3",
    intendedBehavior: 'Nilai 70 atau lebih seharusnya mencetak "Lulus".',
    intendedOutput: "Lulus",
    buggyCode:
      'nilai = 70\nif nilai > 70:\n    print("Lulus")\nelse:\n    print("Coba lagi")',
    answerKey: {
      bug: "The condition uses > 70, so exactly 70 is treated as failing; it should be >= 70.",
      explanation:
        'Tanda > berarti "lebih dari", jadi 70 tidak termasuk. Pakai >= ("lebih dari atau sama dengan") agar 70 lulus.',
      acceptedDescriptions: [
        "Tandanya harus lebih dari atau sama dengan (>=), bukan lebih dari.",
        "70 tidak lebih dari 70, jadi masuk ke 'Coba lagi'.",
      ],
      fixedCode:
        'nilai = 70\nif nilai >= 70:\n    print("Lulus")\nelse:\n    print("Coba lagi")',
    },
    hints: [
      "Apakah 70 lebih besar dari 70?",
      "Lihat tanda perbandingannya. Apakah nilai yang sama ikut dihitung?",
    ],
  },
  {
    kind: "debug",
    id: "robot-debug-nama",
    version: 1,
    status: "draft",
    topic: "sequence",
    difficulty: 1,
    title: "Robot Debug: Nama yang Belum Ada",
    objective:
      "Identifies that a value must be set before it is used (order matters).",
    language: "python",
    languageVersion: "3",
    intendedBehavior: "Program ini seharusnya mencetak nama robot: FlipBot.",
    intendedOutput: "FlipBot",
    buggyCode: 'print(nama)\nnama = "FlipBot"',
    answerKey: {
      bug: "nama is used before it is assigned, so Python raises a NameError; the two lines must be swapped.",
      explanation:
        "Komputer membaca dari atas. Saat print(nama) dijalankan, nama belum diisi. Tukar urutannya: isi nama dulu, baru cetak.",
      acceptedDescriptions: [
        "nama dipakai sebelum diisi.",
        'Urutannya terbalik, baris nama = "FlipBot" harus di atas.',
      ],
      fixedCode: 'nama = "FlipBot"\nprint(nama)',
    },
    hints: [
      "Saat baris pertama dijalankan, apakah komputer sudah tahu isi nama?",
      "Ingat pelajaran urutan: mana yang harus duluan?",
    ],
  },
];

export const MISSIONS: Mission[] = [...PREDICT_MISSIONS, ...DEBUG_MISSIONS];
