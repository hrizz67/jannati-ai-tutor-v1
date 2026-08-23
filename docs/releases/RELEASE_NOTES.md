# Jannati AI Tutor 3.6.4 Release Notes

Status: stable
Tag: v3.6.4
Build date: 2026-08-23T15:04:25.984Z

## Sorotan Release

- Keadaan cloud dalaman `root XP 140 + snapshot anak XP 40` kini mencetuskan satu repair write yang selamat.
- Desktop tidak sekadar memaparkan XP 140 selepas normalisasi; ia juga menyimpan nilai itu ke snapshot anak canonical untuk mobile.
- Revision server dijangka meningkat daripada r80 selepas desktop memuatkan v3.6.4.
- Pengesan berhenti selepas convergence supaya tiada sync atau revision loop.
- Pengasingan akaun/profil, resume dan optimistic concurrency kekal dilindungi oleh regresi automatik.

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

- Complete the controlled desktop-first r80 recovery check before refreshing the affected mobile device.
- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
