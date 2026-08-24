# Full Repository QA Report

Project: Jannati AI Tutor v2.1  
Review type: QA only, no code changes made

## Scope and method

I scanned the repository for:

- architecture risks: dead code, duplicated components/hooks/utilities, circular dependencies, unused files
- code-quality markers: `console.log`, `console.error`, `console.debug`, `TODO`, `FIXME`, `HACK`, `XXX`
- React runtime risks: rerenders, unstable effects, stale closures, cleanup, listener leaks, timer leaks
- speech risks: SpeechRecognition, SpeechSynthesis, cleanup, Safari compatibility, timeout cleanup, microphone release
- performance signals: bundle size, large components, lazy loading, dynamic import opportunities, duplicate libraries

I also ran a source import-graph scan over `src/` to look for circular references and orphaned modules.

## Repository-wide findings

### Structural scan

- Files scanned in `src/`: 175
- Circular dependencies found: 0
- Confirmed dead-code defects: 0
- Confirmed duplicated React components/hooks/utilities: none confirmed

### Performance scan

- Build completed successfully, but the main bundle and subject chunks are still large.
- Vite warning remains for chunks over 500 kB after minification.

## Critical issues

1. None confirmed

## High issues

1. Mojibake remains in learner-facing subject metadata
   - File: `src/data/subjects/index.js`
   - Example values show corrupted emoji/icon strings such as `ðŸ“š`, `ðŸ“`, `ðŸ”¤`, `â˜ªï¸`
   - Risk: visible UI corruption / poor presentation if these fields are rendered directly

2. Runtime logging still exists in source code paths
   - `src/App.jsx` contains dev-only `console.debug` tracing in Bacaan/Menulis coach flows
   - `src/ai/question/questionEngine.js` logs template-engine mode
   - `src/ai/adaptive/adaptiveSessionEngine.js` logs skipped adaptive records in dev mode
   - Risk: noisy console output and debugging leakage in development; production impact is limited where gated, but the logging is still present in runtime code

3. Bundle size remains high
   - Largest bundles after build:
     - `dist/assets/index-*.js` ~513 kB
     - `dist/assets/bm-*.js` ~389 kB
     - `dist/assets/math-*.js` ~268 kB
   - Risk: slower first load and heavier parse/compile cost

## Medium issues

1. Unreferenced utility modules from the current app graph
   - Examples:
     - `src/ai/coach/coachPreview.js`
     - `src/ai/prediction/predictionEngine.js`
   - Risk: maintenance overhead / confusing surface area
   - Note: many zero-incoming files are intentional entry points or lazy-loaded modules, so “unused” here means “not referenced from the main source graph,” not necessarily deletable without product context

2. Legacy speech helper export that is not used
   - File: `src/utils/speech.js`
   - `beep()` is used, but `speakText()` does not appear to be referenced anywhere in `src/`
   - Risk: dead export / maintenance noise

3. Heavy content modules are intentionally lazy-loaded
   - `HomeDashboard`, `ParentDashboard`, `RevisionDashboard`, `AnalyticsDashboard`, `AIExplainModal`, and `AITeacherModal` are split as lazy chunks
   - This is good architecture, but subject banks still dominate bundle weight

## Low issues

1. No circular dependencies were found in the `src/` import graph
2. No obvious unbounded timer or event-listener leaks were confirmed in the reviewed speech and modal paths
3. The repository contains many validation/audit scripts with console output by design; those are not treated as defects in this QA pass

## React / runtime observations

- The app already uses lazy loading for major dashboard and modal surfaces.
- Speech handling is centralized through the newer `src/ai/speech/` stack, which is the right shape for Safari-safe cleanup.
- The most delicate runtime areas remain the coach/speech flows in `src/App.jsx`, especially because they include multiple `useEffect` blocks and timed cleanup logic.

## Speech-specific observations

- `src/ai/speech/speechEngine.js` provides the central recognition lifecycle.
- The presence of timeout and cleanup logic is a good sign, and the prior Safari-focused fixes indicate this area has received attention.
- A legacy text-to-speech helper still exists in `src/utils/speech.js`; it is only used for `beep()`, not for spoken content.

## Unused / orphaned file signals

The import-graph scan returned 28 zero-incoming files. Most are expected because they are:

- lazy-loaded route components
- standalone subject banks
- validation / audit / helper modules

So I did not classify those as confirmed dead code. The only clearly unused source-level export found in this QA pass was `speakText()` in `src/utils/speech.js`.

## Validation and build

I verified the repository with the existing build:

- `npm run build` → PASS

Build output still reports the existing Vite chunk-size warning.

## Improvement ideas

1. Remove or further gate development console logs in runtime code paths.
2. Add a CI check for circular dependencies and unused exports.
3. Revisit subject metadata icon encoding in `src/data/subjects/index.js`.
4. Consider additional code splitting for very large subject bundles if first-load performance becomes a concern.

## Final risk summary

- Critical: 0
- High: 3
- Medium: 3
- Low: 3

## Overall QA conclusion

The repository is structurally healthy: no cycles, no confirmed crash-level architecture issues, and the build passes. The main quality gaps are presentation hygiene (mojibake in subject icons), maintenance noise (console logging / unused exports), and performance headroom (large bundles).
