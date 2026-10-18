# Changelog

## 3.13.31 - 2026-10-18

### P1.17-V04 native microphone onend handshake

- Keep quiz speech in its processing state until the native recognizer confirms termination through `onend` before committing the buffered transcript.
- Add a bounded four-second missing-`onend` fallback to explicit retry or manual typing without automatic restart or stale transcript reuse.
- Preserve cleanup on timeout, no-speech, errors, navigation, question changes, cancellation, and unmount.
- Preserve established Bacaan/Bertutur and desktop defaults; the public MediaRecorder-to-STT quiz pilot remains build-disabled.

### Release controls and quality

- Align package, lockfile, release metadata, health report, and README badges for v3.13.31.
- Validate 4530 questions across 8 subjects and 84 topics with 968 unit tests and 0 validation errors or warnings.
- Keep production JavaScript within budget: initial 862.82 kB, entry 302.34 kB, largest lazy chunk 459.49 kB, and Tutor incremental runtime 107.78 kB.
- Retain v3.13.30 as the immutable rollback release.

### Physical acceptance boundary

- iPhone Safari and Android Chrome first-tap retests after V04 are not run.
- VoiceOver, TalkBack, actual iOS microphone privacy-indicator clearance, and Bacaan/Bertutur physical regression remain not verified on hardware.
