# Jannati AI Tutor 3.3.5 Release Notes

Status: stable
Tag: v3.3.5
Build date: 2026-08-14T13:16:49.957Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Multi-device Sync Hotfix

- Quiz answers now mark the active child profile as pending immediately and use a persistent autosave timer, so rapid React state updates cannot cancel the final cloud write.
- Devices that remain open check for newer cloud learning data every five seconds and still refresh immediately after focus, visibility, or network recovery.
- The dashboard and quiz now distinguish local-device storage from authenticated Cloud sync and provide a direct sign-in action when Cloud is inactive.
- Signing in no longer clears existing local learning. First-time and returning account flows merge meaningful local progress into the selected account before Cloud hydration.
- All Cloud reads and writes remain scoped to the authenticated account, while child-profile snapshots remain isolated during merge, retry, and restore.

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
