import { detectLearningCategory, getLearningExamples, sanitizeAiText, sanitizeChildFacingText } from './learningCopy.js';
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
  const explanation = sanitizeAiText(question.explanation || (category === 'generic' ? contextualGeneric : rule.explanation));
  const hint = sanitizeAiText(question.hint || rule.hint);
  const examples = buildBaseExamples(question, topic).map(item => sanitizeAiText(item));
  const commonMistakes = (rule.commonMistakes || []).map(item => sanitizeAiText(item));
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

  return {
    category,
    explanation,
    simpleExplanation: explanation,
    hint,
    examples,
    commonMistakes,
    memoryTip: sanitizeAiText(question.memoryTip || ''),
    encouragement: encouragementBase,
    answerLine: revealAnswer ? `Jawapan: ${correctAnswer}` : '',
    correctAnswer: revealAnswer ? correctAnswer : '',
    shortText: sanitizeChildFacingText(`${summary} ${wasCorrect ? explanation : hint}`),
    showCorrectAnswer: revealAnswer,
    sections: {
      summary,
      whyCorrect: explanation,
      hint,
      steps: examples.slice(0, 3),
      commonMistake: commonMistakes[0] || '',
      example: examples[0] || '',
      memoryTip: sanitizeAiText(question.memoryTip || ''),
      correctAnswer: revealAnswer ? correctAnswer : '',
      coachMessage: sanitizeChildFacingText(encouragementBase),
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
}
