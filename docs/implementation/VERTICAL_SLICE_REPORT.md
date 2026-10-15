# First-Lesson Vertical Slice Report (BLOCK 26)

- Reviewed: 2026-10-13 (WIB), at commit `3a0cd82`.
- Scope: landing → choose lesson → concept → explain → assess → revise → reassess → summary.
- Environment: Node 24.18.1 locally; dev mock AI (`AI_MOCK_MODE=true`) and draft lessons (`ALLOW_DRAFT_CONTENT=true`). No real Gemini key, no UI.

**Overall: NOT VERIFIED as a learner-facing slice.**
- The domain logic and HTTP API pass their tests.
- The browser flow does not exist yet: Stitch exports are missing (D-009).
- Live AI has not been run (no key).
- The lessons are unreviewed drafts, so none are published.

## Acceptance criteria

| Criterion (docs/13) | Status | Evidence |
|---|---|---|
| Published lessons have objective, concept, example, rubric version, accepted evidence and misconceptions | **PASS (schema)** / lessons **draft** | `lessonVersionSchema`; `tests/unit/lesson-content.test.ts`. All three lessons await participant review (`LESSON_REVIEW.md`) |
| Learner can start / complete / resume | **PASS (API)** | `tests/unit/api-learning.test.ts`, `session-engine.test.ts`; live `next dev` curl smoke (BLOCK 23–25 commit) |
| Submission uses the authoritative lesson/rubric version | **PASS** | Session pins id, version, content hash and rubric version; `resolve` rejects a hash mismatch |
| Clarification targeted and bounded | **PASS** | Contract: exactly one question about a known criterion; engine allows 1 per cycle and does not loop (tests) |
| Assessment schema parsed and validated | **PASS** | `ai-contract.test.ts` (26 tests) |
| Evidence maps to the learner response | **PASS** | Quotes must be in the answer; spans checked; inferences never earn credit |
| Score deterministic and unit-tested | **PASS** | `scoring.test.ts` (28 tests, mutation-checked) |
| Provider/schema errors never return a fake score | **PASS** | Gateway and engine tests; API test: provider unavailable → `recoverable_error`, no `total` |
| Feedback separates strengths, gaps, next action | **PARTIAL** | API returns criteria with levels and one hint. Presenting strengths vs gaps is a UI task (blocked) |
| Learner can revise and reassess | **PASS (API)** | Engine + API tests |
| Persistent result tracks rubric/scoring version | **NOT VERIFIED** | Score objects carry versions; persistence arrives in BLOCK 29 (sessions are in memory) |
| Empty / too-long / duplicate submit / stale state | **PASS** | Validation before any model call; idempotency key; version conflict (tests) |
| AI timeout / malformed output | **PASS (mock)** | Gateway tests with scripted mock; real Gemini behaviour **NOT VERIFIED** |
| Off-topic / ambiguous / incorrect / short-correct answers judged sensibly | **NOT VERIFIED** | Needs the live benchmark (`npm run benchmark` reports NOT_RUN without a key) |
| Refresh / recovery | **PARTIAL** | `GET /api/sessions/:id` restores state for the owner; lost on server restart until BLOCK 29 |
| Mock never shown as real AI | **PASS** | `mockMode` flag, `[Mode uji]` prefix, `mode: "mock"` status; mock refused in production by config (tests) |
| Navigation, responsive layout, keyboard, contrast, reduced motion | **BLOCKED** | No screens (D-009) |
| Design matches approved Stitch references | **BLOCKED** | No exports (BLOCK 19 gate FAIL) |
| End-to-end browser test landing → summary | **BLOCKED** | No UI |

## Commands run for this review
- `npm run check`: exit 0, 279 unit tests (commit `3a0cd82`).
- `npm run test:integration`: exit 0, 9 tests (BLOCK 08/09; unchanged since).
- Live `next dev` with mock AI and draft lessons: curl requests to `/api/status`, `/api/lessons`, `POST /api/sessions` and `/actions`, plus no-cookie and cross-origin probes (all as expected).

## Defects found and fixed during this slice
- Invalid UTF-8 request body produced a 500 instead of a 400 (fixed in BLOCK 09, regression test).
- The cached tutor engine captured the configuration of the first request, so adding an AI key later would have had no effect until restart (fixed in the API commit; evaluation now reads the current config).

## Is it safe to start persistence (Phase 4)?
**Yes, for the server side.** Contracts, scoring and the state machine are stable and covered. The UI and live-AI gaps don't change what gets stored. Persistence must keep the "no score unless assessed" rule as a database constraint.
