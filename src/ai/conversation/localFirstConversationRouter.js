import {
  buildTutorSafetyResponse,
  containsPotentialPersonalData,
  detectTutorSafetyRisk
} from '../../../supabase/functions/_shared/tutorPolicy.js';

export const DIALOGUE_CLASSIFICATION = Object.freeze({
  LOCAL_HANDLED: 'LOCAL_HANDLED',
  NEEDS_CLARIFICATION: 'NEEDS_CLARIFICATION',
  REMOTE_ELIGIBLE: 'REMOTE_ELIGIBLE',
  UNSUPPORTED: 'UNSUPPORTED',
  SAFETY_BLOCKED: 'SAFETY_BLOCKED'
});

export const LOCAL_FIRST_REMOTE_ENABLED = false;

const REMOTE_ELIGIBLE_INTENTS = new Set([
  'knowledge_question',
  'comparison_question',
  'why_question',
  'how_question'
]);
const UNSUPPORTED_PATTERN = /\b(?:ramalan\s+cuaca|harga\s+saham|crypto|bitcoin|politik|pilihan\s*raya|dating|perjudian|judi|weather\s+forecast|stock\s+price|write\s+code|hack(?:ing)?|اختراق|سياسة)\b/iu;
const CLARIFICATION_ROUTE = DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION;

function clean(value = '', maxLength = 1400) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function buildBoundedDialogueContext(history = [], { maxTurns = 6 } = {}) {
  return (Array.isArray(history) ? history : [])
    .slice(-Math.max(2, Number(maxTurns) || 6))
    .map(item => ({
      role: item?.role === 'user' ? 'user' : item?.role === 'ai' || item?.role === 'assistant' ? 'ai' : '',
      text: clean(item?.text, 500),
      intent: clean(item?.intent, 60),
      dialogueClassification: clean(item?.dialogueClassification, 40)
    }))
    .filter(item => item.role && item.text);
}

function wasLocalClarificationRequested(history = []) {
  const lastTutorTurn = [...buildBoundedDialogueContext(history)].reverse().find(item => item.role === 'ai');
  return lastTutorTurn?.dialogueClassification === CLARIFICATION_ROUTE;
}

function getTeachingLanguage(options = {}) {
  return options.languagePresentation?.teachingLanguage || (String(options.locale || '').toLowerCase().startsWith('en') ? 'en' : 'ms');
}

function buildClarificationCopy(options = {}) {
  const language = getTeachingLanguage(options);
  if (language === 'en') {
    return {
      text: 'I am not sure which part you mean. Tell me the subject, topic, or question you want help with.',
      quickReplies: ['Explain the meaning', 'Show the steps', 'Give an easy example']
    };
  }
  if (String(options.locale || '').toLowerCase().startsWith('ar')) {
    return {
      text: 'لم أفهم الجزء المقصود. هل تريد معنى الكلمة، مثالًا، أم شرحًا خطوة بخطوة؟',
      quickReplies: ['اشرح المعنى', 'أعطني مثالًا', 'اشرح خطوة بخطوة']
    };
  }
  return {
    text: 'Saya belum pasti bahagian yang kamu maksudkan. Beritahu subjek, topik atau soalan yang kamu mahu faham.',
    quickReplies: ['Terangkan maksud', 'Tunjukkan langkah', 'Beri contoh mudah']
  };
}

function buildUncertainCopy(options = {}) {
  if (getTeachingLanguage(options) === 'en') {
    return {
      text: 'I am not certain enough to answer that accurately. Please ask about the active lesson, or check with a teacher or guardian.',
      quickReplies: ['Ask about this lesson', 'Try different words', 'Ask an adult']
    };
  }
  if (String(options.locale || '').toLowerCase().startsWith('ar')) {
    return {
      text: 'لست متأكدًا بما يكفي لأجيب بدقة. اسأل عن الدرس الحالي أو اطلب مساعدة المعلم أو ولي الأمر.',
      quickReplies: ['اسأل عن الدرس', 'اكتب بطريقة أخرى', 'اسأل شخصًا بالغًا']
    };
  }
  return {
    text: 'Saya belum cukup pasti untuk menjawab dengan tepat. Tanya tentang pelajaran semasa atau minta bantuan guru atau penjaga.',
    quickReplies: ['Tanya tentang pelajaran ini', 'Cuba ayat lain', 'Minta bantuan orang dewasa']
  };
}

function buildUnsupportedCopy(options = {}) {
  if (getTeachingLanguage(options) === 'en') {
    return {
      text: 'I can help with your Year 2 lessons. Ask me about the current subject, question, or topic.',
      quickReplies: ['Explain this question', 'Give a hint', 'Give an easy example']
    };
  }
  return {
    text: 'Saya boleh membantu pelajaran Tahun 2. Tanya tentang subjek, soalan atau topik yang sedang dipelajari.',
    quickReplies: ['Terangkan soalan ini', 'Beri petunjuk', 'Beri contoh mudah']
  };
}

