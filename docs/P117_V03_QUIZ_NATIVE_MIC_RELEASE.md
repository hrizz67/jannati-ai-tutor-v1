# P1.17-V03 — iPhone/Android native quiz microphone release

Status: **REPAIR PR ONLY — PHYSICAL RETEST NOT RUN — NO DEPLOYMENT**
Baseline: production stable `v3.13.29` / `4b9f37c14f1e0d53a33ef2a2ff004cfd8e4f1ddc`.

## Physical observation

User-provided iPhone Safari screenshots show public UI version **3.13.29** with an orange iOS microphone privacy indicator after quiz voice input and across quiz question navigation. They also show one accepted transcript ("Guru"), a no-speech / "Cuba Lagi" state and speech status returning to "Sedia" while the indicator remains displayed. These screenshots substantiate the report of microphone lifecycle uncertainty but do not independently prove that native audio tracks continued streaming during every pixel of the indicator.

The public v3.13.29 quiz deliberately uses the **existing native Web Speech**; the mobile MediaRecorder/STT pilot remains **build-disabled** in production. Therefore v3.13.29 did not repair the user's default quiz microphone issue.

## Reviewed code cause

In `src/ai/speech/speechEngine.js`, `finalize()` detached handlers and the JavaScript recognition reference without aborting an outstanding native recognition instance. This allows the browser's underlying recognizer to keep running beyond the quiz's perceived completion when `onresult` occurs before native `onend`. Certain `no-speech` and terminal errors also lacked an explicit native termination path. This is a code-confirmed lifecycle gap and a plausible contributor to the observed iOS indicator behavior; **hardware verification remains pending**.

## Minimum safe repair

- Introduce opt-in `abortOnTranscriptComplete` (default **false**) on `createSpeechSession`.
- Enable it only in the default Quiz Web Speech call site. Bacaan/Bertutur and diagnostics preserve existing default cleanup semantics.
- On successful quiz transcript, terminate native recognition only if native `onend` was not already acknowledged; preserve and emit transcript/result exactly once.
- On quiz no-speech, permission/capture errors or terminal unexpected errors, release native recognition without waiting indefinitely for `onend`.
- Bind Quiz callbacks to the active question context and request generation so stale Q1 callbacks cannot update Q2 state.
- Do not enable the MediaRecorder/STT pilot, change the Worker, activate public audio upload, change secrets or incur additional STT costs.

## Acceptance and release gates

| Test | Status before physical retest |
| --- | --- |
| Native quiz speech lifecycle simulation for iOS Safari and Android Chrome | CI PENDING |
| Speech unit regression, including existing Bacaan/Bertutur + desktop behavior | CI PENDING |
| Full lint, unit, validation, build/bundle + QA isolation | CI PENDING |
| iPhone Safari Q1 → Q2 → Q3 on real hardware | **NOT RUN** |
| Android Chrome Q1 → Q2 → Q3 on real hardware | **NOT RUN** |
| Delayed orange privacy-indicator disappearance vs active microphone | **NOT VERIFIED** |
| Bacaan/Bertutur mobile physical regression | **NOT RUN** |

Physical PASS criteria: microphone starts only on explicit tap, valid transcript remains editable, recognition fully releases after completion/error, Q2 never inherits native Q1 capture/transcript, and a new Q2 tap works without waiting. Repeat at least five questions and failed/no-speech attempts. Measure the iOS privacy indicator independently from actual native recognition lifecycle.

This PR must remain separate from unrelated reward, Supabase, question content, or STT Worker changes. Independent review is required before merge, and explicit approval is required before production deploy. Production v3.13.29 remains unaffected until such approval.
