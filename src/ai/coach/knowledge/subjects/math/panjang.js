import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "panjang",
  "displayName": "Panjang",
  "learningObjectives": [
    "Mengukur dan membandingkan panjang objek.",
    "Menggunakan cm dan m dengan betul.",
    "Menyelesaikan soalan panjang mudah."
  ],
  "teacherExplanation": [
    "Panjang membantu kita mengetahui saiz sesuatu objek dari hujung ke hujung.",
    "Kita boleh mengukur menggunakan sentimeter dan meter.",
    "Dalam Tahun 2, murid belajar membandingkan panjang dan memilih unit yang sesuai.",
    "Panjang berguna untuk peralatan, bilik dan objek harian."
  ],
  "simpleExplanation": "Panjang menunjukkan ukuran dari hujung ke hujung.",
  "workedExamples": [
    {
      "prompt": "10 cm + 5 cm",
      "steps": [
        "Tambah sentimeter.",
        "10 + 5 = 15.",
        "Jawapan ialah 15 cm."
      ],
      "answer": "15 cm"
    },
    {
      "prompt": "2 m + 1 m",
      "steps": [
        "Tambah meter.",
        "2 + 1 = 3.",
        "Jawapan ialah 3 m."
      ],
      "answer": "3 m"
    },
    {
      "prompt": "100 cm = ? m",
      "steps": [
        "100 cm bersamaan 1 m.",
        "Jawapan ialah 1 m."
      ],
      "answer": "1 m"
    },
    {
      "prompt": "3 m - 1 m",
      "steps": [
        "Tolak meter.",
        "3 - 1 = 2.",
        "Jawapan ialah 2 m."
      ],
      "answer": "2 m"
    },
    {
      "prompt": "40 cm + 20 cm",
      "steps": [
        "Tambah cm.",
        "40 + 20 = 60.",
        "Jawapan ialah 60 cm."
      ],
      "answer": "60 cm"
    }
  ],
  "examples": [
    "5 cm",
    "12 cm",
    "20 cm",
    "30 cm",
    "1 m",
    "2 m",
    "50 cm",
    "60 cm",
    "70 cm",
    "80 cm"
  ],
  "extraExamples": [
    "15 cm",
    "25 cm",
    "35 cm",
    "90 cm",
    "100 cm",
    "3 m",
    "4 m",
    "120 cm"
  ],
  "problemSolvingSteps": [
    "Baca ukuran dengan teliti.",
    "Pilih cm atau m yang betul.",
    "Bandingkan ukuran jika perlu.",
    "Tambah atau tolak ukuran dengan berhati-hati.",
    "Semak unit pada jawapan akhir."
  ],
  "tips": [
    "Gunakan cm untuk objek kecil.",
    "Gunakan m untuk objek lebih panjang.",
    "Semak unit pada jawapan.",
    "Bandingkan ukuran dari hujung ke hujung.",
    "Baca nombor dengan teliti."
  ],
  "memoryTips": [
    "cm kecil, m besar.",
    "Panjang diukur hujung ke hujung.",
    "100 cm = 1 m.",
    "Semak unit setiap masa.",
    "Bandingkan dua objek."
  ],
  "commonMistakes": [
    "Tersalah guna cm dan m.",
    "Mengira panjang tanpa unit.",
    "Tidak membandingkan hujung ke hujung.",
    "Menambah ukuran secara salah.",
    "Menulis jawapan tanpa semak unit."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami panjang dengan baik.",
      "Syabas! Jawapan kamu betul.",
      "Hebat! Kamu membaca soalan dengan teliti.",
      "Tahniah! Kamu semakin yakin.",
      "Cemerlang! Kamu membuat pilihan yang tepat.",
      "Mantap! Teruskan usaha ini.",
      "Bagus sekali! Kamu sudah berada pada jalan yang betul.",
      "Hebat benar! Kamu sangat teliti.",
      "Syabas, kamu menyelesaikan soalan ini dengan baik.",
      "Tahniah, kamu semakin mahir."
    ],
    "retry": [
      "Tak mengapa, cuba semak panjang sekali lagi.",
      "Baca soalan dengan perlahan.",
      "Fikirkan operasi atau langkah yang sesuai.",
      "Ambil masa dan cuba lagi.",
      "Semak jawapan sebelum memilih.",
      "Lihat nombor dan unit dengan teliti.",
      "Cuba kira sekali lagi.",
      "Fokus pada kata kunci soalan.",
      "Kamu hampir betul, jangan putus asa.",
      "Baca semula langkah satu demi satu."
    ],
    "excellent": [
      "Hebat! Kamu sangat mahir dengan panjang.",
      "Cemerlang! Kamu memahami topik ini dengan yakin.",
      "Luar biasa! Penguasaan kamu sangat baik.",
      "Brilliant! Kamu menjawab dengan tepat.",
      "Mantap! Kamu boleh teruskan ke cabaran baharu.",
      "Syabas! Kamu membuat kiraan dengan sangat teliti.",
      "Bagus sekali! Kamu sangat yakin.",
      "Hebat benar! Teruskan kecemerlangan ini.",
      "Tahniah! Kamu sangat bersedia.",
      "Fantastic! Kamu telah melakukan yang terbaik."
    ]
  },
  "relatedTopics": [
    "nombor",
    "wang",
    "masa",
    "jisim_isi_padu"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengukur dan membandingkan panjang.",
    "SP": "Murid dapat menggunakan unit panjang yang sesuai dan membuat perbandingan mudah."
  },
  "keywords": [
    "cm",
    "m",
    "panjang",
    "ukur",
    "banding",
    "ukuran",
    "hujung",
    "unit",
    "meter",
    "sentimeter",
    "lebih panjang",
    "lebih pendek"
  ],
  "questionPatterns": [
    "Apakah panjang objek ini?",
    "Pilih unit yang betul.",
    "Kira panjang keseluruhan.",
    "Yang manakah lebih panjang?",
    "Cari ukuran yang sesuai.",
    "Tentukan panjangnya.",
    "Berapakah ukuran ini?",
    "Bandingkan dua objek."
  ],
  "wrongAnswerPatterns": [
    "Tersalah guna cm dan m.",
    "Tidak membaca unit.",
    "Mengira ukuran dengan salah.",
    "Tidak membandingkan dengan betul.",
    "Menjawab tanpa semak.",
    "Memilih unit yang tidak sesuai."
  ],
  "followUpQuestions": [
    "Adakah ini cm atau m?",
    "Boleh kamu ukur sekali lagi?",
    "Objek mana lebih panjang?",
    "Bagaimana kamu tahu unitnya?",
    "Adakah jawapan ini masuk akal?",
    "Bolehkah kamu semak hujung ke hujung?",
    "Apa beza cm dan m?",
    "Bolehkah kamu tunjuk ukuran itu?"
  ]
});

export default knowledge;
