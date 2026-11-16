# Jannati AI Tutor 3.13.42 Release Notes

Status: stable
Tag: v3.13.42
Build date: 2026-11-16T13:55:23.957Z

## Owner-only scope

- This release is for controlled owner-only testing with synthetic data. It does not authorize a real-child pilot or paid rollout.
- Gate A2 #148 and physical-device acceptance #156 remain on hold; microphone and live-audio acceptance remain pending.
- Remote generative Tutor AI and automatic Quiz STT Worker invocation remain disabled. No Worker, database-schema, Supabase-data, or authentication change is included.

## Release highlights

- Integrates the reviewed P2.6-H4 multilingual Tutor work from PR #224 for Bahasa Melayu, English, and Bahasa Arab follow-up teaching.
- Preserves active-question ownership, protected-answer handling, question-context isolation, and Tutor-only reward invariants.
- Includes the merged accessibility and owner-only QA artifact improvements from PRs #215 and #216.
- Educational Chrome acceptance is deliberately assessed after deployment and is not implied by automated CI success.

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

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
- Owner-only Chrome H5 acceptance for BM, English, and Arabic remains a separate post-deployment gate.
