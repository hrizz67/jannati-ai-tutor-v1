const REVIEWED_FILL_BLANK_DOMAINS = Object.freeze({
  englishVerb: {
    instruction: 'Choose the verb that completes the sentence.',
    curriculum: 'Choose a familiar Year 2 action word that completes a simple sentence.',
    assessment: 'Three verbs are shown and exactly one fits the sentence meaning and grammar.',
    textbook: 'The completed sentence connects an action word with a familiar person, object or setting.',
    skillId: 'verbs.context_completion',
    conceptTags: ['verbs', 'sentence_completion', 'context_clues'],
    misconceptionTags: ['chooses_unrelated_action', 'ignores_sentence_context'],
    hintSteps: [
      'Look at the whole sentence and notice who or what performs the action.',
      'Say each choice in the blank and listen for the sentence that makes sense.',
      'Choose the action that best matches the object or setting after the blank.'
    ]
  },
  arabVocabulary: {
    instruction: 'Pilih maksud perkataan Arab yang betul.',
    curriculum: 'Memadankan kosa kata Arab Tahun 2 dengan maksud Bahasa Melayu yang tepat.',
    assessment: 'Tiga maksud daripada kategori benda harian digunakan dan hanya satu sepadan dengan perkataan Arab.',
    textbook: 'Perkataan Arab dikekalkan bersama baris, kemudian dipadankan dengan kosa kata harian yang telah dipelajari.',
    skillId: 'mufradat.makna_perkataan',
    conceptTags: ['mufradat', 'makna_perkataan', 'benda_harian'],
    misconceptionTags: ['keliru_kosa_kata_hampir', 'meneka_tanpa_membaca_perkataan'],
    hintSteps: [
      'Baca perkataan Arab itu perlahan-lahan dari kanan ke kiri.',
      'Ingat semula benda atau gambar yang pernah dipadankan dengan perkataan itu.',
      'Bandingkan ketiga-tiga maksud dan pilih satu padanan yang tepat.'
    ]
  },
  islamAqidah: {
    instruction: 'Pilih perkataan yang melengkapkan fakta akidah.',
    curriculum: 'Mengingat dan melengkapkan fakta asas akidah Pendidikan Islam Tahun 2.',
    assessment: 'Satu fakta asas diuji dengan satu jawapan tepat dan dua distraktor dalam domain yang sama.',
    textbook: 'Ayat lengkap menghubungkan istilah akidah dengan fakta yang perlu difahami dan diamalkan.',
    skillId: 'aqidah.fakta_asas',
    conceptTags: ['aqidah', 'fakta_asas', 'iman'],
    misconceptionTags: ['keliru_rukun_iman_dan_islam', 'keliru_pencipta_dan_ciptaan'],
    hintSteps: [
      'Baca keseluruhan fakta dan kenal pasti perkara akidah yang ditanya.',
      'Singkirkan pilihan yang bercanggah dengan maksud ayat.',
      'Pilih perkataan yang menghasilkan satu fakta akidah yang lengkap dan benar.'
    ]
  }
});

const REVIEWED_FILL_BLANK_BATCH_1 = Object.freeze({
  'ENG-VERBS-001': { domain: 'englishVerb', sentenceParts: ['The boys ', ' football after school.'], options: ['sing', 'play', 'drink'] },
  'ENG-VERBS-002': { domain: 'englishVerb', sentenceParts: ['Aina can ', ' a song.'], options: ['draw', 'drink', 'sing'] },
  'ENG-VERBS-003': { domain: 'englishVerb', sentenceParts: ['I ', ' my teeth every morning.'], options: ['brush', 'fly', 'read'] },
  'ENG-VERBS-004': { domain: 'englishVerb', sentenceParts: ['The baby can ', ' on the mat.'], options: ['fly', 'crawl', 'drink'] },
  'ENG-VERBS-005': { domain: 'englishVerb', sentenceParts: ['We ', ' water after running.'], options: ['draw', 'sing', 'drink'] },
  'ENG-VERBS-006': { domain: 'englishVerb', sentenceParts: ['Mira will ', ' a picture.'], options: ['draw', 'wash', 'open'] },
  'ENG-VERBS-007': { domain: 'englishVerb', sentenceParts: ['The bird can ', ' in the sky.'], options: ['crawl', 'drink', 'fly'] },
  'ENG-VERBS-008': { domain: 'englishVerb', sentenceParts: ['Please ', ' the door.'], options: ['open', 'sing', 'fly'] },
  'ENG-VERBS-009': { domain: 'englishVerb', sentenceParts: ['Father will ', ' the car.'], options: ['read', 'wash', 'draw'] },
  'ENG-VERBS-010': { domain: 'englishVerb', sentenceParts: ['The pupils ', ' a story in class.'], options: ['drink', 'fly', 'read'] },
  'ARAB-MUFRADAT-001': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab كِتَابٌ bermaksud ', '.'], options: ['pen', 'buku', 'beg'] },
  'ARAB-MUFRADAT-002': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab قَلَمٌ bermaksud ', '.'], options: ['pen', 'beg', 'buku'] },
  'ARAB-MUFRADAT-003': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab حَقِيبَةٌ bermaksud ', '.'], options: ['sekolah', 'beg', 'pintu'] },
  'ARAB-MUFRADAT-004': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab مِسْطَرَةٌ bermaksud ', '.'], options: ['pemadam', 'meja', 'pembaris'] },
  'ARAB-MUFRADAT-005': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab مِمْحَاةٌ bermaksud ', '.'], options: ['pemadam', 'pembaris', 'tingkap'] },
  'ARAB-MUFRADAT-006': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab مَدْرَسَةٌ bermaksud ', '.'], options: ['kelas', 'sekolah', 'rumah'] },
  'ARAB-MUFRADAT-007': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab فَصْلٌ bermaksud ', '.'], options: ['sekolah', 'kerusi', 'kelas'] },
  'ARAB-MUFRADAT-008': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab بَابٌ bermaksud ', '.'], options: ['pintu', 'meja', 'tingkap'] },
  'ARAB-MUFRADAT-009': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab نَافِذَةٌ bermaksud ', '.'], options: ['pintu', 'tingkap', 'papan tulis'] },
  'ARAB-MUFRADAT-010': { domain: 'arabVocabulary', sentenceParts: ['Perkataan Arab كُرْسِيٌّ bermaksud ', '.'], options: ['meja', 'pintu', 'kerusi'] },
  'ISLAM-AQIDAH-001': { domain: 'islamAqidah', sentenceParts: ['Allah Maha ', '.'], options: ['Banyak', 'Esa', 'Dua'] },
  'ISLAM-AQIDAH-002': { domain: 'islamAqidah', sentenceParts: ['Kita wajib beriman kepada ', '.'], options: ['malaikat', 'manusia', 'Allah'] },
  'ISLAM-AQIDAH-003': { domain: 'islamAqidah', sentenceParts: ['Rukun Iman ada ', ' perkara.'], options: ['enam', 'lima', 'tujuh'] },
  'ISLAM-AQIDAH-004': { domain: 'islamAqidah', sentenceParts: ['Rukun Islam ada ', ' perkara.'], options: ['empat', 'lima', 'enam'] },
  'ISLAM-AQIDAH-006': { domain: 'islamAqidah', sentenceParts: ['Nabi Muhammad SAW ialah pesuruh ', '.'], options: ['manusia', 'Allah', 'malaikat'] },
  'ISLAM-AQIDAH-007': { domain: 'islamAqidah', sentenceParts: ['Al-Quran ialah kitab ', '.'], options: ['malaikat', 'manusia', 'Allah'] },
  'ISLAM-AQIDAH-008': { domain: 'islamAqidah', sentenceParts: ['Malaikat ialah makhluk ciptaan ', '.'], options: ['Allah', 'manusia', 'malaikat'] },
  'ISLAM-AQIDAH-010': { domain: 'islamAqidah', sentenceParts: ['Qada dan qadar ialah ketentuan ', '.'], options: ['manusia', 'malaikat', 'Allah'] },
  'ISLAM-AQIDAH-011': { domain: 'islamAqidah', sentenceParts: ['Lawan bagi iman ialah ', '.'], options: ['syukur', 'kufur', 'amanah'] },
  'ISLAM-AQIDAH-012': { domain: 'islamAqidah', sentenceParts: ['Perbuatan menyekutukan Allah dinamakan ', '.'], options: ['syirik', 'ikhlas', 'amanah'] }
});

function buildReviewedFillBlankExample(spec = {}) {
  const domain = REVIEWED_FILL_BLANK_DOMAINS[spec.domain];
  return {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: domain.instruction,
      sentenceParts: spec.sentenceParts,
      options: spec.options.map((value, index) => ({ id: `option-${index + 1}`, label: value, value }))
    },
    qualityReview: {
      curriculum: domain.curriculum,
      assessment: domain.assessment,
      textbook: domain.textbook
    }
  };
}

const REVIEWED_FILL_BLANK_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_FILL_BLANK_BATCH_1).map(([id, spec]) => [id, buildReviewedFillBlankExample(spec)])
);

const REVIEWED_CHOICE_DOMAINS = Object.freeze({
  pjBodyControl: {
    type: 'imageChoice',
    instruction: 'Pilih anggota badan yang paling banyak digunakan.',
    curriculum: 'Mengenal pasti anggota badan utama untuk pergerakan lokomotor dan kawalan imbangan.',
    assessment: 'Empat anggota badan dipaparkan dan satu sahaja paling berkaitan dengan pergerakan yang diberi.',
    textbook: 'Simbol anggota badan dan label ringkas menghubungkan pergerakan dengan fungsi tubuh.',
    skillId: 'lokomotor.anggota_badan_utama',
    responseMode: 'visual_selection',
    conceptTags: ['lokomotor', 'anggota_badan', 'imbangan'],
    misconceptionTags: ['keliru_anggota_utama', 'meneka_tanpa_membayangkan_pergerakan'],
    hintSteps: ['Bayangkan kamu melakukan pergerakan itu.', 'Fikir bahagian badan yang menampung berat dan menolak badan.', 'Pilih anggota di bahagian bawah badan yang menyentuh lantai ketika melompat.']
  },
  pjEquipment: {
    type: 'imageChoice',
    instruction: 'Pilih alatan yang sesuai dan selamat.',
    curriculum: 'Memilih alatan ringan yang sesuai untuk kemahiran manipulasi Tahun 2.',
    assessment: 'Pilihan ringkas membezakan alatan sasaran daripada alatan yang tidak sesuai untuk kemahiran tersebut.',
    textbook: 'Simbol dan label alatan membantu murid menghubungkan tindakan dengan penggunaan alatan yang selamat.',
    skillId: 'manipulasi_alatan.pemilihan_selamat',
    responseMode: 'visual_selection',
    conceptTags: ['manipulasi_alatan', 'pemilihan_alatan', 'keselamatan'],
    misconceptionTags: ['memilih_alatan_tidak_sesuai', 'mengabaikan_ciri_pergerakan'],
    hintSteps: ['Bayangkan cara alatan itu perlu bergerak.', 'Singkirkan alatan yang tidak boleh digunakan untuk tindakan tersebut.', 'Pilih alatan ringan yang paling sesuai dan selamat.']
  },
  pjSportsmanship: {
    type: 'choice',
    instruction: 'Pilih tindakan yang menunjukkan semangat kesukanan.',
    curriculum: 'Mengamalkan penerimaan keputusan dan tingkah laku positif dalam permainan mudah.',
    assessment: 'Satu tindakan berhemah dibezakan daripada tiga reaksi negatif selepas kekalahan.',
    textbook: 'Situasi permainan diikuti tindakan ringkas yang boleh diamalkan dalam kehidupan sebenar.',
    skillId: 'permainan_mudah.semangat_kesukanan',
    responseMode: 'choice_selection',
    conceptTags: ['semangat_kesukanan', 'kawalan_diri', 'hormat'],
    misconceptionTags: ['menyalahkan_rakan', 'bertindak_agresif_apabila_kalah'],
    hintSteps: ['Fikir perasaan semua ahli pasukan.', 'Singkirkan tindakan yang menyakiti atau menyalahkan orang lain.', 'Pilih tindakan yang menerima keputusan dengan tenang.']
  },
  pkLifestyle: {
    type: 'choice',
    instruction: 'Pilih amalan gaya hidup yang paling sesuai.',
    curriculum: 'Mengaplikasikan amalan rehat, aktiviti, kebersihan dan tanggungjawab yang sihat dalam rutin harian.',
    assessment: 'Situasi baharu digunakan supaya murid memilih amalan berdasarkan tujuan, bukan menyalin kata daripada soalan.',
    textbook: 'Ayat situasi pendek dan pilihan tindakan ringkas mengurangkan beban bacaan tanpa mengubah hasil pembelajaran.',
    skillId: 'gaya_hidup_sihat.amalan_harian',
    responseMode: 'choice_selection',
    conceptTags: ['gaya_hidup_sihat', 'rutin_harian', 'penjagaan_diri'],
    misconceptionTags: ['memilih_tabiat_tidak_sihat', 'tidak_memadankan_amalan_dengan_tujuan'],
    hintSteps: ['Kenal pasti tujuan kesihatan dalam situasi itu.', 'Bandingkan kesan setiap pilihan terhadap diri dan orang di sekeliling.', 'Pilih amalan yang selamat, seimbang dan boleh dibuat setiap hari.']
  },
  pkSafety: {
    type: 'choice',
    instruction: 'Pilih tindakan yang paling selamat.',
    curriculum: 'Membuat keputusan selamat dan mendapatkan bantuan orang dewasa yang dipercayai.',
    assessment: 'Satu tindakan perlindungan diri dibezakan daripada tindakan berisiko atau meninggalkan kawasan tanpa bantuan.',
    textbook: 'Situasi sekolah yang mudah membantu murid menghubungkan peraturan dengan tindakan sebenar.',
    skillId: 'keselamatan_diri.keputusan_selamat',
    responseMode: 'choice_selection',
    conceptTags: ['keselamatan_diri', 'orang_dewasa_dipercayai', 'membuat_keputusan'],
    misconceptionTags: ['bertindak_sendirian', 'mengambil_risiko_untuk_keluar'],
    hintSteps: ['Jangan lakukan perkara yang boleh mencederakan diri.', 'Cari orang dewasa yang bertugas di sekolah.', 'Pilih tindakan menunggu bantuan di tempat yang selamat.']
  },
  pkEmotion: {
    type: 'imageChoice',
    instruction: 'Pilih emosi yang paling sesuai dengan situasi.',
    curriculum: 'Mengenal pasti emosi berdasarkan petunjuk situasi, tingkah laku dan reaksi tubuh.',
    assessment: 'Stem tidak menyebut nama emosi jawapan; murid membuat inferens daripada petunjuk yang diberi.',
    textbook: 'Simbol wajah dan label emosi menyokong pengenalan perasaan secara jelas dan aksesibel.',
    skillId: 'kesihatan_mental_emosi.mengenal_emosi',
    responseMode: 'visual_selection',
    conceptTags: ['emosi', 'petunjuk_situasi', 'kesedaran_diri'],
    misconceptionTags: ['keliru_emosi_hampir', 'mengabaikan_petunjuk_tingkah_laku'],
    hintSteps: ['Perhatikan apa yang berlaku kepada watak.', 'Cari petunjuk pada wajah, tubuh atau fikirannya.', 'Pilih nama emosi yang paling tepat, bukan sekadar emosi yang mungkin berlaku.']
  },
  bmLanguage: {
    type: 'choice',
    instruction: 'Pilih jawapan yang melengkapkan maksud ayat.',
    curriculum: 'Mengaplikasikan tatabahasa, kosa kata, jenis ayat dan tanda baca Bahasa Melayu Tahun 2 dalam konteks mudah.',
    assessment: 'Tiga pilihan dalam kategori yang sama digunakan; hanya satu menepati bentuk dan maksud ayat.',
    textbook: 'Ayat rangsangan dipendekkan tanpa membuang konteks penting supaya murid menilai bahasa, bukan beban bacaan.',
    skillId: 'bahasa_melayu.aplikasi_bahasa',
    responseMode: 'choice_selection',
    conceptTags: ['bahasa_melayu', 'tatabahasa', 'konteks_ayat'],
    misconceptionTags: ['memilih_berdasarkan_kata_kunci', 'mengabaikan_maksud_keseluruhan_ayat'],
    hintSteps: ['Baca ayat penuh sekali lagi.', 'Kenal pasti perkara bahasa yang sedang diuji.', 'Cuba setiap pilihan dan pilih satu yang menghasilkan maksud paling tepat.']
  },
  mathCore: {
    type: 'choice',
    instruction: 'Selesaikan dan pilih jawapan yang tepat.',
    curriculum: 'Mengaplikasikan nombor, operasi, wang, masa, ukuran dan bentuk Matematik Tahun 2.',
    assessment: 'Satu jawapan tepat dan dua distraktor diagnostik digunakan untuk mengesan kesilapan nilai tempat, operasi atau unit.',
    textbook: 'Nombor, simbol dan unit dipaparkan secara ringkas supaya langkah pengiraan serta konsep kekal jelas.',
    skillId: 'matematik.aplikasi_konsep_asas',
    responseMode: 'choice_selection',
    conceptTags: ['matematik', 'penyelesaian_masalah', 'ketepatan'],
    misconceptionTags: ['tersalah_operasi_atau_nilai_tempat', 'memilih_unit_tidak_sesuai'],
    hintSteps: ['Kenal pasti nombor, operasi atau unit yang diberi.', 'Selesaikan satu langkah pada satu masa.', 'Semak jawapan dengan anggaran atau fakta asas sebelum memilih.']
  },
  scienceConcept: {
    type: 'imageChoice',
    instruction: 'Pilih gambar dan label yang sepadan dengan fakta sains.',
    curriculum: 'Menghubungkan objek, deria, bahan dan fenomena harian dengan konsep Sains Tahun 2 yang tepat.',
    assessment: 'Tiga pilihan visual membezakan konsep sasaran daripada salah faham lazim dalam topik yang sama.',
    textbook: 'Simbol visual sentiasa disertai label supaya fakta sains boleh dibaca, dilihat dan dibandingkan dengan jelas.',
    skillId: 'sains.hubungan_objek_dan_fakta',
    responseMode: 'visual_selection',
    conceptTags: ['sains', 'pemerhatian', 'hubungan_fungsi'],
    misconceptionTags: ['keliru_fungsi_atau_sifat', 'memilih_berdasarkan_gambar_sahaja'],
    hintSteps: ['Perhatikan objek atau situasi dalam soalan.', 'Fikir fungsi, sifat atau perubahan yang berlaku.', 'Bandingkan label pada setiap gambar sebelum memilih.']
  }
});

