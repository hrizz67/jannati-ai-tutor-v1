# Jannati AI Tutor 3.13.29 Release Notes

Status: stable
Tag: v3.13.29
Build date: 2026-10-18T00:30:40.408Z

## P1.16 Consolidated Learning Scope

- Carries forward the teacher-reviewed P1.16 interactive expansion across all eight Year 2 subjects, with 292 authored interactions and 985 derived auto-safe interactions for 1,277 runtime-interactive questions.
- Preserves the P1.16D deferred communication bundle, P1.16E accessibility and recovery hardening, and the P1.16F CI-only isolated QA preview boundary.
- Production uses the normal production build mode. QA-only banners, disabled-backend preview configuration, and preview metadata are not shipped in the public application.

## P1.17-V01 Quiz Mobile STT Pilot

- Adds the reviewed mobile MediaRecorder-to-STT quiz path for a future controlled iPhone Safari and Android Chrome pilot, with fresh capture sessions, explicit start/stop, bounded recording, transcript review, and question-transition cleanup.
- The public `?quizMobileSttPilot=1` parameter is **not** treated as access control. Public production activation is disabled by a separate build permit, and the official tagged deployment intentionally does not set that permit.
- A visitor cannot activate quiz recording or upload quiz audio on the public v3.13.29 build merely by adding the query parameter.
- Existing Bacaan/Bertutur behavior, desktop quiz speech behavior, authentication, rewards, cloud sync, Premium access, and the question bank are unchanged.

## STT Capacity and Privacy Boundary

- The existing STT Worker remains limited to 60 accepted requests per 60 seconds per allowed origin and Cloudflare location; callers from the production origin share that bucket.
- CORS is not authentication. The Worker does not currently provide server-validated learner identity, per-account quota, or a repository-enforced Workers AI budget safeguard.
- No Worker, quota, endpoint, credential, Supabase schema, RPC, or learner-data change is included in this release.
- Public quiz-pilot activation remains blocked pending a separately controlled test environment, backend abuse/cost controls, privacy review, and explicit approval.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.

## Validation Summary

- Status: pass
- Info: 14816
- Warnings: 0
- Errors: 0

## Curriculum Coverage

- Subjects: 8
- Topics: 84
- Questions: 4530
- Unique SK/SP pairs: 453
- Curriculum coverage: 100%
- Difficulty balance: mudah 2086, sederhana 1753, sukar 691

## Known Follow-ups

- P1.17 iPhone Safari and Android Chrome physical acceptance is **NOT RUN**. CI and simulated tests are not hardware evidence.
- VoiceOver, TalkBack, microphone privacy-indicator timing, interrupted-network behavior, and production-scale STT capacity remain **NOT RUN / ON HOLD**.
- The prior `MATH-NOMBOR-PILOT-007` physical-iPhone acceptance exception remains **OPEN / NOT VERIFIED**.
- Wrong-answer feedback wording and mixed Arabic–Malay layout remain observed follow-ups requiring real-device verification.

## Rollback Reference

- Previous stable immutable release: `v3.13.28` at commit `f971c0d1bccc1fe870a58788b9d4fbe061c6b7e0`.
- Previous deployed GitHub Pages commit: `06f6223a141a7ea72db2906008bc309c32754cf9`.
- Rollback uses the repository's existing tagged deployment path and matching revisioned service-worker cache identity.
