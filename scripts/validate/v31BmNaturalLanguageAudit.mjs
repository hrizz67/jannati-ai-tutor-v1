import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';

const question = { subjectId: 'bm', q: 'Lengkapkan ayat ini: ____ sedang menyiapkan kerja kelas di meja belajar.', answer: 'Saya' };
const topic = { subjectId: 'bm', id: 'kata_ganti_nama', title: 'Kata Ganti Nama' };
const data = explainAnswer({ question, topic, result: { status: 'correct' } });
const text = JSON.stringify(data).toLowerCase();
assert.equal(data.simpleExplanation, '“Saya” dipilih berdasarkan orang yang bercakap atau dirujuk.');
assert.match(data.sections.whyCorrect, /“Saya” digunakan.*penutur.*diri sendiri/i);
assert.match(data.hint, /kata ganti nama.*Saya/i);
assert.match(data.sections.commonMistake, /kata ganti nama.*sepadan.*situasi/i);
assert.match(data.sections.memoryTip, /Saya.*penutur.*diri sendiri/i);
assert.ok(data.simpleExplanation.length < 90);
assert.ok(data.sections.whyCorrect.length < 90);
assert.doesNotMatch(text, /jawapan yang tepat|contoh yang sepadan|maksud ayat|penutur(?!.*diri sendiri)|merupakan/);
assert.doesNotMatch(text, /113|114|tambah 1|tolak 1/);
assert.equal((text.match(/menyiapkan kerja kelas/g) || []).length, 0);
console.log('v31BmNaturalLanguageAudit: PASS');
