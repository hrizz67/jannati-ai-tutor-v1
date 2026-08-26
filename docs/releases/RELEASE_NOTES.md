# Jannati AI Tutor 3.9.3 Release Notes

Status: stable
Tag: v3.9.3
Build date: 2026-08-26T12:51:01.262Z

## Highlights

- Sains animal-energy questions now ask clearly for the intended basic need, preventing reasonable examples such as animal feed from being unfairly marked against an ambiguous prompt.
- Reviewed interactive questions now expose one consistent stem to the quiz, Tutor AI, and saved-session data.
- New regression checks prevent the same ambiguity and question-text mismatch from returning.

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

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
