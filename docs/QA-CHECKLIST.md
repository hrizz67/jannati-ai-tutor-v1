# Jannati AI Tutor v2.0 Beta — QA Checklist

> Status audit: 2026-08-10. `LULUS` = ada bukti ujian, `BLOCKED` = tidak boleh diuji dalam akaun/sesi semasa, `BELUM DISAHKAN` = belum ada bukti yang mencukupi.
> URL browser: `https://hrizz67.github.io/jannati-ai-tutor-v1/`. Sesi live menggunakan akaun Free; item Premium tidak ditanda lulus secara andaian.

## Scope

- Production hardening
- Lazy loading
- Error boundary
- Accessibility checks
- Asset review

## Test Checklist

- [x] Home dashboard loads correctly — **LULUS**; dashboard, navigasi subjek, statistik dan kad tindakan dipaparkan.
- [x] Quiz screen loads correctly — **LULUS**; `Sambung Belajar` membuka kuiz Bahasa Melayu Tahun 2.
- [ ] Finish screen loads correctly — **BELUM DISAHKAN**; keadaan keputusan jawapan lulus, tetapi skrin tamat penuh belum dicapai dalam sesi Free.
- [ ] Parent dashboard opens correctly — **BLOCKED**; akaun Free menerima gate Premium.
- [ ] Revision dashboard opens correctly — **BELUM DISAHKAN**; perlu laluan ujian khusus dan bukti skrin penuh.
- [x] AI explain modal opens correctly — **LULUS**; modal `Terangkan` memaparkan fokus, penerangan, jawapan betul dan langkah.
- [ ] AI teacher modal opens correctly — **BLOCKED**; `Tanya Guru AI` menerima gate Premium dalam akaun Free.
- [ ] Voice button hides on unsupported browsers — **BELUM DISAHKAN**; ujian memerlukan browser yang diketahui tidak menyokong Speech API.
- [x] Error boundary shows friendly Malay fallback — **LULUS (kod)**; fallback Malay wujud untuk dashboard, kuiz, keputusan dan Parent Dashboard.
- [ ] Keyboard navigation works for buttons and inputs — **BELUM DISAHKAN**; fokus tidak berpindah dengan bukti yang cukup dalam browser automasi.
- [ ] Focus ring remains visible — **BELUM DISAHKAN**; perlu ujian visual fokus pada keyboard sebenar.
- [x] No broken image paths — **LULUS (live)**; aset logo, maskot dan badge yang dipaparkan berjaya dimuatkan.
- [x] Build passes — **LULUS**; `npm.cmd run build` berjaya.

## Known Limitations

- Some bundled chunks may still be large on first load.
- Browser voice support depends on the user agent.

## Deployment Checklist

- [x] Run production build — **LULUS**; Vite build berjaya.
- [ ] Verify critical screens in browser — **SEBAHAGIAN**; dashboard, kuiz dan modal penerangan lulus, Parent/Tutor AI disekat gate Premium.
- [x] Verify error boundary fallback copy — **LULUS (kod)**; fallback tidak mendedahkan stack trace dan menggunakan Bahasa Melayu.
- [ ] Verify accessibility labels — **SEBAHAGIAN**; nama boleh dicapai untuk kawalan utama dilihat, tetapi audit penuh belum selesai.
- [x] Verify optimized mascot asset loads — **LULUS (live)**; aset maskot dan badge dipaparkan.

## Release Gate

- **BLOCKED:** working tree masih tercemar, termasuk `package-lock.json`, `dist/` dan banyak fail subjek/validator/dashboard.
- **BLOCKED:** audit regresi akhir mengesan perubahan lockfile runtime; baseline bersih perlu diasingkan atau di-commit sebelum keputusan deploy boleh dipercayai.
- **PASS:** `runtimeSafetyAudit.mjs`, `v31Stage5PlanningLabelsAudit.mjs`, `git diff --check` dan production build.
- **PASS (kod sahaja):** format label baharu `Keyakinan AI Rendah/Sederhana/Tinggi` telah digunakan dalam source. Live site belum memaparkan perubahan ini kerana belum dideploy.
