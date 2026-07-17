import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Manusia dengan baik.",
      "Syabas! Jawapan kamu betul.",
      "Hebat! Kamu membaca maklumat dengan teliti.",
      "Tahniah! Kamu semakin yakin.",
      "Cemerlang! Kamu membuat pilihan yang tepat.",
      "Mantap! Teruskan usaha ini.",
      "Bagus sekali! Kamu sudah berada pada jalan yang betul.",
      "Hebat benar! Kamu sangat teliti.",
      "Syabas, kamu menyelesaikan soalan ini dengan baik.",
      "Tahniah, kamu semakin mahir."
    ],
    "retry": [
      "Tak mengapa, cuba semak Manusia sekali lagi.",
      "Baca soalan dengan perlahan.",
      "Perhatikan ciri dan petunjuk dengan teliti.",
      "Ambil masa dan cuba lagi.",
      "Semak jawapan sebelum memilih.",
      "Lihat fakta atau pemerhatian dengan teliti.",
      "Cuba bandingkan pilihan yang ada.",
      "Fokus pada kata kunci soalan.",
      "Kamu hampir betul, jangan putus asa.",
      "Baca semula langkah satu demi satu."
    ],
    "excellent": [
      "Hebat! Kamu sangat mahir dengan Manusia.",
      "Cemerlang! Kamu memahami topik ini dengan yakin.",
      "Luar biasa! Penguasaan kamu sangat baik.",
      "Brilliant! Kamu menjawab dengan tepat.",
      "Mantap! Kamu boleh teruskan ke cabaran baharu.",
      "Syabas! Kamu membuat pemerhatian dengan sangat teliti.",
      "Bagus sekali! Kamu sangat yakin.",
      "Hebat benar! Teruskan kecemerlangan ini.",
      "Tahniah! Kamu sangat bersedia.",
      "Fantastic! Kamu telah melakukan yang terbaik."
    ]
  },
  "topicId": "manusia",
  "displayName": "Manusia",
  "learningObjectives": [
    "Mengenal bahagian utama tubuh manusia.",
    "Memahami keperluan asas manusia.",
    "Menghubungkan anggota badan dengan fungsi mudah."
  ],
  "teacherExplanation": [
    "Manusia ialah benda hidup yang mempunyai anggota badan dan keperluan asas.",
    "Kita menggunakan mata untuk melihat, telinga untuk mendengar dan tangan untuk memegang.",
    "Tubuh manusia perlu dijaga dengan baik supaya sihat.",
    "Murid Tahun 2 belajar mengenal bahagian badan dan fungsinya secara mudah."
  ],
  "simpleExplanation": "Manusia mempunyai anggota badan dan keperluan hidup.",
  "workedExamples": [
    {
      "prompt": "Anggota untuk melihat?",
      "steps": [
        "Mata digunakan untuk melihat.",
        "Jawapan: mata."
      ],
      "answer": "mata"
    },
    {
      "prompt": "Anggota untuk mendengar?",
      "steps": [
        "Telinga digunakan untuk mendengar.",
        "Jawapan: telinga."
      ],
      "answer": "telinga"
    },
    {
      "prompt": "Anggota untuk memegang?",
      "steps": [
        "Tangan digunakan untuk memegang.",
        "Jawapan: tangan."
      ],
      "answer": "tangan"
    },
    {
      "prompt": "Manusia perlukan apa untuk hidup?",
      "steps": [
        "Manusia perlukan air, makanan, udara dan rehat.",
        "Jawapan: air, makanan, udara dan rehat."
      ],
      "answer": "air, makanan, udara dan rehat"
    },
    {
      "prompt": "Anggota untuk berjalan?",
      "steps": [
        "Kaki membantu kita berjalan.",
        "Jawapan: kaki."
      ],
      "answer": "kaki"
    }
  ],
  "examples": [
    "mata",
    "telinga",
    "hidung",
    "mulut",
    "tangan",
    "kaki",
    "kulit",
    "kepala",
    "bahu",
    "lutut"
  ],
  "extraExamples": [
    "jari",
    "lidah",
    "dahi",
    "siku",
    "perut",
    "dada",
    "leher",
    "bibir"
  ],
  "problemSolvingSteps": [
    "Baca fungsi anggota badan.",
    "Cari bahagian tubuh yang sesuai.",
    "Bandingkan kegunaan setiap anggota.",
    "Pilih jawapan yang betul.",
    "Semak sama ada fungsinya tepat."
  ],
  "tips": [
    "Fikir anggota badan dan fungsinya.",
    "Gunakan pengalaman harian.",
    "Baca soalan dengan teliti.",
    "Bandingkan pilihan jawapan.",
    "Pilih anggota yang betul."
  ],
  "memoryTips": [
    "Mata melihat.",
    "Telinga mendengar.",
    "Tangan memegang.",
    "Kaki berjalan.",
    "Hidung menghidu."
  ],
  "commonMistakes": [
    "Mengelirukan fungsi anggota badan.",
    "Memilih bahagian yang salah.",
    "Tidak memeriksa soalan dengan teliti.",
    "Mengabaikan keperluan asas manusia.",
    "Menjawab tanpa bukti."
  ],
  "scientificFacts": [
    "Manusia ialah benda hidup.",
    "Manusia memerlukan makanan, air, udara dan rehat.",
    "Mata digunakan untuk melihat.",
    "Telinga digunakan untuk mendengar.",
    "Tangan digunakan untuk memegang.",
    "Kaki digunakan untuk berjalan.",
    "Kulit melindungi tubuh.",
    "Hidung digunakan untuk menghidu."
  ],
  "observationPrompts": [
    "Perhatikan bahagian tubuh manusia.",
    "Lihat fungsi anggota badan.",
    "Bandingkan tangan dan kaki.",
    "Cari anggota yang digunakan untuk melihat.",
    "Perhatikan apa yang dilakukan oleh tubuh.",
    "Lihat bahagian yang membantu bergerak."
  ],
  "comparisonPrompts": [
    "Bandingkan tangan dan kaki.",
    "Bandingkan mata dan telinga.",
    "Bandingkan anggota untuk melihat dan mendengar.",
    "Bandingkan fungsi anggota badan.",
    "Bandingkan keperluan manusia dan haiwan."
  ],
  "investigationIdeas": [
    "Lukis tubuh manusia ringkas.",
    "Padankan anggota dengan fungsi.",
    "Buat carta keperluan manusia.",
    "Perhatikan pergerakan anggota badan."
  ],
  "realLifeConnections": [
    "Kita guna anggota badan setiap hari.",
    "Manusia perlu makan dan minum.",
    "Kita berjalan ke sekolah.",
    "Kita mendengar suara guru.",
    "Tubuh perlu dijaga bersih."
  ],
  "safetyNotes": [
    "Jaga tubuh semasa aktiviti fizikal.",
    "Berhati-hati ketika memerhati rakan.",
    "Jangan buat pergerakan yang memudaratkan."
  ],
  "misconceptions": [
    "Mata digunakan untuk mendengar.",
    "Telinga digunakan untuk melihat.",
    "Manusia tidak perlukan rehat.",
    "Tangan dan kaki sama fungsi.",
    "Kulit tidak penting."
  ],
  "evidenceQuestions": [
    "Apakah bukti anggota ini digunakan untuk melihat?",
    "Mengapa kamu memilih mata?",
    "Boleh kamu beri bukti daripada aktiviti harian?",
    "Anggota mana yang membantu berjalan?",
    "Apa yang dilakukan oleh anggota ini?",
    "Bagaimana kamu tahu jawapannya?"
  ],

  "whyQuestions": [
    "Mengapa kita perlu makan makanan sihat?",
    "Mengapa kita perlu tidur cukup?",
    "Mengapa badan perlu bergerak?",
    "Mengapa kita perlu minum air?",
    "Mengapa kita menjaga kebersihan badan?"
  ],
  "predictionQuestions": [
    "Apa yang akan berlaku jika kita tidak tidur cukup?",
    "Apa yang mungkin berlaku jika kita tidak makan seimbang?",
    "Apa yang akan terjadi jika kita kurang minum air?",
    "Apa yang mungkin berlaku jika kita tidak bersenam?",
    "Apa yang akan berubah jika kita menjaga badan dengan baik?"
  ],
  "comparisonQuestions": [
    "Bandingkan badan sihat dan badan letih.",
    "Bandingkan makanan sihat dan makanan kurang sihat.",
    "Bandingkan aktiviti aktif dan aktiviti rehat.",
    "Bandingkan tangan bersih dan tangan kotor.",
    "Bandingkan amalan sihat dan amalan tidak sihat."
  ],
  "realLifeApplications": [
    "Makan sarapan sebelum ke sekolah.",
    "Bersenam ringan setiap hari.",
    "Minum air kosong yang mencukupi.",
    "Menjaga kebersihan diri di rumah dan sekolah.",
    "Berat badan dan emosi yang sihat bermula dengan rutin baik."
  ],
  "relatedTopics": [
    "haiwan",
    "bumi",
    "cahaya",
    "bunyi"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal anggota badan dan keperluan asas manusia.",
    "SP": "Murid dapat menerangkan fungsi mudah bahagian tubuh dan keperluan hidup."
  },
  "keywords": [
    "manusia",
    "mata",
    "telinga",
    "tangan",
    "kaki",
    "hidung",
    "mulut",
    "kulit",
    "bergerak",
    "melihat",
    "mendengar",
    "hidup"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang manusia?",
    "Pilih jawapan yang sesuai tentang manusia.",
    "Yang manakah berkaitan dengan manusia?",
    "Cari maklumat yang betul tentang manusia.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih anggota yang salah.",
    "Tidak memadankan fungsi.",
    "Mengelirukan keperluan hidup.",
    "Meneka tanpa bukti.",
    "Mengabaikan bahagian tubuh.",
    "Memilih fakta yang salah."
  ],
  "followUpQuestions": [
    "Anggota mana yang kamu pilih?",
    "Bolehkah kamu terangkan fungsinya?",
    "Apa bukti jawapan kamu?",
    "Bagaimana tubuh ini membantu kita?",
    "Boleh kamu bandingkan dua anggota?",
    "Apa yang manusia perlukan untuk hidup?",
    "Ciri mana yang paling jelas?",
    "Bolehkah kamu beri contoh harian?"
  ]
});

export default knowledge;