const REVIEWED_CHOICE_BATCH_2 = Object.freeze({
  'PJ-LOKOMOTOR-039': { domain: 'pjBodyControl', prompt: 'Anggota badan manakah menampung berat dan menolak tubuh ke atas ketika melompat?', options: [['kaki', 'Kaki', '🦶'], ['tangan', 'Tangan', '✋'], ['kepala', 'Kepala', '🙂'], ['telinga', 'Telinga', '👂']] },
  'PJ-MANIPULASI_ALATAN-002': { domain: 'pjEquipment', prompt: 'Apakah alatan yang selamat untuk latihan membaling ke sasaran?', options: [['bola', 'Bola lembut', '⚽'], ['gelung', 'Gelung', '⭕'], ['skital', 'Skital', '🔺']] },
  'PJ-MANIPULASI_ALATAN-007': { domain: 'pjEquipment', prompt: 'Apakah alatan yang sesuai untuk latihan menangkap dengan dua tangan?', options: [['bola', 'Bola lembut', '⚽'], ['gelung', 'Gelung', '⭕'], ['skital', 'Skital', '🔺']] },
  'PJ-MANIPULASI_ALATAN-012': { domain: 'pjEquipment', prompt: 'Apakah alatan yang sesuai ditendang ke arah kon?', options: [['gelung', 'Gelung', '⭕'], ['bola', 'Bola', '⚽'], ['tali', 'Tali', '➰']] },
  'PJ-MANIPULASI_ALATAN-017': { domain: 'pjEquipment', prompt: 'Apakah alatan bulat yang sesuai digolek kepada rakan?', options: [['bola', 'Bola', '⚽'], ['skital', 'Skital', '🔺'], ['tali', 'Tali', '➰']] },
  'PJ-MANIPULASI_ALATAN-022': { domain: 'pjEquipment', prompt: 'Apakah alatan yang boleh dilantun perlahan dengan tangan?', options: [['pundi kacang', 'Pundi kacang', '🫘'], ['bola', 'Bola', '🏀'], ['gelung', 'Gelung', '⭕']] },
  'PJ-MANIPULASI_ALATAN-027': { domain: 'pjEquipment', prompt: 'Apakah alatan ringan yang selamat dipukul dengan tapak tangan?', options: [['skital', 'Skital', '🔺'], ['belon', 'Belon', '🎈'], ['pundi kacang', 'Pundi kacang', '🫘']] },
  'PJ-MANIPULASI_ALATAN-032': { domain: 'pjEquipment', prompt: 'Apakah alatan kecil berisi kacang yang sesuai disambut dengan dua tangan?', options: [['bola', 'Bola', '⚽'], ['pundi kacang', 'Pundi kacang', '🫘'], ['gelung', 'Gelung', '⭕']] },
  'PJ-MANIPULASI_ALATAN-037': { domain: 'pjEquipment', prompt: 'Apakah alatan yang sesuai dilambung perlahan ke atas dan disambut semula?', options: [['bola', 'Bola kecil', '⚾'], ['skital', 'Skital', '🔺'], ['gelung', 'Gelung', '⭕']] },
  'PJ-MANIPULASI_ALATAN-042': { domain: 'pjEquipment', prompt: 'Apakah alatan yang sesuai dihantar kepada rakan dalam permainan berpasangan?', options: [['tali', 'Tali', '➰'], ['bola', 'Bola', '⚽'], ['skital', 'Skital', '🔺']] },
  'PJ-MANIPULASI_ALATAN-047': { domain: 'pjEquipment', prompt: 'Apakah alatan yang sesuai disepak perlahan ke sasaran?', options: [['gelung', 'Gelung', '⭕'], ['tali', 'Tali', '➰'], ['bola', 'Bola', '⚽']] },
  'PJ-PERMAINAN_MUDAH-049': { domain: 'pjSportsmanship', prompt: 'Pasukan kamu kalah dalam permainan ambil dan hantar. Apakah tindakan yang baik?', options: [['menyalahkan rakan', 'Menyalahkan rakan'], ['terima keputusan dengan baik', 'Menerima keputusan dengan baik'], ['membuang alat', 'Membuang alatan'], ['menolak rakan', 'Menolak rakan']] },
  'PK-GAYA_HIDUP_SIHAT-002': { domain: 'pkLifestyle', prompt: 'Apakah amalan yang membantu badan cukup rehat sebelum hari persekolahan?', options: [['tidur terlalu lewat', 'Tidur terlalu lewat'], ['tidur awal pada malam persekolahan', 'Tidur awal pada malam persekolahan'], ['bermain permainan video hingga lewat', 'Bermain permainan video hingga lewat']] },
  'PK-GAYA_HIDUP_SIHAT-007': { domain: 'pkLifestyle', prompt: 'Apakah cara yang sesuai untuk murid aktif di luar rumah?', options: [['bermain di jalan raya', 'Bermain di jalan raya'], ['bermain di luar rumah pada waktu sesuai', 'Bermain pada waktu yang sesuai'], ['bermain ketika cuaca terlalu panas', 'Bermain ketika cuaca terlalu panas']] },
  'PK-GAYA_HIDUP_SIHAT-012': { domain: 'pkLifestyle', prompt: 'Mata Aiman penat selepas menggunakan tablet. Apakah amalan yang patut dilakukan setiap hari?', options: [['menambah masa skrin', 'Menambah masa skrin'], ['menonton tanpa rehat', 'Menonton tanpa rehat'], ['mengurangkan masa skrin', 'Mengurangkan masa skrin']] },
  'PK-GAYA_HIDUP_SIHAT-017': { domain: 'pkLifestyle', prompt: 'Apakah amalan yang membantu badan kekal cukup air setiap hari?', options: [['minum air kosong setiap hari', 'Minum air kosong setiap hari'], ['minum minuman bergas sahaja', 'Minum minuman bergas sahaja'], ['menunggu sehingga terlalu dahaga', 'Menunggu sehingga terlalu dahaga']] },
  'PK-GAYA_HIDUP_SIHAT-022': { domain: 'pkLifestyle', prompt: 'Keluarga Hana mahu aktif bersama pada hujung minggu. Apakah amalan yang sesuai?', options: [['tidur sepanjang petang', 'Tidur sepanjang petang'], ['bersenam bersama keluarga', 'Bersenam bersama keluarga'], ['duduk menonton sepanjang hari', 'Duduk menonton sepanjang hari']] },
  'PK-GAYA_HIDUP_SIHAT-024': { domain: 'pkLifestyle', prompt: 'Siapakah yang paling sesuai membimbing dan menggalakkan aktiviti sihat di rumah?', options: [['orang tidak dikenali', 'Orang tidak dikenali'], ['penjual mainan', 'Penjual mainan'], ['keluarga', 'Keluarga']] },
  'PK-GAYA_HIDUP_SIHAT-027': { domain: 'pkLifestyle', prompt: 'Apakah amalan pemakanan yang membekalkan pelbagai nutrien kepada badan?', options: [['makan makanan seimbang', 'Makan makanan seimbang'], ['makan jajan setiap masa', 'Makan jajan setiap masa'], ['melangkau sarapan setiap hari', 'Melangkau sarapan setiap hari']] },
  'PK-GAYA_HIDUP_SIHAT-032': { domain: 'pkLifestyle', prompt: 'Habuk mula terkumpul di tempat tidur. Apakah amalan yang patut dilakukan?', options: [['menyimpan sampah di bawah katil', 'Menyimpan sampah di bawah katil'], ['menjaga kebersihan bilik tidur', 'Menjaga kebersihan bilik tidur'], ['membiarkan habuk terkumpul', 'Membiarkan habuk terkumpul']] },
  'PK-GAYA_HIDUP_SIHAT-037': { domain: 'pkLifestyle', prompt: 'Apakah amalan yang mengurangkan risiko kecederaan ketika bermain?', options: [['bermain dengan selamat', 'Bermain dengan selamat'], ['menolak rakan ketika berlari', 'Menolak rakan ketika berlari'], ['berlari di lantai yang licin', 'Berlari di lantai yang licin']] },
  'PK-GAYA_HIDUP_SIHAT-042': { domain: 'pkLifestyle', prompt: 'Farid mula berasa marah. Apakah amalan yang paling baik?', options: [['menjerit kepada rakan', 'Menjerit kepada rakan'], ['mengurus marah dengan tenang', 'Mengurus marah dengan tenang'], ['memukul barang berhampiran', 'Memukul barang berhampiran']] },
  'PK-GAYA_HIDUP_SIHAT-047': { domain: 'pkLifestyle', prompt: 'Apakah tanggungjawab yang sesuai dilakukan oleh murid di rumah?', options: [['membuat kerja yang terlalu berat', 'Membuat kerja yang terlalu berat'], ['membantu kerja ringan di rumah', 'Membantu kerja ringan di rumah'], ['membiarkan semua kerja kepada orang lain', 'Membiarkan semua kerja kepada orang lain']] },
  'PK-KESELAMATAN_DIRI-031': { domain: 'pkSafety', prompt: 'Pintu pagar sekolah sudah ditutup ketika kamu mahu keluar. Apakah tindakan paling selamat?', options: [['memanjat pagar', 'Memanjat pagar'], ['tunggu guru atau pengawal', 'Menunggu guru atau pengawal'], ['keluar melalui tempat tersembunyi', 'Keluar melalui tempat tersembunyi']] },
  'PK-KESIHATAN_MENTAL_EMOSI-002': { domain: 'pkEmotion', prompt: 'Amir sangat berharap pasukannya menang, tetapi pasukannya kalah. Apakah emosi yang paling sesuai?', options: [['kecewa', 'Kecewa', '😞'], ['marah', 'Marah', '😠'], ['gembira', 'Gembira', '😀'], ['takut', 'Takut', '😨']] },
  'PK-KESIHATAN_MENTAL_EMOSI-007': { domain: 'pkEmotion', prompt: 'Mainan Aina diambil tanpa izin. Dia berasa tidak puas hati dan mukanya tegang. Apakah emosinya?', options: [['gembira', 'Gembira', '😀'], ['marah', 'Marah', '😠'], ['sedih', 'Sedih', '😢'], ['takut', 'Takut', '😨']] },
  'PK-KESIHATAN_MENTAL_EMOSI-012': { domain: 'pkEmotion', prompt: 'Hakim membuat persembahan buat kali pertama. Tangannya menggigil dan dia mahu berundur. Apakah emosinya?', options: [['gembira', 'Gembira', '😀'], ['marah', 'Marah', '😠'], ['sedih', 'Sedih', '😢'], ['takut', 'Takut', '😨']] },
  'PK-KESIHATAN_MENTAL_EMOSI-017': { domain: 'pkEmotion', prompt: 'Siti ditegur guru. Wajahnya muram dan dia hampir menangis. Apakah emosinya?', options: [['marah', 'Marah', '😠'], ['sedih', 'Sedih', '😢'], ['gembira', 'Gembira', '😀'], ['takut', 'Takut', '😨']] },
  'PK-KESIHATAN_MENTAL_EMOSI-022': { domain: 'pkEmotion', prompt: 'Mira menerima pujian atas hasil kerjanya lalu tersenyum lebar. Apakah emosinya?', options: [['takut', 'Takut', '😨'], ['sedih', 'Sedih', '😢'], ['gembira', 'Gembira', '😀'], ['marah', 'Marah', '😠']] },
  'PK-KESIHATAN_MENTAL_EMOSI-027': { domain: 'pkEmotion', prompt: 'Esok ada ujian dan Adam asyik memikirkannya. Apakah emosi yang paling sesuai?', options: [['marah', 'Marah', '😠'], ['risau', 'Risau', '😟'], ['gembira', 'Gembira', '😀'], ['sedih', 'Sedih', '😢']] }
});

const REVIEWED_CHOICE_BATCH_3 = Object.freeze({
  'BM-KATA_NAMA_KHAS-003': { domain: 'bmLanguage', skillId: 'kata_nama_khas.mengenal_tempat', concept: 'kata_nama_khas', prompt: 'Semasa cuti, keluarga Aina melawat Zoo Negara. Yang manakah kata nama khas bagi tempat?', options: [['Zoo Negara', 'Zoo Negara'], ['keluarga', 'Keluarga'], ['haiwan', 'Haiwan']] },
  'BM-KATA_GANTI_NAMA-001': { domain: 'bmLanguage', skillId: 'kata_ganti_nama.diri_pertama', concept: 'kata_ganti_nama', prompt: 'Aina bercakap tentang dirinya: “____ sedang menyiapkan kerja sekolah.”', options: [['Saya', 'Saya'], ['Kamu', 'Kamu'], ['Mereka', 'Mereka']] },
  'BM-KATA_KERJA-002': { domain: 'bmLanguage', skillId: 'kata_kerja.mengenal_perbuatan', concept: 'kata_kerja', prompt: 'Ibu memasak lauk di dapur. Perkataan manakah menunjukkan perbuatan?', options: [['memasak', 'Memasak'], ['ibu', 'Ibu'], ['dapur', 'Dapur']] },
  'BM-KATA_ADJEKTIF-003': { domain: 'bmLanguage', skillId: 'kata_adjektif.mengenal_keadaan', concept: 'kata_adjektif', prompt: 'Air teh itu masih panas. Perkataan manakah menerangkan keadaan air teh?', options: [['teh', 'Teh'], ['panas', 'Panas'], ['kantin', 'Kantin']] },
  'BM-KATA_HUBUNG-002': { domain: 'bmLanguage', skillId: 'kata_hubung.hubungan_pertentangan', concept: 'kata_hubung', prompt: 'Amir hendak bermain bola, ____ hujan mula turun.', options: [['sambil', 'Sambil'], ['tetapi', 'Tetapi'], ['supaya', 'Supaya']] },
  'BM-PENJODOH_BILANGAN-004': { domain: 'bmLanguage', skillId: 'penjodoh_bilangan.benda_nipis', concept: 'penjodoh_bilangan', prompt: 'Pilih penjodoh bilangan yang sesuai: se____ baju sekolah.', options: [['batang', 'Batang'], ['helai', 'Helai'], ['ekor', 'Ekor']] },
  'BM-AYAT-002': { domain: 'bmLanguage', skillId: 'jenis_ayat.mengenal_seruan', concept: 'ayat_seruan', prompt: '“Wah, cantiknya lukisan kamu!” ialah jenis ayat apa?', options: [['Ayat tanya', 'Ayat tanya'], ['Ayat perintah', 'Ayat perintah'], ['Ayat seruan', 'Ayat seruan']] },
  'BM-TATABAHASA-003': { domain: 'bmLanguage', skillId: 'kata_sendi.arah_ke', concept: 'kata_sendi', prompt: 'Murid-murid berjalan ____ perpustakaan selepas loceng berbunyi.', options: [['di', 'Di'], ['dari', 'Dari'], ['ke', 'Ke']] },
  'BM-SIMPULAN_BAHASA-002': { domain: 'bmLanguage', skillId: 'simpulan_bahasa.memahami_kaki_ayam', concept: 'simpulan_bahasa', prompt: 'Amir bermain di halaman dengan “kaki ayam”. Apakah maksud simpulan bahasa itu?', options: [['berjalan perlahan', 'Berjalan perlahan'], ['tidak memakai kasut', 'Tidak memakai kasut'], ['suka makan ayam', 'Suka makan ayam']] },
  'BM-PENTAKSIRAN-SUMATIF-004': { domain: 'bmLanguage', skillId: 'tanda_baca.ayat_tanya', concept: 'tanda_soal', prompt: 'Tanda baca manakah melengkapkan ayat “Di manakah buku saya___”', options: [['.', 'Noktah (.)'], ['?', 'Tanda soal (?)'], ['!', 'Tanda seru (!)']] },
  'MATH-NOMBOR-PILOT-003': { domain: 'mathCore', skillId: 'nombor.nilai_tempat_ratus', concept: 'nilai_tempat', prompt: 'Apakah digit pada tempat ratus dalam nombor 582?', options: [['8', '8'], ['5', '5'], ['2', '2']] },
  'MATH-TAMBAH-PILOT-001': { domain: 'mathCore', skillId: 'tambah.dua_digit_tanpa_mengumpul_semula', concept: 'tambah', prompt: 'Berapakah jumlah 23 + 14?', options: [['27', '27'], ['47', '47'], ['37', '37']] },
  'MATH-TOLAK-PILOT-001': { domain: 'mathCore', skillId: 'tolak.dua_digit_tanpa_mengumpul_semula', concept: 'tolak', prompt: 'Hitung 47 − 12.', options: [['35', '35'], ['45', '45'], ['59', '59']] },
  'MATH-DARAB-PILOT-001': { domain: 'mathCore', skillId: 'darab.fakta_asas_dua', concept: 'darab', prompt: 'Dua kumpulan mempunyai 3 objek setiap satu. Berapakah 2 × 3?', options: [['5', '5'], ['6', '6'], ['8', '8']] },
  'MATH-BAHAGI-PILOT-002': { domain: 'mathCore', skillId: 'bahagi.kongsi_sama_rata', concept: 'bahagi', prompt: '15 objek dikongsi sama rata kepada 3 kumpulan. Berapakah setiap kumpulan?', options: [['3', '3'], ['5', '5'], ['12', '12']] },
  'MATH-WANG-PILOT-005': { domain: 'mathCore', skillId: 'wang.menjumlah_syiling', concept: 'wang', prompt: 'Dua syiling 20 sen dan satu syiling 10 sen berjumlah berapa?', options: [['40 sen', '40 sen'], ['60 sen', '60 sen'], ['50 sen', '50 sen']] },
  'MATH-MASA-PILOT-004': { domain: 'mathCore', skillId: 'masa.hubungan_jam_minit', concept: 'masa', prompt: 'Lengkapkan hubungan: 1 jam = ____ minit.', options: [['30', '30 minit'], ['60', '60 minit'], ['100', '100 minit']] },
  'MATH-PANJANG-PILOT-001': { domain: 'mathCore', skillId: 'panjang.memilih_unit_sentimeter', concept: 'panjang', prompt: 'Unit manakah paling sesuai untuk mengukur panjang sebatang pensel?', options: [['sentimeter', 'Sentimeter (cm)'], ['meter', 'Meter (m)'], ['kilogram', 'Kilogram (kg)']] },
  'MATH-JISIM-ISI-PADU-PILOT-001': { domain: 'mathCore', skillId: 'jisim.memilih_unit_gram', concept: 'jisim', prompt: 'Unit manakah paling sesuai untuk mengukur jisim sebiji pemadam?', options: [['liter', 'Liter (L)'], ['gram', 'Gram (g)'], ['meter', 'Meter (m)']] },
  'MATH-BENTUK-PILOT-002': { domain: 'mathCore', skillId: 'bentuk.ciri_segi_empat_sama', concept: 'bentuk_2d', prompt: 'Apakah ciri sisi bagi segi empat sama?', options: [['dua sisi sama panjang', 'Dua sisi sama panjang'], ['semua sisi berlainan panjang', 'Semua sisi berlainan panjang'], ['semua sisi sama panjang', 'Semua sisi sama panjang']] },
  'SAINS-HAIWAN-002': { domain: 'scienceConcept', skillId: 'haiwan.habitat_ikan', concept: 'habitat', prompt: 'Habitat yang sesuai untuk ikan ialah ________.', options: [['darat', 'Darat', '🌱'], ['air', 'Air', '🌊'], ['sarang', 'Sarang', '🪹']] },
  'SAINS-TUMBUHAN-002': { domain: 'scienceConcept', skillId: 'tumbuhan.fungsi_batang', concept: 'bahagian_tumbuhan', prompt: 'Fungsi utama batang ialah ________.', options: [['menyerap air', 'Menyerap air', '💧'], ['membuat makanan', 'Membuat makanan', '🍃'], ['menyokong tumbuhan', 'Menyokong tumbuhan', '🌿']] },
  'SAINS-MANUSIA-001': { domain: 'scienceConcept', skillId: 'manusia.deria_penglihatan', concept: 'organ_deria', prompt: 'Mata ialah organ deria yang digunakan untuk ________.', options: [['mendengar', 'Mendengar', '👂'], ['melihat', 'Melihat', '👀'], ['menghidu', 'Menghidu', '👃']] },
  'SAINS-AIR-006': { domain: 'scienceConcept', skillId: 'air.pembekuan', concept: 'perubahan_air', prompt: 'Apabila dibekukan, air berubah menjadi ________.', options: [['wap', 'Wap', '☁️'], ['ais', 'Ais', '🧊'], ['hujan', 'Hujan', '🌧️']] },
  'SAINS-CAHAYA-001': { domain: 'scienceConcept', skillId: 'cahaya.sumber_semula_jadi', concept: 'sumber_cahaya', prompt: 'Matahari dikelaskan sebagai sumber cahaya ________.', options: [['buatan manusia', 'Buatan manusia', '💡'], ['pantulan', 'Pantulan', '🪞'], ['semula jadi', 'Semula jadi', '☀️']] },
  'SAINS-BUNYI-001': { domain: 'scienceConcept', skillId: 'bunyi.sumber_bunyi', concept: 'bunyi', prompt: 'Apabila dibunyikan, loceng menghasilkan ________.', options: [['cahaya', 'Cahaya', '💡'], ['bunyi', 'Bunyi', '🔔'], ['air', 'Air', '💧']] },
  'SAINS-BUMI-001': { domain: 'scienceConcept', skillId: 'bumi.bentuk_muka_tinggi', concept: 'bentuk_muka_bumi', prompt: 'Bentuk muka Bumi yang sangat tinggi dipanggil ________.', options: [['pantai', 'Pantai', '🏖️'], ['gunung', 'Gunung', '🏔️'], ['tasik', 'Tasik', '🏞️']] },
  'SAINS-BAHAN-003': { domain: 'scienceConcept', skillId: 'bahan.sifat_getah', concept: 'sifat_bahan', prompt: 'Getah kembali kepada bentuk asal kerana bersifat ________.', options: [['keras', 'Keras', '🪨'], ['rapuh', 'Rapuh', '🧱'], ['kenyal', 'Kenyal', '↔️']] },
  'SAINS-TEKNOLOGI-002': { domain: 'scienceConcept', skillId: 'teknologi.fungsi_pembaris', concept: 'fungsi_alat', prompt: 'Kegunaan utama pembaris ialah untuk ________.', options: [['memotong', 'Memotong', '✂️'], ['mengukur panjang', 'Mengukur panjang', '📏'], ['memadam', 'Memadam', '🧽']] },
  'SAINS-KEMAHIRAN_SAINTIFIK-002': { domain: 'scienceConcept', skillId: 'kemahiran_saintifik.deria_bau', concept: 'pemerhatian_deria', prompt: 'Kita menggunakan hidung untuk ________ bau.', options: [['melihat', 'Melihat', '👀'], ['mendengar', 'Mendengar', '👂'], ['menghidu', 'Menghidu', '👃']] }
});

const REVIEWED_CHOICE_BATCHES = Object.freeze({
  ...REVIEWED_CHOICE_BATCH_2,
  ...REVIEWED_CHOICE_BATCH_3
});

function buildReviewedChoiceExample(spec = {}) {
  const domain = REVIEWED_CHOICE_DOMAINS[spec.domain];
  return {
    interaction: {
      version: 1,
      type: domain.type,
      instruction: domain.instruction,
      prompt: spec.prompt,
      options: spec.options.map(([value, label, symbol], index) => ({
        id: `option-${index + 1}`,
        label,
        value,
        ...(symbol ? { visual: { kind: 'object', symbol, label } } : {})
      }))
    },
    qualityReview: {
      curriculum: domain.curriculum,
      assessment: domain.assessment,
      textbook: domain.textbook
    }
  };
}

const REVIEWED_CHOICE_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_CHOICE_BATCHES).map(([id, spec]) => [id, buildReviewedChoiceExample(spec)])
);

