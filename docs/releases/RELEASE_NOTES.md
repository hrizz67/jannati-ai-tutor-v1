# Jannati AI Tutor 3.9.5 Release Notes

Status: stable
Tag: v3.9.5
Build date: 2026-08-27T13:57:10.662Z

## Highlights

- Desktop and mobile now converge on one canonical child profile during authenticated sync, even when an older device still holds a historical child ID.
- Concurrent learning snapshots preserve the highest XP and combine distinct progress evidence without double-counting.
- Mobile browsers with an incomplete voice list now receive a native system-language playback attempt instead of an immediate "voice unavailable" failure.
- Free and guest data remain isolated from Premium accounts, and unrelated installed voices are not selected silently as language replacements.

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
