# Requirement Traceability

Maps each major feature to its source requirement, dependent services, documentation, roadmap IDs, tests and the release evidence needed to call it done.

- Created: 2026-10-12 (WIB). Re-check after each roadmap slice.
- Three separate views: **(a)** product target scope, **(b)** M-ONE minimum eligibility, **(c)** what is actually implemented now. Section (a) is a plan. Nothing in it is completed work unless section (c) says so with evidence.
- Test references: `U` = unit, `C` = schema/contract, `I` = integration, `E2E-n` = critical flow *n* in `docs/12` §5, `B` = AI benchmark (`docs/12` §6), `A11y` = `docs/12` §8, `Sec` = `docs/12` §9. Acceptance references are sections of `docs/13`.

## (c) Implemented now — read this first

| Item | Status | Evidence |
|---|---|---|
| Application source code | NOT STARTED | Repository contains only documentation (42 files from the StitchReady package plus `docs/implementation/`). No `package.json`, no source directories. |
| Git repository / public remote | NOT STARTED | `git status` → "not a git repository". |
| Deployment | NOT STARTED | No hosting project or URL exists. |
| Approved Stitch design | NOT STARTED | `docs/22`: design `NOT STARTED`, approval `NO`; `.stitch/references/` is empty. |
| Provider credentials (AI, database/auth, runner, speech) | NOT CONFIGURED | No matching environment variable names are present; no `.env`. |
| Every feature F01–F18 below | NOT STARTED | No code, tests or deployment exist for any of them. |

## (a) Product target scope — traceability matrix

"Sub. tier" is a **recommendation** for the competition submission (see the recommended order below). It is not an approved decision. `S1` = needed for an eligible, theme-relevant submission; `S2` = valuable if S1 is done and verified; `Later` = full-scope target, disabled or shown as "coming soon" honestly in the submission.

