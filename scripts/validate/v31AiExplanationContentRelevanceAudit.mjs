import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';

function sectionText(data) {
  return JSON.stringify(data.sections || data).toLowerCase();
}

const math = explainAnswer({
  question: { subjectId: 'math', id: 'MATH-NOMBOR-001', q: 'Berapakah nombor selepas 113?', answer: '114' },
  topic: { subjectId: 'math', id: 'nombor', title: 'Nombor Hingga 1000' },
  result: { status: 'wrong' }
});
const bm = explainAnswer({
  question: { subjectId: 'bm', id: 'BM-KGN-FIXTURE', q: 'Lengkapkan ayat ini: ____ sedang menyiapkan kerja kelas di meja belajar.', answer: 'Saya' },
  topic: { subjectId: 'bm', id: 'kata_ganti_nama', title: 'Kata Ganti Nama' },
  result: { status: 'correct' }
});

assert.match(sectionText(math), /113|114|nombor|tambah/);
assert.doesNotMatch(sectionText(math), /padang|sekolah|hospital|kedai|pasar|nama tempat/);
assert.match(sectionText(bm), /kata ganti nama|saya|bercakap/);
assert.doesNotMatch(sectionText(bm), /113|114|tambah 1|tolak 1/);
assert.doesNotMatch(JSON.stringify({ math, bm }).toLowerCase(), /jawapan yang tepat|petunjuk kata kunci|contoh yang sepadan|maksud ayat/);
assert.match((await import('node:fs')).readFileSync('src/ai/coach/knowledge/knowledgeAdapter.js', 'utf8'), /questionIdentity/);
console.log('v31AiExplanationContentRelevanceAudit: PASS');
