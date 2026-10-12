# Test Strategy

## 1. Principles
- Tests provide evidence; they are not decoration for a report.
- A successful build is not proof of end-to-end behavior.
- AI is non-deterministic: use reviewed fixtures, structured expectations/tolerances and regression comparison, not exact-wording-only tests.
- Test failure and permission paths as well as success paths.
- Mark checks not run as `NOT VERIFIED`.

## 2. Unit tests
Rubric weight validation and scoring; allowed levels/missing criteria; assessment status transitions; XP/achievement eligibility and idempotency; lesson prerequisites/progress; language registry selection; severity/provenance mapping; input limits/path normalization; room transitions/version/timeouts/idempotency; leaderboard sorting/privacy filters; deletion/retention logic.

## 3. Schema/contract tests
Parse each agent output; reject unknown criteria, invalid ratings, missing fields, invalid line locations, unsupported severities and inconsistent score totals. Validate API input limits/common error shape, provider response adapters, schema version changes and history compatibility.

## 4. Integration tests
Auth/profile ownership; RLS for sessions/projects/history/rooms; lesson submission → assessment → score → persistence; completion → progress → achievement → leaderboard projection; code review → findings/provenance → revision comparison; execution statuses/cleanup; community report/moderation; room join/concurrent turns/challenge/reward; voice fallback; account deletion.

## 5. Critical browser E2E flows
1. Visitor starts a lesson.
2. Learner explains, receives clarification, completes assessment, revises and sees result.
3. Provider failure shows safe error and no fake score.
4. Signed-in user reloads history; another user cannot access it.
5. Mini IDE returns labeled AI/tool findings and handles unsupported toolchain.
6. Supported runner reports actual output; timeout is not mislabeled as program result.
7. Profile privacy and leaderboard opt-in work.
8. Duplicate request cannot award duplicate XP.
9. Reported community content reaches moderator; reported user cannot inspect restricted report.
10. Unauthorized user cannot enter private room; reconnect/duplicate submission behave correctly.
11. Voice permission denial/outage keeps text learning working.
12. Account deletion follows documented policy.

## 6. AI benchmark
Maintain reviewed, versioned fixtures for correct and concise answers, paraphrase, partial understanding, misconceptions, contradictory/wrong/off-topic/ambiguous/empty answers, age-appropriate language/spelling errors, code terms in Indonesian, prompt injection in text/comments, provider timeout/rate limit/malformed output/refusal/truncation.

Label expected criterion outcomes before comparing models. Track per-criterion agreement, false-pass rate, false-fail rate, evidence validity, score arithmetic, invalid schema rate, fallback rate, latency and cost. Review disagreements manually and state dataset limitations. Do not claim human-level accuracy from a small set.

## 7. Code tool tests
For every declared capability test valid/invalid/boundary snippets, timeout, large output, missing dependency, unsupported version and malicious input. Record actual tool version. Only tested tool/version combinations are marked tool-verified.

## 8. Accessibility/responsive
Keyboard-only flow, visible focus, screen-reader labels/live status, contrast/non-color indicators, zoom/reflow/small widths, touch without hover, reduced motion and editor fallback. Automated checks are signals, not complete proof.

## 9. Security/abuse
Cross-user access, role escalation, prompt injection/tool-use, XSS, request validation, rate-limit pressure, sandbox isolation/resource use, unauthorized realtime channel, replayed rewards, archive traversal/oversized uploads, privacy leaks through profile/leaderboard/logs.

## 10. Performance/operations
Landing/lesson load, lazy editor size, AI/voice/runner timeout, history/leaderboard query performance, realtime reconnect/concurrency, deployment smoke test, migration rollback/restore where feasible.

## 11. Evidence format
For every check record test name, environment, time, command/repro steps, actual result, supporting artifact and limitations. Never say “all tests pass” without knowing which checks ran.

## 12. Current implementation (2026-10-12)
What actually exists today. Everything else in this document is the target strategy and is not yet implemented.

| Layer | Tool (pinned) | Location / command | Status |
|---|---|---|---|
| Formatting | Prettier 3.9.10 | `npm run format:check` (code/config only; Markdown, `docs/`, `.stitch/` excluded) | Configured |
| Lint | ESLint 9.39.5 + `eslint-config-next` 16.4.0 | `npm run lint` | Configured |
| Types | TypeScript 5.9.3 | `npm run typecheck` (`next typegen` then `tsc --noEmit`) | Configured |
| Unit | Vitest 5.0.3 | `tests/unit/**/*.test.ts`, `npm run test` | 102 tests: shared schemas (IDs, timestamps, text bounds, pagination, strict unknown fields, unsupported states), request parsing (content type, malformed/oversized/invalid-UTF-8 bodies), safe serialization and response contracts, toolchain smoke, environment validation, error envelope, log redaction, integration status, `/api/status`, migration loading/ordering/naming, database configuration and TLS rule, database health (not configured / unreachable). No product-feature tests yet |
| Integration | Vitest 5.0.3 + PostgreSQL 18.6 | `tests/integration/**/*.integration.test.ts`, `npm run test:integration` (needs `TEST_DATABASE_URL`) | 9 tests against a throwaway database: ordered idempotent migrate, failure rollback, migration/bookkeeping atomicity, edited and out-of-order refusal, advisory-lock serialization, committed migrations apply, live health check |
| Build | Next.js 16.4.0 | `npm run build` | Configured |
| CI | GitHub Actions | `.github/workflows/ci.yml`: `checks` job (format, lint, types, unit, build) and `database-integration` job (PostgreSQL 18.6 service; integration tests, `db:migrate`, `db:status`) | Not yet run: no GitHub remote exists |
| E2E, accessibility, AI benchmark, security | — | — | Not started |

Each gate was shown to fail on bad input (failing test, unformatted file, lint violation, type error) before being trusted. The redaction and integration-group tests, the migration advisory lock and the migration/bookkeeping transaction were also shown to fail when those safeguards were removed (temporary mutation).
