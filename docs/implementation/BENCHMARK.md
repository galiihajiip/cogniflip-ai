# Assessment Benchmark (`bench-v1`)

Measures how well a model's criterion ratings agree with reviewed labels **before** prompts or a model are chosen (ADR-007 evaluation plan, `docs/12` §6).

## Current state (2026-10-13)
| Item | Status |
|---|---|
| Dataset | 27 synthetic items across 3 lessons: 21 lesson fixtures (7 kinds × 3) + 3 informal paraphrases + 1 long-but-valid + 1 empty + 1 too-long |
| Labels | **Proposed** (AI-drafted), not human-reviewed. See `LESSON_REVIEW.md` |
| Metrics and runner | Implemented and unit-tested with oracle/adversarial/broken evaluators (`tests/unit/benchmark.test.ts`) |
| Live run against Gemini | **NOT RUN**: no credentials configured and the gateway is not built yet (BLOCK 17). No model has been benchmarked |

## Files
- `src/server/assessment/benchmark/answers.ts`: the 21 lesson fixtures with rationale.
- `src/server/assessment/benchmark/dataset.ts`: version `bench-v1` plus the extra items.
- `src/server/assessment/benchmark/runner.ts`: runs any `Evaluator`; returns `NOT_RUN` with a reason when no provider is available, never `PASS`.

## Metrics
| Metric | Definition |
|---|---|
| `statusAgreement` | Share of items whose predicted status (assessed / needs_clarification / rejected_before_model) matches the label |
| `criterionAgreement` | Over items both labelled and predicted `assessed`: share of criterion ratings that match exactly |
| `falsePassRate` | Over misconception items: share where any criterion is rated **higher** than the label |
| `falseFailRate` | Over correct concise, detailed and paraphrase items: share where any criterion is rated **lower**, or the status is not `assessed` |
| `injectionOverScoreRate` | Over prompt-injection items: share whose predicted total exceeds the labelled total |
| `evidenceValidity` | Over credited criteria (sebagian/tepat): share whose evidence excerpt appears in the answer (case- and whitespace-normalized) |
| `schemaValidity` | 1 − (invalid model outputs ÷ model calls) |
| `providerErrors` | Count of timeouts, rate limits and outages |
| `latencyP50Ms`, `latencyP95Ms` | Over model calls |
| `approxCostUsd` | From reported token usage × the price table; `null` if usage or prices are unknown |
| `hintHelpfulness` | Always `MANUAL_REVIEW_REQUIRED`; judged by a person, not computed |

Empty and too-long inputs are rejected by the same validation the app uses, and the runner verifies the model is never called for them.

## Limitations (always reported with results)
- 27 items is a small convenience sample written by one author. Results are indicative only and **not statistically significant**. Do not claim accuracy, human-level grading, or learning impact from them.
- Labels are proposals until reviewed. A report states `labelStatus`.
- Answers are synthetic; real children's writing may differ (spelling, code-switching, very short replies).

## Comparing models (after BLOCK 17)
1. Configure the paid Gemini key locally (`.env.local`); never paste it anywhere else.
2. Run the benchmark once per candidate (`gemini-3.8-flash`, `gemini-3.5-flash-lite`) with the same dataset version and prompts.
3. Compare in this order:
   1. false-pass rate on misconceptions, the most harmful error;
   2. injection over-score rate;
   3. false-fail rate on correct paraphrases;
   4. criterion agreement;
   5. evidence validity;
   6. schema validity;
   7. latency;
   8. cost.
4. Record both reports and the decision in ADR-007 and `docs/20`.

## Manual review of ambiguous cases
For every mismatched item (`items[].mismatchedCriteria`) and every `needs_clarification` disagreement:
1. Re-read the answer and the rubric level descriptions.
2. Decide whether the **label** or the **model** is wrong. Change a label only with a written reason in its `rationale`.
3. If the rubric description itself is unclear, fix the rubric as a **new version** rather than editing a published one.
4. Judge hint helpfulness on a sample: does the hint target the missing criterion without revealing the full answer?

Synthetic answers only. Never add real learners' answers or personal data to the dataset.
