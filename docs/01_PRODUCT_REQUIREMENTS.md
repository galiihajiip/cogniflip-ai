# Product Requirements Document — CogniFlip

**Status:** Baseline awaiting participant approval. **Default locale:** Indonesian (`id-ID`). **Tagline:** Flip the Way You Learn.

## 1. Product vision

CogniFlip is an AI-powered learning and coding platform that helps people build genuine understanding by explaining concepts, predicting outcomes, applying ideas in code, examining evidence, and improving their own work. It combines a child-friendly learning path, AI Reverse Tutor, Mini IDE, code diagnostics, voice interaction, collaborative learning, and a persistent learning journey.

For M-ONE, the primary evaluation path must clearly serve **Innovating Education Through Technology** and the subtheme **Web Education for Kids** for elementary-school learners. Advanced IDE and community capabilities may exist, but they must not make the elementary coding-learning experience harder to discover or use.

## 2. Problem

AI tools make answers easy to obtain. If a learner accepts an answer without retrieving, explaining, predicting, or applying the concept, the interaction may fail to reveal misunderstanding. Coding learners also encounter syntax errors, logic errors, toolchain errors, and code-quality issues without always understanding why they occur.

CogniFlip asks the learner to explain first, gives evidence-based and age-appropriate feedback, and offers a bounded next action. In coding tasks, it connects the explanation to code and verified tool results when available.

## 3. Primary users

### Elementary-school learner
- May be new to programming and AI tools.
- Needs short Indonesian instructions, one main action at a time, encouraging feedback, and a clear recovery path.
- Should not need compiler/type-system/API terminology to complete the core path.
- Should not have to reveal personal details to try a lesson.
- Needs safe social features and conservative privacy defaults.

### Older learner/coding explorer
- Wants generic code review, clean-code advice, bug diagnosis, framework/library context, and capability-specific execution/testing.
- Needs technical detail, line-level evidence, configuration context, and separation between AI suggestions and verified tool findings.

### Educator/guardian/moderator
- May need to understand progress or handle a safety report.
- Must not see private information without appropriate permission and purpose.

## 4. Product principles

1. **Learner effort before answer reveal.** Invite explanation or prediction before showing a complete answer when appropriate.
2. **Evidence before score.** Scoring must be traceable to a rubric and submitted evidence.
3. **Explain, do not shame.** Feedback identifies a fixable gap and a manageable next step.
4. **Truthful tool status.** An AI guess is never a compiler/runtime/linter/test result.
5. **Complete flows over disconnected pages.** A feature is not done merely because its screen exists.
6. **Child-first defaults.** Minimize data collection and restrict social/voice interactions until controls are verified.
7. **Broad input, explicit capabilities.** Accept code text broadly; claim tool-verified support only when an adapter provides it.
8. **Bounded agents.** Multi-agent work has explicit schemas, timeouts, budgets, and stopping rules.
9. **Accessible by design.** Responsive layouts, keyboard interaction, readable text, contrast, and reduced motion.
10. **Authentic Vibe Coding.** Documentation reflects the actual process, not a reconstructed story.

## 5. Main user journeys

### A — First lesson
1. Enter landing page and choose “Mulai belajar”.
2. Select a curated coding lesson.
3. Read a short concept card and inspect an example.
4. Explain the concept to the AI character in the learner's own words.
5. Receive one targeted clarification question when evidence is insufficient, or a structured diagnosis when enough evidence exists.
6. View score, rubric evidence, strengths, gaps, and one hint.
7. Revise the explanation and reassess.
8. View summary and next step.
9. If authenticated, save history; if guest, retain only session state and explain persistence limits.

### B — Inspect and improve code
1. Open Mini IDE and choose a starter snippet or enter code.
2. Confirm language and optionally provide framework/library/version and intended behavior.
3. Run analysis.
4. See loading status and provenance of each finding.
5. Inspect line-level findings, severity, explanation, and hint.
6. Edit code and rerun supported checks.
7. Compare findings before/after.
8. Save project/review history when signed in and authorized.

### C — Predict, execute, explain
1. Read a coding challenge.
2. Predict output before running.
3. Submit prediction and reasoning.
4. Run in an isolated sandbox where supported.
5. Compare prediction with actual output, or clearly state execution was unavailable.
6. Explain discrepancies and retry.

### D — Collaboration and community
1. Join a private/invite learning room or browse moderated content.
2. Understand rules before posting or participating.
3. Complete a challenge with server-validated submissions.
4. View results and eligible achievements only after validation.
5. Report/block inappropriate behavior through an accessible flow.

## 6. Success metrics

Potential product metrics, not claims of proven educational impact:
- Core lesson completion rate.
- Sessions reaching a valid evaluation.
- Learners revising after feedback.
- AI call success/structured-output validation rate.
- Findings with traceable evidence.
- Supported tool runs completing successfully.
- E2E pass rate for critical journeys.
- Responsive/accessibility defects found before release.
- Community reports handled through the documented workflow.
- Verified persistence and authorization behavior.

Do not claim measured learning gains until a suitable user study supports them. Score improvement within a session is a diagnostic signal, not scientific proof of retention or transfer.

## 7. Non-goals and assumptions

Do not claim native compiler/runtime support for every possible ecosystem without testing; do not execute arbitrary code in the application server; do not collect unnecessary child data; do not allow unrestricted child-to-child messaging without safety controls; do not fabricate efficacy; do not ship mock screens as finished features.

Assumptions to validate: Indonesian UI; initial lessons include sequence, loops, conditions, variables, code reading, and debugging; managed auth/database/realtime and hosted web runtime are acceptable; full scope includes auth, persistent history, community, leaderboard, voice, multiplayer, multi-agent, Mini IDE, and language/tool adapters. Public use with children requires privacy and safety review appropriate to deployment and jurisdiction.
