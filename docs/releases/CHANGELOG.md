# Changelog

## 3.6.0 - 2026-08-23

### Integriti data pembelajaran

- Cloud sync kini menggunakan revision/CAS dan operation ID idempoten supaya dua peranti tidak boleh menimpa kemajuan satu sama lain secara senyap.
- Semua snapshot, operasi sync, backup, profil pelajar dan event pembelajaran diasingkan mengikut ID akaun yang disahkan.
- Logout, pertukaran akaun dan pemadaman profil anak tidak lagi menggunakan state akaun lain atau mengosongkan profil asal.
- Snapshot sebelum migrasi dan sebelum setiap penulisan cloud disimpan untuk pemulihan terkawal.

### Sync desktop dan mobile

- Perubahan cloud diterima melalui Supabase Realtime dengan polling, fokus tetingkap dan sambungan semula sebagai fallback.
- Konflik revision mengambil data server terkini, menggabungkan perubahan profil anak yang sah dan mencuba semula tanpa blind overwrite.
- UI kini memaparkan satu status sync utama; permukaan latihan hanya menunjukkan status baca sahaja dan tidak memulakan aliran sync kedua.

### Supabase

- Skema v3 menambah jadual operasi sync, backup, profil pelajar, state pembelajaran dan event dengan RLS berasaskan akaun.
- RPC v3 menggunakan rujukan parameter yang tidak kabur dan named constraints; remote database lint selesai tanpa schema error.
- Migrasi local dan produksi disahkan sepadan hingga `20260823094500`.

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