const REVIEWED_RICH_DOMAINS = Object.freeze({
  bmSentenceOrdering: {
    type: 'ordering',
    instruction: 'Susun kad untuk membina ayat yang lengkap dan gramatis.',
    responsePreviewLabel: 'Ayat kamu',
    responseSeparator: ' ',
    responseSuffix: '.',
    curriculum: 'Membina ayat penyata Bahasa Melayu Tahun 2 dengan susunan subjek dan predikat yang gramatis.',
    assessment: 'Semua frasa sumber dikekalkan dan hanya satu susunan menghasilkan ayat lengkap yang diterima oleh skema asal.',
    textbook: 'Kad frasa memperlihatkan struktur ayat secara konkrit sebelum murid membaca semula ayat lengkap.',
    skillId: 'bina_ayat.susunan_subjek_predikat',
    responseMode: 'sequencing',
    conceptTags: ['ayat_penyata', 'susunan_ayat', 'subjek_dan_predikat'],
    misconceptionTags: ['susunan_frasa_tidak_gramatis', 'keterangan_diletakkan_tidak_tepat'],
    hintSteps: ['Cari frasa yang menunjukkan siapa dahulu.', 'Letakkan perbuatan selepas pelaku.', 'Akhiri dengan objek atau keterangan tempat dan baca semula ayat.']
  },
  mathNumberOrdering: {
    type: 'ordering',
    instruction: 'Bandingkan nilai tempat, kemudian susun semua kad nombor mengikut arahan.',
    responsePreviewLabel: 'Susunan kamu',
    responseSeparator: ', ',
    curriculum: 'Menyusun nombor hingga 1,000 secara menaik atau menurun berdasarkan nilai tempat.',
    assessment: 'Nombor berkongsi digit yang hampir sama supaya susunan mengukur kefahaman nilai tempat, bukan rupa digit semata-mata.',
    textbook: 'Kad nombor membolehkan murid membanding ratus, puluh dan sa satu langkah pada satu masa.',
    skillId: 'nombor.menyusun_nilai',
    responseMode: 'sequencing',
    conceptTags: ['nilai_tempat', 'tertib_nombor', 'perbandingan'],
    misconceptionTags: ['membanding_digit_dari_kanan', 'keliru_tertib_menaik_dan_menurun'],
    hintSteps: ['Semak sama ada soalan meminta tertib menaik atau menurun.', 'Bandingkan digit ratus dahulu, kemudian puluh dan sa.', 'Baca keseluruhan susunan sekali lagi sebelum menghantar.']
  },
  mathOperationOrdering: {
    type: 'ordering',
    instruction: 'Kira setiap operasi, kemudian susun kad mengikut nilai hasilnya.',
    responsePreviewLabel: 'Susunan kamu',
    responseSeparator: ', ',
    curriculum: 'Mengaplikasikan fakta operasi Matematik Tahun 2 untuk membanding dan menyusun hasil pengiraan.',
    assessment: 'Setiap kad memerlukan pengiraan sebelum perbandingan; jawapan tersusun diserialkan tepat kepada skema asal.',
    textbook: 'Operasi kekal kelihatan pada kad manakala respons tersimpan mengandungi operasi dan hasil untuk semakan yang jelas.',
    skillId: 'operasi.menyusun_hasil',
    responseMode: 'calculation_sequencing',
    conceptTags: ['operasi_asas', 'perbandingan_hasil', 'tertib_nilai'],
    misconceptionTags: ['menyusun_operan_bukan_hasil', 'kesilapan_fakta_asas'],
    hintSteps: ['Selesaikan setiap operasi secara berasingan.', 'Catat atau ingat hasil bagi setiap kad.', 'Susun berdasarkan hasil, bukan nombor pertama pada operasi.']
  },
  mathTimeOrdering: {
    type: 'ordering',
    instruction: 'Bandingkan urutan atau tempoh masa, kemudian susun semua kad.',
    responsePreviewLabel: 'Susunan kamu',
    responseSeparator: ', ',
    curriculum: 'Menyusun hari dan tempoh masa mengikut urutan serta panjang tempoh yang betul.',
    assessment: 'Semua pilihan menggunakan unit masa lazim dan memerlukan satu urutan lengkap tanpa item tertinggal.',
    textbook: 'Kad masa menyokong perbandingan berperingkat dan mengekalkan unit pada setiap nilai.',
    skillId: 'masa.menyusun_urutan_dan_tempoh',
    responseMode: 'time_sequencing',
    conceptTags: ['masa', 'urutan_hari', 'perbandingan_tempoh'],
    misconceptionTags: ['keliru_urutan_hari', 'tidak_menukar_jam_kepada_minit'],
    hintSteps: ['Kenal pasti sama ada kad menunjukkan hari atau tempoh.', 'Gunakan urutan minggu atau tukar tempoh kepada unit yang sama.', 'Susun daripada awal ke akhir atau singkat ke lama seperti diminta.']
  },
  mathQuantityOrdering: {
    type: 'ordering',
    instruction: 'Samakan unit jika perlu, kemudian susun semua kad mengikut nilai.',
    responsePreviewLabel: 'Susunan kamu',
    responseSeparator: ', ',
    curriculum: 'Membanding dan menyusun nilai wang, panjang, jisim dan isi padu dalam unit yang sesuai.',
    assessment: 'Nilai bercampur unit memerlukan penukaran tepat sebelum susunan dan respons akhir kekal serasi dengan skema asal.',
    textbook: 'Label asal dikekalkan pada kad, manakala bentuk unit setara digunakan untuk semakan jawapan yang konsisten.',
    skillId: 'ukuran.menyusun_kuantiti',
    responseMode: 'measurement_sequencing',
    conceptTags: ['ukuran', 'penukaran_unit', 'perbandingan_kuantiti'],
    misconceptionTags: ['membanding_angka_tanpa_unit', 'tersalah_penukaran_unit'],
    hintSteps: ['Perhatikan unit pada setiap kad.', 'Tukar semua nilai kepada unit yang sama.', 'Bandingkan nilai setara lalu susun mengikut arahan.']
  },
  mathShapeOrdering: {
    type: 'ordering',
    instruction: 'Kira sisi lurus setiap bentuk, kemudian susun daripada paling sedikit.',
    responsePreviewLabel: 'Susunan kamu',
    responseSeparator: ', ',
    curriculum: 'Membanding bentuk 2D berdasarkan bilangan sisi lurus.',
    assessment: 'Tiga bentuk mempunyai bilangan sisi berlainan dan hanya satu susunan menaik yang tepat.',
    textbook: 'Nama bentuk pada kad menghubungkan ciri visual yang telah dipelajari dengan bilangan sisi.',
    skillId: 'bentuk.menyusun_bilangan_sisi',
    responseMode: 'property_sequencing',
    conceptTags: ['bentuk_2d', 'bilangan_sisi', 'susunan'],
    misconceptionTags: ['mengira_garis_lengkung_sebagai_sisi', 'keliru_sisi_dan_bucu'],
    hintSteps: ['Bayangkan atau lukis setiap bentuk.', 'Kira hanya sisi lurus pada sempadannya.', 'Letakkan bentuk tanpa sisi lurus dahulu.']
  },
  mathNumberMultiSelect: {
    type: 'multiSelect',
    instruction: 'Pilih semua nombor yang memenuhi kedua-dua syarat. Lebih daripada satu jawapan diperlukan.',
    curriculum: 'Menganalisis nilai tempat ratus serta jumlah digit puluh dan sa bagi nombor hingga 1,000.',
    assessment: 'Lima nombor calon mengandungi tiga jawapan diterima dan dua distraktor diagnostik; kedua-dua syarat mesti dipenuhi.',
    textbook: 'Nombor disemak satu demi satu menggunakan dua syarat yang dinyatakan dengan jelas.',
    skillId: 'nombor.menapis_dua_syarat',
    responseMode: 'multiple_selection',
    conceptTags: ['nilai_tempat', 'jumlah_digit', 'pelbagai_jawapan'],
    misconceptionTags: ['menyemak_satu_syarat_sahaja', 'memilih_satu_jawapan_sahaja'],
    hintSteps: ['Semak dahulu digit pada tempat ratus.', 'Bagi nombor yang mempunyai 7 ratus, tambah digit puluh dan sa.', 'Pilih semua nombor yang lulus kedua-dua semakan.']
  }
});

const REVIEWED_RICH_BATCH_4 = Object.freeze({
  'BM-BINA_AYAT-022': { domain: 'bmSentenceOrdering', items: [['place', 'di kantin'], ['subject', 'Murid-murid'], ['verb', 'beratur']], correctOrder: ['subject', 'verb', 'place'] },
  'BM-BINA_AYAT-023': { domain: 'bmSentenceOrdering', items: [['object', 'lantai'], ['subject', 'Ibu'], ['verb', 'menyapu'], ['place', 'dapur']], correctOrder: ['subject', 'verb', 'object', 'place'] },
  'BM-TATABAHASA-049': { domain: 'bmSentenceOrdering', skillId: 'tatabahasa.membina_ayat_gramatis', items: [['place', 'di perpustakaan'], ['verb', 'membaca'], ['subject', 'Aina'], ['object', 'buku']], correctOrder: ['subject', 'verb', 'object', 'place'] },
  'BM-PENTAKSIRAN-SUMATIF-018': { domain: 'bmSentenceOrdering', skillId: 'pentaksiran.membina_ayat_gramatis', items: [['place', 'di taman'], ['predicate', 'bermain bola'], ['subject', 'Kanak-kanak']], correctOrder: ['subject', 'predicate', 'place'] },
  'MATH-NOMBOR-PILOT-015': { domain: 'mathNumberOrdering', items: [['318', '318'], ['381', '381'], ['183', '183']], correctOrder: ['183', '318', '381'] },
  'MATH-NOMBOR-PILOT-016': { domain: 'mathNumberOrdering', items: [['720', '720'], ['702', '702'], ['270', '270']], correctOrder: ['720', '702', '270'] },
  'MATH-NOMBOR-PILOT-028': { domain: 'mathNumberOrdering', items: [['405', '405'], ['450', '450'], ['540', '540'], ['504', '504']], correctOrder: ['405', '450', '504', '540'] },
  'MATH-NOMBOR-PILOT-042': { domain: 'mathNumberOrdering', items: [['275', '275'], ['257', '257'], ['527', '527']], correctOrder: ['257', '275', '527'] },
  'MATH-TAMBAH-PILOT-047': { domain: 'mathOperationOrdering', skillId: 'tambah.menyusun_jumlah', concept: 'tambah', items: [['sum-375', '125 + 250', '125 + 250 = 375'], ['sum-388', '316 + 72', '316 + 72 = 388'], ['sum-367', '204 + 163', '204 + 163 = 367']], correctOrder: ['sum-367', 'sum-375', 'sum-388'] },
  'MATH-TOLAK-PILOT-047': { domain: 'mathOperationOrdering', skillId: 'tolak.menyusun_baki', concept: 'tolak', items: [['difference-316', '388 − 72', '388 - 72 = 316'], ['difference-125', '375 − 250', '375 - 250 = 125'], ['difference-204', '367 − 163', '367 - 163 = 204']], correctOrder: ['difference-125', 'difference-204', 'difference-316'] },
  'MATH-DARAB-PILOT-047': { domain: 'mathOperationOrdering', skillId: 'darab.menyusun_hasil_darab', concept: 'darab', items: [['product-25', '5 × 5', '5 x 5 = 25'], ['product-32', '4 × 8', '4 x 8 = 32'], ['product-27', '3 × 9', '3 x 9 = 27']], correctOrder: ['product-25', 'product-27', 'product-32'] },
  'MATH-BAHAGI-PILOT-040': { domain: 'mathOperationOrdering', skillId: 'bahagi.menyusun_hasil_bahagi', concept: 'bahagi', items: [['quotient-6', '54 ÷ 9', '54 ÷ 9 = 6'], ['quotient-4', '24 ÷ 6', '24 ÷ 6 = 4'], ['quotient-5', '35 ÷ 7', '35 ÷ 7 = 5']], correctOrder: ['quotient-4', 'quotient-5', 'quotient-6'] },
  'MATH-WANG-PILOT-041': { domain: 'mathQuantityOrdering', skillId: 'wang.menyusun_nilai', concept: 'wang', items: [['350', 'RM 3.50'], ['305', 'RM 3.05'], ['325', 'RM 3.25']], correctOrder: ['305', '325', '350'] },
  'MATH-MASA-PILOT-018': { domain: 'mathTimeOrdering', skillId: 'masa.menyusun_hari', concept: 'urutan_hari', items: [['monday', 'Isnin'], ['wednesday', 'Rabu'], ['tuesday', 'Selasa']], correctOrder: ['monday', 'tuesday', 'wednesday'] },
  'MATH-MASA-PILOT-041': { domain: 'mathTimeOrdering', skillId: 'masa.menyusun_tempoh', concept: 'tempoh', items: [['30m', '30 minit'], ['60m', '1 jam'], ['45m', '45 minit']], correctOrder: ['30m', '45m', '60m'] },
  'MATH-PANJANG-PILOT-040': { domain: 'mathQuantityOrdering', skillId: 'panjang.menyusun_unit_bercampur', concept: 'panjang', items: [['90cm', '90 cm'], ['105cm', '1 m 5 cm', '105 cm'], ['80cm', '80 cm']], correctOrder: ['80cm', '90cm', '105cm'] },
  'MATH-JISIM-ISI-PADU-PILOT-040': { domain: 'mathQuantityOrdering', skillId: 'jisim.menyusun_unit_bercampur', concept: 'jisim', items: [['900g', '900 g'], ['1050g', '1 kg 50 g', '1050 g'], ['750g', '750 g']], correctOrder: ['750g', '900g', '1050g'] },
  'MATH-JISIM-ISI-PADU-PILOT-048': { domain: 'mathQuantityOrdering', skillId: 'isi_padu.menyusun_unit_bercampur', concept: 'isi_padu', items: [['900ml', '900 mL'], ['1100ml', '1 L 100 mL', '1100 mL'], ['750ml', '750 mL']], correctOrder: ['750ml', '900ml', '1100ml'] },
  'MATH-BENTUK-PILOT-049': { domain: 'mathShapeOrdering', items: [['circle', 'bulatan'], ['rectangle', 'segi empat tepat'], ['triangle', 'segi tiga']], correctOrder: ['circle', 'triangle', 'rectangle'] },
  'MATH-NOMBOR-PILOT-050': {
    domain: 'mathNumberMultiSelect',
    prompt: 'Pilih semua nombor yang mempunyai 7 ratus serta jumlah digit puluh dan sa sebanyak 5.',
    options: [['714', '714'], ['724', '724'], ['732', '732'], ['650', '650'], ['750', '750']],
    correctOptionIds: ['714', '732', '750'],
    responseJoiner: ', '
  }
});

function buildReviewedRichExample(spec = {}) {
  const domain = REVIEWED_RICH_DOMAINS[spec.domain];
  const interaction = domain.type === 'multiSelect' ? {
    version: 1,
    type: domain.type,
    instruction: domain.instruction,
    prompt: spec.prompt,
    options: spec.options.map(([id, label]) => ({ id, label, value: id })),
    correctOptionIds: spec.correctOptionIds,
    responseJoiner: spec.responseJoiner
  } : {
    version: 1,
    type: domain.type,
    instruction: domain.instruction,
    responsePreviewLabel: domain.responsePreviewLabel,
    items: spec.items.map(([id, label, responseLabel]) => ({ id, label, ...(responseLabel ? { responseLabel } : {}) })),
    correctOrder: spec.correctOrder,
    responseSeparator: domain.responseSeparator,
    responseSuffix: domain.responseSuffix || ''
  };

  return {
    interaction,
    qualityReview: {
      curriculum: domain.curriculum,
      assessment: domain.assessment,
      textbook: domain.textbook
    }
  };
}

const REVIEWED_RICH_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_RICH_BATCH_4).map(([id, spec]) => [id, buildReviewedRichExample(spec)])
);

