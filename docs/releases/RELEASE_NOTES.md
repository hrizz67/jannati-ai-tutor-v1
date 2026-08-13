# Jannati AI Tutor 3.3.2 Release Notes

Status: stable
Tag: v3.3.2
Build date: 2026-08-13T18:13:32.262Z

## Release Highlights

- Resume latihan, latihan AI, Pentaksiran Sumatif dan empat modul komunikasi kini disimpan dalam slot berasingan supaya sesi tidak bercampur.
- Butang Sambung memulihkan nombor, susunan dan identiti soalan yang sama selepas murid kembali ke Papan Utama.
- Soalan berbilang ayat dipaparkan mengikut sempadan makna yang sesuai tanpa memecahkan masa seperti 3:30.
- Ayat Kata Nama Am yang kabur diperjelas dan pembaikan ayat automatik tidak lagi menukar frasa biasa menjadi nama orang.

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
