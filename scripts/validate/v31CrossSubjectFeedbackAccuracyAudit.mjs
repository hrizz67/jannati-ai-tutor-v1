import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';
const fixtures = [
  { subjectId: 'math', topic: { id: 'tambah', title: 'Tambah' }, question: { subjectId: 'math', q: 'Danish ada 25 pensel. Tambah 10.', answer: '35' } },
  { subjectId: 'bm', topic: { id: 'simpulan_bahasa', title: 'Simpulan Bahasa' }, question: { subjectId: 'bm', q: 'Apakah maksud "ringan tulang"?', answer: 'rajin membantu' } },
  { subjectId: 'bm', topic: { id: 'kata_kerja', title: 'Kata Kerja' }, question: { subjectId: 'bm', q: 'Pilih kata kerja.', answer: 'berlari' } }
];
for (const fixture of fixtures) { const r = explainAnswer({ ...fixture, questionText: fixture.question.q, result: { status: 'wrong' } }); assert.ok(r.simpleExplanation && r.whyCorrect); assert.notEqual(r.simpleExplanation, r.whyCorrect); }
const simpulan = explainAnswer({ ...fixtures[1], questionText: fixtures[1].question.q, result: { status: 'wrong' } });
assert.match(simpulan.simpleExplanation, /rajin bekerja|suka membantu/); assert.match(simpulan.sections.example, /membantu ibu mengemas rumah/);
console.log('PASS v31CrossSubjectFeedbackAccuracyAudit');
