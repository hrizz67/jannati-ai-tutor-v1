# QA Report - Jannati AI Tutor V1.5 Stable

Date: 2026-07-02  
Project: React + Vite, GitHub Pages base `/jannati-ai-tutor-v1/`

## Summary

Final QA was completed across content data, main app flows, responsive UI, build output, and GitHub Pages deployment assumptions. The app can be marked **V1.5 Stable** after the small fixes applied in this pass.

Small fixes completed:

- Updated browser title from `Jannati AI Tutor V1.4 Package 1` to `Jannati AI Tutor V1.5 Stable`.
- Updated service worker cache from V1.4 to V1.5.
- Changed service worker navigation/HTML handling to network-first, reducing stale app-shell risk after deployment.
- Confirmed rebuilt `dist/service-worker.js` also contains the V1.5 cache strategy.

## Passed Checks

### Content QA

All subject modules load successfully:

| Subject | Topics | Questions | Duplicate IDs | Empty Question/Answer | Missing Hint/Explanation | UASA/DSKP Present |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| bm | 10 | 500 | 0 | 0 | 0 | Yes |
| math | 10 | 500 | 0 | 0 | 0 | Yes |
| english | 10 | 500 | 0 | 0 | 0 | Yes |
| sains | 10 | 500 | 0 | 0 | 0 | Yes |
| islam | 10 | 500 | 0 | 0 | 0 | Yes |
| arab | 10 | 500 | 0 | 0 | 0 | Yes |
| pj | 10 | 500 | 0 | 0 | 0 | Yes |
| pk | 10 | 500 | 0 | 0 | 0 | Yes |

PJ and PK have exact V1.5 target difficulty distribution:

- 200 mudah
- 200 sederhana
- 100 sukar

### Functional QA

Passed smoke tests:

- Dashboard loads after login.
- Subject switching works.
- Learning Path renders with locked/unlocked states.
- Favourite toggle works.
- Resume learning persists after refresh and reopens quiz when scoped from Auto Resume card.
- Quiz answer check works.
- AI Explain modal opens and renders explanation, hint and examples.
- AI Teacher modal opens and renders lesson, examples, common mistakes and memory tip.
- AI Recommendation card renders.
- AI Memory surfaces render without console errors.
- UASA Simulator opens with 20-question flow.
- Parent Dashboard opens with summary, weak/strong topic sections and UASA history section.
- Print/Save PDF button is present and wired to `window.print()`.

### UI QA

Passed:

- Desktop login and dashboard render.
- Mobile viewport 390 x 844 renders without blank screen.
- Mobile dashboard showed no horizontal overflow.
- Sampled visible mobile buttons had no detected overlap.
- AI Explain and AI Teacher modals rendered without broken visible text.
- No app console errors were captured during browser smoke tests.

### Performance and Build QA

Passed:

- `npm run build` passes.
- `npm run dev` responds at `http://127.0.0.1:5173/jannati-ai-tutor-v1/`.
- GitHub Pages base path is configured in `vite.config.js` as `/jannati-ai-tutor-v1/`.
- Served HTML contains `<title>Jannati AI Tutor V1.5 Stable</title>`.
- Build completed without fatal bundle-size warnings.

## Failed Checks

No blocking failures remain after the V1.5 title and service worker fixes.

## Warnings

- Older content banks still contain repeated question stems:
  - BM: 100 duplicate stems detected.
  - Math: 35 duplicate stems detected.
  - English: 106 duplicate stems detected.
  - Sains: 12 duplicate stems detected.
  - Islam: 2 duplicate stems detected.
  - Arab: 11 duplicate stems detected.
- BM, Math, English and Sains do not follow the 40/40/20 difficulty distribution used for the newer PJ/PK banks.
- Some older banks have `accepted` arrays that do not include the exact `answer`. This is not currently a runtime bug because `smartCheck` checks `question.answer` directly first.
- Existing profile/resume localStorage keys still use `v140`. This preserves old user progress, but the naming is stale for V1.5.
- Browser automation intermittently showed external Statsig network errors from the host environment. No app console errors were captured.
- Historical docs still mention V1.4 Package 2. These appear to be release notes/install history rather than runtime app metadata.

## Files Inspected

- `index.html`
- `vite.config.js`
- `package.json`
- `public/service-worker.js`
- `public/manifest.webmanifest`
- `dist/index.html`
- `dist/service-worker.js`
- `src/App.jsx`
- `src/main.jsx`
- `src/styles/style.css`
- `src/utils/smartCheck.js`
- `src/utils/speech.js`
- `src/ai/explainEngine.js`
- `src/ai/teacherEngine.js`
- `src/ai/recommendationEngine.js`
- `src/ai/memoryEngine.js`
- `src/components/ai/AIExplainModal.jsx`
- `src/components/ai/AITeacherModal.jsx`
- `src/data/subjects/index.js`
- `src/data/subjects/bm.js`
- `src/data/subjects/math.js`
- `src/data/subjects/english.js`
- `src/data/subjects/sains.js`
- `src/data/subjects/islam.js`
- `src/data/subjects/arab.js`
- `src/data/subjects/pj.js`
- `src/data/subjects/pk.js`

## Recommended Fixes Before Future Content Lock

1. Rewrite or deduplicate BM, Math, English and Sains question stems to match the newer PJ/PK quality level.
2. Normalize difficulty distribution across all subjects if V1.5 requires consistent assessment weighting.
3. Add a small automated QA script to validate all subject banks before each release.
4. Consider renaming localStorage keys in a future migration only if preserving old progress is handled carefully.
5. Update historical README/release docs when preparing a public V1.5 release package.

## Stability Decision

V1.5 can be marked **Stable** for app functionality and deployment after the fixes in this QA pass. Remaining items are content-quality and documentation warnings, not release-blocking runtime defects.
