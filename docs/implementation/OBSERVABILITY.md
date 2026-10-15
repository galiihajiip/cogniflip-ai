# Observability, Limits and Cost Controls (BLOCK 56)

## Structured server log events (JSON lines, redacted)
| Event | Fields | Never contains |
|---|---|---|
| `api_request` | correlationId, method, path, status, durationMs | query strings, bodies, cookies, headers |
| `api_error` | correlationId, code, internal message, cause (redacted) | stack traces sent to clients; secrets |
| `ai_call` | purpose, provider, mode, promptVersion, lessonId/missionId/language, attempt, latency, outcome, token counts, validation problem names | learner answers, code, model output text, keys |
| `agent_step` | workflow, agent, status, duration, calls, model, mode | content |
| `db_health_unreachable`, `db_pool_error` | redacted error | connection strings |
| `rewards_sync_failed` | redacted error | — |

All entries go through `redact()`, which removes sensitive keys, token patterns (`sk-`, `AIza…`, Bearer, JWT), passwords inside connection strings and current secret values.

## Health
`GET /api/status` (per-integration availability and reason, with a live database check) and `GET /api/health/database`. Neither reveals hosts, users, names or credentials.

## Limits (per server instance unless noted)
| What | Limit | Where |
|---|---|---|
| AI calls per learner key | `AI_MAX_REQUESTS_PER_MINUTE` (default 10/min) | gateway limiter |
| AI calls per tutor session | `AI_MAX_CALLS_PER_SESSION` (default 6) | session engine |
| AI attempts per request | 2 (retry only rate limit, outage, invalid output) | gateway |
| AI timeout | `AI_TIMEOUT_SECONDS` (default 30 s) plus orchestrator wall budget | gateway, orchestrator |
| AI output | evaluator 1,200, code review 2,000, diagnosis 400 tokens | gateway tasks |
| Input size | answer 2,000 chars; code 20 KiB / 500 lines; JSON body 16 KiB (24 KiB for code) | schemas, `readJsonBody` |
| Session creation | 20/min per IP | `/api/sessions` |
| Mission attempts | 30/min per learner | `/api/missions/:id/attempts` |
| Login | 5/15 min per handle, 20/15 min per IP | auth service |
| Registration | 5/hour per IP | auth service |
| Code execution | disabled | ADR-003 |

## Cost controls and kill switches
- `AI_DISABLED=true`: no AI calls at all (mock included); `/api/status` shows `ai: disabled`; lessons and missions keep working without AI scoring (provider-unavailable states, never fake scores).
- **Gemini spend:** set a billing budget and alerts in Google Cloud for the API key's project, and use a paid tier (D-008). This is **manual and not verified**.
- **Estimated AI cost:** about $0.018 per lesson session with `gemini-3.8-flash` at 2026 prices (ADR-007, **not measured**).

## Alerting (manual today)
- Vercel Hobby keeps runtime logs for 1 hour. Check `ai_call` outcomes (`timeout`, `rate_limited`, `invalid_output`) and `api_request` 5xx counts after deploying.
- **No automatic alerting is configured.** No heavyweight observability stack was added: there is no deployment or traffic yet to justify one.

## Verified
`tests/unit/observability.test.ts`:
- the kill switch beats the mock and the key, status reports `disabled`, and code review returns 503;
- `api_request` has method, path, status and duration, and excludes query, cookie and body.

Earlier tests cover redaction and every limit listed above.
