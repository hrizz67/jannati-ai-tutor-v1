# P1.17-V04 — Native microphone release handshake

Status: **DRAFT PR / PENDING CI / PHYSICAL RETEST NOT RUN / NO PRODUCTION DEPLOYMENT**
Baseline: `v3.13.30` / `892579c85608c01db031988565fbc10d302bb98d`.

## Physical reproduction (2026-10-18)

On iPhone Safari after v3.13.30:
- First quiz voice answer can return a correct transcript (for example "Kucing" or "Kasut").
- The next question no longer appears to retain the previous recording.
- The first microphone attempt on the next question sometimes fails with "Suara belum dapat dikesan" (confidence 0%), then **Cuba Lagi** returns a correct transcript.
- This is a **PARTIAL PASS** for native capture release but **FAIL** for first-try question-to-question recognition. Android hardware is NOT RUN.

Screenshots alone cannot prove exact native audio-track state or which callback was delayed, so this is a plausible lifecycle diagnosis rather than hardware-proven root cause.

## Engineering rationale

Previously the normal Quiz Web Speech path finalized **immediately inside `onresult`**, calling `abort()` before the browser delivered `onend`. A native recognizer may still own the microphone while a learner taps the next question, even though the prior JavaScript session is already disposed. The repository's pre-existing shared native backend test explicitly models a recognizer starting during another instance's asynchronous abort release and stalling without capture.

This change makes the normal Quiz wait for the browser's native **`onend` acknowledgement**, with **`stop()`** requested after a captured transcript, before marking that answer voice session `completed`. It does not start a new recorder automatically. The next question's microphone remains an explicit new tap.

## Change boundaries

- `awaitNativeEndOnTranscript` is **false by default** in `createSpeechSession`; only Quiz Web Speech enables it.
- On single-utterance quiz `onresult`, buffer a transcript, call `stop()` and stay `processing` until native `onend`.
- A bounded **4-second** safety gate explicitly returns a retry/manual fallback if the native `onend` never arrives; do **not** silently treat an unacknowledged capture as successfully released or auto-restart in the background.
- On native `onend`, finalize the preserved answer once; do not redundantly `abort()` an already ended native session.
- A duplicate mic tap during `processing` is disabled on the quiz UI. Question navigation/unmount still cancels pending capture. Old Q1 callbacks remain guarded.
- Existing `abortOnTranscriptComplete` behavior and its unit-test contract remain unchanged for callers not opting into the handshake.
- Bacaan/Bertutur, desktop voice, MediaRecorder-STT pilot, Worker, Supabase, payments, XP/coins and question bank remain unchanged.

## Mandatory QA

| Scenario | Target | Status |
| --- | --- | --- |
| iPhone/Android delayed native `onend` model (500ms) | Wait for ack; Q2 first new tap captures | CI pending |
| Native `onend` missing | Bounded retry/manual fallback; no silent successful release | CI pending |
| Navigation while awaiting native `onend` | Cancel; no stale Q1 transcript in Q2 | CI pending |
| Desktop and Bacaan/Bertutur legacy regression | No default behavior change | CI pending |
| Physical iPhone Safari Q1–Q5 first tap | At least five sequential answers; no unnecessary retry | NOT RUN |
| Physical Android Chrome Q1–Q5 first tap | Same as iOS | NOT RUN |
| iOS privacy-indicator timing | Distinguish OS delay from active capture | NOT VERIFIED |

No merge, tag, release, deploy or global STT activation in this PR. Wait for independent review and physical retest after a separately approved release. Do not claim CI is physical success.
