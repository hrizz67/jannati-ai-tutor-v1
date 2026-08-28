# Jannati AI Tutor 3.9.7 Release Notes

Status: stable
Tag: v3.9.7
Build date: 2026-08-28T16:01:22.939Z

## Highlights

- Batch Q1 removes 128 high-confidence semantic ambiguities from English, Science, and Arabic questions.
- Batch Q2 repairs 246 distractors, aligns difficulty and cognitive demand, and removes answer-position bias across all eight subjects.
- Option ordering is deterministic, so answer placement does not change randomly when a question renders.
- Two new automated audits protect semantic uniqueness and distractor/difficulty quality in every validation run.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.
- The 4530 existing question IDs and canonical answers are preserved.
- Scoring, adaptive/mastery behaviour, and learner progress data are unchanged.

## Validation Summary

- Status: pass
- Info: 14814
- Warnings: 0
- Errors: 0

## Curriculum Coverage

- Subjects: 8
- Topics: 84
- Questions: 4530
- Unique SK/SP pairs: 453
- Curriculum coverage: 100%
- Difficulty balance: mudah 2090, sederhana 1749, sukar 691

## Known Follow-ups

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
