# Cross-Feature Integration Matrix (BLOCK 52)

Environment: PostgreSQL 18.6 (Docker), real route handlers, **labelled development mock AI** (`AI_MOCK_MODE`). Mock results prove module wiring, **not** live AI quality.

| Flow | Evidence | Status |
|---|---|---|
| Register → profile opt-in | `cross-feature.integration.test.ts` | PASS |
| Complete lesson → assessed → history → progress | same | PASS (mock AI) |
| Duplicate submit (same key) → no change | same; `session-engine.test.ts` | PASS |
| Eligible XP awarded exactly once → leaderboard shows opted-in learner | same; `rewards.integration.test.ts` | PASS |
| Code review (AI-only) | same; `code-review.test.ts` | PASS (mock AI) |
| Mission predict → XP once per mission | same; `missions.integration.test.ts` | PASS |
| Logout → old cookie loses access → login → same history/XP | same | PASS |
| Second learner cannot read or act on another's session, history or XP | same; `sessions.integration.test.ts`, `history.integration.test.ts` | PASS |
| AI route without a provider → 503, no fabricated result | same; `ai-gateway.test.ts` | PASS |
| Protected routes require sign-in (rewards, history, profile) | same; `profile.integration.test.ts` | PASS |
| Account deletion cascades sessions, profile, XP | `sessions.integration.test.ts`, `profile.integration.test.ts` | PASS |
| Live Gemini evaluation and review | needs a key | **NOT VERIFIED** |
| Community cannot access lesson history | community does not exist (OFF) | N/A |
| Multiplayer room isolation | multiplayer does not exist (BLOCKED) | N/A |
| Code runner cannot bypass auth or quotas | execution disabled; `/api/code/run` → 422 | PASS (disabled) |
| Browser flows (desktop/mobile) | no UI (D-009) | **BLOCKED** |
| Deployed environment | not deployed | **NOT VERIFIED** |

Defects found during Phase 4–7 work and fixed with regression tests:
1. XP idempotency key included the rule version (would double-award on a version bump).
2. Tutor engine captured the first request's configuration.
3. Invalid UTF-8 request body produced a 500.
4. Mission answer reveal would have shown the English reviewer text instead of the Indonesian explanation.
