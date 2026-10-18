# P1.17-V05 — Manual Selesai for the original Quiz Web Speech microphone

Status: **DRAFT PR / CI PENDING / PHYSICAL QA NOT RUN / NO MERGE OR DEPLOYMENT**
Baseline: production `v3.13.31` / `a7e9fd3cf93d2dfab54e36ea9e4ff3340ff4f686`.

## Physical user report

On iPhone Safari, normal Quiz on v3.13.31 still passes the first spoken answer. On question 2, the old microphone appears to stop, but tapping the microphone yields no transcript ("Suara belum dapat dikesan", confidence 0%). Up to two extra **Cuba Lagi** attempts can still fail. Android physical result is **NOT VERIFIED**.

**Requested behavior:** Return to the ordinary browser Web Speech path, but give the learner a clear manual **Selesai** button to press after speaking. Do not auto-finalize/abort the native recognizer on the first transcript.

## Scope and invariants

1. Existing normal Quiz Web Speech remains the recording backend. **No MediaRecorder, Cloudflare STT, new paid service or Worker change.**
2. Learner taps **Mikrofon** once to begin. Once listening, the button changes to **Selesai**. The learner speaks and presses **Selesai** to request `recognition.stop()`.
3. If Safari/Chrome itself sends `onend` before the learner presses Selesai, preserve any transcript and finish automatically; do not require an extra tap on a stopped recognizer.
4. On `onresult`, **buffer** speech without calling `stop()`/`abort()` or checking the answer. Commit buffered transcript to the editable answer only after native `onend`.
5. Native Web Speech may deliver a final result **after** `stop()` but before `onend`. Accept that late result; do not discard it.
6. Prevent duplicate Selesai taps and duplicate callback/result commits while `stopping`. A bounded four-second fallback gives clear retry/manual entry if native `onend` never occurs. Do not claim the microphone is released until native acknowledgement.
7. On question change, navigation, unmount, answer check, error, no-speech or permission denial: cancel/release and protect against stale Q1 callbacks. Do not erase typed answers on speech failure.
8. `manualQuizStop` in `createSpeechSession` defaults **false**. Bacaan, Bertutur, desktop/non-quiz default Web Speech behavior and existing diagnostic paths are unaffected. Quiz adopts manual finish for its current public Web Speech mode, including desktop quiz; test this UX before rollout.
9. No change to learner rewards, Supabase, premium, payment, question bank, app version, STT Worker or production feature flags.
10. No automatic microphone restart, no unrestricted background capture. Existing native hard timeout remains for a forgotten Selesai tap.

## Validation

Synthetic unit tests cover iOS and Android native owner handoff, delayed `onresult` after manual stop, browser auto-`onend`, no speech, native-stop timeout, navigation cancellation and legacy mode. Synthetic PASS cannot certify real Safari/Chrome microphone release.

| Test | Status |
| --- | --- |
| All repository tests, lint, build and validation | CI PENDING |
| Real iPhone Safari: 5 questions, explicit Selesai, first-try transcript Q2+ | NOT RUN |
| Real Android Chrome: same | NOT RUN |
| Mic permission deny, no-speech, delayed `onend`, background/foreground | NOT RUN |
| iOS Safari privacy indicator and true capture release | NOT VERIFIED |
| Bacaan/Bertutur physical regression | NOT RUN |

**Release gate:** PR must pass full CI, independent review and separate explicit approval before merge or versioned deployment. Since the Quiz button changes for all Web Speech-capable browsers, review iPhone, Android and desktop quiz usability. A physical re-test is mandatory before declaring P1.17 complete. Production remains `v3.13.31` until approved release.
