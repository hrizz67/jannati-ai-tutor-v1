import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';

const question = { subjectId: 'bm', q: 'Lengkapkan ayat ini: ____ sedang menyiapkan kerja kelas di meja belajar.', answer: 'Saya' };
const topic = { subjectId: 'bm', id: 'kata_ganti_nama', title: 'Kata Ganti Nama' };
const data = explainAnswer({ question, topic, result: { status: 'correct' } });
const text = JSON.stringify(data).toLowerCase();
assert.equal(data.simpleExplanation, 'Gunakan “Saya” apabila kamu bercakap tentang diri sendiri.');
assert.equal(data.sections.whyCorrect, 'Orang dalam ayat itu bercakap tentang dirinya sendiri.');
assert.match(data.hint, /fikirkan perkataan.*diri sendiri/i);
assert.match(data.sections.commonMistake, /dia.*orang lain/i);
assert.match(data.sections.memoryTip, /Saya.*diri sendiri.*Dia.*orang lain/i);
assert.ok(data.simpleExplanation.length < 90);
assert.ok(data.sections.whyCorrect.length < 90);
assert.doesNotMatch(text, /jawapan yang tepat|contoh yang sepadan|maksud ayat|penutur|merupakan/);
assert.doesNotMatch(text, /113|114|tambah 1|tolak 1/);
assert.equal((text.match(/menyiapkan kerja kelas/g) || []).length, 0);
console.log('v31BmNaturalLanguageAudit: PASS');
