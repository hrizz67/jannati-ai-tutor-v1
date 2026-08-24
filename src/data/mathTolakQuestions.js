import { MATH_YEAR_TWO_FRAMEWORK } from './mathNomborQuestions.js';

const CONSTRUCT_SUBTRACTION_RUBRIC = Object.freeze({
  totalMarks: 2,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua nombor atau syarat yang diberikan.', marks: 1 },
    { criterion: 'Membina ayat tolak dan beza yang tepat.', marks: 1 }
  ])
});

const CREATE_STORY_RUBRIC = Object.freeze({
  totalMarks: 3,
  criteria: Object.freeze([
    { criterion: 'Menggunakan kuantiti asal dan kuantiti yang dikeluarkan.', marks: 1 },
    { criterion: 'Membina situasi penolakan yang jelas dan munasabah.', marks: 1 },
    { criterion: 'Menyatakan baki atau beza yang tepat.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'tolak_tanpa_mengumpul_semula_sa', q: 'Hitung 47 - 12.', answer: '35', hint: 'Tolak sa, kemudian tolak puluh.', explanation: '7 - 2 = 5 dan 4 puluh - 1 puluh = 3 puluh. Jadi, 47 - 12 = 35.', operands: [47, 12] },
  { skill: 'tolak_tanpa_mengumpul_semula_puluh', q: 'Berapakah baki 86 - 24?', answer: '62', hint: 'Kedua-dua lajur tidak memerlukan pengumpulan semula.', explanation: '6 - 4 = 2 dan 8 puluh - 2 puluh = 6 puluh. Maka, 86 - 24 = 62.', operands: [86, 24] },
  { skill: 'tolak_gandaan_puluh', q: 'Cari beza antara 150 dengan 30.', answer: '120', hint: 'Tolak 3 puluh daripada 15 puluh.', explanation: '150 - 30 = 120.', operands: [150, 30] },
  { skill: 'tolak_nombor_satu_digit', q: 'Selesaikan 209 - 5.', answer: '204', hint: 'Tolak pada tempat sa sahaja.', explanation: '9 sa - 5 sa = 4 sa, jadi 209 - 5 = 204.', operands: [209, 5] },
  { skill: 'tolak_ratus', q: 'Apakah jawapan bagi 700 - 200?', answer: '500', hint: 'Tolak nilai ratus dan kekalkan sifar pada puluh serta sa.', explanation: '7 ratus - 2 ratus = 5 ratus. Oleh itu, 700 - 200 = 500.', operands: [700, 200] },
  { skill: 'fakta_asas_tolak', q: 'Lengkapkan fakta asas: 17 - 8 = ___.', answer: '9', hint: 'Fikirkan 8 + berapa menjadi 17.', explanation: '8 + 9 = 17, maka 17 - 8 = 9.', operands: [17, 8], questionType: 'fill_blank' },
  { skill: 'tolak_sifar', q: 'Nyatakan jawapan bagi 25 - 0.', answer: '25', hint: 'Menolak sifar tidak mengubah nilai nombor.', explanation: 'Apabila 0 ditolak, bilangannya kekal. Maka, 25 - 0 = 25.', operands: [25, 0] },
  { skill: 'tolak_nombor_sama', q: 'Apakah hasil bagi 44 - 44?', answer: '0', accepted: ['0', 'sifar'], hint: 'Apabila semua kuantiti dikeluarkan, tiada yang tinggal.', explanation: '44 - 44 = 0.', operands: [44, 44] },
  { skill: 'asingkan_sa_daripada_nombor', q: 'Keluarkan 7 daripada 67 menggunakan operasi tolak.', answer: '60', accepted: ['60', '67 - 7 = 60'], hint: 'Tolak 7 sa daripada 67.', explanation: '67 - 7 = 60.', operands: [67, 7] },
  { skill: 'satu_sebelum_seratus', q: 'Kira 100 - 1.', answer: '99', hint: 'Satu kurang daripada 100 ialah nombor sebelumnya.', explanation: '100 - 1 = 99.', operands: [100, 1] },

  { skill: 'memahami_maksud_baki', q: 'Perkataan “baki” menunjukkan operasi tolak. Gunakan maklumat itu untuk mencari baki 58 - 22.', answer: '36', hint: 'Kuantiti kedua dikeluarkan daripada kuantiti asal.', explanation: 'Baki ialah kuantiti yang tinggal. 58 - 22 = 36.', operands: [58, 22], questionType: 'structured' },
  { skill: 'memahami_tertib_tolak', q: 'Adakah 63 - 21 dan 21 - 63 memberikan jawapan yang sama dalam nombor bulat Tahun 2? Nyatakan jawapan pengiraan pertama.', answer: 'Tidak; 63 - 21 = 42.', accepted: ['Tidak; 63 - 21 = 42.', 'tidak, 42', '42'], hint: 'Dalam operasi tolak, tertib nombor tidak boleh ditukar sesuka hati.', explanation: '63 - 21 = 42. Jika tertib ditukar, 21 tidak cukup untuk menolak 63 dalam lingkungan nombor bulat Tahun 2. Jadi, tertib penting.', operands: [63, 21], questionType: 'structured', marks: 2 },
  { skill: 'tolak_bentuk_cerakinan', q: 'Gunakan bentuk cerakinan untuk menghitung 368 - 125.', answer: '243', accepted: ['243', '200 + 40 + 3 = 243'], hint: 'Tolak ratus, puluh dan sa secara berasingan.', explanation: '(300 - 100) + (60 - 20) + (8 - 5) = 200 + 40 + 3 = 243.', operands: [368, 125], questionType: 'structured', marks: 2 },
  { skill: 'memahami_pengumpulan_semula_sa_tolak', q: 'Dalam 75 - 28, mengapakah 1 puluh perlu dikumpul semula? Nyatakan baki akhir.', answer: 'Kerana 5 sa tidak boleh menolak 8 sa; baki akhir ialah 47.', accepted: ['Kerana 5 sa tidak boleh menolak 8 sa; baki akhir ialah 47.', '5 tidak boleh tolak 8, 47', '47'], hint: 'Tukar 1 puluh kepada 10 sa supaya 15 - 8 boleh dilakukan.', explanation: '7 puluh 5 sa menjadi 6 puluh 15 sa. 15 - 8 = 7 dan 6 - 2 = 4, maka 75 - 28 = 47.', operands: [75, 28], questionType: 'structured', marks: 2 },
  { skill: 'memahami_pengumpulan_semula_merentasi_sifar', q: 'Hitung 402 - 176 dan terangkan cara mengumpul semula merentasi sifar.', answer: '226', accepted: ['226', '402 - 176 = 226'], hint: 'Tukar 1 ratus kepada 10 puluh, kemudian tukar 1 puluh kepada 10 sa.', explanation: '402 menjadi 3 ratus 10 puluh 2 sa, kemudian 3 ratus 9 puluh 12 sa. 12 - 6 = 6, 9 - 7 = 2 dan 3 - 1 = 2. Bakinya 226.', operands: [402, 176], questionType: 'structured', marks: 2 },
  { skill: 'memilih_ayat_tolak', q: 'Terdapat 159 buku. Sebanyak 24 buku dipinjam. Tulis ayat matematik yang mewakili baki buku.', answer: '159 - 24 = 135', accepted: ['159 - 24 = 135', '135'], hint: 'Kuantiti buku berkurang, jadi gunakan tanda tolak.', explanation: 'Ayat matematik yang tepat ialah 159 - 24 = 135.', operands: [159, 24], questionType: 'structured', marks: 2 },
  { skill: 'strategi_pelarasan_tolak', q: 'Gunakan strategi pelarasan untuk mencari 60 - 21.', answer: '39', accepted: ['39', '59 - 20 = 39'], hint: 'Kurangkan kedua-dua nombor sebanyak 1.', explanation: '60 - 21 mempunyai beza yang sama dengan 59 - 20. Oleh itu, bakinya 39.', operands: [60, 21], questionType: 'structured', marks: 2 },
  { skill: 'hubungan_nombor_hampir_tolak', q: 'Terangkan cara cepat menghitung 499 - 199 dan nyatakan jawapannya.', answer: '300', accepted: ['300', '500 - 200 = 300'], hint: 'Tambah 1 kepada kedua-dua nombor; bezanya tidak berubah.', explanation: '499 - 199 mempunyai beza yang sama dengan 500 - 200, iaitu 300.', operands: [499, 199], questionType: 'structured', marks: 2 },
  { skill: 'memahami_tolak_berperingkat', q: 'Tolak 100 dan kemudian 50 daripada 755. Tulis ayat matematik lengkap.', answer: '755 - 100 - 50 = 605', accepted: ['755 - 100 - 50 = 605', '605'], hint: 'Lakukan penolakan mengikut urutan dari kiri.', explanation: '755 - 100 = 655, kemudian 655 - 50 = 605.', operands: [755, 100, 50], questionType: 'structured', marks: 2 },
  { skill: 'hubungan_keseluruhan_bahagian_tolak', q: 'Selepas suatu nombor ditolak daripada 70, bakinya ialah 47. Apakah nombor yang ditolak?', answer: '23', hint: 'Cari bahagian yang melengkapkan 47 hingga 70.', explanation: '70 - 23 = 47, maka nombor yang ditolak ialah 23.', operands: [70, 23], numericAnswer: 23, questionType: 'structured', marks: 2 },

  { skill: 'algoritma_lazim_tolak_dua_digit', q: 'Kira 94 - 36 menggunakan bentuk lazim.', answer: '58', hint: 'Kumpul semula 1 puluh supaya 14 - 6 boleh dilakukan.', explanation: '14 - 6 = 8 dan 8 puluh - 3 puluh = 5 puluh. Jadi, 94 - 36 = 58.', operands: [94, 36], questionType: 'structured' },
  { skill: 'algoritma_lazim_tolak_tiga_digit', q: 'Selesaikan 392 - 125.', answer: '267', hint: 'Tolak mengikut lajur dari sa ke ratus.', explanation: '12 - 5 = 7, 8 - 2 = 6 dan 3 - 1 = 2. Maka, 392 - 125 = 267.', operands: [392, 125] },
  { skill: 'tolak_merentasi_sifar_puluh', q: 'Hitung 584 - 176.', answer: '408', hint: 'Kumpul semula pada lajur sa dan semak sifar pada jawapan.', explanation: '14 - 6 = 8, 7 - 7 = 0 dan 5 - 1 = 4. Jadi, 584 - 176 = 408.', operands: [584, 176] },
  { skill: 'tolak_pengumpulan_semula_dua_lajur', q: 'Cari hasil 645 - 289.', answer: '356', hint: 'Kumpul semula apabila digit atas lebih kecil daripada digit bawah.', explanation: '15 - 9 = 6, 13 - 8 = 5 dan 5 - 2 = 3. Bakinya 356.', operands: [645, 289] },
  { skill: 'tolak_daripada_ratus_lengkap', q: 'Lengkapkan pengiraan: 800 - 322 = ___.', answer: '478', hint: 'Kumpul semula daripada ratus melalui lajur puluh.', explanation: '800 - 322 = 478.', operands: [800, 322], questionType: 'fill_blank' },
  { skill: 'tolak_tanpa_mengumpul_semula_tiga_digit', q: 'Berapakah hasil 375 - 230?', answer: '145', hint: 'Tolak setiap nilai tempat secara berasingan.', explanation: '300 - 200 = 100, 70 - 30 = 40 dan 5 - 0 = 5. Bakinya 145.', operands: [375, 230] },
  { skill: 'masalah_buku_dipinjam', q: 'Perpustakaan mempunyai 385 buku. Sebanyak 147 buku dipinjam. Berapakah buku yang masih ada?', answer: '238 buku', accepted: ['238 buku', '238'], hint: 'Tolak bilangan buku dipinjam daripada jumlah asal.', explanation: '385 - 147 = 238. Jadi, masih ada 238 buku.', operands: [385, 147], questionType: 'structured', marks: 2 },
  { skill: 'masalah_manik_digunakan', q: 'Aina mempunyai 533 manik dan menggunakan 208 manik. Hitung baki manik.', answer: '325 manik', accepted: ['325 manik', '325'], hint: 'Kuantiti manik berkurang selepas digunakan.', explanation: '533 - 208 = 325. Baki manik ialah 325.', operands: [533, 208], questionType: 'structured', marks: 2 },
  { skill: 'masalah_kutipan_diambil', q: 'Program kitar semula mengumpulkan 445 botol. Sebanyak 259 botol dihantar ke pusat kitar semula. Berapakah botol yang tinggal?', answer: '186 botol', accepted: ['186 botol', '186'], hint: 'Tolak bilangan yang dihantar daripada jumlah kutipan.', explanation: '445 - 259 = 186. Sebanyak 186 botol tinggal.', operands: [445, 259], questionType: 'structured', marks: 2 },
  { skill: 'masalah_tolak_berperingkat', q: 'Terdapat 399 pelekat. Sebanyak 210 diberi kepada Kumpulan A dan 64 kepada Kumpulan B. Cari baki pelekat.', answer: '125 pelekat', accepted: ['125 pelekat', '125'], hint: 'Tolak dua kuantiti secara berperingkat.', explanation: '399 - 210 = 189 dan 189 - 64 = 125. Bakinya 125 pelekat.', operands: [399, 210, 64], questionType: 'structured', marks: 2 },
  { skill: 'algoritma_tolak_tiga_nombor', q: 'Selesaikan 299 - 96 - 78.', answer: '125', hint: 'Lakukan penolakan mengikut urutan dari kiri.', explanation: '299 - 96 = 203, kemudian 203 - 78 = 125.', operands: [299, 96, 78], questionType: 'structured', marks: 2 },
  { skill: 'penolak_hilang_ke_346', q: 'Isi nombor yang hilang: 500 - ___ = 346.', answer: '154', hint: 'Cari beza antara 500 dengan 346.', explanation: '500 - 154 = 346. Oleh itu, nombor yang hilang ialah 154.', operands: [500, 154], numericAnswer: 154, questionType: 'fill_blank', marks: 2 },
  { skill: 'nombor_asal_hilang', q: 'Lengkapkan ___ - 275 = 345.', answer: '620', hint: 'Gunakan hubungan songsang: 345 + 275.', explanation: '620 - 275 = 345, jadi nombor asal yang hilang ialah 620.', operands: [620, 275], numericAnswer: 620, questionType: 'fill_blank', marks: 2 },
  { skill: 'jadual_nilai_tempat_tolak', q: 'Tolak 152 daripada 386 dengan mengasingkan nilai ratus, puluh dan sa.', answer: '234', accepted: ['234', '200 + 30 + 4 = 234'], hint: 'Tolak nilai tempat yang sama.', explanation: '3 ratus - 1 ratus = 2 ratus, 8 puluh - 5 puluh = 3 puluh dan 6 - 2 = 4. Jawapannya 234.', operands: [386, 152], questionType: 'structured', marks: 2 },
  { skill: 'strategi_nombor_serasi_tolak', q: 'Gunakan nombor serasi untuk menghitung 700 - 201.', answer: '499', accepted: ['499', '699 - 200 = 499'], hint: 'Kurangkan kedua-dua nombor sebanyak 1.', explanation: '700 - 201 mempunyai beza yang sama dengan 699 - 200, iaitu 499.', operands: [700, 201], questionType: 'structured', marks: 2 },

  { skill: 'analisis_kesilapan_pengumpulan_sa', q: 'Hana menulis 85 - 38 = 53 kerana melakukan 8 - 5 pada lajur sa. Kenal pasti kesilapan dan berikan jawapan betul.', answer: 'Jawapan yang betul ialah 47.', accepted: ['Jawapan yang betul ialah 47.', '47'], hint: 'Digit sa perlu dihitung sebagai 15 - 8 selepas pengumpulan semula.', explanation: 'Dalam 85 - 38, 5 tidak boleh menolak 8. Kumpul semula 1 puluh: 15 - 8 = 7 dan 7 - 3 = 4. Jawapannya 47.', operands: [85, 38], questionType: 'structured', marks: 2 },
  { skill: 'analisis_kesilapan_puluh_tolak', q: 'Amir memperoleh 278 bagi 422 - 154. Semak pengiraannya dan nyatakan hasil tepat.', answer: 'Hasil yang tepat ialah 268.', accepted: ['Hasil yang tepat ialah 268.', '268'], hint: 'Semak pengumpulan semula pada lajur sa dan puluh.', explanation: '12 - 4 = 8, 11 - 5 = 6 dan 3 - 1 = 2. Oleh itu, 422 - 154 = 268.', operands: [422, 154], questionType: 'structured', marks: 2 },
  { skill: 'analisis_bentuk_lazim_tolak', q: 'Dalam bentuk lazim, digit sa bagi 503 - 217 memerlukan pengumpulan semula merentasi sifar. Teruskan hingga mendapat baki.', answer: '286', hint: 'Tukar 1 ratus kepada 10 puluh, kemudian 1 puluh kepada 10 sa.', explanation: '503 menjadi 4 ratus 9 puluh 13 sa. 13 - 7 = 6, 9 - 1 = 8 dan 4 - 2 = 2. Bakinya 286.', operands: [503, 217], questionType: 'structured', marks: 2 },
  { skill: 'analisis_digit_hilang_penolak', q: 'Tentukan digit yang hilang dalam 392 - 1_5 = 247.', answer: '4', hint: 'Penolak ialah 392 - 247.', explanation: '392 - 247 = 145. Oleh itu, 392 - 145 = 247 dan digit yang hilang ialah 4.', operands: [392, 145], numericAnswer: 4, questionType: 'fill_blank', marks: 2 },
  { skill: 'analisis_digit_hilang_nombor_asal', q: 'Cari digit yang hilang dalam _92 - 224 = 368.', answer: '5', hint: 'Nombor asal ialah 368 + 224.', explanation: '368 + 224 = 592. Maka, 592 - 224 = 368 dan digit yang hilang ialah 5.', operands: [592, 224], numericAnswer: 5, questionType: 'fill_blank', marks: 2 },
  { skill: 'analisis_pernyataan_tolak_benar', q: 'Pilih pengiraan yang betul: A. 381 - 146 = 235 atau B. 381 - 146 = 245. Jelaskan pilihanmu.', answer: 'A betul kerana 381 - 146 = 235.', accepted: ['A betul kerana 381 - 146 = 235.', 'A, 235', '235'], hint: 'Semak setiap lajur dan pengumpulan semula.', explanation: '11 - 6 = 5, 7 - 4 = 3 dan 3 - 1 = 2. Jadi, pilihan A betul dengan baki 235.', operands: [381, 146], questionType: 'structured', marks: 2 },
  { skill: 'membandingkan_dua_beza', q: 'Bandingkan 408 - 163 dengan 399 - 121. Pengiraan manakah mempunyai jawapan lebih besar dan berapa bezanya?', answer: '399 - 121 lebih besar; jawapannya 278 dan bezanya 33.', accepted: ['399 - 121 lebih besar; jawapannya 278 dan bezanya 33.', '278, beza 33'], hint: 'Cari kedua-dua jawapan sebelum membandingkannya.', explanation: '408 - 163 = 245, manakala 399 - 121 = 278. Jawapan kedua lebih besar sebanyak 278 - 245 = 33.', operands: [399, 121], numericAnswer: 278, calculations: [[408, 163], [399, 121]], questionType: 'structured', marks: 3 },
  { skill: 'menganalisis_beza_setara', q: 'Adakah 425 - 275 dan 375 - 225 mempunyai beza yang sama? Buktikan.', answer: 'Ya, kedua-duanya mempunyai beza 150.', accepted: ['Ya, kedua-duanya mempunyai beza 150.', 'ya, 150', '150'], hint: 'Kira kedua-dua ayat tolak.', explanation: '425 - 275 = 150 dan 375 - 225 = 150. Oleh itu, kedua-dua beza adalah sama.', operands: [425, 275], numericAnswer: 150, calculations: [[425, 275], [375, 225]], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_bahagian_diketahui', q: 'Sebuah kotak mengandungi 438 kad. Jika 182 daripadanya kad merah, berapakah kad biru?', answer: '256 kad biru', accepted: ['256 kad biru', '256'], hint: 'Tolak bilangan kad merah daripada jumlah kad.', explanation: '438 - 182 = 256. Jadi, terdapat 256 kad biru.', operands: [438, 182], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_baki_tiga_hari', q: 'Sasaran kutipan ialah 400 tin. Hari pertama mendapat 145 tin dan hari kedua 128 tin. Berapakah lagi diperlukan untuk mencapai sasaran?', answer: '127 tin', accepted: ['127 tin', '127'], hint: 'Tolak kedua-dua kutipan daripada sasaran.', explanation: '400 - 145 = 255 dan 255 - 128 = 127. Sebanyak 127 tin lagi diperlukan.', operands: [400, 145, 128], questionType: 'structured', marks: 3 },
  { skill: 'mengenal_maklumat_tidak_relevan_tolak', q: 'Perpustakaan mempunyai 361 buku pada 4 rak. Sebanyak 126 buku dipinjam. Maklumat manakah tidak diperlukan untuk mencari baki dan berapakah baki buku?', answer: 'Maklumat 4 rak tidak diperlukan; bakinya 235 buku.', accepted: ['Maklumat 4 rak tidak diperlukan; bakinya 235 buku.', '4 rak, 235 buku', '235'], hint: 'Gunakan hanya jumlah buku dan bilangan yang dipinjam.', explanation: 'Bilangan 4 rak tidak mempengaruhi baki. 361 - 126 = 235 buku.', operands: [361, 126], questionType: 'structured', marks: 3 },
  { skill: 'menyusun_mengikut_beza', q: 'Susun 388 - 72, 375 - 250 dan 367 - 163 daripada jawapan paling kecil kepada paling besar.', answer: '375 - 250 = 125, 367 - 163 = 204, 388 - 72 = 316', accepted: ['375 - 250 = 125, 367 - 163 = 204, 388 - 72 = 316', '125, 204, 316'], hint: 'Cari ketiga-tiga jawapan sebelum menyusun.', explanation: '375 - 250 = 125, 367 - 163 = 204 dan 388 - 72 = 316. Tertib menaiknya ialah 125, 204, 316.', operands: [375, 250], numericAnswer: 125, calculations: [[388, 72], [375, 250], [367, 163]], questionType: 'ordering', marks: 3 },
  { skill: 'menganalisis_kesilapan_merentasi_sifar', q: 'Seorang murid menulis 633 - 246 = 527. Cari langkah yang tersilap dan betulkan jawapannya.', answer: 'Pengumpulan semula tersilap; jawapan yang betul ialah 387.', accepted: ['Pengumpulan semula tersilap; jawapan yang betul ialah 387.', 'pengumpulan semula, 387', '387'], hint: 'Semak 13 - 6 pada lajur sa dan 12 - 4 pada lajur puluh.', explanation: '633 perlu dikumpul semula menjadi 5 ratus 12 puluh 13 sa. Jawapan yang tepat ialah 633 - 246 = 387.', operands: [633, 246], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_cerakinan_penolak', q: 'Analisis 599 - (200 + 50 + 3). Apakah nombor yang ditolak dan apakah bakinya?', answer: 'Nombor yang ditolak ialah 253; bakinya 346.', accepted: ['Nombor yang ditolak ialah 253; bakinya 346.', '599 - 253 = 346', '346'], hint: 'Gabungkan bentuk cerakinan sebelum menolak.', explanation: '200 + 50 + 3 membentuk 253. Maka, 599 - 253 = 346.', operands: [599, 253], questionType: 'structured', marks: 3 },
  { skill: 'menganalisis_dua_kaedah_tolak', q: 'Bagi 601 - 176, Kaedah A memberikan 435 dan Kaedah B memberikan 425. Tentukan kaedah yang tepat.', answer: 'Kaedah B tepat; bakinya 425.', accepted: ['Kaedah B tepat; bakinya 425.', 'B, 425', '425'], hint: 'Semak pengumpulan semula merentasi sifar.', explanation: '601 dikumpul semula sebelum menolak 176. Hasil yang tepat ialah 425, jadi Kaedah B betul.', operands: [601, 176], questionType: 'structured', marks: 2 },

  { skill: 'menilai_ketepatan_tolak', q: 'Ravi berkata 600 - 311 = 289. Nilai pernyataannya dan berikan bukti.', answer: 'Pernyataan Ravi betul kerana 600 - 311 = 289.', accepted: ['Pernyataan Ravi betul kerana 600 - 311 = 289.', 'betul, 289', '289'], hint: 'Semak menggunakan 289 + 311.', explanation: '289 + 311 = 600, maka 600 - 311 = 289. Pernyataan Ravi betul.', operands: [600, 311], questionType: 'structured', marks: 2 },
  { skill: 'menilai_jawapan_tolak_salah', q: 'Mira menyatakan 603 - 128 = 465. Adakah jawapannya tepat? Betulkan jika perlu.', answer: 'Tidak tepat; jawapan yang betul ialah 475.', accepted: ['Tidak tepat; jawapan yang betul ialah 475.', 'tidak, 475', '475'], hint: 'Semak pengumpulan semula pada lajur sa dan puluh.', explanation: '13 - 8 = 5, 9 - 2 = 7 dan 5 - 1 = 4. Oleh itu, 603 - 128 = 475, bukan 465.', operands: [603, 128], questionType: 'structured', marks: 2 },
  { skill: 'menilai_strategi_tolak_cekap', q: 'Untuk 600 - 202, pilih strategi lebih cekap: A. bentuk lazim atau B. tolak 200 kemudian tolak 2. Nyatakan jawapan.', answer: 'Strategi B lebih cekap; jawapannya 398.', accepted: ['Strategi B lebih cekap; jawapannya 398.', 'B, 398', '398'], hint: 'Gunakan nombor bulat 200 dahulu.', explanation: '600 - 200 = 400, kemudian 400 - 2 = 398. Strategi B lebih cekap untuk nombor ini.', operands: [600, 202], questionType: 'structured', marks: 2 },
  { skill: 'menilai_kemunasabahan_tolak', q: 'Tentukan sama ada jawapan bagi 421 - 254 boleh lebih daripada 200. Berikan jawapan sebenar.', answer: 'Tidak; jawapan sebenar ialah 167.', accepted: ['Tidak; jawapan sebenar ialah 167.', 'tidak, 167', '167'], hint: '421 - 200 sahaja tinggal 221, kemudian masih perlu menolak 54.', explanation: '421 - 254 = 167. Oleh itu, jawapannya tidak mungkin lebih daripada 200.', operands: [421, 254], questionType: 'structured', marks: 2 },
  { skill: 'menilai_operasi_tolak_dalam_masalah', q: 'Siti mempunyai 383 pelekat lalu memberikan 138 kepada rakannya. Seorang murid menggunakan operasi tambah. Nilai pilihan itu dan selesaikan masalah.', answer: 'Operasi tambah tidak tepat; operasi tolak memberikan baki 245 pelekat.', accepted: ['Operasi tambah tidak tepat; operasi tolak memberikan baki 245 pelekat.', 'tolak, 245', '245'], hint: 'Perkataan “memberikan” menunjukkan kuantiti berkurang.', explanation: 'Kuantiti pelekat berkurang, jadi operasi yang sesuai ialah tolak. 383 - 138 = 245 pelekat.', operands: [383, 138], questionType: 'structured', marks: 3 },

  { skill: 'mencipta_ayat_tolak_dua_nombor', q: 'Mencipta: Bina satu ayat tolak menggunakan 399 dan 153, kemudian nyatakan bakinya.', answer: '399 - 153 = 246', accepted: ['399 - 153 = 246', '246'], hint: 'Gunakan nombor lebih besar sebagai nombor asal.', explanation: 'Ayat tolak yang tepat ialah 399 - 153 = 246.', operands: [399, 153], questionType: 'structured', marks: 2, rubric: CONSTRUCT_SUBTRACTION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [399, 153, 246] } },
  { skill: 'mencipta_penolak_daripada_beza', q: 'Mencipta: Bina ayat tolak yang bermula dengan 600 dan mempunyai baki 325. Tentukan nombor yang ditolak.', answer: '600 - 275 = 325', accepted: ['600 - 275 = 325', '275'], hint: 'Cari nombor yang perlu dikeluarkan daripada 600 untuk tinggal 325.', explanation: 'Nombor yang ditolak ialah 275 kerana 600 - 275 = 325.', operands: [600, 275], numericAnswer: 275, questionType: 'structured', marks: 2, rubric: CONSTRUCT_SUBTRACTION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [600, 275, 325] } },
  { skill: 'mencipta_ayat_tolak_berperingkat', q: 'Mencipta: Gunakan 425, 250 dan 75 sekali sahaja untuk membina ayat tolak berperingkat yang lengkap.', answer: '425 - 250 - 75 = 100', accepted: ['425 - 250 - 75 = 100', '100'], hint: 'Tolak mengikut urutan dari kiri dan tulis tanda sama dengan.', explanation: 'Ayat tolak berperingkat yang tepat ialah 425 - 250 - 75 = 100.', operands: [425, 250, 75], questionType: 'structured', marks: 2, rubric: CONSTRUCT_SUBTRACTION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [425, 250, 75, 100] } },
  { skill: 'mencipta_masalah_tolak', q: 'Mencipta: Bina satu masalah cerita yang menggunakan 204 - 76 dan mempunyai jawapan 128.', answer: 'Aina mempunyai 204 manik dan memberikan 76 manik kepada rakannya. Aina masih mempunyai 128 manik.', accepted: ['Aina mempunyai 204 manik dan memberikan 76 manik kepada rakannya. Aina masih mempunyai 128 manik.'], hint: 'Gunakan situasi kuantiti berkurang dan nyatakan baki.', explanation: 'Cerita boleh berbeza asalkan melibatkan penolakan 204 - 76 dan baki 128.', operands: [204, 76], questionType: 'structured', marks: 3, rubric: CREATE_STORY_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [204, 76, 128], semanticCues: ['baki', 'tinggal', 'masih', 'memberikan', 'keluar'] } },
  { skill: 'mencipta_cerakinan_tolak', q: 'Mencipta: Tunjukkan 567 - 246 menggunakan bentuk cerakinan ratus, puluh dan sa hingga memperoleh baki.', answer: '(500 - 200) + (60 - 40) + (7 - 6) = 300 + 20 + 1 = 321', accepted: ['(500 - 200) + (60 - 40) + (7 - 6) = 300 + 20 + 1 = 321', '567 - 246 = 321', '321'], hint: 'Cerakinkan kedua-dua nombor sebelum menolak nilai tempat yang sama.', explanation: '567 ialah 500 + 60 + 7 dan 246 ialah 200 + 40 + 6. Perbezaannya ialah 300 + 20 + 1 = 321.', operands: [567, 246], questionType: 'structured', marks: 2, rubric: CONSTRUCT_SUBTRACTION_RUBRIC, responseRules: { responseKind: 'decomposition', requiredNumbers: [567, 246, 321] } }
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

function subtractionResult(operands = []) {
  return operands.slice(1).reduce((result, value) => result - value, operands[0]);
}

export const mathTolakQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  const calculations = item.calculations || [item.operands];
  const calculationResults = calculations.map(subtractionResult);
  return Object.freeze({
    id: `MATH-TOLAK-PILOT-${String(index + 1).padStart(3, '0')}`,
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
      category: 'tolak',
      assessmentCategory: 'pbd_matematik',
      operation: 'subtraction',
      numberVariationPolicy: 'authored_locked',
      skill: item.skill,
      set: `tolak_pilot_${index + 1}`,
      calculations,
      calculationResults,
      numericAnswer: Number.isFinite(item.numericAnswer) ? item.numericAnswer : calculationResults[0]
    }
  });
}));

export function enrichMathTolakTopic(subject) {
  return {
    ...subject,
    curriculumFramework: MATH_YEAR_TWO_FRAMEWORK,
    topics: (subject.topics || []).map(topic => topic.id === 'tolak' ? {
      ...topic,
      note: 'Menolak hingga 1000 menggunakan fakta asas, strategi mental, bentuk lazim, pengumpulan semula dan penyelesaian masalah.',
      learningObjective: 'Murid dapat memahami dan melaksanakan operasi tolak hingga 1000 menggunakan strategi yang sesuai.',
      learningOutcome: 'Murid dapat menolak secara terus atau berperingkat, melengkapkan nombor yang hilang, menyelesaikan masalah serta menilai dan menerangkan kaedah tolak dengan tepat.',
      contentStatus: 'pilot',
      defaultQuestionType: 'short_answer',
      defaultMarks: 1,
      assessmentFramework: MATH_YEAR_TWO_FRAMEWORK,
      questions: mathTolakQuestions
    } : topic)
  };
}

export default mathTolakQuestions;
