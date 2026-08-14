# Jannati AI Tutor 3.3.3 Release Notes

Status: stable
Tag: v3.3.3
Build date: 2026-08-14T10:59:33.578Z

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Infrastructure Quality

- CI and tagged deployment now validate and build on Node.js 24.
- GitHub Actions were upgraded to Node 24-compatible generations for checkout, dependency setup, QA artifact upload, and GitHub Pages publication.
- Source modules now have an explicit ESM boundary, while the Vite configuration uses the `.mjs` extension; Node and Vite validation logs are clean.
- Release-pipeline regression checks prevent the retired action and runtime versions from being restored accidentally.

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
