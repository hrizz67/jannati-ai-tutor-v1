# English Repair Sprint 1F

## Executive Summary

Records updated: 50 adjective questions.

This sprint focused on the Year 2 English topic `Adjectives` only. The topic now uses more varied adjective practice with cleaner sentence patterns, clearer context, and fewer repeated structures.

Current topic readiness:

- Adjectives: 100/100
- Overall English average readiness: 90/100

Readiness improvement:

- Before this sprint: 88/100
- After this sprint: 90/100
- Improvement: +2 points

Release status: improved and stable, with the remaining repetition signals concentrated in untouched topics.

---

## Topic Readiness

| Topic | Before | After | Status |
|---|---:|---:|---|
| Nouns | 100 | 100 | Already repaired |
| Verbs | 100 | 100 | Already repaired |
| Adjectives | 80 | 100 | Improved |
| Colours | 80 | 80 | Unchanged |
| Numbers | 81 | 81 | Unchanged |
| Animals | 80 | 80 | Unchanged |
| Food | 80 | 80 | Unchanged |
| Prepositions | 100 | 100 | Already repaired |
| Simple Sentences | 74 | 74 | Unchanged |
| Reading Comprehension | 100 | 100 | Already repaired |

Average readiness:

- Before this sprint: 87.5/100
- After this sprint: 89.5/100

---

## Repetition Reduction

Current English audit snapshot:

| Metric | Before | After |
|---|---:|---:|
| same_answer_pattern_repeated | 221 | 201 |
| duplicate_answer_groups | 0 | 0 |
| identical_question_text | 2 | 0 |
| too_long | 0 | 0 |

Adjectives-specific change:

| Metric | Before | After |
|---|---:|---:|
| same_answer_pattern_repeated | 20 | 0 |
| identical_question_text | 0 | 0 |

The adjectives topic no longer contributes any repetition findings.

---

## Structure Distribution

### Before

The adjectives topic leaned heavily on very similar fill-in-the-blank prompts with repeated answer patterns and limited variation.

### After

The adjectives topic now includes a broader mix of Year 2 adjective practice:

- sentence completion
- choose the best describing word
- describe an object
- describe a person
- daily-life context
- classroom context
- compare / describe situations
- simple error-awareness style prompts

The question set still stays short and child-friendly, but the wording is more natural and less repetitive.

---

## Examples

### Before

- `The shirt is ________ after washing.`
- `The floor is ________. Be careful.`
- `The pencil is ________.`
- `The classroom is ________ and tidy.`

### After

- `After washing, the shirt looks ________ and new.` → `fresh`
- `After football, the shoes are ________.` → `muddy`
- `The straw is ________.` → `thin`
- `The classroom looks ________ because desks are in place.` → `orderly`

---

## Remaining Findings

Current English findings in the latest audit snapshot:

| Topic | Remaining findings |
|---|---:|
| Simple Sentences | 42 |
| Colours | 41 |
| Animals | 40 |
| Food | 40 |
| Numbers | 38 |
| Adjectives | 0 |
| Nouns | 0 |
| Verbs | 0 |
| Prepositions | 0 |
| Reading Comprehension | 0 |

All remaining findings are `same_answer_pattern_repeated`.

---

## Validation

Validation status:

- `node scripts/validate/questionBankAuditValidator.js` → passed
- `node scripts/validate/questionValidator.js` → passed with 0 errors, 39 warnings
- `node scripts/validate/speechRegression.mjs` → passed
- `npm run build` → passed

---

## Final Readiness

- Final English readiness: 90/100
- Records updated in this sprint: 50
- Issue reduction: 20 English repetition findings removed, including all adjective findings
- Validation status: passed

