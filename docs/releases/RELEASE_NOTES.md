# Jannati AI Tutor 3.13.32 Release Notes

Status: stable
Tag: v3.13.32
Build date: 2026-10-18T07:04:23.150Z

## P1.17-V05 Manual Microphone Finish for Quiz Web Speech

- Quiz Web Speech now gives the learner an explicit `Mikrofon` → `Selesai` flow instead of committing the answer while the learner may still be speaking.
- After `Selesai`, the quiz keeps a short processing state until the browser acknowledges native recognizer termination through `onend`, then places the buffered transcript in the editable answer field.
- A transcript arriving after the learner presses `Selesai` is retained for that attempt. Duplicate stop gestures, stale callbacks, and navigation to another question cannot commit a second or old transcript.
- If native `onend` is not received, the existing bounded four-second fallback returns the learner to explicit retry or manual typing. No-speech, permission, timeout, and runtime errors preserve a usable manual answer path.
- Enter and `Semak Jawapan` remain blocked while capture is starting, listening, stopping, or processing, so the microphone lifecycle cannot race scoring.
- The manual finish policy is enabled only at the quiz call site. Existing Bacaan/Bertutur behavior and the legacy desktop speech defaults are preserved.

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
- Automated simulations verify the V05 manual-stop lifecycle contracts, but they are not hardware evidence.

## Validation Summary

- Unit tests: 977 passed.
- Focused V05 and related speech tests: 105 passed.
- Validation: 0 errors, 0 warnings, 14816 informational items.
- Subjects: 8; topics: 84; questions: 4530; curriculum coverage: 100%.
- Reviewed authored interactions: 292; derived auto-safe: 985; runtime interactive: 1277.
- Production-equivalent bundle: initial JavaScript 863.93 / 900 kB, entry 302.88 / 350 kB, largest lazy chunk 459.49 / 480 kB, Tutor incremental runtime 107.78 / 125 kB.

## Physical Acceptance Status

- Physical iPhone Safari manual `Selesai`: **NOT RUN**.
- Physical Android Chrome manual `Selesai`: **NOT RUN**.
- Physical desktop quiz manual `Selesai`: **NOT RUN**.
- VoiceOver and TalkBack: **NOT RUN**.
- Actual iOS microphone privacy-indicator clearance: **NOT VERIFIED**.
- Bacaan/Bertutur physical regression: **NOT RUN**.
- The prior `MATH-NOMBOR-PILOT-007` physical-iPhone exception remains **OPEN / NOT VERIFIED**.
- CI success proves the bounded lifecycle contract, not physical-device reliability.

## Rollback Reference

- Previous stable immutable release: `v3.13.31` at source commit `a7e9fd3cf93d2dfab54e36ea9e4ff3340ff4f686`.
- Previous annotated tag object: `9edacc2c918746c9363c5db52089e7ebb4079dd8`.
- Previous deployed GitHub Pages commit: `f938a282139d132284e508564e16c4150936a0d8` with entry `index-C0zNhwps.js`.
- Rollback uses the repository's existing tagged deployment path and matching revisioned service-worker cache identity.
