# Jannati AI Tutor 3.5.3 Release Notes

Status: stable
Tag: v3.5.3
Build date: 2026-08-21T16:14:03.337Z

## Sorotan Release

- Tutor AI kini berfungsi sebagai satu perbualan berterusan untuk setiap profil anak, sama ada dibuka melalui menu Tutor AI atau Tanya Tutor AI.
- Janna memahami sapaan, pertanyaan identiti, keadaan seperti penat atau risau, serta pertanyaan umum tanpa bergantung pada soalan latihan yang sudah tidak aktif.
- Soalan pembelajaran umum boleh menggunakan nota kurikulum paling berkaitan daripada semua subjek Tahun 2 yang tersedia.
- Memadam profil anak baharu tidak lagi menandakan atau mengosongkan data pembelajaran profil asal; sync cloud mengekalkan rekod yang paling semasa.

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