const REVIEWED_Q4_SPECS = Object.freeze({
  'BM-KATA_NAMA_AM-002': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih perkataan dan gambar haiwan yang disebut dalam ayat.',
      prompt: 'Dalam ayat “Ayah membeli ikan di pasar”, perkataan manakah kata nama am bagi haiwan?',
      options: [
        { id: 'fish', label: 'Ikan', value: 'ikan', visual: { kind: 'object', symbol: '🐟', label: 'Seekor ikan' } },
        { id: 'market', label: 'Pasar', value: 'pasar', visual: { kind: 'object', symbol: '🏪', label: 'Sebuah pasar' } },
        { id: 'father', label: 'Ayah', value: 'Ayah', visual: { kind: 'object', symbol: '👨', label: 'Seorang ayah' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti kata nama am bagi haiwan dalam ayat mudah Bahasa Melayu Tahun 2.',
      assessment: 'Pilihan mewakili haiwan, tempat dan orang daripada ayat yang sama; hanya haiwan memenuhi kehendak soalan.',
      textbook: 'Simbol disertai label teks supaya kategori kata nama dapat dibandingkan tanpa bergantung pada gambar sahaja.'
    },
    intelligence: {
      skillId: 'kata_nama_am.mengenal_haiwan', responseMode: 'visual_selection',
      conceptTags: ['kata_nama_am', 'haiwan', 'kategori_perkataan'],
      misconceptionTags: ['keliru_haiwan_dengan_tempat', 'memilih_nama_orang'],
      hintSteps: ['Cari nama makhluk hidup dalam ayat.', 'Bezakan haiwan daripada orang dan tempat.', 'Pilih perkataan yang menamakan haiwan yang dibeli oleh ayah.']
    }
  },
  'BM-KATA_KERJA-003': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih perbuatan yang benar-benar berlaku dalam ayat.',
      prompt: 'Selepas rehat, murid membaca buku cerita di sudut bacaan. Apakah kata kerja dalam ayat ini?',
      options: [
        { id: 'read', label: 'Membaca', value: 'membaca', visual: { kind: 'object', symbol: '📖', label: 'Murid sedang membaca' } },
        { id: 'rest', label: 'Berehat', value: 'berehat', visual: { kind: 'object', symbol: '🪑', label: 'Murid sedang berehat' } },
        { id: 'write', label: 'Menulis', value: 'menulis', visual: { kind: 'object', symbol: '✍️', label: 'Murid sedang menulis' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti kata kerja yang menunjukkan perbuatan dalam ayat mudah.',
      assessment: 'Semua pilihan ialah perbuatan, tetapi hanya satu dinyatakan dalam ayat supaya murid mesti membaca konteks.',
      textbook: 'Gambar tindakan menyokong kosa kata manakala label mengekalkan fokus pada bentuk perkataan.'
    },
    intelligence: {
      skillId: 'kata_kerja.mengenal_perbuatan_dalam_ayat', responseMode: 'visual_selection',
      conceptTags: ['kata_kerja', 'perbuatan', 'konteks_ayat'],
      misconceptionTags: ['memilih_perbuatan_tidak_disebut', 'mengabaikan_konteks'],
      hintSteps: ['Cari perkataan yang menerangkan apa yang murid lakukan.', 'Semak perbuatan selepas perkataan “murid”.', 'Pilih perbuatan yang melibatkan buku cerita.']
    }
  },
  'BM-PENJODOH_BILANGAN-002': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih penjodoh bilangan yang melengkapkan frasa.',
      sentenceParts: ['se', ' buku cerita bergambar yang dibawa ke perpustakaan sekolah.'],
      options: [
        { id: 'buah', label: 'buah', value: 'buah' },
        { id: 'batang', label: 'batang', value: 'batang' },
        { id: 'helai', label: 'helai', value: 'helai' }
      ]
    },
    qualityReview: {
      curriculum: 'Menggunakan penjodoh bilangan “buah” bagi buku dalam frasa mudah.',
      assessment: 'Tiga penjodoh bilangan lazim digunakan dan hanya “buah” membentuk frasa yang diterima skema asal.',
      textbook: 'Tempat kosong menunjukkan hubungan awalan “se-” dengan penjodoh bilangan tanpa mengubah ayat sumber.'
    },
    intelligence: {
      skillId: 'penjodoh_bilangan.buku', responseMode: 'completion',
      conceptTags: ['penjodoh_bilangan', 'buku', 'frasa_nama'],
      misconceptionTags: ['keliru_batang_dengan_buah', 'memilih_berdasarkan_bentuk_nipis'],
      hintSteps: ['Kenal pasti benda yang dibilang.', 'Ingat penjodoh bilangan umum untuk benda seperti buku.', 'Baca semula “se___ buku” dan pilih bunyi yang betul.']
    }
  },
  'MATH-MASA-PILOT-007': {
    interaction: {
      version: 1,
      type: 'clock',
      instruction: 'Pilih muka jam analog yang sepadan dengan 8:00.',
      prompt: 'Jam digital menunjukkan 8:00. Muka jam analog manakah menunjukkan waktu yang sama?',
      options: [
        { id: 'clock-a', label: 'Jam A', value: '8:00', visual: { kind: 'clock', hour: 8, minute: 0, label: 'Jarum minit menunjuk 12 dan jarum jam menunjuk 8' } },
        { id: 'clock-b', label: 'Jam B', value: '6:00', visual: { kind: 'clock', hour: 6, minute: 0, label: 'Jarum minit menunjuk 12 dan jarum jam menunjuk 6' } },
        { id: 'clock-c', label: 'Jam C', value: '9:30', visual: { kind: 'clock', hour: 9, minute: 30, label: 'Jarum minit menunjuk 6 dan jarum jam berada antara 9 dengan 10' } }
      ]
    },
    qualityReview: {
      curriculum: 'Memadankan notasi waktu tepat pada jam digital dengan muka jam analog.',
      assessment: 'Distraktor menguji kekeliruan nombor jam dan kedudukan jarum minit tanpa memaparkan waktu pada label kad.',
      textbook: 'Tiga muka jam dalaman digunakan sebagai perwakilan visual yang konsisten dan tidak mendedahkan jawapan.'
    },
    intelligence: {
      skillId: 'masa.memadankan_digital_dan_analog', responseMode: 'time_representation',
      conceptTags: ['jam_digital', 'jam_analog', 'waktu_tepat'],
      misconceptionTags: ['keliru_jarum_jam', 'keliru_waktu_tepat_dan_setengah'],
      hintSteps: ['Untuk waktu tepat, cari jarum minit pada 12.', 'Kemudian cari jarum pendek yang menunjuk nombor jam.', 'Padankan nombor pada paparan digital dengan kedudukan jarum pendek.']
    }
  },
  'MATH-BENTUK-PILOT-003': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan rajah, kira setiap bucu dan pilih jawapan.',
      visual: { kind: 'shape', shape: 'rectangle', label: 'Rajah segi empat tepat' },
      options: [
        { id: 'three', label: '3 bucu', value: '3' },
        { id: 'four', label: '4 bucu', value: '4' },
        { id: 'five', label: '5 bucu', value: '5' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti bilangan bucu pada segi empat tepat.',
      assessment: 'Rajah tidak melabel bilangan bucu; murid perlu mengira sebelum memilih satu jawapan.',
      textbook: 'Bentuk geometri dijana oleh SVG dalaman yang jelas pada skrin kecil dan tidak bergantung pada imej luar.'
    },
    intelligence: {
      skillId: 'bentuk.bucu_segi_empat_tepat', responseMode: 'visual_counting',
      conceptTags: ['bentuk_2d', 'bucu', 'segi_empat_tepat'],
      misconceptionTags: ['keliru_bucu_dan_sisi', 'tertinggal_satu_bucu'],
      hintSteps: ['Bucu ialah tempat dua sisi bertemu.', 'Mulakan pada satu penjuru dan bergerak mengelilingi bentuk.', 'Kira setiap penjuru sekali sahaja.']
    }
  },
  'ENG-NOUNS-001': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Choose the animal that completes the clue.',
      options: [
        { id: 'fish', label: 'fish', value: 'fish', visual: { kind: 'object', symbol: '🐟', label: 'A fish' } },
        { id: 'bird', label: 'bird', value: 'bird', visual: { kind: 'object', symbol: '🐦', label: 'A bird' } },
        { id: 'cat', label: 'cat', value: 'cat', visual: { kind: 'object', symbol: '🐈', label: 'A cat' } }
      ]
    },
    qualityReview: {
      curriculum: 'Recognise a familiar Year 2 animal noun from its habitat and body features.',
      assessment: 'Only the fish matches the combined clues “pond”, “fins” and “gills”.',
      textbook: 'Familiar animal symbols and written nouns let pupils compare meaning in two forms.'
    },
    intelligence: {
      skillId: 'nouns.animals_from_clues', responseMode: 'visual_selection',
      conceptTags: ['nouns', 'animals', 'context_clues'],
      misconceptionTags: ['uses_one_clue_only', 'confuses_animal_habitats'],
      hintSteps: ['Look for the place where the animal lives.', 'Think about which animal has fins and gills.', 'Choose the noun for an animal that swims in a pond.']
    }
  },
  'ENG-ANIMALS-004': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Choose the animal with the body part in the clue.',
      options: [
        { id: 'elephant', label: 'elephant', value: 'elephant', visual: { kind: 'object', symbol: '🐘', label: 'An elephant' } },
        { id: 'giraffe', label: 'giraffe', value: 'giraffe', visual: { kind: 'object', symbol: '🦒', label: 'A giraffe' } },
        { id: 'zebra', label: 'zebra', value: 'zebra', visual: { kind: 'object', symbol: '🦓', label: 'A zebra' } }
      ]
    },
    qualityReview: {
      curriculum: 'Identify a familiar animal from a simple English description.',
      assessment: 'The long trunk uniquely identifies the elephant among familiar large animals.',
      textbook: 'Each picture has a visible noun and an accessible semantic label.'
    },
    intelligence: {
      skillId: 'animals.identify_from_body_part', responseMode: 'visual_selection',
      conceptTags: ['animals', 'body_parts', 'descriptive_clues'],
      misconceptionTags: ['confuses_trunk_and_neck', 'chooses_by_size_only'],
      hintSteps: ['Find the words that describe a body part.', 'A trunk is a long nose.', 'Choose the animal that uses a trunk.']
    }
  },
  'ENG-SENTENCES-001': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Choose the verb that makes the sentence correct.',
      sentenceParts: ['At school, I ', ' a pupil.'],
      options: [
        { id: 'am', label: 'am', value: 'am' },
        { id: 'is', label: 'is', value: 'is' },
        { id: 'are', label: 'are', value: 'are' }
      ]
    },
    qualityReview: {
      curriculum: 'Use the correct present form of “be” with the pronoun “I”.',
      assessment: 'The options isolate the agreement contrast am/is/are with one grammatically correct response.',
      textbook: 'The completed sentence stays visible so pupils can read the grammar in context.'
    },
    intelligence: {
      skillId: 'sentences.subject_verb_agreement_i_am', responseMode: 'completion',
      conceptTags: ['sentences', 'verb_to_be', 'subject_verb_agreement'],
      misconceptionTags: ['uses_is_with_i', 'uses_are_with_i'],
      hintSteps: ['Look at the subject at the start of the sentence.', 'The subject is the pronoun “I”.', 'Choose the form of “be” that is used only with this pronoun.']
    }
  },
  'SAINS-HAIWAN-011': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih cara pergerakan ikan.',
      options: [
        { id: 'swim', label: 'Berenang', value: 'berenang', visual: { kind: 'object', symbol: '🐟', label: 'Ikan berenang di dalam air' } },
        { id: 'walk', label: 'Berjalan', value: 'berjalan', visual: { kind: 'object', symbol: '🐾', label: 'Kesan tapak haiwan berjalan' } },
        { id: 'fly', label: 'Terbang', value: 'terbang', visual: { kind: 'object', symbol: '🪽', label: 'Sayap haiwan terbang' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan ikan dengan cara pergerakan berenang.',
      assessment: 'Tiga cara pergerakan berlainan dibandingkan dan hanya berenang sesuai untuk ikan.',
      textbook: 'Simbol dan label menjadikan hubungan haiwan-pergerakan jelas tanpa menggunakan warna sebagai petunjuk.'
    },
    intelligence: {
      skillId: 'haiwan.cara_pergerakan_ikan', responseMode: 'visual_selection',
      conceptTags: ['haiwan', 'pergerakan', 'ikan'],
      misconceptionTags: ['keliru_habitat_dan_pergerakan', 'menyamakan_semua_haiwan'],
      hintSteps: ['Fikir tempat ikan hidup.', 'Perhatikan bentuk badan dan sirip ikan.', 'Pilih pergerakan yang berlaku di dalam air.']
    }
  },
  'SAINS-TUMBUHAN-001': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih fungsi akar yang betul.',
      options: [
        { id: 'absorb', label: 'Menyerap air', value: 'menyerap air', visual: { kind: 'object', symbol: '💧', label: 'Air diserap dari tanah' } },
        { id: 'food', label: 'Membuat makanan', value: 'membuat makanan', visual: { kind: 'object', symbol: '☀️', label: 'Daun menerima cahaya untuk membuat makanan' } },
        { id: 'flower', label: 'Menghasilkan bunga', value: 'menghasilkan bunga', visual: { kind: 'object', symbol: '🌼', label: 'Sekuntum bunga' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti fungsi akar untuk menyerap air daripada tanah.',
      assessment: 'Distraktor ialah fungsi atau hasil bahagian tumbuhan lain supaya salah faham dapat dikenal pasti.',
      textbook: 'Visual menyokong fungsi tetapi label teks kekal sebagai sumber makna utama.'
    },
    intelligence: {
      skillId: 'tumbuhan.fungsi_akar_menyerap_air', responseMode: 'visual_selection',
      conceptTags: ['tumbuhan', 'akar', 'fungsi_bahagian'],
      misconceptionTags: ['keliru_akar_dan_daun', 'keliru_fungsi_dan_hasil'],
      hintSteps: ['Akar berada di dalam tanah.', 'Fikir bahan yang diperlukan tumbuhan daripada tanah.', 'Pilih fungsi yang melibatkan air.']
    }
  },
  'SAINS-BAHAN-001': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih sifat bahan yang melengkapkan fakta.',
      sentenceParts: ['Kayu sukar ditekan kerana bersifat ', '.'],
      options: [
        { id: 'hard', label: 'keras', value: 'keras' },
        { id: 'soft', label: 'lembut', value: 'lembut' },
        { id: 'elastic', label: 'kenyal', value: 'kenyal' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti “keras” sebagai sifat bahan yang sukar ditekan.',
      assessment: 'Pilihan sifat berada dalam domain yang sama dan membezakan kekerasan daripada kelembutan serta kekenyalan.',
      textbook: 'Ayat sebab-akibat kekal lengkap selepas pilihan dimasukkan ke tempat kosong.'
    },
    intelligence: {
      skillId: 'bahan.sifat_keras', responseMode: 'completion',
      conceptTags: ['bahan', 'sifat_bahan', 'kayu'],
      misconceptionTags: ['keliru_keras_dan_kuat', 'keliru_lembut_dan_kenyal'],
      hintSteps: ['Fokus pada frasa “sukar ditekan”.', 'Bandingkan perubahan bentuk apabila setiap bahan ditekan.', 'Pilih sifat yang menunjukkan bahan tidak mudah berubah bentuk.']
    }
  },
  'ARAB-HURUF_HIJAIYAH-001': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih nama yang betul bagi huruf Arab dalam soalan.',
      options: [
        { id: 'alif', label: 'Alif', value: 'alif', visual: { kind: 'object', symbol: 'ا', label: 'Huruf Arab ا', lang: 'ar', dir: 'rtl' } },
        { id: 'ba', label: 'Ba', value: 'ba', visual: { kind: 'object', symbol: 'ب', label: 'Huruf Arab ب', lang: 'ar', dir: 'rtl' } },
        { id: 'ta', label: 'Ta', value: 'ta', visual: { kind: 'object', symbol: 'ت', label: 'Huruf Arab ت', lang: 'ar', dir: 'rtl' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal dan menamakan huruf hijaiyah alif.',
      assessment: 'Tiga huruf awal hijaiyah dipaparkan dengan nama; hanya nama alif sepadan dengan simbol dalam stem.',
      textbook: 'Aksara menggunakan arah kanan-ke-kiri, saiz besar dan label pembaca skrin tanpa imej luaran.'
    },
    intelligence: {
      skillId: 'huruf_hijaiyah.mengenal_alif', responseMode: 'symbol_name_selection',
      conceptTags: ['huruf_hijaiyah', 'alif', 'bentuk_huruf'],
      misconceptionTags: ['keliru_alif_dan_ba', 'membaca_arah_yang_salah'],
      hintSteps: ['Perhatikan sama ada huruf mempunyai titik.', 'Huruf sasaran ialah satu garis tegak tanpa titik.', 'Padankan bentuk itu dengan nama huruf yang betul.']
    }
  },
  'ARAB-WARNA_ARAB-001': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih warna yang sepadan dengan perkataan Arab.',
      options: [
        { id: 'red', label: 'Merah', value: 'merah', visual: { kind: 'object', symbol: '🟥', label: 'Petak berwarna merah' } },
        { id: 'blue', label: 'Biru', value: 'biru', visual: { kind: 'object', symbol: '🟦', label: 'Petak berwarna biru' } },
        { id: 'yellow', label: 'Kuning', value: 'kuning', visual: { kind: 'object', symbol: '🟨', label: 'Petak berwarna kuning' } }
      ]
    },
    qualityReview: {
      curriculum: 'Memadankan kosa kata warna Arab أَحْمَرُ dengan maksud Bahasa Melayu.',
      assessment: 'Warna, label dan simbol disediakan bersama supaya jawapan tidak bergantung pada persepsi warna sahaja.',
      textbook: 'Kad warna menghubungkan perkataan Arab dengan makna harian yang mudah dikenal.'
    },
    intelligence: {
      skillId: 'warna_arab.ahmar_merah', responseMode: 'visual_selection',
      conceptTags: ['warna_arab', 'ahmar', 'merah'],
      misconceptionTags: ['keliru_ahmar_dan_azraq', 'memilih_warna_tanpa_membaca_label'],
      hintSteps: ['Baca perkataan Arab dari kanan ke kiri.', 'Ingat semula warna yang dipadankan dengan “ahmar”.', 'Semak label Bahasa Melayu di bawah setiap petak warna.']
    }
  },
  'ISLAM-JAWI-001': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih nama huruf Jawi yang betul.',
      options: [
        { id: 'alif', label: 'Alif', value: 'alif', visual: { kind: 'object', symbol: 'ا', label: 'Huruf Jawi ا', lang: 'ar', dir: 'rtl' } },
        { id: 'ba', label: 'Ba', value: 'ba', visual: { kind: 'object', symbol: 'ب', label: 'Huruf Jawi ب', lang: 'ar', dir: 'rtl' } },
        { id: 'ta', label: 'Ta', value: 'ta', visual: { kind: 'object', symbol: 'ت', label: 'Huruf Jawi ت', lang: 'ar', dir: 'rtl' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal dan menamakan huruf Jawi alif.',
      assessment: 'Pilihan huruf hampir membezakan alif tanpa titik daripada ba dan ta yang bertitik.',
      textbook: 'Huruf Jawi dipaparkan besar dengan metadata bahasa Arab, arah RTL dan label teks.'
    },
    intelligence: {
      skillId: 'jawi.mengenal_alif', responseMode: 'symbol_name_selection',
      conceptTags: ['jawi', 'alif', 'bentuk_huruf'],
      misconceptionTags: ['keliru_alif_dan_ba', 'tidak_memerhati_titik'],
      hintSteps: ['Lihat bentuk dan bilangan titik pada huruf.', 'Huruf sasaran tidak mempunyai titik.', 'Pilih nama bagi garis tegak tanpa titik itu.']
    }
  },
  'PJ-PERGERAKAN_ASAS-032': {
    interaction: {
      version: 1,
      type: 'ordering',
      instruction: 'Susun dua kad untuk membina gabungan pergerakan asas.',
      prompt: 'Susun dua pergerakan ini mengikut urutan yang diminta: berlari kemudian melompat.',
      responsePreviewLabel: 'Gabungan kamu',
      responseSeparator: ' kemudian ',
      screenReaderInstruction: 'Gunakan butang anak panah atas atau bawah untuk menukar urutan kad.',
      items: [
        { id: 'jump', label: 'Melompat', responseLabel: 'melompat' },
        { id: 'run', label: 'Berlari', responseLabel: 'berlari' }
      ],
      correctOrder: ['run', 'jump']
    },
    qualityReview: {
      curriculum: 'Menggabungkan dua pergerakan asas mengikut urutan berlari kemudian melompat.',
      assessment: 'Kad bermula dalam urutan terbalik dan respons lengkap mesti sepadan tepat dengan jawapan asal.',
      textbook: 'Kawalan atas/bawah menyediakan alternatif sentuhan dan papan kekunci kepada seret dan lepas.'
    },
    intelligence: {
      skillId: 'pergerakan_asas.gabungan_berlari_melompat', responseMode: 'sequencing',
      conceptTags: ['pergerakan_asas', 'gabungan_pergerakan', 'urutan'],
      misconceptionTags: ['urutan_terbalik', 'menganggap_satu_pergerakan_mencukupi'],
      hintSteps: ['Cari perkataan “kemudian” dalam arahan.', 'Letakkan pergerakan pertama di bahagian atas.', 'Semak bahawa melompat berlaku selepas berlari.']
    }
  }
});

