# Curated Journal: Candidate Interactions (for the participant to choose)

The curated journal (`curated-prompt-journal-template.md`) must contain **at most five actual prompts, copied verbatim from the raw log**. This file only *points* to real interactions from the first Claude Code session (transcript `ee2fc06c-296b-48a7-bd5b-8f11c1ccdd86`, started 2026-10-12 15:57 WIB) with their real outcomes. It does **not** reproduce or rewrite the prompts. You choose, then copy the exact prompt text and timestamp from the raw log.

| Category (`docs/15` §3) | Candidate interaction | Actual outcome | Evidence |
|---|---|---|---|
| Ideation / PRD | BLOCK 02 "Reconcile requirements before coding" | Traceability matrix (18 features), conflicts Q1–Q14, recommended order | `REQUIREMENT_TRACEABILITY.md`, commit `fe5ec05` |
| Free (implementation) | BLOCK 13 "Define rubric schema and deterministic scoring engine" | scoring-v1 with mutation-checked tests | commit `78d8f76`, `tests/unit/scoring.test.ts` |
| Free (implementation, alt.) | BLOCK 16–17 (AI contract, gateway) | Strict evaluator contract; Gemini adapter; NOT_RUN without key | commits `c2feae6`, `802063b` |
| Debugging | During BLOCK 08: the transaction test passed even with the transaction removed (PostgreSQL treats a multi-statement query as implicit) | Real defect in the test design; replaced with a bookkeeping-failure test that the mutation then failed | commit `24b7fc8`, `tests/integration/db.integration.test.ts` |
| Debugging (alt.) | During Phase 5: XP idempotency key included the rule version (would double-award on a version bump) | Fixed with a regression test; the follow-up commit records that the first fix commit had a failing test | commits `67c5092`, `6e6d8c9` |
| Debugging (alt.) | BLOCK 09: invalid UTF-8 body produced a 500 | Fixed to a 400, mutation-checked | commit `d40dae1` |
| Audit & optimization | BLOCK 53 "Security and child-privacy audit" | Headers, rate limit, audit S1–S10, history secret scan | commit `9e282c1`, `SECURITY_AUDIT.md` |
| Finishing | BLOCK 60 "Final M-ONE rubric audit" | This status package | `FINAL_STATUS.md` |

Notes:
- Most prompts in this session were pasted from your prompt playbook (`prompt.md`). Say so in the journal (`docs/15` §2) and keep the playbook available for comparison.
- Earlier interactions (the chat that produced the documentation package, and Stitch sessions) are not in this transcript. Include them in the raw log from their own exports, or note the gap honestly.
