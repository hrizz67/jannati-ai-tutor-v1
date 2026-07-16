import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "sains",
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami Tumbuhan dengan baik.",
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
      "Tak mengapa, cuba semak Tumbuhan sekali lagi.",
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
      "Hebat! Kamu sangat mahir dengan Tumbuhan.",
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
  "topicId": "tumbuhan",
  "displayName": "Tumbuhan",
  "learningObjectives": [
    "Mengenal ciri asas tumbuhan.",
    "Memahami bahagian tumbuhan yang mudah.",
    "Mengenal keperluan tumbuhan untuk hidup."
  ],
  "teacherExplanation": [
    "Tumbuhan ialah benda hidup yang memerlukan air, udara dan cahaya matahari.",
    "Tumbuhan mempunyai bahagian seperti akar, batang, daun, bunga dan buah.",
    "Setiap bahagian tumbuhan mempunyai fungsi tersendiri.",
    "Murid Tahun 2 belajar memerhati tumbuhan di sekeliling dengan mudah."
  ],
  "simpleExplanation": "Tumbuhan ialah benda hidup yang mempunyai bahagian tertentu dan keperluan hidup.",
  "workedExamples": [
    {
      "prompt": "Bahagian yang menyerap air?",
      "steps": [
        "Akar berada di bawah tanah.",
        "Akar menyerap air.",
        "Jawapan: akar."
      ],
      "answer": "akar"
    },
    {
      "prompt": "Bahagian yang membuat makanan?",
      "steps": [
        "Daun menggunakan cahaya matahari.",
        "Daun membantu tumbuhan membuat makanan.",
        "Jawapan: daun."
      ],
      "answer": "daun"
    },
    {
      "prompt": "Bahagian yang menyokong tumbuhan?",
      "steps": [
        "Batang menegakkan tumbuhan.",
        "Ia menyokong daun dan bunga.",
        "Jawapan: batang."
      ],
      "answer": "batang"
    },
    {
      "prompt": "Tumbuhan perlukan apa untuk hidup?",
      "steps": [
        "Tumbuhan memerlukan air, udara dan cahaya matahari.",
        "Jawapan: air, udara dan cahaya matahari."
      ],
      "answer": "air, udara dan cahaya matahari"
    },
    {
      "prompt": "Bahagian yang menghasilkan biji?",
      "steps": [
        "Bunga membantu pembiakan.",
        "Buah atau bunga berkait dengan biji.",
        "Jawapan: bunga atau buah."
      ],
      "answer": "bunga atau buah"
    }
  ],
  "examples": [
    "akar",
    "batang",
    "daun",
    "bunga",
    "buah",
    "pokok",
    "rumput",
    "pucuk",
    "biji benih",
    "akar tunjang"
  ],
  "extraExamples": [
    "pokok mangga",
    "pokok bunga",
    "pokok kelapa",
    "paku pakis",
    "sayur bayam",
    "pokok pisang",
    "pokok kacang",
    "cendawan"
  ],
  "problemSolvingSteps": [
    "Perhatikan bahagian tumbuhan.",
    "Cari ciri yang disebut dalam soalan.",
    "Bandingkan bahagian tumbuhan.",
    "Pilih jawapan yang betul.",
    "Semak sama ada fakta itu benar."
  ],
  "tips": [
    "Lihat akar, batang, daun, bunga dan buah.",
    "Ingat tumbuhan perlukan air, udara dan cahaya matahari.",
    "Bandingkan bahagian tumbuhan.",
    "Baca soalan dengan teliti.",
    "Pilih bahagian yang sesuai."
  ],
  "memoryTips": [
    "Akar minum air.",
    "Daun buat makanan.",
    "Batang sokong tumbuhan.",
    "Bunga bantu pembiakan.",
    "Tumbuhan perlukan cahaya."
  ],
  "commonMistakes": [
    "Menyamakan tumbuhan dengan haiwan.",
    "Tidak mengenal bahagian tumbuhan.",
    "Keliru fungsi akar dan daun.",
    "Memilih jawapan tanpa bukti.",
    "Mengabaikan keperluan hidup tumbuhan."
  ],
  "scientificFacts": [
    "Tumbuhan ialah benda hidup.",
    "Tumbuhan memerlukan air untuk hidup.",
    "Daun membantu tumbuhan membuat makanan.",
    "Akar menyerap air.",
    "Batang menyokong tumbuhan.",
    "Tumbuhan memerlukan cahaya matahari.",
    "Tumbuhan menghasilkan oksigen.",
    "Sesetengah tumbuhan berbunga dan berbuah."
  ],
  "observationPrompts": [
    "Perhatikan bentuk daun.",
    "Lihat warna batang dan bunga.",
    "Bandingkan tumbuhan tinggi dan rendah.",
    "Cari bahagian akar.",
    "Perhatikan tumbuhan di taman.",
    "Lihat sama ada tumbuhan berbuah."
  ],
  "comparisonPrompts": [
    "Bandingkan daun besar dan kecil.",
    "Bandingkan pokok berbunga dan tidak berbunga.",
    "Bandingkan tumbuhan tinggi dan rendah.",
    "Bandingkan akar dan batang.",
    "Bandingkan tumbuhan di dalam pasu dan di tanah."
  ],
  "investigationIdeas": [
    "Lukis bahagian tumbuhan.",
    "Perhatikan tumbuhan di sekolah.",
    "Siram tumbuhan dan lihat perubahan.",
    "Buat carta keperluan tumbuhan."
  ],
  "realLifeConnections": [
    "Tumbuhan ada di taman dan kebun.",
    "Kita makan buah dan sayur.",
    "Tumbuhan memberi teduh.",
    "Tumbuhan membantu udara bersih.",
    "Tumbuhan perlu dijaga."
  ],
  "safetyNotes": [
    "Jangan memetik tumbuhan tanpa izin.",
    "Berhati-hati dengan daun berduri.",
    "Basuh tangan selepas menyentuh tanah."
  ],
  "misconceptions": [
    "Tumbuhan tidak hidup.",
    "Daun tidak penting.",
    "Semua tumbuhan sama.",
    "Tumbuhan tidak perlukan cahaya.",
    "Akar tidak menyerap air."
  ],
  "evidenceQuestions": [
    "Apakah bukti bahagian ini ialah akar?",
    "Bagaimana kamu tahu tumbuhan ini perlukan cahaya?",
    "Bahagian mana yang menyokong tumbuhan?",
    "Apa bukti daripada gambar ini?",
    "Mengapa kamu memilih jawapan itu?",
    "Boleh kamu tunjuk bahagian tumbuhan?"
  ],
  "relatedTopics": [
    "haiwan",
    "bumi",
    "cahaya",
    "air"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Mengenal ciri dan bahagian tumbuhan.",
    "SP": "Murid dapat memerhati, mengelaskan dan menerangkan keperluan tumbuhan secara mudah."
  },
  "keywords": [
    "tumbuhan",
    "akar",
    "batang",
    "daun",
    "bunga",
    "buah",
    "air",
    "cahaya",
    "udara",
    "hidup",
    "keperluan",
    "fotosintesis"
  ],
  "questionPatterns": [
    "Apakah yang betul tentang tumbuhan?",
    "Pilih jawapan yang sesuai tentang tumbuhan.",
    "Yang manakah berkaitan dengan tumbuhan?",
    "Cari maklumat yang betul tentang tumbuhan.",
    "Tentukan jawapan yang paling sesuai.",
    "Baca dengan teliti dan pilih jawapan.",
    "Apakah ciri atau fakta yang betul?",
    "Pilih jawapan yang menunjukkan pemahaman."
  ],
  "wrongAnswerPatterns": [
    "Memilih bukan tumbuhan.",
    "Tidak mengenal bahagian tumbuhan.",
    "Keliru fungsi bahagian.",
    "Meneka tanpa bukti.",
    "Mengabaikan keperluan hidup.",
    "Memilih fakta yang salah."
  ],
  "followUpQuestions": [
    "Bahagian mana yang kamu nampak?",
    "Boleh kamu bandingkan dua tumbuhan?",
    "Tumbuhan ini perlukan apa?",
    "Apa bukti jawapan kamu?",
    "Bolehkah kamu terangkan semula?",
    "Adakah tumbuhan ini berbunga?",
    "Bahagian mana yang menyerap air?",
    "Ciri mana yang paling jelas?"
  ]
});

export default knowledge;
