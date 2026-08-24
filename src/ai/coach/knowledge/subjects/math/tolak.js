import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "tolak",
  "displayName": "Tolak",
  "learningObjectives": [
    "Menolak dua nombor dengan betul.",
    "Menggunakan tolak dalam situasi harian.",
    "Memahami strategi mengambil dan mengira semula."
  ],
  "teacherExplanation": [
    "Tolak bermaksud mengurangkan atau mengambil sebahagian daripada jumlah.",
    "Kita boleh tolak dengan kiraan terus atau menggunakan kaedah yang mudah.",
    "Dalam Tahun 2, murid belajar tolak nombor dua digit dan nombor ringkas lain.",
    "Tolak membantu kita mencari baki atau beza."
  ],
  "simpleExplanation": "Tolak ialah operasi untuk mencari baki atau beza.",
  "workedExamples": [
    {
      "prompt": "8 - 3",
      "steps": [
        "Mulakan dengan 8.",
        "Ambil 3.",
        "Baki ialah 5."
      ],
      "answer": "5"
    },
    {
      "prompt": "15 - 5",
      "steps": [
        "Tolak sa dahulu: 5 - 5 = 0.",
        "Puluh kekal 1.",
        "Jawapan ialah 10."
      ],
      "answer": "10"
    },
    {
      "prompt": "23 - 2",
      "steps": [
        "Tolak sa: 3 - 2 = 1.",
        "Puluh kekal 2.",
        "Jawapan ialah 21."
      ],
      "answer": "21"
    },
    {
      "prompt": "34 - 10",
      "steps": [
        "Tolak 1 puluh.",
        "34 - 10 = 24."
      ],
      "answer": "24"
    },
    {
      "prompt": "42 - 20",
      "steps": [
        "Tolak 2 puluh.",
        "42 - 20 = 22."
      ],
      "answer": "22"
    }
  ],
  "examples": [
    "9 - 1",
    "10 - 2",
    "12 - 4",
    "14 - 3",
    "20 - 5",
    "25 - 7",
    "30 - 8",
    "40 - 6",
    "50 - 9",
    "60 - 10"
  ],
  "extraExamples": [
    "11 - 1",
    "18 - 6",
    "21 - 3",
    "32 - 4",
    "44 - 2",
    "55 - 5",
    "67 - 7",
    "80 - 9"
  ],
  "problemSolvingSteps": [
    "Baca nombor asal.",
    "Tentukan nombor yang diambil.",
    "Tolak mengikut sa atau puluh.",
    "Tulis baki dengan betul.",
    "Semak semula jawapan."
  ],
  "tips": [
    "Baca nombor asal dahulu.",
    "Tolak sa sebelum puluh jika sesuai.",
    "Gunakan garis nombor jika perlu.",
    "Semak sama ada baki masuk akal.",
    "Baca soalan dengan teliti."
  ],
  "memoryTips": [
    "Tolak = ambil.",
    "Baki ialah apa yang tinggal.",
    "Sa dahulu, kemudian puluh.",
    "Semak jawapan.",
    "Kira semula jika perlu."
  ],
  "commonMistakes": [
    "Tersalah tolak sa.",
    "Mengambil nombor yang salah.",
    "Lupa baki.",
    "Tidak membaca soalan penuh.",
    "Menulis jawapan di tempat yang salah."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami tolak dengan baik.",
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
      "Tak mengapa, cuba semak tolak sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan tolak.",
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
    "wang",
    "masa"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Menolak nombor dan mencari baki.",
    "SP": "Murid dapat menolak nombor satu dan dua digit dengan betul."
  },
  "keywords": [
    "tolak",
    "baki",
    "ambil",
    "kurang",
    "beza",
    "sa",
    "puluh",
    "operasi",
    "kiraan",
    "nombor",
    "semak",
    "baki"
  ],
  "questionPatterns": [
    "Apakah baki?",
    "Kira hasil tolak.",
    "Pilih jawapan yang betul.",
    "Berapa baki ini?",
    "Tolak nombor berikut.",
    "Yang manakah jawapan tepat?",
    "Cari perbezaan.",
    "Tentukan hasil tolak."
  ],
  "wrongAnswerPatterns": [
    "Tersalah ambil nombor.",
    "Lupa baki.",
    "Mengira dengan tidak teliti.",
    "Tersalah menulis hasil.",
    "Tidak membaca nombor dengan betul.",
    "Memilih jawapan yang tidak masuk akal."
  ],
  "followUpQuestions": [
    "Apa yang perlu ditolak dahulu?",
    "Adakah jawapan ini baki?",
    "Boleh kamu kira sekali lagi?",
    "Bagaimana kamu dapat jawapan itu?",
    "Adakah baki ini munasabah?",
    "Boleh kamu semak dengan kaedah lain?",
    "Apakah nombor yang diambil?",
    "Bolehkah kamu tunjuk langkah kiraan?"
  ]
});

export default knowledge;
