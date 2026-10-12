-- 20261013001541_create_users_and_auth_sessions.sql
-- Purpose: pseudonymous accounts (D-010): a handle and a password hash only,
-- plus server-side login sessions. No email, real name, school or birthdate.
-- Rollback (manual, reviewed, after a backup):
--   drop table auth_sessions; drop table users;

create table users (
  id            uuid primary key default gen_random_uuid(),
  -- Lower-case pseudonym, validated in application code (3–20 chars).
  handle        text not null unique
                check (handle ~ '^[a-z][a-z0-9_]{2,19}$'),
  -- scrypt$N$r$p$salt$hash, never the password itself.
  password_hash text not null check (password_hash like 'scrypt$%'),
  role          text not null default 'learner'
                check (role in ('learner', 'moderator', 'admin')),
  created_at    timestamptz not null default now()
);

create table auth_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users (id) on delete cascade,
  -- SHA-256 of the random cookie token; the token itself is never stored.
  token_hash   text not null unique check (length(token_hash) = 64),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz
);

create index auth_sessions_user_id_idx on auth_sessions (user_id);
create index auth_sessions_expires_at_idx on auth_sessions (expires_at);
