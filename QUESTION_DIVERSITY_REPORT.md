# Question Diversity Report

Generated: 2026-07-05

## Sprint 14 Scope

Implemented the Question Diversity Engine (QDE) for question selection, question variation, number variation, topic rotation, difficulty rotation, duplicate detection, virtual math templates, session history, internal diversity scoring, teacher debug visibility, and validator simulation.

Protected engines were not edited:
- Learning engine
- Adaptive engine
- AI recommendation engine
- Curriculum engine

## Files Created

- `src/ai/diversity/questionDiversityEngine.js`
- `src/ai/diversity/stemVariationEngine.js`
- `src/ai/diversity/numberVariationEngine.js`
- `src/ai/diversity/topicRotationEngine.js`
- `src/ai/diversity/duplicateDetector.js`
- `src/ai/diversity/difficultyRotationEngine.js`
- `src/ai/diversity/sessionHistoryEngine.js`

## Files Modified

- `src/App.jsx`
- `src/ai/memoryEngine.js`
- `src/styles/style.css`
- `scripts/validate/questionValidator.js`
- `reports/validation/question-report.json`
- `reports/validation/summary.json`
- `reports/validation/summary.md`
- `reports/validation/validation-summary.md`
- `validation-summary.md`

## Question Diversity Statistics

- Simulated sessions: 1000
- Simulated questions: 20000
- Failed QDE sessions: 0
- Average diversity score: 76
- Repeated templates after QDE simulation: 0
- Repeated number patterns after QDE simulation: 0
- Repeated answer patterns detected in static bank diagnostics: 2482

## Duplicate Reduction

The validator now rejects repeated in-session IDs, stems, templates, and math number sequences. The 1000-session QDE simulation completed with:

- Duplicate IDs: 0
- Repeated stems: 0
- Repeated templates: 0
- Repeated number sequences: 0

## Validation Result

Command: `npm run validate`

Result: pass

- Errors: 0
- Warnings: 0
- Info: 12000

## Build Result

Command: `npm run build`

Result: pass

Build output completed successfully with Vite.

## Known Limitations

- Answer-pattern repetition is reported as a static bank diagnostic, not a session-failing rule yet, because many curriculum-aligned banks intentionally reuse answer formats.
- Adaptive-started lessons preserve the requested adaptive question order so reinforcement can override QDE rotation when explicitly needed.
- Virtual templates are currently focused on Year 2 math addition and subtraction; more subjects can be added by extending template metadata.
