import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

// Claims in the Stitch exports that the product cannot support (docs/22 §Adaptations).
const BANNED = [
  /14\.200/,
  /penjelajah kode cilik di seluruh Indonesia/i,
  /Teruji Secara Pedagogis/i,
  /Real Code Runner/i,
  /Python 3\.1\d/,
  /© 2025/,
  /pakar pedagogi/i,
  /anak Indonesia sudah berhasil/i,
  /lh3\.googleusercontent\.com/,
  /cdn\.tailwindcss\.com/,
  /fonts\.googleapis\.com/,
];

describe("learner-facing copy", () => {
  it("contains none of the unsupported Stitch claims or hot-linked assets", () => {
    const hits: string[] = [];
    for (const file of files("src/app"))
      for (const pattern of BANNED)
        if (pattern.test(readFileSync(file, "utf8")))
          hits.push(`${file}: ${pattern}`);
    expect(hits).toEqual([]);
  });
});
