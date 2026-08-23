# Jannati AI Tutor 3.6.0 Release Notes

Status: stable
Tag: v3.6.0
Build date: 2026-08-23T09:44:11.779Z

## Sorotan Release

- Data pembelajaran kini disimpan dengan revision/CAS, operation ID idempoten dan backup sebelum tulis bagi menghalang kehilangan kemajuan atau overwrite antara desktop dan mobile.
- Data Free dan Premium diasingkan menggunakan ID akaun yang disahkan; pertukaran akaun tidak lagi membawa profil anak atau entitlement daripada akaun sebelumnya.
- Pemadaman profil anak dihadkan kepada profil sasaran dan tidak boleh mengosongkan data profil asal. Rekod penting diarkibkan dan snapshot pemulihan dikekalkan.
- Supabase Realtime menyampaikan perubahan merentas peranti, dengan polling, fokus aplikasi dan reconnect sebagai mekanisme pemulihan.
- Hanya satu status sync interaktif digunakan dalam UI bagi mengelakkan dua aliran sync yang bersaing.
- Migrasi integriti v3 dan hotfix RPC telah digunakan pada produksi; senarai migrasi local/remote sepadan dan remote schema lint tidak menemui ralat.

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
