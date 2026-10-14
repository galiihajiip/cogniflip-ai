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
import { POST as attempt } from "@/app/api/missions/[id]/attempts/route";
import { GET as rewards } from "@/app/api/rewards/route";

const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_missions_${process.pid}_${Date.now()}`;
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

const post = (path: string, body: unknown, cookie?: string) =>
  new Request(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.6.0.${Math.floor(Math.random() * 200)}`,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
const send = (id: string, body: unknown, cookie?: string) =>
  attempt(post(`/api/missions/${id}/attempts`, body, cookie), {
    params: Promise.resolve({ id }),
  });

describe("missions with PostgreSQL", () => {
  it("stores every attempt and awards mission XP once per mission", async () => {
    const r = await register(
      post("/api/auth/register", {
        handle: "misi_ana",
        password: "pantai-ombak-99",
      }),
    );
    const cookie = r.headers
      .getSetCookie()
      .find((c) => c.startsWith("cf_session="))!
      .split(";")[0];

    await send(
      "tebak-cabang-hujan",
      { type: "predict", answer: "Pakai topi", idempotencyKey: "m-key-00001" },
      cookie,
    );
    await send(
      "tebak-cabang-hujan",
      {
        type: "reflect",
        answer: "Ternyata hujan bernilai True.",
        idempotencyKey: "m-key-00002",
      },
      cookie,
    );
    await send(
      "tebak-cabang-hujan",
      { type: "predict", answer: "Bawa payung", idempotencyKey: "m-key-00003" },
      cookie,
    );
    await send(
      "tebak-cabang-hujan",
      { type: "predict", answer: "Bawa payung", idempotencyKey: "m-key-00004" },
      cookie,
    );
    await send(
      "robot-debug-hitung",
      {
        type: "diagnose",
        answer: "Mulainya dari 0, bukan 1.",
        idempotencyKey: "m-key-00005",
      },
      cookie,
    );

    const rows = await pool.query(
      "select kind, outcome, output_source from mission_attempts where owner_user_id is not null order by created_at",
    );
    expect(rows.rows).toEqual([
      {
        kind: "predict",
        outcome: "incorrect",
        output_source: "reviewed_fixture",
      },
      { kind: "reflect", outcome: "recorded", output_source: null },
      {
        kind: "predict",
        outcome: "correct",
        output_source: "reviewed_fixture",
      },
      {
        kind: "predict",
        outcome: "correct",
        output_source: "reviewed_fixture",
      },
      { kind: "diagnose", outcome: "correct", output_source: null },
    ]);

    const summary = await (
      await rewards(new Request(`${BASE}/api/rewards`, { headers: { cookie } }))
    ).json();
    expect(summary.totalXp).toBe(15); // prediction_correct 5 (once) + bug_diagnosed 10
    expect(summary.ruleVersion).toBe("xp-rules-v2");
    const events = await pool.query(
      "select event_type, rule_version, source_session, source_mission_attempt is not null as from_mission from xp_events order by event_type",
    );
    expect(events.rows).toEqual([
      {
        event_type: "bug_diagnosed",
        rule_version: "xp-rules-v2",
        source_session: null,
        from_mission: true,
      },
      {
        event_type: "prediction_correct",
        rule_version: "xp-rules-v2",
        source_session: null,
        from_mission: true,
      },
    ]);
  });

  it("gives guests no XP and rejects an XP row with no source or two sources", async () => {
    await send("tebak-urutan-pagi", {
      type: "predict",
      answer: "Bangun\nMandi\nSarapan",
      idempotencyKey: "m-key-guest",
    });
    expect(
      (
        await pool.query(
          "select count(*)::int as n from xp_events e join mission_attempts a on a.id = e.source_mission_attempt where a.owner_user_id is null",
        )
      ).rows[0].n,
    ).toBe(0);
    const user = (await pool.query("select id from users limit 1")).rows[0].id;
    await expect(
      pool.query(
        `insert into xp_events (user_id, event_type, delta, rule_version, idempotency_key) values ($1, 'bug_diagnosed', 10, 'x', 'no-source')`,
        [user],
      ),
    ).rejects.toThrow(/xp_events_one_source/);
  });
});
