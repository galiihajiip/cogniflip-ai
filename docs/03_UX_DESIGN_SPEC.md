# UX Design Specification

## Design ownership and Stitch handoff
Google Stitch is the primary tool for high-fidelity visual design and interactive UI prototyping. This document defines required user journeys and behavior; the participant-approved Stitch screens and finalized `.stitch/DESIGN.md` define the intended visual implementation. Keep these sources aligned. If the prototype omits a required state, document the gap rather than silently treating it as complete.

## 1. Experience goals
- A first-time elementary learner can start a lesson in a few obvious steps.
- Each screen answers: “Where am I?”, “What should I do now?”, “What happens next?”
- Core learning feels friendly and purposeful, not like a corporate analytics dashboard.
- Advanced IDE controls remain available without overwhelming children.
- Feedback is constructive and tied to observable evidence.
- Text learning works when AI, voice, realtime, or execution is unavailable.

## 2. Information architecture
1. **Beranda** — resume/start learning and product value proposition.
2. **Belajar** — learning paths and lessons.
3. **Mini IDE** — editor and analysis.
4. **Misi** — predict output and debugging challenges.
5. **Bersama** — multiplayer/community only when policy and permissions allow.
6. **Perjalanan Saya** — progress, history, achievements.
7. **Profil** — preferences, privacy, account, accessibility.

Desktop may use a compact sidebar. Mobile uses simplified navigation; do not force every destination into a crowded bottom bar. “Mulai belajar” remains the default primary action.

## 3. Core lesson screens

### Landing
- One sentence in simple Indonesian, a clear “Mulai belajar” CTA, and a secondary Mini IDE path.
- AI character is identified as an AI learning companion.

### Learning path
- Cards show lesson title, one-sentence outcome, level, icon/illustration, and progress.
- Locked lessons explain why; avoid unexplained disabled controls.

### Concept introduction
- Short explanation, one example, one “Coba jelaskan” CTA.
- “Lihat contoh lagi” must not destroy any in-progress answer.

### Explain to robot
- Keep the objective visible.
- Ask one question at a time.
- Accessible text input and optional voice; prevent accidental double submit.
- If evidence is insufficient, ask one targeted clarification rather than confidently assigning a low score.

### Diagnosis/results
- Show score only for a valid completed assessment.
- Each score dimension has a short label, reason, and expandable evidence.
- Separate “Sudah kamu pahami”, “Ayo perbaiki”, and “Coba ini”.
- Avoid shaming and avoid making red the dominant learning color.
- “Perbaiki penjelasan” is primary; a full reference answer follows the lesson's hint policy.

### Revision
- Record the revised response as a distinct attempt for signed-in users.
- Show the gap being targeted.
- Compare against the same rubric version or explicitly record a new version.
- Do not imply that one score change proves long-term learning.

### Completion
- Celebrate modestly, summarize what was practiced, suggest the next step, and allow review/retry. Do not force social sharing.

## 4. Mini IDE flow
- Clearly distinguish “Analyze code” from “Run code”.
- Let user pick a language/custom language label; show native tool capability separately.
- Keep framework/library/version/project context in a progressive disclosure section.
- Findings group by severity/category, navigate to line/column when valid, and identify provenance: AI, parser, linter, type checker, compiler, test, or runtime.
- Provide “Petunjuk dulu” and “Lihat contoh perbaikan”. Never silently overwrite code; use reviewable diffs.
- Unsupported execution still permits generic review but cannot show fabricated output.

## 5. Profile/progress/leaderboard
- Public identity is pseudonymous by default; leaderboard visibility is opt-in when appropriate.
- Distinguish practice progress from competition ranking and avoid shaming low ranks.
- History includes lesson/project, date, outcome, and continue/review action.
- Privacy, export, and deletion are understandable and accessible.

## 6. Community and multiplayer
- Show community/room rules before joining/posting.
- Report, mute/block where relevant, and leave-room controls are easy to locate.
- No unsolicited child-to-child direct messages by default.
- Show room state, pseudonymous participants, turn order, connection/reconnect status, and clear audio state.
- Never enable a microphone automatically or retain audio by default.
- Provide keyboard/text alternatives.

## 7. States and responsive behavior
Every networked feature needs loading, empty, partial-data, unauthenticated, forbidden, unavailable, throttled, timeout, retry, disconnected, and unknown-error states as relevant. Do not expose stack traces, prompts, credentials, or other users' information.

Test small mobile, mobile landscape, tablet, laptop, desktop, zoom, and keyboard-only navigation. Avoid document-level horizontal overflow; the code editor may scroll within its own bounded viewport. Essential controls must not depend on hover. Lazy-load heavy editor and visualization bundles.

## 8. Motion and emotional design
Motion should convey progress, loading, success, or focus. Respect `prefers-reduced-motion`; use subtle hover effects, no flashing/obstructive motion, and small celebrations only for meaningful milestones. Avoid manipulative streak pressure or scarcity mechanics.
