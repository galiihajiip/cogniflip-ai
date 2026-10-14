import type { Metadata } from "next";
import { InfoPage } from "@/app/_components/info-page";

export const metadata: Metadata = {
  title: "Petunjuk FlipBot",
  description: "Cara belajar bersama FlipBot di CogniFlip.",
};

export default function HelpPage() {
  return (
    <InfoPage
      kicker="Petunjuk FlipBot"
      title="Cara Belajar Bersama FlipBot"
      intro="FlipBot adalah robot yang ingin belajar. Kamu jadi gurunya! Begini cara memakai CogniFlip."
      sections={[
        {
          icon: "menu_book",
          title: "1. Baca konsepnya",
          body: (
            <p>
              Buka menu Belajar, pilih pelajaran, lalu baca konsep, analogi, dan
              contohnya.
            </p>
          ),
        },
        {
          icon: "record_voice_over",
          title: "2. Ajari FlipBot",
          body: (
            <p>
              Tulis penjelasan dengan kata-katamu sendiri. Kalau FlipBot
              bingung, ia akan bertanya balik. Ejaan tidak dinilai.
            </p>
          ),
        },
        {
          icon: "task_alt",
          title: "3. Lihat hasil rubrik",
          body: (
            <p>
              Setiap kriteria diberi label: tepat, sebagian, atau belum
              terlihat. Kamu boleh memperbaiki penjelasan sampai 3 kali
              penilaian.
            </p>
          ),
        },
        {
          icon: "quiz",
          title: "4. Tebak dan cari bug",
          body: (
            <p>
              Di Misi Debug, tebak hasil kode sebelum melihat jawabannya, lalu
              bantu FlipBot menemukan bug. Salah tidak mengurangi XP.
            </p>
          ),
        },
        {
          icon: "smart_toy",
          title: "FlipBot bisa keliru",
          body: (
            <p>
              Penilaian dibantu AI dan bisa salah. Kalau menurutmu nilainya
              tidak adil, tanyakan pada guru atau orang tuamu.
            </p>
          ),
        },
        {
          icon: "shield",
          title: "Jaga dirimu",
          body: (
            <p>
              Jangan menulis nama asli, alamat, sekolah, nomor telepon, atau
              foto di jawabanmu. FlipBot tidak membutuhkannya.
            </p>
          ),
        },
      ]}
    />
  );
}
