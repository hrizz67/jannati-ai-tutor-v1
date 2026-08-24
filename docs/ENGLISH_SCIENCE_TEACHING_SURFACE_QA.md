# English & Science Teaching Surface QA

## Overall Result
PASS

The Knowledge Engine surfaces for English and Science are rendering the expected subject-aware teaching fields consistently, with no blocking gaps found in the sampled topics.

## English Result

| Topic | AI Explain | Ajar Saya | Notes |
| --- | --- | --- | --- |
| nouns | PASS | PASS | Shows meaning support plus examples, tips, memory tips, common mistakes, and follow-up practice. |
| verbs | PASS | PASS | Teaching flow stays topic-specific and includes example sentences plus corrective guidance. |
| adjectives | PASS | PASS | Clear Year 2 explanation with practice guidance and supporting examples. |
| prepositions | PASS | PASS | Surface stays focused on sentence use and avoids blank generic fallback. |
| reading | PASS | PASS | Includes stronger explanation density and practice-oriented support. |

### English Findings
- AI Explain is surfacing the expected English-specific teaching fields: `wordMeaning`, `exampleSentences`, `examples`, `extraExamples`, `tips`, `memoryTips`, `commonMistakes`, and `followUpQuestions`.
- Ajar Saya remains consistent with a guided teaching flow and does not collapse into placeholder or undefined content on the sampled topics.
- Compared with the Arabic upgrade, English is still less scaffold-heavy for pronunciation, which is fine for the subject, but it could benefit from a little more explicit speaking practice wording in future enhancement work.
- No blocking fallback issue was observed in the sampled topics.

## Science Result

| Topic | AI Explain | Ajar Saya | Notes |
| --- | --- | --- | --- |
| haiwan | PASS | PASS | Strong subject-specific science guidance with facts, misconceptions, and thinking prompts. |
| tumbuhan | PASS | PASS | Includes observation-style support and real-life science application. |
| manusia | PASS | PASS | Clear Year 2 science explanation with safe, relevant examples. |
| cahaya | PASS | PASS | Surface includes science thinking prompts and practice support. |
| bunyi | PASS | PASS | Includes conceptual explanation plus question prompts that support reasoning. |

### Science Findings
- AI Explain is surfacing the expected Science-specific teaching fields: `scientificFacts`, `observationPrompts`, `comparisonPrompts`, `investigationIdeas`, `realLifeApplications`, `misconceptions`, and `evidenceQuestions`.
- Ajar Saya provides guided science teaching with observation and thinking prompts rather than only fact recall.
- Compared with the Arabic upgrade, Science already shows a good KBAT-style structure through why/predict/compare prompts, which is a strength.
- No blocking fallback issue was observed in the sampled topics.

## Comparison with Arabic Upgrade

### What is better
- Arabic now has stronger pronunciation and reading scaffolding, so it serves as the reference for language-specific support.
- English and Science both surface a richer set of subject-aware fields than before, and Science in particular has good reasoning-oriented prompts.

### What needs improvement
- English could use a bit more explicit speaking-practice wording in the teaching flow, even though the current output is consistent and valid.
- Science is strong, but some explanations still read more like knowledge presentation than guided inquiry; a slightly more active question-and-respond rhythm would make it feel closer to the Arabic teaching quality standard.

## Recommended Next Steps
1. Keep the current English and Science Knowledge Engine mappings as-is; no blocking fixes are required.
2. If we want to match the Arabic quality bar more closely, add a small future enhancement pass for English speaking practice phrasing.
3. Consider a future Science polish pass to make guided inquiry wording even more prominent.

## Validation Results
- `node scripts/validate/knowledgeValidator.mjs` — attempted, but the validator failed to write `docs/KNOWLEDGE_ENGINE_VALIDATION_REPORT.md` in this environment.
- `node scripts/validate/questionValidator.js` — PASS: 0 errors, 12 warnings, 0 info.
- `node scripts/validate/speechRegression.mjs` — PASS.
- `npm run build` — PASS.

## Blocking Issues
- None found in the sampled English and Science teaching surfaces.
- The only validation-related issue was the `knowledgeValidator.mjs` report-write failure, which did not indicate a content or runtime regression in the teaching surfaces themselves.
