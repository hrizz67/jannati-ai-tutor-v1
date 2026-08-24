import { MATH_YEAR_TWO_FRAMEWORK } from './mathNomborQuestions.js';

const CONSTRUCT_DIVISION_RUBRIC = Object.freeze({
  totalMarks: 2,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua nombor atau syarat yang diberikan.', marks: 1 },
    { criterion: 'Membina perwakilan bahagi dan jawapan yang tepat.', marks: 1 }
  ])
});

const CREATE_DIVISION_STORY_RUBRIC = Object.freeze({
  totalMarks: 3,
  criteria: Object.freeze([
    { criterion: 'Menggunakan jumlah dan pembahagi yang diberikan.', marks: 1 },
    { criterion: 'Membina situasi sama rata atau kumpulan sama banyak yang jelas.', marks: 1 },
    { criterion: 'Menyatakan hasil bahagi dengan unit yang tepat.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'fakta_bahagi_dua', q: 'Hitung 12 ÷ 2.', answer: 'Hasil bahagi 12 ÷ 2 ialah 6.', accepted: ['Hasil bahagi 12 ÷ 2 ialah 6.', '6'], hint: 'Cari fakta darab 2 yang menghasilkan 12.', explanation: '2 × 6 = 12, maka 12 ÷ 2 = 6.', operands: [12, 2] },
  { skill: 'fakta_bahagi_tiga', q: 'Berapakah hasil bahagi 15 dengan 3?', answer: '5', hint: 'Tentukan bilangan kumpulan 3 dalam 15.', explanation: '3 × 5 = 15, jadi 15 ÷ 3 = 5.', operands: [15, 3] },
  { skill: 'fakta_bahagi_empat', q: 'Cari hasil bagi 20 ÷ 4.', answer: 'Hasil bagi 20 ÷ 4 ialah 5.', accepted: ['Hasil bagi 20 ÷ 4 ialah 5.', '5'], hint: 'Gunakan fakta 4 × 5.', explanation: '4 × 5 = 20, maka 20 ÷ 4 = 5.', operands: [20, 4] },
  { skill: 'fakta_bahagi_lima', q: 'Selesaikan 25 ÷ 5.', answer: '25 dibahagi dengan 5 menghasilkan 5.', accepted: ['25 dibahagi dengan 5 menghasilkan 5.', '5'], hint: 'Kira lima-lima sehingga 25.', explanation: 'Terdapat 5 kumpulan lima dalam 25. Oleh itu, 25 ÷ 5 = 5.', operands: [25, 5] },
  { skill: 'fakta_bahagi_tiga_puluh', q: 'Nyatakan jawapan bagi 30 ÷ 5.', answer: 'Jawapan bagi 30 ÷ 5 ialah 6.', accepted: ['Jawapan bagi 30 ÷ 5 ialah 6.', '6'], hint: 'Apakah nombor yang didarab dengan 5 menjadi 30?', explanation: '5 × 6 = 30, jadi 30 ÷ 5 = 6.', operands: [30, 5] },
  { skill: 'fakta_bahagi_lapan_belas', q: 'Apakah hasil 18 ÷ 3?', answer: 'Hasil 18 ÷ 3 ialah 6.', accepted: ['Hasil 18 ÷ 3 ialah 6.', '6'], hint: 'Gunakan hubungan songsang 3 × 6.', explanation: '3 × 6 = 18, maka 18 ÷ 3 = 6.', operands: [18, 3] },
  { skill: 'fakta_bahagi_dua_puluh_empat', q: 'Lengkapkan 24 ÷ 4 = ___.', answer: 'Nombor 6 melengkapkan 24 ÷ 4 = 6.', accepted: ['Nombor 6 melengkapkan 24 ÷ 4 = 6.', '6'], hint: 'Bahagikan 24 kepada empat bahagian sama banyak.', explanation: 'Setiap bahagian mempunyai 6 kerana 24 ÷ 4 = 6.', operands: [24, 4], questionType: 'fill_blank' },
  { skill: 'fakta_bahagi_sepuluh', q: 'Kira 40 ÷ 10.', answer: '4', hint: 'Kira bilangan puluh dalam 40.', explanation: 'Empat puluh mempunyai 4 kumpulan sepuluh. Jadi, 40 ÷ 10 = 4.', operands: [40, 10] },
  { skill: 'fakta_bahagi_enam_belas', q: 'Apakah hasil bagi 16 ÷ 2?', answer: '8', hint: 'Cari separuh daripada 16.', explanation: 'Separuh daripada 16 ialah 8, maka 16 ÷ 2 = 8.', operands: [16, 2] },
  { skill: 'fakta_bahagi_tiga_puluh_enam', q: 'Berapakah 36 dibahagi dengan 6?', answer: '36 dibahagi dengan 6 menghasilkan 6.', accepted: ['36 dibahagi dengan 6 menghasilkan 6.', '6'], hint: 'Gunakan fakta 6 × 6.', explanation: '6 × 6 = 36, jadi 36 ÷ 6 = 6.', operands: [36, 6] },

  { skill: 'memahami_kongsi_sama_rata', q: 'Dua belas pensel dikongsi sama rata antara 3 murid. Berapakah pensel yang diterima oleh setiap murid?', answer: '4 pensel', accepted: ['4 pensel', '4'], hint: 'Bahagikan jumlah pensel dengan bilangan murid.', explanation: '12 ÷ 3 = 4. Setiap murid menerima 4 pensel.', operands: [12, 3], questionType: 'structured', marks: 2 },
  { skill: 'memahami_bentuk_kumpulan', q: 'Dua puluh butang disusun dengan 4 butang dalam setiap kumpulan. Berapakah kumpulan yang dapat dibentuk?', answer: '5 kumpulan', accepted: ['5 kumpulan', '5'], hint: 'Cari bilangan kumpulan empat dalam 20.', explanation: '20 ÷ 4 = 5. Sebanyak 5 kumpulan dapat dibentuk.', operands: [20, 4], questionType: 'structured', marks: 2 },
  { skill: 'bahagi_sebagai_tolak_berulang', q: 'Tolak 3 berulang kali daripada 15 sehingga menjadi 0. Berapakah bilangan tolakan?', answer: '5 kali', accepted: ['5 kali', '5'], hint: 'Tulis 15, 12, 9, 6, 3, 0.', explanation: '3 ditolak sebanyak 5 kali untuk sampai kepada 0. Oleh itu, 15 ÷ 3 = 5.', operands: [15, 3], questionType: 'structured', marks: 2 },
  { skill: 'hubungan_songsang_darab_bahagi', q: 'Diketahui 7 × 6 = 42. Gunakan fakta itu untuk menerangkan 42 ÷ 7.', answer: '6 kerana 7 × 6 = 42.', accepted: ['6 kerana 7 × 6 = 42.', '6'], hint: 'Darab dan bahagi ialah operasi songsang.', explanation: 'Oleh sebab 7 × 6 = 42, maka 42 ÷ 7 = 6.', operands: [42, 7], questionType: 'structured', marks: 2 },
  { skill: 'keluarga_fakta_bahagi', q: 'Gunakan nombor 4, 8 dan 32 untuk menulis dua ayat bahagi.', answer: '32 ÷ 4 = 8 dan 32 ÷ 8 = 4', accepted: ['32 ÷ 4 = 8 dan 32 ÷ 8 = 4', '32 bahagi 4 = 8 dan 32 bahagi 8 = 4'], hint: 'Jumlah terbesar menjadi nombor yang dibahagi.', explanation: 'Daripada 4 × 8 = 32, dua ayat bahagi ialah 32 ÷ 4 = 8 dan 32 ÷ 8 = 4.', operands: [32, 4], calculations: [[32, 4], [32, 8]], questionType: 'structured', marks: 2 },
  { skill: 'sifar_dibahagi', q: 'Mengapakah 0 ÷ 7 bersamaan dengan 0?', answer: 'Kerana tiada objek untuk dikongsi; setiap kumpulan mendapat 0.', accepted: ['Kerana tiada objek untuk dikongsi; setiap kumpulan mendapat 0.', '0'], hint: 'Bayangkan sifar objek dikongsi kepada tujuh kumpulan.', explanation: 'Tiada objek yang boleh diagihkan, jadi setiap kumpulan mendapat 0. Maka, 0 ÷ 7 = 0.', operands: [0, 7], numericAnswer: 0, questionType: 'structured', marks: 2 },
  { skill: 'bahagi_dengan_satu', q: 'Terangkan mengapa 9 ÷ 1 masih bernilai 9.', answer: 'Kerana semua 9 objek berada dalam satu kumpulan.', accepted: ['Kerana semua 9 objek berada dalam satu kumpulan.', '9'], hint: 'Membahagi kepada satu kumpulan tidak mengubah jumlah.', explanation: 'Satu kumpulan menerima kesemua 9 objek. Oleh itu, 9 ÷ 1 = 9.', operands: [9, 1], questionType: 'structured', marks: 2 },
  { skill: 'bahagi_pada_garis_nombor', q: 'Pada garis nombor, bergerak ke belakang dari 24 ke 0 dengan lompatan 6. Berapakah lompatan diperlukan?', answer: '4 lompatan', accepted: ['4 lompatan', '4'], hint: 'Jejak 24, 18, 12, 6, 0.', explanation: 'Empat lompatan 6 membawa 24 kepada 0. Maka, 24 ÷ 6 = 4.', operands: [24, 6], questionType: 'structured', marks: 2 },
  { skill: 'mentafsir_hasil_bahagi', q: 'Dalam ayat 35 ÷ 5 = 7, apakah maksud 7 jika 35 guli dikongsi kepada 5 bekas?', answer: 'Setiap bekas mendapat 7 guli.', accepted: ['Setiap bekas mendapat 7 guli.', '7 guli', '7'], hint: 'Hasil bahagi menunjukkan bilangan dalam setiap bekas.', explanation: '35 ÷ 5 = 7 bermaksud setiap satu daripada 5 bekas mendapat 7 guli.', operands: [35, 5], questionType: 'structured', marks: 2 },
  { skill: 'pembahagi_hilang_asas', q: 'Apakah nombor yang melengkapkan 48 ÷ ___ = 8?', answer: 'Pembahagi yang hilang ialah 6.', accepted: ['Pembahagi yang hilang ialah 6.', '6'], hint: 'Cari nombor yang didarab dengan 8 menjadi 48.', explanation: '6 × 8 = 48, jadi 48 ÷ 6 = 8. Pembahagi yang hilang ialah 6.', operands: [48, 6], numericAnswer: 6, questionType: 'fill_blank', marks: 2 },

  { skill: 'fakta_bahagi_empat_puluh_dua', q: 'Hitung 42 ÷ 6.', answer: '7', hint: 'Gunakan fakta 6 × 7.', explanation: '6 × 7 = 42, maka 42 ÷ 6 = 7.', operands: [42, 6] },
  { skill: 'fakta_bahagi_empat_puluh_sembilan', q: 'Selesaikan 49 ÷ 7.', answer: 'Hasil bagi 49 ÷ 7 ialah 7.', accepted: ['Hasil bagi 49 ÷ 7 ialah 7.', '7'], hint: 'Gunakan fakta kuasa dua 7.', explanation: '7 × 7 = 49, jadi 49 ÷ 7 = 7.', operands: [49, 7] },
  { skill: 'fakta_bahagi_lima_puluh_enam', q: 'Cari hasil bahagi 56 dengan 8.', answer: '56 dibahagi dengan 8 menghasilkan 7.', accepted: ['56 dibahagi dengan 8 menghasilkan 7.', '7'], hint: 'Apakah nombor yang didarab dengan 8 menjadi 56?', explanation: '8 × 7 = 56, maka 56 ÷ 8 = 7.', operands: [56, 8] },
  { skill: 'fakta_bahagi_enam_puluh_tiga', q: 'Berapakah hasil bagi 63 ÷ 9?', answer: 'Jawapan bagi 63 ÷ 9 ialah 7.', accepted: ['Jawapan bagi 63 ÷ 9 ialah 7.', '7'], hint: 'Gunakan fakta 9 × 7.', explanation: '9 × 7 = 63, jadi 63 ÷ 9 = 7.', operands: [63, 9] },
  { skill: 'fakta_bahagi_tujuh_puluh_dua', q: 'Lengkapkan 72 ÷ 8 = ___.', answer: '9', hint: 'Cari fakta sifir 8 yang menghasilkan 72.', explanation: '8 × 9 = 72, maka 72 ÷ 8 = 9.', operands: [72, 8], questionType: 'fill_blank' },
  { skill: 'masalah_kongsi_pensel', q: 'Lima puluh empat batang pensel diagihkan sama rata kepada 6 kumpulan. Berapakah pensel dalam setiap kumpulan?', answer: '9 batang pensel', accepted: ['9 batang pensel', '9 pensel', '9'], hint: 'Bahagikan 54 dengan 6.', explanation: '54 ÷ 6 = 9. Setiap kumpulan mendapat 9 batang pensel.', operands: [54, 6], questionType: 'structured', marks: 2 },
  { skill: 'masalah_membentuk_kotak', q: 'Empat puluh mufin dimasukkan 5 biji ke dalam setiap kotak. Berapakah kotak diperlukan?', answer: '8 kotak', accepted: ['8 kotak', '8'], hint: 'Cari bilangan kumpulan lima dalam 40.', explanation: '40 ÷ 5 = 8. Sebanyak 8 kotak diperlukan.', operands: [40, 5], questionType: 'structured', marks: 2 },
  { skill: 'masalah_kongsi_pelekat', q: 'Aina membahagikan 45 pelekat sama rata kepada 9 orang rakan. Berapakah pelekat yang diterima setiap orang?', answer: '5 pelekat', accepted: ['5 pelekat', '5'], hint: 'Gunakan 45 ÷ 9.', explanation: '45 ÷ 9 = 5. Setiap orang menerima 5 pelekat.', operands: [45, 9], questionType: 'structured', marks: 2 },
  { skill: 'masalah_bacaan_harian_bahagi', q: 'Sebuah buku mempunyai 60 halaman untuk dibaca sama banyak dalam 10 hari. Berapakah halaman sehari?', answer: '6 halaman', accepted: ['6 halaman', '6'], hint: 'Bahagikan jumlah halaman dengan bilangan hari.', explanation: '60 ÷ 10 = 6. Murid perlu membaca 6 halaman sehari.', operands: [60, 10], questionType: 'structured', marks: 2 },
  { skill: 'masalah_wang_sama_rata', q: 'RM 40 dimasukkan sama banyak ke dalam 8 sampul. Berapakah nilai wang dalam setiap sampul?', answer: 'RM 5', accepted: ['RM 5', 'RM5', '5'], hint: 'Bahagikan RM 40 dengan 8.', explanation: '40 ÷ 8 = 5. Setiap sampul mengandungi RM 5.', operands: [40, 8], questionType: 'structured', marks: 2 },
  { skill: 'bahagi_daripada_tatasusunan', q: 'Satu tatasusunan mempunyai 32 objek dalam 4 baris sama banyak. Berapakah objek pada setiap baris?', answer: '8 objek', accepted: ['8 objek', '8'], hint: 'Bahagikan jumlah objek dengan bilangan baris.', explanation: '32 ÷ 4 = 8. Setiap baris mempunyai 8 objek.', operands: [32, 4], questionType: 'structured', marks: 2 },
  { skill: 'aplikasi_tolak_berulang', q: 'Gunakan tolak berulang untuk menentukan berapa kumpulan 4 terdapat dalam 28.', answer: '7 kumpulan', accepted: ['7 kumpulan', '7'], hint: 'Tolak 4 sehingga baki menjadi sifar.', explanation: '28, 24, 20, 16, 12, 8, 4, 0 menunjukkan 7 tolakan. Jadi, 28 ÷ 4 = 7.', operands: [28, 4], questionType: 'structured', marks: 2 },
  { skill: 'nombor_dibahagi_hilang', q: 'Isi nombor yang hilang: ___ ÷ 6 = 8.', answer: '48', hint: 'Darabkan hasil bahagi dengan pembahagi.', explanation: '8 × 6 = 48, maka 48 ÷ 6 = 8. Nombor yang hilang ialah 48.', operands: [48, 6], numericAnswer: 48, questionType: 'fill_blank', marks: 2 },
  { skill: 'pembahagi_hilang_sembilan', q: 'Tentukan pembahagi yang hilang dalam 63 ÷ ___ = 9.', answer: 'Pembahagi yang melengkapkan ayat ialah 7.', accepted: ['Pembahagi yang melengkapkan ayat ialah 7.', '7'], hint: 'Cari nombor yang didarab dengan 9 menjadi 63.', explanation: '7 × 9 = 63, jadi 63 ÷ 7 = 9. Pembahagi itu ialah 7.', operands: [63, 7], numericAnswer: 7, questionType: 'fill_blank', marks: 2 },
  { skill: 'membina_ayat_bahagi_daripada_cerita', q: 'Dua puluh tujuh gula-gula dikongsi sama rata kepada 3 kanak-kanak. Tulis ayat bahagi dan jawapan.', answer: '27 ÷ 3 = 9', accepted: ['27 ÷ 3 = 9', '27 bahagi 3 = 9', '9'], hint: 'Jumlah gula-gula menjadi nombor yang dibahagi.', explanation: '27 gula-gula dibahagi kepada 3 orang memberikan 27 ÷ 3 = 9.', operands: [27, 3], questionType: 'structured', marks: 2 },

  { skill: 'analisis_jawapan_bahagi_salah', q: 'Sara menulis 24 ÷ 4 = 8. Kenal pasti kesilapan dan berikan jawapan yang betul.', answer: 'Jawapan Sara salah; 24 ÷ 4 = 6.', accepted: ['Jawapan Sara salah; 24 ÷ 4 = 6.', 'salah, 6', '6'], hint: 'Semak menggunakan 4 × 6.', explanation: '4 × 6 = 24, bukannya 4 × 8. Oleh itu, 24 ÷ 4 = 6.', operands: [24, 4], questionType: 'structured', marks: 2 },
  { skill: 'analisis_bilangan_tolakan', q: 'Amir berkata 20 ÷ 5 memerlukan lima kali tolakan 5 untuk sampai kepada 0. Betulkan penerangannya.', answer: 'Hanya 4 kali tolakan diperlukan; 20 ÷ 5 = 4.', accepted: ['Hanya 4 kali tolakan diperlukan; 20 ÷ 5 = 4.', '4 kali', '4'], hint: 'Jejak 20, 15, 10, 5, 0.', explanation: 'Daripada 20 ke 0 terdapat 4 lompatan lima. Maka, 20 ÷ 5 = 4.', operands: [20, 5], questionType: 'structured', marks: 2 },
  { skill: 'membandingkan_dua_hasil_bahagi', q: 'Bandingkan 48 ÷ 6 dengan 45 ÷ 9. Pengiraan manakah lebih besar dan berapa bezanya?', answer: '48 ÷ 6 lebih besar; hasilnya 8 dan bezanya 3.', accepted: ['48 ÷ 6 lebih besar; hasilnya 8 dan bezanya 3.', '8, beza 3'], hint: 'Cari kedua-dua hasil bahagi dahulu.', explanation: '48 ÷ 6 = 8 dan 45 ÷ 9 = 5. Hasil pertama lebih besar sebanyak 3.', operands: [48, 6], numericAnswer: 8, calculations: [[48, 6], [45, 9]], questionType: 'structured', marks: 3 },
  { skill: 'menganalisis_hasil_bahagi_setara', q: 'Adakah 36 ÷ 6 dan 42 ÷ 7 mempunyai hasil yang sama? Buktikan.', answer: 'Ya, kedua-duanya menghasilkan 6.', accepted: ['Ya, kedua-duanya menghasilkan 6.', 'ya, 6', '6'], hint: 'Gunakan fakta darab 6 × 6 dan 7 × 6.', explanation: '36 ÷ 6 = 6 dan 42 ÷ 7 = 6. Oleh itu, kedua-duanya mempunyai hasil 6.', operands: [36, 6], calculations: [[36, 6], [42, 7]], questionType: 'structured', marks: 2 },
  { skill: 'menyusun_mengikut_hasil_bahagi', q: 'Susun 54 ÷ 9, 24 ÷ 6 dan 35 ÷ 7 daripada hasil paling kecil kepada paling besar.', answer: '24 ÷ 6 = 4, 35 ÷ 7 = 5, 54 ÷ 9 = 6', accepted: ['24 ÷ 6 = 4, 35 ÷ 7 = 5, 54 ÷ 9 = 6', '4, 5, 6'], hint: 'Kira setiap hasil sebelum menyusun.', explanation: '24 ÷ 6 = 4, 35 ÷ 7 = 5 dan 54 ÷ 9 = 6. Tertib menaiknya ialah 4, 5, 6.', operands: [24, 6], numericAnswer: 4, calculations: [[54, 9], [24, 6], [35, 7]], questionType: 'ordering', marks: 3 },
  { skill: 'maklumat_tidak_relevan_bahagi', q: 'Lima puluh enam krayon diagihkan sama rata ke dalam 8 kotak. Krayon itu terdiri daripada 4 warna. Maklumat manakah tidak diperlukan dan berapa krayon setiap kotak?', answer: 'Maklumat 4 warna tidak diperlukan; setiap kotak mendapat 7 krayon.', accepted: ['Maklumat 4 warna tidak diperlukan; setiap kotak mendapat 7 krayon.', '4 warna, 7 krayon', '7'], hint: 'Gunakan jumlah krayon dan bilangan kotak sahaja.', explanation: 'Warna tidak mempengaruhi pembahagian. 56 ÷ 8 = 7 krayon bagi setiap kotak.', operands: [56, 8], numericAnswer: 7, questionType: 'structured', marks: 3 },
  { skill: 'memilih_operasi_bahagi', q: 'Sebanyak 63 kad hendak diagihkan sama rata kepada 9 murid. Tentukan operasi yang sesuai dan cari jawapan.', answer: 'Gunakan bahagi; 63 ÷ 9 = 7 kad.', accepted: ['Gunakan bahagi; 63 ÷ 9 = 7 kad.', 'bahagi, 7 kad', '7'], hint: 'Situasi pengagihan sama rata menggunakan bahagi.', explanation: 'Jumlah 63 diagihkan kepada 9 murid, jadi 63 ÷ 9 = 7 kad setiap murid.', operands: [63, 9], questionType: 'structured', marks: 2 },
  { skill: 'analisis_model_kumpulan_salah', q: 'Satu model menunjukkan 30 bulatan dibahagi kepada 5 kumpulan, tetapi setiap kumpulan dilabel 5 bulatan. Adakah label itu tepat?', answer: 'Tidak tepat; setiap kumpulan sepatutnya mempunyai 6 bulatan.', accepted: ['Tidak tepat; setiap kumpulan sepatutnya mempunyai 6 bulatan.', 'tidak, 6', '6'], hint: 'Semak 30 ÷ 5.', explanation: '30 ÷ 5 = 6, maka setiap kumpulan perlu mempunyai 6 bulatan, bukan 5.', operands: [30, 5], questionType: 'structured', marks: 2 },
  { skill: 'membuktikan_dengan_operasi_songsang', q: 'Buktikan bahawa 56 ÷ 7 = 8 menggunakan operasi songsang.', answer: '7 × 8 = 56, jadi 56 ÷ 7 = 8.', accepted: ['7 × 8 = 56, jadi 56 ÷ 7 = 8.', '7 x 8 = 56', '8'], hint: 'Darabkan pembahagi dengan hasil bahagi.', explanation: 'Oleh sebab 7 × 8 = 56, pengiraan 56 ÷ 7 = 8 adalah tepat.', operands: [56, 7], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_saiz_kumpulan', q: 'Tujuh puluh dua bola dimasukkan sama banyak ke dalam 9 bakul. Tentukan bilangan bola dalam setiap bakul dan jelaskan.', answer: '8 bola kerana 72 ÷ 9 = 8.', accepted: ['8 bola kerana 72 ÷ 9 = 8.', '8 bola', '8'], hint: 'Cari fakta sifir 9 yang menghasilkan 72.', explanation: '9 × 8 = 72, maka 72 ÷ 9 = 8 bola dalam setiap bakul.', operands: [72, 9], questionType: 'structured', marks: 2 },
  { skill: 'membandingkan_makna_bahagi', q: 'Bandingkan dua situasi: 40 objek dibahagi kepada 5 kumpulan dan 40 objek disusun 5 objek setiap kumpulan. Nyatakan jawapan serta unit bagi kedua-duanya.', answer: 'Situasi pertama memberi 8 objek setiap kumpulan; situasi kedua membentuk 8 kumpulan.', accepted: ['Situasi pertama memberi 8 objek setiap kumpulan; situasi kedua membentuk 8 kumpulan.', '8 objek setiap kumpulan dan 8 kumpulan', '8'], hint: 'Hasil nombornya sama tetapi perkara yang dikira berbeza.', explanation: '40 ÷ 5 = 8. Dalam perkongsian, 8 ialah objek setiap kumpulan; dalam pengelompokan, 8 ialah bilangan kumpulan.', operands: [40, 5], questionType: 'structured', marks: 3 },
  { skill: 'menganalisis_jadual_darab_bahagi', q: 'Satu jadual menunjukkan 3 dulang × ___ kuih = 27 kuih. Gunakan maklumat itu untuk mencari kuih pada setiap dulang.', answer: '9 kuih', accepted: ['9 kuih', '9', '27 ÷ 3 = 9'], hint: 'Tukarkan ayat darab kepada ayat bahagi.', explanation: '27 ÷ 3 = 9, jadi setiap dulang mempunyai 9 kuih.', operands: [27, 3], questionType: 'structured', marks: 2 },
  { skill: 'analisis_tertib_nombor_bahagi', q: 'Rina menulis 5 ÷ 45 untuk mencari bilangan epal apabila 45 epal dibahagi kepada 5 bakul. Betulkan tertib nombornya dan selesaikan.', answer: 'Ayat yang betul ialah 45 ÷ 5 = 9 epal.', accepted: ['Ayat yang betul ialah 45 ÷ 5 = 9 epal.', '45 ÷ 5 = 9', '9'], hint: 'Jumlah asal ditulis dahulu dalam ayat bahagi.', explanation: 'Nombor yang dibahagi ialah jumlah 45. Oleh itu, 45 ÷ 5 = 9 epal.', operands: [45, 5], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_strategi_fakta_songsang', q: 'Untuk 81 ÷ 9, Kaedah A menggunakan fakta 9 × 9 = 81 manakala Kaedah B menambah 81 + 9. Tentukan kaedah yang tepat.', answer: 'Kaedah A tepat; hasil bahagi ialah 9.', accepted: ['Kaedah A tepat; hasil bahagi ialah 9.', 'A, 9', '9'], hint: 'Gunakan hubungan songsang antara darab dengan bahagi.', explanation: 'Fakta 9 × 9 = 81 membuktikan bahawa 81 ÷ 9 = 9. Jadi, Kaedah A tepat.', operands: [81, 9], questionType: 'structured', marks: 2 },
  { skill: 'menganalisis_pasangan_ayat_bahagi', q: 'Daripada fakta 6 × 10 = 60, tentukan dua ayat bahagi yang berkaitan dan hasil masing-masing.', answer: '60 ÷ 10 = 6 dan 60 ÷ 6 = 10', accepted: ['60 ÷ 10 = 6 dan 60 ÷ 6 = 10', '60 bahagi 10 = 6 dan 60 bahagi 6 = 10'], hint: 'Gunakan 60 sebagai nombor yang dibahagi.', explanation: 'Fakta 6 × 10 = 60 menghasilkan 60 ÷ 10 = 6 dan 60 ÷ 6 = 10.', operands: [60, 10], calculations: [[60, 10], [60, 6]], questionType: 'structured', marks: 2 },

  { skill: 'menilai_ketepatan_fakta_bahagi', q: 'Kumar berkata 64 ÷ 8 = 8. Nilai pernyataannya dan berikan bukti.', answer: 'Pernyataan Kumar betul kerana 8 × 8 = 64.', accepted: ['Pernyataan Kumar betul kerana 8 × 8 = 64.', 'betul, 8', '8'], hint: 'Semak dengan operasi darab.', explanation: '8 × 8 = 64, maka 64 ÷ 8 = 8 dan pernyataan Kumar betul.', operands: [64, 8], questionType: 'structured', marks: 2 },
  { skill: 'menilai_jawapan_bahagi_tidak_tepat', q: 'Mei Ling menyatakan 54 ÷ 6 = 7. Adakah jawapannya tepat? Betulkan jika perlu.', answer: 'Tidak tepat; jawapan yang betul ialah 9.', accepted: ['Tidak tepat; jawapan yang betul ialah 9.', 'tidak, 9', '9'], hint: 'Cari nombor yang apabila didarab dengan 6 menghasilkan 54.', explanation: '6 × 9 = 54. Oleh itu, 54 ÷ 6 = 9, bukannya 7.', operands: [54, 6], questionType: 'structured', marks: 2 },
  { skill: 'menilai_strategi_bahagi_cekap', q: 'Untuk 50 ÷ 5, pilih strategi lebih cekap: A. tolak 5 berulang kali atau B. gunakan fakta 5 × 10 = 50. Nyatakan jawapan.', answer: 'Strategi B lebih cekap; hasil bahagi ialah 10.', accepted: ['Strategi B lebih cekap; hasil bahagi ialah 10.', 'B, 10', '10'], hint: 'Fakta darab yang diketahui boleh memberikan jawapan terus.', explanation: 'Fakta 5 × 10 = 50 menunjukkan terus bahawa 50 ÷ 5 = 10. Jadi, strategi B lebih cekap.', operands: [50, 5], questionType: 'structured', marks: 2 },
  { skill: 'menilai_kemunasabahan_bahagi', q: 'Sembilan puluh objek dikongsi sama rata kepada 10 kumpulan. Seorang murid menjangka lebih daripada 10 objek setiap kumpulan. Adakah jangkaannya munasabah?', answer: 'Tidak; setiap kumpulan hanya mendapat 9 objek.', accepted: ['Tidak; setiap kumpulan hanya mendapat 9 objek.', 'tidak, 9', '9'], hint: 'Gunakan 90 ÷ 10.', explanation: '90 ÷ 10 = 9. Oleh itu, setiap kumpulan mendapat 9 objek dan jangkaan melebihi 10 tidak munasabah.', operands: [90, 10], questionType: 'structured', marks: 2 },
  { skill: 'menilai_operasi_dalam_masalah_bahagi', q: 'Ada 48 pensel di dalam 8 kotak sama banyak. Seorang murid menggunakan 48 - 8 untuk mencari pensel setiap kotak. Nilai pilihannya dan cari jawapan.', answer: 'Operasi tolak tidak tepat; gunakan 48 ÷ 8 = 6 pensel.', accepted: ['Operasi tolak tidak tepat; gunakan 48 ÷ 8 = 6 pensel.', 'bahagi, 6', '6'], hint: 'Kuantiti diagihkan kepada kumpulan sama banyak.', explanation: 'Situasi ini memerlukan bahagi, bukan satu kali tolak. 48 ÷ 8 = 6 pensel setiap kotak.', operands: [48, 8], questionType: 'structured', marks: 3 },

  { skill: 'mencipta_ayat_bahagi', q: 'Mencipta: Bina satu ayat bahagi menggunakan 56 sebagai nombor yang dibahagi dan 7 sebagai pembahagi, kemudian nyatakan hasilnya.', answer: '56 ÷ 7 = 8', accepted: ['56 ÷ 7 = 8', '56 bahagi 7 = 8', '8'], hint: 'Cari fakta darab 7 yang menghasilkan 56.', explanation: 'Satu ayat bahagi yang tepat ialah 56 ÷ 7 = 8.', operands: [56, 7], questionType: 'structured', marks: 2, rubric: CONSTRUCT_DIVISION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [56, 7, 8] } },
  { skill: 'mencipta_keluarga_fakta_bahagi', q: 'Mencipta: Berdasarkan 9 × 6 = 54, bina dua ayat bahagi yang berkaitan.', answer: '54 ÷ 9 = 6 dan 54 ÷ 6 = 9', accepted: ['54 ÷ 9 = 6 dan 54 ÷ 6 = 9', '54 bahagi 9 = 6 dan 54 bahagi 6 = 9'], hint: 'Gunakan 54 sebagai nombor yang dibahagi dalam kedua-dua ayat.', explanation: 'Dua ayat yang tepat ialah 54 ÷ 9 = 6 dan 54 ÷ 6 = 9.', operands: [54, 9], calculations: [[54, 9], [54, 6]], questionType: 'structured', marks: 2, rubric: CONSTRUCT_DIVISION_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [54, 9, 6] } },
  { skill: 'mencipta_tolak_berulang_bahagi', q: 'Mencipta: Tunjukkan 24 ÷ 6 sebagai tolak berulang dan nyatakan bilangan tolakan.', answer: '24 - 6 - 6 - 6 - 6 = 0; terdapat 4 tolakan.', accepted: ['24 - 6 - 6 - 6 - 6 = 0; terdapat 4 tolakan.', '4 tolakan', '4'], hint: 'Tolak 6 sehingga sampai kepada sifar.', explanation: '24 - 6 - 6 - 6 - 6 = 0 menunjukkan 4 tolakan, maka 24 ÷ 6 = 4.', operands: [24, 6], questionType: 'structured', marks: 2, rubric: CONSTRUCT_DIVISION_RUBRIC, responseRules: { responseKind: 'representation', requiredNumbers: [24, 6, 4] } },
  { skill: 'mencipta_masalah_kongsi_sama_rata', q: 'Mencipta: Bina satu masalah cerita yang menggunakan 45 ÷ 5 dan mempunyai jawapan 9.', answer: 'Empat puluh lima biji kurma dikongsi sama rata ke dalam 5 bekas. Setiap bekas mendapat 9 biji kurma.', accepted: ['Empat puluh lima biji kurma dikongsi sama rata ke dalam 5 bekas. Setiap bekas mendapat 9 biji kurma.'], hint: 'Gunakan situasi 45 objek yang dikongsi kepada 5 kumpulan.', explanation: 'Cerita boleh berbeza asalkan 45 objek dikongsi sama rata kepada 5 kumpulan dan hasilnya 9.', operands: [45, 5], questionType: 'structured', marks: 3, rubric: CREATE_DIVISION_STORY_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [45, 5, 9], semanticCues: ['sama rata', 'setiap', 'dikongsi', 'diagihkan', 'dibahagi'] } },
  { skill: 'mencipta_model_pengelompokan', q: 'Mencipta: Terangkan satu susunan yang mewakili 32 ÷ 4 sebagai pembentukan kumpulan dan nyatakan bilangan kumpulan.', answer: 'Susun 32 objek dengan 4 objek dalam setiap kumpulan; sebanyak 8 kumpulan terbentuk.', accepted: ['Susun 32 objek dengan 4 objek dalam setiap kumpulan; sebanyak 8 kumpulan terbentuk.', '32 objek, 4 setiap kumpulan, 8 kumpulan'], hint: 'Nyatakan jumlah objek, objek setiap kumpulan dan bilangan kumpulan.', explanation: 'Apabila 32 objek disusun 4 objek setiap kumpulan, 8 kumpulan terbentuk kerana 32 ÷ 4 = 8.', operands: [32, 4], questionType: 'structured', marks: 2, rubric: CONSTRUCT_DIVISION_RUBRIC, responseRules: { responseKind: 'grouping', requiredNumbers: [32, 4, 8] } }
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

function divisionResult(operands = []) {
  return operands.slice(1).reduce((result, value) => result / value, operands[0]);
}

export const mathBahagiQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  const calculations = item.calculations || [item.operands];
  const calculationResults = calculations.map(divisionResult);
  return Object.freeze({
    id: `MATH-BAHAGI-PILOT-${String(index + 1).padStart(3, '0')}`,
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
      category: 'bahagi',
      assessmentCategory: 'pbd_matematik',
      operation: 'division',
      numberVariationPolicy: 'authored_locked',
      skill: item.skill,
      set: `bahagi_pilot_${index + 1}`,
      calculations,
      calculationResults,
      numericAnswer: Number.isFinite(item.numericAnswer) ? item.numericAnswer : calculationResults[0]
    }
  });
}));

export function enrichMathBahagiTopic(subject) {
  return {
    ...subject,
    curriculumFramework: MATH_YEAR_TWO_FRAMEWORK,
    topics: (subject.topics || []).map(topic => topic.id === 'bahagi' ? {
      ...topic,
      note: 'Memahami bahagi sebagai perkongsian sama rata dan pembentukan kumpulan sama banyak, serta menguasai fakta bahagi berkaitan fakta darab hingga 10 × 10.',
      learningObjective: 'Murid dapat memahami konsep bahagi dan menggunakan fakta asas bahagi dalam pelbagai perwakilan dan situasi.',
      learningOutcome: 'Murid dapat mewakilkan, menghitung, melengkapkan nombor yang hilang, menyelesaikan masalah serta menilai dan menerangkan strategi bahagi dengan tepat.',
      contentStatus: 'pilot',
      defaultQuestionType: 'short_answer',
      defaultMarks: 1,
      assessmentFramework: MATH_YEAR_TWO_FRAMEWORK,
      questions: mathBahagiQuestions
    } : topic)
  };
}

export default mathBahagiQuestions;
