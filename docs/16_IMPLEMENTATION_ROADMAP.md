# Implementation Roadmap — Small, Verifiable Slices

This roadmap preserves the full brainstormed product. It is not a guarantee every feature can be completed by the competition deadline. Use real Vibe Coding interactions for every step; this roadmap intentionally contains no ready-to-paste prompts.

For each item: inspect repository → state expected behavior/acceptance → implement one coherent slice → add/update tests → run checks → inspect in browser/environment → update evidence/status → commit authentically. Status values: `TODO`, `IN PROGRESS`, `BLOCKED`, `PASS`, `NOT VERIFIED`.

## Phase 0 — Governance and evidence
- [ ] R0.1 Create a new competition repository after official start-time constraint; verify visibility is public.
- [ ] R0.2 Initialize Git and check `.gitignore`/secrets exclusion.
- [ ] R0.3 Read blueprint docs and record actual material decisions in `20_DECISION_LOG.md`.
- [ ] R0.4 Verify official competition rules/updates and save the actual source/time.
- [ ] R0.5 Start preserving raw prompt logs from the first real coding-agent interaction.
- [ ] R0.6 Initialize project skeleton from scratch under approved stack; do not copy a prohibited existing project/template.
- [ ] R0.7 Pin dependencies and commit the lockfile.
- [ ] R0.8 Add formatting, lint, type-check, test and build commands.
- [ ] R0.9 Add placeholder-only environment example and verify missing secrets yield safe states.

Exit gate: repo provenance is clear, no secrets are committed, checks are runnable and evidence preservation has started.

## Phase 1 — Design system and shell
- [ ] R1.1 Define design tokens and measure actual contrast.
- [ ] R1.2 Implement typography, spacing, surfaces, color roles and focus styles.
- [ ] R1.3 Implement reusable Button, Input, Textarea, Badge, Progress, Dialog, Alert and Skeleton.
- [ ] R1.4 Implement responsive shell/navigation/page container.
- [ ] R1.5 Implement landing page with one clear primary learning action.
- [ ] R1.6 Add not-found/error/loading/empty/unavailable patterns.
- [ ] R1.7 Check keyboard focus, small-screen reflow and reduced motion.
- [ ] R1.8 Lazy-load heavy editor/visuals and inspect bundle.

Exit gate: shell is responsive/navigable and has no inert primary CTA.

## Phase 2 — Content and deterministic rubrics
- [ ] R2.1 Define typed lesson schema/content versioning.
- [ ] R2.2 Define typed rubric schema, allowed levels, weights and mappings.
- [ ] R2.3 Validate published rubric weights sum correctly.
- [ ] R2.4 Create first age-appropriate sequence/instructions lesson.
- [ ] R2.5 Add reviewed correct/concise/partial/incorrect/ambiguous answer fixtures.
- [ ] R2.6 Add misconceptions tied to the lesson objective.
- [ ] R2.7 Implement deterministic scoring with unit tests.
- [ ] R2.8 Implement learning-path/lesson-card screen.
- [ ] R2.9 Implement concept intro and example view.
- [ ] R2.10 Add next lesson after the first schema/lesson passes.

Exit gate: lesson content/scoring testable without an LLM.

## Phase 3 — AI gateway and validation
- [ ] R3.1 Choose runtime model/provider after checking availability, cost, terms, language quality and structured output.
- [ ] R3.2 Define provider interface and server-only credential access.
- [ ] R3.3 Define tutor response schema/status.
- [ ] R3.4 Define criterion-level assessment/evidence schema.
- [ ] R3.5 Add request limits, timeout, bounded retries and safe error envelope.
- [ ] R3.6 Validate output structure plus semantic invariants.
- [ ] R3.7 Test missing key, timeout, rate limit, malformed output and invalid criteria.
- [ ] R3.8 Ensure error/insufficient evidence never returns a fake numeric score.
- [ ] R3.9 Build reviewed benchmark and compare candidate models.

Exit gate: provider failure is safe; score is deterministic from validated rubric data.

## Phase 4 — Reverse Tutor vertical slice
- [ ] R4.1 Implement session state/attempt contract.
- [ ] R4.2 Implement explanation input/submission.
- [ ] R4.3 Add bounded Socratic clarification.
- [ ] R4.4 Implement evaluator path for first lesson.
- [ ] R4.5 Display score, criterion breakdown, evidence, strengths, gap and one hint.
- [ ] R4.6 Make revision a separate attempt.
- [ ] R4.7 Compare attempts without claiming long-term efficacy.
- [ ] R4.8 Implement summary and next step.
- [ ] R4.9 Add E2E test from landing through revised feedback.
- [ ] R4.10 Test empty/long/off-topic input, duplicate submit and provider failure.

