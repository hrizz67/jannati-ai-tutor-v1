import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import {
  buildInteractiveSuitabilityReport,
  classifyInteractiveSuitability,
  compactInteractiveSuitabilityReport,
  INTERACTIVE_SUITABILITY_CATEGORIES
} from '../../src/ai/question/interactiveSuitability.js';
import { getInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const subjects = await loadAllSubjects();
const report = buildInteractiveSuitabilityReport(subjects);
const questionMap = new Map(subjects.flatMap(subject => subject.topics.flatMap(topic => (
  topic.questions.map(question => [question.id, question])
))));

assert.equal(report.summary.total, 4530, 'Audit kesesuaian tidak boleh menambah atau membuang soalan bank.');
assert.equal(report.summary.subjects, 8, 'Semua lapan subjek mesti diaudit.');
assert.equal(report.summary.topics, 84, 'Semua 84 topik mesti diaudit.');
assert.equal(report.questionClassifications.length, report.summary.total, 'Setiap soalan mesti mempunyai satu klasifikasi.');
assert.equal(report.summary.allQuestionsClassified, true, 'Setiap klasifikasi mesti menggunakan kategori yang diluluskan.');
assert.equal(report.summary.unsafeAutomaticConversions, 0, 'Tiada penukaran automatik berkeyakinan rendah dibenarkan.');
assert.deepEqual(
  Object.keys(report.summary.categories).sort(),
  [...INTERACTIVE_SUITABILITY_CATEGORIES].sort(),
  'Laporan mesti mengekalkan keempat-empat laluan keputusan.'
);
assert.equal(report.summary.categories.reviewed_interactive, 250, 'Semua interaksi yang ditulis dan disemak mesti kekal dilindungi.');
assert.equal(report.summary.categories.auto_safe, 992, 'Semua soalan objektif yang masih belum ditulis khas mesti menerima kad pilihan automatik yang selamat.');
assert.equal(report.summary.categories.teacher_review, 2680, 'Calon yang belum disemak guru mesti kekal dalam barisan semakan.');
assert.equal(report.summary.categories.keep_standard, 608, 'Respons berstruktur dan terbuka mesti kekal pada laluan standard.');

const interactiveContentBatch2Types = new Map([
  ['MATH-NOMBOR-PILOT-004', 'visualMath'],
  ['MATH-NOMBOR-PILOT-009', 'fillBlank'],
  ['MATH-NOMBOR-PILOT-010', 'fillBlank'],
  ['MATH-NOMBOR-PILOT-017', 'fillBlank'],
  ['MATH-NOMBOR-PILOT-018', 'fillBlank'],
  ['MATH-NOMBOR-PILOT-029', 'fillBlank'],
  ['MATH-PANJANG-PILOT-006', 'measurement'],
  ['MATH-MASA-PILOT-001', 'choice'],
  ['MATH-WANG-PILOT-003', 'fillBlank'],
  ['SAINS-MANUSIA-004', 'imageChoice'],
  ['SAINS-MANUSIA-005', 'imageChoice'],
  ['SAINS-HAIWAN-015', 'imageChoice'],
  ['SAINS-HAIWAN-016', 'imageChoice'],
  ['SAINS-TUMBUHAN-005', 'imageChoice'],
  ['SAINS-TUMBUHAN-021', 'fillBlank']
]);
const languageFillBlankBatch3Ids = new Set([
  'BM-KATA_SENDI-002', 'BM-KATA_HUBUNG-003', 'BM-TATABAHASA-018', 'BM-SIMPULAN_BAHASA-021',
  'ENG-NOUNS-004', 'ENG-COLOURS-001', 'ENG-ANIMALS-003', 'ENG-FOOD-003',
  'ARAB-NOMBOR_ARAB-001', 'ARAB-HAIWAN_ARAB-001', 'ARAB-AYAT_MUDAH_ARAB-001', 'ARAB-HIWAR-004',
  'ISLAM-IBADAH-001', 'ISLAM-SIRAH-001', 'ISLAM-QURAN-003', 'ISLAM-ADAB-001'
]);
const scienceFillBlankPilotIds = new Set([
  'SAINS-HAIWAN-001',
  'SAINS-TUMBUHAN-043',
  'SAINS-MANUSIA-031',
  'SAINS-AIR-005',
  'SAINS-CAHAYA-028',
  'SAINS-BUNYI-041',
  'SAINS-BUMI-008',
  'SAINS-BAHAN-025',
  'SAINS-TEKNOLOGI-031',
  'SAINS-KEMAHIRAN_SAINTIFIK-025'
]);
const scienceFillBlankBatch2Ids = new Set([
  'SAINS-HAIWAN-004', 'SAINS-HAIWAN-034',
  'SAINS-TUMBUHAN-007', 'SAINS-TUMBUHAN-047',
  'SAINS-MANUSIA-039', 'SAINS-MANUSIA-045',
  'SAINS-AIR-007', 'SAINS-AIR-048',
  'SAINS-CAHAYA-020', 'SAINS-CAHAYA-039',
  'SAINS-BUNYI-040', 'SAINS-BUNYI-044',
  'SAINS-BUMI-028', 'SAINS-BUMI-046',
  'SAINS-BAHAN-021', 'SAINS-BAHAN-024',
  'SAINS-TEKNOLOGI-042', 'SAINS-TEKNOLOGI-047',
  'SAINS-KEMAHIRAN_SAINTIFIK-034', 'SAINS-KEMAHIRAN_SAINTIFIK-044'
]);
const scienceFillBlankBatch3Ids = new Set([
  'SAINS-AIR-025', 'SAINS-AIR-031',
  'SAINS-CAHAYA-031', 'SAINS-CAHAYA-044',
  'SAINS-BUMI-029', 'SAINS-BUMI-050'
]);
const scienceChoiceMiniPilotIds = new Set([
  'SAINS-TUMBUHAN-050',
  'SAINS-MANUSIA-050',
  'SAINS-BUNYI-035',
  'SAINS-TEKNOLOGI-021',
  'SAINS-TEKNOLOGI-023',
  'SAINS-TEKNOLOGI-026'
]);
const scienceChoiceBatch2Ids = new Set([
  'SAINS-HAIWAN-042',
  'SAINS-AIR-050',
  'SAINS-CAHAYA-041',
  'SAINS-BUMI-020',
  'SAINS-BAHAN-031',
  'SAINS-KEMAHIRAN_SAINTIFIK-024'
]);
const scienceHotspotPilotIds = new Set(['SAINS-BAHAN-026', 'SAINS-MANUSIA-047']);
const rejectedScienceChoiceIds = new Set(['SAINS-CAHAYA-050', 'SAINS-TEKNOLOGI-028']);
const rejectedScienceFillBlankBatch2Ids = new Set([
  'SAINS-HAIWAN-041', 'SAINS-TUMBUHAN-045', 'SAINS-MANUSIA-042', 'SAINS-AIR-043',
  'SAINS-CAHAYA-050', 'SAINS-BUNYI-042', 'SAINS-BUMI-015', 'SAINS-BAHAN-032',
  'SAINS-TEKNOLOGI-028', 'SAINS-KEMAHIRAN_SAINTIFIK-046'
]);
const equalGroupsPilotIds = new Set([
  'MATH-DARAB-PILOT-002',
  'MATH-DARAB-PILOT-004',
  'MATH-DARAB-PILOT-006',
  'MATH-DARAB-PILOT-008',
  'MATH-BAHAGI-PILOT-004',
  'MATH-BAHAGI-PILOT-007',
  'MATH-BAHAGI-PILOT-009',
  'MATH-BAHAGI-PILOT-047'
]);
const arrayPilotIds = new Set([
  'MATH-DARAB-PILOT-003',
  'MATH-DARAB-PILOT-005'
]);
const numberLinePilotIds = new Set([
  'MATH-DARAB-PILOT-009',
  'MATH-DARAB-PILOT-020',
  'MATH-DARAB-PILOT-025',
  'MATH-DARAB-PILOT-032',
  'MATH-DARAB-PILOT-033',
  'MATH-BAHAGI-PILOT-008',
  'MATH-BAHAGI-PILOT-025'
]);
for (const [id, type] of interactiveContentBatch2Types) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah kepada laluan interaktif disemak.`);
  assert.equal(row?.recommendedType, type, `${id} mesti mengekalkan jenis interaksi Batch 2 yang diluluskan.`);
  assert.equal(question?.interaction?.type, type, `${id} mesti mempunyai konfigurasi authored yang sepadan.`);
}

assert.equal(languageFillBlankBatch3Ids.size, 16, 'Language FillBlank Batch 3 mesti mengandungi tepat enam belas ID yang diluluskan.');
for (const id of languageFillBlankBatch3Ids) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'fillBlank', `${id} mesti kekal pada interaksi fillBlank sedia ada.`);
  assert.equal(question?.interaction?.type, 'fillBlank', `${id} mesti mempunyai overlay fillBlank yang disemak.`);
}

assert.equal(scienceFillBlankPilotIds.size, 10, 'Science FillBlank Pilot mesti mengandungi tepat sepuluh ID yang diluluskan.');
for (const id of scienceFillBlankPilotIds) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'fillBlank', `${id} mesti kekal pada interaksi fillBlank sedia ada.`);
  assert.equal(question?.interaction?.type, 'fillBlank', `${id} mesti mempunyai overlay fillBlank yang disemak.`);
}
assert.equal(scienceFillBlankBatch2Ids.size, 20, 'Science FillBlank Batch 2 mesti mengandungi tepat dua puluh ID yang diluluskan.');
assert.equal(
  new Set([...languageFillBlankBatch3Ids, ...scienceFillBlankPilotIds, ...scienceChoiceMiniPilotIds, ...scienceChoiceBatch2Ids, ...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds, ...scienceFillBlankBatch2Ids]).size,
  languageFillBlankBatch3Ids.size + scienceFillBlankPilotIds.size + scienceChoiceMiniPilotIds.size + scienceChoiceBatch2Ids.size + equalGroupsPilotIds.size + arrayPilotIds.size + numberLinePilotIds.size + scienceFillBlankBatch2Ids.size,
  'Science FillBlank Batch 2 tidak boleh bertindih dengan kandungan dan pilot terdahulu yang dilindungi.'
);
for (const id of scienceFillBlankBatch2Ids) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'fillBlank', `${id} mesti menggunakan interaksi fillBlank sedia ada.`);
  assert.equal(question?.interaction?.type, 'fillBlank', `${id} mesti mempunyai overlay fillBlank yang disemak.`);
}
assert.equal(scienceFillBlankBatch3Ids.size, 6, 'Science FillBlank Batch 3 mesti mengandungi tepat enam ID yang diluluskan.');
const scienceFillBlankBatch3PriorIds = [...languageFillBlankBatch3Ids, ...scienceFillBlankPilotIds, ...scienceFillBlankBatch2Ids, ...scienceChoiceMiniPilotIds, ...scienceChoiceBatch2Ids, ...scienceHotspotPilotIds, ...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds];
assert.equal(new Set([...scienceFillBlankBatch3PriorIds, ...scienceFillBlankBatch3Ids]).size, scienceFillBlankBatch3PriorIds.length + scienceFillBlankBatch3Ids.size, 'Science FillBlank Batch 3 tidak boleh bertindih dengan kandungan terdahulu yang dilindungi.');
for (const id of scienceFillBlankBatch3Ids) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'fillBlank', `${id} mesti menggunakan interaksi FillBlank sedia ada.`);
  assert.equal(question?.interaction?.type, 'fillBlank', `${id} mesti mempunyai overlay yang disemak.`);
}
assert.equal(
  report.questionClassifications.filter(item => item.subjectId === 'sains' && item.category === 'reviewed_interactive').length,
  77,
  'Science mesti mempunyai tepat 77 interaksi disemak selepas Science FillBlank Batch 3.'
);
assert.equal(
  report.questionClassifications.filter(item => item.subjectId === 'sains' && item.category === 'teacher_review').length,
  413,
  'Science mesti mempunyai tepat 413 calon teacher_review selepas Science FillBlank Batch 3.'
);

assert.equal(scienceChoiceMiniPilotIds.size, 6, 'Science Choice Mini-Pilot mesti mengandungi tepat enam ID yang diluluskan.');
assert.deepEqual(
  [...scienceChoiceMiniPilotIds].reduce((counts, id) => {
    const row = report.questionClassifications.find(item => item.questionId === id);
    counts[row?.topicId] = (counts[row?.topicId] || 0) + 1;
    return counts;
  }, {}),
  { tumbuhan: 1, manusia: 1, bunyi: 1, teknologi: 3 },
  'Science Choice Mini-Pilot mesti mengekalkan imbangan topik yang diluluskan.'
);
assert.equal(new Set([...scienceFillBlankPilotIds, ...scienceChoiceMiniPilotIds]).size, scienceFillBlankPilotIds.size + scienceChoiceMiniPilotIds.size, 'Science Choice Mini-Pilot tidak boleh bertindih dengan Science FillBlank Pilot.');
for (const id of scienceChoiceMiniPilotIds) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'choice', `${id} mesti menggunakan interaksi choice sedia ada.`);
  assert.equal(question?.interaction?.type, 'choice', `${id} mesti mempunyai overlay Choice yang disemak.`);
  assert.equal(question?.interaction?.options?.length, 3, `${id} mesti mempunyai tepat tiga pilihan.`);
  assert.deepEqual(getInteractiveQuestionConfig(question), question.interaction, `${id} mesti menggunakan konfigurasi authored yang sah.`);
  assert.equal(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct').length, 1, `${id} mesti mempunyai tepat satu pilihan yang diterima.`);
}
assert.equal(scienceChoiceBatch2Ids.size, 6, 'Science Choice Batch 2 mesti mengandungi tepat enam ID yang diluluskan.');
assert.deepEqual(
  [...scienceChoiceBatch2Ids].reduce((counts, id) => {
    const row = report.questionClassifications.find(item => item.questionId === id);
    counts[row?.topicId] = (counts[row?.topicId] || 0) + 1;
    return counts;
  }, {}),
  { haiwan: 1, air: 1, cahaya: 1, bumi: 1, bahan: 1, kemahiran_saintifik: 1 },
  'Science Choice Batch 2 mesti mengekalkan enam pilihan topik yang diluluskan.'
);
assert.equal(
  new Set([...languageFillBlankBatch3Ids, ...scienceFillBlankPilotIds, ...scienceFillBlankBatch2Ids, ...scienceChoiceMiniPilotIds, ...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds, ...scienceChoiceBatch2Ids]).size,
  languageFillBlankBatch3Ids.size + scienceFillBlankPilotIds.size + scienceFillBlankBatch2Ids.size + scienceChoiceMiniPilotIds.size + equalGroupsPilotIds.size + arrayPilotIds.size + numberLinePilotIds.size + scienceChoiceBatch2Ids.size,
  'Science Choice Batch 2 tidak boleh bertindih dengan kandungan dan pilot terdahulu yang dilindungi.'
);
for (const id of scienceChoiceBatch2Ids) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'choice', `${id} mesti menggunakan interaksi choice sedia ada.`);
  assert.equal(question?.interaction?.type, 'choice', `${id} mesti mempunyai overlay Choice yang disemak.`);
  assert.equal(question?.interaction?.options?.length, 3, `${id} mesti mempunyai tepat tiga pilihan.`);
  assert.deepEqual(getInteractiveQuestionConfig(question), question.interaction, `${id} mesti menggunakan konfigurasi authored yang sah.`);
  assert.deepEqual(
    question.interaction.options.map(option => smartCheck(option.value, question).status === 'correct'),
    [true, false, false],
    `${id} mesti mengekalkan corak betul/salah/salah yang diluluskan.`
  );
}
assert.equal(scienceHotspotPilotIds.size, 2, 'Science Hotspot Pilot mesti mengandungi tepat dua ID yang diluluskan.');
assert.equal(
  new Set([...languageFillBlankBatch3Ids, ...scienceFillBlankPilotIds, ...scienceFillBlankBatch2Ids, ...scienceChoiceMiniPilotIds, ...scienceChoiceBatch2Ids, ...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds, ...scienceHotspotPilotIds]).size,
  languageFillBlankBatch3Ids.size + scienceFillBlankPilotIds.size + scienceFillBlankBatch2Ids.size + scienceChoiceMiniPilotIds.size + scienceChoiceBatch2Ids.size + equalGroupsPilotIds.size + arrayPilotIds.size + numberLinePilotIds.size + scienceHotspotPilotIds.size,
  'Science Hotspot Pilot tidak boleh bertindih dengan kandungan dan pilot terdahulu yang dilindungi.'
);
for (const id of scienceHotspotPilotIds) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'hotspot', `${id} mesti menggunakan interaksi Hotspot sedia ada.`);
  assert.equal(question?.interaction?.type, 'hotspot', `${id} mesti mempunyai overlay Hotspot yang disemak.`);
  assert.equal(question?.interaction?.hotspots?.length, 3, `${id} mesti mempunyai tepat tiga hotspot semantik.`);
  assert.deepEqual(getInteractiveQuestionConfig(question), question.interaction, `${id} mesti menggunakan konfigurasi authored yang sah.`);
  const correctHotspot = question.interaction.hotspots.find(hotspot => hotspot.id === question.interaction.correctHotspotId);
  assert.equal(smartCheck(correctHotspot?.value, question).status, 'correct', `${id} mesti menghantar jawapan kanonik melalui hotspot yang betul.`);
}
assert.equal(
  report.questionClassifications.filter(item => item.subjectId === 'sains' && item.category === 'reviewed_interactive' && item.recommendedType === 'choice').length,
  12,
  'Science mesti mempunyai tepat 12 interaksi Choice yang disemak selepas Batch 2.'
);
for (const id of rejectedScienceChoiceIds) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'teacher_review', `${id} mesti kekal dalam teacher_review.`);
  assert.equal(question?.interaction, undefined, `${id} tidak boleh menerima overlay authored.`);
}
assert.equal(rejectedScienceFillBlankBatch2Ids.size, 10, 'Tepat sepuluh finalis discovery mesti kekal ditolak daripada Science FillBlank Batch 2.');
for (const id of rejectedScienceFillBlankBatch2Ids) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'teacher_review', `${id} mesti kekal dalam teacher_review.`);
  assert.equal(question?.interaction, undefined, `${id} mesti kekal tanpa overlay authored.`);
}

assert.equal(equalGroupsPilotIds.size, 8, 'Pilot Equal Groups mesti mengandungi tepat lapan ID yang diluluskan.');
for (const id of equalGroupsPilotIds) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'visualMath', `${id} mesti kekal pada konstruk visualMath.`);
  assert.equal(question?.interaction?.type, 'visualMath', `${id} mesti mempunyai interaksi visualMath yang disemak.`);
  assert.equal(question?.interaction?.visual?.kind, 'equalGroups', `${id} mesti menggunakan visual equalGroups yang dibekukan.`);
}

assert.equal(arrayPilotIds.size, 2, 'Pilot Array mesti mengandungi tepat dua ID yang diluluskan.');
assert.equal(new Set([...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds]).size, equalGroupsPilotIds.size + arrayPilotIds.size + numberLinePilotIds.size, 'Pilot Equal Groups, Array dan Number Line tidak boleh bertindih.');
for (const id of arrayPilotIds) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'visualMath', `${id} mesti kekal pada konstruk visualMath.`);
  assert.equal(question?.interaction?.type, 'visualMath', `${id} mesti mempunyai interaksi visualMath yang disemak.`);
  assert.equal(question?.interaction?.visual?.kind, 'array', `${id} mesti menggunakan visual Array yang dibekukan.`);
}
assert.equal([...questionMap.values()].filter(question => question.interaction?.visual?.kind === 'array').length, 2, 'Tiada soalan ketiga boleh menerima overlay Array dalam pilot ini.');

assert.equal(numberLinePilotIds.size, 7, 'Pilot Number Line mesti mengandungi tepat tujuh ID yang diluluskan.');
for (const id of numberLinePilotIds) {
  const row = report.questionClassifications.find(item => item.questionId === id);
  const question = questionMap.get(id);
  assert.equal(row?.category, 'reviewed_interactive', `${id} mesti berpindah daripada teacher_review kepada reviewed_interactive.`);
  assert.equal(row?.recommendedType, 'visualMath', `${id} mesti kekal pada konstruk visualMath.`);
  assert.equal(question?.interaction?.type, 'visualMath', `${id} mesti mempunyai interaksi visualMath yang disemak.`);
  assert.equal(question?.interaction?.visual?.kind, 'numberLine', `${id} mesti menggunakan visual Number Line yang dibekukan.`);
}
assert.equal(report.questionClassifications.find(item => item.questionId === 'MATH-BAHAGI-PILOT-020')?.category, 'teacher_review', 'Konstruk bahagi dengan saiz lompatan tidak diketahui mesti kekal untuk semakan guru.');
assert.equal(questionMap.get('MATH-BAHAGI-PILOT-020')?.interaction, undefined, 'MATH-BAHAGI-PILOT-020 tidak boleh menerima overlay Number Line V1.');
for (const id of [
  'MATH-DARAB-PILOT-007', 'MATH-DARAB-PILOT-010', 'MATH-DARAB-PILOT-017',
  'MATH-DARAB-PILOT-021', 'MATH-DARAB-PILOT-022', 'MATH-DARAB-PILOT-023',
  'MATH-DARAB-PILOT-024', 'MATH-DARAB-PILOT-028', 'MATH-DARAB-PILOT-038',
  'MATH-DARAB-PILOT-039', 'MATH-DARAB-PILOT-040', 'MATH-DARAB-PILOT-060'
]) {
  assert.notEqual(questionMap.get(id)?.interaction?.visual?.kind, 'array', `${id} tidak boleh menerima overlay Array.`);
}

for (const row of report.questionClassifications.filter(item => item.category === 'auto_safe')) {
  const question = questionMap.get(row.questionId);
  const config = getInteractiveQuestionConfig(question);
  assert.equal(config?.type, 'choice', `${row.questionId} mesti menghasilkan konfigurasi pilihan yang sah.`);
  assert.equal(smartCheck(question.answer, question).status, 'correct', `${row.questionId} mesti mengekalkan jawapan kanonik asal.`);
  assert.equal(config.options.filter(option => smartCheck(option.value, question).status === 'correct').length, 1, `${row.questionId} mesti mempunyai tepat satu pilihan yang betul.`);
}

const reviewed = classifyInteractiveSuitability(questionMap.get('BM-KATA_NAMA_AM-001'), { subjectId: 'bm', topicId: 'kata_nama_am' });
assert.equal(reviewed.category, 'reviewed_interactive');
assert.equal(reviewed.recommendedType, 'imageChoice');

const safeChoice = classifyInteractiveSuitability(questionMap.get('PJ-PERGERAKAN_ASAS-001'), { subjectId: 'pj', topicId: 'pergerakan_asas' });
assert.equal(safeChoice.category, 'auto_safe');
assert.equal(safeChoice.recommendedType, 'choice');
assert.equal(questionMap.get('PJ-PERGERAKAN_ASAS-001').interaction, undefined, 'Penukaran paparan tidak boleh menulis semula data bank soalan.');

const reviewedBlank = classifyInteractiveSuitability(questionMap.get('ENG-NOUNS-002'), { subjectId: 'english', topicId: 'nouns' });
assert.equal(reviewedBlank.category, 'teacher_review');
assert.equal(reviewedBlank.recommendedType, 'fillBlank');

const q4Reviewed = classifyInteractiveSuitability(questionMap.get('ENG-NOUNS-001'), { subjectId: 'english', topicId: 'nouns' });
assert.equal(q4Reviewed.category, 'reviewed_interactive');
assert.equal(q4Reviewed.recommendedType, 'imageChoice');

const standardResponse = classifyInteractiveSuitability(questionMap.get('MATH-NOMBOR-PILOT-011'), { subjectId: 'math', topicId: 'nombor' });
assert.equal(standardResponse.category, 'keep_standard');
assert.equal(standardResponse.recommendedType, 'textEntry');

const malformedChoice = classifyInteractiveSuitability({
  id: 'TEST-UNSAFE-CHOICE',
  q: 'Pilih jawapan.',
  answer: 'A',
  accepted: ['A'],
  questionType: 'objective',
  options: ['A', 'A', 'B']
}, { subjectId: 'test', topicId: 'safety' });
assert.equal(malformedChoice.category, 'teacher_review', 'Pilihan pendua tidak boleh ditukar secara automatik.');

function markdown(compactReport) {
  const category = compactReport.summary.categories;
  const subjectRows = compactReport.subjectBreakdown.map(subject => (
    `| ${subject.subjectTitle} | ${subject.total} | ${subject.categories.reviewed_interactive || 0} | ${subject.categories.auto_safe || 0} | ${subject.categories.teacher_review || 0} | ${subject.categories.keep_standard || 0} |`
  )).join('\n');
  return `# Audit Kesesuaian Soalan Interaktif\n\n`+
    `Audit ini mengelaskan semua soalan tanpa mengubah kandungan, jawapan diterima atau formula penguasaan.\n\n`+
    `## Ringkasan\n\n`+
    `- Jumlah soalan: ${compactReport.summary.total}\n`+
    `- Interaktif disemak guru: ${category.reviewed_interactive || 0}\n`+
    `- Penukaran automatik selamat: ${category.auto_safe || 0}\n`+
    `- Memerlukan semakan guru: ${category.teacher_review || 0}\n`+
    `- Kekal format standard: ${category.keep_standard || 0}\n`+
    `- Penukaran automatik tidak selamat: ${compactReport.summary.unsafeAutomaticConversions}\n\n`+
    `## Pecahan subjek\n\n`+
    `| Subjek | Soalan | Disemak | Auto selamat | Semakan guru | Kekal standard |\n`+
    `|---|---:|---:|---:|---:|---:|\n${subjectRows}\n\n`+
    `## Dasar penerbitan\n\n`+
    `- Pilihan jawapan sedia ada hanya dijadikan kad boleh tekan apabila unik dan tepat satu pilihan sepadan dengan jawapan diterima.\n`+
    `- Distraktor, visual, audio, hotspot, susunan dan padanan baharu mesti melalui semakan guru.\n`+
    `- Respons berstruktur, KBAT dan rubrik kekal sebagai input standard.\n`+
    `- Simulasi peperiksaan mengekalkan format standard kecuali interaksi itu sebahagian daripada konstruk yang diuji.\n`;
}

if (process.argv.includes('--write')) {
  const outputDirectory = path.resolve('reports/validation');
  const compactReport = compactInteractiveSuitabilityReport(report);
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'interactive-suitability-report.json'), `${JSON.stringify(compactReport, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDirectory, 'interactive-suitability-report.md'), markdown(compactReport), 'utf8');
}

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Interactive Question Suitability V1',
  ...report.summary,
  runtimeInteractiveTotal: report.summary.categories.reviewed_interactive + report.summary.categories.auto_safe,
  originalAnswersChanged: false
}, null, 2));
