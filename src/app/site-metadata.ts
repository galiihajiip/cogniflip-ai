import type { Metadata } from "next";

/** Site-wide metadata (kept free of next/font so tests can import it). */
const description =
  "CogniFlip — platform belajar coding untuk anak SD: jelaskan, prediksi, dan perbaiki bersama teman AI.";

export const siteMetadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: { default: "CogniFlip", template: "%s · CogniFlip" },
  description,
  applicationName: "CogniFlip",
  openGraph: {
    title: "CogniFlip — Flip the Way You Learn",
    description,
    locale: "id_ID",
    type: "website",
    siteName: "CogniFlip",
  },
  robots: { index: true, follow: true },
};
