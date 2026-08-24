# Changelog

## 3.7.0 - 2026-08-24

### Enjin soalan interaktif

- Menambah renderer data-driven untuk 11 jenis interaksi merangkumi pemilihan visual, seret dan lepas, padanan, susunan, visual matematik, isi tempat kosong, pelbagai pilihan, hotspot, jam, wang dan ukuran.
- Mengintegrasikan 11 contoh soalan Tahun 2 yang disemak dalam Bahasa Melayu, Matematik dan Sains pada aliran Quiz serta Pentaksiran.
- Mengekalkan fallback input teks bagi semua soalan lama dan mengekalkan jumlah bank pada 4530 soalan.
- Menambah sokongan sentuhan, tetikus, papan kekunci, pembaca skrin, reduced motion dan susun atur mudah alih.

### Kesiapsiagaan Fasa 3

- Pemilih adaptif dan sejarah pembelajaran kini boleh merekod jenis soalan serta kemahiran khusus tanpa mengubah formula XP atau mastery.
- Analitik soalan melaporkan kepelbagaian jenis interaksi dan mod respons tanpa mengubah skor kepelbagaian sedia ada.
- Petunjuk pedagogi berperingkat dan polisi variasi reusable tersedia untuk peluasan terkawal.
- Penjanaan variasi AI kekal `review_required`; medan jawapan dan interaksi tidak boleh berubah sebelum semakan manusia.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Complete controlled real-device acceptance for all eleven interaction types.
- Approve question-variant policies only after content and answer-invariant review.
- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
