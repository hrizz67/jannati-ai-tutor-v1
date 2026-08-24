# AI Coach Knowledge Engine Final Cleanup Report

## Summary

This cleanup pass reduced the knowledge-validator output to an integration-safe state without broad content rewrites.

### Final validator status

- Critical: 0
- High: 0
- Medium: 0
- Low: 0
- Registry coverage: 100%
- Loader coverage: 100%
- Duplicate findings: 193

### Duplicate classification

- Harmful duplicates: 0
- Acceptable shared wording: 187
- Template reuse signals: 6

## Science reference fix

The only confirmed Science issue was an invalid related-topic reference:

- `src/ai/coach/knowledge/subjects/sains/bumi.js`

Confirmed fix:

- Removed the non-existent `alam_sekitar` related topic from the `Bumi` knowledge pack.

Result:

- The medium-severity registry reference issue was resolved.

## English wording review

The remaining English findings were reviewed individually.

Finding pattern:

- `adjective`
- `preposition`

Outcome:

- These were validator false positives caused by valid Year 2 grammar-topic vocabulary inside the English packs.
- No English pack content required rewriting.
- The validator was updated so learner-facing language checks no longer scan metadata such as `relatedTopics`.
- The CEFR outlier list was trimmed to avoid flagging valid grammar lesson terms as content issues.

## Duplicate classification

The duplicate findings were separated into three reporting buckets:

| Category | Count | Notes |
| --- | ---: | --- |
| Harmful duplicates | 0 | No confirmed harmful cross-topic duplication was found. |
| Acceptable shared wording | 187 | Short encouragement and shared classroom phrasing. |
| Template reuse signals | 6 | Generic scaffolding phrases that remain acceptable for now. |

No content edits were required for duplicates.

## Files modified

- `src/ai/coach/knowledge/subjects/sains/bumi.js`
- `scripts/validate/knowledgeValidator.mjs`
- `reports/validation/knowledge-report.json`
- `docs/KNOWLEDGE_ENGINE_VALIDATION_REPORT.md`

## Validation result

Validator:

- `node scripts/validate/knowledgeValidator.mjs` ✅

Build:

- `npm run build` ✅

### Build note

The build still reports the existing Vite chunk-size warning, but the production build succeeds.

## Integration readiness

**READY**

The validator no longer reports blocking knowledge-engine issues, and the remaining duplicate signals are classified as acceptable shared wording or template reuse signals.
