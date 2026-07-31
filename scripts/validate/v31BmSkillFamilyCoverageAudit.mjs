import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';

const families = [
  ['Kata Nama Am', 'common_noun'], ['Kata Nama Khas', 'proper_noun'], ['Kata Ganti Nama', 'pronoun'],
  ['Kata Kerja', 'kata_kerja'], ['Kata Adjektif', 'kata_adjektif'], ['Penjodoh Bilangan', 'penjodoh_bilangan'],
  ['Imbuhan Asas', 'imbuhan_asas'], ['Ayat Tunggal', 'ayat_tunggal'], ['Ayat Majmuk', 'ayat_majmuk'],
  ['Bina Ayat', 'bina_ayat'], ['Ejaan', 'ejaan'], ['Tanda Baca', 'tanda_baca'], ['Kefahaman', 'kefahaman']
];
for (const [title, id] of families) {
  const result = explainAnswer({ question: { subjectId: 'bm', q: 'Pilih jawapan yang sesuai.', answer: 'Ali' }, topic: { subjectId: 'bm', id, title }, questionText: 'Pilih jawapan yang sesuai.', result: { status: 'correct' } });
  assert.ok(result.focus && !/Fahami kemahiran dalam soalan semasa/i.test(result.focus), `${title}: generic focus`);
  assert.ok(result.simpleExplanation && result.whyCorrect && result.simpleExplanation !== result.whyCorrect, `${title}: repeated explanation`);
  assert.ok(result.sections.example && !/jawapan yang tepat|soalan ini/i.test(result.sections.example), `${title}: placeholder example`);
  assert.ok(result.sections.commonMistake && result.memoryTip, `${title}: missing fallback guidance`);
}
console.log('PASS v31BmSkillFamilyCoverageAudit: 13 BM skill families have distinct, contextual fallback sections.');
