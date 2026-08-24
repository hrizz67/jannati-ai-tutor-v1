import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import { teachAnswer } from '../../src/ai/teacherEngine.js';

const mathQuestion = { subjectId: 'math', id: 'MATH-NOMBOR-001', q: 'Berapakah nombor selepas 113?', answer: '114' };
const bmQuestion = { subjectId: 'bm', id: 'BM-KGN-FIXTURE', q: 'Lengkapkan ayat ini: ____ sedang menyiapkan kerja kelas di meja belajar.', answer: 'Saya' };
const mathTopic = { subjectId: 'math', id: 'nombor', title: 'Nombor Hingga 1000' };
const bmTopic = { subjectId: 'bm', id: 'kata_ganti_nama', title: 'Kata Ganti Nama' };

const math = explainAnswer({ question: mathQuestion, topic: mathTopic, result: { status: 'wrong' } });
const bm = explainAnswer({ question: bmQuestion, topic: bmTopic, result: { status: 'correct' } });
const mathText = JSON.stringify(math).toLowerCase();
const bmText = JSON.stringify(bm).toLowerCase();

assert.match(mathText, /113|114|tambah 1|\+ 1/);
assert.doesNotMatch(mathText, /padang|sekolah|hospital|kedai|pasar/);
assert.match(bmText, /kata ganti nama|saya/);
assert.doesNotMatch(bmText, /113|114|tambah 1|tolak 1/);
assert.doesNotMatch(bmText, /jawapan yang tepat|petunjuk kata kunci|contoh yang sepadan|maksud ayat/);
assert.equal(math.correctAnswer, '');
assert.equal(bm.correctAnswer, 'Saya');

const taught = teachAnswer({ question: bmQuestion, topic: bmTopic, explanationData: bm });
assert.match(JSON.stringify(taught).toLowerCase(), /kata ganti nama|saya/);
console.log('v31AiSubjectIsolationAudit: PASS');
