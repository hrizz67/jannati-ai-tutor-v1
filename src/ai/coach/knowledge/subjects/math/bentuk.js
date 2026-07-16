import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "bentuk",
  "displayName": "Bentuk 2D dan 3D",
  "learningObjectives": [
    "Mengenal bentuk 2D dan 3D.",
    "Menyebut ciri asas bentuk.",
    "Memadankan bentuk dengan objek harian."
  ],
  "teacherExplanation": [
    "Bentuk 2D mempunyai dua dimensi seperti panjang dan lebar.",
    "Bentuk 3D mempunyai panjang, lebar dan tinggi.",
    "Murid Tahun 2 belajar mengenal segi tiga, segi empat, segi empat tepat, kubus, kuboid dan sfera.",
    "Bentuk membantu kita melihat ciri objek di sekeliling."
  ],
  "simpleExplanation": "Bentuk 2D rata, manakala bentuk 3D mempunyai ruang.",
  "workedExamples": [
    {
      "prompt": "Pilih bentuk 2D.",
      "steps": [
        "2D ialah bentuk rata.",
        "Segi tiga ialah bentuk 2D.",
        "Jawapan ialah segi tiga."
      ],
      "answer": "segi tiga"
    },
    {
      "prompt": "Pilih bentuk 3D.",
      "steps": [
        "3D ada ruang dan tinggi.",
        "Kubus ialah bentuk 3D.",
        "Jawapan ialah kubus."
      ],
      "answer": "kubus"
    },
    {
      "prompt": "Bentuk mana ada 4 sisi?",
      "steps": [
        "Segi empat mempunyai 4 sisi.",
        "Jawapan ialah segi empat."
      ],
      "answer": "segi empat"
    },
    {
      "prompt": "Objek berbentuk bola?",
      "steps": [
        "Bola menyerupai sfera.",
        "Jawapan ialah sfera."
      ],
      "answer": "sfera"
    },
    {
      "prompt": "Kotak buku berbentuk apa?",
      "steps": [
        "Kotak buku menyerupai kuboid.",
        "Jawapan ialah kuboid."
      ],
      "answer": "kuboid"
    }
  ],
  "examples": [
    "segi tiga",
    "segi empat",
    "segi empat tepat",
    "bulat",
    "kubus",
    "kuboid",
    "sfera",
    "silinder",
    "kon",
    "prisma"
  ],
  "extraExamples": [
    "cakera",
    "bola",
    "kotak",
    "dadu",
    "tin",
    "topi parti",
    "buku",
    "piramid"
  ],
  "problemSolvingSteps": [
    "Lihat bentuk dengan teliti.",
    "Tentukan sama ada rata atau berisi.",
    "Kira sisi, bucu atau permukaan jika perlu.",
    "Bandingkan dengan objek harian.",
    "Semak jawapan bentuk yang sesuai."
  ],
  "tips": [
    "2D rata, 3D berisi.",
    "Cari sisi dan bucu jika perlu.",
    "Bandingkan dengan objek harian.",
    "Gunakan gambar bentuk sebagai petunjuk.",
    "Baca ciri bentuk dengan teliti."
  ],
  "memoryTips": [
    "2D = rata.",
    "3D = ada ruang.",
    "Segi tiga ada 3 sisi.",
    "Kubus seperti dadu.",
    "Sfera seperti bola."
  ],
  "commonMistakes": [
    "Mengelirukan bentuk 2D dan 3D.",
    "Tidak memeriksa sisi atau bucu.",
    "Memilih bentuk yang tidak sepadan.",
    "Menjawab tanpa melihat ciri bentuk.",
    "Mengabaikan objek harian sebagai petunjuk."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami bentuk dengan baik.",
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
      "Tak mengapa, cuba semak bentuk sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan bentuk.",
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
    "panjang",
    "jisim_isi_padu",
    "darab"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal bentuk 2D dan 3D asas.",
    "SP": "Murid dapat memadankan bentuk dengan ciri dan objek harian."
  },
  "keywords": [
    "2D",
    "3D",
    "segi tiga",
    "segi empat",
    "kubus",
    "kuboid",
    "sfera",
    "bentuk",
    "sisi",
    "bucu",
    "permukaan",
    "objek"
  ],
  "questionPatterns": [
    "Apakah bentuk ini?",
    "Pilih bentuk 2D.",
    "Pilih bentuk 3D.",
    "Yang manakah ada 4 sisi?",
    "Cari bentuk objek.",
    "Tentukan bentuk yang betul.",
    "Bentuk manakah ini?",
    "Apakah ciri bentuk ini?"
  ],
  "wrongAnswerPatterns": [
    "Mengelirukan 2D dan 3D.",
    "Tersalah pilih bentuk.",
    "Tidak melihat ciri bentuk.",
    "Meneka tanpa semak.",
    "Memilih bentuk yang tidak sepadan.",
    "Menjawab tanpa membaca petunjuk."
  ],
  "followUpQuestions": [
    "Adakah bentuk ini rata atau berisi?",
    "Bolehkah kamu kira sisi atau bucu?",
    "Bentuk ini seperti objek apa?",
    "Apa bezanya 2D dan 3D?",
    "Boleh kamu beri contoh lain?",
    "Bagaimana kamu tahu jawapannya?",
    "Adakah ini bentuk yang sama?",
    "Bolehkah kamu tunjuk ciri bentuk itu?"
  ]
});

export default knowledge;
