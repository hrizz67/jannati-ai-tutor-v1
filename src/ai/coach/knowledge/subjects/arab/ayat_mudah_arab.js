import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const ayatMudahKnowledge = createKnowledgePack({
  subjectId: 'arab',
  topicId: 'ayat_mudah_arab',
  displayName: 'Ayat Mudah',
  learningObjectives: [
    'Mengenal ayat mudah Arab.',
    'Memahami susunan asas subjek dan kata kerja.',
    'Memadankan ayat ringkas dengan maksud Melayu.'
  ],
  teacherExplanation: [
    'Ayat Mudah Arab ialah ayat pendek yang membantu murid membaca dan memahami makna asas.',
    'Guru boleh tunjuk ayat, baca perlahan, kemudian padankan maksudnya dalam Bahasa Melayu.',
    'Murid perlu perhatikan perkataan penting dan baca dari kanan ke kiri.',
    'Latihan ini sesuai untuk murid Tahun 2 kerana ayatnya ringkas dan jelas.'
  ],
  simpleExplanation: 'Ayat Mudah Arab ialah ayat pendek yang dibaca dan dipadankan dengan makna yang betul.',
  explanations: [
    'Ayat Mudah Arab mengajar murid membaca ayat pendek dan memahami makna keseluruhannya.',
    'Guru boleh bantu murid mengenal perkataan penting seperti orang, benda dan tempat.',
    'Murid perlu membaca dari kanan ke kiri dan melihat maksud ayat dengan teliti.',
    'Latihan ini sesuai untuk Tahun 2 kerana ayatnya ringkas dan dekat dengan kehidupan harian.'
  ],
  examples: [
    'هٰذَا كِتَابٌ',
    'هٰذَا قَلَمٌ',
    'هٰذِهِ مَدْرَسَةٌ',
    'هٰذِهِ بِنْتٌ',
    'أَنَا أُحِبُّ الْبَيْتَ',
    'أُمِّي فِي الْمَطْبَخِ',
    'الطَّفْلُ يَلْعَبُ',
    'الْمَاءُ بَارِدٌ',
    'الطَّبِيبُ فِي الْمُسْتَشْفَى',
    'الشَّجَرَةُ خَضْرَاءُ'
  ],
  wordMeaning: [
    'هٰذَا كِتَابٌ — Ini buku.',
    'هٰذَا قَلَمٌ — Ini pen.',
    'هٰذِهِ مَدْرَسَةٌ — Ini sekolah.',
    'هٰذِهِ بِنْتٌ — Ini budak perempuan.',
    'أَنَا أُحِبُّ الْبَيْتَ — Saya suka rumah.',
    'أُمِّي فِي الْمَطْبَخِ — Ibu saya di dapur.',
    'الطَّفْلُ يَلْعَبُ — Kanak-kanak bermain.',
    'الْمَاءُ بَارِدٌ — Air itu sejuk.',
    'الطَّبِيبُ فِي الْمُسْتَشْفَى — Doktor berada di hospital.',
    'الشَّجَرَةُ خَضْرَاءُ — Pokok itu hijau.'
  ],
  exampleSentences: [
    'هٰذَا كِتَابٌ — Ini buku.',
    'هٰذَا قَلَمٌ — Ini pen.',
    'هٰذِهِ مَدْرَسَةٌ — Ini sekolah.',
    'أَنَا أُحِبُّ الْبَيْتَ — Saya suka rumah.',
    'الطَّفْلُ يَلْعَبُ — Kanak-kanak bermain.'
  ],
  extraExamples: [
    'أَبِي يَذْهَبُ إِلَى الْمَدْرَسَةِ',
    'الْقَلَمُ عَلَى الطَّاوِلَةِ',
    'الْكِتَابُ جَدِيدٌ',
    'السَّمَاءُ زَرْقَاءُ',
    'السَّمَكَةُ فِي الْمَاءِ',
    'الْحَدِيقَةُ جَمِيلَةٌ',
    'أَنَا أَقْرَأُ الْكِتَابَ',
    'الْوَلَدُ يَكْتُبُ الدَّرْسَ'
  ],
  tips: [
    'Baca ayat Arab dari kanan ke kiri dengan perlahan.',
    'Cari perkataan penting seperti benda, orang atau perbuatan.',
    'Padankan ayat dengan maksud Melayu yang paling sesuai.',
    'Gunakan gambar atau situasi untuk membantu faham ayat.',
    'Ulang ayat pendek beberapa kali supaya mudah ingat.'
  ],
  memoryTips: [
    'Ingat ayat mudah sebagai ayat pendek yang jelas maknanya.',
    'Baca satu perkataan demi satu perkataan.',
    'Kaitkan ayat dengan benda yang ada di rumah atau sekolah.',
    'Ulang sebutan sambil lihat maksud Melayu.',
    'Buat latihan sedikit tetapi kerap.'
  ],
  commonMistakes: [
    'Memilih maksud Melayu yang tidak sepadan dengan ayat Arab.',
    'Membaca ayat terlalu laju sehingga terlepas perkataan penting.',
    'Tertukar perkataan yang hampir sama bunyinya.',
    'Tidak melihat susunan ayat dari kanan ke kiri.',
    'Meneka jawapan tanpa memahami keseluruhan ayat.'
  ],
  encouragement: {
    correct: [
      'Bagus! Kamu memahami Ayat Mudah dengan baik.',
      'Syabas! Jawapan kamu betul.',
      'Hebat! Kamu membaca dengan teliti.',
      'Tahniah! Kamu semakin yakin.',
      'Cemerlang! Pilihan kamu tepat.',
      'Mantap! Teruskan usaha ini.',
      'Bagus sekali! Kamu berada pada jalan yang betul.',
      'Hebat benar! Kamu sangat teliti.',
      'Syabas, kamu menjawab dengan baik.',
      'Tahniah, kamu semakin mahir.'
    ],
    retry: [
      'Tak mengapa, cuba semak Ayat Mudah sekali lagi.',
      'Baca soalan dengan perlahan.',
      'Perhatikan petunjuk dengan teliti.',
      'Ambil masa dan cuba lagi.',
      'Semak jawapan sebelum memilih.',
      'Lihat maklumat dengan teliti.',
      'Cuba bandingkan pilihan yang ada.',
      'Fokus pada kata kunci soalan.',
      'Kamu hampir betul, jangan putus asa.',
      'Baca semula langkah satu demi satu.'
    ],
    excellent: [
      'Hebat! Kamu sangat mahir dengan Ayat Mudah.',
      'Cemerlang! Kamu memahami topik ini dengan yakin.',
      'Luar biasa! Penguasaan kamu sangat baik.',
      'Brilliant! Kamu menjawab dengan tepat.',
      'Mantap! Kamu boleh teruskan ke cabaran baharu.',
      'Syabas! Kamu membuat pilihan dengan sangat teliti.',
      'Bagus sekali! Kamu sangat yakin.',
      'Hebat benar! Teruskan kecemerlangan ini.',
      'Tahniah! Kamu sangat bersedia.',
      'Fantastic! Kamu telah melakukan yang terbaik.'
    ]
  },
  problemSolvingSteps: [
    'Baca ayat mudah dengan perlahan.',
    'Kenal pasti perkataan penting.',
    'Padankan ayat dengan maksud yang betul.',
    'Dengar sebutan sebelum memilih.',
    'Semak ayat sekali lagi sebelum jawab.'
  ],
  pronunciationGuide: [
    'Sebut ayat mudah dengan jelas.',
    'Ikut bunyi perkataan satu demi satu.',
    'Jangan baca terlalu laju.',
    'Latih sebutan dengan guru.',
    'Ulang ayat untuk lebih yakin.'
  ],
  readingSteps: [
    'Baca dari kanan ke kiri.',
    'Pecahkan ayat kepada perkataan kecil.',
    'Padankan setiap perkataan dengan makna.',
    'Ulang ayat secara perlahan.',
    'Semak keseluruhan maksud.'
  ],
  letterBreakdown: [
    'Kenal huruf pada setiap perkataan.',
    'Cari huruf bertitik dan tidak bertitik.',
    'Perhatikan bentuk huruf awal dan akhir.',
    'Bandingkan perkataan yang hampir sama.',
    'Gunakan bacaan berulang.'
  ],
  listeningTips: [
    'Dengar ayat dengan teliti.',
    'Cari perkataan yang paling dikenali.',
    'Ulang bunyi yang didengar.',
    'Minta guru membacanya sekali lagi.',
    'Fokus pada makna keseluruhan.'
  ],
  relatedTopics: [
    'huruf_hijaiyah',
    'mufradat',
    'hiwar',
    'kefahaman_arab'
  ],
  difficulty: 'easy',
  curriculum: {
    SK: 'Membaca dan memahami ayat mudah Arab.',
    SP: 'Murid dapat memadankan ayat pendek dengan maksud yang betul.'
  },
  keywords: [
    'ayat',
    'mudah',
    'Arab',
    'membaca',
    'maksud',
    'subjek',
    'kata kerja',
    'ringkas',
    'pendek',
    'padanan',
    'bacaan',
    'makna'
  ],
  questionPatterns: [
    'Apakah yang berkaitan dengan Ayat Mudah?',
    'Pilih jawapan yang betul.',
    'Yang manakah contoh ayat mudah?',
    'Cari padanan yang sesuai.',
    'Tentukan jawapan yang tepat.',
    'Padankan dengan topik ini.',
    'Apakah pilihan yang betul?',
    'Baca dan pilih jawapan.'
  ],
  wrongAnswerPatterns: [
    'Memilih jawapan yang tidak berkaitan.',
    'Meneka tanpa bukti.',
    'Tersalah padanan.',
    'Tidak memerhati kata kunci.',
    'Membaca soalan terlalu laju.',
    'Memilih pilihan yang hampir sama tetapi salah.'
  ],
  followUpQuestions: [
    'Bolehkah kamu jelaskan jawapan itu?',
    'Apakah kata kunci yang kamu nampak?',
    'Mengapa jawapan ini betul?',
    'Boleh kamu beri contoh lain?',
    'Adakah pilihan lain itu sesuai?',
    'Bagaimana kamu tahu jawapannya?',
    'Apa yang paling penting dalam soalan ini?',
    'Bolehkah kamu cuba semula dengan teliti?'
  ],
  pronunciationTips: [
    'Sebut هٰذَا كِتَابٌ dengan jelas.',
    'Dengar hēdhā kitābun dengan teliti.',
    'Ulang bunyi Arab secara perlahan.',
    'Latih sebutan bersama guru.',
    'Perhatikan huruf Arab yang betul.'
  ],
  letterRecognitionTips: [
    'Perhatikan bentuk huruf dalam ayat.',
    'Cari titik dan garis yang membezakan huruf.',
    'Bandingkan huruf yang hampir sama.',
    'Baca dari kanan ke kiri.',
    'Padankan bentuk dengan bunyi.'
  ],
  writingTips: [
    'Tulis ayat mudah dari kanan ke kiri.',
    'Ikut bentuk huruf dengan kemas.',
    'Perhatikan sambungan dan titik.',
    'Beri ruang yang cukup antara perkataan.',
    'Semak tulisan selepas menyalin.'
  ],
  vocabularyGroups: [
    'orang',
    'tempat',
    'benda',
    'perbuatan'
  ],
  translationHints: [
    'Baca ayat Arab dan fahami maksud keseluruhan sebelum memilih.',
    'Cari kata kunci seperti orang, benda atau tempat dalam ayat.',
    'Gunakan petunjuk gambar atau konteks yang diberi.',
    'Bandingkan pilihan jawapan dengan makna ayat yang sebenar.',
    'Pilih terjemahan yang paling tepat dan mudah difahami.'
  ],
  readingPractice: [
    'Baca contoh ayat satu demi satu.',
    'Padankan perkataan dengan maksud.',
    'Cari perkataan yang sama bentuk.',
    'Baca dari kanan ke kiri.',
    'Ulang dengan rakan atau guru.'
  ],
  listeningPractice: [
    'Dengar sebutan ayat mudah.',
    'Pilih ayat yang disebut dengan betul.',
    'Bezakan bunyi yang hampir sama.',
    'Dengar contoh guru dengan teliti.',
    'Ulang bunyi yang dipelajari.'
  ],
  speakingPractice: [
    'Sebut ayat mudah dengan jelas.',
    'Ulang bunyi perkataan secara perlahan.',
    'Latih sebutan bersama guru.',
    'Baca dengan suara yang sesuai.',
    'Padankan sebutan dengan tulisan.'
  ],
  writingPractice: [
    'Salin ayat mudah dengan kemas.',
    'Tulis dari kanan ke kiri.',
    'Perhatikan titik dan bentuk huruf.',
    'Semak ejaan selepas menulis.',
    'Latih tulisan secara berulang.'
  ],
  commonPronunciationMistakes: [
    'Membaca terlalu laju.',
    'Tertukar bunyi huruf yang hampir sama.',
    'Tidak membezakan huruf bertitik.',
    'Menyebut tanpa latihan yang cukup.',
    'Membaca dari arah yang salah.'
  ]
});

