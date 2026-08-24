# QIP Foundation Report

Generated: 2026-07-05

## Architecture

Sprint 14A adds the core Jannati Question Intelligence Platform foundation in compatibility mode. It prepares enterprise-style question selection, metadata, history, duplicate detection, diversity analytics, and feature flags without migrating question banks or changing existing learning behaviour.

Runtime flow:

1. `questionEngine.js` resolves feature flags and orchestrates the foundation path.
2. `questionRegistry.js` attaches runtime metadata to the existing question objects.
3. `sessionPlanner.js` prepares the current legacy-generated question stream for foundation checks.
4. `questionSelector.js` checks history, duplicate state, topic balance, and difficulty balance.
5. `duplicateDetector.js` detects repeated question ID, stem, topic, template, context, and answer pattern.
6. `diversityEngine.js` calculates topic, stem, difficulty, context, template, and overall diversity from 0-100.
7. `analyticsEngine.js` remains available for deeper QIP analytics.
8. `historyEngine.js` persists recent question memory inside AI Memory.
9. `featureFlags.js` keeps future engines disabled until Sprint 14B+.

## Modules Created

- `src/ai/question/questionEngine.js`
- `src/ai/question/questionRegistry.js`
- `src/ai/question/questionSelector.js`
- `src/ai/question/historyEngine.js`
- `src/ai/question/duplicateDetector.js`
- `src/ai/question/diversityEngine.js`
- `src/ai/question/analyticsEngine.js`
- `src/ai/question/sessionPlanner.js`
- `src/ai/question/featureFlags.js`

## Runtime Metadata

Every registered question receives metadata under `question.qip.metadata`:

- `questionId`
- `subject`
- `topic`
- `difficulty`
- `SK`
- `SP`
- `estimatedTime`
- `templateId`
- `variationGroup`
- `contextGroup`

## Feature Flags

Current defaults:

- `QUESTION_INTELLIGENCE=true`
- `QUESTION_TEMPLATE_ENGINE=false`
- `QUESTION_CONTEXT_ENGINE=false`
- `QUESTION_NUMBER_ENGINE=false`
- `QUESTION_DISTRACTOR_ENGINE=false`

The foundation can be disabled with `QUESTION_INTELLIGENCE=false` or `VITE_QUESTION_INTELLIGENCE=false`. When disabled, `questionEngine.js` returns the previous legacy diversity result directly.

## Compatibility

No question banks were migrated. The foundation consumes the existing legacy question stream, attaches metadata, and records debug/analytics information. Template, context, number, and distractor engines remain disabled by default, so existing learning behaviour is preserved.

No curriculum engines, adaptive learning, AI recommendations, or learning objectives were changed.

## Validation

Command: `npm run validate`

Result: pass

- Errors: 0
- Warnings: 0
- Info: 12000

## Build

Command: `npm run build`

Result: pass

## Stress Test

Simulated learning sessions: 1000

- Generated questions: 20000
- Failed sessions: 0
- Average diversity: 81
- Duplicate percent: 0%
- Average selection time: 23.043 ms

Difficulty balance:

- mudah: 8735
- sederhana: 6437
- sukar: 4828

## Known Limitations

- Sprint 14A is foundation-only and metadata-first.
- Question banks are not migrated to explicit templates yet.
- Topic and difficulty balancing currently wraps the existing legacy-selected stream.
- Repeated answer patterns are diagnostic because many curriculum-aligned questions intentionally share answer formats.
- The hidden developer panel uses the existing quiz surface and does not redesign UI.

## Roadmap To Sprint 14B

- Add explicit template metadata to question banks.
- Enable controlled stem variation behind `QUESTION_TEMPLATE_ENGINE`.
- Add safe context grouping and context rotation behind `QUESTION_CONTEXT_ENGINE`.
- Add operation-specific number generation behind `QUESTION_NUMBER_ENGINE`.
- Add distractor generation behind `QUESTION_DISTRACTOR_ENGINE`.
- Add teacher-facing analytics for selector rejections, history pressure, and diversity trends.
