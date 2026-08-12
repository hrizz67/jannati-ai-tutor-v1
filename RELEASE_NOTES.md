# RELEASE NOTES - Jannati AI Tutor

## v3.2.20 - Ketepatan Audit Bank Soalan

Pelepasan pembaikan ini menghapuskan dapatan tahap tinggi yang tersilap pada soalan objektif Bahasa Melayu dan memperkemas beberapa arahan soalan.

Sorotan:

- Audit kini membezakan jawapan kanonik daripada variasi input sah dalam `accepted`.
- Jawapan atau indeks pilihan yang benar-benar tidak sepadan masih dikesan sebagai dapatan tahap tinggi.
- Empat soalan Bahasa Melayu diperjelas atau diseragamkan tanpa mengecilkan variasi jawapan murid.
- Simulasi kualiti Bahasa Melayu meliputi 930 soalan dan 5,000 sampel tanpa kegagalan.

Status pelepasan:

- Audit global: 4,530 soalan, 0 Critical dan 0 High.
- Gerbang BM: 930 rekod, 0 isu.
- Gerbang subjek: 3,600 rekod, 0 isu.
- Validasi penuh: 0 ralat, 0 amaran.
- Binaan produksi: lulus.

## v3.2.19 - Kualiti Kandungan Matematik

Pelepasan ini melengkapkan peningkatan semua 10 topik Matematik Tahun 2 berdasarkan tiga teras: pembelajaran, soalan dan nota.

Sorotan:

- 600 soalan Matematik yang disusun secara konsisten kepada 60 soalan bagi setiap topik.
- Liputan aras kognitif merangkumi mengingat, memahami, mengaplikasi, menganalisis, menilai dan mencipta.
- Nota diperkaya dengan objektif, hasil pembelajaran, contoh, kesalahan lazim, semakan kendiri dan aktiviti guru.
- Jawapan angka, unit, langkah kerja dan respons kreatif dinilai menggunakan bukti serta rubrik yang bersesuaian.
- Audit khusus ditambah untuk operasi nombor, wang, masa, ukuran, jisim, isi padu serta bentuk dan ruang.
- Ujian tekanan mengesahkan kepelbagaian soalan, jawapan dan penerangan merentas semua topik Matematik.

Status pelepasan:

- Validasi penuh: 0 ralat, 0 amaran.
- Gerbang subjek: 3,600 rekod, 0 isu.
- Audit Matematik: 0 dapatan.
- Ujian tekanan: 10,000 sesi dan 200,000 soalan tanpa ketidakpadanan.
- Binaan produksi: lulus.

## v3.2.18 - Kualiti Kandungan Bahasa Melayu

Pelepasan ini melengkapkan peningkatan semua 14 topik Bahasa Melayu Tahun 2 berdasarkan tiga teras: pembelajaran, soalan dan nota.

Sorotan:

- 930 soalan BM dengan objektif, hasil pembelajaran dan metadata pentaksiran yang seragam.
- 60 soalan Pentaksiran Sumatif dan KBAT menggantikan bank soalan lama yang berulang.
- Nota diperkaya dengan contoh, kesalahan lazim, semakan kendiri dan panduan ulang kaji.
- Jawapan terbuka menerima variasi yang munasabah tanpa melonggarkan tatabahasa dan konteks.
- Terminologi Tahun 2 diselaraskan kepada PBD/Pentaksiran Sumatif berdasarkan skop KPM.
- Validasi kandungan automatik ditambah untuk mengawal pengulangan, rubrik, aras kognitif dan pelabelan pentaksiran.

Status pelepasan:

- Validasi penuh: 0 ralat, 0 amaran.
- Gerbang BM: 930 rekod, 0 isu.
- Binaan produksi: lulus.

## Branding V2 - Final Brand Identity

Jannati AI Tutor now uses the official brand identity across the app shell, runtime UI, manifest icons and favicon.

V1.5.1 is a quality release for the V1.5 Stable app.

Highlights:

- Cleaner BM, Math, English and Sains question banks.
- Balanced difficulty distribution across all core subject banks.
- Safer localStorage migration from older app versions.
- V1.5.1 service worker cache to avoid stale HTML after deployment.
- Updated release labels and build metadata.

Remaining known risks:

- Arabic and Islamic Studies still have a small number of repeated stems from earlier content generation.
- Historical generated files in `dist` should be rebuilt before deployment.
