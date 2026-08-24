# Sprint 13 Closed Beta Readiness Report

## Summary

Jannati AI Tutor is prepared for closed beta testing without adding new learning features. This sprint focuses on first-run setup, beta data handling, feedback capture, report export, validation cleanliness, production build readiness, and documented readiness audits.

## Branch

- `beta-prep`

## Implementation

### Part A: First Run Experience

- Added a first-launch wizard gated by `jannati_closed_beta_onboarding_v1`.
- Wizard steps:
  1. Selamat datang ke Jannati AI Tutor.
  2. Pilih nama murid.
  3. Pilih Tahun.
  4. Jom mula belajar!
- Completing the wizard saves the selected name and year and opens the dashboard.

### Part B: Demo Profile

- If no current or legacy profile exists, the app automatically creates a demo profile:
  - Name: `Demo Murid`
  - Year: `Tahun 2`
  - Demo marker: `isDemo: true`
- The demo profile is saved to local storage so beta testers can enter the app immediately.

### Part C: Reset App

- Added `Reset Semua Data` under dashboard settings.
- Reset uses a confirmation dialog before destructive local data removal.
- Reset clears current profile, legacy profiles, resume data, onboarding state, feedback, and AI memory keys.
- Reset recreates a fresh demo profile and shows the first-run wizard again.
- Reset storage removal is wrapped with recovery messaging for unavailable localStorage.

### Part D: Export Beta Report

- Added `Eksport Beta Report JSON` under dashboard settings.
- Export generates a local JSON file containing:
  - `progress`
  - `mastery`
  - `history`
  - `feedback`
  - `reading`
  - `listening`
  - `speaking`
  - `writing`
- Export also includes metadata, app version, build date, generated timestamp, and a profile summary.

### Part E: Feedback Improvement

- Feedback dialog now captures:
  - Screenshot description
  - Category
  - Rating
  - Comment
- Feedback remains local and is included in the beta report export.
- Added dialog title wiring, grouped category/rating controls, `aria-pressed` state, explicit textarea labels, initial focus, and Escape-to-close handling.

### Part F: Beta Badge

- `CLOSED BETA` displays in the footer only.
- The previous status text outside the badge was removed from the footer.

## Readiness Audits

### Part G: Performance

- Dashboard-heavy calculations for AI memory, mastery map, curriculum coverage, adaptive lesson, and lesson plan are memoized.
- Subject data remains lazy-loaded by subject.
- LocalStorage writes remain scoped to profile, resume, onboarding, feedback, and AI memory.
- Large user-facing arrays continue to be capped by existing app logic.
- Vite/Rolldown plugin timing advisory was disabled via `vite.config.js` so production builds stay clean while preserving normal build errors.

### Part H: Offline

- PWA files are present:
  - `public/manifest.webmanifest`
  - `public/manifest.json`
  - `public/service-worker.js`
- Manifest includes standalone display, start URL, scope, theme color, and icon assets.
- Service worker caches app shell, manifest files, brand assets, icons, and mascot metadata for offline startup.
- Sprint 13 changes add no network dependency.

### Part I: Accessibility

- Wizard includes visible headings, labels, disabled states, and keyboard-accessible controls.
- Feedback dialog uses dialog semantics, labelled title, explicit form labels, focus handling, Escape close, and grouped toggle controls.
- Existing focus-visible styling remains available for buttons, inputs, textareas, nav, subject cards, and path actions.
- Reset and export are regular buttons and remain keyboard accessible.

## Files Touched For Sprint 13

- `src/App.jsx`
- `src/data/subjects/package.json`
- `vite.config.js`
- `SPRINT13_CLOSED_BETA_REPORT.md`
- Validation output files under `reports/validation/`
- Production build output under `dist/`

## Validation

- Command: `npm run validate`
- Result: pass
- Errors: 0
- Warnings: 0
- Info: 12000

## Build

- Command: `npm run build`
- Result: pass
- Output: production assets generated in `dist/`
- Build completed without warning/advisory output after disabling the plugin timing check.

## Notes

- No new learning features were added.
- Browser speech recognition support still depends on the beta tester's browser.
- Beta export downloads JSON locally; no server upload is performed.
