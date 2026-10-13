import "server-only";
import type { TrackSpec } from "@/server/learning/content/curriculum/builder";

/** JavaScript track (topic order referenced from the W3Schools JS tutorial). */
export const JAVASCRIPT_TRACK: TrackSpec = {
  id: "jalur-javascript",
  title: "JavaScript",
  description:
    "Bahasa yang membuat halaman web hidup. Dari console.log sampai objek, error, dan DOM.",
  lessons: [
    {
      id: "js-output",
      topic: "output",
      difficulty: 1,
      title: "JavaScript 1: Menampilkan dengan console.log()",
      summary: "console.log() menampilkan nilai ke konsol.",
      objective:
        "The learner explains that console.log() prints values to the console, one line per call, and that expressions are evaluated first.",
      concept:
        "Di JavaScript, console.log() menampilkan nilai ke konsol, tempat programmer melihat hasil program. Teks diapit tanda kutip. Hitungan di dalam kurung dikerjakan dulu, lalu hasilnya ditampilkan. Setiap console.log() menampilkan satu baris.",
      analogy:
        "console.log() seperti buku catatan rahasia programmer: kita menulis di sana untuk melihat apa yang sedang terjadi di dalam program.",
      example: {
        language: "javascript",
        code: 'console.log("Halo dari JavaScript!");\nconsole.log(6 * 7);',
        output: "Halo dari JavaScript!\n42",
        explanation:
          "Baris pertama menampilkan teks. Baris kedua menghitung 6 * 7 dulu, lalu menampilkan 42.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa yang dilakukan console.log(), dan mengapa baris kedua menampilkan 42?",
      instructions: "Bandingkan isi console.log yang berkutip dan yang tidak.",
      criteria: [
        {
          key: "menampilkan",
          label: "console.log() shows a value",
          learner: "console.log() menampilkan nilai",
          weight: 40,
          evidence:
            "States console.log() displays what is inside the parentheses.",
          ask: "Ke mana console.log() menampilkan isinya?",
        },
        {
          key: "dihitung-dulu",
          label: "Expressions are evaluated first",
          learner: "Hitungan dikerjakan dulu",
          weight: 35,
          evidence: "Explains 6 * 7 is calculated to 42 before being shown.",
          ask: "Kenapa yang tampil 42, bukan 6 * 7?",
        },
        {
          key: "baris",
          label: "One line per call",
          learner: "Satu baris per console.log",
          weight: 25,
          evidence: "Mentions each console.log() call prints on its own line.",
          ask: "Ada berapa baris hasil, dan kenapa?",
        },
      ],
      misconceptions: [
        {
          id: "tampil-di-halaman",
          description: "Believes console.log() writes on the web page itself.",
          signals: ["muncul di halaman", "tampil di website"],
        },
      ],
      hints: ["Lihat mana yang memakai tanda kutip.", "Apa hasil 6 kali 7?"],
      reference:
        "console.log() menampilkan nilai ke konsol, satu baris setiap kali dipanggil. Teks berkutip ditampilkan apa adanya, sedangkan 6 * 7 dihitung dulu menjadi 42 lalu ditampilkan.",
      alternatives: [
        "console.log buat nampilin di konsol. 6*7 diitung dulu jadi 42",
      ],
    },
    {
      id: "js-variabel",
      topic: "variables",
      difficulty: 1,
      title: "JavaScript 2: Variabel dengan let dan const",
      summary: "let untuk nilai yang bisa berubah, const untuk nilai tetap.",
      objective:
        "The learner explains that let and const create variables, let can be reassigned, and const cannot.",
      concept:
        "Variabel menyimpan nilai dengan sebuah nama. let membuat variabel yang nilainya boleh diganti. const membuat variabel yang nilainya tetap; jika diganti, JavaScript akan memberi error. Gunakan const untuk nilai yang tidak berubah.",
      analogy:
        "let seperti papan tulis yang boleh dihapus dan ditulis ulang. const seperti prasasti batu: sekali ditulis, tidak bisa diubah.",
      example: {
        language: "javascript",
        code: 'let skor = 10;\nskor = skor + 5;\nconst nama = "FlipBot";\nconsole.log(nama + " punya skor " + skor);',
        output: "FlipBot punya skor 15",
        explanation:
          "skor dibuat dengan let, jadi boleh diganti dari 10 menjadi 15. nama dibuat dengan const dan tidak diubah. + menyambung teks dengan angka.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa beda let dan const, dan mengapa skor menjadi 15?",
      instructions: "Ceritakan kapan sebaiknya memakai const.",
      criteria: [
        {
          key: "menyimpan",
          label: "Variables store values",
          learner: "Variabel menyimpan nilai",
          weight: 30,
          evidence: "States a variable is a named place that stores a value.",
          ask: "Apa yang disimpan skor dan nama?",
        },
        {
          key: "let-berubah",
          label: "let can be reassigned",
          learner: "let boleh berubah",
          weight: 35,
          evidence: "Explains let allows skor to change from 10 to 15.",
          ask: "Bagaimana skor bisa menjadi 15?",
        },
        {
          key: "const-tetap",
          label: "const cannot be reassigned",
          learner: "const tetap",
          weight: 35,
          evidence:
            "Explains const values cannot be reassigned (error if you try).",
          ask: "Apa yang terjadi kalau nama diganti?",
          misconceptions: ["const-boleh"],
        },
      ],
      misconceptions: [
        {
          id: "const-boleh",
          description: "Believes const can be reassigned like let.",
          signals: ["const juga bisa diganti", "sama saja"],
        },
      ],
      hints: [
        'Coba bayangkan menulis nama = "Robi" setelahnya.',
        "skor = skor + 5 memakai nilai lama skor.",
      ],
      reference:
        "let dan const sama-sama membuat variabel. Nilai let boleh diganti, jadi skor bisa berubah dari 10 menjadi 15. Nilai const tetap; mengganti nama akan menimbulkan error, sehingga const cocok untuk nilai yang tidak berubah.",
      alternatives: [
        "let boleh diganti makanya skor jadi 15, const ga boleh diganti",
      ],
    },
    {
      id: "js-tipe-data",
      topic: "data-types",
      difficulty: 1,
      title: "JavaScript 3: Tipe Data dan typeof",
      summary: "Nilai punya tipe: number, string, boolean, dan lainnya.",
      objective:
        "The learner explains that values have types, typeof reports them, and + adds numbers but joins strings.",
      concept:
        "Setiap nilai di JavaScript punya tipe: number (angka), string (teks), boolean (true/false), dan lainnya. typeof memberi tahu tipenya. Hati-hati: + pada angka menjumlahkan, tetapi jika salah satunya teks, + menyambungnya.",
      analogy:
        "Tipe data seperti label pada toples: toples 'gula' dan toples 'garam' terlihat mirip, tapi isinya bekerja berbeda.",
      example: {
        language: "javascript",
        code: 'console.log(typeof 5);\nconsole.log(typeof "5");\nconsole.log(typeof true);\nconsole.log(5 + 5);\nconsole.log("5" + 5);',
        output: "number\nstring\nboolean\n10\n55",
        explanation:
          '5 bertipe number, "5" bertipe string, true bertipe boolean. 5 + 5 = 10, tetapi "5" + 5 menyambung menjadi 55.',
      },
      prompt:
        'Jelaskan kepada FlipBot: mengapa 5 + 5 menjadi 10, tetapi "5" + 5 menjadi 55?',
      instructions: "Gunakan kata tipe data.",
      criteria: [
        {
          key: "punya-tipe",
          label: "Values have types",
          learner: "Setiap nilai punya tipe",
          weight: 30,
          evidence: "Names types such as number, string, boolean.",
          ask: 'Apa tipe dari "5"?',
        },
        {
          key: "kutip-string",
          label: "Quotes make a string",
          learner: "Kutip berarti teks",
          weight: 30,
          evidence: 'Explains "5" in quotes is a string, not a number.',
          ask: 'Apa bedanya 5 dan "5"?',
        },
        {
          key: "plus-menyambung",
          label: "+ joins when one side is a string",
          learner: "+ menyambung teks",
          weight: 40,
          evidence:
            "Explains + concatenates when a string is involved, giving 55.",
          ask: "Apa yang dilakukan + kalau ada teks?",
          misconceptions: ["selalu-dijumlah"],
        },
      ],
      misconceptions: [
        {
          id: "selalu-dijumlah",
          description: "Believes + always adds numerically.",
          signals: ["harusnya 10", "selalu dijumlah"],
        },
      ],
      hints: [
        'Lihat hasil typeof "5".',
        'Menyambung dua teks "5" dan "5" jadi apa?',
      ],
      reference:
        '5 bertipe number, sedangkan "5" bertipe string karena berkutip. Pada 5 + 5 keduanya angka sehingga dijumlah menjadi 10. Pada "5" + 5 ada teks, jadi + menyambungnya menjadi 55.',
      alternatives: [
        '"5" itu string jadi disambung jadi 55, kalau angka semua jadi 10',
      ],
    },
    {
      id: "js-operator",
      topic: "operators",
      difficulty: 1,
      title: "JavaScript 4: Operator dan Perbandingan === ",
      summary:
        "Operator menghitung dan membandingkan; === membandingkan nilai dan tipe.",
      objective:
        "The learner explains % as remainder, comparison results are true/false, and === checks both value and type.",
      concept:
        'Operator hitung: + - * / dan % (sisa bagi). Operator perbandingan seperti >, <, dan === menghasilkan true atau false. === memeriksa apakah nilai DAN tipenya sama, jadi 5 === "5" bernilai false.',
      analogy:
        "=== seperti satpam yang teliti: tidak cukup wajahmu mirip, kartu identitasmu juga harus cocok.",
      example: {
        language: "javascript",
        code: 'console.log(14 % 4);\nconsole.log(7 > 3);\nconsole.log(5 === 5);\nconsole.log(5 === "5");',
        output: "2\ntrue\ntrue\nfalse",
        explanation:
          '14 dibagi 4 sisanya 2. 7 > 3 benar. 5 === 5 benar. 5 === "5" salah karena tipenya berbeda.',
      },
      prompt:
        'Jelaskan kepada FlipBot: mengapa 5 === "5" hasilnya false, dan apa arti 14 % 4?',
      instructions: "Ceritakan apa yang diperiksa oleh ===.",
      criteria: [
        {
          key: "sisa",
          label: "% is the remainder",
          learner: "% adalah sisa bagi",
          weight: 30,
          evidence: "Explains 14 % 4 is the remainder 2.",
          ask: "Berapa sisa 14 dibagi 4?",
        },
        {
          key: "hasil-boolean",
          label: "Comparisons give true/false",
          learner: "Perbandingan hasilnya true/false",
          weight: 30,
          evidence: "States comparisons produce true or false.",
          ask: "Apa hasil 7 > 3?",
        },
        {
          key: "triple-sama",
          label: "=== checks value and type",
          learner: "=== memeriksa nilai dan tipe",
          weight: 40,
          evidence:
            'Explains === needs both the same value and the same type, so 5 === "5" is false.',
          ask: 'Apa bedanya 5 dan "5" menurut ===?',
          misconceptions: ["triple-nilai-saja"],
        },
      ],
      misconceptions: [
        {
          id: "triple-nilai-saja",
          description: "Believes === compares only the value.",
          signals: ["nilainya sama jadi true", "harusnya true"],
        },
      ],
      hints: [
        "Satu angka, satu teks. Apakah tipenya sama?",
        "Bagi 14 permen ke 4 teman.",
      ],
      reference:
        '14 % 4 adalah sisa bagi, yaitu 2. Operator perbandingan menghasilkan true atau false. === memeriksa nilai dan tipe sekaligus; 5 adalah number sedangkan "5" string, jadi 5 === "5" bernilai false.',
      alternatives: ["=== ngecek tipe juga, angka sama teks beda jadi false"],
    },
    {
      id: "js-if",
      topic: "conditions",
      difficulty: 2,
      title: "JavaScript 5: if, else if, else",
      summary: "Program memilih jalan berdasarkan kondisi.",
      objective:
        "The learner explains that if/else if/else checks conditions in order and runs only the first true branch.",
      concept:
        "if (kondisi) { ... } menjalankan blok di dalam kurung kurawal jika kondisinya true. else if memeriksa kondisi berikutnya, dan else dijalankan jika semua salah. Hanya satu cabang yang dijalankan.",
      analogy:
        "Lampu lalu lintas: jika merah berhenti, jika kuning hati-hati, selain itu jalan.",
      example: {
        language: "javascript",
        code: 'const suhu = 31;\nif (suhu > 35) {\n  console.log("Sangat panas");\n} else if (suhu > 28) {\n  console.log("Panas");\n} else {\n  console.log("Sejuk");\n}',
        output: "Panas",
        explanation:
          "31 tidak lebih dari 35, jadi cabang pertama dilewati. 31 lebih dari 28, jadi Panas dicetak dan else dilewati.",
      },
      prompt: "Jelaskan kepada FlipBot: mengapa program mencetak Panas?",
      instructions: "Ceritakan urutan pemeriksaannya dengan angka 31.",
      criteria: [
        {
          key: "berurutan",
          label: "Conditions are checked in order",
          learner: "Diperiksa berurutan",
          weight: 35,
          evidence:
            "States the conditions are checked from the first to the last.",
          ask: "Kondisi mana yang diperiksa pertama?",
        },
        {
          key: "satu-cabang",
          label: "Only the first true branch runs",
          learner: "Satu cabang saja",
          weight: 35,
          evidence: "Explains only one branch runs and the rest are skipped.",
          ask: "Apakah else ikut dijalankan?",
          misconceptions: ["semua-cabang-js"],
        },
        {
          key: "angka-31",
          label: "Applies it to 31",
          learner: "Menghitung dengan 31",
          weight: 30,
          evidence: "Explains 31 > 35 is false and 31 > 28 is true.",
          ask: "Apakah 31 lebih dari 35?",
        },
      ],
      misconceptions: [
        {
          id: "semua-cabang-js",
          description: "Believes several branches can run.",
          signals: ["dua-duanya dicetak", "semua jalan"],
        },
      ],
      hints: [
        "Uji kondisi pertama dengan 31.",
        "Setelah satu cabang benar, apa yang terjadi?",
      ],
      reference:
        "Kondisi diperiksa berurutan. 31 > 35 salah, jadi lanjut ke else if. 31 > 28 benar, jadi Panas dicetak. Setelah satu cabang benar, sisanya dilewati sehingga else tidak dijalankan.",
      alternatives: [
        "31 ga lebih dari 35 tapi lebih dari 28 jadi panas, terus berhenti",
      ],
    },
    {
      id: "js-loop",
      topic: "loops",
      difficulty: 2,
      title: "JavaScript 6: Perulangan for",
      summary: "for mengulang dengan tiga bagian: awal, syarat, dan langkah.",
      objective:
        "The learner explains the three parts of a for loop (start, condition, step) and how many times it runs.",
      concept:
        "for (let i = 1; i <= 3; i++) punya tiga bagian: awal (i mulai dari 1), syarat (ulang selama i <= 3), dan langkah (i++ menambah i satu setiap putaran). Perulangan berhenti saat syarat menjadi false.",
      analogy:
        "Seperti naik tangga: mulai dari anak tangga 1, terus naik satu-satu, dan berhenti setelah anak tangga ke-3.",
      example: {
        language: "javascript",
        code: 'let total = 0;\nfor (let i = 1; i <= 3; i++) {\n  total = total + i;\n  console.log("i =", i, "total =", total);\n}',
        output: "i = 1 total = 1\ni = 2 total = 3\ni = 3 total = 6",
        explanation:
          "i mulai 1, bertambah 1 setiap putaran, dan berhenti setelah 3. total menjumlahkan 1 + 2 + 3 = 6.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa arti tiga bagian di dalam for, dan mengapa total akhirnya 6?",
      instructions: "Sebutkan bagian awal, syarat, dan langkah.",
      criteria: [
        {
          key: "tiga-bagian",
          label: "Start, condition, step",
          learner: "Tiga bagian for",
          weight: 35,
          evidence:
            "Names the start (i = 1), condition (i <= 3) and step (i++).",
          ask: "Apa arti i++?",
        },
        {
          key: "jumlah-putaran",
          label: "Runs three times",
          learner: "Berjalan 3 kali",
          weight: 30,
          evidence:
            "Explains the loop runs for i = 1, 2, 3 and stops when i is 4.",
          ask: "Kapan perulangan berhenti?",
        },
        {
          key: "total-6",
          label: "total accumulates to 6",
          learner: "total menjadi 6",
          weight: 35,
          evidence: "Explains total adds 1 + 2 + 3 = 6.",
          ask: "Bagaimana total berubah tiap putaran?",
        },
      ],
      misconceptions: [
        {
          id: "i-mulai-nol",
          description:
            "Assumes every for loop starts at 0 regardless of the code.",
          signals: ["mulai dari 0"],
        },
      ],
      hints: [
        "Tulis nilai i dan total di setiap putaran.",
        "Apa yang terjadi saat i menjadi 4?",
      ],
      reference:
        "for punya tiga bagian: awal i = 1, syarat i <= 3, dan langkah i++ yang menambah 1. Perulangan berjalan untuk i = 1, 2, 3 dan berhenti saat i menjadi 4. total menjumlahkan 1 + 2 + 3 sehingga menjadi 6.",
      alternatives: ["mulai 1, selama <=3, tambah 1. total 1+2+3 = 6"],
    },
    {
      id: "js-array",
      topic: "collections",
      difficulty: 2,
      title: "JavaScript 7: Array dan Metodenya",
      summary:
        "Array menyimpan daftar nilai; push dan length membantu mengolahnya.",
      objective:
        "The learner explains arrays are zero-indexed lists, push adds to the end, and length counts items.",
      concept:
        "Array menyimpan banyak nilai dalam kurung siku [ ]. Indeks dimulai dari 0. push() menambah isi di akhir, length menyatakan jumlah isi, dan join() menggabungkan isi menjadi satu teks.",
      analogy:
        "Array seperti barisan kursi bernomor di bioskop, dimulai dari kursi nomor 0.",
      example: {
        language: "javascript",
        code: 'const warna = ["merah", "hijau"];\nwarna.push("biru");\nconsole.log(warna[0]);\nconsole.log(warna.length);\nconsole.log(warna.join(", "));',
        output: "merah\n3\nmerah, hijau, biru",
        explanation:
          "warna[0] adalah isi pertama. push menambah biru, jadi panjangnya 3. join menggabungkan semuanya dengan koma.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa warna[0] adalah merah, dan mengapa length menjadi 3?",
      instructions: "Ceritakan indeks dan push().",
      criteria: [
        {
          key: "daftar",
          label: "An array holds a list",
          learner: "Array menyimpan daftar",
          weight: 30,
          evidence: "States an array stores several values in order.",
          ask: "Apa saja isi warna?",
        },
        {
          key: "indeks-0",
          label: "Index starts at 0",
          learner: "Indeks mulai 0",
          weight: 35,
          evidence: "Explains warna[0] is the first item.",
          ask: "Merah bernomor berapa?",
          misconceptions: ["array-mulai-satu"],
        },
        {
          key: "push-length",
          label: "push adds; length counts",
          learner: "push dan length",
          weight: 35,
          evidence:
            "Explains push adds biru at the end and length counts 3 items.",
          ask: "Berapa isi array setelah push?",
        },
      ],
      misconceptions: [
        {
          id: "array-mulai-satu",
          description: "Believes the first item is at index 1.",
          signals: ["warna[1] itu merah"],
        },
      ],
      hints: [
        "Beri nomor 0, 1, 2 pada setiap warna.",
        "Sebelum push ada 2 warna.",
      ],
      reference:
        "Array menyimpan daftar nilai berurutan dengan indeks mulai 0, jadi warna[0] adalah merah. push() menambah biru di akhir, sehingga length menjadi 3. join() menggabungkan isinya menjadi teks.",
      alternatives: ["indeks mulai 0 jadi merah. push nambah biru jadi 3"],
    },
    {
      id: "js-fungsi",
      topic: "functions",
      difficulty: 3,
      title: "JavaScript 8: Fungsi dan Arrow Function",
      summary:
        "Fungsi mengemas perintah agar bisa dipakai ulang dan mengembalikan hasil.",
      objective:
        "The learner explains that functions take parameters, return results, and that an arrow function is a shorter way to write one.",
      concept:
        "function membuat fungsi bernama dengan parameter. return mengirim hasil kembali. Arrow function (=>) adalah cara singkat menulis fungsi. Fungsi hanya berjalan saat dipanggil.",
      analogy:
        "Fungsi seperti resep: bahan masuk (parameter), langkah dikerjakan, hidangan keluar (return).",
      example: {
        language: "javascript",
        code: 'function sapa(nama) {\n  return "Halo, " + nama + "!";\n}\nconst kaliDua = (x) => x * 2;\nconsole.log(sapa("FlipBot"));\nconsole.log(kaliDua(21));',
        output: "Halo, FlipBot!\n42",
        explanation:
          "sapa menerima nama dan mengembalikan teks sapaan. kaliDua adalah arrow function yang mengembalikan x * 2.",
      },
      prompt:
        'Jelaskan kepada FlipBot: bagaimana sapa("FlipBot") menghasilkan sapaan, dan apa itu arrow function?',
      instructions: "Gunakan kata parameter dan return.",
      criteria: [
        {
          key: "parameter",
          label: "Parameters receive values",
          learner: "Parameter menerima nilai",
          weight: 35,
          evidence: 'Explains nama receives "FlipBot" when sapa is called.',
          ask: 'Apa isi nama saat sapa("FlipBot")?',
        },
        {
          key: "return",
          label: "return sends the result back",
          learner: "return mengembalikan hasil",
          weight: 35,
          evidence: "Explains return gives the result back to console.log.",
          ask: "Apa yang dikembalikan sapa?",
        },
        {
          key: "arrow",
          label: "Arrow function is a short function",
          learner: "Arrow function",
          weight: 30,
          evidence:
            "Explains (x) => x * 2 is a shorter way to write a function returning x * 2.",
          ask: "Apa arti tanda => di kaliDua?",
        },
      ],
      misconceptions: [
        {
          id: "fungsi-jalan-sendiri",
          description: "Believes a function runs as soon as it is defined.",
          signals: ["langsung jalan", "otomatis dijalankan"],
        },
      ],
      hints: [
        'Ganti nama dengan "FlipBot" di dalam fungsi.',
        "kaliDua(21): x bernilai berapa?",
      ],
      reference:
        'Saat sapa("FlipBot") dipanggil, parameter nama berisi FlipBot, dan return mengembalikan "Halo, FlipBot!" yang lalu ditampilkan. Arrow function (x) => x * 2 adalah cara singkat menulis fungsi; kaliDua(21) mengembalikan 42.',
      alternatives: [
        "nama jadi FlipBot terus direturn jadi sapaan. => itu fungsi versi pendek",
      ],
    },
    {
      id: "js-objek",
      topic: "objects",
      difficulty: 3,
      title: "JavaScript 9: Objek dan Properti",
      summary: "Objek menyimpan properti (nama: nilai) dan metode.",
      objective:
        "The learner explains that an object groups properties and methods, accessed with dot notation, and that methods can use this.",
      concept:
        "Objek mengelompokkan data terkait sebagai properti nama: nilai di dalam { }. Properti diakses dengan titik, misalnya robot.nama. Metode adalah fungsi di dalam objek, dan this berarti objek itu sendiri.",
      analogy:
        "Objek seperti kartu identitas robot: ada nama, warna, dan kemampuan, semua dalam satu kartu.",
      example: {
        language: "javascript",
        code: 'const robot = {\n  nama: "FlipBot",\n  energi: 3,\n  isiDaya() {\n    this.energi = this.energi + 2;\n  },\n};\nrobot.isiDaya();\nconsole.log(robot.nama + " energi " + robot.energi);',
        output: "FlipBot energi 5",
        explanation:
          "robot punya properti nama dan energi serta metode isiDaya. Memanggil robot.isiDaya() menambah energi milik robot sendiri (this) menjadi 5.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa itu properti dan metode, dan mengapa energi menjadi 5?",
      instructions: "Ceritakan arti this.",
      criteria: [
        {
          key: "properti",
          label: "Objects group properties",
          learner: "Objek berisi properti",
          weight: 30,
          evidence: "States the object stores properties like nama and energi.",
          ask: "Apa saja properti robot?",
        },
        {
          key: "titik",
          label: "Dot notation accesses properties",
          learner: "Akses dengan titik",
          weight: 30,
          evidence: "Explains robot.nama reads a property.",
          ask: "Bagaimana cara membaca nama robot?",
        },
        {
          key: "metode-this",
          label: "Methods change the object via this",
          learner: "Metode dan this",
          weight: 40,
          evidence:
            "Explains isiDaya uses this.energi to change the robot's own energi from 3 to 5.",
          ask: "Saat robot.isiDaya(), this itu siapa?",
        },
      ],
      misconceptions: [
        {
          id: "this-global",
          description:
            "Believes this refers to the whole program rather than the object.",
          signals: ["this itu programnya"],
        },
      ],
      hints: [
        "Metode dipanggil pada objek robot.",
        "Berapa energi sebelum dan sesudah isiDaya?",
      ],
      reference:
        "Objek robot mengelompokkan properti nama dan energi serta metode isiDaya. Properti dibaca dengan titik seperti robot.nama. Di dalam metode, this berarti robot itu sendiri, jadi this.energi bertambah 2 dari 3 menjadi 5.",
      alternatives: [
        "nama sama energi itu properti, isiDaya metode. this itu robotnya jadi energinya 3+2=5",
      ],
    },
    {
      id: "js-dom",
      topic: "dom",
      difficulty: 3,
      title: "JavaScript 10: DOM dan Event Klik",
      summary: "JavaScript dapat mengubah halaman web saat pengguna mengeklik.",
      objective:
        "The learner explains that JavaScript finds an element in the page (DOM), listens for an event like click, and changes the page in response.",
      concept:
        'DOM adalah gambaran halaman web yang bisa diubah JavaScript. document.getElementById() menemukan elemen berdasarkan id. addEventListener("click", ...) menunggu klik. Saat diklik, fungsi dijalankan dan bisa mengubah isi halaman, misalnya textContent.',
      analogy:
        "Event listener seperti bel pintu: tidak terjadi apa-apa sampai seseorang menekannya, lalu bel berbunyi.",
      example: {
        conceptual:
          'HTML:\n<button id="tombol">Klik aku</button>\n<p id="pesan">Belum diklik</p>\n\nJavaScript:\nconst tombol = document.getElementById("tombol");\ntombol.addEventListener("click", () => {\n  document.getElementById("pesan").textContent = "Halo! Kamu mengeklik.";\n});',
        explanation:
          "Saat halaman dibuka, tulisan masih 'Belum diklik'. Setelah tombol diklik, fungsi dijalankan dan isi paragraf berubah. Coba sendiri di Mini IDE dengan bahasa HTML.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa yang terjadi saat halaman dibuka dan saat tombol diklik?",
      instructions: "Gunakan kata elemen dan event.",
      criteria: [
        {
          key: "menemukan",
          label: "JS finds the element",
          learner: "Menemukan elemen",
          weight: 30,
          evidence:
            "Explains getElementById finds the button/paragraph by its id.",
          ask: "Bagaimana JavaScript menemukan tombolnya?",
        },
        {
          key: "menunggu-event",
          label: "It waits for the click",
          learner: "Menunggu event klik",
          weight: 35,
          evidence:
            "Explains addEventListener waits and nothing changes until the click.",
          ask: "Apakah tulisan berubah sebelum diklik?",
          misconceptions: ["langsung-berubah"],
        },
        {
          key: "mengubah",
          label: "The page changes after the click",
          learner: "Halaman berubah",
          weight: 35,
          evidence:
            "Explains the function changes the paragraph's textContent after the click.",
          ask: "Apa yang diubah setelah klik?",
        },
      ],
      misconceptions: [
        {
          id: "langsung-berubah",
          description: "Believes the text changes as soon as the page loads.",
          signals: ["langsung berubah", "dari awal sudah"],
        },
      ],
      hints: [
        "Apa yang terlihat sebelum ada yang mengeklik?",
        "Fungsi di dalam addEventListener dijalankan kapan?",
      ],
      reference:
        "JavaScript menemukan tombol dan paragraf lewat id-nya. addEventListener membuat tombol menunggu event klik, jadi saat halaman dibuka tulisannya tetap 'Belum diklik'. Saat diklik, fungsi dijalankan dan mengubah textContent paragraf menjadi pesan baru.",
      alternatives: [
        "dicari pake id terus nunggu diklik. pas diklik tulisannya diganti",
      ],
    },
  ],
};
