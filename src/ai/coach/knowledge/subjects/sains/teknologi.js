import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Teknologi dengan baik.",
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
      "Tak mengapa, cuba semak Teknologi sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Teknologi.",
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
  "topicId": "teknologi",
  "displayName": "Teknologi",
  "learningObjectives": [
    "Mengenal teknologi mudah dalam kehidupan harian.",
    "Memahami kegunaan alat teknologi secara asas.",
    "Menghubungkan teknologi dengan kerja dan keselamatan."
  ],
  "teacherExplanation": [
    "Teknologi ialah alat atau kaedah yang membantu manusia melakukan sesuatu dengan lebih mudah.",
    "Teknologi ada di rumah, sekolah dan tempat kerja.",
    "Contohnya, kipas, mesin basuh dan komputer membantu manusia.",
    "Murid Tahun 2 belajar menggunakan alat teknologi dengan selamat dan bijak."
  ],
  "simpleExplanation": "Teknologi ialah alat atau cara yang membantu manusia.",
  "workedExamples": [
    {
      "prompt": "Alat untuk menyejukkan bilik?",
      "steps": [
        "Kipas membantu udara bergerak.",
        "Jawapan: kipas."
      ],
      "answer": "kipas"
    },
    {
      "prompt": "Alat untuk mencuci pakaian?",
      "steps": [
        "Mesin basuh memudahkan kerja.",
        "Jawapan: mesin basuh."
      ],
      "answer": "mesin basuh"
    },
    {
      "prompt": "Alat untuk menaip?",
      "steps": [
        "Komputer digunakan untuk menaip.",
        "Jawapan: komputer."
      ],
      "answer": "komputer"
    },
    {
      "prompt": "Alat untuk melihat masa?",
      "steps": [
        "Jam membantu kita tahu waktu.",
        "Jawapan: jam."
      ],
      "answer": "jam"
    },
    {
      "prompt": "Teknologi membantu kita?",
      "steps": [
        "Teknologi memudahkan kerja.",
        "Jawapan: memudahkan kerja."
      ],
      "answer": "memudahkan kerja"
    }
  ],
  "examples": [
    "kipas",
    "komputer",
    "jam",
    "telefon",
    "mesin basuh",
    "televisyen",
    "lampu",
    "radio",
    "tablet",
    "printer"
  ],
  "extraExamples": [
    "telefon pintar",
    "peti sejuk",
    "pembesar suara",
    "kamera",
    "pembuat air",
    "mesin pengisar",
    "alat kawalan jauh",
    "lampu suluh"
  ],
  "problemSolvingSteps": [
    "Kenal pasti alat teknologi.",
    "Fikir kegunaan alat itu.",
    "Bandingkan alat yang berbeza.",
    "Pilih jawapan yang sesuai.",
    "Semak sama ada alat itu membantu manusia."
  ],
  "tips": [
    "Fikir alat yang memudahkan kerja.",
    "Lihat kegunaan di rumah atau sekolah.",
    "Baca soalan dengan teliti.",
    "Bandingkan alat yang sesuai.",
    "Pilih teknologi yang betul."
  ],
  "memoryTips": [
    "Teknologi membantu manusia.",
    "Ada di rumah dan sekolah.",
    "Memudahkan kerja harian.",
    "Gunakan dengan selamat.",
    "Alat boleh ada kegunaan berbeza."
  ],
  "commonMistakes": [
    "Menganggap teknologi hanya komputer.",
    "Tidak melihat kegunaan alat.",
    "Keliru alat dan bahan.",
    "Memilih jawapan yang tidak membantu.",
    "Meneka tanpa bukti."
  ],
  "scientificFacts": [
    "Teknologi membantu manusia.",
    "Teknologi ada dalam banyak alat harian.",
    "Kipas memudahkan udara bergerak.",
    "Mesin basuh membantu mencuci pakaian.",
    "Komputer membantu menaip dan belajar.",
    "Jam membantu menunjukkan masa.",
    "Teknologi mesti digunakan dengan selamat.",
    "Alat teknologi memudahkan kerja."
  ],
  "observationPrompts": [
    "Perhatikan alat di rumah.",
    "Bandingkan alat lama dan baharu.",
    "Lihat kegunaan alat sekolah.",
    "Cari teknologi dalam gambar.",
    "Perhatikan bahagian alat.",
    "Lihat cara alat membantu manusia."
  ],
  "comparisonPrompts": [
    "Bandingkan kipas dan jam.",
    "Bandingkan komputer dan buku.",
    "Bandingkan alat lama dan moden.",
    "Bandingkan teknologi di rumah dan sekolah.",
    "Bandingkan kegunaan setiap alat."
  ],
  "investigationIdeas": [
    "Buat senarai alat di rumah.",
    "Padankan alat dengan kegunaannya.",
    "Cari teknologi di bilik darjah.",
    "Lukis alat yang membantu manusia."
  ],
  "realLifeConnections": [
    "Kita guna teknologi setiap hari.",
    "Teknologi membantu belajar.",
    "Teknologi memudahkan kerja rumah.",
    "Teknologi ada di sekolah.",
    "Teknologi perlu digunakan dengan selamat."
  ],
  "safetyNotes": [
    "Gunakan alat elektronik dengan pengawasan.",
    "Jangan main alat elektrik sesuka hati.",
    "Ikut arahan keselamatan alat."
  ],
  "misconceptions": [
    "Teknologi hanya komputer.",
    "Semua alat sama kegunaan.",
    "Teknologi tidak perlu dijaga.",
    "Teknologi tidak ada di rumah.",
    "Teknologi tidak membantu manusia."
  ],
  "evidenceQuestions": [
    "Apa bukti alat ini teknologi?",
    "Bagaimana alat ini membantu?",
    "Mengapa kamu memilih jawapan itu?",
    "Boleh kamu beri contoh alat lain?",
    "Apa kegunaan alat ini?",
    "Bagaimana teknologi memudahkan kerja?"
  ],
  "relatedTopics": [
    "bahan",
    "bumi",
    "cahaya",
    "bunyi"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal teknologi asas dalam kehidupan harian.",
    "SP": "Murid dapat menerangkan kegunaan alat teknologi dengan mudah dan selamat."
  },
  "keywords": [
    "teknologi",
    "alat",
    "komputer",
    "kipas",
    "jam",
    "mesin basuh",
    "telefon",
    "mudah",
    "membantu",
    "selamat",
    "guna",
    "harian"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang teknologi?",
    "Pilih jawapan yang sesuai tentang teknologi.",
    "Yang manakah berkaitan dengan teknologi?",
    "Cari maklumat yang betul tentang teknologi.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih alat yang tidak membantu.",
    "Menganggap teknologi hanya satu alat.",
    "Tidak melihat kegunaan alat.",
    "Meneka tanpa bukti.",
    "Mengabaikan keselamatan.",
    "Memilih fakta yang salah."
  ],
  "followUpQuestions": [
    "Alat ini membantu apa?",
    "Boleh kamu bandingkan dua alat?",
    "Adakah alat ini ada di rumah?",
    "Apa bukti jawapan kamu?",
    "Bolehkah kamu terangkan semula?",
    "Bagaimana alat ini memudahkan kerja?",
    "Ciri mana yang paling jelas?",
    "Bolehkah kamu beri contoh teknologi lain?"
  ]
});

export default knowledge;
