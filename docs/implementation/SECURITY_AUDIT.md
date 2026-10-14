# Security and Child-Privacy Audit (BLOCK 53)

- Date: 2026-10-13 (WIB). Scope: the code at this commit. Reviewed against `docs/10` and `docs/11`.
- This is a self-review by the coding assistant with automated checks. **No professional penetration test has been performed.**

## Automated checks run
| Check | Command / method | Result |
|---|---|---|
| Production dependency advisories | `npm audit --omit=dev` | **0 vulnerabilities** |
| All dependency advisories | `npm audit` | 5 high, all one dev-only chain (`braces` ← `micromatch` ← `fast-glob` ← `@next/eslint-plugin-next`); not shipped; fix only via breaking `--force` |
| Secrets in the entire Git history | regex scan of `git log -p --all` (Anthropic/Google/AWS/GitHub keys, private keys, JWTs; names only) | **0 hits** |
| Secrets in the browser bundle | build with fake secrets, grep `.next` (BLOCK 07/08) | 0 hits |
| Every state-changing route checks Origin | grep of `src/app/api` | all POST/PATCH/DELETE routes call `assertSameOrigin` |
| Every JSON body is schema-validated | grep of `src/app/api` | all `readJsonBody` routes use `parseInput` (strict schemas) |
| Security headers on a live server | `next start`, `curl -D -` | present: `nosniff`, `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'…`, `Referrer-Policy`, `Permissions-Policy` (camera/mic/geolocation off); no `X-Powered-By` |

## Findings
| # | Severity | Finding | Status / evidence |
|---|---|---|---|
| S1 | **High (policy)** | Runtime AI provider is Gemini, whose terms forbid services likely used by under-18s; free tier uses inputs for training and human review | **Accepted by the participant** (D-008). Not a code defect. Mitigations: provider-neutral adapter, no personal data sent, paid tier recommended |
| S2 | Medium | No security headers | **Fixed** in this block (`next.config.ts`); verified live |
| S3 | Medium | Mission attempts (predict/reflect) had no rate limit, so storage could be filled | **Fixed:** 30/min per learner; test `missions.test.ts` (31st → 429) |
| S4 | Medium | Rate limits are per server instance (in memory); on serverless they multiply with instances | **Open.** Mitigation: hosting WAF rule on `/api/*` (Vercel WAF, 1 rule on Hobby) and provider quotas. Documented in `rate-limit.ts` |
| S5 | Medium | No privacy/safety page or in-product AI disclosure yet (Anthropic and Google guidelines, `docs/10` §1–2) | **Blocked** by UI (D-009); proposed screen ST-26 |
| S6 | Medium | Guardian consent and legal review for child accounts not done | **Open** (ADR-004 follow-up); accounts should be treated as a demo |
| S7 | Low | Guest-session retention cleanup exists but is not scheduled | **Open:** schedule `deleteStaleGuestSessions` at deployment |
| S8 | Low | A taken handle is revealed at registration (enumeration) | **Accepted:** handles are public pseudonyms; registration is rate-limited |
| S9 | Low | Driver error messages (e.g. a unique-violation detail containing a handle) can reach server logs | **Accepted:** pseudonyms only; logs are redacted for secrets; no learner answers or code are logged |
| S10 | Info | Dev-only dependency advisories | **Open:** re-check when `eslint-config-next` updates |

## Controls verified by tests (not re-run here; see each file)
| Area | Controls | Tests |
|---|---|---|
| Auth/session | scrypt hashes, httpOnly SameSite=Lax cookies (Secure in production), hashed tokens, revocation, refresh, neutral login errors, login/registration limits | `auth.test.ts`, `auth.integration.test.ts` |
| Authorization | owner-only sessions, history, profile and missions; two-account tests; deletion cascades | `*.integration.test.ts` |
| Client-trusted values | strict schemas reject `score`, `role`, `xp`, `userId` fields; XP is server-derived and append-only | `schemas.test.ts`, `rewards.integration.test.ts`, `missions.test.ts` |
| Prompt injection | learner text and code sent as delimited data; strict output contracts; evidence must be quoted; reference answers cannot leak | `ai-contract.test.ts`, `ai-gateway.test.ts`, `code-review.test.ts` |
| XSS | JSON-only API; no HTML rendering of user content; future UI must keep React escaping (no `dangerouslySetInnerHTML`) | — |
| CSRF | SameSite=Lax plus Origin check on every write | `api-learning.test.ts`, auth integration |
| SSRF | no user-controlled outbound URLs; the only outbound call is the configured AI provider | code review |
| Code execution | disabled; `/api/code/run` → 422; isolation gate | `execution.test.ts` |
| Realtime/community/voice | not built and not reachable | — |
| Deletion/retention | account deletion cascades; guest cleanup function | integration tests |

## Release decision
No unresolved **critical** code findings. One **high** policy risk (S1) has been explicitly accepted by the participant. Open medium items S4–S6 must be handled or disclosed before real children use a public deployment.
