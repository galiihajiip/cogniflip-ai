import Image from "next/image";
import Link from "next/link";

const EXPLORE = [
  { href: "/", label: "Beranda" },
  { href: "/belajar", label: "Belajar" },
  { href: "/ide", label: "Mini IDE" },
  { href: "/misi", label: "Misi Debug" },
] as const;

const HELP = [
  { href: "/petunjuk", label: "Petunjuk FlipBot" },
  { href: "/panduan", label: "Panduan Guru & Orang Tua" },
  { href: "/privasi", label: "Ruang Aman Anak" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.03)]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 lg:px-12">
        <div className="space-y-3 md:col-span-6">
          <Image
            src="/brand/cogniflip-logo.png"
            alt="CogniFlip"
            width={685}
            height={200}
            className="h-10 w-auto"
          />
          <p className="text-body-md font-semibold italic text-primary">
            Flip the Way You Learn.
          </p>
          <p className="max-w-sm text-body-sm text-on-surface-variant">
            Ruang untuk bertanya, mencoba, memahami, dan menciptakan sesuatu
            dengan kode.
          </p>
        </div>
        <FooterLinks
          title="Jelajahi"
          links={EXPLORE}
          className="md:col-span-3"
        />
        <FooterLinks title="Bantuan" links={HELP} className="md:col-span-3" />
      </div>
      <div className="border-t border-surface-container">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-label-ui font-medium text-on-surface-variant sm:px-6 md:flex-row md:items-center md:justify-between lg:px-12">
          <p>
            © 2026 CogniFlip. Ruang Eksplorasi &amp; Kreasi Kode Anak Bangsa.
          </p>
          <p>
            Developed by{" "}
            <span className="font-bold text-primary">Galih Aji Pangestu</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
  className,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  className?: string;
}) {
  return (
    <nav aria-label={title} className={className}>
      <h2 className="text-label-ui uppercase text-on-surface">{title}</h2>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-9 items-center text-body-sm text-on-surface-variant hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
