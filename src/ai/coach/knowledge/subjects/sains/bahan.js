import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Bahan dengan baik.",
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
      "Tak mengapa, cuba semak Bahan sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Bahan.",
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
  "topicId": "bahan",
  "displayName": "Bahan",
  "learningObjectives": [
    "Mengenal bahan dan sifat asasnya.",
    "Membezakan bahan lembut, keras, lutsinar dan legap secara mudah.",
    "Menghubungkan bahan dengan kegunaan harian."
  ],
  "teacherExplanation": [
    "Bahan ialah sesuatu yang digunakan untuk membuat objek.",
    "Setiap bahan mempunyai sifat seperti keras, lembut, lutsinar atau legap.",
    "Kita memilih bahan berdasarkan kegunaan dan cirinya.",
    "Murid Tahun 2 belajar memerhati bahan yang ada di sekeliling mereka."
  ],
  "simpleExplanation": "Bahan ialah benda yang digunakan untuk membuat sesuatu objek.",
  "workedExamples": [
    {
      "prompt": "Bahan untuk membuat meja?",
      "steps": [
        "Meja sering dibuat daripada kayu atau plastik.",
        "Kayu ialah bahan yang keras.",
        "Jawapan: kayu."
      ],
      "answer": "kayu"
    },
    {
      "prompt": "Bahan lutsinar?",
      "steps": [
        "Lutsinar boleh ditembusi cahaya.",
        "Contohnya kaca.",
        "Jawapan: kaca."
      ],
      "answer": "kaca"
    },
    {
      "prompt": "Bahan lembut?",
      "steps": [
        "Kain ialah bahan yang lembut.",
        "Jawapan: kain."
      ],
      "answer": "kain"
    },
    {
      "prompt": "Bahan legap?",
      "steps": [
        "Bahan legap tidak ditembusi cahaya.",
        "Contohnya kadbod.",
        "Jawapan: kadbod."
      ],
      "answer": "kadbod"
    },
    {
      "prompt": "Bahan untuk botol air?",
      "steps": [
        "Botol air boleh dibuat daripada plastik.",
        "Jawapan: plastik."
      ],
      "answer": "plastik"
    }
  ],
  "examples": [
    "kayu",
    "plastik",
    "kain",
    "kaca",
    "logam",
    "getah",
    "kadbod",
    "kertas",
    "span",
    "batu"
  ],
  "extraExamples": [
    "besi",
    "baju",
    "benang",
    "syiling",
    "cawan kaca",
    "baldi plastik",
    "tali getah",
    "kotak kadbod"
  ],
  "problemSolvingSteps": [
    "Kenal pasti objek yang dibuat.",
    "Fikir sifat bahan.",
    "Bandingkan bahan yang ada.",
    "Pilih bahan yang sesuai.",
    "Semak sama ada jawapan logik."
  ],
  "tips": [
    "Lihat sifat bahan dahulu.",
    "Fikir kegunaan objek itu.",
    "Bandingkan keras, lembut, lutsinar dan legap.",
    "Baca soalan dengan teliti.",
    "Pilih bahan yang betul."
  ],
  "memoryTips": [
    "Bahan buat objek.",
    "Keras lawan lembut.",
    "Lutsinar lawan legap.",
    "Pilih ikut kegunaan.",
    "Bahan ada sifat berbeza."
  ],
  "commonMistakes": [
    "Mengelirukan bahan dan objek.",
    "Tidak melihat sifat bahan.",
    "Keliru lutsinar dan legap.",
    "Memilih bahan yang tidak sesuai.",
    "Meneka tanpa bukti."
  ],
  "scientificFacts": [
    "Bahan digunakan untuk membuat objek.",
    "Bahan mempunyai sifat yang berbeza.",
    "Kaca lutsinar.",
    "Kadbod legap.",
    "Kayu dan logam keras.",
    "Kain biasanya lembut.",
    "Plastik boleh digunakan untuk banyak objek.",
    "Bahan dipilih mengikut kegunaan."
  ],
  "observationPrompts": [
    "Perhatikan sifat bahan.",
    "Bandingkan bahan keras dan lembut.",
    "Lihat bahan lutsinar dan legap.",
    "Cari bahan dalam objek harian.",
    "Perhatikan tekstur bahan.",
    "Bandingkan kegunaan bahan."
  ],
  "comparisonPrompts": [
    "Bandingkan kayu dan kain.",
    "Bandingkan kaca dan kadbod.",
    "Bandingkan bahan keras dan lembut.",
    "Bandingkan bahan lutsinar dan legap.",
    "Bandingkan bahan dalam rumah."
  ],
  "investigationIdeas": [
    "Kumpulkan bahan di kelas.",
    "Padankan objek dengan bahan.",
    "Buat carta sifat bahan.",
    "Lihat bahan dalam barang harian."
  ],
  "realLifeConnections": [
    "Bahan ada pada pakaian dan perabot.",
    "Kita pilih bahan untuk kegunaan tertentu.",
    "Rumah dibuat daripada bahan yang berbeza.",
    "Mainan juga diperbuat daripada bahan.",
    "Bahan membantu kehidupan harian."
  ],
  "safetyNotes": [
    "Berhati-hati dengan bahan tajam.",
    "Jangan sentuh kaca pecah.",
    "Gunakan bahan dengan selamat."
  ],
  "misconceptions": [
    "Semua bahan sama.",
    "Kaca dan plastik sama sifat.",
    "Bahan tidak penting.",
    "Bahan tidak ada sifat.",
    "Semua bahan boleh digunakan untuk semua objek."
  ],
  "evidenceQuestions": [
    "Apa bukti bahan ini lutsinar?",
    "Mengapa bahan ini sesuai?",
    "Bagaimana kamu tahu bahan itu keras?",
    "Boleh kamu beri bukti daripada objek?",
    "Mengapa kamu memilih jawapan itu?",
    "Apa sifat bahan ini?"
  ],
  "relatedTopics": [
    "bumi",
    "teknologi",
    "cahaya",
    "haiwan"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal bahan dan sifat asasnya.",
    "SP": "Murid dapat memerhati, membandingkan dan memilih bahan yang sesuai."
  },
  "keywords": [
    "bahan",
    "kayu",
    "plastik",
    "kaca",
    "kain",
    "logam",
    "getah",
    "keras",
    "lembut",
    "lutsinar",
    "legap",
    "objek"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang bahan?",
    "Pilih jawapan yang sesuai tentang bahan.",
    "Yang manakah berkaitan dengan bahan?",
    "Cari maklumat yang betul tentang bahan.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih bahan yang salah.",
    "Tidak melihat sifat bahan.",
    "Keliru lutsinar dan legap.",
    "Meneka tanpa bukti.",
    "Mengabaikan kegunaan objek.",
    "Memilih fakta yang salah."
  ],
  "followUpQuestions": [
    "Sifat bahan mana yang jelas?",
    "Boleh kamu bandingkan dua bahan?",
    "Bahan ini sesuai untuk apa?",
    "Apa bukti jawapan kamu?",
    "Bolehkah kamu terangkan semula?",
    "Adakah bahan ini keras atau lembut?",
    "Ciri mana yang paling jelas?",
    "Bolehkah kamu tunjuk objek yang dibuat daripada bahan itu?"
  ]
});

export default knowledge;
