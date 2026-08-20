# Jannati AI Tutor 3.4.2 Release Notes

Status: stable
Tag: v3.4.2
Build date: 2026-08-20T17:09:06.291Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## One Canonical Child Profile

- Accounts affected by the older logout/login bug no longer keep two same-name, same-year child profiles when both profiles contain learning data.
- The oldest established Premium profile remains canonical and becomes the active profile after cloud reconciliation.
- Distinct topic progress and history from both profiles are retained, while XP, scores, streaks, and other counters use conservative maximum values to avoid duplication.
- Exact same-name profiles in different school years remain separate.

## Data Recovery and Sync Safety

- The duplicate profile is archived in a hidden account-scoped backup before its visible profile and snapshot are removed.
- Its old ID receives a cloud tombstone so stale desktop or mobile state cannot recreate the duplicate.
- Backup data is excluded from child snapshots to prevent recursive storage growth.
- Creating a child with an existing normalized name and school year now reuses the existing profile.
- No Supabase schema migration is required.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.

## Validation Summary

- Status: pass
- Info: 14660
- Warnings: 0
- Errors: 0

Learning-sync regression coverage includes two meaningful duplicate profiles, cross-profile progress retention, conservative counters, hidden backup creation, tombstone propagation, and duplicate-creation prevention.

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
