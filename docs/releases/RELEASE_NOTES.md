# Jannati AI Tutor 3.10.2 Release Notes

Status: stable
Tag: v3.10.2
Build date: 2026-09-06T10:58:21.435Z

## Highlights

- Fixes the post-login device hydration failure reported as `Sync gagal` even after a newer Supabase revision was received.
- Skips duplicate legacy backups for data that already belongs to the authenticated account and child profile.
- Restores account and child learning snapshots transactionally; a quota or write failure rolls back to the previous complete device data.
- Keeps cloud writes locked until restore succeeds and retries safely without resetting XP, answers, or resume data.
- Adds non-identifying stage codes so any remaining device-specific failure can be diagnosed precisely.

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

- Confirm equal XP and cloud revision on desktop and mobile using the same Fayyadh child profile after this deployment.
- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.

## Readiness Decision

- Closed beta hotfix: READY for tagged deployment.
- Wider beta: NOT YET READY until cross-device XP synchronization is confirmed on physical desktop and mobile devices.
- Paid public release: NOT READY.
