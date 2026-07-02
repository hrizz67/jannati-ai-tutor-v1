# Jannati AI Tutor V2.0 Sprint 7 Report

## Goal

Create an offline Writing Coach with no paid API.

## Files Modified

- `src/App.jsx`
  - Added Writing Coach screen.
  - Added BM, English, and Arabic writing task sets.
  - Added five question types:
    - Arrange sentence
    - Fill in blanks
    - Short answer
    - Build sentence
    - Simple paragraph
  - Added keyword checking, spelling validation, grammar hints, AI-style explanation, and writing score.
  - Added Dashboard Writing Progress.
  - Added Parent Dashboard Writing History.
- `src/ai/memoryEngine.js`
  - Added `writingHistory` to AI Memory.
  - Added `saveWritingMemory()` for writing results.
- `src/styles/style.css`
  - Added Writing Coach and Writing Progress styling.
- `V2_SPRINT7_REPORT.md`
  - Added this implementation report.

## Logic Used

Writing Coach is rule-based and offline:

- No paid API is used.
- Each writing task defines required keywords.
- Learner answer is normalized before keyword comparison.
- Spelling validation checks words against a small per-language dictionary.
- Grammar hints check punctuation, minimum response length, and paragraph sentence count.
- AI explanation is generated locally from matched/missed keywords.

Score formula:

- Keyword coverage contributes the largest portion.
- Spelling quality contributes a smaller portion.
- Grammar hints reduce the grammar portion.
- Exact-answer tasks can receive a small exact-match bonus.

Saved result includes:

- language
- title
- mode
- score
- matched keyword count
- total keyword count
- spelling issue count
- grammar hints
- answer
- date

## Future Improvements

- Add larger grade-level dictionaries.
- Add richer Arabic morphology checks.
- Add rubric levels for content, mechanics, and sentence variety.
- Add teacher-editable writing prompts.
- Add exportable writing portfolio for parents.
