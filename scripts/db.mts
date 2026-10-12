// Database CLI: `npm run db:migrate | db:status | db:new -- <name>`.
// Reads DATABASE_URL from the environment (or .env.local via npm scripts) and
// never prints it. Policy: db/README.md.
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import {
  MigrationError,
  getMigrationStatus,
  loadMigrations,
  migrate,
  newMigrationFilename,
} from "../src/server/db/migrator.mts";

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "db", "migrations");

function scrub(text: string): string {
  const url = process.env.DATABASE_URL;
  let out = url ? text.split(url).join("[DATABASE_URL]") : text;
  out = out.replace(
    /(\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:)[^\s@/]+@/gi,
    "$1[REDACTED]@",
  );
  return out;
}

function fail(message: string): never {
  console.error(`db: ${scrub(message)}`);
  process.exit(1);
}

function databaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    fail("DATABASE_URL is not set. See db/README.md (Local database).");
  }
  let protocol: string;
  try {
    protocol = new URL(value).protocol;
  } catch {
    fail("DATABASE_URL is not a valid URL.");
  }
  if (protocol !== "postgres:" && protocol !== "postgresql:") {
    fail("DATABASE_URL must start with postgres:// or postgresql://.");
  }
  return value;
}

async function withClient<T>(
  run: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({
    connectionString: databaseUrl(),
    connectionTimeoutMillis: 10_000,
    application_name: "cogniflip-migrate",
  });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command === "new") {
    const filename = newMigrationFilename(args.join(" "));
    const path = join(MIGRATIONS_DIR, filename);
    if (existsSync(path)) fail(`${filename} already exists`);
    writeFileSync(
      path,
      [
        `-- ${filename}`,
        "-- Purpose: <what this changes and why>",
        "-- Rollback (manual, reviewed, after a backup): <SQL that reverses this, or 'not reversible: <reason>'>",
        "",
        "",
      ].join("\n"),
    );
    console.log(`created db/migrations/${filename}`);
    return;
  }

  const files = loadMigrations(MIGRATIONS_DIR);

  if (command === "status") {
    const status = await withClient((c) => getMigrationStatus(c, files));
    console.log(
      `applied: ${status.applied.length}, pending: ${status.pending.length}`,
    );
    for (const m of status.pending) console.log(`  pending  ${m.filename}`);
    for (const v of status.modified)
      console.log(`  MODIFIED ${v} (file changed after it was applied)`);
    for (const v of status.missing)
      console.log(`  MISSING  ${v} (applied, but no file)`);
    for (const v of status.outOfOrder)
      console.log(`  ORDER    ${v} (older than newest applied)`);
    const problems =
      status.modified.length + status.missing.length + status.outOfOrder.length;
    if (problems > 0) process.exit(1);
    return;
  }

  if (command === "migrate") {
    const applied = await withClient((c) =>
      migrate(c, files, (line) => console.log(line)),
    );
    console.log(
      applied.length === 0
        ? "nothing to apply"
        : `applied ${applied.length} migration(s)`,
    );
    return;
  }

  fail("usage: db.mts <migrate | status | new <name>>");
}

main().catch((error: unknown) => {
  if (error instanceof MigrationError) {
    const cause =
      error.cause instanceof Error ? `\n  cause: ${error.cause.message}` : "";
    fail(`${error.message}${cause}`);
  }
  fail(error instanceof Error ? error.message : String(error));
});
