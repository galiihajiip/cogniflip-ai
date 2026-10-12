# Project Decision Log

Append decisions chronologically. Record actual options, rationale, impact, status, and approver. Do not invent or backdate decisions.

## D-001 — Working product name
- Date: 2026-10-12
- Status: accepted as working name
- Decision: `CogniFlip`, tagline `Flip the Way You Learn.`
- Rationale: represents the shift from receiving answers to explaining/testing understanding and leaves room for coding tools.
- Revisit if domain/trademark review identifies conflict.

## D-002 — Full feature scope
- Date: 2026-10-12
- Status: accepted as target vision
- Decision: preserve the complete scope in `02_PRODUCT_SCOPE.md`, including authentication/profile, history, leaderboard, community, voice, multiplayer, multi-agent, Mini IDE, and language/tool adapters.
- Implementation rule: sequence by dependency and verify each module. This is not a claim all features will be ready by the competition deadline.

## D-003 — Indonesian-first child-friendly UX
- Date: 2026-10-12
- Status: accepted
- Decision: Indonesian is default UI language; elementary-school usability governs the primary learning path.

## D-004 — Deterministic scoring
- Date: 2026-10-12
- Status: accepted
- Decision: LLM may produce validated criterion-level judgment with evidence; application code computes total score from a versioned rubric. Error/insufficient evidence never becomes a fake numeric score.

## D-005 — Broad language input, explicit tool support
- Date: 2026-10-12
- Status: accepted
- Decision: accept arbitrary code as text for generic AI review and report actual parser/linter/compiler/runtime/framework capabilities using a registry. Do not claim universal tool verification without real tools/tests.

## D-006 — Database: plain PostgreSQL, verified locally in Docker
- Date: 2026-10-13
- Status: accepted
- Approver: participant (answered in the Claude Code session on 2026-10-13 WIB, BLOCK 08)
- Options considered: (1) server-only boundary with the database deferred; (2) Supabase (Postgres + Auth + Realtime) as proposed in ADR-001; (3) provider-neutral PostgreSQL with SQL migrations, verified against a throwaway local Postgres in Docker.
- Decision: option 3. Use the `pg` driver from server-only code and forward-only SQL migrations run by a small project script. Develop and test against a local Docker Postgres (`postgres:18.6-alpine`) with synthetic data only.
- Rationale: verifiable now without external accounts or credentials; works with any managed Postgres host later.
- Consequences: Supabase Auth/Realtime are not part of this decision. Authentication, authorization (RLS or server checks) and realtime need separate decisions before F11/F12/F16. The production database host is still to be chosen.

## D-007 — Lesson content defaults
- Date: 2026-10-13
- Status: accepted
- Approver: participant (Claude Code session, 2026-10-13)
- Decision: target grades 4–6. Lessons 1–2 use Indonesian "robot command" steps (no programming language); later code-reading lessons use short Python snippets with reviewed expected output. At most 1 clarification per attempt and 3 attempts per lesson session. Each lesson rubric totals 100 points; each criterion has 3 levels (`belum_terlihat` / `sebagian` / `tepat`) worth 0 / 50 / 100 % of its weight.
- Resolves traceability questions Q4, Q5, Q7, Q8.

