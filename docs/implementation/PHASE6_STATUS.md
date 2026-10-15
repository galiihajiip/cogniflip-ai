# Phase 6 Status: Voice, Realtime, Community, Multi-Agent (2026-10-13)

| Block | Status | Reason | To unblock |
|---|---|---|---|
| 42 Voice UI | **BLOCKED** | No approved Stitch design (D-009); no speech provider | Stitch ST-24 + BLOCK 43 decision |
| 43 STT/TTS providers | **BLOCKED (decision needed)** | No provider chosen. Children's voice is the most sensitive data in `docs/10`. Google's speech models fall under the same under-18 terms recorded in D-008. Browser speech APIs may send audio to third parties without the disclosure `docs/10` §1 requires | Participant decision on provider and retention, with terms reviewed for minors. Until then, the text path is the only path (status `speechToText`/`textToSpeech`: `not_configured`) |
| 44 Realtime data model | **BLOCKED (decision needed)** | No realtime provider chosen (D-006 covers Postgres only); multiplayer needs a safety gate (`docs/10` §4) | Choose a realtime service with private, authorized channels; safety review |
| 45 Room lifecycle | **BLOCKED** | Depends on 44 | — |
| 46 Multiplayer challenge | **BLOCKED** | Depends on 44–45. Reviewed challenges exist (BLOCK 40–41) and can be reused | — |
| 47 Community policy/contracts | **DONE (design only)** | `COMMUNITY_POLICY.md`: policy, report reasons, data contract, threats, release gate. No tables or endpoints, deliberately: community stays OFF | Build after the 49 prerequisites exist |
| 48 Community UI | **BLOCKED** | D-009; release gate in `COMMUNITY_POLICY.md` | Stitch ST-19/20 |
| 49 Moderation workflow | **BLOCKED** | A moderation queue without community content, a UI and a named human moderator would be untestable theatre | Named moderator, then build the tables, queue and audit from `COMMUNITY_POLICY.md` |
| 50 Orchestrator | **DONE** | `src/server/ai/orchestrator.ts`: per-run call and wall-clock budgets, cancellation, stop on failure (no fabricated results), content-free `agent_step` trace. Tutor evaluation runs through it (`assess_explanation`). Workflows are single-agent (ADR-005) | — |
| 51 Prove multi-agent value | **NOT RUN** | Needs live benchmark runs comparing single-agent vs multi-agent (`npm run benchmark` with a key). No extra agents were added, so nothing unproven is claimed | Configure the Gemini key, add a candidate agent (e.g. feedback coach), compare on `bench-v1` |

Safety note: none of the BLOCKED features is visible or reachable in the app. They have no endpoints, and `/api/status` reports speech as `not_configured`.
