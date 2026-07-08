export function normalizeStem(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}{_}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTemplate(value = '') {
  return normalizeStem(value).replace(/\d+/g, '{n}');
}

export function extractNumbers(value = '') {
  return String(value).match(/\d+/g)?.map(Number) || [];
}

export function numberSignature(question = {}) {
  if (question.subjectId && question.subjectId !== 'math' && !question.qde?.numberVariation && !question.qde?.virtual) return '';
  if (!question.qde?.numbers && !question.qde?.numberVariation && !question.qde?.virtual) return '';
  const numbers = question.qde?.numbers || extractNumbers(question.q || question.question || '');
  return numbers.length ? numbers.join('|') : '';
}

export function templateSignature(question = {}) {
  return question.qde?.templateId || question.templateId || question.id || normalizeTemplate(question.q || question.question || '');
}

export function answerPattern(question = {}) {
  const options = question.options || question.choices;
  const answerIndex = question.answerIndex ?? question.answer_index ?? question.correctIndex;
  if (Array.isArray(options) && Number.isInteger(answerIndex)) return `choice:${answerIndex}`;

  const answer = question.answer ?? question.correctAnswer ?? '';
  const text = String(answer).trim().toLowerCase();
  if (!text) return 'empty';
  if (Number.isFinite(Number(text))) return `number:${text}`;
  return `answer:${text.replace(/\s+/g, ' ')}`;
}

export function questionSignature(question = {}) {
  const rawStem = question.q || question.question || '';
  let stem = normalizeStem(rawStem);

  const id = String(question.id || '');
  const subjectId = String(question.subjectId || '');
  const topicId = String(question.topicId || question.qde?.selectedTopicId || question.metadata?.category || '');

  const isBmPenjodoh =
  subjectId === 'bm' &&
  (topicId === 'penjodoh_bilangan' || id.startsWith('BM-PENJODOH_BILANGAN-'));

const isBmTatabahasa =
  subjectId === 'bm' &&
  (topicId === 'tatabahasa' || id.startsWith('BM-TATABAHASA-'));

if ((isBmPenjodoh || isBmTatabahasa) && stem) {
  stem = `${stem}|${id}`;
}

  return {
    id: question.id || '',
    stem,
    template: templateSignature(question),
    numbers: numberSignature(question),
    answer: answerPattern(question)
  };
}

export function isDuplicateQuestion(question = {}, seen = {}) {
  const signature = questionSignature(question);
  return {
    id: Boolean(signature.id && seen.ids?.has(signature.id)),
    stem: Boolean(signature.stem && seen.stems?.has(signature.stem)),
    template: Boolean(signature.template && seen.templates?.has(signature.template)),
    numbers: Boolean(signature.numbers && seen.numbers?.has(signature.numbers)),
    answer: Boolean(signature.answer && seen.answers?.has(signature.answer))
  };
}

export function createSeenSignatures(questions = []) {
  const seen = {
    ids: new Set(),
    stems: new Set(),
    templates: new Set(),
    numbers: new Set(),
    answers: new Set()
  };
  questions.forEach(question => addSeenSignature(seen, question));
  return seen;
}

export function addSeenSignature(seen, question = {}) {
  const signature = questionSignature(question);
  if (signature.id) seen.ids.add(signature.id);
  if (signature.stem) seen.stems.add(signature.stem);
  if (signature.template) seen.templates.add(signature.template);
  if (signature.numbers) seen.numbers.add(signature.numbers);
  if (signature.answer) seen.answers.add(signature.answer);
  return seen;
}

export function duplicateReasons(question = {}, seen = {}) {
  const duplicate = isDuplicateQuestion(question, seen);
  return Object.entries(duplicate)
    .filter(([, matched]) => matched)
    .map(([key]) => key);
}

export function detectDuplicateIssues(questions = []) {
  const seen = createSeenSignatures();
  const issues = [];
  questions.forEach((question, index) => {
    const reasons = duplicateReasons(question, seen);
    reasons.forEach(reason => {
      issues.push({ reason, index, id: question.id || null, stem: question.q || question.question || '' });
    });
    addSeenSignature(seen, question);
  });
  return issues;
}
