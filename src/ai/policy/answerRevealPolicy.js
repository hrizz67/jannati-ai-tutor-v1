import { getAcceptedAnswers } from '../../utils/acceptedAnswers.js';

export const ANSWER_REVEAL_STAGES = Object.freeze({
  BEFORE_SUBMISSION: 'before_submission',
  GUIDING_QUESTION: 'guiding_question',
  STRONG_HINT: 'strong_hint',
  ANSWER_REVEAL_ALLOWED: 'answer_reveal_allowed',
  CORRECT_REINFORCEMENT: 'correct_reinforcement',
  COMPLETED: 'completed'
});

const stripArabicMarks = value => String(value ?? '')
  .normalize('NFKC')
  .replace(/[\u0610-\u061a\u0640\u064b-\u065f\u0670\u06d6-\u06ed]/gu, '');

const ARABIC_NON_NOMINAL_ANSWERS = new Set([
  'لا', 'نعم', 'من', 'ما', 'في', 'عن', 'على', 'الى', 'إلى', 'هل', 'لم', 'لن', 'ثم', 'او', 'أو'
]);

function normalizeAttemptCount(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
}

export function textContainsExpectedAnswer(text = '', answers = []) {
  const value = stripArabicMarks(text);
  return (Array.isArray(answers) ? answers : [answers])
    .map(answer => stripArabicMarks(answer).trim())
    .filter(answer => answer && /[\p{L}\p{N}]/u.test(answer))
    .sort((left, right) => right.length - left.length)
    .some(answer => {
      const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isArabic = /\p{Script=Arabic}/u.test(answer);
      const arabicPrefix = isArabic
        ? ARABIC_NON_NOMINAL_ANSWERS.has(answer)
          ? '[وف]?'
          : '[وف]?(?:ال|بال|كال|لل|ب|ك|ل)?'
        : '';
      return new RegExp(`(^|[^\\p{L}\\p{N}])${arabicPrefix}${escaped}($|[^\\p{L}\\p{N}])`, 'iu').test(value);
    });
}

export function selectAnswerSafeText(candidates = [], answers = [], fallback = '') {
  const safe = (Array.isArray(candidates) ? candidates : [candidates])
    .map(value => String(value ?? '').trim())
    .find(value => value && !textContainsExpectedAnswer(value, answers));
  return safe || String(fallback || '').trim();
}

export function buildChildSafeHint(question = {}, subject = {}, candidates = []) {
  const answers = getAcceptedAnswers(question);
  const safeCandidate = selectAnswerSafeText(candidates, answers, '');
  if (safeCandidate && !safeCandidate.includes('=')) return safeCandidate;
  if (subject?.id === 'math') return 'Kenal pasti operasi yang digunakan, kemudian kira satu langkah pada satu masa. Semak jawapan dengan operasi songsang.';
  if (subject?.id === 'bm') return 'Cari kata kunci dalam ayat dan fikirkan maksud yang ditanya. Pilih jawapan yang paling sesuai.';
  if (subject?.id === 'english') return 'Find the key word, then check it against the complete sentence.';
  if (subject?.id === 'arab') return 'Lihat huruf, baris dan maksud yang diminta, kemudian cuba sekali lagi.';
  return 'Baca soalan perlahan-lahan, cari kata kunci penting, kemudian semak pilihan kamu sekali lagi.';
}

export function getAnswerRevealPolicy({
  status = '',
  isCorrect = false,
  isAlmostCorrect = false,
  attemptCount = 0,
  hintsUsed = 0,
  explanationMode = '',
  explicitAnswerRequest = false,
  allowExplicitAnswerReveal = false,
  specialPedagogy = false,
  completionState = false
} = {}) {
  const attempts = normalizeAttemptCount(attemptCount);
  const hints = normalizeAttemptCount(hintsUsed);
  const normalizedStatus = String(status || '').trim().toLowerCase();
  const normalizedMode = String(explanationMode || '').trim().toLowerCase();
  const correctState = Boolean(
    isCorrect ||
    isAlmostCorrect ||
    normalizedStatus === 'correct' ||
    normalizedStatus === 'almost' ||
    normalizedMode === 'correct_answer_reinforcement'
  );
  const answerWasRequested = Boolean(explicitAnswerRequest || normalizedMode === 'show_answer');
  const explicitRequestAllowed = answerWasRequested && Boolean(
    allowExplicitAnswerReveal || specialPedagogy || attempts >= 3 || correctState
  );
  const canRevealAnswer = Boolean(correctState || specialPedagogy || attempts >= 3 || explicitRequestAllowed);

  let stage = ANSWER_REVEAL_STAGES.BEFORE_SUBMISSION;
  if (completionState) stage = ANSWER_REVEAL_STAGES.COMPLETED;
  else if (correctState) stage = ANSWER_REVEAL_STAGES.CORRECT_REINFORCEMENT;
  else if (canRevealAnswer) stage = ANSWER_REVEAL_STAGES.ANSWER_REVEAL_ALLOWED;
  else if (attempts >= 2 || hints >= 2) stage = ANSWER_REVEAL_STAGES.STRONG_HINT;
  else if (attempts >= 1 || hints >= 1) stage = ANSWER_REVEAL_STAGES.GUIDING_QUESTION;

  return Object.freeze({
    stage,
    supportStage: stage,
    attemptCount: attempts,
    hintsUsed: hints,
    guidanceLevel: attempts <= 0 ? 0 : attempts === 1 ? 1 : attempts === 2 ? 2 : 3,
    canRevealAnswer,
    canShowExpectedAnswer: canRevealAnswer,
    answerWasRequested,
    explicitRequestAllowed,
    reason: correctState
      ? 'correct_reinforcement'
      : specialPedagogy
        ? 'special_pedagogy'
        : attempts >= 3
          ? 'third_attempt_or_later'
          : explicitRequestAllowed
            ? 'explicit_request_allowed'
            : 'guided_learning'
  });
}

export default getAnswerRevealPolicy;
