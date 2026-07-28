# Jannati v3.1 iPhone Full Acceptance Audit

Read-only verification pass. No runtime code was changed during this audit.

| ID | Area | Status | Verification method | Evidence | Remaining issue |
|----|------|--------|---------------------|----------|-----------------|
| A | Subject switcher mobile overlap | PARTIAL | Static render/CSS inspection | `HomeDashboard.jsx` keeps switcher in flow; mobile CSS has compact sizing and safe-area rule | No 390px browser screenshot; visual overlap remains NOT TESTABLE. Repair: manual iPhone check. Severity P1 |
| B | Global iPhone safe area | PARTIAL | CSS inspection | Modal/footer/FAB safe-area declarations exist | All page shells and Safari toolbar behavior require device verification. Severity P1 |
| C | Mobile footer rebuild | PASS | JSX/CSS inspection | Footer now contains only logo, Closed Beta, version and copyright; responsive safe-area spacing is applied | Pixel-level 390px verification remains manual. Severity P2 |
| D | Feedback FAB | PASS | Runtime condition + CSS inspection | `BetaChrome` suppresses on quiz/UASA/communication/modal; mobile max 48px and safe-area bottom | Print/device overlap still requires manual verification. Severity P2 |
| E | Bacaan/Mendengar empty attempts | PASS | Executable communication audit + runtime inspection | Empty Bacaan is not completed; Mendengar rejects blank responses and does not advance/count | Microphone permission/audio hardware require manual verification. Severity P1 |
| F | Communication empty result states | PARTIAL | Runtime inspection | Bacaan hides result unless completed; Bertutur/Menulis guards exist | Browser verification needed for all four visual empty states and 0% assessed-result distinction. Severity P1 |
| G | Hero emoji replacement | PASS | Executable source/runtime assertion | All four communication heroes use `communication-hero-icon` with `IconGlyph` book/headphones/mic/pen; no primary hero emoji remains | Visual polish still merits manual device review. Severity P2 |
| H | Internal label formatting | PARTIAL | Static scan | `displayFormatter` exists and many dashboard labels use it | Full rendered scan across Parent/Analytics/Revision/UASA/recommendation surfaces not executable without browser. Severity P1 |
| I | Canonical analytics consistency | PARTIAL | Executable canonical fixture + static inspection | Canonical streak now guarantees best >= current; dashboard consumers still have multiple selectors | Parent/Student parity and screenshot fixture require browser/data integration audit. Severity P1 |
| J | Curriculum no-data state | PASS | Executable/static inspection | Coverage summary exposes metadata/evidence contract and Home renders explicit no-data messages instead of four zeros | Partially mapped subjects still need browser/data fixture verification. Severity P2 |
| K | Cross-subject recommendation clarity | PARTIAL | Static inspection | Recommendation data carries subject context, but no complete cross-subject badge/switch proof was found | Verify CTA switches subject before launch and labels cross-subject target. Severity P1 |
| L | Weekly plan mobile | PARTIAL | Component inspection | `WeeklyPlanList` uses accessible `<details>` rows with compact summaries | Today-default/one-expanded-day behavior is not proven at 390px. Severity P2 |
| M | Review queue duplication | PARTIAL | Static inspection | Priority/date formatting helpers exist | Duplicate overdue text needs rendered review-queue verification. Severity P2 |
| N | Mobile card density | NOT TESTABLE | No browser/device | CSS has mobile breakpoints but no screenshot/render measurement available | Run 390x844 and 393x852 manual pass. Severity P1 |
| O | Parent Dashboard consistency | PARTIAL | Static inspection | Parent dashboard uses canonical progress helpers and safe numeric rendering | Screenshot-level agreement with Student Dashboard is not device-verified. Severity P1 |
| P | Explain/Teach modal UX | PARTIAL | CSS + modal inspection | Sticky headers, scrollable bodies, footer clearance and safe-area padding exist | Fixed-footer/advanced-collapse/duplicate-section behavior requires 390x844 browser verification. Severity P1 |
| Q | UASA result/control UX | PARTIAL | Executable answer normalization + JSX inspection | Accepted-answer variants pass; feedback FAB is suppressed | Next-button disabled state and duplicate-check UI behavior are not fully proven. Severity P1 |
| R | Text/language polish | PARTIAL | Static scan | Accepted-answer and coach fallback text are normalized; several legacy communication hero strings remain | Full copy review required for awkward audio/debug wording and punctuation. Severity P2 |
| S | Print view | NOT TESTABLE | CSS/source inspection only | Print behavior is not validated in a print preview environment | Verify print hides FAB/switcher/controls and preserves report content. Severity P1 |

## Executable verification

- `v31CoachContextIconAudit.mjs`: PASS
- `v3CoachPayloadAudit.mjs`: PASS
- `communicationModulesAudit.mjs`: PASS
- `audioContentAudit.mjs`: PASS
- `v31IphoneAcceptanceRepairAudit.mjs`: PASS
- `npm run build`: PASS; main bundle approximately 700.16 kB minified
- `git diff --check`: PASS

