import assert from 'node:assert/strict';
import { analyzeQuestion, auditQuestionBank } from '../../src/ai/questionAudit/questionAuditEngine.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';

function issueTypes(question) {
  return analyzeQuestion(question, {
    subjectId: 'bm',
    subject: 'Bahasa Melayu Tahun 2',
    topicId: 'regression',
    topic: 'Regression',
    recentTexts: [],
    recentAnswers: [],
    recentTemplates: []
  }).issues.map(issue => issue.issueType);
}

const validBinary = issueTypes({
  id: 'REG-BINARY-VALID',
  q: "Pilih jawapan yang betul: 'Aina membaca' atau 'Aina buku'.",
  answer: 'Aina membaca.',
  accepted: ['Aina membaca.', 'ayat pertama'],
  options: ['Aina membaca.', 'Aina buku.'],
  questionType: 'objective'
});
assert.equal(validBinary.includes('unclear_distractors'), false, 'Explicit binary choices must be accepted.');
assert.equal(validBinary.includes('answer_not_matching_options'), false, 'Accepted variants must not be treated as answer options.');

const unclearBinary = issueTypes({
  id: 'REG-BINARY-UNCLEAR',
  q: 'Apakah jawapan yang tepat?',
  answer: 'Pilihan A',
  options: ['Pilihan A', 'Pilihan B'],
  questionType: 'objective'
});
assert.equal(unclearBinary.filter(issue => issue === 'unclear_distractors').length, 1, 'An unexplained two-option item must be reported once.');

const duplicateOptions = issueTypes({
  id: 'REG-OPTIONS-DUPLICATE',
  q: 'Pilih jawapan yang betul.',
  answer: 'Betul',
  options: ['Betul', 'Betul'],
  questionType: 'objective'
});
assert.equal(duplicateOptions.filter(issue => issue === 'duplicate_answer_options').length, 1, 'Duplicate options must be reported once.');

const invalidAnswer = issueTypes({
  id: 'REG-ANSWER-INVALID',
  q: 'Pilih jawapan yang betul.',
  answer: 'Tidak sepadan',
  answerIndex: 1,
  options: ['Pilihan A', 'Pilihan B'],
  questionType: 'objective'
});
assert.equal(invalidAnswer.includes('answer_not_matching_options'), true, 'A mismatched canonical answer must still fail even when an answer index exists.');

const subjects = await loadAllSubjects();
const audit = auditQuestionBank(subjects);
const high = audit.issues.filter(issue => issue.severity === 'Critical' || issue.severity === 'High');
const unclear = audit.issues.filter(issue => issue.issueType === 'unclear_distractors');
assert.equal(high.length, 0, `Critical or High question-audit findings remain: ${JSON.stringify(high.slice(0, 10))}`);
assert.equal(unclear.length, 0, `Unclear distractor findings remain: ${JSON.stringify(unclear.slice(0, 10))}`);

console.log(JSON.stringify({
  status: 'PASS',
  questionsChecked: audit.statistics.totalQuestions,
  criticalOrHighFindings: high.length,
  unclearDistractorFindings: unclear.length
}, null, 2));
