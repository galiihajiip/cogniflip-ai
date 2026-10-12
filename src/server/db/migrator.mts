import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Forward-only SQL migration engine (policy: db/README.md).
 *
 * Used by the `npm run db:*` scripts and tests, never by request handlers.
 * It holds no credentials: callers pass an already-connected client.
 */

export const MIGRATIONS_TABLE = "schema_migrations";
export const MIGRATION_FILENAME = /^(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/;
// Arbitrary constant shared by every CogniFlip migration run.
const ADVISORY_LOCK_KEY = 482_910_377;

export interface Migration {
  version: string;
  name: string;
  filename: string;
  sql: string;
  checksum: string;
}

export interface AppliedMigration {
  version: string;
  name: string;
  checksum: string;
}

export interface MigrationStatus {
  applied: AppliedMigration[];
  pending: Migration[];
  /** Applied migrations whose file content changed afterwards. */
  modified: string[];
  /** Applied versions that have no file any more. */
  missing: string[];
  /** Pending versions older than the newest applied one. */
  outOfOrder: string[];
}

/** Minimal client surface (satisfied by `pg.Client`). */
export interface SqlClient {
  query<R extends object = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: R[] }>;
}

export class MigrationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "MigrationError";
  }
}

export function checksumOf(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

export function loadMigrations(directory: string): Migration[] {
  const files = readdirSync(directory).filter((f) => f.endsWith(".sql"));
  const migrations = files.map((filename) => {
    const match = MIGRATION_FILENAME.exec(filename);
    if (!match) {
      throw new MigrationError(
        `Invalid migration filename "${filename}". Expected YYYYMMDDHHMMSS_lower_snake_name.sql`,
      );
    }
    const sql = readFileSync(join(directory, filename), "utf8");
    if (sql.trim() === "") {
      throw new MigrationError(`Migration "${filename}" is empty`);
    }
    return {
      version: match[1],
      name: match[2],
      filename,
      sql,
      checksum: checksumOf(sql),
    };
  });

  migrations.sort((a, b) => a.version.localeCompare(b.version));
  for (let i = 1; i < migrations.length; i++) {
    if (migrations[i].version === migrations[i - 1].version) {
      throw new MigrationError(
        `Duplicate migration version ${migrations[i].version}`,
      );
    }
  }
  return migrations;
}

async function ensureMigrationsTable(client: SqlClient) {
  await client.query(`
    create table if not exists ${MIGRATIONS_TABLE} (
      version    text primary key,
      name       text not null,
      checksum   text not null,
      applied_at timestamptz not null default now()
    )`);
}

export function compareMigrations(
  files: Migration[],
  applied: AppliedMigration[],
): MigrationStatus {
  const byVersion = new Map(files.map((m) => [m.version, m]));
  const appliedVersions = new Set(applied.map((a) => a.version));
  const newestApplied = applied.reduce(
    (max, a) => (a.version > max ? a.version : max),
    "",
  );
  const pending = files.filter((m) => !appliedVersions.has(m.version));

  return {
    applied,
    pending,
    modified: applied
      .filter((a) => {
        const file = byVersion.get(a.version);
        return file !== undefined && file.checksum !== a.checksum;
      })
      .map((a) => a.version),
    missing: applied
      .filter((a) => !byVersion.has(a.version))
      .map((a) => a.version),
    outOfOrder: pending
      .filter((m) => m.version < newestApplied)
      .map((m) => m.version),
  };
}

export async function getMigrationStatus(
  client: SqlClient,
  files: Migration[],
): Promise<MigrationStatus> {
  await ensureMigrationsTable(client);
  const { rows } = await client.query<AppliedMigration>(
    `select version, name, checksum from ${MIGRATIONS_TABLE} order by version`,
  );
  return compareMigrations(files, rows);
}

/**
 * Applies pending migrations in version order, each in its own transaction.
 * Refuses to run if history was edited, deleted or would apply out of order.
 * Returns the versions applied by this call.
 */
export async function migrate(
  client: SqlClient,
  files: Migration[],
  log: (line: string) => void = () => {},
): Promise<string[]> {
  await client.query("select pg_advisory_lock($1)", [ADVISORY_LOCK_KEY]);
  try {
    const status = await getMigrationStatus(client, files);
    const problems = [
      ...status.modified.map((v) => `${v} was modified after being applied`),
      ...status.missing.map((v) => `${v} is applied but its file is missing`),
      ...status.outOfOrder.map(
        (v) => `${v} is older than the newest applied migration`,
      ),
    ];
    if (problems.length > 0) {
      throw new MigrationError(
        `Refusing to migrate:\n  - ${problems.join("\n  - ")}\nAdd a new migration instead of editing applied ones.`,
      );
    }

    const appliedNow: string[] = [];
    for (const migration of status.pending) {
      await client.query("begin");
      try {
        await client.query(migration.sql);
        await client.query(
          `insert into ${MIGRATIONS_TABLE} (version, name, checksum) values ($1, $2, $3)`,
          [migration.version, migration.name, migration.checksum],
        );
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw new MigrationError(
          `Migration ${migration.filename} failed and was rolled back`,
          { cause: error },
        );
      }
      appliedNow.push(migration.version);
      log(`applied ${migration.filename}`);
    }
    return appliedNow;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [ADVISORY_LOCK_KEY]);
  }
}

/** Builds a new migration filename from a UTC timestamp and a short name. */
export function newMigrationFilename(name: string, now = new Date()): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!slug) throw new MigrationError("Migration name is required");
  const stamp = now.toISOString().replace(/\D/g, "").slice(0, 14);
  return `${stamp}_${slug}.sql`;
}
