# Jannati AI Tutor 3.4.1 Release Notes

Status: stable
Tag: v3.4.1
Build date: 2026-08-20T16:38:00.591Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Premium Profile Hotfix

- Logging into an existing Premium account now reuses the learner's established child profile instead of creating or selecting a same-name empty profile.
- When a local anonymous snapshot and an existing Premium snapshot conflict during login recovery, the snapshot with meaningful learning evidence is retained.
- Accounts already affected by the older duplicate-profile behaviour can automatically recover when the active duplicate is empty and the matching Premium profile owns the learning history.
- The recovered Premium child ID becomes active across local metadata, snapshots, React state, and the next cloud save.

## Data Isolation

- Login recovery requires both normalized learner name and school year to match.
- Name-based reconciliation is disabled during ordinary sync, so separate profiles are not merged by display name alone.
- Same-name learners in different school years remain separate.
- No Supabase schema migration is required for this hotfix.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.

## Validation Summary

- Status: pass
- Info: 14660
- Warnings: 0
- Errors: 0

Learning-sync regression coverage includes Premium profile reuse, pre-existing cloud duplicate recovery, richer-snapshot preservation, and child-profile isolation.

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