const REVIEWED_CONTENT_BATCH_1_SPECS = Object.freeze({
  'MATH-BENTUK-PILOT-004': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan bentuk, kemudian pilih bilangan bucunya.',
      visual: { kind: 'shape', shape: 'circle', label: 'Rajah bentuk bulat dengan sempadan melengkung' },
      options: [
        { id: 'zero', label: '0 bucu', value: '0' },
        { id: 'three', label: '3 bucu', value: '3' },
        { id: 'four', label: '4 bucu', value: '4' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti bahawa bulatan tidak mempunyai bucu.',
      assessment: 'Rajah tidak menyatakan bilangan bucu; murid memerhati sempadan bentuk sebelum memilih 0, 3 atau 4.',
      textbook: 'Bentuk bulat dijana secara dalaman dengan label semantik yang menerangkan rupa tanpa mendedahkan jawapan.'
    },
    intelligence: {
      skillId: 'bentuk.bucu_bulatan', responseMode: 'visual_counting',
      conceptTags: ['bentuk_2d', 'bulatan', 'bucu'],
      misconceptionTags: ['menganggap_bulatan_mempunyai_bucu', 'keliru_bucu_dan_sisi'],
      hintSteps: ['Bucu ialah tempat dua sisi lurus bertemu.', 'Jejaki sempadan bulatan dengan mata.', 'Periksa sama ada terdapat mana-mana penjuru pada bentuk itu.']
    }
  },
  'MATH-BENTUK-PILOT-006': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan objek 3D, kemudian pilih bilangan permukaan ratanya.',
      visual: { kind: 'shape', shape: 'cube', label: 'Rajah objek tiga dimensi yang mempunyai permukaan rata' },
      options: [
        { id: 'six', label: '6 permukaan', value: '6' },
        { id: 'four', label: '4 permukaan', value: '4' },
        { id: 'eight', label: '8 permukaan', value: '8' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti enam permukaan rata pada sebuah kubus.',
      assessment: 'Distraktor 4 dan 8 mengesan kekeliruan antara permukaan, bucu dan ciri bentuk 2D.',
      textbook: 'Rajah kubus dalaman memperlihatkan objek ruang tanpa menulis bilangan permukaannya.'
    },
    intelligence: {
      skillId: 'bentuk.permukaan_rata_kubus', responseMode: 'visual_counting',
      conceptTags: ['objek_3d', 'kubus', 'permukaan_rata'],
      misconceptionTags: ['keliru_permukaan_dan_bucu', 'mengira_permukaan_kelihatan_sahaja'],
      hintSteps: ['Permukaan ialah bahagian rata yang menutupi objek.', 'Bayangkan permukaan di hadapan, belakang, kiri dan kanan.', 'Jangan lupa permukaan di bahagian atas dan bawah.']
    }
  },
  'MATH-BENTUK-PILOT-009': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih objek 3D yang menyerupai tin minuman.',
      options: [
        { id: 'cylinder', label: 'Silinder', value: 'silinder', visual: { kind: 'shape', shape: 'cylinder', label: 'Objek dengan dua permukaan bulat dan satu permukaan melengkung' } },
        { id: 'cube', label: 'Kubus', value: 'kubus', visual: { kind: 'shape', shape: 'cube', label: 'Model kotak dengan permukaan rata yang sama besar' } },
        { id: 'sphere', label: 'Sfera', value: 'sfera', visual: { kind: 'object', symbol: '●', label: 'Model objek bulat penuh seperti bola' } }
      ]
    },
    qualityReview: {
      curriculum: 'Memadankan tin minuman dengan objek 3D silinder.',
      assessment: 'Tiga objek 3D lazim dibandingkan dan hanya silinder mempunyai rupa yang sepadan dengan tin.',
      textbook: 'Visual dalaman disertai nama objek supaya murid menghubungkan contoh harian dengan istilah geometri.'
    },
    intelligence: {
      skillId: 'bentuk.memadankan_tin_dan_silinder', responseMode: 'visual_selection',
      conceptTags: ['objek_3d', 'silinder', 'objek_harian'],
      misconceptionTags: ['keliru_silinder_dan_sfera', 'memilih_berdasarkan_saiz'],
      hintSteps: ['Perhatikan bentuk bahagian atas dan bawah tin.', 'Fikir sama ada sisi tin rata atau melengkung.', 'Pilih objek yang mempunyai dua hujung bulat.']
    }
  },
  'MATH-MASA-PILOT-009': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih perkataan yang melengkapkan cara membaca waktu 6:15.',
      sentenceParts: ['6:15 dibaca sebagai ', '.'],
      options: [
        { id: 'quarter', label: 'pukul enam suku', value: 'pukul enam suku' },
        { id: 'half', label: 'pukul enam setengah', value: 'pukul enam setengah' },
        { id: 'exact', label: 'pukul enam tepat', value: 'pukul enam tepat' }
      ]
    },
    qualityReview: {
      curriculum: 'Menyatakan waktu 6:15 menggunakan ungkapan suku jam yang betul.',
      assessment: 'Tempat kosong mengekalkan kemahiran membaca waktu dalam perkataan; tiga istilah masa mempunyai tepat satu jawapan diterima.',
      textbook: 'Ayat lengkap menghubungkan notasi digital dengan ungkapan waktu tanpa mendedahkan perkataan sasaran dalam arahan.'
    },
    intelligence: {
      skillId: 'masa.membaca_pukul_enam_suku', responseMode: 'completion',
      conceptTags: ['waktu_digital', 'suku_jam', 'ungkapan_waktu'],
      misconceptionTags: ['keliru_suku_dan_setengah', 'keliru_waktu_tepat_dan_suku'],
      hintSteps: ['Perhatikan bahawa waktu itu 15 minit selepas pukul enam.', 'Lima belas minit bersamaan satu perempat jam.', 'Pilih perkataan yang digunakan untuk satu perempat jam.']
    }
  },
  'MATH-WANG-PILOT-010': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih notasi wang yang betul.',
      sentenceParts: ['RM 7 dan 5 sen ditulis sebagai ', '.'],
      options: [
        { id: 'correct', label: 'RM 7.05', value: 'RM 7.05' },
        { id: 'fifty-sen', label: 'RM 7.50', value: 'RM 7.50' },
        { id: 'missing-zero', label: 'RM 7.5', value: 'RM 7.5' }
      ]
    },
    qualityReview: {
      curriculum: 'Menukar RM 7 dan 5 sen kepada notasi wang ringgit yang lengkap.',
      assessment: 'Pilihan menguji penggunaan tepat dua digit bagi sen dan membezakan 5 sen daripada 50 sen serta notasi satu digit.',
      textbook: 'Ayat lengkap mengekalkan nilai sumber dan menekankan sifar di hadapan bagi nilai sen satu digit.'
    },
    intelligence: {
      skillId: 'wang.membina_notasi_rm7_05', responseMode: 'completion',
      conceptTags: ['wang_malaysia', 'notasi_wang', 'ringgit_dan_sen'],
      misconceptionTags: ['menulis_rm7_5_tanpa_sifar', 'keliru_ringgit_dan_sen'],
      hintSteps: ['Letakkan nilai ringgit sebelum titik perpuluhan.', 'Bahagian sen mesti mempunyai dua digit.', 'Lima sen ditulis dengan sifar di hadapan.']
    }
  },
  'MATH-PANJANG-PILOT-004': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih alat yang sesuai untuk mengukur panjang pensel dalam cm.',
      options: [
        { id: 'ruler', label: 'Pembaris', value: 'pembaris', visual: { kind: 'object', symbol: '📏', label: 'Alat lurus bertanda sentimeter' } },
        { id: 'tape', label: 'Pita ukur', value: 'pita ukur', visual: { kind: 'object', symbol: '➰', label: 'Alat ukur panjang yang boleh dilentur' } },
        { id: 'scale', label: 'Penimbang', value: 'penimbang', visual: { kind: 'object', symbol: '⚖️', label: 'Alat untuk mengukur jisim' } }
      ]
    },
    qualityReview: {
      curriculum: 'Memilih pembaris untuk mengukur objek pendek dalam sentimeter.',
      assessment: 'Pilihan membezakan alat panjang berskala cm daripada pita untuk objek besar dan alat mengukur jisim.',
      textbook: 'Simbol alat dan label teks menyokong pemilihan alat ukur yang biasa digunakan di bilik darjah.'
    },
    intelligence: {
      skillId: 'panjang.memilih_pembaris_untuk_pensel', responseMode: 'visual_selection',
      conceptTags: ['panjang', 'sentimeter', 'alat_ukur'],
      misconceptionTags: ['keliru_alat_panjang_dan_jisim', 'memilih_pita_untuk_objek_pendek'],
      hintSteps: ['Pensel ialah objek yang pendek dan lurus.', 'Cari alat yang mempunyai tanda sentimeter pada tepi lurus.', 'Singkirkan alat yang digunakan untuk menimbang.']
    }
  },
  'MATH-PANJANG-PILOT-005': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih alat yang lebih sesuai untuk mengukur tinggi pintu dalam m.',
      options: [
        { id: 'tape', label: 'Pita ukur', value: 'pita ukur', visual: { kind: 'object', symbol: '➰', label: 'Alat panjang yang boleh dilentur dan ditarik' } },
        { id: 'ruler', label: 'Pembaris', value: 'pembaris', visual: { kind: 'object', symbol: '📏', label: 'Alat lurus pendek bertanda sentimeter' } },
        { id: 'scale', label: 'Penimbang', value: 'penimbang', visual: { kind: 'object', symbol: '⚖️', label: 'Alat untuk mengukur jisim' } }
      ]
    },
    qualityReview: {
      curriculum: 'Memilih pita ukur untuk mengukur objek tinggi dalam unit meter.',
      assessment: 'Pilihan alat menguji kesesuaian panjang alat dan unit, bukan sekadar mengenal alat ukur.',
      textbook: 'Visual menunjukkan perbezaan alat lurus pendek, alat fleksibel panjang dan alat jisim.'
    },
    intelligence: {
      skillId: 'panjang.memilih_pita_ukur_untuk_pintu', responseMode: 'visual_selection',
      conceptTags: ['panjang', 'meter', 'alat_ukur'],
      misconceptionTags: ['memilih_pembaris_untuk_objek_tinggi', 'keliru_panjang_dan_jisim'],
      hintSteps: ['Pintu lebih tinggi daripada pembaris sekolah.', 'Cari alat yang boleh dipanjangkan sepanjang pintu.', 'Pilih alat panjang yang mempunyai tanda ukuran meter.']
    }
  },
  'MATH-PANJANG-PILOT-010': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih objek yang lebih sesuai diukur dalam cm.',
      options: [
        { id: 'eraser', label: 'Pemadam', value: 'pemadam', visual: { kind: 'object', symbol: '▰', label: 'Objek kecil yang digunakan bersama pensel' } },
        { id: 'corridor', label: 'Koridor sekolah', value: 'koridor sekolah', visual: { kind: 'object', symbol: '🏫', label: 'Laluan panjang di dalam bangunan sekolah' } }
      ]
    },
    qualityReview: {
      curriculum: 'Memilih sentimeter sebagai unit sesuai bagi objek kecil berbanding jarak yang panjang.',
      assessment: 'Dua objek asal dikekalkan tepat supaya murid membanding skala pemadam dengan koridor sekolah.',
      textbook: 'Perbandingan objek kecil dan ruang sekolah menjelaskan penggunaan cm tanpa menambah distraktor.'
    },
    intelligence: {
      skillId: 'panjang.memilih_objek_untuk_sentimeter', responseMode: 'visual_selection',
      conceptTags: ['panjang', 'sentimeter', 'pemilihan_unit'],
      misconceptionTags: ['menggunakan_cm_untuk_jarak_panjang', 'tidak_membanding_saiz_objek'],
      hintSteps: ['Sentimeter sesuai untuk benda yang pendek.', 'Bayangkan panjang setiap pilihan.', 'Pilih benda kecil yang boleh diletakkan di atas pembaris.']
    }
  },
  'SAINS-HAIWAN-012': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih cara burung bergerak.',
      options: [
        { id: 'fly', label: 'Terbang', value: 'terbang', visual: { kind: 'object', symbol: '🪽', label: 'Haiwan bergerak di udara menggunakan sayap' } },
        { id: 'swim', label: 'Berenang', value: 'berenang', visual: { kind: 'object', symbol: '🌊', label: 'Haiwan bergerak di dalam air' } },
        { id: 'slither', label: 'Menjalar', value: 'menjalar', visual: { kind: 'object', symbol: '〰️', label: 'Haiwan bergerak rapat di permukaan tanah' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan burung dengan cara pergerakan terbang.',
      assessment: 'Tiga cara pergerakan berbeza dipaparkan dan hanya pergerakan menggunakan sayap sesuai untuk burung.',
      textbook: 'Simbol gerakan disertai label teks supaya makna tidak bergantung pada gambar sahaja.'
    },
    intelligence: {
      skillId: 'haiwan.cara_pergerakan_burung', responseMode: 'visual_selection',
      conceptTags: ['haiwan', 'pergerakan', 'burung'],
      misconceptionTags: ['keliru_habitat_dan_pergerakan', 'mengabaikan_fungsi_sayap'],
      hintSteps: ['Perhatikan anggota badan burung yang lebar di kiri dan kanan.', 'Fikir tempat burung bergerak apabila menggunakan sayap.', 'Pilih pergerakan yang berlaku di udara.']
    }
  },
  'SAINS-HAIWAN-013': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih cara ular bergerak.',
      options: [
        { id: 'slither', label: 'Menjalar', value: 'menjalar', visual: { kind: 'object', symbol: '〰️', label: 'Haiwan bergerak rapat di permukaan tanah tanpa kaki' } },
        { id: 'jump', label: 'Melompat', value: 'melompat', visual: { kind: 'object', symbol: '↗️', label: 'Haiwan menolak badan lalu bergerak ke atas' } },
        { id: 'run', label: 'Berlari', value: 'berlari', visual: { kind: 'object', symbol: '🏃', label: 'Haiwan bergerak pantas menggunakan kaki' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan ular dengan cara pergerakan menjalar.',
      assessment: 'Distraktor memerlukan penggunaan kaki, manakala gerakan sasaran sesuai dengan bentuk badan ular.',
      textbook: 'Visual gerakan dan label ringkas membantu murid membanding cara haiwan bergerak.'
    },
    intelligence: {
      skillId: 'haiwan.cara_pergerakan_ular', responseMode: 'visual_selection',
      conceptTags: ['haiwan', 'pergerakan', 'ular'],
      misconceptionTags: ['menganggap_semua_haiwan_berkaki', 'keliru_menjalar_dan_melompat'],
      hintSteps: ['Ular tidak mempunyai kaki.', 'Bayangkan badannya bergerak dekat dengan tanah.', 'Pilih gerakan beralun di atas permukaan.']
    }
  },
  'SAINS-HAIWAN-014': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih cara katak bergerak.',
      options: [
        { id: 'jump', label: 'Melompat', value: 'melompat', visual: { kind: 'object', symbol: '↗️', label: 'Haiwan menolak badan dengan kaki belakang lalu bergerak ke atas' } },
        { id: 'swim', label: 'Berenang', value: 'berenang', visual: { kind: 'object', symbol: '🌊', label: 'Haiwan bergerak di dalam air' } },
        { id: 'slither', label: 'Menjalar', value: 'menjalar', visual: { kind: 'object', symbol: '〰️', label: 'Haiwan bergerak rapat di permukaan tanah' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan katak dengan cara pergerakan melompat.',
      assessment: 'Pilihan membezakan gerakan utama katak di darat daripada berenang dan menjalar.',
      textbook: 'Simbol arah dan penerangan kaki belakang menyokong pemerhatian cara pergerakan.'
    },
    intelligence: {
      skillId: 'haiwan.cara_pergerakan_katak', responseMode: 'visual_selection',
      conceptTags: ['haiwan', 'pergerakan', 'katak'],
      misconceptionTags: ['memilih_berenang_kerana_habitat', 'keliru_melompat_dan_menjalar'],
      hintSteps: ['Perhatikan kaki belakang katak yang kuat.', 'Fikir bagaimana katak bergerak di atas tanah.', 'Pilih gerakan yang mengangkat seluruh badan dari tanah.']
    }
  },
  'SAINS-TUMBUHAN-003': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih fungsi daun yang betul.',
      options: [
        { id: 'food', label: 'Membuat makanan', value: 'membuat makanan', visual: { kind: 'object', symbol: '🍃☀️', label: 'Daun menerima cahaya untuk menghasilkan keperluan tumbuhan' } },
        { id: 'water', label: 'Menyerap air', value: 'menyerap air', visual: { kind: 'object', symbol: '💧', label: 'Air masuk dari tanah melalui akar' } },
        { id: 'support', label: 'Menyokong tumbuhan', value: 'menyokong tumbuhan', visual: { kind: 'object', symbol: '🌱', label: 'Batang menegakkan bahagian tumbuhan' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti fungsi daun untuk membuat makanan bagi tumbuhan.',
      assessment: 'Arah soalan asal dikekalkan dan distraktor ialah fungsi akar serta batang.',
      textbook: 'Cahaya, air dan sokongan digambarkan bersama label supaya fungsi bahagian tumbuhan dapat dibandingkan.'
    },
    intelligence: {
      skillId: 'tumbuhan.fungsi_daun_membuat_makanan', responseMode: 'visual_selection',
      conceptTags: ['tumbuhan', 'daun', 'fungsi_bahagian'],
      misconceptionTags: ['keliru_fungsi_daun_dan_akar', 'keliru_fungsi_daun_dan_batang'],
      hintSteps: ['Daun biasanya lebar dan menerima cahaya.', 'Akar mengambil air, manakala batang menegakkan tumbuhan.', 'Pilih fungsi daun yang menggunakan cahaya.']
    }
  },
  'SAINS-TUMBUHAN-004': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih fungsi bunga yang betul.',
      options: [
        { id: 'fruit', label: 'Menjadi buah', value: 'menjadi buah', visual: { kind: 'object', symbol: '🌼➡️🍎', label: 'Perubahan daripada bunga kepada hasil tumbuhan' } },
        { id: 'food', label: 'Membuat makanan', value: 'membuat makanan', visual: { kind: 'object', symbol: '🍃☀️', label: 'Daun menerima cahaya' } },
        { id: 'water', label: 'Menyerap air', value: 'menyerap air', visual: { kind: 'object', symbol: '🌱💧', label: 'Akar mengambil air dari tanah' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti fungsi bunga yang berkembang menjadi buah.',
      assessment: 'Arah soalan asal dikekalkan dan distraktor membezakan fungsi bunga daripada daun serta akar.',
      textbook: 'Urutan visual bunga kepada hasil tumbuhan menyokong perubahan tanpa menggantikan label teks.'
    },
    intelligence: {
      skillId: 'tumbuhan.fungsi_bunga_menjadi_buah', responseMode: 'visual_selection',
      conceptTags: ['tumbuhan', 'bunga', 'fungsi_bahagian'],
      misconceptionTags: ['keliru_bunga_dan_daun', 'keliru_bunga_dan_akar'],
      hintSteps: ['Fikir apa yang boleh terbentuk selepas bunga berkembang.', 'Daun membuat makanan dan akar menyerap air.', 'Pilih hasil yang bermula daripada bunga.']
    }
  },
  'SAINS-MANUSIA-002': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih kegunaan telinga.',
      options: [
        { id: 'hear', label: 'Mendengar', value: 'mendengar', visual: { kind: 'object', symbol: '👂🔊', label: 'Gelombang bunyi masuk ke organ deria' } },
        { id: 'see', label: 'Melihat', value: 'melihat', visual: { kind: 'object', symbol: '👀', label: 'Mata memerhati objek' } },
        { id: 'smell', label: 'Menghidu', value: 'menghidu', visual: { kind: 'object', symbol: '👃', label: 'Hidung mengesan bau' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan telinga dengan deria pendengaran.',
      assessment: 'Tiga fungsi organ deria dibandingkan dan hanya mendengar sepadan dengan telinga.',
      textbook: 'Simbol organ serta label kegunaan menyokong pembelajaran pelbagai deria secara aksesibel.'
    },
    intelligence: {
      skillId: 'manusia.deria_pendengaran', responseMode: 'visual_selection',
      conceptTags: ['manusia', 'organ_deria', 'telinga'],
      misconceptionTags: ['keliru_telinga_dan_mata', 'keliru_telinga_dan_hidung'],
      hintSteps: ['Fikir bunyi loceng atau suara kawan.', 'Organ manakah menerima bunyi itu?', 'Pilih perbuatan yang menggunakan telinga.']
    }
  },
  'SAINS-MANUSIA-003': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih kegunaan hidung.',
      options: [
        { id: 'smell', label: 'Menghidu', value: 'menghidu', visual: { kind: 'object', symbol: '👃🌸', label: 'Organ deria mengesan bau bunga' } },
        { id: 'hear', label: 'Mendengar', value: 'mendengar', visual: { kind: 'object', symbol: '👂🔊', label: 'Telinga menerima bunyi' } },
        { id: 'taste', label: 'Merasa', value: 'merasa', visual: { kind: 'object', symbol: '👅', label: 'Lidah mengesan rasa makanan' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan hidung dengan deria bau.',
      assessment: 'Pilihan membezakan fungsi hidung daripada telinga dan lidah dengan tepat satu jawapan.',
      textbook: 'Organ deria dipaparkan bersama rangsangan harian dan label untuk perbandingan yang jelas.'
    },
    intelligence: {
      skillId: 'manusia.deria_bau', responseMode: 'visual_selection',
      conceptTags: ['manusia', 'organ_deria', 'hidung'],
      misconceptionTags: ['keliru_hidung_dan_telinga', 'keliru_bau_dan_rasa'],
      hintSteps: ['Bayangkan bau bunga atau makanan.', 'Organ manakah mengesan bau di udara?', 'Pilih perbuatan yang menggunakan hidung.']
    }
  }
});

const REVIEWED_Q4_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_Q4_SPECS).map(([id, spec]) => [id, {
    interaction: spec.interaction,
    qualityReview: spec.qualityReview
  }])
);

const REVIEWED_CONTENT_BATCH_2_SPECS = Object.freeze({
  'MATH-NOMBOR-PILOT-004': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan kedudukan digit 8, kemudian pilih nilainya.',
      visual: {
        kind: 'placeValue',
        columns: [
          { id: 'hundreds', label: 'Ratus', value: 5, block: 'hundred' },
          { id: 'tens', label: 'Puluh', value: 8, block: 'ten' },
          { id: 'ones', label: 'Sa', value: 2, block: 'one' }
        ]
      },
      options: [
        { id: 'digit', label: '8', value: '8' },
        { id: 'tens-value', label: '80', value: '80' },
        { id: 'hundreds-value', label: '800', value: '800' }
      ]
    },
    qualityReview: {
      curriculum: 'Menentukan nilai digit berdasarkan tempat ratus, puluh dan sa dalam nombor hingga 1,000.',
      assessment: 'Model menunjukkan struktur 582 tanpa menulis persamaan 8 puluh = 80; pilihan menguji digit berbanding nilai tempat.',
      textbook: 'Lajur nilai tempat membantu murid membezakan digit 8 daripada nilainya dalam nombor 582.'
    },
    intelligence: {
      skillId: 'nombor.nilai_digit_puluh', responseMode: 'visual_reasoning',
      conceptTags: ['nilai_tempat', 'digit_puluh', 'nombor_582'],
      misconceptionTags: ['menyamakan_digit_dengan_nilai', 'keliru_puluh_dan_ratus'],
      hintSteps: ['Cari lajur yang mengandungi digit 8.', 'Baca nama nilai tempat pada lajur itu.', 'Tentukan nilai digit apabila 8 berada pada tempat puluh.']
    }
  },
  'MATH-NOMBOR-PILOT-009': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih simbol perbandingan yang melengkapkan ayat nombor.',
      sentenceParts: ['458 ', ' 485.'],
      options: [
        { id: 'greater', label: '>', value: '>' },
        { id: 'less', label: '<', value: '<' },
        { id: 'equal', label: '=', value: '=' }
      ]
    },
    qualityReview: {
      curriculum: 'Membandingkan dua nombor hingga 1,000 menggunakan simbol lebih besar, lebih kecil atau sama dengan.',
      assessment: 'Tiga simbol perbandingan dikekalkan dan tepat satu melengkapkan hubungan 458 dengan 485.',
      textbook: 'Ayat nombor lengkap dipaparkan selepas pilihan supaya arah simbol boleh disemak dalam konteks.'
    },
    intelligence: {
      skillId: 'nombor.membanding_458_485', responseMode: 'completion',
      conceptTags: ['banding_nombor', 'simbol_perbandingan', 'nilai_tempat'],
      misconceptionTags: ['arah_simbol_terbalik', 'membanding_digit_sa_dahulu'],
      hintSteps: ['Bandingkan digit ratus terlebih dahulu.', 'Jika digit ratus sama, teruskan kepada digit puluh.', 'Pilih simbol yang membuka ke arah nombor yang lebih besar.']
    }
  },
  'MATH-NOMBOR-PILOT-010': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih nombor yang melengkapkan urutan menurun.',
      sentenceParts: ['603, 602, ', '.'],
      options: [
        { id: 'previous', label: '601', value: '601' },
        { id: 'repeat', label: '602', value: '602' },
        { id: 'skip', label: '600', value: '600' }
      ]
    },
    qualityReview: {
      curriculum: 'Melengkapkan urutan nombor menurun satu demi satu hingga 1,000.',
      assessment: 'Distraktor mengesan pengulangan nombor dan penurunan dua langkah berbanding satu langkah.',
      textbook: 'Urutan ringkas mengekalkan fokus pada perubahan satu bagi setiap kedudukan.'
    },
    intelligence: {
      skillId: 'nombor.urutan_menurun_satu', responseMode: 'completion',
      conceptTags: ['urutan_menurun', 'tolak_satu', 'nombor_hingga_1000'],
      misconceptionTags: ['mengulang_nombor', 'melangkau_dua_nombor'],
      hintSteps: ['Perhatikan perubahan daripada 603 kepada 602.', 'Gunakan perubahan yang sama sekali lagi.', 'Cari nombor tepat sebelum 602.']
    }
  },
  'MATH-NOMBOR-PILOT-017': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih nombor yang melengkapkan pola.',
      sentenceParts: ['245, 250, 255, ', '.'],
      options: [
        { id: 'plus-five', label: '260', value: '260' },
        { id: 'plus-one', label: '256', value: '256' },
        { id: 'plus-ten', label: '265', value: '265' }
      ]
    },
    qualityReview: {
      curriculum: 'Melengkapkan pola nombor yang bertambah lima secara berterusan.',
      assessment: 'Distraktor membezakan pola tambah 5 daripada tambah 1 dan tambah 10.',
      textbook: 'Empat kedudukan pola membolehkan murid mengenal perubahan yang berulang.'
    },
    intelligence: {
      skillId: 'nombor.pola_tambah_lima', responseMode: 'completion',
      conceptTags: ['pola_nombor', 'tambah_lima', 'urutan_menaik'],
      misconceptionTags: ['menggunakan_tambah_satu', 'menggunakan_tambah_sepuluh'],
      hintSteps: ['Cari beza antara dua nombor pertama.', 'Semak bahawa beza yang sama berlaku pada pasangan seterusnya.', 'Tambah beza itu sekali lagi kepada 255.']
    }
  },
  'MATH-NOMBOR-PILOT-018': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih nombor yang melengkapkan pola.',
      sentenceParts: ['430, 440, 450, ', '.'],
      options: [
        { id: 'plus-ten', label: '460', value: '460' },
        { id: 'plus-one', label: '451', value: '451' },
        { id: 'plus-hundred', label: '550', value: '550' }
      ]
    },
    qualityReview: {
      curriculum: 'Melengkapkan pola nombor yang bertambah sepuluh secara berterusan.',
      assessment: 'Distraktor membezakan pola tambah 10 daripada tambah 1 dan tambah 100.',
      textbook: 'Digit puluh berubah secara tetap sementara nilai tempat lain boleh dibandingkan.'
    },
    intelligence: {
      skillId: 'nombor.pola_tambah_sepuluh', responseMode: 'completion',
      conceptTags: ['pola_nombor', 'tambah_sepuluh', 'nilai_tempat_puluh'],
      misconceptionTags: ['menggunakan_tambah_satu', 'menggunakan_tambah_seratus'],
      hintSteps: ['Cari beza antara 430 dengan 440.', 'Semak perubahan yang sama daripada 440 kepada 450.', 'Tambah satu puluh lagi kepada 450.']
    }
  },
  'MATH-NOMBOR-PILOT-029': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih nilai tempat yang melengkapkan bentuk cerakin.',
      sentenceParts: ['300 + ', ' + 7 = 357'],
      options: [
        { id: 'tens', label: '50', value: '50' },
        { id: 'ones', label: '5', value: '5' },
        { id: 'hundreds', label: '500', value: '500' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti nilai puluh yang hilang dalam bentuk cerakin nombor 357.',
      assessment: 'Distraktor membezakan digit 5, nilai puluh dan nilai ratus tanpa mendedahkan jawapan dalam arahan.',
      textbook: 'Ayat nombor lengkap mengekalkan hubungan antara 300, nilai puluh dan 7.'
    },
    intelligence: {
      skillId: 'nombor.nilai_puluh_dalam_bentuk_cerakin', responseMode: 'completion',
      conceptTags: ['bentuk_cerakin', 'nilai_tempat_puluh', 'nombor_357'],
      misconceptionTags: ['menulis_digit_lima', 'memilih_nilai_ratus'],
      hintSteps: ['Lihat digit di tempat puluh dalam 357.', 'Bezakan digit itu daripada nilainya.', 'Pilih nilai yang melengkapkan 300 dan 7 untuk membina 357.']
    }
  },
  'MATH-PANJANG-PILOT-006': {
    interaction: {
      version: 1,
      type: 'measurement',
      instruction: 'Perhatikan skala pembaris, kemudian pilih tanda mula yang betul sebelum mengukur.',
      visual: { kind: 'ruler', startCm: 0, endCm: 10, maxCm: 10, objectLabel: 'Skala penuh pembaris' },
      options: [
        { id: 'zero', label: '0 cm', value: '0 cm' },
        { id: 'one', label: '1 cm', value: '1 cm' },
        { id: 'ten', label: '10 cm', value: '10 cm' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti tanda mula yang betul ketika meletakkan objek pada pembaris.',
      assessment: 'Skala penuh memaparkan semua tanda secara sama tanpa penanda jawapan khas; pilihan menguji kekeliruan tanda mula, tanda pertama dan hujung skala.',
      textbook: 'Pembaris bernombor menghubungkan amalan meletakkan hujung objek dengan bacaan ukuran yang tepat.'
    },
    intelligence: {
      skillId: 'panjang.meletakkan_objek_pada_tanda_mula', responseMode: 'visual_measurement',
      conceptTags: ['panjang', 'pembaris', 'tanda_mula'],
      misconceptionTags: ['bermula_pada_satu', 'bermula_pada_hujung_skala'],
      hintSteps: ['Cari nombor paling awal pada skala pembaris.', 'Ukuran bermula sebelum tanda satu sentimeter.', 'Pilih tanda yang menjadi asal skala.']
    }
  },
  'MATH-MASA-PILOT-001': {
    interaction: {
      version: 1,
      type: 'choice',
      instruction: 'Pilih hari yang hadir selepas Selasa.',
      options: [
        { id: 'monday', label: 'Isnin', value: 'Isnin' },
        { id: 'wednesday', label: 'Rabu', value: 'Rabu' },
        { id: 'thursday', label: 'Khamis', value: 'Khamis' }
      ]
    },
    qualityReview: {
      curriculum: 'Menentukan hari berikutnya dalam urutan tujuh hari seminggu.',
      assessment: 'Pilihan mengekalkan konstruk urutan hari dan mempunyai tepat satu jawapan yang diterima.',
      textbook: 'Nama hari dipaparkan ringkas supaya murid menggunakan turutan minggu, bukan membaca muka jam.'
    },
    intelligence: {
      skillId: 'masa.hari_selepas_selasa', responseMode: 'choice_selection',
      conceptTags: ['hari_seminggu', 'urutan_hari', 'selepas'],
      misconceptionTags: ['memilih_hari_sebelum', 'melangkau_satu_hari'],
      hintSteps: ['Sebut urutan hari seminggu perlahan-lahan.', 'Berhenti apabila kamu sampai pada Selasa.', 'Pilih nama hari yang disebut tepat selepasnya.']
    }
  },
  'MATH-WANG-PILOT-003': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih nombor yang melengkapkan hubungan sen dengan ringgit.',
      sentenceParts: ['100 sen = RM ', '.'],
      options: [
        { id: 'one', label: '1', value: '1' },
        { id: 'ten', label: '10', value: '10' },
        { id: 'hundred', label: '100', value: '100' }
      ]
    },
    qualityReview: {
      curriculum: 'Menyatakan hubungan asas antara 100 sen dengan ringgit Malaysia.',
      assessment: 'Tempat kosong menilai nilai ringgit yang setara; distraktor mengesan kekeliruan digit dan unit tanpa menggunakan pembina wang.',
      textbook: 'Ayat persamaan lengkap menghubungkan unit sen di sebelah kiri dengan simbol RM di sebelah kanan.'
    },
    intelligence: {
      skillId: 'wang.hubungan_seratus_sen_satu_ringgit', responseMode: 'completion',
      conceptTags: ['wang_malaysia', 'sen_dan_ringgit', 'kesetaraan_nilai'],
      misconceptionTags: ['mengekalkan_nombor_seratus', 'menganggap_seratus_sen_sepuluh_ringgit'],
      hintSteps: ['Ingat berapa sen membentuk satu ringgit.', 'Sebelah kanan sudah mempunyai simbol RM.', 'Pilih bilangan ringgit yang nilainya sama dengan 100 sen.']
    }
  },
  'SAINS-MANUSIA-004': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih perkara yang dikesan oleh lidah pada makanan.',
      options: [
        { id: 'taste', label: 'Rasa', value: 'rasa', visual: { kind: 'object', symbol: '🍋🍬', label: 'Makanan masam dan manis' } },
        { id: 'sound', label: 'Bunyi', value: 'bunyi', visual: { kind: 'object', symbol: '🔔', label: 'Loceng menghasilkan bunyi' } },
        { id: 'smell', label: 'Bau', value: 'bau', visual: { kind: 'object', symbol: '🌸', label: 'Bunga mempunyai bau' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan lidah dengan deria rasa ketika makan.',
      assessment: 'Pilihan membezakan rasa daripada bunyi dan bau dengan tepat satu jawapan diterima.',
      textbook: 'Simbol organ dan rangsangan harian disertai label teks untuk perbandingan fungsi deria.'
    },
    intelligence: {
      skillId: 'manusia.deria_rasa', responseMode: 'visual_selection',
      conceptTags: ['manusia', 'organ_deria', 'lidah', 'rasa'],
      misconceptionTags: ['keliru_rasa_dan_bau', 'keliru_lidah_dan_telinga'],
      hintSteps: ['Bayangkan kamu makan sesuatu yang masam.', 'Fikir organ yang berada di dalam mulut.', 'Pilih perkara pada makanan yang organ itu boleh kesan.']
    }
  },
  'SAINS-MANUSIA-005': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih perkara yang dikesan oleh kulit pada badan.',
      options: [
        { id: 'touch', label: 'Sentuhan', value: 'sentuhan', visual: { kind: 'object', symbol: '✋🧸', label: 'Tangan menyentuh objek lembut' } },
        { id: 'colour', label: 'Warna', value: 'warna', visual: { kind: 'object', symbol: '👀🎨', label: 'Mata melihat warna' } },
        { id: 'sound', label: 'Bunyi', value: 'bunyi', visual: { kind: 'object', symbol: '👂🔔', label: 'Telinga mendengar loceng' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan kulit dengan deria sentuhan.',
      assessment: 'Pilihan membezakan sentuhan daripada rangsangan yang dikesan oleh mata dan telinga.',
      textbook: 'Simbol organ dan objek disertai label untuk menerangkan pengalaman deria yang biasa.'
    },
    intelligence: {
      skillId: 'manusia.deria_sentuhan', responseMode: 'visual_selection',
      conceptTags: ['manusia', 'organ_deria', 'kulit', 'sentuhan'],
      misconceptionTags: ['keliru_kulit_dan_mata', 'keliru_sentuhan_dan_bunyi'],
      hintSteps: ['Bayangkan memegang objek yang lembut atau kasar.', 'Fikir organ deria yang meliputi seluruh badan.', 'Pilih perkara yang dapat dirasai apabila objek menyentuh kulit.']
    }
  },
  'SAINS-HAIWAN-015': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih cara kuda bergerak.',
      options: [
        { id: 'run', label: 'Berlari', value: 'berlari', visual: { kind: 'object', symbol: '🏃', label: 'Gerakan pantas di darat' } },
        { id: 'swim', label: 'Berenang', value: 'berenang', visual: { kind: 'object', symbol: '🏊', label: 'Gerakan di dalam air' } },
        { id: 'fly', label: 'Terbang', value: 'terbang', visual: { kind: 'object', symbol: '🪽', label: 'Gerakan di udara' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan kuda dengan cara pergerakan utamanya.',
      assessment: 'Tiga gerakan jelas berbeza dan hanya gerakan menggunakan kaki di darat sepadan dengan kuda.',
      textbook: 'Simbol gerakan dan label teks membantu murid membandingkan cara haiwan bergerak.'
    },
    intelligence: {
      skillId: 'haiwan.cara_pergerakan_kuda', responseMode: 'visual_selection',
      conceptTags: ['haiwan', 'pergerakan', 'kuda'],
      misconceptionTags: ['keliru_habitat_dan_pergerakan', 'mengabaikan_penggunaan_kaki'],
      hintSteps: ['Perhatikan bahawa kuda mempunyai empat kaki yang kuat.', 'Fikir cara kuda bergerak pantas di darat.', 'Pilih gerakan yang menggunakan kaki dan kekal di permukaan tanah.']
    }
  },
  'SAINS-HAIWAN-016': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih cara siput bergerak.',
      options: [
        { id: 'crawl', label: 'Merayap', value: 'merayap', visual: { kind: 'object', symbol: '〰️', label: 'Gerakan perlahan rapat pada permukaan' } },
        { id: 'run', label: 'Berlari', value: 'berlari', visual: { kind: 'object', symbol: '🏃', label: 'Gerakan pantas menggunakan kaki' } },
        { id: 'jump', label: 'Melompat', value: 'melompat', visual: { kind: 'object', symbol: '↗️', label: 'Gerakan menolak badan ke atas' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan siput dengan cara pergerakan merayap.',
      assessment: 'Distraktor memerlukan kaki atau lompatan, manakala gerakan sasaran sesuai dengan badan siput.',
      textbook: 'Simbol haiwan dan gerakan disertai label teks supaya perbezaan pergerakan jelas.'
    },
    intelligence: {
      skillId: 'haiwan.cara_pergerakan_siput', responseMode: 'visual_selection',
      conceptTags: ['haiwan', 'pergerakan', 'siput'],
      misconceptionTags: ['menganggap_semua_haiwan_berlari', 'keliru_merayap_dan_melompat'],
      hintSteps: ['Siput tidak mempunyai kaki untuk berlari.', 'Bayangkan badannya bergerak rapat pada permukaan.', 'Pilih gerakan perlahan tanpa melompat atau terbang.']
    }
  },
  'SAINS-TUMBUHAN-005': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih fungsi buah pada tumbuhan.',
      options: [
        { id: 'protect-seeds', label: 'Melindungi biji benih', value: 'melindungi biji benih', visual: { kind: 'object', symbol: '🛡️🫘', label: 'Biji benih berada terlindung di bahagian dalam' } },
        { id: 'absorb-water', label: 'Menyerap air', value: 'menyerap air', visual: { kind: 'object', symbol: '⬇️💧', label: 'Air masuk dari tanah' } },
        { id: 'make-food', label: 'Membuat makanan', value: 'membuat makanan', visual: { kind: 'object', symbol: '☀️🍚', label: 'Cahaya digunakan untuk menghasilkan makanan' } }
      ]
    },
    qualityReview: {
      curriculum: 'Menyatakan fungsi buah dalam melindungi biji benih.',
      assessment: 'Distraktor ialah fungsi akar dan daun; hanya satu fungsi sepadan dengan buah.',
      textbook: 'Simbol bahagian tumbuhan dan label teks membantu murid membandingkan fungsi yang berbeza.'
    },
    intelligence: {
      skillId: 'tumbuhan.fungsi_buah', responseMode: 'visual_selection',
      conceptTags: ['tumbuhan', 'bahagian_tumbuhan', 'buah', 'biji_benih'],
      misconceptionTags: ['keliru_fungsi_buah_dan_akar', 'keliru_fungsi_buah_dan_daun'],
      hintSteps: ['Fikir perkara yang biasanya terdapat di dalam buah.', 'Bandingkan fungsi buah dengan fungsi akar dan daun.', 'Pilih fungsi yang menjaga bahagian di dalam buah.']
    }
  },
  'SAINS-TUMBUHAN-021': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih peringkat yang melengkapkan urutan pertumbuhan tumbuhan.',
      sentenceParts: ['Biji benih boleh menjadi ', '.'],
      options: [
        { id: 'seedling', label: 'anak pokok', value: 'anak pokok' },
        { id: 'adult-tree', label: 'pokok dewasa', value: 'pokok dewasa' },
        { id: 'flower', label: 'bunga', value: 'bunga' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti peringkat awal selepas biji benih dalam urutan pertumbuhan tumbuhan.',
      assessment: 'Distraktor ialah peringkat kemudian dan struktur tumbuhan; hanya satu melengkapkan perubahan segera daripada biji benih.',
      textbook: 'Ayat lengkap menghubungkan biji benih dengan peringkat pertumbuhan berikutnya.'
    },
    intelligence: {
      skillId: 'tumbuhan.urutan_biji_benih_anak_pokok', responseMode: 'completion',
      conceptTags: ['tumbuhan', 'pertumbuhan', 'biji_benih', 'anak_pokok'],
      misconceptionTags: ['melangkau_ke_pokok_dewasa', 'keliru_peringkat_dan_bahagian'],
      hintSteps: ['Fikir apa yang keluar apabila biji benih mula bercambah.', 'Cari peringkat yang masih kecil dan baru tumbuh.', 'Pilih peringkat sebelum tumbuhan menjadi pokok dewasa.']
    }
  }
});

