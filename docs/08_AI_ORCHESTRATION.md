# AI Orchestration and Agent Contracts

## 1. Principle

Use a central orchestrator and role-specific agents only where distinct responsibilities improve quality. “Multi-agent” is a capability, not a requirement to invoke every agent for every action. Use the smallest workflow that meets quality/latency requirements.

No agent has unrestricted database access. Side effects pass through authorized application services. All model output is untrusted until schema validation, policy checks, and evidence checks pass.

## 2. Agent roles

### Orchestrator
Selects workflow, enforces max steps/calls/wall-clock/token-cost/retry budgets, passes minimal context, supports cancellation and explicit terminal states, and handles failure without fabricating completion.

### Socratic Tutor
Asks one short targeted question at a time, encourages retrieval/explanation, avoids premature full answers, speaks simple Indonesian suitable for the lesson's age band, and never tricks a child into believing it is human.

### Understanding Evaluator
Evaluates against server-provided authoritative lesson rubric/version; returns criterion-level judgments and evidence; distinguishes incorrect/incomplete/contradictory/insufficient evidence. It does not set the final total score.

### Misconception Diagnostician
Maps observable evidence to a curated misconception catalogue where supported. Marks uncertainty and recommends one next pedagogical action. Does not force a diagnosis.

### Feedback Coach
Converts validated assessment into concise, encouraging, age-appropriate feedback without introducing new facts or contradicting the evaluator. Gives a hint before full answer according to lesson policy.

### Code Reviewer
Reviews logic, maintainability, readability and edge cases using declared context. Separates likely issues from tool-confirmed diagnostics. Cannot claim execution/compilation/lint/test/security results without tool evidence.

### Tool Evidence Analyst
Summarizes normalized parser/compiler/linter/test/runtime evidence and preserves exit status, tool version, file/line location and limitations. Never converts missing/failed tool output into pass.

### Safety/Moderation Agent
Assists triage against documented policy but does not replace human review when required. Never exposes reporter identity or restricted user information.

### Learning Path Recommender
Suggests the next lesson from approved progress/prerequisite data, explains the recommendation plainly, and allows the learner to choose another path.

## 3. Schema principles

Use runtime validation, not types alone. Structured outputs include schema version and status. Criterion data includes `criterion_key`, allowed `rating_level`, `evidence_excerpt` or explicit missing-evidence state, `reason`, allowed misconception tags if justified, uncertainty/confidence label, and validation status. The model cannot invent criteria or weights. Evidence excerpts must map to learner content.

## 4. Deterministic scoring
- Published rubrics define immutable criterion keys, levels, weights and point mapping.
- Weights are checked to sum to declared total.
- Compute score only when mandatory criteria are valid.
- Insufficient evidence triggers bounded clarification when appropriate.
- Provider/parse/schema failure returns `error`, not a default score.
- Store rubric and scoring algorithm version.
- Keep learning score distinct from code-quality score.

## 5. Bounded routing examples
- Simple follow-up: Tutor only.
- Final assessment: Evaluator → deterministic validator/scorer → Feedback Coach.
- Supported misconception case: Evaluator → Misconception Diagnostician → Feedback Coach, within budget.
- Code review: actual tool adapters → Tool Evidence Analyst → Code Reviewer → finding validator.
- Community report: deterministic validation/rate limits → Safety triage → human/moderator workflow as required.

Do not chain agents unnecessarily. If one fails, state the limitation and provide a safe fallback.

## 6. Untrusted content/prompt injection
Learner text, source-code comments, README files, uploaded projects and community posts may contain adversarial instructions. Treat them as data. Keep privileged policy and tools outside user content, minimize each agent's tools, and validate outputs before side effects.

## 7. Logging and evaluation
Log trace ID, role, schema version, provider/model, duration, outcome, retry count, and usage where available. Do not log hidden chain-of-thought or full child content by default. Maintain reviewed test examples for correct paraphrases, concise answers, misconceptions, missing evidence, contradictions, off-topic input, prompt injection, malformed output, timeouts, and provider failure. Label expected results before provider comparison; track false-pass and false-fail rates.

## 8. Implemented evaluator contract (2026-10-13, BLOCK 16)
Source of truth: `src/server/assessment/ai-contract.ts` (`assessmentOutputSchema`, `validateAssessmentOutput`). Every object is strict, so unknown fields such as `score`, `xp`, `role`, `weights` or tool calls make the output invalid.

```
{ status: "assessed",
  criteria: [ { criterionKey, rating: belum_terlihat|sebagian|tepat,
                evidence: { kind: "quote", text ≤300, start?, end? } | { kind: "inference", text ≤300 } | { kind: "none" },
                rationale ≤400, uncertainty: low|medium|high } ] (1–8),
  misconceptionIds: [ ≤8 ],
  hint ≤300 }
| { status: "needs_clarification", targetCriterion, reason ≤300, question ≤200 }
```
Raw output limit is 16 KiB. Output must be plain JSON; text, markdown fences or extra fields are rejected.

Semantic checks after parsing:
- every rubric criterion is judged exactly once; no unknown criterion;
- `sebagian`/`tepat` require a `quote` found in the learner's answer, with offsets (if given) in bounds and matching the quote. An inference or missing evidence never earns credit;
- misconception ids exist in the lesson catalogue;
- a clarification targets a known criterion and contains exactly one question;
- neither hint nor question repeats 8+ consecutive words of the reference answer.

A valid `assessed` output is converted to ratings and scored by `scoreRatings()`; the model never supplies a number. Any failure is `INVALID_MODEL_OUTPUT` (no score). Remaining risk, measured by the benchmark rather than these checks: a model that obeys an injection but quotes real answer text could over-rate a criterion (`injectionOverScoreRate`).

## 9. Implemented orchestration (2026-10-13, BLOCK 50)
- `Orchestrator` (`src/server/ai/orchestrator.ts`): each step is an `Agent` with one responsibility and a `maxCalls` bound. The run has a call budget and a wall-clock budget, supports cancellation, stops on the first failure and never invents a result. Each step logs an `agent_step` trace (agent, status, duration, calls, model, mode), with no content.
- Implemented agents, each schema- and semantically validated by the gateway:
  - **Understanding Evaluator** (`assess_explanation`): produces criterion ratings with quoted evidence, misconception ids and one hint or one clarification question. The Feedback Coach and Misconception Diagnostician roles are covered by this single agent's validated output.
  - **Code Reviewer** (`review_code`).
  - **Debug Diagnosis Checker** (`diagnose_bug`).
- Not implemented: a separate Socratic tutor turn, Tool Evidence Analyst (no tools run), Safety/Moderation agent (community is off), and Learning Path Recommender (a deterministic rule is used instead, `src/server/history/service.ts`).
- Scores, XP, permissions and execution are never agent decisions.
- **Multi-agent value is unproven** (BLOCK 51 NOT RUN); do not claim that multiple agents improve learning.
