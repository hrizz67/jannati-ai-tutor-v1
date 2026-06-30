const CATEGORY_RULES = [
  {
    keywords: ['kata nama', 'noun', 'nouns'],
    explanation: 'Soalan ini meminta murid mengenal pasti nama orang, haiwan, tempat atau benda.',
    hint: 'Cari perkataan yang menamakan sesuatu.',
    examples: ['guru', 'kucing', 'sekolah', 'buku']
  },
  {
    keywords: ['kata kerja', 'verb', 'verbs'],
    explanation: 'Soalan ini berkaitan perbuatan atau aksi dalam ayat.',
    hint: 'Cari perkataan yang menunjukkan apa yang dibuat.',
    examples: ['makan', 'lari', 'read', 'write']
  },
  {
    keywords: ['kata adjektif', 'adjective', 'adjectives'],
    explanation: 'Soalan ini meminta murid mengenal pasti sifat atau keadaan sesuatu.',
    hint: 'Cari perkataan yang menerangkan rupa, warna, saiz atau perasaan.',
    examples: ['besar', 'cantik', 'happy', 'small']
  },
  {
    keywords: ['tambah', 'addition', 'plus'],
    explanation: 'Soalan ini menggunakan operasi tambah untuk menggabungkan nilai.',
    hint: 'Kumpulkan nombor dan kira jumlah semuanya.',
    examples: ['2 + 3 = 5', '10 + 4 = 14']
  },
  {
    keywords: ['tolak', 'subtraction', 'minus'],
    explanation: 'Soalan ini menggunakan operasi tolak untuk mencari baki atau beza.',
    hint: 'Mulakan dengan nombor besar, kemudian buang nilai yang diminta.',
    examples: ['8 - 3 = 5', '12 - 2 = 10']
  }
];

function normalize(value = '') {
  return String(value).toLowerCase();
}

function findRule(question = {}, topic = {}) {
  const text = normalize(`${topic.title || ''} ${topic.note || ''} ${question.topic || ''} ${question.uasa || ''} ${question.dskp || ''} ${question.q || ''} ${question.hint || ''}`);
  return CATEGORY_RULES.find(rule => rule.keywords.some(keyword => text.includes(keyword)));
}

function buildContext(question = {}, topic = {}) {
  const context = [
    question.topic || topic.title,
    question.uasa,
    question.dskp
  ].filter(Boolean);
  return context.length ? ` Konteks: ${context.join(' • ')}.` : '';
}

function fallbackExamples(question = {}) {
  const answer = question.answer ? String(question.answer) : 'jawapan tepat';
  return [
    `Jawapan contoh: ${answer}`,
    'Baca ayat sekali lagi dan cari petunjuk sebelum ruang kosong.',
    'Bandingkan jawapan dengan maksud ayat.'
  ];
}

export function explainAnswer({ question = {}, topic = {}, result = {}, userAnswer = '' } = {}) {
  const rule = findRule(question, topic);
  const correctAnswer = question.answer || 'jawapan yang betul';
  const context = buildContext(question, topic);
  const wasCorrect = result.status === 'correct';
  const wasAlmost = result.status === 'almost';

  return {
    explanation: `${question.explanation || rule?.explanation || `Jawapan yang sesuai ialah "${correctAnswer}" kerana ia melengkapkan maksud soalan.`}${context}`,
    hint: question.hint || rule?.hint || `Fokus pada kata kunci soalan dan bandingkan dengan jawapan "${correctAnswer}".`,
    examples: rule?.examples || fallbackExamples(question),
    encouragement: wasCorrect
      ? 'Hebat. Teruskan momentum ini.'
      : wasAlmost
        ? `Hampir tepat. Jawapan kamu "${userAnswer || '-'}" sudah dekat, cuba kemaskan lagi.`
        : 'Tidak mengapa. Cuba sekali lagi dengan melihat petunjuk dan contoh.'
  };
}