Exit gate: complete learning session works locally and in a preview deployment.

## Phase 5 — Auth/profile
- [ ] R5.1 Confirm auth provider/options.
- [ ] R5.2 Create profile schema/migration.
- [ ] R5.3 Configure auth callbacks and server session checks.
- [ ] R5.4 Implement registration/login/logout/recovery.
- [ ] R5.5 Implement pseudonymous profile/avatar.
- [ ] R5.6 Implement privacy settings/leaderboard opt-in.
- [ ] R5.7 Add cross-user authorization tests with two accounts.
- [ ] R5.8 Add data export/deletion and retention behavior.

Exit gate: identity is reliable and cross-user access tests pass.

## Phase 6 — Persistent history/analytics
- [ ] R6.1 Migrate sessions, attempts, turns, assessments and criterion results.
- [ ] R6.2 Apply ownership/RLS policies and test them.
- [ ] R6.3 Persist valid attempts/rubric versions.
- [ ] R6.4 Build own-history view.
- [ ] R6.5 Build per-topic progress.
- [ ] R6.6 Prevent failed AI calls entering history as valid scores.
- [ ] R6.7 Implement retention/deletion propagation.
- [ ] R6.8 Test refresh/logout/login/cross-user access.

Exit gate: history persists safely with proven ownership isolation.

## Phase 7 — XP, achievements, leaderboard
- [ ] R7.1 Define versioned XP/achievement rules.
- [ ] R7.2 Create immutable XP ledger with unique idempotency key.
- [ ] R7.3 Implement server-side achievement eligibility.
- [ ] R7.4 Add mission completion/progress/achievement UI.
- [ ] R7.5 Add leaderboard periods/projection.
- [ ] R7.6 Add public-handle allowlist/opt-in visibility.
- [ ] R7.7 Test duplicate/replayed requests.
- [ ] R7.8 Design empty/low-rank states without shame.

Exit gate: rewards are server-calculated, idempotent and privacy-aware.

## Phase 8 — Mini IDE foundation
- [ ] R8.1 Choose editor after checking docs, accessibility, mobile, bundle and license.
- [ ] R8.2 Lazy-load editor and handle initialization failure.
- [ ] R8.3 Add language selector/custom language label.
- [ ] R8.4 Add single-file quick review.
- [ ] R8.5 Add expected behavior/context field.
- [ ] R8.6 Add framework/library/version and project-context controls.
- [ ] R8.7 Add starter examples and restore/reset support.
- [ ] R8.8 Treat code as untrusted and avoid logging secrets.

Exit gate: users can edit/request analysis without claiming execution.

## Phase 9 — Universal code review
- [ ] R9.1 Define capability registry/version schema.
- [ ] R9.2 Implement generic AI review for arbitrary code text.
- [ ] R9.3 Define finding schema with evidence/provenance.
- [ ] R9.4 Implement code reviewer agent contract.
- [ ] R9.5 Validate finding source locations.
- [ ] R9.6 Add logic/quality/readability/maintainability/edge-case/security categories.
- [ ] R9.7 Render severity/explanation/hint.
- [ ] R9.8 Show proposed patches as diffs with explicit acceptance.
- [ ] R9.9 Create valid/invalid/ambiguous benchmark fixtures.
- [ ] R9.10 Persist review history by ownership.

Exit gate: generic review is useful and truthful; schema/evidence validation passes.

## Phase 10 — Isolated execution/adapters
- [ ] R10.1 Threat-model candidate runner and document isolation guarantees.
- [ ] R10.2 Define adapter interface/capability states.
- [ ] R10.3 Implement one safe reference language adapter.
- [ ] R10.4 Enforce CPU/memory/time/output/file/process/concurrency/network limits.
- [ ] R10.5 Prove jobs cannot access application secrets/production DB.
- [ ] R10.6 Implement queue/status/cancel/timeout/expiry.
- [ ] R10.7 Add tool/version/exit-status provenance.
- [ ] R10.8 Test malicious inputs/resource exhaustion/cross-job isolation.
- [ ] R10.9 Add language ecosystem adapters incrementally.
- [ ] R10.10 Handle manifests/dependency installs only through controlled isolation.
- [ ] R10.11 Publish capability matrix from real tests.

Exit gate: execution is enabled only when isolation is verified; unsupported toolchains are labeled.

