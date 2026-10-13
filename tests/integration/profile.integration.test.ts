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
import { GET as me } from "@/app/api/auth/me/route";
import {
  GET as getProfile,
  PATCH as patchProfile,
} from "@/app/api/profile/route";
import { GET as publicProfile } from "@/app/api/profiles/[handle]/route";
import { DELETE as deleteAccount } from "@/app/api/account/route";
import { GET as exportData } from "@/app/api/account/export/route";
import { POST as login } from "@/app/api/auth/login/route";
import { DEMO_ACCOUNT } from "@/shared/api/demo";

const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_profile_${process.pid}_${Date.now()}`;
const testUrl = Object.assign(new URL(adminUrl), {
  pathname: `/${dbName}`,
}).toString();
const BASE = "http://localhost:3000";

async function sql(url: string, text: string, values: unknown[] = []) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return (await client.query(text, values)).rows;
  } finally {
    await client.end();
  }
}

beforeAll(async () => {
  await sql(adminUrl, `create database ${dbName}`);
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  await migrate(
    client,
    loadMigrations(join(process.cwd(), "db", "migrations")),
  );
  await client.end();
});
afterAll(async () => {
  const g = globalThis as { cogniflipPool?: pg.Pool; cogniflipAuth?: unknown };
  await g.cogniflipPool?.end();
  delete g.cogniflipPool;
  delete g.cogniflipAuth;
  await sql(adminUrl, `drop database if exists ${dbName} with (force)`);
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
      ...(cookie ? { cookie } : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      "x-forwarded-for": `10.1.0.${Math.floor(Math.random() * 200)}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

async function newUser(handle: string) {
  const r = await register(
    req("POST", "/api/auth/register", undefined, {
      handle,
      password: "langit-biru-sekali-7",
    }),
  );
  expect(r.status).toBe(201);
  return r.headers.get("set-cookie")!.split(";")[0];
}
const ctx = (handle: string) => ({ params: Promise.resolve({ handle }) });

describe("profiles with two users", () => {
  it("starts private with safe defaults and lets each user edit only their own profile", async () => {
    const a = await newUser("ana_bintang");
    const b = await newUser("budi_roket");

    const pa = await (await getProfile(req("GET", "/api/profile", a))).json();
    expect(pa.profile).toEqual({
      handle: "ana_bintang",
      avatarKey: "robot-biru",
      leaderboardOptIn: false,
      preferences: {},
    });

    const patched = await patchProfile(
      req("PATCH", "/api/profile", a, {
        avatarKey: "kucing",
        preferences: { reducedMotion: true },
      }),
    );
    expect((await patched.json()).profile).toMatchObject({
      avatarKey: "kucing",
      preferences: { reducedMotion: true },
    });

    // B's own profile is untouched by A's change.
    const pb = await (await getProfile(req("GET", "/api/profile", b))).json();
    expect(pb.profile).toMatchObject({
      handle: "budi_roket",
      avatarKey: "robot-biru",
    });
  });

  it("rejects attempts to change handle, role or another user's id", async () => {
    const c = await newUser("citra_awan");
    for (const body of [
      { handle: "admin_x" },
      { role: "admin" },
      { userId: "00000000-0000-0000-0000-000000000000" },
      {},
    ]) {
      expect(
        (await patchProfile(req("PATCH", "/api/profile", c, body))).status,
      ).toBe(400);
    }
    expect(
      (await (await me(req("GET", "/api/auth/me", c))).json()).user,
    ).toEqual({ handle: "citra_awan", role: "learner" });
  });

  it("requires sign-in for own-profile routes", async () => {
    expect((await getProfile(req("GET", "/api/profile"))).status).toBe(401);
    expect(
      (
        await patchProfile(
          req("PATCH", "/api/profile", undefined, { avatarKey: "roket" }),
        )
      ).status,
    ).toBe(401);
  });

  it("shows a public profile only after opt-in, with an allowlist of fields", async () => {
    const d = await newUser("dewi_pelangi");
    expect(
      (
        await publicProfile(
          req("GET", "/api/profiles/dewi_pelangi"),
          ctx("dewi_pelangi"),
        )
      ).status,
    ).toBe(404);
    await patchProfile(
      req("PATCH", "/api/profile", d, {
        leaderboardOptIn: true,
        avatarKey: "roket",
      }),
    );
    const r = await publicProfile(
      req("GET", "/api/profiles/dewi_pelangi"),
      ctx("dewi_pelangi"),
    );
    const text = await r.text();
    expect(JSON.parse(text).profile).toEqual({
      handle: "dewi_pelangi",
      avatarKey: "roket",
    });
    expect(text).not.toMatch(/password|role|preferences|user_id|created/);
  });

  it("exports own data and deletes the account with cascades after password confirmation", async () => {
    const e = await newUser("eka_kancil");
    const exported = await (
      await exportData(req("GET", "/api/account/export", e))
    ).json();
    expect(exported.account.handle).toBe("eka_kancil");
    expect(JSON.stringify(exported)).not.toMatch(/scrypt|token_hash/);

    const wrong = await deleteAccount(
      req("DELETE", "/api/account", e, { password: "salah", confirm: "HAPUS" }),
    );
    expect(wrong.status).toBe(401);
    const noConfirm = await deleteAccount(
      req("DELETE", "/api/account", e, { password: "langit-biru-sekali-7" }),
    );
    expect(noConfirm.status).toBe(400);
    const ok = await deleteAccount(
      req("DELETE", "/api/account", e, {
        password: "langit-biru-sekali-7",
        confirm: "HAPUS",
      }),
    );
    expect(ok.status).toBe(200);
    expect(
      await sql(testUrl, "select 1 from users where handle = $1", [
        "eka_kancil",
      ]),
    ).toEqual([]);
    expect(
      await sql(
        testUrl,
        "select count(*)::int as n from auth_sessions s left join users u on u.id = s.user_id where u.id is null",
      ),
    ).toEqual([{ n: 0 }]);
    expect(
      (await (await me(req("GET", "/api/auth/me", e))).json()).user,
    ).toBeNull();
  });
});

describe("public demo account (D-014)", () => {
  it("is created on first login, cannot be registered or deleted, and stays a learner", async () => {
    const taken = await register(
      req("POST", "/api/auth/register", undefined, {
        handle: DEMO_ACCOUNT.handle,
        password: "pelangi-biru-77",
      }),
    );
    expect(taken.status).toBe(400);

    const signIn = await login(
      req("POST", "/api/auth/login", undefined, DEMO_ACCOUNT),
    );
    expect(signIn.status).toBe(200);
    const cookie = signIn.headers.get("set-cookie")!.split(";")[0]!;
    const who = await (await me(req("GET", "/api/auth/me", cookie))).json();
    expect(who.user).toEqual({ handle: DEMO_ACCOUNT.handle, role: "learner" });

    const del = await deleteAccount(
      req("DELETE", "/api/account", cookie, {
        password: DEMO_ACCOUNT.password,
        confirm: "HAPUS",
      }),
    );
    expect(del.status).toBe(403);
    expect(
      await sql(testUrl, "select 1 from users where handle = $1", [
        DEMO_ACCOUNT.handle,
      ]),
    ).toHaveLength(1);
  });
});
