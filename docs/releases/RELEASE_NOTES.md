# Jannati AI Tutor 3.8.0 Release Notes

Status: stable
Tag: v3.8.0
Build date: 2026-08-25T00:15:47.043Z

## Sorotan Release

- Sebanyak 122 soalan kini mempunyai interaksi yang ditulis dan disemak guru, meningkat daripada 11 dalam v3.7.0.
- Sebanyak 978 soalan objektif selamat menerima kad pilihan automatik; jumlah interaksi runtime kini 1,100 daripada 4,530 soalan.
- Dua puluh aktiviti kaya baharu merangkumi susun ayat, susun nombor dan operasi, masa, wang, ukuran, bentuk serta pilihan berbilang.
- Liputan semakan merangkumi kesemua lapan subjek Tahun 2, dengan petunjuk pedagogi dan metadata kemahiran yang kekal serasi dengan pembelajaran adaptif.
- Jawapan interaktif serta maklum balas semakan kini kekal selepas keluar dan sambung latihan, manakala kawalan penghantaran semula menghalang XP berganda.
- Jawapan rasmi, accepted answers, jumlah soalan dan formula mastery asal tidak diubah.

## Release Readiness

- Package, lockfile, release tag, and generated metadata are version-aligned.
- Question-bank regression and release-pipeline audits run before the main validator suite.
- Interactive-engine, suitability, resume-isolation and account-scoped learning-sync regressions pass.
- Desktop and mobile browser acceptance confirms rich-question priority, restored answer state and no horizontal overflow.
- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.
- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.

## Content Quality

- All eight Year 2 subjects are included in the release validation scope.
- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.
- Teacher-authored interaction count: 122; safe derived interaction count: 978; runtime total: 1100.
- Automatic conversion is restricted to objective questions with complete, unambiguous options.

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

- Questions requiring a judgment-based renderer remain standard until a teacher review is completed.
- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
