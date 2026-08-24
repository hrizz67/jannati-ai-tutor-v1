import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';

const math = explainAnswer({ question: { subjectId: 'math', q: 'Berapakah nombor selepas 113?', answer: '114' }, topic: { subjectId: 'math', id: 'nombor' }, result: { status: 'correct' } });
const bm = explainAnswer({ question: { subjectId: 'bm', q: 'Lengkapkan ayat ini: ____ sedang menyiapkan kerja kelas di meja belajar.', answer: 'Saya' }, topic: { subjectId: 'bm', id: 'kata_ganti_nama' }, result: { status: 'correct' } });
const near = (a, b) => { const x = String(a).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); const y = String(b).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); return x === y || (x.length > 20 && y.includes(x)); };
const mathQuestion = 'Berapakah nombor selepas 113?';
const bmQuestion = 'Lengkapkan ayat ini: ____ sedang menyiapkan kerja kelas di meja belajar.';
assert.match(math.simpleExplanation, /menambah 1/i);
assert.equal(near(math.simpleExplanation, mathQuestion), false);
assert.match(math.sections.whyCorrect, /113 \+ 1 = 114|114 datang selepas 113/i);
assert.match(math.sections.example, /25.*26/);
assert.match(bm.simpleExplanation, /Saya.*(?:diri sendiri|dirinya sendiri)/i);
assert.equal(near(bm.simpleExplanation, bmQuestion), false);
assert.match(bm.sections.whyCorrect, /bercakap|sendiri/i);
assert.doesNotMatch(JSON.stringify({ math, bm }).toLowerCase(), /jawapan yang tepat|petunjuk kata kunci|contoh yang sepadan|maksud ayat/);
assert.equal(new Set([math.sections.focus, math.sections.simpleExplanation, math.sections.whyCorrect, math.sections.hint, math.sections.example]).size, 5);
console.log('v31AiExplanationUsefulnessAudit: PASS');
