# API Contracts and Error Semantics

This document describes domain behavior, not a forced route naming convention. Concrete API routes can follow Next.js conventions if these contract rules remain intact.

## 1. Common contract
- JSON unless a provider requires a distinct upload protocol.
- Validate all network payloads at runtime; static TypeScript types do not validate requests.
- Use authenticated identity from server session, not a caller-supplied owner ID.
- Use idempotency for job creation, room submissions, XP awards, and repeatable writes.
- Add correlation IDs, input/output limits, timeouts and rate limits.
- Return safe error envelopes, e.g. `{ error: { code, message, retryable, correlationId, details? } }`. Do not expose stack traces, secrets, system prompts or another user's data.

## 2. Auth and profile
Actions include register/login/logout/recovery, own-profile read/update, privacy settings, data export and deletion. Rate-limit credential/recovery attempts. Public profile responses must be allowlisted, never a raw row dump.

## 3. Learning
Actions include list/read published lessons, create/resume owned session, submit attempt, request tutor follow-up, request validated assessment, revise attempt, read own history/progress.

The server loads the authoritative lesson and rubric; client-supplied weights/reference answers are ignored. Assessment status is `complete`, `needs_clarification`, or `error`. A complete response includes validated criterion judgments/evidence, deterministic total, rubric version, feedback, one next-step hint, and provenance. No total score is returned for failed/insufficient assessment.

## 4. Code intelligence
Actions include create/update/delete owned project/files; request review using code/revision plus declared language/framework/version/goal/categories; poll/subcribe to review status; fetch findings; request a proposed diff; request execution only for enabled supported adapters; cancel job; retrieve sanitized output.

Server chooses available capabilities and never trusts a client assertion that a tool ran. Input limits, path normalization, ownership, budget and sandbox policy are server enforced.

## 5. Voice
Create/close voice session, request STT, send transcript to tutor, request TTS, cancel session. Raw audio is temporary unless a separately documented retention feature exists. Text alternative remains available.

## 6. Multiplayer/realtime
Create/join by expiring invite, leave, submit turn/challenge, retrieve state, report participant, close room. Server checks membership and turn/version on every write. Realtime messages notify clients but cannot independently award points or change privileged state.

## 7. Community
Create/edit/delete own post/comment, list/search visible approved content, report content/user, block user, retrieve appropriate report state, moderate with authorized role. Enforce content length and rate limits; public responses exclude email, private history, moderator notes, and restricted fields.

## 8. Leaderboard/achievements
Read current period/ranking using public opt-in summary. XP/achievement events are server-generated from validated events. Client cannot submit an arbitrary XP delta or rank. Duplicate events are rejected or reconciled idempotently.

