# Jannati AI Tutor 3.5.2 Release Notes

Status: stable
Tag: v3.5.2
Build date: 2026-08-21T15:18:03.208Z

## Highlights

- Profil Free pada peranti kini diasingkan sepenuhnya daripada profil dan data pembelajaran akaun Premium.
- Login akaun menunggu proses pemuatan profil dan data cloud selesai sebelum memaparkan Papan Utama, sekali gus menghalang penciptaan profil Free secara tidak sengaja.
- Resume pembelajaran mengutamakan snapshot semasa yang bermakna, manakala backup lama hanya digunakan apabila data semasa kosong atau rosak teruk.
- Snapshot tempatan kosong tidak lagi boleh menimpa data pembelajaran cloud yang masih mempunyai bukti kemajuan.
- Profil Free boleh disambung semula selepas browser ditutup dan mempunyai tindakan `Keluar Free` yang jelas.
- Pemadaman profil pendua membuat backup pemulihan dan mencetuskan penyatuan identiti tanpa mengosongkan profil Premium yang sah.

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
- Akaun yang kehilangan data sebelum v3.5.2 masih bergantung pada snapshot pemulihan yang kekal pada peranti atau cloud.
