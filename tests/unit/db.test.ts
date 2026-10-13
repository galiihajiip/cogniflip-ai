import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseServerEnv } from "@/server/config/env";
import { createPool } from "@/server/db/client";
import { checkDatabase } from "@/server/db/health";
import {
  MigrationError,
  checksumOf,
  compareMigrations,
  loadMigrations,
  newMigrationFilename,
} from "@/server/db/migrator.mts";
import { AppError } from "@/server/http/errors";
import { GET as getStatus } from "@/app/api/status/route";
import { GET as getDatabaseHealth } from "@/app/api/health/database/route";

// Synthetic credentials for a port where nothing listens.
const PASSWORD = ["synthetic", "pw", "4242"].join("-");
const UNREACHABLE_URL = `postgresql://app:${PASSWORD}@127.0.0.1:1/app`;

const dirs: string[] = [];
function migrationDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "cogniflip-migrations-"));
  dirs.push(dir);
  for (const [name, sql] of Object.entries(files))
    writeFileSync(join(dir, name), sql);
  return dir;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("loadMigrations", () => {
  it("loads valid files in version order with stable checksums and ignores non-SQL files", () => {
    const dir = migrationDir({
      "20261013000200_second.sql": "select 2;",
      "20261013000100_first_step.sql": "select 1;",
      ".gitkeep": "",
    });
    const migrations = loadMigrations(dir);
    expect(migrations.map((m) => m.filename)).toEqual([
      "20261013000100_first_step.sql",
      "20261013000200_second.sql",
    ]);
    expect(migrations[0]).toMatchObject({
      version: "20261013000100",
      name: "first_step",
      checksum: checksumOf("select 1;"),
    });
  });

  it.each([
    ["no timestamp", "create_lessons.sql"],
    ["short timestamp", "2026101_create_lessons.sql"],
    ["uppercase name", "20261013000100_Create_Lessons.sql"],
    ["hyphenated name", "20261013000100_create-lessons.sql"],
  ])("rejects a filename with %s", (_label, filename) => {
    expect(() =>
      loadMigrations(migrationDir({ [filename]: "select 1;" })),
    ).toThrow(MigrationError);
  });

  it("rejects duplicate versions and empty files", () => {
    expect(() =>
      loadMigrations(
        migrationDir({
          "20261013000100_a.sql": "select 1;",
          "20261013000100_b.sql": "select 2;",
        }),
      ),
    ).toThrow(/Duplicate migration version/);
    expect(() =>
      loadMigrations(migrationDir({ "20261013000100_a.sql": "  \n" })),
    ).toThrow(/empty/);
  });

  it("accepts every migration committed to db/migrations", () => {
    expect(() =>
      loadMigrations(join(process.cwd(), "db", "migrations")),
    ).not.toThrow();
  });
});

describe("compareMigrations", () => {
  const files = loadMigrations(
    migrationDir({
      "20261013000100_a.sql": "select 1;",
      "20261013000200_b.sql": "select 2;",
      "20261013000300_c.sql": "select 3;",
    }),
  );

  it("detects pending, modified, missing and out-of-order migrations", () => {
    const status = compareMigrations(files, [
      { version: "20261013000100", name: "a", checksum: "edited" },
      { version: "20261013000300", name: "c", checksum: files[2].checksum },
      { version: "20261013000400", name: "gone", checksum: "x" },
    ]);
    expect(status.pending.map((m) => m.version)).toEqual(["20261013000200"]);
    expect(status.modified).toEqual(["20261013000100"]);
    expect(status.missing).toEqual(["20261013000400"]);
    expect(status.outOfOrder).toEqual(["20261013000200"]);
  });
});

describe("newMigrationFilename", () => {
  it("builds a UTC timestamped lower_snake filename", () => {
    expect(
      newMigrationFilename("Create Lessons!", new Date("2026-10-13T01:02:03Z")),
    ).toBe("20261013010203_create_lessons.sql");
    expect(() => newMigrationFilename("  ")).toThrow(MigrationError);
  });
});

describe("database configuration", () => {
  it("fails closed with PROVIDER_UNAVAILABLE when DATABASE_URL is not set", () => {
    try {
      createPool(parseServerEnv({}));
      throw new Error("expected createPool to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("PROVIDER_UNAVAILABLE");
      expect((error as AppError).details).toEqual({ integration: "database" });
    }
  });

  it("requires TLS for the database in production", () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: "production",
        APP_BASE_URL: "https://cogniflip.example",
        DATABASE_URL: "postgresql://app:pw@db.example/app",
      }),
    ).toThrow(/DATABASE_URL: must set sslmode/);
    expect(() =>
      parseServerEnv({
        NODE_ENV: "production",
        APP_BASE_URL: "https://cogniflip.example",
        DATABASE_URL: "postgresql://app:pw@db.example/app?sslmode=verify-full",
      }),
    ).not.toThrow();
  });
});

describe("database TLS rule", () => {
  it.each(["127.0.0.1:54329", "localhost:5432", "[::1]:5432"])(
    "allows a loopback database (%s) without sslmode in production",
    (host) => {
      expect(() =>
        parseServerEnv({
          NODE_ENV: "production",
          APP_BASE_URL: "http://localhost:3000",
          DATABASE_URL: `postgresql://app:pw@${host}/app`,
        }),
      ).not.toThrow();
    },
  );

  it("allows a private container-network host without TLS (D-017)", () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: "production",
        APP_BASE_URL: "https://cogniflip.example",
        DATABASE_URL: "postgresql://app:pw@cogniflip-db:5432/app",
      }),
    ).not.toThrow();
  });

  it("rejects sslmode=disable or prefer for a remote host in production", () => {
    for (const mode of ["disable", "prefer"]) {
      expect(() =>
        parseServerEnv({
          NODE_ENV: "production",
          APP_BASE_URL: "https://cogniflip.example",
          DATABASE_URL: `postgresql://app:pw@db.example/app?sslmode=${mode}`,
        }),
      ).toThrow(/DATABASE_URL: must set sslmode/);
    }
  });
});

describe("checkDatabase", () => {
  it("reports not_configured without touching the network", async () => {
    await expect(checkDatabase(parseServerEnv({}))).resolves.toEqual({
      status: "unavailable",
      reason: "not_configured",
    });
  });

  it("reports unreachable and keeps the password out of the result and logs", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("DATABASE_URL", UNREACHABLE_URL);

    const result = await checkDatabase(
      parseServerEnv({ DATABASE_URL: UNREACHABLE_URL }),
    );

    expect(result).toEqual({ status: "unavailable", reason: "unreachable" });
    expect(warn).toHaveBeenCalled();
    for (const call of warn.mock.calls)
      expect(String(call[0])).not.toContain(PASSWORD);
  });
});

describe("database HTTP endpoints", () => {
  it("GET /api/health/database returns 503 not_configured without a database", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const response = await getDatabaseHealth(new Request("http://test/"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: "unavailable",
      reason: "not_configured",
    });
  });

  it("GET /api/status reports a configured but unreachable database as unavailable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("DATABASE_URL", UNREACHABLE_URL);
    const response = await getStatus(new Request("http://test/"));
    const text = await response.text();
    expect(JSON.parse(text).integrations.database).toEqual({
      available: false,
      reason: "unreachable",
    });
    expect(text).not.toContain(PASSWORD);
    expect(text).not.toContain("127.0.0.1");
  });
});
