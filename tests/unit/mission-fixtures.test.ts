import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { DEBUG_MISSIONS, PREDICT_MISSIONS } from "@/server/missions/content";

/**
 * Verifies mission answer keys with a real CPython interpreter on the
 * development/CI machine. These are our own fixed, reviewed snippets (never
 * learner code), run outside the application with isolated mode (-I).
 */
const python = spawnSync("python3", ["--version"], { encoding: "utf8" });
const hasPython = python.status === 0;

function run(code: string) {
  const r = spawnSync("python3", ["-I", "-c", code], {
    encoding: "utf8",
    timeout: 5_000,
    env: { PATH: process.env.PATH ?? "" } as unknown as NodeJS.ProcessEnv,
  });
  return { status: r.status, stdout: (r.stdout ?? "").replace(/\s+$/, "") };
}

describe.skipIf(!hasPython)(
  `mission fixtures checked with ${python.stdout?.trim()}`,
  () => {
    it.each(PREDICT_MISSIONS.map((m) => [m.id, m] as const))(
      "%s prints its expected output",
      (_id, m) => {
        expect(run(m.code)).toEqual({ status: 0, stdout: m.expectedOutput });
      },
    );

    it.each(DEBUG_MISSIONS.map((m) => [m.id, m] as const))(
      "%s: the bug is real and the fix works",
      (_id, m) => {
        const buggy = run(m.buggyCode);
        expect(buggy.status !== 0 || buggy.stdout !== m.intendedOutput).toBe(
          true,
        );
        expect(run(m.answerKey.fixedCode)).toEqual({
          status: 0,
          stdout: m.intendedOutput,
        });
      },
    );
  },
);
