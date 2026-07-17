# Knowledge Engine Performance Report

Branch: `feature/coach-knowledge-engine`

## Summary

The AI Coach Knowledge Engine was refactored from an eagerly loaded registry into a lazy-loaded, cached subject loader. This reduced the initial JavaScript payload while keeping the coach behavior unchanged.

## Bundle Metrics

| Metric | Before | After |
| --- | ---: | ---: |
| Main bundle (`index`) | ~889.61 kB | ~513.55 kB |
| Main bundle gzip | ~209.15 kB | ~150.35 kB |

## New Lazy Chunks

The Knowledge Engine now loads subject packs on demand as separate chunks.

Observed lazy subject chunks:

- `bm-B3DWkDjj.js`
- `english-DmyFYWs-.js`
- `math-D2bUYXwb.js`
- `sains-Dfsy5g49.js`
- `arab-CvMJHvoO.js`
- `islam-C1UrAl2s.js`
- `pj-6IuLM-Pe.js`
- `pk-DblZiGkX.js`

These chunks are loaded only when the Knowledge Engine is asked to resolve a specific subject/topic.

## Loading Flow

1. Coach surface requests a topic-aware explanation or support pack.
2. The adapter checks the in-memory cache first.
3. If the pack is not cached, the loader dynamically imports only the requested subject pack.
4. The resolved pack is normalized and stored in cache.
5. The modal or hint surface updates with the knowledge-driven content.

## Cache Strategy

An in-memory cache is used at two levels:

- subject module cache
- normalized pack cache

This means:

- the first request pays the import cost
- later requests reuse the already loaded module/pack
- repeated modal opens do not trigger duplicate imports

## Fallback Flow

If lazy loading fails, the system falls back safely:

- AI Explain uses the existing `explainAnswer(...)` path
- Ajar Saya uses the existing `teachAnswer(...)` path
- Hint generation continues using the existing coaching decision / question hint path

This ensures no blank modal, no crash, and no user-visible failure.

## Performance Gains

- Reduced the initial app bundle by roughly 376 kB
- Moved subject knowledge content into lazy chunks
- Kept coach behavior unchanged while reducing startup payload

## Risk Assessment

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Lazy import failure | Low | Existing coach fallback remains active |
| First-open fetch delay | Low | Cache warms after first request |
| Large subject question-bank chunks still exist | Medium | Outside this sprint; separate optimization opportunity |
| Modal content briefly falls back before lazy pack resolves | Low | Fallback copy is already valid and safe |

## Validation

| Check | Result |
| --- | --- |
| `node scripts/validate/knowledgeValidator.mjs` | Passed |
| `node scripts/validate/questionValidator.js` | Passed with 0 errors, 12 warnings |
| `node scripts/validate/speechRegression.mjs` | Passed |
| `npm run build` | Passed |

## Notes

- The build still reports Vite chunk-size warnings for some large chunks, but the initial `index` bundle is now within the requested target range.
- Knowledge pack loading now happens only when the relevant coach surface needs it.

