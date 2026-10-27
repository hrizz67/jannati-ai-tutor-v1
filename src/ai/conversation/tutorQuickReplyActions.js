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
    .replace(/[?؟.!]+$/gu, '')
    .trim();
}

const routes = [
  [['saya sudah faham', 'i understand now', 'فهمت الآن'], 'confirm_understanding', 'understanding_confirmation'],
  [['terangkan cara lain', 'explain another way', 'اشرح بطريقة أخرى'], 'request_alternative_explanation', 'alternative_explanation'],
  [['beri contoh mudah', 'give an easy example', 'أعطني مثالًا سهلًا'], 'request_approved_example', 'example_request'],
  [['maksud perkataan', 'the meaning', 'اشرح المعنى', 'المعنى'], 'explain_recovery_meaning', 'recovery_meaning'],
  [['langkah pertama', 'show one small step', 'the first step', 'اشرح خطوة واحدة', 'الخطوة الأولى'], 'explain_recovery_first_step', 'recovery_first_step'],
  [['saya masih tak faham', "i still don't understand", 'ما زلت لا أفهم'], 'report_misunderstanding', 'misunderstanding'],
  [['tanya orang dewasa', 'saya akan tanya orang dewasa', 'ask an adult', 'i will ask an adult', 'أسأل شخصًا بالغًا', 'سأسأل شخصًا بالغًا'], 'acknowledge_adult_support', 'adult_support_acknowledgement'],
  [['kembali ke soalan', 'return to question', 'ارجع إلى السؤال'], 'return_to_original_question', 'question_help'],
  [['tutup tutor', 'close tutor', 'إغلاق المعلّم'], 'close_tutor', 'close_tutor']
];

const QUICK_REPLY_ROUTES = new Map(
  routes.flatMap(([labels, actionId, intent]) => labels.map(label => [comparable(label), { actionId, intent }]))
);

export function resolveTutorQuickReplyAction(suggestion, context = {}) {
  if (suggestion && typeof suggestion === 'object' && suggestion.actionId) {
    return {
      ...suggestion,
      label: clean(suggestion.label),
      intent: clean(suggestion.intent || 'general'),
      source: suggestion.source || 'tutor_quick_action'
    };
  }

  const label = clean(suggestion?.label || suggestion);
  if (!label) return null;
  const route = QUICK_REPLY_ROUTES.get(comparable(label));
  const fallback = context.hasExerciseContext
    ? { actionId: 'continue_current_question', intent: 'question_help' }
    : { actionId: 'send_tutor_message', intent: 'general' };

  return {
    ...(route || fallback),
    label,
    source: 'tutor_quick_action',
    conversationKey: clean(context.conversationKey),
    questionId: clean(context.questionId),
    subjectId: clean(context.subjectId),
    topicId: clean(context.topicId)
  };
}

export function getTutorQuickReplyDispatch(action = null) {
  if (!action?.actionId) return { type: 'ignore', action: null };
  if (['close_tutor', 'return_to_original_question'].includes(action.actionId)) {
    return { type: 'close', action };
  }
  return { type: 'message', action };
}

export default {
  resolveTutorQuickReplyAction,
  getTutorQuickReplyDispatch
};
