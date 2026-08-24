import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { smartCheck } from '../../src/utils/smartCheck.js';
import {
  getInteractiveQuestionConfig,
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
const interactiveQuestions = questions.filter(question => getInteractiveQuestionConfig(question));
const byId = new Map(interactiveQuestions.map(question => [question.id, question]));
const expectedTypes = new Map([
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

assert.equal(questions.length, 4530, 'Interactive enrichment must not add or remove bank questions.');
assert.equal(interactiveQuestions.length, expectedTypes.size, 'Phases 1 and 2 must expose exactly eleven reviewed examples.');
assert.deepEqual(new Set(interactiveQuestions.map(question => question.interaction.type)), new Set(expectedTypes.values()), 'All eleven Phase 1 and Phase 2 renderer types must be represented.');

for (const [id, type] of expectedTypes) {
  const question = byId.get(id);
  assert.ok(question, `Missing interactive example ${id}.`);
  assert.equal(question.interaction.type, type, `${id} must use ${type}.`);
  assert.deepEqual(validateInteractiveQuestionConfig(question.interaction), [], `${id} has an invalid interaction schema.`);
  assert.ok(question.qualityReview?.curriculum, `${id} requires a curriculum review note.`);
  assert.ok(question.qualityReview?.assessment, `${id} requires an assessment review note.`);
  assert.ok(question.qualityReview?.textbook, `${id} requires a textbook review note.`);
}

const imageChoice = byId.get('MATH-BENTUK-PILOT-001');
assert.equal(smartCheck('3', imageChoice).status, 'correct', 'Image choice must submit an accepted canonical answer.');
assert.notEqual(smartCheck('4', imageChoice).status, 'correct', 'Image choice distractor must remain incorrect.');

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

const money = byId.get('MATH-WANG-PILOT-008');
assert.equal(serializeMoneyResponse(250), 'RM 2.50', 'Money totals must be formatted from integer sen.');
assert.equal(smartCheck(serializeMoneyResponse(250), money).status, 'correct', 'Any denomination combination totaling 250 sen must be accepted.');
assert.notEqual(smartCheck(serializeMoneyResponse(240), money).status, 'correct', 'An incorrect money total must remain incorrect.');

const measurement = byId.get('MATH-PANJANG-PILOT-018');
assert.equal(smartCheck('11 cm', measurement).status, 'correct', 'Ruler measurement must submit the accepted length.');
assert.notEqual(smartCheck('14 cm', measurement).status, 'correct', 'Reading only the ruler endpoint must remain incorrect.');

assert.ok(validateInteractiveQuestionConfig({ version: 2, type: 'imageChoice', instruction: 'x', options: [] }).length, 'Unsupported or malformed configs must be rejected.');
assert.equal(getInteractiveQuestionConfig(questions.find(question => question.id === 'BM-KATA_NAMA_AM-001')), null, 'Legacy questions must remain on the compatibility fallback.');

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const engineSource = fs.readFileSync(path.join(root, 'src/components/questions/InteractiveQuestionEngine.jsx'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'src/styles/style.css'), 'utf8');
assert.ok(appSource.includes('InteractiveQuestionEngine'), 'Quiz surfaces must integrate the interactive engine.');
assert.ok(appSource.includes('function supportsInteractiveQuestion'), 'Malformed or unsupported interaction data must fall back before rendering.');
assert.ok((appSource.match(/interactiveQuestion \? <React\.Suspense/g) || []).length >= 2, 'Quiz and Pentaksiran must both retain an interactive/legacy branch.');
assert.ok(appSource.includes(': <input value={answer}'), 'Legacy text-input fallback must remain available.');
assert.ok(engineSource.includes('role="radiogroup"') && engineSource.includes('aria-pressed') && engineSource.includes('aria-live="polite"'), 'Renderer must expose keyboard and assistive-technology states.');
assert.ok(engineSource.includes('role="checkbox"') && engineSource.includes('hotspot-button') && engineSource.includes('money-counter'), 'Phase 2 selection, hotspot and money controls must expose semantic interactive controls.');
assert.ok(engineSource.includes('onDragStart') && engineSource.includes('onClick'), 'Drag interactions must also offer tap/click controls.');
assert.ok(styleSource.includes('min-height: 48px') && styleSource.includes('@media (max-width: 650px)') && styleSource.includes('prefers-reduced-motion'), 'Touch size, mobile layout and reduced-motion support are required.');
assert.ok(styleSource.includes('.interactive-clock-svg') && styleSource.includes('.interactive-ruler-svg') && styleSource.includes('.hotspot-stage'), 'Phase 2 visuals must have scoped responsive styles.');
assert.ok(!engineSource.includes('dangerouslySetInnerHTML'), 'Question visuals must not inject unsafe HTML.');

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Interactive Question Engine Phases 1 and 2',
  questionBankCount: questions.length,
  examples: interactiveQuestions.map(question => ({ id: question.id, type: question.interaction.type })),
  legacyFallback: true,
  quizAndAssessmentIntegrated: true,
  inputModes: ['touch', 'mouse', 'keyboard']
}, null, 2));
