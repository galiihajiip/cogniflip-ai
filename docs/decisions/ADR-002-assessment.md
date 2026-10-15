# ADR-002 — Evidence-Based Assessment and Deterministic Scoring

- Status: accepted baseline.
- Date: 2026-10-12.

## Context
A single free-form score from an LLM is difficult to audit and may contradict its own explanation. CogniFlip must explain scores to young learners and make assessments testable.

## Decision
Use a versioned lesson-specific rubric. The model may classify each criterion at an allowed level and cite evidence in the learner's response. Application code validates the criteria, computes the total deterministically and builds feedback. Insufficient evidence leads to bounded clarification when appropriate; provider errors do not produce a score.

## Consequences
Benefits: transparent score arithmetic, explicit missing evidence, unit-testable score logic, versioned rubrics. Trade-offs: rubrics need careful authoring/review, model labels need benchmarks, and the UI must represent “not enough evidence yet”.

## Rejected alternatives
- One unconstrained model-generated integer as final score.
- Exact text matching against a single reference answer.
- Treating malformed/failed model output as a normal default score.
