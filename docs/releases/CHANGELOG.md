# Changelog

## 3.13.32 - 2026-10-18

### P1.17-V05 manual quiz microphone finish

- Adds an explicit `Selesai` action for the quiz Web Speech microphone while preserving the learner's editable transcript and manual typing fallback.
- Buffers the current transcript until the browser's native `onend` acknowledgement, including transcripts that arrive after the learner stops capture.
- Retains the bounded four-second native-end timeout and stale-session cleanup across no-speech, errors, timeout, navigation, question changes, cancellation, and unmount.
- Keeps answer submission blocked during active capture/processing and prevents duplicate stop or transcript commits.

### Scope and safety

- Existing Bacaan/Bertutur behavior and legacy desktop speech defaults remain unchanged.
- The public MediaRecorder-to-STT quiz pilot remains build-disabled.
- No Supabase, reward, Premium/payment, question-bank, STT Worker, credential, dependency, or bundle-threshold change is included.
- Physical iPhone Safari, Android Chrome, desktop quiz, VoiceOver, and TalkBack acceptance for V05 remains not run.

### Quality snapshot

- 977 unit tests and 105 focused V05/related speech tests pass.
- 8 subjects, 84 topics, and 4530 questions validate with 0 errors and 0 warnings.
- Production-equivalent initial JavaScript is 863.93 / 900 kB; entry is 302.88 / 350 kB; largest lazy chunk is 459.49 / 480 kB.
