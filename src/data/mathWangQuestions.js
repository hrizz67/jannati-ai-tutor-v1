import { MATH_YEAR_TWO_FRAMEWORK } from './mathNomborQuestions.js';

const CONSTRUCT_MONEY_RUBRIC = Object.freeze({
  totalMarks: 2,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua nilai atau syarat wang yang diberikan.', marks: 1 },
    { criterion: 'Menunjukkan pengiraan atau gabungan wang yang tepat.', marks: 1 }
  ])
});

const CREATE_MONEY_STORY_RUBRIC = Object.freeze({
  totalMarks: 3,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua nilai wang yang diberikan.', marks: 1 },
    { criterion: 'Membina situasi pembelian atau simpanan yang jelas.', marks: 1 },
    { criterion: 'Menyatakan jumlah atau baki dengan format wang yang tepat.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'mengenal_syiling_lima_puluh_sen', q: 'Nyatakan nilai syiling Malaysia yang bertanda “50 sen”.', answer: 'Nilai syiling itu ialah 50 sen.', accepted: ['Nilai syiling itu ialah 50 sen.', '50 sen', '50'], hint: 'Baca nombor dan unit pada syiling.', explanation: 'Syiling yang bertanda 50 sen bernilai 50 sen.', amounts: [50, 0], moneyOperation: 'identity' },
  { skill: 'mengenal_wang_kertas_dua_puluh', q: 'Apakah nilai wang kertas Malaysia yang bertanda “RM 20”?', answer: 'Wang kertas itu bernilai RM 20.', accepted: ['Wang kertas itu bernilai RM 20.', 'RM 20', 'RM20', '20'], hint: 'RM ialah simbol bagi ringgit Malaysia.', explanation: 'Tanda RM 20 menunjukkan nilai dua puluh ringgit.', amounts: [2000, 0], moneyOperation: 'identity' },
  { skill: 'hubungan_ringgit_sen', q: 'Lengkapkan hubungan asas: 100 sen = RM ___.', answer: '100 sen bersamaan dengan RM 1.', accepted: ['100 sen bersamaan dengan RM 1.', 'RM 1', 'RM1', '1'], hint: 'Seratus sen membentuk satu ringgit.', explanation: '100 sen = RM 1.', amounts: [100, 0], moneyOperation: 'identity', questionType: 'fill_blank' },
  { skill: 'simbol_ringgit_malaysia', q: 'Apakah simbol yang ditulis sebelum nilai ringgit Malaysia?', answer: 'Simbolnya ialah RM.', accepted: ['Simbolnya ialah RM.', 'RM', 'rm'], hint: 'Lihat cara nilai seperti RM 5 ditulis.', explanation: 'Simbol mata wang ringgit Malaysia ialah RM.', amounts: [0, 0], moneyOperation: 'identity' },
  { skill: 'mengira_gabungan_syiling', q: 'Hitung nilai dua syiling 20 sen dan satu syiling 10 sen.', answer: 'Jumlah syiling ialah 50 sen.', accepted: ['Jumlah syiling ialah 50 sen.', '50 sen', '50'], hint: 'Tambah 20 + 20 + 10.', explanation: '20 sen + 20 sen + 10 sen = 50 sen.', amounts: [20, 20, 10], moneyOperation: 'addition' },
  { skill: 'mengira_gabungan_wang_kertas', q: 'Cari jumlah bagi wang kertas RM 10, RM 5 dan RM 1.', answer: 'Jumlah wang kertas ialah RM 16.', accepted: ['Jumlah wang kertas ialah RM 16.', 'RM 16', 'RM16', '16'], hint: 'Tambah nilai ketiga-tiga wang kertas.', explanation: 'RM 10 + RM 5 + RM 1 = RM 16.', amounts: [1000, 500, 100], moneyOperation: 'addition' },
  { skill: 'menukar_ringgit_kepada_sen', q: 'Tukarkan RM 3 kepada sen.', answer: 'RM 3 bersamaan dengan 300 sen.', accepted: ['RM 3 bersamaan dengan 300 sen.', '300 sen', '300'], hint: 'Setiap RM 1 bersamaan dengan 100 sen.', explanation: '3 × 100 sen = 300 sen, maka RM 3 = 300 sen.', amounts: [300, 0], moneyOperation: 'identity' },
  { skill: 'menukar_sen_kepada_ringgit', q: 'Tulis 250 sen dalam ringgit dan sen.', answer: '250 sen bersamaan dengan RM 2.50.', accepted: ['250 sen bersamaan dengan RM 2.50.', 'RM 2.50', 'RM2.50', '2 ringgit 50 sen'], hint: 'Asingkan 200 sen dan 50 sen.', explanation: '200 sen = RM 2 dan baki 50 sen. Jadi, 250 sen = RM 2.50.', amounts: [250, 0], moneyOperation: 'identity' },
  { skill: 'nilai_sen_dalam_notasi_wang', q: 'Dalam nilai RM 4.75, berapakah bahagian sen?', answer: 'Bahagian sen ialah 75 sen.', accepted: ['Bahagian sen ialah 75 sen.', '75 sen', '75'], hint: 'Dua digit selepas titik mewakili sen.', explanation: 'RM 4.75 terdiri daripada RM 4 dan 75 sen.', amounts: [75, 0], moneyOperation: 'identity' },
  { skill: 'menulis_ringgit_dan_sen', q: 'Tulis RM 7 dan 5 sen dalam notasi wang yang lengkap.', answer: 'Notasi yang lengkap ialah RM 7.05.', accepted: ['Notasi yang lengkap ialah RM 7.05.', 'RM 7.05', 'RM7.05'], hint: 'Bahagian sen mesti mempunyai dua digit.', explanation: 'Lima sen ditulis sebagai 05 selepas titik. Jadi, nilainya RM 7.05.', amounts: [705, 0], moneyOperation: 'identity' },

  { skill: 'membandingkan_ringgit', q: 'Manakah lebih besar nilainya: RM 8 atau RM 5?', answer: 'RM 8 lebih besar daripada RM 5.', accepted: ['RM 8 lebih besar daripada RM 5.', 'RM 8', 'RM8', '8'], hint: 'Bandingkan bilangan ringgit.', explanation: '8 lebih besar daripada 5, maka RM 8 mempunyai nilai lebih besar.', amounts: [800, 500], moneyOperation: 'maximum' },
  { skill: 'gabungan_setara_sepuluh_ringgit', q: 'Adakah dua keping RM 5 sama nilainya dengan sekeping RM 10? Jelaskan.', answer: 'Ya, kedua-duanya bernilai RM 10.', accepted: ['Ya, kedua-duanya bernilai RM 10.', 'ya, RM 10', 'ya'], hint: 'Tambah RM 5 + RM 5.', explanation: 'RM 5 + RM 5 = RM 10, jadi kedua-dua gabungan adalah setara.', amounts: [500, 500], moneyOperation: 'addition', questionType: 'structured', marks: 2 },
  { skill: 'gabungan_setara_lima_puluh_sen', q: 'Pilih gabungan yang sama dengan 50 sen: A. 20 sen + 20 sen + 10 sen atau B. 20 sen + 10 sen.', answer: 'Gabungan A bernilai 50 sen.', accepted: ['Gabungan A bernilai 50 sen.', 'A', '50 sen'], hint: 'Cari jumlah bagi setiap pilihan.', explanation: '20 sen + 20 sen + 10 sen = 50 sen, manakala pilihan B hanya 30 sen.', amounts: [20, 20, 10], moneyOperation: 'addition', questionType: 'structured', marks: 2 },
  { skill: 'memahami_sifar_dalam_notasi_sen', q: 'Mengapakah RM 3.05 tidak sama dengan RM 3.50?', answer: 'RM 3.05 mempunyai 5 sen, manakala RM 3.50 mempunyai 50 sen.', accepted: ['RM 3.05 mempunyai 5 sen, manakala RM 3.50 mempunyai 50 sen.', '5 sen dan 50 sen'], hint: 'Baca dua digit selepas titik sebagai sen.', explanation: 'RM 3.05 = 305 sen dan RM 3.50 = 350 sen. Nilainya berbeza sebanyak 45 sen.', amounts: [350, 305], moneyOperation: 'difference', numericAnswerCents: 350, questionType: 'structured', marks: 2 },
  { skill: 'membaca_notasi_wang', q: 'Baca nilai RM 12.40 dalam perkataan.', answer: 'Dua belas ringgit dan empat puluh sen.', accepted: ['Dua belas ringgit dan empat puluh sen.', '12 ringgit 40 sen', 'dua belas ringgit empat puluh sen'], hint: 'Baca bahagian sebelum titik sebagai ringgit dan selepas titik sebagai sen.', explanation: 'RM 12.40 dibaca sebagai dua belas ringgit dan empat puluh sen.', amounts: [1240, 0], moneyOperation: 'identity' },
  { skill: 'memahami_bilangan_syiling', q: 'Dua syiling 20 sen dan satu syiling 10 sen membentuk nilai apa?', answer: 'Gabungan itu membentuk 50 sen.', accepted: ['Gabungan itu membentuk 50 sen.', '50 sen', '50'], hint: 'Tambah nilai semua syiling.', explanation: '20 sen + 20 sen + 10 sen = 50 sen.', amounts: [20, 20, 10], moneyOperation: 'addition' },
  { skill: 'memilih_wang_kertas_setara', q: 'Wang kertas manakah boleh menggantikan dua keping RM 10 dengan nilai yang sama?', answer: 'Sekeping wang kertas RM 20.', accepted: ['Sekeping wang kertas RM 20.', 'RM 20', 'RM20'], hint: 'Tambah RM 10 + RM 10.', explanation: 'Dua keping RM 10 berjumlah RM 20, jadi boleh diganti dengan sekeping RM 20.', amounts: [1000, 1000], moneyOperation: 'addition' },
  { skill: 'membandingkan_digit_sen', q: 'Bandingkan RM 5.60 dengan RM 5.06. Nilai manakah lebih besar?', answer: 'RM 5.60 lebih besar daripada RM 5.06.', accepted: ['RM 5.60 lebih besar daripada RM 5.06.', 'RM 5.60', 'RM5.60'], hint: 'Bahagian ringgit sama; bandingkan 60 sen dengan 6 sen.', explanation: 'RM 5.60 = 560 sen dan RM 5.06 = 506 sen. Oleh itu, RM 5.60 lebih besar.', amounts: [560, 506], moneyOperation: 'maximum' },
  { skill: 'memahami_gabungan_lapan_puluh_sen', q: 'Gabungan manakah tepat untuk 80 sen: A. 50 sen + 20 sen + 10 sen atau B. 50 sen + 20 sen?', answer: 'Pilihan A tepat kerana jumlahnya 80 sen.', accepted: ['Pilihan A tepat kerana jumlahnya 80 sen.', 'A', '80 sen'], hint: 'Tambah nilai syiling bagi setiap pilihan.', explanation: '50 sen + 20 sen + 10 sen = 80 sen. Pilihan B hanya 70 sen.', amounts: [50, 20, 10], moneyOperation: 'addition', questionType: 'structured', marks: 2 },
  { skill: 'membezakan_jumlah_dan_baki', q: 'Dalam pembelian, apakah maksud baki wang?', answer: 'Baki wang ialah wang yang tinggal selepas bayaran dibuat.', accepted: ['Baki wang ialah wang yang tinggal selepas bayaran dibuat.', 'wang yang tinggal selepas membayar', 'wang yang tinggal'], hint: 'Fikirkan wang asal ditolak harga barang.', explanation: 'Baki diperoleh dengan menolak jumlah bayaran daripada wang yang dimiliki.', amounts: [0, 0], moneyOperation: 'identity', numericAnswerCents: 0, questionType: 'structured', marks: 2 },

  { skill: 'menambah_ringgit', q: 'Hitung RM 12 + RM 7.', answer: 'Jumlahnya ialah RM 19.', accepted: ['Jumlahnya ialah RM 19.', 'RM 19', 'RM19', '19'], hint: 'Tambah 12 dengan 7.', explanation: 'RM 12 + RM 7 = RM 19.', amounts: [1200, 700], moneyOperation: 'addition' },
  { skill: 'menambah_sen', q: 'Lengkapkan 35 sen + 40 sen = ___.', answer: 'Hasil tambahnya ialah 75 sen.', accepted: ['Hasil tambahnya ialah 75 sen.', '75 sen', '75'], hint: 'Tambah nilai sen.', explanation: '35 sen + 40 sen = 75 sen.', amounts: [35, 40], moneyOperation: 'addition', questionType: 'fill_blank' },
  { skill: 'menambah_ringgit_dan_sen', q: 'Selesaikan RM 4.30 + RM 2.50.', answer: 'Jumlah wang ialah RM 6.80.', accepted: ['Jumlah wang ialah RM 6.80.', 'RM 6.80', 'RM6.80'], hint: 'Tambah sen dahulu, kemudian ringgit.', explanation: '30 sen + 50 sen = 80 sen dan RM 4 + RM 2 = RM 6. Jadi, jumlahnya RM 6.80.', amounts: [430, 250], moneyOperation: 'addition' },
  { skill: 'menambah_dengan_pengumpulan_sen', q: 'Cari jumlah RM 3.75 + RM 2.50.', answer: 'Hasil tambah ialah RM 6.25.', accepted: ['Hasil tambah ialah RM 6.25.', 'RM 6.25', 'RM6.25'], hint: '75 sen + 50 sen = 125 sen, iaitu RM 1.25.', explanation: 'RM 3.75 + RM 2.50 = RM 6.25 selepas 100 sen dikumpulkan menjadi RM 1.', amounts: [375, 250], moneyOperation: 'addition' },
  { skill: 'menambah_tiga_harga', q: 'Harga roti RM 2, susu RM 4 dan buah RM 3. Berapakah jumlah harga?', answer: 'Jumlah tiga barang ialah RM 9.', accepted: ['Jumlah tiga barang ialah RM 9.', 'RM 9', 'RM9', '9'], hint: 'Tambah ketiga-tiga harga.', explanation: 'RM 2 + RM 4 + RM 3 = RM 9.', amounts: [200, 400, 300], moneyOperation: 'addition', questionType: 'structured', marks: 2 },
  { skill: 'menolak_ringgit', q: 'Kira RM 20 - RM 8.', answer: 'Perbezaannya ialah RM 12.', accepted: ['Perbezaannya ialah RM 12.', 'RM 12', 'RM12', '12'], hint: 'Tolak 8 daripada 20.', explanation: 'RM 20 - RM 8 = RM 12.', amounts: [2000, 800], moneyOperation: 'subtraction' },
  { skill: 'menolak_sen', q: 'Berapakah 90 sen - 35 sen?', answer: 'Bakinya ialah 55 sen.', accepted: ['Bakinya ialah 55 sen.', '55 sen', '55'], hint: 'Tolak nilai sen.', explanation: '90 sen - 35 sen = 55 sen.', amounts: [90, 35], moneyOperation: 'subtraction' },
  { skill: 'menolak_ringgit_dan_sen', q: 'Selesaikan RM 8.70 - RM 3.20.', answer: 'Hasil tolak ialah RM 5.50.', accepted: ['Hasil tolak ialah RM 5.50.', 'RM 5.50', 'RM5.50'], hint: 'Tolak sen dan ringgit mengikut tempat.', explanation: '70 sen - 20 sen = 50 sen dan RM 8 - RM 3 = RM 5. Jadi, hasilnya RM 5.50.', amounts: [870, 320], moneyOperation: 'subtraction' },
  { skill: 'menolak_dengan_pengumpulan_semula', q: 'Hitung RM 10.00 - RM 4.65.', answer: 'Jawapannya ialah RM 5.35.', accepted: ['Jawapannya ialah RM 5.35.', 'RM 5.35', 'RM5.35'], hint: 'Tukar satu ringgit kepada 100 sen sebelum menolak 65 sen.', explanation: 'RM 10.00 - RM 4.65 = RM 5.35.', amounts: [1000, 465], moneyOperation: 'subtraction' },
  { skill: 'mengira_baki_pembelian', q: 'Faris membayar RM 10 untuk sebuah buku berharga RM 6. Berapakah baki wangnya?', answer: 'Faris menerima baki RM 4.', accepted: ['Faris menerima baki RM 4.', 'RM 4', 'RM4', '4'], hint: 'Tolak harga buku daripada wang yang dibayar.', explanation: 'RM 10 - RM 6 = RM 4. Baki Faris ialah RM 4.', amounts: [1000, 600], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },
  { skill: 'mengira_baki_dengan_sen', q: 'Siti membayar RM 5.00 untuk makanan berharga RM 3.40. Cari bakinya.', answer: 'Baki Siti ialah RM 1.60.', accepted: ['Baki Siti ialah RM 1.60.', 'RM 1.60', 'RM1.60'], hint: 'Tolak RM 3.40 daripada RM 5.00.', explanation: 'RM 5.00 - RM 3.40 = RM 1.60.', amounts: [500, 340], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },
  { skill: 'harga_dua_barang_sama', q: 'Sebuah buku nota berharga RM 4. Berapakah harga 3 buah buku nota?', answer: 'Harga tiga buku nota ialah RM 12.', accepted: ['Harga tiga buku nota ialah RM 12.', 'RM 12', 'RM12', '12'], hint: 'Tambah RM 4 sebanyak tiga kali.', explanation: 'RM 4 × 3 = RM 12.', amounts: [400, 3], moneyOperation: 'multiplication', questionType: 'structured', marks: 2 },
  { skill: 'menentukan_wang_mencukupi', q: 'Amin mempunyai RM 15. Dia mahu membeli permainan berharga RM 13. Adakah wangnya mencukupi dan berapa baki?', answer: 'Wangnya mencukupi dan baki ialah RM 2.', accepted: ['Wangnya mencukupi dan baki ialah RM 2.', 'ya, RM 2', 'RM 2', '2'], hint: 'Bandingkan wang dengan harga, kemudian tolak.', explanation: 'RM 15 melebihi RM 13 dan RM 15 - RM 13 = RM 2. Wang Amin mencukupi.', amounts: [1500, 1300], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },
  { skill: 'penambah_wang_hilang', q: 'Lengkapkan RM 7 + RM ___ = RM 15.', answer: 'Nilai yang hilang ialah RM 8.', accepted: ['Nilai yang hilang ialah RM 8.', 'RM 8', 'RM8', '8'], hint: 'Tolak RM 7 daripada RM 15.', explanation: 'RM 15 - RM 7 = RM 8, jadi RM 7 + RM 8 = RM 15.', amounts: [1500, 700], moneyOperation: 'subtraction', numericAnswerCents: 800, questionType: 'fill_blank', marks: 2 },
  { skill: 'harga_barang_hilang', q: 'Lina mempunyai RM 20 dan menerima baki RM 6 selepas membeli beg. Berapakah harga beg?', answer: 'Harga beg ialah RM 14.', accepted: ['Harga beg ialah RM 14.', 'RM 14', 'RM14', '14'], hint: 'Tolak baki daripada wang asal.', explanation: 'RM 20 - RM 6 = RM 14. Harga beg ialah RM 14.', amounts: [2000, 600], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },

  { skill: 'analisis_kesilapan_tukar_sen', q: 'Ravi menulis RM 4 = 40 sen. Kenal pasti kesilapannya dan berikan nilai yang betul.', answer: 'Ravi tersalah nilai; RM 4 bersamaan dengan 400 sen.', accepted: ['Ravi tersalah nilai; RM 4 bersamaan dengan 400 sen.', 'RM 4 = 400 sen', '400 sen'], hint: 'Setiap RM 1 bersamaan dengan 100 sen.', explanation: '4 × 100 sen = 400 sen. Oleh itu, RM 4 = 400 sen, bukan 40 sen.', amounts: [400, 0], moneyOperation: 'identity', questionType: 'structured', marks: 2 },
  { skill: 'analisis_notasi_wang_salah', q: 'Mira menulis RM 6 dan 5 sen sebagai RM 6.5. Betulkan notasi itu.', answer: 'Notasi yang betul ialah RM 6.05.', accepted: ['Notasi yang betul ialah RM 6.05.', 'RM 6.05', 'RM6.05'], hint: 'Sen mesti ditulis menggunakan dua digit.', explanation: 'Lima sen ditulis 05, maka RM 6 dan 5 sen ialah RM 6.05.', amounts: [605, 0], moneyOperation: 'identity', questionType: 'structured', marks: 2 },
  { skill: 'membandingkan_dua_bakul_belian', q: 'Bakul A berharga RM 8.50 dan Bakul B berharga RM 6.75. Bakul manakah lebih murah dan berapa bezanya?', answer: 'Bakul B lebih murah sebanyak RM 1.75.', accepted: ['Bakul B lebih murah sebanyak RM 1.75.', 'B, RM 1.75', 'RM 1.75'], hint: 'Cari beza RM 8.50 dengan RM 6.75.', explanation: 'RM 8.50 - RM 6.75 = RM 1.75. Oleh itu, Bakul B lebih murah.', amounts: [850, 675], moneyOperation: 'difference', numericAnswerCents: 175, questionType: 'structured', marks: 3 },
  { skill: 'analisis_wang_tidak_mencukupi', q: 'Nadia mempunyai RM 12 tetapi harga kasut ialah RM 15. Berapakah wang tambahan yang diperlukan?', answer: 'Nadia memerlukan tambahan RM 3.', accepted: ['Nadia memerlukan tambahan RM 3.', 'RM 3', 'RM3', '3'], hint: 'Cari beza harga dengan wang Nadia.', explanation: 'RM 15 - RM 12 = RM 3. Nadia kekurangan RM 3.', amounts: [1500, 1200], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },
  { skill: 'maklumat_tidak_relevan_wang', q: 'Hakim membeli buku RM 7 dan pen RM 3. Buku itu mempunyai 80 halaman. Maklumat manakah tidak diperlukan dan berapakah jumlah bayaran?', answer: 'Maklumat 80 halaman tidak diperlukan; jumlah bayaran ialah RM 10.', accepted: ['Maklumat 80 halaman tidak diperlukan; jumlah bayaran ialah RM 10.', '80 halaman, RM 10', 'RM 10'], hint: 'Gunakan harga buku dan harga pen sahaja.', explanation: 'Bilangan halaman tidak mempengaruhi jumlah harga. RM 7 + RM 3 = RM 10.', amounts: [700, 300], moneyOperation: 'addition', questionType: 'structured', marks: 3 },
  { skill: 'menyusun_nilai_wang', q: 'Susun RM 3.50, RM 3.05 dan RM 3.25 daripada nilai paling kecil kepada paling besar.', answer: 'Susunannya ialah RM 3.05, RM 3.25, RM 3.50.', accepted: ['Susunannya ialah RM 3.05, RM 3.25, RM 3.50.', 'RM 3.05, RM 3.25, RM 3.50'], hint: 'Bahagian ringgit sama; bandingkan nilai sen.', explanation: '305 sen < 325 sen < 350 sen, jadi tertibnya RM 3.05, RM 3.25, RM 3.50.', amounts: [305, 325, 350], moneyOperation: 'minimum', numericAnswerCents: 305, questionType: 'ordering', marks: 3 },
  { skill: 'analisis_dua_kaedah_tambah_wang', q: 'Untuk RM 4.60 + RM 3.40, Kaedah A menggabungkan 60 sen + 40 sen menjadi RM 1. Kaedah B mengabaikan 100 sen itu. Kaedah manakah tepat?', answer: 'Kaedah A tepat dan jumlahnya RM 8.00.', accepted: ['Kaedah A tepat dan jumlahnya RM 8.00.', 'A, RM 8', 'RM 8'], hint: '100 sen perlu dikumpulkan menjadi RM 1.', explanation: '60 sen + 40 sen = 100 sen = RM 1. Maka, RM 4.60 + RM 3.40 = RM 8.00 dan Kaedah A tepat.', amounts: [460, 340], moneyOperation: 'addition', questionType: 'structured', marks: 2 },
  { skill: 'analisis_operasi_baki', q: 'Aina membayar RM 20 untuk barang berharga RM 13. Seorang murid menggunakan 20 + 13. Nilai pilihan operasi itu dan cari baki.', answer: 'Operasi tambah tidak tepat; baki ialah RM 7.', accepted: ['Operasi tambah tidak tepat; baki ialah RM 7.', 'tolak, RM 7', 'RM 7'], hint: 'Baki diperoleh dengan menolak harga daripada bayaran.', explanation: 'RM 20 - RM 13 = RM 7. Operasi yang tepat ialah tolak.', amounts: [2000, 1300], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },
  { skill: 'analisis_jumlah_resit', q: 'Resit menunjukkan roti RM 2.50, minuman RM 1.50 dan buah RM 3.00. Semak jumlah RM 6.00 yang ditulis pada resit.', answer: 'Jumlah RM 6.00 itu salah; jumlah sebenar ialah RM 7.00.', accepted: ['Jumlah RM 6.00 itu salah; jumlah sebenar ialah RM 7.00.', 'salah, RM 7', 'RM 7'], hint: 'Tambah ketiga-tiga harga.', explanation: 'RM 2.50 + RM 1.50 + RM 3.00 = RM 7.00. Jumlah pada resit kurang RM 1.', amounts: [250, 150, 300], moneyOperation: 'addition', questionType: 'structured', marks: 3 },
  { skill: 'analisis_harga_hilang', q: 'Harga buku dan pensel ialah RM 11. Buku berharga RM 8. Tentukan harga pensel.', answer: 'Harga pensel ialah RM 3.', accepted: ['Harga pensel ialah RM 3.', 'RM 3', 'RM3', '3'], hint: 'Tolak harga buku daripada jumlah.', explanation: 'RM 11 - RM 8 = RM 3. Jadi, pensel berharga RM 3.', amounts: [1100, 800], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },
  { skill: 'analisis_perbandingan_baki', q: 'Ali mempunyai RM 20 dan membeli barang RM 12. Mei mempunyai RM 18 dan membeli barang RM 9. Siapakah mempunyai baki lebih banyak dan berapa bezanya?', answer: 'Mei mempunyai baki lebih banyak sebanyak RM 1.', accepted: ['Mei mempunyai baki lebih banyak sebanyak RM 1.', 'Mei, RM 1', 'Mei'], hint: 'Cari kedua-dua baki dahulu.', explanation: 'Baki Ali ialah RM 8 dan baki Mei ialah RM 9. Baki Mei lebih banyak RM 1.', amounts: [2000, 1200], calculations: [[2000, 1200], [1800, 900], [900, 800]], calculationOperations: ['subtraction', 'subtraction', 'subtraction'], numericAnswerCents: 100, questionType: 'structured', marks: 3 },
  { skill: 'analisis_bajet_dua_barang', q: 'Dengan RM 15, bolehkah Sara membeli buku RM 9 dan kotak pensel RM 7? Jelaskan kekurangan atau baki.', answer: 'Tidak; jumlahnya RM 16 dan Sara kekurangan RM 1.', accepted: ['Tidak; jumlahnya RM 16 dan Sara kekurangan RM 1.', 'tidak, kurang RM 1', 'RM 1'], hint: 'Tambah harga, kemudian bandingkan dengan bajet.', explanation: 'RM 9 + RM 7 = RM 16, iaitu RM 1 melebihi bajet RM 15.', amounts: [900, 700], moneyOperation: 'addition', numericAnswerCents: 1600, questionType: 'structured', marks: 3 },
  { skill: 'analisis_nilai_setara_pelbagai', q: 'Adakah RM 2.50 sama nilai dengan 250 sen dan lima syiling 50 sen? Buktikan.', answer: 'Ya, ketiga-tiganya bernilai 250 sen atau RM 2.50.', accepted: ['Ya, ketiga-tiganya bernilai 250 sen atau RM 2.50.', 'ya, RM 2.50', 'ya, 250 sen'], hint: 'Tukar semua nilai kepada sen.', explanation: 'RM 2.50 = 250 sen dan 5 × 50 sen = 250 sen. Semua nilai adalah setara.', amounts: [50, 5], moneyOperation: 'multiplication', numericAnswerCents: 250, questionType: 'structured', marks: 3 },
  { skill: 'analisis_pengumpulan_semula_wang', q: 'Terangkan pengumpulan semula bagi RM 7.80 + RM 2.45 dan nyatakan jumlah.', answer: '125 sen dikumpulkan menjadi RM 1.25; jumlahnya RM 10.25.', accepted: ['125 sen dikumpulkan menjadi RM 1.25; jumlahnya RM 10.25.', 'RM 10.25', '10.25'], hint: 'Tambah 80 sen dengan 45 sen dahulu.', explanation: '80 sen + 45 sen = 125 sen = RM 1.25. RM 7 + RM 2 + RM 1.25 = RM 10.25.', amounts: [780, 245], moneyOperation: 'addition', questionType: 'structured', marks: 3 },
  { skill: 'analisis_pembelian_berperingkat', q: 'Zara mempunyai RM 30. Dia membeli buku RM 8 dan permainan RM 12. Berapakah baki selepas kedua-dua pembelian?', answer: 'Baki Zara selepas dua pembelian ialah RM 10.', accepted: ['Baki Zara selepas dua pembelian ialah RM 10.', 'RM 10', 'RM10', '10'], hint: 'Tambah harga barang, kemudian tolak daripada RM 30.', explanation: 'RM 8 + RM 12 = RM 20 dan RM 30 - RM 20 = RM 10.', amounts: [800, 1200], calculations: [[800, 1200], [3000, 2000]], calculationOperations: ['addition', 'subtraction'], numericAnswerCents: 1000, questionType: 'structured', marks: 3 },

  { skill: 'menilai_ketepatan_jumlah_wang', q: 'Kumar berkata RM 6.50 + RM 2.50 = RM 9.00. Nilai pernyataannya dan berikan bukti.', answer: 'Pernyataan Kumar betul kerana jumlahnya RM 9.00.', accepted: ['Pernyataan Kumar betul kerana jumlahnya RM 9.00.', 'betul, RM 9', 'RM 9'], hint: 'Tambah bahagian sen dan ringgit.', explanation: '50 sen + 50 sen = RM 1 dan RM 6 + RM 2 + RM 1 = RM 9.00. Pernyataan itu betul.', amounts: [650, 250], moneyOperation: 'addition', questionType: 'structured', marks: 2 },
  { skill: 'menilai_jawapan_baki_salah', q: 'Jia Wei menyatakan baki daripada RM 20 - RM 7.50 ialah RM 13.50. Adakah jawapannya tepat?', answer: 'Tidak tepat; baki yang betul ialah RM 12.50.', accepted: ['Tidak tepat; baki yang betul ialah RM 12.50.', 'tidak, RM 12.50', 'RM 12.50'], hint: 'Tolak RM 7.50 daripada RM 20.00.', explanation: 'RM 20.00 - RM 7.50 = RM 12.50, bukannya RM 13.50.', amounts: [2000, 750], moneyOperation: 'subtraction', questionType: 'structured', marks: 2 },
  { skill: 'menilai_strategi_tambah_wang', q: 'Untuk RM 9.75 + RM 5.25, pilih strategi lebih cekap: A. gabungkan 75 sen + 25 sen dahulu atau B. abaikan sen. Nyatakan jumlah.', answer: 'Strategi A lebih cekap; jumlahnya RM 15.00.', accepted: ['Strategi A lebih cekap; jumlahnya RM 15.00.', 'A, RM 15', 'RM 15'], hint: '75 sen dan 25 sen membentuk tepat RM 1.', explanation: '75 sen + 25 sen = RM 1, lalu RM 9 + RM 5 + RM 1 = RM 15.00. Strategi A tepat.', amounts: [975, 525], moneyOperation: 'addition', questionType: 'structured', marks: 2 },
  { skill: 'menilai_kemampuan_membeli', q: 'Dengan RM 25, Farah mahu membeli buku RM 11 dan alat tulis RM 13. Adakah pembelian itu munasabah dalam bajet?', answer: 'Ya; jumlahnya RM 24 dan masih berbaki RM 1.', accepted: ['Ya; jumlahnya RM 24 dan masih berbaki RM 1.', 'ya, baki RM 1', 'ya'], hint: 'Tambah harga dan bandingkan dengan RM 25.', explanation: 'RM 11 + RM 13 = RM 24, kurang daripada RM 25. Bakinya RM 1.', amounts: [1100, 1300], calculations: [[1100, 1300], [2500, 2400]], calculationOperations: ['addition', 'subtraction'], numericAnswerCents: 100, questionType: 'structured', marks: 3 },
  { skill: 'menilai_bayaran_tepat', q: 'Untuk membayar tepat RM 7 menggunakan RM 5, RM 2 dan RM 1, pilih A. RM 5 + RM 2 atau B. RM 5 + RM 1.', answer: 'Pilihan A membayar tepat RM 7.', accepted: ['Pilihan A membayar tepat RM 7.', 'A', 'RM 7'], hint: 'Tambah nilai dalam setiap pilihan.', explanation: 'RM 5 + RM 2 = RM 7, manakala RM 5 + RM 1 = RM 6. Pilihan A tepat.', amounts: [500, 200], moneyOperation: 'addition', questionType: 'structured', marks: 2 },

  { skill: 'mencipta_gabungan_wang', q: 'Mencipta: Bina satu gabungan wang bernilai RM 10 menggunakan sekurang-kurangnya wang RM 5, RM 2 dan RM 1.', answer: 'RM 5 + RM 2 + RM 2 + RM 1 = RM 10.', accepted: ['RM 5 + RM 2 + RM 2 + RM 1 = RM 10.'], hint: 'Gunakan semua nilai yang dinyatakan dan pastikan jumlah RM 10.', explanation: 'Satu gabungan yang tepat ialah RM 5 + RM 2 + RM 2 + RM 1 = RM 10.', amounts: [500, 200, 200, 100], moneyOperation: 'addition', questionType: 'structured', marks: 2, rubric: CONSTRUCT_MONEY_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [5, 2, 1, 10] } },
  { skill: 'mencipta_ayat_tambah_wang', q: 'Mencipta: Bina ayat tambah wang menggunakan RM 6 dan RM 9, kemudian nyatakan jumlah.', answer: 'RM 6 + RM 9 = RM 15.', accepted: ['RM 6 + RM 9 = RM 15.', 'RM6 + RM9 = RM15'], hint: 'Gunakan kedua-dua nilai dan tanda sama dengan.', explanation: 'Ayat tambah yang tepat ialah RM 6 + RM 9 = RM 15.', amounts: [600, 900], moneyOperation: 'addition', questionType: 'structured', marks: 2, rubric: CONSTRUCT_MONEY_RUBRIC, responseRules: { responseKind: 'equation', requiredNumbers: [6, 9, 15] } },
  { skill: 'mencipta_masalah_baki_wang', q: 'Mencipta: Bina masalah cerita yang menggunakan RM 20 - RM 12 dan mempunyai baki RM 8.', answer: 'Amin mempunyai RM 20 dan membeli sebuah buku berharga RM 12. Baki wangnya ialah RM 8.', accepted: ['Amin mempunyai RM 20 dan membeli sebuah buku berharga RM 12. Baki wangnya ialah RM 8.'], hint: 'Gunakan situasi pembelian dan nyatakan wang asal, harga serta baki.', explanation: 'Cerita boleh berbeza asalkan menggunakan RM 20 - RM 12 = RM 8 dalam situasi yang munasabah.', amounts: [2000, 1200], moneyOperation: 'subtraction', questionType: 'structured', marks: 3, rubric: CREATE_MONEY_STORY_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [20, 12, 8], semanticCues: ['beli', 'membeli', 'harga', 'baki', 'bayar'] } },
  { skill: 'mencipta_dua_harga', q: 'Mencipta: Tetapkan harga RM 4 dan RM 7 kepada dua barang, kemudian bina ayat jumlah RM 11.', answer: 'Pensel berharga RM 4 dan buku berharga RM 7. Jumlahnya RM 11.', accepted: ['Pensel berharga RM 4 dan buku berharga RM 7. Jumlahnya RM 11.'], hint: 'Namakan dua barang dan gunakan kedua-dua harga.', explanation: 'Contoh yang tepat menggunakan RM 4 + RM 7 = RM 11 untuk dua barang.', amounts: [400, 700], moneyOperation: 'addition', questionType: 'structured', marks: 3, rubric: CREATE_MONEY_STORY_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [4, 7, 11], semanticCues: ['harga', 'berharga', 'jumlah', 'barang'] } },
  { skill: 'mencipta_pelan_bajet', q: 'Mencipta: Dengan bajet RM 20, bina pelan membeli dua barang berharga RM 8 dan RM 6, kemudian nyatakan jumlah serta baki.', answer: 'Saya membeli buku RM 8 dan alat tulis RM 6. Jumlahnya RM 14 dan baki bajet ialah RM 6.', accepted: ['Saya membeli buku RM 8 dan alat tulis RM 6. Jumlahnya RM 14 dan baki bajet ialah RM 6.'], hint: 'Tambah dua harga dahulu, kemudian tolak daripada bajet.', explanation: 'RM 8 + RM 6 = RM 14 dan RM 20 - RM 14 = RM 6.', amounts: [800, 600], calculations: [[800, 600], [2000, 1400]], calculationOperations: ['addition', 'subtraction'], numericAnswerCents: 600, questionType: 'structured', marks: 3, rubric: CREATE_MONEY_STORY_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [20, 8, 6, 14], semanticCues: ['bajet', 'beli', 'membeli', 'jumlah', 'baki'] } }
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

