# Jannati AI Tutor 3.6.1 Release Notes

Status: stable
Tag: v3.6.1
Build date: 2026-08-23T13:31:55.258Z

## Sorotan Release

- Dashboard kini memaparkan satu sahaja kad `Sambung Latihan`; tindakan sambung membuka semula sesi dan soalan aktif tanpa menerima objek klik sebagai data resume.
- Halaman Nota dan Buku Teks mempunyai tindakan jelas untuk kembali ke Papan Utama atau menyambung latihan aktif, termasuk pada paparan mudah alih.
- Kandungan Nota, Buku Teks dan rekod pembelajaran tidak diubah oleh pembaikan navigasi ini.
- Status cloud memaparkan revision server terkini supaya perubahan desktop dan mobile boleh dibandingkan menggunakan sumber kebenaran yang sama.
- Ujian regresi melindungi pengasingan akaun/profil, kesinambungan resume dan pengendalian ralat sync tanpa salah melabelkannya sebagai isu migrasi.

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
- Authenticated Free and Premium accounts still require a real desktop-to-mobile Supabase acceptance run after production deployment.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
