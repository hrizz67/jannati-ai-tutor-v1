import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "masa",
  "displayName": "Masa dan Waktu",
  "learningObjectives": [
    "Membaca jam dan waktu asas.",
    "Menentukan masa sebelum dan selepas.",
    "Menggunakan waktu dalam situasi harian."
  ],
  "teacherExplanation": [
    "Masa dan waktu membantu kita tahu bila sesuatu berlaku.",
    "Kita boleh membaca jam analog dan jam digital.",
    "Dalam Tahun 2, murid belajar jam, jam setengah, jam suku dan waktu harian mudah.",
    "Masa penting untuk rutin sekolah dan kehidupan seharian."
  ],
  "simpleExplanation": "Masa menunjukkan bila sesuatu berlaku.",
  "workedExamples": [
    {
      "prompt": "Jam 3:00",
      "steps": [
        "Jarum pendek pada 3.",
        "Jarum panjang pada 12.",
        "Waktu ialah pukul 3.00."
      ],
      "answer": "pukul 3.00"
    },
    {
      "prompt": "Jam 4:30",
      "steps": [
        "Jarum panjang pada 6.",
        "Ini setengah jam.",
        "Waktu ialah pukul 4.30."
      ],
      "answer": "pukul 4.30"
    },
    {
      "prompt": "Jam 5:15",
      "steps": [
        "Jarum panjang pada 3.",
        "Ini suku jam.",
        "Waktu ialah pukul 5.15."
      ],
      "answer": "pukul 5.15"
    },
    {
      "prompt": "1 jam selepas 2.00",
      "steps": [
        "Tambah 1 jam.",
        "2.00 + 1 jam = 3.00."
      ],
      "answer": "pukul 3.00"
    },
    {
      "prompt": "30 minit selepas 6.00",
      "steps": [
        "30 minit = setengah jam.",
        "6.00 + 30 minit = 6.30."
      ],
      "answer": "pukul 6.30"
    }
  ],
  "examples": [
    "pukul 1.00",
    "pukul 2.30",
    "pukul 3.15",
    "pukul 4.00",
    "pukul 5.45",
    "pukul 6.30",
    "pukul 7.00",
    "pukul 8.15",
    "pukul 9.30",
    "pukul 10.00"
  ],
  "extraExamples": [
    "pagi",
    "tengah hari",
    "petang",
    "malam",
    "jam digital",
    "jam analog",
    "setengah jam",
    "suku jam"
  ],
  "problemSolvingSteps": [
    "Baca jarum jam atau nombor digital.",
    "Tentukan jam dan minit.",
    "Jika perlu, tambah atau tolak masa.",
    "Tulis jawapan dengan jelas.",
    "Semak sama ada waktu itu masuk akal."
  ],
  "tips": [
    "Lihat jarum pendek dan jarum panjang.",
    "Ingat 30 minit = setengah jam.",
    "Ingat 15 minit = suku jam.",
    "Baca waktu harian dengan teliti.",
    "Semak sama ada jawapan sudah betul."
  ],
  "memoryTips": [
    "Jarum pendek = jam.",
    "Jarum panjang = minit.",
    "30 minit setengah jam.",
    "15 minit suku jam.",
    "Baca jam perlahan-lahan."
  ],
  "commonMistakes": [
    "Mengelirukan jarum pendek dan panjang.",
    "Tersalah baca setengah jam.",
    "Tidak melihat nombor digital dengan betul.",
    "Lupa menambah masa.",
    "Menjawab tanpa semak waktu."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami masa dan waktu dengan baik.",
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
      "Tak mengapa, cuba semak masa dan waktu sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan masa dan waktu.",
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
    "tambah"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Membaca dan menentukan waktu asas.",
    "SP": "Murid dapat membaca jam dan menyatakan masa mudah."
  },
  "keywords": [
    "masa",
    "waktu",
    "jam",
    "minit",
    "setengah",
    "suku",
    "jarum",
    "digital",
    "analog",
    "pagi",
    "petang",
    "malam"
  ],
  "questionPatterns": [
    "Pukul berapakah ini?",
    "Apakah masa yang betul?",
    "Pilih waktu yang sesuai.",
    "Jam manakah menunjukkan masa ini?",
    "Cari waktu selepas itu.",
    "Yang manakah waktu tepat?",
    "Tentukan masa yang betul.",
    "Berapakah waktu pada jam ini?"
  ],
  "wrongAnswerPatterns": [
    "Mengelirukan jarum jam.",
    "Tersalah baca minit.",
    "Tidak memahami setengah jam.",
    "Lupa menambah masa.",
    "Menjawab tanpa semak jam.",
    "Memilih waktu yang tidak masuk akal."
  ],
  "followUpQuestions": [
    "Jarum mana yang pendek?",
    "Jarum mana yang panjang?",
    "Bolehkah kamu baca jam itu sekali lagi?",
    "Adakah ini setengah jam?",
    "Berapa minit selepas jam ini?",
    "Adakah jawapan ini munasabah?",
    "Boleh kamu semak waktu digital?",
    "Apakah waktu sebelum atau selepas ini?"
  ]
});

export default knowledge;
