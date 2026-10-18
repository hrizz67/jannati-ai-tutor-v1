# Jannati AI Tutor 3.13.31 Release Notes

Status: stable
Tag: v3.13.31
Build date: 2026-10-18T01:49:00.649Z

## P1.17-V04 Native Microphone Onend Handshake Repair

- Addresses the remaining v3.13.30 physical iPhone Safari symptom: after a successful first quiz response, the native microphone could appear released while the first attempt on the next question produced no transcript or score; an explicit retry then worked.
- Quiz Web Speech now keeps the learner-safe processing state active until the browser acknowledges native recognizer termination through `onend`, then commits the already-buffered transcript to the editable answer field.
- If native `onend` is not received, a bounded four-second fallback ends the attempt and returns the learner to explicit retry or manual typing. It does not silently restart capture or accept a stale transcript.
- Timeout, no-speech, error, navigation, question change, cancellation, and unmount paths retain bounded cleanup and stale-callback protection.
- The handshake is enabled only at the quiz call site. Existing Bacaan/Bertutur and desktop behavior retain their established defaults.

## Public Quiz STT Safety Boundary

- The reviewed MediaRecorder-to-STT quiz pilot remains build-disabled in public production. The public `?quizMobileSttPilot=1` query parameter alone cannot activate recording or upload quiz audio.
- The official tagged deployment intentionally does not set the separate build permit.
- No STT Worker, capacity, quota, endpoint, credential, Supabase schema/RPC, learner-data, reward, Premium, payment, or question-bank change is included.

## P1.16 Consolidated Learning Scope

- Carries forward the teacher-reviewed P1.16 interactive expansion across all eight Year 2 subjects, with 292 authored interactions and 985 derived auto-safe interactions for 1,277 runtime-interactive questions.
- Preserves the P1.16D deferred communication bundle, P1.16E accessibility and recovery hardening, and the P1.16F CI-only isolated QA preview boundary.
- Production uses normal production mode. QA-only banners, disabled-backend preview configuration, and preview metadata are not shipped in the public application.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank, speech, STT, Worker, release-pipeline, credential-safety, and bundle audits run before publication.
- Tagged deployment verifies production configuration, validation, build, local asset integrity, Pages publication, and the deployed entry hash.
- Automated simulations verify the V04 iOS Safari and Android Chrome lifecycle contracts, but they are not hardware evidence.

## Validation Summary

- Unit tests: 968 passed.
- Focused V04 and related speech tests: 96 passed.
- Validation: 0 errors, 0 warnings, 14816 informational items.
- Subjects: 8; topics: 84; questions: 4530; curriculum coverage: 100%.
- Reviewed authored interactions: 292; derived auto-safe: 985; runtime interactive: 1277.
- Production-equivalent bundle: initial JavaScript 862.82 / 900 kB, entry 302.34 / 350 kB, largest lazy chunk 459.49 / 480 kB, Tutor incremental runtime 107.78 / 125 kB.

## Physical Acceptance Status

- Physical iPhone Safari first-tap retest after V04: **NOT RUN**.
- Physical Android Chrome first-tap retest after V04: **NOT RUN**.
- VoiceOver and TalkBack: **NOT RUN**.
- Actual iOS microphone privacy-indicator clearance: **NOT VERIFIED**.
- Bacaan/Bertutur physical regression: **NOT RUN**.
- The prior `MATH-NOMBOR-PILOT-007` physical-iPhone exception remains **OPEN / NOT VERIFIED**.
- CI success proves the bounded lifecycle contract, not physical-device reliability. Do not treat the original Safari symptom as fixed until the manual checklist passes.

## Rollback Reference

- Previous stable immutable release: `v3.13.30` at source commit `892579c85608c01db031988565fbc10d302bb98d`.
- Previous annotated tag object: `70917171aa656b126f2cb71c4ca2a32d99d5e8fd`.
- Previous deployed GitHub Pages commit: `0a2dfc4eddc1710db30e31a496ed2d11d411dbda` with entry `index-D8bLjtDQ.js`.
- Rollback uses the repository's existing tagged deployment path and matching revisioned service-worker cache identity.
