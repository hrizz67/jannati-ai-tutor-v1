import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "jisim_isi_padu",
  "displayName": "Jisim dan Isi Padu",
  "learningObjectives": [
    "Mengenal jisim dan isi padu secara asas.",
    "Memilih unit g, kg, mL dan L yang sesuai.",
    "Membandingkan objek dan cecair dengan betul."
  ],
  "teacherExplanation": [
    "Jisim ialah berat sesuatu objek dan isi padu ialah banyaknya cecair atau ruang yang diisi.",
    "Kita mengukur jisim dengan gram dan kilogram.",
    "Kita mengukur isi padu cecair dengan mililiter dan liter.",
    "Murid Tahun 2 belajar membandingkan dan memilih unit yang sesuai."
  ],
  "simpleExplanation": "Jisim ialah berat, dan isi padu ialah banyaknya cecair.",
  "workedExamples": [
    {
      "prompt": "500 g + 500 g",
      "steps": [
        "Tambah gram.",
        "500 + 500 = 1000.",
        "1000 g = 1 kg."
      ],
      "answer": "1 kg"
    },
    {
      "prompt": "2 kg + 1 kg",
      "steps": [
        "Tambah kilogram.",
        "2 + 1 = 3.",
        "Jawapan ialah 3 kg."
      ],
      "answer": "3 kg"
    },
    {
      "prompt": "250 mL + 250 mL",
      "steps": [
        "Tambah mililiter.",
        "250 + 250 = 500.",
        "Jawapan ialah 500 mL."
      ],
      "answer": "500 mL"
    },
    {
      "prompt": "1 L + 1 L",
      "steps": [
        "Tambah liter.",
        "1 + 1 = 2.",
        "Jawapan ialah 2 L."
      ],
      "answer": "2 L"
    },
    {
      "prompt": "1000 mL = ? L",
      "steps": [
        "1000 mL bersamaan 1 L.",
        "Jawapan ialah 1 L."
      ],
      "answer": "1 L"
    }
  ],
  "examples": [
    "100 g",
    "500 g",
    "1 kg",
    "2 kg",
    "250 mL",
    "500 mL",
    "1 L",
    "2 L",
    "750 mL",
    "300 g"
  ],
  "extraExamples": [
    "50 g",
    "150 g",
    "3 kg",
    "4 kg",
    "100 mL",
    "200 mL",
    "3 L",
    "5 L"
  ],
  "problemSolvingSteps": [
    "Baca unit dengan teliti.",
    "Tentukan sama ada objek atau cecair.",
    "Pilih g, kg, mL atau L yang sesuai.",
    "Tambah atau tolak dengan berhati-hati jika perlu.",
    "Semak jawapan dan unit."
  ],
  "tips": [
    "Gunakan g atau kg untuk jisim.",
    "Gunakan mL atau L untuk isi padu.",
    "Semak sama ada objek itu berat atau cecair.",
    "Ingat 1000 mL = 1 L.",
    "Bandingkan dengan objek sebenar jika boleh."
  ],
  "memoryTips": [
    "g kecil, kg besar.",
    "mL untuk sedikit cecair.",
    "L untuk lebih banyak cecair.",
    "Jisim ialah berat.",
    "Isi padu ialah cecair atau kapasiti."
  ],
  "commonMistakes": [
    "Tersalah guna unit jisim dan isi padu.",
    "Tidak membezakan g dan kg.",
    "Keliru mL dan L.",
    "Mengira nilai tanpa semak unit.",
    "Menjawab tanpa baca soalan penuh."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami jisim dan isi padu dengan baik.",
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
      "Tak mengapa, cuba semak jisim dan isi padu sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan jisim dan isi padu.",
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
    "panjang",
    "darab"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal dan menggunakan unit jisim serta isi padu asas.",
    "SP": "Murid dapat memilih unit yang sesuai dan membuat perbandingan mudah."
  },
  "keywords": [
    "g",
    "kg",
    "mL",
    "L",
    "jisim",
    "isi padu",
    "berat",
    "cecair",
    "unit",
    "ukur",
    "banding",
    "kapasiti"
  ],
  "questionPatterns": [
    "Apakah unit yang betul?",
    "Pilih jawapan yang sesuai.",
    "Bandingkan jisim ini.",
    "Bandingkan isi padu ini.",
    "Tentukan ukuran yang betul.",
    "Yang manakah lebih berat?",
    "Yang manakah lebih banyak cecair?",
    "Kira jumlahnya."
  ],
  "wrongAnswerPatterns": [
    "Keliru unit jisim dan isi padu.",
    "Tersalah guna g dan kg.",
    "Tersalah guna mL dan L.",
    "Mengira tanpa semak unit.",
    "Menjawab tanpa membaca soalan.",
    "Memilih unit yang tidak sesuai."
  ],
  "followUpQuestions": [
    "Adakah ini objek berat atau cecair?",
    "Boleh kamu pilih unit yang betul?",
    "Bagaimana kamu tahu jawapannya?",
    "Adakah 1000 mL sama dengan apa?",
    "Bolehkah kamu semak unitnya?",
    "Apa beza g dan kg?",
    "Apa beza mL dan L?",
    "Bolehkah kamu tunjuk contoh lain?"
  ]
});

export default knowledge;
