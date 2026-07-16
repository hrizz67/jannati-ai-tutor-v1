import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const pack = createKnowledgePack({
  "subjectId": "bm",
  "topicId": "penjodoh_bilangan",
  "displayName": "Penjodoh Bilangan",
  "learningObjectives": [
    "Mengenal penjodoh bilangan yang sesuai dengan benda.",
    "Memilih penjodoh bilangan yang betul mengikut bentuk atau jenis.",
    "Menggunakan penjodoh bilangan asas dalam ayat mudah."
  ],
  "teacherExplanation": [
    "Penjodoh bilangan digunakan bersama nombor apabila mengira benda tertentu.",
    "Setiap benda mungkin memerlukan penjodoh bilangan yang berbeza.",
    "Contohnya, sebatang untuk benda panjang dan sebiji untuk benda kecil.",
    "Murid perlu melihat bentuk atau jenis benda sebelum memilih."
  ],
  "simpleExplanation": "Penjodoh bilangan digunakan bersama nombor untuk benda tertentu.",
  "examples": [
    {
      "category": "benda kecil",
      "value": "sebiji bola"
    },
    {
      "category": "benda kecil",
      "value": "sebiji epal"
    },
    {
      "category": "benda panjang",
      "value": "sebatang pensel"
    },
    {
      "category": "haiwan",
      "value": "seekor kucing"
    },
    {
      "category": "buku/benda",
      "value": "sebuah buku"
    },
    {
      "category": "lembaran",
      "value": "sehelai kertas"
    },
    {
      "category": "barang",
      "value": "sekotak krayon"
    },
    {
      "category": "sajian",
      "value": "sepiring nasi"
    },
    {
      "category": "kumpulan",
      "value": "setangkai bunga"
    },
    {
      "category": "kertas",
      "value": "sekeping biskut"
    }
  ],
  "extraExamples": [
    "seorang murid",
    "sepasang kasut",
    "sebatang pokok",
    "sebiji guli",
    "sebuah rumah",
    "seekor burung",
    "selembar kain",
    "segugus anggur"
  ],
  "tips": [
    "Lihat jenis dan bentuk benda itu.",
    "Fikir sama ada benda itu panjang, kecil atau banyak.",
    "Baca ayat penuh sebelum memilih penjodoh bilangan.",
    "Benda yang sama boleh mempunyai penjodoh yang berbeza dalam situasi berbeza.",
    "Jangan pilih nombor sahaja tanpa penjodoh bilangan."
  ],
  "memoryTips": [
    "Seorang untuk orang.",
    "Seekor untuk haiwan.",
    "Sebiji untuk benda kecil.",
    "Sebatang untuk benda panjang.",
    "Sebuah untuk benda yang besar atau boleh dinaiki."
  ],
  "commonMistakes": [
    "Memilih penjodoh bilangan yang tidak sesuai.",
    "Menggunakan penjodoh bilangan yang sama untuk semua benda.",
    "Tidak melihat bentuk benda.",
    "Memilih nombor tanpa penjodoh bilangan.",
    "Menjawab tanpa membaca ayat penuh."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu sudah memahami penjodoh bilangan dengan baik.",
      "Syabas! Jawapan kamu tepat untuk penjodoh bilangan.",
      "Hebat! Kamu semakin yakin dengan penjodoh bilangan.",
      "Tahniah! Kamu membaca soalan dengan teliti.",
      "Cemerlang! Kamu tahu cara mencari jawapan yang betul.",
      "Mantap! Penguasaan kamu semakin baik.",
      "Bagus sekali! Teruskan usaha ini.",
      "Syabas, kamu menjawab dengan yakin.",
      "Hebat, kamu sudah nampak idea utamanya.",
      "Tahniah, kamu sedang berkembang dengan baik."
    ],
    "retry": [
      "Tak mengapa, cuba cari petunjuk untuk penjodoh bilangan.",
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
      "Hebat! Kamu sangat mahir dengan penjodoh bilangan.",
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
    "kata_nama",
    "bina_ayat",
    "tatabahasa",
    "ayat"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal dan menggunakan penjodoh bilangan asas.",
    "SP": "Murid dapat memilih penjodoh bilangan yang sesuai mengikut benda."
  },
  "keywords": [
    "sebiji",
    "sebatang",
    "seekor",
    "sebuah",
    "sehelai",
    "sekotak",
    "penjodoh bilangan",
    "nombor",
    "benda",
    "haiwan",
    "orang",
    "ayat"
  ],
  "questionPatterns": [
    "Apakah penjodoh bilangan yang betul?",
    "Pilih penjodoh bilangan yang sesuai.",
    "Yang manakah penjodoh bilangan?",
    "Cari penjodoh bilangan untuk benda ini.",
    "Perkataan manakah sesuai selepas nombor?",
    "Tentukan penjodoh bilangan yang betul.",
    "Apakah kata bilangan yang sesuai?",
    "Pilih jawapan yang menunjukkan bilangan benda."
  ],
  "wrongAnswerPatterns": [
    "Memilih penjodoh bilangan yang salah.",
    "Tidak memadankan dengan jenis benda.",
    "Mengambil nombor tanpa penjodoh.",
    "Keliru antara sebiji dan sebatang.",
    "Menjawab tanpa melihat bentuk benda.",
    "Menggunakan penjodoh yang tidak biasa."
  ],
  "followUpQuestions": [
    "Benda itu kecil atau panjang?",
    "Bolehkah kamu beri contoh lain?",
    "Penjodoh bilangan manakah untuk haiwan?",
    "Apa beza sebiji dan sebatang?",
    "Adakah benda ini sesuai dengan sebuah?",
    "Cuba cari penjodoh bilangan yang lain.",
    "Bagaimana bentuk benda itu membantu jawapan?",
    "Boleh kamu baca semula ayat itu?"
  ]
});

export default pack;