const REVIEWED_CONTENT_BATCH_2_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_CONTENT_BATCH_2_SPECS).map(([id, spec]) => [id, {
    interaction: spec.interaction,
    qualityReview: spec.qualityReview
  }])
);

const REVIEWED_EQUAL_GROUPS_PILOT_SPECS = Object.freeze({
  'MATH-DARAB-PILOT-002': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan kumpulan pembilang. Kira semua pembilang, kemudian pilih hasil darab yang betul.',
      visual: { kind: 'equalGroups', mode: 'multiplication', groups: 4, itemsPerGroup: 5 },
      options: [
        { id: 'twenty', label: '20', value: '20' },
        { id: 'nine', label: '9', value: '9' },
        { id: 'sixteen', label: '16', value: '16' }
      ]
    },
    qualityReview: {
      curriculum: 'Mentafsir pendaraban sebagai empat kumpulan sama yang mengandungi lima objek bagi setiap kumpulan.',
      assessment: 'Visual menilai pengiraan semua pembilang; distraktor mengesan penambahan dua faktor dan penggunaan saiz kumpulan yang salah.',
      textbook: 'Pembilang dalam empat bekas berbatas memberikan perwakilan konkrit kumpulan sama sambil mengekalkan tugasan darab asal.'
    },
    intelligence: {
      skillId: 'darab.kumpulan_sama_5_darab_4', responseMode: 'visual_counting',
      conceptTags: ['darab', 'kumpulan_sama', 'tambah_berulang'],
      misconceptionTags: ['menambah_operan', 'salah_bilangan_dalam_kumpulan'],
      hintSteps: ['Kenal pasti berapa banyak kumpulan yang ditunjukkan.', 'Setiap kumpulan mempunyai bilangan pembilang yang sama.', 'Kira semua pembilang kumpulan demi kumpulan.']
    }
  },
  'MATH-DARAB-PILOT-004': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan 3 kumpulan pembilang. Kira jumlah semuanya dan pilih jawapan.',
      visual: { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4 },
      options: [
        { id: 'twelve', label: '12', value: '12' },
        { id: 'seven', label: '7', value: '7' },
        { id: 'sixteen', label: '16', value: '16' }
      ]
    },
    qualityReview: {
      curriculum: 'Menghubungkan fakta darab tiga dengan model tiga kumpulan sama yang mempunyai empat objek setiap satu.',
      assessment: 'Distraktor membezakan murid yang menambah faktor daripada murid yang mengulang faktor kedua secara berlebihan.',
      textbook: 'Tiga kumpulan pembilang berbatas menyokong tambah berulang tanpa menulis hasil darab dalam rajah.'
    },
    intelligence: {
      skillId: 'darab.tiga_kumpulan_empat', responseMode: 'visual_counting',
      conceptTags: ['darab', 'kumpulan_sama', 'tambah_berulang'],
      misconceptionTags: ['menambah_operan', 'mengulang_faktor_yang_salah'],
      hintSteps: ['Terdapat 3 kumpulan yang sama.', 'Kira 4 pembilang dalam setiap kumpulan.', 'Tambah 4 sebanyak 3 kali.']
    }
  },
  'MATH-DARAB-PILOT-006': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan satu kumpulan pembilang dan pilih jumlah pembilang yang betul.',
      visual: { kind: 'equalGroups', mode: 'multiplication', groups: 1, itemsPerGroup: 8 },
      options: [
        { id: 'eight', label: '8', value: '8' },
        { id: 'nine', label: '9', value: '9' },
        { id: 'one', label: '1', value: '1' }
      ]
    },
    qualityReview: {
      curriculum: 'Memahami fakta identiti pendaraban apabila hanya satu kumpulan objek ditunjukkan.',
      assessment: 'Pilihan mengesan penambahan faktor dan kekeliruan antara bilangan kumpulan dengan jumlah pembilang.',
      textbook: 'Satu bekas pembilang memberikan model konkrit faktor satu tanpa menambahkan petunjuk jawapan pada metadata.'
    },
    intelligence: {
      skillId: 'darab.identiti_satu_kumpulan', responseMode: 'visual_counting',
      conceptTags: ['darab', 'satu_kumpulan', 'fakta_satu'],
      misconceptionTags: ['menambah_operan', 'memilih_bilangan_kumpulan'],
      hintSteps: ['Hanya satu kumpulan ditunjukkan.', 'Kira semua pembilang di dalam kumpulan itu.', 'Mendarab dengan 1 mengekalkan bilangan dalam satu kumpulan.']
    }
  },
  'MATH-DARAB-PILOT-008': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Kira pembilang dalam semua kumpulan, kemudian pilih hasil darab yang betul.',
      visual: { kind: 'equalGroups', mode: 'multiplication', groups: 7, itemsPerGroup: 2 },
      options: [
        { id: 'fourteen', label: '14', value: '14' },
        { id: 'nine', label: '9', value: '9' },
        { id: 'seven', label: '7', value: '7' }
      ]
    },
    qualityReview: {
      curriculum: 'Mewakilkan fakta darab tujuh dengan dua sebagai tujuh kumpulan sama untuk dikira secara berulang.',
      assessment: 'Distraktor mengesan penambahan dua faktor serta kecenderungan mengira bekas sahaja dan bukan semua pembilang.',
      textbook: 'Kumpulan kecil yang tersusun membolehkan kiraan dua-dua dibuat secara konkrit tanpa memaparkan hasil akhir.'
    },
    intelligence: {
      skillId: 'darab.tujuh_kumpulan_dua', responseMode: 'visual_counting',
      conceptTags: ['darab', 'kumpulan_sama', 'tambah_berulang'],
      misconceptionTags: ['menambah_operan', 'mengira_kumpulan_bukan_pembilang'],
      hintSteps: ['Lihat tujuh kumpulan yang sama.', 'Setiap kumpulan mempunyai dua pembilang.', 'Kira dua-dua sehingga semua kumpulan selesai.']
    }
  },
  'MATH-BAHAGI-PILOT-004': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan pembilang yang disusun 5 dalam setiap kumpulan. Kira bilangan kumpulan.',
      visual: { kind: 'equalGroups', mode: 'divisionGrouping', total: 25, itemsPerGroup: 5 },
      options: [
        { id: 'five', label: '5', value: '5' },
        { id: 'four', label: '4', value: '4' },
        { id: 'six', label: '6', value: '6' }
      ]
    },
    qualityReview: {
      curriculum: 'Mentafsir bahagi sebagai pengumpulan apabila jumlah dan bilangan objek dalam setiap kumpulan diketahui.',
      assessment: 'Murid mengira bekas lengkap; pilihan bersebelahan mengesan kesilapan menambah atau tertinggal satu kumpulan.',
      textbook: 'Pembilang dibahagi kepada bekas sama saiz sebagai model konkrit pengumpulan tanpa menyimpan bilangan kumpulan jawapan.'
    },
    intelligence: {
      skillId: 'bahagi.pengumpulan_25_dengan_5', responseMode: 'visual_counting',
      conceptTags: ['bahagi', 'pengumpulan', 'kumpulan_sama'],
      misconceptionTags: ['tersalah_mengira_kumpulan', 'keliru_jumlah_dan_saiz_kumpulan'],
      hintSteps: ['Setiap kumpulan mesti mempunyai lima pembilang.', 'Jejaki satu kumpulan pada satu masa.', 'Kira berapa kumpulan yang diperlukan untuk menggunakan semua pembilang.']
    }
  },
  'MATH-BAHAGI-PILOT-007': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan 24 pembilang yang dibahagi sama rata kepada 4 kumpulan. Pilih bilangan pembilang dalam setiap kumpulan.',
      visual: { kind: 'equalGroups', mode: 'divisionSharing', total: 24, groups: 4 },
      options: [
        { id: 'six', label: '6', value: '6' },
        { id: 'four', label: '4', value: '4' },
        { id: 'eight', label: '8', value: '8' }
      ]
    },
    qualityReview: {
      curriculum: 'Mentafsir bahagi sebagai perkongsian sama rata apabila jumlah dan bilangan kumpulan diketahui.',
      assessment: 'Pilihan membezakan hasil perkongsian daripada bilangan kumpulan dan agihan yang tidak sepadan dengan jumlah asal.',
      textbook: 'Empat bekas pembilang menunjukkan perkongsian sama rata sambil mengekalkan bilangan setiap kumpulan sebagai perkara yang perlu dikira.'
    },
    intelligence: {
      skillId: 'bahagi.perkongsian_24_kepada_4', responseMode: 'visual_counting',
      conceptTags: ['bahagi', 'perkongsian_sama_rata', 'kumpulan_sama'],
      misconceptionTags: ['memilih_bilangan_kumpulan', 'agihan_tidak_sama_rata'],
      hintSteps: ['Semua kumpulan mesti menerima bilangan yang sama.', 'Perhatikan satu kumpulan selepas pembahagian sama rata.', 'Kira pembilang di dalam satu kumpulan sahaja.']
    }
  },
  'MATH-BAHAGI-PILOT-009': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan pembahagian sama rata kepada 2 kumpulan. Kira pembilang dalam satu kumpulan.',
      visual: { kind: 'equalGroups', mode: 'divisionSharing', total: 16, groups: 2 },
      options: [
        { id: 'eight', label: '8', value: '8' },
        { id: 'two', label: '2', value: '2' },
        { id: 'fourteen', label: '14', value: '14' }
      ]
    },
    qualityReview: {
      curriculum: 'Membahagi jumlah kepada dua kumpulan sama rata dan menentukan bilangan objek dalam satu kumpulan.',
      assessment: 'Distraktor mengesan penyalinan bilangan kumpulan dan penolakan pembahagi sekali sahaja sebagai ganti bahagi.',
      textbook: 'Dua bekas berbatas memberi bukti visual perkongsian sama rata tanpa menyatakan hasil bahagi dalam teks rajah.'
    },
    intelligence: {
      skillId: 'bahagi.perkongsian_16_kepada_2', responseMode: 'visual_counting',
      conceptTags: ['bahagi', 'perkongsian_sama_rata', 'dua_kumpulan'],
      misconceptionTags: ['memilih_bilangan_kumpulan', 'menolak_sekali'],
      hintSteps: ['Bahagikan semua pembilang kepada dua kumpulan yang sama.', 'Kedua-dua kumpulan mesti mempunyai bilangan pembilang yang sama.', 'Kira pembilang dalam salah satu kumpulan.']
    }
  },
  'MATH-BAHAGI-PILOT-047': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Anggap setiap kumpulan sebagai satu dulang. Kira bilangan kuih dalam setiap dulang.',
      visual: { kind: 'equalGroups', mode: 'divisionSharing', total: 27, groups: 3 },
      options: [
        { id: 'nine', label: '9 kuih', value: '9' },
        { id: 'eight', label: '8 kuih', value: '8' },
        { id: 'ten', label: '10 kuih', value: '10' }
      ]
    },
    qualityReview: {
      curriculum: 'Menyelesaikan masalah bahagi Tahun 2 sebagai perkongsian sama rata dalam konteks tiga dulang.',
      assessment: 'Kumpulan mewakili dulang dan pilihan bersebelahan mengesan agihan tidak sama rata atau kesilapan satu ketika mengira.',
      textbook: 'Bekas equal-group bertindak sebagai dulang secara konseptual tanpa ikon tambahan atau perubahan pada masalah berkonteks asal.'
    },
    intelligence: {
      skillId: 'bahagi.perkongsian_kuih_27_kepada_3', responseMode: 'visual_counting_context',
      conceptTags: ['bahagi', 'perkongsian_sama_rata', 'masalah_berkonteks', 'dulang'],
      misconceptionTags: ['agihan_tidak_sama_rata', 'tersalah_satu_ketika_mengira'],
      hintSteps: ['Terdapat 3 dulang untuk 27 kuih.', 'Setiap dulang mesti menerima bilangan kuih yang sama.', 'Kira pembilang di dalam satu kumpulan selepas pembahagian sama rata.']
    }
  }
});

