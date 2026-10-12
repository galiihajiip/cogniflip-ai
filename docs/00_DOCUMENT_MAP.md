# Document Map and Reading Order

## Product and UX
- `01_PRODUCT_REQUIREMENTS.md` — vision, audiences, problem, user journeys, success metrics.
- `02_PRODUCT_SCOPE.md` — full feature inventory and dependencies.
- `03_UX_DESIGN_SPEC.md` — end-to-end journeys and page/state behavior.
- `04_DESIGN_SYSTEM.md` — brand, tokens, components, motion, accessibility.
- `22_STITCH_DESIGN_HANDOFF.md` — Google Stitch screen inventory, approval workflow, exports, and route/state mapping.
- `.stitch/DESIGN.md` — starter design tokens/rationale intended to be finalized from the approved Stitch design; visual source of truth after approval.
- `18_LEARNING_CONTENT_DESIGN.md` — coding curriculum, lesson data, assessment principles.

## Engineering
- `05_SYSTEM_ARCHITECTURE.md` — stack and system boundaries.
- `06_DATA_MODEL.md` — entities, ownership, retention, data integrity.
- `07_API_CONTRACTS.md` — domain API responsibilities and error semantics.
- `08_AI_ORCHESTRATION.md` — multi-agent contracts, schemas, budgets, scoring.
- `09_CODE_INTELLIGENCE.md` — Mini IDE, language capability registry, code execution.
- `19_OBSERVABILITY_AND_ERRORS.md` — logs, trace IDs, failure states, recovery.

## Trust and evidence
- `10_CHILD_SAFETY_PRIVACY.md` — privacy and child-safety design.
- `11_SECURITY_THREAT_MODEL.md` — security risks and controls.
- `12_TEST_STRATEGY.md` — unit/integration/E2E/AI/accessibility/security testing.
- `13_ACCEPTANCE_CRITERIA.md` — testable definitions of done.
- `14_MONE_RUBRIC_TRACEABILITY.md` — official eligibility rules and scoring mapped to evidence.
- `15_VIBE_CODING_PROTOCOL.md` — authentic Vibe Coding documentation.
- `17_DEPLOYMENT_OPERATIONS.md` — environment, deployment, migrations, rollback.
- `21_SUBMISSION_CHECKLIST.md` — final release and submission checklist.

## Design handoff
- `.stitch/README.md` — how to organize Stitch exports and references.
- `.stitch/references/` — approved screen screenshots and reference artifacts.
- `.stitch/exports/` — HTML/code exports retained for comparison/reference; do not treat as a complete production application.

## Execution
- `16_IMPLEMENTATION_ROADMAP.md` — small dependency-aware steps for full scope.
- `20_DECISION_LOG.md` — material project decisions.
- `decisions/` — architecture decision records (ADRs).
- `vibe-coding/` — blank process-log templates only; no actual prompts are included.

## Conflict resolution
1. Official contest requirements are eligibility constraints.
2. Accepted PRD/product scope governs product behavior.
3. Proposed ADR decisions require validation before implementation.
4. `NOT VERIFIED` is not `PASS`.
5. Material changes require updates to the source document, acceptance criteria, tests, and decision log.
