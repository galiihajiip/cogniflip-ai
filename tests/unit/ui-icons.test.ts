import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import names from "@/app/_fonts/icon-names.json";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

/** Icon names referenced in the UI (same rules as the subset download). */
function usedIcons(): Set<string> {
  const used = new Set<string>();
  for (const file of files("src/app")) {
    const s = readFileSync(file, "utf8");
    for (const m of s.matchAll(/<Icon\b[^>]*?\bname=(\{[^}]*\}|"[^"]*")/g))
      for (const q of m[1]!.matchAll(/"([a-z][a-z0-9_]*)"/g)) used.add(q[1]!);
    for (const m of s.matchAll(
      /\b(?:icon|tagIcon)\s*[:=]\s*\{?\s*"([a-z][a-z0-9_]*)"/g,
    ))
      used.add(m[1]!);
    for (const block of s.matchAll(
      /AVATAR_ICON: Record<string, string> = \{([\s\S]*?)\};/g,
    ))
      for (const q of block[1]!.matchAll(/:\s*"([a-z][a-z0-9_]*)"/g))
        used.add(q[1]!);
  }
  return used;
}

describe("self-hosted icon font subset", () => {
  it("contains every icon the UI uses", () => {
    const available = new Set<string>(names);
    const missing = [...usedIcons()].filter((n) => !available.has(n));
    expect(missing).toEqual([]);
  });

  it("finds icons in the UI (the scanner works)", () => {
    expect(usedIcons().has("smart_toy")).toBe(true);
  });
});
