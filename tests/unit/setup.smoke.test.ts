import { describe, expect, it } from "vitest";
import { siteMetadata as metadata } from "@/app/site-metadata";

// Toolchain smoke test: the "@/" alias resolves and app modules load
// (the layout itself uses next/font, which only runs inside Next.js).
// It checks the setup only, not product behavior.
describe("test setup", () => {
  it("imports the site metadata through the @/ alias", () => {
    expect(metadata.title).toMatchObject({ default: "CogniFlip" });
  });
});
