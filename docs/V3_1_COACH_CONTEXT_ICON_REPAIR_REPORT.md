# v3.1 Coach Context and Icon Repair

## Root causes

- Explain/Teach requests used `activeSubject` and `activeTopic` even when an adaptive question carried its own subject/topic metadata.
- Async coach responses had no request identity or source-context guard, so a delayed response could overwrite a newer modal.
- Teacher fallback data was also assigned to the Explain state, allowing the two modal contracts to drift.
- The adapter referenced an out-of-scope `topicId` while deriving labels and did not attach source metadata to normalized responses.
- Several dashboard surfaces still rendered subject emoji directly instead of using the existing SVG icon system.

## Runtime changes

- Added immutable context snapshots in `src/ai/coach/contextSnapshot.js`.
- Added request/mode/source guards to Explain and Ajar Saya flows in `src/App.jsx`.
- Added `sourceQuestionId`, `sourceSubjectId`, `sourceTopicId`, `sourceLanguage`, and `generatedMode` to coach payloads.
- Kept Teacher and Explain payload state separate and prevented nested modal presentation.
- Added subject-aware question focus for Math, Science, English, and Arabic explanations.
- Replaced dashboard subject/path emoji with `SubjectIcon` SVG mappings.

## Subject test matrix

| Subject | Context resolution | Explain/Teach contract | Result |
| --- | --- | --- | --- |
| Bahasa Melayu | subject/topic metadata or active context | Malay-safe fallback | PASS |
| English | question metadata overrides active subject | English question focus | PASS |
| Mathematics | question metadata overrides BM dashboard state | current numbers/operators included | PASS |
| Science | exact question concept carried into response | science-specific focus | PASS |
| Arabic | Arabic source context preserved | Arabic-specific focus | PASS |
| Pendidikan Islam | topic-scoped knowledge fallback | topic-safe | PASS |
| PJPK | topic-scoped knowledge fallback | movement/health-safe | PASS |

## Icon and motion system

- `IconGlyph` remains the single 24×24 SVG system with round stroke styling.
- Added meaningful subject icons: book, language, calculator, flask, mosque, movement, and heart.
- Learning-path favourite, lock, medal, arrow, and completion glyphs now use SVG icons.
- Home quick subject pills and Parent Dashboard status badges now use the same SVG icon system; no subject emoji is rendered in those surfaces.
- Motion selectors: `pulse`, `celebrate`, `shine`, `sound`, `breath`, `hover`, plus quick-action entry, modal entrance, mascot float, and active/tap states.
- `prefers-reduced-motion: reduce` disables non-essential animation and transitions.

## Executable validation

`node scripts/validate/v31CoachContextIconAudit.mjs` passed:

- Math question while BM is selected resolves to Math/Darab.
- Adaptive metadata overrides the active subject.
- Delayed Arabic response cannot overwrite English context.
- Ajar Saya returns `generatedMode: "teach"` with teaching steps.
- Generic fallback is contextual, not the primary explanation.
- Subject icons render through SVG `IconGlyph`/`SubjectIcon`.
- Motion values have matching CSS and reduced-motion coverage.

Existing modal, live-interaction, communication, diversity, and build checks also passed. Browser screenshots were not available in this environment; manual desktop and 390px visual verification remains recommended.
