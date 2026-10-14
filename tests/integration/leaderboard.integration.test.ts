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
import { PATCH as patchProfile } from "@/app/api/profile/route";
import { GET as leaderboard } from "@/app/api/leaderboard/route";

const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_board_${process.pid}_${Date.now()}`;
const testUrl = Object.assign(new URL(adminUrl), {
  pathname: `/${dbName}`,
}).toString();
const BASE = "http://localhost:3000";
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
  const g = globalThis as Record<string, unknown> & { cogniflipPool?: pg.Pool };
  await g.cogniflipPool?.end();
  for (const k of [
    "cogniflipPool",
    "cogniflipAuth",
    "cogniflipTutor",
    "cogniflipAi",
  ])
    delete g[k];
  await admin(`drop database if exists ${dbName} with (force)`);
});
beforeEach(() => {
  vi.stubEnv("DATABASE_URL", testUrl);
  for (const level of ["info", "warn", "error"] as const)
    vi.spyOn(console, level).mockImplementation(() => {});
});

const req = (method: string, path: string, cookie?: string, body?: unknown) =>
  new Request(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.5.0.${Math.floor(Math.random() * 200)}`,
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const board = async (query = "", cookie?: string) =>
  (await leaderboard(req("GET", `/api/leaderboard${query}`, cookie))).json();

/** Synthetic test learners with ledger rows (test data only, never production). */
async function learner(
  handle: string,
  optIn: boolean,
  xp: Array<{ delta: number; daysAgo: number }>,
) {
  const r = await register(
    req("POST", "/api/auth/register", undefined, {
      handle,
      password: "pohon-mangga-manis",
    }),
  );
  const cookie = r.headers
    .getSetCookie()
    .find((c) => c.startsWith("cf_session="))!
    .split(";")[0];
  await patchProfile(
    req("PATCH", "/api/profile", cookie, { leaderboardOptIn: optIn }),
  );
  const { rows } = await pool.query("select id from users where handle = $1", [
    handle,
  ]);
  for (const [i, x] of xp.entries()) {
    const session = await pool.query(
      `insert into tutor_sessions (id, owner_user_id, owner_key_hash, lesson_id, lesson_version, lesson_content_hash, rubric_id, rubric_version, state, version, created_at, updated_at)
       values (gen_random_uuid(), $1, $2, 'urutan-instruksi', 1, $2, 'urutan-instruksi', 1, 'completed', 1, now(), now()) returning id`,
      [rows[0].id, "f".repeat(64)],
    );
    await pool.query(
      `insert into xp_events (user_id, event_type, source_session, delta, rule_version, idempotency_key, created_at)
       values ($1, 'explanation_assessed', $2, $3, 'test', $4, now() - make_interval(days => $5))`,
      [
        rows[0].id,
        session.rows[0].id,
        x.delta,
        `test:${handle}:${i}`,
        x.daysAgo,
      ],
    );
  }
  return cookie;
}

