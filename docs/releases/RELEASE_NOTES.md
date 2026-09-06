# Jannati AI Tutor 3.12.0 Release Notes

Status: stable
Tag: v3.12.0
Build date: 2026-09-06T14:58:41.814Z

## Admin Console V2

- Owners and verified admins can manage customers and Premium access from the protected `#/admin` console.
- Renewal supports 30, 90, and 365 days without discarding unused active time, plus custom Malaysia end-of-day expiry.
- Trials and complimentary access are time-aware; permanent complimentary access is represented explicitly without a synthetic expiry year.
- Entitlement changes, manual payment references, and audit history are committed atomically by one server-authorized operation.
- Normal accounts cannot view other customers, admin notes, payment records, audit history, or mutate Premium access.

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
