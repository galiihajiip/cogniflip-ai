# Coding Missions: Predict-before-Run and Debug Robot (BLOCK 40–41)

## Content (`src/server/missions/content.ts`)
- 4 Predict missions (sequence, loops ×2, conditions) and 3 Debug Robot missions (loops `range`, conditions `>` vs `>=`, sequence use-before-assign). All are short Python 3 snippets for grades 4–6.
- **Verified with a real interpreter:** `tests/unit/mission-fixtures.test.ts` runs every snippet with CPython (`python3 -I`, empty environment) on the dev/CI machine. The checks:
  - each predict mission prints exactly its expected output;
  - each buggy program really misbehaves (wrong output or crash);
  - each answer-key fix produces the intended output.

  Result on 2026-10-13 with Python 3.14.6: 7/7 pass. These are our own fixed snippets, never learner code.
- **Review status:** AI-drafted, **not human-reviewed**. Missions stay `draft`; drafts are listed by default, labelled, unless `ALLOW_DRAFT_CONTENT=false` (D-013, `LESSON_REVIEW.md`).

## Behaviour
- Learners see the code (and for debugging, the intended behaviour and output). They **never** see the expected output, answer key, fix or hints in advance.
- **Predict:**
  - the prediction is stored as its own attempt and compared with the reviewed fixture (trailing whitespace ignored);
  - the result is labelled `outputSource: "reviewed_fixture"`. Execution is disabled, so no output is ever presented as a real run;
  - a wrong prediction gets one hint plus "explain the difference"; reflections are stored as separate attempts;
  - retries are allowed.
- **Debug Robot:**
  - the learner's diagnosis is judged by AI against the reviewed answer key (paraphrases accepted);
  - validation requires a quote from the learner for any credit, rejects evidence the learner didn't write, rejects feedback that reveals the key, and rejects extra fields such as `xp`;
  - one progressive hint per miss;
  - the Indonesian explanation and the fix are revealed after a correct diagnosis or 3 misses;
  - a provider failure returns an error and is **not** recorded as a wrong diagnosis.
- **XP (`xp-rules-v2`):**
  - `prediction_correct` +5 and `bug_diagnosed` +10, once per mission;
  - sourced from the first correct stored attempt, signed-in learners only;
  - a database constraint requires exactly one source (session or mission attempt);
  - existing v1 rows are untouched.
- **Endpoints:** `GET /api/missions`, `GET /api/missions/:id`, `POST /api/missions/:id/attempts` (`predict | reflect | diagnose`, idempotency key). Attempts are stored in PostgreSQL when configured, otherwise in memory.

## Verified
- `tests/unit/missions.test.ts` (14), `mission-fixtures.test.ts` (7), `reward-rules.test.ts` (mission rule).
- `tests/integration/missions.integration.test.ts` (2, PostgreSQL): every attempt stored with its source; XP awarded once per mission; guests get none; the XP source constraint holds.

## Not done
- No screens (D-009).
- No live AI judging of diagnoses (no key; mock only).
- No multiplayer use of missions (BLOCK 46 is blocked).
