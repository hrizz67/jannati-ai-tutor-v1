import { detectLearningCategory, getLearningExamples, getLearningMemoryTip, getSubjectId, sanitizeAiText, sanitizeChildFacingText } from './learningCopy.js';
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
  properNoun: {
    explanation: 'Ini ialah kata nama khas yang merujuk kepada nama tertentu.',
    commonMistakes: ['Memilih kata nama am.', 'Menulis kata nama khas dengan huruf kecil.'],
    practicePrompt: 'Cuba cari satu lagi kata nama khas yang sesuai.'
  },
  generic: {
    explanation: 'Jawapan ini sesuai dengan maksud soalan.',
    commonMistakes: ['Menjawab terlalu cepat.', 'Tidak semak ayat penuh.'],
    practicePrompt: 'Baca semula soalan dan cuba sekali lagi.'
  }
};

const TEACHING_STEPS = {
  person: ['Baca ayat dan cari nama orang.', 'Semak nama itu merujuk kepada siapa.', 'Pilih nama orang yang paling sesuai dengan arahan.'],
  place: ['Baca ayat dan cari tempat yang disebut.', 'Semak tempat itu sesuai dengan maksud soalan.', 'Pilih kata nama tempat yang tepat.'],
  animal: ['Baca ayat dan kenal pasti haiwan yang disebut.', 'Cari ciri atau maklumat yang berkaitan.', 'Pilih nama haiwan yang paling sesuai.'],
  object: ['Baca ayat dan cari benda yang disebut.', 'Semak kegunaan atau ciri benda itu.', 'Pilih kata nama benda yang tepat.'],
  verb: ['Baca ayat dengan teliti.', 'Cari perkataan yang menunjukkan perbuatan.', 'Semak sama ada perbuatan itu sesuai dengan ayat.'],
  adjective: ['Baca ayat dan cari perkataan yang menerangkan.', 'Tentukan sifat atau keadaan yang dinyatakan.', 'Pilih kata adjektif yang paling sesuai.'],
  penjodoh: ['Kenal pasti benda dan bilangannya.', 'Pilih penjodoh bilangan yang sesuai.', 'Baca semula frasa untuk menyemak padanan.'],
  simpulan: ['Baca ayat dan kenal pasti situasinya.', 'Cari maksud simpulan bahasa, bukan maksud setiap perkataan.', 'Padankan maksud dengan situasi yang diberikan.'],
  conjunction: ['Baca kedua-dua bahagian ayat.', 'Kenal pasti hubungan antara bahagian ayat.', 'Pilih kata hubung yang paling sesuai.'],
  sendi: ['Baca ayat dan cari hubungan tempat atau arah.', 'Pilih kata sendi nama yang sesuai.', 'Baca semula ayat untuk menyemak maksudnya.'],
  generic: ['Baca soalan perlahan-lahan.', 'Cari kata kunci yang penting.', 'Semak jawapan dengan maksud soalan.']
};

const SUBJECT_TEACHING_DEFAULTS = {
  math: {
    commonMistakes: ['Memilih operasi yang salah.', 'Tidak menyemak pengiraan atau urutan nombor.'],
    practicePrompt: 'Cuba selesaikan satu soalan Matematik yang serupa.'
  },
  sains: {
    commonMistakes: ['Memilih ciri yang tidak berkaitan.', 'Tidak memadankan jawapan dengan konsep Sains.'],
    practicePrompt: 'Cuba jawab satu soalan Sains yang serupa.'
  },
  english: {
    commonMistakes: ['Memilih perkataan yang tidak sesuai dengan ayat.', 'Tidak menyemak maksud ayat penuh.'],
    practicePrompt: 'Try one more similar English question.'
  },
  arab: {
    commonMistakes: ['Memilih perkataan atau bentuk yang tidak tepat.', 'Tidak menyemak huruf dan maksud.'],
    practicePrompt: 'Cuba satu lagi soalan Bahasa Arab yang serupa.'
  },
  islam: {
    commonMistakes: ['Memilih amalan atau istilah yang tidak tepat.', 'Tidak menyemak maksud pelajaran.'],
    practicePrompt: 'Cuba satu lagi soalan Pendidikan Islam yang serupa.'
  },
  pj: {
    commonMistakes: ['Memilih pergerakan yang tidak sesuai.', 'Tidak mengikut arahan keselamatan.'],
    practicePrompt: 'Cuba satu lagi soalan aktiviti yang serupa.'
  },
  pk: {
    commonMistakes: ['Memilih tindakan yang tidak selamat.', 'Tidak menyemak kesan kepada kesihatan.'],
    practicePrompt: 'Cuba satu lagi soalan kesihatan yang serupa.'
  }
};

