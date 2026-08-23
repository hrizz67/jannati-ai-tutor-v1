# Changelog

## 3.6.1 - 2026-08-23

### Resume dan navigasi pembelajaran

- Dashboard kini menggunakan satu kad resume sahaja dan tindakan `Sambung` menerima state resume yang betul, bukan objek klik React.
- Nota dan Buku Teks menyediakan tindakan `Papan Utama` dan `Sambung Latihan` yang kekal mudah dicapai pada desktop serta mudah alih.
- Kandungan Nota, Buku Teks dan data pembelajaran tidak dimigrasi atau ditulis semula oleh perubahan UI ini.

### Kebolehlihatan sync

- Status cloud kini memaparkan revision server dan masa kemas kini server untuk membantu membandingkan state antara desktop dengan mobile.
- Regresi sync memastikan ralat RPC/rangkaian tidak dilaporkan sebagai migrasi lama dan perlindungan CAS, idempoten serta pengasingan akaun kekal aktif.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Complete an authenticated Free and Premium desktop-to-mobile acceptance run after deployment and confirm both devices converge on the same server revision.
- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
