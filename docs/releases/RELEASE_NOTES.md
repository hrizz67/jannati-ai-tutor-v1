# Jannati AI Tutor 3.9.0 Release Notes

Status: stable
Tag: v3.9.0
Build date: 2026-08-25T06:11:00.011Z

## Sorotan Release

- Nota dan Buku Teks kini mempunyai status kemajuan berasingan bagi setiap topik.
- Status bahan disimpan di dalam profil anak aktif dan disertakan dalam snapshot cloud, bukannya storan global yang boleh bercampur antara profil.
- Penggabungan serentak mengekalkan tanda Nota daripada satu peranti dan tanda Buku Teks daripada peranti lain untuk anak yang sama.
- Ringkasan `Nota dibaca` dan `Buku disemak` dipaparkan bagi subjek semasa tanpa memberikan XP hanya kerana bahan ditanda.
- `Buka Nota` dari Ulang Kaji kini menukar tab sebenar, sementara `Tanya Janna` menerima subjek dan topik bahan yang sedang dilihat.
- Kandungan pembelajaran, jawapan rasmi, jumlah soalan, XP dan formula mastery tidak diubah.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Profile-scoped learning-material, concurrent-sync and resume-isolation regressions pass.
- Production bundle budget passes at 349.81 kB of the 350 kB entry limit.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.
- Nota and textbook completion are treated as learning continuity evidence, not assessment mastery or XP.

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
- Cross-device material progress should be confirmed with a real premium Supabase account after deployment.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
