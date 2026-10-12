# Security Threat Model

## 1. Assets
Authentication/recovery; private profiles/history/answers/scores; code/project files/execution output; AI/database/runner secrets; room state and leaderboard/XP integrity; community posts/reports/moderator tools; voice metadata/transcripts; competition process evidence and Git history.

## 2. Trust boundaries
1. Browser → app server.
2. Browser → managed auth/database/realtime.
3. Server → LLM provider.
4. Server → speech provider.
5. Server → isolated code runner.
6. User content → AI/community.
7. User → room/moderation/leaderboard services.
8. CI/build → production deployment.

## 3. Threats and controls

### Unauthorized data access / IDOR
Threat: changing a session/project/profile/room ID to read another user's data. Controls: server ownership checks, RLS where applicable, allowlisted DTOs, negative tests with two accounts, and no reliance on hidden buttons.

### Prompt injection from code/posts
Threat: comments/files/posts tell the agent to reveal secrets, change grading rules or invoke tools. Controls: treat content as data, tool allowlists, no secret-bearing context, structural input separation, output validation, authorization outside the model, red-team fixtures.

### Unsafe code execution
Threat: user code accesses secrets/host/network, forks processes, exhausts resources or reaches another user's files. Controls: isolated execution provider, no secrets, network denied by default, ephemeral filesystem, limits, timeout kill, output cap, rate limits, toolchain allowlist and isolation tests. Disable execution if isolation cannot be verified.

### Credential exposure
Threat: keys leak through browser bundle, Git, logs, generated error or AI context. Controls: server-only variables, secret scan, `.gitignore`, limited scopes, rotation process, sanitized errors and no private keys in model context.

### Score/XP cheating
Threat: client forges points, repeats reward requests or submits fake tool status. Controls: server-calculated scores and XP ledger, idempotency/unique event keys, authoritative challenge validation and traceable provider results.

### Realtime room abuse
Threat: unauthorized subscription, spoofed turn, replay, guessable invites or floods. Controls: authorized private channels, membership/version checks, expiring high-entropy invite codes, rate limits, quotas, idempotency, report/leave.

### Community abuse
Threat: harassment, personal-data exposure, harmful links, spam. Controls: safe rendering, input limits, rates, report/moderation queue, audit, child-safety gates, no default child DMs.

### AI/telemetry privacy
Threat: child transcripts/code retained beyond purpose. Controls: minimization, provider terms review, redaction, retention, no raw audio by default, no hidden chain-of-thought logs, restricted log access.

### Supply chain
Threat: vulnerable/abandoned package, malicious install script, compromised runner image. Controls: lockfile, dependency auditing, review added dependencies, pin runner images and versions, restrict registry/network, license/security update policy.

## 4. Pre-public security gate
- Private routes authorize server-side and are tested with at least two accounts.
- RLS/policy tests pass where applicable.
- No secret in browser bundle/repository/logs.
- Rate limits cover AI, voice, execution, auth, posts/comments and rooms.
- Sandbox limits/isolation are verified.
- Unsafe HTML rendering is prevented; archive path traversal and oversized uploads are blocked.
- Production cookie/session settings reviewed.
- Account recovery/deletion tested.
- Errors reveal no stack traces/secrets.
- Public features remain feature-flagged off if their safety/authorization gates fail.
