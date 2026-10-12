-- 20261013003859_create_mission_attempts_and_mission_xp.sql
-- Purpose: store Predict-before-Run and Debug Robot attempts (BLOCK 40–41)
-- and allow XP events to come from a mission attempt instead of a tutor
-- session (xp-rules-v2). Existing xp_events rows are unchanged.
-- Rollback (manual, reviewed, after a backup):
--   alter table xp_events drop constraint xp_events_one_source;
--   delete from xp_events where source_mission_attempt is not null;
--   alter table xp_events drop column source_mission_attempt;
--   alter table xp_events alter column source_session set not null;
--   (restore the previous event_type check) ; drop table mission_attempts;

create table mission_attempts (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid references users (id) on delete cascade,
  owner_key_hash  text not null check (owner_key_hash ~ '^[0-9a-f]{64}$'),
  mission_id      text not null,
  mission_version integer not null check (mission_version >= 1),
  kind            text not null check (kind in ('predict', 'reflect', 'diagnose')),
  answer          text not null check (char_length(answer) between 1 and 1000),
  outcome         text not null check (outcome in (
                    'correct', 'incorrect', 'partial', 'unclear',
                    'runtime_unavailable', 'recorded', 'error')),
  -- Where the compared output came from; never 'runtime' while execution is disabled.
  output_source   text check (output_source in ('reviewed_fixture', 'runtime')),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 64),
  created_at      timestamptz not null default now(),
  unique (owner_key_hash, idempotency_key)
);
create index mission_attempts_owner_idx on mission_attempts (owner_key_hash, mission_id, created_at);

alter table xp_events drop constraint xp_events_event_type_check;
alter table xp_events add constraint xp_events_event_type_check check (event_type in (
  'explanation_assessed', 'strong_explanation', 'improved_after_revision',
  'prediction_correct', 'bug_diagnosed'));
alter table xp_events alter column source_session drop not null;
alter table xp_events add column source_mission_attempt uuid
  references mission_attempts (id) on delete cascade;
alter table xp_events add constraint xp_events_one_source
  check (num_nonnulls(source_session, source_mission_attempt) = 1);
