import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "bahagi",
  "displayName": "Bahagi",
  "learningObjectives": [
    "Memahami bahagi sebagai agihan sama rata.",
    "Menyelesaikan soalan bahagi mudah.",
    "Menggunakan bahagi dalam situasi harian."
  ],
  "teacherExplanation": [
    "Bahagi bermaksud membahagi sama rata.",
    "Kita boleh kumpulkan benda secara sama banyak.",
    "Dalam Tahun 2, murid belajar bahagi secara mudah melalui agihan dan kumpulan.",
    "Bahagi membantu kita memastikan setiap kumpulan sama banyak."
  ],
  "simpleExplanation": "Bahagi ialah membahagi sama rata kepada kumpulan.",
  "workedExamples": [
    {
      "prompt": "6 ÷ 2",
      "steps": [
        "Bahagi 6 kepada 2 kumpulan.",
        "Setiap kumpulan dapat 3.",
        "Jawapan ialah 3."
      ],
      "answer": "3"
    },
    {
      "prompt": "8 ÷ 4",
      "steps": [
        "Bahagi 8 kepada 4 kumpulan.",
        "Setiap kumpulan dapat 2.",
        "Jawapan ialah 2."
      ],
      "answer": "2"
    },
    {
      "prompt": "10 ÷ 2",
      "steps": [
        "Bahagi 10 kepada 2 kumpulan.",
        "Setiap kumpulan dapat 5.",
        "Jawapan ialah 5."
      ],
      "answer": "5"
    },
    {
      "prompt": "12 ÷ 3",
      "steps": [
        "Bahagi 12 kepada 3 kumpulan.",
        "Setiap kumpulan dapat 4.",
        "Jawapan ialah 4."
      ],
      "answer": "4"
    },
    {
      "prompt": "9 ÷ 3",
      "steps": [
        "Bahagi 9 kepada 3 kumpulan.",
        "Setiap kumpulan dapat 3.",
        "Jawapan ialah 3."
      ],
      "answer": "3"
    }
  ],
  "examples": [
    "4 ÷ 2",
    "6 ÷ 3",
    "8 ÷ 2",
    "12 ÷ 4",
    "14 ÷ 2",
    "15 ÷ 5",
    "18 ÷ 3",
    "20 ÷ 4",
    "24 ÷ 6",
    "30 ÷ 5"
  ],
  "extraExamples": [
    "2 ÷ 1",
    "3 ÷ 1",
    "5 ÷ 5",
    "7 ÷ 7",
    "16 ÷ 4",
    "21 ÷ 3",
    "28 ÷ 7",
    "36 ÷ 6"
  ],
  "problemSolvingSteps": [
    "Baca jumlah asal.",
    "Bahagi kepada kumpulan yang sama.",
    "Hitung bilangan dalam setiap kumpulan.",
    "Tulis jawapan dengan betul.",
    "Semak sama ada agihan seimbang."
  ],
  "tips": [
    "Fikir tentang agihan sama rata.",
    "Gunakan gambar atau objek jika perlu.",
    "Semak sama ada semua kumpulan sama banyak.",
    "Mulakan dengan nombor yang mudah.",
    "Baca soalan dengan teliti."
  ],
  "memoryTips": [
    "Bahagi = sama rata.",
    "Kumpulan mesti sama.",
    "Setiap kumpulan sama banyak.",
    "Lukis jika perlu.",
    "Semak baki atau lebihan."
  ],
  "commonMistakes": [
    "Mengagih tidak sama rata.",
    "Mengira kumpulan dengan salah.",
    "Tidak membaca nombor dengan betul.",
    "Menulis jawapan tanpa semak.",
    "Keliru antara bahagi dan darab."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami bahagi dengan baik.",
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
      "Tak mengapa, cuba semak bahagi sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan bahagi.",
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
    "darab",
    "tambah",
    "tolak"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Membahagi nombor secara sama rata.",
    "SP": "Murid dapat mencari hasil bahagi mudah dengan betul."
  },
  "keywords": [
    "bahagi",
    "sama rata",
    "kumpulan",
    "agihan",
    "setiap",
    "baki",
    "kira",
    "hasil",
    "nombor",
    "kongsi",
    "semak",
    "objek"
  ],
  "questionPatterns": [
    "Apakah hasil bahagi?",
    "Kira nombor berikut.",
    "Pilih jawapan yang betul.",
    "Berapa setiap kumpulan?",
    "Cari hasil.",
    "Yang manakah jawapan tepat?",
    "Tentukan hasil bahagi.",
    "Berapakah agihan sama rata?"
  ],
  "wrongAnswerPatterns": [
    "Agihan tidak sama rata.",
    "Mengira kumpulan dengan salah.",
    "Tersalah menulis hasil.",
    "Tidak melihat bilangan kumpulan.",
    "Menjawab tanpa semak.",
    "Memilih jawapan yang tidak sepadan."
  ],
  "followUpQuestions": [
    "Berapa kumpulan ada?",
    "Apa yang perlu dibahagi?",
    "Boleh kamu lukis kumpulan itu?",
    "Bagaimana kamu tahu hasilnya?",
    "Adakah jawapan ini munasabah?",
    "Boleh kamu semak dengan gambar?",
    "Apakah bilangan setiap kumpulan?",
    "Bolehkah kamu kira sekali lagi?"
  ]
});

export default knowledge;
