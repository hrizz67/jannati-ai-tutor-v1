# English Repair Sprint 1A

## Executive Summary

`Simple Sentences` was diversified across all 50 items while preserving every question ID and every correct answer.

- Items updated: 50
- Readiness score: 78/100
- Main improvement: more varied, shorter, and more natural Year 2 sentence prompts
- Main remaining signal: low-severity repetition remains because the topic still drills a compact set of very common sentence patterns

## Structure Distribution

### Before

| Structure family | Count |
|---|---:|
| Fill in the blank | 10 |
| Write the missing word | 10 |
| Read the sentence | 10 |
| Look at the sentence | 10 |
| Choose the correct answer | 10 |

### After

| Structure family | Count |
|---|---:|
| Sentence completion | 10 |
| Choose the correct word | 10 |
| Dialogue / classroom / home context | 10 |
| Picture-style descriptive prompts | 10 |
| Short sentence identification | 10 |

## Repetition Reduction

| Metric | Before | After | Change |
|---|---:|---:|---:|
| same_answer_pattern_repeated | 52 | 42 | -10 |
| duplicate_answer_groups | 5 | 5 | 0 |
| duplicate_question_templates | 0 | 0 | 0 |
| too_long | 0 | 0 | 0 |

Notes:

- The surface wording is now more natural and less formulaic.
- The remaining repetition is expected in a sentence-pattern practice topic, but it is now less obvious.

## Examples

### Before

- `Fill in the blank. I ________ a pupil.`
- `Read and fill in the blank: Complete the sentence. I ________ a pupil.`
- `In Simple Sentences, choose one word: Complete the sentence. I ________ a pupil.`

### After

- `At school, I ________ a pupil.`
- `On the playground, I ________ a pupil.`
- `My answer is simple: I ________ a pupil.`

## Remaining Findings

### Critical

- 0

### High

- 0

### Medium

- 0

### Low

- 412 low-severity findings in the English bank

Current English low-severity issue types:

| Issue type | Count |
|---|---:|
| same_answer_pattern_repeated | 403 |
| too_long | 9 |

## Final Topic Readiness

| Topic | Score | Status |
|---|---:|---|
| Simple Sentences | 78 | Improved |
| Reading Comprehension | 76 | Needs polish |
| Prepositions | 77 | Needs polish |
| Colours | 80 | Good |
| Nouns | 80 | Good |
| Verbs | 80 | Good |
| Adjectives | 80 | Good |
| Animals | 80 | Good |
| Food | 80 | Good |
| Numbers | 81 | Strong |

## Priority Ranking

1. Reading Comprehension
2. Prepositions
3. Simple Sentences
4. Colours
5. Nouns
6. Verbs
7. Adjectives
8. Animals
9. Food
10. Numbers

## Final Topic Readiness

**Simple Sentences:** 78/100

The topic is more natural and varied for Year 2 learners now, but the bank as a whole still needs a broader diversity pass before it feels fully polished.

## Release Recommendation

**MINOR REPAIR**

The English bank is usable and the repaired topic is cleaner, but the overall bank still has too much repeated grammar drilling to call it fully release-ready without a broader diversity pass.

## Validation Status

- `node scripts/validate/questionBankAuditValidator.js` ✅
- `node scripts/validate/questionValidator.js` ✅ (`0 errors, 37 warnings, 0 info`)
- `node scripts/validate/speechRegression.mjs` ✅
- `npm run build` ✅

## Notes

- The repository-wide audit still reports the larger Math/Arabic repetition clusters.
- This sprint stayed tightly scoped to `Simple Sentences` only.
