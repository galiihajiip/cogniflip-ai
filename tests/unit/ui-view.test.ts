import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  apiFetch,
  countWords,
  failureMessage,
  newIdempotencyKey,
} from "@/app/_lib/api";
import {
  criterionKeyLabel,
  currentCycleText,
  pendingAnswer,
  ringOffset,
  teachPhase,
  type SessionView,
} from "@/app/_lib/view";
import { sessionViewSchema } from "@/shared/api/learning";

const assessed = (total: number) => ({
  status: "assessed" as const,
  total,
  possible: 100,
  criteria: [
    { label: "A", level: "sebagian" as const, earned: total, possible: 100 },
  ],
  hint: "h",
});

function session(over: Partial<SessionView>): SessionView {
  return sessionViewSchema.parse({
    sessionId: "s1",
    version: 3,
    state: "awaiting_explanation",
    lesson: { id: "perulangan", version: 1, title: "Perulangan" },
    attemptsUsed: 0,
    attemptsLeft: 3,
    canRevise: false,
    mockMode: false,
    attempts: [],
    comparison: null,
    referenceExplanation: null,
    ...over,
  });
}

describe("teachPhase maps every session state to a Stitch screen", () => {
  it.each([
    ["lesson_chosen", "prepare"],
    ["concept_viewed", "prepare"],
    ["awaiting_explanation", "start"],
    ["evaluating", "evaluating"],
    ["reassessing", "evaluating"],
    ["needs_clarification", "clarify"],
    ["assessed", "result"],
    ["recoverable_error", "error"],
    ["completed", "done"],
  ] as const)("%s → %s", (state, phase) => {
    expect(teachPhase(session({ state }))).toBe(phase);
  });

  it("awaiting_revision after an unclear answer is ST-07a (needs more), after a score it is ST-08", () => {
    const unclear = session({
      state: "awaiting_revision",
      attempts: [
        {
          number: 1,
          kind: "initial",
          answer: "a",
          outcome: { status: "needs_clarification", question: "q" },
        },
      ],
    });
    expect(teachPhase(unclear)).toBe("needs_more");
    const scored = session({
      state: "awaiting_revision",
      attempts: [
        { number: 1, kind: "initial", answer: "a", outcome: assessed(40) },
      ],
    });
    expect(teachPhase(scored)).toBe("revise");
  });
});

describe("answer helpers", () => {
  it("pendingAnswer returns the answer of a failed evaluation only", () => {
    const failed = session({
      state: "recoverable_error",
      attempts: [
        {
          number: 1,
          kind: "initial",
          answer: "jawabanku",
          outcome: {
            status: "error",
            code: "PROVIDER_TIMEOUT",
            retryable: true,
          },
        },
      ],
    });
    expect(pendingAnswer(failed)).toBe("jawabanku");
    expect(pendingAnswer(session({}))).toBe("");
  });

  it("currentCycleText joins answers since the last scored attempt, skipping errors", () => {
    const s = session({
      attempts: [
        { number: 1, kind: "initial", answer: "lama", outcome: assessed(40) },
        {
          number: 2,
          kind: "revision",
          answer: "baru",
          outcome: { status: "needs_clarification", question: "q" },
        },
        {
          number: 3,
          kind: "clarification",
          answer: "gagal",
          outcome: { status: "error", code: "X", retryable: true },
        },
        {
          number: 4,
          kind: "clarification",
          answer: "tambahan",
          outcome: { status: "needs_clarification", question: "q" },
        },
      ],
    });
    expect(currentCycleText(s)).toBe("baru tambahan");
  });

  it("countWords and criterionKeyLabel", () => {
    expect(countWords("  satu  dua\ntiga ")).toBe(3);
    expect(countWords("   ")).toBe(0);
    expect(criterionKeyLabel("apa-yang-diulang")).toBe("Apa yang diulang");
  });

  it("ringOffset clamps to the ring", () => {
    expect(ringOffset(50, 100, 200)).toBe(100);
    expect(ringOffset(150, 100, 200)).toBe(0);
    expect(ringOffset(-5, 100, 200)).toBe(200);
    expect(ringOffset(1, 0, 200)).toBe(200);
  });

  it("idempotency keys fit the 8–64 character contract and differ", () => {
    const a = newIdempotencyKey();
    expect(a.length).toBeGreaterThanOrEqual(8);
    expect(a.length).toBeLessThanOrEqual(64);
    expect(newIdempotencyKey()).not.toBe(a);
  });
});

describe("apiFetch validates every response", () => {
  afterEach(() => vi.unstubAllGlobals());
  const schema = z.strictObject({ ok: z.literal(true) });
  const respond = (status: number, body: unknown) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status })),
    );

  it("accepts a body that matches the contract", async () => {
    respond(200, { ok: true });
    expect(await apiFetch("/x", schema)).toEqual({
      ok: true,
      status: 200,
      data: { ok: true },
    });
  });

  it("rejects a 200 body that does not match (never trusted)", async () => {
    respond(200, { ok: true, score: 100 });
    const r = await apiFetch("/x", schema);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("CONTRACT");
  });

  it("maps the error envelope and uses the server's learner-safe message", async () => {
    respond(429, {
      error: {
        code: "RATE_LIMITED",
        message: "Terlalu banyak permintaan.",
        retryable: true,
        correlationId: "abcdefgh12",
        details: { retryAfterSeconds: 30 },
      },
    });
    const r = await apiFetch("/x", schema);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("RATE_LIMITED");
      expect(failureMessage(r)).toContain("30 detik");
    }
  });

  it("reports network failures as retryable without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    const r = await apiFetch("/x", schema);
    expect(r).toMatchObject({ ok: false, code: "NETWORK", retryable: true });
    if (!r.ok) expect(failureMessage(r)).toMatch(/Koneksi/);
  });
});
