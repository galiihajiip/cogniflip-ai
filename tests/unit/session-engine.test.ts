import { describe, expect, it } from "vitest";
import type { EvaluationResult } from "@/server/ai/gateway";
import { getRubric } from "@/server/assessment/content";
import { scoreRatings } from "@/server/assessment/scoring";
import { AppError } from "@/server/http/errors";
import { hashLesson } from "@/server/learning/catalog";
import { LESSONS } from "@/server/learning/content/lessons";
import {
  SESSION_LIMITS,
  TutorSessionEngine,
  compareAttempts,
} from "@/server/learning/session/engine";
import { InMemorySessionStore } from "@/server/learning/session/store";
import { toLearnerView } from "@/server/learning/session/view";

const lesson = LESSONS.find((l) => l.id === "urutan-instruksi")!;
const rubric = getRubric("urutan-instruksi", 1)!;
const evaluator = {
  mode: "mock" as const,
  model: "mock:deterministic",
  promptVersion: "evaluator-v1",
};

function assessed(
  levels: ["belum_terlihat" | "sebagian" | "tepat", string, string],
): EvaluationResult {
  const ratings = rubric.criteria.map((c, i) => ({
    criterionKey: c.key,
    level: levels[i] as "belum_terlihat" | "sebagian" | "tepat",
    evidence: levels[i] === "belum_terlihat" ? null : "kutipan",
  }));
  const outcome = scoreRatings(rubric, ratings);
  if (outcome.status !== "assessed") throw new Error("bad fixture");
  return {
    ok: true,
    assessment: {
      ok: true,
      outcome,
      message: "Coba beri contoh.",
      misconceptionIds: ["urutan-tidak-penting"],
    },
    attempts: 1,
    ...evaluator,
  };
}
const clarify: EvaluationResult = {
  ok: true,
  assessment: {
    ok: true,
    outcome: {
      status: "needs_clarification",
      targetCriterion: "urutan-mengubah-hasil",
    },
    message: "Apa yang terjadi kalau urutannya ditukar?",
    misconceptionIds: [],
  },
  attempts: 1,
  ...evaluator,
};
const timeout: EvaluationResult = {
  ok: false,
  code: "PROVIDER_TIMEOUT",
  retryable: true,
  attempts: 1,
};

function setup(script: EvaluationResult[], maxAiCalls = 10) {
  const queue = [...script];
  const seen: string[] = [];
  let id = 0;
  const engine = new TutorSessionEngine({
    store: new InMemorySessionStore(),
    evaluate: async ({ answer }) => {
      seen.push(answer);
      const next = queue.shift();
      if (!next) throw new Error("evaluator called more often than scripted");
      return next;
    },
    resolve: (s) =>
      s.lesson.id === lesson.id && s.rubric.version === rubric.version
        ? { lesson, rubric }
        : undefined,
    maxAiCalls,
    now: () => new Date("2026-10-13T00:00:00Z"),
    newId: () => `session-${++id}`,
  });
  return { engine, seen };
}

async function ready(engine: TutorSessionEngine) {
  let s = await engine.start(lesson, rubric, hashLesson(lesson), "owner-hash");
  s = await engine.viewConcept(s.id, s.version);
  return engine.beginExplanation(s.id, s.version);
}

const submit = (
  engine: TutorSessionEngine,
  s: { id: string; version: number },
  answer: string,
  key: string,
) =>
  engine.submit(s.id, {
    expectedVersion: s.version,
    answer,
    idempotencyKey: key,
  });

async function code(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    return (e as AppError).code;
  }
  throw new Error("expected AppError");
}

