# Observability, Errors, and Recovery

## Error categories
Separate input validation, authentication/authorization, AI provider unavailable/timeout/rate-limit/refusal/invalid output, insufficient assessment evidence, database/conflict errors, unsupported toolchain, tool unavailable, compile/test/runtime failure, timeout/resource limit/sandbox rejection, voice permission/provider/transcription/synthesis failure, realtime disconnection/unauthorized room/stale event/room expiry, and restricted/moderated content.

A timeout is not a compile error. Provider unavailability is not a learner error. Invalid model JSON is not a zero/default score.

## User-facing recovery
- Explain in plain Indonesian what could not finish.
- State whether work was saved.
- Preserve unsaved answer/code when reasonable.
- Retry only when safe.
- Provide text fallback when voice is unavailable.
- Provide “AI review only; tools unavailable” when generic review remains possible.
- Do not show full stack traces, credentials, internal prompts or private provider payloads.

## Traceability
External requests have correlation IDs and provider/job IDs where possible. Store operation, start/end, provider/model/tool version, status, latency, retry count and sanitized failure category. Avoid personal content in generic logs.

AI logs can include role, schema version, terminal status, and concise decision/evidence summary, not hidden chain-of-thought.

## Alerting and kill switches
Define thresholds for provider errors, malformed assessment output, runner failures/timeouts, abnormal costs, realtime outage and moderation backlog. Provide feature flags to disable voice, community, multiplayer or arbitrary execution without disabling the core lesson path.

## Incident record
For notable issues, record actual time, impact, feature, evidence, mitigation, fix, verification and follow-up. Avoid unnecessary child data and secrets in artifacts.
