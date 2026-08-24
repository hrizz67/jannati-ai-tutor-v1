export const MATH_YEAR_TWO_FRAMEWORK = Object.freeze({
  label: 'Dokumen Penjajaran KSSR (Semakan 2017) Edisi 3 Matematik Tahap I',
  authority: 'Kementerian Pendidikan Malaysia',
  sourceUrl: 'https://www.moe.gov.my/surat-siaran-kpm-bil-6-tahun-2024',
  assessment: 'Pentaksiran Bilik Darjah (PBD)'
});

const CONSTRUCT_NUMBER_RUBRIC = Object.freeze({
  totalMarks: 2,
  criteria: Object.freeze([
    { criterion: 'Mematuhi semua syarat nombor yang diberikan.', marks: 1 },
    { criterion: 'Menulis nombor atau urutan dengan tepat.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'nombor_selepas', q: 'Apakah nombor selepas 399?', answer: '400', accepted: ['400'], hint: 'Tambah 1 kepada 399.', explanation: '399 + 1 = 400.' },
  { skill: 'nombor_sebelum', q: 'Apakah nombor sebelum 700?', answer: '699', accepted: ['699'], hint: 'Tolak 1 daripada 700.', explanation: '700 - 1 = 699.' },
  { skill: 'digit_ratus', q: 'Nyatakan digit pada tempat ratus dalam nombor 582.', answer: '5', accepted: ['5'], hint: 'Tempat ratus ialah digit pertama dari kiri bagi nombor tiga digit.', explanation: 'Dalam 582, digit 5 berada pada tempat ratus.' },
  { skill: 'nilai_digit', q: 'Apakah nilai digit 8 dalam nombor 582?', answer: '80', accepted: ['80'], hint: 'Digit 8 berada pada tempat puluh.', explanation: '8 puluh bernilai 80.' },
  { skill: 'angka_daripada_perkataan', q: "Tulis 'tiga ratus dua puluh enam' dalam angka.", answer: '326', accepted: ['326'], hint: 'Gabungkan 300, 20 dan 6.', explanation: '300 + 20 + 6 = 326.' },
  { skill: 'perkataan_daripada_angka', q: 'Tulis nombor 704 dalam perkataan.', answer: 'tujuh ratus empat', accepted: ['tujuh ratus empat', 'tujuh ratus dan empat'], hint: '704 mempunyai 7 ratus, 0 puluh dan 4 sa.', explanation: '704 dibaca sebagai tujuh ratus empat.' },
  { skill: 'cerakinan', q: 'Apakah nombor bagi 900 + 40 + 2?', answer: '942', accepted: ['942'], hint: 'Gabungkan nilai ratus, puluh dan sa.', explanation: '900 + 40 + 2 = 942.' },
  { skill: 'digit_sa', q: 'Nyatakan digit pada tempat sa dalam nombor 630.', answer: '0', accepted: ['0', 'sifar'], hint: 'Tempat sa ialah digit paling kanan.', explanation: 'Dalam 630, digit pada tempat sa ialah 0.' },
  { skill: 'simbol_perbandingan', q: 'Isi simbol >, < atau =: 458 ___ 485.', answer: '<', accepted: ['<', 'lebih kecil daripada'], hint: 'Bandingkan digit ratus dahulu, kemudian digit puluh.', explanation: 'Ratus sama, tetapi 5 puluh kurang daripada 8 puluh. Oleh itu, 458 < 485.', questionType: 'fill_blank' },
  { skill: 'kira_menurun', q: 'Lengkapkan urutan menurun: 603, 602, ___.', answer: '601', accepted: ['601'], hint: 'Setiap nombor berkurang 1.', explanation: 'Selepas 602 apabila mengira menurun satu-satu ialah 601.', questionType: 'fill_blank' },

  { skill: 'perbandingan_nombor', q: 'Mengapakah 507 lebih besar daripada 490?', answer: 'kerana 507 mempunyai 5 ratus manakala 490 mempunyai 4 ratus', accepted: ['kerana 507 mempunyai 5 ratus manakala 490 mempunyai 4 ratus', '507 ada 5 ratus dan 490 ada 4 ratus'], hint: 'Bandingkan digit pada tempat ratus.', explanation: '5 ratus lebih besar daripada 4 ratus, maka 507 lebih besar daripada 490.', questionType: 'structured', marks: 2 },
  { skill: 'nilai_tempat', q: 'Apakah nilai tempat digit 6 dalam nombor 264?', answer: 'puluh', accepted: ['puluh', 'tempat puluh'], hint: 'Baca kedudukan digit dari kanan: sa, puluh, ratus.', explanation: 'Digit 6 berada pada tempat puluh.' },
  { skill: 'nilai_tempat_dan_digit', q: 'Dalam nombor 731, nyatakan nilai tempat dan nilai digit 3.', answer: 'tempat puluh dan nilainya 30', accepted: ['tempat puluh dan nilainya 30', 'puluh, 30', 'puluh dan 30'], hint: 'Bezakan nama tempat dengan nilai digit.', explanation: 'Digit 3 berada pada tempat puluh, jadi nilainya ialah 30.', questionType: 'structured', marks: 2 },
  { skill: 'cerakinan', q: 'Pilih cerakinan yang tepat bagi 806: 800 + 6 atau 80 + 6.', answer: '800 + 6', accepted: ['800 + 6', '800 + 0 + 6'], hint: 'Digit 8 berada pada tempat ratus.', explanation: '806 terdiri daripada 800, 0 puluh dan 6 sa.' },
  { skill: 'susunan_menaik', q: 'Susun 318, 381 dan 183 mengikut tertib menaik.', answer: '183, 318, 381', accepted: ['183, 318, 381', '183 318 381'], hint: 'Mulakan dengan nombor yang mempunyai nilai ratus paling kecil.', explanation: 'Urutan daripada paling kecil kepada paling besar ialah 183, 318, 381.', questionType: 'ordering', marks: 2 },
  { skill: 'susunan_menurun', q: 'Susun 720, 702 dan 270 mengikut tertib menurun.', answer: '720, 702, 270', accepted: ['720, 702, 270', '720 702 270'], hint: 'Mulakan dengan nombor paling besar.', explanation: '720 lebih besar daripada 702, dan kedua-duanya lebih besar daripada 270.', questionType: 'ordering', marks: 2 },
  { skill: 'pola_lima_lima', q: 'Apakah nombor seterusnya dalam pola 245, 250, 255, ___?', answer: '260', accepted: ['260'], hint: 'Cari beza antara dua nombor berturutan.', explanation: 'Pola bertambah 5 setiap kali, maka 255 + 5 = 260.', questionType: 'fill_blank' },
  { skill: 'pola_sepuluh_sepuluh', q: 'Lengkapkan pola 430, 440, 450, ___.', answer: '460', accepted: ['460'], hint: 'Setiap nombor bertambah 10.', explanation: '450 + 10 = 460.', questionType: 'fill_blank' },
  { skill: 'nombor_di_antara', q: 'Apakah nombor yang berada tepat di antara 599 dengan 601?', answer: '600', accepted: ['600'], hint: 'Kira satu nombor selepas 599.', explanation: 'Urutannya ialah 599, 600, 601.' },
  { skill: 'sempadan_1000', q: 'Apakah nombor selepas 999?', answer: '1000', accepted: ['1000', '1 000', 'seribu'], hint: 'Tambah 1 kepada 999.', explanation: '999 + 1 = 1000, iaitu seribu.' },

  { skill: 'baca_nombor', q: 'Kad nombor di perpustakaan menunjukkan 347. Tulis nombor itu dalam perkataan.', answer: 'tiga ratus empat puluh tujuh', accepted: ['tiga ratus empat puluh tujuh'], hint: 'Baca mengikut ratus, puluh dan sa.', explanation: '347 dibaca tiga ratus empat puluh tujuh.' },
  { skill: 'urutan_harian', q: 'Nombor giliran ialah 698, 699, ___. Apakah nombor giliran seterusnya?', answer: '700', accepted: ['700'], hint: 'Tambah 1 kepada 699.', explanation: 'Nombor selepas 699 ialah 700.', questionType: 'fill_blank' },
  { skill: 'urutan_menurun', q: 'Nombor rumah disusun menurun: 412, 411, ___. Lengkapkan urutan itu.', answer: '410', accepted: ['410'], hint: 'Tolak 1 daripada 411.', explanation: '411 - 1 = 410.', questionType: 'fill_blank' },
  { skill: 'perwakilan_nombor', q: 'Satu model mempunyai 6 ratus, 3 puluh dan 8 sa. Apakah nombornya?', answer: '638', accepted: ['638'], hint: 'Gabungkan 600, 30 dan 8.', explanation: '600 + 30 + 8 = 638.' },
  { skill: 'sifar_sebagai_pemegang_tempat', q: 'Apakah nombor yang mempunyai 9 ratus, 0 puluh dan 4 sa?', answer: '904', accepted: ['904'], hint: 'Digit 0 perlu kekal pada tempat puluh.', explanation: '9 ratus, 0 puluh dan 4 sa membentuk 904.' },
  { skill: 'pengumpulan_semula', q: 'Apakah nombor yang sama nilainya dengan 5 ratus dan 12 puluh?', answer: '620', accepted: ['620'], hint: '10 puluh bersamaan dengan 1 ratus.', explanation: '5 ratus + 12 puluh = 500 + 120 = 620.', questionType: 'structured', marks: 2 },
  { skill: 'banding_kuantiti', q: 'Sebuah bekas mempunyai 576 manik dan sebuah lagi mempunyai 567 manik. Bekas manakah mempunyai bilangan lebih banyak?', answer: 'bekas yang mempunyai 576 manik', accepted: ['bekas yang mempunyai 576 manik', '576 manik', '576'], hint: 'Bandingkan nilai puluh selepas nilai ratus sama.', explanation: '576 lebih besar daripada 567 kerana 7 puluh lebih besar daripada 6 puluh.' },
  { skill: 'susunan_empat_nombor', q: 'Susun 405, 450, 540 dan 504 daripada paling kecil kepada paling besar.', answer: '405, 450, 504, 540', accepted: ['405, 450, 504, 540', '405 450 504 540'], hint: 'Bandingkan digit dari kiri ke kanan.', explanation: 'Tertib menaik yang betul ialah 405, 450, 504, 540.', questionType: 'ordering', marks: 2 },
  { skill: 'nilai_puluh_hilang', q: 'Lengkapkan 300 + ___ + 7 = 357.', answer: '50', accepted: ['50'], hint: 'Cari nilai digit puluh dalam 357.', explanation: '357 = 300 + 50 + 7.', questionType: 'fill_blank' },
  { skill: 'nilai_ratus_hilang', q: 'Lengkapkan ___ + 20 + 9 = 629.', answer: 'Nilai ratus yang hilang ialah 600.', accepted: ['Nilai ratus yang hilang ialah 600.', '600'], hint: 'Cari nilai digit ratus dalam 629.', explanation: '629 = 600 + 20 + 9, jadi nilai ratus yang hilang ialah 600.', questionType: 'fill_blank' },
  { skill: 'pola_dua_dua', q: 'Lengkapkan pola 120, 122, 124, ___.', answer: '126', accepted: ['126'], hint: 'Tambah 2 setiap kali.', explanation: '124 + 2 = 126.', questionType: 'fill_blank' },
  { skill: 'pola_seratus_seratus', q: 'Lengkapkan pola 145, 245, 345, ___.', answer: '445', accepted: ['445'], hint: 'Nilai ratus bertambah 1 ratus.', explanation: '345 + 100 = 445.', questionType: 'fill_blank' },
  { skill: 'petunjuk_nilai_tempat', q: 'Suatu nombor mempunyai 8 ratus, digit puluh satu kurang daripada 5, dan 2 sa. Apakah nombor itu?', answer: '842', accepted: ['842'], hint: 'Satu kurang daripada 5 ialah 4.', explanation: '8 ratus, 4 puluh dan 2 sa membentuk 842.', questionType: 'structured', marks: 2 },
  { skill: 'nilai_digit_ratus', q: 'Apakah nilai digit 7 dalam nombor 709?', answer: 'Nilai digit 7 ialah 700.', accepted: ['Nilai digit 7 ialah 700.', '700'], hint: 'Digit 7 berada pada tempat ratus.', explanation: 'Digit 7 berada pada tempat ratus, maka nilainya ialah 700.' },
  { skill: 'angka_daripada_perkataan', q: "Tulis 'sembilan ratus sembilan puluh sembilan' dalam angka.", answer: '999', accepted: ['999'], hint: 'Gabungkan 900, 90 dan 9.', explanation: '900 + 90 + 9 = 999.' },

  { skill: 'analisis_kesilapan_cerakinan', q: 'Aisyah menulis 406 = 400 + 60. Adakah cerakinan itu betul? Berikan pembetulan.', answer: 'Tidak. 406 = 400 + 6.', accepted: ['Tidak. 406 = 400 + 6.', 'tidak, 400 + 6', '406 = 400 + 6'], hint: 'Perhatikan kedudukan digit 6.', explanation: 'Digit 6 berada pada tempat sa, bukan tempat puluh. Cerakinan yang betul ialah 406 = 400 + 6.', questionType: 'structured', marks: 2 },
  { skill: 'kesetaraan_perwakilan', q: 'Adakah 670 sama nilainya dengan 600 + 70? Jelaskan.', answer: 'Ya, kerana 600 + 70 = 670.', accepted: ['Ya, kerana 600 + 70 = 670.', 'ya, 600 + 70 = 670'], hint: 'Jumlahkan nilai ratus dan puluh.', explanation: '600 + 70 ialah 670, maka kedua-dua perwakilan adalah setara.', questionType: 'structured', marks: 2 },
  { skill: 'digit_hilang', q: 'Nombor 3_5 lebih besar daripada 365 tetapi lebih kecil daripada 385. Apakah digit yang hilang?', answer: '7', accepted: ['7'], hint: 'Uji digit puluh yang menghasilkan nombor antara 365 dengan 385.', explanation: '375 ialah satu-satunya nombor berbentuk 3_5 yang memenuhi kedua-dua syarat.', questionType: 'fill_blank', marks: 2 },
  { skill: 'digit_hilang', q: 'Nombor 8_2 lebih besar daripada 812 tetapi lebih kecil daripada 832. Apakah digit yang hilang?', answer: '2', accepted: ['2'], hint: 'Cari nombor puluh antara 1 dengan 3.', explanation: '822 berada antara 812 dengan 832, jadi digit yang hilang ialah 2.', questionType: 'fill_blank', marks: 2 },
  { skill: 'hubungan_digit', q: 'Suatu nombor mempunyai 4 ratus. Digit sa ialah 3 dan digit puluh ialah dua kali digit sa. Apakah nombor itu?', answer: '463', accepted: ['463'], hint: 'Dua kali 3 ialah 6.', explanation: 'Digitnya ialah 4 ratus, 6 puluh dan 3 sa, maka nombornya 463.', questionType: 'structured', marks: 2 },
  { skill: 'analisis_nombor_terbesar', q: 'Antara 609, 690 dan 906, nombor manakah paling besar? Terangkan berdasarkan nilai tempat.', answer: '906 kerana mempunyai 9 ratus', accepted: ['906 kerana mempunyai 9 ratus', '906, kerana 9 ratus paling besar'], hint: 'Bandingkan digit ratus dahulu.', explanation: '906 mempunyai 9 ratus, lebih besar daripada 6 ratus pada 609 dan 690.', questionType: 'structured', marks: 2 },
  { skill: 'analisis_susunan', q: 'Susunan 275, 257, 527 dikatakan tertib menaik. Betulkan susunan itu.', answer: '257, 275, 527', accepted: ['257, 275, 527', '257 275 527'], hint: 'Bandingkan dua nombor yang mempunyai 2 ratus.', explanation: '257 kurang daripada 275, dan kedua-duanya kurang daripada 527.', questionType: 'ordering', marks: 2 },
  { skill: 'analisis_pola', q: 'Lengkapkan pola 980, 880, 780, ___ dan nyatakan peraturannya.', answer: '680; tolak 100', accepted: ['680; tolak 100', '680, berkurang 100', '680 kerana tolak 100'], hint: 'Cari beza antara nombor berturutan.', explanation: 'Setiap nombor berkurang 100, maka 780 - 100 = 680.', questionType: 'structured', marks: 2 },
  { skill: 'analisis_pola', q: 'Apakah nombor seterusnya bagi 306, 316, 326, 336? Nyatakan peraturannya.', answer: '346; tambah 10', accepted: ['346; tambah 10', '346, bertambah 10', '346 kerana tambah 10'], hint: 'Bandingkan digit puluh setiap nombor.', explanation: 'Pola bertambah 10 setiap kali, maka nombor seterusnya ialah 346.', questionType: 'structured', marks: 2 },
  { skill: 'nilai_digit', q: 'Dalam nombor manakah digit 5 bernilai 50: 503, 350 atau 705?', answer: '350', accepted: ['350'], hint: 'Digit 5 mesti berada pada tempat puluh.', explanation: 'Dalam 350, digit 5 berada pada tempat puluh dan bernilai 50.' },
  { skill: 'pertukaran_kedudukan_digit', q: 'Digit puluh dan digit sa dalam 524 ditukar tempat. Apakah nombor baharu?', answer: '542', accepted: ['542'], hint: 'Kekalkan digit ratus 5, kemudian tukar kedudukan 2 dan 4.', explanation: '524 menjadi 542 apabila digit puluh dan sa bertukar tempat.', marks: 2 },
  { skill: 'hubungan_nilai_digit', q: 'Dalam nombor 880, berapa kali nilai digit 8 pertama berbanding nilai digit 8 kedua?', answer: '10 kali', accepted: ['10 kali', '10'], hint: 'Bandingkan 800 dengan 80.', explanation: '800 ialah 10 kali 80.', questionType: 'structured', marks: 2 },
  { skill: 'nombor_mengikut_syarat', q: 'Suatu nombor lebih besar daripada 640, lebih kecil daripada 650 dan digit sa ialah 7. Apakah nombor itu?', answer: '647', accepted: ['647'], hint: 'Nombor itu mempunyai 6 ratus dan 4 puluh.', explanation: '647 memenuhi semua syarat: 640 < 647 < 650 dan digit sa ialah 7.', questionType: 'structured', marks: 2 },
  { skill: 'pernyataan_benar', q: 'Pilih semua pernyataan benar. A: 572 > 527. B: 405 > 450. C: 699 < 700.', answer: 'A dan C', accepted: ['A dan C', 'A, C', 'A & C'], hint: 'Bandingkan setiap pasangan dari nilai tempat tertinggi.', explanation: 'A benar kerana 572 > 527, B salah kerana 405 < 450, dan C benar kerana 699 < 700.', questionType: 'multiple_response', marks: 2 },
  { skill: 'syarat_digit', q: 'Senaraikan semua nombor yang mempunyai 7 ratus serta jumlah digit puluh dan sa sebanyak 5: 714, 732 dan 750.', answer: '714, 732 dan 750', accepted: ['714, 732 dan 750', '714, 732, 750', '714 732 750'], hint: 'Jumlahkan dua digit terakhir setiap nombor.', explanation: 'Semua nombor diterima: 714, 732 dan 750 kerana 1 + 4, 3 + 2 dan 5 + 0 masing-masing bersamaan dengan 5.', questionType: 'multiple_response', marks: 2 },

  { skill: 'menilai_nilai_digit', q: 'Rina berkata nilai digit 4 dalam 748 ialah 40. Adakah Rina betul? Jelaskan.', answer: 'Ya, digit 4 berada pada tempat puluh dan bernilai 40.', accepted: ['Ya, digit 4 berada pada tempat puluh dan bernilai 40.', 'ya, 4 puluh ialah 40'], hint: 'Tentukan kedudukan digit 4.', explanation: 'Digit 4 berada pada tempat puluh, maka nilainya 40. Pernyataan Rina betul.', questionType: 'structured', marks: 2 },
  { skill: 'menilai_susunan', q: 'Ali menyusun 305, 350 dan 503 sebagai 305, 503, 350. Adakah susunan menaik itu tepat? Berikan susunan yang betul.', answer: 'Tidak. Susunan yang betul ialah 305, 350, 503.', accepted: ['Tidak. Susunan yang betul ialah 305, 350, 503.', 'tidak, 305, 350, 503'], hint: 'Bandingkan nilai ratus, kemudian puluh.', explanation: '350 masih kurang daripada 503, jadi susunan menaik ialah 305, 350, 503.', questionType: 'structured', marks: 2 },
  { skill: 'menilai_sempadan_1000', q: "Mia berkata nombor selepas 999 ialah '990'. Nilai jawapan Mia dan betulkannya.", answer: 'Jawapan Mia salah. Nombor selepas 999 ialah 1000.', accepted: ['Jawapan Mia salah. Nombor selepas 999 ialah 1000.', 'salah, 1000', 'tidak, nombor selepas 999 ialah 1000'], hint: 'Tambah 1 kepada 999.', explanation: '999 + 1 = 1000, bukan 990.', questionType: 'structured', marks: 2 },
  { skill: 'menilai_cerakinan', q: 'Manakah cerakinan yang betul bagi 347: 300 + 40 + 7 atau 30 + 40 + 7? Berikan sebab.', answer: '300 + 40 + 7 kerana digit 3 bernilai 300', accepted: ['300 + 40 + 7 kerana digit 3 bernilai 300', '300 + 40 + 7, kerana 3 ratus ialah 300'], hint: 'Lihat nilai digit 3.', explanation: 'Cerakinan yang betul ialah 300 + 40 + 7 kerana digit 3 berada pada tempat ratus dan bernilai 300.', questionType: 'structured', marks: 2 },
  { skill: 'menilai_pola', q: 'Seorang murid berkata pola 460, 470, 480, 490, 500 bertambah 100. Adakah peraturan itu tepat?', answer: 'Tidak. Pola itu bertambah 10.', accepted: ['Tidak. Pola itu bertambah 10.', 'tidak, tambah 10', 'tidak, bertambah 10'], hint: 'Cari beza 470 - 460.', explanation: 'Setiap nombor meningkat sebanyak 10, bukan 100.', questionType: 'structured', marks: 2 },

  { skill: 'membina_nombor_terbesar', q: 'Gunakan digit 4, 0 dan 8 sekali sahaja untuk membina nombor tiga digit yang paling besar.', answer: '840', accepted: ['840'], hint: 'Letakkan digit terbesar pada tempat ratus.', explanation: 'Susunan menurun digit 8, 4, 0 menghasilkan nombor terbesar, iaitu 840.', questionType: 'structured', marks: 2, rubric: CONSTRUCT_NUMBER_RUBRIC },
  { skill: 'membina_nombor_terkecil', q: 'Gunakan digit 0, 3 dan 7 sekali sahaja untuk membina nombor tiga digit yang paling kecil.', answer: '307', accepted: ['307'], hint: 'Digit ratus tidak boleh 0.', explanation: 'Digit bukan sifar terkecil, iaitu 3, mesti di tempat ratus. Nombor terkecil ialah 307.', questionType: 'structured', marks: 2, rubric: CONSTRUCT_NUMBER_RUBRIC },
  { skill: 'membina_nombor_nilai_tempat', q: 'Bina nombor yang mempunyai 6 ratus, nilai digit puluh 50 dan 2 sa.', answer: '652', accepted: ['652'], hint: 'Nilai digit puluh 50 bermaksud digit puluh ialah 5.', explanation: '6 ratus, 5 puluh dan 2 sa membentuk 652.', questionType: 'structured', marks: 2, rubric: CONSTRUCT_NUMBER_RUBRIC },
  { skill: 'membina_nombor_mengikut_julat', q: 'Bina satu nombor yang lebih besar daripada 470, lebih kecil daripada 480 dan mempunyai digit sa 5.', answer: '475', accepted: ['475'], hint: 'Nombor itu mempunyai 4 ratus dan 7 puluh.', explanation: '475 berada antara 470 dengan 480 dan digit sa ialah 5.', questionType: 'structured', marks: 2, rubric: CONSTRUCT_NUMBER_RUBRIC },
  { skill: 'membina_urutan', q: 'Bina tiga nombor berturutan yang berakhir dengan 500.', answer: '498, 499, 500', accepted: ['498, 499, 500', '498 499 500'], hint: 'Cari dua nombor tepat sebelum 500.', explanation: 'Tiga nombor berturutan itu ialah 498, 499 dan 500.', questionType: 'structured', marks: 2, rubric: CONSTRUCT_NUMBER_RUBRIC }
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
  mengingat: 40,
  memahami: 50,
  mengaplikasi: 65,
  menganalisis: 80,
  menilai: 90,
  mencipta: 105
});

export const mathNomborQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  return Object.freeze({
    id: `MATH-NOMBOR-PILOT-${String(index + 1).padStart(3, '0')}`,
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
      category: 'nombor',
      assessmentCategory: 'pbd_matematik',
      skill: item.skill,
      set: `nombor_pilot_${index + 1}`
    }
  });
}));

export function enrichMathNomborTopic(subject) {
  return {
    ...subject,
    curriculumFramework: MATH_YEAR_TWO_FRAMEWORK,
    topics: (subject.topics || []).map(topic => topic.id === 'nombor' ? {
      ...topic,
      note: 'Membaca, mewakilkan, membanding, menyusun dan menaakul nombor hingga 1000.',
      learningObjective: 'Murid dapat memahami nombor hingga 1000 melalui nilai tempat, cerakinan, perbandingan, urutan dan pola.',
      learningOutcome: 'Murid dapat membaca, menulis, mewakilkan, membanding, menyusun, menganalisis dan membina nombor hingga 1000 dengan tepat.',
      contentStatus: 'pilot',
      defaultQuestionType: 'short_answer',
      defaultMarks: 1,
      assessmentFramework: MATH_YEAR_TWO_FRAMEWORK,
      questions: mathNomborQuestions
    } : topic)
  };
}

export default mathNomborQuestions;
