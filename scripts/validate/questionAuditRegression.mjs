import assert from 'node:assert/strict';
import { analyzeQuestion, auditQuestionBank } from '../../src/ai/questionAudit/questionAuditEngine.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { validateEnglishSentence } from '../../src/utils/englishSentenceQuality.js';
import { validateSainsQuestionRecord } from '../../src/utils/sainsContentQuality.js';
import { validateArabQuestionRecord } from '../../src/utils/arabContentQuality.js';
import { validateIslamQuestionRecord } from '../../src/utils/islamContentQuality.js';

function issueTypes(question, state = {}) {
  return analyzeQuestion(question, {
    subjectId: 'bm',
    subject: 'Bahasa Melayu Tahun 2',
    topicId: 'regression',
    topic: 'Regression',
    recentTexts: [],
    recentAnswers: [],
    recentTemplates: [],
    recentAnswerTemplates: [],
    ...state
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

const legitimateRepeatedTarget = issueTypes({
  id: 'REG-REPETITION-LEGITIMATE',
  q: "Lengkapkan ayat: Aina pergi ___ sekolah.",
  answer: 'ke',
  questionType: 'short_answer'
}, {
  recentAnswers: ['ke']
});
assert.equal(legitimateRepeatedTarget.includes('same_answer_pattern_repeated'), false, 'A repeated answer without a shared template must remain valid target practice.');

const mechanicalRepeatedTarget = issueTypes({
  id: 'REG-REPETITION-MECHANICAL',
  q: "Lengkapkan ayat: Aina pergi ___ sekolah.",
  answer: 'ke',
  questionType: 'short_answer',
  questionStyle: 'fill_preposition'
}, {
  recentTemplates: ['fill_preposition'],
  recentAnswerTemplates: ['fill_preposition::ke']
});
assert.equal(mechanicalRepeatedTarget.includes('same_answer_pattern_repeated'), true, 'A repeated answer within the same authored template must be reported.');

const subjects = await loadAllSubjects();
const audit = auditQuestionBank(subjects);
const high = audit.issues.filter(issue => issue.severity === 'Critical' || issue.severity === 'High');
const unclear = audit.issues.filter(issue => issue.issueType === 'unclear_distractors');
const pjRepeatedAnswers = audit.issues.filter(issue =>
  issue.subject === 'Pendidikan Jasmani Tahun 2' &&
  issue.issueType === 'same_answer_pattern_repeated'
);
const pjSubject = subjects.find(subject => subject.id === 'pj');
const pjQuestions = pjSubject?.topics?.flatMap(topic => topic.questions || []) || [];
const pjMissingLearningMetadata = pjQuestions.filter(question =>
  !question.questionType || !question.cognitiveLevel
);
const pkRepeatedAnswers = audit.issues.filter(issue =>
  issue.subject === 'Pendidikan Kesihatan Tahun 2' &&
  issue.issueType === 'same_answer_pattern_repeated'
);
const pkSubject = subjects.find(subject => subject.id === 'pk');
const pkQuestions = pkSubject?.topics?.flatMap(topic => topic.questions || []) || [];
const pkMissingLearningMetadata = pkQuestions.filter(question =>
  !question.questionType || !question.cognitiveLevel
);
const bmRepeatedAnswers = audit.issues.filter(issue =>
  issue.subject === 'Bahasa Melayu Tahun 2' &&
  issue.issueType === 'same_answer_pattern_repeated'
);
const bmSubject = subjects.find(subject => subject.id === 'bm');
const bmQuestions = bmSubject?.topics?.flatMap(topic => topic.questions || []) || [];
const bmMissingLearningMetadata = bmQuestions.filter(question =>
  !question.questionType || !question.cognitiveLevel
);
const englishSubject = subjects.find(subject => subject.id === 'english');
const englishQuestions = englishSubject?.topics?.flatMap(topic => topic.questions || []) || [];
const englishMissingLearningMetadata = englishQuestions.filter(question =>
  !question.questionType || !question.cognitiveLevel
);
const englishInvalidAuthoredText = englishQuestions.flatMap(question =>
  ['q', 'question', 'hint', 'explanation'].flatMap(field => {
    if (!question[field]) return [];
    const validation = validateEnglishSentence(question[field]);
    return validation.valid ? [] : [{ id: question.id, field, issues: validation.issues }];
  })
);
const englishInvalidFilledSentences = englishQuestions
  .filter(question => /_{2,}/.test(question.q || question.question || ''))
  .flatMap(question => {
    const completedSentence = String(question.q || question.question).replace(/_{2,}/, question.answer);
    const validation = validateEnglishSentence(completedSentence);
    return validation.valid ? [] : [{ id: question.id, sentence: completedSentence, issues: validation.issues }];
  });
const englishReadingExpectations = {
  'ENG-READING-004': { answer: 'She smiles', evidence: 'She smiles because she likes her books.' },
  'ENG-READING-008': { answer: 'under the chair', evidence: "Where does Ben's cat sleep?" },
  'ENG-READING-018': { answer: "at seven o'clock", evidence: "Ravi leaves home at seven o'clock" },
  'ENG-READING-034': { answer: 'because they are sweet', evidence: 'because they are sweet' },
  'ENG-READING-039': { answer: 'because it is clean', evidence: 'It looks nice because it is clean.' },
  'ENG-READING-044': { answer: 'because it is for a family party', evidence: 'The cake is special because it is for the party.' },
  'ENG-READING-049': { answer: 'because it wants food', evidence: 'because it wants food' }
};
const englishReadingEvidenceFailures = Object.entries(englishReadingExpectations).flatMap(([id, expected]) => {
  const question = englishQuestions.find(item => item.id === id);
  if (!question || question.answer !== expected.answer || !String(question.q || question.question).includes(expected.evidence)) {
    return [{ id, actualAnswer: question?.answer, actualQuestion: question?.q || question?.question }];
  }
  return [];
});
const sainsSubject = subjects.find(subject => subject.id === 'sains');
const sainsQuestions = sainsSubject?.topics?.flatMap(topic => topic.questions || []) || [];
const sainsQualityFailures = sainsQuestions.flatMap(question => {
  const validation = validateSainsQuestionRecord(question);
  return validation.valid ? [] : [{ id: question.id, issues: validation.issues }];
});
const sainsQuestionKeys = new Map();
const sainsDuplicateQuestions = [];
for (const question of sainsQuestions) {
  const key = String(question.q || question.question).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim();
  if (sainsQuestionKeys.has(key)) sainsDuplicateQuestions.push({ id: question.id, duplicateOf: sainsQuestionKeys.get(key) });
  else sainsQuestionKeys.set(key, question.id);
}
const sainsCognitiveLevels = new Set(sainsQuestions.map(question => question.cognitiveLevel));
const sainsConceptExpectations = {
  'SAINS-AIR-009': { answer: 'objek', evidence: 'belum tentu selamat diminum' },
  'SAINS-AIR-017': { answer: 'orang dewasa', evidence: 'jangan cuba memadamkan api sendiri' },
  'SAINS-BAHAN-025': { answer: 'permukaan', evidence: 'bukan ditentukan oleh berat sahaja' },
  'SAINS-BAHAN-026': { answer: 'dasar', evidence: 'bukan ditentukan oleh berat sahaja' },
  'SAINS-KEMAHIRAN_SAINTIFIK-007': { answer: 'tinggi', evidence: 'tidak semestinya kuat' },
  'SAINS-KEMAHIRAN_SAINTIFIK-043': { answer: 'semasa', evidence: 'sebelum, semasa dan selepas' },
  'SAINS-TEKNOLOGI-022': { answer: 'orang dewasa', evidence: 'jangan sentuh atau baiki soket sendiri' }
};
const sainsConceptFailures = Object.entries(sainsConceptExpectations).flatMap(([id, expected]) => {
  const question = sainsQuestions.find(item => item.id === id);
  const learningSupport = `${question?.hint || ''} ${question?.explanation || ''}`.toLocaleLowerCase('ms-MY');
  if (!question || question.answer !== expected.answer || !learningSupport.includes(expected.evidence.toLocaleLowerCase('ms-MY'))) {
    return [{ id, actualAnswer: question?.answer, hint: question?.hint, explanation: question?.explanation }];
  }
  return [];
});
const sainsTopicNoteFailures = (sainsSubject?.topics || []).filter(topic =>
  !String(topic.note || '').startsWith('Murid ') || !Array.isArray(topic.learningObjectives) || topic.learningObjectives.length < 2
);
const arabSubject = subjects.find(subject => subject.id === 'arab');
const arabQuestions = arabSubject?.topics?.flatMap(topic =>
  (topic.questions || []).map(question => ({ ...question, topicId: topic.id }))
) || [];
const arabQualityFailures = arabQuestions.flatMap(question => {
  const validation = validateArabQuestionRecord(question);
  return validation.valid ? [] : [{ id: question.id, issues: validation.issues }];
});
const arabQuestionKeys = new Map();
const arabDuplicateQuestions = [];
for (const question of arabQuestions) {
  const key = String(question.q || question.question).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim();
  if (arabQuestionKeys.has(key)) arabDuplicateQuestions.push({ id: question.id, duplicateOf: arabQuestionKeys.get(key) });
  else arabQuestionKeys.set(key, question.id);
}
const arabTopicNoteFailures = (arabSubject?.topics || []).filter(topic =>
  !String(topic.note || '').startsWith('Murid ') || !Array.isArray(topic.learningObjectives) || topic.learningObjectives.length < 3
);
const arabAnswerLeakage = arabQuestions.filter(question =>
  ['ayat_mudah_arab', 'hiwar'].includes(question.topicId)
  && /[\u0600-\u06ff]/u.test(String(question.answer))
  && String(question.q || question.question).includes(String(question.answer))
);
const arabCognitiveLevels = new Set(arabQuestions.map(question => question.cognitiveLevel));
const islamSubject = subjects.find(subject => subject.id === 'islam');
const islamQuestions = islamSubject?.topics?.flatMap(topic =>
  (topic.questions || []).map(question => ({ ...question, topicId: topic.id }))
) || [];
const islamQualityFailures = islamQuestions.flatMap(question => {
  const validation = validateIslamQuestionRecord(question, { topicId: question.topicId });
  return validation.valid ? [] : [{ id: question.id, issues: validation.issues }];
});
const islamQuestionKeys = new Map();
const islamDuplicateQuestions = [];
for (const question of islamQuestions) {
  const key = String(question.q || question.question).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim();
  if (islamQuestionKeys.has(key)) islamDuplicateQuestions.push({ id: question.id, duplicateOf: islamQuestionKeys.get(key) });
  else islamQuestionKeys.set(key, question.id);
}
const islamTopicNoteFailures = (islamSubject?.topics || []).filter(topic =>
  !String(topic.note || '').startsWith('Murid ') || !Array.isArray(topic.learningObjectives) || topic.learningObjectives.length < 3
);
const islamCognitiveLevels = new Set(islamQuestions.map(question => question.cognitiveLevel));
const islamRegressionExpectations = {
  'ISLAM-AQIDAH-023': 'Allah',
  'ISLAM-IBADAH-003': 'mutlak',
  'ISLAM-QURAN-039': 'berwuduk',
  'ISLAM-HADIS-004': 'iman',
  'ISLAM-HAFAZAN-025': 'أَعُوذُ',
  'ISLAM-HAFAZAN-026': 'غُفْرَانَكَ',
  'ISLAM-JAWI_PERKATAAN-046': 'چيقݢو'
};
const islamContentRegressions = Object.entries(islamRegressionExpectations).flatMap(([id, answer]) => {
  const question = islamQuestions.find(item => item.id === id);
  return question?.answer === answer ? [] : [{ id, expectedAnswer: answer, actualAnswer: question?.answer }];
});
assert.equal(high.length, 0, `Critical or High question-audit findings remain: ${JSON.stringify(high.slice(0, 10))}`);
assert.equal(audit.issues.length, 0, `Question-audit findings remain: ${JSON.stringify(audit.issues.slice(0, 10))}`);
assert.equal(
  Object.values(audit.statistics.severityCounts).reduce((sum, count) => sum + count, 0),
  audit.issues.length,
  'Question-audit severity counts must count findings, not passing questions.'
);
assert.equal(unclear.length, 0, `Unclear distractor findings remain: ${JSON.stringify(unclear.slice(0, 10))}`);
assert.equal(pjQuestions.length, 500, `Expected 500 PJ questions, received ${pjQuestions.length}.`);
assert.equal(pjRepeatedAnswers.length, 0, `Repeated PJ answer patterns remain: ${JSON.stringify(pjRepeatedAnswers.slice(0, 10))}`);
assert.equal(pjMissingLearningMetadata.length, 0, `PJ learning metadata is incomplete: ${JSON.stringify(pjMissingLearningMetadata.slice(0, 10))}`);
assert.equal(pkQuestions.length, 500, `Expected 500 PK questions, received ${pkQuestions.length}.`);
assert.equal(pkRepeatedAnswers.length, 0, `Repeated PK answer patterns remain: ${JSON.stringify(pkRepeatedAnswers.slice(0, 10))}`);
assert.equal(pkMissingLearningMetadata.length, 0, `PK learning metadata is incomplete: ${JSON.stringify(pkMissingLearningMetadata.slice(0, 10))}`);
assert.equal(bmQuestions.length, 930, `Expected 930 BM questions, received ${bmQuestions.length}.`);
assert.equal(bmRepeatedAnswers.length, 0, `Invalid BM answer repetition findings remain: ${JSON.stringify(bmRepeatedAnswers.slice(0, 10))}`);
assert.equal(bmMissingLearningMetadata.length, 0, `BM learning metadata is incomplete: ${JSON.stringify(bmMissingLearningMetadata.slice(0, 10))}`);
assert.equal(englishQuestions.length, 500, `Expected 500 English questions, received ${englishQuestions.length}.`);
assert.equal(englishMissingLearningMetadata.length, 0, `English learning metadata is incomplete: ${JSON.stringify(englishMissingLearningMetadata.slice(0, 10))}`);
assert.equal(englishInvalidAuthoredText.length, 0, `Invalid authored English text remains: ${JSON.stringify(englishInvalidAuthoredText.slice(0, 10))}`);
assert.equal(englishInvalidFilledSentences.length, 0, `English fill-blank answers produce invalid sentences: ${JSON.stringify(englishInvalidFilledSentences.slice(0, 10))}`);
assert.equal(englishReadingEvidenceFailures.length, 0, `English reading answers are not grounded in their passages: ${JSON.stringify(englishReadingEvidenceFailures.slice(0, 10))}`);
assert.equal(sainsQuestions.length, 500, `Expected 500 Sains questions, received ${sainsQuestions.length}.`);
assert.equal(sainsQualityFailures.length, 0, `Sains content-quality findings remain: ${JSON.stringify(sainsQualityFailures.slice(0, 10))}`);
assert.equal(sainsDuplicateQuestions.length, 0, `Duplicate Sains questions remain: ${JSON.stringify(sainsDuplicateQuestions.slice(0, 10))}`);
assert.equal(sainsConceptFailures.length, 0, `Sains concept regressions remain: ${JSON.stringify(sainsConceptFailures.slice(0, 10))}`);
assert.equal(sainsTopicNoteFailures.length, 0, `Sains topic notes or learning objectives are incomplete: ${JSON.stringify(sainsTopicNoteFailures)}`);
assert.deepEqual(
  [...sainsCognitiveLevels].sort(),
  ['memahami', 'menganalisis', 'mengaplikasi', 'mengingat', 'menilai'].sort(),
  'Sains bank must retain appropriate cognitive-level diversity.'
);
assert.equal(arabQuestions.length, 500, `Expected 500 Bahasa Arab questions, received ${arabQuestions.length}.`);
assert.equal(arabQualityFailures.length, 0, `Bahasa Arab content-quality findings remain: ${JSON.stringify(arabQualityFailures.slice(0, 10))}`);
assert.equal(arabDuplicateQuestions.length, 0, `Duplicate Bahasa Arab questions remain: ${JSON.stringify(arabDuplicateQuestions.slice(0, 10))}`);
assert.equal(arabTopicNoteFailures.length, 0, `Bahasa Arab topic notes or learning objectives are incomplete: ${JSON.stringify(arabTopicNoteFailures)}`);
assert.equal(arabAnswerLeakage.length, 0, `Bahasa Arab reverse-translation answers leaked into stems: ${JSON.stringify(arabAnswerLeakage.slice(0, 10).map(question => question.id))}`);
assert.deepEqual(
  [...arabCognitiveLevels].sort(),
  ['memahami', 'menganalisis', 'mengaplikasi', 'mengingat'].sort(),
  'Bahasa Arab bank must retain appropriate cognitive-level diversity.'
);
assert.equal(islamQuestions.length, 500, `Expected 500 Pendidikan Islam questions, received ${islamQuestions.length}.`);
assert.equal(islamQualityFailures.length, 0, `Pendidikan Islam content-quality findings remain: ${JSON.stringify(islamQualityFailures.slice(0, 10))}`);
assert.equal(islamDuplicateQuestions.length, 0, `Duplicate Pendidikan Islam questions remain: ${JSON.stringify(islamDuplicateQuestions.slice(0, 10))}`);
assert.equal(islamTopicNoteFailures.length, 0, `Pendidikan Islam topic notes or learning objectives are incomplete: ${JSON.stringify(islamTopicNoteFailures)}`);
assert.equal(islamContentRegressions.length, 0, `Pendidikan Islam content regressions remain: ${JSON.stringify(islamContentRegressions)}`);
assert.deepEqual(
  [...islamCognitiveLevels].sort(),
  ['memahami', 'menganalisis', 'mengaplikasi', 'mengingat', 'menilai'].sort(),
  'Pendidikan Islam bank must retain cognitive-level diversity from recall through evaluation.'
);

console.log(JSON.stringify({
  status: 'PASS',
  questionsChecked: audit.statistics.totalQuestions,
  criticalOrHighFindings: high.length,
  unclearDistractorFindings: unclear.length,
  pjRepeatedAnswerFindings: pjRepeatedAnswers.length,
  pjQuestionsWithMissingLearningMetadata: pjMissingLearningMetadata.length,
  pkRepeatedAnswerFindings: pkRepeatedAnswers.length,
  pkQuestionsWithMissingLearningMetadata: pkMissingLearningMetadata.length,
  bmRepeatedAnswerFindings: bmRepeatedAnswers.length,
  bmQuestionsWithMissingLearningMetadata: bmMissingLearningMetadata.length,
  englishQuestionsWithMissingLearningMetadata: englishMissingLearningMetadata.length,
  invalidEnglishAuthoredText: englishInvalidAuthoredText.length,
  invalidEnglishFilledSentences: englishInvalidFilledSentences.length,
  englishReadingEvidenceFailures: englishReadingEvidenceFailures.length,
  sainsContentQualityFindings: sainsQualityFailures.length,
  sainsDuplicateQuestions: sainsDuplicateQuestions.length,
  sainsConceptRegressions: sainsConceptFailures.length,
  sainsTopicNoteFailures: sainsTopicNoteFailures.length,
  arabContentQualityFindings: arabQualityFailures.length,
  arabDuplicateQuestions: arabDuplicateQuestions.length,
  arabTopicNoteFailures: arabTopicNoteFailures.length,
  arabAnswerLeakageFindings: arabAnswerLeakage.length,
  islamContentQualityFindings: islamQualityFailures.length,
  islamDuplicateQuestions: islamDuplicateQuestions.length,
  islamTopicNoteFailures: islamTopicNoteFailures.length,
  islamContentRegressions: islamContentRegressions.length
}, null, 2));