## D-008 — Runtime AI provider: Google Gemini (accepted against a recorded terms risk)
- Date: 2026-10-13
- Status: accepted by the participant after being shown the risk below
- Approver: participant (Claude Code session, 2026-10-13)
- Options presented: Claude Sonnet 5.5 / Haiku 5.5 / Opus 5.5 (Anthropic's Usage Policy permits products serving minors with AI disclosure and safeguards), or Gemini.
- Decision: use the Gemini API through Google's official SDK, behind the project's provider-neutral AI interface. The specific model is chosen by the benchmark (R3.9).
- **Recorded risk:** Google's Gemini API Additional Terms (last modified 2026-04-28, https://ai.google.dev/gemini-api/terms) state "You must be 18 years of age or older to use the APIs" and forbid use in a website or application directed towards or likely to be accessed by individuals under 18. Google Cloud's Service Specific Terms carry an equivalent restriction for Vertex AI. CogniFlip's primary audience is elementary-school children, so this use conflicts with the provider's terms and may lead to suspension. On unpaid tiers Google may use inputs to improve its products and human reviewers may read them.
- Mitigations kept in the code: provider-neutral interface (switching provider is one adapter); no names or personal data sent to the model; AI disclosure in the product; recommendation to use a paid tier at minimum. The participant remains responsible for the provider-terms decision.

## D-009 — No product screens before approved Stitch designs
- Date: 2026-10-13
- Status: accepted
- Approver: participant (Claude Code session, 2026-10-13)
- Decision: UI blocks (BLOCK 19–26 and other screen work) wait for approved Stitch exports. Until then only domain logic, services, APIs and tests are built. Screens are marked BLOCKED, not provisional.
- Consequence: the UI/UX criterion (20%) and the deployed learner flow depend on Stitch exports arriving before the 2026-10-15 15:30 WIB deadline.

## D-010 — Accounts: pseudonymous handle + password, no email
- Date: 2026-10-13
- Status: accepted
- Approver: participant (Claude Code session, 2026-10-13)
- Decision: in-house accounts stored in the project's PostgreSQL (D-006): a pseudonymous handle and a password hashed with a memory-hard algorithm; server-side sessions in an httpOnly cookie. No email, real name, school, birthdate or location is collected.
- Consequence: no self-service password recovery (no email). Recovery and its safety implications must be documented honestly.

## D-011 — Stitch "Warm Learning Lab" export is the approved visual source
- Date: 2026-10-13
- Status: accepted
- Approver: participant (Claude Code session, 2026-10-13: provided the Stitch export ZIP and asked for it to be integrated with the existing features and pages)
- Decision: the 58-screen Google Stitch export and its `DESIGN.md` are the visual source of truth (`.stitch/`). Screens are implemented in the Next.js app against the existing API contracts; claims and features the product cannot support are adapted, not copied (`docs/22` §Adaptations). Supersedes the blocking part of D-009.
- Consequences: screens without a Stitch design (auth, profile, history, leaderboard, help pages, mission hub) are built from the same design system and are listed as gaps for participant review. The export has no mobile screens; mobile layouts are responsive adaptations.

## D-012 — Run learner Python in the browser (Pyodide in an isolated Web Worker)
- Date: 2026-10-14
- Status: accepted
- Approver: participant (Claude Code session, 2026-10-14: asked why the Mini IDE could not run code, was shown three options — in-browser Pyodide, a hosted sandbox service, a self-hosted container — with trade-offs, and approved the in-browser option)
- Decision: Python code in the Mini IDE runs client-side with Pyodide 0.29.5 (CPython compiled to WebAssembly, MPL-2.0) inside a dedicated module worker. The server never executes learner code; `/api/code/run` stays disabled. Pyodide is self-hosted (copied from `node_modules` at dev/build time), not loaded from a CDN.
- Isolation layers: (1) the worker script is served with its own CSP (`default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'`), so the browser refuses connections and scripts from any other origin; (2) after Python loads, network and code-loading globals (`fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `Worker`, …) are removed from the worker scope and its prototypes; (3) the `js`/`pyodide_js` bridge modules are detached; (4) the page terminates the worker after 5 s; (5) output is capped at 20,000 characters and stdin at 2,000; every run starts with fresh globals.
- Accepted residual risks: memory is bounded only by the browser's WebAssembly limits (a run that allocates heavily is still stopped by the 5 s timeout); same-origin GET requests via `import()` remain possible under `connect-src`/`script-src 'self'` but cannot read responses or change data; only Python is supported; first load downloads about 12 MB.
- Consequences: ADR-003 is updated (the "never in the app process" rule is kept). Mission answer keys still come from reviewed fixtures.

## D-013 — Draft lessons and missions are visible to every visitor
- Date: 2026-10-15
- Status: accepted
- Approver: participant (Claude Code session, 2026-10-15: asked whether drafts should be visible in production to the demo account only, to every visitor, or to nobody until published; chose "every visitor")
- Decision: unreviewed AI-drafted lessons and missions are listed in every environment, including production, unless `ALLOW_DRAFT_CONTENT=false`. They keep the visible "Draf, belum diperiksa guru" label. The production start-up check that refused `ALLOW_DRAFT_CONTENT=true` is removed.
- Risk accepted: children may see content no teacher has reviewed. Mitigations: draft labels on every card and page; the guide page states the review status; publishing reviewed content is still the intended path (`LESSON_REVIEW.md`).

## D-014 — Public demo account
- Date: 2026-10-15
- Status: accepted
- Approver: participant (request: a hard-coded demo account with an auto-fill button that can use every feature without being locked)
- Decision: handle `demo`, password `FlipBot-Juara-2026` (public by design, shown on `/masuk` with an "Isi Otomatis Akun Demo" button; `src/shared/api/demo.ts`). The account is created by the server on the first correct demo login (no deploy-time seed) and is a plain `learner` (no moderator/admin rights).
- Never locked: the demo handle is exempt from the per-handle login lockout (5 per 15 min); its AI, mission-attempt and code-review rate limits are counted per client IP instead of per account, so visitors sharing it do not exhaust each other's quota. The per-IP login limit still applies.
- Protected: `demo` is a reserved handle (nobody can register it), and the account cannot be deleted (403). Its history, XP and leaderboard entry are shared by everyone who uses it; the login card and profile say so and ask users not to write personal data.

## D-015 — Multi-language curriculum and more in-browser runtimes
- Date: 2026-10-15
- Status: accepted
- Approver: participant (request: complete lesson modules from absolute basics to advanced, referenced from W3Schools, not only Python, usable by the demo account, and a Mini IDE that supports every language)
- Decision: 52 lessons in 8 tracks: Dasar Berpikir Komputasi (3, existing), Python (13), JavaScript (10), HTML (5), CSS (5), SQL (6), Java (5), C++ (5), each with a rubric (3 criteria), misconceptions, bounded hints and a reference explanation, generated from compact specs (`src/server/learning/content/curriculum/`). Topic order follows the W3Schools tutorials as a reference only; all text is original Indonesian for grade 4–6 learners. Every runnable example output is verified in `tests/unit/curriculum.test.ts` by running it with CPython, Node, the sqlite3 CLI, javac/java 21 and g++ (C++17). All lessons are AI-drafted `draft` content (shown with a label per D-013) and need teacher review.
- Mini IDE: runs Python (Pyodide), JavaScript (isolated worker, CSP `connect-src 'none'`), SQL (sql.js 1.14.2, MIT, SQLite in WebAssembly) and HTML/CSS (sandboxed `allow-scripts` iframe with a `default-src 'none'` CSP), all in the learner's browser. Java, C++, Go, Rust, PHP and other compiled/server languages are **not executed** (no verified sandbox); they get AI review, and the "Lainnya" option lets learners name any other language for AI review.
- Limits stated honestly: AI review needs the production Gemini key; the dev mock scores only benchmark fixtures, so new lessons get clarification questions locally.

## D-016 — No draft labels; live Gemini models with fallback
- Date: 2026-10-15
- Status: accepted
- Approver: participant (asked to remove every "Draf" label and supplied the Gemini key)
- Decision: the "Draf, belum diperiksa guru" chips are removed from lesson and mission pages (supersedes the label mitigation in D-013). The parents' and teachers' guide (`/panduan`) still states that lessons, rubrics and missions were drafted with AI help and are not teacher-reviewed. The API keeps its `draft` field.
- AI: Gemini models observed on 2026-10-15 were intermittently overloaded (503) or slow (>30 s). The app now tries `LLM_MODEL` then `LLM_FALLBACK_MODELS`, moving on only on overload, rate limit or timeout, with the time budget shared (`AI_TIMEOUT_SECONDS=60`), and requests use thinking level LOW. `maxItems` is no longer sent in Gemini response schemas (the live API rejected the code-review schema with 400). Live checks the same day: explanation assessment (py-for 100/100, js-array 100/100, perulangan partial 35/100 with a guiding question, sql-where clarification question), code review (one correct finding on line 1) and bug diagnosis (correct), all with `mockMode: false`.
- Security note: the key was pasted into the chat transcript; it is stored only in the git-ignored `.env.local`. It must be rotated and removed from any published log.

## D-017 — Hosting on the organiser's Dokploy server with Dokploy PostgreSQL
- Date: 2026-10-15
- Status: accepted
- Approver: participant (the organiser provides a Dokploy server, 1 CPU / 2 GB RAM for the app; the participant chose a Docker PostgreSQL over Supabase)
- Decision: the app ships as a Docker image (`Dockerfile`); the container runs `db:migrate` (idempotent) and then `next start` on port 3000. The database is a PostgreSQL service created inside Dokploy, reached over Dokploy's private network by its single-label service name. Production configuration now accepts a database host without TLS only when the host name has no dot (a private container network); every other host still requires `sslmode=require|verify-ca|verify-full`.
- Supersedes the Vercel plan in `DEPLOYMENT.md` §3 for the competition deployment.

## Pending decisions
Record after actual review: runtime model (after benchmark); realtime provider; production Postgres host; runner/isolation model; STT/TTS provider and retention; community/profile visibility defaults after safety review; exact dependency versions and hosting setup.
