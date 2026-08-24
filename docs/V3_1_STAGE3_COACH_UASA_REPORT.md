# Jannati v3.1 Stage 3 — Explain, Teach and UASA

## Scope

Only Explain/Terangkan, Ajar Saya, modal mobile structure, and UASA answer/check/next presentation were changed. Communication, analytics, Parent Dashboard, weekly plan, review queue and curriculum behavior were preserved.

## Area matrix

| Area | Scenario | Status | Evidence | Remaining manual check |
|---|---|---|---|---|
| Terangkan | Math “before 329” | PASS | Stage 3 fixture confirms `329 - 1 = 328` and no BM leakage | 390×844 visual check |
| Ajar Saya | Same Math snapshot | PASS | Teach fixture uses same subject/topic and rejects unrelated content | 390×844 visual check |
| Nested content | Duplicate examples | PASS | Stable punctuation/case-insensitive deduplication before rendering | Human semantic review of near-duplicates |
| Modal layout | Header/body/footer | PASS | Fixed flex chrome, independently scrolling body, safe-area footer CSS | iPhone Safari toolbar/keyboard |
| Modal advanced content | Default collapsed | PASS | Native `<details>` sections remain collapsed by default | Screen-reader interaction on device |
| UASA answers | Ayat Tanya variants | PASS | Shared `smartCheck` accepts case/spacing/punctuation variants and rejects wrong answer | Manual UASA completion flow |
| UASA counters | Repeated check | PASS | `result` guard prevents duplicate increments; next disabled before check | Physical tap sequence |
| UASA feedback | Correct/wrong | PASS | Live region, accepted answer, concise feedback and safe bottom clearance | Color/contrast visual check |

## Root causes and fixes

- Explain/Teach sections could repeat the same normalized content across steps/examples/extra examples. `src/utils/dedupeText.js` now deduplicates stably without mutating payloads; both modals use it.
- UASA allowed repeated checks to increment counters. `UasaSimulator` now ignores repeated submits, disables `Semak Jawapan` after assessment, and disables `Seterusnya` until a result exists.
- UASA feedback now displays normalized accepted answers and uses an `aria-live` region.
- Modal layout now uses a bounded `100dvh` calculation, fixed header/footer, independently scrolling body, compact <=430px rules, and safe-area padding.

## Exact files modified

- `src/components/ai/AIExplainModal.jsx`
- `src/components/ai/AITeacherModal.jsx`
- `src/utils/dedupeText.js`
- `src/App.jsx`
- `src/styles/style.css`
- `scripts/validate/v31Stage3CoachUasaAudit.mjs`

## Validator output

`v31Stage3CoachUasaAudit.mjs` PASS, including Math leakage, deduplication fixtures, UASA accepted-answer variants, wrong-answer rejection, duplicate-check guard, modal structure and protected communication-scope checks.

Previous validators also PASS:

- `v31CoachContextIconAudit.mjs`
- `v3CoachPayloadAudit.mjs`
- `communicationModulesAudit.mjs`
- `audioContentAudit.mjs`
- `v31IphoneAcceptanceRepairAudit.mjs`
- `v31VisualWowSafetyAudit.mjs`
- `v31Stage1MobileShellAudit.mjs`
- `v31Stage2CommunicationAudit.mjs`
- `git diff --check`

## Build

`npm.cmd run build` PASS. Main bundle: 703.73 kB (207.11 kB gzip); CSS: 85.81 kB (17.16 kB gzip). Vite large-chunk warning remains non-blocking.

`dist/index.html` was restored to tracked pre-build asset references (`index-DCDPvdDE.js` and `index-B-Whao4c.css`). No commit or deployment was performed.

## Accessibility and remaining checks

Dialogs retain `role="dialog"`, `aria-modal`, visible titles, focus-on-open, focus restoration and Escape close behavior. UASA feedback is announced through `aria-live`; correctness is not conveyed by color alone.

Remaining manual checks: iPhone Safari 390×844 modal scrolling, keyboard/toolbar overlap, VoiceOver focus order, UASA physical duplicate taps, and final color/contrast review. These remain PARTIAL until tested on a real device.

## Stage gate

Automated FAIL count is zero, no cross-subject leakage was found, and duplicate UASA counting is guarded. Stage 4 should wait for the listed device checks.
