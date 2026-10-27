import { selectAnswerSafeText, textContainsExpectedAnswer } from '../policy/answerRevealPolicy.js';

const MAX_MISUNDERSTANDING_COUNT = 7;
const SUPPORTED_MISCONCEPTION_CONFIDENCE = 0.58;

export const TEACHING_SIGNAL = Object.freeze({
  MISUNDERSTANDING: 'misunderstanding',
  WRONG_ANSWER: 'wrong_answer',
  CLARIFICATION: 'clarification',
  RECOVERY_SELECTION: 'recovery_selection',
  ADULT_SUPPORT: 'adult_support',
  NEW_TOPIC: 'new_topic',
  RESOLVED: 'resolved'
});

export const TEACHING_STRATEGY = Object.freeze({
  CONCEPT_AND_EXAMPLE: 'concept-and-example',
  ALTERNATIVE_CONNECTION: 'alternative-connection',
  ONE_SMALL_STEP: 'one-small-step',
  VERIFIED_MICRO_EXAMPLE: 'verified-micro-example',
  ADULT_SUPPORT: 'adult-support',
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

function resolveSignal({ studentTurn = {}, resolvedIntent = '', isCorrect = false, answerAttempted = false } = {}) {
  if (studentTurn?.messageType === 'new_topic_request' || studentTurn?.newTopicRequest) return TEACHING_SIGNAL.NEW_TOPIC;
  if (resolvedIntent === 'understanding_confirmation') return TEACHING_SIGNAL.RESOLVED;
  if (studentTurn?.needsClarification || resolvedIntent === 'clarification_needed') return TEACHING_SIGNAL.CLARIFICATION;
  if (['recovery_meaning', 'recovery_first_step'].includes(resolvedIntent)) return TEACHING_SIGNAL.RECOVERY_SELECTION;
  if (resolvedIntent === 'adult_support_acknowledgement') return TEACHING_SIGNAL.ADULT_SUPPORT;
  if (resolvedIntent === 'example_request') return resolvedIntent;
  if (['misunderstanding', 'alternative_explanation'].includes(resolvedIntent)) return TEACHING_SIGNAL.MISUNDERSTANDING;
  if (resolvedIntent === 'wrong_answer_coaching') return TEACHING_SIGNAL.WRONG_ANSWER;
  if (answerAttempted && isCorrect && resolvedIntent === 'correct_answer_reinforcement') return TEACHING_SIGNAL.RESOLVED;
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
  for (const rawCandidate of list(candidates)) {
    const candidate = clean(rawCandidate.replace(/[?؟]+/gu, '.'));
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
  const statement = clean(selected, 180).split(/[?؟]/u)[0].replace(/[.!]+$/u, '');
  if (!statement || textContainsExpectedAnswer(statement, protectedAnswers)) return '';
  return `${statement}?`;
}

function resolveMisconception({ signal = '', guidedMisconception = null, learnerAnswer = '', options = [] } = {}) {
  if (signal !== TEACHING_SIGNAL.WRONG_ANSWER || guidedMisconception?.supported !== true) return null;
  const confidence = Number(guidedMisconception.confidence) || 0;
  if (confidence < SUPPORTED_MISCONCEPTION_CONFIDENCE) return null;
  const learner = normalize(learnerAnswer);
  const optionEvidence = list(options).map(normalize).filter(Boolean);
  const evidenceAnswer = normalize(guidedMisconception.evidenceAnswer);
  if (
    !learner ||
    !optionEvidence.includes(learner) ||
    guidedMisconception.evidenceSource !== 'reviewed-question' ||
    evidenceAnswer !== learner
  ) return null;
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
      noExample: 'No new approved example is available. I can guide one step in this question.',
      missingQuestion: 'Which part of the active question should we check?',
      correctionLead: 'Let us use the evidence in your answer.',
      genericCorrectionLead: 'Let us check the question and your answer one small step at a time.',
      recoveryLead: 'Let us try one different example from this lesson:',
      recoveryQuestion: 'Which part is harder: the meaning or the first step',
      adultSupport: 'We have tried a few ways. Please show this question to your teacher or guardian so they can help beside you.',
      adultQuestion: 'Can you show this question to a teacher or guardian now',
      adultFollowUp: 'Good plan. Show this question to your teacher or guardian before trying it again.',
      adultClosed: 'Let us pause here so we do not guess. Continue after your teacher or guardian has helped you.',
      quickReplies: ['Show one small step', 'Give an easy example', 'I understand now'],
      recoveryReplies: ['The meaning', 'The first step', 'Ask an adult'],
      adultFollowUpReplies: ['I will ask an adult', 'Close Tutor'],
      adultClosedReplies: ['Close Tutor'],
      recoveryCheckReplies: ["I still don't understand", 'I understand now']
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
      noExample: 'لا يوجد مثال جديد معتمد. يمكنني إرشادك في خطوة من هذا السؤال.',
      missingQuestion: 'أي جزء من السؤال الحالي تريد أن نراجعه?',
      correctionLead: 'لنراجع الدليل في إجابتك.',
      genericCorrectionLead: 'لنراجع السؤال والإجابة خطوة صغيرة.',
      recoveryLead: 'نجرب مثالًا آخر من هذا الدرس:',
      recoveryQuestion: 'أيهما أصعب: المعنى أم الخطوة الأولى',
      adultSupport: 'جربنا عدة طرق. اعرض هذا السؤال على المعلم أو ولي الأمر ليساعدك بجانبك.',
      adultQuestion: 'هل تستطيع عرض السؤال على المعلم أو ولي الأمر الآن',
      adultFollowUp: 'حسنًا. اعرض هذا السؤال على المعلم أو ولي الأمر قبل أن تحاول مرة أخرى.',
      adultClosed: 'نتوقف هنا حتى لا نخمن. تابع بعد أن يساعدك المعلم أو ولي الأمر.',
      quickReplies: ['اشرح خطوة واحدة', 'أعطني مثالًا سهلًا', 'فهمت الآن'],
      recoveryReplies: ['المعنى', 'الخطوة الأولى', 'أسأل شخصًا بالغًا'],
      adultFollowUpReplies: ['سأسأل شخصًا بالغًا', 'إغلاق المعلّم'],
      adultClosedReplies: ['إغلاق المعلّم'],
      recoveryCheckReplies: ['ما زلت لا أفهم', 'فهمت الآن']
    };
  }
  return {
    reassurance: 'Tak mengapa. Kita cari bahagian mana yang mengelirukan dan mula dengan idea paling asas.',
    conceptLead: 'Idea utama:',
    exampleLead: 'Contoh mudah:',
    alternativeLead: 'Mari lihat dengan cara lain.',
    stepLead: 'Buat satu langkah kecil sahaja:',
    checkLead: 'Semakan kecil:',
    missing: 'Saya belum mempunyai maklumat pembelajaran yang disahkan untuk konsep ini. Tanya tentang soalan semasa atau semak bersama guru.',
    noExample: 'Tiada contoh baharu diluluskan. Saya boleh bimbing satu langkah dalam soalan ini.',
    missingQuestion: 'Bahagian mana dalam soalan semasa yang mahu kita semak?',
    correctionLead: 'Mari gunakan bukti daripada jawapan kamu.',
    genericCorrectionLead: 'Mari semak soalan dan jawapan kamu satu langkah kecil pada satu masa.',
    recoveryLead: 'Mari cuba satu contoh lain daripada pelajaran ini:',
    recoveryQuestion: 'Bahagian manakah lebih sukar: maksud atau langkah pertama',
    adultSupport: 'Kita sudah mencuba beberapa cara. Tunjukkan soalan ini kepada guru atau penjaga supaya mereka boleh membantu di sisi kamu.',
    adultQuestion: 'Boleh kamu tunjukkan soalan ini kepada guru atau penjaga sekarang',
    adultFollowUp: 'Baik. Tunjukkan soalan ini kepada guru atau penjaga sebelum kamu mencuba lagi.',
    adultClosed: 'Kita berhenti di sini dahulu supaya kita tidak meneka. Sambung selepas guru atau penjaga membantu kamu.',
    quickReplies: ['Terangkan cara lain', 'Beri contoh mudah', 'Saya sudah faham'],
    recoveryReplies: ['Maksud perkataan', 'Langkah pertama', 'Tanya orang dewasa'],
    adultFollowUpReplies: ['Saya akan tanya orang dewasa', 'Tutup Tutor'],
    adultClosedReplies: ['Tutup Tutor'],
    recoveryCheckReplies: ['Saya masih tak faham', 'Saya sudah faham']
  };
}

function buildAdultSupportReply(copy, previousState = null, adultQuestion = '') {
  if (previousState?.supportStage === 'adult_support_referral') {
    return {
      strategyUsed: TEACHING_STRATEGY.ADULT_SUPPORT,
      supportStage: 'adult_support_acknowledgement',
      pendingFollowUp: '',
      quickReplies: copy.adultFollowUpReplies,
      textParts: [copy.adultFollowUp]
    };
  }
  if (['adult_support_acknowledgement', 'adult_support_closed'].includes(previousState?.supportStage)) {
    return {
      strategyUsed: TEACHING_STRATEGY.ADULT_SUPPORT,
      supportStage: 'adult_support_closed',
      pendingFollowUp: '',
      quickReplies: copy.adultClosedReplies,
      textParts: [copy.adultClosed]
    };
  }
  return {
    strategyUsed: TEACHING_STRATEGY.ADULT_SUPPORT,
    supportStage: 'adult_support_referral',
    pendingFollowUp: adultQuestion,
    quickReplies: copy.recoveryReplies,
    textParts: [copy.adultSupport, adultQuestion]
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
  answerAttempted = false,
  guidedMisconception = null,
  teachingContent = {},
  locale = '',
  languagePresentation = {}
} = {}) {
  if (subjectId === 'math') return null;
  const signal = resolveSignal({ studentTurn, resolvedIntent, isCorrect, answerAttempted });
  if (!signal) return null;

  const currentConcept = resolveConceptKey({ subjectId, topicId, questionId, topicLabel });
  const previousState = getPreviousState(history, currentConcept);
  const protectedAnswers = [expectedAnswer, ...(Array.isArray(acceptedAnswers) ? acceptedAnswers : [])].filter(Boolean);
  const explanations = safeCandidates(teachingContent.explanations, protectedAnswers);
  const examples = safeCandidates(teachingContent.examples, protectedAnswers);
  const verifiedExamples = safeCandidates(teachingContent.verifiedExamples, protectedAnswers);
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
  const recoveryQuestion = safeQuestion([copy.recoveryQuestion], protectedAnswers, copy.recoveryQuestion);
  const adultQuestion = safeQuestion([copy.adultQuestion], protectedAnswers, copy.adultQuestion);
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

  if (signal === 'example_request') {
    const priorText = normalize((history || [])
      .map(item => item?.role === 'ai' ? item.text : '')
      .join(' '));
    const approvedExample = verifiedExamples.find(item => !priorText.includes(normalize(item)));
    const hasExample = Boolean(approvedExample);
    return {
      reply: {
        text: hasExample
          ? clean([`${copy.exampleLead} ${approvedExample}`, `${copy.checkLead} ${checkQuestion}`].join(' '), 700)
          : copy.noExample,
        quickReplies: hasExample ? copy.quickReplies : [copy.quickReplies[0], copy.quickReplies[2]],
        grounded: true
      },
      misconception: null,
      pedagogicalState: buildState({
        signal,
        previousState,
        currentConcept,
        strategyUsed: hasExample ? TEACHING_STRATEGY.VERIFIED_MICRO_EXAMPLE : TEACHING_STRATEGY.KNOWLEDGE_SAFE_FALLBACK,
        supportStage: hasExample ? 'example' : 'example_unavailable',
        pendingFollowUp: hasExample ? checkQuestion : '',
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

  if (signal === TEACHING_SIGNAL.RECOVERY_SELECTION) {
    const asksForMeaning = resolvedIntent === 'recovery_meaning';
    const groundedSupport = asksForMeaning
      ? explanations[0] || alternatives[0] || steps[0]
      : steps[0] || alternatives[0] || explanations[0];
    const supportLead = asksForMeaning ? copy.conceptLead : copy.stepLead;
    return {
      reply: {
        text: clean([supportLead, groundedSupport, `${copy.checkLead} ${checkQuestion}`].filter(Boolean).join(' '), 700),
        quickReplies: copy.recoveryCheckReplies,
        grounded: true
      },
      misconception: null,
      pedagogicalState: buildState({
        signal,
        previousState,
        currentConcept,
        strategyUsed: asksForMeaning ? TEACHING_STRATEGY.ALTERNATIVE_CONNECTION : TEACHING_STRATEGY.ONE_SMALL_STEP,
        supportStage: asksForMeaning ? 'recovery_meaning' : 'recovery_first_step',
        pendingFollowUp: checkQuestion,
        misconception: null
      })
    };
  }

  if (signal === TEACHING_SIGNAL.ADULT_SUPPORT) {
    return {
      reply: {
        text: copy.adultFollowUp,
        quickReplies: copy.adultClosedReplies,
        grounded: true
      },
      misconception: null,
      pedagogicalState: buildState({
        signal,
        previousState,
        currentConcept,
        strategyUsed: TEACHING_STRATEGY.ADULT_SUPPORT,
        supportStage: 'adult_support_acknowledgement',
        pendingFollowUp: '',
        misconception: null
      })
    };
  }

  const previousCount = previousState?.currentConcept === currentConcept
    ? clampCount(previousState.misunderstandingCount)
    : 0;
  const nextCount = signal === TEACHING_SIGNAL.MISUNDERSTANDING ? clampCount(previousCount + 1) : previousCount;
  const strategyCount = resolvedIntent === 'alternative_explanation' ? Math.max(2, nextCount) : nextCount;
  let strategyUsed = TEACHING_STRATEGY.EVIDENCE_GUIDED_CORRECTION;
  let supportStage = 'evidence_guided_correction';
  let pendingFollowUp = checkQuestion;
  let quickReplies = copy.quickReplies;
  let textParts = [misconception ? copy.correctionLead : copy.genericCorrectionLead, misconception?.childSafeLabel || alternatives[0] || steps[0], checkQuestion];

  if (signal === TEACHING_SIGNAL.MISUNDERSTANDING && strategyCount <= 1) {
    strategyUsed = TEACHING_STRATEGY.CONCEPT_AND_EXAMPLE;
    supportStage = 'concept_explanation';
    const safeConcept = explanations[0] || alternatives[0] || steps[0];
    textParts = [copy.reassurance, safeConcept ? `${copy.conceptLead} ${safeConcept}` : '', examples[0] ? `${copy.exampleLead} ${examples[0]}` : '', `${copy.checkLead} ${checkQuestion}`];
  } else if (signal === TEACHING_SIGNAL.MISUNDERSTANDING && strategyCount === 2) {
    strategyUsed = TEACHING_STRATEGY.ALTERNATIVE_CONNECTION;
    supportStage = 'alternative_strategy';
    textParts = [copy.alternativeLead, alternatives[0] || examples[1] || steps[0], `${copy.checkLead} ${checkQuestion}`];
  } else if (signal === TEACHING_SIGNAL.MISUNDERSTANDING && strategyCount === 3) {
    strategyUsed = TEACHING_STRATEGY.ONE_SMALL_STEP;
    supportStage = 'guided_small_step';
    textParts = [copy.stepLead, steps[0] || alternatives[0] || examples[0], `${copy.checkLead} ${checkQuestion}`];
  } else if (signal === TEACHING_SIGNAL.MISUNDERSTANDING && strategyCount === 4) {
    const firstExample = normalize(examples[0]);
    const distinctVerifiedExample = verifiedExamples.find(item => normalize(item) !== firstExample);
    if (distinctVerifiedExample) {
      strategyUsed = TEACHING_STRATEGY.VERIFIED_MICRO_EXAMPLE;
      supportStage = 'verified_micro_example';
      pendingFollowUp = recoveryQuestion;
      quickReplies = copy.recoveryReplies;
      textParts = [copy.recoveryLead, distinctVerifiedExample, recoveryQuestion];
    } else {
      ({ strategyUsed, supportStage, pendingFollowUp, quickReplies, textParts } = buildAdultSupportReply(copy, previousState, adultQuestion));
    }
  } else if (signal === TEACHING_SIGNAL.MISUNDERSTANDING) {
    ({ strategyUsed, supportStage, pendingFollowUp, quickReplies, textParts } = buildAdultSupportReply(copy, previousState, adultQuestion));
  }

  const text = clean(textParts.filter(Boolean).join(' '), 700);
  return {
    reply: {
      text,
      quickReplies,
      grounded: true
    },
    misconception,
    pedagogicalState: buildState({
      signal,
      previousState,
      currentConcept,
      strategyUsed,
      supportStage,
      pendingFollowUp,
      misconception
    })
  };
}

export default {
  buildIntelligentTeachingTurn,
  TEACHING_SIGNAL,
  TEACHING_STRATEGY
};
