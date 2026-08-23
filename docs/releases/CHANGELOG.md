# Changelog

## 3.6.4 - 2026-08-23

### Cloud projection repair write

- Cloud yang mempunyai projection akaun XP 140 tetapi snapshot anak aktif XP 40 kini dikenal pasti sebagai belum sepadan walaupun bacaan tempatan sudah dinormalisasi.
- Desktop yang memegang pembelajaran kaya akan menjadualkan satu revisioned repair write supaya snapshot anak canonical turut menyimpan XP 140.
- Selepas kedua-dua salinan cloud sepadan, pengesan berhenti dan tidak menghasilkan revision loop.

### Perlindungan data

- Repair write masih melalui optimistic revision/CAS dan pengasingan profil anak sedia ada.
- Regresi meliputi state sebenar v3.6.3: desktop XP 140, cloud r80 dan mobile XP 40.
- Tiada migrasi Supabase, perubahan kandungan pembelajaran atau pemadaman profil diperlukan.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Confirm desktop advances cloud beyond r80, then verify mobile converges to XP 140 on the same or newer revision.
- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
