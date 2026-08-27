# Jannati AI Tutor 3.9.4 Release Notes

Status: stable
Tag: v3.9.4
Build date: 2026-08-27T11:31:03.124Z

## Highlights

- Learning snapshots now cross an ownership gate before merge: wrong-account and wrong-child records are quarantined instead of being projected into Fayyadh or another active profile.
- Guest, Free, and Premium progress can no longer overwrite one another merely because cloud data is newer or a retry is pending.
- All read-aloud actions now use one multilingual browser voice engine for BM, English, and Arabic, including mixed Arabic/Rumi text and delayed voice loading on mobile devices.
- Malay and Arabic never fall back silently to an English or Indonesian voice; the learner receives a clear device voice-pack message instead.

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
