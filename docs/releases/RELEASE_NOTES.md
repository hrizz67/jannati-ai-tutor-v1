# Jannati AI Tutor 3.13.25 Release Notes

Status: stable
Tag: v3.13.25
Build date: 2026-10-13T10:57:05.386Z

## Mobile Subject Report & Learning Journey Layout

- Prestasi Subjek badges now use scoped mobile-safe sizing.
- Subject names, accuracy percentages, progress bars, and question counts no longer overlap.
- Long subject names wrap naturally.
- Laluan Belajar cards stack through normal phone widths up to 430px.
- Malay labels such as "Seterusnya" no longer split mid-word solely to preserve a three-column layout.

## Preserved P1.15D Behaviour

- Plain multiple-choice questions keep their full-width text lane.
- Status Semasa keeps its text-safe typography.
- Prestasi Subjek continues to use canonical data.
- Study-time analytics continue to use real recorded study time.
- Cross-subject recommendations retain their subject labels.

## Scope Boundaries

- No question wording, answer, or ID changes.
- No reward, sync, authentication, Premium, STT, or Supabase changes.
- No dependency was added.
- Physical production acceptance is not claimed by this release preparation.

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
