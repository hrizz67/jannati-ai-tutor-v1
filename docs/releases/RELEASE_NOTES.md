# Jannati AI Tutor 3.3.4 Release Notes

Status: stable
Tag: v3.3.4
Build date: 2026-08-14T11:51:15.523Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Learning Sync and Profile Safety

- Desktop and mobile now merge learning data by child profile instead of allowing a stale whole-account snapshot to replace unrelated profile progress.
- Autosave waits for cloud hydration, persists pending offline changes, retries after reconnect or focus, and refreshes the active child snapshot before upload.
- Deleted child profiles remain deleted across devices; both normal and original backup snapshots are removed and protected by deletion tombstones.
- Cloud pulls update the live profile list and active learning state without overwriting newer answers created while an upload is in flight.
- A failed initial cloud request no longer causes unchanged local data to be pushed over the cloud when connectivity returns.

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
