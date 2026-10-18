# Changelog

## 3.13.30 - 2026-10-18

### P1.17-V03

- Added quiz-only native Web Speech termination after a confirmed transcript so the browser recognizer is not detached while it may still own microphone capture.
- Added bounded cleanup for quiz success, no-speech, timeout, permission/capture errors, unexpected terminal errors, restart, answer submission, navigation, and unmount.
- Bound quiz speech callbacks and recovery to the active question context and generation to prevent stale cross-question results.
- Added simulated iOS Safari and Android Chrome lifecycle regressions while preserving the established Bacaan/Bertutur defaults.

### Public pilot and scope safety

- Kept the MediaRecorder-to-STT quiz pilot build-disabled in public production; the public query parameter alone cannot enable recording or upload.
- Kept the STT Worker, Supabase, authentication, XP, coins, rewards, Premium, payment, question bank, and learner storage unchanged.
- Carried forward the P1.16 interactive, deferred-loading, accessibility, recovery, and isolated-preview boundaries without changing their contracts.

### Release controls

- Package metadata remains the source of truth for version and stable tag alignment.
- Tagged deployments verify production configuration, validation, bundle limits, credential safety, local assets, Pages publication, and the deployed entry hash.
- Rollback targets immutable `v3.13.29` source commit `4b9f37c14f1e0d53a33ef2a2ff004cfd8e4f1ddc` and prior Pages commit `ac0400e385cebbba6ed9d1f49a319e1ede2c7c8c`.

### Quality snapshot

- 962 unit tests passed; validation reported 0 errors and 0 warnings.
- 8 subjects, 84 topics, and 4530 questions validated.
- Production bundle gates passed: initial 861.75 kB, entry 302.19 kB, largest lazy chunk 459.49 kB.

### Physical follow-up

- iPhone Safari and Android Chrome retests remain NOT RUN.
- VoiceOver, TalkBack, Bacaan/Bertutur physical regression, and actual iOS microphone privacy-indicator clearance remain NOT RUN / NOT VERIFIED.
