import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Kemahiran Saintifik dengan baik.",
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
      "Tak mengapa, cuba semak Kemahiran Saintifik sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Kemahiran Saintifik.",
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
  "topicId": "kemahiran_saintifik",
  "displayName": "Kemahiran Saintifik",
  "learningObjectives": [
    "Memerhati, membandingkan dan mengelaskan dengan teliti.",
    "Membuat inferens ringkas berdasarkan bukti.",
    "Menyusun langkah penyiasatan mudah dengan selamat."
  ],
  "teacherExplanation": [
    "Kemahiran saintifik membantu murid belajar seperti seorang penyiasat kecil.",
    "Murid perlu memerhati dengan teliti, membandingkan ciri dan menjelaskan apa yang dilihat.",
    "Kita juga boleh meramal dan membuat inferens mudah berdasarkan bukti.",
    "Kemahiran ini digunakan untuk semua topik Sains Tahun 2."
  ],
  "simpleExplanation": "Kemahiran saintifik ialah cara memerhati, membandingkan dan menerangkan dengan bukti.",
  "workedExamples": [
    {
      "prompt": "Perhatikan daun merah dan daun hijau.",
      "steps": [
        "Bandingkan warna daun.",
        "Sebut persamaan dan perbezaan.",
        "Jawapan: daun berbeza warna."
      ],
      "answer": "daun berbeza warna"
    },
    {
      "prompt": "Kita ramal apa yang berlaku jika tumbuhan tidak disiram.",
      "steps": [
        "Tumbuhan perlukan air.",
        "Tanpa air tumbuhan layu.",
        "Jawapan: tumbuhan layu."
      ],
      "answer": "tumbuhan layu"
    },
    {
      "prompt": "Susun langkah mudah menyiasat?",
      "steps": [
        "Perhatikan, tanya, cuba, catat, semak.",
        "Jawapan: langkah penyiasatan mudah."
      ],
      "answer": "langkah penyiasatan mudah"
    },
    {
      "prompt": "Apa bukti objek itu berat?",
      "steps": [
        "Bandingkan dengan objek lain.",
        "Gunakan pemerhatian dan rasa.",
        "Jawapan: lebih sukar diangkat."
      ],
      "answer": "lebih sukar diangkat"
    },
    {
      "prompt": "Bagaimana kita mengelaskan haiwan?",
      "steps": [
        "Lihat ciri haiwan.",
        "Kumpulkan yang sama cirinya.",
        "Jawapan: mengikut ciri."
      ],
      "answer": "mengikut ciri"
    }
  ],
  "examples": [
    "memerhati",
    "membandingkan",
    "mengelaskan",
    "meramal",
    "menerangkan",
    "mencatat",
    "menguji",
    "membuat inferens",
    "bukti",
    "ciri"
  ],
  "extraExamples": [
    "rekod",
    "susun",
    "lihat",
    "sentuh",
    "bau",
    "rasa",
    "ukur",
    "tanya"
  ],
  "problemSolvingSteps": [
    "Perhatikan objek atau gambar.",
    "Bandingkan ciri yang jelas.",
    "Kumpulkan atau kelas mengikut sama ciri.",
    "Buat ramalan berdasarkan bukti.",
    "Semak jawapan dengan pemerhatian."
  ],
  "tips": [
    "Gunakan mata, telinga dan deria lain dengan selamat.",
    "Catat apa yang dilihat.",
    "Bandingkan sebelum membuat keputusan.",
    "Bina jawapan berdasarkan bukti.",
    "Baca arahan penyiasatan dengan teliti."
  ],
  "memoryTips": [
    "Perhati, banding, jelaskan.",
    "Bukti penting.",
    "Ramal dengan teliti.",
    "Kelas ikut ciri sama.",
    "Langkah penyiasatan perlu jelas."
  ],
  "commonMistakes": [
    "Meneka tanpa bukti.",
    "Tidak membandingkan ciri.",
    "Mengelaskan secara salah.",
    "Lupa mencatat pemerhatian.",
    "Tidak mengikut langkah penyiasatan."
  ],
  "scientificFacts": [
    "Pemerhatian menggunakan deria.",
    "Perbandingan membantu kita lihat persamaan dan perbezaan.",
    "Pengelasan dibuat berdasarkan ciri yang sama.",
    "Ramalan dibuat daripada bukti.",
    "Inferens ialah penjelasan awal berdasarkan pemerhatian.",
    "Mencatat membantu penyiasatan.",
    "Bukti menyokong jawapan saintifik.",
    "Langkah penyiasatan perlu tersusun."
  ],
  "observationPrompts": [
    "Apa yang kamu nampak?",
    "Apa persamaan dan perbezaannya?",
    "Bagaimana objek ini berubah?",
    "Ciri mana yang paling jelas?",
    "Apa yang boleh kamu catat?",
    "Apa yang kamu perhatikan dengan deria?"
  ],
  "comparisonPrompts": [
    "Bandingkan dua objek.",
    "Bandingkan ciri haiwan.",
    "Bandingkan tumbuhan yang berbeza.",
    "Bandingkan bahan keras dan lembut.",
    "Bandingkan keadaan terang dan gelap."
  ],
  "investigationIdeas": [
    "Perhatikan objek di kelas.",
    "Bandingkan daun atau batu.",
    "Buat carta pemerhatian ringkas.",
    "Susun langkah penyiasatan kecil yang selamat."
  ],
  "realLifeConnections": [
    "Kita guna kemahiran saintifik setiap hari.",
    "Murid memerhati semasa belajar.",
    "Kita membandingkan makanan dan objek.",
    "Kita membuat catatan di sekolah.",
    "Bukti membantu kita membuat keputusan."
  ],
  "safetyNotes": [
    "Gunakan deria dengan selamat.",
    "Jangan buat eksperimen berbahaya.",
    "Ikut arahan guru semasa penyiasatan."
  ],
  "misconceptions": [
    "Meneka sama dengan membuat bukti.",
    "Pemerhatian tidak penting.",
    "Semua objek boleh diklasifikasikan sama.",
    "Ramalan tidak perlu bukti.",
    "Mengikut langkah bukan penting."
  ],
  "evidenceQuestions": [
    "Apa bukti jawapan kamu?",
    "Bagaimana kamu membandingkan objek ini?",
    "Apa yang kamu perhatikan?",
    "Mengapa kamu memilih pengelasan itu?",
    "Apa ramalan kamu?",
    "Bolehkah kamu terangkan pemerhatian itu?",
    "Bukti mana yang paling membantu?",
    "Apakah langkah seterusnya?"
  ],
  "relatedTopics": [
    "haiwan",
    "tumbuhan",
    "bahan",
    "teknologi"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Menggunakan kemahiran saintifik asas.",
    "SP": "Murid dapat memerhati, membandingkan, mengelaskan dan menerangkan dengan bukti mudah."
  },
  "keywords": [
    "memerhati",
    "membandingkan",
    "mengelaskan",
    "meramal",
    "bukti",
    "ciri",
    "pemerhatian",
    "inferens",
    "langkah",
    "catat",
    "ukur",
    "deria"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang kemahiran saintifik?",
    "Pilih jawapan yang sesuai tentang kemahiran saintifik.",
    "Yang manakah berkaitan dengan kemahiran saintifik?",
    "Cari maklumat yang betul tentang kemahiran saintifik.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Meneka tanpa bukti.",
    "Tidak membandingkan.",
    "Mengelaskan secara salah.",
    "Lupa langkah penyiasatan.",
    "Tidak mencatat pemerhatian.",
    "Memilih jawapan yang bukan berdasarkan bukti."
  ],
  "followUpQuestions": [
    "Apa bukti yang kamu ada?",
    "Boleh kamu bandingkan dua ciri?",
    "Apakah pemerhatian kamu?",
    "Bagaimana kamu membuat ramalan?",
    "Apa langkah seterusnya?",
    "Boleh kamu terangkan semula?",
    "Ciri mana yang sama atau berbeza?",
    "Adakah jawapan ini berdasarkan bukti?"
  ]
});

export default knowledge;
