# Changelog

## 3.5.1 - 2026-08-20

### Fixed

- Tutor AI tidak lagi menyapa profil anak bernama sebagai “Murid” apabila profil adaptif tidak membawa nama.
- Nama profil aktif kini diteruskan kepada enjin Tutor AI melalui salinan konteks tanpa mengubah data profil atau rekod pembelajaran.
- Kapitalisasi respons cadangan pembelajaran diperbetulkan untuk keadaan nama profil tidak tersedia.

### Tests

- Tambah regresi untuk sapaan nama profil aktif dan cadangan belajar bagi murid yang masih mempunyai rekod pembelajaran terhad.

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
