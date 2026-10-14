import Link from "next/link";
import { FlipBotAvatar } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { PageFrame } from "@/app/_components/states";

export default function NotFound() {
  return (
    <PageFrame>
      <div className="card mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
        <FlipBotAvatar size="lg" tone="secondary" />
        <h1 className="text-headline-lg text-on-surface">
          Halaman tidak ditemukan
        </h1>
        <p className="text-body-md text-on-surface-variant">
          FlipBot sudah mencari ke mana-mana, tapi halaman ini tidak ada.
          Mungkin pelajarannya belum dibuka.
        </p>
        <Link href="/belajar" className="btn-primary">
          <Icon name="arrow_back" /> Kembali Belajar
        </Link>
      </div>
    </PageFrame>
  );
}