## 9. Minimum error taxonomy
`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `INVALID_MODEL_OUTPUT`, `ASSESSMENT_INSUFFICIENT_EVIDENCE`, `UNSUPPORTED_TOOLCHAIN`, `EXECUTION_REJECTED`, `EXECUTION_TIMEOUT`, `ROOM_EXPIRED`, `ROOM_VERSION_CONFLICT`, `CONTENT_RESTRICTED`, `INTERNAL_ERROR`.

Map errors to user-friendly Indonesian. Do not expose raw provider messages. Retry only safe operations; use idempotency for writes.

## 10. Implemented contracts (2026-10-13)
This section describes only what exists in code. Everything above remains the target design. The runtime schemas are the source of truth; this table summarizes them.

| Contract | Schema (source of truth) | Notes |
|---|---|---|
| Error envelope | `errorEnvelopeSchema` in `src/shared/api/errors.ts` | `{ error: { code, message, retryable, correlationId, details? } }`, strict. `code` is one of the 17 codes in §9. The `x-correlation-id` header carries the same ID. |
| Error details | `safeDetailsSchema` | Allowlisted keys only: `integration`, `field`, `fields[]` (max 20 `{ path, issue }`), `retryAfterSeconds`. Anything else is dropped before sending. |
| Validation failure | `VALIDATION_ERROR` + `details.fields` | `issue` ∈ `required`, `invalid_type`, `too_short`, `too_long`, `too_small`, `too_large`, `invalid_format`, `invalid_value`, `unknown_field`, `invalid`. Paths are dot-separated; `(body)` means the whole body. Input values are never echoed. |
| Request bodies | `readJsonBody` + `parseInput` in `src/server/http/request.ts` | `application/json` only; 16 KiB default limit enforced while streaming; invalid JSON or UTF-8 → `VALIDATION_ERROR`. Request schemas use `z.strictObject` so unknown fields (e.g. a client-sent `score` or `role`) are rejected. |
| Identifiers | `uuidSchema` / `sessionIdSchema`, `slugSchema` in `src/shared/schemas/primitives.ts` | Database IDs are UUIDs; content IDs are lower-kebab slugs ≤ 64 chars. |
| Timestamps | `timestampSchema` | ISO 8601 UTC with `Z` (no offsets). |
| Free text | `boundedText({ max })`, `TEXT_LIMITS` | NFC-normalized, trimmed, no control characters (tab/newline allowed), length-bounded. Learner explanation limit: 2,000. |
| Pagination | `paginationQuerySchema`, `pageSchema(item)` in `src/shared/schemas/pagination.ts` | Opaque `cursor`, `limit` 1–50 (default 20); responses `{ items, nextCursor: string \| null }`. Not used by any endpoint yet. |
| Success responses | `contractResponse(schema, body, …)` in `src/server/http/respond.ts` | Body is validated against its strict response schema before sending; a mismatch is `INTERNAL_ERROR`, so internal fields cannot leak. |

### Endpoints that exist

| Method and path | Response schema | Behavior |
|---|---|---|
| `GET /api/status` | `statusResponseSchema` (`src/shared/api/status.ts`) | Per-integration `{ available: true }` or `{ available: false, reason: not_configured \| not_implemented \| unreachable }`. Database is checked live. No configuration values. |
| `GET /api/health/database` | `databaseHealthResponseSchema` | `200 { status: "ok", latencyMs }` or `503 { status: "unavailable", reason: not_configured \| unreachable }`. |

| `GET /api/lessons` | `lessonListResponseSchema` (`src/shared/api/learning.ts`) | Published lessons; unreviewed drafts only with `ALLOW_DRAFT_CONTENT=true` outside production (flagged `draft: true`). |
| `GET /api/lessons/:id` | `lessonDetailResponseSchema` | Concept, analogy, example and task. Never the reference answer, accepted evidence, misconceptions, hints or review notes. Invalid slug → 400, unavailable → 404. |
| `POST /api/sessions` | `createSessionRequestSchema` → `sessionResponseSchema` (201) | Starts a tutor session pinned to the lesson version/content hash/rubric version; sets the httpOnly `cf_guest` cookie (only its SHA-256 is stored). Same-origin only; 20 creations/min per IP per instance. |
| `GET /api/sessions/:id` | `sessionResponseSchema` | Owner only (guest cookie); anyone else gets 404. |
| `POST /api/sessions/:id/actions` | `sessionActionRequestSchema` → `sessionResponseSchema` | `view_concept`, `begin`, `revise`, `complete` with `expectedVersion`; `submit` with `answer` and `idempotencyKey`. Owner only; same-origin only; stale version → 409; repeated key returns the stored result. |

Session view: state, attempts (answer + outcome: `evaluating` / `assessed` with display total, criteria labels and levels, one hint / `needs_clarification` with one question / `error` with code and retry flag), attempts left, `mockMode`, rubric-level comparison, and the reference explanation only after completion. Evaluator rationales, misconception ids, model and prompt names are never returned. Sessions currently live in server memory (lost on restart, not shared across instances) until BLOCK 29.

Code intelligence: `GET /api/code/capabilities` (derived support matrix; every language is `AI_REVIEW_ONLY` today) and `POST /api/code/review` (AI-only review: findings validated against the submitted code, provenance `ai` / `potential_issue` set by the server, deterministic `code_quality` indicators per dimension with no overall grade; 20 KiB / 500 lines max; code never logged; 503 without a provider). No code is ever executed. Accounts, profile, history, progress, rewards and leaderboard endpoints are documented in `docs/implementation/AUTH.md` and `REWARDS.md`. No voice, realtime or community endpoints exist. No screens use these endpoints yet (UI waits for Stitch, D-009).
