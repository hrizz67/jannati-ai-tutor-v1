# Jannati AI Tutor 3.3.7 Release Notes

Status: stable
Tag: v3.3.7
Build date: 2026-08-20T14:49:54.493Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Mobile Notes and Textbooks

- Learning cards use one readable column on phones, two columns on tablets, and three columns on wider desktop layouts.
- Text wrapping and minimum-width guards prevent long Malay, English, Arabic, and reference text from overflowing narrow cards.
- Responsive checks cover 390, 430, 600, 700, and 980 pixel viewports without changing any learning, note, or textbook data.

## Supabase Migration Baseline

- Added a version-controlled Supabase CLI configuration, declarative schema snapshot, and ordered production migrations.
- Documented the safe link, pull, history review, dry-run, and push workflow for future database changes.
- Database defaults, grants, RPC permissions, and profile isolation remain explicit and reproducible from source control.

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
