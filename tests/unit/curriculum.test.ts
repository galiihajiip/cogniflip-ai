import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { rubricSchema } from "@/server/assessment/rubric-schema";
import {
  CURRICULUM_LESSONS,
  CURRICULUM_RUBRICS,
} from "@/server/learning/content/curriculum";
import { lessonVersionSchema } from "@/server/learning/lesson-schema";

// Every code example's expected output is checked by running it with a real
// interpreter or compiler (D-015). HTML/CSS render instead of printing.
const dir = mkdtempSync(join(tmpdir(), "cogniflip-curriculum-"));
const run = (cmd: string, args: string[], input?: string) =>
  execFileSync(cmd, args, { input, cwd: dir, timeout: 30_000 })
    .toString()
    .replace(/\s+$/, "");

function execute(language: string, code: string): string {
  switch (language) {
    case "python":
      return run("python3", ["-I", "-c", code]);
    case "javascript":
      return run(process.execPath, ["-e", code]);
    case "sql":
      return run("sqlite3", ["-batch", ":memory:"], code);
    case "java": {
      writeFileSync(join(dir, "Main.java"), code);
      run("javac", ["Main.java"]);
      return run("java", ["-cp", dir, "Main"]);
    }
    case "cpp": {
      writeFileSync(join(dir, "main.cpp"), code);
      run("g++", ["-std=c++17", "-o", "main", "main.cpp"]);
      return run(join(dir, "main"), []);
    }
    default:
      throw new Error(`no runner for ${language}`);
  }
}

describe("multi-language curriculum (D-015)", () => {
  it("every lesson and rubric passes its schema", () => {
    for (const lesson of CURRICULUM_LESSONS)
      expect(
        lessonVersionSchema.safeParse(lesson).error?.issues,
        lesson.id,
      ).toBeUndefined();
    for (const rubric of CURRICULUM_RUBRICS)
      expect(
        rubricSchema.safeParse(rubric).error?.issues,
        rubric.id,
      ).toBeUndefined();
  });

  const runnable = CURRICULUM_LESSONS.filter(
    (l) =>
      l.example.kind === "code" &&
      !["html", "css"].includes(l.example.language),
  );
  it.each(runnable.map((l) => [l.id, l] as const))(
    "%s: example output matches a real run",
    (_id, lesson) => {
      if (lesson.example.kind !== "code") return;
      expect(execute(lesson.example.language, lesson.example.content)).toBe(
        lesson.example.expectedOutput,
      );
    },
    60_000,
  );
});
