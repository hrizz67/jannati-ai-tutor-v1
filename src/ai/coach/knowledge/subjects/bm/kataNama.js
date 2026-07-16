import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const pack = createKnowledgePack({
  "subjectId": "bm",
  "topicId": "kata_nama",
  "displayName": "Kata Nama",
  "learningObjectives": [
    "Mengenal pasti kata nama dalam ayat mudah.",
    "Membezakan kata nama am dan kata nama khas secara asas.",
    "Memilih perkataan yang menamakan orang, haiwan, tempat dan benda."
  ],
  "teacherExplanation": [
    "Kata nama ialah perkataan yang menamakan orang, haiwan, tempat dan benda.",
    "Apabila murid mencari kata nama, lihat perkataan yang mewakili sesuatu yang boleh dinamakan.",
    "Kata nama membantu ayat menjadi jelas kerana kita tahu siapa, apa atau di mana.",
    "Dalam Tahun 2, murid belajar mengenal kata nama am dan kata nama khas secara mudah."
  ],
  "simpleExplanation": "Kata nama ialah perkataan yang menamakan orang, haiwan, tempat dan benda.",
  "examples": [
    {
      "category": "orang",
      "value": "guru"
    },
    {
      "category": "orang",
      "value": "adik"
    },
    {
      "category": "haiwan",
      "value": "kucing"
    },
    {
      "category": "haiwan",
      "value": "burung"
    },
    {
      "category": "tempat",
      "value": "sekolah"
    },
    {
      "category": "tempat",
      "value": "taman"
    },
    {
      "category": "benda",
      "value": "buku"
    },
    {
      "category": "benda",
      "value": "kasut"
    },
    {
      "category": "benda",
      "value": "meja"
    },
    {
      "category": "tempat",
      "value": "kantin"
    }
  ],
  "extraExamples": [
    "doktor",
    "ikan",
    "rumah",
    "pensel",
    "perpustakaan",
    "kelas",
    "bola",
    "pokok"
  ],
  "tips": [
    "Cari nama orang, haiwan, tempat atau benda dalam ayat.",
    "Tanya diri: \"Apakah yang dinamakan perkataan ini?\"",
    "Baca keseluruhan ayat sebelum memilih jawapan.",
    "Nama khusus untuk orang atau tempat biasanya kata nama khas.",
    "Jangan keliru antara nama benda dengan perbuatan."
  ],
  "memoryTips": [
    "Kata nama = nama sesuatu.",
    "Siapa, apa, di mana.",
    "Orang, haiwan, tempat, benda.",
    "Baca ayat dan cari nama yang jelas.",
    "Nama yang boleh dilihat atau disebut ialah petunjuk."
  ],
  "commonMistakes": [
    "Memilih kata kerja seperti makan atau lari.",
    "Memilih kata adjektif seperti cantik atau besar.",
    "Tidak membaca ayat penuh.",
    "Mengelirukan nama umum dengan nama khas.",
    "Menjawab tanpa melihat konteks ayat."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu sudah memahami kata nama dengan baik.",
      "Syabas! Jawapan kamu tepat untuk kata nama.",
      "Hebat! Kamu semakin yakin dengan kata nama.",
      "Tahniah! Kamu membaca soalan dengan teliti.",
      "Cemerlang! Kamu tahu cara mencari jawapan yang betul.",
      "Mantap! Penguasaan kamu semakin baik.",
      "Bagus sekali! Teruskan usaha ini.",
      "Syabas, kamu menjawab dengan yakin.",
      "Hebat, kamu sudah nampak idea utamanya.",
      "Tahniah, kamu sedang berkembang dengan baik."
    ],
    "retry": [
      "Tak mengapa, cuba cari petunjuk untuk kata nama.",
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
      "Hebat! Kamu sangat mahir dengan kata nama.",
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
    "kata_nama_am",
    "kata_nama_khas",
    "kata_ganti_nama",
    "kata_adjektif"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal pasti kata nama dalam ayat mudah.",
    "SP": "Murid dapat memilih perkataan yang menamakan orang, haiwan, tempat dan benda."
  },
  "keywords": [
    "orang",
    "haiwan",
    "tempat",
    "benda",
    "nama",
    "guru",
    "buku",
    "sekolah",
    "kucing",
    "kantin",
    "kata nama",
    "ayat"
  ],
  "questionPatterns": [
    "Apakah kata nama dalam ayat ini?",
    "Pilih perkataan yang menamakan sesuatu.",
    "Yang manakah kata nama?",
    "Cari nama orang, haiwan, tempat atau benda.",
    "Perkataan manakah ialah kata nama?",
    "Tentukan kata nama yang betul.",
    "Nyatakan kata nama yang terdapat dalam ayat.",
    "Pilih jawapan yang menamakan sesuatu."
  ],
  "wrongAnswerPatterns": [
    "Memilih perbuatan sebagai nama.",
    "Memilih perkataan sifat sebagai kata nama.",
    "Tidak melihat ayat dengan teliti.",
    "Mengambil perkataan yang bukan nama sesuatu.",
    "Keliru antara kata nama am dan kata nama khas.",
    "Menjawab berdasarkan satu perkataan sahaja."
  ],
  "followUpQuestions": [
    "Apakah yang dinamakan oleh perkataan itu?",
    "Bolehkah kamu cari satu lagi kata nama?",
    "Adakah perkataan ini menamakan orang atau benda?",
    "Mana satu kata nama khas dalam ayat?",
    "Apa nama tempat yang disebut?",
    "Boleh kamu sebut nama haiwan dalam ayat?",
    "Perkataan ini menunjukkan siapa atau apa?",
    "Cuba baca ayat sekali lagi dan cari nama."
  ]
});

export default pack;
