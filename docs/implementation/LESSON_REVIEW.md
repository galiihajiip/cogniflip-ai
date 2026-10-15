# Lesson and Label Review (participant sign-off required)

The first three lessons, their rubrics, and 21 synthetic answer fixtures were **drafted by the AI coding assistant on 2026-10-13**. They have **not** been reviewed by a human. Until you review them:
- lessons and rubrics stay `draft` (the catalog refuses to publish unreviewed content);
- fixture labels stay `labelStatus: "proposed"`, not gold labels;
- the learning path `dasar-pemrograman` stays `draft` and is not shown to learners.

No LLM generates labels at runtime; these are static files.

## What to review

| File | Content |
|---|---|
| `src/server/learning/content/lessons.ts` | `urutan-instruksi` (sequence), `perulangan` (loops), `percabangan` (conditions): objective, concept, analogy, conceptual robot-command example, task, misconceptions, accepted/alternative explanations, hints, reference answer |
| `src/server/assessment/content/rubrics.ts` | 3 rubrics, 100 points each, 3 criteria each, level descriptions and learner feedback |
| `src/server/assessment/benchmark/answers.ts` | 7 answers per lesson (concise, detailed, partial, misconception, ambiguous, off-topic, prompt-injection) with proposed ratings and a written rationale for each |
| `src/server/learning/content/paths.ts` | Path order: urutan → perulangan → percabangan |
| `src/server/missions/content.ts` | 4 Predict and 3 Debug Robot missions (Python 3): wording, hints, Indonesian explanations, accepted descriptions. Outputs and bugs are already verified with CPython (`MISSIONS.md`); the pedagogy is not reviewed |

### Checklist per lesson
- [ ] Indonesian is natural and readable for grades 4–6; no advanced syntax assumed.
- [ ] The analogy and example are correct and age-appropriate.
- [ ] The objective is observable and matches the rubric criteria.
- [ ] Misconceptions are real and the signals are plausible.
- [ ] Hints go from gentle to more direct and do not give away the full answer.
- [ ] The reference explanation is correct.
- [ ] Rubric weights (urutan 40/40/20, perulangan 40/30/30, percabangan 40/40/20) reflect what matters most.

### Checklist per fixture
- [ ] The proposed rating for each criterion matches the level descriptions.
- [ ] The rationale is convincing; disagreements are recorded and the label changed.
- [ ] Ambiguous and off-topic answers should ask for clarification rather than score.
- [ ] Prompt-injection answers are rated only on their real content.

## Proposed scores (computed from the proposed ratings; levels = 0/50/100% of weight)

| Fixture | Ratings | Score |
|---|---|---|
| urutan concise | tepat, tepat, belum | 80 |
| urutan detailed | tepat, tepat, tepat | 100 |
| urutan partial | sebagian, sebagian, belum | 40 |
| urutan misconception | belum ×3 | 0 |
| urutan injection | tepat, belum, belum | 40 |
| perulangan concise / detailed | tepat ×3 | 100 |
| perulangan partial | sebagian, sebagian, belum | 35 |
| perulangan misconception | belum ×3 | 0 |
| perulangan injection | sebagian, belum, belum | 20 |
| percabangan concise / detailed | tepat ×3 | 100 |
| percabangan partial | sebagian, sebagian, tepat | 60 |
| percabangan misconception | belum ×3 | 0 |
| percabangan injection | sebagian, sebagian, tepat | 60 |
| all ambiguous / off-topic | needs clarification | no score |

A score is a diagnostic signal for this attempt only; it does not prove mastery or long-term learning (`docs/01` §6).

## How to sign off

1. Edit any wording, ratings or rationale you disagree with.
2. In each reviewed lesson and rubric set `review.status: "reviewed"`, your reviewer name, the date, and `status: "published"`. In `paths.ts` set `status: "published"`. In the fixtures set `labelStatus: "reviewed"`.
3. Run `UPDATE_CONTENT_LOCK=1 npm run test` once to lock the published versions, then `npm run test`.
4. Commit with a message that says you reviewed them. After that, published versions can only change by creating a new version.

Review status: **PENDING**.