export function classifyLocalFirstDialogue({
  prompt = '',
  history = [],
  studentTurn = {},
  localResponse = {}
} = {}) {
  const text = clean(prompt, 700);
  const boundedHistory = buildBoundedDialogueContext(history);
  const userConversation = [
    ...boundedHistory.filter(item => item.role === 'user').map(item => item.text),
    text
  ].join(' ');
  const safetyRisk = detectTutorSafetyRisk(userConversation);
  if (safetyRisk || containsPotentialPersonalData(userConversation)) {
    return {
      classification: DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED,
      reason: safetyRisk || 'personal-data',
      remoteEligible: false,
      remoteAttempted: false
    };
  }
  if (!text || studentTurn?.needsClarification) {
    return {
      classification: DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION,
      reason: !text ? 'empty-prompt' : 'ambiguous-prompt',
      remoteEligible: false,
      remoteAttempted: false
    };
  }
  if (UNSUPPORTED_PATTERN.test(text)) {
    return {
      classification: DIALOGUE_CLASSIFICATION.UNSUPPORTED,
      reason: 'outside-year-2-learning-scope',
      remoteEligible: false,
      remoteAttempted: false
    };
  }
  if (localResponse?.needsGenerativeTutor !== true) {
    return {
      classification: DIALOGUE_CLASSIFICATION.LOCAL_HANDLED,
      reason: 'local-response-sufficient',
      remoteEligible: false,
      remoteAttempted: false
    };
  }
  if (!REMOTE_ELIGIBLE_INTENTS.has(studentTurn?.intent || localResponse?.intent)) {
    return {
      classification: DIALOGUE_CLASSIFICATION.UNSUPPORTED,
      reason: 'unsupported-intent',
      remoteEligible: false,
      remoteAttempted: false
    };
  }
  if (!wasLocalClarificationRequested(history)) {
    return {
      classification: DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION,
      reason: 'local-clarification-required',
      remoteEligible: false,
      remoteAttempted: false
    };
  }
  return {
    classification: DIALOGUE_CLASSIFICATION.REMOTE_ELIGIBLE,
    reason: 'local-clarification-exhausted',
    remoteEligible: true,
    remoteAttempted: false
  };
}

export function applyLocalFirstDialogueRoute(localResponse = {}, decision = {}, options = {}) {
  const base = {
    ...localResponse,
    dialogueClassification: decision.classification || DIALOGUE_CLASSIFICATION.LOCAL_HANDLED,
    dialogueRoutingReason: decision.reason || 'local-response-sufficient',
    remoteEligible: decision.remoteEligible === true,
    remoteAttempted: false,
    generativeUsed: false,
    needsGenerativeTutor: false
  };
  if (decision.classification === DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED) {
    if (decision.reason === 'personal-data') {
      const text = 'Untuk keselamatan kamu, jangan kongsi nama penuh, alamat, sekolah, nombor telefon, kata laluan atau maklumat peribadi. Tulis semula soalan tanpa maklumat tersebut.';
      const quickReplies = ['Tulis semula soalan', 'Kembali kepada pelajaran', 'Minta bantuan orang dewasa'];
      return {
        ...base,
        text,
        shortText: text,
        quickReplies,
        suggestions: quickReplies,
        source: 'child-privacy',
        needsAdultHelp: false,
        pendingPedagogicalStep: options.pendingPedagogicalStep || null
      };
    }
    const safe = buildTutorSafetyResponse(decision.reason);
    return {
      ...base,
      ...safe,
      shortText: safe.text,
      suggestions: safe.quickReplies,
      source: 'child-safety',
      pendingPedagogicalStep: options.pendingPedagogicalStep || null
    };
  }
  if (decision.classification === DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION) {
    const copy = buildClarificationCopy(options);
    const text = localResponse?.needsClarification && clean(localResponse?.text) ? localResponse.text : copy.text;
    const quickReplies = localResponse?.needsClarification && Array.isArray(localResponse?.quickReplies) && localResponse.quickReplies.length
      ? localResponse.quickReplies
      : copy.quickReplies;
    return { ...base, text, shortText: text, quickReplies, suggestions: quickReplies, source: 'local-dialogue-router', fallbackUsed: false, needsClarification: true };
  }
  if (decision.classification === DIALOGUE_CLASSIFICATION.REMOTE_ELIGIBLE) {
    const copy = buildUncertainCopy(options);
    return { ...base, text: copy.text, shortText: copy.text, quickReplies: copy.quickReplies, suggestions: copy.quickReplies, source: 'local-safe-fallback', fallbackUsed: true, needsGenerativeTutor: false };
  }
  if (decision.classification === DIALOGUE_CLASSIFICATION.UNSUPPORTED) {
    const copy = buildUnsupportedCopy(options);
    return { ...base, text: copy.text, shortText: copy.text, quickReplies: copy.quickReplies, suggestions: copy.quickReplies, source: 'local-scope-boundary', fallbackUsed: false, needsGenerativeTutor: false };
  }
  return base;
}

export default {
  DIALOGUE_CLASSIFICATION,
  LOCAL_FIRST_REMOTE_ENABLED,
  buildBoundedDialogueContext,
  classifyLocalFirstDialogue,
  applyLocalFirstDialogueRoute
};
