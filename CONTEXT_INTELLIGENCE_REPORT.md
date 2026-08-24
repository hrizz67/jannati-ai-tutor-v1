# Context Intelligence Report

Generated: 2026-07-05

## Architecture

Sprint 14C adds a generic Context Intelligence Engine to the existing Question Intelligence Platform. It rotates safe Year 2 names, objects, places, and situations while preserving question IDs, correct answers, SK/SP/UASA metadata, difficulty, learning objectives, AI recommendation logic, and adaptive behaviour.

Pipeline:

1. `contextPools.js` defines approved Year 2-safe context pools.
2. `contextRegistry.js` maps questions to reusable context groups and identifies protected Science, Islam, and Arabic content.
3. `contextEngine.js` rotates safe context tokens behind `QUESTION_CONTEXT_ENGINE=true`.
4. `contextAnalytics.js` measures context, name, object, place diversity and reuse.
5. `contextValidator.js` detects repeated/unsafe context changes.
6. `sessionPlanner.js` applies Context Intelligence after Stem Intelligence.

## Context Groups

- `people_year2`
- `school_objects`
- `fruits`
- `animals`
- `transport`
- `classroom`
- `home`
- `garden`
- `market`
- `mosque`

People pool includes: Ali, Aiman, Amir, Hakim, Adam, Sara, Siti, Aina, Nurul, Hana.

## Files Created

- `src/ai/question/contextEngine.js`
- `src/ai/question/contextRegistry.js`
- `src/ai/question/contextPools.js`
- `src/ai/question/contextValidator.js`
- `src/ai/question/contextAnalytics.js`

## Files Modified

- `src/ai/question/featureFlags.js`
- `src/ai/question/sessionPlanner.js`
- `src/ai/question/questionEngine.js`
- `src/ai/question/historyEngine.js`
- `src/ai/memoryEngine.js`
- `src/App.jsx`
- `scripts/validate/questionValidator.js`
- validation report outputs under `reports/validation/`
- build outputs under `dist/`

## Feature Flag

- `QUESTION_CONTEXT_ENGINE=true`

If disabled, legacy context text is returned.

## Validation Result

Command: `npm run validate`

Result: pass

- Errors: 0
- Warnings: 0
- Info: 12000

## Build Result

Command: `npm run build`

Result: pass

## Stress Test

Simulated learning sessions: 5000

- Generated questions: 100000
- Failed sessions: 0
- Context diversity: 77
- Name reuse: 90.53%
- Object reuse: 14.15%
- Context reuse: 23.3%
- Unsafe context changes: 0
- Duplicate percent: 0%
- Average selection time: 21.745 ms

## Performance

Context Intelligence stayed within the existing validation/build flow. Average selection time across the 5000-session stress test was 21.745 ms.

## Compatibility

The engine does not mutate:

- Question IDs
- Correct answers
- SK
- SP
- UASA metadata
- Difficulty
- Learning objectives
- AI recommendation logic
- Existing adaptive behaviour

Science facts, religious facts, Quran/hadis/doa/hukum/Arabic text, and Arabic words are protected. Context rotation only changes recognized safe tokens and blocks accepted-answer terms.

## Known Limitations

- Name reuse is high because many existing question stems have no rotatable person token or are protected by Science/Islam/Arabic safety rules.
- Context pools are intentionally small and Year 2-safe for this sprint.
- Situation rotation is conservative and mostly deferred until explicit templates are introduced.

## Roadmap For Sprint 14D

- Add explicit context metadata to question banks.
- Expand safe object/place pools by subject and topic.
- Add template-aware context slot replacement.
- Add teacher review tools for protected context decisions.
- Add richer situation rotation once templates are available.
