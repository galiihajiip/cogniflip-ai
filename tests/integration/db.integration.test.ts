import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
import { parseServerEnv } from "@/server/config/env";
import { checkDatabase } from "@/server/db/health";
import {
  getMigrationStatus,
  loadMigrations,
  migrate,
} from "@/server/db/migrator.mts";
import { GET as getDatabaseHealth } from "@/app/api/health/database/route";

/**
 * Runs against a real PostgreSQL server (see db/README.md, "Integration tests").
 * Each run creates and drops its own throwaway database; data is synthetic.
 */
const adminUrl = process.env.TEST_DATABASE_URL;
if (!adminUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Start the local database with `npm run db:up` and see db/README.md.",
  );
}

const dbName = `cogniflip_it_${process.pid}_${Date.now()}`;
const testUrl = (() => {
  const url = new URL(adminUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
})();

async function withClient<T>(url: string, run: (c: pg.Client) => Promise<T>) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

let dir: string;
function writeMigrations(files: Record<string, string>) {
  for (const [name, sql] of Object.entries(files))
    writeFileSync(join(dir, name), sql);
}

beforeAll(async () => {
  await withClient(adminUrl, (c) => c.query(`create database ${dbName}`));
});

afterAll(async () => {
  await withClient(adminUrl, (c) =>
    c.query(`drop database if exists ${dbName} with (force)`),
  );
});

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "cogniflip-it-"));
  await withClient(testUrl, (c) =>
    c.query("drop schema public cascade; create schema public;"),
  );
  return () => rmSync(dir, { recursive: true, force: true });
});

describe("migrate (real PostgreSQL)", () => {
  it("applies pending migrations in order once and is idempotent", async () => {
    writeMigrations({
      "20261013000100_create_widgets.sql":
        "create table widgets (id int primary key, label text not null);",
      "20261013000200_seed_synthetic_widget.sql":
        "insert into widgets values (1, 'synthetic');",
    });
    const files = loadMigrations(dir);

    await withClient(testUrl, async (c) => {
      expect(await migrate(c, files)).toEqual([
        "20261013000100",
        "20261013000200",
      ]);
      expect(await migrate(c, files)).toEqual([]);
      const { rows } = await c.query("select label from widgets");
      expect(rows).toEqual([{ label: "synthetic" }]);
      const status = await getMigrationStatus(c, files);
      expect(status.applied).toHaveLength(2);
      expect(status.pending).toHaveLength(0);
    });
  });

  it("rolls back a failing migration and keeps earlier ones", async () => {
    writeMigrations({
      "20261013000100_ok.sql": "create table kept (id int);",
      "20261013000200_broken.sql":
        "create table half_done (id int); select * from no_such_table;",
    });
    const files = loadMigrations(dir);

    await withClient(testUrl, async (c) => {
      await expect(migrate(c, files)).rejects.toThrow(
        /20261013000200_broken\.sql failed and was rolled back/,
      );
      const { rows } = await c.query(
        "select to_regclass('kept') as kept, to_regclass('half_done') as half",
      );
      expect(rows[0]).toEqual({ kept: "kept", half: null });
      const status = await getMigrationStatus(c, files);
      expect(status.applied.map((a) => a.version)).toEqual(["20261013000100"]);
    });
  });

  it("commits a migration and its bookkeeping row together or not at all", async () => {
    writeMigrations({
      "20261013000100_create_atomic.sql": "create table atomic (id int);",
    });
    const files = loadMigrations(dir);

    await withClient(testUrl, async (c) => {
      await migrate(c, []); // creates schema_migrations
      // Synthetic fault: recording any migration fails.
      await c.query(`
        create function reject_record() returns trigger language plpgsql as
          $$ begin raise exception 'synthetic bookkeeping failure'; end $$;
        create trigger reject_record before insert on schema_migrations
          for each row execute function reject_record();`);

      await expect(migrate(c, files)).rejects.toThrow(
        /failed and was rolled back/,
      );
      const { rows } = await c.query("select to_regclass('atomic') as t");
      expect(rows[0].t).toBeNull();
    });
  });

  it("refuses to run when an applied migration was edited", async () => {
    writeMigrations({ "20261013000100_a.sql": "create table a (id int);" });
    await withClient(testUrl, (c) => migrate(c, loadMigrations(dir)));

    writeMigrations({ "20261013000100_a.sql": "create table a (id bigint);" });
    await withClient(testUrl, async (c) => {
      await expect(migrate(c, loadMigrations(dir))).rejects.toThrow(
        /20261013000100 was modified after being applied/,
      );
    });
  });

  it("refuses an out-of-order migration", async () => {
    writeMigrations({ "20261013000200_b.sql": "create table b (id int);" });
    await withClient(testUrl, (c) => migrate(c, loadMigrations(dir)));

    writeMigrations({ "20261013000100_a.sql": "create table a (id int);" });
    await withClient(testUrl, async (c) => {
      await expect(migrate(c, loadMigrations(dir))).rejects.toThrow(
        /20261013000100 is older than the newest applied migration/,
      );
    });
  });

  it("serializes concurrent runs with an advisory lock", async () => {
    writeMigrations({
      "20261013000100_slow.sql":
        "select pg_sleep(0.5); create table once_only (id int);",
    });
    const files = loadMigrations(dir);
    const results = await Promise.all([
      withClient(testUrl, (c) => migrate(c, files)),
      withClient(testUrl, (c) => migrate(c, files)),
    ]);
    expect(results.flat()).toEqual(["20261013000100"]);
  });

  it("applies the committed db/migrations without errors", async () => {
    const files = loadMigrations(join(process.cwd(), "db", "migrations"));
    await withClient(testUrl, async (c) => {
      await migrate(c, files);
      const status = await getMigrationStatus(c, files);
      expect(status.pending).toHaveLength(0);
    });
  });
});

describe("health check (real PostgreSQL)", () => {
  it("checkDatabase reports ok for a reachable database", async () => {
    const health = await checkDatabase(
      parseServerEnv({ DATABASE_URL: testUrl }),
    );
    expect(health).toMatchObject({ status: "ok" });
  });

  it("GET /api/health/database returns 200 without credentials in the body", async () => {
    vi.stubEnv("DATABASE_URL", testUrl);
    try {
      const response = await getDatabaseHealth(new Request("http://test/"));
      const text = await response.text();
      expect(response.status).toBe(200);
      expect(JSON.parse(text).status).toBe("ok");
      expect(text).not.toContain(new URL(testUrl).password);
      expect(text).not.toContain(dbName);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
