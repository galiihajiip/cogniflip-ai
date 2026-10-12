# Data Model and Persistence Contract

This is the logical model, not final SQL. Verify relationships, indices, RLS/authorization, deletion policy, migrations and transactional requirements before implementation.

## 1. Identity and preferences

### `profiles`
`user_id` (auth FK/PK), unique pseudonymous `handle`, optional non-identifying `display_name`, controlled `avatar_key`, `locale`, accessibility preferences, `leaderboard_opt_in`, `community_visibility`, created/updated timestamps. Public DTOs must use an allowlist. Roles/permissions are server-controlled, never client-authored.

### `account_preferences`
`user_id`, validated preference key/value, updated timestamp. Preferences are never an authorization source. Consent/guardian records should be collected only if required for the deployment; keep them minimal with purpose, policy version, time and withdrawal path.

## 2. Curriculum and rubrics

- `lessons`: ID/slug/title/summary/locale/grade band/topic/difficulty/objective/content version/status/timestamps.
- `lesson_rubrics`: lesson ID, version, status, creation timestamp. Used versions are immutable; corrections create new versions.
- `rubric_criteria`: rubric ID, criterion key, label, weight, allowed scoring levels, evidence expectations, misconception tags. Published weights must sum to declared total.
- `lesson_examples` and `misconception_catalog`: reviewed content with provenance/source and review status.

### Implementation refinement (2026-10-13, BLOCK 11)
Lesson and rubric *content* lives in the repository as reviewed, typed modules (`src/server/learning/`), validated by zod at load and in tests, rather than in database tables. Reason: content changes go through Git review, and the published versions are locked by content hash in `src/server/learning/content/lessons.lock.json` (published or archived versions can never change or disappear). Database rows that refer to content (sessions, attempts, assessments) store `lesson_id`, `lesson_version` and `lesson_content_hash` (and the rubric id/version), so historical attempts always resolve to the exact archived content. Status values: `draft`, `published` (at most one per lesson), `archived`.

## 3. Learning history

- `learning_sessions`: owner (nullable only for explicitly ephemeral guest sessions), lesson/version, status, start/completion, privacy mode.
- `learning_attempts`: session, attempt number, response, time, rubric version, assessment status.
- `tutor_turns`: session, sequence, speaker, content/type, timestamp, optional provider trace ID. Persist only what is needed; do not store model private chain-of-thought.
- `assessment_results`: attempt, status, total score, scoring version, provider/model, timestamp. Score is null for failed/insufficient assessments.
- `criterion_assessments`: result, criterion, rating level, earned/maximum points, evidence excerpt/span, reason, confidence/uncertainty label, validation state. Evidence must map to actual answer content.

## 4. Code projects and reviews

- `code_projects`: owner, title, private-by-default visibility, language/framework hint, timestamps, soft-delete state.
- `code_project_files`: project/path/content or protected storage reference/hash/size/timestamps. Normalize paths and reject traversal.
- `code_revisions`: project, revision number, content snapshot/reference, actor, timestamp, summary; apply retention to avoid unbounded duplication.
- `code_reviews`: project/revision/session references, declared language/framework versions, status, provider/model, capability snapshot, timestamps.
- `code_findings`: review, category/severity/title/explanation/file/line/column/provenance/evidence/confidence/limitations/resolution state.
- `execution_jobs`: owner/review/provider job ID/status/toolchain capability/time/memory/output limits/exit code/sanitized output/timestamps/expiry. Never store secrets or arbitrary environment variables.

## 5. Community and multiplayer

- `community_posts`, `community_comments`: owner, content, visibility/status, moderation state, timestamps/edit/delete metadata.
- `content_reports`, `moderation_actions`, `user_blocks`: target/report/reason/state/reviewer/action/timestamps, restricted audit access.
- `room_sessions`, `room_members`, `room_events`, `challenge_submissions`: authoritative room state, membership, versioned events, submissions, validated result and idempotency key. Broadcast is not a trusted score ledger.
- `voice_sessions`: minimal user/session/provider/timestamps/consent state. No raw audio by default.

## 6. Gamification and AI traces

- `xp_ledger`: immutable event rows containing user, source event, delta, unique idempotency key, rule version, timestamp.
- `achievements`, `user_achievements`: versioned eligibility rule and award event.
- `leaderboard_snapshots` (optional projection): period/rank/points/pseudonymous handle/time; recomputable from trusted ledger.
- `agent_runs`: trace ID, role, schema version, provider/model, duration, outcome, usage/cost metadata and sanitized failure category. No hidden chain-of-thought.
- `provider_usage_events`: provider/operation/latency/outcome/usage/timestamp, excluding content unless strictly required and disclosed.

## 7. Authorization, consistency and retention

- Private data is readable/writable only by owner or explicitly authorized service roles.
- Community visibility differs from profile visibility and project visibility.
- Public leaderboard exposes only opted-in pseudonymous fields.
- Room access requires valid membership/state.
- Moderator access is scoped and audited.
- Deletion handles profile, projects/files, sessions, social content, storage and derived projections, subject to documented retention exceptions.
- Add owner/time indexes and unique constraints for idempotency.
- Use transactions or reliable idempotent events for assessment/history/rewards/leaderboard consistency.