## Phase 11 — Predict output and Debug Robot
- [ ] R11.1 Define reviewed challenge schema and expected output.
- [ ] R11.2 Create versioned sequence/loop/condition fixtures.
- [ ] R11.3 Require prediction before run where appropriate.
- [ ] R11.4 Compare against actual runtime/fixture with clear provenance.
- [ ] R11.5 Distinguish infrastructure failure from wrong prediction.
- [ ] R11.6 Add curated known-bug challenges and reviewed answer key.
- [ ] R11.7 Connect results to server-side XP rules.
- [ ] R11.8 Add retries and explanation loop.

Exit gate: every challenge has verified answer data and no client-forged result.

## Phase 12 — Voice tutoring
- [ ] R12.1 Define speech provider abstraction/retention defaults.
- [ ] R12.2 Implement microphone permission/status UI.
- [ ] R12.3 Add STT and error/timeout handling.
- [ ] R12.4 Feed transcript through existing tutor contract.
- [ ] R12.5 Add TTS, replay and cancel.
- [ ] R12.6 Keep text mode available.
- [ ] R12.7 Test pronunciation/latency/child-friendly output.
- [ ] R12.8 Review provider data terms and audio retention.

Exit gate: permission denial/provider outage never blocks text learning.

## Phase 13 — Multiplayer/realtime
- [ ] R13.1 Define room lifecycle/state machine.
- [ ] R13.2 Create room/member/invite/event/submission schema.
- [ ] R13.3 Implement authorized create/join/leave.
- [ ] R13.4 Configure private channels and access policy.
- [ ] R13.5 Implement reconnect/state resync.
- [ ] R13.6 Add one turn-based challenge.
- [ ] R13.7 Validate result and award XP idempotently.
- [ ] R13.8 Test unauthorized join/stale state/duplicates/concurrency/disconnect.
- [ ] R13.9 Add mute/leave/report safety behaviors.
- [ ] R13.10 Consider peer voice only after separate safety gate.

Exit gate: server controls state/rewards and unauthorized users cannot inspect rooms.

## Phase 14 — Community/moderation
- [ ] R14.1 Define policy/prohibited content/report states.
- [ ] R14.2 Create post/comment/report/moderation schemas.
- [ ] R14.3 Implement safe rendering and length limits.
- [ ] R14.4 Implement create/edit/delete owned content.
- [ ] R14.5 Implement reporting/blocking.
- [ ] R14.6 Implement moderator queue/actions/audit.
- [ ] R14.7 Add rate limits/spam/safe-link policy.
- [ ] R14.8 Test privacy/moderator/report confidentiality.
- [ ] R14.9 Gate community on safety release criteria.

Exit gate: report-to-moderation flow works and safety criteria are approved.

## Phase 15 — Multi-agent orchestration
- [ ] R15.1 Implement orchestrator trace/budget/timeout/cancel/stop rules.
- [ ] R15.2 Integrate evaluator and feedback agent contracts.
- [ ] R15.3 Add misconception agent using reviewed catalogue.
- [ ] R15.4 Add code tool evidence analyst.
- [ ] R15.5 Add safety triage agent with human escalation as required.
- [ ] R15.6 Add provider/model routing behind interface.
- [ ] R15.7 Benchmark quality/latency/cost/failure.
- [ ] R15.8 Remove redundant agent calls; retain simplest reliable workflow.

Exit gate: multi-agent adds measured value and does not control permissions/score math.

## Phase 16 — Production hardening and competition release
- [ ] R16.1 Run threat model/security suite.
- [ ] R16.2 Audit database permissions, RLS, deletion.
- [ ] R16.3 Inspect bundle, editor lazy loading, images/fonts/cache/performance.
- [ ] R16.4 Add metadata/description/Open Graph/robots/sitemap as appropriate.
- [ ] R16.5 Review quotas, rate limits, cost ceiling and monitoring.
- [ ] R16.6 Run responsive, keyboard, screen-reader status and reduced-motion checks.
- [ ] R16.7 Run critical E2E flows on deployed app.
- [ ] R16.8 Test migration/rollback/recovery procedure.
- [ ] R16.9 Check logs for sensitive data and secrets.
- [ ] R16.10 Update README, support matrix, deployment docs and known limitations.
- [ ] R16.11 Complete `21_SUBMISSION_CHECKLIST.md` with real evidence.

Exit gate: all mandatory M-ONE requirements pass, and remaining product-scope features are truthfully marked incomplete/not verified rather than claimed complete.

## Competition timebox

The full scope is preserved. If a submission subset must be prioritized, do not misrepresent unbuilt features; complete a real theme-relevant path and mark the remainder honestly. The competition deadline in the supplied guidebook is 15 October 2026, 15:30 WIB; verify authentic organizer updates.
