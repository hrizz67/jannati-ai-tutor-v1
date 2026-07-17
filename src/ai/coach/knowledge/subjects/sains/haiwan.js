import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Haiwan dengan baik.",
      "Syabas! Jawapan kamu betul.",
      "Hebat! Kamu membaca maklumat dengan teliti.",
      "Tahniah! Kamu semakin yakin.",
      "Cemerlang! Kamu membuat pilihan yang tepat.",
      "Mantap! Teruskan usaha ini.",
      "Bagus sekali! Kamu sudah berada pada jalan yang betul.",
      "Hebat benar! Kamu sangat teliti.",
      "Syabas, kamu menyelesaikan soalan ini dengan baik.",
      "Tahniah, kamu semakin mahir."
    ],
    "retry": [
      "Tak mengapa, cuba semak Haiwan sekali lagi.",
      "Baca soalan dengan perlahan.",
      "Perhatikan ciri dan petunjuk dengan teliti.",
      "Ambil masa dan cuba lagi.",
      "Semak jawapan sebelum memilih.",
      "Lihat fakta atau pemerhatian dengan teliti.",
      "Cuba bandingkan pilihan yang ada.",
      "Fokus pada kata kunci soalan.",
      "Kamu hampir betul, jangan putus asa.",
      "Baca semula langkah satu demi satu."
    ],
    "excellent": [
      "Hebat! Kamu sangat mahir dengan Haiwan.",
      "Cemerlang! Kamu memahami topik ini dengan yakin.",
      "Luar biasa! Penguasaan kamu sangat baik.",
      "Brilliant! Kamu menjawab dengan tepat.",
      "Mantap! Kamu boleh teruskan ke cabaran baharu.",
      "Syabas! Kamu membuat pemerhatian dengan sangat teliti.",
      "Bagus sekali! Kamu sangat yakin.",
      "Hebat benar! Teruskan kecemerlangan ini.",
      "Tahniah! Kamu sangat bersedia.",
      "Fantastic! Kamu telah melakukan yang terbaik."
    ]
  },
  "topicId": "haiwan",
  "displayName": "Haiwan",
  "learningObjectives": [
    "Mengenal ciri asas haiwan.",
    "Mengelaskan haiwan mengikut ciri mudah.",
    "Menghubungkan haiwan dengan tempat hidup dan cara bergerak."
  ],
  "teacherExplanation": [
    "Haiwan ialah benda hidup yang bergerak, bernafas dan memerlukan makanan.",
    "Haiwan mempunyai ciri yang berbeza seperti bulu, sisik, sayap atau kaki.",
    "Kita boleh mengelaskan haiwan mengikut cara bergerak, tempat hidup atau rupa.",
    "Murid Tahun 2 perlu memerhati haiwan dengan teliti dan menyebut cirinya dengan mudah."
  ],
  "simpleExplanation": "Haiwan ialah benda hidup yang mempunyai ciri dan keperluan tertentu.",
  "workedExamples": [
    {
      "prompt": "Kucing bergerak bagaimana?",
      "steps": [
        "Kucing menggunakan empat kaki.",
        "Ia berjalan dan berlari.",
        "Jawapan: bergerak dengan empat kaki."
      ],
      "answer": "bergerak dengan empat kaki"
    },
    {
      "prompt": "Burung tinggal di mana?",
      "steps": [
        "Burung biasanya membuat sarang di pokok.",
        "Ia hidup di tempat yang sesuai untuk terbang.",
        "Jawapan: pokok atau sarang."
      ],
      "answer": "pokok atau sarang"
    },
    {
      "prompt": "Ikan bernafas dengan apa?",
      "steps": [
        "Ikan hidup di dalam air.",
        "Ikan menggunakan insang.",
        "Jawapan: insang."
      ],
      "answer": "insang"
    },
    {
      "prompt": "Haiwan yang ada sisik?",
      "steps": [
        "Sisik ialah ciri pada ikan atau reptilia.",
        "Pilih haiwan yang sesuai.",
        "Jawapan: ikan."
      ],
      "answer": "ikan"
    },
    {
      "prompt": "Haiwan yang terbang?",
      "steps": [
        "Burung mempunyai sayap.",
        "Sayap membantu burung terbang.",
        "Jawapan: burung."
      ],
      "answer": "burung"
    }
  ],
  "examples": [
    "kucing",
    "burung",
    "ikan",
    "ayam",
    "gajah",
    "ular",
    "katak",
    "rama-rama",
    "lembu",
    "anjing"
  ],
  "extraExamples": [
    "harimau",
    "itik",
    "kambing",
    "semut",
    "kupu-kupu",
    "arnab",
    "landak",
    "penyu"
  ],
  "problemSolvingSteps": [
    "Perhatikan ciri haiwan dengan teliti.",
    "Bandingkan cara haiwan bergerak atau hidup.",
    "Cari petunjuk pada gambar atau soalan.",
    "Pilih jawapan yang paling sesuai.",
    "Semak sama ada ciri itu benar untuk haiwan tersebut."
  ],
  "tips": [
    "Lihat bulu, sisik, sayap atau kaki.",
    "Fikir tempat hidup haiwan itu.",
    "Bandingkan cara haiwan bergerak.",
    "Baca soalan dengan teliti.",
    "Pilih haiwan yang betul berdasarkan ciri."
  ],
  "memoryTips": [
    "Haiwan ialah benda hidup.",
    "Ciri haiwan membantu kita kenal.",
    "Lihat kaki, sayap atau sisik.",
    "Bandingkan haiwan satu demi satu.",
    "Perhatikan tempat hidupnya."
  ],
  "commonMistakes": [
    "Menyamakan haiwan dengan tumbuhan.",
    "Tidak melihat ciri haiwan.",
    "Keliru antara haiwan yang serupa.",
    "Memilih jawapan tanpa bukti.",
    "Mengabaikan cara haiwan bergerak."
  ],
  "scientificFacts": [
    "Haiwan ialah benda hidup.",
    "Haiwan memerlukan makanan, air dan udara.",
    "Sesetengah haiwan mempunyai sayap untuk terbang.",
    "Ada haiwan yang hidup di darat, air atau kedua-duanya.",
    "Haiwan mempunyai ciri yang berbeza.",
    "Ikan bernafas dengan insang.",
    "Burung mempunyai sayap dan bulu.",
    "Reptilia mempunyai sisik."
  ],
  "observationPrompts": [
    "Perhatikan ciri badan haiwan.",
    "Lihat cara haiwan bergerak.",
    "Bandingkan dua haiwan.",
    "Cari persamaan dan perbezaan.",
    "Perhatikan tempat hidup haiwan.",
    "Lihat apa yang dimakan haiwan itu."
  ],
  "comparisonPrompts": [
    "Bandingkan haiwan darat dan air.",
    "Bandingkan burung dan ikan.",
    "Bandingkan haiwan berbulu dan bersisik.",
    "Bandingkan cara bergerak haiwan.",
    "Bandingkan haiwan besar dan kecil."
  ],
  "investigationIdeas": [
    "Perhatikan haiwan di buku gambar.",
    "Buat carta ciri haiwan.",
    "Bandingkan dua haiwan kegemaran.",
    "Tandakan haiwan yang hidup di air."
  ],
  "realLifeConnections": [
    "Haiwan ada di ladang dan di rumah.",
    "Kita melihat haiwan di zoo.",
    "Haiwan membantu manusia dalam kehidupan.",
    "Haiwan peliharaan perlu dijaga.",
    "Haiwan hidup di tempat yang sesuai."
  ],
  "safetyNotes": [
    "Perhatikan haiwan dari jarak selamat.",
    "Jangan ganggu haiwan liar.",
    "Basuh tangan selepas memegang haiwan peliharaan."
  ],
  "misconceptions": [
    "Semua haiwan hidup di tempat yang sama.",
    "Semua haiwan bergerak dengan cara yang sama.",
    "Ikan tidak memerlukan oksigen.",
    "Burung dan serangga sama.",
    "Haiwan tidak mempunyai ciri yang berbeza."
  ],
  "evidenceQuestions": [
    "Apakah bukti haiwan ini hidup di darat?",
    "Ciri manakah yang kamu nampak?",
    "Bagaimana haiwan ini bergerak?",
    "Apa yang membuatkan kamu memilih jawapan itu?",
    "Di mana haiwan ini tinggal?",
    "Bolehkah kamu beri bukti daripada gambar?"
  ],

  "whyQuestions": [
    "Mengapa haiwan perlu makanan?",
    "Mengapa sesetengah haiwan hidup di air?",
    "Mengapa haiwan mempunyai ciri yang berbeza?",
    "Mengapa burung mempunyai sayap?",
    "Mengapa haiwan memerlukan tempat tinggal yang sesuai?"
  ],
  "predictionQuestions": [
    "Apa yang akan berlaku jika haiwan tidak mendapat air?",
    "Apa yang mungkin berlaku jika haiwan tiada tempat berlindung?",
    "Apa yang akan berlaku jika ikan keluar dari air terlalu lama?",
    "Apa yang mungkin berlaku jika burung tidak boleh terbang?",
    "Apa yang akan berubah jika haiwan hidup di habitat lain?"
  ],
  "comparisonQuestions": [
    "Bandingkan haiwan darat dan haiwan air.",
    "Bandingkan burung dan ikan.",
    "Bandingkan haiwan berbulu dan haiwan bersisik.",
    "Bandingkan cara bergerak haiwan yang berbeza.",
    "Bandingkan haiwan yang hidup di ladang dan di hutan."
  ],
  "realLifeApplications": [
    "Menjaga haiwan peliharaan dengan baik.",
    "Memerhati haiwan di zoo atau ladang.",
    "Memberi makanan yang sesuai kepada haiwan.",
    "Menjaga kebersihan selepas memegang haiwan.",
    "Mengenal haiwan dalam buku dan gambar."
  ],
  "relatedTopics": [
    "tumbuhan",
    "manusia",
    "bumi",
    "bunyi"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal haiwan melalui ciri asas dan habitat mudah.",
    "SP": "Murid dapat memerhati, mengelaskan dan menerangkan ciri haiwan secara ringkas."
  },
  "keywords": [
    "haiwan",
    "hidup",
    "ciri",
    "bergerak",
    "habitat",
    "kaki",
    "sayap",
    "sisik",
    "bulu",
    "insang",
    "darat",
    "air"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang haiwan?",
    "Pilih jawapan yang sesuai tentang haiwan.",
    "Yang manakah berkaitan dengan haiwan?",
    "Cari maklumat yang betul tentang haiwan.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih bukan haiwan.",
    "Tidak melihat ciri haiwan.",
    "Keliru habitat haiwan.",
    "Meneka tanpa bukti.",
    "Mengabaikan cara bergerak.",
    "Memilih ciri yang salah."
  ],
  "followUpQuestions": [
    "Apakah ciri utama haiwan itu?",
    "Boleh kamu bandingkan dua haiwan?",
    "Haiwan ini tinggal di mana?",
    "Bagaimana haiwan ini bergerak?",
    "Apa bukti jawapan kamu?",
    "Bolehkah kamu terangkan semula?",
    "Adakah haiwan ini darat atau air?",
    "Ciri mana yang paling jelas?"
  ]
});

export default knowledge;
