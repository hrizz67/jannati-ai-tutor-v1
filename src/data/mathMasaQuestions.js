import { MATH_YEAR_TWO_FRAMEWORK } from './mathNomborQuestions.js';

const CONSTRUCT_TIME_RUBRIC = Object.freeze({
  totalMarks: 2,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua waktu, tempoh atau syarat yang diberikan.', marks: 1 },
    { criterion: 'Membina perwakilan masa dan jawapan yang tepat.', marks: 1 }
  ])
});

const CREATE_SCHEDULE_RUBRIC = Object.freeze({
  totalMarks: 3,
  criteria: Object.freeze([
    { criterion: 'Menggunakan waktu mula dan tempoh yang diberikan.', marks: 1 },
    { criterion: 'Membina aktiviti atau jadual yang jelas dan munasabah.', marks: 1 },
    { criterion: 'Menyatakan waktu tamat dengan tepat.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'hari_selepas_selasa', q: 'Dalam susunan hari seminggu, apakah hari yang hadir selepas Selasa?', answer: 'Hari selepas Selasa ialah Rabu.', accepted: ['Hari selepas Selasa ialah Rabu.', 'Rabu'], hint: 'Sebut urutan Isnin, Selasa, Rabu.', explanation: 'Dalam urutan seminggu, Rabu hadir selepas Selasa.', timeOperation: 'identity', values: [2, 0], numericAnswerMinutes: 2 },
  { skill: 'hari_sebelum_isnin', q: 'Dalam susunan hari seminggu, nyatakan hari yang hadir sebelum Isnin.', answer: 'Hari sebelum Isnin ialah Ahad.', accepted: ['Hari sebelum Isnin ialah Ahad.', 'Ahad'], hint: 'Urutan minggu berulang selepas Ahad.', explanation: 'Ahad diikuti oleh Isnin, maka hari sebelum Isnin ialah Ahad.', timeOperation: 'identity', values: [7, 0], numericAnswerMinutes: 7 },
  { skill: 'bilangan_hari_seminggu', q: 'Berapakah bilangan hari dalam satu minggu?', answer: 'Satu minggu mempunyai 7 hari.', accepted: ['Satu minggu mempunyai 7 hari.', '7 hari', '7'], hint: 'Kira dari Isnin hingga Ahad.', explanation: 'Satu minggu lengkap mempunyai 7 hari.', timeOperation: 'identity', values: [7, 0], numericAnswerMinutes: 7 },
  { skill: 'hubungan_jam_minit', q: 'Lengkapkan hubungan: 1 jam = ___ minit.', answer: 'Satu jam bersamaan dengan 60 minit.', accepted: ['Satu jam bersamaan dengan 60 minit.', '60 minit', '60'], hint: 'Jarum minit membuat satu pusingan lengkap.', explanation: 'Satu pusingan lengkap jarum minit mengambil 60 minit, iaitu 1 jam.', timeOperation: 'identity', values: [60, 0], questionType: 'fill_blank' },
  { skill: 'hubungan_setengah_jam', q: 'Berapakah minit dalam setengah jam?', answer: 'Setengah jam ialah 30 minit.', accepted: ['Setengah jam ialah 30 minit.', '30 minit', '30'], hint: 'Cari separuh daripada 60 minit.', explanation: '60 ÷ 2 = 30, jadi setengah jam bersamaan dengan 30 minit.', timeOperation: 'identity', values: [30, 0] },
  { skill: 'hubungan_suku_jam', q: 'Nyatakan bilangan minit dalam suku jam.', answer: 'Suku jam bersamaan dengan 15 minit.', accepted: ['Suku jam bersamaan dengan 15 minit.', '15 minit', '15'], hint: 'Bahagikan 60 minit kepada empat bahagian.', explanation: '60 ÷ 4 = 15, maka suku jam ialah 15 minit.', timeOperation: 'identity', values: [15, 0] },
  { skill: 'membaca_jam_tepat', q: 'Jam menunjukkan 8:00. Pukul berapakah itu?', answer: 'Waktu itu ialah pukul 8:00.', accepted: ['Waktu itu ialah pukul 8:00.', '8:00', 'pukul 8', '8'], hint: 'Dua sifar menunjukkan tepat pada jam.', explanation: '8:00 dibaca sebagai pukul lapan tepat.', timeOperation: 'identity', values: [480, 0], numericAnswerMinutes: 480 },
  { skill: 'membaca_setengah_jam', q: 'Baca waktu 3:30 dalam perkataan.', answer: 'Waktu 3:30 dibaca sebagai pukul tiga setengah.', accepted: ['Waktu 3:30 dibaca sebagai pukul tiga setengah.', 'pukul tiga setengah', '3:30'], hint: '30 minit selepas pukul 3 disebut setengah.', explanation: '3:30 ialah tiga puluh minit selepas pukul 3, iaitu pukul tiga setengah.', timeOperation: 'identity', values: [210, 0], numericAnswerMinutes: 210 },
  { skill: 'membaca_suku_jam', q: 'Jam digital menunjukkan 6:15. Nyatakan waktunya menggunakan perkataan “suku”.', answer: 'Waktu 6:15 dibaca sebagai pukul enam suku.', accepted: ['Waktu 6:15 dibaca sebagai pukul enam suku.', 'pukul enam suku', '6:15'], hint: '15 minit bersamaan dengan suku jam.', explanation: '6:15 ialah suku jam selepas pukul 6, maka disebut pukul enam suku.', timeOperation: 'identity', values: [375, 0], numericAnswerMinutes: 375 },
  { skill: 'mengenal_jam_dan_minit', q: 'Dalam tempoh 2 jam 20 minit, berapakah bahagian minitnya?', answer: 'Bahagian minit ialah 20 minit.', accepted: ['Bahagian minit ialah 20 minit.', '20 minit', '20'], hint: 'Lihat nilai yang ditulis selepas unit jam.', explanation: 'Tempoh itu mempunyai 2 jam dan tambahan 20 minit.', timeOperation: 'identity', values: [20, 0], numericAnswerMinutes: 20 },

  { skill: 'memahami_jarum_jam', q: 'Apakah yang ditunjukkan oleh jarum pendek pada muka jam?', answer: 'Jarum pendek menunjukkan jam.', accepted: ['Jarum pendek menunjukkan jam.', 'jam', 'bilangan jam'], hint: 'Bandingkan jarum pendek dengan jarum panjang.', explanation: 'Jarum pendek menunjukkan unit jam, manakala jarum panjang menunjukkan minit.', timeOperation: 'identity', values: [1, 0], numericAnswerMinutes: 1 },
  { skill: 'memahami_jarum_minit', q: 'Apakah yang ditunjukkan oleh jarum panjang pada muka jam?', answer: 'Jarum panjang menunjukkan minit.', accepted: ['Jarum panjang menunjukkan minit.', 'minit', 'bilangan minit'], hint: 'Jarum panjang bergerak mengelilingi tanda minit.', explanation: 'Jarum panjang digunakan untuk membaca minit.', timeOperation: 'identity', values: [60, 0], numericAnswerMinutes: 60 },
  { skill: 'kedudukan_jarum_minit_tepat', q: 'Di manakah jarum minit berada apabila waktu tepat pada jam?', answer: 'Jarum minit berada pada nombor 12.', accepted: ['Jarum minit berada pada nombor 12.', 'nombor 12', '12'], hint: 'Pada :00, jarum minit melengkapkan satu pusingan.', explanation: 'Apabila minit ialah 00, jarum minit menunjuk nombor 12.', timeOperation: 'identity', values: [12, 0], numericAnswerMinutes: 12 },
  { skill: 'kedudukan_jarum_minit_setengah', q: 'Jam menunjukkan pukul 4:30. Pada nombor manakah jarum minit berada?', answer: 'Jarum minit berada pada nombor 6.', accepted: ['Jarum minit berada pada nombor 6.', 'nombor 6', '6'], hint: 'Setiap nombor mewakili 5 minit.', explanation: '30 ÷ 5 = 6, maka pada 4:30 jarum minit menunjuk nombor 6.', timeOperation: 'identity', values: [6, 0], numericAnswerMinutes: 6 },
  { skill: 'kedudukan_jarum_minit_suku', q: 'Pada pukul 7:15, ke nombor manakah jarum minit menunjuk?', answer: 'Jarum minit menunjuk nombor 3.', accepted: ['Jarum minit menunjuk nombor 3.', 'nombor 3', '3'], hint: 'Tiga kumpulan lima minit bersamaan dengan 15 minit.', explanation: '15 ÷ 5 = 3, jadi jarum minit menunjuk nombor 3.', timeOperation: 'identity', values: [3, 0], numericAnswerMinutes: 3 },
  { skill: 'membandingkan_tempoh', q: 'Manakah lebih lama: 45 minit atau setengah jam?', answer: '45 minit lebih lama daripada setengah jam.', accepted: ['45 minit lebih lama daripada setengah jam.', '45 minit'], hint: 'Tukarkan setengah jam kepada minit.', explanation: 'Setengah jam = 30 minit. Oleh itu, 45 minit lebih lama sebanyak 15 minit.', timeOperation: 'maximum', values: [45, 30], numericAnswerMinutes: 45, questionType: 'structured', marks: 2 },
  { skill: 'memahami_tempoh_mula_tamat', q: 'Aktiviti bermula pada 2:00 dan tamat pada 3:00. Apakah maksud tempoh 1 jam itu?', answer: 'Aktiviti berlangsung selama 60 minit.', accepted: ['Aktiviti berlangsung selama 60 minit.', '1 jam', '60 minit'], hint: 'Cari beza antara waktu mula dengan waktu tamat.', explanation: 'Dari 2:00 hingga 3:00 ialah 1 jam, bersamaan dengan 60 minit.', timeOperation: 'difference', values: [180, 120], numericAnswerMinutes: 60, questionType: 'structured', marks: 2 },
  { skill: 'urutan_hari', q: 'Susun Isnin, Rabu dan Selasa mengikut urutan hari yang betul.', answer: 'Urutannya ialah Isnin, Selasa, Rabu.', accepted: ['Urutannya ialah Isnin, Selasa, Rabu.', 'Isnin, Selasa, Rabu'], hint: 'Mulakan dengan Isnin.', explanation: 'Dalam urutan seminggu, Isnin diikuti Selasa dan kemudian Rabu.', timeOperation: 'identity', values: [1, 2, 3], numericAnswerMinutes: 1, questionType: 'ordering', marks: 2 },
  { skill: 'hubungan_minggu_hari', q: 'Terangkan hubungan antara 2 minggu dengan bilangan hari.', answer: 'Dua minggu bersamaan dengan 14 hari.', accepted: ['Dua minggu bersamaan dengan 14 hari.', '14 hari', '14'], hint: 'Satu minggu mempunyai 7 hari.', explanation: '2 × 7 hari = 14 hari.', timeOperation: 'multiplication', values: [2, 7], numericAnswerMinutes: 14, questionType: 'structured', marks: 2 },
  { skill: 'hubungan_tahun_bulan', q: 'Lengkapkan: 1 tahun = ___ bulan.', answer: 'Satu tahun bersamaan dengan 12 bulan.', accepted: ['Satu tahun bersamaan dengan 12 bulan.', '12 bulan', '12'], hint: 'Kira bulan dari Januari hingga Disember.', explanation: 'Satu tahun kalendar mempunyai 12 bulan.', timeOperation: 'identity', values: [12, 0], numericAnswerMinutes: 12, questionType: 'fill_blank' },

  { skill: 'satu_jam_kemudian', q: 'Berapakah waktu 1 jam selepas 4:00?', answer: 'Satu jam selepas 4:00 ialah 5:00.', accepted: ['Satu jam selepas 4:00 ialah 5:00.', '5:00', 'pukul 5', '5'], hint: 'Tambah 60 minit.', explanation: '4:00 + 1 jam = 5:00.', timeOperation: 'addition', values: [240, 60], numericAnswerMinutes: 300 },
  { skill: 'setengah_jam_kemudian', q: 'Cari waktu 30 minit selepas 8:15.', answer: 'Waktunya ialah 8:45.', accepted: ['Waktunya ialah 8:45.', '8:45', 'pukul 8:45'], hint: 'Tambah 30 kepada 15 minit.', explanation: '15 minit + 30 minit = 45 minit, jadi 8:15 + 30 minit = 8:45.', timeOperation: 'addition', values: [495, 30], numericAnswerMinutes: 525 },
  { skill: 'suku_jam_kemudian', q: 'Jam menunjukkan 10:20. Apakah waktu 15 minit kemudian?', answer: 'Waktunya ialah 10:35.', accepted: ['Waktunya ialah 10:35.', '10:35', 'pukul 10:35'], hint: 'Tambah 15 minit kepada 20 minit.', explanation: '20 + 15 = 35 minit, maka waktunya 10:35.', timeOperation: 'addition', values: [620, 15], numericAnswerMinutes: 635 },
  { skill: 'waktu_sebelum', q: 'Apakah waktu 20 minit sebelum 7:00?', answer: 'Waktunya ialah 6:40.', accepted: ['Waktunya ialah 6:40.', '6:40', 'pukul 6:40'], hint: 'Undur 20 minit daripada tepat pukul 7.', explanation: '7:00 - 20 minit = 6:40.', timeOperation: 'subtraction', values: [420, 20], numericAnswerMinutes: 400 },
  { skill: 'tempoh_satu_jam_setengah', q: 'Tukarkan 1 jam 30 minit kepada minit.', answer: 'Tempohnya ialah 90 minit.', accepted: ['Tempohnya ialah 90 minit.', '90 minit', '90'], hint: 'Tambah 60 minit dengan 30 minit.', explanation: '1 jam = 60 minit, maka 60 + 30 = 90 minit.', timeOperation: 'addition', values: [60, 30], numericAnswerMinutes: 90 },
  { skill: 'tempoh_dua_jam', q: 'Berapakah minit dalam 2 jam?', answer: 'Dua jam bersamaan dengan 120 minit.', accepted: ['Dua jam bersamaan dengan 120 minit.', '120 minit', '120'], hint: 'Darab 2 dengan 60 minit.', explanation: '2 × 60 minit = 120 minit.', timeOperation: 'multiplication', values: [2, 60], numericAnswerMinutes: 120 },
  { skill: 'masalah_tempoh_kelas', q: 'Kelas bermula pada 9:00 dan tamat pada 10:30. Berapakah tempoh kelas?', answer: 'Tempoh kelas ialah 1 jam 30 minit.', accepted: ['Tempoh kelas ialah 1 jam 30 minit.', '1 jam 30 minit', '90 minit'], hint: 'Kira 9:00 hingga 10:00, kemudian 10:00 hingga 10:30.', explanation: 'Dari 9:00 hingga 10:00 ialah 1 jam dan tambahan 30 minit hingga 10:30. Jumlah tempohnya 90 minit.', timeOperation: 'difference', values: [630, 540], numericAnswerMinutes: 90, questionType: 'structured', marks: 2 },
  { skill: 'masalah_waktu_tamat', q: 'Latihan bermula pada 3:15 dan berlangsung 45 minit. Pukul berapakah latihan tamat?', answer: 'Latihan tamat pada 4:00.', accepted: ['Latihan tamat pada 4:00.', '4:00', 'pukul 4'], hint: 'Tambah 45 minit kepada 3:15.', explanation: '15 minit + 45 minit = 60 minit, jadi waktu bergerak ke 4:00.', timeOperation: 'addition', values: [195, 45], numericAnswerMinutes: 240, questionType: 'structured', marks: 2 },
  { skill: 'masalah_waktu_mula', q: 'Sebuah rancangan tamat pada 6:30 selepas berlangsung 30 minit. Bilakah rancangan bermula?', answer: 'Rancangan bermula pada 6:00.', accepted: ['Rancangan bermula pada 6:00.', '6:00', 'pukul 6'], hint: 'Tolak 30 minit daripada waktu tamat.', explanation: '6:30 - 30 minit = 6:00.', timeOperation: 'subtraction', values: [390, 30], numericAnswerMinutes: 360, questionType: 'structured', marks: 2 },
  { skill: 'masalah_hari_kemudian', q: 'Hari ini hari Khamis. Dua hari kemudian hari apa?', answer: 'Dua hari selepas Khamis ialah Sabtu.', accepted: ['Dua hari selepas Khamis ialah Sabtu.', 'Sabtu'], hint: 'Kira Jumaat sebagai satu hari dan Sabtu sebagai dua hari.', explanation: 'Selepas Khamis ialah Jumaat, kemudian Sabtu.', timeOperation: 'addition', values: [4, 2], numericAnswerMinutes: 6, questionType: 'structured', marks: 2 },
  { skill: 'masalah_hari_sebelum', q: 'Hari ini hari Selasa. Tiga hari sebelumnya hari apa?', answer: 'Tiga hari sebelum Selasa ialah Sabtu.', accepted: ['Tiga hari sebelum Selasa ialah Sabtu.', 'Sabtu'], hint: 'Undur melalui Isnin, Ahad dan Sabtu.', explanation: 'Satu hari sebelum Selasa ialah Isnin, dua hari ialah Ahad dan tiga hari ialah Sabtu.', timeOperation: 'subtraction', values: [9, 3], numericAnswerMinutes: 6, questionType: 'structured', marks: 2 },
  { skill: 'kalendar_tarikh_kemudian', q: 'Jika hari ini 12 Mei, apakah tarikh 5 hari kemudian?', answer: 'Tarikhnya ialah 17 Mei.', accepted: ['Tarikhnya ialah 17 Mei.', '17 Mei', '17'], hint: 'Tambah 5 kepada tarikh 12.', explanation: '12 + 5 = 17, jadi tarikhnya 17 Mei.', timeOperation: 'addition', values: [12, 5], numericAnswerMinutes: 17, questionType: 'structured', marks: 2 },
  { skill: 'kalendar_tarikh_sebelum', q: 'Jika suatu acara berlangsung pada 20 Jun, apakah tarikh 4 hari sebelumnya?', answer: 'Tarikhnya ialah 16 Jun.', accepted: ['Tarikhnya ialah 16 Jun.', '16 Jun', '16'], hint: 'Tolak 4 daripada tarikh 20.', explanation: '20 - 4 = 16, jadi tarikhnya 16 Jun.', timeOperation: 'subtraction', values: [20, 4], numericAnswerMinutes: 16, questionType: 'structured', marks: 2 },
  { skill: 'tempoh_dua_aktiviti', q: 'Amin membaca selama 25 minit dan menulis selama 35 minit. Berapakah jumlah tempohnya?', answer: 'Jumlah tempoh ialah 60 minit atau 1 jam.', accepted: ['Jumlah tempoh ialah 60 minit atau 1 jam.', '60 minit', '1 jam'], hint: 'Tambah kedua-dua tempoh.', explanation: '25 + 35 = 60 minit, bersamaan dengan 1 jam.', timeOperation: 'addition', values: [25, 35], numericAnswerMinutes: 60, questionType: 'structured', marks: 2 },
  { skill: 'tempoh_hilang', q: 'Lengkapkan: 20 minit + ___ minit = 1 jam.', answer: 'Tempoh yang hilang ialah 40 minit.', accepted: ['Tempoh yang hilang ialah 40 minit.', '40 minit', '40'], hint: 'Satu jam ialah 60 minit.', explanation: '60 - 20 = 40, maka 20 minit + 40 minit = 1 jam.', timeOperation: 'subtraction', values: [60, 20], numericAnswerMinutes: 40, questionType: 'fill_blank', marks: 2 },

  { skill: 'analisis_kesilapan_jam_minit', q: 'Sara berkata 1 jam = 100 minit. Kenal pasti kesilapan dan berikan hubungan yang betul.', answer: 'Sara salah; 1 jam bersamaan dengan 60 minit.', accepted: ['Sara salah; 1 jam bersamaan dengan 60 minit.', 'salah, 60 minit', '60 minit'], hint: 'Ingat satu pusingan lengkap jarum minit.', explanation: 'Sistem masa menggunakan 60 minit bagi setiap jam, bukan 100 minit.', timeOperation: 'identity', values: [60, 0], numericAnswerMinutes: 60, questionType: 'structured', marks: 2 },
  { skill: 'analisis_bacaan_jam_salah', q: 'Jam menunjukkan 5:30 tetapi Amir membacanya sebagai pukul lima suku. Betulkan bacaannya.', answer: 'Bacaan 5:30 yang betul ialah pukul lima setengah.', accepted: ['Bacaan 5:30 yang betul ialah pukul lima setengah.', 'pukul lima setengah', '5:30'], hint: '30 minit ialah setengah jam.', explanation: 'Suku jam ialah 15 minit, manakala 5:30 mempunyai 30 minit. Jadi bacaannya pukul lima setengah.', timeOperation: 'identity', values: [330, 0], numericAnswerMinutes: 330, questionType: 'structured', marks: 2 },
  { skill: 'membandingkan_dua_tempoh', q: 'Bandingkan 1 jam 20 minit dengan 75 minit. Tempoh manakah lebih lama dan berapa bezanya?', answer: '1 jam 20 minit lebih lama; bezanya 5 minit.', accepted: ['1 jam 20 minit lebih lama; bezanya 5 minit.', '80 minit, beza 5 minit', '5 minit'], hint: 'Tukarkan 1 jam 20 minit kepada minit.', explanation: '1 jam 20 minit = 80 minit. 80 - 75 = 5 minit.', timeOperation: 'difference', values: [80, 75], numericAnswerMinutes: 5, questionType: 'structured', marks: 3 },
  { skill: 'analisis_jadual_bertindih', q: 'Aktiviti A berlangsung 2:00–3:00. Aktiviti B bermula 2:45. Adakah kedua-dua aktiviti bertindih dan berapa lama?', answer: 'Ya, aktiviti bertindih selama 15 minit.', accepted: ['Ya, aktiviti bertindih selama 15 minit.', 'ya, 15 minit', '15 minit'], hint: 'Kira dari 2:45 hingga 3:00.', explanation: 'Aktiviti A belum tamat apabila B bermula pada 2:45. Tempoh 2:45 hingga 3:00 ialah 15 minit.', timeOperation: 'difference', values: [180, 165], numericAnswerMinutes: 15, questionType: 'structured', marks: 3 },
  { skill: 'maklumat_tidak_relevan_masa', q: 'Bas bertolak pada 8:10 dan tiba pada 8:50. Bas itu membawa 30 penumpang. Maklumat manakah tidak diperlukan dan berapakah tempoh perjalanan?', answer: 'Maklumat 30 penumpang tidak diperlukan; tempohnya 40 minit.', accepted: ['Maklumat 30 penumpang tidak diperlukan; tempohnya 40 minit.', '30 penumpang, 40 minit', '40 minit'], hint: 'Gunakan waktu bertolak dan tiba sahaja.', explanation: 'Bilangan penumpang tidak mempengaruhi tempoh. 8:50 - 8:10 = 40 minit.', timeOperation: 'difference', values: [530, 490], numericAnswerMinutes: 40, questionType: 'structured', marks: 3 },
  { skill: 'menyusun_tempoh', q: 'Susun 30 minit, 1 jam dan 45 minit daripada tempoh paling singkat kepada paling lama.', answer: 'Susunannya ialah 30 minit, 45 minit, 1 jam.', accepted: ['Susunannya ialah 30 minit, 45 minit, 1 jam.', '30 minit, 45 minit, 1 jam'], hint: 'Tukarkan 1 jam kepada 60 minit.', explanation: '30 < 45 < 60 minit, maka tertibnya 30 minit, 45 minit dan 1 jam.', timeOperation: 'minimum', values: [30, 60, 45], numericAnswerMinutes: 30, questionType: 'ordering', marks: 3 },
  { skill: 'analisis_waktu_tamat_merentasi_jam', q: 'Kelas bermula pada 10:45 dan berlangsung 30 minit. Terangkan bagaimana mendapatkan waktu tamat.', answer: 'Tambah 15 minit ke 11:00 dan baki 15 minit lagi; kelas tamat 11:15.', accepted: ['Tambah 15 minit ke 11:00 dan baki 15 minit lagi; kelas tamat 11:15.', '11:15', 'pukul 11:15'], hint: 'Pisahkan 30 minit kepada dua bahagian 15 minit.', explanation: '10:45 + 15 minit = 11:00, kemudian tambah 15 minit lagi menjadi 11:15.', timeOperation: 'addition', values: [645, 30], numericAnswerMinutes: 675, questionType: 'structured', marks: 3 },
  { skill: 'analisis_waktu_mula_daripada_tempoh', q: 'Latihan tamat pada 5:20 selepas berlangsung 50 minit. Tentukan waktu mula dan buktikan.', answer: 'Latihan bermula pada 4:30 kerana 4:30 + 50 minit = 5:20.', accepted: ['Latihan bermula pada 4:30 kerana 4:30 + 50 minit = 5:20.', '4:30', 'pukul 4:30'], hint: 'Undur 20 minit ke 5:00, kemudian 30 minit lagi.', explanation: '5:20 - 50 minit = 4:30 dan semakan 4:30 + 50 minit = 5:20.', timeOperation: 'subtraction', values: [320, 50], numericAnswerMinutes: 270, questionType: 'structured', marks: 3 },
  { skill: 'analisis_dua_kaedah_tempoh', q: 'Untuk tempoh 9:35 hingga 10:20, Kaedah A mengira 25 minit ke 10:00 dan 20 minit lagi. Kaedah B menambah 35 + 20. Tentukan kaedah yang tepat.', answer: 'Kaedah A tepat; tempohnya 45 minit.', accepted: ['Kaedah A tepat; tempohnya 45 minit.', 'A, 45 minit', '45 minit'], hint: 'Tempoh melintasi satu jam.', explanation: '9:35 hingga 10:00 ialah 25 minit dan hingga 10:20 tambahan 20 minit. Jumlahnya 45 minit.', timeOperation: 'difference', values: [620, 575], numericAnswerMinutes: 45, questionType: 'structured', marks: 2 },
  { skill: 'analisis_tempoh_aktiviti_berurutan', q: 'Aktiviti pertama mengambil 35 minit dan aktiviti kedua 50 minit. Jika bermula 1:15, pukul berapakah kedua-duanya selesai?', answer: 'Kedua-dua aktiviti selesai pada 2:40.', accepted: ['Kedua-dua aktiviti selesai pada 2:40.', '2:40', 'pukul 2:40'], hint: 'Tambah tempoh dahulu, kemudian tambah kepada waktu mula.', explanation: '35 + 50 = 85 minit, iaitu 1 jam 25 minit. 1:15 + 1 jam 25 minit = 2:40.', timeOperation: 'addition', values: [35, 50], calculations: [[35, 50], [75, 85]], calculationOperations: ['addition', 'addition'], numericAnswerMinutes: 160, questionType: 'structured', marks: 3 },
  { skill: 'analisis_kalendar_minggu', q: 'Sebuah kem bermula pada Isnin dan berlangsung 5 hari termasuk hari mula. Hari apakah kem berakhir?', answer: 'Kem berakhir pada hari Jumaat.', accepted: ['Kem berakhir pada hari Jumaat.', 'Jumaat'], hint: 'Kira Isnin sebagai hari pertama.', explanation: 'Hari pertama Isnin, kedua Selasa, ketiga Rabu, keempat Khamis dan kelima Jumaat.', timeOperation: 'addition', values: [1, 4], numericAnswerMinutes: 5, questionType: 'structured', marks: 2 },
  { skill: 'analisis_tempoh_hari', q: 'Cuti berlangsung dari 3 Ogos hingga 7 Ogos termasuk kedua-dua tarikh. Berapakah bilangan hari?', answer: 'Cuti itu berlangsung selama 5 hari.', accepted: ['Cuti itu berlangsung selama 5 hari.', '5 hari', '5'], hint: 'Kira tarikh 3, 4, 5, 6 dan 7.', explanation: 'Apabila kedua-dua tarikh dikira, terdapat 5 hari: 3, 4, 5, 6 dan 7 Ogos.', timeOperation: 'addition', values: [4, 1], numericAnswerMinutes: 5, questionType: 'structured', marks: 2 },
  { skill: 'analisis_kesilapan_tempoh', q: 'Mira berkata dari 11:50 hingga 12:10 ialah 60 minit. Betulkan pengiraannya.', answer: 'Tempoh yang betul ialah 20 minit.', accepted: ['Tempoh yang betul ialah 20 minit.', '20 minit', '20'], hint: 'Kira 10 minit ke 12:00 dan 10 minit lagi.', explanation: '11:50 hingga 12:00 ialah 10 minit dan 12:00 hingga 12:10 ialah 10 minit. Jumlahnya 20 minit.', timeOperation: 'difference', values: [730, 710], numericAnswerMinutes: 20, questionType: 'structured', marks: 2 },
  { skill: 'analisis_unit_tempoh_sesuai', q: 'Pilih unit yang lebih sesuai untuk tempoh memberus gigi: minit atau jam. Berikan alasan.', answer: 'Unit minit lebih sesuai kerana memberus gigi mengambil tempoh yang singkat.', accepted: ['Unit minit lebih sesuai kerana memberus gigi mengambil tempoh yang singkat.', 'minit'], hint: 'Bandingkan tempoh harian yang singkat dengan satu jam.', explanation: 'Memberus gigi biasanya mengambil beberapa minit, jadi unit minit lebih sesuai.', timeOperation: 'identity', values: [2, 0], numericAnswerMinutes: 2, questionType: 'structured', marks: 2 },

  { skill: 'menilai_ketepatan_waktu_tamat', q: 'Kumar berkata aktiviti yang bermula 2:30 dan berlangsung 40 minit tamat pada 3:10. Nilai pernyataannya.', answer: 'Pernyataan Kumar betul; waktu tamat ialah 3:10.', accepted: ['Pernyataan Kumar betul; waktu tamat ialah 3:10.', 'betul, 3:10', '3:10'], hint: 'Tambah 30 minit ke 3:00 dan 10 minit lagi.', explanation: '2:30 + 40 minit = 3:10, maka pernyataan Kumar betul.', timeOperation: 'addition', values: [150, 40], numericAnswerMinutes: 190, questionType: 'structured', marks: 2 },
  { skill: 'menilai_jawapan_tempoh_salah', q: 'Mei Ling menyatakan 7:45 hingga 8:15 mengambil 45 minit. Adakah jawapannya tepat?', answer: 'Tidak tepat; tempoh yang betul ialah 30 minit.', accepted: ['Tidak tepat; tempoh yang betul ialah 30 minit.', 'tidak, 30 minit', '30 minit'], hint: 'Kira 15 minit ke 8:00 dan 15 minit lagi.', explanation: '7:45 hingga 8:00 ialah 15 minit dan hingga 8:15 tambahan 15 minit. Jumlahnya 30 minit.', timeOperation: 'difference', values: [495, 465], numericAnswerMinutes: 30, questionType: 'structured', marks: 2 },
  { skill: 'menilai_strategi_tempoh', q: 'Untuk mencari tempoh 3:50 hingga 4:25, pilih strategi lebih cekap: A. kira 10 minit ke 4:00 dan 25 minit lagi atau B. tambah 50 + 25.', answer: 'Strategi A tepat dan cekap; tempohnya 35 minit.', accepted: ['Strategi A tepat dan cekap; tempohnya 35 minit.', 'A, 35 minit', '35 minit'], hint: 'Gunakan satu jam penuh sebagai titik perantaraan.', explanation: '3:50 hingga 4:00 ialah 10 minit, kemudian 25 minit hingga 4:25. Jumlahnya 35 minit.', timeOperation: 'difference', values: [265, 230], numericAnswerMinutes: 35, questionType: 'structured', marks: 2 },
  { skill: 'menilai_kemunasabahan_tempoh', q: 'Seorang murid mengatakan waktu rehat sekolah selama 20 minit bersamaan dengan 2 jam. Adakah pernyataan itu munasabah?', answer: 'Tidak munasabah; 20 minit jauh kurang daripada 2 jam atau 120 minit.', accepted: ['Tidak munasabah; 20 minit jauh kurang daripada 2 jam atau 120 minit.', 'tidak, 2 jam ialah 120 minit', 'tidak'], hint: 'Tukarkan 2 jam kepada minit.', explanation: '2 jam = 120 minit, sedangkan waktu rehat hanya 20 minit. Pernyataan itu tidak munasabah.', timeOperation: 'difference', values: [120, 20], numericAnswerMinutes: 120, questionType: 'structured', marks: 2 },
  { skill: 'menilai_jadual_realistik', q: 'Jadual menunjukkan sarapan 7:00–7:20 dan perjalanan ke sekolah 7:15–7:45. Nilai sama ada jadual itu boleh diikuti tanpa pertindihan.', answer: 'Tidak boleh; kedua-dua aktiviti bertindih selama 5 minit.', accepted: ['Tidak boleh; kedua-dua aktiviti bertindih selama 5 minit.', 'tidak, bertindih 5 minit', '5 minit'], hint: 'Bandingkan waktu perjalanan bermula dengan waktu sarapan tamat.', explanation: 'Perjalanan bermula 7:15 sedangkan sarapan tamat 7:20. Tempoh 7:15–7:20 bertindih selama 5 minit.', timeOperation: 'difference', values: [440, 435], numericAnswerMinutes: 5, questionType: 'structured', marks: 3 },

  { skill: 'mencipta_ayat_waktu_tamat', q: 'Mencipta: Bina ayat masa menggunakan waktu mula 4:15 dan tempoh 30 minit, kemudian nyatakan waktu tamat.', answer: 'Aktiviti bermula pada 4:15 dan berlangsung 30 minit. Aktiviti tamat pada 4:45.', accepted: ['Aktiviti bermula pada 4:15 dan berlangsung 30 minit. Aktiviti tamat pada 4:45.'], hint: 'Tambah 30 minit kepada 4:15.', explanation: '4:15 + 30 minit = 4:45.', timeOperation: 'addition', values: [255, 30], numericAnswerMinutes: 285, questionType: 'structured', marks: 3, rubric: CREATE_SCHEDULE_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [4, 15, 30, 45], semanticCues: ['mula', 'bermula', 'tamat', 'berlangsung', 'minit'] } },
  { skill: 'mencipta_perwakilan_setengah_jam', q: 'Mencipta: Tulis satu waktu yang menunjukkan setengah jam selepas pukul 6:00 dan terangkan kedudukan jarum minit.', answer: 'Waktunya 6:30 dan jarum minit menunjuk nombor 6.', accepted: ['Waktunya 6:30 dan jarum minit menunjuk nombor 6.', '6:30, jarum minit pada 6'], hint: 'Setengah jam ialah 30 minit.', explanation: '6:00 + 30 minit = 6:30 dan 30 minit meletakkan jarum minit pada nombor 6.', timeOperation: 'addition', values: [360, 30], numericAnswerMinutes: 390, questionType: 'structured', marks: 2, rubric: CONSTRUCT_TIME_RUBRIC, responseRules: { responseKind: 'representation', requiredNumbers: [6, 30, 6] } },
  { skill: 'mencipta_masalah_tempoh', q: 'Mencipta: Bina masalah cerita dengan waktu mula 9:20, waktu tamat 10:00 dan tempoh 40 minit.', answer: 'Kelas seni bermula pada 9:20 dan tamat pada 10:00. Tempoh kelas ialah 40 minit.', accepted: ['Kelas seni bermula pada 9:20 dan tamat pada 10:00. Tempoh kelas ialah 40 minit.'], hint: 'Namakan aktiviti dan gunakan kedua-dua waktu.', explanation: 'Cerita boleh berbeza asalkan 9:20 hingga 10:00 mewakili tempoh 40 minit.', timeOperation: 'difference', values: [600, 560], numericAnswerMinutes: 40, questionType: 'structured', marks: 3, rubric: CREATE_SCHEDULE_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [9, 20, 10, 40], semanticCues: ['mula', 'bermula', 'tamat', 'tempoh', 'minit'] } },
  { skill: 'mencipta_jadual_dua_aktiviti', q: 'Mencipta: Susun dua aktiviti berturutan bermula 2:00, masing-masing 30 minit, tanpa pertindihan. Nyatakan semua waktu.', answer: 'Aktiviti pertama 2:00–2:30 dan aktiviti kedua 2:30–3:00.', accepted: ['Aktiviti pertama 2:00–2:30 dan aktiviti kedua 2:30–3:00.'], hint: 'Aktiviti kedua bermula apabila aktiviti pertama tamat.', explanation: 'Dua tempoh 30 minit bermula 2:00 menghasilkan sela 2:00–2:30 dan 2:30–3:00.', timeOperation: 'addition', values: [120, 30], calculations: [[120, 30], [150, 30]], calculationOperations: ['addition', 'addition'], numericAnswerMinutes: 180, questionType: 'structured', marks: 3, rubric: CREATE_SCHEDULE_RUBRIC, responseRules: { responseKind: 'schedule', requiredNumbers: [2, 30, 3], semanticCues: ['aktiviti', 'mula', 'tamat', 'pertama', 'kedua'] } },
  { skill: 'mencipta_kalendar_mingguan', q: 'Mencipta: Bina rancangan membaca selama 3 hari berturut-turut bermula Rabu dan nyatakan hari terakhir.', answer: 'Saya membaca pada Rabu, Khamis dan Jumaat. Hari terakhir ialah Jumaat.', accepted: ['Saya membaca pada Rabu, Khamis dan Jumaat. Hari terakhir ialah Jumaat.'], hint: 'Kira Rabu sebagai hari pertama.', explanation: 'Tiga hari berturutan bermula Rabu ialah Rabu, Khamis dan Jumaat.', timeOperation: 'addition', values: [3, 2], numericAnswerMinutes: 5, questionType: 'structured', marks: 3, rubric: CREATE_SCHEDULE_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [3], requiredWords: ['Rabu', 'Khamis', 'Jumaat'], semanticCues: ['baca', 'membaca', 'hari', 'rancangan'] } },
  { skill: 'mencipta_masalah_penukaran_tempoh', q: 'Mencipta: Bina masalah cerita yang menggabungkan dua tempoh 60 minit dan mempunyai jumlah 2 jam atau 120 minit.', answer: 'Aina membaca 60 minit pada waktu pagi dan 60 minit pada waktu petang. Jumlah tempohnya ialah 2 jam atau 120 minit.', accepted: ['Aina membaca 60 minit pada waktu pagi dan 60 minit pada waktu petang. Jumlah tempohnya ialah 2 jam atau 120 minit.'], hint: 'Gunakan dua aktiviti 60 minit dan nyatakan jumlah dalam jam serta minit.', explanation: '60 minit + 60 minit = 120 minit, bersamaan dengan 2 jam.', timeOperation: 'addition', values: [60, 60], numericAnswerMinutes: 120, questionType: 'structured', marks: 3, rubric: CREATE_SCHEDULE_RUBRIC, responseRules: { responseKind: 'story', requiredNumbers: [60, 2, 120], semanticCues: ['tempoh', 'jumlah', 'minit', 'jam'] } }
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

function timeResult(operation, values = []) {
  if (operation === 'identity') return values[0];
  if (operation === 'addition') return values.reduce((sum, value) => sum + value, 0);
  if (operation === 'subtraction') return values.slice(1).reduce((result, value) => result - value, values[0]);
  if (operation === 'multiplication') return values.reduce((product, value) => product * value, 1);
  if (operation === 'maximum') return Math.max(...values);
  if (operation === 'minimum') return Math.min(...values);
  if (operation === 'difference') return Math.max(...values) - Math.min(...values);
  return Number.NaN;
}

export const mathMasaQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  const calculations = item.calculations || [item.values];
  const calculationOperations = item.calculationOperations || [item.timeOperation];
  const calculationResultsMinutes = calculations.map((values, calculationIndex) => timeResult(calculationOperations[calculationIndex], values));
  return Object.freeze({
    id: `MATH-MASA-PILOT-${String(index + 1).padStart(3, '0')}`,
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
      category: 'masa',
      assessmentCategory: 'pbd_matematik',
      operation: 'time',
      timeUnit: item.timeUnit || 'minute',
      numberVariationPolicy: 'authored_locked',
      skill: item.skill,
      set: `masa_pilot_${index + 1}`,
      calculations,
      calculationOperations,
      calculationResultsMinutes,
      calculationResults: calculationResultsMinutes,
      numericAnswerMinutes: Number.isFinite(item.numericAnswerMinutes) ? item.numericAnswerMinutes : calculationResultsMinutes.at(-1),
      numericAnswer: Number.isFinite(item.numericAnswerMinutes) ? item.numericAnswerMinutes : calculationResultsMinutes.at(-1)
    }
  });
}));

export function enrichMathMasaTopic(subject) {
  return {
    ...subject,
    curriculumFramework: MATH_YEAR_TWO_FRAMEWORK,
    topics: (subject.topics || []).map(topic => topic.id === 'masa' ? {
      ...topic,
      note: 'Membaca dan menulis waktu, memahami hubungan unit masa serta menentukan tempoh, waktu mula, waktu tamat, hari dan tarikh dalam situasi harian.',
      learningObjective: 'Murid dapat membaca waktu dan menggunakan hubungan jam, minit, hari, minggu, bulan dan tahun dalam pengiraan serta situasi harian.',
      learningOutcome: 'Murid dapat membaca jam tepat, suku dan setengah jam, menukar unit, menentukan tempoh atau waktu, mentafsir kalendar serta menilai dan membina jadual dengan tepat.',
      contentStatus: 'pilot',
      defaultQuestionType: 'short_answer',
      defaultMarks: 1,
      assessmentFramework: MATH_YEAR_TWO_FRAMEWORK,
      questions: mathMasaQuestions
    } : topic)
  };
}

export default mathMasaQuestions;