| ID | Feature | Source requirement | Dependent services | Docs | Roadmap | Tests | Release evidence required | Sub. tier |
|---|---|---|---|---|---|---|---|---|
| F01 | Shell, landing, navigation, system states | `02` §A; `01` journey A.1 | Hosting | `03` §1–3, §7; `04`; `22` ST-01, ST-03, ST-25 | R1.1–R1.8 | A11y; E2E-1 | Deployed URL loads; no inert CTA; mobile/desktop screenshots against approved Stitch references; keyboard/reduced-motion check | S1 |
| F02 | Child-friendly learning paths and lessons | `02` §C; `01` journey A.2–3 | Content store (DB or versioned files) | `18` §1–2; `06` §2; `22` ST-04, ST-05 | R2.1, R2.4, R2.6, R2.8–R2.10 | U (prerequisites/progress); C (lesson schema) | At least one reviewed lesson with objective, example, rubric version and misconceptions; locked/available states explained | S1 |
| F03 | AI Reverse Tutor (explain to the robot, bounded clarification) | `02` §D; `01` journey A.4–5; `08` §2 Socratic Tutor | LLM provider via server gateway | `03` §3; `07` §3; `08`; `22` ST-06 | R3.1–R3.7, R4.1–R4.3, R4.10 | C; B; E2E-2; Sec (prompt injection) | Real provider call from the deployed app; clarification is bounded; AI identity disclosed; injection fixtures fail safely | S1 |
| F04 | Rubric scoring (deterministic) | `02` §E; ADR-002; `CLAUDE.md` §5 | None (pure application code) | `08` §3–4; `18` §3; `06` §2–3 | R2.2, R2.3, R2.5, R2.7, R3.4, R3.6, R3.8, R3.9 | U (weights, levels, missing criteria); C; B (false-pass/false-fail) | Unit test output; invalid or missing criteria fail closed; no score on provider error (E2E-3) | S1 |
| F05 | AI feedback, misconception diagnosis, hint and revision loop | `02` §D–E; `01` journey A.6–8; `08` §2 Feedback Coach / Misconception Diagnostician | LLM provider | `03` §3 (Diagnosis, Revision, Completion); `18` §4; `22` ST-07, ST-08 | R4.4–R4.9, R15.2–R15.3 | C; B; E2E-2, E2E-3 | Full explain → feedback → revise → compare flow on the deployed app; comparison makes no efficacy claim | S1 |
| F06 | Mini IDE (editor, context, starter snippets) | `02` §F; `01` journey B; `09` §2 | Editor library (lazy-loaded) | `03` §4; `09` §2; `22` ST-11 | R8.1–R8.8 | A11y (editor fallback); performance (bundle size) | Bundle inspection showing lazy load; mobile behaviour usable or limitation stated | S2 |
| F07 | Multi-language generic AI code review | `02` §G; ADR-006; `09` §1, §4 Level A, §5–6 | LLM provider | `08` §2 Code Reviewer; `07` §4; `22` ST-12 | R9.1–R9.9 | C (finding schema, location validation); B (code fixtures); E2E-5 | Every finding labelled "AI suggestion"; locations validated; custom language label works | S2 |
| F08 | Parser/linter/compiler/runtime adapters and isolated execution | `02` §G–H; ADR-003; `09` §3–4 Levels C–E, §7–8 | External isolated runner (provider not chosen) | `09`; `11` (unsafe execution); `22` ST-13 | R9.10, R10.1–R10.11 | Sec (isolation, resources, cross-job); code tool tests (`12` §7); E2E-6 | Isolation proven by tests; capability matrix published from real runs. If not proven, execution stays **disabled** (ADR-003) | Later |
| F09 | Predict-before-run | `02` §I; `01` journey C; `18` §5 | Reviewed fixtures (no runner needed); runner only if F08 passes | `03`; `22` ST-09 | R11.1–R11.5, R11.8 | U (comparison); C (challenge schema); E2E-6 when a runner exists | Expected output from reviewed fixtures, labelled as such; infrastructure failure never marks the learner wrong | S2 |
| F10 | Debug Robot missions | `02` §I | LLM provider (feedback); reviewed answer key | `18` §1 item 6; `22` ST-10 | R11.6–R11.8 | U; C; B | Each mission has a reviewed known bug and answer key, not an AI-invented one | S2 |
| F11 | Authentication, profile, privacy, data export/deletion | `02` §B; ADR-004; `10` §1, §7 | Managed auth + database (provider not chosen) | `06` §1, §7; `07` §2; `11`; `22` ST-02, ST-17 | R5.1–R5.8 | I (ownership); Sec (IDOR, two accounts); E2E-4, E2E-7, E2E-12 | Cross-user denial tested with two accounts; public DTO allowlist; deletion policy written and tested | S2 |
| F12 | Persistent history and progress | `02` §M; `01` journey A.9 | Database with RLS / server authorization | `06` §3, §7; `05` §6; `22` ST-14, ST-15 | R6.1–R6.8 | I (RLS); E2E-4 | History persists across sessions; failed AI calls never stored as valid scores | S2 |
| F13 | XP, achievements, leaderboard | `02` §M; `10` §5 | Database (immutable ledger) | `06` §6; `07` §8; `22` ST-16, ST-18 | R7.1–R7.8 | U (idempotency, sorting, privacy filter); E2E-8 | Duplicate events cannot double-award; leaderboard is opt-in and pseudonymous | Later |
| F14 | Community and moderation | `02` §L; `10` §3; ADR-004 | Database; optional safety agent | `07` §7; `11`; `22` ST-19, ST-20 | R14.1–R14.9 | Sec (XSS, report confidentiality); E2E-9 | Report-to-moderator flow works; safety gate in `10` §8 approved; otherwise feature-flagged off | Later |
| F15 | Voice AI tutoring | `02` §J; `10` §4 | Speech-to-text / text-to-speech provider (not chosen) | `07` §5; `22` ST-24 | R12.1–R12.8 | E2E-11 | Permission denial/outage keeps text path; no raw audio retained; provider data terms reviewed | Later |
| F16 | Multiplayer / realtime rooms | `02` §K; `10` §4; `05` §5 | Authorized realtime channels + database | `06` §5; `07` §6; `11`; `22` ST-21–ST-23 | R13.1–R13.10 | U (state machine); Sec (unauthorized join, replay); E2E-10 | Server-authoritative state; unauthorized joins fail; safety gate passed | Later |
| F17 | Bounded multi-agent orchestration | `02` §N; ADR-005; `08` | LLM provider; orchestrator in app code | `08` §1, §5–7; `19` | R15.1–R15.8 (minimal form inside R3–R4) | C; B; Sec (injection) | Each agent has schema/budget/timeout/terminal state; agents cannot change scores or permissions | S1 (minimal: Evaluator → deterministic scorer → Feedback Coach); full set Later |
| F18 | Operations: observability, rate limits, cost controls, SEO, performance | `02` §O; `17`; `19` | Hosting; optional error reporting | `17`; `19`; `14` §2 (Technical Quality) | R0.7–R0.9, R16.1–R16.11 | Performance; smoke test (`17`) | Rate limit and spend cap on AI routes before the URL is shared; no secrets in bundle or logs; SEO metadata | S1 (rate limit, safe errors, SEO, smoke test); rest S2 |

