# Product Scope and Feature Catalogue

This is the complete intended product inventory. No brainstormed feature is silently removed because it requires work. The roadmap sequences the work; each module must be implemented and verified honestly.

## A. Landing and navigation
- Simple Indonesian product explanation and clear routes to learning, Mini IDE, missions, profile/login, progress, and community as permitted.
- Guest exploration where allowed, with clear note that permanent history requires an account.
- Loading, empty, unavailable, error, retry, and not-found states.
- Acceptance: a first-time elementary learner finds a lesson without adult explanation; no primary CTA is inert.

## B. Authentication and profiles
- Registration, login, logout, session renewal, recovery, account deletion, and privacy controls.
- Pseudonymous handle and preset avatar; real name is not required for public display.
- Preferences, accessibility settings, achievements, progress, visibility choices.
- Server-controlled roles for normal users, moderators, and administrators.
- Guest-to-account transition must not expose another user's session.
- Acceptance: data belongs to the correct account; cross-user access is denied; deletion follows documented policy.

## C. Learning paths and lessons
- Beginner-to-advanced curated paths with objective, short explanation, example, prerequisite, difficulty, and completion state.
- Initial concepts: sequence/instructions, events/input/output, loops, conditions, simple variables, code reading, debugging.
- Lesson data separates objective, accepted evidence, rubric, misconceptions, reference explanation, hints, examples, and challenge.
- Content and rubric are versioned; published versions used in scores remain immutable.
- Acceptance: lesson state and prerequisites are deterministic and testable.

## D. AI Reverse Tutor
- Clearly identified AI character; explain-before-answer design.
- One targeted clarification at a time and bounded turns/time/token budget.
- Topic-specific rubric, misconception diagnosis, evidence excerpt, score explanation, one hint, revision and reassessment.
- Distinguish incorrect, incomplete, contradictory, and insufficient evidence.
- No fake scores on provider failure. Optional confidence reflection is not a psychological diagnosis.
- Acceptance: valid score only after successful assessment; feedback is grounded in the learner's response and rubric.

## E. Scoring and assessment
- Runtime-validated criterion ratings; final score calculated by deterministic code.
- Store rubric/scoring/schema version and model/provider metadata without unnecessary sensitive data.
- Learning-understanding score and code-quality score are separate.
- Benchmark covers paraphrases, short-but-correct, partial, misconception, irrelevant, contradictory, and prompt-injection examples.
- Acceptance: weights sum correctly; invalid/missing criteria fail closed; score calculation is unit-tested.

## F. Mini IDE and projects
- Lazy-loaded browser editor; proposed baseline is Monaco, pending mobile/accessibility/performance validation.
- Single-file quick mode and multi-file project mode.
- Syntax highlighting where available, language selector, indentation, undo/redo, line numbers, copy/paste, starter snippets, keyboard shortcuts.
- Context includes goal, language, framework/library/version, file names, manifests, and relevant errors.
- Authenticated projects private by default; export/download where safe; file upload is size/type limited and untrusted.
- Acceptance: editor works in target browsers; heavy bundle is lazy-loaded; mobile experience is usable or honestly limited.

## G. Universal code intelligence and clean-code review
- Generic AI review accepts arbitrary code text; distinguish unknown syntax from verified errors.
- Categories: parser/syntax, types/compiler, runtime/test, logic, edge cases, code quality, maintainability, performance, security, framework/API usage.
- Findings include severity, file/line/column when known, evidence/provenance, rationale, uncertainty/limitations, and next action.
- Review naming, readability, duplication, cohesion, complexity, error handling, style consistency, over-abstraction where evidence exists.
- Hints first; generated patches shown as diff and require user acceptance.
- Language/tool capability registry tracks language/version/parser/linter/compiler/runtime/test runner/package manager/framework support and limitations.
- Acceptance: tool-backed findings include tool/version/exit status/sanitized output; AI-only findings are labeled; arbitrary code never executes in app server.

## H. Code execution and sandbox
- External execution adapter with CPU, memory, wall-time, files, output, concurrency, retention limits.
- Network disabled by default; no access to secrets, host filesystem, production database, or other jobs.
- States distinguish queued/running/passed/failed/timeout/unsupported/rejected/provider unavailable.
- Compiler/tests/runtime results carry provenance; dependency installation is separately controlled.
- Acceptance: isolation and limits have security test evidence. If unverifiable, execution remains disabled.

## I. Predict-before-run and debugging missions
- Predict output and explain reasoning before execution when appropriate.
- Use curated fixtures and known expected outcomes; compare against actual runtime only when run.
- Debug Robot uses a known flawed example with reviewed answer key, not an unverified AI-invented planted bug.
- Infrastructure failure is never counted as wrong learner prediction.
- Points derive only from server-validated events.

## J. Voice-based tutoring
- Voice input, STT transcript, spoken AI response, captions/text alternative, replay/cancel, explicit microphone state and permissions.
- Raw audio not retained by default; provider adapter handles failure/latency.
- Peer voice is a separate high-safety feature with explicit controls and review before public enablement.
- Acceptance: voice denial/outage never blocks text path; user can cancel/end immediately.

## K. Multiplayer rooms
- Create/join invite-only rooms, expiring high-entropy codes, roles, membership.
- Turn-based explain rounds, pair debugging, predict-output challenges, collaborative tasks, results.
- Server-authoritative versioned state, idempotency, reconnection/resync, leave/report/mute controls.
- No client-trusted score/completion event. Minimal pseudonymous participant details.
- Acceptance: unauthorized joins fail; concurrent/replayed actions do not corrupt state or duplicate rewards.

## L. Community
- Educational posts, code snippets, project showcases, tags/search, comments, reports, blocks, moderation queue/admin actions.
- Safe content rendering; posted code is never auto-executed.
- No default direct messages between child users; rate limits, spam controls, content size limits, moderation audit.
- Private email, exact school/location, and learning transcript are never public by default.
- Acceptance: report-to-moderation path works and every write is authorized server-side.

## M. Persistent history, gamification, leaderboard
- Persist learning sessions, attempts, rubric results, code reviews, execution outcomes, challenge results, progress, achievements.
- User sees per-topic progress and comparison of attempts.
- XP/achievements use an immutable idempotent server-side ledger.
- Global/weekly/topic leaderboard with clear point rules, opt-in pseudonymous display, anti-cheat controls.
- Learning diagnostics remain private; competitive rank is separate.
- Data export/deletion and retention are documented.
- Acceptance: persistence works across sessions; duplicate events cannot duplicate rewards; ranking derives from trusted ledger.

## N. Multi-agent orchestration
- Central orchestrator and role-specific agents for Socratic tutoring, evaluation, misconception diagnosis, code review, feedback, tool evidence, safety/moderation, and learning-path recommendations as justified.
- Typed I/O, allowlisted tools, timeouts, retries/budgets, trace IDs, cancellation, terminal states.
- Use only agents that provide distinct value; do not make agents own score calculation, authorization, or side effects.
- Acceptance: invalid/failing agents cannot fabricate grades, expose internals, or wait indefinitely.

## O. Operations
- Correlation logs, error/latency/usage metrics, rate limits, health checks, feature flags, migrations, backups/rollback, SEO, asset compression, lazy loading, cost controls.
- Acceptance: production smoke tests pass; secrets/private learner data do not appear in generic logs.

## Scope integrity

The complete vision remains in this catalogue. Implementation may be staged and a release can honestly indicate what is incomplete, but feature presence in documentation does not mean it is implemented or competition-ready.
