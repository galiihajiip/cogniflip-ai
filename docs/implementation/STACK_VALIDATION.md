# Stack Validation — Evidence and Recommendations

- Checked: 2026-10-12, between about 16:10 and 16:40 WIB. Nothing was installed.
- Method: npm registry metadata (`npm view`, read-only), the official Node.js release index, and official vendor documentation fetched on that date. Vendor pages change, so re-check before relying on any limit or price.
- Status: **recommendations awaiting participant approval.** Nothing here is an accepted decision until it is recorded in `docs/20_DECISION_LOG.md`.
- Language/framework support: nothing in this document verifies support for any programming language in CogniFlip's code review. That stays unverified until real adapter tests exist (ADR-006).

## 1. Version snapshot (npm registry, 2026-10-12)

| Package | Latest | Published / modified | Engines (node) | Note |
|---|---|---|---|---|
| `next` | 16.4.0 | 2026-10-06 | >=20.9.0 | Peer: React ^19 |
| `react`, `react-dom` | 19.3.0 | 2026-10-08 | — | |
| `typescript` | 7.0.2 (6.x line: 6.0.3) | 2026-07-08 | — | Next.js states minimum TS 5.1 |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | 2026-10-09 | — | |
| `zod` | 4.6.6 | 2026-10-11 | — | Runtime validation |
| `@anthropic-ai/sdk` | 0.133.0 | 2026-10-09 | — | |
| `openai` | 7.32.0 | 2026-10-09 | >=22.0.0 | Alternative, not evaluated in depth |
| `@google/genai` | 2.28.0 | 2026-10-07 | — | Alternative, not evaluated in depth |
| `ai` (Vercel AI SDK) | 7.0.137 | 2026-10-09 | >=22 | Not recommended (see §3) |
| `@supabase/supabase-js` | 2.117.3 | 2026-10-09 | >=22.0.0 | |
| `@supabase/ssr` | 0.12.7 | 2026-09-08 | — | Still 0.x |
| `monaco-editor` | 0.57.0 | 2026-09-24 | — | MIT; unpacked size about 101.7 MB |
| `@monaco-editor/react` | 4.7.0 | 2025-11-21 | — | |
| `@codemirror/view` | 6.43.14 | 2026-10-07 | — | MIT; unpacked size about 1.3 MB |
| `@uiw/react-codemirror` | 4.25.12 | 2026-09-24 | — | Optional React wrapper |
| `vitest` | 5.0.3 | 2026-09-30 | — | Unit tests |
| `@playwright/test` | 1.64.0 | 2026-10-12 | >=20 | E2E tests |
| `@axe-core/playwright` | 4.13.0 | 2026-10-09 | — | Automated accessibility signal |
| `eslint` | 10.12.0 | 2026-10-02 | — | |

Unpacked size is a package-size signal, not a measured browser bundle size. The bundle must be measured at R1.8/R8.2.

**Node.js:** the installed v26.8.2 is the *Current* line, not LTS (`nodejs.org/dist/index.json`: `lts=false` for every v26 release). The active LTS lines are v24 (Krypton, latest 24.21.0) and v22 (Jod, latest 22.23.3). Vercel offers 24.x (default) and 22.x only.

## 2. Decision table

