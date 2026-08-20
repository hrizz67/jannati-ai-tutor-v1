# Jannati AI Tutor 3.5.1 Release Notes

Status: stable
Tag: v3.5.1
Build date: 2026-08-20T18:07:29.603Z

## Highlights

- Tutor AI kini mengutamakan nama profil anak yang sedang aktif apabila menyapa dan memberi cadangan pembelajaran.
- Statistik adaptif terus digunakan untuk bimbingan tanpa menggantikan identiti profil anak atau memutasi data pembelajaran.
- Ayat cadangan Tutor AI kekal menggunakan huruf besar yang betul apabila nama profil tidak tersedia.
- Regresi baharu melindungi pemetaan nama profil dan respons cadangan pembelajaran dengan rekod terhad.

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
