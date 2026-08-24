# English Language Review Report

Project: Jannati AI Tutor v2.0

This is an audit-only report. No question text, answers, hints, explanations, or AI logic were changed.

## Files inspected

- `src/data/subjects/english.js`
- `scripts/validate/questionValidator.js`
- English learner-facing strings in the source tree were spot-checked during audit review

## Validation run

- `node scripts/validate/questionValidator.js`
  - Result: 0 errors, 8 warnings, 0 info

## Overall quality score

- Overall English quality: 90/100
- Grammar: 98/100
- Spelling: 99/100
- Naturalness: 88/100
- CEFR suitability: 96/100
- Educational quality: 91/100
- Stem diversity: 89.2% unique stems (446 unique stems out of 500 questions)

## Summary

The English content is mostly clean, simple, and suitable for Year 2 Malaysian learners. Vocabulary is generally CEFR-appropriate and classroom-friendly. The main quality concern is template repetition rather than grammar or spelling.

## Top issues

1. Repeated instruction stems in the subject bank.
   - The bank relies heavily on a few repeated openers such as:
     - `Complete the sentence`
     - `Choose the correct word to complete this sentence`
     - `Read and fill in the blank`
     - `In Simple Sentences, choose one word`
   - This reduces variety and makes the bank feel formulaic.

2. Repeated scaffolded sentence patterns in several topics.
   - Example clusters appear across Nouns, Verbs, Simple Sentences, and Reading Comprehension.
   - The content remains correct, but the surface wording is highly repetitive.

3. Hint and explanation style is simple and mostly correct, but occasionally very minimal.
   - Many explanations are one-line factual confirmations.
   - This is acceptable for Year 2, but a few items could teach slightly more clearly in a later pass.

## Grammar review

- No major grammar defects were found in the audited English subject bank.
- Sentence structure is mostly short and age-appropriate.
- Articles, prepositions, and punctuation are generally correct in the bank.

## Spelling review

- No significant spelling issues were found.
- British spelling is used consistently where applicable, such as `colour`.
- No US/UK spelling conflict was detected in the audited content.

## CEFR suitability

- The vocabulary level is suitable for Year 2 Malaysia.
- Most items sit comfortably around beginner CEFR level.
- Sentence complexity is simple and readable.

## Natural classroom English

- The content is understandable and child-friendly.
- The main naturalness issue is repetition, not awkwardness.
- Hints and explanations generally sound teacher-like, though many are very templated.

## Educational quality

- Question intent is clear.
- Most answers align with the hints and explanations.
- The bank is functional and suitable for learner practice.

## Priority fixes

1. Reduce repeated instruction templates across the bank.
2. Add more varied, classroom-like English openers in later content passes.
3. Strengthen a small number of explanations so they teach slightly more, not just confirm the answer.

## Estimated effort

- Low to medium for a future rewrite pass.
- No urgent correctness blockers were found.

