# Vibe Coding Evidence Protocol

## 1. Purpose

M-ONE allocates 25% to Vibe Coding Process and examines AI Agent documentation, specific/iterative prompts, and debugging prompts that demonstrate understanding of the problem. The guidebook also requires a curated prompt journal of no more than five prompts plus the authentic raw log from beginning to end.

The goal is to preserve evidence of the actual development process, not create an idealized story afterward.

## 2. Persistent agent docs versus participant prompts

- `CLAUDE.md` is persistent project guidance read by Claude Code. It is not a record of what the participant typed during a session.
- Curated journal entries are up to five actual selected prompts, with actual context, outcome, and linked evidence. Do not invent or rewrite prompt content to sound impressive.
- Raw log covers the actual interaction history from the start of development through finishing. Preserve the original export/format available from the coding tool or record it in a way permitted by the organizer. Do not fabricate gaps or claim a reconstructed log is verbatim.
- Screenshots/terminal outputs can support claims but do not replace required logs unless the organizer permits that format.

## 3. Curated journal organization

The supplied guidebook identifies up to five categories:
1. Ideation / PRD.
2. One free category (implementation is a reasonable candidate).
3. Debugging.
4. Audit and optimization.
5. Finishing.

These are categories, not prewritten prompts. `vibe-coding/curated-prompt-journal-template.md` is intentionally blank. Fill it only after the real interaction occurs. Follow an authenticated organizer clarification if it changes format/order.

## 4. Record each selected interaction

Record actual timestamp/timezone, objective, relevant prior state, exact prompt as sent, relevant actual outcome, linked artifact/commit/test, what the participant accepted/rejected/modified, and verification result.

Do not fabricate a debugging issue. Use a real reproduced problem and record actual behavior, expected behavior, evidence, root-cause hypothesis, fix, and regression test.

## 5. Authentic iterations and Git

- Keep commits small and meaningful.
- Do not force-push to erase real sequence or change timestamps to misrepresent work.
- Do not split a large change artificially to simulate development.
- Never mark a test passed unless it was run.
- Link decision records to implementation changes.
- Correcting an AI's false claim honestly is valid evidence of human oversight.

## 6. What judges may verify

The guidebook says creation time and first commit may be checked against start time; prompt logs may be compared with Git history for order/content/timing; judges may request clarification. Burden of proof rests with the participant.

Keep repository, raw log, curated journal, docs and live deployment available. Keep secrets and unnecessary personal data out of public evidence.

## 7. Package boundary

This package contains no ready-to-paste Claude Code development prompts and no fabricated journal. The participant will provide actual prompts later and preserve authentic logs. Persistent project rules stay in `CLAUDE.md`.
