import { createKnowledgePack } from '../../schemas/knowledgeSchema.js';

const knowledge = createKnowledgePack({
  "subjectId": "math",
  "topicId": "nombor",
  "displayName": "Nombor Hingga 1000",
  "learningObjectives": [
    "Membaca, menulis dan membandingkan nombor hingga 1000.",
    "Mengenal nilai tempat ratus, puluh dan sa.",
    "Menggunakan nombor dalam situasi harian yang mudah."
  ],
  "teacherExplanation": [
    "Nombor hingga 1000 membantu murid membaca kuantiti yang lebih besar.",
    "Kita boleh lihat nilai tempat untuk memahami nombor dengan betul.",
    "Ratus, puluh dan sa bekerja bersama untuk membina nombor.",
    "Murid Tahun 2 perlu mengenal nombor, menyusun nombor dan membandingkan nombor dengan yakin."
  ],
  "simpleExplanation": "Nombor hingga 1000 boleh dibaca melalui nilai ratus, puluh dan sa.",
  "workedExamples": [
    {
      "prompt": "Baca 347.",
      "steps": [
        "3 ratus = 300",
        "4 puluh = 40",
        "7 sa = 7",
        "347 dibaca tiga ratus empat puluh tujuh."
      ],
      "answer": "tiga ratus empat puluh tujuh"
    },
    {
      "prompt": "Susun 125 dan 152.",
      "steps": [
        "Lihat nilai ratus dahulu.",
        "1 ratus sama.",
        "Bandingkan puluh: 2 dan 5.",
        "152 lebih besar kerana 5 puluh lebih besar daripada 2 puluh."
      ],
      "answer": "152 lebih besar"
    },
    {
      "prompt": "Nyatakan nilai digit 6 dalam 468.",
      "steps": [
        "Digit 6 berada pada tempat puluh.",
        "Nilai 6 puluh = 60."
      ],
      "answer": "60"
    },
    {
      "prompt": "Tulis nombor sebelum 400.",
      "steps": [
        "Nombor sebelum 400 ialah 399.",
        "Kira turun satu."
      ],
      "answer": "399"
    },
    {
      "prompt": "Tulis nombor selepas 799.",
      "steps": [
        "Nombor selepas 799 ialah 800.",
        "Tambah satu."
      ],
      "answer": "800"
    }
  ],
  "examples": [
    "101",
    "205",
    "347",
    "480",
    "512",
    "678",
    "700",
    "809",
    "900",
    "999"
  ],
  "extraExamples": [
    "123",
    "250",
    "361",
    "415",
    "560",
    "642",
    "731",
    "860"
  ],
  "problemSolvingSteps": [
    "Baca nombor dengan teliti.",
    "Kenal pasti nilai tempat.",
    "Bandingkan digit dari kiri ke kanan.",
    "Gunakan kaedah kira satu demi satu jika perlu.",
    "Semak jawapan sekali lagi."
  ],
  "tips": [
    "Cari nilai tempat ratus, puluh dan sa.",
    "Bandingkan nombor dari kiri ke kanan.",
    "Gunakan garis nombor jika perlu.",
    "Baca nombor dengan suara perlahan.",
    "Semak sama ada digit sudah tersusun betul."
  ],
  "memoryTips": [
    "Ratus dahulu, kemudian puluh, kemudian sa.",
    "Kira satu demi satu.",
    "Besar atau kecil lihat dari kiri.",
    "Nombor panjang belum tentu lebih besar.",
    "Nilai tempat sangat penting."
  ],
  "commonMistakes": [
    "Menganggap nombor dengan digit lebih banyak sentiasa lebih besar.",
    "Tersalah baca nilai tempat.",
    "Tidak membandingkan dari kiri ke kanan.",
    "Tersalah susun nombor.",
    "Lupa semak digit tengah."
  ],
  "encouragement": {
    "correct": [
      "Bagus! Kamu memahami nombor hingga 1000 dengan baik.",
      "Syabas! Jawapan kamu betul.",
      "Hebat! Kamu membaca soalan dengan teliti.",
      "Tahniah! Kamu semakin yakin.",
      "Cemerlang! Kamu membuat pilihan yang tepat.",
      "Mantap! Teruskan usaha ini.",
      "Bagus sekali! Kamu sudah berada pada jalan yang betul.",
      "Hebat benar! Kamu sangat teliti.",
      "Syabas, kamu menyelesaikan soalan ini dengan baik.",
      "Tahniah, kamu semakin mahir."
    ],
    "retry": [
      "Tak mengapa, cuba semak nombor hingga 1000 sekali lagi.",
      "Baca soalan dengan perlahan.",
      "Fikirkan operasi atau langkah yang sesuai.",
      "Ambil masa dan cuba lagi.",
      "Semak jawapan sebelum memilih.",
      "Lihat nombor dan unit dengan teliti.",
      "Cuba kira sekali lagi.",
      "Fokus pada kata kunci soalan.",
      "Kamu hampir betul, jangan putus asa.",
      "Baca semula langkah satu demi satu."
    ],
    "excellent": [
      "Hebat! Kamu sangat mahir dengan nombor hingga 1000.",
      "Cemerlang! Kamu memahami topik ini dengan yakin.",
      "Luar biasa! Penguasaan kamu sangat baik.",
      "Brilliant! Kamu menjawab dengan tepat.",
      "Mantap! Kamu boleh teruskan ke cabaran baharu.",
      "Syabas! Kamu membuat kiraan dengan sangat teliti.",
      "Bagus sekali! Kamu sangat yakin.",
      "Hebat benar! Teruskan kecemerlangan ini.",
      "Tahniah! Kamu sangat bersedia.",
      "Fantastic! Kamu telah melakukan yang terbaik."
    ]
  },
  "relatedTopics": [
    "tambah",
    "tolak",
    "wang",
    "masa"
  ],
  "difficulty": "easy",
  "curriculum": {
    "SK": "Membaca dan membandingkan nombor hingga 1000.",
    "SP": "Murid dapat menentukan nilai tempat dan urutan nombor."
  },
  "keywords": [
    "nombor",
    "ratus",
    "puluh",
    "sa",
    "nilai tempat",
    "banding",
    "besar",
    "kecil",
    "urutan",
    "baca",
    "tambah",
    "kurang"
  ],
  "questionPatterns": [
    "Apakah nombor ini?",
    "Nyatakan nilai tempat digit ini.",
    "Pilih nombor yang lebih besar.",
    "Susun nombor mengikut urutan.",
    "Baca nombor berikut.",
    "Nombor manakah datang selepas ini?",
    "Nombor manakah datang sebelum ini?",
    "Tentukan nilai digit tersebut."
  ],
  "wrongAnswerPatterns": [
    "Membaca nombor dengan nilai tempat salah.",
    "Memilih nombor yang lebih kecil.",
    "Mengabaikan digit di tengah.",
    "Tersalah susun nombor.",
    "Tidak memeriksa ratus, puluh dan sa.",
    "Menjawab tanpa membaca nombor penuh."
  ],
  "followUpQuestions": [
    "Digit mana yang berada pada tempat ratus?",
    "Boleh kamu baca nombor itu sekali lagi?",
    "Adakah nombor ini lebih besar atau lebih kecil?",
    "Apa nilai digit ini?",
    "Bagaimana kamu tahu urutan nombor ini?",
    "Bolehkah kamu beri nombor lain yang lebih besar?",
    "Apakah nombor selepas ini?",
    "Apakah nombor sebelum ini?"
  ]
});

export default knowledge;
