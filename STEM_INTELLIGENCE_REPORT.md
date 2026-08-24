# Stem Intelligence Report

Generated: 2026-07-05

## Architecture

Sprint 14B adds a generic Stem Intelligence Engine inside the existing Question Intelligence Platform. It rotates question wording while preserving question IDs, correct answers, SK/SP/UASA metadata, difficulty, AI recommendation logic, and learning behaviour.

Pipeline:

1. `stemRegistry.js` maps each question to a variation group.
2. `stemPatterns.js` stores safe wording patterns by group and subject style.
3. `stemEngine.js` chooses a session-safe wording variant.
4. `stemAnalytics.js` measures unique stems, repeated stems, average stem diversity, and reuse rate.
5. `stemValidator.js` checks mappings, repeated/near-identical wording, and unused groups.
6. `sessionPlanner.js` applies stems only when `QUESTION_STEM_ENGINE=true`.

Arabic text is protected and returned unchanged unless verified variants are explicitly added. Pendidikan Islam uses only conservative wording changes that do not alter religious meaning.

## Variation Groups

- `verb_identification`
- `noun_identification`
- `adjective_identification`
- `choose_correct_answer`
- `fill_blank`
- `multiple_choice`
- `sentence_building`
- `reading_comprehension`
- `listening_comprehension`
- `math_calculation`
- `science_function`
- `islam_safe_recall`
- `arabic_verified`

Unused in the current validation sample:

- `sentence_building`
- `science_function`

## Files Created

- `src/ai/question/stemEngine.js`
- `src/ai/question/stemRegistry.js`
- `src/ai/question/stemPatterns.js`
- `src/ai/question/stemValidator.js`
- `src/ai/question/stemAnalytics.js`

## Files Modified

- `src/ai/question/featureFlags.js`
- `src/ai/question/historyEngine.js`
- `src/ai/question/sessionPlanner.js`
- `src/ai/question/questionEngine.js`
- `src/App.jsx`
- `scripts/validate/questionValidator.js`
- validation report outputs under `reports/validation/`
- build outputs under `dist/`

## Feature Flag

- `QUESTION_STEM_ENGINE=true`

If disabled, the registered legacy stem is returned without Stem Intelligence rotation.

## Developer Debug

The hidden developer panel now includes:

- Original stem
- Selected stem
- Variation group
- Selection reason
- Reuse count

## Validation

Command: `npm run validate`

Result: pass

- Errors: 0
- Warnings: 0
- Info: 12000

## Build

Command: `npm run build`

Result: pass

## Performance

Stress test:

- Simulated learning sessions: 5000
- Generated questions: 100000
- Failed sessions: 0
- Stem diversity: 100
- Stem reuse rate: 0%
- Repeated stems: 0
- Average diversity score: 81
- Duplicate percent: 0%
- Average selection time: 20.517 ms

## Compatibility

The engine does not mutate:

- Question IDs
- Correct answers
- SK
- SP
- UASA metadata
- Difficulty
- AI recommendation logic
- Learning engine behaviour

The stem layer only changes the displayed wording when the feature flag is enabled. All downstream answer checking continues to use the original answer metadata.

## Roadmap For Sprint 14C

- Add curated verified Arabic stem variants.
- Add richer Science function mappings with DSKP-safe term metadata.
- Add per-subject teacher approval lists for sensitive topics.
- Persist stem reuse analytics into a teacher-only diagnostics view.
- Add automated near-duplicate clustering for newly authored question banks.
