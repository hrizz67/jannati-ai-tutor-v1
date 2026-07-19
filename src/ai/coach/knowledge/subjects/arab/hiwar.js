import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const hiwarKnowledge = createKnowledgePack({
  subjectId: 'arab',
  topicId: 'hiwar',
  displayName: 'Hiwar',
  learningObjectives: [
    'Mengenal dialog ringkas dalam bahasa Arab.',
    'Memahami pertanyaan dan jawapan asas.',
    'Menggunakan hiwar mudah dalam situasi harian.'
  ],
  teacherExplanation: [
    'Hiwar ialah perbualan ringkas antara dua orang dalam bahasa Arab.',
    'Guru boleh menunjukkan siapa bercakap, apa yang ditanya, dan apa jawapannya.',
    'Murid perlu membaca dialog dengan intonasi yang betul dan memahami maknanya.',
    'Latihan ini membantu murid bercakap secara mudah dalam situasi harian.'
  ],
  simpleExplanation: 'Hiwar ialah perbualan ringkas antara dua orang dalam bahasa Arab.',
  explanations: [
    'Hiwar mengajar murid bercakap dan menjawab dalam situasi mudah.',
    'Guru boleh tunjuk siapa yang bercakap supaya murid faham urutan dialog.',
    'Murid perlu membaca dialog perlahan-lahan dan memahami maksud setiap ayat.',
    'Latihan ini sesuai untuk Tahun 2 kerana dialognya ringkas dan mesra murid.'
  ],
  examples: [
    'السَّلَامُ عَلَيْكُمْ',
    'وَعَلَيْكُمُ السَّلَامُ',
    'كَيْفَ حَالُكَ',
    'بِخَيْرٍ',
    'مَا اسْمُكَ',
    'اسْمِي',
    'مِنْ أَيْنَ أَنْتَ',
    'أَنَا مِنْ',
    'نَعَمْ',
    'لَا'
  ],
  wordMeaning: [
    'السَّلَامُ عَلَيْكُمْ — Sejahtera ke atas kamu',
    'وَعَلَيْكُمُ السَّلَامُ — Dan sejahtera ke atas kamu',
    'كَيْفَ حَالُكَ — Apa khabar kamu',
    'بِخَيْرٍ — Baik-baik',
    'مَا اسْمُكَ — Siapakah nama kamu',
    'اسْمِي — Nama saya',
    'مِنْ أَيْنَ أَنْتَ — Dari mana kamu',
    'أَنَا مِنْ — Saya dari',
    'شُكْرًا — Terima kasih',
    'إِلَى اللِّقَاءِ — Jumpa lagi'
  ],
  exampleSentences: [
    'السَّلَامُ عَلَيْكُمْ — Sejahtera ke atas kamu.',
    'كَيْفَ حَالُكَ — Apa khabar kamu?',
    'مَا اسْمُكَ — Siapakah nama kamu?',
    'اسْمِي عَائِشَةُ — Nama saya Aisyah.',
    'شُكْرًا — Terima kasih.'
  ],
  extraExamples: [
    'شُكْرًا',
    'مِنْ فَضْلِكَ',
    'إِلَى اللِّقَاءِ',
    'أَهْلًا',
    'مَرْحَبًا',
    'كَيْفَكَ',
    'أَنَا طَالِبٌ',
    'أَنَا طَالِبَةٌ'
  ],
  tips: [
    'Baca dialog Arab dari kanan ke kiri dengan teliti.',
    'Cari siapa yang bercakap dan apa responsnya.',
    'Padankan dialog dengan maksud Melayu yang betul.',
    'Gunakan nada bertanya dan menjawab semasa membaca.',
    'Ulang dialog ringkas supaya lebih mudah diingat.'
  ],
  memoryTips: [
    'Ingat hiwar sebagai perbualan dua orang.',
    'Baca satu baris demi satu baris.',
    'Kaitkan dialog dengan situasi harian seperti salam dan berkenalan.',
    'Ulang sebutan sambil lihat maksud Melayu.',
    'Latih dialog pendek secara kerap.'
  ],
  commonMistakes: [
    'Memilih maksud Melayu yang tidak sepadan dengan dialog Arab.',
    'Tersalah mengenal siapa yang bertanya dan siapa yang menjawab.',
    'Membaca dialog terlalu laju sehingga tertinggal perkataan penting.',
    'Tidak melihat susunan dialog dari kanan ke kiri.',
    'Meneka jawapan tanpa memahami keseluruhan perbualan.'
  ],
  encouragement: {
    correct: [
      'Bagus! Kamu memahami Hiwar dengan baik.',
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
      'Tak mengapa, cuba semak Hiwar sekali lagi.',
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
      'Hebat! Kamu sangat mahir dengan Hiwar.',
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
    'Dengar dialog dengan perlahan.',
    'Kenal pasti siapa yang bercakap.',
    'Cari maksud ayat yang sesuai.',
    'Padankan respons dengan situasi.',
    'Semak semula dialog sebelum menjawab.'
  ],
  pronunciationGuide: [
    'Sebut dialog dengan intonasi yang jelas.',
    'Ikut nada pertanyaan dan jawapan.',
    'Latih bunyi perkataan Arab yang mudah.',
    'Baca bersama rakan atau guru.',
    'Ulang dialog secara berpasangan.'
  ],
  readingSteps: [
    'Baca dialog dari kanan ke kiri.',
    'Kenal pasti ayat soal dan ayat jawap.',
    'Padankan dialog dengan maksud.',
    'Ulang bacaan dengan teliti.',
    'Semak pilihan yang paling sesuai.'
  ],
  letterBreakdown: [
    'Perhatikan huruf pada perkataan utama.',
    'Cari bunyi yang hampir sama.',
    'Lihat tanda dan titik huruf.',
    'Pecahkan perkataan kepada huruf.',
    'Kenal bunyi setiap perkataan.'
  ],
  listeningTips: [
    'Dengar dialog dengan fokus.',
    'Cari perkataan yang paling mudah difahami.',
    'Ulang sebutan yang betul.',
    'Latih mendengar bersama guru.',
    'Fahami maksud keseluruhan dialog.'
  ],
  relatedTopics: [
    'mufradat',
    'ayat_mudah_arab',
    'keluarga',
    'kefahaman_arab'
  ],
  difficulty: 'easy',
  curriculum: {
    SK: 'Mengenal dan menggunakan hiwar asas.',
    SP: 'Murid dapat memahami pertanyaan dan jawapan ringkas dalam bahasa Arab.'
  },
  keywords: [
    'hiwar',
    'dialog',
    'salam',
    'soalan',
    'jawapan',
    'nama',
    'asal',
    'ya',
    'tidak',
    'pertanyaan',
    'ringkas',
    'percakapan'
  ],
  questionPatterns: [
    'Apakah yang berkaitan dengan Hiwar?',
    'Pilih jawapan yang betul.',
    'Yang manakah contoh hiwar?',
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
    'Sebut السَّلَامُ عَلَيْكُمْ dengan jelas.',
    'Dengar وَعَلَيْكُمُ السَّلَامُ dengan teliti.',
    'Ulang bunyi Arab secara perlahan.',
    'Latih sebutan bersama guru.',
    'Perhatikan huruf Arab yang betul.'
  ],
  letterRecognitionTips: [
    'Perhatikan bentuk huruf dalam Hiwar.',
    'Cari titik dan garis yang membezakan huruf.',
    'Bandingkan huruf yang hampir sama.',
    'Baca dari kanan ke kiri.',
    'Padankan bentuk dengan bunyi.'
  ],
  writingTips: [
    'Tulis Hiwar dari kanan ke kiri.',
    'Ikut bentuk huruf dengan kemas.',
    'Perhatikan sambungan dan titik.',
    'Beri ruang yang cukup antara perkataan.',
    'Semak tulisan selepas menyalin.'
  ],
  vocabularyGroups: [
    'salam',
    'nama',
    'asal',
    'ucapan'
  ],
  translationHints: [
    'Baca dialog dan fahami siapa yang bercakap serta maksud ayat.',
    'Cari salam, soalan nama, khabar atau jawapan ringkas dalam hiwar.',
    'Gunakan petunjuk konteks untuk memadankan dialog dengan terjemahan.',
    'Bandingkan pilihan jawapan dengan maksud sebenar dialog.',
    'Pilih padanan yang paling sesuai dengan perbualan.'
  ],
  readingPractice: [
    'Baca contoh Hiwar satu demi satu.',
    'Padankan perkataan dengan maksud.',
    'Cari perkataan yang sama bentuk.',
    'Baca dari kanan ke kiri.',
    'Ulang dengan rakan atau guru.'
  ],
  listeningPractice: [
    'Dengar sebutan Hiwar.',
    'Pilih perkataan yang disebut dengan betul.',
    'Bezakan bunyi yang hampir sama.',
    'Dengar contoh guru dengan teliti.',
    'Ulang bunyi yang dipelajari.'
  ],
  speakingPractice: [
    'Sebut Hiwar dengan jelas.',
    'Ulang bunyi perkataan secara perlahan.',
    'Latih sebutan bersama guru.',
    'Baca dengan suara yang sesuai.',
    'Padankan sebutan dengan tulisan.'
  ],
  writingPractice: [
    'Salin Hiwar dengan kemas.',
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

const dialogueCards = [
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'السَّلَامُ عَلَيْكُمْ' },
      { speaker: 'B', text: 'وَعَلَيْكُمُ السَّلَامُ' }
    ],
    rumiReference: 'As-salaamu ‘alaikum / Wa ‘alaikumus-salaam',
    meaningBM: 'Salam sejahtera ke atas kamu / Dan sejahtera ke atas kamu juga.',
    dialogueBreakdown: ['A memberi salam.', 'B menjawab salam.'],
    pronunciationHint: 'Baca perlahan dan ikut intonasi salam.',
    readingPractice: 'Baca setiap baris dengan jelas mengikut giliran pembicara.',
    speakingPractice: 'Latih salam bersama rakan secara berpasangan.',
    responsePractice: 'Balas salam dengan jawapan yang betul.',
    commonMistake: 'Jangan lupa membalas salam dengan sopan.',
    memoryTip: 'A memberi salam, B menjawab salam.',
    difficulty: 'easy'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'مَا اسْمُكَ' },
      { speaker: 'B', text: 'اسْمِي أَحْمَدُ' }
    ],
    rumiReference: 'Maa ismuka / Ismii Ahmad',
    meaningBM: 'Siapa nama kamu? / Nama saya Ahmad.',
    dialogueBreakdown: ['A bertanya nama.', 'B menjawab namanya.'],
    pronunciationHint: 'Sebut maa ismuka dan ismii Ahmad dengan jelas.',
    readingPractice: 'Tentukan ayat soal dan ayat jawap.',
    speakingPractice: 'Bertanya dan menjawab nama dengan sebutan betul.',
    responsePractice: 'Jawab soalan nama dengan lengkap.',
    commonMistake: 'Jangan tertukar ayat soal dengan ayat jawap.',
    memoryTip: 'مَا اسْمُكَ bermaksud nama kamu.',
    difficulty: 'easy'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'كَيْفَ حَالُكَ' },
      { speaker: 'B', text: 'بِخَيْرٍ' }
    ],
    rumiReference: 'Kaifa haaluka / Bikhoir',
    meaningBM: 'Apa khabar kamu? / Saya baik.',
    dialogueBreakdown: ['A bertanya khabar.', 'B menjawab keadaan dirinya.'],
    pronunciationHint: 'Baca kaifa haaluka dan bikhoir dengan perlahan.',
    readingPractice: 'Baca dialog ikut giliran A dan B.',
    speakingPractice: 'Latih intonasi bertanya khabar dengan rakan.',
    responsePractice: 'Jawab khabar dengan ungkapan yang sesuai.',
    commonMistake: 'Jangan jawab dengan ayat yang tidak berkaitan.',
    memoryTip: 'Khabar baik dijawab dengan بِخَيْرٍ.',
    difficulty: 'easy'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'مِنْ أَيْنَ أَنْتَ' },
      { speaker: 'B', text: 'أَنَا مِنْ مَالَيْزِيَا' }
    ],
    rumiReference: 'Min ayna anta / Anaa min Malaaiziyaa',
    meaningBM: 'Dari mana kamu? / Saya dari Malaysia.',
    dialogueBreakdown: ['A bertanya tempat asal.', 'B menjawab asalnya.'],
    pronunciationHint: 'Sebut min ayna anta dengan jelas.',
    readingPractice: 'Kenal pasti kata tanya dan jawapan asal.',
    speakingPractice: 'Bertanya tentang asal dan jawab dengan yakin.',
    responsePractice: 'Jawab menggunakan مِنْ dan nama tempat.',
    commonMistake: 'Jangan tertukar soalan tempat asal dengan nama.',
    memoryTip: 'مِنْ أَيْنَ bermaksud dari mana.',
    difficulty: 'easy'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'هَلْ أَنْتَ طَالِبٌ' },
      { speaker: 'B', text: 'نَعَمْ' }
    ],
    rumiReference: 'Hal anta taalibun / Naam',
    meaningBM: 'Adakah kamu murid lelaki? / Ya.',
    dialogueBreakdown: ['A bertanya dengan bentuk ya/tidak.', 'B menjawab ya.'],
    pronunciationHint: 'Baca hal anta taalibun dengan nada bertanya.',
    readingPractice: 'Perhatikan jawapan pendek dalam dialog.',
    speakingPractice: 'Latih menjawab ya atau tidak dengan tepat.',
    responsePractice: 'Jawab mengikut soalan yang diberi.',
    commonMistake: 'Jangan jawab lebih panjang daripada soalan ringkas jika tidak perlu.',
    memoryTip: 'نَعَمْ bermaksud ya.',
    difficulty: 'medium'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'أَيْنَ الْكِتَابُ' },
      { speaker: 'B', text: 'الْكِتَابُ عَلَى الْمَكْتَبِ' }
    ],
    rumiReference: 'Ayna al-kitaabu / Al-kitaabu ‘alaa al-maktabi',
    meaningBM: 'Di manakah buku? / Buku di atas meja.',
    dialogueBreakdown: ['A bertanya lokasi buku.', 'B menerangkan tempat buku.'],
    pronunciationHint: 'Baca ayna al-kitaabu dengan perlahan.',
    readingPractice: 'Cari perkataan lokasi seperti عَلَى.',
    speakingPractice: 'Sebut jawapan lokasi dengan jelas.',
    responsePractice: 'Balas soalan tempat dengan lokasi yang sesuai.',
    commonMistake: 'Jangan tertukar عَلَى dengan فِي.',
    memoryTip: 'عَلَى bermaksud di atas.',
    difficulty: 'medium'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'مَاذَا تَفْعَلُ' },
      { speaker: 'B', text: 'أَقْرَأُ كِتَابًا' }
    ],
    rumiReference: 'Maazaa taf‘alu / Aqrā’u kitaaban',
    meaningBM: 'Apa yang kamu buat? / Saya membaca buku.',
    dialogueBreakdown: ['A bertanya perbuatan.', 'B menjawab perbuatannya.'],
    pronunciationHint: 'Sebut maazaa taf‘alu dan aqrā’u kitaaban.',
    readingPractice: 'Kenal pasti kata kerja dalam jawapan.',
    speakingPractice: 'Latih dialog dengan tindakan membaca.',
    responsePractice: 'Jawab dengan kata kerja yang betul.',
    commonMistake: 'Jangan jawab dengan benda sahaja tanpa perbuatan.',
    memoryTip: 'أَقْرَأُ bermaksud saya membaca.',
    difficulty: 'medium'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'هَلْ تُحِبُّ الْبَيْتَ' },
      { speaker: 'B', text: 'نَعَمْ، أَنَا أُحِبُّ الْبَيْتَ' }
    ],
    rumiReference: 'Hal tuhibbul-bayta / Naam, ana uhibbul-bayta',
    meaningBM: 'Adakah kamu suka rumah? / Ya, saya suka rumah.',
    dialogueBreakdown: ['A bertanya tentang suka atau tidak.', 'B menjawab dengan ayat lengkap.'],
    pronunciationHint: 'Baca hal tuhibbul-bayta dengan nada bertanya.',
    readingPractice: 'Perhatikan jawapan ya dan ayat lengkapnya.',
    speakingPractice: 'Latih jawapan lengkap bersama guru.',
    responsePractice: 'Jawab soalan suka atau tidak dengan betul.',
    commonMistake: 'Jangan jawab terlalu pendek jika ayat memerlukan lengkap.',
    memoryTip: 'أُحِبُّ bermaksud saya suka.',
    difficulty: 'medium'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'شُكْرًا' },
      { speaker: 'B', text: 'عَفْوًا' }
    ],
    rumiReference: 'Syukran / ‘Afwan',
    meaningBM: 'Terima kasih / Sama-sama.',
    dialogueBreakdown: ['A mengucapkan terima kasih.', 'B membalas dengan sopan.'],
    pronunciationHint: 'Baca syukran dan ‘afwan dengan jelas.',
    readingPractice: 'Kenal pasti ucapan sopan dalam dialog.',
    speakingPractice: 'Latih ucapan terima kasih dan balasannya.',
    responsePractice: 'Balas ucapan terima kasih dengan betul.',
    commonMistake: 'Jangan lupa jawapan balas yang sesuai.',
    memoryTip: 'شُكْرًا dibalas dengan عَفْوًا.',
    difficulty: 'medium'
  },
  {
    question: 'Baca dialog berikut.',
    dialogueArabic: [
      { speaker: 'A', text: 'إِلَى اللِّقَاءِ' },
      { speaker: 'B', text: 'إِلَى اللِّقَاءِ' }
    ],
    rumiReference: 'Ilaa al-liqaa’',
    meaningBM: 'Jumpa lagi.',
    dialogueBreakdown: ['A memberi ucapan perpisahan.', 'B membalas ucapan yang sama.'],
    pronunciationHint: 'Sebut ilaa al-liqaa’ dengan perlahan.',
    readingPractice: 'Baca ucapan perpisahan dengan jelas.',
    speakingPractice: 'Latih sebutan semasa berpisah secara sopan.',
    responsePractice: 'Balas ucapan perpisahan dengan ucapan yang sama.',
    commonMistake: 'Jangan tukar ucapan perpisahan dengan salam.',
    memoryTip: 'إِلَى اللِّقَاءِ bermaksud jumpa lagi.',
    difficulty: 'medium'
  }
];

export default {
  ...hiwarKnowledge,
  dialogueCards
};
