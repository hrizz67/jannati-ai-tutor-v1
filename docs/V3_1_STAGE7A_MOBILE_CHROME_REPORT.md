# V3.1 Stage 7A Mobile Chrome Report

Stage scope: subject switcher, safe-area, feedback FAB, Safari toolbar clearance only.

Stage date: July 26, 2026

Notes:

- This work continued from an already-dirty worktree. The git status and diff stat below include earlier stage work that was already present.
- Local validator and build gates passed.
- Real iPhone Safari interaction is still a manual check.

| Issue | Status | Root cause | Fix | Evidence | Remaining manual check |
| --- | --- | --- | --- | --- | --- |
| Subject switcher root cause | PASS | Mobile layout inherited sticky behavior with top-offset styling that was safe on larger screens but problematic in dense iPhone viewports. | Kept a single switcher render and overrode mobile behavior to stay in normal flow at `<=650px`. | `src/dashboard/HomeDashboard.jsx` contains one `subject-quick-switch-shell`; `scripts/validate/v31Stage7aMobileChromeAudit.mjs` passes `subjectSwitcherInstances: 1`, `mobileSwitcherNotSticky: true`. | Confirm on real iPhone Safari that long scroll sessions never pin the switcher mid-viewport. |
| Mobile switcher final positioning | PASS | Switcher occupied sticky space and could visually sit over cards while scrolling. | Mobile rule now uses `position: relative`, `top: auto`, compact 72–88px height, one active pill, 44px arrows. | `src/styles/style.css` mobile block under `@media (max-width: 650px)`; Stage 7A validator passes `mobileSwitcherNoNegativeOffset: true`. | Real device swipe-through on 390px and 393px widths. |
| Safe-area implementation | PASS | Top content and sticky UI needed one shell-level safe-area contract instead of repeated nested offsets. | Added `--jannati-safe-top`, `--jannati-safe-right`, `--jannati-safe-bottom` and applied shell-level `padding-top` with `100dvh` mobile sizing. | `src/styles/style.css`; validators pass `safeAreaTopToken`, `safeAreaBottomToken`, `uses100dvh`, plus Stage 1/7A shell audits. | Verify with Dynamic Island / notch on real Safari. |
| FAB mobile behavior | PASS | The mobile FAB text wrapped vertically and the target stayed too large for dense screens. | Converted mobile FAB to circular 50×50 icon-only layout, preserved accessible label/title, visually hid text span, kept reduced-motion-safe styling. | `src/App.jsx` has `aria-label=\"Maklum Balas Beta\"`; `src/styles/style.css` mobile FAB block; Stage 7A validator passes `mobileFabIconOnly` and `fabAccessibleLabel`. | Touch check on real iPhone to confirm no footer or CTA collision in practical use. |
| FAB suppression matrix | PASS | Runtime suppression previously depended on the browser global `screen`, so protected-flow hiding did not work reliably. | `BetaChrome` now accepts `currentScreen`, derives a shared `feedbackSuppressed` flag, and passes it to the single `BetaFeedbackButton`. | `src/App.jsx` shows `const feedbackSuppressed = modalOpen || ['quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'finish', 'parent'].includes(currentScreen);`; Stage 7A, Stage 1, Stage 3, and iPhone acceptance validators all pass. | Manual check for open modal, UASA, Bacaan, Mendengar, Bertutur, and Menulis on actual device. |
| Safari bottom clearance | PASS | Lower CTA/footer space needed a shared bottom-clearance token instead of broad global padding. | Added `--jannati-mobile-browser-bottom-clearance` and `--jannati-mobile-fab-bottom`; applied only to mobile footer/FAB/shell areas that need it. | `src/styles/style.css`; Stage 7A validator passes safe-area bottom checks and no `100vw` overflow. | Confirm keyboard-resized viewport and Safari toolbar behavior on device. |
| Footer behavior | PASS | Footer needed to stay in normal flow and clear the bottom toolbar without creating a giant blank gap. | Kept footer relative/in-flow, removed extra margin bottom, used safe-area-aware padding bottom on mobile. | `src/styles/style.css`; Stage 7A validator passes `footerInFlow: true`; Stage 1 shell audit passes footer safety checks. | Real-device check for footer readability at 390px after long scroll. |
| Z-index scale | PASS | Sticky shell, FAB, modals, and footer needed a consistent layering contract. | Normalized `--z-content`, `--z-sticky`, `--z-fab`, `--z-dropdown`, `--z-modal-backdrop`, `--z-modal`, `--z-toast`. | Stage 1 shell audit reports ordered z-index values: `1 < 18 < 45 < 55 < 70 < 80 < 90`. | Visual check that no overlay edge case breaks in Safari. |
| Screenshots captured | PARTIAL | Local browser capture exists, but these were not taken on real iPhone Safari hardware. | Retained Stage 7A artifact set for reference only. | `artifacts/stage7a/390-home-switcher.png`, `390-home-footer.png`, `390-parent.png`, `390-analytics.png`, `390-weekly-plan.png`, `390-bacaan.png`, `390-bertutur.png`, `390-modal.png`. | Re-capture on real iPhone Safari before any release claim. |
| Validator output | PASS | Older validators still expected the pre-fix inline FAB suppression expression. | Updated Stage 7A and related audits to check the resolved `currentScreen` / `feedbackSuppressed` runtime path. | Passed: `v31Stage7aMobileChromeAudit`, `v31BrowserEnvironmentAudit`, `v31GamificationTextAudit`, `v31CoachContextIconAudit`, `v3CoachPayloadAudit`, `communicationModulesAudit`, `audioContentAudit`, `v31IphoneAcceptanceRepairAudit`, `v31VisualWowSafetyAudit`, `v31Stage1MobileShellAudit`, `v31Stage2CommunicationAudit`, `v31Stage3CoachUasaAudit`, `v31Stage4DashboardAnalyticsAudit`, `v31Stage5PlanningLabelsAudit`, `v31Stage6FinalRegressionAudit`. | None beyond rerunning after future mobile-shell edits. |
| Build result | PASS | Needed to confirm Stage 7A did not disturb earlier stages. | Rebuilt after validator updates using `npm.cmd run build`. | Vite build passed on July 26, 2026. | None. |
| Bundle / CSS size | PASS | Track output after Stage 7A so we do not accidentally regress mobile shell work with abnormal bundle growth. | No packaging change beyond normal current worktree deltas. | `dist/assets/index-BVu0YhDp.js` 708.01 kB (gzip 208.14 kB); `dist/assets/index-BeaiJ6d3.css` 89.50 kB (gzip 17.85 kB). | Keep watching in later stages only if Stage 7B+ begins. |
| Git status | PARTIAL | Worktree already contained many prior-stage edits and new files before Stage 7A completion. | Stage 7A touched only the runtime shell/FAB files plus validator/report files. | Stage 7A-modified files: `src/App.jsx`, `src/styles/style.css`, `scripts/validate/v31Stage7aMobileChromeAudit.mjs`, `scripts/validate/v31IphoneAcceptanceRepairAudit.mjs`, `scripts/validate/v31Stage1MobileShellAudit.mjs`, `scripts/validate/v31Stage3CoachUasaAudit.mjs`, `scripts/validate/mobileOverlayAudit.mjs`, this report. | Before commit, review overall dirty worktree separately from Stage 7A scope. |
| Git diff stat | PARTIAL | Overall diff includes many earlier Stage 1–6 changes, not just Stage 7A. | Preserved existing worktree; did not reset or discard anything. | Current overall `git diff --stat`: 30 files changed, 1925 insertions, 352 deletions. Stage 7A-specific files are listed in the Git status row above. | Re-run a narrower diff after future stages if a commit is being prepared. |
| Remaining real-iPhone checks | PARTIAL | Simulator/static audits cannot prove Safari chrome, keyboard, or tactile overlap behavior completely. | Left these explicitly manual, not auto-passed. | Manual required: iPhone Safari status-bar clearance, Dynamic Island safe-area, bottom toolbar clearance, keyboard resize, FAB collision on dense dashboards, modal overlay layering. | Real hardware acceptance before release/deploy. |

## Stage 7A summary

- Runtime fixes completed for:
  - subject switcher mobile in-flow behavior
  - shared safe-area tokens
  - compact icon-only feedback FAB
  - protected-flow FAB suppression via resolved `currentScreen`
  - mobile footer/browser-bottom clearance contract
- All Stage 7A and earlier-stage validators passed after alignment.
- Build passed.
- `dist/index.html` content was restored to `HEAD`; only line-ending warnings remain in Git status within this environment.

## Stage 7A gate result

Current recommendation: PASS for code + validator gate, with manual iPhone Safari verification still required before treating browser-specific behavior as fully production-proven.
