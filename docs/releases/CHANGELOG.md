# Changelog

## 3.9.0 - 2026-08-25

### Nota dan Buku Teks

- Menambah penanda kemajuan berasingan untuk `Nota dibaca` dan `Buku disemak` bagi setiap topik.
- Menyimpan kemajuan bahan dalam profil anak aktif supaya akaun dan profil lain tidak berkongsi status bacaan.
- Memasukkan kemajuan bahan sebagai bukti pembelajaran dalam proses pemilihan, pemulihan dan penggabungan snapshot cloud.
- Mengekalkan kandungan Nota, Buku Teks, bank soalan, jawapan rasmi, XP dan formula mastery tanpa perubahan.

### Navigasi dan Tutor AI

- Menambah ringkasan kemajuan Nota dan Buku Teks bagi subjek yang sedang dipilih.
- Membetulkan `Buka Nota` daripada Ulang Kaji supaya tab kawalan induk turut berubah dan murid tidak tersangkut pada paparan lama.
- Menghantar konteks subjek dan topik semasa kepada Janna apabila murid memilih `Tanya Janna` dari bahan pembelajaran.

### Integriti data

- Menggunakan satu pengiraan bukti pembelajaran bersama untuk UI, backup tempatan dan enjin cloud sync.
- Menambah regresi bagi pengasingan profil anak, penggabungan kemajuan serentak antara peranti, pengasingan Nota/Buku Teks dan keselamatan resume.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Learning-material, account-scoped sync and resume-isolation regressions pass.
- Production entry bundle is 349.81 kB against a 350 kB budget.
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Verify cross-device material progress using a real premium Supabase account after deployment.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
