# QA Report - Jannati AI Tutor V1.5.1 Quality Release

Date: 2026-07-02
Project: React + Vite, GitHub Pages base `/jannati-ai-tutor-v1/`

## Summary

V1.5.1 quality release work is complete. The release focuses on cleaning the non-blocking issues reported in `QA_REPORT_V1_5.md` without changing the app structure or rewriting large app features.

## Issues Fixed

- Cleaned BM, Math, English and Sains question banks:
  - Removed exact repeated question stems.
  - Filled older empty `accepted` arrays with the exact answer.
  - Added `question` aliases where older banks only used `q`.
  - Preserved IDs, topic structure, answers, hints and explanations.
- Rebalanced BM, Math, English and Sains difficulty distribution to:
  - 200 `mudah`
  - 200 `sederhana`
  - 100 `sukar`
- Updated localStorage keys to V1.5.1:
  - `jannati_v151_profile`
  - `jannati_v151_resume`
  - `jannati_v151_ai_memory`
- Added read-through migration from old keys:
  - `jannati_v140_profile`
  - `jannati_v150_profile`
  - `jannati_v140_resume`
  - `jannati_v150_resume`
  - `jannati_v140_ai_memory`
  - `jannati_v150_ai_memory`
- Updated docs from V1.4 package wording to V1.5.1 quality release wording.
- Updated app title to `Jannati AI Tutor V1.5.1 Quality Release`.
- Updated service worker cache name to `jannati-ai-tutor-v151-quality`.
- Kept network-first navigation/HTML handling in the service worker to reduce stale app-shell issues.
- Added `vite-dev*.log` to `.gitignore`.

## Subject QA

| Subject | Questions | Difficulty Split | Duplicate Stems | Missing Required Data |
| --- | ---: | --- | ---: | ---: |
| BM | 500 | 200/200/100 | 0 | 0 |
| Math | 500 | 200/200/100 | 0 | 0 |
| English | 500 | 200/200/100 | 0 | 0 |
| Sains | 500 | 200/200/100 | 0 | 0 |
| Islam | 500 | 200/200/100 | 2 | 0 |
| Arab | 500 | 200/200/100 | 11 | 0 |
| PJ | 500 | 200/200/100 | 0 | 0 |
| PK | 500 | 200/200/100 | 0 | 0 |

Subjects touched in V1.5.1:

- BM
- Math
- English
- Sains

## Build Result

`npm run build` passed.

Notable output:

- `dist/index.html` title is `Jannati AI Tutor V1.5.1 Quality Release`.
- `dist/service-worker.js` cache name is `jannati-ai-tutor-v151-quality`.
- GitHub Pages base path remains `/jannati-ai-tutor-v1/`.

## Files Modified

- `.gitignore`
- `README.md`
- `CHANGELOG.md`
- `RELEASE_NOTES.md`
- `INSTALL.md`
- `index.html`
- `public/service-worker.js`
- `dist/index.html`
- `dist/service-worker.js`
- `src/App.jsx`
- `src/ai/memoryEngine.js`
- `src/data/subjects/bm.js`
- `src/data/subjects/math.js`
- `src/data/subjects/english.js`
- `src/data/subjects/sains.js`

Existing modified files from earlier quality work remain part of the worktree:

- `src/data/subjects/pj.js`
- `src/data/subjects/pk.js`

## Remaining Risks

- Arabic and Pendidikan Islam still have a small number of duplicate stems from earlier content generation. They were not in this release scope.
- BM, Math, English and Sains were mechanically normalized to remove exact repeated stems and rebalance difficulty; a future teacher-led content pass could further polish individual wording.
- `node_modules/.cache/gh-pages/...` is still modified in the worktree from generated deployment cache state. It should not be committed unless the repository intentionally tracks that cache.
- `QA_REPORT_V1_5.md` exists from the prior stable audit and remains useful historical QA documentation.

## Stability Decision

V1.5.1 can be treated as a quality release on top of V1.5 Stable. The requested cleanup items are complete, build passes, and no project structure changes were introduced.
