# Changelog

## 3.8.0 - 2026-08-25

### Liputan pembelajaran interaktif

- Memperluas soalan interaktif semakan guru daripada 11 kepada 122 tanpa menambah, membuang atau mengubah jawapan asal dalam bank 4,530 soalan.
- Menukar 978 soalan objektif yang memenuhi syarat keselamatan kepada kad pilihan boleh sentuh, menjadikan 1,100 soalan interaktif tersedia semasa runtime.
- Menambah liputan Bahasa Melayu, Matematik, Sains, Bahasa Inggeris, Bahasa Arab, Pendidikan Islam, Pendidikan Jasmani dan Pendidikan Kesihatan.
- Menambah 20 aktiviti kaya yang disemak untuk susunan ayat, susunan nombor, operasi, masa, ukuran, bentuk dan pilihan berbilang.
- Mengutamakan aktiviti kaya yang disemak supaya murid akaun Free turut menemuinya sebelum had latihan harian.

### Kesinambungan latihan

- Draf jawapan interaktif kini disimpan apabila murid menyusun atau memilih jawapan.
- Soalan, jawapan dan maklum balas yang telah disemak dipulihkan apabila murid kembali melalui fungsi sambung latihan.
- Butang semakan dikunci bagi jawapan yang telah direkodkan untuk mengelakkan penghantaran dan pemberian XP berganda selepas resume.
- Retry membersihkan jawapan tersimpan bagi soalan semasa tanpa menjejaskan sesi atau profil lain.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Interactive suitability audit confirms 122 reviewed interactions, 978 safe automatic choices, and no original-answer changes.
- Resume isolation and account-scoped learning-sync regressions pass.
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Continue teacher review for questions classified as requiring manual interactive conversion.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
