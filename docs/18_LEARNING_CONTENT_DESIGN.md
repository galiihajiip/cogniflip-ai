# Learning Content and Assessment Design

## 1. Curriculum
The competition-facing path serves elementary-school coding. Prefer tangible examples, short explanations, and opportunities to teach/predict/debug over long theory.

Suggested sequence:
1. Sequence: instructions run in an order.
2. Events/input/output: a program reacts to an action and shows a result.
3. Loops: a group of instructions repeats.
4. Conditions: a program chooses a path based on a condition.
5. Variables: a named value can change or be reused.
6. Debugging: explain expected versus actual behavior.

Do not add lessons solely to inflate the catalogue. Each lesson needs a reviewed objective and rubric.

## 2. Lesson schema
Every lesson specifies ID/slug, title, locale, age/grade band, prerequisite, difficulty, one observable objective, short concept text, correct example and explanation, activity instructions, rubric version/weights, accepted evidence/alternative explanations, common misconceptions, bounded hint sequence, optional challenge/expected output/tests/reference solution, content version, and source/review notes.

## 3. Rubric principles
- Criteria describe observable understanding, not personality, confidence, grammar or verbosity.
- Accept correct paraphrases and everyday language.
- Do not require a keyword unless it is directly part of the learning objective.
- Define score levels with examples.
- Separate insufficient evidence from demonstrated misunderstanding.
- Explain results in plain language to children.
- Version lesson weights; weights sum to declared total.
- Review false-pass/false-fail cases before publishing.

A loop lesson may assess the purpose of repetition, what is repeated, a valid example, and how a count/condition stops execution. Actual weights must be approved in the fixture, not invented by the model.

## 4. Hint progression
1. Re-focus on relevant part of learner's own response.
2. Ask one targeted question.
3. Give a small cue or analogy.
4. Offer a partial example if still stuck and policy permits.
5. Reveal a complete explanation only when appropriate, inviting the learner to restate it.

Do not repeat a hint indefinitely. Bound attempts and allow pause/review.

## 5. Predict-before-run
- Ask for prediction/reasoning before execution.
- Expected output must come from reviewed fixtures or a real supported runtime test.
- Compare prediction with actual result and explain relevant line/step.
- If execution fails for infrastructure reasons, do not mark the learner wrong.
- Reattempt should ask the learner to explain behavior, not only memorize output.

## 6. Content validity
Review examples against the specified language/runtime version. Prefer small snippets without unnecessary dependencies for beginners. Store provenance for non-obvious content. Version tests/fixtures when lessons or rubrics change. Do not claim efficacy without an appropriate user evaluation.
