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
import { RewardService } from "@/server/rewards/service";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as createSession } from "@/app/api/sessions/route";
import { POST as act } from "@/app/api/sessions/[id]/actions/route";
import { GET as rewards } from "@/app/api/rewards/route";

const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_rewards_${process.pid}_${Date.now()}`;
const testUrl = Object.assign(new URL(adminUrl), {
  pathname: `/${dbName}`,
}).toString();
const BASE = "http://localhost:3000";
const GOOD =
  "Komputer menjalankan perintah satu-satu dari atas. Kalau urutannya ditukar, hasilnya beda.";
let pool: pg.Pool;

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
  pool = new pg.Pool({ connectionString: testUrl });
});
afterAll(async () => {
  await pool.end();
  const g = globalThis as {
    cogniflipPool?: pg.Pool;
    cogniflipAuth?: unknown;
    cogniflipTutor?: unknown;
    cogniflipAi?: unknown;
  };
  await g.cogniflipPool?.end();
  for (const k of [
    "cogniflipPool",
    "cogniflipAuth",
    "cogniflipTutor",
    "cogniflipAi",
  ])
    delete (g as Record<string, unknown>)[k];
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
      "x-forwarded-for": `10.4.0.${Math.floor(Math.random() * 200)}`,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
const cookieOf = (r: Response, name: string) =>
  r.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${name}=`))!
    .split(";")[0];
const getRewards = async (cookie?: string) =>
  rewards(
    new Request(`${BASE}/api/rewards`, { headers: cookie ? { cookie } : {} }),
  );

async function assessedSession(cookie: string, key: string) {
  const created = await createSession(
    post("/api/sessions", { lessonId: "urutan-instruksi" }, cookie),
  );
  const guestCookie = created.headers
    .getSetCookie()
    .find((c) => c.startsWith("cf_guest="))
    ?.split(";")[0];
  const auth = guestCookie ?? cookie;
  const id = (await created.json()).session.sessionId;
  const step = async (body: object) =>
    (
      await (
        await act(post(`/api/sessions/${id}/actions`, body, auth), {
          params: Promise.resolve({ id }),
        })
      ).json()
    ).session;
  let s = await step({ type: "view_concept", expectedVersion: 1 });
  s = await step({ type: "begin", expectedVersion: s.version });
  return step({
    type: "submit",
    expectedVersion: s.version,
    answer: GOOD,
    idempotencyKey: key,
  });
}

describe("XP ledger", () => {
  it("awards server-derived XP once, however often it is synced or replayed", async () => {
    const user = cookieOf(
      await register(
        post("/api/auth/register", {
          handle: "xp_ana",
          password: "gunung-tinggi-12",
        }),
      ),
      "cf_session",
    );
    const s = await assessedSession(user, "xp-key-0001");
    expect(s.state).toBe("assessed");

    const first = await (await getRewards(user)).json();
    expect(first.totalXp).toBe(15); // 10 assessed + 5 strong (score 80)
    expect(
      first.achievements.find(
        (a: { key: string }) => a.key === "penjelas-pertama",
      ).earnedAt,
    ).not.toBeNull();

    const { rows } = await pool.query(
      "select id from users where handle = 'xp_ana'",
    );
    const service = new RewardService(pool);
    await Promise.all([
      service.sync(rows[0].id),
      service.sync(rows[0].id),
      service.sync(rows[0].id),
    ]);
    // Replaying the same submission (same idempotency key) changes nothing either.
    const sessionId = (
      await pool.query(
        "select id from tutor_sessions where owner_user_id = $1",
        [rows[0].id],
      )
    ).rows[0].id;
    await act(
      post(
        `/api/sessions/${sessionId}/actions`,
        {
          type: "submit",
          expectedVersion: 4,
          answer: GOOD,
          idempotencyKey: "xp-key-0001",
        },
        user,
      ),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect((await (await getRewards(user)).json()).totalXp).toBe(15);
    expect(
      (
        await pool.query(
          "select count(*)::int as n from xp_events where user_id = $1",
          [rows[0].id],
        )
      ).rows[0].n,
    ).toBe(2);
  });

  it("is append-only in the database", async () => {
    await expect(pool.query("update xp_events set delta = 50")).rejects.toThrow(
      /append-only/,
    );
  });

  it("gives guests no XP and has no endpoint that accepts a client XP value", async () => {
    const guest = await assessedSession("", "xp-key-guest");
    expect(guest.state).toBe("assessed");
    expect(
      (
        await pool.query(
          "select count(*)::int as n from xp_events e join tutor_sessions s on s.id = e.source_session where s.owner_guest_hash is not null",
        )
      ).rows[0].n,
    ).toBe(0);
    expect((await getRewards()).status).toBe(401);

    const user = cookieOf(
      await register(
        post("/api/auth/register", {
          handle: "xp_budi",
          password: "gunung-tinggi-34",
        }),
      ),
      "cf_session",
    );
    const created = await (
      await createSession(
        post("/api/sessions", { lessonId: "urutan-instruksi" }, user),
      )
    ).json();
    const forged = await act(
      post(
        `/api/sessions/${created.session.sessionId}/actions`,
        { type: "complete", expectedVersion: 1, xp: 1000 },
        user,
      ),
      { params: Promise.resolve({ id: created.session.sessionId }) },
    );
    expect(forged.status).toBe(400);
    expect((await (await getRewards(user)).json()).totalXp).toBe(0);
  });
});
