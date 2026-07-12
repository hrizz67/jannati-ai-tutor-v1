import { detectLearningCategory, getLearningExamples, sanitizeAiText } from './learningCopy.js';

const CATEGORY_RULES = {
  person: {
    explanation: 'Jawapan ini betul kerana ia ialah nama orang yang sesuai dengan soalan.',
    hint: 'Cari nama orang yang sepadan dengan ayat.',
    commonMistakes: ['Memilih nama tempat.', 'Memilih perkataan yang bukan nama orang.']
  },
  place: {
    explanation: 'Jawapan ini betul kerana ia ialah nama tempat yang sesuai.',
    hint: 'Cari kata yang menamakan tempat.',
    commonMistakes: ['Memilih nama orang.', 'Memilih kata kerja atau sifat.']
  },
  animal: {
    explanation: 'Jawapan ini betul kerana ia menamakan haiwan yang tepat.',
    hint: 'Cari nama haiwan yang sesuai dengan ayat.',
    commonMistakes: ['Memilih benda atau tempat.', 'Memilih perkataan yang bukan haiwan.']
  },
  object: {
    explanation: 'Jawapan ini betul kerana ia ialah nama benda.',
    hint: 'Cari nama benda yang sepadan dengan ayat.',
    commonMistakes: ['Memilih nama orang.', 'Memilih kata kerja.']
  },
  verb: {
    explanation: 'Jawapan ini betul kerana ia menunjukkan perbuatan.',
    hint: 'Cari perkataan yang menunjukkan aksi.',
    commonMistakes: ['Memilih kata nama.', 'Memilih kata adjektif.']
  },
  adjective: {
    explanation: 'Jawapan ini betul kerana ia menerangkan sifat atau keadaan.',
    hint: 'Cari perkataan yang menerangkan rupa, saiz atau perasaan.',
    commonMistakes: ['Memilih nama benda.', 'Memilih perbuatan.']
  },
  penjodoh: {
    explanation: 'Jawapan ini betul kerana ia ialah penjodoh bilangan yang sesuai.',
    hint: 'Cari pasangan bilangan yang tepat untuk benda itu.',
    commonMistakes: ['Memilih kata nama biasa.', 'Menggunakan penjodoh yang tidak sesuai.']
  },
  simpulan: {
    explanation: 'Jawapan ini betul kerana ia ialah simpulan bahasa yang membawa maksud khas.',
    hint: 'Cari maksud yang paling sesuai dengan situasi ayat.',
    commonMistakes: ['Membaca setiap perkataan secara literal.', 'Memilih frasa yang tiada maksud khas.']
  },
  conjunction: {
    explanation: 'Jawapan ini betul kerana ia menghubungkan dua bahagian ayat dengan tepat.',
    hint: 'Cari kata hubung yang sesuai dengan maksud ayat.',
    commonMistakes: ['Memilih kata sendi nama.', 'Memilih kata nama.']
  },
  sendi: {
    explanation: 'Jawapan ini betul kerana ia ialah kata sendi nama yang sesuai.',
    hint: 'Cari kata sendi nama yang menunjukkan tempat atau arah.',
    commonMistakes: ['Memilih kata kerja.', 'Memilih kata hubung.']
  },
  generic: {
    explanation: 'Jawapan ini betul kerana ia melengkapkan maksud soalan dengan tepat.',
    hint: 'Baca soalan sekali lagi dan cari kata kunci penting.',
    commonMistakes: ['Menjawab terlalu cepat.', 'Tidak semak ayat penuh.']
  }
};

function buildBaseExamples(question, topic) {
  const examples = getLearningExamples(question, topic);
  return examples.length ? examples : ['Baca ayat sekali lagi.', 'Cari kata kunci penting.', 'Bandingkan dengan jawapan.'];
}

export function explainAnswer({ question = {}, topic = {}, result = {}, userAnswer = '' } = {}) {
  const category = detectLearningCategory(question, topic);
  const rule = CATEGORY_RULES[category] || CATEGORY_RULES.generic;
  const correctAnswer = sanitizeAiText(question.answer || 'jawapan yang betul');
  const explanation = sanitizeAiText(question.explanation || rule.explanation);
  const hint = sanitizeAiText(question.hint || rule.hint);
  const examples = buildBaseExamples(question, topic).map(item => sanitizeAiText(item));
  const commonMistakes = (rule.commonMistakes || []).map(item => sanitizeAiText(item));
  const wasCorrect = result.status === 'correct';
  const wasAlmost = result.status === 'almost';

  return {
    category,
    explanation,
    simpleExplanation: explanation,
    hint,
    examples,
    commonMistakes,
    memoryTip: sanitizeAiText(question.memoryTip || ''),
    encouragement: wasCorrect
      ? 'Hebat! Teruskan usaha kamu.'
      : wasAlmost
        ? 'Sedikit lagi. Kamu hampir berjaya.'
        : 'Tak mengapa. Kita cuba sekali lagi.',
    answerLine: `Jawapan: ${correctAnswer}`,
    correctAnswer
  };
}
