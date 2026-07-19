# English Content Audit Sprint 1

## Executive Summary

The English Year 2 question bank is broadly correct and classroom-friendly, but it still shows a strong amount of template repetition across the bank.

- Overall readiness: **79/100**
- Highest scoring topic: **Numbers** — **81/100**
- Lowest scoring topic: **Simple Sentences** — **74/100**
- Average readiness: **78.9/100**

The content does not show blocking grammar or spelling problems in the automated audit. The main quality issue is structural repetition, especially in the sentence-focused topics.

## Topic Scores

| Topic | Score |
|---|---:|
| Numbers | 81 |
| Nouns | 80 |
| Verbs | 80 |
| Adjectives | 80 |
| Colours | 80 |
| Animals | 80 |
| Food | 80 |
| Prepositions | 79 |
| Reading Comprehension | 76 |
| Simple Sentences | 74 |

## Findings

### Critical

- 0

### High

- 0

### Medium

- 0

### Low

- 422 low-severity findings across the English bank
- Main issue types:
  - `same_answer_pattern_repeated`: 403
  - `identical_question_text`: 10
  - `too_long`: 9

## Diversity Analysis

### Question types

English uses a simple and suitable Year 2 question style, but many items repeat the same surface structure.

### Answer diversity

Answer diversity is acceptable for a Year 2 bank, but many repeated drills share the same answer patterns, which is why the repetition detector is still active.

### Contextual variety

Context variety is reasonable, but can still improve in:

- Simple Sentences
- Reading Comprehension
- Prepositions
- Colours

### Difficulty balance

The bank is balanced at Year 2 level. The main problem is not difficulty, but repetition and formulaic wording.

## Priority Ranking

Top repair order:

1. **Simple Sentences** — highest repetition concentration
2. **Reading Comprehension**
3. **Prepositions**
4. **Colours**
5. **Nouns**
6. **Verbs**
7. **Adjectives**
8. **Animals**
9. **Food**
10. **Numbers**

## Release Recommendation

**MINOR REPAIR**

The English bank is functional and mostly correct, but it still needs a focused diversity pass before it feels fully polished for release. There are no correctness blockers, but the repeated template pattern is still too visible across the bank.

## Validation Run

- `node scripts/validate/questionBankAuditValidator.js`
  - Result: 0 critical, 90 high, 232 medium, 4238 low across the full repository
  - English-specific findings: 422 low-severity findings
- `node scripts/validate/questionValidator.js`
  - Result: 0 errors, 47 warnings, 0 info
- `node scripts/validate/speechRegression.mjs`
  - Result: passed
- `npm run build`
  - Result: passed

## Notes for the Repair Roadmap

The next best improvement is not correctness cleanup. It is a variety pass that reduces repeated sentence openings and repeated answer pattern clusters in the sentence-heavy English topics.
