-- 20261013002118_create_tutor_sessions_and_attempts.sql
-- Purpose: persist Reverse Tutor sessions and every attempt (BLOCK 29,
-- docs/06 §3). A numeric score can exist only on an assessed attempt.
-- Rollback (manual, reviewed, after a backup):
--   drop table tutor_attempts; drop table tutor_sessions;

create table tutor_sessions (
  id                      uuid primary key,
  -- Exactly one owner: a signed-in user (deleted with the account) or a
  -- guest identified only by the SHA-256 of a random cookie key.
  owner_user_id           uuid references users (id) on delete cascade,
  owner_guest_hash        text check (owner_guest_hash ~ '^[0-9a-f]{64}$'),
  owner_key_hash          text not null check (owner_key_hash ~ '^[0-9a-f]{64}$'),
  lesson_id               text not null,
  lesson_version          integer not null check (lesson_version >= 1),
  lesson_content_hash     text not null check (lesson_content_hash ~ '^[0-9a-f]{64}$'),
  rubric_id               text not null,
  rubric_version          integer not null check (rubric_version >= 1),
  state                   text not null check (state in (
                            'lesson_chosen', 'concept_viewed', 'awaiting_explanation',
                            'evaluating', 'needs_clarification', 'assessed',
                            'awaiting_revision', 'reassessing', 'completed',
                            'recoverable_error')),
  pending                 text check (pending in ('initial', 'clarification', 'revision')),
  clarifications_in_cycle integer not null default 0 check (clarifications_in_cycle between 0 and 5),
  ai_calls                integer not null default 0 check (ai_calls >= 0),
  version                 integer not null check (version >= 1),
  created_at              timestamptz not null,
  updated_at              timestamptz not null,
  check (num_nonnulls(owner_user_id, owner_guest_hash) = 1)
);

create index tutor_sessions_user_idx on tutor_sessions (owner_user_id, updated_at desc);
create index tutor_sessions_guest_idx on tutor_sessions (owner_guest_hash);
create index tutor_sessions_updated_idx on tutor_sessions (updated_at);

create table tutor_attempts (
  session_id      uuid not null references tutor_sessions (id) on delete cascade,
  number          integer not null check (number >= 1),
  kind            text not null check (kind in ('initial', 'clarification', 'revision')),
  answer          text not null check (char_length(answer) between 1 and 2000),
  evaluated_text  text not null check (char_length(evaluated_text) between 1 and 2000),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 64),
  submitted_at    timestamptz not null,
  -- Null while evaluating.
  result_status   text check (result_status in ('assessed', 'needs_clarification', 'error')),
  result          jsonb,
  score_total     numeric(5, 1),
  scoring_version text,
  primary key (session_id, number),
  unique (session_id, idempotency_key),
  check ((result_status is null) = (result is null)),
  -- A score exists if and only if the attempt was assessed.
  check ((result_status = 'assessed') = (score_total is not null)),
  check ((score_total is null) = (scoring_version is null)),
  check (score_total is null or score_total between 0 and 100)
);