describe("normal flow", () => {
  it("goes chosen → concept → explanation → assessed → revision → reassessed → completed", async () => {
    const { engine } = setup([
      assessed(["tepat", "sebagian", "belum_terlihat"]),
      assessed(["tepat", "tepat", "tepat"]),
    ]);
    let s = await engine.start(
      lesson,
      rubric,
      hashLesson(lesson),
      "owner-hash",
    );
    expect(s).toMatchObject({
      state: "lesson_chosen",
      lesson: {
        id: "urutan-instruksi",
        version: 1,
        contentHash: hashLesson(lesson),
      },
      rubric: { id: "urutan-instruksi", version: 1 },
    });
    s = await engine.viewConcept(s.id, s.version);
    expect(s.state).toBe("concept_viewed");
    s = await engine.beginExplanation(s.id, s.version);
    expect(s.state).toBe("awaiting_explanation");

    s = await submit(engine, s, "Jawaban pertama", "key-00000001");
    expect(s.state).toBe("assessed");
    expect(s.attempts[0].result).toMatchObject({
      status: "assessed",
      score: { total: 60 },
    });

    s = await engine.startRevision(s.id, s.version);
    expect(s.state).toBe("awaiting_revision");
    s = await submit(engine, s, "Jawaban revisi", "key-00000002");
    expect(s.state).toBe("assessed");

    // The initial answer is kept as its own attempt; nothing is overwritten.
    expect(s.attempts.map((a) => [a.kind, a.answer])).toEqual([
      ["initial", "Jawaban pertama"],
      ["revision", "Jawaban revisi"],
    ]);
    expect(compareAttempts(s)).toMatchObject({
      fromTotal: 60,
      toTotal: 100,
      changed: true,
    });

    s = await engine.complete(s.id, s.version);
    expect(s.state).toBe("completed");
  });
});

describe("duplicate and stale submissions", () => {
  it("returns the stored result for a repeated idempotency key without re-evaluating", async () => {
    const { engine, seen } = setup([
      assessed(["tepat", "tepat", "belum_terlihat"]),
    ]);
    const s = await ready(engine);
    const first = await submit(engine, s, "Jawaban", "key-repeat-1");
    const again = await submit(engine, s, "Jawaban", "key-repeat-1");
    expect(again).toEqual(first);
    expect(seen).toHaveLength(1);
  });

  it("rejects a second submit while the first is still evaluating", async () => {
    let release!: (r: EvaluationResult) => void;
    const store = new InMemorySessionStore();
    const engine = new TutorSessionEngine({
      store,
      evaluate: () => new Promise((resolve) => (release = resolve)),
      resolve: () => ({ lesson, rubric }),
      maxAiCalls: 10,
    });
    const s = await ready(engine);
    const pending = submit(engine, s, "Jawaban", "key-concurrent-1");
    await new Promise((r) => setTimeout(r, 0));
    expect(
      await code(submit(engine, s, "Jawaban lain", "key-concurrent-2")),
    ).toBe("CONFLICT");
    expect(await code(submit(engine, s, "Jawaban", "key-concurrent-1"))).toBe(
      "CONFLICT",
    );
    release(assessed(["tepat", "tepat", "tepat"]));
    expect((await pending).state).toBe("assessed");
  });

  it("rejects a stale expected version", async () => {
    const { engine } = setup([assessed(["tepat", "tepat", "tepat"])]);
    const s = await ready(engine);
    expect(
      await code(
        engine.submit(s.id, {
          expectedVersion: s.version - 1,
          answer: "x",
          idempotencyKey: "key-stale-01",
        }),
      ),
    ).toBe("CONFLICT");
  });
});

