const AUTO_INTENTS = new Set(['', 'auto', 'general']);

const INTENT_ALIASES = Object.freeze({
  question_help: 'question_help',
  hint: 'hint',
  wrong_answer_coaching: 'wrong_answer_coaching',
  correct_answer_reinforcement: 'correct_answer_reinforcement',
  example_request: 'example_request',
  weak_topic: 'weak_topic',
  revision_plan: 'revision_plan',
  uasa_summary: 'uasa_summary'
});

const QUESTION_PATTERN = /^(?:apa|apakah|kenapa|mengapa|bagaimana|macam\s*mana|boleh(?:kah)?|what|why|how|can|could|ما|ماذا|لماذا|كيف)\b|[?؟]\s*$/iu;
const HELP_PATTERN = /\b(?:ajar|mengajar|terangkan|jelaskan|bantu|tolong|petunjuk|hint|contoh|cara\s+lain|tak\s+faham|tidak\s+faham|belum\s+faham|keliru|teach|explain|help|example|confused|understand)\b/iu;
const GREETING_PATTERN = /^(?:hai|hello|hi|salam|assalamualaikum|terima\s+kasih|thanks?)\b/iu;

function clean(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function comparable(value = '') {
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ms-MY')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function recentConversation(history = []) {
  const safeHistory = Array.isArray(history) ? history.filter(item => clean(item?.text)) : [];
  const lastStudentTurn = [...safeHistory].reverse().find(item => item?.role === 'user')?.text || '';
  const lastTutorTurn = [...safeHistory].reverse().find(item => item?.role === 'ai')?.text || '';
  return {
    lastStudentTurn: clean(lastStudentTurn),
    lastTutorTurn: clean(lastTutorTurn),
    hasHistory: safeHistory.length > 0
  };
}

function extractAnswerCandidate(prompt = '', options = {}) {
  const text = clean(prompt).replace(/[.!?؟]+$/g, '').trim();
  if (!text || GREETING_PATTERN.test(text) || HELP_PATTERN.test(text) || QUESTION_PATTERN.test(text)) return '';

  const labelled = text.match(/^(?:jawapan(?:\s+saya)?|saya\s+jawab|saya\s+rasa|mungkin)\s*(?:ialah|adalah|=|:)?\s*(.+)$/iu)?.[1];
  if (labelled) return clean(labelled);

  if (/^-?\d+(?:[.,]\d+)?$/.test(text)) return text.replace(',', '.');

  const accepted = [options.expectedAnswer, ...(Array.isArray(options.acceptedAnswers) ? options.acceptedAnswers : [])]
    .map(comparable)
    .filter(Boolean);
  if (accepted.includes(comparable(text))) return text;

  const words = text.split(/\s+/).filter(Boolean);
  if (options.hasExerciseContext && words.length <= 4 && text.length <= 60 && !/[?؟]/.test(prompt)) return text;
  return '';
}

function makeTurn(intent, messageType, confidence, extras = {}) {
  return {
    intent,
    messageType,
    confidence,
    isQuestion: false,
    needsClarification: false,
    answerCandidate: '',
    referencesPreviousTurn: false,
    clarifyingQuestion: '',
    quickReplies: [],
    ...extras
  };
}

export function understandStudentTurn({
  prompt = '',
  intent = '',
  history = [],
  expectedAnswer = '',
  acceptedAnswers = [],
  hasExerciseContext = false,
  hasLearningContext = false
} = {}) {
  const text = clean(prompt);
  const lower = text.toLocaleLowerCase('ms-MY');
  const explicitIntent = clean(intent).toLowerCase();
  const conversation = recentConversation(history);
  const referencesPreviousTurn = conversation.hasHistory && (
    /^(?:(?:kenapa|mengapa|bagaimana|macam\s*mana|why|how)(?:\s+(?:ini|itu|tadi|pula))?|apa\s+maksudnya)\s*[?؟]?$/iu.test(text) ||
    /^(?:yang\s+itu|yang\s+tadi|lagi|cara\s+lain)\b/iu.test(text)
  );

  if (!AUTO_INTENTS.has(explicitIntent) && INTENT_ALIASES[explicitIntent]) {
    return makeTurn(INTENT_ALIASES[explicitIntent], 'guided_action', 1, { ...conversation, referencesPreviousTurn });
  }

  if (/\b(?:topik\s+lemah|lemah\s+saya|weak\s+topic)\b/iu.test(lower)) return makeTurn('weak_topic', 'progress_question', 0.98, conversation);
  if (/\b(?:ulang\s*kaji|revision\s+plan|jadual\s+belajar|cadangan\s+belajar)\b/iu.test(lower)) return makeTurn('revision_plan', 'progress_question', 0.96, conversation);
  if (/\b(?:uasa|pentaksiran)\b/iu.test(lower) && /\b(?:saya|markah|prestasi|bagaimana|ringkasan)\b/iu.test(lower)) return makeTurn('uasa_summary', 'progress_question', 0.96, conversation);

  if (/^(?:saya\s+)?(?:dah|sudah|telah)?\s*faham\b|^(?:ok|baik),?\s*(?:saya\s+)?faham\b/iu.test(lower)) {
    return makeTurn('understanding_confirmation', 'understanding_signal', 0.98, {
      ...conversation,
      quickReplies: ['Cuba soalan latihan', 'Terangkan semula dengan ayat saya']
    });
  }

  if (/\b(?:tak|tidak|belum|masih\s+tak|masih\s+tidak)\s+faham\b|\bkeliru\b|\bconfused\b|\bdon'?t\s+understand\b/iu.test(lower)) {
    return makeTurn('misunderstanding', 'understanding_signal', 0.99, {
      ...conversation,
      referencesPreviousTurn: conversation.hasHistory,
      quickReplies: ['Terangkan cara lain', 'Beri contoh mudah', 'Bimbing langkah demi langkah']
    });
  }

  const answerCandidate = extractAnswerCandidate(text, { expectedAnswer, acceptedAnswers, hasExerciseContext });
  if (answerCandidate) {
    return makeTurn('direct_answer', 'answer_attempt', 0.96, { ...conversation, answerCandidate });
  }

  if (/\b(?:beri|bagi|minta|mahu|nak)?\s*(?:satu\s+)?(?:petunjuk|hint)\b/iu.test(lower)) return makeTurn('hint', 'help_request', 0.99, conversation);
  if (/\b(?:jawapan\s+saya\s+salah|kenapa\s+salah|silap\s+di\s+mana|where\s+did\s+i\s+go\s+wrong)\b/iu.test(lower)) return makeTurn('wrong_answer_coaching', 'help_request', 0.98, conversation);
  if (/\b(?:contoh|example)(?:\s+lagi|\s+mudah|\s+lain)?\b/iu.test(lower) || /^(?:lagi|satu\s+lagi)$/iu.test(lower)) {
    return makeTurn('example_request', 'knowledge_question', 0.97, { ...conversation, isQuestion: true, referencesPreviousTurn });
  }
  if (/\b(?:cara\s+lain|terangkan\s+lagi|jelaskan\s+lagi|ulang\s+semula|explain\s+again|another\s+way)\b/iu.test(lower)) {
    return makeTurn('alternative_explanation', 'follow_up_question', 0.98, { ...conversation, isQuestion: true, referencesPreviousTurn: conversation.hasHistory });
  }
  if (/\b(?:apa\s+beza|apakah\s+perbezaan|bezakan|bandingkan|difference\s+between|compare)\b/iu.test(lower)) {
    return makeTurn('comparison_question', 'knowledge_question', 0.99, { ...conversation, isQuestion: true });
  }
  if (/^(?:kenapa|mengapa|why|لماذا)\b/iu.test(lower)) {
    return makeTurn('why_question', 'knowledge_question', 0.98, { ...conversation, isQuestion: true, referencesPreviousTurn });
  }
  if (/^(?:bagaimana|macam\s*mana|how|كيف)\b/iu.test(lower) || /\b(?:ajar|tunjuk(?:kan)?\s+cara|langkah\s+demi\s+langkah|teach\s+me)\b/iu.test(lower)) {
    return makeTurn('how_question', 'knowledge_question', 0.96, { ...conversation, isQuestion: true, referencesPreviousTurn });
  }
  if (/^(?:apa(?:kah)?\s+(?:itu|maksud|erti)|what\s+is|what\s+does|ما|ماذا)\b/iu.test(lower)) {
    return makeTurn('knowledge_question', 'knowledge_question', 0.96, { ...conversation, isQuestion: true });
  }
  if (/\b(?:terangkan|jelaskan|bantu|tolong\s+ajar|explain|help\s+me)\b/iu.test(lower)) {
    return makeTurn('question_help', 'help_request', 0.93, { ...conversation, isQuestion: /[?؟]/.test(text) });
  }
  if (QUESTION_PATTERN.test(text)) return makeTurn('knowledge_question', 'knowledge_question', 0.82, { ...conversation, isQuestion: true, referencesPreviousTurn });

  if (/^(?:ini|itu|yang\s+ini|yang\s+itu|tolong|bantu|entah|tak\s+tahu|tidak\s+tahu)$/iu.test(lower)) {
    const clarifyingQuestion = hasLearningContext
      ? 'Bahagian mana yang kamu mahu saya terangkan: maksud, langkah, atau contoh?'
      : 'Kamu mahu belajar subjek atau topik apa?';
    return makeTurn('clarification_needed', 'ambiguous_request', 0.9, {
      ...conversation,
      needsClarification: true,
      clarifyingQuestion,
      quickReplies: hasLearningContext
        ? ['Terangkan maksud', 'Bimbing langkah demi langkah', 'Beri contoh mudah']
        : ['Bahasa Melayu', 'Matematik', 'Sains']
    });
  }

  return makeTurn('general', GREETING_PATTERN.test(text) ? 'social' : 'general', text ? 0.62 : 0.2, conversation);
}

export default {
  understandStudentTurn
};
