import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const pack = createKnowledgePack({
  "subjectId": "bm",
  "topicId": "ayat",
  "displayName": "Ayat",
  "learningObjectives": [
    "Mengenal ayat yang lengkap dan betul.",
    "Memilih ayat yang mempunyai subjek dan predikat.",
    "Memahami tanda baca asas dalam ayat."
  ],
  "teacherExplanation": [
    "Ayat ialah susunan perkataan yang menyampaikan makna lengkap.",
    "Ayat yang baik biasanya ada subjek dan predikat.",
    "Tanda baca seperti titik, tanda soal dan tanda seru membantu ayat difahami.",
    "Murid perlu membaca ayat penuh untuk melihat maksud sebenar."
  ],
  "simpleExplanation": "Ayat yang betul menyampaikan makna lengkap.",
  "examples": [
    {
      "category": "ayat",
      "value": "Ali pergi ke sekolah."
    },
    {
      "category": "ayat",
      "value": "Ibu memasak nasi."
    },
    {
      "category": "ayat",
      "value": "Bolehkah kamu membaca?"
    },
    {
      "category": "ayat",
      "value": "Wah, cantiknya taman itu!"
    },
    {
      "category": "ayat",
      "value": "Murid itu sedang menulis."
    },
    {
      "category": "ayat",
      "value": "Kucing itu tidur di kerusi."
    },
    {
      "category": "ayat",
      "value": "Adik bermain bola."
    },
    {
      "category": "ayat",
      "value": "Ayah membaiki basikal."
    },
    {
      "category": "ayat",
      "value": "Kami ke perpustakaan."
    },
    {
      "category": "ayat",
      "value": "Guru menjelaskan pelajaran."
    }
  ],
  "extraExamples": [
    "Mereka sedang beratur.",
    "Rumah itu besar.",
    "Mari kita belajar.",
    "Apakah kamu faham?",
    "Tolong tutup pintu.",
    "Pokok itu tinggi.",
    "Saya suka membaca.",
    "Jangan berlari di kelas."
  ],
  "tips": [
    "Pastikan ayat ada makna yang lengkap.",
    "Cari subjek dan predikat secara mudah.",
    "Semak tanda baca di hujung ayat.",
    "Baca ayat dengan kuat untuk melihat bunyinya.",
    "Jangan pilih susunan perkataan yang tidak lengkap."
  ],
  "memoryTips": [
    "Ayat lengkap = ada maksud.",
    "Baca keseluruhan ayat.",
    "Titik, soal, seru.",
    "Subjek dan predikat.",
    "Ayat yang baik mudah difahami."
  ],
  "commonMistakes": [
    "Memilih rangkaian perkataan yang tidak lengkap.",
    "Tidak melihat tanda baca yang betul.",
    "Mengabaikan subjek atau predikat.",
    "Meneka tanpa membaca maksud ayat.",
    "Memilih ayat yang tidak sesuai dengan soalan."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu sudah memahami ayat dengan baik.",
      "Syabas! Jawapan kamu tepat untuk ayat.",
      "Hebat! Kamu semakin yakin dengan ayat.",
      "Tahniah! Kamu membaca soalan dengan teliti.",
      "Cemerlang! Kamu tahu cara mencari jawapan yang betul.",
      "Mantap! Penguasaan kamu semakin baik.",
      "Bagus sekali! Teruskan usaha ini.",
      "Syabas, kamu menjawab dengan yakin.",
      "Hebat, kamu sudah nampak idea utamanya.",
      "Tahniah, kamu sedang berkembang dengan baik."
    ],
    "retry": [
      "Tak mengapa, cuba cari petunjuk untuk ayat.",
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
      "Hebat! Kamu sangat mahir dengan ayat.",
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
    "bina_ayat",
    "tatabahasa",
    "kata_nama",
    "kata_kerja"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal dan memahami ayat mudah yang lengkap.",
    "SP": "Murid dapat memilih ayat yang betul dan lengkap."
  },
  "keywords": [
    "ayat",
    "subjek",
    "predikat",
    "titik",
    "tanda soal",
    "tanda seru",
    "lengkap",
    "makna",
    "perkataan",
    "susunan",
    "bacaan",
    "ayat mudah"
  ],
  "questionPatterns": [
    "Yang manakah ayat yang betul?",
    "Pilih ayat yang lengkap.",
    "Cari ayat yang mempunyai makna.",
    "Perkataan manakah membentuk ayat?",
    "Tentukan ayat yang sesuai.",
    "Apakah susunan ayat yang betul?",
    "Pilih jawapan yang lengkap.",
    "Ayat manakah mempunyai tanda baca yang betul?"
  ],
  "wrongAnswerPatterns": [
    "Memilih susunan perkataan yang tidak lengkap.",
    "Tidak memeriksa tanda baca.",
    "Mengambil frasa sebagai ayat.",
    "Menjawab tanpa membaca maksud.",
    "Keliru antara ayat dan perkataan.",
    "Memilih jawapan yang tidak menyampaikan makna."
  ],
  "followUpQuestions": [
    "Adakah ayat ini lengkap?",
    "Boleh kamu cari subjek dalam ayat?",
    "Apakah tanda baca di hujung ayat?",
    "Mana satu ayat yang paling jelas?",
    "Boleh kamu baca ayat itu dengan kuat?",
    "Apa maksud ayat ini?",
    "Cuba bina satu ayat mudah.",
    "Bagaimana kita tahu ayat itu betul?"
  ]
});

export default pack;
