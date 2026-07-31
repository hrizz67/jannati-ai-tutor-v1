import { detectLearningCategory, getLearningExamples, guardDistinctSections, sanitizeAiText, sanitizeChildFacingText } from './learningCopy.js';
import { getStudentProfileSummary, getTopicProgress } from './profile/index.js';
import { getMistakeContext } from './mistakes/index.js';

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

export function explainAnswer({ question = {}, topic = {}, result = {}, userAnswer = '', questionText = '', instruction = '', currentLearningObjective = '', attemptCount = 0, explanationMode = '' } = {}) {
  topic = topic || {};
  const category = detectLearningCategory(question, topic);
  const rule = CATEGORY_RULES[category] || CATEGORY_RULES.generic;
  const correctAnswer = sanitizeAiText(question.answer || 'jawapan yang betul');
  const stem = sanitizeAiText(questionText || question.q || question.question || question.stem || 'soalan ini');
  const contextualGeneric = `Dalam soalan ini, teliti "${stem}" dan padankan jawapan dengan arahan yang diberi.`;
  const subjectId = String(question.subjectId || topic.subjectId || '').toLowerCase();
  const isNumberOrder = subjectId === 'math' && /nombor\s+(?:selepas|sebelum)/i.test(stem);
  const isBmPronoun = subjectId === 'bm' && /kata ganti nama|menyiapkan kerja kelas|meja belajar/i.test(`${stem} ${topic.id || ''} ${topic.title || ''}`);
  const numberMatch = stem.match(/nombor\s+(selepas|sebelum)\s+(\d+)/i);
  const numberValue = numberMatch ? Number(numberMatch[2]) : null;
  const numberAnswer = numberMatch ? numberValue + (numberMatch[1].toLowerCase() === 'selepas' ? 1 : -1) : null;
  const explanation = sanitizeAiText(
    isNumberOrder
      ? `${numberValue} ${numberMatch[1].toLowerCase() === 'selepas' ? '+' : '-'} 1 = ${numberAnswer}. Nombor ${numberMatch[1].toLowerCase()} ${numberValue} ialah ${numberAnswer}.`
      : isBmPronoun
        ? 'Gunakan “Saya” apabila kamu bercakap tentang diri sendiri.'
        : question.explanation || (category === 'generic' ? contextualGeneric : rule.explanation)
  );
  const hint = sanitizeAiText(
    isNumberOrder
      ? (numberMatch[1].toLowerCase() === 'selepas' ? 'Tambah 1 pada nombor itu.' : 'Tolak 1 daripada nombor itu.')
      : isBmPronoun
        ? 'Fikirkan perkataan yang kamu guna untuk menyebut diri sendiri.'
        : question.hint || rule.hint
  );
  const examples = buildBaseExamples(question, topic).map(item => sanitizeAiText(item));
  const focus = isNumberOrder
    ? 'Mengenal nombor yang datang selepas sesuatu nombor.'
    : isBmPronoun
      ? 'Memilih kata ganti nama diri yang sesuai.'
      : sanitizeChildFacingText(currentLearningObjective || topic.learningObjective || topic.objective || 'Fahami kemahiran dalam soalan semasa.');
  const simpleExplanation = isNumberOrder
    ? 'Nombor selepas diperoleh dengan menambah 1.'
      : isBmPronoun
      ? 'Gunakan “Saya” apabila kamu bercakap tentang diri sendiri.'
      : explanation;
  const whyCorrect = isNumberOrder
    ? `${numberValue} + 1 = ${numberAnswer}, jadi ${numberAnswer} datang selepas ${numberValue}.`
      : isBmPronoun
      ? 'Orang dalam ayat itu bercakap tentang dirinya sendiri.'
      : explanation;
  const steps = isNumberOrder
    ? [`Lihat nombor ${numberValue}.`, 'Tambah 1.', `Jawapannya ialah ${numberAnswer}.`]
      : isBmPronoun
      ? ['Lihat siapa yang bercakap.', 'Pilih kata ganti nama untuk diri sendiri.', 'Gunakan “Saya”.']
      : examples.slice(0, 3);
  const example = isNumberOrder ? 'Nombor selepas 25 ialah 26.' : isBmPronoun ? 'Saya membaca buku.' : (examples[0] || '');
  const commonMistakes = (isNumberOrder
    ? ['Menambah atau menolak dengan arah yang salah.', 'Tidak menyemak urutan nombor.']
    : isBmPronoun
      ? ['Jangan pilih “dia” kerana “dia” digunakan untuk orang lain.', 'Tidak melihat siapa yang sedang bercakap.']
      : rule.commonMistakes || []).map(item => sanitizeAiText(item));
  const summary = sanitizeChildFacingText([
    questionText || question.q || question.question ? `Soalan: ${questionText || question.q || question.question}.` : '',
    instruction ? `Arahan: ${instruction}.` : '',
    ''
  ].filter(Boolean).join(' ')) || 'Mari kita semak soalan ini bersama-sama.';
  const studentProfile = getStudentProfileSummary('default');
  const topicProgress = getTopicProgress(studentProfile.studentId || 'default', question.subjectId || topic.subjectId || '', question.topicId || topic.id || '', studentProfile);
  const topicStatus = topicProgress?.status || 'new';
  const mistakeContext = getMistakeContext(studentProfile, question.subjectId || topic.subjectId || '', question.topicId || topic.id || '');
  const wasCorrect = result.status === 'correct';
  const wasAlmost = result.status === 'almost';
  const encouragementBase = wasCorrect
    ? (topicStatus === 'mastered'
    ? 'Hebat! Kamu sudah kuasai topik ini.'
    : topicStatus === 'good'
        ? 'Bagus! Kamu semakin yakin.'
        : 'Hebat! Teruskan usaha kamu.')
      : wasAlmost
        ? 'Sedikit lagi. Kamu hampir berjaya.'
      : mistakeContext.repeatedMistakes > 1
        ? 'Tak mengapa. Kita fokus pada kesilapan yang sama sedikit demi sedikit.'
        : topicStatus === 'weak'
        ? 'Tak mengapa. Kita ulang perlahan-lahan.'
        : 'Tak mengapa. Kita cuba sekali lagi.';

  const revealAnswer = Boolean(
    wasCorrect ||
    wasAlmost ||
    explanationMode === 'correct_answer_reinforcement' ||
    Number(attemptCount) >= 3
  );

  const response = {
    category,
    explanation,
    simpleExplanation,
    focus,
    whyCorrect,
    hint,
    examples,
    commonMistakes,
    memoryTip: sanitizeAiText(question.memoryTip || (isNumberOrder ? 'Nombor selepas tambah 1; nombor sebelum tolak 1.' : isBmPronoun ? '“Saya” untuk diri sendiri. “Dia” untuk orang lain.' : '')),
    encouragement: isBmPronoun
      ? (wasCorrect ? 'Bagus. Kamu sudah memilih kata ganti nama yang betul.' : 'Cuba fikirkan perkataan untuk diri sendiri.')
      : encouragementBase,
    answerLine: revealAnswer ? `Jawapan: ${correctAnswer}` : '',
    correctAnswer: revealAnswer ? correctAnswer : '',
    shortText: sanitizeChildFacingText(`${focus} ${wasCorrect ? whyCorrect : hint}`),
    showCorrectAnswer: revealAnswer,
    sections: {
      summary: focus,
      focus,
      simpleExplanation,
      whyCorrect,
      hint,
      steps,
      commonMistake: commonMistakes[0] || '',
      example,
      memoryTip: sanitizeAiText(question.memoryTip || (isNumberOrder ? 'Nombor selepas tambah 1; nombor sebelum tolak 1.' : isBmPronoun ? '“Saya” untuk diri sendiri. “Dia” untuk orang lain.' : '')),
      correctAnswer: revealAnswer ? correctAnswer : '',
      coachMessage: sanitizeChildFacingText(isBmPronoun
        ? (wasCorrect ? 'Bagus. Kamu sudah memilih kata ganti nama yang betul.' : 'Cuba fikirkan perkataan untuk diri sendiri.')
        : encouragementBase),
      learningObjective: sanitizeChildFacingText(currentLearningObjective || question.learningObjective || topic.learningObjective || topic.objective || '')
    },
    learningProfile: {
      studentId: studentProfile.studentId || 'default',
      topicStatus,
      accuracy: studentProfile.summary?.accuracy || 0,
      weakTopics: studentProfile.weakTopics || [],
      strongTopics: studentProfile.strongTopics || [],
      mistakeContext
    }
  };
  response.sections = guardDistinctSections(response.sections, stem, {
    summary: focus,
    focus,
    simpleExplanation,
    whyCorrect,
    hint,
    steps,
    example,
    commonMistake: commonMistakes[0] || '',
    memoryTip: response.memoryTip,
    coachMessage: response.encouragement
  });
  return response;
}
