import { join } from "node:path";
import pg from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { loadMigrations, migrate } from "@/server/db/migrator.mts";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { PATCH as patchProfile } from "@/app/api/profile/route";
import { POST as createSession } from "@/app/api/sessions/route";
import { GET as getSession } from "@/app/api/sessions/[id]/route";
import { POST as act } from "@/app/api/sessions/[id]/actions/route";
import { GET as history } from "@/app/api/history/route";
import { GET as progress } from "@/app/api/progress/route";
import { GET as rewards } from "@/app/api/rewards/route";
import { GET as leaderboard } from "@/app/api/leaderboard/route";
import { POST as review } from "@/app/api/code/review/route";
import { POST as missionAttempt } from "@/app/api/missions/[id]/attempts/route";

/**
 * BLOCK 52: one learner journey across modules on real PostgreSQL.
 * AI calls use the labelled development mock (AI_MOCK_MODE) — this proves
 * module wiring, not live AI quality.
 */
const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_e2e_${process.pid}_${Date.now()}`;
const testUrl = Object.assign(new URL(adminUrl), {
  pathname: `/${dbName}`,
}).toString();
const BASE = "http://localhost:3000";
const GOOD =
  "Komputer menjalankan perintah satu-satu dari atas. Kalau urutannya ditukar, hasilnya beda.";

async function admin(text: string) {
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(text);
  await c.end();
}
beforeAll(async () => {
  await admin(`create database ${dbName}`);
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  await migrate(
    client,
    loadMigrations(join(process.cwd(), "db", "migrations")),
  );
  await client.end();
});
afterAll(async () => {
  const g = globalThis as Record<string, unknown> & { cogniflipPool?: pg.Pool };
  await g.cogniflipPool?.end();
  for (const k of [
    "cogniflipPool",
    "cogniflipAuth",
    "cogniflipTutor",
    "cogniflipAi",
    "cogniflipMissions",
  ])
    delete g[k];
  await admin(`drop database if exists ${dbName} with (force)`);
});
beforeEach(() => {
  vi.stubEnv("DATABASE_URL", testUrl);
  vi.stubEnv("ALLOW_DRAFT_CONTENT", "true");
  vi.stubEnv("AI_MOCK_MODE", "true");
  vi.stubEnv("AI_MAX_REQUESTS_PER_MINUTE", "600");
  for (const level of ["info", "warn", "error"] as const)
    vi.spyOn(console, level).mockImplementation(() => {});
});

const req = (method: string, path: string, cookie?: string, body?: unknown) =>
  new Request(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.9.0.${Math.floor(Math.random() * 200)}`,
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const json = async (r: Response) => ({
  status: r.status,
  body: await r.json(),
});
const sessionCookie = (r: Response) =>
  r.headers
    .getSetCookie()
    .find((c) => c.startsWith("cf_session="))!
    .split(";")[0];
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("cross-feature learner journey", () => {
  it("connects account, lesson, history, progress, XP, leaderboard, code review and missions", async () => {
    // Account + privacy
    let me = sessionCookie(
      await register(
        req("POST", "/api/auth/register", undefined, {
          handle: "jalur_ana",
          password: "lautan-biru-dalam",
        }),
      ),
    );
    expect(
      (
        await patchProfile(
          req("PATCH", "/api/profile", me, { leaderboardOptIn: true }),
        )
      ).status,
    ).toBe(200);

    // Lesson → assessed
    const created = await json(
      await createSession(
        req("POST", "/api/sessions", me, { lessonId: "urutan-instruksi" }),
      ),
    );
    const id = created.body.session.sessionId;
    let s = (
      await json(
        await act(
          req("POST", `/api/sessions/${id}/actions`, me, {
            type: "view_concept",
            expectedVersion: 1,
          }),
          ctx(id),
        ),
      )
    ).body.session;
    s = (
      await json(
        await act(
          req("POST", `/api/sessions/${id}/actions`, me, {
            type: "begin",
            expectedVersion: s.version,
          }),
          ctx(id),
        ),
      )
    ).body.session;
    s = (
      await json(
        await act(
          req("POST", `/api/sessions/${id}/actions`, me, {
            type: "submit",
            expectedVersion: s.version,
            answer: GOOD,
            idempotencyKey: "e2e-key-0001",
          }),
          ctx(id),
        ),
      )
    ).body.session;
    expect(s).toMatchObject({ state: "assessed", mockMode: true });
    // Duplicate submit (refresh/retry) changes nothing
    await act(
      req("POST", `/api/sessions/${id}/actions`, me, {
        type: "submit",
        expectedVersion: s.version,
        answer: GOOD,
        idempotencyKey: "e2e-key-0001",
      }),
      ctx(id),
    );

    // History, progress, XP, leaderboard
    expect(
      (await json(await history(req("GET", "/api/history", me)))).body.items[0],
    ).toMatchObject({ sessionId: id, bestScore: 80 });
    expect(
      (await json(await progress(req("GET", "/api/progress", me)))).body
        .lessons[0],
    ).toMatchObject({ bestScore: 80 });
    expect(
      (await json(await rewards(req("GET", "/api/rewards", me)))).body.totalXp,
    ).toBe(15);
    const board = (
      await json(
        await leaderboard(req("GET", "/api/leaderboard?period=all", me)),
      )
    ).body;
    expect(board.entries).toContainEqual({
      rank: 1,
      handle: "jalur_ana",
      avatarKey: "robot-biru",
      xp: 15,
    });

    // Code review + mission (XP once)
    expect(
      (
        await review(
          req("POST", "/api/code/review", me, {
            language: "python",
            code: "print('halo')",
          }),
        )
      ).status,
    ).toBe(200);
    await missionAttempt(
      req("POST", "/api/missions/tebak-urutan-pagi/attempts", me, {
        type: "predict",
        answer: "Bangun\nMandi\nSarapan",
        idempotencyKey: "e2e-key-0002",
      }),
      ctx("tebak-urutan-pagi"),
    );
    expect(
      (await json(await rewards(req("GET", "/api/rewards", me)))).body.totalXp,
    ).toBe(20);

    // Logout → login: same authorized data
    await logout(req("POST", "/api/auth/logout", me));
    expect(
      (await getSession(req("GET", `/api/sessions/${id}`, me), ctx(id))).status,
    ).toBe(404);
    me = sessionCookie(
      await login(
        req("POST", "/api/auth/login", undefined, {
          handle: "jalur_ana",
          password: "lautan-biru-dalam",
        }),
      ),
    );
    expect(
      (await getSession(req("GET", `/api/sessions/${id}`, me), ctx(id))).status,
    ).toBe(200);
    expect(
      (await json(await rewards(req("GET", "/api/rewards", me)))).body.totalXp,
    ).toBe(20);

    // A second learner sees none of it
    const other = sessionCookie(
      await register(
        req("POST", "/api/auth/register", undefined, {
          handle: "jalur_budi",
          password: "gunung-api-aktif",
        }),
      ),
    );
    expect(
      (await getSession(req("GET", `/api/sessions/${id}`, other), ctx(id)))
        .status,
    ).toBe(404);
    expect(
      (await json(await history(req("GET", "/api/history", other)))).body.items,
    ).toEqual([]);
    expect(
      (await json(await rewards(req("GET", "/api/rewards", other)))).body
        .totalXp,
    ).toBe(0);
    const foreignAct = await act(
      req("POST", `/api/sessions/${id}/actions`, other, {
        type: "complete",
        expectedVersion: 5,
      }),
      ctx(id),
    );
    expect(foreignAct.status).toBe(404);
  });

  it("keeps AI and account routes behind their gates", async () => {
    // No provider → honest 503, never a fabricated review or score
    vi.stubEnv("AI_MOCK_MODE", "");
    expect(
      (
        await review(
          req("POST", "/api/code/review", undefined, {
            language: "python",
            code: "x = 1",
          }),
        )
      ).status,
    ).toBe(503);
    // Protected routes need sign-in
    expect((await rewards(req("GET", "/api/rewards"))).status).toBe(401);
    expect((await history(req("GET", "/api/history"))).status).toBe(401);
  });
});
