export const YEAR_TWO_ASSESSMENT_FRAMEWORK = Object.freeze({
  label: 'Pentaksiran Sumatif PBD Tahun 2',
  officialUasaScope: 'UASA sekolah rendah melibatkan Tahun 4 hingga Tahun 6.',
  authority: 'Kementerian Pendidikan Malaysia',
  sourceUrl: 'https://www.moe.gov.my/storage/files/shares/pekeliling_dan_garis_panduan/Panduan%20Pengurusan%20PBS%20Edisi%201%20Tahun%202025.pdf'
});

const CREATE_SENTENCE_RUBRIC = Object.freeze({
  totalMarks: 3,
  criteria: Object.freeze([
    { criterion: 'Menggunakan semua kata kunci mengikut maksud yang betul.', marks: 1 },
    { criterion: 'Membina ayat gramatis dan munasabah.', marks: 1 },
    { criterion: 'Menggunakan huruf besar dan tanda baca akhir yang betul.', marks: 1 }
  ])
});

const ITEMS = [
  { skill: 'kata_nama_am', q: "Dalam ayat 'Ibu membeli sayur di pasar', yang manakah kata nama am bagi tempat?", answer: 'pasar', accepted: ['pasar'], hint: 'Cari tempat ibu membeli sayur.', explanation: 'Pasar ialah kata nama am bagi tempat.' },
  { skill: 'kata_kerja', q: "Kenal pasti kata kerja dalam ayat 'Amir menyiram pokok bunga'.", answer: 'menyiram', accepted: ['menyiram'], hint: 'Cari perkataan yang menunjukkan perbuatan.', explanation: 'Menyiram ialah perbuatan yang dilakukan oleh Amir.' },
  { skill: 'kata_adjektif', q: "Kenal pasti kata adjektif dalam ayat 'Bilik itu sangat bersih'.", answer: 'bersih', accepted: ['bersih'], hint: 'Cari perkataan yang menerangkan keadaan bilik.', explanation: 'Bersih ialah kata adjektif yang menerangkan keadaan bilik.' },
  { skill: 'tanda_baca', q: "Apakah tanda baca pada akhir ayat 'Di manakah buku saya___'?", answer: '?', accepted: ['?', 'tanda soal'], hint: 'Ayat itu meminta jawapan.', explanation: 'Ayat tanya perlu diakhiri dengan tanda soal.' },
  { skill: 'simpulan_bahasa', q: "Terangkan maksud 'ringan tulang' apabila digunakan untuk menggambarkan seseorang.", answer: 'rajin bekerja atau suka membantu', accepted: ['rajin bekerja atau suka membantu', 'rajin membantu', 'suka membantu', 'rajin bekerja'], hint: 'Fikirkan orang yang suka melakukan kerja.', explanation: 'Ringan tulang bermaksud rajin bekerja atau suka membantu.' },

  { skill: 'pemahaman_tersurat', q: 'Baca teks: Pada pagi Ahad, Nadia membantu ayah membersihkan halaman rumah. Siapakah yang membantu ayah?', answer: 'Nadia', accepted: ['Nadia'], hint: 'Cari nama pada awal teks.', explanation: 'Teks menyatakan bahawa Nadia membantu ayah.' },
  { skill: 'pemahaman_tersurat', q: 'Baca teks: Pada pagi Ahad, Nadia membantu ayah membersihkan halaman rumah. Di manakah mereka bekerja?', answer: 'di halaman rumah', accepted: ['di halaman rumah', 'halaman rumah'], hint: 'Cari frasa tempat dalam teks.', explanation: 'Mereka membersihkan halaman rumah.' },
  { skill: 'ejaan_kata_sendi', q: "Mengapakah 'di sekolah' ditulis terpisah?", answer: "kerana 'di' ialah kata sendi nama yang menunjukkan tempat", accepted: ["kerana 'di' ialah kata sendi nama yang menunjukkan tempat", 'di ialah kata sendi nama tempat', 'kerana menunjukkan tempat'], hint: 'Tentukan fungsi di sebelum kata sekolah.', explanation: 'Di yang menunjukkan tempat ialah kata sendi nama dan ditulis terpisah.', questionType: 'structured' },
  { skill: 'kata_bantu', q: "Apakah maksud kata bantu 'sedang' dalam ayat 'Murid sedang membaca'?", answer: 'perbuatan masih berlaku', accepted: ['perbuatan masih berlaku', 'perbuatan sedang berlaku', 'belum selesai'], hint: 'Perbuatan membaca berlaku sekarang.', explanation: 'Sedang menunjukkan perbuatan masih berlangsung.' },
  { skill: 'jenis_ayat', q: "Apakah jenis ayat 'Tolong tutup pintu itu.'?", answer: 'ayat perintah berbentuk permintaan', accepted: ['ayat perintah berbentuk permintaan', 'ayat perintah', 'ayat permintaan'], hint: 'Perhatikan kata tolong.', explanation: 'Kata tolong menandakan ayat perintah berbentuk permintaan.' },
  { skill: 'tajuk', q: "Baca teks: 'Ravi menyapu lantai. Mei Ling mengelap tingkap. Kelas mereka menjadi bersih.' Pilih tajuk terbaik.", answer: 'Membersihkan Kelas', accepted: ['Membersihkan Kelas'], options: ['Membersihkan Kelas', 'Bermain di Padang', 'Lawatan ke Zoo'], hint: 'Pilih tajuk yang merangkumi semua perbuatan.', explanation: 'Semua ayat menceritakan aktiviti membersihkan kelas.' },
  { skill: 'inferens_perasaan', q: 'Aina menerima hadiah buku yang sangat diingininya lalu tersenyum lebar. Apakah perasaan Aina?', answer: 'gembira', accepted: ['gembira', 'sangat gembira', 'besar hati'], hint: 'Senyuman lebar dan hadiah yang diingini ialah petunjuk.', explanation: 'Aina berasa gembira kerana menerima hadiah yang diingininya.' },
  { skill: 'kata_hubung', q: "Apakah fungsi 'dan' dalam ayat 'Siti membaca dan menulis'?", answer: 'menghubungkan dua perbuatan', accepted: ['menghubungkan dua perbuatan', 'menggabungkan membaca dengan menulis'], hint: 'Perhatikan perkataan di kiri dan kanan dan.', explanation: 'Dan menghubungkan perbuatan membaca dengan menulis.' },
  { skill: 'kata_sendi', q: "Mengapakah 'daripada' digunakan dalam ayat 'Meja itu dibuat daripada kayu'?", answer: 'kerana menunjukkan bahan', accepted: ['kerana menunjukkan bahan', 'menunjukkan bahan', 'kayu ialah bahan'], hint: 'Kayu digunakan untuk membentuk meja.', explanation: 'Daripada digunakan untuk menyatakan bahan asal sesuatu benda.' },
  { skill: 'kata_ganti_nama', q: "Baca ayat: 'Mira meminjam buku. Dia membacanya di rumah.' Siapakah 'Dia'?", answer: 'Mira', accepted: ['Mira'], hint: 'Kata ganti itu merujuk nama dalam ayat pertama.', explanation: 'Dia merujuk kepada Mira.' },

  { skill: 'kata_sendi', q: "Lengkapkan ayat: 'Faris berjalan ______ perpustakaan untuk meminjam buku.'", answer: 'ke', accepted: ['ke'], hint: 'Gunakan kata sendi untuk arah atau destinasi.', explanation: 'Ke menunjukkan tempat yang dituju oleh Faris.' },
  { skill: 'kata_sendi', q: "Lengkapkan ayat: 'Hadiah itu diberikan ______ pemenang pertandingan.'", answer: 'kepada', accepted: ['kepada'], hint: 'Pemenang ialah penerima.', explanation: 'Kepada digunakan untuk menunjukkan penerima.' },
  { skill: 'susunan_ayat', q: "Susun frasa 'di taman / bermain bola / kanak-kanak' menjadi ayat lengkap.", answer: 'Kanak-kanak bermain bola di taman.', accepted: ['Kanak-kanak bermain bola di taman.', 'Kanak-kanak bermain bola di taman'], hint: 'Mulakan dengan pelaku, kemudian perbuatan dan tempat.', explanation: 'Susunan subjek-predikat yang betul ialah Kanak-kanak bermain bola di taman.', questionType: 'ordering', marks: 2 },
  { skill: 'kata_hubung', q: "Gabungkan 'Aina menyusun buku' dengan 'Aina mengelap meja' menggunakan 'dan'.", answer: 'Aina menyusun buku dan mengelap meja.', accepted: ['Aina menyusun buku dan mengelap meja.', 'Aina menyusun buku dan mengelap meja'], hint: 'Kekalkan satu subjek dan gabungkan dua perbuatan.', explanation: 'Dua predikat bagi subjek yang sama boleh digabungkan dengan dan.', questionType: 'structured', marks: 2 },
  { skill: 'tanda_baca', q: "Lengkapkan ayat seruan 'Wah, cantiknya lukisan itu___' dengan tanda baca.", answer: '!', accepted: ['!', 'tanda seru'], hint: 'Wah menunjukkan rasa kagum.', explanation: 'Ayat seruan perlu diakhiri dengan tanda seru.' },
  { skill: 'penjodoh_bilangan', q: "Lengkapkan frasa: '______ pensel merah'", answer: 'sebatang', accepted: ['sebatang', 'batang'], hint: 'Pensel berbentuk panjang.', explanation: 'Batang ialah penjodoh bilangan yang sesuai untuk pensel.' },
  { skill: 'kata_ganti_nama', q: "Ali dan Abu bermain bola. ______ bermain di padang.", answer: 'Mereka', accepted: ['Mereka', 'mereka'], hint: 'Gantikan dua orang dengan satu kata ganti nama.', explanation: 'Mereka digunakan untuk merujuk lebih daripada seorang.' },
  { skill: 'kata_adjektif', q: "Lengkapkan ayat: 'Hujan turun dengan ______ pada petang itu.'", answer: 'lebat', accepted: ['lebat'], hint: 'Pilih perkataan yang menerangkan keadaan hujan.', explanation: 'Lebat ialah kata adjektif yang sesuai untuk hujan.' },
  { skill: 'ejaan', q: "Betulkan ayat 'Murid berkumpul disekolah.'", answer: 'Murid berkumpul di sekolah.', accepted: ['Murid berkumpul di sekolah.', 'Murid berkumpul di sekolah'], hint: 'Kata sendi tempat di ditulis terpisah.', explanation: 'Di sekolah ditulis terpisah kerana menunjukkan tempat.', questionType: 'structured' },
  { skill: 'bina_ayat', q: "Gunakan maklumat 'Datuk - menyiram pokok bunga - pada waktu petang' untuk menulis ayat lengkap.", answer: 'Datuk menyiram pokok bunga pada waktu petang.', accepted: ['Datuk menyiram pokok bunga pada waktu petang.', 'Datuk menyiram pokok bunga pada waktu petang'], hint: 'Susun sebagai pelaku, perbuatan, objek dan masa.', explanation: 'Ayat lengkap menggunakan semua maklumat dalam susunan yang jelas.', questionType: 'structured', marks: 2 },
  { skill: 'pemahaman_sebab', q: 'Baca teks: Hakim memakai baju hujan supaya badannya tidak basah. Mengapakah Hakim memakai baju hujan?', answer: 'supaya badannya tidak basah', accepted: ['supaya badannya tidak basah', 'supaya tidak basah'], hint: 'Cari tujuan selepas kata supaya.', explanation: 'Teks menyatakan Hakim memakai baju hujan supaya badannya tidak basah.' },
  { skill: 'urutan', q: "Lengkapkan ayat dengan 'sebelum' atau 'selepas': 'Iman mencuci tangan ______ makan.'", answer: 'sebelum', accepted: ['sebelum'], hint: 'Tangan perlu dibersihkan dahulu.', explanation: 'Mencuci tangan dilakukan sebelum makan.' },
  { skill: 'simpulan_bahasa', q: 'Farah membaca buku pada setiap waktu lapang. Apakah simpulan bahasa yang sesuai?', answer: 'ulat buku', accepted: ['ulat buku'], hint: 'Pilih gelaran bagi orang yang rajin membaca.', explanation: 'Farah sesuai digelar ulat buku.' },
  { skill: 'ayat_sopan', q: "Pilih permintaan yang paling sopan kepada tetamu.", answer: 'Sila duduk di tempat yang disediakan.', accepted: ['Sila duduk di tempat yang disediakan.'], options: ['Sila duduk di tempat yang disediakan.', 'Duduk sekarang!', 'Kamu mesti duduk.'], hint: 'Cari kata silaan dan nada hormat.', explanation: 'Kata sila menjadikan arahan sesuai dan sopan untuk tetamu.' },
  { skill: 'keselamatan', q: 'Aina mahu melintas jalan. Apakah tindakan paling selamat?', answer: 'Melihat kiri dan kanan sebelum melintas.', accepted: ['Melihat kiri dan kanan sebelum melintas.', 'melihat kiri dan kanan sebelum melintas', 'Aina melihat kiri dan kanan sebelum melintas'], options: ['Melihat kiri dan kanan sebelum melintas.', 'Berlari terus ke seberang.', 'Bermain di tengah jalan.'], hint: 'Pilih tindakan yang mengurangkan risiko kemalangan.', explanation: 'Melihat kiri dan kanan membantu memastikan jalan selamat sebelum melintas.' },

  { skill: 'kata_sendi', q: "Analisis: 'Pak cik datang dari Kedah' dan 'Bakul dibuat daripada rotan'. Adakah kedua-dua kata sendi tepat? Jelaskan.", answer: "Ya. 'Dari' menunjukkan tempat asal dan 'daripada' menunjukkan bahan.", accepted: ["Ya. 'Dari' menunjukkan tempat asal dan 'daripada' menunjukkan bahan.", 'ya, dari untuk tempat dan daripada untuk bahan', 'kedua-duanya tepat'], hint: 'Bezakan tempat asal daripada bahan.', explanation: 'Dari digunakan untuk tempat atau arah, manakala daripada digunakan untuk bahan atau sumber.', questionType: 'structured', marks: 2 },
  { skill: 'suntingan', q: "Ayat 'adik membaca buku di bilik' mempunyai dua kesalahan mekanik. Tulis semula ayat itu dengan betul.", answer: 'Adik membaca buku di bilik.', accepted: ['Adik membaca buku di bilik.', 'Adik membaca buku di bilik'], hint: 'Semak huruf awal dan tanda baca akhir.', explanation: 'Ayat perlu bermula dengan huruf besar dan berakhir dengan noktah.', questionType: 'structured', marks: 2 },
  { skill: 'pola_ayat', q: "Huraikan subjek dan predikat dalam ayat 'Murid-murid membaca buku cerita di perpustakaan'.", answer: 'Subjek: Murid-murid; predikat: membaca buku cerita di perpustakaan', accepted: ['Subjek: Murid-murid; predikat: membaca buku cerita di perpustakaan', 'Murid-murid; membaca buku cerita di perpustakaan'], hint: 'Pisahkan pelaku daripada cerita tentangnya.', explanation: 'Murid-murid ialah subjek dan bahagian selebihnya ialah predikat.', questionType: 'structured', marks: 2 },
  { skill: 'bukti_teks', q: "Baca teks: 'Pada hari Selasa, Sara meminjam buku Haiwan. Buku itu mesti dipulangkan pada hari Jumaat.' Apakah bukti hari pemulangannya?", answer: 'Buku itu mesti dipulangkan pada hari Jumaat.', accepted: ['Buku itu mesti dipulangkan pada hari Jumaat.', 'mesti dipulangkan pada hari Jumaat', 'hari Jumaat'], hint: 'Salin bahagian yang menyatakan kewajipan dan hari.', explanation: 'Ayat kedua menjadi bukti bahawa hari pemulangan ialah Jumaat.', questionType: 'structured', marks: 2 },
  { skill: 'bukti_teks', q: "Berdasarkan teks 'Sara meminjam buku pada hari Selasa dan mesti memulangkannya pada hari Jumaat', jawapan manakah tidak disokong?", answer: 'Sara membeli buku pada hari Rabu.', accepted: ['Sara membeli buku pada hari Rabu.'], options: ['Sara meminjam buku pada hari Selasa.', 'Sara perlu memulangkan buku pada hari Jumaat.', 'Sara membeli buku pada hari Rabu.'], hint: 'Pilih maklumat yang tidak terdapat dalam teks.', explanation: 'Teks tidak menyatakan Sara membeli buku atau menyebut hari Rabu.' },
  { skill: 'kata_ganti_nama', q: "Baca ayat: 'Aina memberikan pensel kepada Siti kerana dia terlupa membawanya.' Dalam konteks ini, siapakah yang paling munasabah dirujuk oleh 'dia'?", answer: 'Siti', accepted: ['Siti'], hint: 'Orang yang menerima pensel mungkin orang yang terlupa membawanya.', explanation: 'Siti paling munasabah dirujuk oleh dia kerana Aina memberikan pensel kepadanya.', questionType: 'structured', marks: 2 },
  { skill: 'simpulan_bahasa', q: "Analisis: Kumar mencipta cara mengambil bola di bawah almari. Antara 'panjang akal' dengan 'otak cair', yang manakah lebih tepat?", answer: 'panjang akal', accepted: ['panjang akal'], options: ['panjang akal', 'otak cair'], hint: 'Fokus pada kebolehan mencari penyelesaian.', explanation: 'Panjang akal lebih tepat kerana Kumar bijak mencari jalan penyelesaian.' },
  { skill: 'kata_penguat', q: "Mengapakah ayat 'Bunga itu sangat tercantik' tidak gramatis?", answer: "kerana 'sangat' dan 'tercantik' menghasilkan penguatan berlebihan", accepted: ["kerana 'sangat' dan 'tercantik' menghasilkan penguatan berlebihan", 'kata penguat digunakan secara berlebihan', 'gunakan sangat cantik atau tercantik'], hint: 'Kedua-dua bentuk membawa maksud penguatan.', explanation: 'Gunakan sama ada sangat cantik atau tercantik, bukan kedua-duanya serentak.', questionType: 'structured', marks: 2 },
  { skill: 'urutan', q: "Baca teks: 'Mula-mula Iman menyiapkan kerja sekolah. Kemudian, dia mengemas beg. Selepas itu, dia bermain.' Apakah urutan kedua?", answer: 'mengemas beg', accepted: ['mengemas beg', 'dia mengemas beg'], hint: 'Cari perbuatan selepas mula-mula dan sebelum selepas itu.', explanation: 'Perbuatan kedua ialah mengemas beg.' },
  { skill: 'makna_ayat', q: "Pilih ayat yang munasabah dan jelaskan pilihan: 'Burung terbang di langit' atau 'Burung berenang di padang'.", answer: 'Burung terbang di langit kerana perbuatan dan tempatnya sesuai.', accepted: ['Burung terbang di langit kerana perbuatan dan tempatnya sesuai.', 'Burung terbang di langit.', 'ayat pertama'], hint: 'Padankan kebolehan haiwan dengan tempat.', explanation: 'Burung lazimnya terbang di langit; berenang di padang tidak munasabah.', questionType: 'structured', marks: 2 },
  { skill: 'tajuk', q: "Teks menerangkan murid menyapu lantai, mengelap tingkap dan menyusun meja. Antara 'Kelas Bersih' dengan 'Hari Sukan', tajuk manakah lebih tepat dan mengapa?", answer: 'Kelas Bersih kerana semua aktiviti berkaitan pembersihan kelas.', accepted: ['Kelas Bersih kerana semua aktiviti berkaitan pembersihan kelas.', 'Kelas Bersih', 'tajuk pertama'], hint: 'Cari idea yang merangkumi ketiga-tiga aktiviti.', explanation: 'Semua aktiviti bertujuan membersihkan dan mengemas kelas.', questionType: 'structured', marks: 2 },
  { skill: 'sebab_akibat', q: "Analisis hubungan sebab dan akibat: 'Hujan turun dengan lebat, maka Hakim memakai baju hujan.' Apakah sebabnya?", answer: 'hujan turun dengan lebat', accepted: ['hujan turun dengan lebat', 'hujan lebat'], hint: 'Sebab berlaku sebelum tindakan Hakim.', explanation: 'Hujan lebat ialah sebab Hakim memakai baju hujan.' },
  { skill: 'tanda_baca', q: "Analisis: Ayat 'Tolong duduk dengan tertib.' berakhir dengan noktah. Mengapakah ayat itu masih ayat perintah?", answer: "kerana tujuannya meminta seseorang duduk dan menggunakan kata 'tolong'", accepted: ["kerana tujuannya meminta seseorang duduk dan menggunakan kata 'tolong'", 'kerana menggunakan kata tolong', 'tujuannya ialah permintaan'], hint: 'Jenis ayat ditentukan melalui tujuan, bukan tanda baca sahaja.', explanation: 'Tolong menandakan permintaan, iaitu salah satu bentuk ayat perintah.', questionType: 'structured', marks: 2 },
  { skill: 'ejaan_di', q: "Bezakan 'di sekolah' dengan 'dibaca': mengapakah satu ditulis terpisah dan satu lagi bercantum?", answer: "'di sekolah' ialah kata sendi tempat; 'dibaca' menggunakan imbuhan di-", accepted: ["'di sekolah' ialah kata sendi tempat; 'dibaca' menggunakan imbuhan di-", 'di sekolah ialah kata sendi, dibaca ialah imbuhan', 'kata sendi dan imbuhan'], hint: 'Tentukan sama ada selepas di ialah tempat atau kata kerja.', explanation: 'Di sebagai kata sendi tempat ditulis terpisah, manakala imbuhan di- pada kata kerja pasif ditulis bercantum.', questionType: 'structured', marks: 2 },
  { skill: 'golongan_kata', q: "Dalam ayat 'Buku itu telah dibaca oleh Aina', nyatakan golongan kata bagi 'telah' dan 'oleh'.", answer: 'telah ialah kata bantu; oleh ialah kata sendi nama', accepted: ['telah ialah kata bantu; oleh ialah kata sendi nama', 'kata bantu dan kata sendi nama'], hint: 'Satu menunjukkan masa, satu lagi hadir sebelum pelaku.', explanation: 'Telah ialah kata bantu, manakala oleh ialah kata sendi nama.', questionType: 'structured', marks: 2 },

  { skill: 'rumusan', q: "Penilaian: Baca teks: 'Faris membaca buku setiap hari dan mencatat perkataan baharu. Kosa katanya semakin bertambah.' Pilih rumusan terbaik.", answer: 'Amalan membaca membantu Faris menambah kosa kata.', accepted: ['Amalan membaca membantu Faris menambah kosa kata.'], options: ['Amalan membaca membantu Faris menambah kosa kata.', 'Faris tidak suka membaca buku.', 'Faris kehilangan buku setiap hari.'], hint: 'Gabungkan amalan Faris dengan hasilnya.', explanation: 'Rumusan terbaik menyatakan hubungan membaca dengan pertambahan kosa kata.' },
  { skill: 'bukti_teks', q: "Penilaian: Teks menyatakan 'Nadia menyiram pokok kerana tanahnya kering.' Seorang murid menjawab 'Nadia menyiram pokok kerana mahu bermain air.' Adakah jawapan itu tepat?", answer: 'Tidak, teks menyatakan tanahnya kering.', accepted: ['Tidak, teks menyatakan tanahnya kering.', 'tidak kerana tanahnya kering'], hint: 'Bandingkan sebab murid dengan sebab dalam teks.', explanation: 'Jawapan itu tidak tepat kerana teks memberikan sebab yang berbeza.', questionType: 'structured', marks: 2 },
  { skill: 'kesantunan', q: "Penilaian: Untuk meminta bantuan guru, pilih ayat yang paling sopan.", answer: 'Cikgu, bolehkah cikgu membantu saya?', accepted: ['Cikgu, bolehkah cikgu membantu saya?'], options: ['Cikgu, bolehkah cikgu membantu saya?', 'Cikgu, buat ini sekarang!', 'Tolonglah cepat!'], hint: 'Pilih ayat yang mempunyai sapaan dan permintaan hormat.', explanation: 'Ayat pertama menggunakan sapaan serta bentuk pertanyaan yang sopan.' },
  { skill: 'tatabahasa', q: "Penilaian: Pilih ayat yang paling gramatis.", answer: 'Hadiah itu diberikan kepada Siti.', accepted: ['Hadiah itu diberikan kepada Siti.'], options: ['Hadiah itu diberikan kepada Siti.', 'Hadiah itu diberikan ke Siti.', 'Hadiah itu kepada diberikan Siti.'], hint: 'Siti ialah penerima.', explanation: 'Kepada digunakan untuk penerima dan susunan ayat pertama adalah gramatis.' },
  { skill: 'simpulan_bahasa', q: "Penilaian: Amir tidak pandai bermain bola tetapi cekap bermain catur. Adakah 'kaki bangku' sesuai untuk kemahiran bolanya?", answer: 'Ya, kerana kaki bangku bermaksud tidak pandai bermain bola.', accepted: ['Ya, kerana kaki bangku bermaksud tidak pandai bermain bola.', 'ya, kaki bangku'], hint: 'Nilai kemahiran bermain bola sahaja.', explanation: 'Kaki bangku khusus merujuk orang yang tidak pandai bermain bola.', questionType: 'structured', marks: 2 },
  { skill: 'keselamatan', q: "Penilaian: Ketika hujan lebat selepas sekolah, pilih tindakan terbaik dan sebabnya.", answer: 'Menunggu penjaga di tempat berbumbung kerana lebih selamat.', accepted: ['Menunggu penjaga di tempat berbumbung kerana lebih selamat.', 'menunggu di tempat berbumbung', 'berteduh dan menunggu penjaga'], options: ['Menunggu penjaga di tempat berbumbung kerana lebih selamat.', 'Berlari pulang seorang diri dalam hujan.', 'Bermain di jalan yang licin.'], hint: 'Pilih tindakan yang mengurangkan risiko.', explanation: 'Tempat berbumbung melindungi murid daripada hujan sementara menunggu penjaga.' },
  { skill: 'kejelasan_ayat', q: "Penilaian: Pilih ayat yang lebih jelas untuk laporan kelas.", answer: 'Murid Tahun 2 membersihkan kelas pada pagi Sabtu.', accepted: ['Murid Tahun 2 membersihkan kelas pada pagi Sabtu.'], options: ['Murid Tahun 2 membersihkan kelas pada pagi Sabtu.', 'Kami buat bersih kelas pagi.', 'Kelas itu benda dibersihkan.'], hint: 'Laporan memerlukan bahasa baku, pelaku, perbuatan dan masa.', explanation: 'Ayat pertama lengkap, baku dan menyampaikan maklumat dengan jelas.' },
  { skill: 'tajuk', q: "Penilaian: Petikan menceritakan Aina menutup paip selepas digunakan dan mengumpulkan air hujan untuk menyiram pokok. Pilih tajuk terbaik.", answer: 'Berjimat Menggunakan Air', accepted: ['Berjimat Menggunakan Air'], options: ['Berjimat Menggunakan Air', 'Permainan di Padang', 'Makanan Kegemaran'], hint: 'Cari nilai yang sama dalam kedua-dua tindakan.', explanation: 'Kedua-dua tindakan menunjukkan penggunaan air secara berhemah.' },
  { skill: 'ketepatan_maklumat', q: "Penilaian: Jadual menyatakan perpustakaan dibuka pada pukul 8 pagi. Ali berkata perpustakaan dibuka pada pukul 10 pagi. Bagaimanakah kamu membetulkan Ali?", answer: 'Perpustakaan dibuka pada pukul 8 pagi, bukan pukul 10 pagi.', accepted: ['Perpustakaan dibuka pada pukul 8 pagi, bukan pukul 10 pagi.', 'pukul 8 pagi', 'jam 8 pagi'], hint: 'Gunakan maklumat dalam jadual sebagai bukti.', explanation: 'Maklumat yang tepat ialah pukul 8 pagi.', questionType: 'structured', marks: 2 },
  { skill: 'suntingan', q: "Penilaian: Seorang murid menulis 'Buku itu disimpan disekolah'. Berikan pembetulan dan sebab.", answer: "Buku itu disimpan di sekolah. 'Di' yang menunjukkan tempat ditulis terpisah.", accepted: ["Buku itu disimpan di sekolah. 'Di' yang menunjukkan tempat ditulis terpisah.", 'Buku itu disimpan di sekolah.'], hint: 'Sekolah ialah tempat.', explanation: 'Di ialah kata sendi nama tempat, maka di sekolah ditulis terpisah.', questionType: 'structured', marks: 2 },

  { skill: 'bina_ayat', q: "Mencipta: Bina ayat menggunakan kata 'Aina' dan 'perpustakaan' serta nyatakan tujuan.", answer: 'Aina pergi ke perpustakaan untuk meminjam buku.', accepted: ['Aina pergi ke perpustakaan untuk meminjam buku.'], hint: 'Gunakan untuk bagi menerangkan tujuan.', explanation: 'Jawapan boleh berbeza asalkan kedua-dua kata kunci digunakan dalam ayat gramatis.', questionType: 'structured', marks: 3, rubric: CREATE_SENTENCE_RUBRIC, responseRules: { semanticCues: ['untuk', 'supaya'] } },
  { skill: 'bina_ayat', q: "Mencipta: Bina ayat menggunakan kata 'murid' dan 'bekerjasama' dalam situasi membersihkan kelas.", answer: 'Murid bekerjasama membersihkan kelas supaya kelihatan kemas.', accepted: ['Murid bekerjasama membersihkan kelas supaya kelihatan kemas.'], hint: 'Nyatakan perbuatan bersama dan hasilnya.', explanation: 'Ayat perlu menggunakan kedua-dua kata kunci dalam konteks membersihkan kelas.', questionType: 'structured', marks: 3, rubric: CREATE_SENTENCE_RUBRIC, responseRules: { semanticCues: ['membersihkan', 'mengemas', 'menyapu'] } },
  { skill: 'bina_ayat', q: "Mencipta: Bina ayat menggunakan kata 'hujan' dan 'payung' dengan hubungan sebab dan tindakan.", answer: 'Kakak membawa payung kerana hujan turun dengan lebat.', accepted: ['Kakak membawa payung kerana hujan turun dengan lebat.'], hint: 'Gunakan kerana untuk menghubungkan sebab dengan tindakan.', explanation: 'Ayat contoh menghubungkan keadaan hujan dengan tindakan membawa payung.', questionType: 'structured', marks: 3, rubric: CREATE_SENTENCE_RUBRIC, responseRules: { semanticCues: ['kerana', 'supaya', 'apabila'] } },
  { skill: 'bina_ayat', q: "Mencipta: Bina ayat menggunakan kata 'Farid' dan 'menabung' serta nyatakan tujuan.", answer: 'Farid menabung wang untuk membeli sebuah basikal.', accepted: ['Farid menabung wang untuk membeli sebuah basikal.'], hint: 'Gunakan untuk atau supaya bagi menyatakan tujuan.', explanation: 'Ayat perlu menjelaskan perbuatan Farid dan tujuan menabung.', questionType: 'structured', marks: 3, rubric: CREATE_SENTENCE_RUBRIC, responseRules: { semanticCues: ['untuk', 'supaya'] } },
  { skill: 'bina_ayat', q: "Mencipta: Bina ayat menggunakan kata 'keluarga', 'membersihkan' dan 'halaman'.", answer: 'Keluarga saya bekerjasama membersihkan halaman rumah pada hujung minggu.', accepted: ['Keluarga saya bekerjasama membersihkan halaman rumah pada hujung minggu.'], hint: 'Susun sebagai pelaku, perbuatan, tempat dan masa.', explanation: 'Ayat contoh menggunakan semua kata kunci dalam susunan yang gramatis.', questionType: 'structured', marks: 3, rubric: CREATE_SENTENCE_RUBRIC, responseRules: { semanticCues: ['rumah', 'bersama', 'bekerjasama'] } }
];

