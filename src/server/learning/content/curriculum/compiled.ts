import "server-only";
import type { TrackSpec } from "@/server/learning/content/curriculum/builder";

/** Java track (topic order referenced from the W3Schools Java tutorial). */
export const JAVA_TRACK: TrackSpec = {
  id: "jalur-java",
  title: "Java",
  description:
    "Bahasa yang ketat soal tipe data, dipakai untuk aplikasi Android dan sistem besar.",
  lessons: [
    {
      id: "java-halo",
      topic: "output",
      difficulty: 1,
      title: "Java 1: Program Pertama dan main()",
      summary: "Program Java dimulai dari method main di dalam sebuah class.",
      objective:
        "The learner explains that a Java program starts in main inside a class, statements end with semicolons, and System.out.println prints a line.",
      concept:
        "Setiap program Java berada di dalam class. Komputer mulai menjalankan program dari method main. System.out.println() menampilkan satu baris. Setiap perintah diakhiri titik koma.",
      analogy:
        "main seperti pintu masuk sebuah gedung: semua tamu (perintah) masuk dari pintu yang sama.",
      example: {
        language: "java",
        code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Halo dari Java!");\n    System.out.println(5 + 3);\n  }\n}',
        output: "Halo dari Java!\n8",
        explanation:
          "Program dimulai di main. println pertama menampilkan teks, yang kedua menghitung 5 + 3 lalu menampilkan 8.",
      },
      prompt:
        "Jelaskan kepada FlipBot: dari mana program Java mulai berjalan, dan apa yang dilakukan println?",
      instructions: "Sebutkan juga gunanya titik koma.",
      criteria: [
        {
          key: "main",
          label: "Execution starts in main",
          learner: "Dimulai dari main",
          weight: 35,
          evidence:
            "States the program starts running from the main method inside the class.",
          ask: "Method apa yang dijalankan pertama?",
        },
        {
          key: "println",
          label: "println prints a line",
          learner: "println menampilkan satu baris",
          weight: 35,
          evidence:
            "Explains System.out.println shows a value and moves to a new line.",
          ask: "Kenapa hasilnya dua baris?",
        },
        {
          key: "titik-koma",
          label: "Statements end with ;",
          learner: "Titik koma",
          weight: 30,
          evidence: "Mentions each statement ends with a semicolon.",
          ask: "Apa yang menandai akhir satu perintah?",
        },
      ],
      misconceptions: [
        {
          id: "java-tanpa-class",
          description: "Believes Java code can run without a class or main.",
          signals: ["tidak perlu class"],
        },
      ],
      hints: ["Cari kata main.", "Hitung berapa kali println dipanggil."],
      reference:
        "Program Java ada di dalam class dan mulai berjalan dari method main. System.out.println menampilkan satu baris, jadi teks dan hasil 5 + 3 = 8 muncul di dua baris. Setiap perintah diakhiri titik koma.",
      alternatives: [
        "mulainya dari main. println nampilin terus pindah baris, tiap perintah pakai ;",
      ],
    },
    {
      id: "java-variabel",
      topic: "data-types",
      difficulty: 1,
      title: "Java 2: Variabel Bertipe (int, double, String, boolean)",
      summary: "Di Java, setiap variabel harus dideklarasikan dengan tipenya.",
      objective:
        "The learner explains that Java variables are declared with a type, the type limits what can be stored, and int division drops decimals.",
      concept:
        "Java mengharuskan kita menulis tipe saat membuat variabel: int untuk bilangan bulat, double untuk desimal, String untuk teks, boolean untuk true/false. Variabel int tidak bisa menyimpan teks. Pembagian dua int membuang desimalnya.",
      analogy:
        "Seperti loker berlabel: loker 'bola' hanya untuk bola, tidak bisa diisi buku.",
      example: {
        language: "java",
        code: 'public class Main {\n  public static void main(String[] args) {\n    int permen = 7;\n    double harga = 2.5;\n    String nama = "FlipBot";\n    boolean lapar = true;\n    System.out.println(nama + " punya " + permen + " permen");\n    System.out.println(permen / 2);\n    System.out.println(harga * 2);\n    System.out.println(lapar);\n  }\n}',
        output: "FlipBot punya 7 permen\n3\n5.0\ntrue",
        explanation:
          "7 / 2 dengan int menghasilkan 3 (desimal dibuang). harga * 2 bertipe double menjadi 5.0.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa permen / 2 hasilnya 3, bukan 3.5?",
      instructions: "Gunakan kata tipe int dan double.",
      criteria: [
        {
          key: "deklarasi-tipe",
          label: "Variables declare a type",
          learner: "Variabel ditulis dengan tipe",
          weight: 30,
          evidence:
            "Explains each variable is declared with a type such as int or String.",
          ask: "Apa tipe variabel permen?",
        },
        {
          key: "bagi-int",
          label: "int division drops decimals",
          learner: "int membuang desimal",
          weight: 40,
          evidence:
            "Explains 7 / 2 with ints gives 3 because the decimal part is dropped.",
          ask: "Ke mana .5-nya?",
          misconceptions: ["dibulatkan"],
        },
        {
          key: "double",
          label: "double keeps decimals",
          learner: "double menyimpan desimal",
          weight: 30,
          evidence: "Explains double values like 2.5 keep decimals (5.0).",
          ask: "Kenapa harga * 2 menjadi 5.0?",
        },
      ],
      misconceptions: [
        {
          id: "dibulatkan",
          description: "Believes int division rounds to the nearest number.",
          signals: ["dibulatkan ke 4", "pembulatan"],
        },
      ],
      hints: [
        "7 dan 2 sama-sama int.",
        "Bandingkan dengan harga yang bertipe double.",
      ],
      reference:
        "Di Java setiap variabel punya tipe yang ditulis saat dibuat. permen dan 2 bertipe int, jadi 7 / 2 hanya menyimpan bagian bulatnya, 3, dan desimalnya dibuang (bukan dibulatkan). harga bertipe double sehingga menyimpan desimal, dan harga * 2 menjadi 5.0.",
      alternatives: [
        "int itu bulat jadi 3.5 dibuang .5 nya. double bisa desimal",
      ],
    },
    {
      id: "java-kondisi-loop",
      topic: "loops",
      difficulty: 2,
      title: "Java 3: if dan for",
      summary: "Java memakai if dan for dengan kurung kurawal.",
      objective:
        "The learner explains a for loop's start/condition/step and an if inside it that selects some iterations.",
      concept:
        "for (int i = 1; i <= 5; i++) mengulang dengan i dari 1 sampai 5. Di dalamnya, if memeriksa kondisi setiap putaran. i % 2 == 0 berarti i habis dibagi 2, yaitu bilangan genap.",
      analogy:
        "Seperti memeriksa nomor rumah satu per satu di sebuah gang dan hanya mengetuk rumah bernomor genap.",
      example: {
        language: "java",
        code: 'public class Main {\n  public static void main(String[] args) {\n    for (int i = 1; i <= 5; i++) {\n      if (i % 2 == 0) {\n        System.out.println(i + " genap");\n      }\n    }\n  }\n}',
        output: "2 genap\n4 genap",
        explanation:
          "Perulangan memeriksa 1 sampai 5, tetapi hanya 2 dan 4 yang memenuhi i % 2 == 0.",
      },
      prompt: "Jelaskan kepada FlipBot: mengapa hanya 2 dan 4 yang dicetak?",
      instructions: "Ceritakan peran for dan if.",
      criteria: [
        {
          key: "for-1-5",
          label: "Loop runs i = 1..5",
          learner: "for dari 1 sampai 5",
          weight: 30,
          evidence: "Explains the loop goes through i = 1 to 5.",
          ask: "Nilai i berapa saja?",
        },
        {
          key: "genap",
          label: "i % 2 == 0 means even",
          learner: "Arti i % 2 == 0",
          weight: 40,
          evidence: "Explains the condition is true only for even numbers.",
          ask: "Kenapa 3 tidak dicetak?",
        },
        {
          key: "if-dalam-for",
          label: "if is checked each round",
          learner: "if diperiksa tiap putaran",
          weight: 30,
          evidence: "Explains the if is checked on every iteration.",
          ask: "Berapa kali if diperiksa?",
        },
      ],
      misconceptions: [
        {
          id: "loop-hanya-genap",
          description: "Believes the loop itself only visits even numbers.",
          signals: ["loopnya cuma genap"],
        },
      ],
      hints: [
        "Coba hitung sisa bagi 2 untuk 1 sampai 5.",
        "if diperiksa di setiap putaran.",
      ],
      reference:
        "for mengulang dengan i = 1, 2, 3, 4, 5. Di setiap putaran if memeriksa i % 2 == 0, yang hanya benar untuk bilangan genap. Jadi hanya 2 dan 4 yang dicetak, meskipun kelima angka diperiksa.",
      alternatives: [
        "dicek satu satu 1-5, yang sisa bagi 2 nya 0 cuma 2 sama 4",
      ],
    },
    {
      id: "java-method",
      topic: "functions",
      difficulty: 2,
      title: "Java 4: Method dengan Parameter dan Return",
      summary: "Method adalah fungsi di Java dengan tipe kembalian.",
      objective:
        "The learner explains a method has parameters with types, a return type, and returns a value to the caller.",
      concept:
        "Method di Java ditulis dengan tipe hasil, nama, dan parameter bertipe, misalnya static int kali(int a, int b). return mengirim hasil kembali. Tipe hasil harus cocok dengan nilai yang dikembalikan.",
      analogy:
        "Method seperti kalkulator khusus: masukkan dua angka, keluar satu jawaban.",
      example: {
        language: "java",
        code: "public class Main {\n  static int kali(int a, int b) {\n    return a * b;\n  }\n\n  public static void main(String[] args) {\n    int hasil = kali(6, 7);\n    System.out.println(hasil);\n    System.out.println(kali(2, kali(3, 4)));\n  }\n}",
        output: "42\n24",
        explanation:
          "kali(6, 7) mengembalikan 42. Pada kali(2, kali(3, 4)), bagian dalam dihitung dulu menjadi 12, lalu 2 * 12 = 24.",
      },
      prompt:
        "Jelaskan kepada FlipBot: bagaimana kali(2, kali(3, 4)) menghasilkan 24?",
      instructions: "Gunakan kata parameter dan return.",
      criteria: [
        {
          key: "parameter",
          label: "Parameters receive values",
          learner: "Parameter menerima nilai",
          weight: 30,
          evidence: "Explains a and b receive the values passed in.",
          ask: "Pada kali(6, 7), a dan b bernilai berapa?",
        },
        {
          key: "return",
          label: "return gives the result",
          learner: "return mengembalikan hasil",
          weight: 30,
          evidence: "Explains return a * b sends the product back.",
          ask: "Apa yang dikembalikan kali?",
        },
        {
          key: "bersarang",
          label: "Inner call first",
          learner: "Panggilan dalam dihitung dulu",
          weight: 40,
          evidence:
            "Explains kali(3, 4) = 12 is computed first, then kali(2, 12) = 24.",
          ask: "Bagian mana yang dihitung dulu?",
        },
      ],
      misconceptions: [
        {
          id: "kiri-dulu",
          description:
            "Believes the outer call runs before its argument is computed.",
          signals: ["2 dikali 3 dulu"],
        },
      ],
      hints: [
        "Hitung kali(3, 4) terlebih dahulu.",
        "Lalu masukkan hasilnya ke kali(2, ...).",
      ],
      reference:
        "Method kali menerima parameter a dan b, lalu return mengembalikan a * b. Pada kali(2, kali(3, 4)), panggilan di dalam dihitung dulu: kali(3, 4) = 12. Lalu kali(2, 12) mengembalikan 24.",
      alternatives: ["yang dalam dulu 3*4=12, terus 2*12=24"],
    },
    {
      id: "java-class",
      topic: "objects",
      difficulty: 3,
      title: "Java 5: Class, Objek, dan Constructor",
      summary: "Class mendefinisikan objek; constructor mengisi nilai awalnya.",
      objective:
        "The learner explains a class defines fields and methods, a constructor initialises each new object, and each object keeps its own field values.",
      concept:
        "Class adalah cetakan objek. Field menyimpan data objek. Constructor (method dengan nama sama seperti class) dijalankan saat objek dibuat dengan new. this.nama berarti field nama milik objek ini.",
      analogy:
        "Constructor seperti formulir pendaftaran: setiap anggota baru mengisi namanya sendiri saat mendaftar.",
      example: {
        language: "java",
        code: 'public class Main {\n  static class Robot {\n    String nama;\n    int energi;\n\n    Robot(String nama, int energi) {\n      this.nama = nama;\n      this.energi = energi;\n    }\n\n    void isiDaya() {\n      energi = energi + 10;\n    }\n  }\n\n  public static void main(String[] args) {\n    Robot a = new Robot("FlipBot", 20);\n    Robot b = new Robot("Robi", 50);\n    a.isiDaya();\n    System.out.println(a.nama + " " + a.energi);\n    System.out.println(b.nama + " " + b.energi);\n  }\n}',
        output: "FlipBot 30\nRobi 50",
        explanation:
          "Dua objek dibuat dengan constructor. Hanya a yang diisi daya, jadi energinya 30, sedangkan b tetap 50.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa tugas constructor, dan mengapa energi Robi tetap 50?",
      instructions: "Ceritakan arti new dan this.",
      criteria: [
        {
          key: "constructor",
          label: "Constructor initialises a new object",
          learner: "Constructor mengisi nilai awal",
          weight: 35,
          evidence:
            "Explains new Robot(...) runs the constructor that sets nama and energi.",
          ask: "Kapan constructor dijalankan?",
        },
        {
          key: "milik-sendiri",
          label: "Each object has its own fields",
          learner: "Tiap objek punya datanya",
          weight: 35,
          evidence: "Explains a and b have separate energi values.",
          ask: "Kenapa energi Robi tidak ikut berubah?",
        },
        {
          key: "this",
          label: "this refers to the current object",
          learner: "Arti this",
          weight: 30,
          evidence:
            "Explains this.nama means the field of the object being created.",
          ask: "this.nama itu nama milik siapa?",
        },
      ],
      misconceptions: [
        {
          id: "objek-sama",
          description: "Believes all objects share the same fields.",
          signals: ["semua robot berubah"],
        },
      ],
      hints: ["Ada dua kata new.", "isiDaya dipanggil pada objek yang mana?"],
      reference:
        "Constructor Robot dijalankan setiap kali new Robot(...) dipakai, dan this.nama serta this.energi mengisi field objek yang sedang dibuat. Objek a dan b menyimpan field masing-masing. Hanya a.isiDaya() yang dipanggil, jadi energi FlipBot menjadi 30 dan energi Robi tetap 50.",
      alternatives: [
        "constructor ngisi nama energi pas new. tiap objek beda, cuma a yang diisi daya",
      ],
    },
  ],
};

/** C++ track (topic order referenced from the W3Schools C++ tutorial). */
export const CPP_TRACK: TrackSpec = {
  id: "jalur-cpp",
  title: "C++",
  description:
    "Bahasa yang cepat dan dekat dengan mesin, dipakai untuk game dan robot sungguhan.",
  lessons: [
    {
      id: "cpp-halo",
      topic: "output",
      difficulty: 1,
      title: "C++ 1: cout dan Program Pertama",
      summary: "cout menampilkan teks; program dimulai dari main().",
      objective:
        "The learner explains that a C++ program starts at main, cout << prints values, and endl ends the line.",
      concept:
        "Program C++ dimulai dari fungsi main(). #include <iostream> menyiapkan fitur tampil. cout << mengirim nilai ke layar, dan endl membuat baris baru. return 0 menandai program selesai dengan baik.",
      analogy:
        "cout << seperti ban berjalan yang membawa barang ke layar satu per satu.",
      example: {
        language: "cpp",
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Halo dari C++!" << endl;\n  cout << 9 * 9 << endl;\n  return 0;\n}',
        output: "Halo dari C++!\n81",
        explanation:
          "cout menampilkan teks, endl pindah baris, lalu 9 * 9 dihitung menjadi 81.",
      },
      prompt:
        "Jelaskan kepada FlipBot: apa gunanya cout dan endl, dan dari mana program mulai berjalan?",
      instructions: "Sebutkan fungsi main.",
      criteria: [
        {
          key: "main",
          label: "Execution starts in main",
          learner: "Dimulai dari main()",
          weight: 30,
          evidence: "States the program starts at main().",
          ask: "Fungsi apa yang dijalankan pertama?",
        },
        {
          key: "cout",
          label: "cout << prints",
          learner: "cout menampilkan",
          weight: 40,
          evidence: "Explains cout << sends text or values to the screen.",
          ask: "Apa yang dilakukan cout?",
        },
        {
          key: "endl",
          label: "endl ends the line",
          learner: "endl pindah baris",
          weight: 30,
          evidence: "Explains endl moves to a new line.",
          ask: "Kenapa 81 di baris baru?",
        },
      ],
      misconceptions: [
        {
          id: "cout-input",
          description: "Believes cout reads input from the keyboard.",
          signals: ["cout membaca ketikan"],
        },
      ],
      hints: ["Arah panah << menunjuk ke cout.", "endl = end line."],
      reference:
        "Program C++ mulai berjalan dari main(). cout << mengirim teks atau hasil hitungan ke layar, dan endl mengakhiri baris sehingga 81 muncul di baris berikutnya.",
      alternatives: ["mulai dari main, cout nampilin, endl ganti baris"],
    },
    {
      id: "cpp-variabel",
      topic: "variables",
      difficulty: 1,
      title: "C++ 2: Variabel dan Tipe Data",
      summary:
        "Variabel C++ dideklarasikan dengan tipe seperti int, double, string, bool.",
      objective:
        "The learner explains typed declarations and that integer division truncates while double keeps decimals.",
      concept:
        "Seperti Java, C++ meminta tipe saat membuat variabel: int, double, string, bool. Pembagian dua int membuang desimal. Jika salah satu double, hasilnya desimal.",
      analogy:
        "Wadah yang berbeda untuk isi yang berbeda: gelas untuk air, keranjang untuk buah.",
      example: {
        language: "cpp",
        code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  int apel = 10;\n  double berat = 1.5;\n  string nama = "FlipBot";\n  cout << nama << " membagi " << apel / 4 << endl;\n  cout << apel / 4.0 << endl;\n  cout << berat * 2 << endl;\n  return 0;\n}',
        output: "FlipBot membagi 2\n2.5\n3",
        explanation:
          "10 / 4 dengan dua int menghasilkan 2. 10 / 4.0 melibatkan double, jadi 2.5. 1.5 * 2 = 3 (cout tidak menampilkan .0).",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa apel / 4 hasilnya 2 tetapi apel / 4.0 hasilnya 2.5?",
      instructions: "Gunakan kata int dan double.",
      criteria: [
        {
          key: "tipe",
          label: "Variables have declared types",
          learner: "Variabel bertipe",
          weight: 30,
          evidence: "Names types such as int, double, string.",
          ask: "Apa tipe apel?",
        },
        {
          key: "bagi-int",
          label: "int / int truncates",
          learner: "Bagi int membuang desimal",
          weight: 40,
          evidence: "Explains 10 / 4 with two ints gives 2.",
          ask: "Ke mana .5 pada 10 / 4?",
        },
        {
          key: "double",
          label: "A double makes the result decimal",
          learner: "double membuat hasil desimal",
          weight: 30,
          evidence: "Explains 4.0 is a double so the result is 2.5.",
          ask: "Apa bedanya 4 dan 4.0?",
        },
      ],
      misconceptions: [
        {
          id: "cpp-dibulatkan",
          description: "Believes int division rounds.",
          signals: ["dibulatkan jadi 3"],
        },
      ],
      hints: ["10 dan 4 sama-sama int.", "4.0 punya titik desimal."],
      reference:
        "Variabel C++ ditulis dengan tipenya. apel / 4 membagi dua int sehingga desimalnya dibuang menjadi 2. apel / 4.0 melibatkan double, jadi hasilnya 2.5.",
      alternatives: ["int bagi int jadi 2, kalau 4.0 itu double jadi 2.5"],
    },
    {
      id: "cpp-loop",
      topic: "loops",
      difficulty: 2,
      title: "C++ 3: Perulangan while dan for",
      summary: "while dan for mengulang selama kondisinya benar.",
      objective:
        "The learner explains how a while loop's condition and update control the number of iterations.",
      concept:
        "while (kondisi) mengulang selama kondisi benar. Nilai di dalam perulangan harus berubah agar suatu saat kondisinya salah. Operator *= 2 berarti 'kalikan 2 lalu simpan'.",
      analogy:
        "Seperti melipat kertas: setiap lipatan tebalnya dua kali lipat, dan kamu berhenti saat sudah terlalu tebal.",
      example: {
        language: "cpp",
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int bakteri = 1;\n  int jam = 0;\n  while (bakteri < 20) {\n    bakteri *= 2;\n    jam++;\n  }\n  cout << jam << " jam, " << bakteri << " bakteri" << endl;\n  return 0;\n}',
        output: "5 jam, 32 bakteri",
        explanation:
          "Bakteri berlipat: 2, 4, 8, 16, 32. Setelah 32 tidak lagi < 20, perulangan berhenti setelah 5 putaran.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa perulangan berhenti setelah 5 jam dengan 32 bakteri?",
      instructions: "Tulis nilai bakteri setiap putaran.",
      criteria: [
        {
          key: "kondisi",
          label: "Loops while bakteri < 20",
          learner: "Diulang selama < 20",
          weight: 30,
          evidence: "Explains the loop runs while bakteri is less than 20.",
          ask: "Apa syarat perulangannya?",
        },
        {
          key: "berlipat",
          label: "Value doubles each round",
          learner: "Berlipat dua tiap putaran",
          weight: 35,
          evidence: "Explains bakteri goes 2, 4, 8, 16, 32.",
          ask: "Berapa bakteri setelah putaran ketiga?",
        },
        {
          key: "berhenti",
          label: "Stops when condition is false",
          learner: "Berhenti saat syarat salah",
          weight: 35,
          evidence: "Explains 32 is not < 20 so the loop stops after 5 rounds.",
          ask: "Kenapa tidak lanjut ke 64?",
        },
      ],
      misconceptions: [
        {
          id: "berhenti-di-20",
          description: "Believes the loop stops exactly at 20.",
          signals: ["berhenti di 20"],
        },
      ],
      hints: [
        "Mulai dari 1, kalikan 2 terus.",
        "Periksa syarat setelah tiap putaran.",
      ],
      reference:
        "while mengulang selama bakteri < 20. Setiap putaran bakteri dikali 2 (2, 4, 8, 16, 32) dan jam bertambah 1. Setelah putaran ke-5 bakteri menjadi 32, syarat 32 < 20 salah, jadi perulangan berhenti dengan 5 jam dan 32 bakteri.",
      alternatives: [
        "dikali 2 terus 2 4 8 16 32, 32 udah lebih dari 20 jadi stop di 5 jam",
      ],
    },
    {
      id: "cpp-fungsi",
      topic: "functions",
      difficulty: 2,
      title: "C++ 4: Fungsi",
      summary: "Fungsi C++ punya tipe hasil, nama, dan parameter.",
      objective:
        "The learner explains a function definition with a return type and parameters, and that calling it returns a value.",
      concept:
        "Fungsi ditulis sebagai tipe nama(parameter) { ... }. return mengirim hasil kembali ke pemanggil. Fungsi harus ditulis (atau dideklarasikan) sebelum dipakai di main.",
      analogy:
        "Fungsi seperti mesin pengubah suhu: masukkan Celsius, keluar Fahrenheit.",
      example: {
        language: "cpp",
        code: "#include <iostream>\nusing namespace std;\n\ndouble keFahrenheit(double celsius) {\n  return celsius * 9 / 5 + 32;\n}\n\nint main() {\n  cout << keFahrenheit(100) << endl;\n  cout << keFahrenheit(30) << endl;\n  return 0;\n}",
        output: "212\n86",
        explanation: "100 * 9 / 5 + 32 = 212, dan 30 * 9 / 5 + 32 = 86.",
      },
      prompt:
        "Jelaskan kepada FlipBot: bagaimana keFahrenheit(30) menghasilkan 86?",
      instructions: "Gunakan kata parameter dan return.",
      criteria: [
        {
          key: "parameter",
          label: "celsius receives the argument",
          learner: "Parameter celsius",
          weight: 35,
          evidence: "Explains celsius becomes 30 in the call.",
          ask: "Saat keFahrenheit(30), celsius bernilai berapa?",
        },
        {
          key: "rumus",
          label: "Computes the formula",
          learner: "Menghitung rumus",
          weight: 30,
          evidence: "Shows 30 * 9 / 5 + 32 = 86.",
          ask: "Berapa 30 * 9 / 5?",
        },
        {
          key: "return",
          label: "return sends the result back",
          learner: "return mengirim hasil",
          weight: 35,
          evidence:
            "Explains return gives 86 back to main, where cout shows it.",
          ask: "Siapa yang menampilkan 86?",
        },
      ],
      misconceptions: [
        {
          id: "return-tampil",
          description: "Believes return prints the value.",
          signals: ["return menampilkan"],
        },
      ],
      hints: ["Ganti celsius dengan 30.", "Hitung dari kiri: 30 * 9 = 270."],
      reference:
        "Saat keFahrenheit(30) dipanggil, parameter celsius bernilai 30. Fungsi menghitung 30 * 9 / 5 + 32 = 86, lalu return mengirim 86 kembali ke main, dan cout menampilkannya.",
      alternatives: ["celsius jadi 30, 30*9/5+32 = 86 terus direturn"],
    },
    {
      id: "cpp-vector",
      topic: "collections",
      difficulty: 3,
      title: "C++ 5: vector dan Perulangan Range-for",
      summary:
        "vector adalah daftar yang bisa bertambah; range-for mengunjungi setiap isinya.",
      objective:
        "The learner explains that a vector stores a growable list, push_back adds to the end, size() counts items, and range-for visits each element.",
      concept:
        "vector<int> menyimpan daftar angka yang bisa bertambah. push_back menambah di akhir, size() menghitung isi. for (int x : nilai) mengunjungi setiap isi satu per satu tanpa perlu indeks.",
      analogy:
        "vector seperti kereta yang gerbongnya bisa ditambah di belakang kapan saja.",
      example: {
        language: "cpp",
        code: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  vector<int> nilai = {70, 85};\n  nilai.push_back(90);\n  int total = 0;\n  for (int x : nilai) {\n    total += x;\n  }\n  cout << nilai.size() << " nilai, total " << total << endl;\n  return 0;\n}',
        output: "3 nilai, total 245",
        explanation:
          "push_back menambah 90 sehingga ada 3 nilai. Range-for menjumlahkan 70 + 85 + 90 = 245.",
      },
      prompt:
        "Jelaskan kepada FlipBot: mengapa size() menjadi 3 dan total menjadi 245?",
      instructions: "Ceritakan push_back dan for (int x : nilai).",
      criteria: [
        {
          key: "push-back",
          label: "push_back adds an item",
          learner: "push_back menambah isi",
          weight: 35,
          evidence: "Explains push_back adds 90 at the end so size becomes 3.",
          ask: "Berapa isi vector sebelum dan sesudah push_back?",
        },
        {
          key: "range-for",
          label: "range-for visits each item",
          learner: "range-for mengunjungi tiap isi",
          weight: 35,
          evidence: "Explains x takes each value 70, 85, 90 in turn.",
          ask: "Nilai x berapa saja?",
        },
        {
          key: "total",
          label: "Total is 245",
          learner: "Total 245",
          weight: 30,
          evidence: "Computes 70 + 85 + 90 = 245.",
          ask: "Berapa 70 + 85 + 90?",
        },
      ],
      misconceptions: [
        {
          id: "vector-tetap",
          description: "Believes a vector has a fixed size like a plain array.",
          signals: ["tidak bisa ditambah"],
        },
      ],
      hints: ["Hitung isi awal vector.", "Jumlahkan semua nilai."],
      reference:
        "vector nilai awalnya berisi 70 dan 85. push_back menambah 90 di akhir sehingga size() menjadi 3. for (int x : nilai) mengunjungi setiap isi, dan total menjumlahkan 70 + 85 + 90 = 245.",
      alternatives: ["ditambah 90 jadi 3 isi, dijumlah semua 245"],
    },
  ],
};