Governance steps R0.1–R0.5 (repository, Git, decisions, organizer rules, raw log) are not product features. They are tracked in `docs/implementation/WORKING_RULES_CHECKLIST.md` and gate (b) below.

## (b) M-ONE minimum eligibility requirements

Source: `docs/14` §1 (a transcription; the original guidebook is not in the repository, so the transcription is `NOT VERIFIED`).

| Gate | Requirement | Product features it depends on | Status now |
|---|---|---|---|
| 1 | AI Agent reference docs for development | None (process) | Docs exist; provenance must be recorded (`WORKING_RULES_CHECKLIST.md` G-01–G-03) |
| 2 | Public GitHub repository | None (process) | FAIL: no repository |
| 3 | Curated journal (max five actual prompts) plus raw log from the start | None (process) | NOT VERIFIED: raw log exists locally, not yet backed up or registered |
| 4 | Theme and subtheme "Web Education for Kids" (elementary school) | F01–F05, F17 (minimal) | NOT STARTED |
| 5 | Free choice of stack | — | PASS (no restriction) |
| 6 | Deployed website accessible to judges | F01, F18 (minimum) | FAIL: nothing deployed |

**Minimum product for eligibility:** gates 4 and 6 need one deployed, theme-relevant, working path. That path is F01–F05 plus the minimal F17 and the S1 parts of F18. Everything else improves the score (functionality, innovation) but is not an eligibility condition.

## Decisions already governed by an ADR (resolved — no new decision needed)

| Question | Resolution | Governing source |
|---|---|---|
| Who computes the learning score? | Application code, from validated criterion ratings; the model never sets the total. Errors and insufficient evidence produce no score. | ADR-002; `D-004` |
| Can code run in the web app? | No. External isolated runner only; if isolation is not verified, execution stays disabled and generic review remains. | ADR-003 |
| Does predict-before-run need a runner? | No. Expected output may come from reviewed fixtures (`18` §5); a runner is only used once F08 passes. | ADR-003 + `docs/18` §5 |
| Which languages can be reviewed? | Any code text, with a custom label, as AI-only review; tool-backed support is declared per tested capability. | ADR-006; `D-005` |
| Default visibility of child data, DMs, leaderboard, audio | Private by default; no child DMs; leaderboard opt-in; no raw audio retained; social features gated. | ADR-004 |
| How many agents per request? | As few as add value; scoring, authorization and rewards stay in deterministic services. | ADR-005 |

