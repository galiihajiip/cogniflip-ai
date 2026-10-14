# Google Stitch handoff area

Use Google Stitch to design CogniFlip's complete UI/UX. This folder is the local handoff boundary between the approved Stitch design and the implementation repository.

## Required artifacts after designing in Stitch

- `DESIGN.md`: finalized design tokens and rationale in the open DESIGN.md format supported by Stitch.
- `references/`: approved screen screenshots/reference captures, grouped or named by route and viewport.
- `exports/`: optional Stitch HTML/code exports. Not kept in this submission (reviewed, then removed; see `docs/22`).
- `../docs/22_STITCH_DESIGN_HANDOFF.md`: the screen inventory, approval status, route mapping, interactions, and missing states.

## Working rules

1. The starter `DESIGN.md` is not a final design; revise it after the design is explored and approved in Stitch.
2. Record only designs actually created and approved. Do not fabricate export artifacts or screenshots.
3. Include desktop and mobile references for important screens, plus key states such as loading, empty, error, success, dialogs, and validation.
4. Keep original prompts/interactions in the participant's authentic competition raw log. This documentation package intentionally does not contain ready-to-paste Stitch or development prompts.
5. When implementing, Claude Code must use the approved Stitch design as the visual source of truth but implement real, secure application behavior and test it end to end.
