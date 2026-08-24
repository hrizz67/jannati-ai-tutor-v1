const SUBJECT_GUIDANCE = {
  bm: { clues: 'Cari kata kunci dan baca ayat penuh.', label: 'Bahasa Melayu' },
  math: { clues: 'Kenal pasti operasi dan kira satu langkah pada satu masa.', label: 'Matematik' },
  english: { clues: 'Cari perkataan petunjuk dan baca ayat pendek.', label: 'Bahasa Inggeris' },
  sains: { clues: 'Perhati ciri, bandingkan bukti, kemudian buat pilihan.', label: 'Sains' },
  arab: { clues: 'Lihat tulisan Arab dari kanan ke kiri dan sebut perlahan.', label: 'Bahasa Arab' },
  islam: { clues: 'Fikirkan maksud pelajaran dan adab yang betul.', label: 'Pendidikan Islam' },
  pj: { clues: 'Pilih pergerakan yang selamat dan ikut arahan guru.', label: 'Pendidikan Jasmani' },
  pk: { clues: 'Pilih amalan yang sihat, bersih dan selamat.', label: 'Pendidikan Kesihatan' }
};

const MODE_BY_INTENT = {
  hint: 'coach',
  wrong_answer_coaching: 'coach',
  question_help: 'teacher',
  example_request: 'teacher',
  correct_answer_reinforcement: 'examiner',
  weak_topic: 'motivator',
  revision_plan: 'motivator',
  uasa_summary: 'motivator'
};

const BLOCKED_PHRASES = [
  'Mudah sahaja.',
  'Kamu patut tahu.',
  'Salah lagi.',
  'Kenapa tidak faham?',
  'Jawapan kamu teruk.'
];

