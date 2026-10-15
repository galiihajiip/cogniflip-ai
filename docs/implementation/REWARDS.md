# XP, Achievements and Leaderboard

## Rules `xp-rules-v1` (BLOCK 31)
| Event | XP | Earned when |
|---|---|---|
| `explanation_assessed` | 10 | A session has at least one attempt the server assessed |
| `strong_explanation` | 5 | The session's best assessed score is ≥ 80 |
| `improved_after_revision` | 5 | The latest assessed score in the session is higher than the first |

| Achievement | Earned when |
|---|---|
| `penjelas-pertama` (Penjelas Pertama) | First assessed explanation |
| `tiga-pelajaran` (Penjelajah Tiga Pelajaran) | Assessed explanations in 3 different lessons |
| `perbaikan-hebat` (Perbaikan Hebat) | Score rose after a revision |

- **Server-side only:** rewards are derived from persisted, assessed attempts by `RewardService.sync()` after each session action (signed-in learners) and before `GET /api/rewards`. No endpoint accepts an XP value or event from the client. Strict request bodies reject extra fields such as `xp`.
- **Idempotent:**
  - each award has a unique key `xp-rules-v1:<event>:<session>` per user (`ON CONFLICT DO NOTHING`);
  - replays, refreshes and concurrent syncs cannot duplicate awards;
  - achievements have a primary key per user.
- **Append-only:** a trigger rejects any `UPDATE` on `xp_events`. Rows disappear only through account or session deletion cascades.
- **Not rewarded:** time spent, number of attempts, provider errors, clarifications, or social activity.
- **No streaks**, by design (`docs/03` §8: no manipulative streak pressure for children).
- **Guests earn no XP**; there is no account to attach it to.
- **Versioning:** a rule change creates `xp-rules-v2`. Old ledger rows keep `rule_version` and are never rewritten. New keys include the new version, so rewards stay consistent when recalculated.

**Verified:**
- `tests/unit/reward-rules.test.ts` (4 tests).
- `tests/integration/rewards.integration.test.ts` (3 tests on PostgreSQL):
  - XP awarded once despite repeated syncs, 3 concurrent syncs and a replayed submission;
  - `UPDATE` blocked;
  - guests get no XP;
  - a forged `xp` field returns 400;
  - unauthenticated reads return 401.

**Not verified:** reward screens (no UI, D-009).

## Leaderboard (BLOCK 32)
- `GET /api/leaderboard?period=weekly|all&limit=1-50&offset=`: computed live from `xp_events`. Only learners with `leaderboard_opt_in = true` (default false) appear, each as `{ rank, handle, avatarKey, xp }` and nothing else.
- **Weekly period** starts Monday 00:00 WIB (Asia/Jakarta, i.e. Sunday 17:00 UTC); `periodStart` is returned. **Ties** share a rank (dense rank) and are listed by handle. The rules text is included in every response.
- `me`: the signed-in learner's own rank and XP if they opted in, `{ optedIn: false }` if not, `null` when signed out.
- **Opting out** removes the learner from rankings immediately. Their XP and history remain private.
- **No fabricated participants:** production never seeds users. Integration tests create their own synthetic accounts in a throwaway database.
- **Verified:** `tests/integration/leaderboard.integration.test.ts` (4 tests) covers:
  - opt-in filter and allowlisted fields;
  - shared rank for ties, weekly vs all-time, pagination;
  - opt-out;
  - the exact Monday 00:00 WIB boundary (one minute before is excluded, one minute after is included);
  - invalid queries.
