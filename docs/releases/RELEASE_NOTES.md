# Jannati AI Tutor 3.12.2 Release Notes

Status: stable
Tag: v3.12.2
Build date: 2026-09-08T11:00:17.611Z

## Release Readiness

### Parent PIN save and unlock

- Secure save now requires a verified storage readback; browser/crypto failures have precise safe Malay messages.
- Post-save cleanup does not invalidate a saved PIN. A failing unlock callback explicitly reports that the PIN was saved.
- Duplicate and stale submissions cannot open another account/child/auth context; context switches relock synchronously.
- PBKDF2-SHA-256 (120000 iterations), account scoping, reauthentication recovery, backup exclusion and the 10-minute inactivity lock remain intact.
- Validation: 153 unit tests, full validation with 0 errors/warnings, production build/assets/bundle gates, and 12 real-browser diagnostic checks passed locally.
- No Supabase migration or learner-data changes are required. The prior desktop/mobile learning-sync issue is outside this release.
- The original intermittent production-browser failure was not reproduced; controlled fault injection verifies the repaired paths. Live recovery and physical-device acceptance remain manual.
- Detailed evidence and manual protocol: `docs/PARENT_PIN_HOTFIX_REPORT.md`.

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
