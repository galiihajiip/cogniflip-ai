# ADR-007 — Runtime AI Provider and Model

- Status: provider **accepted** by the participant (`D-008`); model **provisional** until the benchmark runs (R3.9 / BLOCK 15).
- Date: 2026-10-13.
- The model used by the coding assistant to build this project is unrelated to the website's runtime model.

## Context
The tutor needs structured (JSON-schema) responses in Indonesian for evaluating short explanations by children in grades 4–6, with bounded latency and cost. ADR-005 requires a provider-neutral interface.

## Decision
- **Provider: Google Gemini API** via the official `@google/genai` SDK, behind `src/server/ai/provider.ts` (`AiProvider`). Only `LLM_PROVIDER=gemini` is accepted by configuration because it is the only adapter planned.
- **Primary model (provisional): `gemini-3.8-flash`.** Google's model page lists it as stable and recommends "3.5 Flash-Lite or 3.8 Flash" for new projects. Evaluation quality matters more than the small price difference at this scale.
- **Benchmark challenger: `gemini-3.5-flash-lite`** (cheaper, likely faster). Whichever performs better on the reviewed benchmark becomes primary.
- **No runtime fallback model.** A second live model adds cost, configuration and inconsistent grading. When the provider fails, the app shows an honest "AI tidak tersedia" state and never a score (BLOCK 13 outcomes).
- **Mock provider** (`src/server/ai/mock-provider.ts`): deterministic, labelled `mode: "mock"` and model `mock:deterministic`. It is enabled only by `AI_MOCK_MODE=true`, which configuration refuses in production.

## Evidence (official sources, fetched 2026-10-13)
| Topic | Finding | Source |
|---|---|---|
| Models | Stable text models: `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`. `gemini-2.0-*` shut down; 2.5 limited to previous users | https://ai.google.dev/gemini-api/docs/models |
| Price (paid) | 3.8 Flash: $0.75 in / $3.75 out per 1M tokens through 2026-12-31, then $1.50 / $7.50. 3.5 Flash-Lite: $0.30 / $2.50 | https://ai.google.dev/gemini-api/docs/pricing |
| Data use | Free tier: "Content used to improve our products". Paid tier: "Content **not** used to improve our products"; prompts logged for a limited time only for abuse detection | pricing page; https://ai.google.dev/gemini-api/terms |
| Structured output | JSON responses constrained by a JSON schema; Google's current docs show it with `gemini-3.8-flash`. The exact `@google/genai` config fields are to be confirmed from the installed SDK types in BLOCK 17 | https://ai.google.dev/gemini-api/docs/structured-output |
| SDK | `@google/genai` 2.28.0 (latest, 2026-10-07); Node ≥ 20 (3.0 will need ≥ 22). Project uses Node 24 | npm registry; SDK README |
| **Age terms** | "You must be 18 years of age or older to use the APIs" and no use in a service "directed towards or likely to be accessed by individuals under the age of 18". Vertex AI has an equivalent restriction | https://ai.google.dev/gemini-api/terms; https://cloud.google.com/terms/service-terms |

## Cost estimate (NOT VERIFIED; replace with measured usage from the benchmark)
Assume 3 calls per lesson session, each about 3,000 input and 1,000 output tokens. With `gemini-3.8-flash` at 2026 prices that is about **$0.018 per session**. Thinking or extra output tokens raise this. Prices double from 2027-01-01.

## Risks
1. **Provider terms conflict with the audience** (recorded in `D-008`). Google may suspend the key. The provider-neutral interface keeps a switch to a provider whose terms allow minors (for example Anthropic, see `docs/implementation/STACK_VALIDATION.md`) to a single adapter.
2. **Child data on the free tier** may be used to improve Google's products and read by human reviewers. **Use a paid tier.** Never send names or other personal data; only the lesson task and the learner's answer.
3. **Indonesian quality for children's informal writing: NOT VERIFIED.** It is measured by the benchmark (BLOCK 15).
4. **Rate limits are tier-dependent** and were not looked up for this account. Configure app-level limits (`AI_MAX_REQUESTS_PER_MINUTE`, `AI_MAX_CALLS_PER_SESSION`) and a WAF rule.

## Environment variables (names only)
`LLM_PROVIDER` (`gemini`), `LLM_API_KEY`, `LLM_MODEL`, optional `AI_MOCK_MODE`, `AI_TIMEOUT_SECONDS`, `AI_MAX_REQUESTS_PER_MINUTE`, `AI_MAX_CALLS_PER_SESSION`. You set them in `.env.local` and the hosting dashboard; never paste them into chat or commit them.

## Evaluation plan
Run the BLOCK 15 benchmark on both candidate models with the same fixtures, then choose on:
1. per-criterion agreement with reviewed labels;
2. false-pass rate on misconceptions;
3. false-fail rate on correct paraphrases;
4. evidence validity;
5. schema validity;
6. latency and measured cost.

Record the result and the chosen model here and in `docs/20_DECISION_LOG.md`. Until then the model is provisional.
