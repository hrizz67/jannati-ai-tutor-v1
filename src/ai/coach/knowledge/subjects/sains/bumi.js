import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Bumi dengan baik.",
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
      "Tak mengapa, cuba semak Bumi sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Bumi.",
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
  "topicId": "bumi",
  "displayName": "Bumi",
  "learningObjectives": [
    "Mengenal bumi dan ciri asasnya.",
    "Memahami siang dan malam secara mudah.",
    "Menghubungkan bumi dengan kehidupan harian."
  ],
  "teacherExplanation": [
    "Bumi ialah tempat tinggal manusia, haiwan dan tumbuhan.",
    "Bumi berputar pada paksinya dan menyebabkan siang dan malam.",
    "Kita tinggal di permukaan bumi dan melihat pelbagai bentuk muka bumi.",
    "Murid Tahun 2 belajar memahami bumi melalui pemerhatian mudah."
  ],
  "simpleExplanation": "Bumi ialah tempat kita tinggal dan ia berputar menyebabkan siang dan malam.",
  "workedExamples": [
    {
      "prompt": "Apa sebab siang dan malam?",
      "steps": [
        "Bumi berputar pada paksinya.",
        "Perputaran menyebabkan siang dan malam.",
        "Jawapan: putaran bumi."
      ],
      "answer": "putaran bumi"
    },
    {
      "prompt": "Tempat tinggal manusia?",
      "steps": [
        "Manusia hidup di bumi.",
        "Jawapan: bumi."
      ],
      "answer": "bumi"
    },
    {
      "prompt": "Waktu bila matahari nampak?",
      "steps": [
        "Siang ialah waktu yang terang.",
        "Jawapan: siang."
      ],
      "answer": "siang"
    },
    {
      "prompt": "Waktu bila bulan biasanya nampak?",
      "steps": [
        "Malam ialah waktu gelap.",
        "Jawapan: malam."
      ],
      "answer": "malam"
    },
    {
      "prompt": "Bumi bergerak bagaimana?",
      "steps": [
        "Bumi berputar.",
        "Jawapan: berputar."
      ],
      "answer": "berputar"
    }
  ],
  "examples": [
    "bumi",
    "siang",
    "malam",
    "putaran",
    "permukaan",
    "tanah",
    "langit",
    "gunung",
    "laut",
    "daratan"
  ],
  "extraExamples": [
    "pagi",
    "petang",
    "malam",
    "bukit",
    "sungai",
    "pulau",
    "planet",
    "permukaan bumi"
  ],
  "problemSolvingSteps": [
    "Kenal pasti perkataan tentang bumi.",
    "Fikir tentang siang dan malam.",
    "Bandingkan apa yang berlaku pada waktu berbeza.",
    "Pilih jawapan yang sesuai.",
    "Semak fakta bumi itu betul."
  ],
  "tips": [
    "Ingat bumi ialah tempat tinggal kita.",
    "Bumi berputar menyebabkan siang dan malam.",
    "Perhatikan waktu siang dan malam.",
    "Baca soalan dengan teliti.",
    "Pilih fakta bumi yang betul."
  ],
  "memoryTips": [
    "Bumi ialah rumah kita.",
    "Putaran bumi sebab siang malam.",
    "Siang terang, malam gelap.",
    "Bumi ada daratan dan air.",
    "Lihat langit dan permukaan bumi."
  ],
  "commonMistakes": [
    "Menganggap bumi tidak bergerak.",
    "Keliru siang dan malam.",
    "Tidak memahami putaran bumi.",
    "Meneka tanpa bukti.",
    "Memilih fakta yang salah tentang bumi."
  ],
  "scientificFacts": [
    "Bumi ialah planet tempat tinggal manusia.",
    "Bumi berputar pada paksinya.",
    "Putaran bumi menyebabkan siang dan malam.",
    "Bumi mempunyai daratan dan lautan.",
    "Kita tinggal di permukaan bumi.",
    "Matahari kelihatan pada waktu siang.",
    "Langit berubah mengikut waktu.",
    "Bumi adalah tempat hidup banyak makhluk hidup."
  ],
  "observationPrompts": [
    "Perhatikan langit pada waktu siang dan malam.",
    "Bandingkan terang dan gelap.",
    "Lihat bentuk permukaan bumi.",
    "Perhatikan tempat tinggal di sekeliling.",
    "Cari bukti bumi sebagai tempat hidup.",
    "Bandingkan daratan dan laut."
  ],
  "comparisonPrompts": [
    "Bandingkan siang dan malam.",
    "Bandingkan daratan dan lautan.",
    "Bandingkan pagi dan malam.",
    "Bandingkan tempat tinggi dan rendah.",
    "Bandingkan bumi dan langit."
  ],
  "investigationIdeas": [
    "Perhatikan perbezaan siang dan malam.",
    "Lukis bumi dan ruang hidup.",
    "Cari gambar daratan dan lautan.",
    "Buat jadual pemerhatian waktu harian."
  ],
  "realLifeConnections": [
    "Kita tinggal di bumi.",
    "Siang dan malam berlaku setiap hari.",
    "Bumi ada laut dan darat.",
    "Kita melihat cuaca di bumi.",
    "Bumi menyokong kehidupan."
  ],
  "safetyNotes": [
    "Perhatikan langit dengan selamat.",
    "Gunakan peta dan gambar dengan berhati-hati.",
    "Jangan cuba pemerhatian yang memerlukan alat berbahaya."
  ],
  "misconceptions": [
    "Bumi tidak berputar.",
    "Siang dan malam tidak berkait dengan bumi.",
    "Bumi tidak menjadi tempat tinggal.",
    "Malam lebih terang daripada siang.",
    "Bumi hanya ada darat tanpa laut."
  ],
  "evidenceQuestions": [
    "Apa bukti bumi berputar?",
    "Bagaimana siang dan malam berlaku?",
    "Apa yang kamu nampak pada waktu berbeza?",
    "Mengapa kamu pilih jawapan itu?",
    "Boleh kamu beri bukti daripada pemerhatian?",
    "Apakah ciri bumi sebagai tempat tinggal?"
  ],
  "relatedTopics": [
    "air",
    "cahaya",
    "bunyi"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal bumi dan kaitannya dengan siang serta malam.",
    "SP": "Murid dapat memerhati dan menerangkan ciri bumi secara mudah."
  },
  "keywords": [
    "bumi",
    "siang",
    "malam",
    "putaran",
    "planet",
    "darat",
    "laut",
    "permukaan",
    "tempat tinggal",
    "hidup",
    "langit",
    "waktu"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang bumi?",
    "Pilih jawapan yang sesuai tentang bumi.",
    "Yang manakah berkaitan dengan bumi?",
    "Cari maklumat yang betul tentang bumi.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Menganggap bumi tidak bergerak.",
    "Keliru siang dan malam.",
    "Meneka tanpa bukti.",
    "Tidak memahami putaran bumi.",
    "Memilih fakta yang salah.",
    "Mengabaikan kehidupan di bumi."
  ],
  "followUpQuestions": [
    "Apa bukti bumi berputar?",
    "Boleh kamu bandingkan siang dan malam?",
    "Bumi ini tempat siapa tinggal?",
    "Mengapa siang dan malam berlaku?",
    "Apa yang kamu perhatikan pada langit?",
    "Bolehkah kamu terangkan semula?",
    "Adakah bumi ada laut dan darat?",
    "Ciri mana yang paling jelas?"
  ]
});

export default knowledge;
