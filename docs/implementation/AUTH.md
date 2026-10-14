# Accounts and Authentication (BLOCK 27, D-010)

## Design
- **Identity:** a pseudonymous handle and a password. No email, real name, school, birthdate or location is collected.
  - Handles: 3–20 characters, `a–z 0–9 _`, start with a letter, stored lower-case.
  - Rejected handles: email-like or phone-like strings, and reserved staff-like names (`admin`, `moderator`, `cogniflip`, `robi`, `guru`, …).
- **Passwords:** 8–128 characters; very common passwords and passwords containing the handle are rejected. Hashed with Node's built-in **scrypt** (N=2¹⁵, r=8, p=1, 16-byte random salt), stored as `scrypt$N$r$p$salt$hash`.
- **Sessions:** a 32-byte random token in the `cf_session` cookie (`HttpOnly; SameSite=Lax; Path=/`, `Secure` in production, 30 days). The database stores only its SHA-256. Sessions with less than 15 days left are extended on use (refresh). Logout revokes the session server-side.
- **Errors:** wrong handle or wrong password → `INVALID_CREDENTIALS` with the same neutral message, and the same scrypt work (a dummy hash when the handle doesn't exist). A taken handle at registration → `CONFLICT` (handles are public pseudonyms).
- **Abuse limits** (per server instance): login 5/15 min per handle and 20/15 min per IP; registration 5/hour per IP.
- **CSRF:** SameSite=Lax cookies plus an Origin check on every auth POST.
- **No database:** account routes return `PROVIDER_UNAVAILABLE` (`integration: database`); there is no fake login. The in-memory repository is a unit-test adapter only and is never wired into the app.

## Endpoints
| Method and path | Body | Result |
|---|---|---|
| `POST /api/auth/register` | `{ handle, password }` | 201 `{ user: { handle, role } }` + session cookie |
| `POST /api/auth/login` | `{ handle, password }` | 200 `{ user }` + cookie, or 401 `INVALID_CREDENTIALS` |
| `POST /api/auth/logout` | `{}` | 200 `{ user: null }`, cookie cleared, session revoked |
| `GET /api/auth/me` | — | `{ user }` or `{ user: null }` |

Request bodies are strict, so a client-sent `role` is rejected. Roles are set only in the database.

## Setup
1. `DATABASE_URL` set (see `db/README.md`), then `npm run db:migrate` (migration `20261013001541_create_users_and_auth_sessions`).
2. There are no OAuth providers, callback URLs or email settings: accounts are fully in-house.

## Verified
- `tests/unit/auth.test.ts` (19): handle/password rules, scrypt format and verification, registration, neutral login errors, rate limits, refresh, expiry, logout, malformed tokens.
- `tests/integration/auth.integration.test.ts` (4, real PostgreSQL 18.6, real route handlers):
  - register → me → logout → login;
  - no plaintext password or token in the database;
  - two users kept separate;
  - neutral 401, duplicate 409, cross-origin 403, unknown field 400.

## Known limitations (honest)
- **No password recovery.** Without email there is no self-service reset. A forgotten password currently means a new account. An adult-assisted reset is **not implemented**.
- **Guest progress is not moved into a new account** (privacy-safe default).
- **Rate limits are per instance**; the hosting firewall is the outer limit.
- **Guardian consent and age requirements** for real child accounts have **not been reviewed** (ADR-004 follow-up, `docs/10`). Treat accounts as a competition demo until that review happens.
- **There is no UI** for registration or login yet (D-009).

## Profile and privacy (BLOCK 28)
- Migration `20261013001900_create_profiles`: `avatar_key` (6 presets only), `leaderboard_opt_in` (**default false**), `preferences` (JSON, strict schema: `reducedMotion`, `textSize`). No free-text personal fields.
- `GET/PATCH /api/profile`: own profile only. The user is taken from the server session; `handle`, `role` and ids cannot be changed. Unknown fields → 400.
- `GET /api/profiles/:handle`: `{ handle, avatarKey }` only, and only if the learner opted in. Otherwise 404, so whether the account exists isn't revealed.
- `GET /api/account/export`: own stored data as a JSON download (no hashes).
- `DELETE /api/account { password, confirm: "HAPUS" }`: deletes the user. Login sessions and profile cascade; learning history will cascade too once it exists (BLOCK 29). The cookie is cleared.
- Verified: `tests/integration/profile.integration.test.ts` (5 tests, two real accounts on PostgreSQL) covers defaults, own-only editing, forbidden fields, sign-in required, opt-in public allowlist, export without secrets, and deletion with cascade.
- Not verified: keyboard and mobile UX (no UI yet, D-009).
