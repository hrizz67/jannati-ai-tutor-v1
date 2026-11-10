const ANCHOR_VERSION = 1;
const MAX_ANCHOR_HISTORY = 12;

const CURRICULUM_ANCHORS = Object.freeze({
  common_noun: Object.freeze({
    explanations: Object.freeze([
      'Kata nama am ialah nama umum bagi orang, haiwan, tempat atau benda.'
    ]),
    examples: Object.freeze([
      'Dalam ayat “Adik memegang pensel”, “pensel” ialah nama benda.',
      'Dalam ayat “Kucing tidur di sekolah”, “kucing” ialah nama haiwan dan “sekolah” ialah nama tempat.'
    ]),
    alternatives: Object.freeze([
      'Tanya diri: adakah perkataan itu menamakan sesuatu secara umum, bukan nama khusus?'
    ]),
    steps: Object.freeze([
      'Cari perkataan yang menamakan orang, haiwan, tempat atau benda.',
      'Jika perkataan itu menamakan orang, haiwan, tempat atau benda secara umum, itu kata nama am.'
    ]),
    checkQuestions: Object.freeze([
      'Perkataan “kucing” menamakan haiwan atau perbuatan'
    ]),
    check: Object.freeze({
      acceptedAnswers: Object.freeze(['haiwan']),
      options: Object.freeze(['haiwan', 'perbuatan']),
      correctFeedback: 'Betul. “Kucing” menamakan haiwan, jadi perkataan itu ialah kata nama am.',
      reason: '“Kucing” ialah kata nama am kerana perkataan itu menamakan haiwan secara umum.'
    })
  })
});

function cleanId(value = '', maxLength = 120) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return /^[\p{L}\p{N}_.:-]*$/u.test(text) ? text.slice(0, maxLength) : '';
}

function hashScope(value = '') {
  const text = String(value ?? '').normalize('NFKC').trim();
  if (!text) return '';
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function sanitizeTeachingAnchor(value = {}) {
  if (!value || typeof value !== 'object' || Number(value.version) !== ANCHOR_VERSION) return null;
  const anchor = {
    version: ANCHOR_VERSION,
    type: cleanId(value.type, 32),
    scopeId: cleanId(value.scopeId, 16),
    subjectId: cleanId(value.subjectId, 48),
    topicId: cleanId(value.topicId, 80),
    questionId: cleanId(value.questionId, 120),
    conceptId: cleanId(value.conceptId, 80)
  };
  if (
    anchor.type !== 'curriculum_concept' ||
    !anchor.scopeId || !anchor.subjectId || !CURRICULUM_ANCHORS[anchor.conceptId]
  ) return null;
  return anchor;
}

export function createTeachingAnchor({
  conversationKey = '', subjectId = '', topicId = '', questionId = '', conceptId = ''
} = {}) {
  return sanitizeTeachingAnchor({
    version: ANCHOR_VERSION,
    type: 'curriculum_concept',
    scopeId: hashScope(conversationKey),
    subjectId,
    topicId,
    questionId,
    conceptId
  });
}

function matchesScope(anchor, scope = {}) {
  return anchor?.scopeId === hashScope(scope.conversationKey) &&
    anchor.subjectId === cleanId(scope.subjectId, 48) &&
    anchor.topicId === cleanId(scope.topicId, 80) &&
    anchor.questionId === cleanId(scope.questionId, 120);
}

export function findTeachingAnchor(history = [], scope = {}) {
  const messages = Array.isArray(history) ? history.slice(-MAX_ANCHOR_HISTORY) : [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== 'ai') continue;
    if (message?.dialogueClassification !== 'LOCAL_HANDLED' || message?.privacySignal || message?.safetySignal) return null;
    const anchor = sanitizeTeachingAnchor(message?.pedagogicalState?.teachingAnchor);
    return anchor && matchesScope(anchor, scope) ? anchor : null;
  }
  return null;
}

export function getTeachingAnchorContext({ history = [], conversationKey = '', subjectId = '', topicId = '', questionId = '' } = {}) {
  const scope = { conversationKey, subjectId, topicId, questionId };
  const teachingAnchor = findTeachingAnchor(history, scope);
  return { scope, teachingAnchor, currentConcept: getTeachingAnchorConceptKey(teachingAnchor) };
}

