import "server-only";
import type {
  LessonSpec,
  TrackSpec,
} from "@/server/learning/content/curriculum/builder";

/** Short helper: a web lesson whose code renders instead of printing. */
function web(
  spec: Omit<LessonSpec, "example"> & {
    language: "html" | "css";
    code: string;
    explanation: string;
  },
): LessonSpec {
  const { language, code, explanation, ...rest } = spec;
  return { ...rest, example: { language, code, output: "", explanation } };
}

/** HTML track (topic order referenced from the W3Schools HTML tutorial). */
export const HTML_TRACK: TrackSpec = {
  id: "jalur-html",
  title: "HTML",
  description:
    "Kerangka setiap halaman web: judul, paragraf, tautan, gambar, daftar, tabel, dan formulir.",
  lessons: [
    web({
      id: "html-struktur",
      topic: "web-structure",
      difficulty: 1,
      title: "HTML 1: Kerangka Halaman Web",
      summary: "Halaman HTML tersusun dari tag pembuka dan penutup.",
      objective:
        "The learner explains that HTML uses opening and closing tags, and that head holds page information while body holds visible content.",
      concept:
        "HTML adalah bahasa untuk menyusun isi halaman web. Isi dibungkus tag, misalnya <p> pembuka dan </p> penutup. <head> berisi informasi tentang halaman (seperti judul di tab browser), sedangkan <body> berisi semua yang terlihat di layar.",
      analogy:
        "HTML seperti kerangka rumah: ada bagian dalam yang tidak terlihat tamu (head) dan ruang tamu yang terlihat (body).",
      language: "html",
      code: "<!DOCTYPE html>\n<html>\n  <head>\n    <title>Halaman FlipBot</title>\n  </head>\n  <body>\n    <h1>Halo, aku FlipBot!</h1>\n    <p>Ini halaman web pertamaku.</p>\n  </body>\n</html>",
      explanation:
        "Judul 'Halaman FlipBot' muncul di tab browser. Di layar terlihat judul besar dan satu paragraf dari dalam <body>.",
      prompt:
        "Jelaskan kepada FlipBot: apa beda <head> dan <body>, dan mengapa tag punya pembuka dan penutup?",
      instructions: "Sebutkan apa yang terlihat di layar dan apa yang tidak.",
      criteria: [
        {
          key: "tag-pasangan",
          label: "Tags open and close",
          learner: "Tag pembuka dan penutup",
          weight: 35,
          evidence:
            "Explains content is wrapped between an opening tag and a closing tag with /.",
          ask: "Apa arti tanda / pada </p>?",
        },
        {
          key: "head",
          label: "head holds page information",
          learner: "Isi head tidak tampil di halaman",
          weight: 30,
          evidence:
            "Explains head holds information such as the title shown in the browser tab.",
          ask: "Di mana judul 'Halaman FlipBot' muncul?",
        },
        {
          key: "body",
          label: "body holds visible content",
          learner: "body berisi yang terlihat",
          weight: 35,
          evidence: "Explains body contains what appears on the page.",
          ask: "Bagian mana yang terlihat di layar?",
          misconceptions: ["head-tampil"],
        },
      ],
      misconceptions: [
        {
          id: "head-tampil",
          description: "Believes the head content is shown on the page body.",
          signals: ["head tampil di halaman"],
        },
      ],
      hints: [
        "Lihat tab browser dan isi halaman.",
        "Setiap isi punya tag pembuka dan penutup.",
      ],
      reference:
        "HTML membungkus isi dengan tag pembuka dan penutup (memakai /). <head> menyimpan informasi halaman seperti judul di tab browser, sedangkan <body> berisi semua yang tampil di layar, seperti judul h1 dan paragraf.",
      alternatives: [
        "head itu info halaman kayak judul tab, body yang keliatan. tag ada buka tutup",
      ],
    }),
    web({
      id: "html-teks",
      topic: "web-content",
      difficulty: 1,
      title: "HTML 2: Judul, Paragraf, dan Teks Tebal",
      summary:
        "h1–h6 untuk judul, p untuk paragraf, strong dan em untuk penekanan.",
      objective:
        "The learner explains heading levels h1–h6, paragraphs, and emphasis tags.",
      concept:
        "Judul memakai <h1> sampai <h6>; h1 paling penting dan paling besar. Paragraf memakai <p>. <strong> menebalkan teks yang penting dan <em> memiringkan teks yang ditekankan.",
      analogy:
        "Seperti koran: ada judul utama besar, sub-judul lebih kecil, lalu paragraf berita.",
      language: "html",
      code: "<h1>Petualangan FlipBot</h1>\n<h2>Bab 1: Bangun Pagi</h2>\n<p>FlipBot bangun <strong>sangat pagi</strong> dan <em>langsung</em> belajar.</p>",
      explanation:
        "h1 tampil paling besar, h2 lebih kecil. Kata 'sangat pagi' menjadi tebal dan 'langsung' menjadi miring.",
      prompt:
        "Jelaskan kepada FlipBot: apa beda h1 dan h2, dan apa gunanya strong?",
      instructions: "Ceritakan tingkatan judul.",
      criteria: [
        {
          key: "tingkat-judul",
          label: "h1–h6 are heading levels",
          learner: "Tingkatan judul",
          weight: 35,
          evidence:
            "Explains h1 is the most important/largest heading and h2 is a smaller sub-heading.",
          ask: "Mana yang lebih penting, h1 atau h2?",
        },
        {
          key: "paragraf",
          label: "p makes a paragraph",
          learner: "p untuk paragraf",
          weight: 30,
          evidence: "States <p> marks a paragraph of text.",
          ask: "Tag apa untuk paragraf?",
        },
        {
          key: "penekanan",
          label: "strong/em emphasise",
          learner: "strong dan em",
          weight: 35,
          evidence: "Explains strong makes important text bold and em italic.",
          ask: "Apa yang terjadi pada 'sangat pagi'?",
        },
      ],
      misconceptions: [
        {
          id: "h-untuk-tebal",
          description: "Uses headings just to make text bold.",
          signals: ["h1 biar tebal"],
        },
      ],
      hints: [
        "Angka di h1 dan h2 menunjukkan tingkat.",
        "Lihat kata di dalam <strong>.",
      ],
      reference:
        "h1 sampai h6 adalah tingkatan judul; h1 paling penting dan besar, h2 sub-judul yang lebih kecil. <p> membuat paragraf. <strong> menebalkan teks penting dan <em> memiringkan teks yang ditekankan.",
      alternatives: [
        "h1 judul utama, h2 subjudul. strong bikin tebal kata penting",
      ],
    }),
    web({
      id: "html-tautan-gambar",
      topic: "web-content",
      difficulty: 1,
      title: "HTML 3: Tautan dan Gambar",
      summary:
        "a membuat tautan dengan href; img menampilkan gambar dengan src dan alt.",
      objective:
        "The learner explains attributes: href in a link, src and alt in an image, and why alt matters.",
      concept:
        "Tag <a> membuat tautan; atribut href berisi alamat tujuannya. Tag <img> menampilkan gambar; src berisi lokasi gambar dan alt berisi penjelasan gambar untuk orang yang tidak bisa melihatnya. <img> tidak punya tag penutup.",
      analogy:
        "href seperti alamat di amplop surat, dan alt seperti keterangan foto di album.",
      language: "html",
      code: '<a href="https://www.w3schools.com">Belajar di W3Schools</a>\n<img src="flipbot.png" alt="Robot FlipBot melambaikan tangan" width="120">',
      explanation:
        "Teks tautan bisa diklik dan membuka alamat di href. Gambar diambil dari src; jika gambar tidak bisa dimuat, teks alt ditampilkan dan dibacakan pembaca layar.",
      prompt:
        "Jelaskan kepada FlipBot: apa itu atribut, dan apa gunanya href, src, dan alt?",
      instructions: "Ceritakan siapa yang terbantu oleh alt.",
      criteria: [
        {
          key: "atribut",
          label: "Attributes add information to tags",
          learner: "Atribut memberi info tambahan",
          weight: 30,
          evidence:
            "Explains attributes like href/src are written inside the opening tag to add information.",
          ask: "Di mana atribut ditulis?",
        },
        {
          key: "href-src",
          label: "href is the link target; src the image file",
          learner: "Arti href dan src",
          weight: 35,
          evidence:
            "Explains href holds where the link goes and src where the image is.",
          ask: "Apa isi href?",
        },
        {
          key: "alt",
          label: "alt describes the image",
          learner: "Gunanya alt",
          weight: 35,
          evidence:
            "Explains alt describes the image for people who cannot see it or when it fails to load.",
          ask: "Siapa yang membutuhkan teks alt?",
          misconceptions: ["alt-hiasan"],
        },
      ],
      misconceptions: [
        {
          id: "alt-hiasan",
          description: "Believes alt is optional decoration.",
          signals: ["alt tidak penting"],
        },
      ],
      hints: [
        "Bayangkan temanmu tidak bisa melihat gambar.",
        "Atribut ditulis di dalam tag pembuka.",
      ],
      reference:
        "Atribut menambah informasi pada tag. href pada <a> berisi alamat tujuan tautan. src pada <img> menunjukkan file gambar, dan alt berisi penjelasan gambar yang dibacakan pembaca layar atau ditampilkan jika gambar gagal dimuat.",
      alternatives: [
        "href alamat link, src lokasi gambar, alt penjelasan buat yang ga bisa liat",
      ],
    }),
    web({
      id: "html-daftar-tabel",
      topic: "web-content",
      difficulty: 2,
      title: "HTML 4: Daftar dan Tabel",
      summary: "ul/ol/li untuk daftar; table/tr/th/td untuk tabel.",
      objective:
        "The learner explains ordered vs unordered lists and the row/cell structure of a table.",
      concept:
        "<ul> membuat daftar berpoin, <ol> membuat daftar bernomor, dan setiap isi memakai <li>. Tabel memakai <table>; setiap baris adalah <tr>, judul kolom memakai <th>, dan isi sel memakai <td>.",
      analogy:
        "Tabel seperti jadwal pelajaran: baris untuk hari, kolom untuk jam.",
      language: "html",
      code: '<ol>\n  <li>Baca konsep</li>\n  <li>Ajari FlipBot</li>\n</ol>\n<table border="1">\n  <tr><th>Nama</th><th>Skor</th></tr>\n  <tr><td>Ani</td><td>90</td></tr>\n  <tr><td>Budi</td><td>85</td></tr>\n</table>',
      explanation:
        "Daftar bernomor 1 dan 2 muncul. Tabel punya 3 baris: baris judul (Nama, Skor) dan dua baris data.",
      prompt:
        "Jelaskan kepada FlipBot: apa beda ol dan ul, dan bagaimana tabel disusun dari tr, th, dan td?",
      instructions: "Hitung jumlah baris tabel.",
      criteria: [
        {
          key: "ol-ul",
          label: "ol numbered, ul bulleted",
          learner: "ol bernomor, ul berpoin",
          weight: 30,
          evidence:
            "Explains ol makes a numbered list and ul a bulleted list, with li items.",
          ask: "Daftar di contoh bernomor atau berpoin?",
        },
        {
          key: "baris",
          label: "tr is a row",
          learner: "tr adalah baris",
          weight: 35,
          evidence: "Explains each tr is one row of the table.",
          ask: "Ada berapa tr?",
        },
        {
          key: "th-td",
          label: "th header cell, td data cell",
          learner: "th dan td",
          weight: 35,
          evidence: "Explains th is a header cell and td a normal data cell.",
          ask: "Apa beda Nama (th) dan Ani (td)?",
        },
      ],
      misconceptions: [
        {
          id: "tr-kolom",
          description: "Believes tr defines a column.",
          signals: ["tr itu kolom"],
        },
      ],
      hints: [
        "Hitung berapa kali <tr> muncul.",
        "o pada ol = ordered (berurutan).",
      ],
      reference:
        "<ol> membuat daftar bernomor dan <ul> daftar berpoin, dengan setiap isi di <li>. Tabel tersusun dari baris <tr>; sel judul memakai <th> dan sel data memakai <td>. Contoh tabel punya 3 baris: satu baris judul dan dua baris data.",
      alternatives: [
        "ol pakai nomor ul pakai titik. tr baris, th judul, td isi",
      ],
    }),
    web({
      id: "html-form",
      topic: "forms",
      difficulty: 2,
      title: "HTML 5: Formulir dan Input",
      summary: "form, label, dan input mengumpulkan jawaban pengguna.",
      objective:
        "The learner explains that forms collect input, label describes an input (linked by for/id), and input types change the control.",
      concept:
        "<form> mengelompokkan isian. <input> adalah kotak isian; atribut type menentukan jenisnya, misalnya text, number, atau checkbox. <label> memberi nama isian; jika for pada label sama dengan id pada input, mengeklik label akan memilih input tersebut.",
      analogy:
        "Formulir seperti lembar pendaftaran lomba: ada nama kolom (label) dan kotak untuk diisi (input).",
      language: "html",
      code: '<form>\n  <label for="nama">Nama samaran</label>\n  <input id="nama" type="text" placeholder="contoh: penjelajah7">\n  <label for="kelas">Kelas</label>\n  <input id="kelas" type="number" min="1" max="6">\n  <button type="submit">Kirim</button>\n</form>',
      explanation:
        "Muncul dua isian dengan labelnya. Isian kelas hanya menerima angka 1 sampai 6, dan tombol Kirim mengirim formulir.",
      prompt:
        "Jelaskan kepada FlipBot: apa gunanya label, dan mengapa type pada input penting?",
      instructions: "Ceritakan hubungan for dan id.",
      criteria: [
        {
          key: "mengumpulkan",
          label: "Forms collect input",
          learner: "Formulir mengumpulkan isian",
          weight: 30,
          evidence: "States a form collects information typed by the user.",
          ask: "Apa tujuan formulir?",
        },
        {
          key: "label-for",
          label: "label for matches input id",
          learner: "Hubungan label dan input",
          weight: 35,
          evidence:
            "Explains label describes the input and for/id connect them.",
          ask: "Apa yang menghubungkan label Nama dengan inputnya?",
        },
        {
          key: "type",
          label: "type changes the input",
          learner: "type menentukan jenis isian",
          weight: 35,
          evidence:
            "Explains type=number accepts numbers (with min/max) while text accepts words.",
          ask: "Apa beda type text dan number?",
        },
      ],
      misconceptions: [
        {
          id: "label-hiasan",
          description: "Believes label is only decoration.",
          signals: ["label cuma tulisan"],
        },
      ],
      hints: [
        'Bandingkan for="nama" dan id="nama".',
        "Coba ketik huruf di isian kelas.",
      ],
      reference:
        "Formulir mengumpulkan isian pengguna. <label> memberi nama isian; for pada label sama dengan id pada input sehingga keduanya terhubung. type menentukan jenis isian: text untuk kata, number untuk angka (dengan batas min dan max).",
      alternatives: [
        "label namanya kolom, nyambung lewat for sama id. type number cuma angka",
      ],
    }),
  ],
};

