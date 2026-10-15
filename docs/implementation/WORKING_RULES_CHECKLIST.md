# Working Rules and Compliance Checklist

Compact governance register derived from `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/00_DOCUMENT_MAP.md`, `docs/14_MONE_RUBRIC_TRACEABILITY.md` and `docs/15_VIBE_CODING_PROTOCOL.md`. It is checked against the actual repository, not assumed.

- Created: 2026-10-12 (WIB), during the first Claude Code session.
- Status values: `PASS`, `FAIL`, `NOT VERIFIED`, `N/A YET` (nothing exists to check yet). `NOT VERIFIED` is never `PASS`.
- Source caveat: rules are validated against the transcription in `docs/14`. The original guidebook files (`Guidebook_MONE_Coding_Competition_REVISI (1).pptx`, `TM_M-ONE (1).pptx`) are not in this repository, so the transcription itself is `NOT VERIFIED` against the original.
- Update the status column only with observed evidence, and record the date.

## 1. Originality and provenance

| ID | Rule | Source | Status (2026-10-12) | Evidence / next action |
|---|---|---|---|---|
| G-01 | Repository, code, design and AI Agent docs are created after the start line, 5 Oct 2026 09:30 WIB. | `docs/14` §4; `CLAUDE.md` §2 | NOT VERIFIED | Doc files are timestamped 12 Oct 2026 15:40–15:47 WIB. No repository exists yet. Verify the repo creation time and first commit once they exist. |
| G-02 | No old repository, fork, template, copied code/components/pages (including one's own), or prewritten AI Agent docs/prompts from an older project. | `docs/14` §4; `CLAUDE.md` §2 | NOT VERIFIED | The repo currently contains only the StitchReady documentation package (byte-identical to `CogniFlip_Project_Documentation_StitchReady.zip`), prepared on 12 Oct 2026. Record its origin honestly in the first commit and in the raw log. No source code has been imported. |
| G-03 | Externally prepared prompt material (e.g. a prompt playbook) is disclosed, not presented as spontaneous prompts. | `docs/15` §2, §4 | NOT VERIFIED | The participant is using a prompt playbook prepared outside this session. Keep the raw log complete and retain the playbook so judges can compare. |
| G-04 | Scaffolding is generated from scratch with official tooling; no finished product template. | `docs/16` R0.6; `docs/05` §1 | N/A YET | Check at R0.6. |

## 2. Repository and Git history

| ID | Rule | Source | Status | Evidence / next action |
|---|---|---|---|---|
| G-05 | Public GitHub repository, kept public through judging. | `docs/14` §1 gate 2; `CLAUDE.md` §2 | FAIL | No Git repository and no remote yet. GitHub CLI authentication currently fails and must be fixed by the participant. |
| G-06 | Truthful history: no faked timestamps, history rewrite, force-push or artificial commit splitting. | `docs/14` §4; `docs/15` §5 | PASS (2026-10-13) | No commits yet. Never use `--force`, `commit --amend` on pushed commits, or date overrides. |
| G-07 | Small, meaningful, descriptive commits linked to roadmap IDs and decisions. | `docs/14` §2 (Technical Quality); `docs/15` §5 | N/A YET | Check every commit. |
| G-08 | No secrets committed; `.env*` ignored except `.env.example`. | `CLAUDE.md` §6; `docs/17` | PASS (2026-10-13: history scan 0 hits) | `.gitignore` contains `.env`, `.env.*`, `!.env.example`. Verify with `git check-ignore` after `git init`. No `.env` file exists today. |

## 3. Vibe Coding evidence

| ID | Rule | Source | Status | Evidence / next action |
|---|---|---|---|---|
| G-09 | AI Agent reference docs exist for development tasks and reflect actual rules. | `docs/14` §1 gate 1 | PASS (existence only) | `CLAUDE.md` and `AGENTS.md` exist. Whether they reflect the actual process is re-checked at release (`docs/21` C). |
| G-10 | Raw prompt log preserved from the first interaction to the end, in its original form; never relabel a reconstruction as verbatim. | `docs/14` §1 gate 3; `docs/15` §2 | NOT VERIFIED | The log has started (see §6 below). It is not yet copied, registered or published. |
| G-11 | Curated prompt journal holds at most five **actual** prompts with real outcomes; it stays blank until those exist. | `docs/14` §1 gate 3; `docs/15` §3–4 | N/A YET | `docs/vibe-coding/curated-prompt-journal-template.md` is intentionally blank. Fill entries only after the real interaction and its verified result. |
| G-12 | The debugging entry uses a real, reproduced problem (actual vs. expected behaviour, evidence, root cause, fix, regression test). | `docs/15` §4 | N/A YET | Do not stage a bug for the journal. |
| G-13 | No fabricated tests, test output, screenshots, deployment status or verification claims. | `CLAUDE.md` §2, §4; `AGENTS.md` | PASS (to date) | No tests or screenshots exist yet. Report exact commands and output for every check. |

## 4. Product, child safety and honest capability

| ID | Rule | Source | Status | Evidence / next action |
|---|---|---|---|---|
| G-14 | Theme "Innovating Education Through Technology", subtheme "Web Education for Kids" (elementary school); the primary path must clearly serve it. | `docs/14` §1 gate 4; `docs/01` §1 | NOT VERIFIED | Documented intent only. Verify with the deployed child-facing lesson flow. |
| G-15 | Minimum child data; no public real name, email, school, precise location, learning history, code or voice by default. | `CLAUDE.md` §6; `docs/10` | N/A YET | Check at the profile, community and leaderboard phases. |
| G-16 | Server-side authorization; never trust client score, XP, role, ownership, room membership or moderator status. | `CLAUDE.md` §6–7 | N/A YET | Requires cross-user tests with two accounts. |
| G-17 | Community, multiplayer, public profiles and voice stay disabled until their safety controls are verified. | `CLAUDE.md` §6; `docs/10` | N/A YET | Each needs a recorded safety gate before it is enabled. |
| G-18 | Never run submitted code in the app process; run it only in isolated execution with enforced limits, otherwise keep execution disabled. | `CLAUDE.md` §6; `docs/09`; ADR-003 | N/A YET | Requires security-test evidence. |
| G-19 | Honest language/tool support: broad code input ≠ compiler/runtime support; AI-only findings are labelled; no claim that a compile, run, lint or test happened unless it did. | `CLAUDE.md` §5; `README.md`; ADR-006 | N/A YET | Publish the capability matrix only from real tests. |
| G-20 | Learning scores are deterministic from validated rubric ratings; provider failure never yields a numeric score. | `CLAUDE.md` §5; ADR-002 | N/A YET | Unit tests required. |
| G-21 | No efficacy claims ("improves learning") without study evidence. | `docs/01` §6; `docs/REFERENCES.md` | PASS (to date) | No such claim in the product yet. |
| G-22 | API keys stay server-side; no privileged values in client-public variables. | `CLAUDE.md` §6; `docs/17` | NOT VERIFIED | `.env.example` contains placeholders only. Check the browser bundle at release. |

## 5. Deployment, feature evidence and deadline

| ID | Rule | Source | Status | Evidence / next action |
|---|---|---|---|---|
| G-23 | Deployed website accessible to judges. | `docs/14` §1 gate 6 | FAIL | Not built or deployed yet. |
| G-24 | A feature is done only with explicit acceptance criteria, relevant states, validated data, real test results, a responsive/accessibility check and a commit. A screen or a build alone is not proof. | `CLAUDE.md` §4; `docs/13` | N/A YET | Apply per roadmap slice. |
| G-25 | UI follows the approved Stitch design; no invented final design. | `CLAUDE.md` §8; `docs/22` | FAIL (blocking UI; D-009: no screens built) | `docs/22` says Design `NOT STARTED`, approval `NO`; `.stitch/references/` is empty. Backend/domain work may proceed. |
| G-26 | Unbuilt or unverified scope is marked incomplete, never claimed. | `docs/16` "Competition timebox"; `docs/20` D-002 | N/A YET | Decide the submission subset and record it in `docs/20`. |
| G-27 | Submit before 15 Oct 2026 15:30 WIB (the 21:00 WIB close is not the deadline); verify organizer updates only from authenticated sources. | `docs/14` §5 | NOT VERIFIED | Deadline taken from the transcription. Record any organizer update with its source and time. |
| G-28 | Evidence index per scoring criterion: artifact path, actual time, what it shows, how to reproduce. | `docs/14` §6 | N/A YET | Build it alongside the work. |

### Consequences and priority (from `docs/14` §3–4)
- Proven use of a prior project: 35% score reduction. Originality that cannot be proven: disqualification.
- Disqualification also for plagiarism, a private GitHub repository, manipulated prompt documentation, or late submission without organizer-approved confirmation. An approved late submission is described as a 10% reduction.
- Missing any of the six gates stops assessment entirely. A polished product does not compensate.
- Ties are broken by Vibe Coding Process, then Functionality & Theme, then UI/UX. Prioritize authentic process evidence and a working end-to-end flow.

## 6. Raw log process for Claude Code sessions

This is the process for the actual sessions in this project. It is a procedure only and contains no prompt text.

1. **Source of truth.** Claude Code writes each session's full transcript locally as JSONL under `~/.claude/projects/<project-folder-slug>/<session-id>.jsonl`. This includes prompts, responses, tool calls and tool output, with UTC timestamps. The first session, `ee2fc06c-296b-48a7-bd5b-8f11c1ccdd86`, began 2026-10-12 08:57:19 UTC (15:57 WIB).
2. **Preserve the original.** Local transcripts can be removed by Claude Code's automatic cleanup (default retention applies; `cleanupPeriodDays` is not set). After each work block, copy the JSONL unchanged to a private backup outside the repo, and record its SHA-256 hash.
3. **Register it.** For each session or segment, fill a row in `docs/vibe-coding/raw-log-register.md`: start and end timestamps with timezone, session ID, backup location, hash, and the related commit range.
4. **Publish safely.** Before making a log public, review it for secrets and personal data. The transcript contains local paths, account identifiers and tool output. If anything is removed, publish the result as a clearly labelled **redacted** copy, keep the unredacted original privately, and follow any organizer rule on format.
5. **Include all interactions.** Include sessions in other tools that shaped the work: the chat that produced the documentation package, the prompt playbook, and Google Stitch design sessions. Note any gap honestly instead of filling it.
6. **Curated journal.** Choose up to five entries from these real logs only after each outcome is verified. Copy the prompt exactly as sent.

## 7. Open items blocking compliance

1. Fix GitHub CLI authentication, initialize Git, and create a **public** repository (G-05, G-08).
2. Back up and register the first session transcript (G-10).
3. Start and approve the Stitch design (G-25).
4. Record the stack, provider and submission-subset decisions in `docs/20_DECISION_LOG.md` (G-26).
