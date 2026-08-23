# Jannati AI Tutor 3.6.2 Release Notes

Status: stable
Tag: v3.6.2
Build date: 2026-08-23T14:12:44.966Z

## Sorotan Release

- Mobile yang sudah membaca revision cloud terkini tetapi masih memaparkan XP 0 kini menghidrat semula snapshot pembelajaran gabungan daripada server.
- Penanda sync pending lama tanpa senarai profil berubah tidak lagi boleh menyekat cloud pull selama-lamanya.
- Jika data pembelajaran tempatan masih bermakna, outbox yang terputus dipulihkan dan digabung secara konservatif tanpa mengosongkan XP atau sejarah server.
- Snapshot yang telah diakui server dimuat semula pada peranti, kecuali terdapat perubahan tempatan lebih baharu yang masih belum dihantar.
- Pengasingan akaun dan profil anak kekal aktif; pembaikan tidak memerlukan migrasi Supabase atau perubahan kandungan pembelajaran.

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
- Confirm post-deployment convergence on the previously affected physical mobile device after it loads v3.6.2.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
