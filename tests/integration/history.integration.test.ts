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
import { POST as createSession } from "@/app/api/sessions/route";
import { POST as act } from "@/app/api/sessions/[id]/actions/route";
import { GET as history } from "@/app/api/history/route";
import { GET as progress } from "@/app/api/progress/route";

const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_history_${process.pid}_${Date.now()}`;
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
  const g = globalThis as {
    cogniflipPool?: pg.Pool;
    cogniflipAuth?: unknown;
    cogniflipTutor?: unknown;
    cogniflipAi?: unknown;
  };
  await g.cogniflipPool?.end();
  delete g.cogniflipPool;
  delete g.cogniflipAuth;
  delete g.cogniflipTutor;
  delete g.cogniflipAi;
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

const post = (path: string, body: unknown, cookie?: string) =>
  new Request(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.3.0.${Math.floor(Math.random() * 200)}`,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
const get = (path: string, cookie?: string) =>
  new Request(`${BASE}${path}`, { headers: cookie ? { cookie } : {} });
const sessionCookie = (r: Response) =>
  r.headers
    .getSetCookie()
    .find((c) => c.startsWith("cf_session="))!
    .split(";")[0];

async function finishLesson(cookie: string, answer: string, key: string) {
  const created = await (
    await createSession(
      post("/api/sessions", { lessonId: "urutan-instruksi" }, cookie),
    )
  ).json();
  const id = created.session.sessionId;
  const step = async (body: object) =>
    (
      await (
        await act(post(`/api/sessions/${id}/actions`, body, cookie), {
          params: Promise.resolve({ id }),
        })
      ).json()
    ).session;
  let s = await step({ type: "view_concept", expectedVersion: 1 });
  s = await step({ type: "begin", expectedVersion: s.version });
  s = await step({
    type: "submit",
    expectedVersion: s.version,
    answer,
    idempotencyKey: key,
  });
  return { id, state: s.state };
}

describe("history and progress", () => {
  it("shows an empty state, then only the owner's assessed results, paginated", async () => {
    const ana = sessionCookie(
      await register(
        post("/api/auth/register", {
          handle: "hist_ana",
          password: "kupu-kupu-indah-1",
        }),
      ),
    );
    const budi = sessionCookie(
      await register(
        post("/api/auth/register", {
          handle: "hist_budi",
          password: "kupu-kupu-indah-2",
        }),
      ),
    );

    const empty = await (await history(get("/api/history", ana))).json();
    expect(empty).toMatchObject({ items: [], nextCursor: null });
    const emptyProgress = await (
      await progress(get("/api/progress", ana))
    ).json();
    expect(emptyProgress.recommendation).toMatchObject({
      lessonId: "urutan-instruksi",
      kind: "start",
    });

    expect((await finishLesson(ana, GOOD, "hist-key-0001")).state).toBe(
      "assessed",
    );
    expect(
      (
        await finishLesson(
          ana,
          "Jawaban yang tidak dikenal mock.",
          "hist-key-0002",
        )
      ).state,
    ).toBe("needs_clarification");
    vi.stubEnv("AI_MOCK_MODE", "");
    expect((await finishLesson(ana, GOOD, "hist-key-0003")).state).toBe(
      "recoverable_error",
    );

    const page1 = await (
      await history(get("/api/history?limit=2", ana))
    ).json();
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toEqual(expect.any(String));
    const page2 = await (
      await history(get(`/api/history?limit=2&cursor=${page1.nextCursor}`, ana))
    ).json();
    expect(page2.items).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();
    const all = [...page1.items, ...page2.items];
    // Only the assessed attempt contributes a score; error and clarification do not.
    expect(
      all.map((i: { bestScore: number | null }) => i.bestScore).sort(),
    ).toEqual([80, null, null]);

    const prog = await (await progress(get("/api/progress", ana))).json();
    expect(prog.lessons[0]).toMatchObject({
      lessonId: "urutan-instruksi",
      sessions: 3,
      assessedAttempts: 1,
      bestScore: 80,
      latestScore: 80,
    });
    expect(prog.recommendation).toMatchObject({
      lessonId: "perulangan",
      kind: "start",
    });
    expect(prog.recommendation.rule).toMatch(/bukan bukti penguasaan/);

    // Another learner sees none of it.
    expect(
      (await (await history(get("/api/history", budi))).json()).items,
    ).toEqual([]);
  });

  it("keeps history across logout and login, and rejects bad cursors and anonymous reads", async () => {
    const r = await register(
      post("/api/auth/register", {
        handle: "hist_citra",
        password: "bulan-sabit-terang",
      }),
    );
    const c1 = sessionCookie(r);
    await finishLesson(c1, GOOD, "hist-key-0101");
    await logout(post("/api/auth/logout", {}, c1));
    const c2 = sessionCookie(
      await login(
        post("/api/auth/login", {
          handle: "hist_citra",
          password: "bulan-sabit-terang",
        }),
      ),
    );
    const items = (await (await history(get("/api/history", c2))).json()).items;
    expect(items).toHaveLength(1);
    expect(items[0].bestScore).toBe(80);

    expect(
      (await history(get("/api/history?cursor=bm90LWpzb24", c2))).status,
    ).toBe(400);
    expect((await history(get("/api/history?limit=500", c2))).status).toBe(400);
    expect((await history(get("/api/history"))).status).toBe(401);
  });
});
