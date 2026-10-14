"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/app/_components/account";
import { Icon } from "@/app/_components/icon";
import { apiFetch } from "@/app/_lib/api";
import { AVATAR_ICON } from "@/app/_lib/view";
import { meResponseSchema } from "@/shared/api/auth";

const NAV = [
  { href: "/", label: "Beranda", exact: true },
  {
    href: "/belajar",
    label: "Belajar",
    badge: "Alur Utama",
    badgeTone: "secondary",
  },
  { href: "/ide", label: "Mini IDE", badge: "Lab Kode", badgeTone: "neutral" },
  { href: "/misi", label: "Misi Debug" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const account = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close menus after navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node))
        setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  async function logout() {
    await apiFetch("/api/auth/logout", meResponseSchema, {
      method: "POST",
      body: {},
    });
    await account.refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label="CogniFlip, ke beranda"
          >
            <Image
              src="/brand/cogniflip-logo.png"
              alt=""
              width={685}
              height={200}
              priority
              className="h-11 w-auto"
            />
          </Link>
          <nav
            aria-label="Menu utama"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV.map((item) => {
              const active = isActive(
                pathname,
                item.href,
                "exact" in item && item.exact,
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-body-md transition-colors ${
                    active
                      ? "bg-surface-container font-semibold text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <span>{item.label}</span>
                  {"badge" in item ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-label-ui ${
                        item.badgeTone === "secondary"
                          ? "bg-secondary-fixed text-on-secondary-fixed"
                          : "bg-surface-container font-mono font-normal text-on-surface-variant"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {account.status === "signed_in" && account.totalXp !== null ? (
            <Link
              href="/perjalanan"
              className="hidden items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1.5 text-label-ui text-on-secondary-fixed shadow-sm sm:flex"
              aria-label={`${account.totalXp} XP, lihat perjalananku`}
            >
              <Icon name="bolt" className="text-secondary" size={18} />
              <span>{account.totalXp} XP</span>
            </Link>
          ) : null}
          <Link
            href="/belajar"
            className="btn-primary hidden !min-h-0 !rounded-full !px-5 !py-2.5 text-label-ui md:inline-flex"
          >
            Mulai Belajar
          </Link>

          {account.status === "signed_in" ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full p-1"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label={`Akun ${account.handle}`}
                onClick={() => setAccountOpen((o) => !o)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
                  <Icon
                    name={AVATAR_ICON[account.avatarKey ?? ""] ?? "person"}
                    size={20}
                  />
                </span>
                <Icon name="expand_more" className="text-on-surface-variant" />
              </button>
              {accountOpen ? (
                <div
                  role="menu"
                  className="card absolute right-0 top-12 w-60 p-2"
                >
                  <p className="px-3 py-2 text-label-ui text-on-surface-variant">
                    Masuk sebagai{" "}
                    <span className="text-primary">@{account.handle}</span>
                  </p>
                  <AccountLink href="/profil" icon="person">
                    Profil &amp; Privasi
                  </AccountLink>
                  <AccountLink href="/perjalanan" icon="history">
                    Perjalananku
                  </AccountLink>
                  <AccountLink href="/peringkat" icon="leaderboard">
                    Papan Peringkat
                  </AccountLink>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-body-md text-on-surface hover:bg-surface-container-low"
                  >
                    <Icon name="logout" />
                    Keluar
                  </button>
                </div>
              ) : null}
            </div>
          ) : account.status === "signed_out" ? (
            <Link
              href="/masuk"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-body-md font-semibold text-primary hover:bg-surface-container-low sm:inline-flex"
            >
              <Icon name="login" />
              Masuk
            </Link>
          ) : null}

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container-low lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-seluler"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={26} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="menu-seluler"
          aria-label="Menu utama"
          className="border-t border-surface-container px-4 pb-4 pt-2 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={
                    isActive(pathname, item.href, "exact" in item && item.exact)
                      ? "page"
                      : undefined
                  }
                  className="flex min-h-12 items-center justify-between rounded-xl px-3 text-body-lg text-on-surface hover:bg-surface-container-low aria-[current=page]:bg-surface-container aria-[current=page]:text-primary"
                >
                  {item.label}
                  {"badge" in item ? (
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-ui text-on-surface-variant">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
            {account.status === "signed_out" ? (
              <li>
                <Link
                  href="/masuk"
                  className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-body-lg font-semibold text-primary hover:bg-surface-container-low"
                >
                  <Icon name="login" /> Masuk
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function AccountLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low"
    >
      <Icon name={icon} />
      {children}
    </Link>
  );
}
