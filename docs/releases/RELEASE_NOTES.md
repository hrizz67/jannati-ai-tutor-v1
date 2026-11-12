# Jannati AI Tutor 3.13.40 Release Notes

Status: stable
Tag: v3.13.40
Build date: 2026-11-12T15:20:46.730Z

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

## Owner-only controlled Chrome and physical-device acceptance
- Version 3.13.40 contains reviewed Tutor keyboard, reading-pane and mobile touch-target remediation integrated in PR #215.
- Chromium synthetic tests for narrow viewport, Tab/Shift+Tab/Escape and 200%-text reflow have passed, but this does NOT replace physical-device, native zoom or VoiceOver/TalkBack evidence.
- This release remains **OWNER-ONLY PRELAUNCH**. No real-child account, classroom pilot, payment, or Gate A2 is authorized.
- Remote generative AI and automatic Quiz STT remain OFF; no Supabase schema, Worker, or database changes are included.
- Preserve all test data as synthetic and review production browser regressions before broader rollout.
