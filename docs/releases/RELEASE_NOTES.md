# Jannati AI Tutor 3.6.3 Release Notes

Status: stable
Tag: v3.6.3
Build date: 2026-08-23T14:48:48.038Z

## Sorotan Release

- XP dan kemajuan kini digabung secara monotonic; peranti dengan snapshot lebih rendah tidak boleh mengurangkan rekod pelajar yang lebih kaya.
- Desktop yang masih menyimpan XP 140 boleh mengesan cloud XP 40 semasa login atau polling dan menghantar pembaikan melalui sync revision/CAS.
- Snapshot akaun dan profil anak aktif dinormalisasi sebelum dipulihkan supaya kedua-dua desktop dan mobile membaca sumber pembelajaran yang sama.
- Pemeriksaan identiti profil menghalang data akar milik anak lain daripada masuk ke snapshot pelajar aktif.
- Ujian regresi khusus meliputi XP 140 lawan XP 40, pengasingan anak, resume, konflik serentak dan pemulihan outbox.

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

- Complete the controlled XP 140 desktop-first recovery check on the previously affected Premium account after deployment.
- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
