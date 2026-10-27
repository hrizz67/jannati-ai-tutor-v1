import { selectAnswerSafeText, textContainsExpectedAnswer } from '../policy/answerRevealPolicy.js';

const MAX_MISUNDERSTANDING_COUNT = 3;
const SUPPORTED_MISCONCEPTION_CONFIDENCE = 0.58;

export const TEACHING_SIGNAL = Object.freeze({
  MISUNDERSTANDING: 'misunderstanding',
  WRONG_ANSWER: 'wrong_answer',
  CLARIFICATION: 'clarification',
  NEW_TOPIC: 'new_topic',
  RESOLVED: 'resolved'
});

export const TEACHING_STRATEGY = Object.freeze({
  CONCEPT_AND_EXAMPLE: 'concept-and-example',
  ALTERNATIVE_CONNECTION: 'alternative-connection',
  ONE_SMALL_STEP: 'one-small-step',
  EVIDENCE_GUIDED_CORRECTION: 'evidence-guided-correction',
  CLARIFY_REQUEST: 'clarify-request',
  NEW_CONCEPT: 'new-concept',
  CHECK_COMPLETED: 'check-completed',
  KNOWLEDGE_SAFE_FALLBACK: 'knowledge-safe-fallback'
});

function clean(value = '', maxLength = 320) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalize(value = '') {
  return clean(value)
    .toLocaleLowerCase('ms-MY')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function list(value = []) {
  return (Array.isArray(value) ? value : [value]).map(item => clean(item, 260)).filter(Boolean);
}

function clampCount(value = 0) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.min(MAX_MISUNDERSTANDING_COUNT, Math.floor(count))) : 0;
}

function resolveLanguage({ locale = '', languagePresentation = {}, subjectId = '' } = {}) {
  if (String(locale).toLowerCase().startsWith('ar')) return 'ar';
  if (languagePresentation?.teachingLanguage === 'en' || subjectId === 'english') return 'en';
  return 'ms';
}

function resolveSignal({ studentTurn = {}, resolvedIntent = '', isCorrect = false } = {}) {
  if (studentTurn?.messageType === 'new_topic_request' || studentTurn?.newTopicRequest) return TEACHING_SIGNAL.NEW_TOPIC;
  if (isCorrect || resolvedIntent === 'understanding_confirmation') return TEACHING_SIGNAL.RESOLVED;
  if (studentTurn?.needsClarification || resolvedIntent === 'clarification_needed') return TEACHING_SIGNAL.CLARIFICATION;
  if (resolvedIntent === 'wrong_answer_coaching') return TEACHING_SIGNAL.WRONG_ANSWER;
  if (resolvedIntent === 'misunderstanding' || resolvedIntent === 'alternative_explanation') return TEACHING_SIGNAL.MISUNDERSTANDING;
  return '';
}

function resolveConceptKey({ subjectId = '', topicId = '', questionId = '', topicLabel = '' } = {}) {
  return clean([subjectId || 'general', topicId || topicLabel || 'general', questionId || 'general'].join('::'), 240);
}

function getPreviousState(history = [], currentConcept = '') {
  return [...(Array.isArray(history) ? history : [])]
    .reverse()
    .find(item => item?.role === 'ai' && item?.pedagogicalState?.currentConcept === currentConcept)
    ?.pedagogicalState || null;
}