function hasForeignCategoryCopy(text = '', subjectId = '') {
  if (!subjectId || subjectId === 'bm') return false;
  return /nama tempat|nama orang|nama haiwan|nama benda|kata nama|kata kerja|kata adjektif|penjodoh bilangan|kata hubung|kata sendi|simpulan bahasa/i.test(String(text));
}

function getTeachingSteps({ question = {}, topic = {}, category = '', explanationData = {} } = {}) {
  const explainedSteps = explanationData?.sections?.steps;
  if (Array.isArray(explainedSteps) && explainedSteps.length) return explainedSteps;
  const subjectId = getSubjectId(question, topic);
  if (subjectId === 'math') return ['Kenal pasti nombor atau maklumat yang diberi.', 'Pilih operasi atau kaedah yang sesuai.', 'Kira dan semak jawapan.'];
  if (subjectId === 'english') return ['Read the sentence carefully.', 'Identify the word or form the question asks for.', 'Check the answer in the complete sentence.'];
  if (subjectId === 'sains') return ['Kenal pasti benda atau proses dalam soalan.', 'Cari ciri atau sebab yang berkaitan.', 'Padankan jawapan dengan konsep Sains.'];
  if (subjectId === 'arab') return ['Baca perkataan atau arahan dengan teliti.', 'Kenal pasti makna atau bentuk yang diminta.', 'Semak huruf dan jawapan sebelum memilih.'];
  if (subjectId === 'islam') return ['Kenal pasti amalan atau istilah dalam soalan.', 'Hubungkan dengan pelajaran yang berkaitan.', 'Semak jawapan supaya tepat dan beradab.'];
  if (subjectId === 'pj' || subjectId === 'pk') return ['Kenal pasti situasi atau aktiviti.', 'Pilih tindakan yang selamat dan sesuai.', 'Semak kesannya kepada kesihatan atau pergerakan.'];
  return TEACHING_STEPS[category] || TEACHING_STEPS.generic;
}

function getRule(question, topic) {
  const category = detectLearningCategory(question, topic);
  return { category, ...(TEACHING_RULES[category] || TEACHING_RULES.generic) };
}

export function teachAnswer({ question = {}, topic = {}, explanationData = {}, questionText = '', instruction = '', currentLearningObjective = '', attemptCount = 0, explanationMode = '' } = {}) {
  topic = topic || {};
  const rule = getRule(question, topic);
  const subjectId = String(question.subjectId || topic.subjectId || '').toLowerCase();
  const subjectDefaults = SUBJECT_TEACHING_DEFAULTS[subjectId];
  const stem = sanitizeAiText(questionText || question.q || question.question || question.stem || 'soalan ini');
  const contextualGeneric = `Mari kita teliti "${stem}" dan pilih jawapan yang paling sepadan dengan arahan.`;
  const explanation = sanitizeAiText(explanationData.explanation || question.explanation || (rule.category === 'generic' ? contextualGeneric : rule.explanation));
  const examples = (Array.isArray(explanationData.examples) && explanationData.examples.length ? explanationData.examples : getLearningExamples(question, topic))
    .map(item => sanitizeAiText(item));
  const memoryTip = sanitizeAiText(explanationData.memoryTip || question.memoryTip || getLearningMemoryTip(question, topic));
  const explanationMistakes = Array.isArray(explanationData.commonMistakes)
    ? explanationData.commonMistakes.filter(item => !hasForeignCategoryCopy(item, subjectId))
    : [];
  const commonMistakes = (explanationMistakes.length ? explanationMistakes : subjectDefaults?.commonMistakes || rule.commonMistakes)
    .map(item => sanitizeAiText(item));
  const steps = getTeachingSteps({ question, topic, category: rule.category, explanationData })
    .map(item => sanitizeAiText(item));
  const candidatePracticePrompt = explanationData.practicePrompt || rule.practicePrompt;
  const practicePrompt = sanitizeAiText(
    hasForeignCategoryCopy(candidatePracticePrompt, subjectId)
      ? (subjectDefaults?.practicePrompt || 'Cuba satu soalan yang serupa dengan topik ini.')
      : candidatePracticePrompt
  );
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
      steps,
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
