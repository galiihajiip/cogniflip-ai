import type { Metadata } from "next";
import { InfoPage } from "@/app/_components/info-page";

export const metadata: Metadata = {
  title: "Panduan Guru & Orang Tua",
  description:
    "Apa yang dilakukan CogniFlip, apa yang belum, dan cara mendampingi anak.",
};

export default function GuidePage() {
  return (
    <InfoPage
      kicker="Panduan Guru & Orang Tua"
      title="Mendampingi Anak di CogniFlip"
      intro="CogniFlip melatih anak SD (kelas 4–6) menjelaskan konsep pemrograman dengan kata-katanya sendiri. Halaman ini menjelaskan apa yang dilakukan aplikasi dan batasannya dengan jujur."
      sections={[
        {
          icon: "psychology",
          title: "Metode: belajar dengan mengajar",
          body: (
            <p>
              Anak menjelaskan konsep kepada robot FlipBot. AI menilai setiap
              kriteria rubrik; skor akhir dihitung dengan aturan tetap. Kami
              belum punya studi yang membuktikan dampak belajarnya, jadi kami
              tidak mengklaimnya.
            </p>
          ),
        },
        {
          icon: "warning",
          title: "Status konten",
          body: (
            <p>
              Pelajaran, rubrik, dan misi disusun dengan bantuan AI dan belum
              diperiksa guru. Contoh kode sudah dicek dengan menjalankannya,
              tetapi penjelasannya sebaiknya tetap didampingi orang dewasa.
            </p>
          ),
        },
        {
          icon: "smart_toy",
          title: "Peran AI",
          body: (
            <>
              <p>
                Jawaban anak dikirim ke layanan AI (Google Gemini) untuk
                dinilai, tanpa nama pengguna atau data akun. Bila AI gagal,
                tidak ada nilai yang dibuat.
              </p>
              <p>
                Ketentuan layanan Gemini membatasi pengguna di bawah 18 tahun.
                Risiko ini sudah tercatat dan perlu ditinjau sebelum dipakai
                luas.
              </p>
            </>
          ),
        },
        {
          icon: "terminal",
          title: "Mini IDE",
          body: (
            <p>
              Kode Python dijalankan di browser anak (Pyodide) di dalam worker
              terpisah: tidak dikirim ke server, tidak bisa mengakses internet,
              dan dihentikan setelah 5 detik. Bahasa lain hanya mendapat saran
              AI, yang bisa keliru.
            </p>
          ),
        },
        {
          icon: "family_restroom",
          title: "Cara mendampingi",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Minta anak membacakan penjelasannya, lalu tanyakan “kenapa?”.
              </li>
              <li>
                Bahas petunjuk FlipBot bersama sebelum anak memperbaiki jawaban.
              </li>
              <li>Ingatkan anak tidak menulis data pribadi di jawaban.</li>
            </ul>
          ),
        },
        {
          icon: "block",
          title: "Yang belum tersedia",
          body: (
            <p>
              Fitur suara, komunitas, ruang bermain bersama, laporan guru, dan
              pemulihan kata sandi belum tersedia.
            </p>
          ),
        },
      ]}
    />
  );
}
