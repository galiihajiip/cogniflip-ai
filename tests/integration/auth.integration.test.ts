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
import { GET as me } from "@/app/api/auth/me/route";

/** Real routes + real PostgreSQL with the committed migrations. */
const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl)
  throw new Error("TEST_DATABASE_URL is not set (see db/README.md)");
const dbName = `cogniflip_auth_${process.pid}_${Date.now()}`;
const testUrl = Object.assign(new URL(adminUrl), {
  pathname: `/${dbName}`,
}).toString();
const BASE = "http://localhost:3000";

async function sql<T extends pg.QueryResultRow>(url: string, text: string) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return (await client.query<T>(text)).rows;
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

const post = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new Request(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 200)}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
const cookieOf = (r: Response) => r.headers.get("set-cookie")!.split(";")[0];
const whoami = async (cookie?: string) =>
  (
    await (
      await me(
        new Request(`${BASE}/api/auth/me`, {
          headers: cookie ? { cookie } : {},
        }),
      )
    ).json()
  ).user;

describe("auth against PostgreSQL", () => {
  it("registers, reads the session, logs out and logs back in", async () => {
    const reg = await register(
      post("/api/auth/register", {
        handle: "Robi_Kecil",
        password: "kucing-terbang-9",
      }),
    );
    expect(reg.status).toBe(201);
    expect(reg.headers.get("set-cookie")).toMatch(
      /^cf_session=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Lax/,
    );
    const cookie = cookieOf(reg);
    expect(await whoami(cookie)).toEqual({
      handle: "robi_kecil",
      role: "learner",
    });

    const out = await logout(post("/api/auth/logout", {}, { cookie }));
    expect(out.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    expect(await whoami(cookie)).toBeNull();

    const back = await login(
      post("/api/auth/login", {
        handle: "robi_kecil",
        password: "kucing-terbang-9",
      }),
    );
    expect(back.status).toBe(200);
    expect(await whoami(cookieOf(back))).toMatchObject({
      handle: "robi_kecil",
    });
  });

  it("stores no plaintext password or token, and keeps two users separate", async () => {
    const a = await register(
      post("/api/auth/register", {
        handle: "pelangi",
        password: "bintang-jatuh-7",
      }),
    );
    const b = await register(
      post("/api/auth/register", {
        handle: "mentari",
        password: "awan-putih-77",
      }),
    );
    const tokenA = cookieOf(a).split("=")[1];
    expect(await whoami(cookieOf(a))).toMatchObject({ handle: "pelangi" });
    expect(await whoami(cookieOf(b))).toMatchObject({ handle: "mentari" });
    const dump =
      JSON.stringify(await sql(testUrl, "select * from users")) +
      JSON.stringify(await sql(testUrl, "select * from auth_sessions"));
    expect(dump).not.toContain("bintang-jatuh-7");
    expect(dump).not.toContain(tokenA);
  });

  it("returns a neutral 401 for wrong credentials and 409 for a taken handle", async () => {
    await register(
      post("/api/auth/register", {
        handle: "awan_biru",
        password: "hujan-deras-3",
      }),
    );
    const wrong = await login(
      post("/api/auth/login", {
        handle: "awan_biru",
        password: "salah-salah-1",
      }),
    );
    const missing = await login(
      post("/api/auth/login", {
        handle: "tidak_ada_x",
        password: "salah-salah-1",
      }),
    );
    const w = await wrong.json();
    const m = await missing.json();
    expect([wrong.status, missing.status]).toEqual([401, 401]);
    expect(w.error.code).toBe("INVALID_CREDENTIALS");
    expect(w.error.message).toBe(m.error.message);
    const taken = await register(
      post("/api/auth/register", {
        handle: "awan_biru",
        password: "lain-lagi-44",
      }),
    );
    expect(taken.status).toBe(409);
  });

  it("refuses cross-origin auth posts and unknown fields", async () => {
    const cross = await register(
      post(
        "/api/auth/register",
        { handle: "kancil", password: "cerdik-sekali-5" },
        { origin: "https://evil.example" },
      ),
    );
    expect(cross.status).toBe(403);
    const extra = await register(
      post("/api/auth/register", {
        handle: "kancil",
        password: "cerdik-sekali-5",
        role: "admin",
      }),
    );
    expect(extra.status).toBe(400);
  });
});
