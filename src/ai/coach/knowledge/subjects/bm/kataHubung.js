import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const pack = createKnowledgePack({
  "subjectId": "bm",
  "topicId": "kata_hubung",
  "displayName": "Kata Hubung",
  "learningObjectives": [
    "Mengenal kata hubung yang menyambungkan perkataan atau ayat.",
    "Memilih kata hubung yang sesuai dengan makna ayat.",
    "Memahami penggunaan dan, atau, tetapi, kerana dan lalu."
  ],
  "teacherExplanation": [
    "Kata hubung ialah perkataan yang menyambungkan perkataan, frasa atau ayat.",
    "Perkataan ini membantu ayat menjadi lancar dan tidak terputus-putus.",
    "Antara kata hubung yang biasa ialah dan, atau, tetapi, kerana dan lalu.",
    "Murid perlu membaca makna keseluruhan ayat sebelum memilih kata hubung."
  ],
  "simpleExplanation": "Kata hubung menyambungkan perkataan atau ayat.",
  "examples": [
    {
      "category": "menyambung",
      "value": "dan"
    },
    {
      "category": "pilihan",
      "value": "atau"
    },
    {
      "category": "bertentangan",
      "value": "tetapi"
    },
    {
      "category": "sebab",
      "value": "kerana"
    },
    {
      "category": "urutan",
      "value": "lalu"
    },
    {
      "category": "tujuan",
      "value": "supaya"
    },
    {
      "category": "bersama",
      "value": "serta"
    },
    {
      "category": "pilihan",
      "value": "mahupun"
    },
    {
      "category": "sebab",
      "value": "oleh sebab"
    },
    {
      "category": "masa",
      "value": "kemudian"
    }
  ],
  "extraExamples": [
    "dan",
    "atau",
    "tetapi",
    "kerana",
    "lalu",
    "supaya",
    "serta",
    "mahupun"
  ],
  "tips": [
    "Cari perkataan yang menyambungkan bahagian ayat.",
    "Perhatikan hubungan makna seperti sebab, pilihan atau lawan.",
    "Baca dua bahagian ayat dengan teliti.",
    "Kata hubung membuat ayat lebih lengkap.",
    "Jangan pilih perkataan yang tidak menyambung."
  ],
  "memoryTips": [
    "Dan = sambung.",
    "Atau = pilih.",
    "Tetapi = lawan.",
    "Kerana = sebab.",
    "Lalu = susulan."
  ],
  "commonMistakes": [
    "Memilih kata nama sebagai penyambung.",
    "Tidak memahami hubungan makna ayat.",
    "Keliru antara dan dan atau.",
    "Memilih kata kerja sebagai kata hubung.",
    "Menjawab tanpa membaca kedua-dua bahagian ayat."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu sudah memahami kata hubung dengan baik.",
      "Syabas! Jawapan kamu tepat untuk kata hubung.",
      "Hebat! Kamu semakin yakin dengan kata hubung.",
      "Tahniah! Kamu membaca soalan dengan teliti.",
      "Cemerlang! Kamu tahu cara mencari jawapan yang betul.",
      "Mantap! Penguasaan kamu semakin baik.",
      "Bagus sekali! Teruskan usaha ini.",
      "Syabas, kamu menjawab dengan yakin.",
      "Hebat, kamu sudah nampak idea utamanya.",
      "Tahniah, kamu sedang berkembang dengan baik."
    ],
    "retry": [
      "Tak mengapa, cuba cari petunjuk untuk kata hubung.",
      "Baca soalan sekali lagi dengan perlahan.",
      "Cari perkataan yang paling sesuai dalam ayat.",
      "Ambil masa dan cuba lagi.",
      "Kamu hampir betul, semak semula.",
      "Lihat maksud soalan dengan teliti.",
      "Fokus pada kata kunci yang penting.",
      "Tengok semula pilihan jawapan yang ada.",
      "Tak apa, cuba bezakan makna setiap jawapan.",
      "Baca semula ayat sebelum memilih."
    ],
    "excellent": [
      "Hebat! Kamu sangat mahir dengan kata hubung.",
      "Cemerlang! Kamu memahami topik ini dengan yakin.",
      "Tahniah! Penguasaan kamu sangat baik.",
      "Luar biasa! Kamu menjawab dengan tepat.",
      "Mantap! Kamu sudah nampak pola jawapan.",
      "Syabas! Kamu boleh teruskan dengan cabaran baharu.",
      "Bagus sekali! Kamu sangat teliti.",
      "Hebat benar! Teruskan kecemerlangan ini.",
      "Cemerlang! Kamu nampak bersedia untuk soalan lain.",
      "Tahniah! Kamu berjaya dengan sangat baik."
    ]
  },
  "relatedTopics": [
    "ayat",
    "tatabahasa",
    "bina_ayat",
    "imbuhan"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal dan menggunakan kata hubung dalam ayat mudah.",
    "SP": "Murid dapat memilih kata hubung yang sesuai mengikut makna ayat."
  },
  "keywords": [
    "dan",
    "atau",
    "tetapi",
    "kerana",
    "lalu",
    "supaya",
    "serta",
    "kata hubung",
    "sambung",
    "ayat",
    "hubungan",
    "pilihan"
  ],
  "questionPatterns": [
    "Apakah kata hubung yang sesuai?",
    "Pilih kata hubung yang betul.",
    "Yang manakah kata hubung?",
    "Cari perkataan yang menyambungkan ayat.",
    "Perkataan manakah menunjukkan sebab?",
    "Tentukan kata hubung yang betul.",
    "Apakah perkataan yang sesuai untuk pilihan?",
    "Pilih jawapan yang menyambungkan dua bahagian."
  ],
  "wrongAnswerPatterns": [
    "Memilih perkataan yang tidak menyambung.",
    "Keliru antara sebab dan pilihan.",
    "Memilih kata nama atau kata kerja.",
    "Tidak memahami hubungan dua bahagian ayat.",
    "Meneka tanpa membaca ayat penuh.",
    "Memilih jawapan yang tidak sesuai dengan makna."
  ],
  "followUpQuestions": [
    "Adakah ayat ini menunjukkan sebab atau pilihan?",
    "Bolehkah kamu guna kata hubung lain?",
    "Apa beza dan dan tetapi?",
    "Perkataan ini menyambungkan apa?",
    "Mana satu kata hubung sebab?",
    "Cuba bina ayat dengan kata hubung itu.",
    "Bolehkah kamu cari kata hubung lain dalam ayat?",
    "Bagaimana kata hubung membantu ayat?"
  ]
});

export default pack;
