import type { Metadata } from "next";
import { InfoPage } from "@/app/_components/info-page";

export const metadata: Metadata = {
  title: "Ruang Aman Anak",
  description:
    "Data apa yang disimpan CogniFlip dan bagaimana anak tetap aman.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      kicker="Ruang Aman Anak"
      title="Privasi dan Keamanan"
      intro="Kami menyimpan data sesedikit mungkin. Berikut yang disimpan, siapa yang bisa melihatnya, dan cara menghapusnya."
      sections={[
        {
          icon: "person",
          title: "Akun tanpa data pribadi",
          body: (
            <p>
              Akun hanya memakai nama samaran dan kata sandi (disimpan teracak).
              Kami tidak meminta nama asli, email, sekolah, lokasi, foto, atau
              suara.
            </p>
          ),
        },
        {
          icon: "history",
          title: "Yang disimpan",
          body: (
            <p>
              Jawaban penjelasan, hasil penilaian, jawaban misi, XP, lencana,
              avatar, dan pengaturan tampilan. Tanpa akun, riwayat terhubung ke
              cookie di browser ini.
            </p>
          ),
        },
        {
          icon: "visibility",
          title: "Siapa yang bisa melihat",
          body: (
            <p>
              Riwayat dan jawaban hanya bisa dilihat pemiliknya. Papan peringkat
              bersifat pilihan dan hanya menampilkan nama samaran, avatar, dan
              XP.
            </p>
          ),
        },
        {
          icon: "smart_toy",
          title: "Data yang dikirim ke AI",
          body: (
            <p>
              Teks jawaban dikirim ke penyedia AI untuk dinilai, tanpa nama
              pengguna atau identitas akun. Jangan menulis data pribadi di
              jawaban. Kode yang kamu <em>jalankan</em> di Mini IDE tetap di
              browsermu dan tidak dikirim ke server; kode baru dikirim ke AI
              kalau kamu menekan “Minta Saran FlipBot”.
            </p>
          ),
        },
        {
          icon: "download",
          title: "Unduh dan hapus",
          body: (
            <p>
              Pemilik akun bisa mengunduh datanya dan menghapus akun beserta
              riwayatnya dari halaman Profil &amp; Privasi.
            </p>
          ),
        },
        {
          icon: "block",
          title: "Tanpa iklan dan pelacak",
          body: (
            <p>
              CogniFlip tidak memasang iklan, analitik pihak ketiga, atau tautan
              ke luar di halaman belajar.
            </p>
          ),
        },
      ]}
    />
  );
}
