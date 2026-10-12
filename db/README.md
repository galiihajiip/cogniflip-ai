# Database: PostgreSQL and migrations

Decision: `D-006` in `docs/20_DECISION_LOG.md`. The application uses PostgreSQL through the `pg` driver from **server-only** code (`src/server/db/`). Nothing database-related is importable from client components, and no database credential is ever a `NEXT_PUBLIC_*` variable.

## Current state

| Migration | Tables |
|---|---|
| `20261013001541_create_users_and_auth_sessions` | `users` (handle, scrypt hash, role), `auth_sessions` (token hash, expiry, revocation) |
| `20261013001900_create_profiles` | `profiles` (preset avatar, leaderboard opt-in default false, preferences) |
| `20261013002118_create_tutor_sessions_and_attempts` | `tutor_sessions` (owner user **or** guest hash, pinned lesson/rubric versions, state, version), `tutor_attempts` (every attempt; score only when assessed, enforced by CHECK constraints; unique idempotency key per session) |

The tooling also creates `schema_migrations`. The production database host is **not chosen yet**.

### Retention
- Deleting an account cascades its login sessions, profile and tutor sessions/attempts.
- Guest tutor sessions not updated for 30 days are removed by `deleteStaleGuestSessions()` (`src/server/learning/session/pg-store.ts`). Scheduling it is a deployment task (`docs/17`) and is **not scheduled yet**.
- Voice recordings are never stored.

## Local database (Docker)

```bash
npm run db:up            # postgres:18.6-alpine on 127.0.0.1:54329, waits until healthy
npm run db:down          # stop; data is kept in the named volume
npm run db:reset-local   # stop AND delete local data (local only)
```

The credentials in `compose.yaml` are throwaway local values bound to `127.0.0.1`. They are not production secrets and must never be reused anywhere else. Put this in `.env.local` (git-ignored):

```bash
DATABASE_URL=postgresql://cogniflip:cogniflip_local_only@127.0.0.1:54329/cogniflip
```

## Commands

| Command | What it does |
|---|---|
| `npm run db:new -- <short name>` | Creates `db/migrations/<UTC timestamp>_<lower_snake_name>.sql` with a header template |
| `npm run db:status` | Lists applied/pending migrations; exits 1 on a modified, missing or out-of-order migration |
| `npm run db:migrate` | Applies pending migrations in order |
| `npm run test:integration` | Runs `tests/integration/` against a real server (needs `TEST_DATABASE_URL`) |

`db:migrate` and `db:status` read `DATABASE_URL` from the environment, or from `.env.local` if present. They never print the connection string; driver errors are shown with credentials scrubbed.

## Migration policy

1. **Naming:** `YYYYMMDDHHMMSS_lower_snake_description.sql`, with a UTC timestamp from `db:new`. The runner rejects any other `.sql` name, duplicate versions and empty files.
2. **Small and single-purpose:** one coherent change per migration. Never put the whole schema in one file.
3. **Forward-only and immutable:** an applied migration is never edited, renamed or deleted. The runner stores a SHA-256 checksum and refuses to run if an applied file changed or disappeared. Fix mistakes with a new migration.
4. **Ordered:** a pending migration older than the newest applied one is refused, so a merged branch cannot silently skip ahead.
5. **Atomic:** each migration and its `schema_migrations` row commit in one transaction. A failure rolls back both. Statements that cannot run inside a transaction (e.g. `CREATE INDEX CONCURRENTLY`) are not supported by this runner.
6. **Serialized:** a PostgreSQL advisory lock prevents two runners from applying migrations at the same time.
7. **Rollback notes:** every migration header states how to reverse it, or why it cannot be reversed. Reversal is a deliberate manual step, never automatic.
8. **Data safety:** no real user or child data in migrations or fixtures. Seed data, if ever needed, is synthetic and contains no personal data. Destructive changes (drop/rename column, data rewrite) need a note in the decision log and a backup first.
9. **Authorization:** tables holding user data get ownership checks in server code, plus row-level security where it is enabled, in the same change that creates them (`docs/06` §7, `docs/11`).

## Rollback and recovery

- **Bad migration, not yet deployed:** fix it in place only if it has never been applied anywhere; otherwise add a corrective migration.
- **Bad migration in production:**
  1. stop deploys;
  2. take a backup or snapshot;
  3. apply the reviewed rollback SQL from the migration header manually, or deploy a corrective forward migration;
  4. record the incident (`docs/19`).
- **Data loss or corruption:** restore from the provider's backup or point-in-time recovery into a new database, verify it, then switch `DATABASE_URL`. Practice a restore before relying on it (`docs/17`).
- **Before any production migration:** confirm a recent backup exists, run `db:status`, apply to a staging copy first, then production.

## Applying migrations without exposing secrets

- Keep `DATABASE_URL` only in `.env.local` (local), the hosting provider's secret settings (deployed), or a CI secret, never in the repository, issue comments, screenshots or prompt logs.
- Run `npm run db:migrate` from a trusted machine or a CI job with the secret injected as an environment variable. The command output contains filenames and counts only.
- Production URLs for a remote host must include `sslmode=require` (or `verify-ca` / `verify-full`); the app refuses to start otherwise. A database on the same machine (`localhost`, `127.0.0.1`, `::1`) is exempt, which allows local `next start` smoke tests.

## Health checks

- `GET /api/health/database`: `200 {"status":"ok","latencyMs":…}` after a live `select 1`, otherwise `503` with `reason` `not_configured` or `unreachable`.
- `GET /api/status`: the `database` entry uses the same live check.
- Neither endpoint returns hosts, users, database names or driver messages; those go to the redacted server log.

## Integration tests

```bash
npm run db:up
TEST_DATABASE_URL=postgresql://cogniflip:cogniflip_local_only@127.0.0.1:54329/cogniflip npm run test:integration
```

Each run creates its own throwaway database (`cogniflip_it_<pid>_<time>`), uses synthetic tables and rows only, and drops it afterwards. Without `TEST_DATABASE_URL` the suite fails with an explanation instead of silently skipping. CI runs the same suite against a `postgres:18.6-alpine` service container.
