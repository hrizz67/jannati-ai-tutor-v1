# Jannati v3.1 Stage 1 — Mobile Shell and Overlap Report

Stage 1 was limited to the global mobile shell, safe areas, subject-switcher layering, feedback FAB clearance, footer collision, z-index ordering and horizontal overflow. Communication content, analytics logic, UASA logic, review queues, weekly plans and Explain/Teach content were not changed.

## Results

| Check | Status | Evidence | Remaining manual check |
|---|---|---|---|
| Global page shell | PASS | `BetaChrome` now provides `.app-page-shell`; shell has width/max-width/min-width constraints and `overflow-x: clip`. Existing `.app` roots remain compatible. | Browser screenshots at 390/393/430 px |
| iPhone safe area | PASS (code) | Shared top/bottom `env(safe-area-inset-*)` rules, mobile clearance token and footer/FAB offsets are present. | Safari status-bar and toolbar behavior |
| Subject switcher overlap | PASS (code) | Switcher remains sticky/in-flow, has no fixed/absolute/negative offset, uses header + top safe-area offset, ellipsis labels and 44px arrows. | 390×844 and 393×852 scroll screenshots |
| Feedback FAB overlap | PASS (code) | One `BetaFeedbackButton` render; protected-flow suppression remains in App; mobile bottom/right safe-area clearance and print hiding are enforced. | Tap/scroll overlap on device |
| Footer collision | PASS (code) | Footer remains document-flow content, contains no feedback CTA/copy, uses compact wrapping and safe-area bottom padding. | Two-row visual verification on iPhone |
| Global z-index layering | PASS | Ordered tokens: content 1, sticky 18, FAB 45, dropdown 55, modal backdrop 70, modal 80, toast 90. | Modal/FAB interaction screenshots |
| CTA and Safari toolbar clearance | PASS (code) | Shared shell bottom clearance and footer/FAB safe-area offsets are applied without handler or disabled-state changes. | Long-page bottom-scroll device test |
| Horizontal overflow | PASS (code) | Shell width constraints, `min-width: 0`, clipped app-level overflow, ellipsis subject text and responsive grids are present. | Browser overflow measurement |

Code-only PASS values do not claim pixel-level iPhone verification.

## Root Causes Addressed

- No single page-shell contract existed around all route content.
- Safe-area rules were distributed across individual controls without a shared shell clearance token.
- Subject switcher sticky offset did not explicitly account for the app header and status area.
- Footer/FAB clearance rules were not documented as a single layering contract.
- Z-index values were numeric and scattered rather than named by interaction layer.

## Exact Files Modified in Stage 1

- `src/App.jsx` — wraps route content in `.app-page-shell`; workflow and handlers unchanged.
- `src/styles/style.css` — shared shell, safe-area, switcher, FAB, footer, z-index and overflow rules.
- `scripts/validate/v31Stage1MobileShellAudit.mjs` — executable Stage 1 assertions.
- `docs/V3_1_STAGE1_MOBILE_SHELL_REPORT.md` — this report.

Earlier visual/runtime changes in the worktree were preserved.

## FAB Visibility Matrix

| Surface | Expected | Source evidence |
|---|---|---|
| Home / dashboard | Visible, collapsed | `BetaFeedbackButton` is unsuppressed on dashboard |
| Analytics / Parent | Visible, collapsed | Same global Chrome path |
| Quiz | Hidden | `modalOpen || ['quiz', ...]` suppression |
| UASA | Hidden | Protected-flow list |
| Bacaan / Mendengar / Bertutur / Menulis | Hidden | Protected-flow list |
| Explain / Ajar Saya | Hidden | `modalOpen` suppression |
| Print | Hidden | `@media print` rule |

## Validator Output

- `v31CoachContextIconAudit.mjs`: PASS
- `v3CoachPayloadAudit.mjs`: PASS
- `communicationModulesAudit.mjs`: PASS
- `audioContentAudit.mjs`: PASS
- `v31IphoneAcceptanceRepairAudit.mjs`: PASS
- `v31VisualWowSafetyAudit.mjs`: PASS
- `v31Stage1MobileShellAudit.mjs`: PASS
- `git diff --check`: PASS (line-ending warnings only)

## Build

- `npm run build`: PASS
- Main JavaScript: **702.89 kB minified**, **206.87 kB gzip**
- Main CSS: **83.24 kB minified**, **16.73 kB gzip**
- Existing Vite >500 kB advisory remains non-blocking.

`dist/index.html` was restored to its tracked pre-build references. The environment’s Git index refresh can report a metadata-only marker for the file even when its content hash matches `HEAD`.

## Screenshot Artifacts

No browser automation was available in this pass. No fake screenshots were created. The required paths remain manual targets:

- `artifacts/stage1/390-home-top.png`
- `artifacts/stage1/390-home-middle.png`
- `artifacts/stage1/390-home-footer.png`
- `artifacts/stage1/390-parent-top.png`
- `artifacts/stage1/390-parent-footer.png`
- `artifacts/stage1/393-analytics.png`

## Stage Gate

Stage 1 validator: PASS. Existing validators: PASS. Build: PASS. FAIL count: 0. The stage is ready for manual/device QA; Stage 2 content and analytics repairs were not started.

No commit or deployment was performed.
