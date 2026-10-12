-- 20261013002532_create_xp_ledger_and_achievements.sql
-- Purpose: append-only XP ledger and earned achievements (BLOCK 31,
-- docs/06 §6). Rows are created only by server-side rules from persisted,
-- assessed attempts; each award has a unique idempotency key per user.
-- Rollback (manual, reviewed, after a backup):
--   drop table user_achievements; drop table xp_events;
--   drop function xp_events_append_only();

create table xp_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users (id) on delete cascade,
  event_type      text not null check (event_type in (
                    'explanation_assessed', 'strong_explanation', 'improved_after_revision')),
  source_session  uuid not null references tutor_sessions (id) on delete cascade,
  delta           integer not null check (delta between 1 and 50),
  rule_version    text not null,
  idempotency_key text not null,
  created_at      timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index xp_events_user_idx on xp_events (user_id, created_at desc);
create index xp_events_created_idx on xp_events (created_at);

-- Append-only: an awarded event is never edited. (Deleting happens only via
-- account/session deletion cascades.)
create function xp_events_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'xp_events is append-only';
end $$;
create trigger xp_events_no_update before update on xp_events
  for each row execute function xp_events_append_only();

create table user_achievements (
  user_id         uuid not null references users (id) on delete cascade,
  achievement_key text not null check (achievement_key in (
                    'penjelas-pertama', 'tiga-pelajaran', 'perbaikan-hebat')),
  rule_version    text not null,
  awarded_at      timestamptz not null default now(),
  primary key (user_id, achievement_key)
);
