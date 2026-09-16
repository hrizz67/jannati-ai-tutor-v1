import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { supportsInteractiveQuestion } from '../../src/utils/acceptedAnswers.js';
import { smartCheck } from '../../src/utils/smartCheck.js';
import {
  getInteractiveQuestionConfig,
  INTERACTIVE_QUESTION_TYPES,
  prioritizeInteractiveQuestions,
  serializeDragDropResponse,
  serializeMatchingResponse,
  serializeMoneyResponse,
  serializeMultiSelectResponse,
  serializeOrderingResponse,
  validateInteractiveQuestionConfig
} from '../../src/utils/interactiveQuestion.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '../..');
const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions));
const authoredInteractiveQuestions = questions.filter(question => question.interaction);
const renderableInteractiveQuestions = questions.filter(question => getInteractiveQuestionConfig(question));
const derivedChoiceQuestions = questions.filter(question => !question.interaction && getInteractiveQuestionConfig(question)?.type === 'choice');
const byId = new Map(authoredInteractiveQuestions.map(question => [question.id, question]));
const expectedTypes = new Map([
  ['BM-KATA_NAMA_AM-001', 'imageChoice'],
  ['MATH-BENTUK-PILOT-001', 'imageChoice'],
  ['MATH-BENTUK-PILOT-021', 'dragDrop'],
  ['MATH-BENTUK-PILOT-035', 'matching'],
  ['BM-BINA_AYAT-021', 'ordering'],
  ['MATH-NOMBOR-PILOT-024', 'visualMath'],
  ['BM-KATA_SENDI-001', 'fillBlank'],
  ['MATH-NOMBOR-PILOT-049', 'multiSelect'],
  ['SAINS-TUMBUHAN-009', 'hotspot'],
  ['MATH-MASA-PILOT-008', 'clock'],
  ['MATH-WANG-PILOT-008', 'money'],
  ['MATH-PANJANG-PILOT-018', 'measurement']
]);