describe("clarification bounds", () => {
  it("asks at most one clarification, then judges the combined explanation", async () => {
    const { engine, seen } = setup([
      clarify,
      assessed(["tepat", "tepat", "belum_terlihat"]),
    ]);
    let s = await ready(engine);
    s = await submit(engine, s, "Supaya tidak salah.", "key-clar-0001");
    expect(s.state).toBe("needs_clarification");
    expect(s.clarificationsInCycle).toBe(1);
    s = await submit(
      engine,
      s,
      "Robotnya sampai di tempat lain.",
      "key-clar-0002",
    );
    expect(s.state).toBe("assessed");
    expect(seen[1]).toBe(
      "Supaya tidak salah.\nRobotnya sampai di tempat lain.",
    );
    expect(s.attempts[1]).toMatchObject({
      kind: "clarification",
      answer: "Robotnya sampai di tempat lain.",
    });
  });

  it("does not loop: a second clarification turns into a request to revise", async () => {
    const { engine } = setup([clarify, clarify]);
    let s = await ready(engine);
    s = await submit(engine, s, "Hmm.", "key-loop-0001");
    s = await submit(engine, s, "Pokoknya penting.", "key-loop-0002");
    expect(s.state).toBe("awaiting_revision");
    expect(s.clarificationsInCycle).toBe(0);
  });

  it("ends without a score after the maximum number of counted attempts", async () => {
    const { engine } = setup([clarify, clarify, clarify]);
    let s = await ready(engine);
    s = await submit(engine, s, "a", "key-max-00001");
    s = await submit(engine, s, "b", "key-max-00002");
    s = await submit(engine, s, "c", "key-max-00003");
    expect(s.state).toBe("completed");
    expect(s.attempts.every((a) => a.result?.status !== "assessed")).toBe(true);
  });
});

describe("provider failure", () => {
  it("moves to recoverable_error with no score, does not count the attempt, and allows retry", async () => {
    const { engine } = setup([timeout, assessed(["tepat", "tepat", "tepat"])]);
    let s = await ready(engine);
    s = await submit(engine, s, "Jawaban", "key-err-00001");
    expect(s.state).toBe("recoverable_error");
    expect(s.attempts[0].result).toEqual({
      status: "error",
      code: "PROVIDER_TIMEOUT",
      retryable: true,
    });
    expect("score" in s.attempts[0].result!).toBe(false);
    s = await submit(engine, s, "Jawaban", "key-err-00002");
    expect(s.state).toBe("assessed");
    expect(s.attempts.map((a) => a.kind)).toEqual(["initial", "initial"]);
  });

  it("stops calling the AI when the session call budget is used up", async () => {
    const { engine, seen } = setup([timeout, timeout, timeout], 2);
    let s = await ready(engine);
    s = await submit(engine, s, "a", "key-budget-001");
    s = await submit(engine, s, "a", "key-budget-002");
    expect(await code(submit(engine, s, "a", "key-budget-003"))).toBe(
      "RATE_LIMITED",
    );
    expect(seen).toHaveLength(2);
  });
});

describe("invalid transitions and input", () => {
  it.each([
    [
      "submit before viewing the concept",
      async (e: TutorSessionEngine) => {
        const s = await e.start(
          lesson,
          rubric,
          hashLesson(lesson),
          "owner-hash",
        );
        return submit(e, s, "x", "key-early-001");
      },
    ],
    [
      "revise before any assessment",
      async (e: TutorSessionEngine) => {
        const s = await ready(e);
        return e.startRevision(s.id, s.version);
      },
    ],
    [
      "complete while awaiting the first explanation",
      async (e: TutorSessionEngine) => {
        const s = await ready(e);
        return e.complete(s.id, s.version);
      },
    ],
  ])("rejects: %s", async (_label, run) => {
    const { engine } = setup([]);
    expect(await code(run(engine))).toBe("CONFLICT");
  });

  it("rejects submissions after completion and revisions when no attempts are left", async () => {
    const results = Array.from(
      { length: SESSION_LIMITS.maxCountedAttempts },
      () => assessed(["sebagian", "sebagian", "sebagian"]),
    );
    const { engine } = setup(results);
    let s = await ready(engine);
    s = await submit(engine, s, "1", "key-left-0001");
    for (let i = 2; i <= SESSION_LIMITS.maxCountedAttempts; i++) {
      s = await engine.startRevision(s.id, s.version);
      s = await submit(engine, s, String(i), `key-left-000${i}`);
    }
    expect(await code(engine.startRevision(s.id, s.version))).toBe("CONFLICT");
    s = await engine.complete(s.id, s.version);
    expect(await code(submit(engine, s, "late", "key-left-late"))).toBe(
      "CONFLICT",
    );
  });

  it("validates answers and idempotency keys before touching the session", async () => {
    const { engine, seen } = setup([]);
    const s = await ready(engine);
    expect(await code(submit(engine, s, "   ", "key-empty-001"))).toBe(
      "VALIDATION_ERROR",
    );
    expect(
      await code(submit(engine, s, "x".repeat(2_001), "key-long-0001")),
    ).toBe("VALIDATION_ERROR");
    expect(await code(submit(engine, s, "ok", "k"))).toBe("VALIDATION_ERROR");
    expect(await code(engine.viewConcept("missing", 1))).toBe("NOT_FOUND");
    expect(seen).toHaveLength(0);
  });

  it("refuses a rubric that does not belong to the lesson version", async () => {
    const { engine } = setup([]);
    const other = getRubric("perulangan", 1)!;
    expect(await code(engine.start(lesson, other, "hash", "owner-hash"))).toBe(
      "INTERNAL_ERROR",
    );
  });
});

