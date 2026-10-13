import { describe, expect, it } from "vitest";
import { toGeminiJsonSchema } from "@/server/ai/gemini-schema";
import { reviewOutputJsonSchema } from "@/server/code/review";

describe("toGeminiJsonSchema", () => {
  it("drops maxItems, which the live Gemini API rejected for code review (2026-10-15)", () => {
    expect(
      JSON.stringify(toGeminiJsonSchema(reviewOutputJsonSchema)),
    ).not.toContain("maxItems");
  });
});
