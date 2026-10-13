import { describe, expect, it } from "vitest";
import { MOVE_ON_SCORE, recommend } from "@/server/history/service";

const item = (
  lessonId: string,
  assessedAttempts: number,
  bestScore: number | null,
) => ({
  lessonId,
  title: lessonId,
  assessedAttempts,
  bestScore,
});

describe("recommend (rule-based, path order)", () => {
  it("starts with the first untried lesson", () => {
    expect(recommend([item("a", 0, null), item("b", 0, null)])).toMatchObject({
      lessonId: "a",
      kind: "start",
    });
  });
  it("suggests practising a lesson whose best score is below the threshold", () => {
    expect(
      recommend([item("a", 2, MOVE_ON_SCORE - 1), item("b", 0, null)]),
    ).toMatchObject({ lessonId: "a", kind: "practice_again" });
  });
  it("moves on at the threshold, and returns null when everything is done", () => {
    expect(
      recommend([item("a", 1, MOVE_ON_SCORE), item("b", 0, null)]),
    ).toMatchObject({ lessonId: "b", kind: "start" });
    expect(recommend([item("a", 1, 100)])).toBeNull();
  });
});
