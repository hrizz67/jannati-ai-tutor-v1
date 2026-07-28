# Jannati v3.1 Stage 2 — Communication Modules

## Scope and root causes

Stage 2 was limited to Bacaan, Mendengar, Bertutur, Menulis, shared result presentation, empty/technical attempts, CTA density, and audio/microphone state styling. The main consistency gap was that each module interpreted “has a result” differently. A shared `normalizeCommunicationResult()` contract now distinguishes idle, empty, technical-error, and assessed states without changing scoring or persistence rules.

## Shared result contract

`src/utils/communicationResult.js` normalizes `state`, `validAttempt`, `completed`, `score`, `canAdvance`, `canRetry`, and `errorCode`. A valid assessed score may be 0; empty and technical results expose `score: null` and cannot advance. Existing module scoring remains the source of truth.

## Module matrix

| Module | Scenario | Status | Evidence | Remaining manual check |
|---|---|---|---|---|
| Bacaan | Empty/manual/microphone attempts | PASS | Existing guards plus shared assessed gate; communication validator | iPhone microphone permission and Safari keyboard |
| Bacaan | Result metrics and session aggregate | PASS | Order-aware/metric assertions in `communicationModulesAudit.mjs` | Visual wrapping on physical 320–390px device |
| Mendengar | Empty answer and next guard | PASS | Empty answer returns non-assessed feedback; `communicationResult.canAdvance` gates next | Audible item change and playback timing on device |
| Mendengar | Audio state presentation | PARTIAL | Existing speech fallback and no-empty-audio validator; compact controls CSS | Real audio playback/error and waveform behavior |
| Bertutur | Recording/manual result contract | PASS | Completed speech results carry status; next requires assessed contract | Permission denied and SpeechRecognition on iPhone |
| Menulis | Empty answer/result contract | PASS | Empty answer remains non-assessed; next requires assessed contract | Keyboard viewport and long text on device |
| All four | CTA/mobile density | PASS | Shared scoped styles, safe-area bottom clearance, chip wrapping, reduced-motion override | Physical Safari toolbar/keyboard overlap |

## Exact files modified

- `src/App.jsx` — shared result normalization import/use, assessed score status, next guards.
- `src/utils/communicationResult.js` — new shared presentation contract.
- `src/styles/style.css` — communication-only compact mobile density, safe-area clearance, wrapping and reduced-motion rules.
- `scripts/validate/v31Stage2CommunicationAudit.mjs` — executable Stage 2 assertions.
- `scripts/validate/v31IphoneAcceptanceRepairAudit.mjs` and `scripts/validate/v31VisualWowSafetyAudit.mjs` — compatibility assertions for the shared contract.

## Session summary behavior

Existing aggregates continue to use valid score history only. Empty/technical attempts do not advance or append scores. Bacaan preserves completed count, average, best, passed count, and final item score. Finish controls remain explicit and do not create phantom completion.

## Validation

| Check | Result |
|---|---|
| v31CoachContextIconAudit | PASS |
| v3CoachPayloadAudit | PASS |
| communicationModulesAudit | PASS |
| audioContentAudit | PASS |
| v31IphoneAcceptanceRepairAudit | PASS |
| v31VisualWowSafetyAudit | PASS |
| v31Stage1MobileShellAudit | PASS |
| v31Stage2CommunicationAudit | PASS |
| `git diff --check` | PASS (line-ending warnings only) |
| `npm.cmd run build` | PASS |

Build output: main JS `index-CAdhSbVx.js` 703.51 kB (207.03 kB gzip); main CSS `index-BqkSrj0o.css` 84.59 kB (16.95 kB gzip). Vite’s large-chunk notice is non-blocking.

`dist/index.html` was restored to the pre-build tracked asset references (`index-DCDPvdDE.js` / `index-B-Whao4c.css`); `git diff -- dist/index.html` is empty. The working tree status still reports the pre-existing index metadata warning for that generated file.

At completion, `git diff --stat` reports the pre-existing Stage 1/visual tracked edits plus the Stage 2 changes; no commit or deployment was performed.

## Remaining real-device tests

Manual verification is still required for iPhone Safari microphone permission, SpeechRecognition retry, SpeechSynthesis language output, audible Mendengar item changes, keyboard/toolbar safe-area overlap, long Arabic/Jawi wrapping, and physical overflow. These are intentionally not marked PASS by static validators.

## Gate

All automated Stage 1 and Stage 2 checks pass, no FAIL findings remain, and no protected scoring, adaptive, content, analytics, UASA, or AI Explain/Teach logic was intentionally changed. Stage 3 should not begin until the listed device checks are exercised.
