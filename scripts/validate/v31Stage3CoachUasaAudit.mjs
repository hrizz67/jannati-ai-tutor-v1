import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import { teachAnswer } from '../../src/ai/teacherEngine.js';
import { smartCheck } from '../../src/utils/smartCheck.js';
import { dedupeContent, dedupeSections } from '../../src/utils/dedupeText.js';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.jsx');
const css = read('src/styles/style.css');
const explainModal = read('src/components/ai/AIExplainModal.jsx');
const teacherModal = read('src/components/ai/AITeacherModal.jsx');

const mathQuestion = { q: 'Berapakah nombor sebelum 329?', answer: '328', explanation: '329 - 1 = 328.', subjectId: 'math', topicId: 'nombor_hingga_1000' };
const mathTopic = { title: 'Nombor Hingga 1000', subjectId: 'math', id: 'nombor_hingga_1000' };
const forbidden = ['padang', 'sekolah', 'hospital'];
const flatten = value => JSON.stringify(value).toLowerCase();
const explain = explainAnswer({ question: mathQuestion, topic: mathTopic, questionText: mathQuestion.q, result: { status: 'wrong' } });
const teach = teachAnswer({ question: mathQuestion, topic: mathTopic, questionText: mathQuestion.q, explanationData: explain });
assert.equal(explain.correctAnswer, '', 'Explain must not reveal answer on an unqualified wrong attempt');
for (const payload of [explain, teach]) for (const word of forbidden) assert.ok(!flatten(payload).includes(word), `Math coach leaked unrelated word: ${word}`);
assert.ok(flatten(explain).includes('329') && flatten(explain).includes('328'), 'Math Explain lacks source calculation');
assert.ok(flatten(teach).includes('329') && flatten(teach).includes('328'), 'Math Teach lacks source calculation');

const [a, b, near] = dedupeSections([['Ali membaca buku.'], ['ali membaca buku!'], ['Ali membaca buku cerita.']]);
assert.deepEqual(a, ['Ali membaca buku.']);
assert.deepEqual(b, [], 'punctuation/case duplicate should be removed across sections');
assert.deepEqual(near, ['Ali membaca buku cerita.'], 'semantically different near-duplicate must remain');
assert.deepEqual(dedupeContent(['  ', null, undefined]), [], 'empty sections should be omitted');

const uasa = { q: 'Kenal pasti jenis ayat bagi ayat ini: Siapakah nama kamu?', answer: 'ayat tanya', acceptedAnswers: ['ayat tanya'] };
for (const variant of ['ayat tanya', 'Ayat Tanya', 'AYAT TANYA', ' ayat tanya ', 'ayat tanya.']) assert.equal(smartCheck(variant, uasa).status, 'correct');
assert.equal(smartCheck('ayat seruan', uasa).status, 'wrong');
assert.ok(app.includes('if (result) return;'), 'UASA duplicate check guard missing');
assert.ok(app.includes('disabled={!result}'), 'UASA next must be disabled before check');
assert.ok(app.includes('setResult(null);'), 'UASA next must clear local result');
assert.ok(app.includes('aria-live="polite"'), 'UASA feedback live region missing');
assert.ok(explainModal.includes('dedupeSections') && teacherModal.includes('dedupeSections'), 'Explain/Teach dedupe integration missing');
assert.ok(css.includes('100dvh') && css.includes('overflow-y: auto') && css.includes('safe-area-inset-bottom'), 'modal mobile clearance rules missing');
assert.ok(app.includes("const feedbackSuppressed = modalOpen || ['quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'finish', 'parent'].includes(currentScreen);"), 'FAB suppression missing');
assert.ok(explainModal.includes('<details className="explain-details">') && teacherModal.includes('<details className="explain-details">'), 'advanced content is not collapsed by default');
const changed = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
assert.equal(changed.some(file => /communicationContent|communicationModules/.test(file)), false, 'protected Stage 3 communication scope was modified');
console.log(JSON.stringify({ status: 'PASS', mathExplainNoLeakage: true, mathTeachNoLeakage: true, dedupeFixtures: true, uasaAcceptedVariants: true, uasaWrongAnswerFails: true, uasaDuplicateGuard: true, modalStructure: true, protectedCommunicationLogic: true }, null, 2));
