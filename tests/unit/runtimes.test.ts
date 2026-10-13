import { describe, expect, it } from "vitest";
import {
  buildPreview,
  PREVIEW_CSP,
  RUNTIMES,
  STARTER,
} from "@/app/_lib/runtimes";

describe("Mini IDE runtimes (D-015)", () => {
  it("puts the locked-down CSP before any learner markup", () => {
    const doc = buildPreview(
      "html",
      '<meta http-equiv="Content-Security-Policy" content="default-src *"><p>hai</p>',
    );
    const ours = doc.indexOf(PREVIEW_CSP);
    const theirs = doc.indexOf("default-src *");
    expect(ours).toBeGreaterThan(-1);
    expect(ours).toBeLessThan(theirs);
    expect(PREVIEW_CSP).toContain("default-src 'none'");
    expect(PREVIEW_CSP).not.toMatch(/connect-src|https?:/);
  });

  it("keeps CSS inside its style element", () => {
    const doc = buildPreview(
      "css",
      "p{color:red}</style><script>alert(1)</script>",
    );
    expect(doc).not.toContain("</style><script>");
    expect(doc).toContain('class="galeri"');
  });

  it("runs only the languages with a browser runtime, with a starter for each", () => {
    expect(Object.keys(RUNTIMES).sort()).toEqual([
      "css",
      "html",
      "javascript",
      "python",
      "sql",
    ]);
    for (const id of Object.keys(RUNTIMES)) expect(STARTER[id]).toBeTruthy();
  });
});
