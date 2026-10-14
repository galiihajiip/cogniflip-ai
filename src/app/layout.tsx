import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AccountProvider } from "@/app/_components/account";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { siteMetadata } from "@/app/site-metadata";
import "./globals.css";

// Self-hosted fonts from the Stitch design (OFL / Apache-2.0); see src/app/_fonts/LICENSES.md.
const jakarta = localFont({
  src: "./_fonts/plus-jakarta-sans-latin.woff2",
  weight: "400 800",
  variable: "--font-jakarta",
  display: "swap",
});
const jetbrains = localFont({
  src: "./_fonts/jetbrains-mono-latin.woff2",
  weight: "400 700",
  variable: "--font-jetbrains",
  display: "swap",
});
const icons = localFont({
  src: "./_fonts/material-symbols-outlined-subset.woff2",
  variable: "--font-icons",
  display: "block",
  preload: true,
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#faf8ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${jetbrains.variable} ${icons.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Lewati ke konten utama
        </a>
        <AccountProvider>
          <SiteHeader />
          <main id="konten" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
        </AccountProvider>
      </body>
    </html>
  );
}
