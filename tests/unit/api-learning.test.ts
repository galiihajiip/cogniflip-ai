import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listLessons } from "@/app/api/lessons/route";
import { GET as lessonDetail } from "@/app/api/lessons/[id]/route";
import { POST as createSession } from "@/app/api/sessions/route";
import { GET as getSession } from "@/app/api/sessions/[id]/route";
import { POST as act } from "@/app/api/sessions/[id]/actions/route";
import { errorEnvelopeSchema } from "@/shared/api/errors";
import { sessionResponseSchema } from "@/shared/api/learning";

const BASE = "http://localhost:3000";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function json(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function start(lessonId = "urutan-instruksi") {
  const response = await createSession(json("/api/sessions", { lessonId }));
  const cookie = response.headers.get("set-cookie")!.split(";")[0];
  const { session } = sessionResponseSchema.parse(await response.json());
  return { response, cookie, session };
}

async function action(
  id: string,
  cookie: string | undefined,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const response = await act(
    json(
      `/api/sessions/${id}/actions`,
      body,
      cookie ? { cookie, ...headers } : headers,
    ),
    ctx(id),
  );
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  for (const level of ["info", "warn", "error"] as const)
    vi.spyOn(console, level).mockImplementation(() => {});
  vi.stubEnv("ALLOW_DRAFT_CONTENT", "true");
  vi.stubEnv("AI_MOCK_MODE", "true");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("lesson API", () => {
  it("hides drafts only when ALLOW_DRAFT_CONTENT=false (D-013)", async () => {
    vi.stubEnv("ALLOW_DRAFT_CONTENT", "false");
    expect(
      (await (await listLessons(new Request(`${BASE}/api/lessons`))).json())
        .lessons,
    ).toEqual([]);
    vi.stubEnv("ALLOW_DRAFT_CONTENT", "true");
    const { lessons } = await (
      await listLessons(new Request(`${BASE}/api/lessons`))
    ).json();
    // Robot-command basics first, then the language tracks (D-015).
    expect(lessons.map((l: { id: string }) => l.id).slice(0, 4)).toEqual([
      "urutan-instruksi",
      "perulangan",
      "percabangan",
      "py-print",
    ]);
    expect(lessons.length).toBeGreaterThan(40);
    expect(lessons.every((l: { draft: boolean }) => l.draft)).toBe(true);
  });

  it("returns lesson detail without the answer key or evaluator material", async () => {
    const response = await lessonDetail(
      new Request(`${BASE}/api/lessons/urutan-instruksi`),
      ctx("urutan-instruksi"),
    );
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(JSON.parse(text).lesson.concept.analogy).toMatch(/kaus kaki/);
    expect(text).not.toMatch(
      /referenceExplanation|acceptedEvidence|misconceptions|alternativeExplanations|hints|review/,
    );
  });

  it("rejects invalid ids and hides unknown or unavailable lessons", async () => {
    expect(
      (await lessonDetail(new Request(`${BASE}/api/lessons/X`), ctx("Bad Id")))
        .status,
    ).toBe(400);
    expect(
      (
        await lessonDetail(
          new Request(`${BASE}/api/lessons/x`),
          ctx("tidak-ada"),
        )
      ).status,
    ).toBe(404);
    vi.stubEnv("ALLOW_DRAFT_CONTENT", "false");
    expect(
      (
        await lessonDetail(
          new Request(`${BASE}/api/lessons/x`),
          ctx("urutan-instruksi"),
        )
      ).status,
    ).toBe(404);
  });
});

describe("session API", () => {
  it("creates a session with an httpOnly guest cookie", async () => {
    const { response, session } = await start();
    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toMatch(
      /^cf_guest=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Lax/,
    );
    expect(session).toMatchObject({
      state: "lesson_chosen",
      version: 1,
      attemptsLeft: 3,
    });
  });

  it("runs the flow to an assessed result through the labelled mock", async () => {
    const { cookie, session } = await start();
    let r = await action(session.sessionId, cookie, {
      type: "view_concept",
      expectedVersion: 1,
    });
    r = await action(session.sessionId, cookie, {
      type: "begin",
      expectedVersion: r.body.session.version,
    });
    r = await action(session.sessionId, cookie, {
      type: "submit",
      expectedVersion: r.body.session.version,
      answer:
        "Komputer menjalankan perintah satu-satu dari atas. Kalau urutannya ditukar, hasilnya beda.",
      idempotencyKey: "api-test-key-001",
    });
    expect(r.status).toBe(200);
    expect(r.body.session).toMatchObject({ state: "assessed", mockMode: true });
    expect(r.body.session.attempts[0].outcome).toMatchObject({
      status: "assessed",
      total: 80,
    });

    // Same idempotency key again: same result, no new attempt.
    const again = await action(session.sessionId, cookie, {
      type: "submit",
      expectedVersion: 3,
      answer: "apa saja",
      idempotencyKey: "api-test-key-001",
    });
    expect(again.body.session.attempts).toHaveLength(1);
  });

  it("returns a session only to its owner", async () => {
    const { cookie, session } = await start();
    const read = (c?: string) =>
      getSession(
        new Request(`${BASE}/api/sessions/${session.sessionId}`, {
          headers: c ? { cookie: c } : {},
        }),
        ctx(session.sessionId),
      );
    expect((await read(cookie)).status).toBe(200);
    expect((await read()).status).toBe(404);
    expect((await read(`cf_guest=${"A".repeat(43)}`)).status).toBe(404);
    const foreign = await action(
      session.sessionId,
      `cf_guest=${"B".repeat(43)}`,
      { type: "view_concept", expectedVersion: 1 },
    );
    expect(foreign.status).toBe(404);
  });

  it("rejects stale versions, unknown fields, bad ids and cross-origin posts", async () => {
    const { cookie, session } = await start();
    expect(
      (
        await action(session.sessionId, cookie, {
          type: "begin",
          expectedVersion: 1,
        })
      ).status,
    ).toBe(409);
    const unknown = await action(session.sessionId, cookie, {
      type: "view_concept",
      expectedVersion: 1,
      score: 100,
    });
    expect(unknown.status).toBe(400);
    expect(
      errorEnvelopeSchema.parse(unknown.body).error.details?.fields,
    ).toContainEqual({ path: "score", issue: "unknown_field" });
    expect(
      (
        await action("not-a-uuid", cookie, {
          type: "begin",
          expectedVersion: 1,
        })
      ).status,
    ).toBe(400);
    const cross = await action(
      session.sessionId,
      cookie,
      { type: "view_concept", expectedVersion: 1 },
      { origin: "https://evil.example" },
    );
    expect(cross.status).toBe(403);
    const cross2 = await createSession(
      json(
        "/api/sessions",
        { lessonId: "urutan-instruksi" },
        { origin: "https://evil.example" },
      ),
    );
    expect(cross2.status).toBe(403);
  });

  it("shows provider unavailability as a recoverable error with no score", async () => {
    vi.stubEnv("AI_MOCK_MODE", "");
    const { cookie, session } = await start();
    let r = await action(session.sessionId, cookie, {
      type: "view_concept",
      expectedVersion: 1,
    });
    r = await action(session.sessionId, cookie, {
      type: "begin",
      expectedVersion: r.body.session.version,
    });
    r = await action(session.sessionId, cookie, {
      type: "submit",
      expectedVersion: r.body.session.version,
      answer: "Jawaban apa saja",
      idempotencyKey: "api-test-key-nai",
    });
    expect(r.body.session.state).toBe("recoverable_error");
    expect(r.body.session.attempts[0].outcome).toEqual({
      status: "error",
      code: "PROVIDER_UNAVAILABLE",
      retryable: false,
    });
    expect(JSON.stringify(r.body)).not.toMatch(/"total"/);
  });
});
