# Jannati AI Tutor 3.13.24 Release Notes

Status: stable
Tag: v3.13.24
Build date: 2026-10-12T11:37:08.538Z

## Mobile UX

- Plain-text mobile answer choices now use the full available text width without reserving the old 86px visual lane.
- Long learner-status values use compact, text-safe typography with natural wrapping.
- Numeric KPIs remain visually distinct and centered.

## Analytics Consistency

- Subject performance now comes from canonical progress evidence.
- Real recorded learning time flows into subject and global analytics without fabricating time.
- Duplicate question events do not increase recorded learning time twice.
- Cross-subject AI recommendations are explicitly labelled so they are not confused with the selected analytics subject.

## Safety and Unchanged Behavior

- Question wording, answers, IDs, and the 4,530-question bank remain unchanged.
- No P1.13 sync, reward, XP, coin, Supabase, database, schema, RPC, migration, auth, Premium, payment, STT, voice, Admin, or Parent business-logic behavior changed.
- No dependency was added.

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
- Production physical acceptance has not yet been claimed for this release.
