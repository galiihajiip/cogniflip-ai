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
import type { EvaluationResult } from "@/server/ai/gateway";
import { getRubric } from "@/server/assessment/content";
import { scoreRatings } from "@/server/assessment/scoring";
import { loadMigrations, migrate } from "@/server/db/migrator.mts";
import { hashLesson } from "@/server/learning/catalog";
import { LESSONS } from "@/server/learning/content/lessons";
import { TutorSessionEngine } from "@/server/learning/session/engine";
import {
  PostgresSessionStore,
  deleteStaleGuestSessions,
} from "@/server/learning/session/pg-store";
import { POST as register } from "@/app/api/auth/register/route";
import { DELETE as deleteAccount } from "@/app/api/account/route";
import { POST as createSession } from "@/app/api/sessions/route";
import { GET as getSession } from "@/app/api/sessions/[id]/route";

const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_sessions_${process.pid}_${Date.now()}`;
const testUrl = Object.assign(new URL(adminUrl), {
  pathname: `/${dbName}`,
}).toString();
const BASE = "http://localhost:3000";
let pool: pg.Pool;

const lesson = LESSONS.find((l) => l.id === "urutan-instruksi")!;
const rubric = getRubric("urutan-instruksi", 1)!;
const OWNER = "a".repeat(64);

function assessedResult(): EvaluationResult {
  const outcome = scoreRatings(
    rubric,
    rubric.criteria.map((c, i) => ({
      criterionKey: c.key,
      level: i === 2 ? "belum_terlihat" : "tepat",
      evidence: i === 2 ? null : "kutipan",
    })),
  );
  if (outcome.status !== "assessed") throw new Error();
  return {
    ok: true,
    assessment: {
      ok: true,
      outcome,
      message: "Coba beri contoh.",
      misconceptionIds: [],
    },
    mode: "mock",
    model: "mock:deterministic",
    promptVersion: "evaluator-v1",
    attempts: 1,
  };
}

function engineWith(results: EvaluationResult[]) {
  const queue = [...results];
  return new TutorSessionEngine({
    store: new PostgresSessionStore(pool),
    evaluate: async () => queue.shift()!,
    resolve: () => ({ lesson, rubric }),
    maxAiCalls: 6,
  });
}

beforeAll(async () => {
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`create database ${dbName}`);
  await admin.end();
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
  };
  await g.cogniflipPool?.end();
  delete g.cogniflipPool;
  delete g.cogniflipAuth;
  delete g.cogniflipTutor;
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`drop database if exists ${dbName} with (force)`);
  await admin.end();
});
beforeEach(() => {
  vi.stubEnv("DATABASE_URL", testUrl);
  vi.stubEnv("ALLOW_DRAFT_CONTENT", "true");
  for (const level of ["info", "warn", "error"] as const)
    vi.spyOn(console, level).mockImplementation(() => {});
});

describe("PostgresSessionStore", () => {
  it("persists every attempt and result, and reloads them unchanged", async () => {
    const engine = engineWith([
      { ok: false, code: "PROVIDER_TIMEOUT", retryable: true, attempts: 1 },
      assessedResult(),
    ]);
    let s = await engine.start(lesson, rubric, hashLesson(lesson), OWNER);
    s = await engine.viewConcept(s.id, s.version);
    s = await engine.beginExplanation(s.id, s.version);
    s = await engine.submit(s.id, {
      expectedVersion: s.version,
      answer: "Jawaban pertama",
      idempotencyKey: "pg-key-00001",
    });
    expect(s.state).toBe("recoverable_error");
    s = await engine.submit(s.id, {
      expectedVersion: s.version,
      answer: "Jawaban pertama",
      idempotencyKey: "pg-key-00002",
    });
    expect(s.state).toBe("assessed");

    const reloaded = await new PostgresSessionStore(pool).get(s.id);
    expect(reloaded).toEqual(s);
    const rows = await pool.query(
      "select number, result_status, score_total from tutor_attempts where session_id = $1 order by number",
      [s.id],
    );
    expect(rows.rows).toEqual([
      { number: 1, result_status: "error", score_total: null },
      { number: 2, result_status: "assessed", score_total: "80.0" },
    ]);
  });

  it("refuses a stale version and leaves the stored session unchanged", async () => {
    const store = new PostgresSessionStore(pool);
    const engine = engineWith([]);
    const s = await engine.start(lesson, rubric, hashLesson(lesson), OWNER);
    expect(
      await store.replace(
        { ...s, state: "completed", version: s.version + 1 },
        s.version - 1,
      ),
    ).toBe(false);
    expect((await store.get(s.id))?.state).toBe("lesson_chosen");
  });

  it("enforces score and idempotency rules in the database itself", async () => {
    const engine = engineWith([]);
    const s = await engine.start(lesson, rubric, hashLesson(lesson), OWNER);
    const insert = (
      status: string | null,
      result: string | null,
      score: number | null,
      key: string,
      n: number,
    ) =>
      pool.query(
        `insert into tutor_attempts (session_id, number, kind, answer, evaluated_text, idempotency_key, submitted_at, result_status, result, score_total, scoring_version)
         values ($1, $2, 'initial', 'x', 'x', $3, now(), $4, $5, $6, $7)`,
        [
          s.id,
          n,
          key,
          status,
          result,
          score,
          score === null ? null : "scoring-v1",
        ],
      );
    await expect(insert("error", "{}", 50, "db-key-0001", 1)).rejects.toThrow(
      /check constraint/,
    );
    await expect(
      insert("assessed", "{}", null, "db-key-0002", 1),
    ).rejects.toThrow(/check constraint/);
    await expect(
      insert("needs_clarification", "{}", 10, "db-key-0003", 1),
    ).rejects.toThrow(/check constraint/);
    await insert(null, null, null, "db-key-0004", 1);
    await expect(insert(null, null, null, "db-key-0004", 2)).rejects.toThrow(
      /duplicate key/,
    );
  });

  it("deletes stale guest sessions but keeps recent ones", async () => {
    const engine = engineWith([]);
    const old = await engine.start(
      lesson,
      rubric,
      hashLesson(lesson),
      "b".repeat(64),
    );
    const recent = await engine.start(
      lesson,
      rubric,
      hashLesson(lesson),
      "c".repeat(64),
    );
    await pool.query(
      `update tutor_sessions set updated_at = now() - interval '31 days' where id = $1`,
      [old.id],
    );
    expect(await deleteStaleGuestSessions(pool, 30)).toBeGreaterThanOrEqual(1);
    const store = new PostgresSessionStore(pool);
    expect(await store.get(old.id)).toBeUndefined();
    expect(await store.get(recent.id)).toBeDefined();
  });
});

describe("session API with the database", () => {
  const post = (path: string, body: unknown, cookie?: string) =>
    new Request(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `10.2.0.${Math.floor(Math.random() * 200)}`,
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    });
  const cookieOf = (r: Response, name: string) =>
    r.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${name}=`))!
      .split(";")[0];
  const read = (id: string, cookie?: string) =>
    getSession(
      new Request(`${BASE}/api/sessions/${id}`, {
        headers: cookie ? { cookie } : {},
      }),
      { params: Promise.resolve({ id }) },
    );

  it("ties sessions to the signed-in user, hides them from others, and deletes them with the account", async () => {
    const userA = cookieOf(
      await register(
        post("/api/auth/register", {
          handle: "sesi_ana",
          password: "hujan-pelangi-12",
        }),
      ),
      "cf_session",
    );
    const userB = cookieOf(
      await register(
        post("/api/auth/register", {
          handle: "sesi_budi",
          password: "hujan-pelangi-34",
        }),
      ),
      "cf_session",
    );
    const created = await createSession(
      post("/api/sessions", { lessonId: "urutan-instruksi" }, userA),
    );
    expect(created.status).toBe(201);
    expect(created.headers.get("set-cookie")).toBeNull(); // no guest cookie for signed-in users
    const { session } = await created.json();

    expect((await read(session.sessionId, userA)).status).toBe(200);
    expect((await read(session.sessionId, userB)).status).toBe(404);
    expect((await read(session.sessionId)).status).toBe(404);
    const row = await pool.query(
      "select owner_user_id is not null as by_user, owner_guest_hash from tutor_sessions where id = $1",
      [session.sessionId],
    );
    expect(row.rows[0]).toEqual({ by_user: true, owner_guest_hash: null });

    const del = await deleteAccount(
      new Request(`${BASE}/api/account`, {
        method: "DELETE",
        headers: { "content-type": "application/json", cookie: userA },
        body: JSON.stringify({
          password: "hujan-pelangi-12",
          confirm: "HAPUS",
        }),
      }),
    );
    expect(del.status).toBe(200);
    expect(
      (
        await pool.query("select 1 from tutor_sessions where id = $1", [
          session.sessionId,
        ])
      ).rows,
    ).toEqual([]);
  });

  it("persists guest sessions across a server restart", async () => {
    const created = await createSession(
      post("/api/sessions", { lessonId: "urutan-instruksi" }),
    );
    const guest = cookieOf(created, "cf_guest");
    const { session } = await created.json();
    delete (globalThis as { cogniflipTutor?: unknown }).cogniflipTutor; // simulate a new process
    const again = await read(session.sessionId, guest);
    expect(again.status).toBe(200);
    expect((await again.json()).session.state).toBe("lesson_chosen");
  });
});
