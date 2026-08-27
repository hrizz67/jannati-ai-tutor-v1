# Jannati AI Tutor 3.9.6 Release Notes

Status: stable
Tag: v3.9.6
Build date: 2026-08-27T16:08:16.464Z

## Highlights

- Desktop and mobile now derive the learner's total XP from one monotonic canonical value, even when older local caches contain different totals.
- Cloud hydration aligns the main profile, adaptive profile, gamification profile, AI memory, and student core before the dashboard is shown.
- Repeated sync does not add XP projections together; it keeps the highest valid total for the same child.
- Account and child ownership boundaries remain enforced, so this repair cannot merge Free data or another child's progress into the active Premium profile.

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
- Info: 14660
- Warnings: 0
- Errors: 0

## Curriculum Coverage

- Subjects: 8
- Topics: 84
- Questions: 4530
- Unique SK/SP pairs: 453
- Curriculum coverage: 100%
- Difficulty balance: mudah 2065, sederhana 1363, sukar 1102

## Known Follow-ups

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
