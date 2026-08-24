import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const kefahamanKnowledge = createKnowledgePack({
  subjectId: 'arab',
  topicId: 'kefahaman_arab',
  displayName: 'Kefahaman Arab',
  learningObjectives: [
    'Memahami teks Arab mudah.',
    'Menjawab soalan berdasarkan bacaan ringkas.',
    'Mencari maklumat penting dalam petikan pendek.'
  ],
  teacherExplanation: [
    'Kefahaman Arab membantu murid membaca petikan pendek dan mencari maklumat yang betul.',
    'Guru boleh tunjuk petikan, kemudian bantu murid mencari kata kunci dalam ayat.',
    'Murid perlu membaca perlahan, faham makna, dan padankan jawapan dengan petikan.',
    'Latihan ini sesuai untuk murid Tahun 2 kerana ayatnya ringkas dan jelas.'
  ],
  simpleExplanation: 'Kefahaman Arab ialah membaca petikan ringkas dan memahami maksudnya.',
  explanations: [
    'Kefahaman Arab melatih murid membaca petikan pendek dan mencari maklumat penting.',
    'Guru boleh tunjuk kata kunci supaya murid tahu apa yang perlu dicari dalam teks.',
    'Murid perlu membaca perlahan dan memadankan jawapan dengan bukti dalam petikan.',
    'Latihan ini sesuai untuk Tahun 2 kerana petikannya ringkas dan jelas.'
  ],
  examples: [
    'النَّصُّ الصَّغِيرُ',
    'الْمَدْرَسَةُ',
    'الْبَيْتُ',
    'الْوَلَدُ',
    'الْبِنْتُ',
    'الْكِتَابُ',
    'الْقَلَمُ',
    'الْحَدِيقَةُ',
    'الطَّعَامُ',
    'الْمَاءُ'
  ],
  wordMeaning: [
    'النَّصُّ الصَّغِيرُ — petikan pendek',
    'الْمَدْرَسَةُ — sekolah',
    'الْبَيْتُ — rumah',
    'الْوَلَدُ — budak lelaki',
    'الْبِنْتُ — budak perempuan',
    'الْكِتَابُ — buku',
    'الْقَلَمُ — pen',
    'الْحَدِيقَةُ — taman',
    'الطَّعَامُ — makanan',
    'الْمَاءُ — air'
  ],
  exampleSentences: [
    'النَّصُّ الصَّغِيرُ يَتَحَدَّثُ عَنِ الْبَيْتِ — Petikan pendek ini bercakap tentang rumah.',
    'الْوَلَدُ فِي الْمَدْرَسَةِ — Budak lelaki itu di sekolah.',
    'الْبِنْتُ تَقْرَأُ الْكِتَابَ — Budak perempuan itu membaca buku.',
    'الطَّعَامُ عَلَى الطَّاوِلَةِ — Makanan berada di atas meja.',
    'الْمَاءُ بَارِدٌ — Air itu sejuk.'
  ],
  extraExamples: [
    'الطَّالِبُ',
    'الْمُعَلِّمُ',
    'الْقِطَّةُ',
    'الشَّمْسُ',
    'الْقَمَرُ',
    'اللَّوْنُ',
    'الْأُسْرَةُ',
    'الصَّفُّ'
  ],
  tips: [
    'Baca petikan Arab dengan teliti.',
    'Cari kata kunci yang berkaitan dengan soalan.',
    'Padankan jawapan dengan ayat dalam petikan.',
    'Ulang bacaan supaya mudah faham.',
    'Pilih jawapan yang paling sesuai dengan maksud petikan.'
  ],
  memoryTips: [
    'Ingat kefahaman sebagai latihan mencari maklumat.',
    'Baca satu ayat demi satu ayat.',
    'Kaitkan petikan dengan situasi harian.',
    'Ulang ayat yang sama beberapa kali.',
    'Buat latihan pendek tetapi kerap.'
  ],
  commonMistakes: [
    'Memilih jawapan yang tidak sepadan dengan petikan.',
    'Membaca terlalu laju sehingga terlepas kata kunci.',
    'Mengabaikan petikan sebelum menjawab.',
    'Meneka tanpa mencari bukti dalam teks.',
    'Keliru antara perkataan yang hampir sama.'
  ],
  encouragement: {
    correct: [
      'Bagus! Kamu memahami Kefahaman Arab dengan baik.',
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
      'Tak mengapa, cuba semak Kefahaman Arab sekali lagi.',
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
      'Hebat! Kamu sangat mahir dengan Kefahaman Arab.',
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
  relatedTopics: [
    'mufradat',
    'hiwar',
    'ayat_mudah_arab',
    'huruf_hijaiyah'
  ],
  difficulty: 'easy',
  curriculum: {
    SK: 'Memahami teks Arab mudah.',
    SP: 'Murid dapat mencari dan menjawab maklumat daripada petikan ringkas.'
  },
  keywords: [
    'kefahaman',
    'teks',
    'petikan',
    'maklumat',
    'soalan',
    'jawapan',
    'maksud',
    'kata kunci',
    'bacaan',
    'ringkas',
    'faham',
    'Arab'
  ],
  questionPatterns: [
    'Apakah yang berkaitan dengan Kefahaman Arab?',
    'Pilih jawapan yang betul.',
    'Yang manakah contoh kefahaman arab?',
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
    'Sebut النَّصُّ الصَّغِيرُ dengan perlahan.',
    'Dengar الْمَدْرَسَةُ dengan teliti.',
    'Ulang bunyi Arab secara perlahan.',
    'Latih sebutan bersama guru.',
    'Perhatikan huruf Arab yang betul.'
  ],
  letterRecognitionTips: [
    'Perhatikan bentuk huruf dalam petikan.',
    'Cari titik dan garis yang membezakan huruf.',
    'Bandingkan huruf yang hampir sama.',
    'Baca dari kanan ke kiri.',
    'Padankan bentuk dengan bunyi.'
  ],
  writingTips: [
    'Tulis kata kunci Arab dengan kemas.',
    'Ikut bentuk huruf dengan betul.',
    'Perhatikan sambungan dan titik.',
    'Beri ruang yang cukup antara perkataan.',
    'Semak tulisan selepas menyalin.'
  ],
  vocabularyGroups: [
    'tempat',
    'orang',
    'benda',
    'makanan'
  ],
  translationHints: [
    'Baca petikan dahulu dan cari maklumat yang disebut dengan jelas.',
    'Gunakan kata kunci untuk mencari jawapan dalam teks.',
    'Padankan maksud Melayu dengan bukti daripada petikan.',
    'Bandingkan pilihan jawapan dengan isi bacaan.',
    'Pilih jawapan yang benar-benar terdapat dalam petikan.'
  ],
  readingPractice: [
    'Baca contoh petikan satu demi satu.',
    'Padankan perkataan dengan maksud.',
    'Cari perkataan yang sama bentuk.',
    'Baca dari kanan ke kiri.',
    'Ulang dengan rakan atau guru.'
  ],
  listeningPractice: [
    'Dengar sebutan petikan Arab.',
    'Pilih perkataan yang disebut dengan betul.',
    'Bezakan bunyi yang hampir sama.',
    'Dengar contoh guru dengan teliti.',
    'Ulang bunyi yang dipelajari.'
  ],
  speakingPractice: [
    'Sebut petikan Arab dengan jelas.',
    'Ulang bunyi perkataan secara perlahan.',
    'Latih sebutan bersama guru.',
    'Baca dengan suara yang sesuai.',
    'Padankan sebutan dengan tulisan.'
  ],
  writingPractice: [
    'Salin kata kunci dengan kemas.',
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

const comprehensionCards = [
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'هٰذَا كِتَابٌ. هٰذَا قَلَمٌ.',
    rumiReference: 'Haaza kitaabun. Haaza qalamun.',
    meaningBM: 'Ini buku. Ini pensel.',
    vocabularySupport: ['هٰذَا = ini', 'كِتَابٌ = buku', 'قَلَمٌ = pensel'],
    sentenceBreakdown: ['هٰذَا كِتَابٌ', 'هٰذَا قَلَمٌ'],
    pronunciationHint: 'Baca perlahan: haa-zaa kitaa-bun. haa-zaa qalamun.',
    readingStrategy: 'Cari perkataan yang menunjukkan benda dalam petikan.',
    comprehensionQuestion: 'Apakah benda yang disebut dalam petikan?',
    answerExplanation: 'Petikan menyebut buku dan pensel.',
    commonMistake: 'Jangan tertukar كِتَابٌ dengan قَلَمٌ.',
    memoryTip: 'هٰذَا bermaksud ini.',
    difficulty: 'easy'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'هٰذِهِ مَدْرَسَةٌ. هٰذَا بَيْتٌ.',
    rumiReference: 'Haazihi madrasatun. Haaza baytun.',
    meaningBM: 'Ini sekolah. Ini rumah.',
    vocabularySupport: ['هٰذِهِ = ini', 'مَدْرَسَةٌ = sekolah', 'بَيْتٌ = rumah'],
    sentenceBreakdown: ['هٰذِهِ مَدْرَسَةٌ', 'هٰذَا بَيْتٌ'],
    pronunciationHint: 'Baca perlahan: haa-zi-hi mad-ra-sa-tun. haa-zaa bay-tun.',
    readingStrategy: 'Cari kata tempat dalam petikan.',
    comprehensionQuestion: 'Apakah tempat yang disebut dalam petikan?',
    answerExplanation: 'Petikan menyebut sekolah dan rumah.',
    commonMistake: 'Jangan keliru بين مَدْرَسَةٌ dan بَيْتٌ.',
    memoryTip: 'مَدْرَسَةٌ ialah sekolah.',
    difficulty: 'easy'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'الْوَلَدُ يَقْرَأُ الْكِتَابَ.',
    rumiReference: 'Al-waladu yaqra’u al-kitaaba.',
    meaningBM: 'Budak lelaki itu membaca buku.',
    vocabularySupport: ['الْوَلَدُ = budak lelaki', 'يَقْرَأُ = membaca', 'الْكِتَابَ = buku'],
    sentenceBreakdown: ['الْوَلَدُ', 'يَقْرَأُ', 'الْكِتَابَ'],
    pronunciationHint: 'Baca perlahan: al-waladu yaqra’u al-kitaaba.',
    readingStrategy: 'Cari kata kerja dalam petikan.',
    comprehensionQuestion: 'Apakah yang dibuat oleh budak lelaki?',
    answerExplanation: 'Budak lelaki itu membaca buku.',
    commonMistake: 'Jangan tertukar يَقْرَأُ dengan perbuatan lain.',
    memoryTip: 'يَقْرَأُ bermaksud membaca.',
    difficulty: 'medium'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'الْبِنْتُ تَكْتُبُ الدَّرْسَ.',
    rumiReference: 'Al-bintu taktubu ad-darsa.',
    meaningBM: 'Budak perempuan itu menulis pelajaran.',
    vocabularySupport: ['الْبِنْتُ = budak perempuan', 'تَكْتُبُ = menulis', 'الدَّرْسَ = pelajaran'],
    sentenceBreakdown: ['الْبِنْتُ', 'تَكْتُبُ', 'الدَّرْسَ'],
    pronunciationHint: 'Baca perlahan: al-bintu taktubu ad-darsa.',
    readingStrategy: 'Cari siapa dan apa yang dilakukan.',
    comprehensionQuestion: 'Siapakah yang menulis pelajaran?',
    answerExplanation: 'Budak perempuan itu menulis pelajaran.',
    commonMistake: 'Jangan tertukar تَكْتُبُ dengan kata nama.',
    memoryTip: 'تَكْتُبُ bermaksud menulis.',
    difficulty: 'medium'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'أُمِّي فِي الْمَطْبَخِ.',
    rumiReference: 'Ummii fil-matbakh.',
    meaningBM: 'Ibu saya di dapur.',
    vocabularySupport: ['أُمِّي = ibu saya', 'فِي = di', 'الْمَطْبَخِ = dapur'],
    sentenceBreakdown: ['أُمِّي', 'فِي', 'الْمَطْبَخِ'],
    pronunciationHint: 'Baca perlahan: um-mee fil-mat-bakh.',
    readingStrategy: 'Cari perkataan tempat dalam petikan.',
    comprehensionQuestion: 'Di manakah ibu saya?',
    answerExplanation: 'Ibu saya berada di dapur.',
    commonMistake: 'Jangan tertukar الْمَطْبَخِ dengan rumah.',
    memoryTip: 'فِي bermaksud di.',
    difficulty: 'medium'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'الْمَاءُ بَارِدٌ.',
    rumiReference: 'Al-maa’u baaridun.',
    meaningBM: 'Air itu sejuk.',
    vocabularySupport: ['الْمَاءُ = air', 'بَارِدٌ = sejuk'],
    sentenceBreakdown: ['الْمَاءُ', 'بَارِدٌ'],
    pronunciationHint: 'Baca perlahan: al-maa’u baaridun.',
    readingStrategy: 'Cari perkataan sifat dalam petikan.',
    comprehensionQuestion: 'Bagaimanakah keadaan air?',
    answerExplanation: 'Air itu sejuk.',
    commonMistake: 'Jangan tertukar بَارِدٌ dengan panas.',
    memoryTip: 'بَارِدٌ bermaksud sejuk.',
    difficulty: 'medium'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'الشَّجَرَةُ خَضْرَاءُ.',
    rumiReference: 'Asy-syajaratu khadraa’u.',
    meaningBM: 'Pokok itu hijau.',
    vocabularySupport: ['الشَّجَرَةُ = pokok', 'خَضْرَاءُ = hijau'],
    sentenceBreakdown: ['الشَّجَرَةُ', 'خَضْرَاءُ'],
    pronunciationHint: 'Baca perlahan: asy-syajaratu khadraa’u.',
    readingStrategy: 'Cari warna atau sifat dalam petikan.',
    comprehensionQuestion: 'Apakah warna pokok itu?',
    answerExplanation: 'Pokok itu berwarna hijau.',
    commonMistake: 'Jangan tertukar خَضْرَاءُ dengan warna lain.',
    memoryTip: 'خَضْرَاءُ bermaksud hijau.',
    difficulty: 'medium'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'الطَّبِيبُ فِي الْمُسْتَشْفَى.',
    rumiReference: 'At-tabiibu fil-mustashfaa.',
    meaningBM: 'Doktor itu di hospital.',
    vocabularySupport: ['الطَّبِيبُ = doktor', 'فِي = di', 'الْمُسْتَشْفَى = hospital'],
    sentenceBreakdown: ['الطَّبِيبُ', 'فِي', 'الْمُسْتَشْفَى'],
    pronunciationHint: 'Baca perlahan: at-tabiibu fil-mustashfaa.',
    readingStrategy: 'Cari siapa dan tempat dalam petikan.',
    comprehensionQuestion: 'Di manakah doktor itu?',
    answerExplanation: 'Doktor itu berada di hospital.',
    commonMistake: 'Jangan tertukar الْمُسْتَشْفَى dengan sekolah.',
    memoryTip: 'الْمُسْتَشْفَى ialah hospital.',
    difficulty: 'medium'
  },
  {
    question: 'Baca petikan berikut.',
    passageArabic: 'أَنَا أُحِبُّ الْكِتَابَ.',
    rumiReference: 'Ana uhibbu al-kitaaba.',
    meaningBM: 'Saya suka buku.',
    vocabularySupport: ['أَنَا = saya', 'أُحِبُّ = suka', 'الْكِتَابَ = buku'],
    sentenceBreakdown: ['أَنَا', 'أُحِبُّ', 'الْكِتَابَ'],
    pronunciationHint: 'Baca perlahan: ana uhibbu al-kitaaba.',
    readingStrategy: 'Cari perkataan yang menunjukkan suka.',
    comprehensionQuestion: 'Apa yang disukai oleh saya?',
    answerExplanation: 'Saya suka buku.',
    commonMistake: 'Jangan tertukar أُحِبُّ dengan membaca.',
    memoryTip: 'أُحِبُّ bermaksud saya suka.',
    difficulty: 'medium'
  }
];

export default {
  ...kefahamanKnowledge,
  passageCards: comprehensionCards
};
