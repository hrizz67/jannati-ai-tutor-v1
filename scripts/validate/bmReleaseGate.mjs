import assert from 'node:assert/strict';
import { bmSubject } from '../../src/data/subjects/bm.js';
import { getAcceptedAnswers, normalizeAcceptedAnswer } from '../../src/utils/acceptedAnswers.js';

const normalize = value => {
  const raw = String(value ?? '').trim();
  const standalonePunctuation = raw.match(/^[?!.,;:]$/)?.[0];
  return standalonePunctuation
    ? `punctuation:${standalonePunctuation}`
    : normalizeAcceptedAnswer(raw).replace(/\s+/g, ' ').trim();
};
const records = (bmSubject.topics || []).flatMap(topic => (topic.questions || []).map(question => ({ topic, question })));
const issues = [];
const seenStems = new Map();

function add(code, topic, question, detail) {
  issues.push({ code, topicId: topic.id, questionId: question.id, detail });
}

for (const { topic, question } of records) {
  const q = normalize(question.q || '');
  const questionField = normalize(question.question || '');
  const answer = normalize(question.answer || '');
  const accepted = getAcceptedAnswers(question).map(normalize);
  const combined = `${q} ${questionField}`;

  if (!q || !answer) add('MISSING_CORE_FIELD', topic, question, 'q and answer are required');
  if (questionField && q !== questionField) add('Q_FIELD_MISMATCH', topic, question, `${question.q} !== ${question.question}`);
  if (answer && !accepted.includes(answer)) add('ANSWER_NOT_ACCEPTED', topic, question, answer);

  const stemKey = q.replace(/\b(set|variasi|soalan)\s*\d+\b/gi, '').trim();
  if (stemKey) {
    const previous = seenStems.get(`${topic.id}:${stemKey}`);
    if (previous) add('DUPLICATE_STEM', topic, question, `duplicate of ${previous}`);
    else seenStems.set(`${topic.id}:${stemKey}`, question.id);
  }

  const targetRules = [
    ['nama sekolah', /nama sekolah/, /\bsekolah\b/],
    ['nama bandar', /nama bandar|bagi bandar/, /\b(?:kuala lumpur|kota bharu|shah alam|ipoh|melaka|johor bahru|kuantan|kuching|kota kinabalu)\b/],
    ['nama tempat', /nama tempat|tempat tersebut|tempat dalam/, null],
    ['nama orang', /nama orang|nama guru|nama murid/, null],
    ['jenama', /jenama(?: susu)?/, null]
  ];
  for (const [label, promptPattern, answerPattern] of targetRules) {
    if (!promptPattern.test(combined)) continue;
    if (answerPattern && !answerPattern.test(answer)) add('TARGET_ANSWER_MISMATCH', topic, question, `${label} -> ${question.answer}`);
    if (label !== 'nama bandar' && label !== 'nama sekolah' && answer && !combined.includes(answer)) {
      add('ANSWER_NOT_IN_CONTEXT', topic, question, `${label} -> ${question.answer}`);
    }
    if (label === 'nama sekolah' && !/\bsekolah\b/.test(combined)) add('SCHOOL_CONTEXT_MISSING', topic, question, combined);
  }
}

const summary = {
  status: issues.length ? 'FAIL' : 'PASS',
  records: records.length,
  issueCount: issues.length,
  byCode: issues.reduce((acc, issue) => ({ ...acc, [issue.code]: (acc[issue.code] || 0) + 1 }), {}),
  issues: issues.slice(0, 120)
};
console.log(JSON.stringify(summary, null, 2));
assert.equal(issues.length, 0, `BM release gate found ${issues.length} issue(s)`);
