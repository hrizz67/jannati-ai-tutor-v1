const AUTO_INTENTS = new Set(['', 'auto', 'general']);
const KNOWLEDGE_QUESTION = 'knowledge_question';
const QUESTION_HELP = 'question_help';
const FOLLOW_UP_QUESTION = 'follow_up_question';

const INTENT_ALIASES = Object.freeze({
  [QUESTION_HELP]: QUESTION_HELP,
  hint: 'hint',
  wrong_answer_coaching: 'wrong_answer_coaching',
  correct_answer_reinforcement: 'correct_answer_reinforcement',
  example_request: 'example_request',
  alternative_explanation: 'alternative_explanation',
  understanding_confirmation: 'understanding_confirmation',
  misunderstanding: 'misunderstanding',
  recovery_meaning: 'recovery_meaning',
  recovery_first_step: 'recovery_first_step',
  adult_support_acknowledgement: 'adult_support_acknowledgement',
  learning_recommendation: 'learning_recommendation',
  weak_topic: 'weak_topic',
  revision_plan: 'revision_plan',
  uasa_summary: 'uasa_summary'
});

const QUESTION_PATTERN = /^(?:(?:apa|apakah|kenapa|mengapa|bagaimana|macam\s*mana|boleh(?:kah)?|what|why|how|which|where|when|who|can|could)\b|(?:ما|ماذا|لماذا|كيف|أين|متى|من|هل)(?:\s|$))|[?؟]\s*$/iu;
const HELP_PATTERN = /(?:\b(?:ajar|mengajar|terangkan|jelaskan|bantu|tolong|petunjuk|hint|contoh|cara\s+lain|tak\s+faham|tidak\s+faham|belum\s+faham|keliru|teach|explain|help|example|confused|understand|show\s+me|give\s+me\s+a\s+clue|don'?t\s+get\s+it)\b|(?:ساعدني|اشرح|مثال|تلميح|لا\s+أفهم|لم\s+أفهم))/iu;
const GREETING_PATTERN = /^(?:(?:hai|hello|hi|salam|assalamualaikum|selamat\s+(?:pagi|tengah\s+hari|petang|malam)|apa\s+khabar|terima\s+kasih|thanks?)\b|(?:مرحبا|السلام\s+عليكم|شكرا)(?:\s|$))/iu;
const SOCIAL_ONLY_PATTERN = /^(?:(?:hai|hello|hi|salam|assalamualaikum|selamat\s+(?:pagi|tengah\s+hari|petang|malam)|apa\s+khabar|terima\s+kasih|thanks?)(?:\s+cikgu)?|(?:مرحبا|السلام\s+عليكم|شكرا))[.!?؟]*$/iu;
const LEARNING_RECOMMENDATION_PATTERN = /(?:\b(?:hari\s*(?:ini|ni)|sekarang)\b.{0,35}\b(?:belajar|ulang\s*kaji)\b|\b(?:belajar|ulang\s*kaji)\b.{0,25}\b(?:apa|mana)\b|\b(?:apa|mana)\b.{0,30}\b(?:patut|perlu|mahu|nak|boleh)?\s*(?:saya\s+)?(?:belajar|ulang\s*kaji)\b|\b(?:cadang(?:an|kan)?|saran(?:an|kan)?|pilih)\b.{0,30}\b(?:topik|pelajaran|belajar)\b|\b(?:mula|mulakan|jom)\b.{0,20}\b(?:sesi|latihan)\s+(?:ringkas|hari\s*(?:ini|ni))\b|\bwhat\s+should\s+i\s+(?:learn|study)\b|\bchoose\s+(?:a\s+)?topic\b)/iu;
const NAMED_LEARNING_REQUEST_PATTERN = /(?:\b(?:saya\s+)?(?:nak|mahu|hendak)\s+belajar\s+\S|\bjom\s+belajar\s+\S|\bmula(?:kan)?\s+(?:belajar|topik)\s+\S)/iu;
const TOPIC_CHANGE_PATTERN = /(?:\b(?:tukar|ubah|pindah)\s+(?:ke\s+)?(?:topik|pelajaran)\s+\S|\b(?:belajar|cuba)\s+topik\s+(?:lain|baru)\b|\b(?:switch|change)\s+(?:to\s+)?(?:a\s+)?(?:new\s+)?topic\b|(?:غيّر\s+الموضوع|موضوع\s+جديد))/iu;
const TUTOR_IDENTITY_PATTERN = /\b(?:siapa\s+(?:awak|kamu|cikgu)|awak\s+(?:siapa|boleh\s+buat\s+apa)|apa\s+yang\s+(?:awak|cikgu)\s+boleh\s+(?:buat|bantu))\b/iu;
const LEARNER_STATE_PATTERN = /\b(?:saya\s+)?(?:penat|letih|bosan|takut|risau|sedih|seronok|gembira|teruja)\b/iu;
const CONTINUATION_PATTERN = /^(?:(?:se)?lepas (?:tu|itu)|pastu|kemudian|(?:(?:yang|langkah) )?seterusnya|apa\s+langkah\s+seterusnya|then(?: what)?|what(?:'s| is)? next|next step|what\s+should\s+i\s+do\s+next|وماذا\s+بعد|الخطوة\s+التالية)[.!?؟]*$/iu;
const MEANING_FOLLOW_UP_PATTERN = /^(?:apa\s+maksud(?:nya|\s+(?:itu|tadi))|maksudnya|what\s+does\s+(?:that|it)\s+mean|ما\s+معنى\s+(?:ذلك|هذا)|ماذا\s+يعني\s+(?:ذلك|هذا))[.!?؟]*$/iu;
const RECOVERABLE_TEACHING_STAGES = new Set([
  'concept_explanation', 'alternative_strategy', 'guided_small_step',
  'verified_micro_example', 'evidence_guided_correction',
  'recovery_meaning', 'recovery_first_step', 'example'
]);

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

function recentConversation(history = [], activeConcept = '') {
  const safeHistory = Array.isArray(history) ? history.filter(item => clean(item?.text)) : [];
  const lastStudentTurn = [...safeHistory].reverse().find(item => item?.role === 'user')?.text || '';
  const lastTutorMessage = [...safeHistory].reverse().find(item => item?.role === 'ai');
  return {
    lastStudentTurn: clean(lastStudentTurn),
    lastTutorTurn: clean(lastTutorMessage?.text),
    hasHistory: Boolean(lastStudentTurn),
    hasTeachingStage: Boolean(
      safeHistory.at(-1)?.role === 'ai' &&
      clean(activeConcept) &&
      lastTutorMessage?.pedagogicalState?.currentConcept === clean(activeConcept) &&
      RECOVERABLE_TEACHING_STAGES.has(lastTutorMessage?.pedagogicalState?.supportStage)
    )
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

  if (options.hasExerciseContext && !options.continuation && text.split(/\s+/).length <= 4 && text.length <= 60 && !/[?؟]/.test(prompt)) return text;
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
  hasLearningContext = false,
  activeConcept = ''
} = {}) {
  const text = clean(prompt);
  const lower = text.toLocaleLowerCase('ms-MY');
  const explicitIntent = clean(intent).toLowerCase();
  const conversation = recentConversation(history, activeConcept);
  const referencesPreviousTurn = conversation.hasHistory && (
    /^(?:(?:kenapa|mengapa|bagaimana|macam\s*mana|why|how|لماذا|كيف)(?:\s+(?:ini|itu|tadi|pula))?|apa\s+maksudnya|what\s+does\s+that\s+mean)\s*[?؟]?$/iu.test(text) ||
    /^(?:yang\s+itu|yang\s+tadi|lagi|cara\s+lain|that\s+one|the\s+previous\s+one|again|مرة\s+أخرى|ذلك|السابق)\b/iu.test(text)
  );

  if (!AUTO_INTENTS.has(explicitIntent) && INTENT_ALIASES[explicitIntent]) {
    return makeTurn(INTENT_ALIASES[explicitIntent], 'guided_action', 1, { ...conversation, referencesPreviousTurn });
  }

  if (SOCIAL_ONLY_PATTERN.test(text)) return makeTurn('general', 'social', 0.99, conversation);

  if (/\b(?:topik\s+lemah|lemah\s+saya|weak\s+topic)\b/iu.test(lower)) return makeTurn('weak_topic', 'progress_question', 0.98, conversation);
  if (LEARNING_RECOMMENDATION_PATTERN.test(lower)) {
    return makeTurn('learning_recommendation', 'learning_plan_question', 0.99, {
      ...conversation,
      isQuestion: true,
      quickReplies: ['Pilih topik untuk saya', 'Mulakan sesi ringkas', 'Lihat perkara yang perlu dilatih']
    });
  }
  if (TUTOR_IDENTITY_PATTERN.test(lower)) {
    return makeTurn('tutor_identity', 'social', 0.99, {
      ...conversation,
      isQuestion: true,
      quickReplies: ['Cadangkan apa untuk belajar', 'Ajar saya satu topik', 'Bantu latihan saya']
    });
  }
  if (LEARNER_STATE_PATTERN.test(lower)) {
    const learnerState = /penat|letih/.test(lower)
      ? 'tired'
      : /bosan/.test(lower)
        ? 'bored'
        : /takut|risau|sedih/.test(lower)
          ? 'worried'
          : 'positive';
    return makeTurn('learner_state', 'emotional_signal', 0.98, {
      ...conversation,
      learnerState,
      quickReplies: learnerState === 'positive'
        ? ['Jom mula belajar', 'Pilih topik untuk saya', 'Beri cabaran ringkas']
        : ['Buat sesi 5 minit', 'Pilih topik mudah', 'Rehat dahulu']
    });
  }
  if (/\b(?:ulang\s*kaji|revision\s+plan|jadual\s+belajar|cadangan\s+belajar)\b/iu.test(lower)) return makeTurn('revision_plan', 'progress_question', 0.96, conversation);
  if (/\b(?:uasa|pentaksiran)\b/iu.test(lower) && /\b(?:saya|markah|prestasi|bagaimana|ringkasan)\b/iu.test(lower)) return makeTurn('uasa_summary', 'progress_question', 0.96, conversation);
  if (TOPIC_CHANGE_PATTERN.test(lower) || NAMED_LEARNING_REQUEST_PATTERN.test(lower)) {
    return makeTurn('how_question', 'new_topic_request', 0.97, {
      ...conversation,
      isQuestion: true,
      newTopicRequest: true
    });
  }

  if (/^(?:saya\s+)?(?:dah|sudah|telah)?\s*faham\b|^(?:ok|baik),?\s*(?:saya\s+)?faham\b/iu.test(lower)) {
    return makeTurn('understanding_confirmation', 'understanding_signal', 0.98, {
      ...conversation,
      quickReplies: ['Cuba soalan latihan', 'Terangkan semula dengan ayat saya']
    });
  }

  if (/\b(?:tak|tidak|belum|masih\s+tak|masih\s+tidak)\s+faham\b|\b(?:tak|tidak)\s+tahu\b|\bkeliru\b|\bconfused\b|\bdon'?t\s+understand\b|\bi\s+don'?t\s+get\s+it\b|(?:لا\s+أفهم|لم\s+أفهم|أنا\s+محتار)/iu.test(lower)) {
    return makeTurn('misunderstanding', 'understanding_signal', 0.99, {
      ...conversation,
      referencesPreviousTurn: conversation.hasHistory,
      quickReplies: ['Terangkan cara lain', 'Beri contoh mudah', 'Bimbing langkah demi langkah']
    });
  }

  if (/^(?:yang\s+tadi|yang\s+itu)[.!?？]*$/iu.test(lower)) {
    return makeTurn('clarification_needed', 'ambiguous_request', 0.96, {
      ...conversation,
      referencesPreviousTurn: conversation.hasHistory,
      needsClarification: true,
      clarifyingQuestion: 'Baik, kita kekal pada langkah tadi. Bahagian mana yang kamu mahu saya terangkan?',
      quickReplies: ['Terangkan langkah tadi', 'Beri petunjuk', 'Saya mahu cuba lagi']
    });
  }

  // Only resume a teaching step when there is a recent, scoped pedagogical response.
  // A greeting or a stale ungrounded chat turn must not manufacture a teaching stage.
  if (hasExerciseContext && conversation.hasHistory && conversation.hasTeachingStage && MEANING_FOLLOW_UP_PATTERN.test(lower)) {
    return makeTurn('recovery_meaning', FOLLOW_UP_QUESTION, 0.99, {
      ...conversation, isQuestion: true, referencesPreviousTurn: true
    });
  }
  const continuation = hasExerciseContext && conversation.hasHistory && CONTINUATION_PATTERN.test(lower);
  const answerCandidate = extractAnswerCandidate(text, { expectedAnswer, acceptedAnswers, hasExerciseContext, continuation });
  if (answerCandidate) {
    return makeTurn('direct_answer', 'answer_attempt', 0.96, { ...conversation, answerCandidate });
  }
  if (continuation) {
    return makeTurn(conversation.hasTeachingStage ? 'recovery_first_step' : QUESTION_HELP, FOLLOW_UP_QUESTION, 0.99, {
      ...conversation, referencesPreviousTurn: true, isQuestion: true
    });
  }

  if (/\b(?:beri|bagi|minta|mahu|nak)?\s*(?:satu\s+)?(?:petunjuk|hint)\b/iu.test(lower) || /(?:أعطني\s+تلميح|تلميح)/u.test(lower)) return makeTurn('hint', 'help_request', 0.99, conversation);
  if (/\b(?:jawapan\s+saya\s+salah|kenapa\s+salah|silap\s+di\s+mana|where\s+did\s+i\s+go\s+wrong)\b/iu.test(lower)) return makeTurn('wrong_answer_coaching', 'help_request', 0.98, conversation);
  if (/\b(?:contoh|example)(?:\s+lagi|\s+mudah|\s+lain)?\b/iu.test(lower) || /(?:أعطني\s+مثال|مثال\s+آخر)/u.test(lower) || /^(?:lagi|satu\s+lagi)$/iu.test(lower)) {
    return makeTurn('example_request', KNOWLEDGE_QUESTION, 0.97, { ...conversation, isQuestion: true, referencesPreviousTurn });
  }
  if (/\b(?:cara\s+lain|terangkan\s+lagi|jelaskan\s+lagi|ulang\s+semula|explain\s+again|another\s+way)\b/iu.test(lower) || /(?:اشرح\s+مرة\s+أخرى|طريقة\s+أخرى)/u.test(lower)) {
    return makeTurn('alternative_explanation', FOLLOW_UP_QUESTION, 0.98, { ...conversation, isQuestion: true, referencesPreviousTurn: conversation.hasHistory });
  }
  if (/\b(?:apa\s+beza|apakah\s+perbezaan|bezakan|bandingkan|difference\s+between|compare)\b/iu.test(lower)) {
    return makeTurn('comparison_question', KNOWLEDGE_QUESTION, 0.99, { ...conversation, isQuestion: true });
  }
  if (/^(?:(?:kenapa|mengapa|why)\b|لماذا(?:\s|$))/iu.test(lower)) {
    return makeTurn('why_question', KNOWLEDGE_QUESTION, 0.98, { ...conversation, isQuestion: true, referencesPreviousTurn });
  }
  if (/^(?:(?:bagaimana|macam\s*mana|how)\b|كيف(?:\s|$))/iu.test(lower) || /\b(?:ajar|tunjuk(?:kan)?\s+cara|langkah\s+demi\s+langkah|teach\s+me)\b/iu.test(lower) || /(?:علمني|اشرح\s+الخطوات)/u.test(lower)) {
    return makeTurn('how_question', KNOWLEDGE_QUESTION, 0.96, { ...conversation, isQuestion: true, referencesPreviousTurn });
  }
  if (/^(?:(?:apa(?:kah)?\s+(?:itu|maksud|erti)|what\s+is|what\s+does)\b|(?:ما|ماذا)(?:\s|$))/iu.test(lower)) {
    return makeTurn(KNOWLEDGE_QUESTION, KNOWLEDGE_QUESTION, 0.96, { ...conversation, isQuestion: true });
  }
  if (/\b(?:terangkan|jelaskan|bantu|tolong\s+ajar|explain|help\s+me)\b/iu.test(lower) || /(?:ساعدني|اشرح\s+لي)/u.test(lower)) {
    return makeTurn(QUESTION_HELP, 'help_request', 0.93, { ...conversation, isQuestion: /[?؟]/.test(text) });
  }
  if (QUESTION_PATTERN.test(text)) return makeTurn(KNOWLEDGE_QUESTION, KNOWLEDGE_QUESTION, 0.82, { ...conversation, isQuestion: true, referencesPreviousTurn });

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
