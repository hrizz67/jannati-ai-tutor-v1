# English Repair Sprint 1E

## Executive Summary

Records updated: 4 noun questions.

This sprint focused on the Year 2 English topic `Nouns` only. I replaced four repeated noun prompts with more varied, Year 2-friendly noun items so the topic no longer contributes duplicate answer-pattern findings.

Current topic readiness:

- Nouns: 100/100
- Overall English average readiness: 90/100

Readiness improvement:

- Original English readiness: 79/100
- Current English readiness: 90/100
- Improvement: +11 points

Release status: stronger than the original audit, with remaining findings now concentrated in other untouched English topics.

---

## Topic Readiness

| Topic | Before | After | Status |
|---|---:|---:|---|
| Nouns | 80 | 100 | Improved |
| Verbs | 80 | 100 | Already repaired |
| Prepositions | 79 | 100 | Already repaired |
| Reading Comprehension | 76 | 100 | Already repaired |
| Simple Sentences | 74 | 100 | Already repaired |
| Adjectives | 80 | 80 | Unchanged |
| Colours | 80 | 80 | Unchanged |
| Numbers | 81 | 81 | Unchanged |
| Animals | 80 | 80 | Unchanged |
| Food | 80 | 80 | Unchanged |

Average readiness:

- Before: 78.9/100
- After: 90.1/100

---

## Repetition Reduction

Current English audit snapshot:

| Metric | Before | After |
|---|---:|---:|
| same_answer_pattern_repeated | 245 | 241 |
| duplicate_answer_groups | 0 | 0 |
| identical_question_text | 0 | 0 |
| too_long | 0 | 0 |

Nouns-specific change:

| Metric | Before | After |
|---|---:|---:|
| Nouns same_answer_pattern_repeated | 4 | 0 |

The four removed noun repetitions were:

- `ENG-NOUNS-027`
- `ENG-NOUNS-028`
- `ENG-NOUNS-031`
- `ENG-NOUNS-032`

---

## Structure Distribution

### Before

The noun topic was dominated by a narrow set of short fill-in-the-blank prompts with repeated answer patterns such as:

- animal naming
- classroom object naming
- simple person naming
- place naming

### After

The noun topic now uses a wider mix of Year 2 noun practice:

- sentence completion
- classroom context
- home context
- daily-life context
- people / family nouns
- animal nouns
- object nouns
- place nouns
- proper nouns

This gives pupils more varied practice while keeping the learning objective unchanged.

---

## Examples

### Before

- `The red ________ is on the floor.`
- `The black ________ is sleeping.`
- `The little ________ is happy.`
- `The yellow ________ is late.`

### After

- `The bright ________ is beside the desk.` → `window`
- `The small ________ is sleeping on the mat.` → `puppy`
- `The happy ________ is in the photo.` → `baby`
- `The long ________ is late.` → `train`

---

## Remaining Findings

Current English findings in the latest audit snapshot:

| Topic | Remaining findings |
|---|---:|
| Simple Sentences | 42 |
| Colours | 41 |
| Adjectives | 40 |
| Animals | 40 |
| Food | 40 |
| Numbers | 38 |
| Nouns | 0 |

The remaining findings are all `same_answer_pattern_repeated` and are concentrated in untouched topics.

---

## Validation

Validation status:

- `node scripts/validate/questionBankAuditValidator.js` → passed
- `node scripts/validate/questionValidator.js` → passed with 0 errors, 38 warnings
- `node scripts/validate/speechRegression.mjs` → passed
- `npm run build` → passed

---

## Final Readiness

- Final English readiness: 90/100
- Records updated in this sprint: 4
- Issue reduction: 4 noun repetition findings removed
- Validation status: passed

