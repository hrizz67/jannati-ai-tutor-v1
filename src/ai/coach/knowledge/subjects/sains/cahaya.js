import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Cahaya dengan baik.",
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
      "Tak mengapa, cuba semak Cahaya sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Cahaya.",
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
  "topicId": "cahaya",
  "displayName": "Cahaya",
  "learningObjectives": [
    "Mengenal sumber cahaya.",
    "Memahami cahaya dan bayang-bayang secara asas.",
    "Menghubungkan cahaya dengan kehidupan harian."
  ],
  "teacherExplanation": [
    "Cahaya membantu kita melihat objek di sekeliling.",
    "Matahari, lampu dan senter ialah sumber cahaya.",
    "Cahaya boleh menghasilkan bayang-bayang apabila dihalang oleh objek.",
    "Murid Tahun 2 belajar memerhati cahaya dan kesannya dengan mudah."
  ],
  "simpleExplanation": "Cahaya membantu kita melihat dan datang daripada sumber tertentu.",
  "workedExamples": [
    {
      "prompt": "Sumber cahaya semula jadi?",
      "steps": [
        "Matahari menghasilkan cahaya sendiri.",
        "Jawapan: matahari."
      ],
      "answer": "matahari"
    },
    {
      "prompt": "Sumber cahaya buatan?",
      "steps": [
        "Lampu dibuat oleh manusia.",
        "Jawapan: lampu."
      ],
      "answer": "lampu"
    },
    {
      "prompt": "Apa jadi bila cahaya dihalang?",
      "steps": [
        "Objek menghalang cahaya.",
        "Bayang-bayang terbentuk.",
        "Jawapan: bayang-bayang."
      ],
      "answer": "bayang-bayang"
    },
    {
      "prompt": "Cahaya membantu kita?",
      "steps": [
        "Cahaya membolehkan kita melihat.",
        "Jawapan: melihat."
      ],
      "answer": "melihat"
    },
    {
      "prompt": "Apa sumber cahaya di langit?",
      "steps": [
        "Matahari berada di langit.",
        "Jawapan: matahari."
      ],
      "answer": "matahari"
    }
  ],
  "examples": [
    "matahari",
    "lampu",
    "senter",
    "bayang-bayang",
    "terang",
    "gelap",
    "cahaya",
    "sumber",
    "bersinar",
    "menyinari"
  ],
  "extraExamples": [
    "lampu meja",
    "lampu suluh",
    "langit cerah",
    "cahaya pagi",
    "obor",
    "bintang",
    "lampu jalan",
    "ruang terang"
  ],
  "problemSolvingSteps": [
    "Kenal pasti sumber cahaya.",
    "Lihat apa yang menghalang cahaya.",
    "Bandingkan tempat terang dan gelap.",
    "Pilih jawapan yang sesuai.",
    "Semak sama ada pemerhatian itu benar."
  ],
  "tips": [
    "Ingat matahari ialah sumber cahaya semula jadi.",
    "Lampu dan senter ialah sumber buatan.",
    "Perhatikan bayang-bayang.",
    "Baca soalan dengan teliti.",
    "Pilih sumber cahaya yang betul."
  ],
  "memoryTips": [
    "Cahaya membantu melihat.",
    "Matahari ialah sumber cahaya.",
    "Lampu ialah sumber buatan.",
    "Halangan boleh menghasilkan bayang-bayang.",
    "Terang lawan gelap."
  ],
  "commonMistakes": [
    "Menganggap semua cahaya sama.",
    "Tidak membezakan sumber semula jadi dan buatan.",
    "Keliru cahaya dengan haba.",
    "Tidak melihat bayang-bayang.",
    "Meneka tanpa bukti."
  ],
  "scientificFacts": [
    "Cahaya membantu kita melihat.",
    "Matahari ialah sumber cahaya semula jadi.",
    "Lampu ialah sumber cahaya buatan.",
    "Objek boleh menghasilkan bayang-bayang.",
    "Cahaya bergerak lurus.",
    "Tempat gelap kurang cahaya.",
    "Bintang juga menjadi sumber cahaya di langit malam.",
    "Cahaya diperlukan dalam banyak aktiviti harian."
  ],
  "observationPrompts": [
    "Perhatikan bayang-bayang.",
    "Bandingkan tempat terang dan gelap.",
    "Lihat sumber cahaya di kelas.",
    "Cari cahaya semula jadi dan buatan.",
    "Perhatikan arah cahaya.",
    "Lihat apa yang berlaku apabila objek menghalang cahaya."
  ],
  "comparisonPrompts": [
    "Bandingkan matahari dan lampu.",
    "Bandingkan tempat terang dan gelap.",
    "Bandingkan cahaya semula jadi dan buatan.",
    "Bandingkan bayang-bayang panjang dan pendek.",
    "Bandingkan sumber cahaya yang berbeza."
  ],
  "investigationIdeas": [
    "Perhatikan bayang-bayang di bawah cahaya.",
    "Cari sumber cahaya di rumah.",
    "Bandingkan cahaya matahari dan lampu.",
    "Lukis objek yang menghasilkan bayang-bayang."
  ],
  "realLifeConnections": [
    "Kita guna cahaya untuk membaca.",
    "Lampu membantu kita pada waktu malam.",
    "Matahari menerangi siang.",
    "Bayang-bayang ada di taman permainan.",
    "Cahaya penting dalam kehidupan harian."
  ],
  "safetyNotes": [
    "Jangan melihat matahari secara terus.",
    "Berhati-hati dengan lampu panas.",
    "Gunakan senter dengan selamat."
  ],
  "misconceptions": [
    "Cahaya dan bayang-bayang sama.",
    "Lampu bukan sumber cahaya.",
    "Matahari tidak memberi cahaya.",
    "Cahaya tidak membantu melihat.",
    "Semua tempat sentiasa terang."
  ],
  "evidenceQuestions": [
    "Apa bukti ini sumber cahaya?",
    "Bagaimana bayang-bayang terbentuk?",
    "Mengapa kamu memilih jawapan itu?",
    "Boleh kamu tunjuk bukti daripada pemerhatian?",
    "Apakah sumber cahaya yang kamu nampak?",
    "Bagaimana cahaya membantu kita?"
  ],
  "relatedTopics": [
    "bumi",
    "bunyi",
    "manusia",
    "teknologi"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal cahaya dan sumbernya.",
    "SP": "Murid dapat memerhati, membandingkan dan menerangkan kesan cahaya secara ringkas."
  },
  "keywords": [
    "cahaya",
    "matahari",
    "lampu",
    "senter",
    "bayang-bayang",
    "terang",
    "gelap",
    "sumber",
    "lihat",
    "menerangi",
    "semula jadi",
    "buatan"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang cahaya?",
    "Pilih jawapan yang sesuai tentang cahaya.",
    "Yang manakah berkaitan dengan cahaya?",
    "Cari maklumat yang betul tentang cahaya.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih bukan sumber cahaya.",
    "Tidak membezakan semula jadi dan buatan.",
    "Mengabaikan bayang-bayang.",
    "Meneka tanpa bukti.",
    "Keliru cahaya dan haba.",
    "Memilih fakta yang salah."
  ],
  "followUpQuestions": [
    "Sumber cahaya mana yang kamu nampak?",
    "Bagaimana bayang-bayang terbentuk?",
    "Boleh kamu bandingkan dua sumber cahaya?",
    "Apa bukti jawapan kamu?",
    "Bolehkah kamu terangkan semula?",
    "Adakah cahaya ini semula jadi atau buatan?",
    "Ciri mana yang paling jelas?",
    "Bagaimana cahaya membantu kehidupan?"
  ]
});

export default knowledge;
