import "server-only";
import type { TrackSpec } from "@/server/learning/content/curriculum/builder";

const SETUP =
  "CREATE TABLE murid (nama TEXT, kelas INTEGER, skor INTEGER);\nINSERT INTO murid VALUES ('Ani', 5, 90), ('Budi', 4, 70), ('Citra', 5, 80), ('Dodi', 6, 60);";

/** SQL track (topic order referenced from the W3Schools SQL tutorial). */
export const SQL_TRACK: TrackSpec = {
  id: "jalur-sql",
  title: "SQL",
  description:
    "Bahasa untuk bertanya kepada database: memilih, menyaring, mengurutkan, menghitung, dan menggabungkan data.",
  lessons: [
    {
      id: "sql-select",
      topic: "queries",
      difficulty: 1,
      title: "SQL 1: Mengambil Data dengan SELECT",
      summary: "SELECT memilih kolom yang ingin dilihat dari sebuah tabel.",
      objective:
        "The learner explains that a table has rows and columns and that SELECT column FROM table returns the chosen column for every row.",
      concept:
        "Database menyimpan data dalam tabel berisi baris (satu data) dan kolom (jenis keterangan). SELECT nama FROM murid berarti 'ambil kolom nama dari tabel murid'. Hasilnya satu nilai untuk setiap baris.",
      analogy:
        "Tabel seperti daftar absen kelas: setiap baris satu murid, setiap kolom satu keterangan (nama, kelas, skor).",
      example: {
        language: "sql",
        code: `${SETUP}\nSELECT nama FROM murid;`,
        output: "Ani\nBudi\nCitra\nDodi",
        explanation:
          "Tabel murid punya 4 baris. SELECT nama hanya mengambil kolom nama, jadi muncul 4 nama.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa itu baris dan kolom, dan mengapa hasilnya 4 nama?",
      instructions: "Ceritakan arti SELECT dan FROM.",
      criteria: [
        {
          key: "baris-kolom",
          label: "Tables have rows and columns",
          learner: "Baris dan kolom",
          weight: 30,
          evidence:
            "Explains a row is one record (one student) and a column is one kind of information.",
          ask: "Satu murid itu satu baris atau satu kolom?",
        },
        {
          key: "select-from",
          label: "SELECT column FROM table",
          learner: "Arti SELECT dan FROM",
          weight: 35,
          evidence:
            "Explains SELECT names the column and FROM names the table.",
          ask: "Kolom apa yang dipilih, dari tabel apa?",
        },
        {
          key: "setiap-baris",
          label: "One result per row",
          learner: "Satu hasil per baris",
          weight: 35,
          evidence: "Explains there are 4 rows so 4 names are returned.",
          ask: "Kenapa ada 4 nama?",
        },
      ],
      misconceptions: [
        {
          id: "select-mengubah",
          description: "Believes SELECT changes or deletes data.",
          signals: ["datanya diubah", "dihapus"],
        },
      ],
      hints: [
        "Hitung berapa murid yang dimasukkan.",
        "FROM menunjuk tabelnya.",
      ],
      reference:
        "Tabel tersusun dari baris (satu murid) dan kolom (nama, kelas, skor). SELECT nama FROM murid mengambil kolom nama dari tabel murid. Karena ada 4 baris, hasilnya 4 nama, dan datanya tidak berubah.",
      alternatives: [
        "baris itu tiap murid, kolom keterangannya. select ambil kolom nama dari tabel murid, ada 4",
      ],
    },
    {
      id: "sql-where",
      topic: "filtering",
      difficulty: 1,
      title: "SQL 2: Menyaring dengan WHERE",
      summary: "WHERE hanya mengambil baris yang memenuhi syarat.",
      objective:
        "The learner explains that WHERE keeps only rows whose condition is true, and can combine conditions with AND.",
      concept:
        "WHERE memberi syarat. Hanya baris yang memenuhi syarat yang ikut di hasil. AND menggabungkan dua syarat; keduanya harus benar.",
      analogy:
        "WHERE seperti saringan teh: hanya yang lolos syarat yang turun ke gelas.",
      example: {
        language: "sql",
        code: `${SETUP}\nSELECT nama, skor FROM murid WHERE kelas = 5 AND skor >= 85;`,
        output: "Ani|90",
        explanation:
          "Murid kelas 5 adalah Ani dan Citra, tetapi hanya Ani yang skornya minimal 85. Kolom dipisahkan tanda |.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa hanya Ani yang muncul, padahal Citra juga kelas 5?",
      instructions: "Ceritakan arti AND.",
      criteria: [
        {
          key: "menyaring",
          label: "WHERE filters rows",
          learner: "WHERE menyaring baris",
          weight: 35,
          evidence: "Explains WHERE keeps only rows that meet the condition.",
          ask: "Apa yang dilakukan WHERE?",
        },
        {
          key: "and",
          label: "AND needs both conditions",
          learner: "AND: dua syarat harus benar",
          weight: 35,
          evidence: "Explains both kelas = 5 and skor >= 85 must be true.",
          ask: "Syarat mana yang tidak dipenuhi Citra?",
          misconceptions: ["and-salah-satu"],
        },
        {
          key: "cek-data",
          label: "Applies it to the data",
          learner: "Memeriksa data",
          weight: 30,
          evidence:
            "Explains Citra (80) fails skor >= 85 while Ani (90) passes.",
          ask: "Berapa skor Citra?",
        },
      ],
      misconceptions: [
        {
          id: "and-salah-satu",
          description: "Believes AND means either condition is enough.",
          signals: ["salah satu cukup"],
        },
      ],
      hints: ["Periksa kedua syarat untuk Citra.", "AND berarti 'dan juga'."],
      reference:
        "WHERE menyaring sehingga hanya baris yang memenuhi syarat yang ditampilkan. Dengan AND, kedua syarat harus benar. Citra kelas 5 tetapi skornya 80, kurang dari 85, jadi tidak lolos. Hanya Ani (kelas 5, skor 90) yang memenuhi keduanya.",
      alternatives: [
        "harus kelas 5 dan skor 85 ke atas, citra skornya 80 jadi ga masuk",
      ],
    },
    {
      id: "sql-order",
      topic: "filtering",
      difficulty: 2,
      title: "SQL 3: Mengurutkan dengan ORDER BY dan LIMIT",
      summary: "ORDER BY mengurutkan hasil; LIMIT membatasi jumlah baris.",
      objective:
        "The learner explains ORDER BY ... DESC sorts from largest to smallest and LIMIT keeps only the first N rows after sorting.",
      concept:
        "ORDER BY skor mengurutkan dari kecil ke besar. Dengan DESC, urutannya dari besar ke kecil. LIMIT 2 hanya mengambil 2 baris pertama setelah diurutkan, cocok untuk membuat 'juara 1 dan 2'.",
      analogy:
        "Seperti menyusun murid berdasarkan tinggi badan, lalu hanya memanggil dua yang paling depan.",
      example: {
        language: "sql",
        code: `${SETUP}\nSELECT nama, skor FROM murid ORDER BY skor DESC LIMIT 2;`,
        output: "Ani|90\nCitra|80",
        explanation:
          "Diurutkan dari skor terbesar: 90, 80, 70, 60. LIMIT 2 mengambil dua teratas.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa arti DESC, dan mengapa hanya dua murid yang muncul?",
      instructions: "Ceritakan urutan kerjanya: urutkan dulu atau batasi dulu?",
      criteria: [
        {
          key: "desc",
          label: "DESC sorts largest first",
          learner: "DESC: besar ke kecil",
          weight: 35,
          evidence: "Explains DESC orders from the highest score down.",
          ask: "Skor siapa yang paling atas?",
        },
        {
          key: "limit",
          label: "LIMIT keeps the first N",
          learner: "LIMIT membatasi jumlah",
          weight: 35,
          evidence: "Explains LIMIT 2 keeps only two rows.",
          ask: "Berapa baris yang diambil LIMIT 2?",
        },
        {
          key: "urutan-kerja",
          label: "Sort happens before limit",
          learner: "Urutkan dulu, baru batasi",
          weight: 30,
          evidence:
            "Explains the rows are sorted first and then the top 2 are taken.",
          ask: "Kalau dibatasi dulu sebelum diurutkan, hasilnya bisa beda?",
        },
      ],
      misconceptions: [
        {
          id: "limit-acak",
          description: "Believes LIMIT picks random rows.",
          signals: ["dipilih acak"],
        },
      ],
      hints: [
        "Tulis skor dari terbesar ke terkecil.",
        "Ambil dua yang paling atas.",
      ],
      reference:
        "ORDER BY skor DESC mengurutkan dari skor terbesar ke terkecil (90, 80, 70, 60). Setelah diurutkan, LIMIT 2 hanya mengambil dua baris teratas, yaitu Ani dan Citra.",
      alternatives: [
        "desc dari gede ke kecil, terus limit 2 ambil dua paling atas",
      ],
    },
    {
      id: "sql-agregat",
      topic: "aggregation",
      difficulty: 2,
      title: "SQL 4: Menghitung dengan COUNT, SUM, AVG",
      summary: "Fungsi agregat merangkum banyak baris menjadi satu angka.",
      objective:
        "The learner explains that COUNT counts rows, SUM adds values and AVG averages them, turning many rows into one result.",
      concept:
        "Fungsi agregat merangkum banyak baris menjadi satu nilai. COUNT(*) menghitung jumlah baris, SUM(skor) menjumlahkan skor, AVG(skor) menghitung rata-rata, MAX dan MIN mencari nilai terbesar dan terkecil.",
      analogy:
        "Seperti wali kelas yang merangkum rapor: berapa murid, berapa total nilai, dan berapa rata-ratanya.",
      example: {
        language: "sql",
        code: `${SETUP}\nSELECT COUNT(*), SUM(skor), AVG(skor), MAX(skor) FROM murid;`,
        output: "4|300|75.0|90",
        explanation:
          "Ada 4 murid. Total skor 90 + 70 + 80 + 60 = 300. Rata-ratanya 300 / 4 = 75.0. Skor tertinggi 90.",
      },
      prompt:
        "Jelaskan kepada FlipBot: dari mana angka 4, 300, dan 75.0 berasal?",
      instructions: "Tunjukkan cara menghitungnya.",
      criteria: [
        {
          key: "count",
          label: "COUNT counts rows",
          learner: "COUNT menghitung baris",
          weight: 30,
          evidence: "Explains COUNT(*) gives 4 because there are 4 rows.",
          ask: "Apa yang dihitung COUNT(*)?",
        },
        {
          key: "sum-avg",
          label: "SUM adds, AVG averages",
          learner: "SUM dan AVG",
          weight: 40,
          evidence:
            "Explains SUM adds the scores to 300 and AVG divides by 4 to get 75.",
          ask: "Bagaimana 75 didapat?",
        },
        {
          key: "satu-hasil",
          label: "Many rows become one",
          learner: "Banyak baris jadi satu",
          weight: 30,
          evidence:
            "Explains aggregate functions summarise all rows into a single row.",
          ask: "Ada berapa baris hasil?",
          misconceptions: ["agregat-per-baris"],
        },
      ],
      misconceptions: [
        {
          id: "agregat-per-baris",
          description: "Believes SUM returns one value per row.",
          signals: ["setiap baris dijumlah sendiri"],
        },
      ],
      hints: [
        "Jumlahkan 90, 70, 80, dan 60.",
        "Rata-rata = total dibagi banyaknya.",
      ],
      reference:
        "Fungsi agregat merangkum semua baris menjadi satu baris hasil. COUNT(*) menghitung 4 murid, SUM(skor) menjumlahkan 90 + 70 + 80 + 60 = 300, AVG(skor) membagi 300 dengan 4 menjadi 75.0, dan MAX(skor) memberi 90.",
      alternatives: [
        "count ada 4 murid, sum ditotal 300, avg 300 bagi 4 jadi 75",
      ],
    },
    {
      id: "sql-group",
      topic: "aggregation",
      difficulty: 3,
      title: "SQL 5: Mengelompokkan dengan GROUP BY",
      summary: "GROUP BY menghitung agregat untuk setiap kelompok.",
      objective:
        "The learner explains that GROUP BY splits rows into groups by a column and computes the aggregate per group.",
      concept:
        "GROUP BY kelas mengelompokkan baris yang kelasnya sama. Fungsi agregat seperti COUNT dan AVG lalu dihitung untuk setiap kelompok, sehingga hasilnya satu baris per kelompok.",
      analogy:
        "Seperti memisahkan kelereng menurut warna ke beberapa mangkuk, lalu menghitung isi setiap mangkuk.",
      example: {
        language: "sql",
        code: `${SETUP}\nSELECT kelas, COUNT(*), AVG(skor) FROM murid GROUP BY kelas ORDER BY kelas;`,
        output: "4|1|70.0\n5|2|85.0\n6|1|60.0",
        explanation:
          "Kelas 5 punya dua murid (Ani 90, Citra 80), rata-ratanya 85.0. Kelas 4 dan 6 masing-masing satu murid.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa kelas 5 punya COUNT 2 dan rata-rata 85.0?",
      instructions: "Ceritakan bagaimana baris dikelompokkan.",
      criteria: [
        {
          key: "kelompok",
          label: "Rows are grouped by kelas",
          learner: "Baris dikelompokkan",
          weight: 35,
          evidence: "Explains rows with the same kelas go into one group.",
          ask: "Siapa saja di kelompok kelas 5?",
        },
        {
          key: "per-kelompok",
          label: "Aggregates per group",
          learner: "Dihitung per kelompok",
          weight: 35,
          evidence:
            "Explains COUNT and AVG are computed separately for each group.",
          ask: "AVG kelas 5 dihitung dari skor siapa?",
        },
        {
          key: "hitung-85",
          label: "Computes 85.0",
          learner: "Menghitung 85.0",
          weight: 30,
          evidence: "Explains (90 + 80) / 2 = 85.",
          ask: "Berapa (90 + 80) / 2?",
        },
      ],
      misconceptions: [
        {
          id: "group-semua",
          description: "Believes GROUP BY averages all rows together.",
          signals: ["rata-rata semua murid"],
        },
      ],
      hints: [
        "Pisahkan murid menurut kelas.",
        "Hitung rata-rata hanya dalam satu kelompok.",
      ],
      reference:
        "GROUP BY kelas memisahkan baris menurut kelas. COUNT dan AVG dihitung di setiap kelompok. Kelompok kelas 5 berisi Ani (90) dan Citra (80), jadi COUNT 2 dan rata-rata (90 + 80) / 2 = 85.0.",
      alternatives: [
        "dikelompokin per kelas, kelas 5 ada ani sama citra jadi 2, rata2 85",
      ],
    },
    {
      id: "sql-join",
      topic: "joins",
      difficulty: 3,
      title: "SQL 6: Menggabungkan Tabel dengan JOIN",
      summary:
        "JOIN menggabungkan baris dari dua tabel yang punya kolom penghubung.",
      objective:
        "The learner explains that JOIN ... ON matches rows from two tables using a shared key, combining their columns.",
      concept:
        "Data sering disimpan di beberapa tabel. JOIN menggabungkan dua tabel; ON menyebutkan kolom yang harus cocok, misalnya kelas.id = murid.kelas_id. Baris yang cocok digabung menjadi satu baris hasil.",
      analogy:
        "Seperti mencocokkan nomor kursi di tiket dengan nomor kursi di bioskop untuk tahu siapa duduk di mana.",
      example: {
        language: "sql",
        code: "CREATE TABLE kelas (id INTEGER, wali TEXT);\nINSERT INTO kelas VALUES (4, 'Bu Sari'), (5, 'Pak Tono');\nCREATE TABLE murid (nama TEXT, kelas_id INTEGER);\nINSERT INTO murid VALUES ('Ani', 5), ('Budi', 4), ('Citra', 5);\nSELECT murid.nama, kelas.wali FROM murid JOIN kelas ON murid.kelas_id = kelas.id ORDER BY murid.nama;",
        output: "Ani|Pak Tono\nBudi|Bu Sari\nCitra|Pak Tono",
        explanation:
          "Setiap murid dicocokkan dengan kelas yang id-nya sama dengan kelas_id murid, sehingga nama wali kelasnya ikut muncul.",
      },
      prompt:
        "Jelaskan kepada FlipBot: bagaimana SQL tahu wali kelas Ani adalah Pak Tono?",
      instructions: "Ceritakan peran ON.",
      criteria: [
        {
          key: "dua-tabel",
          label: "Data is in two tables",
          learner: "Data di dua tabel",
          weight: 30,
          evidence: "Explains names are in murid and wali in kelas.",
          ask: "Nama wali disimpan di tabel mana?",
        },
        {
          key: "on-cocok",
          label: "ON matches the key",
          learner: "ON mencocokkan kolom",
          weight: 40,
          evidence:
            "Explains ON murid.kelas_id = kelas.id pairs rows with the same number.",
          ask: "Kolom apa yang dicocokkan?",
        },
        {
          key: "contoh-ani",
          label: "Applies it to Ani",
          learner: "Contoh Ani",
          weight: 30,
          evidence:
            "Explains Ani has kelas_id 5, matching kelas id 5 whose wali is Pak Tono.",
          ask: "kelas_id Ani berapa?",
        },
      ],
      misconceptions: [
        {
          id: "join-urutan",
          description:
            "Believes JOIN pairs rows by position (first with first).",
          signals: ["baris pertama dengan baris pertama"],
        },
      ],
      hints: ["Cari kelas_id milik Ani.", "Lalu cari kelas yang id-nya sama."],
      reference:
        "Nama murid ada di tabel murid, sedangkan nama wali ada di tabel kelas. JOIN menggabungkan keduanya, dan ON murid.kelas_id = kelas.id menentukan pasangan yang cocok. Ani punya kelas_id 5, cocok dengan kelas id 5 yang walinya Pak Tono.",
      alternatives: [
        "dicocokin kelas_id murid sama id kelas, ani 5 jadi pak tono",
      ],
    },
  ],
};
