const TEACHING_RULES = [
  {
    keywords: ['kata nama', 'noun'],
    explanation: 'Kata nama ialah perkataan yang menamakan orang, haiwan, tempat atau benda.',
    examples: ['Ali ialah nama orang.', 'Kucing ialah nama haiwan.', 'Sekolah ialah nama tempat.'],
    commonMistakes: ['Memilih kata kerja sebagai jawapan.', 'Tidak membaca keseluruhan ayat sebelum menjawab.'],
    memoryTip: 'Ingat formula NAMA: nama orang, haiwan, tempat atau benda.'
  },
  {
    keywords: ['kata kerja', 'verb'],
    explanation: 'Kata kerja menunjukkan perbuatan atau aksi dalam ayat.',
    examples: ['Aina makan nasi.', 'Murid membaca buku.', 'They play football.'],
    commonMistakes: ['Keliru antara benda dan perbuatan.', 'Memilih perkataan yang menerangkan sifat.'],
    memoryTip: 'Jika boleh dibuat dengan badan atau fikiran, biasanya itu kata kerja.'
  },
  {
    keywords: ['kata adjektif', 'adjective'],
    explanation: 'Kata adjektif menerangkan sifat, warna, rasa, bentuk, saiz atau keadaan.',
    examples: ['Baju itu merah.', 'Beg itu berat.', 'The cat is small.'],
    commonMistakes: ['Memilih nama benda, bukan sifat benda.', 'Tidak semak perkataan yang menerangkan keadaan.'],
    memoryTip: 'Tanya “macam mana?” Jika jawapannya sifat, itu kata adjektif.'
  },
  {
    keywords: ['tambah', 'addition', 'plus'],
    explanation: 'Tambah bermaksud menggabungkan dua atau lebih nilai untuk mencari jumlah.',
    examples: ['3 + 2 = 5', '7 + 4 = 11', '10 + 5 = 15'],
    commonMistakes: ['Tertinggal satu nombor.', 'Tersilap kira apabila mengumpul semula.'],
    memoryTip: 'Tambah bergerak ke kanan pada garis nombor.'
  },
  {
    keywords: ['tolak', 'subtraction', 'minus'],
    explanation: 'Tolak bermaksud mencari baki atau beza selepas sebahagian nilai dikeluarkan.',
    examples: ['8 - 3 = 5', '12 - 4 = 8', '20 - 5 = 15'],
    commonMistakes: ['Menukar susunan nombor.', 'Menambah apabila soalan meminta baki.'],
    memoryTip: 'Tolak bergerak ke kiri pada garis nombor.'
  }
];

function normalize(value = '') {
  return String(value).toLowerCase();
}

function findTeachingRule(question = {}, topic = {}) {
  const text = normalize(`${topic.title || ''} ${topic.note || ''} ${question.topic || ''} ${question.uasa || ''} ${question.dskp || ''} ${question.q || ''} ${question.hint || ''}`);
  return TEACHING_RULES.find(rule => rule.keywords.some(keyword => text.includes(keyword)));
}

function fallbackLesson(question = {}, topic = {}) {
  const answer = question.answer || 'jawapan betul';
  const topicTitle = question.topic || topic.title || 'topik ini';
  return {
    explanation: `Untuk ${topicTitle}, fokus pada maksud soalan dan cari jawapan yang paling melengkapkan ayat. Dalam soalan ini, jawapan yang sesuai ialah "${answer}".`,
    examples: [`Contoh jawapan: ${answer}`, 'Baca ayat penuh sebelum memilih jawapan.', 'Semak petunjuk dalam soalan.'],
    commonMistakes: ['Menjawab terlalu cepat.', 'Tidak semak semula ruang kosong atau kata kunci.'],
    memoryTip: 'Baca, cari kata kunci, jawab, kemudian semak semula.'
  };
}

export function teachAnswer({ question = {}, topic = {}, explanationData = {} } = {}) {
  const rule = findTeachingRule(question, topic);
  const lesson = rule || fallbackLesson(question, topic);

  return {
    explanation: explanationData.explanation || question.explanation || lesson.explanation,
    examples: explanationData.examples?.length ? explanationData.examples : lesson.examples,
    commonMistakes: lesson.commonMistakes,
    memoryTip: lesson.memoryTip,
    practicePrompt: `Cuba jawab semula soalan ini dan sasarkan jawapan: ${question.answer || 'jawapan betul'}.`
  };
}