The executable checks prove context, answer normalization, communication data contracts, empty-attempt guards, canonical streak behavior, and safe-area/FAB source conditions. They do not prove pixel layout, Safari keyboard/microphone/audio behavior, or print preview.

## Status count

| Status | Count |
|--------|------:|
| PASS | 5 |
| FAIL | 0 |
| PARTIAL | 12 |
| NOT TESTABLE | 2 |

## Release recommendation

**NOT READY** — the hero icon and curriculum no-data runtime gaps are repaired, but the many PARTIAL items require real iPhone/browser verification before release.

## Remaining manual iPhone tests

- 390x844 and 393x852 Home, Parent, Student, Analytics, Revision, UASA and communication screens.
- Safari status-bar and collapsed-toolbar safe-area behavior.
- Keyboard focus, microphone permission, SpeechRecognition and SpeechSynthesis.
- Bacaan/Mendengar audible item changes and empty-attempt UI.
- Explain/Teach expanded/collapsed sections and fixed footer visibility.
- Feedback FAB overlap and subject-switcher overlap.
- Print preview and page breaks.

## Final repair pass update (2026-07-23)

The following runtime repairs were applied after the initial screenshot audit:

- **G — Hero icons:** all four communication heroes now use the shared `communication-hero-icon` container with `IconGlyph` mappings (`book`, `headphones`, `mic`, `pen`). The executable acceptance audit asserts four containers and no primary hero emoji.
- **J — Curriculum no-data:** the coverage engine now exposes metadata/evidence availability and Home renders an intentional no-data message instead of misleading zero metrics.
- **C — Footer:** beta feedback wording was removed from the footer; the compact footer retains only logo, Closed Beta, version and copyright with safe-area spacing.
- **S/N — static hardening:** print controls/FAB are hidden and mobile card spacing/safe-area rules are present; print preview and device density remain manual checks.

Post-repair executable results:

- `v31IphoneAcceptanceRepairAudit.mjs`: PASS (including hero-icon and curriculum assertions)
- `v31CoachContextIconAudit.mjs`: PASS
- `communicationModulesAudit.mjs`: PASS
- `audioContentAudit.mjs`: PASS
- `npm run build`: PASS; main bundle approximately 700.57 kB minified
- `git diff --check`: PASS (line-ending warnings only)

The report deliberately keeps all visual/device-only items PARTIAL or NOT TESTABLE. No iPhone Safari, keyboard, microphone, audio playback, safe-area, FAB-overlap or print-preview result is claimed without a human device pass. Cross-subject recommendation labeling, analytics parity, weekly-plan state, review-queue rendering and modal pixel behavior remain PARTIAL pending browser verification.

The worktree contains only source/report changes and the restored tracked `dist/index.html`; generated validation reports were not added. No commit or deployment was performed.

## Final pre-commit verification (2026-07-23)

Worktree classification:

- Intended runtime changes: `src/App.jsx`, `src/ai/explainEngine.js`, `src/ai/teacherEngine.js`, `src/curriculum/coverageEngine.js`, `src/dashboard/HomeDashboard.jsx`, `src/styles/style.css`, `src/utils/acceptedAnswers.js`, `src/utils/canonicalProgress.js`.
- Intended validator changes: `scripts/validate/v31CoachContextIconAudit.mjs`, `scripts/validate/v31IphoneAcceptanceRepairAudit.mjs`.
- Intended documentation: this report.
- Generated artifact: `dist/index.html` was regenerated by the build and restored; its content hash matches `HEAD:dist/index.html` (`8a969b87bcd1dc9b211b6e203a3906c40874f750`). Git still reports a metadata/line-ending worktree marker because the index could not be refreshed (`.git/index.lock` permission denied), but the file content is identical to HEAD.
- Unexpected files: none observed. No package, lockfile or configuration changes are present.

Validator results: all five required validators PASS. The validators emit Node `MODULE_TYPELESS_PACKAGE_JSON` performance warnings only; no warning is treated as success or hidden failure.

Build: PASS. Main bundle: 700.57 kB minified (206.34 kB gzip). Vite reports the existing >500 kB chunk advisory; no new build failure or asset warning occurred.

Release decision: **READY FOR DEVICE QA**. FAIL count is zero, but visual/device-only checks remain PARTIAL or NOT TESTABLE. Required manual checks remain iPhone Safari keyboard and safe area, microphone permission/SpeechRecognition, SpeechSynthesis, audible Mendengar item changes, print preview, feedback FAB overlap, sticky subject bar overlap, and 390×844/393×852 modal/dashboard screenshots.

## Worktree and generated artifacts

Runtime files were modified in the final repair pass; `scripts/validate/v31IphoneAcceptanceRepairAudit.mjs` now covers the code-verifiable repairs. `npm run build` regenerated `dist/index.html`; the tracked HTML references were restored to the pre-build asset hashes. No generated validation reports were changed by this audit pass.

`git status --short` and `git diff --stat` were captured after validation; no commit or deployment was performed.
