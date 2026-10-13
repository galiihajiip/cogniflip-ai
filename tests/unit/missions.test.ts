import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDevMockProvider } from "@/server/ai/dev-mock";
import { FixedWindowLimiter } from "@/server/ai/rate-limit";
import { DEBUG_MISSIONS, PREDICT_MISSIONS } from "@/server/missions/content";
import { validateDiagnosis } from "@/server/missions/diagnose";
import {
  InMemoryMissionStore,
  MissionService,
  normalizeOutput,
  toMissionView,
} from "@/server/missions/service";
import { GET as listMissions } from "@/app/api/missions/route";
import { POST as attempt } from "@/app/api/missions/[id]/attempts/route";

const predict = PREDICT_MISSIONS.find((m) => m.id === "tebak-ulang-lompat")!;
const debug = DEBUG_MISSIONS.find((m) => m.id === "robot-debug-hitung")!;
const owner = { keyHash: "a".repeat(64) };
const mockDeps = () => ({
  provider: createDevMockProvider(),
  limiter: new FixedWindowLimiter(100, 60_000),
  timeoutMs: 1_000,
});

beforeEach(() => {
  for (const level of ["info", "warn", "error"] as const)
    vi.spyOn(console, level).mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("mission views", () => {
  it("never include the expected output or answer key", () => {
    for (const view of [...PREDICT_MISSIONS, ...DEBUG_MISSIONS].map(
      toMissionView,
    )) {
      expect(Object.keys(view)).not.toContain("expectedOutput");
      expect(Object.keys(view)).not.toContain("answerKey");
      expect(Object.keys(view)).not.toContain("hints");
    }
    // Debug missions show the buggy code, never the fix.
    const debugView = toMissionView(debug);
    expect(JSON.stringify(debugView)).not.toContain(debug.answerKey.fixedCode);
  });
});

describe("Predict-before-Run", () => {
  it("compares with the reviewed fixture, labels the source, and gives a hint when wrong", async () => {
    const service = new MissionService(new InMemoryMissionStore(), mockDeps);
    const wrong = await service.predict(
      owner,
      predict,
      "Lompat!\nSelesai",
      "pred-key-0001",
    );
    expect(wrong).toMatchObject({
      outcome: "incorrect",
      outputSource: "reviewed_fixture",
      hint: predict.hint,
    });
    expect(wrong.nextStep).toMatch(/Jelaskan/);
    const right = await service.predict(
      owner,
      predict,
      "Lompat!  \nLompat!\nLompat!\nSelesai\n\n",
      "pred-key-0002",
    );
    expect(right).toMatchObject({
      outcome: "correct",
      hint: null,
      expectedOutput: predict.expectedOutput,
    });
  });

  it("returns the stored result for a repeated key", async () => {
    const service = new MissionService(new InMemoryMissionStore(), mockDeps);
    const first = await service.predict(owner, predict, "x", "pred-key-0003");
    expect(
      await service.predict(
        owner,
        predict,
        predict.expectedOutput,
        "pred-key-0003",
      ),
    ).toEqual(first);
  });

  it("normalizes only trailing whitespace", () => {
    expect(normalizeOutput("a \r\nb\n\n")).toBe("a\nb");
    expect(normalizeOutput(" a")).toBe("a");
    expect(normalizeOutput("a\n\nb")).toBe("a\n\nb");
  });
});

describe("Debug Robot", () => {
  it("gives one progressive hint per miss and reveals the key only after 3 misses", async () => {
    const service = new MissionService(new InMemoryMissionStore(), mockDeps);
    const r1 = await service.diagnose(
      owner,
      debug,
      "Programnya salah.",
      "dbg-key-0001",
    );
    expect(r1).toMatchObject({
      outcome: "unclear",
      hint: debug.hints[0],
      answerKey: null,
    });
    const r2 = await service.diagnose(
      owner,
      debug,
      "Mungkin printnya salah.",
      "dbg-key-0002",
    );
    expect(r2).toMatchObject({ hint: debug.hints[1], answerKey: null });
    const r3 = await service.diagnose(
      owner,
      debug,
      "Tidak tahu.",
      "dbg-key-0003",
    );
    expect(r3.answerKey).toEqual({
      explanation: debug.answerKey.explanation,
      fixedCode: debug.answerKey.fixedCode,
    });
  });

  it("accepts a correct diagnosis and reveals the explanation", async () => {
    const service = new MissionService(new InMemoryMissionStore(), mockDeps);
    const r = await service.diagnose(
      owner,
      debug,
      "Menurutku: Mulainya dari 0, bukan 1.",
      "dbg-key-0004",
    );
    expect(r).toMatchObject({ outcome: "correct", hint: null });
    expect(r.answerKey?.explanation).toMatch(/range\(1, 6\)/);
  });

  it("does not record a provider failure as a wrong diagnosis", async () => {
    const store = new InMemoryMissionStore();
    const service = new MissionService(store, () => ({
      provider: null,
      limiter: new FixedWindowLimiter(1, 1),
      timeoutMs: 1,
    }));
    await expect(
      service.diagnose(
        owner,
        debug,
        "Mulainya dari 0, bukan 1.",
        "dbg-key-0005",
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    expect(await store.list(owner.keyHash, debug.id)).toEqual([]);
  });
});

describe("validateDiagnosis", () => {
  const ok = (o: object) =>
    JSON.stringify({
      verdict: "correct",
      evidence: "mulai dari 0",
      feedback: "Hebat, kamu teliti!",
      ...o,
    });
  const learner = "Angkanya mulai dari 0 jadi salah";
  it("accepts a grounded verdict", () => {
    expect(validateDiagnosis(ok({}), debug, learner)).toMatchObject({
      ok: true,
    });
  });
  it.each([
    ["credit without evidence", { evidence: null }, "credit requires evidence"],
    [
      "evidence the learner never wrote",
      { evidence: "range berhenti sebelum 5" },
      "evidence is not in the diagnosis",
    ],
    [
      "feedback that gives away the fix",
      { feedback: "Ganti jadi for angka in range(1, 6): print(angka)" },
      "reveals the answer key",
    ],
  ])("rejects %s", (_l, o, message) => {
    const r = validateDiagnosis(ok(o), debug, learner);
    expect(r.ok ? [] : r.problems).toContainEqual(
      expect.stringContaining(message),
    );
  });
  it("rejects extra fields such as XP", () => {
    expect(
      validateDiagnosis(
        JSON.stringify({
          verdict: "correct",
          evidence: null,
          feedback: "x",
          xp: 100,
        }),
        debug,
        learner,
      ).ok,
    ).toBe(false);
  });
});

describe("missions API", () => {
  const post = (id: string, body: unknown) =>
    attempt(
      new Request(`http://localhost:3000/api/missions/${id}/attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    );

  it("hides draft missions only when disabled (D-013), and lists without answers", async () => {
    vi.stubEnv("ALLOW_DRAFT_CONTENT", "false");
    expect(
      (await (await listMissions(new Request("http://t/"))).json()).missions,
    ).toEqual([]);
    vi.stubEnv("ALLOW_DRAFT_CONTENT", "true");
    const { missions } = await (
      await listMissions(new Request("http://t/"))
    ).json();
    expect(missions).toHaveLength(7);
    expect(JSON.stringify(missions)).not.toMatch(/expectedOutput|answerKey/);
  });

  it("runs predict and diagnose through the API, rejecting mismatched types", async () => {
    vi.stubEnv("ALLOW_DRAFT_CONTENT", "true");
    vi.stubEnv("AI_MOCK_MODE", "true");
    const p = await post("tebak-cabang-hujan", {
      type: "predict",
      answer: "Bawa payung",
      idempotencyKey: "api-pred-0001",
    });
    expect((await p.json()).result).toMatchObject({
      type: "predict",
      outcome: "correct",
      outputSource: "reviewed_fixture",
    });
    expect(p.headers.get("set-cookie")).toMatch(/^cf_guest=/);
    expect(
      (
        await post("tebak-cabang-hujan", {
          type: "diagnose",
          answer: "x",
          idempotencyKey: "api-pred-0002",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await post("robot-debug-lulus", {
          type: "predict",
          answer: "x",
          idempotencyKey: "api-pred-0003",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await post("tidak-ada", {
          type: "predict",
          answer: "x",
          idempotencyKey: "api-pred-0004",
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await post("robot-debug-lulus", {
          type: "diagnose",
          answer: "x",
          idempotencyKey: "api-pred-0005",
          xp: 50,
        })
      ).status,
    ).toBe(400);
  });
});

describe("mission attempt rate limit", () => {
  it("rejects more than 30 attempts per learner per minute", async () => {
    vi.stubEnv("ALLOW_DRAFT_CONTENT", "true");
    const cookie = `cf_guest=${"R".repeat(43)}`;
    const send = (n: number) =>
      attempt(
        new Request(
          "http://localhost:3000/api/missions/tebak-urutan-pagi/attempts",
          {
            method: "POST",
            headers: { "content-type": "application/json", cookie },
            body: JSON.stringify({
              type: "reflect",
              answer: "catatan",
              idempotencyKey: `limit-key-${String(n).padStart(4, "0")}`,
            }),
          },
        ),
        { params: Promise.resolve({ id: "tebak-urutan-pagi" }) },
      );
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await send(i)).status);
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });
});
