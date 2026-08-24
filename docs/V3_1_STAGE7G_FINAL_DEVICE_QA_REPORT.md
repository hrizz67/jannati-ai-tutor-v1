# Jannati v3.1 Stage 7G Final Device QA Report

Date: 2026-07-28
Branch: `v3.1-compact-ui`
Live QA: https://hrizz67.github.io/jannati-ai-tutor-v1/
Recommendation: **NOT READY**

## Final gate summary

| Area | Status | Verification | Evidence | Remaining issue | Severity |
|---|---|---|---|---|---|
| Worktree safety | PASS | `dist/index.html`, `vite-preview.out.log`, package files and lockfiles are clean after build/deploy cleanup. No dependency/config drift was retained. | `git diff --exit-code` and scoped `git status` | Existing Stage 1â€“7F runtime, validator, report and audit-artifact changes remain intentionally uncommitted. | â€” |
| Validator chain | PASS | All 20 required Stage 7G validators exited 0. | Validator list below | Node emitted module-type performance notices and Git emitted line-ending notices only. | P3 |
| Production build | PASS | Vite 8.1.0 transformed 323 modules and completed in 1.16 s on the deploy build. | Build output below | Known main-chunk warning (>500 kB). | P3 |
| QA deploy | PASS | Publish command returned `Published`; live HTML references the deployed hashes. | `index-DUn7vwES.js`, `index-BMG2BtEF.css` | None. | â€” |
| Live runtime/console | PASS | Live dashboard loaded without error boundary; browser console contained no errors or warnings during tested paths. | Live Browser QA, 390Ã—844 responsive viewport | Coverage is browser emulation, not physical iPhone Safari. | â€” |
| Mobile layout | PARTIAL | No horizontal overflow on Home, Parent, UASA, Mendengar or Bertutur in the tested mobile viewport. Tutor modal stayed inside the viewport with reachable close control and body scroll lock. | `artifacts/stage7g/*.png` | Physical 390Ã—844, 393Ã—852 and 430Ã—932 iPhone Safari matrix not available. | P2 |
| Labels/resume/CTA | FAIL | Live Bertutur H1 renders `BM Bertutur 2`. | `artifacts/stage7g/live-bertutur.png` | Prohibited raw label escaped canonical display formatting. | P1 |
| Tutor AI modal | PASS | Portal dialog opened, initial focus landed on `Tutup`, body scroll locked, and Escape closed the dialog. Dialog bounds were 374.4Ã—828 within the 390Ã—844 viewport. | `artifacts/stage7g/live-tutor-ai.png` | Explain and Teach were not independently exercised after the P1 gate failure. | â€” |
| Communication logic | PASS | Static validators cover denied/empty technical attempts, valid assessed 0%, history dedupe, and genuine session summaries. Live empty states did not fabricate a summary. | Stage 7B/Stage 2/communication validators; Mendengar and Bertutur screenshots | Mic permission and audio hardware behavior require a real device. | â€” |
| Print QA | PARTIAL | Print-safety validator passed. Parent report was rendered and reviewed in normal mobile layout. | `artifacts/stage7g/live-parent.png` | Native browser Print Preview was not available in this automated session. | P2 |
| Mic/audio QA | NOT TESTABLE | Static audio and communication validators passed. | `audioContentAudit.mjs`, `v31Stage2CommunicationAudit.mjs` | Real iPhone permission, playback and recognition flows were not available. | P2 |
| Screenshot checklist | PARTIAL | Seven required live screenshots were captured and visually/DOM reviewed. | Paths below | Eight required views were not captured after the P1 release gate failed. | P2 |
| Commit gate | FAIL | No commit was made, as required after a P1 device/live failure. | Git status below | Repair and repeat Stage 7G acceptance. | P1 |

## Validator results

All required validators passed:

