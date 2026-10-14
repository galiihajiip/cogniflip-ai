import type { MetadataRoute } from "next";

const base = process.env.APP_BASE_URL ?? "http://localhost:3000";

/**
 * Public pages only. Learner sessions, profiles, history and the
 * leaderboard (which shows pseudonyms) are never listed.
 */
const PUBLIC_PATHS = [
  "",
  "/belajar",
  "/misi",
  "/ide",
  "/petunjuk",
  "/panduan",
  "/privasi",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
