# Jannati AI Tutor 3.12.3 Release Notes

Status: stable
Tag: v3.12.3
Build date: 2026-09-09T11:07:35.354Z

## Release Readiness

### Learning-sync storage hardening

- Routine pre-write backups are capped at the latest 10 per account; recovery snapshots with explicit retention reasons remain protected.
- Applied operation records expire after 30 days and conflict records after 90 days, preventing unbounded table growth.
- Operation history now stores hashes and payload sizes without retaining a second full copy of every learner payload.
- Identical payloads succeed without creating a revision, backup, or operation-payload duplicate.
- Client retries reuse the same operation ID, and timestamp-only changes no longer trigger cloud writes.
- Account/child isolation, compare-and-swap conflict protection, idempotency, and rollback safeguards remain enforced.
- The production database migration is applied before the v3.12.3 deployment tag is published.

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
