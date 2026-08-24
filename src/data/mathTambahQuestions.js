import { MATH_YEAR_TWO_FRAMEWORK } from './mathNomborQuestions.js';

const CONSTRUCT_ADDITION_RUBRIC = Object.freeze({
  totalMarks: 2,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua nombor atau syarat yang diberikan.', marks: 1 },
    { criterion: 'Membina ayat tambah dan jumlah yang tepat.', marks: 1 }
  ])
});

const CREATE_STORY_RUBRIC = Object.freeze({
  totalMarks: 3,
  criteria: Object.freeze([
    { criterion: 'Menggunakan kedua-dua kuantiti yang diberikan.', marks: 1 },
    { criterion: 'Membina situasi penambahan yang jelas dan munasabah.', marks: 1 },
    { criterion: 'Menyatakan jumlah yang tepat.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'tambah_tanpa_mengumpul_semula_sa', q: 'Hitung 23 + 14.', answer: '37', hint: 'Tambah sa, kemudian tambah puluh.', explanation: '3 + 4 = 7 dan 2 puluh + 1 puluh = 3 puluh. Jadi, 23 + 14 = 37.', operands: [23, 14] },
  { skill: 'tambah_tanpa_mengumpul_semula_puluh', q: 'Berapakah hasil tambah 41 + 26?', answer: '67', hint: 'Kedua-dua lajur tidak memerlukan pengumpulan semula.', explanation: '1 + 6 = 7 dan 4 puluh + 2 puluh = 6 puluh. Maka, 41 + 26 = 67.', operands: [41, 26] },
  { skill: 'tambah_gandaan_puluh', q: 'Cari jumlah 120 dan 30.', answer: '150', hint: 'Tambahkan 3 puluh kepada 12 puluh.', explanation: '120 + 30 = 150.', operands: [120, 30] },
  { skill: 'tambah_nombor_satu_digit', q: 'Selesaikan 204 + 5.', answer: '209', hint: 'Tambah pada tempat sa sahaja.', explanation: '4 sa + 5 sa = 9 sa, jadi 204 + 5 = 209.', operands: [204, 5] },
  { skill: 'tambah_ratus', q: 'Apakah jumlah 350 + 200?', answer: '550', hint: 'Tambah nilai ratus dan kekalkan nilai puluh.', explanation: '3 ratus + 2 ratus = 5 ratus. Oleh itu, 350 + 200 = 550.', operands: [350, 200] },
  { skill: 'fakta_asas_tambah', q: 'Lengkapkan fakta asas: 9 + 8 = ___.', answer: '17', hint: 'Jadikan 9 kepada 10 dahulu.', explanation: '9 memerlukan 1 untuk menjadi 10; baki 7 menjadikan 17. Jadi, 9 + 8 = 17.', operands: [9, 8], questionType: 'fill_blank' },
  { skill: 'identiti_sifar', q: 'Nyatakan jawapan bagi 25 + 0.', answer: '25', hint: 'Menambah sifar tidak mengubah nilai nombor.', explanation: 'Apabila 0 ditambah, bilangannya kekal. Maka, 25 + 0 = 25.', operands: [25, 0] },
  { skill: 'fakta_ganda', q: 'Apakah hasil bagi 44 + 44?', answer: '88', hint: 'Ini ialah fakta ganda: dua kumpulan yang sama banyak.', explanation: '4 puluh + 4 puluh = 8 puluh dan 4 + 4 = 8. Jadi, 44 + 44 = 88.', operands: [44, 44] },
  { skill: 'gabung_puluh_dan_sa', q: 'Gabungkan 60 dengan 7 menggunakan operasi tambah.', answer: '67', accepted: ['67', '60 + 7 = 67'], hint: '60 ialah 6 puluh dan 7 ialah 7 sa.', explanation: '60 + 7 = 67.', operands: [60, 7] },
  { skill: 'melengkapkan_seratus', q: 'Kira 99 + 1.', answer: '100', hint: 'Satu selepas 99 melengkapkan satu ratus.', explanation: '99 + 1 = 100.', operands: [99, 1] },

  { skill: 'memahami_maksud_jumlah', q: 'Perkataan “jumlah” menunjukkan operasi tambah. Gunakan maklumat itu untuk mencari jumlah 36 dan 22.', answer: '58', hint: 'Tulis 36 + 22 sebelum mengira.', explanation: 'Jumlah bermaksud kuantiti digabungkan. 36 + 22 = 58.', operands: [36, 22], questionType: 'structured' },
  { skill: 'sifat_kalis_tukar_tertib', q: 'Adakah 27 + 15 dan 15 + 27 memberikan jumlah yang sama? Nyatakan jumlahnya.', answer: 'Ya, kedua-duanya berjumlah 42.', accepted: ['Ya, kedua-duanya berjumlah 42.', 'ya, 42', '42'], hint: 'Menukar tertib dua nombor tidak mengubah jumlah.', explanation: '27 + 15 = 42 dan 15 + 27 = 42. Oleh itu, kedua-duanya mempunyai jumlah 42.', operands: [27, 15], calculations: [[27, 15], [15, 27]], questionType: 'structured', marks: 2 },
  { skill: 'tambah_bentuk_cerakinan', q: 'Gunakan bentuk cerakinan untuk menghitung 243 + 125.', answer: '368', accepted: ['368', '300 + 60 + 8 = 368'], hint: 'Tambah ratus, puluh dan sa secara berasingan.', explanation: '(200 + 100) + (40 + 20) + (3 + 5) = 300 + 60 + 8 = 368.', operands: [243, 125], questionType: 'structured', marks: 2 },
  { skill: 'memahami_pengumpulan_semula_sa', q: 'Dalam 48 + 27, mengapakah 8 + 7 perlu dikumpul semula? Nyatakan jumlah akhir.', answer: 'Kerana 8 + 7 = 15, iaitu 1 puluh 5 sa; jumlah akhir ialah 75.', accepted: ['Kerana 8 + 7 = 15, iaitu 1 puluh 5 sa; jumlah akhir ialah 75.', '1 puluh 5 sa, 75', '75'], hint: '15 sa boleh ditukar kepada 1 puluh dan 5 sa.', explanation: '8 + 7 = 15 sa. Kumpulkan 10 sa sebagai 1 puluh, kemudian 4 + 2 + 1 puluh = 7 puluh. Jumlahnya 75.', operands: [48, 27], questionType: 'structured', marks: 2 },
  { skill: 'memahami_pengumpulan_semula_dua_kali', q: 'Hitung 176 + 248 dan nyatakan bilangan pengumpulan semula yang berlaku.', answer: '424; pengumpulan semula berlaku dua kali.', accepted: ['424; pengumpulan semula berlaku dua kali.', '424, dua kali', '424'], hint: 'Semak lajur sa dahulu, kemudian lajur puluh.', explanation: '6 + 8 = 14 memerlukan pengumpulan semula, dan 7 + 4 + 1 = 12 juga memerlukannya. Jumlahnya ialah 424 dan pengumpulan semula berlaku dua kali.', operands: [176, 248], questionType: 'structured', marks: 2 },
  { skill: 'memilih_ayat_matematik', q: 'Terdapat 135 buku cerita dan 24 buku rujukan. Tulis ayat matematik yang mewakili jumlah semua buku.', answer: '135 + 24 = 159', accepted: ['135 + 24 = 159', '159'], hint: 'Dua kuantiti digabungkan, jadi gunakan tanda tambah.', explanation: 'Ayat matematik yang tepat ialah 135 + 24 = 159.', operands: [135, 24], questionType: 'structured', marks: 2 },
  { skill: 'strategi_melengkapkan_puluh', q: 'Gunakan strategi melengkapkan puluh untuk mencari 39 + 21.', answer: '60', accepted: ['60', '40 + 20 = 60'], hint: 'Pindahkan 1 daripada 21 kepada 39.', explanation: '39 + 21 boleh ditulis sebagai 40 + 20. Oleh itu, jumlahnya 60.', operands: [39, 21], questionType: 'structured', marks: 2 },
  { skill: 'hubungan_nombor_hampir', q: 'Terangkan cara cepat menghitung 300 + 199 dan nyatakan jawapannya.', answer: '499', accepted: ['499', '300 + 200 - 1 = 499'], hint: 'Anggap 199 sebagai 200 - 1.', explanation: '300 + 200 = 500, kemudian tolak 1. Maka, 300 + 199 = 499.', operands: [300, 199], questionType: 'structured', marks: 2 },
  { skill: 'memahami_tambah_tiga_nombor', q: 'Gabungkan 120, 30 dan 5 sebagai satu ayat tambah serta nyatakan jumlahnya.', answer: '120 + 30 + 5 = 155', accepted: ['120 + 30 + 5 = 155', '155'], hint: 'Tambah ratus, puluh dan sa.', explanation: '120 + 30 = 150, kemudian 150 + 5 = 155.', operands: [120, 30, 5], questionType: 'structured', marks: 2 },
  { skill: 'hubungan_bahagian_keseluruhan', q: 'Jumlah dua nombor ialah 70. Jika satu nombor ialah 47, apakah nombor yang satu lagi?', answer: '23', hint: 'Cari nombor yang perlu ditambah kepada 47 untuk mendapat 70.', explanation: '47 + 23 = 70, maka nombor yang satu lagi ialah 23.', operands: [47, 23], numericAnswer: 23, questionType: 'structured', marks: 2 },

  { skill: 'algoritma_lazim_dua_digit', q: 'Kira 58 + 36 menggunakan bentuk lazim.', answer: '94', hint: '8 + 6 = 14; tulis 4 dan kumpul semula 1 puluh.', explanation: '8 + 6 = 14. Kemudian 5 + 3 + 1 = 9 puluh. Jadi, 58 + 36 = 94.', operands: [58, 36], questionType: 'structured' },
  { skill: 'algoritma_lazim_tiga_digit', q: 'Selesaikan 267 + 125.', answer: '392', hint: 'Tambah mengikut lajur dari sa ke ratus.', explanation: '7 + 5 = 12, 6 + 2 + 1 = 9, dan 2 + 1 = 3. Maka, 267 + 125 = 392.', operands: [267, 125] },
  { skill: 'tambah_dengan_sifar_puluh', q: 'Hitung 408 + 176.', answer: '584', hint: 'Sifar pada tempat puluh masih perlu ditulis dalam bentuk lazim.', explanation: '8 + 6 = 14, 0 + 7 + 1 = 8, dan 4 + 1 = 5. Jadi, 408 + 176 = 584.', operands: [408, 176] },
  { skill: 'tambah_pengumpulan_semula_dua_lajur', q: 'Cari hasil tambah 356 + 289.', answer: '645', hint: 'Kumpul semula apabila jumlah satu lajur mencapai 10 atau lebih.', explanation: '6 + 9 = 15, 5 + 8 + 1 = 14, dan 3 + 2 + 1 = 6. Jumlahnya 645.', operands: [356, 289] },
  { skill: 'tambah_melengkapkan_ratus', q: 'Lengkapkan pengiraan: 478 + 322 = ___.', answer: '800', hint: 'Perhatikan bahawa 78 + 22 melengkapkan 100.', explanation: '478 + 322 = 800.', operands: [478, 322], questionType: 'fill_blank' },
  { skill: 'tambah_tanpa_mengumpul_semula_tiga_digit', q: 'Berapakah 145 + 230?', answer: '375', hint: 'Tambah setiap nilai tempat secara berasingan.', explanation: '100 + 200 = 300, 40 + 30 = 70 dan 5 + 0 = 5. Jumlahnya 375.', operands: [145, 230] },
  { skill: 'masalah_buku', q: 'Perpustakaan kelas mempunyai 238 buku Bahasa Melayu dan 147 buku Matematik. Berapakah jumlah buku itu?', answer: '385 buku', accepted: ['385 buku', '385'], hint: 'Gabungkan kedua-dua bilangan buku.', explanation: '238 + 147 = 385. Jadi, terdapat 385 buku.', operands: [238, 147], questionType: 'structured', marks: 2 },
  { skill: 'masalah_manik', q: 'Aina menyusun 325 manik merah dan 208 manik biru. Hitung jumlah semua manik.', answer: '533 manik', accepted: ['533 manik', '533'], hint: 'Tambah bilangan manik merah dengan manik biru.', explanation: '325 + 208 = 533. Jumlah semua manik ialah 533.', operands: [325, 208], questionType: 'structured', marks: 2 },
  { skill: 'masalah_dua_hari', q: 'Program kitar semula mengumpulkan 186 botol pada hari Isnin dan 259 botol pada hari Selasa. Berapakah jumlah botol yang dikumpulkan?', answer: '445 botol', accepted: ['445 botol', '445'], hint: 'Tambah kutipan kedua-dua hari.', explanation: '186 + 259 = 445. Sebanyak 445 botol dikumpulkan.', operands: [186, 259], questionType: 'structured', marks: 2 },
  { skill: 'masalah_tiga_kumpulan', q: 'Tiga kumpulan mengumpulkan 125, 210 dan 64 pelekat. Cari jumlah pelekat ketiga-tiga kumpulan.', answer: '399 pelekat', accepted: ['399 pelekat', '399'], hint: 'Tambah dua bilangan dahulu, kemudian tambah bilangan ketiga.', explanation: '125 + 210 = 335 dan 335 + 64 = 399. Jumlahnya 399 pelekat.', operands: [125, 210, 64], questionType: 'structured', marks: 2 },
  { skill: 'algoritma_tiga_nombor', q: 'Selesaikan 78 + 96 + 125.', answer: '299', hint: 'Tambah pasangan yang mudah dahulu.', explanation: '78 + 96 = 174, kemudian 174 + 125 = 299.', operands: [78, 96, 125], questionType: 'structured', marks: 2 },
  { skill: 'nombor_hilang_ke_500', q: 'Isi nombor yang hilang: 346 + ___ = 500.', answer: '154', hint: 'Cari beza antara 500 dengan 346.', explanation: '346 + 154 = 500. Oleh itu, nombor yang hilang ialah 154.', operands: [346, 154], numericAnswer: 154, questionType: 'fill_blank', marks: 2 },
  { skill: 'nombor_pertama_hilang', q: 'Lengkapkan ___ + 275 = 620.', answer: '345', hint: 'Gunakan hubungan songsang: 620 - 275.', explanation: '345 + 275 = 620, jadi nombor pertama yang hilang ialah 345.', operands: [345, 275], numericAnswer: 345, questionType: 'fill_blank', marks: 2 },
  { skill: 'jadual_nilai_tempat', q: 'Tambah 234 dan 152 dengan menggabungkan nilai ratus, puluh dan sa.', answer: '386', accepted: ['386', '300 + 80 + 6 = 386'], hint: 'Gabungkan 2 ratus dengan 1 ratus, 3 puluh dengan 5 puluh, dan 4 sa dengan 2 sa.', explanation: '3 ratus + 8 puluh + 6 sa = 386. Maka, 234 + 152 = 386.', operands: [234, 152], questionType: 'structured', marks: 2 },
  { skill: 'strategi_nombor_serasi', q: 'Gunakan nombor serasi untuk menghitung 499 + 201.', answer: '700', accepted: ['700', '500 + 200 = 700'], hint: 'Pindahkan 1 daripada 201 kepada 499.', explanation: '499 + 201 bersamaan dengan 500 + 200, iaitu 700.', operands: [499, 201], questionType: 'structured', marks: 2 },

  { skill: 'analisis_kesilapan_sa', q: 'Hana menulis 47 + 38 = 715 kerana mencantumkan 7 + 8 dengan 4 + 3. Kenal pasti kesilapan dan berikan jawapan yang betul.', answer: 'Jawapan yang betul ialah 85.', accepted: ['Jawapan yang betul ialah 85.', '85'], hint: '15 sa perlu dikumpul semula sebagai 1 puluh 5 sa.', explanation: '7 + 8 = 15, bukan digit “15” yang boleh terus dicantumkan. Selepas pengumpulan semula, 47 + 38 = 85.', operands: [47, 38], questionType: 'structured', marks: 2 },
  { skill: 'analisis_kesilapan_puluh', q: 'Amir memperoleh 312 bagi 268 + 154. Semak pengiraannya dan nyatakan hasil yang tepat.', answer: 'Hasil yang tepat ialah 422.', accepted: ['Hasil yang tepat ialah 422.', '422'], hint: 'Semak pengumpulan semula pada lajur sa dan puluh.', explanation: '8 + 4 = 12, 6 + 5 + 1 = 12 dan 2 + 1 + 1 = 4. Oleh itu, 268 + 154 = 422.', operands: [268, 154], questionType: 'structured', marks: 2 },
  { skill: 'analisis_bentuk_lazim', q: 'Dalam bentuk lazim, digit sa bagi 286 + 217 telah dijumlahkan sebagai 6 + 7. Teruskan pengiraan hingga mendapat jumlah akhir.', answer: '503', hint: 'Selepas 6 + 7 = 13, kumpul semula 1 puluh.', explanation: '6 + 7 = 13, 8 + 1 + 1 = 10 dan 2 + 2 + 1 = 5. Jumlah akhirnya ialah 503.', operands: [286, 217], questionType: 'structured', marks: 2 },
  { skill: 'analisis_digit_hilang_puluh', q: 'Tentukan digit yang hilang dalam 2_7 + 145 = 392.', answer: '4', hint: 'Nombor pertama ialah 392 - 145.', explanation: '392 - 145 = 247. Oleh itu, 247 + 145 = 392 dan digit yang hilang ialah 4.', operands: [247, 145], numericAnswer: 4, questionType: 'fill_blank', marks: 2 },
  { skill: 'analisis_digit_hilang_ratus', q: 'Cari digit yang hilang dalam 368 + _24 = 592.', answer: '2', hint: 'Cari nombor kedua menggunakan 592 - 368.', explanation: '592 - 368 = 224. Maka, 368 + 224 = 592 dan digit yang hilang ialah 2.', operands: [368, 224], numericAnswer: 2, questionType: 'fill_blank', marks: 2 },
  { skill: 'analisis_pernyataan_benar', q: 'Pilih pengiraan yang betul: A. 235 + 146 = 381 atau B. 235 + 146 = 371. Jelaskan pilihanmu.', answer: 'A betul kerana 235 + 146 = 381.', accepted: ['A betul kerana 235 + 146 = 381.', 'A, 381', '381'], hint: 'Kira setiap lajur dan semak pengumpulan semula.', explanation: '5 + 6 = 11, 3 + 4 + 1 = 8 dan 2 + 1 = 3. Jadi, pilihan A betul dengan jumlah 381.', operands: [235, 146], questionType: 'structured', marks: 2 },
  { skill: 'membandingkan_dua_jumlah', q: 'Bandingkan 278 + 121 dengan 245 + 163. Pengiraan manakah mempunyai jumlah lebih besar dan berapa bezanya?', answer: '245 + 163 lebih besar; jumlahnya 408 dan bezanya 9.', accepted: ['245 + 163 lebih besar; jumlahnya 408 dan bezanya 9.', '408, beza 9'], hint: 'Cari kedua-dua jumlah sebelum membandingkannya.', explanation: '278 + 121 = 399, manakala 245 + 163 = 408. Jumlah kedua lebih besar sebanyak 408 - 399 = 9.', operands: [245, 163], numericAnswer: 408, calculations: [[278, 121], [245, 163]], questionType: 'structured', marks: 3 },
  { skill: 'menganalisis_jumlah_setara', q: 'Adakah 150 + 275 dan 200 + 225 mempunyai jumlah yang sama? Buktikan.', answer: 'Ya, kedua-duanya berjumlah 425.', accepted: ['Ya, kedua-duanya berjumlah 425.', 'ya, 425', '425'], hint: 'Kira kedua-dua ayat tambah.', explanation: '150 + 275 = 425 dan 200 + 225 = 425. Oleh itu, kedua-dua jumlah adalah sama.', operands: [150, 275], numericAnswer: 425, calculations: [[150, 275], [200, 225]], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_bahagian_tidak_diketahui', q: 'Sebuah kotak mengandungi 438 kad. Sebanyak 256 daripadanya kad biru dan selebihnya kad merah. Berapakah kad merah supaya kedua-dua bahagian berjumlah 438?', answer: '182 kad merah', accepted: ['182 kad merah', '182'], hint: 'Cari nombor yang perlu ditambah kepada 256 untuk menjadi 438.', explanation: '256 + 182 = 438. Jadi, terdapat 182 kad merah.', operands: [256, 182], numericAnswer: 182, questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_jumlah_tiga_hari', q: 'Kutipan tiga hari mesti berjumlah 400 tin. Hari pertama mendapat 145 tin dan hari kedua 128 tin. Berapakah kutipan hari ketiga?', answer: '127 tin', accepted: ['127 tin', '127'], hint: 'Cari dahulu jumlah dua hari, kemudian lengkapkan hingga 400.', explanation: '145 + 128 = 273 dan 273 + 127 = 400. Jadi, kutipan hari ketiga ialah 127 tin.', operands: [145, 128, 127], numericAnswer: 127, questionType: 'structured', marks: 3 },
  { skill: 'mengenal_maklumat_tidak_relevan', q: 'Di rak pertama ada 126 buku dan di rak kedua ada 235 buku. Setiap rak mempunyai 4 tingkat. Untuk mencari jumlah buku, maklumat manakah tidak diperlukan dan apakah jumlah buku?', answer: 'Maklumat 4 tingkat tidak diperlukan; jumlahnya 361 buku.', accepted: ['Maklumat 4 tingkat tidak diperlukan; jumlahnya 361 buku.', '4 tingkat, 361 buku', '361'], hint: 'Gunakan hanya bilangan buku pada dua rak.', explanation: 'Bilangan 4 tingkat tidak mempengaruhi jumlah buku. 126 + 235 = 361 buku.', operands: [126, 235], questionType: 'structured', marks: 3 },
  { skill: 'menyusun_mengikut_jumlah', q: 'Susun ayat tambah 125 + 250, 316 + 72 dan 204 + 163 daripada jumlah paling kecil kepada paling besar.', answer: '204 + 163 = 367, 125 + 250 = 375, 316 + 72 = 388', accepted: ['204 + 163 = 367, 125 + 250 = 375, 316 + 72 = 388', '367, 375, 388'], hint: 'Cari ketiga-tiga jumlah sebelum menyusun.', explanation: '204 + 163 = 367, 125 + 250 = 375 dan 316 + 72 = 388. Tertib menaiknya ialah 367, 375, 388.', operands: [204, 163], numericAnswer: 367, calculations: [[125, 250], [316, 72], [204, 163]], questionType: 'ordering', marks: 3 },
  { skill: 'menganalisis_kesilapan_mengumpul_semula', q: 'Seorang murid menulis 387 + 246 = 523. Cari lajur yang tersilap dan betulkan jumlahnya.', answer: 'Lajur puluh tersilap; jumlah yang betul ialah 633.', accepted: ['Lajur puluh tersilap; jumlah yang betul ialah 633.', 'puluh, 633', '633'], hint: 'Semak 8 puluh + 4 puluh + 1 puluh yang dikumpul semula.', explanation: '7 + 6 = 13, kemudian 8 + 4 + 1 = 13 puluh. Pengumpulan semula pada lajur puluh menghasilkan jumlah 633.', operands: [387, 246], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_cerakinan_dua_nombor', q: 'Analisis (300 + 40 + 6) + (200 + 50 + 3). Apakah dua nombor asal dan jumlahnya?', answer: 'Nombor asal ialah 346 dan 253; jumlahnya 599.', accepted: ['Nombor asal ialah 346 dan 253; jumlahnya 599.', '346 + 253 = 599', '599'], hint: 'Gabungkan setiap bentuk cerakinan dahulu.', explanation: '300 + 40 + 6 membentuk 346 dan 200 + 50 + 3 membentuk 253. Maka, 346 + 253 = 599.', operands: [346, 253], questionType: 'structured', marks: 3 },
  { skill: 'menganalisis_dua_kaedah', q: 'Bagi 425 + 176, Kaedah A memberikan 591 dan Kaedah B memberikan 601. Tentukan kaedah yang tepat.', answer: 'Kaedah B tepat; jumlahnya 601.', accepted: ['Kaedah B tepat; jumlahnya 601.', 'B, 601', '601'], hint: 'Semak pengumpulan semula pada lajur sa dan puluh.', explanation: '5 + 6 = 11, 2 + 7 + 1 = 10 dan 4 + 1 + 1 = 6. Oleh itu, Kaedah B tepat dengan jumlah 601.', operands: [425, 176], questionType: 'structured', marks: 2 },

  { skill: 'menilai_ketepatan_jumlah_bulat', q: 'Ravi berkata 289 + 311 = 600. Nilai pernyataannya dan berikan bukti.', answer: 'Pernyataan Ravi betul kerana 289 + 311 = 600.', accepted: ['Pernyataan Ravi betul kerana 289 + 311 = 600.', 'betul, 600', '600'], hint: 'Gabungkan 289 dengan 11 dahulu untuk menjadi 300.', explanation: '289 + 11 = 300, kemudian tambah baki 300. Jadi, 289 + 311 = 600 dan Ravi betul.', operands: [289, 311], questionType: 'structured', marks: 2 },
  { skill: 'menilai_jawapan_salah', q: 'Mira menyatakan 475 + 128 = 593. Adakah jawapannya tepat? Betulkan jika perlu.', answer: 'Tidak tepat; jawapan yang betul ialah 603.', accepted: ['Tidak tepat; jawapan yang betul ialah 603.', 'tidak, 603', '603'], hint: 'Semak 5 + 8 dan pengumpulan semula ke lajur puluh.', explanation: '5 + 8 = 13 dan 7 + 2 + 1 = 10. Oleh itu, 475 + 128 = 603, bukan 593.', operands: [475, 128], questionType: 'structured', marks: 2 },
  { skill: 'menilai_strategi_cekap', q: 'Untuk 398 + 202, pilih strategi yang lebih cekap: A. bentuk lazim atau B. pindahkan 2 daripada 202 kepada 398. Nyatakan jumlah.', answer: 'Strategi B lebih cekap; 400 + 200 = 600.', accepted: ['Strategi B lebih cekap; 400 + 200 = 600.', 'B, 600', '600'], hint: 'Cari cara membentuk nombor ratus yang lengkap.', explanation: 'Memindahkan 2 menjadikan 398 + 202 setara dengan 400 + 200 = 600. Strategi B lebih cekap untuk nombor ini.', operands: [398, 202], questionType: 'structured', marks: 2 },
  { skill: 'menilai_kemunasabahan', q: 'Tanpa menerima jawapan rakan bulat-bulat, tentukan sama ada jumlah 167 + 254 boleh kurang daripada 400. Berikan jumlah sebenar.', answer: 'Tidak; jumlah sebenar ialah 421.', accepted: ['Tidak; jumlah sebenar ialah 421.', 'tidak, 421', '421'], hint: '160 + 250 sahaja sudah melebihi 400.', explanation: '167 + 254 = 421. Oleh itu, jumlahnya tidak mungkin kurang daripada 400.', operands: [167, 254], questionType: 'structured', marks: 2 },
  { skill: 'menilai_operasi_dalam_masalah', q: 'Siti mempunyai 245 pelekat lalu menerima 138 lagi. Seorang murid menggunakan operasi tolak. Nilai pilihan operasi itu dan selesaikan masalah.', answer: 'Operasi tolak tidak tepat; operasi tambah memberikan 383 pelekat.', accepted: ['Operasi tolak tidak tepat; operasi tambah memberikan 383 pelekat.', 'tambah, 383', '383'], hint: 'Perkataan “menerima lagi” menunjukkan kuantiti bertambah.', explanation: 'Kuantiti pelekat bertambah, jadi operasi yang sesuai ialah tambah. 245 + 138 = 383 pelekat.', operands: [245, 138], questionType: 'structured', marks: 3 },

  { skill: 'mencipta_ayat_tambah_dua_nombor', q: 'Mencipta: Bina satu ayat tambah menggunakan 246 dan 153, kemudian nyatakan jumlahnya.', answer: '246 + 153 = 399', accepted: ['246 + 153 = 399', '153 + 246 = 399'], hint: 'Gunakan kedua-dua nombor sebagai penambah.', explanation: 'Satu ayat tambah yang tepat ialah 246 + 153 = 399. Tertib boleh ditukar tanpa mengubah jumlah.', operands: [246, 153], questionType: 'structured', marks: 2, rubric: CONSTRUCT_ADDITION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [246, 153, 399] } },
  { skill: 'mencipta_penambah_hilang', q: 'Mencipta: Bina ayat tambah yang berjumlah 600 dengan 275 sebagai salah satu penambah. Tentukan penambah yang satu lagi.', answer: '275 + 325 = 600', accepted: ['275 + 325 = 600', '325 + 275 = 600', '325'], hint: 'Cari nombor yang melengkapkan 275 hingga 600.', explanation: 'Penambah yang satu lagi ialah 325 kerana 275 + 325 = 600.', operands: [275, 325], numericAnswer: 325, questionType: 'structured', marks: 2, rubric: CONSTRUCT_ADDITION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [275, 325, 600] } },
  { skill: 'mencipta_ayat_tambah_tiga_nombor', q: 'Mencipta: Gunakan 100, 250 dan 75 sekali sahaja untuk membina ayat tambah lengkap.', answer: '100 + 250 + 75 = 425', accepted: ['100 + 250 + 75 = 425', '250 + 100 + 75 = 425', '425'], hint: 'Tambah ketiga-tiga nombor dan tulis tanda sama dengan.', explanation: 'Contoh ayat tambah lengkap ialah 100 + 250 + 75 = 425.', operands: [100, 250, 75], questionType: 'structured', marks: 2, rubric: CONSTRUCT_ADDITION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [100, 250, 75, 425] } },
  { skill: 'mencipta_masalah_bercerita', q: 'Mencipta: Bina satu masalah cerita yang menggunakan 128 + 76 dan mempunyai jawapan 204.', answer: 'Aina mempunyai 128 manik dan menerima 76 manik lagi. Aina mempunyai 204 manik semuanya.', accepted: ['Aina mempunyai 128 manik dan menerima 76 manik lagi. Aina mempunyai 204 manik semuanya.'], hint: 'Gunakan situasi dua kuantiti digabungkan dan nyatakan soalan atau jumlahnya.', explanation: 'Cerita boleh berbeza asalkan melibatkan penambahan 128 + 76 dan jumlah 204.', operands: [128, 76], questionType: 'structured', marks: 3, rubric: CREATE_STORY_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [128, 76, 204], semanticCues: ['lagi', 'jumlah', 'semuanya', 'keseluruhan'] } },
  { skill: 'mencipta_cerakinan_tambah', q: 'Mencipta: Tunjukkan 321 + 246 menggunakan bentuk cerakinan ratus, puluh dan sa hingga memperoleh jumlah.', answer: '(300 + 20 + 1) + (200 + 40 + 6) = 500 + 60 + 7 = 567', accepted: ['(300 + 20 + 1) + (200 + 40 + 6) = 500 + 60 + 7 = 567', '321 + 246 = 567', '567'], hint: 'Cerakinkan kedua-dua nombor sebelum menggabungkan nilai tempat yang sama.', explanation: '321 ialah 300 + 20 + 1 dan 246 ialah 200 + 40 + 6. Gabungannya ialah 500 + 60 + 7 = 567.', operands: [321, 246], questionType: 'structured', marks: 2, rubric: CONSTRUCT_ADDITION_RUBRIC, responseRules: { responseKind: 'decomposition', requiredNumbers: [321, 246, 567] } }
];

function cognitiveLevelFor(index) {
  if (index < 10) return 'mengingat';
  if (index < 20) return 'memahami';
  if (index < 35) return 'mengaplikasi';
  if (index < 50) return 'menganalisis';
  if (index < 55) return 'menilai';
  return 'mencipta';
}

const ESTIMATED_TIME = Object.freeze({
  mengingat: 45,
  memahami: 60,
  mengaplikasi: 75,
  menganalisis: 95,
  menilai: 105,
  mencipta: 120
});

export const mathTambahQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  const calculations = item.calculations || [item.operands];
  const calculationResults = calculations.map(operands => operands.reduce((sum, value) => sum + value, 0));
  return Object.freeze({
    id: `MATH-TAMBAH-PILOT-${String(index + 1).padStart(3, '0')}`,
    ...item,
    q,
    question: q,
    accepted: item.accepted || [item.answer],
    acceptedAnswers: item.accepted || [item.answer],
    difficulty: index < 20 ? 'mudah' : index < 35 ? 'sederhana' : 'sukar',
    cognitiveLevel,
    questionType: item.questionType || (cognitiveLevel === 'mengingat' ? 'short_answer' : 'structured'),
    marks: item.marks || (['menganalisis', 'menilai', 'mencipta'].includes(cognitiveLevel) ? 2 : 1),
    estimatedTime: ESTIMATED_TIME[cognitiveLevel],
    assessment: 'PBD Formatif/Sumatif',
    uasa: 'PBD Sumatif',
    dskp: 'KSSR (Semakan 2017) Edisi 3 Matematik Tahun 2',
    metadata: {
      category: 'tambah',
      assessmentCategory: 'pbd_matematik',
      operation: 'addition',
      numberVariationPolicy: 'authored_locked',
      skill: item.skill,
      set: `tambah_pilot_${index + 1}`,
      calculations,
      calculationResults,
      numericAnswer: Number.isFinite(item.numericAnswer) ? item.numericAnswer : calculationResults[0]
    }
  });
}));

export function enrichMathTambahTopic(subject) {
  return {
    ...subject,
    curriculumFramework: MATH_YEAR_TWO_FRAMEWORK,
    topics: (subject.topics || []).map(topic => topic.id === 'tambah' ? {
      ...topic,
      note: 'Menambah hingga 1000 menggunakan fakta asas, strategi mental, bentuk lazim, pengumpulan semula dan penyelesaian masalah.',
      learningObjective: 'Murid dapat memahami dan melaksanakan operasi tambah hingga 1000 menggunakan strategi yang sesuai.',
      learningOutcome: 'Murid dapat menambah dua atau tiga nombor, melengkapkan penambah yang hilang, menyelesaikan masalah serta menilai dan menerangkan kaedah tambah dengan tepat.',
      contentStatus: 'pilot',
      defaultQuestionType: 'short_answer',
      defaultMarks: 1,
      assessmentFramework: MATH_YEAR_TWO_FRAMEWORK,
      questions: mathTambahQuestions
    } : topic)
  };
}

export default mathTambahQuestions;
