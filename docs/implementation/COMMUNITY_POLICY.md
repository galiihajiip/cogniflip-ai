# Community Policy and Data Contract (BLOCK 47)

**Status: DESIGN ONLY. Community is OFF.** There are no community tables, endpoints or screens. Per `docs/10` §8 and ADR-004, publishing stays disabled until the moderation workflow (BLOCK 49) works, safety defaults are reviewed, and a human moderator is available. The design below is what must be built and reviewed before enabling.

## Who and what
- Pseudonymous handles and preset avatars only. No real names, schools, ages, locations, photos or contact details.
- Allowed: questions and answers about lessons, short code snippets, project showcases (text plus code), encouraging comments.
- **No direct messages** between learners. Comments are public within the community and attached to posts.

## Prohibited content (report reasons)
| Reason key | Examples |
|---|---|
| `personal_info` | Real name, school, address, phone, social-media handle, photo, "meet me at…" |
| `bullying` | Insults, mocking, exclusion, threats |
| `inappropriate` | Sexual content, violence, self-harm, drugs, hate |
| `dangerous_code` | Malware, credential stealers, instructions to harm devices |
| `spam` | Ads, repeated posts, link farms |
| `off_platform_contact` | Attempts to move a child to other apps or games |
| `other` | Anything else a learner feels is not okay (free text ≤ 200 characters) |

## Data contract (to implement, not built)
| Entity | Fields | Rules |
|---|---|---|
| `community_posts` | id, author_user_id, title ≤ 80, body ≤ 2,000, code ≤ 5,000, code_language, status (`visible`, `hidden_pending_review`, `removed`), created_at, edited_at | Only the owner edits or deletes; edits keep an audit row; rendered as **plain text** (no HTML/markdown links); code shown in a non-executing viewer; posting requires an account and ≤ 5 posts/hour |
| `community_comments` | id, post_id, author_user_id, body ≤ 500, status, created_at | Same rules; ≤ 20 comments/hour |
| `content_reports` | id, target (post/comment/user), reporter_user_id, reason, note ≤ 200, state (`open`, `actioned`, `dismissed`), created_at | The reporter's identity is **never** shown to the reported user or the public; one open report per reporter and target |
| `moderation_actions` | id, report_id, moderator_user_id, action (`hide`, `remove`, `restore`, `restrict_user`, `dismiss`), reason, created_at | Append-only audit; only `moderator`/`admin` roles (server-checked) |
| `user_blocks` | blocker_user_id, blocked_user_id, created_at | The blocker no longer sees the blocked user's content |

**Visibility:** new posts from accounts under 7 days old start as `hidden_pending_review`. Three or more open reports automatically hide a post until it is reviewed.

**Links:** links are shown as non-clickable text in the competition design. External link safety is not implemented.

**Retention:**
- removed content is kept for 30 days for moderation and appeals, then deleted;
- reports and actions are kept for 1 year with minimal fields;
- account deletion removes posts and comments and anonymises reports.

## Threat notes (docs/11)
| Threat | Control |
|---|---|
| Harassment | Report and block, auto-hide on reports, human review, rate limits |
| Personal information disclosure | Plain-text rendering, `personal_info` reports, optional pattern warning (phone/email) before posting |
| Dangerous links | No clickable links |
| Malicious code snippets | Never executed or auto-run; shown as text; AI review only on the author's explicit request |
| Prompt injection via posts | Posts are never fed into AI instructions; a safety-triage agent (if ever used) treats them as data and cannot act |
| Spam | Account-only posting, per-user and per-IP rate limits, new-account review |
| Moderator abuse | Server-checked roles, append-only audit log, two-person rule for `restrict_user` |

## Release gate (all required, none met today)
1. Tables, endpoints and authorization tests with two users plus a moderator.
2. Report-to-moderator flow works end to end (BLOCK 49).
3. A named human moderator and response time agreed.
4. Privacy defaults reviewed; legal/guardian review for the deployment.
5. UI from approved Stitch designs (ST-19, ST-20) with accessible report and block controls.
