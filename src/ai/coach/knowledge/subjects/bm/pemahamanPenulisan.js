import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const pack = createKnowledgePack({
  "subjectId": "bm",
  "topicId": "pemahaman_penulisan",
  "displayName": "Pemahaman dan Penulisan",
  "learningObjectives": [
    "Memahami petikan pendek dengan teliti.",
    "Menjawab soalan berdasarkan maklumat dalam teks.",
    "Menulis ayat mudah yang sesuai dengan tajuk."
  ],
  "teacherExplanation": [
    "Pemahaman membantu murid mencari maklumat penting dalam bacaan.",
    "Penulisan pula melatih murid menulis ayat yang jelas dan mudah difahami.",
    "Murid perlu membaca teks dahulu sebelum menjawab soalan.",
    "Dalam latihan penulisan, murid perlu menulis berdasarkan idea yang tepat."
  ],
  "simpleExplanation": "Baca dengan teliti dan tulis ayat yang sesuai.",
  "examples": [
    {
      "category": "pemahaman",
      "value": "Siapakah watak dalam petikan?"
    },
    {
      "category": "pemahaman",
      "value": "Di manakah peristiwa berlaku?"
    },
    {
      "category": "pemahaman",
      "value": "Mengapakah murid itu gembira?"
    },
    {
      "category": "pemahaman",
      "value": "Apakah isi penting teks?"
    },
    {
      "category": "penulisan",
      "value": "Tulis tiga ayat tentang taman."
    },
    {
      "category": "penulisan",
      "value": "Lengkapkan ayat tentang sekolah."
    },
    {
      "category": "penulisan",
      "value": "Susun idea mengikut urutan."
    },
    {
      "category": "penulisan",
      "value": "Bina ayat daripada gambar."
    },
    {
      "category": "pemahaman",
      "value": "Apakah yang berlaku dahulu?"
    },
    {
      "category": "penulisan",
      "value": "Tulis ayat yang lengkap."
    }
  ],
  "extraExamples": [
    "Baca petikan pendek.",
    "Cari kata kunci.",
    "Tuliskan jawapan ringkas.",
    "Bina ayat yang mudah.",
    "Lihat gambar dengan teliti.",
    "Susun cerita ringkas.",
    "Cari maklumat utama.",
    "Tulis berdasarkan soalan."
  ],
  "tips": [
    "Baca petikan sekali lagi jika perlu.",
    "Cari kata kunci dalam soalan.",
    "Tulis jawapan berdasarkan teks, bukan tekaan.",
    "Gunakan ayat yang ringkas dan jelas.",
    "Semak semula ejaan selepas menulis."
  ],
  "memoryTips": [
    "Baca, cari, jawab.",
    "Kata kunci membantu.",
    "Jawapan ada dalam teks.",
    "Ayat mudah lebih jelas.",
    "Semak sebelum hantar."
  ],
  "commonMistakes": [
    "Menjawab tanpa membaca petikan.",
    "Menulis jawapan yang tidak ada dalam teks.",
    "Tidak melihat kata kunci soalan.",
    "Menulis ayat yang tidak lengkap.",
    "Mengabaikan ejaan dan tanda baca."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu sudah memahami pemahaman dan penulisan dengan baik.",
      "Syabas! Jawapan kamu tepat untuk pemahaman dan penulisan.",
      "Hebat! Kamu semakin yakin dengan pemahaman dan penulisan.",
      "Tahniah! Kamu membaca soalan dengan teliti.",
      "Cemerlang! Kamu tahu cara mencari jawapan yang betul.",
      "Mantap! Penguasaan kamu semakin baik.",
      "Bagus sekali! Teruskan usaha ini.",
      "Syabas, kamu menjawab dengan yakin.",
      "Hebat, kamu sudah nampak idea utamanya.",
      "Tahniah, kamu sedang berkembang dengan baik."
    ],
    "retry": [
      "Tak mengapa, cuba cari petunjuk untuk pemahaman dan penulisan.",
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
      "Hebat! Kamu sangat mahir dengan pemahaman dan penulisan.",
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
    "simpulan_bahasa"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Memahami petikan pendek dan menghasilkan ayat mudah.",
    "SP": "Murid dapat menjawab soalan serta menulis ayat mudah berdasarkan maklumat yang diberi."
  },
  "keywords": [
    "pemahaman",
    "penulisan",
    "petikan",
    "kata kunci",
    "jawapan",
    "ayat",
    "bina ayat",
    "ejaan",
    "idea",
    "teks",
    "soalan",
    "maklumat"
  ],
  "questionPatterns": [
    "Baca petikan dan jawab soalan.",
    "Apakah maklumat penting dalam teks?",
    "Pilih jawapan berdasarkan petikan.",
    "Tulis ayat yang sesuai dengan gambar.",
    "Lengkapkan ayat mengikut petikan.",
    "Cari isi penting bacaan.",
    "Bina ayat mudah tentang gambar ini.",
    "Pilih jawapan yang benar."
  ],
  "wrongAnswerPatterns": [
    "Menjawab tanpa membaca teks.",
    "Menggunakan maklumat yang salah.",
    "Menulis ayat terlalu panjang atau kabur.",
    "Tidak mematuhi tajuk penulisan.",
    "Mengabaikan kata kunci soalan.",
    "Mencampurkan idea yang tidak berkaitan."
  ],
  "followUpQuestions": [
    "Apakah kata kunci dalam soalan ini?",
    "Boleh kamu cari maklumat dalam petikan?",
    "Apakah ayat yang paling sesuai untuk gambar ini?",
    "Mana satu idea utama dalam teks?",
    "Bolehkah kamu menulis semula dengan ayat mudah?",
    "Adakah jawapan kamu ada dalam petikan?",
    "Apa yang perlu ditulis dahulu?",
    "Boleh kamu semak ejaan jawapan itu?"
  ]
});

export default pack;
