# Jannati AI Tutor 3.12.1 Release Notes

Status: stable
Tag: v3.12.1
Build date: 2026-09-07T11:12:34.706Z

## Release Readiness

### Admin Console V2 hotfix

- Prevent endless "Menyimpan" states with a shared timeout and explicit submitting/verifying/success/failure/uncertain states.
- Recover a lost response by checking server audit and payment evidence, without submitting another renewal.
- Retry and reload recovery preserve the original UUID; malformed/mismatched responses never count as confirmed success.
- Request-scoped transaction locks prevent in-flight writes being reported as absent; entitlement, payment and audit remain atomic.
- Successful mutations release their UI lock before bounded background refreshes. Late customer responses cannot replace another selected account.
- Deploy `20260907090000_admin_subscription_recovery.sql` before publishing the frontend tag. SQL compilation, role checks and verification were exercised in a rollback-only linked-database preflight.
- Validation: 106 unit tests passed (43 recovery); full validation returned 0 errors and 0 warnings; production build and asset/bundle gates passed.
- No real customer renewal was created for this release test. Physical-device and payment-workflow acceptance remain manual checks.

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
