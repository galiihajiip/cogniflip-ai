# Child Safety and Privacy Requirements

**This is an engineering baseline, not legal advice.** Before public release, review applicable law, provider terms, guardian/consent requirements, and organizer/institution expectations for the actual deployment.

## 1. Privacy by default
- Collect minimum personal data. Public handle plus preset avatar should be enough for most social features.
- Do not require children to publish real name, email, school, exact location, date of birth, face photo, or contact details.
- Keep learning history, code projects, voice metadata and self-reflection private by default.
- Do not expose scores/transcripts in public profiles or posts unless an explicit safe sharing flow exists.
- Do not retain raw voice audio by default.
- Disclose in age-appropriate language when data is sent to external AI/speech/code-runner providers.
- Define retention and account deletion before persistent history is released.

## 2. AI interaction
- Clearly disclose the tutor is an AI character.
- Do not trick children into believing the character is human or a secret-keeper.
- Do not ask for sensitive details unrelated to learning.
- Avoid shame, emotional manipulation, streak pressure, or claims of personal knowledge.
- Feedback is respectful and communicates uncertainty when needed.
- Safety policy includes escalation/human review when appropriate.

## 3. Community
- Pseudonymous public identity by default.
- No child-to-child direct messaging by default unless a separately reviewed, guarded design requires it.
- Reporting/block/mute actions remain easy to find.
- Moderate personal-data exposure, harassment, sexual/inappropriate content, threats, harmful instructions, spam, and attempts to lure users off-platform.
- Never auto-execute posted code.
- Rate-limit account creation and posting.
- Hide reporter identity from the reported user.
- Provide moderator queue, action history, and documented criteria for hiding/removing content or limiting accounts.
- Keep open public voice rooms disabled until safety/supervision requirements are reviewed.

## 4. Multiplayer and voice
- Prefer private/invite rooms, expiring join codes, pseudonymous participants, explicit join/leave.
- Show microphone/streaming state; never enable recording automatically.
- Provide mute/leave/report, text alternative, reconnection state.
- Do not retain raw audio by default; document any transcript retention.
- Do not publish private room transcripts to profiles/community by default.
- Check room membership on every read/write/broadcast. A hard-to-guess room ID is not authorization.

## 5. Public leaderboard
- Participation is opt-in where appropriate.
- Display only handle/avatar/rank/points needed for the feature.
- Never show private email, age, school, exact location, learning history, or answer content.
- Explain visibility and let users opt out.
- Prevent score manipulation with a server-side point ledger and validated challenge events.

## 6. Code content and execution
- Warn users not to submit secrets. Code and files may contain personal data or malicious instructions.
- Never expose project files, code, execution output, or environment between users.
- Do not include source code in operational logs by default.
- Isolated execution must enforce strict resource/network controls.

## 7. Data rights and deletion
- Provide accessible account/data settings.
- Document deletion for profile, projects/files, history, social content, storage and derived analytics, including justified retention exceptions.
- Avoid telemetry retention of prompts/responses unless necessary and disclosed.
- Competition process records are separate from children's learning records.

## 8. Release gates
Community, public profiles, leaderboards, multiplayer and peer voice remain disabled/restricted until authorization/privacy tests pass, reporting/moderation works, visibility defaults are reviewed, deletion/retention is implemented, abuse cases are tested, and appropriate deployment-specific review is complete.
