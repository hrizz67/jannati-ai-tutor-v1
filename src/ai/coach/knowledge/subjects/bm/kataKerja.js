import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const kataKerjaKnowledge = createKnowledgePack({
  subjectId: 'bm',
  topicId: 'kata_kerja',
  displayName: 'Kata Kerja',
  learningObjectives: [
    'Mengenal pasti kata kerja dalam ayat.',
    'Memahami kata kerja sebagai perkataan yang menunjukkan perbuatan.',
    'Membezakan kata kerja dengan kata nama dan kata adjektif.',
    'Menggunakan kata kerja yang sesuai dalam ayat mudah.'
  ],
  teacherExplanation: [
    'Kata kerja ialah perkataan yang menunjukkan perbuatan atau tindakan.',
    'Untuk mencari kata kerja, murid perlu mencari apa yang dibuat oleh orang, haiwan, atau benda dalam ayat.',
    'Kata kerja biasanya boleh menjawab soalan seperti "buat apa?".',
    'Dalam ayat mudah, kata kerja membantu ayat menjadi lengkap dan jelas.'
  ],
  simpleExplanation: 'Kata kerja ialah perkataan yang menunjukkan perbuatan atau tindakan.',
  examples: [
    { category: 'perbuatan', value: 'makan' },
    { category: 'perbuatan', value: 'lari' },
    { category: 'perbuatan', value: 'membaca' },
    { category: 'perbuatan', value: 'menulis' },
    { category: 'perbuatan', value: 'melompat' },
    { category: 'perbuatan', value: 'berjalan' },
    { category: 'perbuatan', value: 'menyapu' },
    { category: 'perbuatan', value: 'menyanyi' },
    { category: 'perbuatan', value: 'berenang' },
    { category: 'perbuatan', value: 'mewarna' }
  ],
  extraExamples: [
    'bermain',
    'membasuh',
    'memanjat',
    'mengira',
    'mengemas',
    'memasak',
    'menyiram',
    'memerhati'
  ],
  tips: [
    'Cari perkataan yang menunjukkan perbuatan dalam ayat.',
    'Tanya diri sendiri: "buat apa?"',
    'Perkataan aksi biasanya ialah kata kerja.',
    'Baca seluruh ayat sebelum memilih jawapan.',
    'Jangan keliru antara nama sesuatu dengan perbuatan.'
  ],
  memoryTips: [
    'Kata kerja = buat apa.',
    'Lari, baca, tulis, makan.',
    'Kalau ada aksi, itu mungkin kata kerja.',
    'Perkataan bergerak biasanya menunjukkan perbuatan.',
    'Kata kerja ialah kata aksi.'
  ],
  commonMistakes: [
    'Memilih kata nama seperti buku atau sekolah.',
    'Memilih kata adjektif seperti cantik atau besar.',
    'Tidak melihat perbuatan utama dalam ayat.',
    'Menganggap semua perkataan panjang ialah kata kerja.',
    'Menjawab tanpa membaca keseluruhan ayat.'
  ],
  encouragement: {
    correct: [
      'Bagus! Kamu sudah dapat mengenal kata kerja dengan betul.',
      'Syabas! Jawapan kamu tepat.',
      'Hebat! Kamu tahu cara mencari kata kerja.',
      'Tahniah! Kamu semakin mahir.',
      'Bagus sekali! Teruskan usaha ini.',
      'Mantap! Kata kerja kamu betul.',
      'Cemerlang! Kamu memahami kata kerja.',
      'Syabas, langkah kamu sudah tepat.',
      'Bagus, kamu membaca ayat dengan teliti.',
      'Hebat, kamu sudah mengenal kata aksi dengan betul.'
    ],
    retry: [
      'Tak mengapa, cuba cari perkataan yang menunjukkan perbuatan.',
      'Cuba baca ayat sekali lagi dengan perlahan.',
      'Tengok sama ada perkataan itu menunjukkan aksi.',
      'Semak semula keseluruhan ayat.',
      'Cari kata yang paling sesuai dengan maksud soalan.',
      'Ambil masa dan cuba lagi.',
      'Lihat sama ada perkataan itu menjawab soalan "buat apa?".',
      'Baca ayat itu sekali lagi dan fokus pada perbuatan.',
      'Tak mengapa, kamu hampir betul.',
      'Cuba bezakan kata kerja dengan kata nama.'
    ],
    excellent: [
      'Hebat! Kamu sangat yakin dengan kata kerja.',
      'Cemerlang! Kamu memahami contoh kata kerja dengan baik.',
      'Tahniah! Kamu sudah menguasai kata kerja.',
      'Bagus sekali! Kamu sangat teliti membaca ayat.',
      'Luar biasa! Penguasaan kamu sangat mantap.',
      'Mantap! Kamu boleh membezakan kata kerja dengan tepat.',
      'Syabas! Kamu sudah membaca ayat seperti seorang pakar kecil.',
      'Hebat benar! Teruskan kecemerlangan ini.',
      'Cemerlang! Kamu nampak sangat bersedia.',
      'Tahniah! Kamu berjaya dengan sangat baik.'
    ]
  },
  relatedTopics: ['kata_nama', 'kata_adjektif', 'kata_hubung', 'imbuhan'],
  difficulty: 'easy',
  curriculum: {
    SK: 'Mengenal pasti dan menggunakan kata kerja dalam ayat mudah.',
    SP: 'Murid dapat memilih kata kerja yang sesuai berdasarkan perbuatan dalam ayat.'
  },
  keywords: [
    'perbuatan',
    'aksi',
    'buat apa',
    'makan',
    'lari',
    'baca',
    'tulis',
    'bergerak',
    'kata kerja',
    'ayat',
    'tindakan',
    'melakukan'
  ],
  questionPatterns: [
    'Apakah kata kerja dalam ayat ini?',
    'Pilih perkataan yang menunjukkan perbuatan.',
    'Yang manakah kata kerja?',
    'Perkataan manakah yang menunjukkan aksi?',
    'Tentukan kata kerja yang betul.',
    'Cari kata kerja dalam ayat berikut.',
    'Apakah perkataan yang menerangkan perbuatan?',
    'Pilih jawapan yang menunjukkan tindakan.'
  ],
  wrongAnswerPatterns: [
    'Memilih kata nama sebagai kata kerja.',
    'Memilih kata adjektif yang hanya menerangkan sifat.',
    'Mengambil perkataan yang tidak menunjukkan aksi.',
    'Keliru antara orang yang melakukan perbuatan dan perbuatan itu sendiri.',
    'Menjawab berdasarkan satu perkataan tanpa membaca ayat penuh.',
    'Memilih perkataan yang kedengaran biasa tetapi bukan tindakan.'
  ],
  followUpQuestions: [
    'Apakah perbuatan yang dibuat oleh watak dalam ayat ini?',
    'Bolehkah kamu cari satu lagi kata kerja dalam ayat lain?',
    'Perkataan ini menunjukkan apa yang sedang dibuat?',
    'Jika kata ini bukan perbuatan, apakah jawapannya?',
    'Apa yang dilakukan oleh murid itu?',
    'Boleh kamu tunjukkan kata kerja dalam ayat penuh?',
    'Adakah perkataan ini jawapan kepada "buat apa"?',
    'Cuba bezakan kata kerja dengan kata nama dalam ayat ini.'
  ]
});

export default kataKerjaKnowledge;
