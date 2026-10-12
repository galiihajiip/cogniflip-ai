# System Architecture

**Status:** Proposed baseline; verify current stable versions, policies, and costs before implementation. **Style:** modular web application with explicit service boundaries, persistent data/realtime, AI orchestration, and external isolated code execution.

## 1. Proposed stack
- Web: Next.js App Router, React, TypeScript.
- Styling: Tailwind CSS plus accessible reusable components; do not adopt a whole finished product template.
- Editor: Monaco as candidate for VS Code-like editing, subject to accessibility, mobile and bundle validation; choose a lighter editor if evidence favors it.
- Data: PostgreSQL through a managed provider such as Supabase.
- Auth: managed authentication with canonical user profile and server-side authorization.
- Realtime: private authorized channels for multiplayer; protected interactions must not rely on public broadcast.
- AI: provider-independent server adapter, structured-output validation, central orchestrator, bounded agents.
- Code execution: separate external sandbox/provider or isolated workers; never execute arbitrary code in a Next.js request process.
- Voice: STT/TTS provider adapters and browser capability fallback.
- Hosting: Vercel or another provider that meets route, region, environment and deployment constraints; long-running jobs stay external.
- Quality: type checks, lint, unit/integration/E2E tests, accessibility checks, AI evaluation fixtures, and security tests.

Do not blindly use “latest” dependencies. Check stable versions, compatibility, licenses, security advisories, pricing, and hosting/runtime constraints; pin selected versions in the lockfile.

## 2. Logical layers

### Presentation
Pages/components for learning path, tutor, editor, score/feedback, voice, profile, history, leaderboard, community, rooms, moderation and operations. No privileged keys or authoritative score/XP logic in client components.

### Application/API
Request validation, authentication, authorization, rate limits, input-size limits, orchestration, idempotency, domain transactions, safe errors. Recheck permission on every privileged server action.

### Domain services
- Learning/session service.
- Assessment/rubric/scoring service.
- AI orchestration and provider gateway.
- Code intelligence and language capability registry.
- Execution service client for submit/status/cancel.
- Voice session and speech provider adapter.
- Multiplayer room state/results/idempotency.
- Community/report/moderation lifecycle.
- Achievement and XP-ledger service.
- Account/privacy export/deletion service.

### Persistence
PostgreSQL for authoritative state with migrations/constraints. Use Row Level Security (RLS) where supported and suitable, plus explicit server-side authorization. A browser must not access private data by changing IDs.

### External services
LLM, speech-to-text/text-to-speech, code runner, recovery/email, monitoring, hosting/CDN. Every external failure has a recoverable user-visible state.

## 3. AI boundary
All model calls pass through a server-side gateway that enforces provider selection, request budgets, timeout, safe logging, schema validation, retry policy, and provider/model metadata. Agents do not get unrestricted database access or arbitrary tool privileges. Sequential calls are the default; parallelize only independent work. Every workflow has max steps/calls, wall-clock/time/cost budgets, cancellation, and terminal states.

## 4. Execution boundary
The main web application does not execute submitted code. Jobs go to isolated execution infrastructure with separate credentials and no access to app secrets or production database. Network is denied by default; limits are enforced outside the submitted process and tested. If isolation cannot be verified, disable arbitrary execution while retaining generic code review.

## 5. Realtime and concurrency
Room membership and actions are authorized server-side. Private channels or equivalent authenticated authorization are required. Durable state/results are persisted; ephemeral broadcast is not the source of truth for rewards or winners. Use idempotency keys and uniqueness constraints for reward-producing operations.

## 6. Lesson completion flow
1. Server creates/loads owned session.
2. Validate answer, ownership, lesson version, and input length.
3. Evaluator returns criterion-level assessments/evidence.
4. Application validates keys, levels, evidence references, rubric version, and policy.
5. Deterministic scoring engine computes total.
6. Transaction persists attempt and result.
7. Server-side idempotent event updates progress/achievements.
8. Leaderboard projection updates only when visibility is enabled and rules permit it.
9. UI displays persisted result or a clear unsaved/unavailable state.

## 7. Code analysis flow
1. Validate code size, declared language/context, owner and consent; never log full source by default.
2. Read registered capabilities and select allowed tools.
3. Run tools in appropriate isolated environment/provider.
4. Normalize outputs into evidence records.
5. AI reviewer receives code/context and sanitized tool evidence, not secrets.
6. Validate findings and source locations.
7. Report AI-only vs tool-verified findings.
8. Persist only under authorized ownership and retention rules.

## 8. Deployment model
- Preview/staging and production use different credentials/data.
- Migrations are documented and rehearsed.
- AI/sandbox keys stay server-side.
- Health endpoints do not expose secrets/configuration.
- A production URL smoke test is required after deployment.
- Add rate limits and spend controls before public sharing.

## 9. Related ADRs
See `decisions/ADR-001-stack.md` through `ADR-006-language-support.md`.
