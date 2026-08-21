# Changelog

## 3.5.2 - 2026-08-21

### Fixed

- Mengasingkan storan profil Free daripada snapshot milik akaun Premium semasa pertukaran sesi.
- Menghentikan aliran login akaun daripada mencipta profil Free sebelum profil dan data cloud selesai dimuatkan.
- Mengutamakan snapshot semasa yang lebih baharu untuk resume tanpa membenarkan backup lama ber-XP tinggi menggantikan kedudukan pembelajaran terkini.
- Melindungi data cloud yang bermakna daripada snapshot tempatan kosong selepas pemadaman atau pertukaran profil.
- Menyimpan senarai profil anak yang benar-benar berubah bagi setiap akaun supaya status sync tertangguh tidak menandakan profil lama sebagai data semasa.
- Menambah resume profil Free dan tindakan keluar yang menyimpan kemajuan pada peranti.
- Membuat backup tersembunyi sebelum pemadaman serta menyatukan profil pendua yang mempunyai nama dan tahun sama.

### Tests

- Tambah regresi untuk pengasingan Free–Premium, pemilihan snapshot semasa, perlindungan data cloud selepas delete, dirty child IDs dan tindakan `Keluar Free`.
- Learning sync, resume isolation, access control, 4530 soalan, build produksi dan bundle budget semuanya lulus.

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