const REVIEWED_ARRAY_PILOT_SPECS = Object.freeze({
  'MATH-DARAB-PILOT-003': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan tatasusunan baris dan lajur. Kira jumlah objek dan pilih jawapan yang betul.',
      visual: { kind: 'array', mode: 'multiplication', rows: 10, columns: 6 },
      options: [
        { id: 'sixty', label: '60', value: '60' },
        { id: 'sixteen', label: '16', value: '16' },
        { id: 'fifty-four', label: '54', value: '54' }
      ]
    },
    qualityReview: {
      curriculum: 'Mewakilkan fakta darab 10 × 6 sebagai 10 baris dengan 6 objek pada setiap baris.',
      assessment: 'Distraktor 16 mengesan penambahan faktor, manakala 54 mengesan pengiraan yang tertinggal satu baris.',
      textbook: 'Tatasusunan segi empat 10 baris × 6 lajur mengekalkan struktur fakta darab asal tanpa memaparkan hasil.'
    },
    intelligence: {
      skillId: 'darab.tatasusunan_10_baris_6_lajur', responseMode: 'visual_array',
      conceptTags: ['darab', 'tatasusunan', 'baris_dan_lajur', 'fakta_darab'],
      misconceptionTags: ['menambah_faktor', 'kurang_satu_baris'],
      hintSteps: ['Perhatikan bahawa tatasusunan mempunyai 10 baris.', 'Setiap baris mempunyai 6 objek.', 'Kira semua objek mengikut susunan baris dan lajur sebelum memilih jawapan.']
    }
  },
  'MATH-DARAB-PILOT-005': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan tatasusunan baris dan lajur. Kira jumlah objek dan pilih jawapan yang betul.',
      visual: { kind: 'array', mode: 'multiplication', rows: 4, columns: 6 },
      options: [
        { id: 'twenty-four', label: '24', value: '24' },
        { id: 'ten', label: '10', value: '10' },
        { id: 'eighteen', label: '18', value: '18' }
      ]
    },
    qualityReview: {
      curriculum: 'Mewakilkan fakta darab 4 × 6 sebagai 4 baris dengan 6 objek pada setiap baris.',
      assessment: 'Distraktor 10 mengesan penambahan faktor, manakala 18 mengesan pengiraan yang tertinggal satu baris.',
      textbook: 'Tatasusunan segi empat 4 baris × 6 lajur mengekalkan struktur fakta darab asal tanpa memaparkan hasil.'
    },
    intelligence: {
      skillId: 'darab.tatasusunan_4_baris_6_lajur', responseMode: 'visual_array',
      conceptTags: ['darab', 'tatasusunan', 'baris_dan_lajur', 'fakta_darab'],
      misconceptionTags: ['menambah_faktor', 'kurang_satu_baris'],
      hintSteps: ['Perhatikan bahawa tatasusunan mempunyai 4 baris.', 'Setiap baris mempunyai 6 objek.', 'Kira semua objek mengikut susunan baris dan lajur sebelum memilih jawapan.']
    }
  }
});

const REVIEWED_NUMBER_LINE_PILOT_SPECS = Object.freeze({
  'MATH-DARAB-PILOT-009': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Ikuti 8 lompatan lima-lima pada garis nombor. Tentukan titik akhir dan pilih hasil darab yang betul.',
      visual: { kind: 'numberLine', mode: 'repeatedJumps', jumps: 8, step: 5 },
      options: [
        { id: 'forty', label: '40', value: '40' },
        { id: 'thirteen', label: '13', value: '13' },
        { id: 'thirty-five', label: '35', value: '35' }
      ]
    },
    qualityReview: {
      curriculum: 'Mentafsir pendaraban sebagai lapan lompatan sama besar sambil mengukuhkan kiraan lima-lima dan tambah berulang Tahun 2.',
      assessment: 'Garis nombor menilai sama ada murid mengikuti semua lompatan; distraktor mengesan penambahan operan dan berhenti satu lompatan terlalu awal.',
      textbook: 'Lompatan sama besar menghubungkan kiraan lima-lima dengan ungkapan darab asal tanpa menulis titik akhir sebagai jawapan.'
    },
    intelligence: {
      skillId: 'darab.lompatan_lima_5_darab_8', responseMode: 'visual_number_line',
      conceptTags: ['darab', 'garis_nombor', 'kira_lima_lima', 'tambah_berulang'],
      misconceptionTags: ['menambah_operan', 'berhenti_satu_lompatan_awal'],
      hintSteps: ['Mulakan pada 0 dan perhatikan saiz setiap lompatan.', 'Setiap lompatan bergerak 5 nilai ke hadapan.', 'Ikuti semua 8 lompatan dan tentukan titik akhirnya.']
    }
  },
  'MATH-DARAB-PILOT-020': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan lompatan lima-lima dari 0 hingga 35. Kira bilangan lompatan untuk melengkapkan ayat darab.',
      visual: { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5 },
      options: [
        { id: 'seven', label: '7', value: '7' },
        { id: 'five', label: '5', value: '5' },
        { id: 'six', label: '6', value: '6' }
      ]
    },
    qualityReview: {
      curriculum: 'Menentukan faktor yang hilang melalui bilangan lompatan lima-lima yang diperlukan untuk mencapai nilai diberi.',
      assessment: 'Pilihan membezakan bilangan lompatan daripada saiz lompatan dan mengesan murid yang berhenti satu lompatan sebelum titik akhir.',
      textbook: 'Kiraan lompatan dari sifar ke nilai diberi menjembatani kiraan lompat dengan ayat darab faktor hilang asal.'
    },
    intelligence: {
      skillId: 'darab.faktor_hilang_lompatan_lima', responseMode: 'visual_count_jumps',
      conceptTags: ['darab', 'faktor_hilang', 'garis_nombor', 'kira_lima_lima'],
      misconceptionTags: ['memilih_saiz_lompatan', 'kurang_satu_lompatan'],
      hintSteps: ['Nilai setiap lompatan ialah 5.', 'Jejak lompatan dari 0 sehingga 35.', 'Kira berapa lompatan diperlukan untuk sampai ke 35.']
    }
  },
  'MATH-DARAB-PILOT-025': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Ikuti 10 lompatan sepuluh-sepuluh pada garis nombor. Tentukan titik akhir.',
      visual: { kind: 'numberLine', mode: 'repeatedJumps', jumps: 10, step: 10 },
      options: [
        { id: 'one-hundred', label: '100', value: '100' },
        { id: 'twenty', label: '20', value: '20' },
        { id: 'ninety', label: '90', value: '90' }
      ]
    },
    qualityReview: {
      curriculum: 'Menggunakan sepuluh lompatan bernilai sepuluh untuk memahami fakta darab sepuluh dan kiraan sepuluh-sepuluh Tahun 2.',
      assessment: 'Distraktor mengesan penambahan dua operan dan penghentian satu lompatan awal ketika menentukan titik akhir.',
      textbook: 'Garis nombor menghubungkan tambah berulang sepuluh-sepuluh dengan fakta darab simbolik tanpa memaparkan hasil terbitan.'
    },
    intelligence: {
      skillId: 'darab.sepuluh_lompatan_sepuluh', responseMode: 'visual_number_line',
      conceptTags: ['darab', 'garis_nombor', 'kira_sepuluh_sepuluh', 'fakta_darab_10'],
      misconceptionTags: ['menambah_operan', 'berhenti_satu_lompatan_awal'],
      hintSteps: ['Mulakan pada 0.', 'Setiap lompatan bergerak 10 nilai.', 'Ikuti kesemua 10 lompatan dan tentukan titik akhir.']
    }
  },
  'MATH-DARAB-PILOT-032': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan lompatan empat-empat dari 0 hingga 32. Kira bilangan lompatan untuk mencari faktor yang hilang.',
      visual: { kind: 'numberLine', mode: 'countJumps', end: 32, step: 4 },
      options: [
        { id: 'eight', label: '8', value: '8' },
        { id: 'four', label: '4', value: '4' },
        { id: 'seven', label: '7', value: '7' }
      ]
    },
    qualityReview: {
      curriculum: 'Mencari faktor pertama yang hilang dengan mengira bilangan kumpulan empat pada garis nombor.',
      assessment: 'Pilihan mendiagnosis kekeliruan antara saiz lompatan dengan bilangan lompatan serta kesilapan kurang satu lompatan.',
      textbook: 'Lompatan empat-empat dari sifar mengekalkan ayat darab asal sambil memberikan perwakilan konkrit faktor yang belum diketahui.'
    },
    intelligence: {
      skillId: 'darab.faktor_pertama_hilang_lompatan_empat', responseMode: 'visual_count_jumps',
      conceptTags: ['darab', 'faktor_hilang', 'garis_nombor', 'kira_empat_empat'],
      misconceptionTags: ['memilih_saiz_lompatan', 'kurang_satu_lompatan'],
      hintSteps: ['Setiap lompatan bernilai 4.', 'Ikuti garis nombor dari 0 hingga 32.', 'Kira jumlah lompatan untuk mendapatkan faktor yang hilang.']
    }
  },
  'MATH-DARAB-PILOT-033': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan lompatan enam-enam dari 0 hingga 54. Kira bilangan lompatan untuk mencari faktor yang hilang.',
      visual: { kind: 'numberLine', mode: 'countJumps', end: 54, step: 6 },
      options: [
        { id: 'nine', label: '9', value: '9' },
        { id: 'six', label: '6', value: '6' },
        { id: 'eight', label: '8', value: '8' }
      ]
    },
    qualityReview: {
      curriculum: 'Menentukan faktor kedua yang hilang melalui kiraan bilangan lompatan enam-enam hingga nilai sasaran.',
      assessment: 'Distraktor membezakan faktor hilang daripada saiz lompatan dan mengesan kiraan yang berhenti satu lompatan awal.',
      textbook: 'Model garis nombor menyambungkan kiraan enam-enam kepada ayat darab faktor hilang tanpa mengubah konstruk simbolik asal.'
    },
    intelligence: {
      skillId: 'darab.faktor_kedua_hilang_lompatan_enam', responseMode: 'visual_count_jumps',
      conceptTags: ['darab', 'faktor_hilang', 'garis_nombor', 'kira_enam_enam'],
      misconceptionTags: ['memilih_saiz_lompatan', 'kurang_satu_lompatan'],
      hintSteps: ['Setiap lompatan bernilai 6.', 'Ikuti lompatan sehingga sampai ke 54.', 'Kira jumlah lompatan untuk mendapatkan faktor yang hilang.']
    }
  },
  'MATH-BAHAGI-PILOT-008': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan lompatan sepuluh-sepuluh dari 0 hingga 40. Kira berapa lompatan diperlukan.',
      visual: { kind: 'numberLine', mode: 'countJumps', end: 40, step: 10 },
      options: [
        { id: 'four', label: '4', value: '4' },
        { id: 'ten', label: '10', value: '10' },
        { id: 'thirty', label: '30', value: '30' }
      ]
    },
    qualityReview: {
      curriculum: 'Mentafsir bahagi sebagai pengumpulan dengan mengira bilangan lompatan bersaiz sepuluh dalam jumlah diberi.',
      assessment: 'Pilihan mengesan murid yang memilih pembahagi sebagai jawapan atau menolak pembahagi sekali sahaja dan bukannya mengumpul berulang.',
      textbook: 'Lompatan sepuluh-sepuluh menghubungkan pengumpulan berulang dengan ayat bahagi asal tanpa menyatakan hasil bahagi.'
    },
    intelligence: {
      skillId: 'bahagi.pengumpulan_40_dengan_10_garis_nombor', responseMode: 'visual_count_jumps',
      conceptTags: ['bahagi', 'pengumpulan', 'garis_nombor', 'kira_sepuluh_sepuluh'],
      misconceptionTags: ['memilih_pembahagi', 'menolak_sekali'],
      hintSteps: ['Setiap lompatan mewakili 10.', 'Jejak dari 0 sehingga 40.', 'Kira bilangan lompatan yang digunakan.']
    }
  },
  'MATH-BAHAGI-PILOT-025': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan lompatan lapan-lapan dari 0 hingga 72. Kira bilangan lompatan untuk mendapatkan hasil bahagi.',
      visual: { kind: 'numberLine', mode: 'countJumps', end: 72, step: 8 },
      options: [
        { id: 'nine', label: '9', value: '9' },
        { id: 'eight', label: '8', value: '8' },
        { id: 'ten', label: '10', value: '10' }
      ]
    },
    qualityReview: {
      curriculum: 'Menentukan hasil bahagi sebagai bilangan kumpulan lapan yang terkandung dalam jumlah diberi menggunakan garis nombor.',
      assessment: 'Distraktor membezakan hasil bahagi daripada pembahagi dan mengesan kiraan yang terlebih satu lompatan.',
      textbook: 'Kiraan lompatan lapan-lapan memodelkan pengumpulan bahagi sambil mengekalkan ayat simbolik dan jawapan asal.'
    },
    intelligence: {
      skillId: 'bahagi.pengumpulan_72_dengan_8_garis_nombor', responseMode: 'visual_count_jumps',
      conceptTags: ['bahagi', 'pengumpulan', 'garis_nombor', 'kira_lapan_lapan'],
      misconceptionTags: ['memilih_pembahagi', 'terlebih_satu_lompatan'],
      hintSteps: ['Setiap lompatan mewakili 8.', 'Jejak lompatan dari 0 hingga 72.', 'Kira semua lompatan untuk menentukan hasil bahagi.']
    }
  }
});

const REVIEWED_EQUAL_GROUPS_PILOT_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_EQUAL_GROUPS_PILOT_SPECS).map(([id, spec]) => [id, {
    interaction: spec.interaction,
    qualityReview: spec.qualityReview
  }])
);

const REVIEWED_ARRAY_PILOT_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_ARRAY_PILOT_SPECS).map(([id, spec]) => [id, {
    interaction: spec.interaction,
    qualityReview: spec.qualityReview
  }])
);

const REVIEWED_NUMBER_LINE_PILOT_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_NUMBER_LINE_PILOT_SPECS).map(([id, spec]) => [id, {
    interaction: spec.interaction,
    qualityReview: spec.qualityReview
  }])
);

const REVIEWED_CONTENT_BATCH_1_EXAMPLES = Object.fromEntries(
  Object.entries(REVIEWED_CONTENT_BATCH_1_SPECS).map(([id, spec]) => [id, {
    interaction: spec.interaction,
    qualityReview: spec.qualityReview
  }])
);

