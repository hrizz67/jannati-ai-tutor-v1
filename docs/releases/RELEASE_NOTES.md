# Jannati AI Tutor 3.13.26 Release Notes

Status: stable
Tag: v3.13.26
Build date: 2026-10-14T11:18:09.375Z

## First-Six Rich Interactive Pilot

- `MATH-BENTUK-PILOT-024` now uses the existing `imageChoice` shape visual for a repeating 2D shape pattern.
- `ENG-COLOURS-011` now uses `imageChoice` with labelled colour swatches for ripe banana / yellow.
- `BM-KATA_SENDI-003` now uses `fillBlank` for `di` / `ke` / `dari`; the canonical answer remains `dari`.
- `ARAB-WARNA_ARAB-002` now uses `imageChoice` with labelled colour swatches for `أَزْرَقُ` → `biru`.
- `SAINS-TEKNOLOGI-001` now uses `fillBlank` for `gunting` → `memotong`.
- `MATH-NOMBOR-PILOT-007` now uses `visualMath` with the existing place-value visual for `900 + 40 + 2` → `942`.

## Preserved Learning Evidence

- Underlying question IDs and wording are unchanged.
- Canonical and accepted answers are unchanged.
- The question bank remains at 4,530 questions.
- The existing interaction engine and renderers are reused.
- No new dependency or external image asset was added.

## Scope Boundaries

- No Supabase, database, schema, RPC, or migration changes.
- No reward, XP, coin, or P1.13 sync changes.
- No authentication, Premium, payment, STT, or voice changes.
- No Admin or Parent business-logic changes.
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
