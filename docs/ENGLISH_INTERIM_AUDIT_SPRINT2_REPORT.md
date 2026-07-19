# English Interim Audit Sprint 2

# Executive Summary

The English Year 2 question bank is in much better shape after the completed repair work on:

- Simple Sentences
- Prepositions
- Reading Comprehension
- Verbs

Current audit snapshot:

- **Overall English readiness:** **88.1/100**
- **Overall improvement:** **+9.2 points** from **78.9/100**
- **Release recommendation:** **MINOR REPAIR REQUIRED**

The bank is no longer showing grammar or wording blockers in the repaired topics. The remaining English issues are still concentrated in the unrepaired repetition-heavy topics.

---

# Topic Scores

| Topic | Score | Status |
|---|---:|---|
| Simple Sentences | 100 | Ready |
| Prepositions | 100 | Ready |
| Reading Comprehension | 100 | Ready |
| Verbs | 100 | Ready |
| Numbers | 81 | Good |
| Nouns | 80 | Good |
| Adjectives | 80 | Good |
| Colours | 80 | Good |
| Animals | 80 | Good |
| Food | 80 | Good |

---

# Remaining Findings

## Critical

None.

## High

None.

## Medium

None.

## Low

| Topic | Issue | Count |
|---|---|---:|
| Colours | same_answer_pattern_repeated | 41 |
| Nouns | same_answer_pattern_repeated | 40 |
| Adjectives | same_answer_pattern_repeated | 40 |
| Animals | same_answer_pattern_repeated | 40 |
| Food | same_answer_pattern_repeated | 40 |
| Numbers | same_answer_pattern_repeated | 38 |

Total remaining English findings: **281**

Current issue mix:

- `same_answer_pattern_repeated`: **281**
- `duplicate_answer_groups`: **0**
- `duplicate_question_templates`: **0**
- `identical_question_text`: **0**
- `too_long`: **0**
- `ambiguous wording`: **0**
- `grammar issues`: **0**

---

# Improvement Table

| Metric | Original | Current | Improvement |
|---|---:|---:|---:|
| Overall readiness | 78.9 | 88.1 | +9.2 points (+11.7%) |
| same_answer_pattern_repeated | 403 | 281 | -122 (-30.3%) |
| identical_question_text | 10 | 0 | -10 (-100%) |
| too_long | 9 | 0 | -9 (-100%) |
| duplicate_answer_groups | 0 | 0 | 0 |
| duplicate_question_templates | 0 | 0 | 0 |

---

# Recommended Remaining Work

Prioritised repair order:

1. **Colours**
2. **Nouns**
3. **Adjectives**
4. **Animals**
5. **Food**
6. **Numbers**

These are the only remaining English topics with reported repetition signals in the latest audit.

---

# Final Interim Verdict

**English is improved and stable, but not fully ready yet.**

Recommended status: **MINOR REPAIR REQUIRED**

Reason:

- all repaired topics are now clean
- no critical/high/medium findings remain in English
- 281 low-severity repetition findings still remain in the untouched topics

## Validation

- `node scripts/validate/questionBankAuditValidator.js` ✅
- `node scripts/validate/questionValidator.js` ✅
- `node scripts/validate/speechRegression.mjs` ✅
- `npm run build` ✅
