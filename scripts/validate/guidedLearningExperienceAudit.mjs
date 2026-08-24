import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';
import {
  GUIDED_STATES,
  buildGuidedLearning,
  classifyMisconception,
  resolveTutorMode
} from '../../src/ai/guidedLearning/index.js';

const root = process.cwd();
const engineText = readFileSync(path.join(root, 'src', 'ai', 'guidedLearning', 'learningExperience.js'), 'utf8');
const modalText = readFileSync(path.join(root, 'src', 'components', 'ai', 'TutorAIModal.jsx'), 'utf8');
const styleText = readFileSync(path.join(root, 'src', 'styles', 'style.css'), 'utf8');
const issues = [];
const check = (condition, message) => { if (!condition) issues.push(message); };

for (const mode of ['coach', 'teacher', 'examiner', 'motivator']) check(engineText.includes(`'${mode}'`) || engineText.includes(`"${mode}"`), `Tutor mode missing: ${mode}`);
check(engineText.includes('resolveTutorMode'), 'Mode resolver missing.');
check(engineText.includes('classifyMisconception'), 'Misconception classifier missing.');
check(engineText.includes('incorrect_first') && engineText.includes('guidingQuestion') && engineText.includes('strong_hint'), 'Guided support ladder is incomplete.');
check(engineText.includes('hint') && engineText.includes('guidingQuestion'), 'Progressive hint stages are missing.');
check(engineText.includes('correct after support') || engineText.includes('correct_after_support'), 'Meaningful praise for supported correction is missing.');
check(engineText.includes('limitTutorText'), 'Year 2 response-length guard is missing.');
check(engineText.includes('BLOCKED_PHRASES'), 'Emotional-safety blocked phrases are missing.');
check(modalText.includes('INITIAL_GREETING') && modalText.includes('withTimeout('), 'Modal open/timeout protections are missing.');
check(!/getTutorResponse\(/.test(modalText.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[open, sessionKey\]\);/)?.[0] || ''), 'Response generation must not happen during modal open render/effect.');
check(styleText.includes('prefers-reduced-motion') && styleText.includes('guided-feedback'), 'Reduced-motion guided feedback is missing.');
check(GUIDED_STATES.includes('answer_reveal_allowed') && GUIDED_STATES.includes('completed'), 'Response state machine is incomplete.');

const base = {
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_nama', title: 'Kata Nama' },
  question: { id: 'qa-1', q: 'Nyatakan nama murid dalam ayat.', instruction: 'Nyatakan nama murid.', options: ['Aina', 'pensel'], answer: 'Aina' },
  expectedAnswer: 'Aina',
  currentLearningObjective: 'Mengenal kata nama khas.'
};
const scenarios = [
  { name: 'wrong_first', input: { ...base, intent: 'wrong_answer_coaching', learnerAnswer: 'pensel', attemptCount: 1 }, expect: r => { check(r.tutorMode === 'coach', 'Wrong first answer should use coach mode.'); check(!r.text.includes('Jawapan betul: Aina'), 'Early support must not reveal the answer.'); check(r.nextAction, 'Wrong answer needs a next action.'); } },
  { name: 'guiding_question', input: { ...base, intent: 'hint', learnerAnswer: 'pensel', hintsUsed: 1 }, expect: r => { check(r.guidingQuestion, 'Guiding question is missing.'); check(r.quickReplies.length > 0, 'Guiding question should offer quick replies.'); } },
  { name: 'correct_first', input: { ...base, intent: 'correct_answer_reinforcement', learnerAnswer: 'Aina', isCorrect: true, attemptCount: 1 }, expect: r => { check(r.praise.includes('Tepat'), 'First-attempt praise should reflect the outcome.'); check(r.tutorMode === 'examiner', 'Correct answer should use examiner mode.'); } },
  { name: 'math_operation', input: { ...base, subject: { id: 'math', title: 'Matematik' }, topic: { id: 'tambah', title: 'Tambah' }, question: { q: 'Berapakah jumlah 3 dan 2?', instruction: 'Kira jumlah.', options: ['5', '1'], answer: '5' }, expectedAnswer: '5', learnerAnswer: '1', intent: 'wrong_answer_coaching' }, expect: r => check(/operasi|langkah|soalan/i.test(r.text), 'Math response should be contextual.') },
  { name: 'arabic', input: { ...base, subject: { id: 'arab', title: 'Bahasa Arab' }, topic: { id: 'mufradat', title: 'Mufradat' }, question: { q: 'مَدْرَسَةٌ', instruction: 'Pilih maksud.', options: ['Sekolah', 'Rumah'], answer: 'Sekolah' }, expectedAnswer: 'Sekolah', learnerAnswer: 'Rumah', intent: 'hint' }, expect: r => { check(/مَد|Arab|huruf/i.test(r.text), 'Arabic response should preserve contextual content.'); } }
];

for (const scenario of scenarios) {
  const response = await getTutorResponse(scenario.input);
  check(typeof response.text === 'string' && response.text.length > 0, `${scenario.name} returned empty text.`);
  check(!/undefined|null|\[object Object\]|subjectId|topicId|questionId/i.test(response.text), `${scenario.name} leaked internal values.`);
  check(response.nextAction, `${scenario.name} has no next action.`);
  scenario.expect(response);
}

const uncertain = classifyMisconception({ subjectId: 'bm', instruction: 'Pilih jawapan.', expectedAnswer: 'A', learnerAnswer: 'B' });
check(uncertain.confidence < 0.6, 'Uncertain misconception confidence should remain modest.');
check(resolveTutorMode({ intent: 'weak_topic' }) === 'motivator', 'Weak-topic flow should use motivator mode.');
check(buildGuidedLearning({ subjectId: 'bm', expectedAnswer: 'A', learnerAnswer: 'B', attemptCount: 3 }).revealAnswer, 'Answer reveal threshold is missing.');

console.log(JSON.stringify({ status: issues.length ? 'FAIL' : 'PASS', scenarios: scenarios.map(item => item.name), issues }, null, 2));
if (issues.length) process.exitCode = 1;
