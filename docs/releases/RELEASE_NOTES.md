# Jannati AI Tutor 3.13.28 Release Notes

Status: stable
Tag: v3.13.28
Build date: 2026-10-17T13:36:34.024Z

## Consolidated P1.16 Scope

- P1.16C Batches 2–6 add 30 teacher-reviewed Year 2 interaction overlays across Bahasa Melayu, English, Mathematics, Science, Arabic, Islamic Education, Physical Education, and Health Education. Source question IDs, canonical and accepted answers, marks, difficulty, and curriculum metadata remain unchanged.
- The validated interaction inventory is 292 authored interactions plus 985 derived auto-safe interactions, for 1,277 runtime-interactive questions and 110 reviewed visual interactions.
- P1.16D defers communication content until it is opened and preserves an explicit, user-triggered recovery path after a deferred import failure.
- P1.16E improves screen-reader feedback for interactive answers and next actions, and adds rendered-component coverage for image choice, fill blank, visual mathematics, measurement, and deferred-import recovery.
- P1.16F adds a CI-only isolated QA preview artifact. Production continues to use the normal production mode; QA-only banners, disabled-backend configuration, and preview metadata are excluded from the production bundle.

## Safety Boundaries

- Supabase production configuration remains browser-safe, and the public STT endpoint remains scoped to the production build and deployment workflow.
- The child-safety generative AI gateway remains disabled unless separately authorized.
- No Supabase schema, RPC, migration, authentication, reward, cloud-sync, Premium, payment, STT Worker, or source question-bank contract is changed by release preparation.
- Physical iPhone, Android, VoiceOver, TalkBack, and R3A/R3B acceptance are **NOT RUN / ON HOLD**. This release preparation does not claim physical-device acceptance.

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

- Real-device Safari, Android Chrome, microphone, audio, RTL, VoiceOver, and TalkBack checks remain pending manual acceptance.
- R3A/R3B remain on hold and are not enabled by this release.

## Rollback Reference

- Last stable immutable release: `v3.13.27` at commit `220fe3bd85b47d0f816b8d56659a05ee9f74ead1`.
- Last deployed GitHub Pages commit before this release preparation: `0b5db4d19e36e71a15ad0b7f05cfae993af0266e`.
- Rollback uses the existing tagged deployment path for `v3.13.27`; the revisioned service-worker URL activates the matching cache identity and removes older Jannati cache revisions during activation.
