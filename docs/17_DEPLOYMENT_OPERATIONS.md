# Deployment and Operations

## Environments
- Local: local variables, non-production data, mocks only in isolated tests.
- Preview/staging: separate database/provider credentials and sanitized test data.
- Production: separate secrets/data, allowed origins, rate limits, error monitoring and AI/code-runner spend controls.

Never use production service-role credentials in browser code. Never commit `.env`, API keys, recovery/signing secrets, runner credentials or private provider tokens.

## Configuration categories
Exact environment-variable names depend on selected providers and must be finalized during implementation:
- Public application origin.
- Database/server connection credentials.
- Auth public config and server verification secret.
- LLM provider key/model.
- STT/TTS providers and keys.
- External code runner endpoint/token.
- Monitoring DSN/credentials if enabled.
- Rate, timeout and cost limits.

Only genuinely public values may be browser-exposed. Review every client-public variable before use.

## Deployment procedure
1. Verify runtime compatibility and dependency lockfile.
2. Install documented dependencies.
3. Apply migrations and seed only reviewed public curriculum content.
4. Configure auth callback/origin allowlists.
5. Configure server-only AI and code-runner credentials.
6. Configure authorized private realtime channels before enabling rooms.
7. Deploy preview, run smoke tests, inspect logs, and test a complete lesson flow.
8. Promote only after acceptance criteria pass.

## Migrations and data safety
- Keep migrations small, reviewable, and reversible where possible.
- Test on a non-production database first.
- Document destructive changes and retention consequences.
- Keep backup/restore guidance for persistent history.
- Never test destructive changes against production without a safe process.

## Monitoring
Track aggregate request success, error category, provider latency, timeout/rate-limit rate, invalid model-output rate, runner completion/failure, realtime disconnects and usage/cost. Do not log full learner content, source code, tokens or audio in generic logs by default. Use correlation IDs; logs must not expose secrets, private transcripts, system prompts or hidden chain-of-thought.

## Cost controls
Set input/output limits, per-user request rates, per-session agent-call budget, and per-job execution quotas. Cache only non-personal, safe, versioned content. Add kill switches for expensive AI/voice/code-running features. Retry only safe operations; use idempotency for writes.

## Rollback and incidents
Document feature-flag disablement, secret rotation, session revocation, bad deployment/migration rollback, and data recovery. For sandbox risk or cross-user exposure, disable execution and investigate before enabling again. For child-safety incidents, restrict affected feature and follow moderation/escalation procedure.

## Post-deployment smoke test
- Landing/navigation load.
- One lesson completes through real configured AI provider.
- Provider failure is handled without fake score.
- Authenticated history is readable only by owner.
- Mini IDE shows real capability status.
- Any enabled runner executes a reviewed safe fixture and reports actual status.
- Community/rooms/voice are enabled only after their gates pass.
- Mobile layout and browser console/network errors are checked.