describe("learner view", () => {
  it("hides evaluator internals and reveals the reference only after completion", async () => {
    const { engine } = setup([
      assessed(["tepat", "sebagian", "belum_terlihat"]),
    ]);
    let s = await ready(engine);
    s = await submit(engine, s, "Jawaban", "key-view-0001");
    const view = toLearnerView(s, lesson, rubric);
    const text = JSON.stringify(view);
    expect(view.attempts[0].outcome).toMatchObject({
      status: "assessed",
      total: 60,
      hint: "Coba beri contoh.",
    });
    expect(view.mockMode).toBe(true);
    expect(view.referenceExplanation).toBeNull();
    expect(text).not.toMatch(
      /misconception|mock:deterministic|evaluator-v1|rationale/,
    );
    s = await engine.complete(s.id, s.version);
    expect(toLearnerView(s, lesson, rubric).referenceExplanation).toBe(
      lesson.referenceExplanation,
    );
  });
});

describe("engine + real gateway + labelled dev mock", () => {
  it("runs a full session through validation and deterministic scoring", async () => {
    const { createDevMockProvider } = await import("@/server/ai/dev-mock");
    const { evaluateExplanation } = await import("@/server/ai/gateway");
    const { FixedWindowLimiter } = await import("@/server/ai/rate-limit");
    const deps = {
      provider: createDevMockProvider(),
      limiter: new FixedWindowLimiter(10, 60_000),
      timeoutMs: 1_000,
    };
    const quiet = (fn: () => Promise<unknown>) => fn();
    const engine = new TutorSessionEngine({
      store: new InMemorySessionStore(),
      evaluate: (input) => evaluateExplanation(deps, input),
      resolve: () => ({ lesson, rubric }),
      maxAiCalls: 6,
    });
    const origInfo = console.info;
    console.info = () => {};
    try {
      await quiet(async () => {
        let s = await ready(engine);
        s = await submit(
          engine,
          s,
          "Ya karena kalau tidak nanti bisa salah.",
          "key-e2e-00001",
        );
        expect(s.state).toBe("needs_clarification");
        s = await engine.submit(s.id, {
          expectedVersion: s.version,
          answer: "x",
          idempotencyKey: "key-e2e-00002",
        });
        // Combined text is not a fixture, so the mock asks again → revision requested.
        expect(s.state).toBe("awaiting_revision");
        s = await submit(
          engine,
          s,
          "Komputer menjalankan perintah satu-satu dari atas. Kalau urutannya ditukar, hasilnya beda.",
          "key-e2e-00003",
        );
        expect(s.state).toBe("assessed");
        const view = toLearnerView(s, lesson, rubric);
        expect(view.mockMode).toBe(true);
        expect(view.attempts.at(-1)?.outcome).toMatchObject({
          status: "assessed",
          total: 80,
        });
      });
    } finally {
      console.info = origInfo;
    }
  });
});
