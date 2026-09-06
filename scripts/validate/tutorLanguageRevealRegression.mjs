import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAnswerRevealPolicy, textContainsExpectedAnswer } from '../../src/ai/policy/answerRevealPolicy.js';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import { teachAnswer } from '../../src/ai/teacherEngine.js';
import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';
import { buildTutorGatewayPayload, mergeGenerativeTutorResponse } from '../../src/ai/generative/tutorGenerativeGateway.js';
import { segmentMixedLanguageText } from '../../src/ai/voice/languageDetector.js';
import { getSubjectLanguagePresentation } from '../../src/ai/voice/voiceConfig.js';

const root = process.cwd();
const policyAt = attemptCount => getAnswerRevealPolicy({ attemptCount });

assert.deepEqual(
  ['bm', 'math', 'sains', 'islam', 'pj', 'pk'].map(id => getSubjectLanguagePresentation(id).contentLocale),
  Array(6).fill('ms-MY'),
  'Subjek BM, Matematik, Sains, Islam, PJ dan PK mesti menggunakan ms-MY.'
);
assert.equal(getSubjectLanguagePresentation('english').contentLocale, 'en-GB');
assert.equal(getSubjectLanguagePresentation('arab').contentLocale, 'ar-SA');
assert.equal(getSubjectLanguagePresentation('arab').teachingLocale, 'ms-MY');
assert.equal(getSubjectLanguagePresentation('arab').direction, 'rtl');
assert.equal(getSubjectLanguagePresentation('arab').teachingDirection, 'ltr');

assert.equal(policyAt(0).stage, 'before_submission');
assert.equal(policyAt(0).canRevealAnswer, false);
assert.equal(policyAt(1).stage, 'guiding_question');
assert.equal(policyAt(1).canRevealAnswer, false);
assert.equal(policyAt(2).stage, 'strong_hint');
assert.equal(policyAt(2).canRevealAnswer, false);
assert.equal(policyAt(3).stage, 'answer_reveal_allowed');
assert.equal(policyAt(3).canRevealAnswer, true);
assert.equal(getAnswerRevealPolicy({ status: 'correct', attemptCount: 1 }).canRevealAnswer, true);
assert.equal(getAnswerRevealPolicy({ status: 'almost', attemptCount: 1 }).canRevealAnswer, true);
assert.equal(getAnswerRevealPolicy({ attemptCount: 1, explicitAnswerRequest: true }).canRevealAnswer, false);
assert.equal(getAnswerRevealPolicy({ attemptCount: 1, explicitAnswerRequest: true, allowExplicitAnswerReveal: true }).canRevealAnswer, true);
assert.equal(textContainsExpectedAnswer('Jawapannya ialah akar.', ['akar']), true);
assert.equal(textContainsExpectedAnswer('Cari bahagian yang menyerap air.', ['akar']), false);

const scienceQuestion = {
  id: 'science-root-1',
  subjectId: 'sains',
  topicId: 'tumbuhan',
  q: 'Bahagian tumbuhan manakah yang menyerap air?',
  instruction: 'Pilih bahagian tumbuhan yang betul.',
  answer: 'akar',
  acceptedAnswers: ['akar'],
  hint: 'Cari bahagian tumbuhan yang berada di dalam tanah.',
  explanation: 'Akar menyerap air dari tanah.'
};
const wrongResult = { status: 'wrong', correct: false };
for (const attemptCount of [1, 2]) {
  const explanation = explainAnswer({ question: scienceQuestion, topic: { id: 'tumbuhan', subjectId: 'sains' }, result: wrongResult, attemptCount });
  assert.equal(explanation.showCorrectAnswer, false);
  assert.equal(explanation.correctAnswer, '');
  assert.doesNotMatch(JSON.stringify(explanation.sections), /Akar menyerap air/i, `Cubaan ${attemptCount} tidak boleh membocorkan penerangan jawapan.`);
  const teaching = teachAnswer({ question: scienceQuestion, topic: { id: 'tumbuhan', subjectId: 'sains' }, explanationData: explanation, attemptCount });
  assert.equal(teaching.showCorrectAnswer, false);
  assert.equal(teaching.correctAnswer, '');
}
const thirdExplanation = explainAnswer({ question: scienceQuestion, topic: { id: 'tumbuhan', subjectId: 'sains' }, result: wrongResult, attemptCount: 3 });
assert.equal(thirdExplanation.showCorrectAnswer, true);
assert.equal(thirdExplanation.correctAnswer, 'akar');
const correctExplanation = explainAnswer({ question: scienceQuestion, topic: { id: 'tumbuhan', subjectId: 'sains' }, result: { status: 'correct', correct: true }, attemptCount: 1 });
assert.equal(correctExplanation.showCorrectAnswer, true);

