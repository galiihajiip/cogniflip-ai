import "server-only";
import type { TrackSpec } from "@/server/learning/content/curriculum/builder";

/** Python track (topic order referenced from the W3Schools Python tutorial). */
export const PYTHON_TRACK: TrackSpec = {
  id: "jalur-python",
  title: "Python",
  description:
    "Bahasa yang mudah dibaca. Mulai dari print() sampai class dan menangani error.",
  lessons: [
    {
      id: "py-print",
      topic: "output",
      difficulty: 1,
      title: "Python 1: Menampilkan Tulisan dengan print()",
      summary: "print() menyuruh komputer menampilkan sesuatu ke layar.",
      objective:
        "The learner explains that print() displays the value inside the parentheses, and that each print() starts a new line.",
      concept:
        "Di Python, perintah print() dipakai untuk menampilkan tulisan atau angka ke layar. Tulisan diapit tanda kutip. Setiap print() menampilkan hasilnya di baris baru, berurutan dari atas ke bawah.",
      analogy:
        "print() itu seperti pengeras suara di sekolah: apa pun yang kamu berikan, akan diumumkan supaya semua orang bisa mendengarnya.",
      example: {
        language: "python",
        code: 'print("Halo, FlipBot!")\nprint(7 + 3)',
        output: "Halo, FlipBot!\n10",
        explanation:
          "Baris pertama menampilkan tulisan di dalam tanda kutip. Baris kedua menghitung 7 + 3 dulu, lalu menampilkan hasilnya, 10, di baris baru.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa gunanya print(), dan mengapa contoh tadi menampilkan dua baris?",
      instructions:
        "Sebutkan apa yang ditampilkan print() dan kenapa hasilnya muncul di baris yang berbeda.",
      criteria: [
        {
          key: "menampilkan",
          label: "print() shows a value on the screen",
          learner: "print() menampilkan sesuatu",
          weight: 40,
          evidence:
            "States that print() displays/outputs what is inside the parentheses.",
          ask: "Apa yang dilakukan print() terhadap isi di dalam kurungnya?",
          misconceptions: ["print-mencetak-kertas"],
        },
        {
          key: "baris-baru",
          label: "Each print() starts a new line",
          learner: "Setiap print() di baris baru",
          weight: 30,
          evidence:
            "States that each print() call puts its output on its own line.",
          ask: "Kenapa hasilnya muncul di dua baris, bukan satu?",
        },
        {
          key: "kutip-vs-angka",
          label: "Quoted text is shown as-is; expressions are calculated",
          learner: "Teks berkutip vs hitungan",
          weight: 30,
          evidence:
            "Explains that text in quotes is shown exactly, while 7 + 3 is calculated first (10).",
          ask: "Kenapa print(7 + 3) menampilkan 10, bukan tulisan 7 + 3?",
        },
      ],
      misconceptions: [
        {
          id: "print-mencetak-kertas",
          description: "Believes print() sends output to a paper printer.",
          signals: ["mencetak ke printer", "keluar kertas"],
        },
      ],
      hints: [
        "Lihat hasil di layar: ada berapa baris?",
        "Bandingkan isi print pertama (pakai kutip) dan kedua (tanpa kutip).",
      ],
      reference:
        "print() menampilkan isi di dalam kurung ke layar. Tulisan yang diapit kutip ditampilkan apa adanya, sedangkan 7 + 3 dihitung dulu menjadi 10. Setiap print() menampilkan hasilnya di baris baru, jadi ada dua baris.",
      alternatives: [
        "print itu buat nunjukin tulisan di layar. Tiap print pindah baris. Yang tanpa kutip dihitung dulu jadi 10.",
      ],
    },
    {
      id: "py-variabel",
      topic: "variables",
      difficulty: 1,
      title: "Python 2: Variabel, Kotak Penyimpan Nilai",
      summary:
        "Variabel adalah nama untuk menyimpan nilai yang bisa dipakai lagi.",
      objective:
        "The learner explains that a variable stores a value under a name, that = assigns it, and that a variable can be changed later.",
      concept:
        "Variabel adalah nama yang menyimpan sebuah nilai. Tanda = artinya 'simpan nilai di sebelah kanan ke nama di sebelah kiri'. Nilai variabel boleh diganti, dan yang dipakai adalah nilai terakhir.",
      analogy:
        "Variabel seperti kotak berlabel. Labelnya 'skor', isinya angka. Kamu bisa membuka kotak untuk melihat isinya, atau mengganti isinya.",
      example: {
        language: "python",
        code: 'skor = 5\nprint(skor)\nskor = skor + 2\nprint(skor)\nnama = "FlipBot"\nprint(nama)',
        output: "5\n7\nFlipBot",
        explanation:
          "skor mula-mula 5. Lalu skor = skor + 2 mengambil nilai lama (5), menambah 2, dan menyimpan 7. nama menyimpan tulisan FlipBot.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa itu variabel, dan mengapa skor berubah dari 5 menjadi 7?",
      instructions:
        "Ceritakan arti tanda = dan apa yang terjadi pada baris skor = skor + 2.",
      criteria: [
        {
          key: "menyimpan",
          label: "A variable stores a value under a name",
          learner: "Variabel menyimpan nilai",
          weight: 35,
          evidence:
            "States that a variable is a name that holds/stores a value.",
          ask: "Apa yang disimpan oleh 'skor'?",
        },
        {
          key: "arti-sama-dengan",
          label: "= assigns the right side to the name on the left",
          learner: "Arti tanda =",
          weight: 30,
          evidence:
            "Explains that = stores the value on the right into the variable on the left (assignment, not equality).",
          ask: "Tanda = di Python artinya 'sama dengan' atau 'simpan ke'?",
          misconceptions: ["sama-dengan-matematika"],
        },
        {
          key: "nilai-berubah",
          label: "The variable can be updated using its old value",
          learner: "Nilai bisa diubah",
          weight: 35,
          evidence:
            "Explains skor = skor + 2 takes the old value 5, adds 2 and stores 7.",
          ask: "Bagaimana skor bisa berubah menjadi 7?",
        },
      ],
      misconceptions: [
        {
          id: "sama-dengan-matematika",
          description:
            "Reads = as mathematical equality, so skor = skor + 2 seems impossible.",
          signals: ["tidak mungkin sama", "salah karena tidak sama"],
        },
      ],
      hints: [
        "Bayangkan kotak berlabel 'skor'. Apa isinya sebelum dan sesudah baris ketiga?",
        "Baca baris ketiga dari kanan ke kiri.",
      ],
      reference:
        "Variabel adalah nama yang menyimpan nilai. Tanda = berarti menyimpan nilai di kanan ke nama di kiri. Pada skor = skor + 2, komputer mengambil nilai lama 5, menambah 2, lalu menyimpan 7 ke skor. Jadi print kedua menampilkan 7.",
      alternatives: [
        "variabel itu kotak buat simpan angka. skor tadinya 5 terus ditambah 2 jadi 7 dan disimpan lagi",
      ],
    },
    {
      id: "py-tipe-data",
      topic: "data-types",
      difficulty: 1,
      title: "Python 3: Tipe Data (Angka, Teks, Benar/Salah)",
      summary: "Setiap nilai punya tipe: int, float, str, atau bool.",
      objective:
        "The learner explains that values have types (int, float, str, bool), that type() shows them, and that the type affects what operations do.",
      concept:
        "Setiap nilai di Python punya tipe. Bilangan bulat disebut int, bilangan desimal disebut float, teks disebut str, dan nilai benar/salah disebut bool (True atau False). Fungsi type() memberi tahu tipe sebuah nilai. Tipe menentukan apa yang bisa dilakukan, misalnya + pada angka menjumlahkan, tetapi + pada teks menyambung.",
      analogy:
        "Tipe data seperti jenis wadah: gelas untuk minuman, kotak pensil untuk alat tulis. Isinya harus cocok dengan wadahnya.",
      example: {
        language: "python",
        code: 'print(type(10))\nprint(type(2.5))\nprint(type("10"))\nprint(type(True))\nprint(3 + 4)\nprint("3" + "4")',
        output:
          "<class 'int'>\n<class 'float'>\n<class 'str'>\n<class 'bool'>\n7\n34",
        explanation:
          '10 adalah int, 2.5 float, "10" str karena berkutip, True bool. 3 + 4 menjumlahkan menjadi 7, sedangkan "3" + "4" menyambung teks menjadi 34.',
      },
      prompt:
        'Jelaskan kepada FlipBot: mengapa 3 + 4 menjadi 7, tetapi "3" + "4" menjadi 34?',
      instructions: "Gunakan kata tipe data, dan sebutkan setidaknya dua tipe.",
      criteria: [
        {
          key: "punya-tipe",
          label: "Values have types",
          learner: "Setiap nilai punya tipe",
          weight: 30,
          evidence:
            "States that values have a type such as int, float, str or bool.",
          ask: 'Apa tipe dari 10 dan dari "10"?',
        },
        {
          key: "kutip-teks",
          label: "Quotes make a value text (str)",
          learner: "Tanda kutip berarti teks",
          weight: 30,
          evidence: 'Explains that "3" in quotes is text (str), not a number.',
          ask: 'Apa bedanya 3 dan "3"?',
          misconceptions: ["kutip-tidak-penting"],
        },
        {
          key: "tipe-menentukan-operasi",
          label: "The type changes what + does",
          learner: "Tipe mengubah hasil operasi",
          weight: 40,
          evidence: "Explains + adds numbers but joins (concatenates) text.",
          ask: "Apa yang dilakukan + pada teks?",
        },
      ],
      misconceptions: [
        {
          id: "kutip-tidak-penting",
          description: 'Thinks quotes are decoration and "3" behaves like 3.',
          signals: ["kutip cuma hiasan", "sama saja"],
        },
      ],
      hints: [
        'Lihat hasil type("10"). Tipe apa yang muncul?',
        "Kalau dua kata disambung dengan +, apa hasilnya?",
      ],
      reference:
        'Setiap nilai punya tipe. 3 dan 4 adalah int, jadi + menjumlahkan menjadi 7. "3" dan "4" berkutip sehingga bertipe str (teks), dan + pada teks menyambungnya menjadi 34.',
      alternatives: [
        "yang pake kutip itu teks jadi disambung, yang angka dijumlah",
      ],
    },
    {
      id: "py-string",
      topic: "strings",
      difficulty: 1,
      title: "Python 4: Bermain dengan String (Teks)",
      summary:
        "String adalah teks; kita bisa mengukur panjang, mengambil huruf, dan mengubahnya.",
      objective:
        "The learner explains that a string is a sequence of characters indexed from 0, that len() counts characters, and that methods like upper() return changed text.",
      concept:
        "String adalah deretan huruf. Setiap huruf punya nomor urut yang disebut indeks, dimulai dari 0. len() menghitung jumlah huruf. Metode seperti upper() membuat versi huruf besar dari teks tersebut.",
      analogy:
        "String seperti kereta dengan gerbong-gerbong huruf. Gerbong pertama bernomor 0, bukan 1.",
      example: {
        language: "python",
        code: 'kata = "robot"\nprint(len(kata))\nprint(kata[0])\nprint(kata[1:3])\nprint(kata.upper())',
        output: "5\nr\nob\nROBOT",
        explanation:
          "robot punya 5 huruf. kata[0] adalah huruf pertama, r. kata[1:3] mengambil huruf nomor 1 sampai sebelum 3, yaitu ob. upper() menjadikan semua huruf besar.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa kata[0] menghasilkan r, dan apa arti kata[1:3]?",
      instructions: "Ceritakan tentang nomor urut huruf (indeks).",
      criteria: [
        {
          key: "indeks-nol",
          label: "Indexes start at 0",
          learner: "Indeks mulai dari 0",
          weight: 40,
          evidence: "States that the first character has index 0.",
          ask: "Huruf pertama bernomor berapa?",
          misconceptions: ["indeks-mulai-satu"],
        },
        {
          key: "irisan",
          label: "Slicing [1:3] takes from 1 up to (not including) 3",
          learner: "Arti [1:3]",
          weight: 35,
          evidence:
            "Explains [1:3] takes characters 1 and 2 and stops before 3.",
          ask: "Huruf nomor berapa saja yang diambil [1:3]?",
        },
        {
          key: "len-upper",
          label: "len() counts characters; upper() makes capitals",
          learner: "len() dan upper()",
          weight: 25,
          evidence:
            "Mentions len() counts letters (5) or upper() makes capital letters.",
          ask: "Apa yang dihitung len()?",
        },
      ],
      misconceptions: [
        {
          id: "indeks-mulai-satu",
          description: "Believes the first character is index 1.",
          signals: ["huruf pertama nomor 1", "mulai dari satu"],
        },
      ],
      hints: [
        "Tulis r-o-b-o-t lalu beri nomor di bawahnya mulai dari 0.",
        "Angka kedua pada [1:3] tidak ikut diambil.",
      ],
      reference:
        "Huruf dalam string bernomor mulai 0, jadi kata[0] adalah r. kata[1:3] mengambil huruf nomor 1 dan 2 (o dan b) dan berhenti sebelum nomor 3. len() menghitung 5 huruf dan upper() membuat ROBOT.",
      alternatives: [
        "nomornya mulai 0 jadi r itu nomor 0. 1:3 ambil nomor 1 sama 2 aja",
      ],
    },
    {
      id: "py-operator",
      topic: "operators",
      difficulty: 1,
      title: "Python 5: Operator Hitung dan Perbandingan",
      summary:
        "Operator menghitung (+ - * / // %) dan membandingkan (== != < >).",
      objective:
        "The learner explains arithmetic operators including // and %, and that comparison operators produce True or False.",
      concept:
        "Operator hitung: + tambah, - kurang, * kali, / bagi (hasil desimal), // bagi lalu dibulatkan ke bawah, % sisa bagi. Operator perbandingan seperti ==, !=, <, > menghasilkan True atau False. Perhatikan: == untuk membandingkan, = untuk menyimpan.",
      analogy:
        "Membagi 17 permen ke 5 teman: masing-masing dapat 3 (itu //) dan sisa 2 permen (itu %).",
      example: {
        language: "python",
        code: "print(17 / 5)\nprint(17 // 5)\nprint(17 % 5)\nprint(3 * 4 == 12)\nprint(10 < 3)",
        output: "3.4\n3\n2\nTrue\nFalse",
        explanation:
          "17 / 5 = 3.4. 17 // 5 = 3 (bagian utuh). 17 % 5 = 2 (sisa). 3 * 4 == 12 benar, 10 < 3 salah.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa beda /, //, dan %, dan apa yang dihasilkan oleh 3 * 4 == 12?",
      instructions: "Pakai contoh permen kalau membantu.",
      criteria: [
        {
          key: "bagi-bulat",
          label: "// is whole-number division",
          learner: "Arti //",
          weight: 30,
          evidence: "Explains // gives the whole-number part (3).",
          ask: "17 // 5 menghasilkan berapa, dan kenapa?",
        },
        {
          key: "sisa",
          label: "% is the remainder",
          learner: "Arti % (sisa bagi)",
          weight: 30,
          evidence: "Explains % gives the remainder (2).",
          ask: "Apa yang tersisa setelah 17 dibagi 5?",
          misconceptions: ["persen"],
        },
        {
          key: "perbandingan-bool",
          label: "Comparisons give True or False",
          learner: "Perbandingan hasilnya True/False",
          weight: 40,
          evidence:
            "Explains == (or <) produces True or False rather than a number.",
          ask: "3 * 4 == 12 menghasilkan angka atau benar/salah?",
        },
      ],
      misconceptions: [
        {
          id: "persen",
          description: "Thinks % means percent in Python.",
          signals: ["persen", "per seratus"],
        },
      ],
      hints: [
        "Bayangkan membagi 17 permen ke 5 teman.",
        "Perbandingan menjawab pertanyaan ya/tidak.",
      ],
      reference:
        "/ membagi dengan hasil desimal (3.4), // mengambil bagian utuhnya (3), dan % memberi sisa bagi (2). Operator perbandingan seperti == menjawab benar atau salah, jadi 3 * 4 == 12 menghasilkan True.",
      alternatives: [
        "// itu dapet berapa per orang, % sisanya. == itu nanya sama atau nggak jadi True",
      ],
    },
    {
      id: "py-if",
      topic: "conditions",
      difficulty: 2,
      title: "Python 6: Memilih dengan if, elif, else",
      summary: "Program memilih satu jalan berdasarkan kondisi.",
      objective:
        "The learner explains that if/elif/else checks conditions top to bottom and runs only the first matching branch.",
      concept:
        "if memeriksa sebuah kondisi. Jika benar, blok di bawahnya (yang menjorok) dijalankan. elif artinya 'kalau tidak, coba periksa ini'. else dijalankan jika semua kondisi sebelumnya salah. Hanya satu cabang yang dijalankan, yaitu yang pertama kali benar.",
      analogy:
        "Seperti memilih baju: kalau hujan pakai jas hujan, kalau tidak tapi panas pakai topi, selain itu pakai kaus biasa.",
      example: {
        language: "python",
        code: 'nilai = 78\nif nilai >= 85:\n    print("Hebat")\nelif nilai >= 70:\n    print("Bagus")\nelse:\n    print("Ayo berlatih")',
        output: "Bagus",
        explanation:
          "78 tidak >= 85, jadi cabang if dilewati. 78 >= 70 benar, jadi Bagus dicetak dan else tidak diperiksa lagi.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa program ini mencetak Bagus, dan bukan Hebat atau Ayo berlatih?",
      instructions: "Ceritakan urutan pemeriksaan kondisinya.",
      criteria: [
        {
          key: "periksa-berurutan",
          label: "Conditions are checked top to bottom",
          learner: "Kondisi diperiksa berurutan",
          weight: 35,
          evidence:
            "States the program checks the if first, then elif, then else.",
          ask: "Kondisi mana yang diperiksa pertama kali?",
        },
        {
          key: "satu-cabang",
          label: "Only the first true branch runs",
          learner: "Hanya satu cabang dijalankan",
          weight: 35,
          evidence:
            "Explains only one branch runs (the first true one) and the rest are skipped.",
          ask: "Setelah Bagus dicetak, apakah else masih dijalankan?",
          misconceptions: ["semua-cabang"],
        },
        {
          key: "alasan-78",
          label: "Applies it to 78",
          learner: "Menghitung dengan nilai 78",
          weight: 30,
          evidence: "Explains 78 is not >= 85 but is >= 70.",
          ask: "Apakah 78 lebih dari atau sama dengan 85?",
        },
      ],
      misconceptions: [
        {
          id: "semua-cabang",
          description:
            "Believes every branch whose condition is true runs, or that else always runs.",
          signals: ["semua dijalankan", "else selalu jalan"],
        },
      ],
      hints: [
        "Periksa kondisi pertama dengan angka 78.",
        "Setelah satu cabang benar, apakah komputer lanjut memeriksa?",
      ],
      reference:
        "Python memeriksa kondisi dari atas. 78 >= 85 salah, jadi lanjut ke elif. 78 >= 70 benar, jadi Bagus dicetak. Begitu satu cabang benar, cabang lain dilewati, sehingga else tidak dijalankan.",
      alternatives: [
        "78 kurang dari 85 jadi bukan hebat. tapi 78 lebih dari 70 jadi bagus dan berhenti di situ",
      ],
    },
    {
      id: "py-for",
      topic: "loops",
      difficulty: 2,
      title: "Python 7: Perulangan for dan range()",
      summary: "for mengulang blok kode untuk setiap nilai dalam deretan.",
      objective:
        "The learner explains that for repeats the indented block for each value, and that range(1, 4) gives 1, 2, 3 (stopping before 4).",
      concept:
        "Perulangan for menjalankan blok yang menjorok berkali-kali, sekali untuk setiap nilai. range(1, 4) membuat deretan 1, 2, 3; angka akhir tidak ikut. Variabel perulangan (misalnya i) berisi nilai yang sedang dipakai.",
      analogy:
        "Seperti guru memanggil absen nomor 1, 2, 3: untuk setiap nomor, ia melakukan hal yang sama, yaitu memanggil nama.",
      example: {
        language: "python",
        code: 'for i in range(1, 4):\n    print("Lompatan ke-", i)\nprint("Selesai")',
        output: "Lompatan ke- 1\nLompatan ke- 2\nLompatan ke- 3\nSelesai",
        explanation:
          "range(1, 4) memberi 1, 2, 3. Baris yang menjorok dijalankan 3 kali dengan i berganti nilai. Selesai tidak menjorok, jadi dicetak sekali setelah perulangan.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa 'Lompatan ke-' dicetak 3 kali, tetapi 'Selesai' hanya sekali?",
      instructions: "Ceritakan tentang range(1, 4) dan baris yang menjorok.",
      criteria: [
        {
          key: "range-berhenti",
          label: "range(1, 4) gives 1, 2, 3",
          learner: "range berhenti sebelum 4",
          weight: 35,
          evidence: "Explains range(1, 4) produces 1, 2, 3 and stops before 4.",
          ask: "Angka berapa saja yang dihasilkan range(1, 4)?",
          misconceptions: ["range-termasuk-akhir"],
        },
        {
          key: "blok-menjorok",
          label: "Only the indented block repeats",
          learner: "Hanya baris menjorok yang diulang",
          weight: 35,
          evidence:
            "Explains the indented line repeats while 'Selesai' (not indented) runs once after.",
          ask: "Kenapa 'Selesai' tidak ikut diulang?",
        },
        {
          key: "variabel-berubah",
          label: "i takes each value in turn",
          learner: "i berganti nilai",
          weight: 30,
          evidence: "Explains i takes the values 1, 2, 3 in turn.",
          ask: "Apa isi i pada putaran kedua?",
        },
      ],
      misconceptions: [
        {
          id: "range-termasuk-akhir",
          description: "Believes range(1, 4) includes 4.",
          signals: ["sampai 4", "1 2 3 4"],
        },
      ],
      hints: [
        "Hitung isi range(1, 4) dengan jarimu.",
        "Lihat baris mana yang menjorok ke dalam.",
      ],
      reference:
        "range(1, 4) menghasilkan 1, 2, 3 karena angka akhir tidak ikut. Untuk setiap angka, baris yang menjorok dijalankan, jadi tercetak 3 kali dengan i berganti 1, 2, 3. Selesai tidak menjorok, jadi dijalankan sekali setelah perulangan selesai.",
      alternatives: [
        "rangenya 1 2 3 jadi tiga kali. selesai ga menjorok jadi cuma sekali di akhir",
      ],
    },
    {
      id: "py-while",
      topic: "loops",
      difficulty: 2,
      title: "Python 8: Perulangan while",
      summary: "while mengulang selama kondisinya masih benar.",
      objective:
        "The learner explains that while repeats as long as the condition is true and that the loop must change something so it eventually stops.",
      concept:
        "while memeriksa kondisi sebelum setiap putaran. Selama kondisi benar, blok dijalankan. Di dalam blok, harus ada yang berubah (misalnya energi berkurang). Kalau tidak, kondisi selalu benar dan program mengulang tanpa henti.",
      analogy:
        "Selama gelas belum penuh, terus tuang air. Kalau kamu lupa memperhatikan gelasnya, airnya akan tumpah terus.",
      example: {
        language: "python",
        code: 'energi = 3\nwhile energi > 0:\n    print("Lompat! energi:", energi)\n    energi = energi - 1\nprint("Istirahat")',
        output:
          "Lompat! energi: 3\nLompat! energi: 2\nLompat! energi: 1\nIstirahat",
        explanation:
          "Selama energi > 0, FlipBot melompat dan energi berkurang 1. Saat energi menjadi 0, kondisi salah, perulangan berhenti, lalu Istirahat dicetak.",
      },
      prompt:
        "Jelaskan kepada FlipBot: kapan perulangan while ini berhenti, dan apa yang terjadi kalau baris energi = energi - 1 dihapus?",
      instructions: "Ceritakan tentang kondisi dan perubahan nilai energi.",
      criteria: [
        {
          key: "selama-benar",
          label: "while repeats while the condition is true",
          learner: "Diulang selama kondisi benar",
          weight: 35,
          evidence: "States the loop repeats as long as energi > 0 is true.",
          ask: "Kondisi apa yang diperiksa setiap putaran?",
        },
        {
          key: "berhenti-nol",
          label: "Stops when energi reaches 0",
          learner: "Berhenti saat energi 0",
          weight: 30,
          evidence:
            "Explains the loop stops when energi becomes 0 (condition false).",
          ask: "Pada nilai energi berapa perulangan berhenti?",
        },
        {
          key: "tanpa-henti",
          label: "Without the update it never stops",
          learner: "Tanpa pengurangan, tidak berhenti",
          weight: 35,
          evidence: "Explains removing the decrement makes an infinite loop.",
          ask: "Kalau energi tidak pernah berkurang, apa yang terjadi?",
          misconceptions: ["berhenti-sendiri"],
        },
      ],
      misconceptions: [
        {
          id: "berhenti-sendiri",
          description: "Believes the loop stops by itself after a few rounds.",
          signals: ["berhenti sendiri", "komputer tahu kapan berhenti"],
        },
      ],
      hints: [
        "Tulis nilai energi setiap putaran.",
        "Apa yang membuat energi > 0 menjadi salah?",
      ],
      reference:
        "while mengulang selama energi > 0 benar. Setiap putaran energi berkurang 1 (3, 2, 1), dan saat energi 0 kondisinya salah sehingga perulangan berhenti. Jika baris pengurangan dihapus, energi tetap 3, kondisi selalu benar, dan program mengulang tanpa henti.",
      alternatives: [
        "jalan terus selama energinya lebih dari 0. kalau ga dikurangin ga bakal berhenti",
      ],
    },
    {
      id: "py-list",
      topic: "collections",
      difficulty: 2,
      title: "Python 9: List, Daftar Berurutan",
      summary: "List menyimpan banyak nilai berurutan dalam satu variabel.",
      objective:
        "The learner explains that a list stores many ordered values, is indexed from 0, and can grow with append().",
      concept:
        "List menyimpan banyak nilai sekaligus di dalam kurung siku [ ]. Setiap isi punya indeks mulai 0. append() menambah isi di akhir list. len() menghitung banyaknya isi.",
      analogy:
        "List seperti rak buku bernomor: buku pertama di rak nomor 0, dan buku baru diletakkan di ujung rak.",
      example: {
        language: "python",
        code: 'buah = ["apel", "jeruk", "mangga"]\nprint(buah[1])\nbuah.append("pisang")\nprint(len(buah))\nprint(buah)',
        output: "jeruk\n4\n['apel', 'jeruk', 'mangga', 'pisang']",
        explanation:
          "buah[1] adalah isi kedua, jeruk. append menambah pisang di akhir, sehingga isinya menjadi 4.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa buah[1] adalah jeruk, dan apa yang dilakukan append()?",
      instructions: "Ceritakan tentang indeks dan cara menambah isi list.",
      criteria: [
        {
          key: "banyak-nilai",
          label: "A list stores many values",
          learner: "List menyimpan banyak nilai",
          weight: 30,
          evidence:
            "States a list holds several values in order in one variable.",
          ask: "Berapa banyak nilai yang bisa disimpan dalam satu list?",
        },
        {
          key: "indeks-list",
          label: "List indexes start at 0",
          learner: "Indeks list mulai 0",
          weight: 35,
          evidence:
            "Explains buah[1] is the second item because indexing starts at 0.",
          ask: "Apel bernomor berapa?",
          misconceptions: ["list-mulai-satu"],
        },
        {
          key: "append",
          label: "append() adds to the end",
          learner: "append() menambah di akhir",
          weight: 35,
          evidence:
            "Explains append adds pisang to the end, so the length becomes 4.",
          ask: "Di mana pisang ditambahkan?",
        },
      ],
      misconceptions: [
        {
          id: "list-mulai-satu",
          description: "Believes buah[1] is the first item.",
          signals: ["buah[1] itu apel", "nomor satu yang pertama"],
        },
      ],
      hints: [
        "Beri nomor 0, 1, 2 di bawah setiap buah.",
        "Lihat isi list setelah append.",
      ],
      reference:
        "List menyimpan banyak nilai berurutan. Indeks mulai 0, jadi apel di 0 dan jeruk di 1, sehingga buah[1] adalah jeruk. append() menambah pisang di akhir list, jadi panjangnya menjadi 4.",
      alternatives: [
        "apel nomor 0 jadi jeruk nomor 1. append nambahin di paling belakang",
      ],
    },
    {
      id: "py-dict",
      topic: "collections",
      difficulty: 2,
      title: "Python 10: Dictionary, Pasangan Kunci dan Nilai",
      summary: "Dictionary menyimpan data sebagai pasangan kunci: nilai.",
      objective:
        "The learner explains that a dictionary stores key-value pairs, values are looked up by key (not position), and assigning to a key adds or updates it.",
      concept:
        'Dictionary menyimpan pasangan kunci dan nilai di dalam kurung kurawal { }. Kita mengambil nilai dengan kuncinya, misalnya robot["nama"]. Memberi nilai pada kunci baru akan menambah pasangan; pada kunci lama akan mengganti nilainya.',
      analogy:
        "Dictionary seperti kamus: kamu mencari kata (kunci) untuk menemukan artinya (nilai), bukan mencari halaman ke berapa.",
      example: {
        language: "python",
        code: 'robot = {"nama": "FlipBot", "energi": 5}\nprint(robot["nama"])\nrobot["energi"] = 8\nrobot["warna"] = "biru"\nprint(robot)',
        output: "FlipBot\n{'nama': 'FlipBot', 'energi': 8, 'warna': 'biru'}",
        explanation:
          'robot["nama"] mengambil nilai dengan kunci nama. energi diganti menjadi 8, dan kunci baru warna ditambahkan.',
      },
      prompt:
        "Jelaskan kepada FlipBot: bagaimana dictionary menemukan nilai, dan apa yang terjadi pada energi dan warna?",
      instructions: "Gunakan kata kunci dan nilai.",
      criteria: [
        {
          key: "pasangan",
          label: "Stores key-value pairs",
          learner: "Pasangan kunci dan nilai",
          weight: 35,
          evidence: "States a dictionary stores pairs of keys and values.",
          ask: 'Apa kunci dan nilai pada "nama": "FlipBot"?',
        },
        {
          key: "cari-dengan-kunci",
          label: "Look up by key",
          learner: "Mencari dengan kunci",
          weight: 30,
          evidence:
            "Explains values are found using the key, not a position number.",
          ask: "Bagaimana cara mengambil nama robot?",
          misconceptions: ["dict-pakai-indeks"],
        },
        {
          key: "ubah-tambah",
          label: "Assigning updates or adds",
          learner: "Mengubah dan menambah isi",
          weight: 35,
          evidence:
            "Explains energi is updated to 8 and warna is added as a new key.",
          ask: 'Apa bedanya robot["energi"] = 8 dan robot["warna"] = "biru"?',
        },
      ],
      misconceptions: [
        {
          id: "dict-pakai-indeks",
          description:
            "Believes dictionary values are accessed by position like robot[0].",
          signals: ["robot[0]", "nomor urut"],
        },
      ],
      hints: [
        "Kamus dicari dengan kata, bukan nomor halaman.",
        "Kunci energi sudah ada, kunci warna belum.",
      ],
      reference:
        'Dictionary menyimpan pasangan kunci: nilai. Nilai diambil dengan kuncinya, misalnya robot["nama"] memberi FlipBot. Memberi nilai pada kunci yang sudah ada (energi) menggantinya menjadi 8, sedangkan pada kunci baru (warna) menambah pasangan baru.',
      alternatives: [
        "dicari pakai kuncinya kayak kamus. energi diganti jadi 8, warna ditambah baru",
      ],
    },
    {
      id: "py-fungsi",
      topic: "functions",
      difficulty: 3,
      title: "Python 11: Fungsi dengan def dan return",
      summary:
        "Fungsi adalah kumpulan perintah bernama yang bisa dipakai berkali-kali.",
      objective:
        "The learner explains that def defines a reusable function, parameters receive input values, and return sends a result back to the caller.",
      concept:
        "def membuat fungsi: kumpulan perintah yang diberi nama. Fungsi bisa menerima masukan lewat parameter, dan return mengirim hasilnya kembali ke tempat fungsi dipanggil. Fungsi baru berjalan saat dipanggil.",
      analogy:
        "Fungsi seperti mesin jus: masukkan buah (parameter), mesin bekerja, lalu keluar jus (return). Mesin yang sama bisa dipakai berkali-kali.",
      example: {
        language: "python",
        code: "def luas_persegi(sisi):\n    return sisi * sisi\n\nprint(luas_persegi(3))\nprint(luas_persegi(5))",
        output: "9\n25",
        explanation:
          "luas_persegi menerima sisi dan mengembalikan sisi * sisi. Dipanggil dengan 3 menghasilkan 9, dengan 5 menghasilkan 25.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa gunanya fungsi, dan bagaimana luas_persegi(5) menghasilkan 25?",
      instructions: "Gunakan kata parameter dan return.",
      criteria: [
        {
          key: "dipakai-ulang",
          label: "A function is reusable named code",
          learner: "Fungsi bisa dipakai berulang",
          weight: 30,
          evidence:
            "States a function is a named block that can be called many times.",
          ask: "Berapa kali luas_persegi dipakai di contoh?",
        },
        {
          key: "parameter",
          label: "Parameters receive input",
          learner: "Parameter menerima masukan",
          weight: 35,
          evidence: "Explains sisi receives the value passed in (5).",
          ask: "Saat luas_persegi(5), sisi bernilai berapa?",
        },
        {
          key: "return",
          label: "return sends the result back",
          learner: "return mengembalikan hasil",
          weight: 35,
          evidence:
            "Explains return sends sisi * sisi (25) back so print can show it.",
          ask: "Apa yang dikirim kembali oleh return?",
          misconceptions: ["return-sama-print"],
        },
      ],
      misconceptions: [
        {
          id: "return-sama-print",
          description:
            "Believes return displays the value on screen like print.",
          signals: ["return menampilkan", "return mencetak"],
        },
      ],
      hints: [
        "Ganti sisi dengan 5 di dalam fungsi.",
        "Siapa yang menampilkan hasilnya: return atau print?",
      ],
      reference:
        "Fungsi adalah perintah bernama yang bisa dipakai berkali-kali. Saat luas_persegi(5) dipanggil, parameter sisi berisi 5, fungsi menghitung 5 * 5, dan return mengirim 25 kembali. print lalu menampilkan 25.",
      alternatives: [
        "fungsi itu kayak mesin. 5 masuk jadi sisi, dikali sendiri jadi 25 terus dikembalikan pakai return",
      ],
    },
    {
      id: "py-class",
      topic: "objects",
      difficulty: 3,
      title: "Python 12: Class dan Objek",
      summary:
        "Class adalah cetakan; objek adalah benda yang dibuat dari cetakan itu.",
      objective:
        "The learner explains that a class is a blueprint, each object created from it has its own attribute values, and methods are functions that use self.",
      concept:
        "Class adalah cetakan untuk membuat objek. __init__ dijalankan saat objek dibuat untuk mengisi atributnya. self berarti 'objek ini sendiri'. Metode adalah fungsi di dalam class. Setiap objek punya nilai atributnya masing-masing.",
      analogy:
        "Class seperti cetakan kue. Dari satu cetakan bisa dibuat banyak kue, dan tiap kue boleh punya hiasan berbeda.",
      example: {
        language: "python",
        code: 'class Robot:\n    def __init__(self, nama, energi):\n        self.nama = nama\n        self.energi = energi\n\n    def lompat(self):\n        self.energi = self.energi - 1\n        return self.nama + " melompat"\n\nflip = Robot("FlipBot", 3)\nbot = Robot("Robi", 5)\nprint(flip.lompat())\nprint(flip.energi, bot.energi)',
        output: "FlipBot melompat\n2 5",
        explanation:
          "Dua objek dibuat dari class Robot. Hanya flip yang melompat, jadi energinya turun menjadi 2, sedangkan energi bot tetap 5.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa beda class dan objek, dan mengapa energi flip berubah tetapi energi bot tidak?",
      instructions: "Ceritakan tentang cetakan, objek, dan self.",
      criteria: [
        {
          key: "cetakan",
          label: "A class is a blueprint for objects",
          learner: "Class adalah cetakan",
          weight: 35,
          evidence:
            "States the class is a template/blueprint and flip and bot are objects made from it.",
          ask: "Robot itu class atau objek? flip itu apa?",
        },
        {
          key: "atribut-sendiri",
          label: "Each object has its own attributes",
          learner: "Tiap objek punya datanya sendiri",
          weight: 35,
          evidence:
            "Explains flip and bot have separate energi values, so changing one does not change the other.",
          ask: "Kenapa energi bot tetap 5?",
          misconceptions: ["objek-berbagi"],
        },
        {
          key: "metode-self",
          label: "Methods act on self",
          learner: "Metode memakai self",
          weight: 30,
          evidence:
            "Explains lompat() changes self.energi of the object it is called on.",
          ask: "Saat flip.lompat(), self itu siapa?",
        },
      ],
      misconceptions: [
        {
          id: "objek-berbagi",
          description:
            "Believes all objects of a class share the same attribute values.",
          signals: ["semua robot energinya sama", "ikut berubah"],
        },
      ],
      hints: [
        "Ada berapa robot yang dibuat?",
        "lompat() dipanggil pada robot yang mana?",
      ],
      reference:
        "Class Robot adalah cetakan, sedangkan flip dan bot adalah dua objek yang dibuat darinya. Setiap objek menyimpan nama dan energinya sendiri. flip.lompat() mengubah self.energi milik flip saja (3 menjadi 2), jadi energi bot tetap 5.",
      alternatives: [
        "robot itu cetakannya, flip sama bot kuenya. yang lompat cuma flip jadi energinya aja yang turun",
      ],
    },
    {
      id: "py-try",
      topic: "errors",
      difficulty: 3,
      title: "Python 13: Menangani Error dengan try dan except",
      summary:
        "try mencoba kode; except menangani error supaya program tidak berhenti.",
      objective:
        "The learner explains that code in try runs until an error occurs, except handles that error type, and the program continues instead of crashing.",
      concept:
        "Kadang kode menimbulkan error, misalnya membagi dengan nol. Kode di dalam try dicoba. Jika terjadi error, Python langsung melompat ke except yang cocok, menjalankan penanganannya, lalu program berlanjut. Tanpa try, program akan berhenti dengan pesan error.",
      analogy:
        "Seperti pemain sirkus yang berjalan di atas tali dengan jaring pengaman di bawahnya. Kalau terjatuh, jaring menangkapnya dan pertunjukan berlanjut.",
      example: {
        language: "python",
        code: 'try:\n    hasil = 10 / 0\n    print("Tidak tercetak")\nexcept ZeroDivisionError:\n    print("Tidak bisa membagi dengan nol")\nprint("Program lanjut")',
        output: "Tidak bisa membagi dengan nol\nProgram lanjut",
        explanation:
          "10 / 0 menimbulkan ZeroDivisionError, sehingga baris setelahnya di dalam try dilewati. except menangani error itu, lalu program lanjut.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa 'Tidak tercetak' tidak muncul, dan mengapa program tetap lanjut?",
      instructions: "Ceritakan peran try dan except.",
      criteria: [
        {
          key: "error-melompat",
          label: "An error jumps out of try",
          learner: "Error membuat sisa try dilewati",
          weight: 35,
          evidence:
            "Explains the error on 10 / 0 skips the rest of the try block.",
          ask: "Apa yang terjadi pada baris setelah 10 / 0?",
        },
        {
          key: "except-menangani",
          label: "except handles the matching error",
          learner: "except menangani error",
          weight: 35,
          evidence:
            "Explains except ZeroDivisionError runs because that error happened.",
          ask: "Kenapa except dijalankan?",
        },
        {
          key: "program-lanjut",
          label: "The program continues",
          learner: "Program tidak berhenti",
          weight: 30,
          evidence:
            "Explains that thanks to try/except the program continues instead of crashing.",
          ask: "Apa yang terjadi kalau tidak ada try?",
          misconceptions: ["try-menghilangkan-error"],
        },
      ],
      misconceptions: [
        {
          id: "try-menghilangkan-error",
          description:
            "Believes try makes the error disappear so 10 / 0 gets a result.",
          signals: ["jadi bisa dibagi nol", "errornya hilang dan hasilnya ada"],
        },
      ],
      hints: [
        "Error terjadi di baris mana?",
        "Setelah error, Python pergi ke bagian mana?",
      ],
      reference:
        "10 / 0 menimbulkan ZeroDivisionError. Begitu error terjadi, sisa blok try dilewati sehingga 'Tidak tercetak' tidak muncul. Python melompat ke except yang cocok dan mencetak pesannya. Karena error sudah ditangani, program lanjut mencetak 'Program lanjut' alih-alih berhenti.",
      alternatives: [
        "bagi nol itu error jadi langsung loncat ke except. karena ditangkap programnya ga berhenti",
      ],
    },
  ],
};
