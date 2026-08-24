import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';

const data = explainAnswer({
  question: { subjectId: 'bm', q: 'buku ialah kata nama am bagi benda.', answer: 'buku' },
  topic: { subjectId: 'bm', id: 'kata_nama_am', title: 'Kata Nama Am' },
  result: { status: 'correct' }
});
const text = JSON.stringify(data).toLowerCase();
assert.match(data.sections.focus, /mengenal pasti kata nama am/i);
assert.match(data.simpleExplanation, /nama umum.*orang.*haiwan.*benda.*tempat/i);
assert.match(data.sections.whyCorrect, /buku.*nama umum.*benda.*bukan nama khas/i);
assert.notEqual(data.simpleExplanation, data.sections.whyCorrect);
assert.doesNotMatch(text, /buku ialah kata nama am bagi benda/);
assert.match(data.sections.example, /sekolah.*kata nama am.*tempat/i);
assert.match(data.sections.commonMistake, /kata nama khas|Sekolah Kebangsaan/i);
assert.match(data.sections.coachMessage, /bagus.*kata nama am/i);
assert.doesNotMatch(data.sections.focus, /Fahami kemahiran dalam soalan semasa/i);
console.log('v31BmKataNamaAmExplanationAudit: PASS');
