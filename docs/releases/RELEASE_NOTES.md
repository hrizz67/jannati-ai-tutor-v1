# Jannati AI Tutor 3.13.30 Release Notes

Status: stable
Tag: v3.13.30
Build date: 2026-10-18T01:09:43.900Z

## P1.17-V03 Native Quiz Microphone Lifecycle Repair

- Addresses the iPhone Safari symptom reported on v3.13.29: a quiz transcript could be accepted while the browser's native speech recognizer still appeared to own the microphone across question navigation.
- The quiz Web Speech path now explicitly terminates outstanding native capture after accepting a transcript, while retaining the transcript in the editable answer field.
- No-speech, timeout, permission/capture errors, unexpected terminal errors, restart, answer submission, question navigation, and component unmount retain bounded cleanup paths.
- Quiz callbacks are bound to the active question context and request generation so a stale result from an earlier question cannot populate a later question.
- The lifecycle change is opt-in at the quiz call site. Existing Bacaan/Bertutur and diagnostic speech behavior keep their established defaults.

## Public Quiz STT Safety Boundary

- The reviewed MediaRecorder-to-STT quiz pilot remains build-disabled in public production. The public `?quizMobileSttPilot=1` query parameter alone cannot activate recording or upload quiz audio.
- The official tagged deployment intentionally does not set the separate build permit.
- No STT Worker, capacity, quota, endpoint, credential, Supabase schema/RPC, learner-data, reward, Premium, payment, or question-bank change is included.
- The existing Worker capacity and privacy limitations documented in v3.13.29 remain unchanged; CORS is not learner authentication.

## P1.16 Consolidated Learning Scope

- Carries forward the teacher-reviewed P1.16 interactive expansion across all eight Year 2 subjects, with 292 authored interactions and 985 derived auto-safe interactions for 1,277 runtime-interactive questions.
- Preserves the P1.16D deferred communication bundle, P1.16E accessibility and recovery hardening, and the P1.16F CI-only isolated QA preview boundary.
- Production uses normal production mode. QA-only banners, disabled-backend preview configuration, and preview metadata are not shipped in the public application.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank, speech, STT, Worker, release-pipeline, credential-safety, and bundle audits run before publication.
- Tagged deployment verifies production configuration, validation, build, local asset integrity, Pages publication, and the deployed entry hash.
- Automated simulations verify iOS Safari and Android Chrome lifecycle contracts, but they are not hardware evidence.

## Validation Summary

- Unit tests: 962 passed.
- Validation: 0 errors, 0 warnings, 14816 informational items.
- Subjects: 8; topics: 84; questions: 4530; curriculum coverage: 100%.
- Reviewed authored interactions: 292; derived auto-safe: 985; runtime interactive: 1277.
- Production bundle: initial JavaScript 861.75 / 900 kB, entry 302.19 / 350 kB, largest lazy chunk 459.49 / 480 kB.

## Physical Acceptance Status

- Physical iPhone Safari retest: **NOT RUN**.
- Physical Android Chrome retest: **NOT RUN**.
- VoiceOver and TalkBack: **NOT RUN**.
- Actual iOS microphone privacy-indicator clearance: **NOT VERIFIED**.
- Bacaan/Bertutur physical regression: **NOT RUN**.
- The prior `MATH-NOMBOR-PILOT-007` physical-iPhone exception remains **OPEN / NOT VERIFIED**.
- Do not interpret this release as proof that the original Safari indicator symptom is fixed on real hardware until the manual checklist passes.

## Rollback Reference

- Previous stable immutable release: `v3.13.29` at source commit `4b9f37c14f1e0d53a33ef2a2ff004cfd8e4f1ddc`.
- Previous deployed GitHub Pages commit: `ac0400e385cebbba6ed9d1f49a319e1ede2c7c8c`.
- Rollback uses the repository's existing tagged deployment path and matching revisioned service-worker cache identity.
