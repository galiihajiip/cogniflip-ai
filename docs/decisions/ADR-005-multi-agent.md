# ADR-005 — Bounded Multi-Agent Orchestration

- Status: design constraint accepted; exact provider/model pending.
- Date: 2026-10-12.

## Context
Product scope calls for agents for tutoring, assessment, misconception diagnosis, code review, feedback, and safety. Unbounded agent chaining adds cost, latency and contradictions.

## Decision
Use a central orchestrator and distinct agent contracts. Enforce tool allowlists, structured schemas, maximum steps/calls, time/cost budgets, cancellation and terminal states. Scoring, authorization, persistence and rewards remain deterministic application services.

## Consequences
Agents are used only where their separate responsibility adds value. Failures have explicit status. Provider swap remains possible behind an adapter.

## Provider evidence and recommendation (2026-10-12)
Evidence: `docs/implementation/STACK_VALIDATION.md` §2 (S7), §3 and §4. Status of the provider choice stays **pending participant approval**.

- Recommended provider: Anthropic Claude through the official `@anthropic-ai/sdk`, behind a project-owned provider interface in server-only code, so the provider remains swappable.
- Structured outputs constrain responses to a JSON schema; every response is still re-validated (Zod) and semantically checked before use.
- Model selection happens in roadmap R3.9 by benchmarking Claude Opus 5.5, Sonnet 5.5 and Haiku 5.5 on the same reviewed fixtures (agreement, false-pass/false-fail, latency, cost).
- Terms relevant to child data: API inputs/outputs are not used for training by default and are deleted within 30 days by default; Anthropic's Usage Policy requires AI disclosure for products serving minors and recommends further safeguards.
- Hard cost ceiling: a dedicated Console workspace with a monthly spend limit, plus app-level call budgets and a WAF rate limit.

## Provider decision update (2026-10-13)
The participant selected Google Gemini (`D-008` in `docs/20_DECISION_LOG.md`) instead of the Claude recommendation above, after being shown that Google's Gemini API and Vertex AI terms prohibit use in services likely to be accessed by people under 18. The provider-neutral interface remains mandatory so that the provider can be replaced without touching domain logic.