function cognitiveLevelFor(index) {
  if (index < 5) return 'mengingat';
  if (index < 15) return 'memahami';
  if (index < 30) return 'mengaplikasi';
  if (index < 45) return 'menganalisis';
  if (index < 55) return 'menilai';
  return 'mencipta';
}

const ESTIMATED_TIME = Object.freeze({ mengingat: 45, memahami: 60, mengaplikasi: 75, menganalisis: 90, menilai: 105, mencipta: 120 });

export const pentaksiranSumatifQuestions = Object.freeze(ITEMS.map((item, index) => {
  const cognitiveLevel = cognitiveLevelFor(index);
  const q = item.q;
  return Object.freeze({
    id: `BM-PENTAKSIRAN-SUMATIF-${String(index + 1).padStart(3, '0')}`,
    ...item,
    q,
    question: q,
    accepted: item.accepted || [item.answer],
    difficulty: index < 15 ? 'mudah' : index < 30 ? 'sederhana' : 'sukar',
    cognitiveLevel,
    questionType: item.questionType || (item.options ? 'objective' : cognitiveLevel === 'mencipta' ? 'structured' : 'short_answer'),
    marks: item.marks || (cognitiveLevel === 'mencipta' ? 3 : ['menganalisis', 'menilai'].includes(cognitiveLevel) ? 2 : 1),
    estimatedTime: ESTIMATED_TIME[cognitiveLevel],
    assessment: 'PBD Sumatif/KBAT',
    metadata: { category: 'uasa_kbat', assessmentCategory: 'pentaksiran_sumatif_kbat', skill: item.skill, set: `pentaksiran_sumatif_${index + 1}` },
    dskp: 'KSSR Tahun 2'
  });
}));

