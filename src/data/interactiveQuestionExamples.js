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
  Object.entries(REVIEWED_CHOICE_BATCH_2).map(([id, spec]) => [id, buildReviewedChoiceExample(spec)])
);

const INTERACTIVE_QUESTION_EXAMPLES = Object.freeze({
  ...REVIEWED_CHOICE_EXAMPLES,
  ...REVIEWED_FILL_BLANK_EXAMPLES,
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
        { id: 'three-thirty', label: '3:30', value: '3:30', visual: { kind: 'clock', hour: 3, minute: 30, label: 'Pukul tiga setengah' } },
        { id: 'six-fifteen', label: '6:15', value: '6:15', visual: { kind: 'clock', hour: 6, minute: 15, label: 'Pukul enam suku' } },
        { id: 'three', label: '3:00', value: '3:00', visual: { kind: 'clock', hour: 3, minute: 0, label: 'Pukul tiga tepat' } }
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
  Object.entries(REVIEWED_CHOICE_BATCH_2).map(([id, spec]) => {
    const domain = REVIEWED_CHOICE_DOMAINS[spec.domain];
    return [id, reviewedLearningIntelligence({
      skillId: domain.skillId,
      responseMode: domain.responseMode,
      conceptTags: domain.conceptTags,
      misconceptionTags: domain.misconceptionTags,
      hintSteps: domain.hintSteps
    })];
  })
);

const INTERACTIVE_QUESTION_INTELLIGENCE = Object.freeze({
  ...REVIEWED_CHOICE_INTELLIGENCE,
  ...REVIEWED_FILL_BLANK_INTELLIGENCE,
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
