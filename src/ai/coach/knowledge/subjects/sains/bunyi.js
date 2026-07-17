import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Bunyi dengan baik.",
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
      "Tak mengapa, cuba semak Bunyi sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Bunyi.",
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
  "topicId": "bunyi",
  "displayName": "Bunyi",
  "learningObjectives": [
    "Mengenal sumber bunyi.",
    "Membezakan bunyi kuat dan perlahan.",
    "Menghubungkan bunyi dengan kehidupan harian."
  ],
  "teacherExplanation": [
    "Bunyi berlaku apabila sesuatu bergetar atau bergerak.",
    "Kita mendengar bunyi melalui telinga.",
    "Bunyi boleh kuat, perlahan, tinggi atau rendah.",
    "Murid Tahun 2 belajar memerhati bunyi di sekeliling dan menyebut cirinya."
  ],
  "simpleExplanation": "Bunyi ialah sesuatu yang kita dengar dan datang daripada sumber tertentu.",
  "workedExamples": [
    {
      "prompt": "Sumber bunyi?",
      "steps": [
        "Gendang mengeluarkan bunyi apabila dipukul.",
        "Jawapan: gendang."
      ],
      "answer": "gendang"
    },
    {
      "prompt": "Bunyi kuat atau perlahan?",
      "steps": [
        "Loceng sekolah biasanya kuat.",
        "Jawapan: kuat."
      ],
      "answer": "kuat"
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
      "prompt": "Bunyi tinggi atau rendah?",
      "steps": [
        "Suara burung biasanya tinggi.",
        "Jawapan: tinggi."
      ],
      "answer": "tinggi"
    },
    {
      "prompt": "Apa berlaku pada pembesar suara?",
      "steps": [
        "Pembesar suara bergetar dan menghasilkan bunyi.",
        "Jawapan: bergetar."
      ],
      "answer": "bergetar"
    }
  ],
  "examples": [
    "gendang",
    "loceng",
    "telinga",
    "kuat",
    "perlahan",
    "tinggi",
    "rendah",
    "suara",
    "muzik",
    "getaran"
  ],
  "extraExamples": [
    "radio",
    "televisyen",
    "wisel",
    "bunyi kereta",
    "bunyi burung",
    "tepukan",
    "ketukan",
    "seruling"
  ],
  "problemSolvingSteps": [
    "Kenal pasti sumber bunyi.",
    "Perhatikan sama ada bunyi kuat atau perlahan.",
    "Bandingkan bunyi yang berbeza.",
    "Pilih jawapan yang sesuai.",
    "Semak bukti dari pemerhatian."
  ],
  "tips": [
    "Gunakan telinga untuk memerhati bunyi.",
    "Bandingkan bunyi kuat dan perlahan.",
    "Fikir tentang alat yang menghasilkan bunyi.",
    "Baca soalan dengan teliti.",
    "Pilih sumber bunyi yang betul."
  ],
  "memoryTips": [
    "Bunyi didengar dengan telinga.",
    "Bunyi datang daripada sumber.",
    "Kuat lawan perlahan.",
    "Tinggi lawan rendah.",
    "Sesetengah benda bergetar."
  ],
  "commonMistakes": [
    "Mengelirukan bunyi dengan cahaya.",
    "Tidak mengenal sumber bunyi.",
    "Keliru kuat dan perlahan.",
    "Tidak memerhati getaran.",
    "Meneka tanpa bukti."
  ],
  "scientificFacts": [
    "Bunyi dihasilkan oleh getaran.",
    "Telinga digunakan untuk mendengar bunyi.",
    "Bunyi boleh kuat atau perlahan.",
    "Bunyi boleh tinggi atau rendah.",
    "Sesetengah alat menghasilkan bunyi apabila dipukul atau ditiup.",
    "Getaran menghasilkan bunyi.",
    "Bunyi boleh datang daripada manusia, haiwan atau objek.",
    "Kita perlu menjaga telinga daripada bunyi terlalu kuat."
  ],
  "observationPrompts": [
    "Perhatikan sumber bunyi.",
    "Bandingkan bunyi kuat dan perlahan.",
    "Dengar bunyi di sekeliling.",
    "Cari bunyi daripada alat muzik.",
    "Perhatikan getaran jika ada.",
    "Bandingkan dua bunyi berbeza."
  ],
  "comparisonPrompts": [
    "Bandingkan loceng dan bisikan.",
    "Bandingkan bunyi tinggi dan rendah.",
    "Bandingkan bunyi kuat dan perlahan.",
    "Bandingkan bunyi manusia dan alat.",
    "Bandingkan sumber bunyi yang berbeza."
  ],
  "investigationIdeas": [
    "Dengar bunyi di rumah dengan selamat.",
    "Bandingkan bunyi alat muzik.",
    "Cari sumber bunyi dalam gambar.",
    "Buat carta bunyi kuat dan perlahan."
  ],
  "realLifeConnections": [
    "Kita dengar bunyi semasa belajar.",
    "Bunyi loceng menandakan waktu.",
    "Muzik datang daripada alat bunyi.",
    "Haiwan juga mengeluarkan bunyi.",
    "Kita perlu menjaga pendengaran."
  ],
  "safetyNotes": [
    "Jauhi bunyi yang terlalu kuat.",
    "Jangan letakkan objek terlalu dekat dengan telinga.",
    "Gunakan alat bunyi dengan selamat."
  ],
  "misconceptions": [
    "Bunyi datang daripada cahaya.",
    "Bunyi tidak memerlukan sumber.",
    "Semua bunyi sama.",
    "Telinga tidak penting untuk mendengar.",
    "Kuat dan tinggi bermaksud sama."
  ],
  "evidenceQuestions": [
    "Apa sumber bunyi itu?",
    "Bagaimana kamu tahu bunyi ini kuat?",
    "Apa bukti daripada pemerhatian kamu?",
    "Bolehkah kamu bandingkan dua bunyi?",
    "Mengapa kamu pilih jawapan itu?",
    "Apa yang menghasilkan bunyi itu?"
  ],

  "whyQuestions": [
    "Mengapa kita boleh mendengar bunyi?",
    "Mengapa bunyi menjadi kuat atau perlahan?",
    "Mengapa bunyi bergerak melalui udara?",
    "Mengapa kita perlu menjaga bunyi kuat?",
    "Mengapa suara boleh berbeza antara satu sama lain?"
  ],
  "predictionQuestions": [
    "Apa yang akan berlaku jika tiada bunyi?",
    "Apa yang mungkin berlaku jika benda dipukul kuat?",
    "Apa yang akan terjadi jika kita menutup telinga?",
    "Apa yang mungkin berlaku jika alat muzik dimainkan perlahan?",
    "Apa yang akan berubah jika sumber bunyi bergerak lebih dekat?"
  ],
  "comparisonQuestions": [
    "Bandingkan bunyi kuat dan bunyi perlahan.",
    "Bandingkan bunyi tinggi dan bunyi rendah.",
    "Bandingkan suara manusia dan bunyi alat muzik.",
    "Bandingkan bunyi alam dan bunyi buatan.",
    "Bandingkan bunyi yang jelas dan bunyi yang samar."
  ],
  "realLifeApplications": [
    "Mendengar guru bercakap di kelas.",
    "Menggunakan loceng untuk memberi isyarat.",
    "Mengenal bunyi di rumah dan di sekolah.",
    "Menjaga bunyi supaya tidak terlalu kuat.",
    "Mengenal bunyi alat muzik dengan teliti."
  ],
  "relatedTopics": [
    "cahaya",
    "manusia",
    "bumi",
    "teknologi"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal bunyi dan sumbernya.",
    "SP": "Murid dapat memerhati, membandingkan dan menerangkan ciri bunyi secara mudah."
  },
  "keywords": [
    "bunyi",
    "telinga",
    "kuat",
    "perlahan",
    "tinggi",
    "rendah",
    "getaran",
    "sumber",
    "dengar",
    "suara",
    "alat",
    "muzik"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang bunyi?",
    "Pilih jawapan yang sesuai tentang bunyi.",
    "Yang manakah berkaitan dengan bunyi?",
    "Cari maklumat yang betul tentang bunyi.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih bukan sumber bunyi.",
    "Keliru kuat dan perlahan.",
    "Tidak memerhati getaran.",
    "Meneka tanpa bukti.",
    "Mengelirukan bunyi dan cahaya.",
    "Memilih fakta yang salah."
  ],
  "followUpQuestions": [
    "Sumber bunyi mana yang kamu dengar?",
    "Boleh kamu bandingkan dua bunyi?",
    "Bunyi ini kuat atau perlahan?",
    "Apa bukti jawapan kamu?",
    "Bolehkah kamu terangkan semula?",
    "Adakah bunyi ini tinggi atau rendah?",
    "Ciri mana yang paling jelas?",
    "Bagaimana bunyi membantu kehidupan?"
  ]
});

export default knowledge;
