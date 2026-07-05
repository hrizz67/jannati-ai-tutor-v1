# Question Intelligence Report

Generated: 2026-07-05

## Architecture

Sprint 14 QIP adds a question intelligence layer above the static question bank. The platform builds a balanced session first, then applies safe surface variation without changing learning objectives, SK/SP metadata, DSKP alignment, difficulty, or the correct answer.

Pipeline:

1. `questionEngine.js` orchestrates session generation.
2. `sessionEngine.js` balances the base question set and applies QIP transforms.
3. `stemEngine.js` rotates wording variants.
4. `contextEngine.js` rotates age-appropriate names, places, objects, and situations only when they are not accepted answers.
5. `numberEngine.js` rotates safe Year 2 numbers only for recognized addition/subtraction prompts.
6. `templateEngine.js` preserves template metadata.
7. `distractorEngine.js` generates common-misconception distractor metadata while preserving the correct answer.
8. `duplicateEngine.js` checks session signatures.
9. `historyEngine.js` stores recent question, stem, and template history in AI Memory.
10. `analyticsEngine.js` calculates diversity and balance metrics.

## Files Created

- `src/ai/question/questionEngine.js`
- `src/ai/question/stemEngine.js`
- `src/ai/question/contextEngine.js`
- `src/ai/question/templateEngine.js`
- `src/ai/question/numberEngine.js`
- `src/ai/question/distractorEngine.js`
- `src/ai/question/duplicateEngine.js`
- `src/ai/question/sessionEngine.js`
- `src/ai/question/analyticsEngine.js`
- `src/ai/question/historyEngine.js`

## Files Modified

- `src/App.jsx`
- `src/ai/memoryEngine.js`
- `src/ai/diversity/numberVariationEngine.js`
- `scripts/validate/questionValidator.js`
- `reports/validation/question-report.json`
- `reports/validation/summary.json`
- `reports/validation/summary.md`
- `reports/validation/validation-summary.md`
- `validation-summary.md`

## Statistics

- Static question bank: 4000 questions
- Subjects covered: 8
- Difficulty distribution: 1600 mudah, 1600 sederhana, 800 sukar
- Last-question memory target: 100 questions
- Last-stem memory target: 30 stems
- Last-template memory target: 20 templates

## Stress Test Results

- Simulated learning sessions: 10000
- Simulated generated questions: 200000
- Failed sessions: 0
- Protected duplicate rate: 0%
- Average diversity score: 77
- Validation result: pass, 0 errors, 0 warnings
- Build result: pass

Topic balance was even across the stress sample: each selected topic bucket appeared 5000 times. Difficulty balance across generated questions:

- mudah: 87554
- sederhana: 64315
- sukar: 48131

## Duplicate Diagnostics

Protected duplicate checks passed for repeated IDs, stems, templates, and number sequences.

Diagnostic-only repeats found:

- Repeated answer patterns in static bank: 2482
- Repeated context variants: 4354
- Repeated distractor signatures: 167567
- Repeated answer positions: 160000
- Diagnostic repeat event rate: 165.96%

These are tracked for teacher/developer visibility. They are not treated as protected failures because answer positions are limited by four-option layouts and many subjects intentionally share common misconception distractor families.

## Known Limitations

- Distractor generation is metadata-first; the current quiz UI remains free-text, so distractors are available for future option-based views but not shown in the main quiz flow.
- Context rotation is conservative to avoid changing accepted answers or curriculum facts.
- Number rotation is limited to safely recognized addition/subtraction prompts. Multiplication, division, measurement, and money prompts keep original numbers unless a safe template is added.
- Template signatures still lean on bank IDs when no explicit template metadata exists.

## Future Improvements

- Add explicit template metadata to every generated bank item.
- Add subject-specific misconception libraries for distractors.
- Expand safe number generators for multiplication, division, money, time, mass, length, and fractions.
- Add a teacher-only analytics view for QIP balance and diagnostic repeats.
- Add option-based rendering for questions that include generated distractors.
