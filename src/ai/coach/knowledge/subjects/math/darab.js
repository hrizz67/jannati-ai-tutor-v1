import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "darab",
  "displayName": "Darab",
  "learningObjectives": [
    "Memahami darab sebagai tambah berulang.",
    "Menggunakan fakta darab asas.",
    "Menyelesaikan soalan darab mudah."
  ],
  "teacherExplanation": [
    "Darab ialah tambah berulang.",
    "Kita boleh kumpulkan kumpulan yang sama untuk mencari hasil darab.",
    "Dalam Tahun 2, murid belajar fakta asas dan kumpulan mudah.",
    "Darab membantu kita mengira dengan lebih cepat."
  ],
  "simpleExplanation": "Darab ialah tambah berulang dalam kumpulan yang sama.",
  "workedExamples": [
    {
      "prompt": "3 × 2",
      "steps": [
        "3 kumpulan 2.",
        "2 + 2 + 2 = 6.",
        "Jawapan ialah 6."
      ],
      "answer": "6"
    },
    {
      "prompt": "4 × 2",
      "steps": [
        "4 kumpulan 2.",
        "2 + 2 + 2 + 2 = 8.",
        "Jawapan ialah 8."
      ],
      "answer": "8"
    },
    {
      "prompt": "5 × 3",
      "steps": [
        "5 kumpulan 3.",
        "3 + 3 + 3 + 3 + 3 = 15.",
        "Jawapan ialah 15."
      ],
      "answer": "15"
    },
    {
      "prompt": "2 × 6",
      "steps": [
        "2 kumpulan 6.",
        "6 + 6 = 12.",
        "Jawapan ialah 12."
      ],
      "answer": "12"
    },
    {
      "prompt": "1 × 7",
      "steps": [
        "1 kumpulan 7.",
        "Jawapan ialah 7."
      ],
      "answer": "7"
    }
  ],
  "examples": [
    "2 × 2",
    "3 × 3",
    "4 × 1",
    "5 × 2",
    "6 × 2",
    "7 × 1",
    "8 × 2",
    "9 × 1",
    "10 × 2",
    "2 × 5"
  ],
  "extraExamples": [
    "3 × 4",
    "4 × 3",
    "5 × 4",
    "2 × 7",
    "6 × 3",
    "3 × 5",
    "4 × 2",
    "5 × 1"
  ],
  "problemSolvingSteps": [
    "Cari kumpulan yang sama.",
    "Tukar kepada tambah berulang.",
    "Kira setiap kumpulan.",
    "Tulis hasil darab.",
    "Semak dengan lukisan atau objek."
  ],
  "tips": [
    "Fikir sebagai kumpulan yang sama.",
    "Gunakan tambah berulang jika perlu.",
    "Lukis titik atau kumpulan kecil.",
    "Hafal fakta darab asas yang mudah.",
    "Semak jawapan dengan kira balik."
  ],
  "memoryTips": [
    "Darab = kumpulan sama.",
    "Tambah berulang membantu.",
    "Kumpulan 3, 4 atau 5 boleh dilukis.",
    "Fakta asas penting.",
    "Semak dengan gambar."
  ],
  "commonMistakes": [
    "Keliru darab dengan tambah biasa.",
    "Tidak melihat bilangan kumpulan.",
    "Tersalah kira tambah berulang.",
    "Menulis hasil tanpa semak.",
    "Mengabaikan urutan faktor."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami darab dengan baik.",
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
      "Tak mengapa, cuba semak darab sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan darab.",
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
    "bahagi",
    "tambah",
    "jisim_isi_padu"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal darab sebagai kumpulan yang sama.",
    "SP": "Murid dapat menyelesaikan fakta darab asas dengan betul."
  },
  "keywords": [
    "darab",
    "kumpulan",
    "tambah berulang",
    "hasil darab",
    "faktor",
    "kira",
    "objek",
    "fakta",
    "bilangan",
    "berkumpulan",
    "cepat",
    "semak"
  ],
  "questionPatterns": [
    "Apakah hasil darab?",
    "Kira nombor berikut.",
    "Pilih jawapan yang betul.",
    "Berapa kumpulan ini?",
    "Cari hasil.",
    "Yang manakah jawapan tepat?",
    "Tentukan hasil darab.",
    "Berapakah jumlah kumpulan?"
  ],
  "wrongAnswerPatterns": [
    "Keliru dengan tambah biasa.",
    "Mengira kumpulan dengan salah.",
    "Tersalah menulis hasil.",
    "Tidak melihat bilangan kumpulan.",
    "Menjawab tanpa semak.",
    "Memilih jawapan yang tidak sepadan."
  ],
  "followUpQuestions": [
    "Berapa kumpulan ada?",
    "Apa yang ditambah berulang?",
    "Boleh kamu lukis kumpulan itu?",
    "Bagaimana kamu tahu hasilnya?",
    "Adakah jawapan ini munasabah?",
    "Boleh kamu semak dengan tambah?",
    "Apakah faktor dalam soalan ini?",
    "Bolehkah kamu kira sekali lagi?"
  ]
});

export default knowledge;
