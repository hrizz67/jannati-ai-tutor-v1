# Jannati AI Tutor 3.3.6 Release Notes

Status: stable
Tag: v3.3.6
Build date: 2026-08-20T11:40:12.669Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Free/Premium Access Isolation

- Premium access is granted only when the server profile ID matches the currently authenticated account.
- A new Free account can no longer inherit a Premium badge or protected feature access from local data or the previous account.
- Logout, expired sessions, account changes, Premium expiry, and server-side access revocation now update the interface safely.
- The dashboard, imported backups, child profiles, and restored learning state cannot promote an account using cached access fields.
- Supabase schema definitions explicitly default profile creation to Free and deny direct client writes to entitlement rows.
- The access-control audit now runs as part of the required release validation gate.

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