1. `v31Stage7fLabelsResumeCtaAudit.mjs`
2. `v31Stage7eAnalyticsTypographyAudit.mjs`
3. `v31Stage7dAiModalAudit.mjs`
4. `v31Stage7cGamificationConsistencyAudit.mjs`
5. `v31GamificationTextAudit.mjs`
6. `v31Stage7bCommunicationConsistencyAudit.mjs`
7. `v31Stage7aMobileChromeAudit.mjs`
8. `v31BrowserEnvironmentAudit.mjs`
9. `v31CoachContextIconAudit.mjs`
10. `v3CoachPayloadAudit.mjs`
11. `communicationModulesAudit.mjs`
12. `audioContentAudit.mjs`
13. `v31IphoneAcceptanceRepairAudit.mjs`
14. `v31VisualWowSafetyAudit.mjs`
15. `v31Stage1MobileShellAudit.mjs`
16. `v31Stage2CommunicationAudit.mjs`
17. `v31Stage3CoachUasaAudit.mjs`
18. `v31Stage4DashboardAnalyticsAudit.mjs`
19. `v31Stage5PlanningLabelsAudit.mjs`
20. `v31Stage6FinalRegressionAudit.mjs`

The Stage 7F validator did not detect the live Bertutur H1 because the active communication title is produced from `semanticSpeakingPrompts` and rendered directly as `set.title`.

## Final build

| Output | Raw size | Gzip size |
|---|---:|---:|
| Main JS (`index-DUn7vwES.js`) | 726.23 kB | 213.28 kB |
| Main CSS (`index-BMG2BtEF.css`) | 100.52 kB | 19.49 kB |

- Stage 7F main-JS baseline: 726.23 kB.
- Unexpected increase over baseline: 0 kB.
- Deploy build time: 1.16 s.
- Warning: main chunk exceeds Vite's 500 kB advisory threshold.
- Deployment contained hashed route/content chunks plus the main JS and CSS listed above.

## Live deployment verification

- Publish result: `Published`.
- Live HTML script: `https://hrizz67.github.io/jannati-ai-tutor-v1/assets/index-DUn7vwES.js`
- Live stylesheet: `https://hrizz67.github.io/jannati-ai-tutor-v1/assets/index-BMG2BtEF.css`
- Document title: `Jannati AI Tutor`.
- Error boundary: not observed.
- Console errors/warnings: none observed on tested paths.

## Device matrix

| Target | Status | Notes |
|---|---|---|
| 390Ã—844 | PARTIAL | Tested through an explicit responsive browser viewport. Home, Parent, UASA, Mendengar, Bertutur and Tutor AI were exercised. This is not physical iPhone Safari. |
| 393Ã—852 | NOT TESTABLE | No physical iPhone/session available. |
| 430Ã—932 | NOT TESTABLE | No physical iPhone/session available. |

## Confirmed issue

Screen: Bertutur
Severity: **P1**
Screenshot: `artifacts/stage7g/live-bertutur.png`

Reproduction:

1. Open the deployed QA URL.
2. Complete the demo onboarding for Tahun 2.
3. From Papan Utama, choose **Bertutur**.
4. Observe the page H1: `BM Bertutur 2`.

Likely component/data path:

- `src/App.jsx` `BertuturCoach` renders `<h1>{set.title}</h1>`.
- `src/data/communicationContent.js` creates active titles as `${language} Bertutur ${index + 1}`.
- `src/utils/displayFormatter.js` already knows the canonical replacement, but the H1 bypasses it.

Minimal recommended repair: pass `set.title` through the existing canonical display formatter at the H1 boundary (or canonicalize the semantic speaking title once at content construction), then add a validator assertion against the rendered active Bertutur H1. Do not alter scoring, session, history, mic, or routing logic.

## Screenshot evidence

Captured and reviewed:

- `artifacts/stage7g/live-home-top.png`
- `artifacts/stage7g/live-home-middle.png`
- `artifacts/stage7g/live-home-footer.png`
- `artifacts/stage7g/live-parent.png`
- `artifacts/stage7g/live-tutor-ai.png`
- `artifacts/stage7g/live-bertutur.png`
- `artifacts/stage7g/live-mendengar.png`
- `artifacts/stage7g/live-uasa.png`
- `artifacts/stage7g/live-footer.png` (same reviewed footer state as `live-home-footer.png`)