/** CSS track (topic order referenced from the W3Schools CSS tutorial). */
export const CSS_TRACK: TrackSpec = {
  id: "jalur-css",
  title: "CSS",
  description:
    "Membuat halaman web cantik: warna, kotak, tata letak flexbox dan grid, sampai tampilan HP.",
  lessons: [
    web({
      id: "css-selektor",
      topic: "styling",
      difficulty: 1,
      title: "CSS 1: Selektor, Properti, dan Warna",
      summary: "Aturan CSS memilih elemen lalu memberi gaya.",
      objective:
        "The learner explains a CSS rule: selector chooses elements, property: value sets style, and class selectors target specific elements.",
      concept:
        'CSS mengatur tampilan HTML. Sebuah aturan terdiri dari selektor (elemen mana) dan deklarasi properti: nilai di dalam { }. Selektor tag seperti p memilih semua paragraf, sedangkan selektor kelas .penting memilih elemen dengan class="penting".',
      analogy:
        "Selektor seperti memanggil 'semua murid kelas 5', lalu deklarasi adalah perintahnya: 'pakai topi merah'.",
      language: "css",
      code: "p {\n  color: navy;\n  font-size: 18px;\n}\n.penting {\n  color: white;\n  background-color: orange;\n}",
      explanation:
        "Semua paragraf menjadi biru tua berukuran 18px. Elemen dengan class penting bertulisan putih di latar oranye.",
      prompt:
        "Jelaskan kepada FlipBot: bagian mana selektor, properti, dan nilai, dan apa beda p dan .penting?",
      instructions: "Tunjuk satu contoh properti dan nilainya.",
      criteria: [
        {
          key: "selektor",
          label: "Selector chooses elements",
          learner: "Selektor memilih elemen",
          weight: 35,
          evidence:
            "Explains the selector (p or .penting) chooses which elements get the style.",
          ask: "Elemen mana yang dipilih oleh p?",
        },
        {
          key: "properti-nilai",
          label: "property: value sets style",
          learner: "Properti dan nilai",
          weight: 30,
          evidence:
            "Explains declarations like color: navy set a property to a value.",
          ask: "Pada color: navy, mana properti dan mana nilai?",
        },
        {
          key: "kelas",
          label: ".class targets specific elements",
          learner: "Selektor kelas",
          weight: 35,
          evidence:
            'Explains .penting only styles elements with class="penting".',
          ask: "Elemen mana yang terkena .penting?",
          misconceptions: ["kelas-semua"],
        },
      ],
      misconceptions: [
        {
          id: "kelas-semua",
          description: "Believes a class rule styles every element.",
          signals: ["semua jadi oranye"],
        },
      ],
      hints: [
        "Titik di depan nama berarti kelas.",
        "Sebelum titik dua adalah properti.",
      ],
      reference:
        'Aturan CSS terdiri dari selektor dan deklarasi properti: nilai. Selektor p memilih semua paragraf lalu color: navy mengubah warnanya. Selektor .penting hanya memilih elemen dengan class="penting".',
      alternatives: [
        "p milih semua paragraf, .penting cuma yang classnya penting. color properti navy nilainya",
      ],
    }),
    web({
      id: "css-box-model",
      topic: "styling",
      difficulty: 2,
      title: "CSS 2: Box Model (Margin, Border, Padding)",
      summary: "Setiap elemen adalah kotak: isi, padding, border, margin.",
      objective:
        "The learner explains the box model layers: content, padding (inside the border), border, margin (outside the border).",
      concept:
        "Setiap elemen HTML adalah kotak berlapis. Paling dalam adalah isi. Padding adalah ruang di dalam garis tepi. Border adalah garis tepinya. Margin adalah jarak di luar garis tepi, memisahkan kotak dari kotak lain.",
      analogy:
        "Seperti foto dalam bingkai: foto (isi), kertas putih di sekelilingnya (padding), bingkai (border), dan jarak ke foto lain di dinding (margin).",
      language: "css",
      code: ".kartu {\n  padding: 16px;\n  border: 3px solid indigo;\n  margin: 24px;\n  background-color: lavender;\n}",
      explanation:
        "Isi kartu berjarak 16px dari garis ungu setebal 3px, dan seluruh kartu berjarak 24px dari elemen lain. Warna latar mengisi area isi dan padding.",
      prompt: "Jelaskan kepada FlipBot: apa beda padding dan margin?",
      instructions: "Sebutkan urutan lapisan dari dalam ke luar.",
      criteria: [
        {
          key: "lapisan",
          label: "Names the layers in order",
          learner: "Urutan lapisan kotak",
          weight: 30,
          evidence:
            "Lists content, padding, border, margin from inside to outside.",
          ask: "Lapisan apa yang paling luar?",
        },
        {
          key: "padding",
          label: "Padding is inside the border",
          learner: "Padding di dalam garis",
          weight: 35,
          evidence: "Explains padding is space between content and border.",
          ask: "Padding ada di dalam atau di luar border?",
          misconceptions: ["padding-margin-sama"],
        },
        {
          key: "margin",
          label: "Margin is outside the border",
          learner: "Margin di luar garis",
          weight: 35,
          evidence:
            "Explains margin is space outside the border between boxes.",
          ask: "Apa yang dipisahkan oleh margin?",
        },
      ],
      misconceptions: [
        {
          id: "padding-margin-sama",
          description: "Believes padding and margin are the same.",
          signals: ["sama saja", "dua-duanya jarak"],
        },
      ],
      hints: [
        "Bayangkan foto dalam bingkai.",
        "Warna latar ikut mengisi padding, bukan margin.",
      ],
      reference:
        "Kotak terdiri dari isi, padding, border, lalu margin dari dalam ke luar. Padding adalah ruang di dalam border antara isi dan garis, sehingga ikut berwarna latar. Margin adalah ruang di luar border yang memisahkan kotak dari elemen lain.",
      alternatives: [
        "padding jarak dalam sebelum garis, margin jarak luar ke kotak lain",
      ],
    }),
    web({
      id: "css-flexbox",
      topic: "layout",
      difficulty: 2,
      title: "CSS 3: Tata Letak dengan Flexbox",
      summary:
        "display: flex menyusun anak-anak elemen dalam satu baris yang rapi.",
      objective:
        "The learner explains that display:flex arranges children in a row, justify-content spaces them along the row, and gap adds space between them.",
      concept:
        "display: flex membuat isi sebuah wadah tersusun berjajar dalam satu baris. justify-content mengatur posisi di sepanjang baris (misalnya space-between membagi ruang rata). align-items mengatur posisi tegak. gap memberi jarak antar isi.",
      analogy:
        "Seperti menata buku di rak: semua buku berjajar, lalu kamu atur jaraknya supaya rapi.",
      language: "css",
      code: ".menu {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 12px;\n}",
      explanation:
        "Semua anak dari .menu berjajar dalam satu baris, ujung kiri dan kanan menempel ke tepi, sisa ruang dibagi rata, dan semuanya rata tengah secara tegak.",
      prompt:
        "Jelaskan kepada FlipBot: apa yang berubah saat wadah diberi display: flex, dan apa gunanya justify-content?",
      instructions: "Bandingkan sebelum dan sesudah flex.",
      criteria: [
        {
          key: "berjajar",
          label: "Children line up in a row",
          learner: "Isi berjajar sebaris",
          weight: 35,
          evidence:
            "Explains display:flex puts the children side by side in a row.",
          ask: "Bagaimana posisi isi setelah flex?",
        },
        {
          key: "justify",
          label: "justify-content spaces along the row",
          learner: "Arti justify-content",
          weight: 35,
          evidence:
            "Explains justify-content (space-between) distributes the space along the row.",
          ask: "Bagaimana sisa ruang dibagi?",
        },
        {
          key: "wadah-anak",
          label: "Flex is set on the container",
          learner: "flex dipasang di wadah",
          weight: 30,
          evidence:
            "Explains the rule is on the parent container and affects its children.",
          ask: "Aturan flex ditulis di wadah atau di setiap anak?",
          misconceptions: ["flex-di-anak"],
        },
      ],
      misconceptions: [
        {
          id: "flex-di-anak",
          description: "Believes display:flex must be set on each child.",
          signals: ["setiap anak diberi flex"],
        },
      ],
      hints: [
        "Tanpa flex, elemen blok tersusun ke bawah.",
        "space-between: ujung kiri dan kanan menempel tepi.",
      ],
      reference:
        "display: flex dipasang pada wadah sehingga anak-anaknya berjajar dalam satu baris. justify-content: space-between menempelkan isi pertama dan terakhir ke tepi dan membagi sisa ruang rata, align-items: center meratakan secara tegak, dan gap memberi jarak antar isi.",
      alternatives: [
        "flex bikin isinya sebaris. justify-content ngatur jarak di baris",
      ],
    }),
    web({
      id: "css-grid",
      topic: "layout",
      difficulty: 3,
      title: "CSS 4: Tata Letak Grid",
      summary: "display: grid menyusun isi menjadi kolom dan baris.",
      objective:
        "The learner explains grid-template-columns defines columns, fr shares free space, and items fill cells row by row.",
      concept:
        "display: grid membuat wadah berbentuk petak-petak. grid-template-columns menentukan jumlah dan lebar kolom. Satuan fr berarti 'bagian dari sisa ruang'. Isi mengisi petak dari kiri ke kanan, lalu turun ke baris berikutnya.",
      analogy:
        "Seperti papan catur atau kotak telur: setiap isi menempati satu petak.",
      language: "css",
      code: ".galeri {\n  display: grid;\n  grid-template-columns: 1fr 2fr 1fr;\n  gap: 8px;\n}",
      explanation:
        "Galeri punya 3 kolom; kolom tengah dua kali lebih lebar. Isi ke-4 pindah ke baris kedua.",
      prompt:
        "Jelaskan kepada FlipBot: apa arti 1fr 2fr 1fr, dan di mana isi ke-4 ditempatkan?",
      instructions: "Ceritakan cara isi mengisi petak.",
      criteria: [
        {
          key: "kolom",
          label: "Defines three columns",
          learner: "Tiga kolom",
          weight: 30,
          evidence:
            "Explains grid-template-columns with three values makes three columns.",
          ask: "Ada berapa kolom?",
        },
        {
          key: "fr",
          label: "fr shares space",
          learner: "Arti fr",
          weight: 35,
          evidence:
            "Explains the middle column (2fr) is twice as wide as the 1fr columns.",
          ask: "Kolom mana yang paling lebar?",
        },
        {
          key: "mengisi",
          label: "Items fill row by row",
          learner: "Isi mengisi per baris",
          weight: 35,
          evidence:
            "Explains items fill left to right and the 4th moves to the next row.",
          ask: "Di mana isi ke-4?",
        },
      ],
      misconceptions: [
        {
          id: "fr-piksel",
          description: "Believes fr is a fixed pixel size.",
          signals: ["fr itu piksel"],
        },
      ],
      hints: [
        "Jumlahkan 1 + 2 + 1 bagian.",
        "Setelah 3 kolom penuh, isi berikutnya ke mana?",
      ],
      reference:
        "grid-template-columns: 1fr 2fr 1fr membuat tiga kolom; sisa ruang dibagi 4 bagian sehingga kolom tengah dua kali lebih lebar. Isi mengisi petak dari kiri ke kanan, jadi setelah 3 kolom penuh isi ke-4 pindah ke baris kedua.",
      alternatives: [
        "3 kolom, tengah 2 kali lebih lebar. yang ke 4 turun ke baris 2",
      ],
    }),
    web({
      id: "css-responsif",
      topic: "responsive",
      difficulty: 3,
      title: "CSS 5: Tampilan Responsif dengan Media Query",
      summary: "@media mengubah gaya sesuai lebar layar, misalnya untuk HP.",
      objective:
        "The learner explains that a media query applies rules only when the condition (screen width) is met, so layouts adapt to phones.",
      concept:
        "Halaman web dibuka di layar besar dan kecil. @media (max-width: 600px) { ... } berarti aturan di dalamnya hanya berlaku jika lebar layar 600px atau kurang. Dengan begitu, susunan bisa berubah, misalnya dari tiga kolom menjadi satu kolom di HP.",
      analogy:
        "Seperti memakai jaket hanya saat cuaca dingin: aturan tambahan dipakai hanya jika syaratnya terpenuhi.",
      language: "css",
      code: ".galeri {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n}\n@media (max-width: 600px) {\n  .galeri {\n    grid-template-columns: 1fr;\n  }\n}",
      explanation:
        "Di laptop galeri tiga kolom. Di layar 600px atau lebih kecil, galeri menjadi satu kolom sehingga mudah dibaca di HP.",
      prompt:
        "Jelaskan kepada FlipBot: kapan aturan di dalam @media dipakai, dan apa yang berubah di HP?",
      instructions: "Sebutkan syarat lebar layarnya.",
      criteria: [
        {
          key: "syarat",
          label: "Rules apply only when the condition holds",
          learner: "Berlaku jika syarat terpenuhi",
          weight: 35,
          evidence:
            "Explains the media query applies its rules only when the screen is 600px wide or less.",
          ask: "Kapan aturan di dalam @media berlaku?",
        },
        {
          key: "perubahan",
          label: "Three columns become one",
          learner: "3 kolom jadi 1",
          weight: 35,
          evidence:
            "Explains the gallery changes from three columns to one on small screens.",
          ask: "Berapa kolom di HP?",
        },
        {
          key: "alasan",
          label: "Why: readable on phones",
          learner: "Alasan responsif",
          weight: 30,
          evidence:
            "Explains the purpose is to keep the page readable on small screens.",
          ask: "Kenapa tampilan perlu berubah di HP?",
          misconceptions: ["media-selalu"],
        },
      ],
      misconceptions: [
        {
          id: "media-selalu",
          description: "Believes media query rules always apply.",
          signals: ["selalu dipakai"],
        },
      ],
      hints: [
        "max-width berarti 'paling lebar'.",
        "Bayangkan tiga kolom di layar HP yang sempit.",
      ],
      reference:
        "Aturan di dalam @media (max-width: 600px) hanya berlaku jika lebar layar 600px atau kurang. Saat itu galeri berubah dari tiga kolom menjadi satu kolom, sehingga isinya tetap mudah dibaca di HP.",
      alternatives: [
        "kalau layarnya 600 ke bawah jadi 1 kolom biar enak di hp",
      ],
    }),
  ],
};