const sentenceCards = [
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'هٰذَا كِتَابٌ',
    rumiReference: 'Haaza kitaabun',
    meaningBM: 'Ini buku.',
    wordBreakdown: ['هٰذَا = ini', 'كِتَابٌ = buku'],
    pronunciationHint: 'Baca perlahan: haa-zaa kitaa-bun.',
    readingPractice: 'Baca dari kanan ke kiri dan sebut setiap perkataan dengan jelas.',
    speakingPractice: 'Sebut hādhā kitābun bersama guru.',
    commonMistake: 'Jangan tertukar كِتَابٌ dengan perkataan yang hampir sama.',
    memoryTip: 'كِتَابٌ ialah buku yang boleh dibaca.',
    difficulty: 'easy'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'هٰذَا قَلَمٌ',
    rumiReference: 'Haaza qalamun',
    meaningBM: 'Ini pensel.',
    wordBreakdown: ['هٰذَا = ini', 'قَلَمٌ = pensel'],
    pronunciationHint: 'Baca perlahan: haa-zaa qalamun.',
    readingPractice: 'Perhatikan bunyi قَلَمٌ dan baca dengan jelas.',
    speakingPractice: 'Sebut haaza qalamun sambil menuding pada perkataan.',
    commonMistake: 'Jangan tertukar قَلَمٌ dengan كِتَابٌ.',
    memoryTip: 'قَلَمٌ digunakan untuk menulis.',
    difficulty: 'easy'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'هٰذِهِ مَدْرَسَةٌ',
    rumiReference: 'Haazihi madrasatun',
    meaningBM: 'Ini sekolah.',
    wordBreakdown: ['هٰذِهِ = ini', 'مَدْرَسَةٌ = sekolah'],
    pronunciationHint: 'Baca perlahan: haa-zi-hi mad-ra-sa-tun.',
    readingPractice: 'Baca dari kanan ke kiri dan ulang kata mَدْرَسَةٌ.',
    speakingPractice: 'Sebut haazihi madrasatun dengan suara yang jelas.',
    commonMistake: 'Jangan tertukar مَدْرَسَةٌ dengan بَيْتٌ.',
    memoryTip: 'مَدْرَسَةٌ ialah tempat belajar.',
    difficulty: 'easy'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'هٰذِهِ بِنْتٌ',
    rumiReference: 'Haazihi bintun',
    meaningBM: 'Ini budak perempuan.',
    wordBreakdown: ['هٰذِهِ = ini', 'بِنْتٌ = budak perempuan'],
    pronunciationHint: 'Baca perlahan: haa-zi-hi bintun.',
    readingPractice: 'Ulang bacaan dan kenal pasti perkataan بِنْتٌ.',
    speakingPractice: 'Sebut haazihi bintun dengan betul.',
    commonMistake: 'Jangan tertukar بِنْتٌ dengan وَلَدٌ.',
    memoryTip: 'بِنْتٌ merujuk kepada budak perempuan.',
    difficulty: 'easy'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'أَنَا أُحِبُّ الْبَيْتَ',
    rumiReference: 'Ana uhibbul-bayta',
    meaningBM: 'Saya suka rumah.',
    wordBreakdown: ['أَنَا = saya', 'أُحِبُّ = suka', 'الْبَيْتَ = rumah'],
    pronunciationHint: 'Baca perlahan: ana uhibbul-bayta.',
    readingPractice: 'Cari perkataan أَنَا, أُحِبُّ dan الْبَيْتَ.',
    speakingPractice: 'Sebut ayat dengan jelas sambil ikut guru.',
    commonMistake: 'Jangan tertukar الْبَيْتَ dengan sekolah.',
    memoryTip: 'أَنَا bermaksud saya.',
    difficulty: 'medium'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'أُمِّي فِي الْمَطْبَخِ',
    rumiReference: 'Ummii fil-matbakh',
    meaningBM: 'Ibu saya di dapur.',
    wordBreakdown: ['أُمِّي = ibu saya', 'فِي = di', 'الْمَطْبَخِ = dapur'],
    pronunciationHint: 'Baca perlahan: um-mee fil-mat-bakh.',
    readingPractice: 'Perhatikan perkataan فِي dan lokasi dalam ayat.',
    speakingPractice: 'Sebut ummi fil-matbakh dengan jelas.',
    commonMistake: 'Jangan tertukar الْمَطْبَخِ dengan rumah.',
    memoryTip: 'فِي bermaksud di.',
    difficulty: 'medium'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'الطَّفْلُ يَلْعَبُ',
    rumiReference: 'At-tiflu yal‘abu',
    meaningBM: 'Kanak-kanak itu bermain.',
    wordBreakdown: ['الطَّفْلُ = kanak-kanak itu', 'يَلْعَبُ = bermain'],
    pronunciationHint: 'Baca perlahan: at-tiflu yal-‘abu.',
    readingPractice: 'Cari perkataan yang menunjukkan perbuatan.',
    speakingPractice: 'Sebut ayat dengan ritma yang perlahan.',
    commonMistake: 'Jangan tertukar يَلْعَبُ dengan membaca.',
    memoryTip: 'يَلْعَبُ bermaksud bermain.',
    difficulty: 'medium'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'الْمَاءُ بَارِدٌ',
    rumiReference: 'Al-maa’u baaridun',
    meaningBM: 'Air itu sejuk.',
    wordBreakdown: ['الْمَاءُ = air', 'بَارِدٌ = sejuk'],
    pronunciationHint: 'Baca perlahan: al-maa’u baaridun.',
    readingPractice: 'Padankan perkataan بَارِدٌ dengan maksudnya.',
    speakingPractice: 'Sebut ayat dengan jelas dan tenang.',
    commonMistake: 'Jangan tertukar بَارِدٌ dengan panas.',
    memoryTip: 'بَارِدٌ bermaksud sejuk.',
    difficulty: 'medium'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'الطَّبِيبُ فِي الْمُسْتَشْفَى',
    rumiReference: 'At-tabiibu fil-mustashfaa',
    meaningBM: 'Doktor itu di hospital.',
    wordBreakdown: ['الطَّبِيبُ = doktor', 'فِي = di', 'الْمُسْتَشْفَى = hospital'],
    pronunciationHint: 'Baca perlahan: at-tabiibu fil-mustashfaa.',
    readingPractice: 'Cari perkataan tempat dalam ayat.',
    speakingPractice: 'Sebut ayat dengan jelas bersama guru.',
    commonMistake: 'Jangan tertukar الْمُسْتَشْفَى dengan sekolah.',
    memoryTip: 'الْمُسْتَشْفَى ialah hospital.',
    difficulty: 'medium'
  },
  {
    question: 'Baca ayat berikut.',
    arabicSentence: 'الشَّجَرَةُ خَضْرَاءُ',
    rumiReference: 'Asy-syajaratu khadraa’u',
    meaningBM: 'Pokok itu hijau.',
    wordBreakdown: ['الشَّجَرَةُ = pokok', 'خَضْرَاءُ = hijau'],
    pronunciationHint: 'Baca perlahan: asy-syajaratu khadraa’u.',
    readingPractice: 'Kenal pasti warna dalam ayat.',
    speakingPractice: 'Sebut ayat dengan sebutan yang jelas.',
    commonMistake: 'Jangan tertukar خَضْرَاءُ dengan warna lain.',
    memoryTip: 'خَضْرَاءُ bermaksud hijau.',
    difficulty: 'medium'
  }
];

export default {
  ...ayatMudahKnowledge,
  sentenceCards
};