## Conflicting or underspecified decisions — need the participant

Recommendations only. None of these are recorded as decisions until the participant approves them.

| ID | Issue | Evidence | Recommended default | Impact (security / cost / deadline) |
|---|---|---|---|---|
| Q1 | **Web stack is still "proposed".** `.env.example` already assumes Supabase. | ADR-001 status "proposed"; `.env.example` uses `NEXT_PUBLIC_SUPABASE_*`; `docs/17` says names are finalized during implementation. | Accept ADR-001 as written: Next.js App Router + TypeScript + Tailwind; Supabase only when F11/F12 start; Vercel hosting. Verify Next.js support for the installed Node v26.8.2 at R0.6. | Deadline: lowest setup time and the docs already assume it. Security: Supabase RLS fits `06` §7. Cost: free tiers are likely enough, but check quotas. |
| Q2 | **Runtime AI provider and model not chosen.** | `D` pending list in `docs/20`; R3.1. | Use one provider behind the gateway interface with structured (JSON-schema) output; pick the model in R3.1 after a short benchmark on the lesson fixtures. A Claude model is a reasonable first candidate; confirm current availability, pricing and terms at R3.1. | Blocks F03–F05, so it blocks gates 4 and 6. Cost: needs a per-IP rate limit and a spend cap before the URL is public. Security: key server-side only. |
| Q3 | **Roadmap order conflicts with the Stitch gate.** R1.1 "Define design tokens" comes before any content work, but `docs/22` and `CLAUDE.md` §8 say final tokens come from the approved Stitch design. | `docs/16` Phase 1; `docs/22` Source-of-truth policy; `CLAUDE.md` §8. | Do Phase 2 (content/scoring) and Phase 3 (AI gateway) before Phase 1. Build a plain, unstyled functional page for testing only, labelled as not the final design. Apply the Stitch design when Gate B passes. | Deadline: keeps work moving while the design is made. UI/UX is 20% of the score, so the Stitch design must arrive by about 14 Oct to be implemented in time. |
| Q4 | **Programming language/notation for child lessons is unspecified.** | `docs/18` §1–2 and §6 require a "specified language/runtime version" but none is named. | Lessons 1–2: Indonesian "robot command" steps (no real language needed). Code-reading and predict lessons: short Python snippets with reviewed expected output. | User-visible and affects all content. Deadline: fixture-only lessons avoid needing a runner. |
| Q5 | **Target age/grade band is unspecified.** | `06` §2 has `grade band`; `01` says "elementary-school". | Grades 4–6 (about ages 9–12), because the core action is typing an explanation. | User-visible: sets reading level, text length and rubric strictness. |
| Q6 | **Guest vs account for the core path.** Judges must be able to try the site without friction; an auth provider usually needs an email, which conflicts with child data minimization. | `01` journey A.9 allows guests; `06` §3 allows nullable owner only for ephemeral guest sessions; `10` §1. | Core lesson works as a guest, with session-only state and a clear note. Accounts (F11) come later. Avoid collecting child emails in the competition build. | Security/cost: guest AI calls need a per-IP rate limit and daily spend cap. Deadline: removes auth from the critical path. |
| Q7 | **Clarification and retry bounds are not numbers.** | `02` §D "bounded turns"; `18` §4 "bound attempts". | At most 1 clarification per attempt, at most 3 attempts per lesson session, and an AI timeout around 30 s per call. Exact values to be confirmed. | Cost: caps LLM calls per session. UX: prevents loops. |
| Q8 | **Rubric total and level points are unspecified.** | `08` §4 "declared total"; `18` §3. | Each lesson rubric totals 100 points; each criterion has 3 levels (`belum terlihat` / `sebagian` / `tepat`) mapped to 0 / 50% / 100% of its weight. Weights are approved per lesson. | Affects scoring tests and UI copy. Low risk if fixed early. |
| Q9 | **Editor choice.** Monaco is the candidate, but `05` §1 allows a lighter editor if evidence favors it; mobile support matters for children. | `05` §1; `02` §F; R8.1. | Evaluate CodeMirror 6 first for mobile and bundle size; decide at R8.1 with a measured bundle size. | Performance is part of Technical Quality (15%). Not on the S1 critical path. |
| Q10 | **Browser speech recognition privacy.** Using the browser's built-in speech API may send audio to a third party without the disclosure `10` §1 requires. | `10` §1, §4; ADR-004. | Keep voice (F15) out of the competition build. Revisit with an explicit provider and disclosure. | Privacy/safety risk if enabled casually. Deadline: saves effort. |
| Q11 | **No written deletion/retention policy** although `02` §B, `06` §7 and `10` §7 require one before persistent history ships. | Those sections reference a "documented policy" that does not exist. | Write the policy at R5.8, before F12 is enabled. Guest-only build stores no learner history server-side beyond what is needed. | Security/privacy: F12 must not ship without it. |
| Q12 | **Hosting function time limits vs AI chains.** Evaluator → Feedback Coach in sequence may approach serverless time limits. | `05` §3, §8; `17`. | Keep the S1 chain to two model calls; check the hosting plan's maximum function duration at R0.6/R3.5; stream or split if needed. | Deadline/reliability risk on the deployed demo. |
| Q13 | **Where the evidence index lives** is unspecified. | `docs/14` §6. | `docs/implementation/EVIDENCE_INDEX.md`, created at the first evidence-producing slice. | Process score (25%). Negligible cost. |
| Q14 | **File inventory is stale.** *(Resolved 2026-10-15: the inventory was removed; the README and `docs/00_DOCUMENT_MAP.md` describe the repository.)* | `docs/FILE_INVENTORY.md` omits `.stitch/README.md`, the `.gitkeep` files and `docs/implementation/`. | Update it in the repository-setup slice. | Documentation accuracy only. |