export function resolveTeachingAnchorTurn({ scope = {}, priorTeachingAnchor = null, prompt = '', subjectId = '', standaloneAnswer = '', newTopicRequest = false } = {}) {
  const text = String(prompt).toLocaleLowerCase('ms-MY');
  const conceptId = standaloneAnswer && subjectId === 'bm' && /kata nama am/.test(text) &&
    !/kata nama khas|(?:apa\s+)?beza|perbezaan|bandingkan/.test(text)
    ? 'common_noun'
    : '';
  const directTeachingAnchor = conceptId ? createTeachingAnchor({ ...scope, conceptId }) : null;
  return {
    directTeachingAnchor,
    teachingAnchor: directTeachingAnchor || (!newTopicRequest ? priorTeachingAnchor : null)
  };
}

export function getTeachingAnchorContent(value = {}) {
  const anchor = sanitizeTeachingAnchor(value);
  const content = anchor ? CURRICULUM_ANCHORS[anchor.conceptId] : null;
  return content ? {
    grounded: true,
    explanations: [...content.explanations],
    examples: [...content.examples],
    verifiedExamples: [...content.examples],
    alternatives: [...content.alternatives],
    steps: [...content.steps],
    checkQuestions: [...content.checkQuestions]
  } : null;
}

export function getTeachingAnchorCheck(value = {}) {
  const anchor = sanitizeTeachingAnchor(value);
  const check = anchor ? CURRICULUM_ANCHORS[anchor.conceptId]?.check : null;
  return check ? {
    acceptedAnswers: [...check.acceptedAnswers],
    options: [...check.options],
    correctFeedback: check.correctFeedback,
    reason: check.reason
  } : null;
}

export function getTeachingAnchorConceptKey(value = {}) {
  const anchor = sanitizeTeachingAnchor(value);
  return anchor
    ? [anchor.subjectId, `anchor:${anchor.conceptId}`, anchor.questionId || 'general'].join('::')
    : '';
}

export function createTeachingAnchorState(value = {}) {
  const teachingAnchor = sanitizeTeachingAnchor(value);
  if (!teachingAnchor) return null;
  return {
    supportStage: 'concept_introduction',
    misunderstandingCount: 0,
    strategyUsed: 'curriculum-concept-introduction',
    currentConcept: getTeachingAnchorConceptKey(teachingAnchor),
    pendingFollowUp: '',
    signal: 'concept_introduction',
    misconceptionType: '',
    teachingAnchor
  };
}

export function attachTeachingAnchorState(pedagogicalState = null, directTeachingAnchor = null, teachingAnchor = null) {
  if (!pedagogicalState) return createTeachingAnchorState(directTeachingAnchor || teachingAnchor);
  return teachingAnchor ? { ...pedagogicalState, teachingAnchor } : pedagogicalState;
}

export function getTeachingAnchorNoAnswerLead(language = 'ms') {
  if (language === 'en') return 'I will guide one clue at a time without giving the answer.';
  if (language === 'ar') return 'سأرشدك بتلميح واحد من دون إعطاء الجواب.';
  return 'Saya akan bimbing satu petunjuk pada satu masa tanpa memberi jawapan terus.';
}

export function selectTeachingAnchorCandidate(candidates = [], history = [], currentConcept = '', teachingAnchor = null, reuseFirst = true) {
  if (!teachingAnchor) return candidates[0] || '';
  const used = (Array.isArray(history) ? history : [])
    .filter(item => item?.role === 'ai' && item?.pedagogicalState?.currentConcept === currentConcept)
    .map(item => String(item.text || '').toLocaleLowerCase('ms-MY').replace(/[^\p{L}\p{N}]+/gu, ' ').trim());
  return candidates.find(candidate => {
    const normalized = String(candidate).toLocaleLowerCase('ms-MY').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    return !used.some(text => text.includes(normalized));
  }) || (reuseFirst ? candidates[0] : '') || '';
}
