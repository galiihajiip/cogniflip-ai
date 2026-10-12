# ADR-001 — Proposed Web Stack

- Status: proposed; verify before implementation.
- Date: 2026-10-12.

## Context
CogniFlip needs a child-friendly web UI, code editor, secure server-side AI access, persistent user data, realtime rooms, community, and judge-accessible deployment. A consistent TypeScript web stack can reduce context switching and simplify end-to-end tests.

## Proposed decision
Use Next.js App Router, React, TypeScript, Tailwind CSS, managed PostgreSQL/auth/realtime such as Supabase, and hosting such as Vercel. Keep AI and code-runner operations behind server-side adapters. Use a browser editor such as Monaco only after verifying accessibility, bundle cost, mobile behavior and license.

## Consequences
Benefits: typed contracts, one primary web codebase, managed auth/data/realtime and familiar deployment. Trade-offs: platform/runtime limits, provider-specific auth/RLS configuration, editor bundle/accessibility concerns, vendor dependence.

## Validation before acceptance
Check current stable versions, quotas/pricing, data/region terms, route/job duration, realtime authorization, deployment compatibility, editor accessibility/mobile behavior and judge access. Record the actual accepted decision in the decision log.

## Evidence and recommendation (2026-10-12)
Evidence: `docs/implementation/STACK_VALIDATION.md` (official docs and npm registry, checked 2026-10-12). Status stays **proposed** until the participant approves and the decision is recorded in `docs/20_DECISION_LOG.md`.

Recommended amendments to the proposed decision:
- Runtime: Node.js 24 LTS locally and on Vercel (installed v26 is a non-LTS line; Vercel offers only 24.x/22.x).
- Framework: Next.js 16.x App Router + React 19.3 + Tailwind CSS 4.3 + Zod 4, scaffolded with official `create-next-app`.
- Editor: CodeMirror 6 instead of Monaco. Monaco's README states it is not supported in mobile browsers, which conflicts with the child/mobile requirement in `docs/02` §F.
- Data/auth/realtime: Supabase remains the candidate but is deferred until accounts/history start; the core guest lesson needs no database.
- Hosting: Vercel Hobby for the competition build, with one WAF rate-limit rule; commercial-use classification of a competition entry is not verified.
- Tests: Vitest 5, Playwright 1.64, `@axe-core/playwright`.

## Database amendment (2026-10-13)
Accepted by the participant as `D-006` in `docs/20_DECISION_LOG.md`: provider-neutral PostgreSQL through the `pg` driver in server-only code, with forward-only SQL migrations (`db/migrations/`, policy in `db/README.md`). Local development and integration tests use a throwaway Docker Postgres. This supersedes the Supabase database proposal above; auth and realtime remain open decisions.