## Recommended implementation order (deadline: 15 Oct 2026 15:30 WIB)

About 71 hours remained at the start of this session. The order puts an **eligible deployed submission first**, then adds score-raising features, and leaves the rest truthfully marked as not built.

1. **R0 — Repository and evidence.** Fix GitHub authentication; `git init`; first commit of the documentation with honest provenance; public remote; back up the raw log. Approve Q1, Q2 and Q4–Q8.
2. **R0.6–R0.9 — Skeleton.** Next.js app scaffolded from scratch with official tooling; lint, type-check, unit test and build scripts; a placeholder environment file; **deploy an empty preview immediately** so gate 6 is tested early.
3. **R2 — Content and deterministic scoring** (no LLM, no UI): lesson and rubric schemas, first lesson, answer fixtures, scoring unit tests.
4. **R3 — AI gateway**: provider adapter, schemas, timeouts, rate limit, spend cap, failure tests, a small benchmark.
5. **R4 — Reverse Tutor vertical slice** on a plain functional page (labelled not final design): explain → clarification → assessment → feedback → revision → summary, with E2E-2 and E2E-3 on the preview deployment. *Gate C.*
6. **Gate B → R1 — Apply the approved Stitch design** to the shell, landing, lesson and result screens; responsive and accessibility checks against references.
7. **R11 (fixture-based) — Predict-before-run and Debug Robot** for 1–2 challenges: a cheap innovation win that needs no runner.
8. **R8/R9 minimal — Mini IDE with AI-only review**, every finding labelled "AI suggestion", execution disabled per ADR-003.
9. **R16 subset — Hardening and submission**: security checks for exposed routes, SEO metadata, bundle check, deployed smoke test, `21_SUBMISSION_CHECKLIST.md`, curated journal. Leave a buffer of at least 6 hours before the deadline.
10. **After submission or if time allows:** R5/R6 (accounts, history), R7, R10, R12–R15. In the submitted build these are hidden or clearly marked as not yet available, never presented as working.