const englishQuestion = {
  id: 'english-verb-1',
  subjectId: 'english',
  topicId: 'verbs',
  q: 'She ___ to school every day.',
  instruction: 'Choose the correct verb.',
  answer: 'walks',
  acceptedAnswers: ['walks'],
  hint: 'Look at the subject she.'
};
const tutorBase = {
  student: { id: 'student-test', name: 'Alya' },
  subject: { id: 'english', title: 'English' },
  topic: { id: 'verbs', title: 'Verbs', note: 'A verb shows an action.' },
  question: englishQuestion,
  prompt: 'Please give me a hint',
  intent: 'hint',
  isCorrect: false
};
const englishFirst = await getTutorResponse({ ...tutorBase, attemptCount: 1 });
const englishSecond = await getTutorResponse({ ...tutorBase, attemptCount: 2 });
const englishThird = await getTutorResponse({ ...tutorBase, attemptCount: 3 });
assert.equal(englishFirst.locale, 'en-GB');
assert.equal(englishFirst.expectedAnswer, '');
assert.doesNotMatch(englishFirst.shortText, /jawapan|cuba|soalan|petunjuk/i, 'Bimbingan English tidak boleh kembali kepada salinan generik Bahasa Melayu.');
assert.equal(englishSecond.supportStage, 'strong_hint');
assert.notEqual(englishSecond.shortText, englishFirst.shortText, 'Cubaan kedua mesti memberi petunjuk yang lebih kuat.');
assert.equal(englishThird.expectedAnswer, 'walks');
assert.match(englishThird.shortText, /answer is walks/i);

const arabicTutor = await getTutorResponse({
  student: { id: 'student-test', name: 'Alya' },
  subject: { id: 'arab', title: 'Bahasa Arab' },
  topic: { id: 'warna', title: 'الألوان', note: 'الأحمر bermaksud warna merah.' },
  question: { id: 'arab-colour-1', subjectId: 'arab', q: 'اختر اللون الأحمر', instruction: 'Pilih warna merah.', answer: 'الأحمر', acceptedAnswers: ['الأحمر'], hint: 'Lihat perkataan warna.' },
  prompt: 'Beri petunjuk',
  intent: 'hint',
  attemptCount: 1,
  isCorrect: false
});
assert.equal(arabicTutor.locale, 'ar-SA');
assert.equal(arabicTutor.languagePresentation.contentLanguage, 'ar');
assert.equal(arabicTutor.languagePresentation.teachingLanguage, 'ms');
assert.equal(arabicTutor.expectedAnswer, '');

const mixedSegments = segmentMixedLanguageText('Baca perkataan كتاب dengan teliti.', 'ms');
assert.ok(mixedSegments.some(segment => segment.language === 'ar' && /كتاب/.test(segment.text)));
assert.ok(mixedSegments.some(segment => segment.language === 'ms' && /Baca/.test(segment.text)));

for (const [subjectId, locale] of [['bm', 'ms-MY'], ['english', 'en-GB'], ['arab', 'ar-SA']]) {
  const payload = buildTutorGatewayPayload({
    ...tutorBase,
    subject: { id: subjectId, title: subjectId },
    locale: '',
    expectedAnswer: englishQuestion.answer,
    attemptCount: 1
  }, englishFirst);
  assert.equal(payload.locale, locale);
  assert.doesNotMatch(payload.context.localGuidance, /walks/i, 'Payload petunjuk awal tidak boleh membawa jawapan.');
}

const protectedLocal = {
  ...englishFirst,
  intent: 'wrong_answer_coaching',
  text: 'Check the subject in the sentence.',
  shortText: 'Check the subject in the sentence.',
  contextUsed: { hasQuestion: true },
  referencesPreviousTurn: true
};
const remoteAnswer = { text: 'The answer is walks.', quickReplies: [], intent: 'why_question', confidence: 90, canAnswerSafely: true, needsAdultHelp: false };
const rejectedRemote = mergeGenerativeTutorResponse(protectedLocal, remoteAnswer, { expectedAnswer: 'walks', acceptedAnswers: ['walks'], attemptCount: 1 });
assert.equal(rejectedRemote.source, protectedLocal.source, 'Respons jauh yang membocorkan jawapan awal mesti ditolak.');
const acceptedRemote = mergeGenerativeTutorResponse({ ...protectedLocal, answerRevealPolicy: policyAt(3) }, remoteAnswer, { expectedAnswer: 'walks', acceptedAnswers: ['walks'], attemptCount: 3 });
assert.equal(acceptedRemote.source, 'generative-gateway', 'Jawapan boleh diterima selepas polisi membenarkannya.');

const subjectText = readFileSync(resolve(root, 'src/components/SubjectLanguageText.jsx'), 'utf8');
const tutorModalText = readFileSync(resolve(root, 'src/components/ai/TutorAIModal.jsx'), 'utf8');
const appText = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
assert.match(subjectText, /<bdi[^>]+lang="ar"[^>]+dir="rtl"/, 'Segmen Arab bercampur mesti menggunakan bdi RTL sendiri.');
assert.doesNotMatch(subjectText, /document\.documentElement|document\.body/, 'RTL tidak boleh digunakan pada seluruh aplikasi.');
assert.doesNotMatch(tutorModalText, /locale:\s*['"]ms-MY['"]/, 'Tutor AI tidak boleh mengunci semua subjek kepada ms-MY.');
assert.match(tutorModalText, /requestIdRef\.current !== started \|\| requestContextRef\.current !== startedContext/, 'Respons async lama mesti dibuang selepas konteks bertukar.');
assert.match(appText, /const tutorConversationKey = createTutorConversationScope\(learningIdentity, \{[\s\S]{0,400}chatSubject\?\.id[\s\S]{0,400}chatTopic\?\.id[\s\S]{0,400}tutorQuestion\?\.id/, 'Sejarah Tutor AI mesti diasingkan mengikut akaun, profil stabil, subjek, topik, sesi dan soalan.');

console.log('Tutor language and answer reveal regression: PASS');
