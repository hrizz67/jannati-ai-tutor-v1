import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "wang",
  "displayName": "Wang",
  "learningObjectives": [
    "Mengenal nilai wang RM dan sen.",
    "Mengira jumlah wang ringkas.",
    "Membuat pertukaran wang mudah."
  ],
  "teacherExplanation": [
    "Wang digunakan untuk membeli dan menjual barang.",
    "Kita membaca nilai RM dan sen dengan teliti.",
    "Dalam Tahun 2, murid belajar mengenal syiling, wang kertas dan jumlah wang.",
    "Wang membantu kita membuat kiraan yang tepat dalam kehidupan harian."
  ],
  "simpleExplanation": "Wang ialah nilai yang digunakan untuk membeli sesuatu.",
  "workedExamples": [
    {
      "prompt": "RM1 + 50 sen",
      "steps": [
        "RM1 dan 50 sen dijumlahkan.",
        "Jawapan ialah RM1.50."
      ],
      "answer": "RM1.50"
    },
    {
      "prompt": "RM2 + RM3",
      "steps": [
        "Tambah nilai ringgit.",
        "2 + 3 = 5.",
        "Jawapan ialah RM5."
      ],
      "answer": "RM5"
    },
    {
      "prompt": "80 sen + 20 sen",
      "steps": [
        "80 sen + 20 sen = 100 sen.",
        "100 sen = RM1."
      ],
      "answer": "RM1"
    },
    {
      "prompt": "RM5 - RM2",
      "steps": [
        "Tolak ringgit.",
        "5 - 2 = 3.",
        "Jawapan ialah RM3."
      ],
      "answer": "RM3"
    },
    {
      "prompt": "RM10 - RM4",
      "steps": [
        "10 - 4 = 6.",
        "Jawapan ialah RM6."
      ],
      "answer": "RM6"
    }
  ],
  "examples": [
    "RM1",
    "RM2",
    "50 sen",
    "20 sen",
    "RM5",
    "RM10",
    "RM3 dan 20 sen",
    "RM4 dan 50 sen",
    "RM7",
    "RM8 dan 10 sen"
  ],
  "extraExamples": [
    "10 sen",
    "30 sen",
    "RM6",
    "RM9 dan 50 sen",
    "RM12",
    "RM15",
    "40 sen",
    "RM20"
  ],
  "problemSolvingSteps": [
    "Baca nilai RM dan sen.",
    "Tambah atau tolak dengan teliti.",
    "Ingat 100 sen = RM1.",
    "Tulis jumlah wang dengan betul.",
    "Semak semula nilai akhir."
  ],
  "tips": [
    "Lihat sama ada nilai itu ringgit atau sen.",
    "Ingat 100 sen bersamaan RM1.",
    "Gunakan jadual wang jika perlu.",
    "Baca nombor dengan teliti.",
    "Semak pertukaran wang."
  ],
  "memoryTips": [
    "RM untuk ringgit.",
    "sen untuk nilai kecil.",
    "100 sen = RM1.",
    "Tambah nilai wang dengan teliti.",
    "Semak jumlah akhir."
  ],
  "commonMistakes": [
    "Tersalah baca RM dan sen.",
    "Lupa menukar 100 sen kepada RM1.",
    "Menjumlahkan nilai secara salah.",
    "Tidak memeriksa unit wang.",
    "Menulis jawapan tanpa tanda RM atau sen."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami wang dengan baik.",
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
      "Tak mengapa, cuba semak wang sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan wang.",
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
    "tambah",
    "tolak",
    "masa"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal dan menggunakan wang ringgit dan sen.",
    "SP": "Murid dapat mengira jumlah wang mudah dan menukar sen kepada ringgit."
  },
  "keywords": [
    "RM",
    "sen",
    "wang",
    "ringgit",
    "jumlah",
    "beli",
    "jual",
    "syiling",
    "wang kertas",
    "pertukaran",
    "nilai",
    "kira"
  ],
  "questionPatterns": [
    "Apakah jumlah wang?",
    "Kira nilai wang.",
    "Pilih jawapan yang betul.",
    "Berapa harga ini?",
    "Cari jumlah keseluruhan.",
    "Yang manakah jawapan tepat?",
    "Tentukan nilai wang.",
    "Berapakah pertukaran wang?"
  ],
  "wrongAnswerPatterns": [
    "Tersalah baca RM dan sen.",
    "Lupa menukar 100 sen.",
    "Mengira jumlah salah.",
    "Tidak memeriksa unit wang.",
    "Menjawab tanpa semak.",
    "Memilih jawapan yang tidak sepadan."
  ],
  "followUpQuestions": [
    "Adakah ini ringgit atau sen?",
    "Boleh kamu jumlahkan sekali lagi?",
    "Bagaimana kamu menukar sen kepada RM?",
    "Apakah nilai akhir?",
    "Adakah jawapan ini munasabah?",
    "Boleh kamu semak unitnya?",
    "Berapa baki wang itu?",
    "Bolehkah kamu tunjuk kiraan wang?"
  ]
});

export default knowledge;
