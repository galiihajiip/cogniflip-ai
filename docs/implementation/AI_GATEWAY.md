# AI Gateway (BLOCK 17)

## What exists
| Part | File | Behavior |
|---|---|---|
| Provider contract | `src/server/ai/provider.ts` | Structured request: trusted `instructions` and untrusted input kept separate, plus JSON schema, output-token bound, timeout and abort signal. Normalized error codes with retry flags |
| Gemini adapter | `src/server/ai/gemini-provider.ts` | `@google/genai` 2.25.0 `models.generateContent`:<br>• instructions go in `systemInstruction`; the answer is wrapped in `<jawaban_murid>` (closing tag neutralised);<br>• `responseMimeType: application/json` and `responseJsonSchema`, converted to Gemini's supported subset;<br>• `temperature: 0`, `maxOutputTokens`, timeout via `AbortController` and `httpOptions.timeout`;<br>• SDK retries off (`attempts: 1`).<br>Maps HTTP 429/401/403/4xx/5xx/504, `MAX_TOKENS`, safety blocks and empty output to provider errors |
| Gateway | `src/server/ai/gateway.ts` | Input validation (empty/over 2,000 chars rejected before any call), local per-key rate limit, at most 2 attempts. Only rate limits, outages and invalid output are retried, with 250 ms backoff; timeouts are not, so the child doesn't wait twice. Output goes through `validateAssessmentOutput` and deterministic scoring. Results: `ok` or an error code `PROVIDER_UNAVAILABLE` / `PROVIDER_TIMEOUT` / `INVALID_MODEL_OUTPUT` / `RATE_LIMITED` / `VALIDATION_ERROR`, **never a score on failure** |
| Logging | `ai_call` events | Purpose, provider, mode, prompt version, lesson id, attempt, latency, outcome, token counts, validation problem names. **No answer text, no output text, no keys** (redaction also scrubs `AIza…` keys) |
| Factory | `src/server/ai/index.ts` | Mock when `AI_MOCK_MODE=true` (refused in production), Gemini when the AI group is configured, otherwise `null` → `PROVIDER_UNAVAILABLE` |
| Dev mock | `src/server/ai/dev-mock.ts` | Returns the benchmark fixture's label for an exact-match answer, otherwise a clarification. Every hint and question starts with `[Mode uji]`, model `mock:deterministic`, status `mode: "mock"` |

## Verified
- `tests/unit/ai-gateway.test.ts` (25 tests) covers:
  - success, malformed JSON and schema failure (each retried once);
  - timeout (not retried), rate limit and outage (with backoff), unconfigured provider;
  - local rate limit, pre-call input validation, and log redaction (no key, no answer text);
  - the Gemini request shape and error mapping, using a fake SDK client;
  - schema conversion.
- `npm run benchmark` with no key writes `NOT_RUN`. With `BENCHMARK_MODE=mock` it completes through the real gateway, contract and scoring. Those metrics are perfect **by construction** (the mock returns the labels), which proves wiring only, **not** AI quality.

## NOT VERIFIED (needs your Gemini key)
- **No call to the real Gemini API has been made.** Request acceptance of the converted schema, real response shapes, latency, Indonesian quality and cost are all unverified.
- **API rate limits for your tier** are unknown.

## Manual live verification (you run it; never paste the key into chat)
1. Use a **paid** Gemini API key (free-tier content is used by Google to improve products) and read D-008 / ADR-007 about the under-18 terms.
2. Put in `.env.local` (git-ignored):
   ```
   LLM_PROVIDER=gemini
   LLM_API_KEY=<your key>
   LLM_MODEL=gemini-3.8-flash
   ```
3. Run `npm run benchmark`. Expect `benchmark/reports/<time>-live-gemini-3.8-flash.json` with `status: COMPLETED`.
   - If `schemaValidity` is low, check the server log `ai_call` problems; Gemini may reject or ignore parts of the schema.
4. Repeat with `LLM_MODEL=gemini-3.5-flash-lite`. Compare as described in `BENCHMARK.md` and record the decision in ADR-007.
5. Commit the chosen live reports with `git add -f benchmark/reports/<file>`. They contain synthetic answers and metrics only.