| # | Area | Recommendation | Rationale (evidence) | Operational cost / risk | Approval needed? |
|---|---|---|---|---|---|
| S1 | Node.js runtime | **Node 24 LTS** locally and on Vercel; pin `"engines": {"node": "24.x"}` and add `.nvmrc`. | Local v26 is non-LTS. Vercel deploys only 24.x/22.x, so developing on 26 risks "works locally, fails deployed". Next.js needs >=20.9; Supabase and OpenAI SDKs need >=22. | Participant must install Node 24 (e.g. via a version manager); I will not install it. Low risk. | **Yes** (local install is your action) |
| S2 | Package manager | **npm** (11.x, bundled with Node). | Zero extra tooling; Vercel detects it from `package-lock.json`; pnpm 11 is also installed and would work equally well. | None. | Default unless you prefer pnpm |
| S3 | Web framework | **Next.js 16.x App Router** (16.4.0 at scaffold time), React 19.3, scaffolded with official `create-next-app`. | Official docs (16.4.0): default setup enables TypeScript, Tailwind, ESLint, App Router and Turbopack. It also adds an `AGENTS.md` for coding agents. Supported browsers: Chrome/Edge/Firefox 111+, Safari 16.4+. | 16.4.0 is only 6 days old; if a regression appears, fall back to the latest 16.3.x patch. The generated `AGENTS.md` would collide with our existing `AGENTS.md`, so decline that option or merge it deliberately. | Confirms ADR-001 |
| S4 | TypeScript | Use the version `create-next-app` installs, then run `tsc --noEmit` immediately. If TS 7 breaks the Next.js type plugin or tooling, pin TS 6.0.3. | Latest is 7.0.2 (a major release); Next.js documents only a minimum (5.1). TS 7 compatibility with Next.js 16 is **NOT VERIFIED**. | Small risk of tooling friction on day one; quick to detect. | No |
| S5 | Styling | **Tailwind CSS 4.3**, mapped to the approved Stitch tokens. | Tailwind v4 requires Chrome 111, Safari 16.4 and Firefox 128 — consistent with Next.js 16's own floor. | Very old school devices (pre-2023 browsers) will render incorrectly. Accept this and state the supported browsers in the README. | No |
| S6 | Runtime validation | **Zod 4** for every API payload, model output and lesson/rubric file. | Required by `CLAUDE.md` §5 and `docs/07` §1; the Anthropic SDK offers schema-validated parsing (structured outputs). | None. | No |
| S7 | Runtime AI provider | **Anthropic Claude via the official `@anthropic-ai/sdk`**, behind our own `TutorModelProvider` interface in server-only code. Use structured outputs (JSON-schema constrained responses) and re-validate with Zod. | Commercial/API inputs and outputs are **not used for training by default**. API data is deleted within **30 days** by default; flagged content can be kept up to 2 years. Anthropic's Usage Policy allows products serving minors only with added safeguards (see §4). | Model choice drives cost (§3). The key must be server-only. A Console workspace spend limit gives a hard monthly cap. | **Yes** — provider and model |
| S8 | Auth, database, realtime | **Supabase, deferred** until F11/F12 start. If guest sessions need an identity, use Supabase anonymous sign-ins with CAPTCHA. Realtime (F16) uses private channels with RLS on `realtime.messages` and "Allow public access" turned off. | Free plan: 500 MB database, 50,000 MAU, 200 concurrent realtime connections, 2 M realtime messages/month, 5 GB egress, 2 active projects. **Projects pause after 1 week of inactivity.** Anonymous users share the `authenticated` role; policies must check `is_anonymous`. Default anonymous sign-in limit: 30/hour per IP. | Pausing could take the judged site offline during 16–24 Oct if history features depend on it; schedule a keep-alive check or upgrade. The S1 build needs no database at all. | Yes (deferral) |
| S9 | Browser editor | **CodeMirror 6**, lazy-loaded, instead of Monaco. | Monaco's own README FAQ: "Is the editor supported in mobile browsers…? **No.**" CodeMirror's site lists mobile support using native selection and says it "works well with screen readers and keyboard-only users"; MIT licensed; much smaller package. | Fewer VS Code-like features than Monaco; acceptable for children. Revisit only for an advanced desktop mode. | **Yes** (amends ADR-001's candidate) |
| S10 | Unit/integration tests | **Vitest 5**. | Current major; native TypeScript/ESM; fast. | None. | No |
| S11 | E2E and accessibility tests | **Playwright 1.64** with mobile emulation, plus `@axe-core/playwright` as an automated signal. | Playwright supports Node 22/24/26, macOS 14+, Chromium/Firefox/WebKit, and Android Chrome / Mobile Safari emulation. | Browser downloads are large; CI time. Automated accessibility checks are signals, not proof (`docs/12` §8). | No |
| S12 | Hosting | **Vercel Hobby** for the competition build, Node 24.x, plus **one WAF rate-limit rule** on the AI API route. | Hobby: free; function max duration 300 s; 1 M invocations; 4 active CPU-hours; runtime logs kept 1 hour; WAF rate limiting available with 1 rule per project, IP key, 10 s–10 min window. | Hobby is "non-commercial personal use only"; a competition entry with no payments or ads appears non-commercial, but prize money is a grey area (**NOT VERIFIED**; ask Vercel support or use a Pro trial). 1-hour logs make post-incident debugging hard. | **Yes** (Hobby vs Pro trial) |
| S13 | Code execution provider | **No runner in the competition build.** Keep only the adapter interface and capability registry. | ADR-003: execution stays disabled until isolation is verified. Predict-before-run can use reviewed fixtures (`docs/18` §5). No runner was evaluated in this block. | Zero cost; honest "not available" state. | Already governed by ADR-003 |
| S14 | Speech (STT/TTS) | **Not evaluated; out of the competition build.** | Traceability Q10 privacy concern; no provider terms reviewed. | None now. | Later |

## 3. AI model cost and choice

Prices are Anthropic first-party API rates per million tokens, from the Claude API reference bundled with Claude Code (cached 2026-10-06). Re-check on Anthropic's pricing page before approving.

| Model (ID) | Input $/MTok | Output $/MTok | Rough cost per lesson session* |
|---|---|---|---|
| Claude Opus 5.5 (`claude-opus-5-5`) | 4.00 | 20.00 | about $0.10 |
| Claude Sonnet 5.5 (`claude-sonnet-5-5`) | 2.00 | 10.00 | about $0.05 |
| Claude Haiku 5.5 (`claude-haiku-5-5`) | 0.10 | 0.50 | about $0.003 |

\*Assumption, **NOT VERIFIED**: about 3 model calls per session, each about 3,000 input and 1,000 output tokens. Thinking tokens are billed as output and can raise these numbers. Replace these figures with measured `usage` values from the R3.9 benchmark.

- **Recommended default:** start the R3.9 benchmark with Claude Opus 5.5, and run the same fixtures on Sonnet 5.5 and Haiku 5.5. Choose on measured agreement with the reviewed labels (false-pass/false-fail), latency and cost. Choosing a cheaper model is your decision.
- Opus 5.5 always uses thinking (effort controls depth, default `medium`). Use `low` effort for the tutor and feedback calls, and measure latency, because children will be waiting.
- **Not recommended:** the Vercel AI SDK (`ai`) as the abstraction. Our own thin interface keeps the dependency surface small and keeps the provider swappable, which ADR-005 requires.
- OpenAI and Google SDKs exist and are current, but their data-use and minors terms were **not evaluated** in this block. Evaluate them before switching.

## 4. Child safety and privacy implications

From Anthropic's Usage Policy and its "Guidelines for Organizations Serving Minors" support article (fetched 2026-10-12):

- **Required:** "Organizations must disclose to their users that they are interacting with an AI system rather than a human." This is already `docs/10` §2. The landing page and tutor screen must show it every session.
- **Recommended by Anthropic:** age verification; content moderation and filtering; monitoring and reporting; educational guidance for minors; a child-safety system prompt; compliance with applicable child-safety and data-privacy law, stated publicly on the website.
- **Implication for CogniFlip:**
  - add a public, plain-language privacy and safety page (`/privasi`) before the URL is shared;
  - keep the tutor's input and output bounded to the lesson and moderate off-topic or unsafe text;
  - never send names or other personal data to the model;
  - tell learners and guardians, in age-appropriate words, that answers are processed by an external AI provider and deleted by the provider within 30 days by default.
- Legal review of the actual deployment (for example Indonesia's personal-data law and organizer rules) is **NOT VERIFIED** and remains the participant's responsibility (ADR-004 follow-up).
- Supabase anonymous sign-ins avoid collecting child emails if an identity is ever needed for guests.

## 5. Cost controls before the URL is public

1. Anthropic Console: a dedicated workspace for CogniFlip with a low monthly spend limit. Workspace limits cannot be set on the default workspace; when the limit is hit, API use pauses until the next month.
2. Vercel WAF: 1 rate-limit rule on the AI route (e.g. a fixed window per IP).
3. Application: per-session call budget (Traceability Q7), input-length limits, and timeouts.
4. If the limit is reached, the app shows an honest "AI is not available right now" state and never a fake score.

## 6. Official references

- Next.js installation (v16.4.0 docs): https://nextjs.org/docs/app/getting-started/installation
- Node.js release index: https://nodejs.org/dist/index.json
- Vercel supported Node.js versions: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby
- Vercel fair use / commercial usage: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel WAF rate limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- Tailwind CSS compatibility: https://tailwindcss.com/docs/compatibility
- Supabase pricing: https://supabase.com/pricing
- Supabase anonymous sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Realtime authorization: https://supabase.com/docs/guides/realtime/authorization
- Monaco Editor README (mobile FAQ): https://github.com/microsoft/monaco-editor
- CodeMirror: https://codemirror.net/
- Playwright system requirements: https://playwright.dev/docs/intro
- Anthropic Usage Policy: https://www.anthropic.com/legal/aup
- Anthropic, guidelines for organizations serving minors: https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors
- Anthropic, data use for training: https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training
- Anthropic, organization data retention: https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- Anthropic, workspaces and spend limits: https://platform.claude.com/docs/en/manage-claude/workspaces
