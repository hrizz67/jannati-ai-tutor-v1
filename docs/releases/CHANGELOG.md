# Changelog

## 3.6.2 - 2026-08-23

### Sync XP desktop dan mobile

- Peranti yang telah membaca revision server yang betul tetapi masih memaparkan state tempatan lama kini menghidrat snapshot gabungan selepas cloud read atau save berjaya.
- Pending marker yatim tanpa child-level outbox dibersihkan apabila cloud mempunyai bukti pembelajaran yang lebih kaya.
- Outbox tempatan yang masih mempunyai XP, sejarah atau kemajuan bermakna dipulihkan dan digabung dengan operasi revision/CAS sedia ada.
- Hanya profil dengan mutasi lebih baharu dikekalkan secara tempatan semasa save sedang berjalan; profil lain menerima snapshot server yang telah diakui.

### Perlindungan data

- Regresi khusus melindungi kes desktop XP 140 dan mobile XP 0 pada revision cloud yang sama.
- Pemulihan outbox yang menggunakan ID profil berbeza akan menjalankan reconciliation nama/tahun dan tidak mencipta profil anak pendua.
- Tiada migrasi pangkalan data, pemadaman profil atau penulisan semula kandungan pembelajaran dilakukan.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Confirm the previously affected physical mobile device converges after loading v3.6.2.
- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
