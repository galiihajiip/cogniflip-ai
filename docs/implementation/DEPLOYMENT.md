# Deployment Runbook (BLOCK 57–59)

**Status: NOT DEPLOYED.** I can't deploy from here:
- GitHub CLI login fails;
- there is no Git remote;
- the Vercel CLI and account aren't available;
- no production Postgres host has been chosen;
- no Gemini key is configured.

Nothing below has been performed against a real host. A local production build passed the smoke test (see end).


## Dokploy (competition server, D-017) — use this

1. **Database** (Dokploy → your project → *Create Service* → *Database* → **PostgreSQL**): name it e.g. `cogniflip-db`, set a strong password, deploy it. Copy the **internal** connection URL (host is the service name, no dot), e.g. `postgresql://postgres:<password>@cogniflip-db-xxxx:5432/postgres`. Do not expose it publicly.
2. **Application** (`app-peserta-18`) → *General* → Provider **GitHub** (public repo, branch `main`) → *Build Type* **Dockerfile** (path `Dockerfile`). If GitHub is not ready, *Drop* (upload a zip of the repo without `node_modules`, `.next`, `.env.local`) also works.
3. *Environment*:
   ```
   APP_BASE_URL=https://<the domain from the Domains tab>
   DATABASE_URL=<internal URL from step 1>
   LLM_PROVIDER=gemini
   LLM_API_KEY=<your Gemini key>
   LLM_MODEL=gemini-3.7-flash
   LLM_FALLBACK_MODELS=gemini-3.5-flash-lite,gemini-3.8-flash
   AI_TIMEOUT_SECONDS=60
   ```
   `APP_BASE_URL` must be exactly the public HTTPS origin (the app refuses cross-origin writes otherwise). Never set `AI_MOCK_MODE`.
4. *Domains*: add the domain, container port **3000**, HTTPS on.
5. *Deploy*. The container log should show `applied N migration(s)` (first time) or `nothing to apply`, then Next.js `Ready`.
6. Verify from your laptop: `npm run smoke -- https://<domain>` (12 checks), then sign in with the demo account in a browser.

## 0. Before deploying (blocking)
1. **Publish the content.** Production shows only reviewed, published lessons and missions. All of them are drafts today, so `/api/lessons` returns **0 lessons**. Follow `LESSON_REVIEW.md` (review, set `published`, `UPDATE_CONTENT_LOCK=1 npm run test`, commit).
2. **Stitch UI.** There are no learner screens yet (D-009). Without them, judges get a placeholder page and APIs only.
3. **Decide the Postgres host** (D-006 pending part). Any managed PostgreSQL 16+ with TLS works (for example Neon, Supabase Postgres, Railway, Render). Record the choice in `docs/20`.

## 1. GitHub (gate 2)
```bash
! gh auth login -h github.com          # run yourself in the prompt
gh repo create <name> --public --source . --push
gh repo view --json visibility          # must print PUBLIC
```
CI (`.github/workflows/ci.yml`) then runs for the first time; check both jobs pass.

## 2. Database
1. Create the database; copy its connection string **with `?sslmode=require`**.
2. From your machine, put it only in your shell or `.env.local`, never in Git or chat:
   ```bash
   DATABASE_URL='postgresql://…?sslmode=require' npm run db:status
   DATABASE_URL='postgresql://…?sslmode=require' npm run db:migrate
   ```
   Expect 5 migrations applied, then `db:status` shows 0 pending. Take a backup or snapshot first if the host supports it.
3. Schedule guest-session cleanup (`deleteStaleGuestSessions`, 30 days), for example a weekly SQL job on the host. **Not automated yet.**

## 3. Vercel (gate 6)
1. Import the GitHub repo in the Vercel dashboard (framework: Next.js; the defaults are correct). Node version: **24.x** (`engines` in `package.json`).
2. **Environment variables** (Production; set Preview separately with a separate database). Enter values in the dashboard only:
   | Name | Value |
   |---|---|
   | `APP_BASE_URL` | the production URL, e.g. `https://<project>.vercel.app` |
   | `DATABASE_URL` | production Postgres with `sslmode=require` |
   | `LLM_PROVIDER` | `gemini` |
   | `LLM_API_KEY` | your **paid-tier** Gemini key (see D-008 risk) |
   | `LLM_MODEL` | `gemini-3.7-flash` |
   | `LLM_FALLBACK_MODELS` | `gemini-3.5-flash-lite,gemini-3.8-flash` (tried when a model is overloaded, rate limited or too slow) |
   | `AI_TIMEOUT_SECONDS` | `60` (shared across the fallback models) |
   | optional | `AI_MAX_REQUESTS_PER_MINUTE`, `AI_MAX_CALLS_PER_SESSION`, `AI_TIMEOUT_SECONDS`, `AI_DISABLED` |

   **Never set** `AI_MOCK_MODE` in production; the app refuses to start if you do. Draft lessons and missions are shown by default (D-013); set `ALLOW_DRAFT_CONTENT=false` to hide them. The public demo account (`demo` / `FlipBot-Juara-2026`, D-014) is created automatically on its first login; no seeding step is needed.
3. Firewall: add one WAF rate-limit rule on `/api/` (Hobby allows 1), e.g. 60 requests/min per IP.
4. Google Cloud: set a billing budget and alerts for the Gemini key's project.
5. Deploy. Wait for Vercel to report success and give the URL. Only then record the URL and deployment id here.

## 4. Verify (BLOCK 58–59)
```bash
npm run smoke -- https://<project>.vercel.app
```
It must print `11/11 passed`. Additionally, by hand in a real browser (desktop and mobile):
- `/api/status` shows `ai: {available: true}` and `database: {available: true}`;
- run one live lesson answer through the API or UI and record the result;
- run `npm run benchmark` locally with the same model and commit the report (`AI_GATEWAY.md`).

Record the date and time, URL, browser, results and any screenshots **actually captured** in `docs/implementation/SMOKE_REPORT.md`.

## Stale styles after a build
On 2026-10-13 one local production build served CSS without the Stitch design tokens (unstyled pages) after a dev server had shared the same `.next` folder; a clean rebuild fixed it. `npm run smoke` now fails ("stylesheet contains the design tokens") when this happens. Fix: delete `.next` (or redeploy without the build cache in Vercel) and build again.

## Local evidence so far
2026-10-13 07:54 WIB: `next build` + `next start` (production mode) with the local Docker database, then `npm run smoke -- http://localhost:3150` returned **11/11 PASS**. Notes:
- AI was `not_configured` and lessons were `0` (drafts), as expected;
- cross-origin write → 403;
- code run → 422;
- history without identity → 401.
