import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { supportsInteractiveQuestion } from '../../src/utils/acceptedAnswers.js';
import { smartCheck } from '../../src/utils/smartCheck.js';
import {
  getInteractiveQuestionConfig,
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
const allReviewedChoiceBatchIds = new Set([...reviewedChoiceBatchIds, ...reviewedChoiceBatch3Ids]);

assert.equal(questions.length, 4530, 'Interactive enrichment must not add or remove bank questions.');
assert.equal(reviewedChoiceBatch3Ids.size, 30, 'Batch 3 must contain ten reviewed questions each for BM, Mathematics and Science.');
assert.equal(reviewedRichBatch4Ids.size, 20, 'Batch 4 must contain twenty deliberately reviewed rich interactions.');
assert.equal(reviewedQuestionBatchQ4Ids.size, 15, 'Question Batch Q4 must contain fifteen deliberately selected, teacher-reviewed interactions.');
assert.equal(authoredInteractiveQuestions.length, expectedTypes.size + reviewedFillBlankBatchIds.size + allReviewedChoiceBatchIds.size + reviewedRichBatch4Ids.size + reviewedQuestionBatchQ4Ids.size, 'Every reviewed interactive example must be attached exactly once.');
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
assert.equal(prioritizeInteractiveQuestions(nomborTopic.questions)[0]?.id, 'MATH-NOMBOR-PILOT-015', 'A rich reviewed interaction must surface before a basic reviewed choice so Free learners can reach it.');

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
assert.equal(getInteractiveQuestionConfig(questions.find(question => question.id === 'MATH-MASA-PILOT-021')), null, 'A constructed-response time problem must remain on the standard input path when a richer interaction could alter the assessed construct.');
const derivedObjective = questions.find(question => question.id === 'PJ-PERGERAKAN_ASAS-001');
assert.equal(getInteractiveQuestionConfig(derivedObjective)?.type, 'choice', 'A safe legacy objective question must render as a tappable choice.');
assert.equal(smartCheck('berjalan', derivedObjective).status, 'correct', 'Derived choice interaction must retain the canonical answer path.');

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(root, 'src/dashboard/HomeDashboard.jsx'), 'utf8');
const engineSource = fs.readFileSync(path.join(root, 'src/components/questions/InteractiveQuestionEngine.jsx'), 'utf8');
const visualSource = fs.readFileSync(path.join(root, 'src/components/questions/QuestionVisual.jsx'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'src/styles/style.css'), 'utf8');
assert.ok(appSource.includes('InteractiveQuestionEngine'), 'Quiz surfaces must integrate the interactive engine.');
assert.ok(appSource.includes("supportsInteractiveQuestion } from './utils/acceptedAnswers.js'"), 'Quiz surfaces must use the lightweight interaction support gate without eagerly loading the renderer utilities.');
assert.ok(fs.readFileSync(path.join(root, 'src/utils/acceptedAnswers.js'), 'utf8').includes('if (!config) return hasSingleAcceptedOption(question)'), 'Runtime must only derive an interaction when exactly one option is accepted.');
assert.ok(appSource.includes('const smartSession = options.preserveQuestions'), 'A reviewed interactive activity must retain its prioritized question order.');
assert.ok(dashboardSource.includes('prioritizeInteractiveQuestions(interactiveActivitySource.questions)'), 'The dashboard must prioritize the reviewed interaction for an explicit practice entry point.');
assert.ok(dashboardSource.includes('const interactiveActivitySource = reviewedInteractiveActivitySource ||'), 'The dashboard must prefer a teacher-reviewed interactive topic before the automatic-choice fallback.');
assert.ok(dashboardSource.includes('(topic.questions || []).some(isInteractiveQuestion)'), 'The dashboard must discover both reviewed and safely derived interactions.');
assert.ok(dashboardSource.includes('Aktiviti Interaktif'), 'The dashboard must expose an explicit interactive-practice action.');
assert.ok((appSource.match(/interactiveQuestion \? <React\.Suspense/g) || []).length >= 2, 'Quiz and Pentaksiran must both retain an interactive/legacy branch.');
assert.ok(appSource.includes(': <input value={answer}'), 'Legacy text-input fallback must remain available.');
assert.ok(engineSource.includes('role="radiogroup"') && engineSource.includes('aria-pressed') && engineSource.includes('aria-live="polite"'), 'Renderer must expose keyboard and assistive-technology states.');
assert.ok(engineSource.includes('role="checkbox"') && engineSource.includes('hotspot-button') && engineSource.includes('money-counter'), 'Phase 2 selection, hotspot and money controls must expose semantic interactive controls.');
assert.ok(engineSource.includes('onDragStart') && engineSource.includes('onClick'), 'Drag interactions must also offer tap/click controls.');
assert.ok(engineSource.includes('useId') && engineSource.includes('aria-labelledby={instructionId}') && engineSource.includes('aria-describedby={helpId}'), 'Interactive instructions and help must be associated with the activity for assistive technology.');
assert.ok(engineSource.includes('ke atas') && engineSource.includes('ke bawah') && engineSource.includes('↑') && engineSource.includes('↓'), 'Vertical ordering must provide explicit up/down keyboard and touch controls.');
assert.ok(visualSource.includes('lang={visual.lang}') && visualSource.includes('dir={visual.dir}'), 'Arabic and Jawi symbols must expose language and reading direction metadata.');
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
