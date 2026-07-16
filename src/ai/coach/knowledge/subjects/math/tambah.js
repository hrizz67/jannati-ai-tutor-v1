import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "tambah",
  "displayName": "Tambah",
  "learningObjectives": [
    "Menambah dua nombor dengan betul.",
    "Menggunakan tambah dalam situasi harian.",
    "Memahami strategi kiraan mudah."
  ],
  "teacherExplanation": [
    "Tambah bermaksud menggabungkan dua kuantiti.",
    "Kita boleh tambah menggunakan kiraan terus atau kumpul semula yang mudah.",
    "Dalam Tahun 2, murid belajar tambah nombor dua digit dan nombor ringkas lain.",
    "Penambahan membantu kita mencari jumlah keseluruhan."
  ],
  "simpleExplanation": "Tambah ialah operasi untuk mencari jumlah keseluruhan.",
  "workedExamples": [
    {
      "prompt": "24 + 5",
      "steps": [
        "Tambah sa dahulu: 4 + 5 = 9.",
        "Puluh kekal 2.",
        "Jawapan ialah 29."
      ],
      "answer": "29"
    },
    {
      "prompt": "13 + 12",
      "steps": [
        "Tambah sa: 3 + 2 = 5.",
        "Tambah puluh: 1 + 1 = 2.",
        "Jawapan ialah 25."
      ],
      "answer": "25"
    },
    {
      "prompt": "17 + 8",
      "steps": [
        "Tambah sa: 7 + 8 = 15.",
        "Tulis 5 dan bawa 1 puluh.",
        "1 puluh + 1 puluh = 2 puluh.",
        "Jawapan ialah 25."
      ],
      "answer": "25"
    },
    {
      "prompt": "35 + 10",
      "steps": [
        "Tambah 10 bermakna tambah 1 puluh.",
        "35 + 10 = 45."
      ],
      "answer": "45"
    },
    {
      "prompt": "48 + 20",
      "steps": [
        "Tambah 2 puluh kepada 48.",
        "48 + 20 = 68."
      ],
      "answer": "68"
    }
  ],
  "examples": [
    "2 + 3",
    "4 + 1",
    "5 + 5",
    "7 + 2",
    "10 + 6",
    "12 + 8",
    "14 + 5",
    "20 + 7",
    "30 + 9",
    "40 + 4"
  ],
  "extraExamples": [
    "8 + 1",
    "11 + 2",
    "15 + 3",
    "21 + 6",
    "32 + 5",
    "44 + 2",
    "50 + 8",
    "60 + 7"
  ],
  "problemSolvingSteps": [
    "Baca nombor dengan teliti.",
    "Tambah dari sa atau nombor paling kecil dahulu.",
    "Kumpul semula jika perlu.",
    "Tulis jawapan dengan kemas.",
    "Semak semula dengan kaedah lain."
  ],
  "tips": [
    "Tambah sa dahulu jika mudah.",
    "Gunakan jari atau gambar jika perlu.",
    "Semak jawapan dengan kira semula.",
    "Lihat sama ada ada kumpul semula.",
    "Baca ayat soalan sebelum mengira."
  ],
  "memoryTips": [
    "Tambah = gabung.",
    "Kira jumlah keseluruhan.",
    "Sa dahulu, kemudian puluh.",
    "Bawa satu jika perlu.",
    "Semak dengan kira balik."
  ],
  "commonMistakes": [
    "Tersalah tambah sa.",
    "Lupa kumpul semula.",
    "Tidak membaca soalan dengan teliti.",
    "Menulis jawapan di tempat yang salah.",
    "Mengira puluh sebagai sa."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami tambah dengan baik.",
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
      "Tak mengapa, cuba semak tambah sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan tambah.",
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
    "tolak",
    "wang",
    "masa"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Menambah nombor dan menyelesaikan soalan harian mudah.",
    "SP": "Murid dapat menambah nombor satu dan dua digit dengan betul."
  },
  "keywords": [
    "tambah",
    "jumlah",
    "gabung",
    "sa",
    "puluh",
    "kumpul semula",
    "operasi",
    "kiraan",
    "hasil",
    "nombor",
    "jumlah keseluruhan",
    "semak"
  ],
  "questionPatterns": [
    "Apakah jumlahnya?",
    "Kira hasil tambah.",
    "Pilih jawapan yang betul.",
    "Berapa hasil ini?",
    "Tambah nombor berikut.",
    "Yang manakah jawapan tepat?",
    "Cari jumlah keseluruhan.",
    "Tentukan hasil tambah."
  ],
  "wrongAnswerPatterns": [
    "Menambah pada bahagian yang salah.",
    "Lupa kumpul semula.",
    "Mengira dengan tidak teliti.",
    "Tersalah menulis hasil.",
    "Tidak membaca nombor dengan betul.",
    "Memilih jawapan yang terlalu kecil atau besar."
  ],
  "followUpQuestions": [
    "Apa yang perlu ditambah dahulu?",
    "Adakah perlu kumpul semula?",
    "Boleh kamu kira sekali lagi?",
    "Bagaimana kamu dapat jumlah itu?",
    "Adakah jawapan ini munasabah?",
    "Boleh kamu semak dengan kaedah lain?",
    "Apakah nombor seterusnya yang perlu dijumlahkan?",
    "Bolehkah kamu tunjuk langkah kiraan?"
  ]
});

export default knowledge;