function safeCandidates(candidates = [], protectedAnswers = []) {
  const result = [];
  const seen = new Set();
  for (const candidate of list(candidates)) {
    if (textContainsExpectedAnswer(candidate, protectedAnswers)) continue;
    const key = normalize(candidate);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function safeQuestion(candidates = [], protectedAnswers = [], fallback = '') {
  const selected = selectAnswerSafeText(candidates, protectedAnswers, fallback);
  const statement = clean(selected, 180).replace(/[.!?؟]+$/u, '');
  if (!statement || textContainsExpectedAnswer(statement, protectedAnswers)) return '';
  return `${statement}?`;
}

function resolveMisconception({ signal = '', guidedMisconception = null, learnerAnswer = '', options = [] } = {}) {
  if (signal !== TEACHING_SIGNAL.WRONG_ANSWER || guidedMisconception?.supported !== true) return null;
  const confidence = Number(guidedMisconception.confidence) || 0;
  if (confidence < SUPPORTED_MISCONCEPTION_CONFIDENCE) return null;
  const learner = normalize(learnerAnswer);
  const optionEvidence = list(options).map(normalize).filter(Boolean);
  if (!learner || !optionEvidence.includes(learner)) return null;
  return {
    type: clean(guidedMisconception.type, 80),
    confidence,
    evidence: clean(guidedMisconception.evidence, 180),
    childSafeLabel: clean(guidedMisconception.childSafeLabel, 180)
  };
}

function copyFor(language) {
  if (language === 'en') {
    return {
      reassurance: 'That is okay. Let us make the idea smaller.',
      conceptLead: 'First idea:',
      exampleLead: 'Easy example:',
      alternativeLead: 'Let us look at it another way.',
      stepLead: 'Do just one small step:',
      checkLead: 'Small check:',
      missing: 'I do not have enough approved learning information for this concept yet. Ask about the active question or check with your teacher.',
      missingQuestion: 'Which part of the active question should we check?',
      correctionLead: 'Let us use the evidence in your answer.',
      quickReplies: ['Show one small step', 'Give an easy example', 'I understand now']
    };
  }
  if (language === 'ar') {
    return {
      reassurance: 'لا بأس. نتعلم خطوة صغيرة.',
      conceptLead: 'الفكرة الأولى:',
      exampleLead: 'مثال سهل:',
      alternativeLead: 'لننظر بطريقة أخرى.',
      stepLead: 'نفعل خطوة واحدة:',
      checkLead: 'سؤال صغير:',
      missing: 'لا توجد معلومات تعليمية معتمدة كافية لهذا المفهوم الآن. اسأل عن السؤال الحالي أو اطلب مساعدة المعلم.',
      missingQuestion: 'أي جزء من السؤال الحالي تريد أن نراجعه?',
      correctionLead: 'لنراجع الدليل في إجابتك.',
      quickReplies: ['اشرح خطوة واحدة', 'أعطني مثالًا سهلًا', 'فهمت الآن']
    };
  }
  return {
    reassurance: 'Tak mengapa. Beritahu bahagian mana yang mengelirukan, kemudian kita mula dengan idea paling asas.',
    conceptLead: 'Idea utama:',
    exampleLead: 'Contoh mudah:',
    alternativeLead: 'Mari lihat dengan cara lain.',
    stepLead: 'Buat satu langkah kecil sahaja:',
    checkLead: 'Semakan kecil:',
    missing: 'Saya belum mempunyai maklumat pembelajaran yang disahkan untuk konsep ini. Tanya tentang soalan semasa atau semak bersama guru.',
    missingQuestion: 'Bahagian mana dalam soalan semasa yang mahu kita semak?',
    correctionLead: 'Mari gunakan bukti daripada jawapan kamu.',
    quickReplies: ['Beri contoh mudah', 'Terangkan cara lain', 'Saya sudah faham']
  };
}

function buildState({ signal, previousState, currentConcept, strategyUsed, supportStage, pendingFollowUp, misconception }) {
  const previousCount = previousState?.currentConcept === currentConcept
    ? clampCount(previousState.misunderstandingCount)
    : 0;
  const misunderstandingCount = signal === TEACHING_SIGNAL.MISUNDERSTANDING
    ? clampCount(previousCount + 1)
    : signal === TEACHING_SIGNAL.NEW_TOPIC || signal === TEACHING_SIGNAL.RESOLVED
      ? 0
      : previousCount;
  return {
    supportStage: clean(supportStage, 48),
    misunderstandingCount,
    strategyUsed: clean(strategyUsed, 64),
    currentConcept,
    pendingFollowUp: clean(pendingFollowUp, 200),
    signal,
    misconceptionType: clean(misconception?.type || '', 80)
  };
}

export function buildIntelligentTeachingTurn({
  studentTurn = {},
  resolvedIntent = '',
  history = [],
  subjectId = '',
  topicId = '',
  topicLabel = '',
  questionId = '',
  learnerAnswer = '',
  options = [],
  expectedAnswer = '',
  acceptedAnswers = [],
  isCorrect = false,
  guidedMisconception = null,
  teachingContent = {},
  locale = '',
  languagePresentation = {}
} = {}) {
  if (subjectId === 'math') return null;
  const signal = resolveSignal({ studentTurn, resolvedIntent, isCorrect });
  if (!signal) return null;

  const currentConcept = resolveConceptKey({ subjectId, topicId, questionId, topicLabel });
  const previousState = getPreviousState(history, currentConcept);
  const protectedAnswers = [expectedAnswer, ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : [])].filter(Boolean);
  const explanations = safeCandidates(teachingContent.explanations, protectedAnswers);
  const examples = safeCandidates(teachingContent.examples, protectedAnswers);
  const alternatives = safeCandidates(teachingContent.alternatives, protectedAnswers);
  const steps = safeCandidates(teachingContent.steps, protectedAnswers);
  const language = resolveLanguage({ locale, languagePresentation, subjectId });
  const copy = copyFor(language);
  const checkQuestion = safeQuestion(
    teachingContent.checkQuestions,
    protectedAnswers,
    language === 'en'
      ? 'What is the main clue in this question'
      : language === 'ar'
        ? 'ما الدليل المهم في هذا السؤال'
        : 'Apakah petunjuk utama dalam soalan ini'
  );
  const misconception = resolveMisconception({ signal, guidedMisconception, learnerAnswer, options });

  if ([TEACHING_SIGNAL.NEW_TOPIC, TEACHING_SIGNAL.RESOLVED, TEACHING_SIGNAL.CLARIFICATION].includes(signal)) {
    const strategyUsed = signal === TEACHING_SIGNAL.NEW_TOPIC
      ? TEACHING_STRATEGY.NEW_CONCEPT
      : signal === TEACHING_SIGNAL.RESOLVED
        ? TEACHING_STRATEGY.CHECK_COMPLETED
        : TEACHING_STRATEGY.CLARIFY_REQUEST;
    return {
      reply: null,
      misconception: null,
      pedagogicalState: buildState({
        signal,
        previousState,
        currentConcept,
        strategyUsed,
        supportStage: signal === TEACHING_SIGNAL.CLARIFICATION ? 'clarification' : signal,
        pendingFollowUp: signal === TEACHING_SIGNAL.CLARIFICATION ? checkQuestion : '',
        misconception: null
      })
    };
  }

  const hasGroundedContent = teachingContent.grounded === true && Boolean(explanations[0] || examples[0] || alternatives[0] || steps[0]);
  if (!hasGroundedContent) {
    const pendingFollowUp = copy.missingQuestion;
    return {
      reply: {
        text: copy.missing,
        quickReplies: language === 'en'
          ? ['Return to this question', 'Name the topic', 'Ask my teacher']
          : language === 'ar'
            ? ['ارجع إلى السؤال', 'اكتب اسم الدرس', 'اسأل المعلم']
            : ['Kembali kepada soalan', 'Nyatakan nama topik', 'Tanya guru'],
        grounded: true
      },
      misconception: null,
      pedagogicalState: buildState({
        signal,
        previousState,
        currentConcept,
        strategyUsed: TEACHING_STRATEGY.KNOWLEDGE_SAFE_FALLBACK,
        supportStage: 'knowledge_safe_fallback',
        pendingFollowUp,
        misconception: null
      })
    };
  }

  const previousCount = previousState?.currentConcept === currentConcept
    ? clampCount(previousState.misunderstandingCount)
    : 0;
  const nextCount = signal === TEACHING_SIGNAL.MISUNDERSTANDING ? clampCount(previousCount + 1) : previousCount;
  let strategyUsed = TEACHING_STRATEGY.EVIDENCE_GUIDED_CORRECTION;
  let supportStage = 'evidence_guided_correction';
  let textParts = [copy.correctionLead, misconception?.childSafeLabel || alternatives[0] || steps[0], checkQuestion];

  if (signal === TEACHING_SIGNAL.MISUNDERSTANDING && nextCount <= 1) {
    strategyUsed = TEACHING_STRATEGY.CONCEPT_AND_EXAMPLE;
    supportStage = 'concept_explanation';
    const safeConcept = explanations[0] || alternatives[0] || steps[0];
    textParts = [copy.reassurance, safeConcept ? `${copy.conceptLead} ${safeConcept}` : '', examples[0] ? `${copy.exampleLead} ${examples[0]}` : '', `${copy.checkLead} ${checkQuestion}`];
  } else if (signal === TEACHING_SIGNAL.MISUNDERSTANDING && nextCount === 2) {
    strategyUsed = TEACHING_STRATEGY.ALTERNATIVE_CONNECTION;
    supportStage = 'alternative_strategy';
    textParts = [copy.alternativeLead, alternatives[0] || examples[1] || steps[0], `${copy.checkLead} ${checkQuestion}`];
  } else if (signal === TEACHING_SIGNAL.MISUNDERSTANDING) {
    strategyUsed = TEACHING_STRATEGY.ONE_SMALL_STEP;
    supportStage = 'guided_small_step';
    textParts = [copy.stepLead, steps[0] || alternatives[0] || examples[0], `${copy.checkLead} ${checkQuestion}`];
  }

  const text = clean(textParts.filter(Boolean).join(' '), 700);
  return {
    reply: {
      text,
      quickReplies: copy.quickReplies,
      grounded: true
    },
    misconception,
    pedagogicalState: buildState({
      signal,
      previousState,
      currentConcept,
      strategyUsed,
      supportStage,
      pendingFollowUp: checkQuestion,
      misconception
    })
  };
}

export default {
  buildIntelligentTeachingTurn,
  TEACHING_SIGNAL,
  TEACHING_STRATEGY
};
