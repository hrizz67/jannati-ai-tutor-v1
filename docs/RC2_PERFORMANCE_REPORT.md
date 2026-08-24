# Release Candidate Performance Optimisation Pass 2 Report

Project: Jannati AI Tutor v2.1  
Scope: Low-risk performance optimisation only

## Files modified

- `src/App.jsx`

## Largest contributors found before changes

From the production build prior to this pass:

- Main bundle: `dist/assets/index-*.js` — 512.87 kB raw / 148.97 kB gzip
- Bahasa Melayu subject chunk: `dist/assets/bm-*.js` — 388.97 kB raw / 32.75 kB gzip
- Mathematics subject chunk: `dist/assets/math-*.js` — 268.42 kB raw / 25.68 kB gzip
- English subject chunk: `dist/assets/english-*.js` — 173.98 kB raw / 10.62 kB gzip
- Science subject chunk: `dist/assets/sains-*.js` — 156.46 kB raw / 19.62 kB gzip

The biggest eager application file was still `src/App.jsx`, which was carrying the main screen wiring and several runtime helpers. A safe split point was available for the Home dashboard surface.

## Lazy-loading changes

- Converted `HomeDashboard` from a static import to `React.lazy(...)`
- Wrapped the dashboard route in:
  - `ProductionErrorBoundary`
  - `React.Suspense`
- Added a visible Malay fallback for dashboard chunk loading
- Added a safe fallback action for dashboard chunk failure

No other learning surfaces were changed, and no speech/resume/adaptive/question logic was modified.

## Dynamic-import changes

- No new dynamic import paths were introduced for subject data.
- Existing subject-bank dynamic loading behavior was preserved.
- The change only moved the Home dashboard UI into its own lazy chunk.

## Before vs after bundle metrics

### Before this pass

- Main bundle: `512.87 kB`
- Gzip: `148.97 kB`
- Generated JS chunks: 16
- Build time: `8.02s`

### After this pass

- Main bundle: `498.08 kB`
- Gzip: `145.32 kB`
- Generated JS chunks: 17
- Build time: `7.75s`

### Net change

- Main bundle reduced by `14.79 kB`
- Gzip reduced by `3.65 kB`
- One extra lazy chunk created for `HomeDashboard`

## Validation results

- `npm run build` ✅
- `node scripts/validate/questionValidator.js` ✅
- `node scripts/validate/speechRegression.mjs` ✅
- `node scripts/validate/smartQuestionGeneratorRegression.mjs` ✅
- `node scripts/audit/curriculumAudit.js` ✅

## Known risks

- The main bundle is still above the preferred 450 kB target.
- Subject-bank chunks for BM and Mathematics remain large because they contain the full question content.
- The dashboard fallback now depends on the Home dashboard chunk loading successfully, but it is guarded by an error boundary and visible fallback UI.

## Deferred optimisation ideas

1. Consider splitting the remaining large coach surfaces out of `App.jsx` into separate lazy-loaded modules if a future pass allows a bigger refactor.
2. Consider additional code-splitting for the largest subject banks only if the product can tolerate more granular loading.
3. Consider a deeper dependency audit for large helper modules if another performance pass is planned.

## Build result

- Build passed successfully
- Vite still reports large-chunk warnings, but the main bundle was reduced and first-load performance improved slightly without changing behavior
