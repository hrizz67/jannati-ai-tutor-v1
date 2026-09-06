# Jannati AI Tutor 3.11.0 Release Notes

Status: stable
Tag: v3.11.0
Build date: 2026-09-06T12:17:07.469Z

## Highlights

- Adds a secure Premium administration workspace for authorised administrators.
- Makes the Supabase `premium_entitlements` record the canonical source for Premium access.
- Supports activation, extension, fixed expiry, cancellation, and complimentary access with confirmation and idempotency protection.
- Records every administrator action in an append-only audit log and blocks direct browser writes through RLS.
- Revalidates access on authentication and browser lifecycle events, and safely returns to Free access when server verification is unavailable.
- Uses the same server entitlement decision for Tutor AI access.

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
- Complete physical desktop/mobile acceptance for the new administrator workflow.
- Continue diagnosis of the separate cross-device learning-data synchronization issue; this release does not migrate, merge, or delete learner progress.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.

## Readiness Decision

- Closed beta Premium administration: READY after the database migration is applied.
- Wider beta: NOT YET READY until physical-device admin acceptance and the separate learning-sync investigation are complete.
- Paid public release: NOT READY.
