import { detectLearningCategory, getLearningExamples, getLearningMemoryTip, sanitizeAiText, sanitizeChildFacingText } from './learningCopy.js';
import { getStudentProfileSummary, getTopicProgress } from './profile/index.js';
import { getMistakeContext } from './mistakes/index.js';

const TEACHING_RULES = {
  person: {
    explanation: 'Ini ialah nama orang yang sesuai dengan soalan.',
    commonMistakes: ['Memilih nama tempat.', 'Memilih perkataan yang bukan nama orang.'],
    practicePrompt: 'Cuba cari satu lagi nama orang yang sesuai.'
  },
  place: {
    explanation: 'Ini ialah nama tempat yang tepat.',
    commonMistakes: ['Memilih nama orang.', 'Memilih kata kerja.'],
    practicePrompt: 'Cuba cari satu lagi nama tempat yang sesuai.'
  },
  animal: {
    explanation: 'Ini ialah nama haiwan yang betul.',
    commonMistakes: ['Memilih benda atau tempat.', 'Memilih perkataan yang bukan haiwan.'],
    practicePrompt: 'Cuba cari satu lagi nama haiwan yang sesuai.'
  },
  object: {
    explanation: 'Ini ialah nama benda yang sesuai.',
    commonMistakes: ['Memilih nama orang.', 'Memilih kata kerja.'],
    practicePrompt: 'Cuba cari satu lagi nama benda yang sesuai.'
  },
  verb: {
    explanation: 'Ini ialah kata kerja kerana ia menunjukkan perbuatan.',
    commonMistakes: ['Memilih kata nama.', 'Memilih kata adjektif.'],
    practicePrompt: 'Cuba cari satu lagi kata kerja yang sesuai.'
  },
  adjective: {
    explanation: 'Ini ialah kata adjektif kerana ia menerangkan sifat atau keadaan.',
    commonMistakes: ['Memilih nama benda.', 'Memilih perbuatan.'],
    practicePrompt: 'Cuba cari satu lagi kata adjektif yang sesuai.'
  },
  penjodoh: {
    explanation: 'Ini ialah penjodoh bilangan yang sesuai dengan benda itu.',
    commonMistakes: ['Memilih kata nama biasa.', 'Menggunakan penjodoh yang tidak sesuai.'],
    practicePrompt: 'Cuba cari satu lagi penjodoh bilangan yang sesuai.'
  },
  simpulan: {
    explanation: 'Ini ialah simpulan bahasa yang membawa maksud khas.',
    commonMistakes: ['Membaca setiap perkataan secara literal.', 'Memilih frasa yang tiada maksud khas.'],
    practicePrompt: 'Cuba cari maksud khas yang sama dengan ayat.'
  },
  conjunction: {
    explanation: 'Ini ialah kata hubung yang menghubungkan dua bahagian ayat.',
    commonMistakes: ['Memilih kata sendi nama.', 'Memilih kata nama.'],
    practicePrompt: 'Cuba cari kata hubung yang sesuai dengan ayat.'
  },
  sendi: {
    explanation: 'Ini ialah kata sendi nama yang menunjukkan tempat atau arah.',
    commonMistakes: ['Memilih kata kerja.', 'Memilih kata hubung.'],
    practicePrompt: 'Cuba cari kata sendi nama yang sesuai.'
  },
  generic: {
    explanation: 'Jawapan ini sesuai dengan maksud soalan.',
    commonMistakes: ['Menjawab terlalu cepat.', 'Tidak semak ayat penuh.'],
    practicePrompt: 'Baca semula soalan dan cuba sekali lagi.'
  }
};

function getRule(question, topic) {
  const category = detectLearningCategory(question, topic);
  return { category, ...(TEACHING_RULES[category] || TEACHING_RULES.generic) };
}

export function teachAnswer({ question = {}, topic = {}, explanationData = {}, questionText = '', instruction = '', currentLearningObjective = '', attemptCount = 0, explanationMode = '' } = {}) {
  const rule = getRule(question, topic);
  const explanation = sanitizeAiText(explanationData.explanation || question.explanation || rule.explanation);
  const examples = (Array.isArray(explanationData.examples) && explanationData.examples.length ? explanationData.examples : getLearningExamples(question, topic))
    .map(item => sanitizeAiText(item));
  const memoryTip = sanitizeAiText(explanationData.memoryTip || question.memoryTip || getLearningMemoryTip(question, topic));
  const commonMistakes = (Array.isArray(explanationData.commonMistakes) && explanationData.commonMistakes.length ? explanationData.commonMistakes : rule.commonMistakes)
    .map(item => sanitizeAiText(item));
  const practicePrompt = sanitizeAiText(explanationData.practicePrompt || rule.practicePrompt);
  const subjectLabel = (question.subjectId || topic.subjectId) === 'english' ? 'Bahasa Inggeris' : '';
  const summary = sanitizeChildFacingText([
    questionText || question.q || question.question ? `Soalan: ${questionText || question.q || question.question}.` : '',
    instruction ? `Arahan: ${instruction}.` : '',
    subjectLabel ? `Subjek: ${subjectLabel}.` : '',
    ''
  ].filter(Boolean).join(' ')) || 'Mari kita belajar langkah demi langkah.';
  const studentProfile = getStudentProfileSummary('default');
  const topicProgress = getTopicProgress(studentProfile.studentId || 'default', question.subjectId || topic.subjectId || '', question.topicId || topic.id || '', studentProfile);
  const topicStatus = topicProgress?.status || 'new';
  const mistakeContext = getMistakeContext(studentProfile, question.subjectId || topic.subjectId || '', question.topicId || topic.id || '');
  const profileAwarePracticePrompt = topicStatus === 'mastered'
    ? 'Kamu sudah mahir. Cuba soalan yang lebih mencabar.'
    : mistakeContext.repeatedMistakes > 1
      ? 'Kita ulang kesilapan yang sama perlahan-lahan.'
      : topicStatus === 'weak'
      ? 'Kita ulang asasnya perlahan-lahan.'
      : topicStatus === 'needs_practice'
        ? 'Ulang sekali lagi langkah yang penting.'
        : practicePrompt;

  return {
    category: rule.category,
    explanation,
    examples,
    commonMistakes,
    memoryTip,
    practicePrompt: profileAwarePracticePrompt,
    shortText: sanitizeChildFacingText(`${summary} ${explanation}`),
    sections: {
      summary,
      whyCorrect: explanation,
      hint: sanitizeAiText(question.hint || rule.practicePrompt),
      steps: examples.slice(0, 3),
      commonMistake: commonMistakes[0] || '',
      example: examples[0] || '',
      memoryTip,
      coachMessage: sanitizeChildFacingText(profileAwarePracticePrompt),
      practicePrompt: profileAwarePracticePrompt,
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
