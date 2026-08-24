import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Air dengan baik.",
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
      "Tak mengapa, cuba semak Air sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Air.",
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
  "topicId": "air",
  "displayName": "Air",
  "learningObjectives": [
    "Mengenal sifat dan kegunaan air.",
    "Memahami air sebagai keperluan hidup.",
    "Membandingkan keadaan air yang mudah dilihat."
  ],
  "teacherExplanation": [
    "Air sangat penting untuk manusia, haiwan dan tumbuhan.",
    "Air boleh didapati dalam bentuk cecair dan boleh berubah kepada ais atau wap apabila dipanaskan atau disejukkan.",
    "Kita menggunakan air untuk minum, mandi dan membersihkan diri.",
    "Murid Tahun 2 belajar memerhati air dan kegunaannya dalam kehidupan harian."
  ],
  "simpleExplanation": "Air penting untuk hidup dan digunakan dalam banyak kegiatan harian.",
  "workedExamples": [
    {
      "prompt": "Air berubah menjadi apa bila beku?",
      "steps": [
        "Air yang disejukkan menjadi pepejal.",
        "Jawapan: ais."
      ],
      "answer": "ais"
    },
    {
      "prompt": "Air digunakan untuk apa?",
      "steps": [
        "Air digunakan untuk minum dan mandi.",
        "Jawapan: minum dan mandi."
      ],
      "answer": "minum dan mandi"
    },
    {
      "prompt": "Bentuk air pada suhu bilik?",
      "steps": [
        "Air mengikut bentuk bekas.",
        "Ia ialah cecair.",
        "Jawapan: cecair."
      ],
      "answer": "cecair"
    },
    {
      "prompt": "Mengapa kita perlu minum air?",
      "steps": [
        "Air membantu tubuh berfungsi.",
        "Air penting untuk hidup.",
        "Jawapan: untuk hidup sihat."
      ],
      "answer": "untuk hidup sihat"
    },
    {
      "prompt": "Apa jadi bila air dipanaskan?",
      "steps": [
        "Air boleh menjadi wap.",
        "Jawapan: wap air."
      ],
      "answer": "wap air"
    }
  ],
  "examples": [
    "minum",
    "mandi",
    "mencuci",
    "air sungai",
    "air paip",
    "cecair",
    "ais",
    "wap air",
    "kolam",
    "laut"
  ],
  "extraExamples": [
    "botol air",
    "gelas air",
    "air hujan",
    "air laut",
    "air minuman",
    "tangki air",
    "hujan",
    "sungai"
  ],
  "problemSolvingSteps": [
    "Baca soalan tentang air dengan teliti.",
    "Kenal pasti keadaan air.",
    "Bandingkan perubahan air.",
    "Pilih jawapan yang sesuai.",
    "Semak sama ada fakta air itu betul."
  ],
  "tips": [
    "Ingat air ialah cecair.",
    "Lihat kegunaan air dalam hidup harian.",
    "Fikir tentang ais dan wap air.",
    "Baca soalan dengan teliti.",
    "Pilih fakta yang benar tentang air."
  ],
  "memoryTips": [
    "Air penting untuk hidup.",
    "Air boleh jadi ais.",
    "Air boleh jadi wap.",
    "Kita minum air setiap hari.",
    "Air digunakan untuk membersih."
  ],
  "commonMistakes": [
    "Menganggap air tidak penting.",
    "Tidak mengenal perubahan air.",
    "Keliru air dengan ais atau wap.",
    "Memilih jawapan yang tidak benar.",
    "Mengabaikan kegunaan harian air."
  ],
  "scientificFacts": [
    "Air ialah keperluan hidup.",
    "Air ialah cecair.",
    "Air boleh membeku menjadi ais.",
    "Air boleh menjadi wap apabila dipanaskan.",
    "Air digunakan untuk minum, mandi dan mencuci.",
    "Air tidak mempunyai warna, bau atau rasa yang ketara.",
    "Air penting untuk tumbuhan dan haiwan.",
    "Air mengikut bentuk bekas."
  ],
  "observationPrompts": [
    "Perhatikan air dalam bekas.",
    "Bandingkan air dan ais.",
    "Lihat apa berlaku apabila air dipanaskan.",
    "Perhatikan kegunaan air di rumah.",
    "Lihat bentuk air dalam bekas.",
    "Perhatikan air yang mengalir."
  ],
  "comparisonPrompts": [
    "Bandingkan air dan ais.",
    "Bandingkan cecair dan pepejal.",
    "Bandingkan air panas dan air sejuk.",
    "Bandingkan air di rumah dan air hujan.",
    "Bandingkan kegunaan air yang berbeza."
  ],
  "investigationIdeas": [
    "Perhatikan air dalam bekas berbeza.",
    "Lihat perubahan air menjadi ais.",
    "Lihat wap dari air panas dengan selamat.",
    "Buat carta kegunaan air harian."
  ],
  "realLifeConnections": [
    "Kita minum air setiap hari.",
    "Air digunakan untuk mandi dan mencuci.",
    "Air membantu tumbuhan hidup.",
    "Hujan membekalkan air.",
    "Air ada di sungai, laut dan paip rumah."
  ],
  "safetyNotes": [
    "Jangan sentuh air panas tanpa orang dewasa.",
    "Berhati-hati semasa memerhati ais atau wap.",
    "Gunakan air dengan cermat."
  ],
  "misconceptions": [
    "Air tidak penting untuk hidup.",
    "Air selalu panas.",
    "Air tidak boleh berubah bentuk.",
    "Ais bukan air.",
    "Wap air bukan daripada air."
  ],
  "evidenceQuestions": [
    "Apa bukti air penting untuk hidup?",
    "Bagaimana kamu tahu air ialah cecair?",
    "Apakah bukti perubahan air?",
    "Mengapa kamu memilih jawapan itu?",
    "Apa yang berlaku pada air apabila disejukkan?",
    "Bolehkah kamu beri contoh kegunaan air?"
  ],
  "relatedTopics": [
    "bumi",
    "bahan",
    "manusia",
    "tumbuhan"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal air dan kegunaannya.",
    "SP": "Murid dapat memerhati, membandingkan dan menerangkan perubahan serta kegunaan air secara mudah."
  },
  "keywords": [
    "air",
    "cecair",
    "ais",
    "wap",
    "minum",
    "mandi",
    "cuci",
    "hidup",
    "bekas",
    "suhu",
    "perubahan",
    "keperluan"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang air?",
    "Pilih jawapan yang sesuai tentang air.",
    "Yang manakah berkaitan dengan air?",
    "Cari maklumat yang betul tentang air.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih fakta air yang salah.",
    "Tidak memahami perubahan air.",
    "Keliru air dengan ais.",
    "Meneka tanpa bukti.",
    "Mengabaikan kegunaan air.",
    "Memilih jawapan yang tidak berkaitan."
  ],
  "followUpQuestions": [
    "Apa yang berlaku pada air itu?",
    "Bolehkah kamu beri contoh kegunaan air?",
    "Bagaimana air membantu hidup?",
    "Adakah air ini cecair atau ais?",
    "Apa bukti jawapan kamu?",
    "Bolehkah kamu terangkan semula?",
    "Apakah perubahan yang berlaku?",
    "Ciri mana yang paling jelas?"
  ]
});

export default knowledge;
