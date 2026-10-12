# Acceptance Criteria and Release Gates

Use `PASS`, `FAIL`, or `NOT VERIFIED` with evidence/test IDs. A rendered page alone does not make a feature complete.

## Global
- [ ] Navigation works by mouse, touch, keyboard.
- [ ] Indonesian copy is appropriate for elementary learners.
- [ ] Primary actions have real behavior and clear results.
- [ ] Loading/empty/unauthorized/unavailable/error/timeout/retry states exist where relevant.
- [ ] Mobile/tablet/laptop/desktop layouts are checked.
- [ ] Contrast, focus, reduced motion, labels, error announcements are checked.
- [ ] Build and deployed smoke test pass.

## Learning path
- [ ] Published lessons have objective, concept card, example, rubric version, accepted evidence and misconception catalogue.
- [ ] Learner can start/complete/resume as designed.
- [ ] Locked prerequisites have clear explanation.
- [ ] Catalog validation (BLOCK 11, automated): unique `id@version`; at most one published version per lesson; published lessons are reviewed; prerequisites and rubric references exist; no prerequisite cycles; learning paths list lessons after their prerequisites; locked (published/archived) versions cannot be edited or removed; archived versions stay resolvable.

## Reverse Tutor/scoring
- [ ] Submission uses authoritative lesson/rubric version.
- [ ] Clarification is targeted and bounded.
- [ ] Assessment schema is parsed and validated.
- [ ] Evidence maps to the learner's response or is marked missing.
- [ ] Score is deterministic and unit-tested.
- [ ] Provider/schema errors never return fake score.
- [ ] Feedback separates strengths, gaps, next action.
- [ ] Learner can revise and reassess.
- [ ] Persistent result tracks rubric/scoring version.

### Implemented scoring behavior (BLOCK 13, automated: `tests/unit/scoring.test.ts`)
- Rubric schema: `totalPoints` is 100; criterion weights are whole numbers ≥ 1 and must sum to 100; criterion keys unique; a rubric cannot be `published` unless `review.status` is `reviewed`.
- Rule `scoring-v1`: earned = weight × {belum_terlihat 0, sebagian ½, tepat 1}; `total` is exact (to 0.5); `displayTotal` is rounded half up. The score records rubric id/version and scoring version, plus a per-criterion breakdown. The score kind is `learning_understanding`, kept separate from any code-quality rating.
- Outcomes: `assessed` (the only one with a score), `needs_clarification`, `invalid_assessment`, `provider_error`. The last three carry no score field.
- `invalid_assessment` when any criterion is missing, unknown, rated twice, has an invalid level, or is rated `sebagian`/`tepat` without an evidence excerpt (missing evidence is never credited).
- Same ratings always give the same score, independent of rating order.

### Implemented session engine behavior (BLOCK 18, automated: `tests/unit/session-engine.test.ts`)
- States: lesson_chosen → concept_viewed → awaiting_explanation → evaluating → needs_clarification | assessed | recoverable_error; assessed → awaiting_revision → reassessing → assessed; assessed/awaiting_revision → completed. Any other transition is `CONFLICT`.
- The session pins lesson id, version, content hash and rubric version at start; evaluation always uses those.
- Each submission is a separate attempt (initial, clarification, revision); earlier answers are never overwritten.
- Duplicate submit: the same idempotency key returns the stored result without re-evaluating (or `CONFLICT` while in progress); a stale `expectedVersion` is `CONFLICT`.
- At most 1 clarification per answer cycle (a clarification reply is judged together with the answer it clarifies). A second "unclear" result asks for a revision instead of looping. After 3 counted attempts without an assessment, the session completes without a score.
- Provider failure → `recoverable_error` with the error code and no score; it does not use up one of the learner's attempts; retry is allowed until the per-session AI call budget (`AI_MAX_CALLS_PER_SESSION`) is reached (`RATE_LIMITED`).
- The learner view excludes rationales, misconception ids, model and prompt names; it flags mock mode; the full reference explanation appears only after completion; the attempt comparison reports rubric-level changes only.

## Mini IDE/universal code input
- [ ] Editor loads lazily and works in target browsers.
- [ ] Code is editable, copyable and reviewable.
- [ ] Custom language label allows generic review for any language text.
- [ ] Registry distinguishes editor/parser/static/compiler/runtime/test/framework capabilities.
- [ ] Unsupported toolchain does not block generic review and is disclosed.
- [ ] Findings include evidence/provenance and valid locations where known.
- [ ] Patches are diffs and never silently overwrite code.
- [ ] Saved project/review is private to its owner by default.

## Sandbox
- [ ] Code executes only through isolated infrastructure.
- [ ] CPU, memory, time, output, files, network and concurrency limits enforced.
- [ ] Job has no app secret/database access.
- [ ] Timeout/provider-unavailable/unsupported differ from compile/runtime failures.
- [ ] Cleanup/expiry tested.
- [ ] If isolation is unverifiable, execution is disabled.

## Voice
- [ ] Microphone permission is explicit/visible.
- [ ] User can cancel/end and switch to text.
- [ ] Provider errors recover safely.
- [ ] Raw audio not retained by default.
- [ ] Peer voice stays disabled until its safety gate passes.

## Auth/profile/history
- [ ] Registration/login/logout/recovery works for configured provider.
- [ ] Cross-user access tested with at least two accounts.
- [ ] Public fields are allowlisted and private fields stay private.
- [ ] Privacy/leaderboard settings work.
- [ ] Data export/deletion and retention behavior is documented/tested to implemented scope.
- [ ] Attempts/history persist across sessions for authenticated user.

## Gamification
- [ ] Progress derives from authoritative data.
- [ ] Duplicate event cannot award XP/achievement twice.
- [ ] Leaderboard is server-calculated, privacy-aware and governed by clear rules.

## Community/multiplayer
- [ ] Content safe-rendered and rate-limited.
- [ ] Report/moderation action/audit works.
- [ ] No default child DMs.
- [ ] Room membership and realtime access are authorized.
- [ ] Concurrent/replayed actions do not corrupt state or duplicate rewards.
- [ ] Leave/report/mute controls work where applicable.
- [ ] Public features remain disabled if their safety gates fail.

## Multi-agent
- [ ] Each agent has documented role/schema/budget/failure state.
- [ ] Orchestrator has maximum calls/turns/time/cost and cancellation.
- [ ] Agent output cannot change score/permission directly.
- [ ] Prompt-injection fixtures cannot grant privileged tool access.
- [ ] Logs preserve trace/outcome without hidden chain-of-thought.

## M-ONE eligibility
- [ ] AI Agent reference docs are present and authentic to the project.
- [ ] GitHub is public and inspectable.
- [ ] Curated prompt journal has no more than five genuine entries.
- [ ] Raw prompt log represents actual start-to-end interactions.
- [ ] Theme/subtheme fit is evident.
- [ ] Website is deployed and accessible to judges.
- [ ] Repository/code/design/agent docs satisfy start-time/originality rules.
- [ ] No prohibited reuse, plagiarism, private repository, prompt manipulation, timestamp falsification or unapproved late submission.
- [ ] Required links/materials are checked before submission.
