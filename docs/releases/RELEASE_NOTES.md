# Jannati AI Tutor 3.7.0 Release Notes

Status: stable
Tag: v3.7.0
Build date: 2026-08-24T12:11:07.640Z

## Sorotan Release

- Enjin soalan interaktif reusable kini menyokong 11 jenis aktiviti: image choice, drag and drop, matching, ordering, visual math, fill blank, multi-select, hotspot, clock, money dan measurement.
- Sebelas soalan Tahun 2 yang telah disemak secara pedagogi digunakan dalam Bahasa Melayu, Matematik dan Sains tanpa menambah atau membuang soalan daripada bank asal.
- Aliran Quiz dan Pentaksiran menggunakan renderer interaktif yang sama, manakala semua soalan lama terus menggunakan input teks sedia ada sebagai fallback.
- Interaksi menyokong sentuhan, tetikus dan papan kekunci, bersama sasaran sentuh minimum, status pembaca skrin dan susun atur mudah alih.
- Metadata Fasa 3 menghubungkan jenis soalan dan kemahiran kepada sejarah pembelajaran adaptif, serta menyediakan petunjuk berperingkat dan analitik interaksi.
- Variasi soalan AI tidak dijana secara automatik; jawapan, accepted answers dan konfigurasi interaksi kekal dikunci sehingga semakan penggubal diluluskan.

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

- Jalankan penerimaan peranti fizikal terkawal untuk kesemua 11 jenis interaksi sebelum memperluasnya kepada lebih banyak soalan.
- Aktifkan variasi soalan AI hanya selepas proses semakan penggubal, invariant jawapan dan regresi kandungan diluluskan.
- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