assert.deepEqual(
  questions.filter(supportsInteractiveQuestion).map(question => question.id),
  renderableInteractiveQuestions.map(question => question.id),
  'The lightweight quiz gate and canonical interactive engine must support the same question bank entries.'
);
const reviewedFillBlankBatchIds = new Set([
  ...Array.from({ length: 10 }, (_, index) => `ENG-VERBS-${String(index + 1).padStart(3, '0')}`),
  ...Array.from({ length: 10 }, (_, index) => `ARAB-MUFRADAT-${String(index + 1).padStart(3, '0')}`),
  ...[1, 2, 3, 4, 6, 7, 8, 10, 11, 12].map(index => `ISLAM-AQIDAH-${String(index).padStart(3, '0')}`)
]);
const reviewedChoiceBatchIds = new Set([
  'PJ-LOKOMOTOR-039',
  ...[2, 7, 12, 17, 22, 27, 32, 37, 42, 47].map(index => `PJ-MANIPULASI_ALATAN-${String(index).padStart(3, '0')}`),
  'PJ-PERMAINAN_MUDAH-049',
  ...[2, 7, 12, 17, 22, 24, 27, 32, 37, 42, 47].map(index => `PK-GAYA_HIDUP_SIHAT-${String(index).padStart(3, '0')}`),
  'PK-KESELAMATAN_DIRI-031',
  ...[2, 7, 12, 17, 22, 27].map(index => `PK-KESIHATAN_MENTAL_EMOSI-${String(index).padStart(3, '0')}`)
]);
const reviewedChoiceBatch3Ids = new Set([
  'BM-KATA_NAMA_KHAS-003',
  'BM-KATA_GANTI_NAMA-001',
  'BM-KATA_KERJA-002',
  'BM-KATA_ADJEKTIF-003',
  'BM-KATA_HUBUNG-002',
  'BM-PENJODOH_BILANGAN-004',
  'BM-AYAT-002',
  'BM-TATABAHASA-003',
  'BM-SIMPULAN_BAHASA-002',
  'BM-PENTAKSIRAN-SUMATIF-004',
  'MATH-NOMBOR-PILOT-003',
  'MATH-TAMBAH-PILOT-001',
  'MATH-TOLAK-PILOT-001',
  'MATH-DARAB-PILOT-001',
  'MATH-BAHAGI-PILOT-002',
  'MATH-WANG-PILOT-005',
  'MATH-MASA-PILOT-004',
  'MATH-PANJANG-PILOT-001',
  'MATH-JISIM-ISI-PADU-PILOT-001',
  'MATH-BENTUK-PILOT-002',
  'SAINS-HAIWAN-002',
  'SAINS-TUMBUHAN-002',
  'SAINS-MANUSIA-001',
  'SAINS-AIR-006',
  'SAINS-CAHAYA-001',
  'SAINS-BUNYI-001',
  'SAINS-BUMI-001',
  'SAINS-BAHAN-003',
  'SAINS-TEKNOLOGI-002',
  'SAINS-KEMAHIRAN_SAINTIFIK-002'
]);
const reviewedRichBatch4Ids = new Set([
  'BM-BINA_AYAT-022',
  'BM-BINA_AYAT-023',
  'BM-TATABAHASA-049',
  'BM-PENTAKSIRAN-SUMATIF-018',
  'MATH-NOMBOR-PILOT-015',
  'MATH-NOMBOR-PILOT-016',
  'MATH-NOMBOR-PILOT-028',
  'MATH-NOMBOR-PILOT-042',
  'MATH-TAMBAH-PILOT-047',
  'MATH-TOLAK-PILOT-047',
  'MATH-DARAB-PILOT-047',
  'MATH-BAHAGI-PILOT-040',
  'MATH-WANG-PILOT-041',
  'MATH-MASA-PILOT-018',
  'MATH-MASA-PILOT-041',
  'MATH-PANJANG-PILOT-040',
  'MATH-JISIM-ISI-PADU-PILOT-040',
  'MATH-JISIM-ISI-PADU-PILOT-048',
  'MATH-BENTUK-PILOT-049',
  'MATH-NOMBOR-PILOT-050'
]);
const reviewedQuestionBatchQ4Ids = new Set([
  'BM-KATA_NAMA_AM-002',
  'BM-KATA_KERJA-003',
  'BM-PENJODOH_BILANGAN-002',
  'MATH-MASA-PILOT-007',
  'MATH-BENTUK-PILOT-003',
  'ENG-NOUNS-001',
  'ENG-ANIMALS-004',
  'ENG-SENTENCES-001',
  'SAINS-HAIWAN-011',
  'SAINS-TUMBUHAN-001',
  'SAINS-BAHAN-001',
  'ARAB-HURUF_HIJAIYAH-001',
  'ARAB-WARNA_ARAB-001',
  'ISLAM-JAWI-001',
  'PJ-PERGERAKAN_ASAS-032'
]);
const reviewedInteractiveContentBatch1Types = new Map([
  ['MATH-BENTUK-PILOT-004', 'visualMath'],
  ['MATH-BENTUK-PILOT-006', 'visualMath'],
  ['MATH-BENTUK-PILOT-009', 'imageChoice'],
  ['MATH-MASA-PILOT-009', 'fillBlank'],
  ['MATH-WANG-PILOT-010', 'fillBlank'],
  ['MATH-PANJANG-PILOT-004', 'imageChoice'],
  ['MATH-PANJANG-PILOT-005', 'imageChoice'],
  ['MATH-PANJANG-PILOT-010', 'imageChoice'],
  ['SAINS-HAIWAN-012', 'imageChoice'],
  ['SAINS-HAIWAN-013', 'imageChoice'],
  ['SAINS-HAIWAN-014', 'imageChoice'],
  ['SAINS-TUMBUHAN-003', 'imageChoice'],
  ['SAINS-TUMBUHAN-004', 'imageChoice'],
  ['SAINS-MANUSIA-002', 'imageChoice'],
  ['SAINS-MANUSIA-003', 'imageChoice']
]);
const reviewedInteractiveContentBatch2Types = new Map([
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
const reviewedInteractiveContentBatch2Contracts = new Map([
  ['MATH-NOMBOR-PILOT-004', { answer: '80', accepted: ['80'] }],
  ['MATH-NOMBOR-PILOT-009', { answer: '<', accepted: ['<', 'lebih kecil daripada'] }],
  ['MATH-NOMBOR-PILOT-010', { answer: '601', accepted: ['601'] }],
  ['MATH-NOMBOR-PILOT-017', { answer: '260', accepted: ['260'] }],
  ['MATH-NOMBOR-PILOT-018', { answer: '460', accepted: ['460'] }],
  ['MATH-NOMBOR-PILOT-029', { answer: '50', accepted: ['50'] }],
  ['MATH-PANJANG-PILOT-006', { answer: 'Hujung objek biasanya diletakkan pada tanda 0 cm.', accepted: ['Hujung objek biasanya diletakkan pada tanda 0 cm.', '0 cm', '0'] }],
  ['MATH-MASA-PILOT-001', { answer: 'Hari selepas Selasa ialah Rabu.', accepted: ['Hari selepas Selasa ialah Rabu.', 'Rabu'] }],
  ['MATH-WANG-PILOT-003', { answer: '100 sen bersamaan dengan RM 1.', accepted: ['100 sen bersamaan dengan RM 1.', 'RM 1', 'RM1', '1'] }],
  ['SAINS-MANUSIA-004', { answer: 'rasa', accepted: ['rasa'] }],
  ['SAINS-MANUSIA-005', { answer: 'sentuhan', accepted: ['sentuhan'] }],
  ['SAINS-HAIWAN-015', { answer: 'berlari', accepted: ['berlari'] }],
  ['SAINS-HAIWAN-016', { answer: 'merayap', accepted: ['merayap'] }],
  ['SAINS-TUMBUHAN-005', { answer: 'melindungi biji benih', accepted: ['melindungi biji benih'] }],
  ['SAINS-TUMBUHAN-021', { answer: 'anak pokok', accepted: ['anak pokok'] }]
]);
const languageFillBlankBatch3Contracts = new Map([
  ['BM-KATA_SENDI-002', { stem: 'Baca situasi: Aina berjalan ______ kantin kerana dia lapar.', answer: 'ke', questionType: 'short_answer', sentenceParts: ['Baca situasi: Aina berjalan ', ' kantin kerana dia lapar.'], optionValues: ['di', 'ke', 'dari'] }],
  ['BM-KATA_HUBUNG-003', { stem: 'Lengkapkan ayat ini: Sara membawa payung ____ hari hujan pada pagi itu.', answer: 'kerana', questionType: 'short_answer', sentenceParts: ['Lengkapkan ayat ini: Sara membawa payung ', ' hari hujan pada pagi itu.'], optionValues: ['kerana', 'tetapi', 'atau'] }],
  ['BM-TATABAHASA-018', { stem: 'Di rumah, kami ___ menyiapkan latihan dan kini boleh berehat.', answer: 'sudah', questionType: 'short_answer', sentenceParts: ['Di rumah, kami ', ' menyiapkan latihan dan kini boleh berehat.'], optionValues: ['sedang', 'akan', 'sudah'] }],
  ['BM-SIMPULAN_BAHASA-021', { stem: "Lengkapkan ayat dengan simpulan bahasa yang tepat: 'Nora ______ kerana selalu membantu guru menyusun buku.'", answer: 'ringan tulang', questionType: 'short_answer', sentenceParts: ["Lengkapkan ayat dengan simpulan bahasa yang tepat: 'Nora ", " kerana selalu membantu guru menyusun buku.'"], optionValues: ['kaki ayam', 'ringan tulang', 'ulat buku'] }],
  ['ENG-NOUNS-004', { stem: 'We play football at the ________.', answer: 'field', questionType: 'short_answer', sentenceParts: ['We play football at the ', '.'], optionValues: ['classroom', 'kitchen', 'field'] }],
  ['ENG-COLOURS-001', { stem: 'A ripe banana is ________.', answer: 'yellow', questionType: 'short_answer', sentenceParts: ['A ripe banana is ', '.'], optionValues: ['yellow', 'red', 'blue'] }],
  ['ENG-ANIMALS-003', { stem: "The farm animal that says 'moo' and gives us milk is a ________.", answer: 'cow', questionType: 'short_answer', sentenceParts: ["The farm animal that says 'moo' and gives us milk is a ", '.'], optionValues: ['goat', 'cow', 'horse'] }],
  ['ENG-FOOD-003', { stem: 'The clear drink with no colour that our body needs is ________.', answer: 'water', questionType: 'short_answer', sentenceParts: ['The clear drink with no colour that our body needs is ', '.'], optionValues: ['milk', 'juice', 'water'] }],
  ['ARAB-NOMBOR_ARAB-001', { stem: 'Simbol ١ mewakili nombor ________ dalam Bahasa Melayu.', answer: 'satu', questionType: 'fill_blank', sentenceParts: ['Simbol ١ mewakili nombor ', ' dalam Bahasa Melayu.'], optionValues: ['dua', 'satu', 'tiga'] }],
  ['ARAB-HAIWAN_ARAB-001', { stem: 'قِطٌّ bermaksud ________.', answer: 'kucing', questionType: 'short_answer', sentenceParts: ['قِطٌّ bermaksud ', '.'], optionValues: ['kucing', 'anjing', 'arnab'] }],
  ['ARAB-AYAT_MUDAH_ARAB-001', { stem: 'Ayat هَذَا كِتَابٌ bermaksud ________.', answer: 'Ini buku', questionType: 'short_answer', sentenceParts: ['Ayat هَذَا كِتَابٌ bermaksud ', '.'], optionValues: ['Ini pen', 'Ini beg', 'Ini buku'] }],
  ['ARAB-HIWAR-004', { stem: 'Ungkapan اِسْمِي أَحْمَدُ bermaksud ________.', answer: 'Nama saya Ahmad', questionType: 'short_answer', sentenceParts: ['Ungkapan اِسْمِي أَحْمَدُ bermaksud ', '.'], optionValues: ['Nama saya Ahmad', 'Nama saya Fatimah', 'Apakah nama kamu?'] }],
  ['ISLAM-IBADAH-001', { stem: 'Solat fardu sehari semalam ada ________ waktu.', answer: 'lima', questionType: 'fill_blank', sentenceParts: ['Solat fardu sehari semalam ada ', ' waktu.'], optionValues: ['empat', 'lima', 'enam'] }],
  ['ISLAM-SIRAH-001', { stem: 'Nabi Muhammad SAW dilahirkan di kota ________.', answer: 'Mekah', questionType: 'fill_blank', sentenceParts: ['Nabi Muhammad SAW dilahirkan di kota ', '.'], optionValues: ['Mekah', 'Madinah', 'Taif'] }],
  ['ISLAM-QURAN-003', { stem: 'Malaikat yang menyampaikan wahyu Al-Quran ialah ________ AS.', answer: 'Jibril', questionType: 'fill_blank', sentenceParts: ['Malaikat yang menyampaikan wahyu Al-Quran ialah ', ' AS.'], optionValues: ['Mikail', 'Israfil', 'Jibril'] }],
  ['ISLAM-ADAB-001', { stem: 'Sebelum makan, kita membaca ________.', answer: 'Bismillah', questionType: 'fill_blank', sentenceParts: ['Sebelum makan, kita membaca ', '.'], optionValues: ['Alhamdulillah', 'Bismillah', 'Subhanallah'] }]
]);
const equalGroupsPilotContracts = new Map([
  ['MATH-DARAB-PILOT-002', { stem: 'Berapakah hasil darab 5 dengan 4?', visual: { kind: 'equalGroups', mode: 'multiplication', groups: 4, itemsPerGroup: 5 }, optionValues: ['20', '9', '16'] }],
  ['MATH-DARAB-PILOT-004', { stem: 'Selesaikan 3 x 4.', visual: { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4 }, optionValues: ['12', '7', '16'] }],
  ['MATH-DARAB-PILOT-006', { stem: 'Apakah hasil 1 x 8?', visual: { kind: 'equalGroups', mode: 'multiplication', groups: 1, itemsPerGroup: 8 }, optionValues: ['8', '9', '1'] }],
  ['MATH-DARAB-PILOT-008', { stem: 'Kira 7 x 2.', visual: { kind: 'equalGroups', mode: 'multiplication', groups: 7, itemsPerGroup: 2 }, optionValues: ['14', '9', '7'] }],
  ['MATH-BAHAGI-PILOT-004', { stem: 'Selesaikan 25 ÷ 5.', visual: { kind: 'equalGroups', mode: 'divisionGrouping', total: 25, itemsPerGroup: 5 }, optionValues: ['5', '4', '6'] }],
  ['MATH-BAHAGI-PILOT-007', { stem: 'Lengkapkan 24 ÷ 4 = ___.', visual: { kind: 'equalGroups', mode: 'divisionSharing', total: 24, groups: 4 }, optionValues: ['6', '4', '8'] }],
  ['MATH-BAHAGI-PILOT-009', { stem: 'Apakah hasil bagi 16 ÷ 2?', visual: { kind: 'equalGroups', mode: 'divisionSharing', total: 16, groups: 2 }, optionValues: ['8', '2', '14'] }],
  ['MATH-BAHAGI-PILOT-047', { stem: 'Satu jadual menunjukkan 3 dulang × ___ kuih = 27 kuih. Gunakan maklumat itu untuk mencari kuih pada setiap dulang.', visual: { kind: 'equalGroups', mode: 'divisionSharing', total: 27, groups: 3 }, optionValues: ['9', '8', '10'] }]
]);
const arrayPilotContracts = new Map([
  ['MATH-DARAB-PILOT-003', {
    stem: 'Cari hasil bagi 10 x 6.',
    answer: '60',
    accepted: ['60'],
    operands: [10, 6],
    visual: { kind: 'array', mode: 'multiplication', rows: 10, columns: 6 },
    optionValues: ['60', '16', '54'],
    hints: ['Perhatikan bahawa tatasusunan mempunyai 10 baris.', 'Setiap baris mempunyai 6 objek.', 'Kira semua objek mengikut susunan baris dan lajur sebelum memilih jawapan.']
  }],
  ['MATH-DARAB-PILOT-005', {
    stem: 'Nyatakan jawapan bagi 4 x 6.',
    answer: '24',
    accepted: ['24'],
    operands: [4, 6],
    visual: { kind: 'array', mode: 'multiplication', rows: 4, columns: 6 },
    optionValues: ['24', '10', '18'],
    hints: ['Perhatikan bahawa tatasusunan mempunyai 4 baris.', 'Setiap baris mempunyai 6 objek.', 'Kira semua objek mengikut susunan baris dan lajur sebelum memilih jawapan.']
  }]
]);
const numberLinePilotContracts = new Map([
  ['MATH-DARAB-PILOT-009', { stem: 'Apakah hasil bagi 5 x 8?', answer: '40', visual: { kind: 'numberLine', mode: 'repeatedJumps', jumps: 8, step: 5 }, optionValues: ['40', '13', '35'] }],
  ['MATH-DARAB-PILOT-020', { stem: 'Lengkapkan 5 x ___ = 35.', answer: '7', visual: { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5 }, optionValues: ['7', '5', '6'] }],
  ['MATH-DARAB-PILOT-025', { stem: 'Lengkapkan 10 x 10 = ___.', answer: '100', visual: { kind: 'numberLine', mode: 'repeatedJumps', jumps: 10, step: 10 }, optionValues: ['100', '20', '90'] }],
  ['MATH-DARAB-PILOT-032', { stem: 'Isi faktor yang hilang: ___ x 4 = 32.', answer: '8', visual: { kind: 'numberLine', mode: 'countJumps', end: 32, step: 4 }, optionValues: ['8', '4', '7'] }],
  ['MATH-DARAB-PILOT-033', { stem: 'Lengkapkan 6 x ___ = 54.', answer: '9', visual: { kind: 'numberLine', mode: 'countJumps', end: 54, step: 6 }, optionValues: ['9', '6', '8'] }],
  ['MATH-BAHAGI-PILOT-008', { stem: 'Kira 40 ÷ 10.', answer: '4', visual: { kind: 'numberLine', mode: 'countJumps', end: 40, step: 10 }, optionValues: ['4', '10', '30'] }],
  ['MATH-BAHAGI-PILOT-025', { stem: 'Lengkapkan 72 ÷ 8 = ___.', answer: '9', visual: { kind: 'numberLine', mode: 'countJumps', end: 72, step: 8 }, optionValues: ['9', '8', '10'] }]
]);
const allReviewedChoiceBatchIds = new Set([...reviewedChoiceBatchIds, ...reviewedChoiceBatch3Ids]);

assert.equal(questions.length, 4530, 'Interactive enrichment must not add or remove bank questions.');
assert.equal(reviewedChoiceBatch3Ids.size, 30, 'Batch 3 must contain ten reviewed questions each for BM, Mathematics and Science.');
assert.equal(reviewedRichBatch4Ids.size, 20, 'Batch 4 must contain twenty deliberately reviewed rich interactions.');
assert.equal(reviewedQuestionBatchQ4Ids.size, 15, 'Question Batch Q4 must contain fifteen deliberately selected, teacher-reviewed interactions.');
assert.equal(reviewedInteractiveContentBatch1Types.size, 15, 'Interactive Content Batch 1 must contain exactly fifteen teacher-reviewed interactions.');
assert.equal(reviewedInteractiveContentBatch2Types.size, 15, 'Interactive Content Batch 2 must contain exactly fifteen teacher-reviewed interactions.');
assert.equal(languageFillBlankBatch3Contracts.size, 16, 'Language FillBlank Batch 3 must contain exactly sixteen approved questions.');
assert.deepEqual(
  [...languageFillBlankBatch3Contracts.keys()].reduce((counts, id) => {
    const subject = id.split('-')[0];
    counts[subject] = (counts[subject] || 0) + 1;
    return counts;
  }, {}),
  { BM: 4, ENG: 4, ARAB: 4, ISLAM: 4 },
  'Language FillBlank Batch 3 must contain exactly four BM, English, Arabic and Islamic questions.'
);
assert.equal(equalGroupsPilotContracts.size, 8, 'The Equal Groups pilot must contain exactly eight reviewed questions.');
assert.equal(arrayPilotContracts.size, 2, 'The Array pilot must contain exactly two reviewed questions.');
assert.equal(numberLinePilotContracts.size, 7, 'The Number Line pilot must contain exactly seven reviewed questions.');
assert.equal(new Set([...reviewedInteractiveContentBatch1Types.keys(), ...reviewedInteractiveContentBatch2Types.keys()]).size, 30, 'Interactive Content Batches 1 and 2 must not contain duplicate reviewed IDs.');
const priorReviewedIds = [
  ...expectedTypes.keys(), ...reviewedFillBlankBatchIds, ...allReviewedChoiceBatchIds,
  ...reviewedRichBatch4Ids, ...reviewedQuestionBatchQ4Ids,
  ...reviewedInteractiveContentBatch1Types.keys(), ...reviewedInteractiveContentBatch2Types.keys(),
  ...equalGroupsPilotContracts.keys(), ...arrayPilotContracts.keys(), ...numberLinePilotContracts.keys()
];
assert.equal(new Set([...priorReviewedIds, ...languageFillBlankBatch3Contracts.keys()]).size, priorReviewedIds.length + languageFillBlankBatch3Contracts.size, 'Language FillBlank Batch 3 IDs must be disjoint from every existing reviewed batch and pilot.');
assert.equal(new Set([...equalGroupsPilotContracts.keys(), ...arrayPilotContracts.keys(), ...numberLinePilotContracts.keys()]).size, equalGroupsPilotContracts.size + arrayPilotContracts.size + numberLinePilotContracts.size, 'Equal Groups, Array and Number Line pilot IDs must remain disjoint.');
assert.equal(new Set(authoredInteractiveQuestions.map(question => question.id)).size, authoredInteractiveQuestions.length, 'Every authored interactive question ID must remain unique.');
assert.equal(authoredInteractiveQuestions.length, expectedTypes.size + reviewedFillBlankBatchIds.size + allReviewedChoiceBatchIds.size + reviewedRichBatch4Ids.size + reviewedQuestionBatchQ4Ids.size + reviewedInteractiveContentBatch1Types.size + reviewedInteractiveContentBatch2Types.size + languageFillBlankBatch3Contracts.size + equalGroupsPilotContracts.size + arrayPilotContracts.size + numberLinePilotContracts.size, 'Every reviewed interactive example must be attached exactly once.');
assert.equal(derivedChoiceQuestions.length, 992, 'Every remaining safe legacy objective question must become a tappable choice without editing bank data.');
assert.equal(renderableInteractiveQuestions.length, authoredInteractiveQuestions.length + derivedChoiceQuestions.length, 'Reviewed and safely derived interactions must remain independently countable.');
assert.deepEqual(new Set(authoredInteractiveQuestions.map(question => question.interaction.type)), new Set([...expectedTypes.values(), 'choice']), 'All twelve reviewed renderer types must remain represented.');

for (const [id, type] of expectedTypes) {
  const question = byId.get(id);
  assert.ok(question, `Missing interactive example ${id}.`);
  assert.equal(question.interaction.type, type, `${id} must use ${type}.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid interaction schema.`);
  assert.ok(question.qualityReview?.curriculum, `${id} requires a curriculum review note.`);
  assert.ok(question.qualityReview?.assessment, `${id} requires an assessment review note.`);
  assert.ok(question.qualityReview?.textbook, `${id} requires a textbook review note.`);
}

for (const id of reviewedFillBlankBatchIds) {
  const question = byId.get(id);
  assert.ok(question, `Missing reviewed fill-blank batch question ${id}.`);
  assert.equal(question.interaction.type, 'fillBlank', `${id} must use the reviewed fill-blank renderer.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid fill-blank schema.`);
  assert.equal(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct').length, 1, `${id} must have exactly one accepted option.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires all three review notes.`);
}

for (const id of allReviewedChoiceBatchIds) {
  const question = byId.get(id);
  assert.ok(question, `Missing reviewed choice batch question ${id}.`);
  assert.ok(['choice', 'imageChoice'].includes(question.interaction.type), `${id} must use a reviewed choice renderer.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid choice schema.`);
  assert.equal(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct').length, 1, `${id} must have exactly one accepted option.`);
  assert.ok(question.interaction.prompt && question.presentationOriginalQuestion, `${id} must retain both its reviewed presentation stem and original source stem.`);
  assert.notEqual(question.q, question.presentationOriginalQuestion, `${id} must present the reviewed non-repetitive stem.`);
  assert.equal(question.question, question.q, `${id} must expose one consistent reviewed stem to the quiz, Tutor AI, and saved session.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires all three review notes.`);
}

for (const id of reviewedRichBatch4Ids) {
  const question = byId.get(id);
  assert.ok(question, `Missing reviewed rich-interaction batch question ${id}.`);
  assert.ok(['ordering', 'multiSelect'].includes(question.interaction.type), `${id} must use an ordering or multiple-selection renderer.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid rich-interaction schema.`);
  const correctResponse = question.interaction.type === 'ordering'
    ? serializeOrderingResponse(question.interaction, question.interaction.correctOrder)
    : serializeMultiSelectResponse(question.interaction, question.interaction.correctOptionIds);
  assert.equal(smartCheck(correctResponse, question).status, 'correct', `${id} must serialize its authored solution to an accepted answer.`);
  const incompleteOrReversedResponse = question.interaction.type === 'ordering'
    ? serializeOrderingResponse(question.interaction, [...question.interaction.correctOrder].reverse())
    : serializeMultiSelectResponse(question.interaction, question.interaction.correctOptionIds.slice(0, -1));
  assert.notEqual(smartCheck(incompleteOrReversedResponse, question).status, 'correct', `${id} must reject an incomplete or reversed response.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires all three review notes.`);
  assert.ok(question.learningIntelligence?.hintSteps?.length >= 3, `${id} requires reviewed learning-intelligence hints.`);
}

for (const id of reviewedQuestionBatchQ4Ids) {
  const question = byId.get(id);
  assert.ok(question, `Missing Question Batch Q4 interaction ${id}.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid Question Batch Q4 interaction schema.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires curriculum, assessment and textbook review notes.`);
  assert.ok(question.learningIntelligence?.hintSteps?.length >= 3, `${id} requires progressive reviewed hints.`);
  if (question.interaction.type === 'ordering') {
    const correctResponse = serializeOrderingResponse(question.interaction, question.interaction.correctOrder);
    assert.equal(smartCheck(correctResponse, question).status, 'correct', `${id} ordering must serialize to the original accepted answer.`);
  } else {
    assert.equal(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct').length, 1, `${id} must retain exactly one accepted option.`);
  }
}

for (const [id, type] of reviewedInteractiveContentBatch1Types) {
  const question = byId.get(id);
  assert.ok(question, `Missing Interactive Content Batch 1 interaction ${id}.`);
  assert.equal(question.interaction.type, type, `${id} must use the reviewed ${type} renderer.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid Interactive Content Batch 1 schema.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires curriculum, assessment and textbook review notes.`);
  assert.ok(question.learningIntelligence?.hintSteps?.length >= 3, `${id} requires progressive reviewed hints.`);
  const solution = type === 'money'
    ? serializeMoneyResponse(question.interaction.targetSen)
    : question.interaction.options.find(option => smartCheck(option.value, question).status === 'correct')?.value;
  assert.ok(solution, `${id} must expose a complete authored solution.`);
  assert.equal(smartCheck(solution, question).status, 'correct', `${id} authored solution must preserve the original answer contract.`);
  if (type !== 'money') {
    assert.equal(question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct').length, 1, `${id} must retain exactly one accepted option.`);
  }
}

for (const [id, type] of reviewedInteractiveContentBatch2Types) {
  const question = byId.get(id);
  const contract = reviewedInteractiveContentBatch2Contracts.get(id);
  assert.ok(question, `Missing Interactive Content Batch 2 interaction ${id}.`);
  assert.equal(question.id, id, `${id} must preserve its original question ID.`);
  assert.equal(question.interaction.type, type, `${id} must use the reviewed ${type} renderer.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid Interactive Content Batch 2 schema.`);
  assert.equal(question.answer, contract.answer, `${id} must preserve its original canonical answer.`);
  assert.deepEqual(question.accepted, contract.accepted, `${id} must preserve its original accepted answers.`);
  assert.deepEqual(question.acceptedAnswers, contract.accepted, `${id} must preserve its normalized accepted-answer contract.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires curriculum, assessment and textbook review notes.`);
  assert.ok(question.learningIntelligence?.skillId && question.learningIntelligence?.responseMode, `${id} requires reviewed skill and response metadata.`);
  assert.ok(question.learningIntelligence?.conceptTags?.length && question.learningIntelligence?.misconceptionTags?.length, `${id} requires reviewed concept and misconception tags.`);
  assert.ok(question.learningIntelligence?.hintSteps?.length >= 3, `${id} requires progressive reviewed hints.`);
  const correctOptions = question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct');
  assert.equal(correctOptions.length, 1, `${id} must retain exactly one accepted authored response.`);
  assert.ok(question.interaction.options.filter(option => option !== correctOptions[0]).every(option => smartCheck(option.value, question).status !== 'correct'), `${id} must reject every important authored distractor.`);
  assert.ok(!question.interaction.instruction.toLocaleLowerCase('ms-MY').includes(String(correctOptions[0].value).toLocaleLowerCase('ms-MY')), `${id} instruction must not reveal its accepted response.`);
}

for (const [id, contract] of languageFillBlankBatch3Contracts) {
  const matches = questions.filter(question => question.id === id);
  const question = byId.get(id);
  assert.equal(matches.length, 1, `${id} must exist exactly once in the normalized runtime collection.`);
  assert.ok(question, `Missing Language FillBlank Batch 3 interaction ${id}.`);
  assert.equal(question.q, contract.stem, `${id} must preserve its original runtime stem.`);
  assert.equal(question.question, contract.stem, `${id} must expose its unchanged stem consistently.`);
  assert.equal(question.answer, contract.answer, `${id} must preserve its canonical answer.`);
  assert.deepEqual(question.accepted, [contract.answer], `${id} must preserve its original accepted answers.`);
  assert.deepEqual(question.acceptedAnswers, [contract.answer], `${id} must preserve its normalized accepted-answer contract.`);
  assert.equal(question.questionType, contract.questionType, `${id} must preserve its original question type.`);
  assert.equal(question.marks, 1, `${id} must remain a one-mark question.`);
  assert.equal(question.interaction.version, 1, `${id} must use interaction version 1.`);
  assert.equal(question.interaction.type, 'fillBlank', `${id} must use the existing fillBlank interaction.`);
  assert.ok(question.interaction.instruction, `${id} requires a reviewed instruction.`);
  assert.deepEqual(question.interaction.sentenceParts, contract.sentenceParts, `${id} must preserve the approved two-part sentence contract.`);
  assert.equal(question.interaction.sentenceParts.length, 2, `${id} must contain exactly two sentence parts.`);
  assert.deepEqual(question.interaction.options.map(option => option.value), contract.optionValues, `${id} must preserve the approved option order.`);
  assert.equal(question.interaction.options.length, 3, `${id} must expose exactly three reviewed options.`);
  assert.equal(new Set(question.interaction.options.map(option => option.id)).size, 3, `${id} must use three unique option IDs.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} must pass the existing fillBlank schema.`);
  const optionStatuses = question.interaction.options.map(option => smartCheck(option.value, question).status);
  assert.equal(optionStatuses.filter(status => status === 'correct').length, 1, `${id} must have exactly one smartCheck-correct option.`);
  assert.equal(optionStatuses.filter(status => status !== 'correct').length, 2, `${id} must reject exactly two distractors.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires item-specific curriculum, assessment and textbook review notes.`);
  assert.equal(question.learningIntelligence?.responseMode, 'completion', `${id} must use the established fillBlank response mode.`);
  assert.ok(question.learningIntelligence?.skillId, `${id} requires an item-specific skill ID.`);
  assert.ok(question.learningIntelligence?.conceptTags?.length && question.learningIntelligence?.misconceptionTags?.length, `${id} requires reviewed concept and misconception tags.`);
  assert.equal(question.learningIntelligence?.hintSteps?.length, 3, `${id} requires exactly three progressive hints.`);
  const guidance = [question.interaction.instruction, ...question.interaction.sentenceParts, ...question.learningIntelligence.hintSteps]
    .join(' ')
    .toLocaleLowerCase('ms-MY');
  const escapedAnswer = contract.answer.toLocaleLowerCase('ms-MY').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(guidance, new RegExp(`(^|[^\\p{L}\\p{N}])${escapedAnswer}($|[^\\p{L}\\p{N}])`, 'u'), `${id} instruction, blank sentence and hints must not reveal the canonical answer.`);
}

for (const [id, contract] of equalGroupsPilotContracts) {
  const matches = questions.filter(question => question.id === id);
  const question = byId.get(id);
  assert.equal(matches.length, 1, `${id} must exist exactly once in the runtime Mathematics collection.`);
  assert.ok(question, `Missing reviewed Equal Groups pilot interaction ${id}.`);
  assert.equal(question.q, contract.stem, `${id} must preserve its original runtime stem.`);
  assert.equal(question.question, contract.stem, `${id} must expose its unchanged stem consistently.`);
  assert.equal(question.interaction.type, 'visualMath', `${id} must remain a visualMath interaction.`);
  assert.deepEqual(question.interaction.visual, contract.visual, `${id} must use the approved strict Equal Groups metadata.`);
  assert.deepEqual(question.interaction.options.map(option => option.value), contract.optionValues, `${id} must use the three reviewed option values.`);
  assert.equal(question.interaction.options.length, 3, `${id} must provide exactly three options.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} must pass strict Equal Groups validation.`);
  const correctOptions = question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct');
  assert.equal(correctOptions.length, 1, `${id} must have exactly one option accepted by the original answer contract.`);
  assert.ok(question.interaction.options.filter(option => option !== correctOptions[0]).every(option => smartCheck(option.value, question).status !== 'correct'), `${id} must reject both reviewed distractors.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires specific curriculum, assessment and textbook review notes.`);
  assert.ok(question.learningIntelligence?.skillId && question.learningIntelligence?.responseMode, `${id} requires reviewed skill and response metadata.`);
  assert.ok(question.learningIntelligence?.conceptTags?.length && question.learningIntelligence?.misconceptionTags?.length, `${id} requires reviewed concept and misconception tags.`);
  assert.equal(question.learningIntelligence?.hintSteps?.length, 3, `${id} requires exactly three progressive reviewed hints.`);
  assert.ok(!Object.keys(question.interaction.visual).some(key => ['answer', 'result', 'equation', 'caption', 'label'].includes(key)), `${id} visual metadata must not carry an answer-leak field.`);
  const guidance = [question.interaction.instruction, ...question.learningIntelligence.hintSteps].join(' ');
  const escapedAnswer = correctOptions[0].value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(guidance, new RegExp(`(?:jawapan|hasil(?:nya)?|ialah|menjadi|=)\\s*${escapedAnswer}(?:\\D|$)`, 'i'), `${id} guidance must not state the derived result.`);
}

for (const [id] of equalGroupsPilotContracts) {
  const question = byId.get(id);
  const correctValue = question.interaction.options.find(option => smartCheck(option.value, question).status === 'correct').value;
  const guidance = [question.interaction.instruction, ...question.learningIntelligence.hintSteps].join(' ').toLocaleLowerCase('ms-MY');
  assert.ok([
    `jawapan ${correctValue}`,
    `hasilnya ${correctValue}`,
    `ialah ${correctValue}`,
    `menjadi ${correctValue}`,
    `= ${correctValue}`
  ].every(phrase => !guidance.includes(phrase)), `${id} instruction and hints must not state the derived result.`);
}

for (const [id, contract] of arrayPilotContracts) {
  const matches = questions.filter(question => question.id === id);
  const question = byId.get(id);
  assert.equal(matches.length, 1, `${id} must exist exactly once in the runtime Mathematics collection.`);
  assert.ok(question, `Missing reviewed Array pilot interaction ${id}.`);
  assert.equal(question.q, contract.stem, `${id} must preserve its original runtime stem.`);
  assert.equal(question.question, contract.stem, `${id} must expose its unchanged stem consistently.`);
  assert.equal(question.answer, contract.answer, `${id} must preserve its original canonical answer.`);
  assert.deepEqual(question.accepted, contract.accepted, `${id} must preserve its original accepted answers.`);
  assert.deepEqual(question.acceptedAnswers, contract.accepted, `${id} must preserve its normalized answer contract.`);
  assert.deepEqual(question.operands, contract.operands, `${id} must preserve its original multiplication operands.`);
  assert.equal(question.questionType, 'short_answer', `${id} must preserve its original short-answer question type.`);
  assert.equal(question.marks, 1, `${id} must preserve its original mark value.`);
  assert.equal(question.interaction.type, 'visualMath', `${id} must remain a visualMath interaction.`);
  assert.equal(question.interaction.instruction, 'Perhatikan tatasusunan baris dan lajur. Kira jumlah objek dan pilih jawapan yang betul.', `${id} must use the approved Array instruction.`);
  assert.deepEqual(question.interaction.visual, contract.visual, `${id} must use the approved strict Array metadata.`);
  assert.deepEqual(Object.keys(question.interaction.visual), ['kind', 'mode', 'rows', 'columns'], `${id} Array metadata must contain only the four approved keys.`);
  assert.deepEqual(question.interaction.options.map(option => option.value), contract.optionValues, `${id} must preserve the approved option order.`);
  assert.equal(question.interaction.options.length, 3, `${id} must provide exactly three options.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} must pass strict Array validation.`);
  const correctOptions = question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct');
  assert.equal(correctOptions.length, 1, `${id} must have exactly one option accepted by the original answer contract.`);
  assert.ok(question.interaction.options.filter(option => option !== correctOptions[0]).every(option => smartCheck(option.value, question).status !== 'correct'), `${id} must reject both reviewed distractors.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires item-specific curriculum, assessment and textbook review notes.`);
  assert.equal(question.learningIntelligence?.responseMode, 'visual_array', `${id} must use the approved visual Array response mode.`);
  assert.deepEqual(question.learningIntelligence?.conceptTags, ['darab', 'tatasusunan', 'baris_dan_lajur', 'fakta_darab'], `${id} must preserve the reviewed Array concepts.`);
  assert.deepEqual(question.learningIntelligence?.misconceptionTags, ['menambah_faktor', 'kurang_satu_baris'], `${id} must preserve the reviewed Array misconceptions.`);
  assert.deepEqual(question.learningIntelligence?.hintSteps, contract.hints, `${id} must use the three approved progressive hints.`);
  const guidance = [question.interaction.instruction, ...question.learningIntelligence.hintSteps].join(' ').toLocaleLowerCase('ms-MY');
  assert.ok([
    `jawapan ${contract.answer}`,
    `hasilnya ${contract.answer}`,
    `ialah ${contract.answer}`,
    `menjadi ${contract.answer}`,
    `= ${contract.answer}`
  ].every(phrase => !guidance.includes(phrase)), `${id} instruction and hints must not state the derived answer.`);
}

for (const [id, contract] of numberLinePilotContracts) {
  const matches = questions.filter(question => question.id === id);
  const question = byId.get(id);
  assert.equal(matches.length, 1, `${id} must exist exactly once in the runtime Mathematics collection.`);
  assert.ok(question, `Missing reviewed Number Line pilot interaction ${id}.`);
  assert.equal(question.q, contract.stem, `${id} must preserve its original runtime stem.`);
  assert.equal(question.question, contract.stem, `${id} must expose its unchanged stem consistently.`);
  assert.equal(question.answer, contract.answer, `${id} must preserve its original canonical answer.`);
  assert.deepEqual(question.accepted, [contract.answer], `${id} must preserve its original accepted answers.`);
  assert.deepEqual(question.acceptedAnswers, [contract.answer], `${id} must preserve its normalized answer contract.`);
  assert.equal(question.interaction.type, 'visualMath', `${id} must remain a visualMath interaction.`);
  assert.deepEqual(question.interaction.visual, contract.visual, `${id} must use the approved strict Number Line metadata.`);
  assert.deepEqual(question.interaction.options.map(option => option.value), contract.optionValues, `${id} must use the three reviewed option values.`);
  assert.equal(question.interaction.options.length, 3, `${id} must provide exactly three options.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} must pass strict Number Line validation.`);
  const correctOptions = question.interaction.options.filter(option => smartCheck(option.value, question).status === 'correct');
  assert.equal(correctOptions.length, 1, `${id} must have exactly one option accepted by the original answer contract.`);
  assert.ok(question.interaction.options.filter(option => option !== correctOptions[0]).every(option => smartCheck(option.value, question).status !== 'correct'), `${id} must reject both reviewed distractors.`);
  assert.ok(question.qualityReview?.curriculum && question.qualityReview?.assessment && question.qualityReview?.textbook, `${id} requires specific curriculum, assessment and textbook review notes.`);
  assert.ok(question.learningIntelligence?.skillId && question.learningIntelligence?.responseMode, `${id} requires reviewed skill and response metadata.`);
  assert.ok(question.learningIntelligence?.conceptTags?.length && question.learningIntelligence?.misconceptionTags?.length, `${id} requires reviewed concept and misconception tags.`);
  assert.equal(question.learningIntelligence?.hintSteps?.length, 3, `${id} requires exactly three progressive reviewed hints.`);
  const prohibitedKeys = contract.visual.mode === 'repeatedJumps'
    ? ['end', 'answer', 'result', 'solution', 'correctAnswer', 'equation', 'caption', 'label', 'answerLabel']
    : ['jumps', 'answer', 'result', 'solution', 'correctAnswer', 'equation', 'caption', 'label', 'answerLabel'];
  assert.ok(!Object.keys(question.interaction.visual).some(key => prohibitedKeys.includes(key)), `${id} visual metadata must not carry its derived unknown or an answer-leak field.`);
  const guidance = [question.interaction.instruction, ...question.learningIntelligence.hintSteps].join(' ').toLocaleLowerCase('ms-MY');
  assert.ok([
    `jawapan ${contract.answer}`,
    `hasilnya ${contract.answer}`,
    `ialah ${contract.answer}`,
    `menjadi ${contract.answer}`,
    `= ${contract.answer}`
  ].every(phrase => !guidance.includes(phrase)), `${id} instruction and hints must not state the derived answer.`);
}

assert.notEqual(byId.get('MATH-BAHAGI-PILOT-020')?.interaction?.visual?.kind, 'numberLine', 'The unsupported unknown-step division construct must remain unauthored as Number Line content.');

for (const id of [
  'MATH-DARAB-PILOT-007', 'MATH-DARAB-PILOT-010', 'MATH-DARAB-PILOT-017',
  'MATH-DARAB-PILOT-021', 'MATH-DARAB-PILOT-022', 'MATH-DARAB-PILOT-023',
  'MATH-DARAB-PILOT-024', 'MATH-DARAB-PILOT-028', 'MATH-DARAB-PILOT-038',
  'MATH-DARAB-PILOT-039', 'MATH-DARAB-PILOT-040', 'MATH-DARAB-PILOT-060'
]) {
  assert.notEqual(byId.get(id)?.interaction?.visual?.kind, 'array', `${id} must remain outside the exact two-question Array pilot.`);
}

assert.deepEqual(byId.get('MATH-DARAB-PILOT-001').interaction.options.map(option => option.value), ['5', '6', '8'], 'Existing reviewed multiplication choice must remain unchanged.');
assert.deepEqual(byId.get('MATH-DARAB-PILOT-047').interaction.correctOrder, ['product-25', 'product-27', 'product-32'], 'Existing reviewed multiplication ordering must remain unchanged.');
assert.deepEqual(byId.get('MATH-BAHAGI-PILOT-002').interaction.options.map(option => option.value), ['3', '5', '12'], 'Existing reviewed division choice must remain unchanged.');
assert.deepEqual(byId.get('MATH-BAHAGI-PILOT-040').interaction.correctOrder, ['quotient-4', 'quotient-5', 'quotient-6'], 'Existing reviewed division ordering must remain unchanged.');

const batch2PlaceValue = byId.get('MATH-NOMBOR-PILOT-004');
assert.deepEqual(batch2PlaceValue.interaction.visual.columns.map(column => [column.label, column.value]), [['Ratus', 5], ['Puluh', 8], ['Sa', 2]], 'The reviewed place-value visual must preserve the 582 structure.');
assert.ok(!JSON.stringify(batch2PlaceValue.interaction.visual).includes('80'), 'The place-value visual must not state the final value 80.');

const batch2Measurement = byId.get('MATH-PANJANG-PILOT-006');
assert.deepEqual(batch2Measurement.interaction.options.map(option => option.value), ['0 cm', '1 cm', '10 cm'], 'The ruler task must expose exactly the reviewed start-mark choices.');
assert.equal(batch2Measurement.interaction.visual.startCm, 0, 'The full ruler scale must begin at its ordinary zero tick.');
assert.equal(batch2Measurement.interaction.visual.endCm, batch2Measurement.interaction.visual.maxCm, 'The ruler guide must span the full scale instead of highlighting the correct start mark alone.');
assert.ok(!Object.keys(batch2Measurement.interaction.visual).some(key => /correct|answer|highlight|selected/i.test(key)), 'The ruler visual must not carry an explicit answer-marker property.');
assert.ok(!/jawapan|0\s*cm/i.test(batch2Measurement.interaction.visual.objectLabel), 'The ruler label must not identify 0 cm as the answer.');

for (const id of ['SAINS-MANUSIA-004', 'SAINS-MANUSIA-005', 'SAINS-HAIWAN-015', 'SAINS-HAIWAN-016', 'SAINS-TUMBUHAN-005']) {
  const question = byId.get(id);
  const correctOption = question.interaction.options.find(option => smartCheck(option.value, question).status === 'correct');
  assert.ok(question.interaction.options.every(option => option.visual?.label), `${id} must retain a semantic label for every visual choice.`);
  assert.ok(!correctOption.visual.label.toLocaleLowerCase('ms-MY').includes(String(correctOption.value).toLocaleLowerCase('ms-MY')), `${id} visual description must not state the accepted response as a hidden label.`);
}

const batch2StemIdentityCueGuards = new Map([
  ['SAINS-MANUSIA-004', { label: 'lidah', symbol: '👅' }],
  ['SAINS-HAIWAN-015', { label: 'kuda', symbol: '🐎' }],
  ['SAINS-HAIWAN-016', { label: 'siput', symbol: '🐌' }],
  ['SAINS-TUMBUHAN-005', { label: 'buah', symbol: '🍎' }]
]);
for (const [id, forbiddenCue] of batch2StemIdentityCueGuards) {
  const question = byId.get(id);
  const correctOption = question.interaction.options.find(option => smartCheck(option.value, question).status === 'correct');
  assert.ok(!correctOption.visual.label.toLocaleLowerCase('ms-MY').includes(forbiddenCue.label), `${id} correct visual label must not repeat the object identity from the stem.`);
  assert.ok(!correctOption.visual.symbol.includes(forbiddenCue.symbol), `${id} correct visual symbol must not repeat the object identity from the stem.`);
}

const batch2ExpandedNumber = byId.get('MATH-NOMBOR-PILOT-029');
const batch2ExpandedCorrect = batch2ExpandedNumber.interaction.options.find(option => smartCheck(option.value, batch2ExpandedNumber).status === 'correct');
assert.equal(`${batch2ExpandedNumber.interaction.sentenceParts[0]}${batch2ExpandedCorrect.value}${batch2ExpandedNumber.interaction.sentenceParts[1]}`, '300 + 50 + 7 = 357', 'The missing-tens selection must compose the exact reviewed expanded notation.');
assert.equal(smartCheck('50', batch2ExpandedNumber).status, 'correct', 'The missing tens value must remain accepted.');
assert.notEqual(smartCheck('5', batch2ExpandedNumber).status, 'correct', 'The ones-value misconception must remain rejected.');
assert.notEqual(smartCheck('500', batch2ExpandedNumber).status, 'correct', 'The hundreds-value misconception must remain rejected.');

const batch2MoneyEquivalence = byId.get('MATH-WANG-PILOT-003');
const batch2MoneyCorrect = batch2MoneyEquivalence.interaction.options.find(option => smartCheck(option.value, batch2MoneyEquivalence).status === 'correct');
assert.equal(`${batch2MoneyEquivalence.interaction.sentenceParts[0]}${batch2MoneyCorrect.value}${batch2MoneyEquivalence.interaction.sentenceParts[1]}`, '100 sen = RM 1.', 'The ringgit/sen selection must compose the exact reviewed equivalence.');
assert.equal(smartCheck('1', batch2MoneyEquivalence).status, 'correct', 'The one-ringgit response must remain accepted.');
assert.notEqual(smartCheck('10', batch2MoneyEquivalence).status, 'correct', 'The ten-ringgit distractor must remain rejected.');
assert.notEqual(smartCheck('100', batch2MoneyEquivalence).status, 'correct', 'The hundred-ringgit distractor must remain rejected.');

const batch1Clock = byId.get('MATH-MASA-PILOT-009');
assert.equal(batch1Clock.interaction.type, 'fillBlank', 'The reviewed time expression must remain a completion task.');
assert.deepEqual(batch1Clock.interaction.options.map(option => [option.label, option.value]), [
  ['pukul enam suku', 'pukul enam suku'],
  ['pukul enam setengah', 'pukul enam setengah'],
  ['pukul enam tepat', 'pukul enam tepat']
], 'The reviewed time expression must expose exactly the approved full-response choices.');
const batch1ClockCorrectOption = batch1Clock.interaction.options.find(option => smartCheck(option.value, batch1Clock).status === 'correct');
assert.ok(batch1ClockCorrectOption, 'The reviewed time expression must expose an accepted option.');
assert.equal(batch1Clock.interaction.options.filter(option => smartCheck(option.value, batch1Clock).status === 'correct').length, 1, 'The reviewed time expression must retain exactly one accepted option.');
const batch1ClockComposedSentence = `${batch1Clock.interaction.sentenceParts[0]}${batch1ClockCorrectOption.value}${batch1Clock.interaction.sentenceParts[1]}`;
assert.equal(batch1ClockComposedSentence, '6:15 dibaca sebagai pukul enam suku.', 'The selected full response must compose a natural completed sentence.');
assert.ok(!batch1ClockComposedSentence.includes('pukul enam pukul enam'), 'The completed time sentence must not repeat its hour phrase.');
assert.ok(batch1Clock.interaction.options.filter(option => option !== batch1ClockCorrectOption).every(option => smartCheck(option.value, batch1Clock).status !== 'correct'), 'Both reviewed time distractors must remain rejected.');
assert.ok(!batch1Clock.interaction.instruction.includes('pukul enam suku'), 'The reviewed time instruction must not reveal the target phrase.');
const batch1Comparison = byId.get('MATH-PANJANG-PILOT-010');
assert.deepEqual(batch1Comparison.interaction.options.map(option => option.value), ['pemadam', 'koridor sekolah'], 'The reviewed cm comparison must preserve exactly the two original concepts.');
const batch1Money = byId.get('MATH-WANG-PILOT-010');
assert.equal(batch1Money.interaction.type, 'fillBlank', 'The reviewed money notation must remain a completion task.');
assert.deepEqual(batch1Money.interaction.options.map(option => option.label), ['RM 7.05', 'RM 7.50', 'RM 7.5'], 'The reviewed money notation must expose exactly the approved visible choices.');
assert.equal(batch1Money.interaction.options.filter(option => smartCheck(option.value, batch1Money).status === 'correct').length, 1, 'The reviewed money notation must retain exactly one accepted option.');
assert.ok(!batch1Money.interaction.instruction.includes('RM 7.05'), 'The reviewed money instruction must not reveal the canonical notation.');

const imageChoice = byId.get('MATH-BENTUK-PILOT-001');
assert.equal(smartCheck('3', imageChoice).status, 'correct', 'Image choice must submit an accepted canonical answer.');
assert.notEqual(smartCheck('4', imageChoice).status, 'correct', 'Image choice distractor must remain incorrect.');

const discoverableBmQuestion = byId.get('BM-KATA_NAMA_AM-001');
assert.equal(smartCheck('buku', discoverableBmQuestion).status, 'correct', 'The dashboard pilot must submit the existing canonical BM answer.');
assert.notEqual(smartCheck('Siti', discoverableBmQuestion).status, 'correct', 'The visual person distractor must remain incorrect.');
const kataNamaAmTopic = subjects.find(subject => subject.id === 'bm')?.topics.find(topic => topic.id === 'kata_nama_am');
const reorderedKataNamaAm = prioritizeInteractiveQuestions([
  kataNamaAmTopic.questions[1],
  kataNamaAmTopic.questions[2],
  kataNamaAmTopic.questions[0]
]);
assert.equal(reorderedKataNamaAm[0]?.id, 'BM-KATA_NAMA_AM-002', 'A new topic session must preserve the first teacher-reviewed interactive question in the supplied session order.');
const lokomotorTopic = subjects.find(subject => subject.id === 'pj')?.topics.find(topic => topic.id === 'lokomotor');
assert.equal(prioritizeInteractiveQuestions(lokomotorTopic.questions)[0]?.id, 'PJ-LOKOMOTOR-039', 'A teacher-reviewed interaction must take priority over an automatically derived choice in the same topic.');
const haiwanTopic = subjects.find(subject => subject.id === 'sains')?.topics.find(topic => topic.id === 'haiwan');
assert.equal(prioritizeInteractiveQuestions(haiwanTopic.questions)[0]?.id, 'SAINS-HAIWAN-002', 'A new Science activity must surface its reviewed visual question before standard questions.');
const nomborTopic = subjects.find(subject => subject.id === 'math')?.topics.find(topic => topic.id === 'nombor');
assert.equal(prioritizeInteractiveQuestions(nomborTopic.questions)[0]?.id, 'MATH-NOMBOR-PILOT-004', 'The first reviewed rich interaction in the Number topic must surface before basic reviewed choices.');

const dragDrop = byId.get('MATH-BENTUK-PILOT-021');
const dragResponse = serializeDragDropResponse(dragDrop.interaction, {
  circle: '2d',
  cube: '3d',
  triangle: '2d',
  cylinder: '3d'
});
assert.equal(dragResponse, '2D: bulatan, segi tiga; 3D: kubus, silinder');
assert.equal(smartCheck(dragResponse, dragDrop).status, 'correct', 'Drag/drop response must use the legacy accepted-answer path.');

const matching = byId.get('MATH-BENTUK-PILOT-035');
const matchingResponse = serializeMatchingResponse(matching.interaction, {
  ball: 'sphere',
  can: 'cylinder',
  dice: 'cube'
});
assert.equal(matchingResponse, 'bola-sfera, tin-silinder, dadu-kubus');
assert.equal(smartCheck(matchingResponse, matching).status, 'correct', 'Matching response must use the legacy accepted-answer path.');

const ordering = byId.get('BM-BINA_AYAT-021');
const orderingResponse = serializeOrderingResponse(ordering.interaction, ['subject', 'verb', 'object']);
assert.equal(orderingResponse, 'Aina membaca buku cerita.');
assert.equal(smartCheck(orderingResponse, ordering).status, 'correct', 'Ordering response must use the legacy accepted-answer path.');
const operationOrdering = byId.get('MATH-TAMBAH-PILOT-047');
assert.equal(operationOrdering.interaction.items[0].label, '125 + 250', 'Operation cards must not reveal their calculated results.');
assert.equal(
  serializeOrderingResponse(operationOrdering.interaction, operationOrdering.interaction.correctOrder),
  '204 + 163 = 367, 125 + 250 = 375, 316 + 72 = 388',
  'Ordering serialization must support a hidden response label that remains compatible with the canonical answer.'
);

const visualMath = byId.get('MATH-NOMBOR-PILOT-024');
assert.equal(smartCheck('638', visualMath).status, 'correct', 'Visual mathematics must submit an accepted canonical answer.');
assert.notEqual(smartCheck('368', visualMath).status, 'correct', 'Visual mathematics distractor must remain incorrect.');

const fillBlank = byId.get('BM-KATA_SENDI-001');
assert.equal(smartCheck('di', fillBlank).status, 'correct', 'Fill-blank choice must submit the accepted word.');
assert.notEqual(smartCheck('ke', fillBlank).status, 'correct', 'Fill-blank distractor must remain incorrect.');

const multiSelect = byId.get('MATH-NOMBOR-PILOT-049');
const multiSelectResponse = serializeMultiSelectResponse(multiSelect.interaction, ['C', 'A']);
assert.equal(multiSelectResponse, 'A dan C', 'Multi-select serialization must follow authored order, not tap order.');
assert.equal(smartCheck(multiSelectResponse, multiSelect).status, 'correct', 'All correct multi-select options must pass through the accepted-answer path.');
assert.notEqual(smartCheck(serializeMultiSelectResponse(multiSelect.interaction, ['A']), multiSelect).status, 'correct', 'An incomplete multi-select response must remain incorrect.');

const hotspot = byId.get('SAINS-TUMBUHAN-009');
assert.equal(smartCheck('daun', hotspot).status, 'correct', 'The correct responsive hotspot must submit its canonical label.');
assert.notEqual(smartCheck('akar', hotspot).status, 'correct', 'An incorrect hotspot must remain incorrect.');
assert.ok(hotspot.interaction.hotspots.every(point => point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100), 'Hotspot coordinates must be responsive percentages.');

const clock = byId.get('MATH-MASA-PILOT-008');
assert.equal(smartCheck('3:30', clock).status, 'correct', 'Clock choice must submit the accepted time.');
assert.notEqual(smartCheck('3:00', clock).status, 'correct', 'Clock distractor must remain incorrect.');
assert.ok(clock.interaction.options.every(option => !option.label.includes(':')), 'Clock card labels must not reveal their hidden scoring values.');

const q4Clock = byId.get('MATH-MASA-PILOT-007');
assert.equal(smartCheck('8:00', q4Clock).status, 'correct', 'Question Batch Q4 digital-to-analogue clock must retain the accepted time.');
assert.ok(q4Clock.interaction.options.every(option => !option.label.includes(':')), 'Question Batch Q4 clock labels must remain answer-neutral.');

const money = byId.get('MATH-WANG-PILOT-008');
assert.equal(serializeMoneyResponse(250), 'RM 2.50', 'Money totals must be formatted from integer sen.');
assert.equal(smartCheck(serializeMoneyResponse(250), money).status, 'correct', 'Any denomination combination totaling 250 sen must be accepted.');
assert.notEqual(smartCheck(serializeMoneyResponse(240), money).status, 'correct', 'An incorrect money total must remain incorrect.');

const measurement = byId.get('MATH-PANJANG-PILOT-018');
assert.equal(smartCheck('11 cm', measurement).status, 'correct', 'Ruler measurement must submit the accepted length.');
assert.notEqual(smartCheck('14 cm', measurement).status, 'correct', 'Reading only the ruler endpoint must remain incorrect.');

assert.ok(validateInteractiveQuestionConfig({ version: 2, type: 'imageChoice', instruction: 'x', options: [] }).length, 'Unsupported or malformed configs must be rejected.');
const equalGroupsConfig = visual => ({
  version: 1,
  type: 'visualMath',
  instruction: 'Perhatikan kumpulan dan pilih jawapan.',
  visual,
  options: [
    { id: 'a', label: 'A', value: '1' },
    { id: 'b', label: 'B', value: '2' }
  ]
});
assert.deepEqual(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4 })), [], 'Equal groups must remain a valid visualMath visual.');
assert.ok(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'equalGroups', mode: 'divisionSharing', total: 24, groups: 4, itemsPerGroup: 6 })).includes('invalid_equal_groups_visual'), 'Sharing metadata must not store the unknown per-group answer.');
assert.ok(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'equalGroups', mode: 'divisionGrouping', total: 25, itemsPerGroup: 5, groups: 5 })).includes('invalid_equal_groups_visual'), 'Grouping metadata must not store the unknown group-count answer.');
assert.equal(INTERACTIVE_QUESTION_TYPES.includes('equalGroups'), false, 'Equal groups must remain a visualMath kind rather than a new interaction type.');
assert.deepEqual(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 8 })), [], 'Repeated jumps must be accepted through the existing visualMath path.');
assert.deepEqual(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'numberLine', mode: 'countJumps', end: 35, step: 5 })), [], 'Counting jumps must be accepted through the existing visualMath path.');
assert.ok(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'numberLine', mode: 'countJumps', end: 35, step: 5, jumps: 7 })).includes('invalid_number_line_visual'), 'Count-jump metadata must not store the unknown jump count.');
assert.equal(INTERACTIVE_QUESTION_TYPES.includes('numberLine'), false, 'Number line must remain a visualMath kind rather than a new interaction type.');
assert.deepEqual(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'array', mode: 'multiplication', rows: 4, columns: 5 })), [], 'Arrays must be accepted through the existing visualMath path.');
assert.ok(validateInteractiveQuestionConfig(equalGroupsConfig({ kind: 'array', mode: 'multiplication', rows: 4, columns: 5, total: 20 })).includes('invalid_array_visual'), 'Array metadata must not store an answer-bearing total.');
assert.equal(INTERACTIVE_QUESTION_TYPES.includes('array'), false, 'Arrays must remain a visualMath kind rather than a new interaction type.');
assert.equal(getInteractiveQuestionConfig(questions.find(question => question.id === 'MATH-MASA-PILOT-021')), null, 'A constructed-response time problem must remain on the standard input path when a richer interaction could alter the assessed construct.');
const derivedObjective = questions.find(question => question.id === 'PJ-PERGERAKAN_ASAS-001');
assert.equal(getInteractiveQuestionConfig(derivedObjective)?.type, 'choice', 'A safe legacy objective question must render as a tappable choice.');
assert.equal(smartCheck('berjalan', derivedObjective).status, 'correct', 'Derived choice interaction must retain the canonical answer path.');

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(root, 'src/dashboard/HomeDashboard.jsx'), 'utf8');
const composerSource = fs.readFileSync(path.join(root, 'src/ai/question/interactiveSessionComposer.js'), 'utf8');
const engineSource = fs.readFileSync(path.join(root, 'src/components/questions/InteractiveQuestionEngine.jsx'), 'utf8');
const visualSource = fs.readFileSync(path.join(root, 'src/components/questions/QuestionVisual.jsx'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'src/styles/style.css'), 'utf8');
assert.ok(appSource.includes('InteractiveQuestionEngine'), 'Quiz surfaces must integrate the interactive engine.');
assert.ok(appSource.includes("supportsInteractiveQuestion } from './utils/acceptedAnswers.js'"), 'Quiz surfaces must use the lightweight interaction support gate without eagerly loading the renderer utilities.');
assert.ok(fs.readFileSync(path.join(root, 'src/utils/acceptedAnswers.js'), 'utf8').includes('if (!config) return hasSingleAcceptedOption(question)'), 'Runtime must only derive an interaction when exactly one option is accepted.');
assert.ok(appSource.includes('const smartSession = options.preserveQuestions'), 'A composed interactive activity must retain its selected question order.');
assert.ok(dashboardSource.includes("import { buildInteractivePracticeSession } from '../ai/question/interactiveSessionComposer.js'"), 'HomeDashboard must import the approved subject-level interactive session composer.');
assert.ok(dashboardSource.includes('buildInteractivePracticeSession(selectedSubject, { memory: effectiveMemory, count: 10 })'), 'HomeDashboard must compose the activity from the selected subject and current memory.');
assert.doesNotMatch(dashboardSource, /prioritizeInteractiveQuestions\(interactiveActivitySource\.questions\)/, 'HomeDashboard must not send a single topic through the old prioritization path.');
assert.doesNotMatch(dashboardSource, /\b(?:reviewedInteractiveActivitySource|interactiveActivitySource)\b/, 'The obsolete single-topic interactive activity source must remain removed.');
assert.ok(dashboardSource.includes('Aktiviti Interaktif'), 'The dashboard must expose an explicit interactive-practice action.');
assert.match(dashboardSource, /onStartTopic\(interactiveActivityTopic, selectedSubject, \{ preserveQuestions: true, mode: 'interactive-practice'/, 'The CTA must launch the composed questions unchanged in interactive-practice mode.');
assert.ok(appSource.includes("['quiz', 'adaptive-practice', 'adaptive-lesson', 'interactive-practice'].includes(mode)"), 'App must recognize interactive-practice as a resumable question mode.');
assert.ok(appSource.includes('startInteractivePracticeResume(targetResume)'), 'Interactive-practice resume must use the saved session instead of composing again.');
assert.ok(appSource.includes('rehydrateInteractivePracticeQuestions(subject, targetResume.questions)'), 'Interactive-practice resume must rehydrate the saved question IDs from the real subject.');
assert.ok(composerSource.includes('new Map(flattenSubjectQuestions(subject).map(candidate => [candidate.id, candidate.question]))'), 'Mixed-topic resume must build its current-bank lookup across all subject topics.');
assert.ok(composerSource.includes('savedQuestions) ? savedQuestions : []).map'), 'Mixed-topic resume must preserve the saved question order while rehydrating by ID.');
assert.ok((appSource.match(/interactiveQuestion \? <React\.Suspense/g) || []).length >= 2, 'Quiz and Pentaksiran must both retain an interactive/legacy branch.');
assert.ok(appSource.includes(': <input value={answer}'), 'Legacy text-input fallback must remain available.');
assert.ok(engineSource.includes('role="radiogroup"') && engineSource.includes('aria-pressed') && engineSource.includes('aria-live="polite"'), 'Renderer must expose keyboard and assistive-technology states.');
assert.ok(engineSource.includes('role="checkbox"') && engineSource.includes('hotspot-button') && engineSource.includes('money-counter'), 'Phase 2 selection, hotspot and money controls must expose semantic interactive controls.');
assert.ok(engineSource.includes('onDragStart') && engineSource.includes('onClick'), 'Drag interactions must also offer tap/click controls.');
assert.ok(engineSource.includes('useId') && engineSource.includes('aria-labelledby={instructionId}') && engineSource.includes('aria-describedby={helpId}'), 'Interactive instructions and help must be associated with the activity for assistive technology.');
assert.ok(engineSource.includes('ke atas') && engineSource.includes('ke bawah') && engineSource.includes('↑') && engineSource.includes('↓'), 'Vertical ordering must provide explicit up/down keyboard and touch controls.');
assert.ok(visualSource.includes('lang={visual.lang}') && visualSource.includes('dir={visual.dir}'), 'Arabic and Jawi symbols must expose language and reading direction metadata.');
assert.ok(visualSource.includes("visual.kind === 'equalGroups'") && visualSource.includes('role="img"') && visualSource.includes('aria-hidden="true"'), 'QuestionVisual must render equal groups as one safe semantic image with hidden counters.');
assert.ok(styleSource.includes('.equal-groups-grid') && styleSource.includes('.equal-groups-counter'), 'Equal groups must use tightly scoped responsive counter styles.');
assert.match(engineSource, /config\.type === 'visualMath'\) content = <ChoiceGrid[\s\S]{0,180}visualMath/, 'Equal groups must retain the existing visualMath ChoiceGrid answer mechanism.');
assert.doesNotMatch(engineSource, /config\.type === 'equalGroups'/, 'Equal groups must not introduce a new interaction-engine branch.');
assert.ok(visualSource.includes("visual.kind === 'numberLine'") && visualSource.includes('number-line-svg'), 'QuestionVisual must route number lines through the existing visual component.');
assert.ok(styleSource.includes('.number-line-visual') && styleSource.includes('.number-line-arc'), 'Number lines must use tightly scoped responsive SVG styles.');
assert.doesNotMatch(engineSource, /config\.type === 'numberLine'/, 'Number line must not introduce a new interaction-engine branch.');
assert.ok(visualSource.includes("visual.kind === 'array'") && visualSource.includes('array-grid') && visualSource.includes('array-counter'), 'QuestionVisual must route arrays through the existing visual component.');
assert.ok(styleSource.includes('.array-visual') && styleSource.includes('.array-grid') && styleSource.includes('.array-counter'), 'Arrays must use tightly scoped responsive grid styles.');
assert.doesNotMatch(engineSource, /config\.type === 'array'/, 'Arrays must not introduce a new interaction-engine branch.');
assert.ok(styleSource.includes('min-height: 48px') && styleSource.includes('@media (max-width: 650px)') && styleSource.includes('prefers-reduced-motion'), 'Touch size, mobile layout and reduced-motion support are required.');
assert.ok(styleSource.includes('.interactive-clock-svg') && styleSource.includes('.interactive-ruler-svg') && styleSource.includes('.hotspot-stage'), 'Phase 2 visuals must have scoped responsive styles.');
assert.ok(styleSource.includes('.type-choice .interactive-choice-grid') && styleSource.includes('overflow-wrap: anywhere'), 'Text-heavy derived choices must remain readable on desktop and mobile.');
assert.ok(styleSource.includes('.interactive-object-symbol.arabic-glyph'), 'Arabic and Jawi glyphs must retain a readable responsive size.');
assert.ok(!engineSource.includes('dangerouslySetInnerHTML'), 'Question visuals must not inject unsafe HTML.');

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Interactive Question Engine Phases 1 and 2',
  questionBankCount: questions.length,
  reviewedExamples: authoredInteractiveQuestions.map(question => ({ id: question.id, type: question.interaction.type })),
  derivedChoiceQuestions: derivedChoiceQuestions.length,
  runtimeInteractiveTotal: renderableInteractiveQuestions.length,
  legacyFallback: true,
  quizAndAssessmentIntegrated: true,
  inputModes: ['touch', 'mouse', 'keyboard']
}, null, 2));
