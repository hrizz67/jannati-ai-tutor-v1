# BM Knowledge Pack Template — Kata Nama Reference

## Why this pack exists

`kata_nama` is the first production-quality Bahasa Melayu knowledge pack for the Coach Knowledge Engine.
It serves as the reference implementation for future BM topic migrations.

## How future BM topics should follow it

Future topics should keep the same structure:

- `subjectId`
- `topicId`
- `displayName`
- `learningObjectives`
- `teacherExplanation`
- `simpleExplanation`
- `examples`
- `extraExamples`
- `tips`
- `memoryTips`
- `commonMistakes`
- `encouragement`
- `relatedTopics`
- `difficulty`
- `curriculum`

## Migration rules

1. Migrate one topic at a time.
2. Keep the topic-specific examples relevant and Year 2 friendly.
3. Keep teacher explanations richer than the simple explanation.
4. Use encouragement blocks for correct, retry, and excellent states.
5. Link related topics only when they are genuinely connected.
6. Avoid hardcoding knowledge inside `App.jsx` or other UI surfaces.
7. Preserve answer logic, scoring, and adaptive behavior while migrating content.

## Reference quality expectations

The reference pack should:

- teach the actual concept clearly
- include multiple valid examples
- use short, natural Malay
- avoid generic or reused wording
- provide clear support for common mistakes

## Future migration flow

| Step | Action |
|---|---|
| 1 | Create a new topic pack in `src/ai/coach/knowledge/subjects/bm/` |
| 2 | Add the knowledge pack to the BM registry entry |
| 3 | Verify the loader returns the pack correctly |
| 4 | Review the pack against Year 2 quality rules |
| 5 | Repeat for the next topic only after the previous pack is approved |

