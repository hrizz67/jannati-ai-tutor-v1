# V3 English Content Quality Audit

## Scope

The audit covers all 10 English Year 2 topics in `src/data/subjects/english.js`, the reusable English sentence-quality layer, and the English Tutor AI context path.

| Metric | Result |
|---|---:|
| Generated samples | 2,000 |
| Static questions checked | 500 |
| Topics/templates checked | 10 |
| Question IDs preserved | 500 / 500 |
| Representative repairs | 19 |
| Rejected generated samples | 0 |
| High-severity findings after repair | 0 |

## Quality layer

`src/utils/englishSentenceQuality.js` provides deterministic validation and repair for:

- duplicate people, animals and objects in separate semantic roles;
- basic subject–verb agreement;
- `is/are` and `has/have` agreement;
- common `a/an` errors;
- common singular/plural errors;
- pronoun mismatches in explicit sentence patterns;
- capitalization, punctuation and internal metadata leakage;
- option duplication and missing expected answers.

The English subject is normalized at its data boundary. This keeps question IDs, scoring fields and topic structure intact while ensuring the rendered question object is quality-checked.

## Representative repairs

| Before | After |
|---|---|
| Ali plays with Ali. | Ali plays with Adam. |
| Sara and Sara read. | Sara and Lina read. |
| He run. | He runs. |
| They runs. | They run. |
| a apple | An apple |
| Aina is reading. He is happy. | Aina is reading. She is happy. |
| The boys are running. She is fast. | The boys are running. They are fast. |
| two cat | Two cats |
| these book | These books |

## Validation categories

The validator checks duplicate entities, duplicate words, duplicate options, subject–verb agreement, articles, singular/plural agreement, pronouns, capitalization, punctuation, natural sentence structure, option validity, expected-answer presence, raw IDs, null-like text and mixed-language corruption.

Static questions are checked after normalization and a deterministic 2,000-sample cycle exercises every current topic pool. Invalid fixtures are used to verify that the repair layer does not silently pass malformed content.

## Tutor AI English guidance

English context now uses the child-facing subject label `Bahasa Inggeris` in Malay UI metadata. English lesson examples remain in English, while the surrounding coaching guidance remains concise Malay. Internal topic IDs and set labels are removed before display.

## Validation results

- `englishContentQualityAudit.mjs`: PASS
- Existing guided-learning, modal, UI, dashboard and release-candidate audits: PASS
- Production build: PASS

## Known limitations

- The audit is deterministic and source-backed; browser visual checks still require manual device verification.
- The production build retains the existing large-main-chunk warning.
- Module-type warnings remain because the package does not declare `type: module`.

## Recommendation

English content is suitable for continued Release Candidate testing. Keep the validator in the regression chain when adding new English templates or question packs.
