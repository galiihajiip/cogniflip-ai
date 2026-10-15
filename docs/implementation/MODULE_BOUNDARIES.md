# Module Boundaries

How code is organized so domain logic stays out of React components and route handlers. Status as of 2026-10-13. Folders marked *planned* do not exist yet; each is created with the first real code that needs it, not as an empty placeholder.

## Layers

| Layer | Location | May import | Must not import |
|---|---|---|---|
| Shared contracts | `src/shared/` (`schemas/`, `api/`) | `zod` | `@/server/*`, `@/app/*`, `server-only`, `next`, `react`, `pg` |
| Server services and domain | `src/server/` | `@/shared/*`, other `@/server/*`, `zod`, `pg` (db module only by convention) | `@/app/*`, `react`, `react-dom`, `next`, `next/*` |
| Routes, pages, components | `src/app/` | `@/shared/*`, `@/server/*` (server components and route handlers only) | `pg`, `@/server/db/migrator*` |
| Tooling | `scripts/`, `db/` | anything needed | — (never imported by the app) |

Enforced by ESLint `no-restricted-imports` in `eslint.config.mjs`. Every server module imports `server-only`, so client code that reaches one fails the Next.js build. Both mechanisms were checked with deliberate violations (lint exit 1).

Route handlers stay thin: read input (`readJsonBody`), validate (`parseInput`), call one service, and return `contractResponse(schema, …)`. Business rules live in services.

## Domain modules

| Domain | Module | Status |
|---|---|---|
| Configuration | `src/server/config/env.ts` | Implemented (BLOCK 07) |
| HTTP envelope, request parsing, response contracts | `src/server/http/` | Implemented (BLOCK 07, 09) |
| Logging and redaction | `src/server/log/` | Implemented (BLOCK 07) |
| Integration status | `src/server/integrations/` | Implemented (BLOCK 07, 08) |
| Persistence | `src/server/db/` | Connection, health, migrations (BLOCK 08); no tables yet |
| Learning (paths, lessons, sessions) | `src/server/learning/` | *planned*: R2, R4 |
| Assessment and deterministic scoring | `src/server/assessment/` | *planned*: R2.7, R3 |
| AI provider gateway and agents | `src/server/ai/` | *planned*: R3, R15 |
| Code intelligence (registry, review, execution adapters) | `src/server/code/` | *planned*: R8–R10 |
| Realtime rooms | `src/server/realtime/` | *planned*: R13 (no provider decided) |
| Community and moderation | `src/server/community/` | *planned*: R14 |
| Authorization (identity, ownership, roles) | `src/server/authz/` | *planned*: R5 (no auth provider decided) |

Rules that apply to all domains (`CLAUDE.md` §5–7):
- **Authorization and scoring stay in deterministic services.** AI agents never decide them.
- **Validate untrusted data at runtime with a schema.** That covers HTTP, query strings, model output and stored JSON. TypeScript types alone are not validation.
- **One schema per contract.** Types come from `z.infer`; never redeclare a type by hand.