function moneyResult(operation, amounts = []) {
  if (operation === 'identity') return amounts[0];
  if (operation === 'addition') return amounts.reduce((sum, value) => sum + value, 0);
  if (operation === 'subtraction') return amounts.slice(1).reduce((result, value) => result - value, amounts[0]);
  if (operation === 'multiplication') return amounts.reduce((product, value) => product * value, 1);
  if (operation === 'maximum') return Math.max(...amounts);
  if (operation === 'minimum') return Math.min(...amounts);
  if (operation === 'difference') return Math.max(...amounts) - Math.min(...amounts);
  return Number.NaN;
}

export const mathWangQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  const calculations = item.calculations || [item.amounts];
  const calculationOperations = item.calculationOperations || [item.moneyOperation];
  const calculationResultsCents = calculations.map((amounts, calculationIndex) => moneyResult(calculationOperations[calculationIndex], amounts));
  return Object.freeze({
    id: `MATH-WANG-PILOT-${String(index + 1).padStart(3, '0')}`,
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
      category: 'wang',
      assessmentCategory: 'pbd_matematik',
      operation: 'money',
      moneyUnit: 'sen',
      numberVariationPolicy: 'authored_locked',
      skill: item.skill,
      set: `wang_pilot_${index + 1}`,
      calculations,
      calculationOperations,
      calculationResultsCents,
      numericAnswerCents: Number.isFinite(item.numericAnswerCents) ? item.numericAnswerCents : calculationResultsCents.at(-1)
    }
  });
}));

export function enrichMathWangTopic(subject) {
  return {
    ...subject,
    curriculumFramework: MATH_YEAR_TWO_FRAMEWORK,
    topics: (subject.topics || []).map(topic => topic.id === 'wang' ? {
      ...topic,
      note: 'Mengenal dan menentukan nilai wang Malaysia hingga RM 100 serta menyelesaikan situasi tambah, tolak, jumlah, baki dan wang mencukupi.',
      learningObjective: 'Murid dapat mengenal, mewakilkan dan menggunakan nilai wang Malaysia hingga RM 100 dalam pengiraan dan situasi harian.',
      learningOutcome: 'Murid dapat membaca notasi ringgit dan sen, membina nilai setara, menambah dan menolak wang, menentukan baki serta menilai keputusan pembelian dengan tepat.',
      contentStatus: 'pilot',
      defaultQuestionType: 'short_answer',
      defaultMarks: 1,
      assessmentFramework: MATH_YEAR_TWO_FRAMEWORK,
      questions: mathWangQuestions
    } : topic)
  };
}

export default mathWangQuestions;
