import { MATH_YEAR_TWO_FRAMEWORK } from './mathNomborQuestions.js';

const CONSTRUCT_MULTIPLICATION_RUBRIC = Object.freeze({
  totalMarks: 2,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua nombor atau syarat yang diberikan.', marks: 1 },
    { criterion: 'Membina ayat darab dan hasil darab yang tepat.', marks: 1 }
  ])
});

const CREATE_STORY_RUBRIC = Object.freeze({
  totalMarks: 3,
  criteria: Object.freeze([
    { criterion: 'Menggunakan bilangan kumpulan dan objek setiap kumpulan.', marks: 1 },
    { criterion: 'Membina situasi kumpulan sama banyak yang jelas.', marks: 1 },
    { criterion: 'Menyatakan jumlah objek yang tepat.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'fakta_darab_dua', q: 'Hitung 2 x 3.', answer: '6', hint: 'Tambah 3 sebanyak 2 kali.', explanation: '2 x 3 = 3 + 3 = 6.', operands: [2, 3] },
  { skill: 'fakta_darab_lima', q: 'Berapakah hasil darab 5 dengan 4?', answer: '20', hint: 'Kira lima-lima sebanyak 4 kali.', explanation: '5 x 4 = 20.', operands: [5, 4] },
  { skill: 'fakta_darab_sepuluh', q: 'Cari hasil bagi 10 x 6.', answer: '60', hint: 'Enam kumpulan sepuluh bersamaan dengan 6 puluh.', explanation: '10 x 6 = 60.', operands: [10, 6] },
  { skill: 'fakta_darab_tiga', q: 'Selesaikan 3 x 4.', answer: '12', hint: 'Gunakan 4 + 4 + 4.', explanation: '3 x 4 = 4 + 4 + 4 = 12.', operands: [3, 4] },
  { skill: 'fakta_darab_empat', q: 'Nyatakan jawapan bagi 4 x 6.', answer: '24', hint: 'Gandakan fakta 2 x 6.', explanation: '2 x 6 = 12; gandakan 12 menjadi 24. Maka, 4 x 6 = 24.', operands: [4, 6] },
  { skill: 'darab_satu', q: 'Apakah hasil 1 x 8?', answer: '8', hint: 'Satu kumpulan lapan mempunyai 8 objek.', explanation: 'Sebarang nombor yang didarab dengan 1 kekal nilainya. 1 x 8 = 8.', operands: [1, 8] },
  { skill: 'darab_sifar', q: 'Lengkapkan 0 x 9 = ___.', answer: '0', accepted: ['0', 'sifar'], hint: 'Sifar kumpulan bermaksud tiada objek.', explanation: '0 x 9 = 0 kerana tiada kumpulan sembilan.', operands: [0, 9], questionType: 'fill_blank' },
  { skill: 'fakta_darab_tujuh_dua', q: 'Kira 7 x 2.', answer: '14', hint: 'Tambah 2 sebanyak 7 kali atau gandakan 7.', explanation: '7 x 2 = 14.', operands: [7, 2] },
  { skill: 'fakta_darab_lima_lapan', q: 'Apakah hasil bagi 5 x 8?', answer: '40', hint: 'Kira lima-lima: 5, 10, 15 hingga 40.', explanation: '5 x 8 = 40.', operands: [5, 8] },
  { skill: 'fakta_darab_sembilan_sepuluh', q: 'Berapakah 9 x 10?', answer: '90', hint: 'Sembilan kumpulan sepuluh bersamaan dengan 9 puluh.', explanation: '9 x 10 = 90.', operands: [9, 10] },

  { skill: 'darab_sebagai_tambah_berulang', q: 'Tulis 4 + 4 + 4 sebagai ayat darab dan nyatakan jumlahnya.', answer: '3 x 4 = 12', accepted: ['3 x 4 = 12', '12'], hint: 'Terdapat 3 sebutan yang masing-masing bernilai 4.', explanation: '4 ditambah sebanyak 3 kali, jadi 4 + 4 + 4 = 3 x 4 = 12.', operands: [3, 4], questionType: 'structured', marks: 2 },
  { skill: 'kumpulan_sama_banyak', q: 'Lima kumpulan mempunyai 2 objek setiap satu. Tulis ayat darab dan jumlah objek.', answer: '5 x 2 = 10', accepted: ['5 x 2 = 10', '10'], hint: 'Darabkan bilangan kumpulan dengan objek setiap kumpulan.', explanation: '5 kumpulan x 2 objek = 10 objek.', operands: [5, 2], questionType: 'structured', marks: 2 },
  { skill: 'sifat_kalis_tukar_tertib_darab', q: 'Adakah 3 x 7 dan 7 x 3 memberikan hasil yang sama? Nyatakan hasilnya.', answer: 'Ya, kedua-duanya menghasilkan 21.', accepted: ['Ya, kedua-duanya menghasilkan 21.', 'ya, 21', '21'], hint: 'Menukar tertib dua faktor tidak mengubah hasil darab.', explanation: '3 x 7 = 21 dan 7 x 3 = 21. Kedua-duanya mempunyai hasil yang sama.', operands: [3, 7], calculations: [[3, 7], [7, 3]], questionType: 'structured', marks: 2 },
  { skill: 'pola_darab_sepuluh', q: 'Terangkan pola bagi 6 x 10 dan nyatakan jawapannya.', answer: '60; darab 10 menghasilkan 6 puluh.', accepted: ['60; darab 10 menghasilkan 6 puluh.', '60'], hint: 'Lihat nilai tempat apabila 6 didarab dengan 10.', explanation: '6 x 10 = 60, iaitu 6 sa menjadi 6 puluh.', operands: [6, 10], questionType: 'structured', marks: 2 },
  { skill: 'memahami_identiti_satu', q: 'Mengapakah 9 x 1 masih bernilai 9?', answer: 'Kerana satu kumpulan 9 mengandungi 9 objek.', accepted: ['Kerana satu kumpulan 9 mengandungi 9 objek.', 'satu kumpulan 9 ialah 9', '9'], hint: 'Fikirkan maksud satu kumpulan.', explanation: '1 kumpulan yang mempunyai 9 objek tetap berjumlah 9. Oleh itu, 9 x 1 = 9.', operands: [9, 1], questionType: 'structured', marks: 2 },
  { skill: 'memahami_sifat_sifar', q: 'Mengapakah 8 x 0 bersamaan dengan 0?', answer: 'Kerana setiap kumpulan mengandungi 0 objek, jumlahnya 0.', accepted: ['Kerana setiap kumpulan mengandungi 0 objek, jumlahnya 0.', 'tiada objek, 0', '0'], hint: 'Bayangkan 8 kumpulan kosong.', explanation: 'Lapan kumpulan yang setiap satunya kosong masih mempunyai 0 objek. Maka, 8 x 0 = 0.', operands: [8, 0], questionType: 'structured', marks: 2 },
  { skill: 'tatasusunan_baris_lajur', q: 'Satu tatasusunan mempunyai 4 baris dengan 5 objek pada setiap baris. Berapakah jumlah objek?', answer: '20 objek', accepted: ['20 objek', '20', '4 x 5 = 20'], hint: 'Darabkan bilangan baris dengan objek setiap baris.', explanation: '4 baris x 5 objek = 20 objek.', operands: [4, 5], questionType: 'structured', marks: 2 },
  { skill: 'darab_pada_garis_nombor', q: 'Garis nombor menunjukkan 0, 3, 6, 9, 12. Apakah ayat darab bagi 4 lompatan sama besar?', answer: '4 x 3 = 12', accepted: ['4 x 3 = 12', '12'], hint: 'Setiap lompatan bernilai 3 dan terdapat 4 lompatan.', explanation: 'Empat lompatan bernilai 3 memberikan 4 x 3 = 12.', operands: [4, 3], questionType: 'structured', marks: 2 },
  { skill: 'strategi_ganda_dua_ke_empat', q: 'Gunakan fakta 2 x 6 = 12 untuk menerangkan 4 x 6.', answer: '24; gandakan 12.', accepted: ['24; gandakan 12.', '24'], hint: 'Empat kumpulan ialah dua kali bilangan dua kumpulan.', explanation: '4 x 6 ialah dua kali 2 x 6. Gandakan 12 untuk mendapat 24.', operands: [4, 6], questionType: 'structured', marks: 2 },
  { skill: 'faktor_hilang_lima', q: 'Lengkapkan 5 x ___ = 35.', answer: '7', hint: 'Kira lima-lima sehingga 35.', explanation: '5 x 7 = 35, jadi faktor yang hilang ialah 7.', operands: [5, 7], numericAnswer: 7, questionType: 'fill_blank', marks: 2 },

  { skill: 'fakta_darab_enam_tujuh', q: 'Hitung 6 x 7.', answer: '42', hint: 'Gunakan 5 x 7 kemudian tambah satu lagi 7.', explanation: '5 x 7 = 35 dan 35 + 7 = 42. Jadi, 6 x 7 = 42.', operands: [6, 7] },
  { skill: 'fakta_darab_lapan_empat', q: 'Selesaikan 8 x 4.', answer: '32', hint: 'Gandakan 4 x 4.', explanation: '4 x 4 = 16 dan dua kali 16 ialah 32. Maka, 8 x 4 = 32.', operands: [8, 4] },
  { skill: 'fakta_darab_sembilan_lima', q: 'Cari hasil darab 9 x 5.', answer: '45', hint: 'Kira lima-lima sebanyak 9 kali.', explanation: '9 x 5 = 45.', operands: [9, 5] },
  { skill: 'fakta_darab_tujuh_lapan', q: 'Berapakah hasil 7 x 8?', answer: '56', hint: 'Gunakan 5 x 8 dan 2 x 8.', explanation: '5 x 8 = 40 dan 2 x 8 = 16. 40 + 16 = 56.', operands: [7, 8] },
  { skill: 'fakta_darab_sepuluh_sepuluh', q: 'Lengkapkan 10 x 10 = ___.', answer: '100', hint: 'Sepuluh kumpulan sepuluh membentuk satu ratus.', explanation: '10 x 10 = 100.', operands: [10, 10], questionType: 'fill_blank' },
  { skill: 'masalah_kotak_pensel', q: 'Terdapat 6 kotak dan setiap kotak mengandungi 8 pensel. Berapakah jumlah pensel?', answer: '48 pensel', accepted: ['48 pensel', '48'], hint: 'Darabkan 6 kotak dengan 8 pensel.', explanation: '6 x 8 = 48. Jumlahnya 48 pensel.', operands: [6, 8], questionType: 'structured', marks: 2 },
  { skill: 'masalah_dulang_kuih', q: 'Lima dulang mempunyai 7 kuih pada setiap dulang. Hitung jumlah kuih.', answer: '35 kuih', accepted: ['35 kuih', '35'], hint: 'Setiap dulang mempunyai bilangan yang sama.', explanation: '5 x 7 = 35. Terdapat 35 kuih.', operands: [5, 7], questionType: 'structured', marks: 2 },
  { skill: 'masalah_baris_kerusi', q: 'Empat baris kerusi mempunyai 9 kerusi pada setiap baris. Berapakah jumlah kerusi?', answer: '36 kerusi', accepted: ['36 kerusi', '36'], hint: 'Darabkan bilangan baris dengan kerusi setiap baris.', explanation: '4 x 9 = 36. Jumlahnya 36 kerusi.', operands: [4, 9], questionType: 'structured', marks: 2 },
  { skill: 'masalah_bacaan_harian', q: 'Amin membaca 3 halaman sehari selama 7 hari. Berapakah jumlah halaman yang dibaca?', answer: '21 halaman', accepted: ['21 halaman', '21'], hint: 'Darabkan halaman sehari dengan bilangan hari.', explanation: '7 x 3 = 21. Amin membaca 21 halaman.', operands: [7, 3], questionType: 'structured', marks: 2 },
  { skill: 'masalah_bungkusan_pelekat', q: 'Ada 8 bungkusan dan setiap bungkusan mengandungi 5 pelekat. Cari jumlah pelekat.', answer: '40 pelekat', accepted: ['40 pelekat', '40'], hint: 'Gunakan fakta sifir 5.', explanation: '8 x 5 = 40. Jumlahnya 40 pelekat.', operands: [8, 5], questionType: 'structured', marks: 2 },
  { skill: 'tambah_berulang_kepada_darab', q: 'Tulis 6 + 6 + 6 + 6 sebagai ayat darab dan selesaikan.', answer: '4 x 6 = 24', accepted: ['4 x 6 = 24', '24'], hint: 'Terdapat empat sebutan 6.', explanation: '6 ditambah 4 kali, maka 6 + 6 + 6 + 6 = 4 x 6 = 24.', operands: [4, 6], questionType: 'structured', marks: 2 },
  { skill: 'faktor_pertama_hilang', q: 'Isi faktor yang hilang: ___ x 4 = 32.', answer: '8', hint: 'Cari bilangan kumpulan 4 yang menghasilkan 32.', explanation: '8 x 4 = 32, jadi faktor yang hilang ialah 8.', operands: [8, 4], numericAnswer: 8, questionType: 'fill_blank', marks: 2 },
  { skill: 'faktor_kedua_hilang', q: 'Lengkapkan 6 x ___ = 54.', answer: '9', hint: 'Kira enam-enam sehingga 54.', explanation: '6 x 9 = 54, jadi faktor yang hilang ialah 9.', operands: [6, 9], numericAnswer: 9, questionType: 'fill_blank', marks: 2 },
  { skill: 'mewakilkan_kumpulan', q: 'Tujuh bakul mengandungi 5 epal setiap satu. Nyatakan ayat darab dan jumlah epal.', answer: '7 x 5 = 35 epal', accepted: ['7 x 5 = 35 epal', '7 x 5 = 35', '35'], hint: 'Bilangan bakul ialah bilangan kumpulan.', explanation: '7 bakul x 5 epal = 35 epal.', operands: [7, 5], questionType: 'structured', marks: 2 },
  { skill: 'masalah_wang_kumpulan_sama', q: 'Enam sampul mengandungi RM5 setiap satu. Berapakah jumlah wang?', answer: 'RM30', accepted: ['RM30', 'RM 30', '30'], hint: 'Darabkan 6 dengan RM5.', explanation: '6 x RM5 = RM30.', operands: [6, 5], questionType: 'structured', marks: 2 },

  { skill: 'analisis_tambah_faktor', q: 'Hana menulis 6 x 4 = 10 kerana menambah 6 + 4. Kenal pasti kesilapan dan berikan jawapan betul.', answer: 'Darab bukan sekadar menambah dua faktor; jawapan yang betul ialah 24.', accepted: ['Darab bukan sekadar menambah dua faktor; jawapan yang betul ialah 24.', '6 x 4 = 24', '24'], hint: 'Tambah 4 sebanyak 6 kali.', explanation: '6 x 4 bermaksud 4 + 4 + 4 + 4 + 4 + 4, iaitu 24, bukan 10.', operands: [6, 4], questionType: 'structured', marks: 2 },
  { skill: 'analisis_tambah_berulang_salah', q: 'Amir mengatakan 5 + 5 + 5 + 5 ialah 5 x 5. Betulkan ayat darab dan hasilnya.', answer: 'Ayat yang betul ialah 4 x 5 = 20.', accepted: ['Ayat yang betul ialah 4 x 5 = 20.', '4 x 5 = 20', '20'], hint: 'Kira bilangan sebutan 5.', explanation: 'Terdapat empat sebutan 5, jadi ayat yang betul ialah 4 x 5 = 20.', operands: [4, 5], questionType: 'structured', marks: 2 },
  { skill: 'analisis_tatasusunan', q: 'Satu tatasusunan mempunyai 3 baris dan 8 objek setiap baris. Jelaskan ayat darabnya.', answer: '3 x 8 = 24', accepted: ['3 x 8 = 24', '24'], hint: 'Baris menunjukkan bilangan kumpulan.', explanation: 'Tiga baris dengan 8 objek setiap baris diwakili oleh 3 x 8 = 24.', operands: [3, 8], questionType: 'structured', marks: 2 },
  { skill: 'analisis_faktor_hilang_tujuh', q: 'Nilai apakah yang melengkapkan ayat 7 x ___ = 49?', answer: 'Faktor yang hilang ialah 7.', accepted: ['Faktor yang hilang ialah 7.', '7'], hint: 'Gunakan fakta kuasa dua 7.', explanation: '7 x 7 = 49, jadi faktor yang hilang ialah 7.', operands: [7, 7], numericAnswer: 7, questionType: 'fill_blank', marks: 2 },
  { skill: 'analisis_faktor_hilang_sembilan', q: 'Cari faktor yang hilang dalam ___ x 9 = 54.', answer: '6', hint: 'Gunakan hubungan 9 + 9 + 9 + 9 + 9 + 9.', explanation: '6 x 9 = 54, jadi faktor yang hilang ialah 6.', operands: [6, 9], numericAnswer: 6, questionType: 'fill_blank', marks: 2 },
  { skill: 'analisis_pernyataan_darab_benar', q: 'Pilih pengiraan yang betul: A. 8 x 6 = 48 atau B. 8 x 6 = 42. Jelaskan pilihanmu.', answer: 'A betul kerana 8 x 6 = 48.', accepted: ['A betul kerana 8 x 6 = 48.', 'A, 48', '48'], hint: 'Gunakan 4 x 6 kemudian gandakan.', explanation: '4 x 6 = 24 dan dua kali 24 ialah 48. Jadi, pilihan A betul.', operands: [8, 6], questionType: 'structured', marks: 2 },
  { skill: 'membandingkan_dua_hasil_darab', q: 'Bandingkan 6 x 7 dengan 8 x 5. Pengiraan manakah lebih besar dan berapa bezanya?', answer: '6 x 7 lebih besar; hasilnya 42 dan bezanya 2.', accepted: ['6 x 7 lebih besar; hasilnya 42 dan bezanya 2.', '42, beza 2'], hint: 'Cari kedua-dua hasil darab.', explanation: '6 x 7 = 42 dan 8 x 5 = 40. Hasil pertama lebih besar sebanyak 2.', operands: [6, 7], numericAnswer: 42, calculations: [[6, 7], [8, 5]], questionType: 'structured', marks: 3 },
  { skill: 'menganalisis_hasil_setara', q: 'Adakah 4 x 9 dan 6 x 6 mempunyai hasil yang sama? Buktikan.', answer: 'Ya, kedua-duanya menghasilkan 36.', accepted: ['Ya, kedua-duanya menghasilkan 36.', 'ya, 36', '36'], hint: 'Kira kedua-dua fakta darab.', explanation: '4 x 9 = 36 dan 6 x 6 = 36. Oleh itu, hasil darabnya sama.', operands: [4, 9], numericAnswer: 36, calculations: [[4, 9], [6, 6]], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_bilangan_kumpulan', q: 'Sebanyak 45 manik dimasukkan sama banyak, 5 manik dalam setiap beg. Berapakah bilangan beg supaya ayat darabnya menghasilkan 45?', answer: '9 beg', accepted: ['9 beg', '9', '9 x 5 = 45'], hint: 'Cari faktor yang didarab dengan 5 untuk mendapat 45.', explanation: '9 x 5 = 45, jadi diperlukan 9 beg.', operands: [9, 5], numericAnswer: 9, questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_darab_tiga_faktor', q: 'Ada 3 kotak. Setiap kotak mempunyai 4 beg dan setiap beg mempunyai 2 guli. Berapakah jumlah guli?', answer: '24 guli', accepted: ['24 guli', '24'], hint: 'Darabkan 3 x 4 x 2.', explanation: '3 x 4 = 12 beg dan 12 x 2 = 24 guli.', operands: [3, 4, 2], questionType: 'structured', marks: 3 },
  { skill: 'mengenal_maklumat_tidak_relevan_darab', q: 'Terdapat 7 kotak dengan 6 pensel dalam setiap kotak. Kotak itu mempunyai 3 warna. Maklumat manakah tidak diperlukan dan berapakah jumlah pensel?', answer: 'Maklumat 3 warna tidak diperlukan; jumlahnya 42 pensel.', accepted: ['Maklumat 3 warna tidak diperlukan; jumlahnya 42 pensel.', '3 warna, 42 pensel', '42'], hint: 'Gunakan bilangan kotak dan pensel setiap kotak.', explanation: 'Warna kotak tidak mempengaruhi jumlah pensel. 7 x 6 = 42 pensel.', operands: [7, 6], questionType: 'structured', marks: 3 },
  { skill: 'menyusun_mengikut_hasil_darab', q: 'Susun 5 x 5, 4 x 8 dan 3 x 9 daripada hasil paling kecil kepada paling besar.', answer: '5 x 5 = 25, 3 x 9 = 27, 4 x 8 = 32', accepted: ['5 x 5 = 25, 3 x 9 = 27, 4 x 8 = 32', '25, 27, 32'], hint: 'Cari ketiga-tiga hasil dahulu.', explanation: '5 x 5 = 25, 3 x 9 = 27 dan 4 x 8 = 32. Tertib menaiknya ialah 25, 27, 32.', operands: [5, 5], numericAnswer: 25, calculations: [[5, 5], [4, 8], [3, 9]], questionType: 'ordering', marks: 3 },
  { skill: 'menganalisis_kalis_tukar_tertib', q: 'Rina berkata 3 x 8 dan 8 x 3 mewakili susunan berbeza tetapi jumlah objek sama. Adakah dia betul?', answer: 'Ya; kedua-duanya menghasilkan 24.', accepted: ['Ya; kedua-duanya menghasilkan 24.', 'ya, 24', '24'], hint: 'Bandingkan bilangan baris dan lajur.', explanation: '3 x 8 dan 8 x 3 mempunyai orientasi tatasusunan berbeza, tetapi kedua-duanya berjumlah 24.', operands: [3, 8], calculations: [[3, 8], [8, 3]], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_fakta_berkaitan', q: 'Diketahui 5 x 7 = 35. Gunakan fakta itu untuk mendapatkan 10 x 7.', answer: '70; gandakan 35.', accepted: ['70; gandakan 35.', '70'], hint: 'Sepuluh ialah dua kali lima.', explanation: '10 x 7 ialah dua kali 5 x 7. Dua kali 35 ialah 70.', operands: [10, 7], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_dua_kaedah_darab', q: 'Bagi 9 x 6, Kaedah A menggunakan (10 x 6) - 6 dan Kaedah B menggunakan 9 + 6. Tentukan kaedah yang tepat.', answer: 'Kaedah A tepat; hasilnya 54.', accepted: ['Kaedah A tepat; hasilnya 54.', 'A, 54', '54'], hint: 'Sembilan kumpulan ialah satu kumpulan kurang daripada sepuluh kumpulan.', explanation: '10 x 6 = 60 dan 60 - 6 = 54. Oleh itu, Kaedah A tepat untuk 9 x 6.', operands: [9, 6], questionType: 'structured', marks: 2 },

  { skill: 'menilai_ketepatan_fakta_darab', q: 'Ravi berkata 7 x 7 = 49. Nilai pernyataannya dan berikan bukti.', answer: 'Pernyataan Ravi betul kerana 7 x 7 = 49.', accepted: ['Pernyataan Ravi betul kerana 7 x 7 = 49.', 'betul, 49', '49'], hint: 'Gunakan fakta 5 x 7 dan 2 x 7.', explanation: '5 x 7 = 35 dan 2 x 7 = 14. 35 + 14 = 49, maka Ravi betul.', operands: [7, 7], questionType: 'structured', marks: 2 },
  { skill: 'menilai_jawapan_darab_salah', q: 'Mira menyatakan 8 x 9 = 64. Adakah jawapannya tepat? Betulkan jika perlu.', answer: 'Tidak tepat; jawapan yang betul ialah 72.', accepted: ['Tidak tepat; jawapan yang betul ialah 72.', 'tidak, 72', '72'], hint: 'Gunakan 8 x 10 kemudian tolak 8.', explanation: '8 x 10 = 80 dan 80 - 8 = 72. Oleh itu, 8 x 9 = 72, bukan 64.', operands: [8, 9], questionType: 'structured', marks: 2 },
  { skill: 'menilai_strategi_darab_cekap', q: 'Untuk 5 x 8, pilih strategi lebih cekap: A. kira lapan-lapan lima kali atau B. cari separuh daripada 10 x 8. Nyatakan jawapan.', answer: 'Strategi B lebih cekap; separuh daripada 80 ialah 40.', accepted: ['Strategi B lebih cekap; separuh daripada 80 ialah 40.', 'B, 40', '40'], hint: 'Lima ialah separuh daripada sepuluh.', explanation: '10 x 8 = 80 dan separuh daripada 80 ialah 40. Jadi, 5 x 8 = 40.', operands: [5, 8], questionType: 'structured', marks: 2 },
  { skill: 'menilai_kemunasabahan_darab', q: 'Tentukan sama ada 9 kumpulan yang setiap satunya mempunyai 10 objek boleh berjumlah lebih daripada 100. Berikan jumlah sebenar.', answer: 'Tidak; jumlah sebenar ialah 90.', accepted: ['Tidak; jumlah sebenar ialah 90.', 'tidak, 90', '90'], hint: 'Gunakan 9 x 10.', explanation: '9 x 10 = 90. Oleh itu, jumlahnya tidak melebihi 100.', operands: [9, 10], questionType: 'structured', marks: 2 },
  { skill: 'menilai_operasi_darab_dalam_masalah', q: 'Enam beg mengandungi 7 epal setiap satu. Seorang murid menggunakan 6 + 7. Nilai pilihan itu dan cari jumlah epal.', answer: 'Operasi tambah dua faktor tidak tepat; 6 x 7 = 42 epal.', accepted: ['Operasi tambah dua faktor tidak tepat; 6 x 7 = 42 epal.', 'darab, 42', '42'], hint: 'Kumpulan sama banyak diwakili oleh operasi darab.', explanation: 'Terdapat 6 kumpulan yang masing-masing mempunyai 7 epal. Operasi yang tepat ialah 6 x 7 = 42.', operands: [6, 7], questionType: 'structured', marks: 3 },

  { skill: 'mencipta_ayat_darab', q: 'Mencipta: Bina satu ayat darab menggunakan faktor 8 dan 7, kemudian nyatakan hasilnya.', answer: '8 x 7 = 56', accepted: ['8 x 7 = 56', '7 x 8 = 56', '56'], hint: 'Gunakan kedua-dua faktor dan tanda sama dengan.', explanation: 'Satu ayat darab yang tepat ialah 8 x 7 = 56. Tertib faktor boleh ditukar.', operands: [8, 7], questionType: 'structured', marks: 2, rubric: CONSTRUCT_MULTIPLICATION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [8, 7, 56] } },
  { skill: 'mencipta_faktor_hilang', q: 'Mencipta: Bina ayat darab yang menghasilkan 45 dengan 5 sebagai satu faktor. Tentukan faktor yang satu lagi.', answer: '9 x 5 = 45', accepted: ['9 x 5 = 45', '5 x 9 = 45', '9'], hint: 'Cari bilangan kumpulan lima yang menghasilkan 45.', explanation: 'Faktor yang satu lagi ialah 9 kerana 9 x 5 = 45.', operands: [9, 5], numericAnswer: 9, questionType: 'structured', marks: 2, rubric: CONSTRUCT_MULTIPLICATION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [9, 5, 45] } },
  { skill: 'mencipta_tambah_berulang', q: 'Mencipta: Tunjukkan 6 x 4 sebagai tambah berulang dan nyatakan hasilnya.', answer: '4 + 4 + 4 + 4 + 4 + 4 = 24', accepted: ['4 + 4 + 4 + 4 + 4 + 4 = 24', '6 x 4 = 24', '24'], hint: 'Tulis 4 sebanyak 6 kali.', explanation: 'Enam kumpulan empat boleh ditulis sebagai 4 + 4 + 4 + 4 + 4 + 4 = 24.', operands: [6, 4], questionType: 'structured', marks: 2, rubric: CONSTRUCT_MULTIPLICATION_RUBRIC, responseRules: { responseKind: 'representation', requiredNumbers: [6, 4, 24] } },
  { skill: 'mencipta_masalah_darab', q: 'Mencipta: Bina satu masalah cerita yang menggunakan 5 x 8 dan mempunyai jawapan 40.', answer: 'Lima bakul mengandungi 8 biji oren setiap satu. Jumlah oren ialah 40 biji.', accepted: ['Lima bakul mengandungi 8 biji oren setiap satu. Jumlah oren ialah 40 biji.'], hint: 'Gunakan situasi lima kumpulan yang setiap satunya mempunyai lapan objek.', explanation: 'Cerita boleh berbeza asalkan mempunyai 5 kumpulan sama banyak, 8 objek setiap kumpulan dan jumlah 40.', operands: [5, 8], questionType: 'structured', marks: 3, rubric: CREATE_STORY_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [5, 8, 40], semanticCues: ['setiap', 'setiap satu', 'kumpulan', 'bakul', 'kotak', 'baris'] } },
  { skill: 'mencipta_tatasusunan_darab', q: 'Mencipta: Terangkan satu tatasusunan yang mewakili 4 x 6 dan nyatakan jumlah objek.', answer: 'Tatasusunan mempunyai 4 baris dengan 6 objek setiap baris, berjumlah 24 objek.', accepted: ['Tatasusunan mempunyai 4 baris dengan 6 objek setiap baris, berjumlah 24 objek.', '4 baris, 6 setiap baris, 24'], hint: 'Nyatakan bilangan baris, objek setiap baris dan jumlah.', explanation: 'Tatasusunan 4 baris dengan 6 objek setiap baris mewakili 4 x 6 = 24.', operands: [4, 6], questionType: 'structured', marks: 2, rubric: CONSTRUCT_MULTIPLICATION_RUBRIC, responseRules: { responseKind: 'array', requiredNumbers: [4, 6, 24] } }
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

function multiplicationResult(operands = []) {
  return operands.reduce((result, value) => result * value, 1);
}

export const mathDarabQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  const calculations = item.calculations || [item.operands];
  const calculationResults = calculations.map(multiplicationResult);
  return Object.freeze({
    id: `MATH-DARAB-PILOT-${String(index + 1).padStart(3, '0')}`,
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
      category: 'darab',
      assessmentCategory: 'pbd_matematik',
      operation: 'multiplication',
      numberVariationPolicy: 'authored_locked',
      skill: item.skill,
      set: `darab_pilot_${index + 1}`,
      calculations,
      calculationResults,
      numericAnswer: Number.isFinite(item.numericAnswer) ? item.numericAnswer : calculationResults[0]
    }
  });
}));

export function enrichMathDarabTopic(subject) {
  return {
    ...subject,
    curriculumFramework: MATH_YEAR_TWO_FRAMEWORK,
    topics: (subject.topics || []).map(topic => topic.id === 'darab' ? {
      ...topic,
      note: 'Memahami darab sebagai kumpulan sama banyak dan tambah berulang, serta menguasai fakta darab hingga 10 x 10.',
      learningObjective: 'Murid dapat memahami konsep darab dan menggunakan fakta asas darab hingga 10 x 10 dalam pelbagai perwakilan dan situasi.',
      learningOutcome: 'Murid dapat mewakilkan, menghitung, melengkapkan faktor, menyelesaikan masalah serta menilai dan menerangkan strategi darab dengan tepat.',
      contentStatus: 'pilot',
      defaultQuestionType: 'short_answer',
      defaultMarks: 1,
      assessmentFramework: MATH_YEAR_TWO_FRAMEWORK,
      questions: mathDarabQuestions
    } : topic)
  };
}

export default mathDarabQuestions;