describe("leaderboard", () => {
  it("ranks only opted-in learners with allowlisted fields, shared ranks for ties, and paginates", async () => {
    const ana = await learner("papan_ana", true, [{ delta: 30, daysAgo: 0 }]);
    await learner("papan_budi", true, [{ delta: 30, daysAgo: 0 }]);
    await learner("papan_citra", true, [
      { delta: 10, daysAgo: 0 },
      { delta: 50, daysAgo: 40 },
    ]);
    await learner("papan_rahasia", false, [{ delta: 50, daysAgo: 0 }]);

    const weekly = await board("?period=weekly", ana);
    expect(weekly.entries).toEqual([
      { rank: 1, handle: "papan_ana", avatarKey: "robot-biru", xp: 30 },
      { rank: 1, handle: "papan_budi", avatarKey: "robot-biru", xp: 30 },
      { rank: 2, handle: "papan_citra", avatarKey: "robot-biru", xp: 10 },
    ]);
    expect(weekly.periodStart).toEqual(expect.any(String));
    expect(weekly.rules).toMatch(/Senin 00\.00 WIB/);
    expect(weekly.me).toEqual({ optedIn: true, rank: 1, xp: 30 });
    expect(JSON.stringify(weekly)).not.toMatch(
      /papan_rahasia|password|user_id|email/,
    );

    const all = await board("?period=all");
    expect(all.entries[0]).toMatchObject({
      rank: 1,
      handle: "papan_citra",
      xp: 60,
    });
    expect(all.me).toBeNull();

    const page1 = await board("?period=all&limit=2");
    expect(page1.entries).toHaveLength(2);
    expect(page1.nextOffset).toBe(2);
    const page2 = await board("?period=all&limit=2&offset=2");
    expect(page2.entries).toHaveLength(1);
    expect(page2.nextOffset).toBeNull();
  });

  it("removes a learner immediately after opting out, keeping their private data", async () => {
    const dewi = await learner("papan_dewi", true, [{ delta: 45, daysAgo: 0 }]);
    expect(
      (await board("?period=all")).entries.some(
        (e: { handle: string }) => e.handle === "papan_dewi",
      ),
    ).toBe(true);
    await patchProfile(
      req("PATCH", "/api/profile", dewi, { leaderboardOptIn: false }),
    );
    const after = await board("?period=all", dewi);
    expect(
      after.entries.some((e: { handle: string }) => e.handle === "papan_dewi"),
    ).toBe(false);
    expect(after.me).toEqual({ optedIn: false });
    expect(
      (
        await pool.query(
          "select count(*)::int as n from xp_events e join users u on u.id = e.user_id where u.handle = 'papan_dewi'",
        )
      ).rows[0].n,
    ).toBe(1);
  });

  it("starts the weekly period exactly at Monday 00:00 WIB", async () => {
    const eko = await learner("papan_eko", true, []);
    const { periodStart } = await board("?period=weekly", eko);
    const start = new Date(periodStart);
    // Monday 00:00 in Asia/Jakarta (UTC+7) is Sunday 17:00 UTC.
    expect(start.getUTCDay()).toBe(0);
    expect(start.getUTCHours()).toBe(17);
    const { rows } = await pool.query(
      "select id from users where handle = 'papan_eko'",
    );
    const session = await pool.query(
      `insert into tutor_sessions (id, owner_user_id, owner_key_hash, lesson_id, lesson_version, lesson_content_hash, rubric_id, rubric_version, state, version, created_at, updated_at)
       values (gen_random_uuid(), $1, $2, 'urutan-instruksi', 1, $2, 'urutan-instruksi', 1, 'completed', 1, now(), now()) returning id`,
      [rows[0].id, "e".repeat(64)],
    );
    for (const [key, offsetMinutes, delta] of [
      ["before", -1, 7],
      ["after", 1, 3],
    ] as const)
      await pool.query(
        `insert into xp_events (user_id, event_type, source_session, delta, rule_version, idempotency_key, created_at)
         values ($1, 'explanation_assessed', $2, $3, 'test', $4, $5::timestamptz + make_interval(mins => $6))`,
        [
          rows[0].id,
          session.rows[0].id,
          delta,
          `edge:${key}`,
          periodStart,
          offsetMinutes,
        ],
      );
    const weekly = await board("?period=weekly", eko);
    expect(weekly.me).toEqual({
      optedIn: true,
      rank: expect.any(Number),
      xp: 3,
    });
    expect((await board("?period=all", eko)).me).toMatchObject({ xp: 10 });
  });

  it("rejects invalid query parameters", async () => {
    expect(
      (await leaderboard(req("GET", "/api/leaderboard?period=daily"))).status,
    ).toBe(400);
    expect(
      (await leaderboard(req("GET", "/api/leaderboard?limit=1000"))).status,
    ).toBe(400);
    expect(
      (await leaderboard(req("GET", "/api/leaderboard?sort=handle"))).status,
    ).toBe(400);
  });
});
