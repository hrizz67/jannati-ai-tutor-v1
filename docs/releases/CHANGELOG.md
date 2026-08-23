# Changelog

## 3.6.3 - 2026-08-23

### Pemulihan XP rentas peranti

- Projection pembelajaran peringkat akaun dan snapshot profil anak aktif kini dinormalisasi kepada kemajuan monotonic yang sama sebelum cloud merge atau hydration.
- XP dan bukti pembelajaran yang lebih tinggi pada desktop tidak lagi boleh diturunkan oleh snapshot mobile yang lebih baharu tetapi kurang lengkap.
- Semasa login atau polling, peranti yang masih mempunyai bukti pembelajaran lebih kaya akan memulihkan outbox profil yang tepat dan membaiki cloud melalui revision/CAS.

### Pengasingan profil

- Pemulihan hanya berlaku untuk ID profil anak yang sama atau padanan identiti nama/tahun yang unik.
- Projection akar yang dikenal pasti milik anak lain tidak akan digabungkan ke snapshot pelajar aktif.
- Tiada migrasi Supabase, pemadaman profil atau perubahan kandungan pembelajaran diperlukan.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Confirm the affected desktop XP 140 snapshot advances the cloud revision, then verify the physical mobile device converges to the same XP and revision.
- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
