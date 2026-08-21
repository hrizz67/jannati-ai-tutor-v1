# Changelog

## 3.5.3 - 2026-08-21

### Tutor AI

- Tutor AI dan pintasan Tanya Tutor AI kini berkongsi perbualan yang sama mengikut profil anak.
- Pertanyaan umum, sapaan, identiti tutor, dan keadaan emosi murid dijawab secara lebih semula jadi tanpa dipaksa kembali kepada soalan latihan lama.
- Konteks soalan hanya digunakan ketika kuiz aktif, manakala pertanyaan pembelajaran umum boleh mencari nota kurikulum berkaitan merentas subjek Tahun 2.

### Profil anak dan data pembelajaran

- Pemadaman profil anak kini hanya menandakan profil sasaran sebagai berubah dan tidak lagi menimpa data pembelajaran profil asal yang lebih baharu di cloud.
- Pemulihan profil aktif menggunakan snapshot gabungan yang betul selepas sync atau pemadaman profil.
- Regresi baharu melindungi kesinambungan perbualan Tutor AI, pengasingan profil, dan pemadaman anak tanpa kehilangan kemajuan.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