function clean(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function list(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return clean(value) ? [clean(value)] : [];
}

function normalizeAnswer(value) {
  return clean(value).toLocaleLowerCase('ms-MY').replace(/[.!?,]/g, '');
}

export function resolveTutorMode({ intent = '', exerciseState = {}, learnerAnswer = '', isCorrect = false, attemptCount = 0, hintsUsed = 0, completionState = false } = {}) {
  if (completionState) return 'motivator';
  if (isCorrect || exerciseState?.status === 'correct') return 'examiner';
  return MODE_BY_INTENT[intent] || (learnerAnswer || attemptCount || hintsUsed ? 'coach' : 'teacher');
}

export function classifyMisconception({ instruction = '', options = [], expectedAnswer = '', learnerAnswer = '', subjectId = '', topicId = '', question = {} } = {}) {
  const instructionText = clean(instruction || question?.instruction || question?.q).toLowerCase();
  const expected = normalizeAnswer(expectedAnswer);
  const learner = normalizeAnswer(learnerAnswer);
  const choices = list(options).map(normalizeAnswer);
  if (!learner) return { type: 'no_meaningful_attempt', confidence: 0.9, evidence: 'Tiada jawapan diberikan.', childSafeLabel: 'Belum ada jawapan untuk disemak.', suggestedPrompt: 'Cuba pilih atau taip satu jawapan dahulu.' };
  if (learner === expected) return { type: 'none', confidence: 1, evidence: 'Jawapan sepadan.', childSafeLabel: '', suggestedPrompt: '' };

  const isMath = subjectId === 'math' || /kira|jumlah|beza|darab|bahagi|tambah|tolak/.test(instructionText);
  if (isMath && /tambah|jumlah|keseluruhan/.test(instructionText) && /tolak|beza|tinggal/.test(learner)) {
    return { type: 'addition_subtraction_confusion', confidence: 0.78, evidence: 'Petunjuk operasi tidak sepadan dengan jawapan.', childSafeLabel: 'Mari semak sama ada soalan meminta tambah atau tolak.', suggestedPrompt: 'Soalan ini menggabungkan atau mengurangkan nombor?' };
  }
  if (isMath && /nilai tempat|ratus|puluh|sa/.test(instructionText)) {
    return { type: 'place_value_confusion', confidence: 0.62, evidence: 'Soalan menyebut nilai tempat.', childSafeLabel: 'Mari lihat tempat setiap digit.', suggestedPrompt: 'Digit ini berada di tempat sa, puluh atau ratus?' };
  }
  if (subjectId === 'bm' && /nama (orang|murid|khas)|kata nama khas/.test(instructionText) && choices.some(item => item && item !== expected)) {
    return { type: 'common_noun_vs_proper_noun', confidence: 0.7, evidence: 'Arahan meminta nama khusus.', childSafeLabel: 'Kamu sudah menjumpai kata nama, tetapi soalan meminta nama khusus.', suggestedPrompt: 'Nama itu merujuk kepada orang atau nama khusus seseorang?' };
  }
  if (subjectId === 'bm' && /nama orang|siapakah|murid/.test(instructionText)) {
    return { type: 'object_instead_of_person', confidence: 0.66, evidence: 'Arahan meminta nama orang.', childSafeLabel: 'Soalan meminta nama orang, bukan nama benda.', suggestedPrompt: 'Perkataan ini nama orang atau nama benda?' };
  }
  if (subjectId === 'english' && /noun|person|place|thing/.test(instructionText)) {
    return { type: 'vocabulary_confusion', confidence: 0.58, evidence: 'Soalan meminta perkataan bahasa Inggeris tertentu.', childSafeLabel: 'Mari cari perkataan yang menamakan orang, tempat atau benda.', suggestedPrompt: 'Perkataan manakah yang menamakan sesuatu?' };
  }
  if (subjectId === 'sains' && /kelas|jenis|ciri|hidup|benda/.test(instructionText)) {
    return { type: 'classification_confusion', confidence: 0.58, evidence: 'Soalan meminta pengelasan berdasarkan ciri.', childSafeLabel: 'Mari semak satu ciri yang dapat dilihat.', suggestedPrompt: 'Apakah ciri yang sama pada pilihan ini?' };
  }
  if (subjectId === 'arab') {
    return { type: 'spelling_variation', confidence: 0.5, evidence: 'Jawapan Arab perlu disemak hurufnya.', childSafeLabel: 'Mari semak huruf dan bunyinya satu demi satu.', suggestedPrompt: 'Bunyi huruf ini bermula dengan huruf Arab yang mana?' };
  }
  return { type: 'general_misunderstanding', confidence: 0.35, evidence: 'Jawapan belum sepadan dengan kehendak soalan.', childSafeLabel: 'Mari kita semak petunjuk soalan bersama-sama.', suggestedPrompt: 'Apakah perkara utama yang diminta oleh soalan?' };
}

export function resolveSupportStage({ isCorrect = false, attemptCount = 0, hintsUsed = 0, explicitAnswerRequest = false, completionState = false } = {}) {
  if (completionState) return 'completed';
  if (isCorrect && Number(attemptCount) <= 1) return 'correct_first_try';
  if (isCorrect) return 'correct_after_support';
  if (explicitAnswerRequest || Number(attemptCount) >= 3 || Number(hintsUsed) >= 3) return 'answer_reveal_allowed';
  if (Number(hintsUsed) >= 2 || Number(attemptCount) >= 2) return 'strong_hint';
  if (Number(hintsUsed) === 1) return 'guiding_question';
  return 'incorrect_first';
}

export function getSubjectGuidance(subjectId = '') {
  return SUBJECT_GUIDANCE[subjectId] || { clues: 'Baca soalan perlahan-lahan dan cari kata kunci.', label: 'Subjek semasa' };
}

export function buildGuidedLearning({ subjectId = '', topicId = '', intent = '', instruction = '', options = [], expectedAnswer = '', learnerAnswer = '', isCorrect = false, attemptCount = 0, hintsUsed = 0, question = {}, completionState = false, explicitAnswerRequest = false } = {}) {
  const mode = resolveTutorMode({ intent, learnerAnswer, isCorrect, attemptCount, hintsUsed, completionState });
  const misconception = classifyMisconception({ instruction, options, expectedAnswer, learnerAnswer, subjectId, topicId, question });
  const stage = resolveSupportStage({ isCorrect, attemptCount, hintsUsed, explicitAnswerRequest, completionState });
  const guidance = getSubjectGuidance(subjectId);
  const revealAnswer = stage === 'answer_reveal_allowed' || isCorrect;
  const guidingQuestion = misconception.suggestedPrompt || 'Apakah petunjuk utama dalam soalan ini?';
  const hint = stage === 'incorrect_first'
    ? guidance.clues
    : stage === 'guiding_question'
      ? guidingQuestion
      : misconception.childSafeLabel || guidance.clues;
  const praise = isCorrect
    ? (stage === 'correct_first_try' ? 'Tepat. Kamu terus menjumpai jawapan yang diminta.' : 'Bagus! Kamu membetulkan jawapan selepas menggunakan petunjuk.')
    : (attemptCount >= 2 ? 'Kita buat perlahan-lahan. Saya bantu satu langkah pada satu masa.' : 'Hampir betul. Jom lihat petunjuk dalam soalan.');
  const nextAction = isCorrect ? 'Teruskan soalan seterusnya' : stage === 'answer_reveal_allowed' ? 'Cuba soalan ini lagi' : 'Jawab soalan kecil ini dahulu';
  return {
    mode,
    stage,
    misconception,
    hint: clean(hint),
    guidingQuestion: clean(guidingQuestion),
    quickReplies: stage === 'guiding_question' ? ['Nama orang', 'Nama benda'] : [],
    praise: clean(praise),
    nextAction,
    revealAnswer,
    guidance: guidance.clues
  };
}

export function limitTutorText(value, kind = 'hint') {
  const limits = { hint: 28, guidingQuestion: 18, explanation: 140, motivation: 20 };
  const text = clean(value);
  if (!text) return '';
  if (text.split(/\s+/).length <= (limits[kind] || 60)) return text;
  return `${text.split(/\s+/).slice(0, limits[kind] || 60).join(' ')}…`;
}

export function sanitizeTutorText(value) {
  let text = clean(value).replace(/[{}\[\]]/g, '');
  for (const blocked of BLOCKED_PHRASES) text = text.replaceAll(blocked, 'Tak mengapa.');
  return text.replace(/\b(?:subjectId|topicId|questionId|confidence|fallbackUsed)\s*[:=]\s*[^. ]+/gi, '').trim();
}

export const GUIDED_STATES = ['idle', 'greeting', 'awaiting_attempt', 'incorrect_first', 'guiding_question', 'incorrect_retry', 'strong_hint', 'answer_reveal_allowed', 'correct_first_try', 'correct_after_support', 'explanation', 'completed'];

export default {
  resolveTutorMode,
  classifyMisconception,
  resolveSupportStage,
  buildGuidedLearning,
  getSubjectGuidance,
  limitTutorText,
  sanitizeTutorText,
  GUIDED_STATES
};
