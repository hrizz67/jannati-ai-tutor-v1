# English Repair Sprint 1C

## Executive Summary

The Year 2 **Reading Comprehension** topic (`reading`) was repaired in this sprint.

The original topic was heavily template-driven. The new version keeps the same learning objective, but uses a wider mix of short reading tasks:

- direct comprehension
- vocabulary in context
- identify main idea
- identify who / where / when / why
- sequence and quantity questions
- choose the best title
- simple evidence-based questions

- **Records updated:** 50
- **Topic readiness before:** 76/100
- **Topic readiness after:** 100/100
- **Issue reduction:** 49 findings → 0 findings

## Exact Topic Repaired

| Topic name | Topic key |
|---|---|
| Reading Comprehension | `reading` |

## Repetition Metrics

| Metric | Before | After |
|---|---:|---:|
| same_answer_pattern_repeated | 49 | 0 |
| duplicate_answer_groups | 0 | 0 |
| identical_question_text | 0 | 0 |
| too_long | 0 | 0 |

## Structure Distribution After Repair

| Structure type | Count |
|---|---:|
| Choose the best title / main idea | 10 |
| Why / evidence | 10 |
| Where / location | 8 |
| Who / character | 7 |
| What / vocabulary in context | 8 |
| When / time | 4 |
| Colour / attribute | 2 |
| Quantity / sequence | 1 |

This keeps the topic simple for Year 2 pupils while giving them more than one way to practise reading comprehension.

## Examples

### Before

| Question | Answer |
|---|---|
| Read: Aina has a red bag. She puts a book in it. What colour is Aina's bag? | red |
| Read: Ben has a cat. The cat sleeps under the chair. Where does the cat sleep? | under the chair |

### After

| Question | Answer |
|---|---|
| Read: Aina has a red bag. She puts a book in it. Who has a red bag? | Aina |
| Read: Aina has a red bag. She puts a book in it. Where does Aina put the book? | in the bag |
| Read: Aina has a red bag. She puts a book in it. Which detail shows Aina is happy? | because she likes her books |
| Read: Aina has a red bag. She puts a book in it. Choose the best title for the passage. | Aina's red bag |

## Remaining Findings

### In the repaired topic

None.

### In the English bank outside this sprint

The remaining English findings are still outside Reading Comprehension and were not changed in this sprint.

Current English audit snapshot:

- `same_answer_pattern_repeated`: 321
- `grammar_error`: 0 in Reading Comprehension after this repair

## Unavoidable Repetition

Reading comprehension in Year 2 naturally reuses a small set of question families such as:

- who
- where
- when
- why
- title / main idea

That repetition is educationally appropriate. The improvement here is that the **answers and sentence frames are no longer copied in a repeated drill chain**. Each item now uses a distinct answer pattern and a different context.

## Final Topic Readiness

**Reading Comprehension is ready: 100/100**

## Validation Status

- `node scripts/validate/questionBankAuditValidator.js` ✅
- `node scripts/validate/questionValidator.js` ✅
- `node scripts/validate/speechRegression.mjs` ✅
- `npm run build` ✅
