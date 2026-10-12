-- 20261013001900_create_profiles.sql
-- Purpose: learner profile with privacy defaults (docs/10, ADR-004): a preset
-- avatar, leaderboard opt-in (off by default) and accessibility preferences.
-- No free-text personal fields.
-- Rollback (manual, reviewed, after a backup):
--   drop table profiles;

create table profiles (
  user_id            uuid primary key references users (id) on delete cascade,
  avatar_key         text not null default 'robot-biru'
                     check (avatar_key in ('robot-biru', 'robot-hijau', 'kucing',
                                           'burung-hantu', 'roket', 'bintang')),
  leaderboard_opt_in boolean not null default false,
  -- Validated by application code (strict schema); small and non-personal.
  preferences        jsonb not null default '{}'::jsonb
                     check (jsonb_typeof(preferences) = 'object'
                            and pg_column_size(preferences) < 1024),
  updated_at         timestamptz not null default now()
);