const INTERACTIVE_QUESTION_EXAMPLES = Object.freeze({
  ...REVIEWED_CHOICE_EXAMPLES,
  ...REVIEWED_FILL_BLANK_EXAMPLES,
  ...REVIEWED_RICH_EXAMPLES,
  ...REVIEWED_Q4_EXAMPLES,
  ...REVIEWED_CONTENT_BATCH_1_EXAMPLES,
  ...REVIEWED_CONTENT_BATCH_2_EXAMPLES,
  ...REVIEWED_EQUAL_GROUPS_PILOT_EXAMPLES,
  ...REVIEWED_ARRAY_PILOT_EXAMPLES,
  ...REVIEWED_NUMBER_LINE_PILOT_EXAMPLES,
  'BM-KATA_NAMA_AM-001': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Tekan gambar benda yang disebut dalam ayat.',
      options: [
        { id: 'book', label: 'buku', value: 'buku', visual: { kind: 'object', symbol: '📖', label: 'Buku' } },
        { id: 'student', label: 'Siti', value: 'Siti', visual: { kind: 'object', symbol: '👧', label: 'Murid bernama Siti' } },
        { id: 'living-room', label: 'ruang tamu', value: 'ruang tamu', visual: { kind: 'object', symbol: '🏠', label: 'Ruang tamu' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti kata nama am bagi benda dalam ayat mudah Tahun 2.',
      assessment: 'Satu benda, seorang manusia dan satu tempat membezakan kategori kata nama tanpa jawapan bertindih.',
      textbook: 'Simbol visual disertai label teks supaya hubungan benda dan perkataan kekal jelas serta aksesibel.'
    }
  },
  'MATH-BENTUK-PILOT-001': {
    interaction: {
      version: 1,
      type: 'imageChoice',
      instruction: 'Pilih kad yang menunjukkan bilangan sisi lurus pada segi tiga.',
      options: [
        { id: 'triangle', label: '3 sisi', value: '3', visual: { kind: 'shape', shape: 'triangle', label: 'Segi tiga' } },
        { id: 'square', label: '4 sisi', value: '4', visual: { kind: 'shape', shape: 'square', label: 'Segi empat sama' } },
        { id: 'circle', label: '0 sisi lurus', value: '0', visual: { kind: 'shape', shape: 'circle', label: 'Bulatan' } }
      ]
    },
    qualityReview: {
      curriculum: 'Mengenal pasti ciri bentuk 2D melalui bilangan sisi lurus.',
      assessment: 'Satu rangsangan visual, satu jawapan tepat dan distraktor berdasarkan salah faham lazim.',
      textbook: 'Visual bentuk menyokong hubungan antara istilah segi tiga dengan tiga sisi lurus.'
    }
  },
  'MATH-BENTUK-PILOT-021': {
    interaction: {
      version: 1,
      type: 'dragDrop',
      instruction: 'Seret atau ketik setiap bentuk, kemudian pilih kumpulan yang betul.',
      items: [
        { id: 'circle', label: 'Bulatan', visual: { kind: 'shape', shape: 'circle', label: 'Bulatan' } },
        { id: 'cube', label: 'Kubus', visual: { kind: 'shape', shape: 'cube', label: 'Kubus' } },
        { id: 'triangle', label: 'Segi tiga', visual: { kind: 'shape', shape: 'triangle', label: 'Segi tiga' } },
        { id: 'cylinder', label: 'Silinder', visual: { kind: 'shape', shape: 'cylinder', label: 'Silinder' } }
      ],
      zones: [
        { id: '2d', label: 'Bentuk 2D', responseLabel: '2D', acceptedItemIds: ['circle', 'triangle'] },
        { id: '3d', label: 'Objek 3D', responseLabel: '3D', acceptedItemIds: ['cube', 'cylinder'] }
      ]
    },
    qualityReview: {
      curriculum: 'Mengelaskan bentuk rata 2D dan objek ruang 3D berdasarkan cirinya.',
      assessment: 'Semua empat item mesti dikelaskan; tiada item atau zon yang bertindih makna.',
      textbook: 'Pengelasan menghubungkan nama bentuk dengan konsep rata dan ruang.'
    }
  },
  'MATH-BENTUK-PILOT-035': {
    interaction: {
      version: 1,
      type: 'matching',
      instruction: 'Pilih objek di sebelah kiri, kemudian pilih nama bentuk 3D yang sepadan.',
      items: [
        { id: 'ball', label: 'Bola', visual: { kind: 'object', symbol: '●', label: 'Bola' }, targetId: 'sphere' },
        { id: 'can', label: 'Tin', visual: { kind: 'shape', shape: 'cylinder', label: 'Tin minuman' }, targetId: 'cylinder' },
        { id: 'dice', label: 'Dadu', visual: { kind: 'shape', shape: 'cube', label: 'Dadu' }, targetId: 'cube' }
      ],
      targets: [
        { id: 'cube', label: 'Kubus' },
        { id: 'sphere', label: 'Sfera' },
        { id: 'cylinder', label: 'Silinder' }
      ]
    },
    qualityReview: {
      curriculum: 'Memadankan objek harian dengan nama objek 3D yang sepadan.',
      assessment: 'Setiap objek dan nama mempunyai hubungan satu dengan satu yang jelas.',
      textbook: 'Contoh konkrit bola, tin dan dadu mendahului istilah matematik abstrak.'
    }
  },
  'BM-BINA_AYAT-021': {
    interaction: {
      version: 1,
      type: 'ordering',
      instruction: 'Susun kad untuk membina ayat yang lengkap.',
      items: [
        { id: 'object', label: 'buku cerita' },
        { id: 'subject', label: 'Aina' },
        { id: 'verb', label: 'membaca' }
      ],
      correctOrder: ['subject', 'verb', 'object'],
      responseSuffix: '.'
    },
    qualityReview: {
      curriculum: 'Membina ayat penyata dengan susunan pelaku, perbuatan dan objek.',
      assessment: 'Tiga frasa menghasilkan satu susunan ayat gramatis yang tidak kabur.',
      textbook: 'Susunan kad memperlihatkan struktur ayat sebelum rumusan diberikan.'
    }
  },
  'MATH-NOMBOR-PILOT-024': {
    interaction: {
      version: 1,
      type: 'visualMath',
      instruction: 'Perhatikan model nilai tempat, kemudian pilih nombor yang dibina.',
      visual: {
        kind: 'placeValue',
        columns: [
          { id: 'hundreds', label: 'Ratus', value: 6, block: 'hundred' },
          { id: 'tens', label: 'Puluh', value: 3, block: 'ten' },
          { id: 'ones', label: 'Sa', value: 8, block: 'one' }
        ]
      },
      options: [
        { id: '638', label: '638', value: '638' },
        { id: '368', label: '368', value: '368' },
        { id: '630', label: '630', value: '630' },
        { id: '608', label: '608', value: '608' }
      ]
    },
    qualityReview: {
      curriculum: 'Mewakilkan nombor hingga 1,000 menggunakan nilai tempat ratus, puluh dan sa.',
      assessment: 'Distraktor mengesan pertukaran digit dan pengabaian nilai tempat.',
      textbook: 'Model nilai tempat diikuti simbol nombor dan penjelasan bentuk cerakin.'
    }
  },
  'BM-KATA_SENDI-001': {
    interaction: {
      version: 1,
      type: 'fillBlank',
      instruction: 'Pilih kata sendi nama yang melengkapkan ayat.',
      sentenceParts: ['Buku cerita itu disimpan ', ' rak buku.'],
      options: [
        { id: 'di', label: 'di', value: 'di' },
        { id: 'ke', label: 'ke', value: 'ke' },
        { id: 'dari', label: 'dari', value: 'dari' }
      ]
    },
    qualityReview: {
      curriculum: 'Menggunakan kata sendi nama “di” untuk menunjukkan tempat yang tetap.',
      assessment: 'Ayat mempunyai satu tempat kosong dan satu jawapan gramatis; distraktor mengesan kekeliruan tempat, arah dan asal.',
      textbook: 'Ayat lengkap dipaparkan semula selepas pilihan supaya murid melihat penggunaan kata sendi dalam konteks.'
    }
  },
  'MATH-NOMBOR-PILOT-049': {
    interaction: {
      version: 1,
      type: 'multiSelect',
      instruction: 'Pilih semua pernyataan yang benar. Lebih daripada satu jawapan diperlukan.',
      options: [
        { id: 'A', label: 'A. 572 > 527', value: 'A' },
        { id: 'B', label: 'B. 405 > 450', value: 'B' },
        { id: 'C', label: 'C. 699 < 700', value: 'C' }
      ],
      correctOptionIds: ['A', 'C'],
      responseJoiner: ' dan '
    },
    qualityReview: {
      curriculum: 'Membandingkan nombor hingga 1,000 berdasarkan nilai tempat ratus, puluh dan sa.',
      assessment: 'Arahan menyatakan semua jawapan perlu dipilih dan setiap pernyataan boleh dinilai secara bebas.',
      textbook: 'Pernyataan ringkas membolehkan murid membandingkan digit dari nilai tempat tertinggi secara sistematik.'
    }
  },
  'SAINS-TUMBUHAN-009': {
    interaction: {
      version: 1,
      type: 'hotspot',
      instruction: 'Tekan bahagian tumbuhan yang membuat makanan.',
      visual: { kind: 'plantDiagram', label: 'Rajah bahagian tumbuhan' },
      hotspots: [
        { id: 'flower', label: 'Bunga', value: 'bunga', x: 50, y: 15 },
        { id: 'leaf', label: 'Daun', value: 'daun', x: 70, y: 36 },
        { id: 'stem', label: 'Batang', value: 'batang', x: 50, y: 56 },
        { id: 'root', label: 'Akar', value: 'akar', x: 50, y: 84 }
      ],
      correctHotspotId: 'leaf'
    },
    qualityReview: {
      curriculum: 'Mengenal pasti daun sebagai bahagian tumbuhan yang membuat makanan.',
      assessment: 'Empat kawasan berlabel secara aksesibel mempunyai kedudukan tidak bertindih dan satu jawapan tepat.',
      textbook: 'Rajah keseluruhan tumbuhan menghubungkan kedudukan bahagian dengan fungsi daun.'
    }
  },
  'MATH-MASA-PILOT-008': {
    interaction: {
      version: 1,
      type: 'clock',
      instruction: 'Pilih muka jam yang menunjukkan pukul tiga setengah.',
      options: [
        { id: 'three-thirty', label: 'Jam A', value: '3:30', visual: { kind: 'clock', hour: 3, minute: 30, label: 'Jarum minit menunjuk 6 dan jarum jam berada antara 3 dengan 4' } },
        { id: 'six-fifteen', label: 'Jam B', value: '6:15', visual: { kind: 'clock', hour: 6, minute: 15, label: 'Jarum minit menunjuk 3 dan jarum jam melepasi 6' } },
        { id: 'three', label: 'Jam C', value: '3:00', visual: { kind: 'clock', hour: 3, minute: 0, label: 'Jarum minit menunjuk 12 dan jarum jam menunjuk 3' } }
      ]
    },
    qualityReview: {
      curriculum: 'Membaca waktu dalam jam dan setengah jam pada muka jam analog.',
      assessment: 'Distraktor membezakan jarum jam, jarum minit dan waktu tepat tanpa mengubah konteks soalan.',
      textbook: 'Muka jam analog dipadankan dengan notasi digital untuk membina hubungan dua perwakilan masa.'
    }
  },
  'MATH-WANG-PILOT-008': {
    interaction: {
      version: 1,
      type: 'money',
      instruction: 'Bina 250 sen. Tekan wang untuk menambahnya dan gunakan butang tolak jika perlu.',
      targetSen: 250,
      denominations: [
        { id: 'rm1', label: 'RM1', valueSen: 100, kind: 'note', color: 'blue', maxCount: 4 },
        { id: 'sen50', label: '50 sen', valueSen: 50, kind: 'coin', color: 'gold', maxCount: 5 },
        { id: 'sen20', label: '20 sen', valueSen: 20, kind: 'coin', color: 'silver', maxCount: 5 },
        { id: 'sen10', label: '10 sen', valueSen: 10, kind: 'coin', color: 'bronze', maxCount: 5 }
      ]
    },
    qualityReview: {
      curriculum: 'Mewakilkan 250 sen sebagai RM2.50 menggunakan gabungan denominasi wang Malaysia.',
      assessment: 'Jumlah dikira dalam unit sen bagi mengelakkan ralat perpuluhan dan lebih daripada satu gabungan sah diterima.',
      textbook: 'Model wang menghubungkan nilai syiling dan wang kertas dengan penukaran 100 sen kepada RM1.'
    }
  },
  'MATH-PANJANG-PILOT-018': {
    interaction: {
      version: 1,
      type: 'measurement',
      instruction: 'Baca kedua-dua tanda pada pembaris, kemudian pilih panjang batang.',
      visual: { kind: 'ruler', startCm: 3, endCm: 14, maxCm: 15, objectLabel: 'Batang' },
      options: [
        { id: '11', label: '11 cm', value: '11 cm' },
        { id: '14', label: '14 cm', value: '14 cm' },
        { id: '17', label: '17 cm', value: '17 cm' }
      ]
    },
    qualityReview: {
      curriculum: 'Mengukur panjang objek apabila bacaan mula bukan pada tanda sifar.',
      assessment: 'Distraktor mengesan murid yang terus membaca tanda akhir atau menambah dua bacaan.',
      textbook: 'Pembaris bernombor menunjukkan bahawa panjang ialah bacaan akhir ditolak bacaan mula.'
    }
  }
});

function reviewedLearningIntelligence({ skillId, responseMode, conceptTags, misconceptionTags, hintSteps }) {
  return Object.freeze({
    version: 1,
    skillId,
    responseMode,
    conceptTags,
    misconceptionTags,
    hintSteps,
    masteryEligible: true,
    weakTopicEligible: true,
    variantPolicy: {
      enabled: false,
      reviewStatus: 'review_required',
      mutableFields: [],
      lockedFields: ['answer', 'accepted', 'interaction']
    }
  });
}

const REVIEWED_Q4_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_Q4_SPECS).map(([id, spec]) => [id, reviewedLearningIntelligence(spec.intelligence)])
);

const REVIEWED_CONTENT_BATCH_1_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_CONTENT_BATCH_1_SPECS).map(([id, spec]) => [id, reviewedLearningIntelligence(spec.intelligence)])
);

const REVIEWED_CONTENT_BATCH_2_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_CONTENT_BATCH_2_SPECS).map(([id, spec]) => [id, reviewedLearningIntelligence(spec.intelligence)])
);

const REVIEWED_EQUAL_GROUPS_PILOT_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_EQUAL_GROUPS_PILOT_SPECS).map(([id, spec]) => [id, reviewedLearningIntelligence(spec.intelligence)])
);

const REVIEWED_ARRAY_PILOT_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_ARRAY_PILOT_SPECS).map(([id, spec]) => [id, reviewedLearningIntelligence(spec.intelligence)])
);

const REVIEWED_NUMBER_LINE_PILOT_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_NUMBER_LINE_PILOT_SPECS).map(([id, spec]) => [id, reviewedLearningIntelligence(spec.intelligence)])
);

const REVIEWED_FILL_BLANK_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_FILL_BLANK_BATCH_1).map(([id, spec]) => {
    const domain = REVIEWED_FILL_BLANK_DOMAINS[spec.domain];
    return [id, reviewedLearningIntelligence({
      skillId: domain.skillId,
      responseMode: 'completion',
      conceptTags: domain.conceptTags,
      misconceptionTags: domain.misconceptionTags,
      hintSteps: domain.hintSteps
    })];
  })
);

const REVIEWED_CHOICE_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_CHOICE_BATCHES).map(([id, spec]) => {
    const domain = REVIEWED_CHOICE_DOMAINS[spec.domain];
    return [id, reviewedLearningIntelligence({
      skillId: spec.skillId || domain.skillId,
      responseMode: domain.responseMode,
      conceptTags: spec.concept ? [...domain.conceptTags, spec.concept] : domain.conceptTags,
      misconceptionTags: domain.misconceptionTags,
      hintSteps: domain.hintSteps
    })];
  })
);

const REVIEWED_RICH_INTELLIGENCE = Object.fromEntries(
  Object.entries(REVIEWED_RICH_BATCH_4).map(([id, spec]) => {
    const domain = REVIEWED_RICH_DOMAINS[spec.domain];
    return [id, reviewedLearningIntelligence({
      skillId: spec.skillId || domain.skillId,
      responseMode: domain.responseMode,
      conceptTags: spec.concept ? [...domain.conceptTags, spec.concept] : domain.conceptTags,
      misconceptionTags: domain.misconceptionTags,
      hintSteps: domain.hintSteps
    })];
  })
);

const INTERACTIVE_QUESTION_INTELLIGENCE = Object.freeze({
  ...REVIEWED_CHOICE_INTELLIGENCE,
  ...REVIEWED_FILL_BLANK_INTELLIGENCE,
  ...REVIEWED_RICH_INTELLIGENCE,
  ...REVIEWED_Q4_INTELLIGENCE,
  ...REVIEWED_CONTENT_BATCH_1_INTELLIGENCE,
  ...REVIEWED_CONTENT_BATCH_2_INTELLIGENCE,
  ...REVIEWED_EQUAL_GROUPS_PILOT_INTELLIGENCE,
  ...REVIEWED_ARRAY_PILOT_INTELLIGENCE,
  ...REVIEWED_NUMBER_LINE_PILOT_INTELLIGENCE,
  'BM-KATA_NAMA_AM-001': reviewedLearningIntelligence({
    skillId: 'kata_nama_am.mengenal_benda',
    responseMode: 'visual_selection',
    conceptTags: ['kata_nama_am', 'benda', 'pengelasan_perkataan'],
    misconceptionTags: ['keliru_benda_dengan_orang', 'keliru_benda_dengan_tempat'],
    hintSteps: [
      'Cari perkataan yang menamakan sesuatu yang boleh dibaca atau dipegang.',
      'Bezakan nama benda daripada nama orang dan nama tempat.',
      'Tekan gambar benda yang dibaca oleh Siti.'
    ]
  }),
  'MATH-BENTUK-PILOT-001': reviewedLearningIntelligence({
    skillId: 'bentuk.sisi_segi_tiga',
    responseMode: 'visual_selection',
    conceptTags: ['bentuk_2d', 'bilangan_sisi'],
    misconceptionTags: ['keliru_sisi_dan_bucu', 'menganggap_garis_lengkung_sebagai_sisi'],
    hintSteps: [
      'Jejaki sempadan bentuk itu dengan mata.',
      'Kira hanya garisan lurus yang membentuk sempadannya.',
      'Sentuh setiap garisan lurus sekali supaya tiada yang dikira dua kali.'
    ]
  }),
  'MATH-BENTUK-PILOT-021': reviewedLearningIntelligence({
    skillId: 'bentuk.mengelaskan_2d_3d',
    responseMode: 'classification',
    conceptTags: ['bentuk_2d', 'objek_3d', 'pengelasan'],
    misconceptionTags: ['keliru_bentuk_dan_objek', 'mengelas_berdasarkan_nama_sahaja'],
    hintSteps: [
      'Perhatikan sama ada bentuk itu rata atau mempunyai ruang.',
      'Bentuk rata masuk satu kumpulan; objek yang mempunyai isi masuk kumpulan satu lagi.',
      'Semak semua kad supaya setiap satu berada dalam satu kumpulan sahaja.'
    ]
  }),
  'MATH-BENTUK-PILOT-035': reviewedLearningIntelligence({
    skillId: 'bentuk.memadankan_objek_3d',
    responseMode: 'pairing',
    conceptTags: ['objek_3d', 'objek_harian', 'padanan'],
    misconceptionTags: ['keliru_nama_objek_3d', 'padanan_berdasarkan_saiz'],
    hintSteps: [
      'Perhatikan permukaan dan rupa setiap objek harian.',
      'Bandingkan sama ada objek boleh bergolek, bertapak rata atau mempunyai muka sama besar.',
      'Padankan satu objek pada satu nama, kemudian semak supaya nama tidak digunakan dua kali.'
    ]
  }),
  'BM-BINA_AYAT-021': reviewedLearningIntelligence({
    skillId: 'bina_ayat.susunan_pelaku_perbuatan_objek',
    responseMode: 'sequencing',
    conceptTags: ['ayat_penyata', 'susunan_ayat', 'pelaku_perbuatan_objek'],
    misconceptionTags: ['susunan_frasa_tidak_gramatis', 'objek_mendahului_perbuatan'],
    hintSteps: [
      'Cari dahulu frasa yang menunjukkan siapa.',
      'Selepas pelaku, letakkan perbuatan yang dilakukan.',
      'Akhiri ayat dengan perkara yang menerima perbuatan itu.'
    ]
  }),
  'MATH-NOMBOR-PILOT-024': reviewedLearningIntelligence({
    skillId: 'nombor.perwakilan_nilai_tempat',
    responseMode: 'visual_reasoning',
    conceptTags: ['nilai_tempat', 'ratus_puluh_sa', 'perwakilan_nombor'],
    misconceptionTags: ['digit_tertukar', 'nilai_tempat_diabaikan'],
    hintSteps: [
      'Baca lajur daripada nilai tempat paling besar.',
      'Tentukan digit bagi ratus, puluh dan sa mengikut turutan.',
      'Cantumkan ketiga-tiga digit tanpa menukar kedudukannya.'
    ]
  }),
  'BM-KATA_SENDI-001': reviewedLearningIntelligence({
    skillId: 'kata_sendi.lokasi_tetap',
    responseMode: 'completion',
    conceptTags: ['kata_sendi_nama', 'tempat_tetap'],
    misconceptionTags: ['keliru_tempat_dan_arah', 'keliru_tempat_dan_asal'],
    hintSteps: [
      'Kenal pasti hubungan antara buku dengan rak.',
      'Ayat ini menunjukkan lokasi tetap, bukan arah pergerakan.',
      'Pilih kata sendi untuk tempat yang tidak melibatkan pergerakan atau asal.'
    ]
  }),
  'MATH-NOMBOR-PILOT-049': reviewedLearningIntelligence({
    skillId: 'nombor.menilai_pernyataan_perbandingan',
    responseMode: 'multiple_selection',
    conceptTags: ['banding_nombor', 'nilai_tempat', 'pelbagai_jawapan'],
    misconceptionTags: ['memilih_satu_sahaja', 'membanding_digit_dari_kanan'],
    hintSteps: [
      'Nilai setiap pernyataan secara berasingan.',
      'Bandingkan digit bermula pada nilai tempat paling besar.',
      'Semak semua pernyataan sebelum menghantar kerana lebih daripada satu mungkin benar.'
    ]
  }),
  'SAINS-TUMBUHAN-009': reviewedLearningIntelligence({
    skillId: 'tumbuhan.bahagian_membuat_makanan',
    responseMode: 'spatial_selection',
    conceptTags: ['bahagian_tumbuhan', 'fungsi_bahagian', 'membuat_makanan'],
    misconceptionTags: ['keliru_fungsi_akar', 'keliru_fungsi_batang'],
    hintSteps: [
      'Fikirkan bahagian yang paling banyak menerima cahaya.',
      'Bahagian ini biasanya lebar dan berwarna hijau.',
      'Tekan bahagian yang menggunakan cahaya untuk membantu tumbuhan menghasilkan makanan.'
    ]
  }),
  'MATH-MASA-PILOT-008': reviewedLearningIntelligence({
    skillId: 'masa.membaca_setengah_jam',
    responseMode: 'time_representation',
    conceptTags: ['jam_analog', 'setengah_jam', 'jarum_jam_dan_minit'],
    misconceptionTags: ['jarum_jam_minit_tertukar', 'keliru_waktu_tepat_dan_setengah'],
    hintSteps: [
      'Perhatikan kedudukan jarum minit dahulu.',
      'Setengah jam ditunjukkan apabila jarum minit berada pada tanda enam.',
      'Kemudian semak jarum pendek berada antara nombor jam semasa dengan nombor berikutnya.'
    ]
  }),
  'MATH-WANG-PILOT-008': reviewedLearningIntelligence({
    skillId: 'wang.menukar_sen_kepada_ringgit',
    responseMode: 'value_construction',
    conceptTags: ['wang_malaysia', 'sen_dan_ringgit', 'gabungan_nilai'],
    misconceptionTags: ['keliru_seratus_sen', 'jumlah_denominasi_tidak_tepat'],
    hintSteps: [
      'Mulakan dengan nilai wang yang paling besar.',
      'Kumpulkan setiap seratus sen sebagai satu ringgit.',
      'Bina bahagian ringgit dahulu, kemudian lengkapkan baki sen.'
    ]
  }),
  'MATH-PANJANG-PILOT-018': reviewedLearningIntelligence({
    skillId: 'panjang.bacaan_pembaris_bukan_sifar',
    responseMode: 'visual_measurement',
    conceptTags: ['panjang', 'pembaris', 'bacaan_bukan_sifar'],
    misconceptionTags: ['mengambil_bacaan_akhir', 'menambah_bacaan_mula_dan_akhir'],
    hintSteps: [
      'Kenal pasti tanda mula dan tanda akhir batang.',
      'Panjang ialah jarak antara dua tanda, bukan bacaan tanda akhir sahaja.',
      'Tolak bacaan mula daripada bacaan akhir dan nyatakan unitnya.'
    ]
  })
});

export function attachInteractiveQuestionExample(question = {}) {
  const example = INTERACTIVE_QUESTION_EXAMPLES[String(question.id || '')];
  const learningIntelligence = INTERACTIVE_QUESTION_INTELLIGENCE[String(question.id || '')];
  return example ? {
    ...question,
    ...example,
    ...(example.interaction?.prompt ? {
      q: example.interaction.prompt,
      question: example.interaction.prompt,
      presentationOriginalQuestion: question.q || question.question || question.stem || ''
    } : {}),
    learningIntelligence: {
      ...learningIntelligence,
      adaptiveSignals: {
        questionType: example.interaction.type,
        skillId: learningIntelligence.skillId
      }
    }
  } : question;
}

export function getInteractiveQuestionExamples() {
  return INTERACTIVE_QUESTION_EXAMPLES;
}

export function getInteractiveQuestionIntelligenceExamples() {
  return INTERACTIVE_QUESTION_INTELLIGENCE;
}

export function attachInteractiveQuestionExamplesToSubject(subject = {}) {
  return {
    ...subject,
    topics: (subject.topics || []).map(topic => ({
      ...topic,
      questions: (topic.questions || []).map(attachInteractiveQuestionExample)
    }))
  };
}

export default INTERACTIVE_QUESTION_EXAMPLES;
