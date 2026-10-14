import Link from "next/link";
import { Icon } from "@/app/_components/icon";

/** Shown when a page needs an account; the server still enforces it. */
export function SignInNeeded({ what, next }: { what: string; next: string }) {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center gap-4 p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
        <Icon name="lock" size={28} />
      </span>
      <h1 className="text-headline-md text-on-surface">Masuk dulu, yuk</h1>
      <p className="text-body-md text-on-surface-variant">
        Kamu perlu akun untuk {what}. Akun cukup memakai nama samaran dan kata
        sandi.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={`/masuk?lanjut=${encodeURIComponent(next)}`}
          className="btn-primary"
        >
          <Icon name="login" /> Masuk
        </Link>
        <Link href="/daftar" className="btn-secondary">
          Buat Akun
        </Link>
      </div>
    </div>
  );
}