export function alignYearTwoAssessment(subject) {
  return {
    ...subject,
    assessmentFramework: YEAR_TWO_ASSESSMENT_FRAMEWORK,
    topics: (subject.topics || []).map(topic => {
      const alignedTopic = topic.id === 'uasa_kbat' ? {
        ...topic,
        title: 'Pentaksiran Sumatif & KBAT',
        note: 'Latihan integrasi PBD sumatif untuk Tahun 2; bukan simulasi UASA rasmi.',
        learningObjective: 'Murid dapat menggabungkan pengetahuan bahasa untuk menjawab soalan pelbagai bentuk dan aras.',
        learningOutcome: 'Murid dapat memahami rangsangan, menggunakan kemahiran bahasa, memberikan bukti dan menghasilkan ayat yang gramatis.',
        contentStatus: 'pilot',
        defaultQuestionType: 'short_answer',
        defaultMarks: 1,
        assessmentFramework: YEAR_TWO_ASSESSMENT_FRAMEWORK,
        questions: pentaksiranSumatifQuestions
      } : topic;
      return {
        ...alignedTopic,
        questions: (alignedTopic.questions || []).map(question => ({
          ...question,
          uasa: 'PBD Sumatif',
          assessment: question.assessment || 'PBD'
        }))
      };
    })
  };
}

export default pentaksiranSumatifQuestions;