Not captured after the P1 gate failure:

- `live-analytics.png`
- `live-review.png`
- `live-resume.png`
- `live-gamification.png`
- `live-explain.png`
- `live-teach.png`

## Git state

- Branch: `v3.1-compact-ui`.
- No commit created.
- `dist/index.html` clean after required restore.
- `vite-preview.out.log` clean/absent.
- Package, dependency, lockfile and config drift: none.
- `artifacts/` remains untracked and audit-only.
- Existing uncommitted Stage 1â€“7F runtime and validator work remains in place.
- The only Stage 7G report change is this report; Stage 7G screenshots are audit artifacts.

## Release recommendation

**NOT READY**

Reason: the live device/browser acceptance gate has a P1 failure (`BM Bertutur 2`), and the required physical iPhone matrix, full critical screenshot checklist, Print Preview, and mic/audio checks are incomplete. Per Stage 7G rules, no repair was made silently and no commit was created.

## Stage 7G P1 canonical-label repair rerun

Date: 2026-07-28

Root cause: `BertuturCoach` rendered the active speaking itemâ€™s raw `set.title` directly as its H1. The raw source is produced by `src/data/communicationContent.js` as `${language} Bertutur ${index + 1}`; the visible boundary bypassed the shared formatter in `src/utils/displayFormatter.js`.

Repair: `src/App.jsx` now keeps `rawSetTitle` for resume metadata and finish/session payloads, derives the local Bertutur display object with the existing `formatScopeLabel` formatter, and leaves `communicationContent.js`, scoring, session identity, storage schema, analytics payloads, and lesson content unchanged. No other communication screen or unrelated workflow was modified.

Before / after:

- `BM Bertutur 2` -> `Bertutur Bahasa Melayu Tahun 2`
- `Bm Intro` -> `Pengenalan Bertutur` (shared formatter fixture; no live leak observed)

Focused validator output:

```text
Stage 7G canonical-label repair audit PASS
bertuturHeading: Bertutur Bahasa Melayu Tahun 2
topicHeading: Pengenalan Bertutur
rawTitleSourcePreserved: true
scoringSessionStorageContractsPreserved: true
```

The other required spot validators (`v31Stage7f`, `v31Stage7b`, `v31Stage7a`, `v31Stage6`) passed, and the complete validator chain passed: **21 validators PASS** including the new Stage 7G repair audit.

Build result:

- Main JS: 726.26 kB raw, 213.32 kB gzip (`index-DVv_cpX0.js`)
- Main CSS: 100.52 kB raw, 19.49 kB gzip (`index-BMG2BtEF.css`)
- Build: PASS; Vite completed in 809 ms on the deploy build.
- Advisory only: Vite reports the existing >500 kB main-chunk warning.
- `dist/index.html`: restored and clean after build/deploy; `vite-preview.out.log`: clean/absent.

QA deploy:

- Publish output: `Published`
- Deployed JS: `index-DVv_cpX0.js`
- Deployed CSS: `index-BMG2BtEF.css`

Live verification:

- Bertutur H1: `Bertutur Bahasa Melayu Tahun 2`.
- Raw `BM Bertutur 2`: absent.
- Raw `Bm Intro`: absent on the live Bertutur path.
- Error boundary: absent.
- Console errors/warnings: none observed.
- The tested Bertutur screen rendered the unchanged manual transcript, scoring controls, and empty session summary contracts; no scoring/session behavior was changed by the repair.

Remaining manual checks: physical iPhone Safari widths (390Ã—844, 393Ã—852, 430Ã—932), native Print Preview, and microphone/audio hardware permission/playback remain manual/not testable in this session.

Updated recommendation: **READY FOR COMMIT**. No commit was created, per instruction.
