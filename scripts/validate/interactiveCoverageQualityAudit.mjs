import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { classifyInteractiveSuitability } from '../../src/ai/question/interactiveSuitability.js';
import {
  getInteractiveQuestionConfig,
  serializeDragDropResponse,
  serializeMatchingResponse,
  serializeMoneyResponse,
  serializeMultiSelectResponse,
  serializeOrderingResponse,
  validateInteractiveQuestionConfig
} from '../../src/utils/interactiveQuestion.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '../..');
const outputDirectory = path.join(root, 'reports/validation');
const subjects = await loadAllSubjects();
const visualTypes = new Set(['imageChoice', 'visualMath', 'hotspot', 'clock', 'money', 'measurement']);
const singleChoiceTypes = new Set(['choice', 'imageChoice', 'visualMath', 'fillBlank', 'clock', 'measurement']);
const q4Ids = new Set([
  'BM-KATA_NAMA_AM-002', 'BM-KATA_KERJA-003', 'BM-PENJODOH_BILANGAN-002',
  'MATH-MASA-PILOT-007', 'MATH-BENTUK-PILOT-003',
  'ENG-NOUNS-001', 'ENG-ANIMALS-004', 'ENG-SENTENCES-001',
  'SAINS-HAIWAN-011', 'SAINS-TUMBUHAN-001', 'SAINS-BAHAN-001',
  'ARAB-HURUF_HIJAIYAH-001', 'ARAB-WARNA_ARAB-001', 'ISLAM-JAWI-001',
  'PJ-PERGERAKAN_ASAS-032'
]);
const batch1Ids = new Set([
  'MATH-BENTUK-PILOT-004', 'MATH-BENTUK-PILOT-006', 'MATH-BENTUK-PILOT-009',
  'MATH-MASA-PILOT-009', 'MATH-WANG-PILOT-010',
  'MATH-PANJANG-PILOT-004', 'MATH-PANJANG-PILOT-005', 'MATH-PANJANG-PILOT-010',
  'SAINS-HAIWAN-012', 'SAINS-HAIWAN-013', 'SAINS-HAIWAN-014',
  'SAINS-TUMBUHAN-003', 'SAINS-TUMBUHAN-004',
  'SAINS-MANUSIA-002', 'SAINS-MANUSIA-003'
]);
const batch2Ids = new Set([
  'MATH-NOMBOR-PILOT-004', 'MATH-NOMBOR-PILOT-009', 'MATH-NOMBOR-PILOT-010',
  'MATH-NOMBOR-PILOT-017', 'MATH-NOMBOR-PILOT-018', 'MATH-NOMBOR-PILOT-029',
  'MATH-PANJANG-PILOT-006', 'MATH-MASA-PILOT-001', 'MATH-WANG-PILOT-003',
  'SAINS-MANUSIA-004', 'SAINS-MANUSIA-005',
  'SAINS-HAIWAN-015', 'SAINS-HAIWAN-016',
  'SAINS-TUMBUHAN-005', 'SAINS-TUMBUHAN-021'
]);
const languageFillBlankBatch3Ids = new Set([
  'BM-KATA_SENDI-002', 'BM-KATA_HUBUNG-003', 'BM-TATABAHASA-018', 'BM-SIMPULAN_BAHASA-021',
  'ENG-NOUNS-004', 'ENG-COLOURS-001', 'ENG-ANIMALS-003', 'ENG-FOOD-003',
  'ARAB-NOMBOR_ARAB-001', 'ARAB-HAIWAN_ARAB-001', 'ARAB-AYAT_MUDAH_ARAB-001', 'ARAB-HIWAR-004',
  'ISLAM-IBADAH-001', 'ISLAM-SIRAH-001', 'ISLAM-QURAN-003', 'ISLAM-ADAB-001'
]);
const scienceFillBlankPilotIds = new Set([
  'SAINS-HAIWAN-001', 'SAINS-TUMBUHAN-043',
  'SAINS-MANUSIA-031', 'SAINS-AIR-005',
  'SAINS-CAHAYA-028', 'SAINS-BUNYI-041',
  'SAINS-BUMI-008', 'SAINS-BAHAN-025',
  'SAINS-TEKNOLOGI-031', 'SAINS-KEMAHIRAN_SAINTIFIK-025'
]);
const scienceChoiceMiniPilotIds = new Set([
  'SAINS-TUMBUHAN-050', 'SAINS-MANUSIA-050', 'SAINS-BUNYI-035',
  'SAINS-TEKNOLOGI-021', 'SAINS-TEKNOLOGI-023', 'SAINS-TEKNOLOGI-026'
]);
const rejectedScienceChoiceIds = new Set(['SAINS-CAHAYA-050', 'SAINS-TEKNOLOGI-028']);
const equalGroupsPilotIds = new Set([
  'MATH-DARAB-PILOT-002', 'MATH-DARAB-PILOT-004',
  'MATH-DARAB-PILOT-006', 'MATH-DARAB-PILOT-008',
  'MATH-BAHAGI-PILOT-004', 'MATH-BAHAGI-PILOT-007',
  'MATH-BAHAGI-PILOT-009', 'MATH-BAHAGI-PILOT-047'
]);
const arrayPilotIds = new Set([
  'MATH-DARAB-PILOT-003', 'MATH-DARAB-PILOT-005'
]);
const numberLinePilotIds = new Set([
  'MATH-DARAB-PILOT-009', 'MATH-DARAB-PILOT-020',
  'MATH-DARAB-PILOT-025', 'MATH-DARAB-PILOT-032',
  'MATH-DARAB-PILOT-033', 'MATH-BAHAGI-PILOT-008',
  'MATH-BAHAGI-PILOT-025'
]);

function metricTemplate() {
  return {
    total: 0,
    standard: 0,
    interactive: 0,
    authoredInteractive: 0,
    derivedInteractive: 0,
    visual: 0,
    matching: 0,
    ordering: 0,
    dragDrop: 0,
    fillBlank: 0,
    imageChoice: 0,
    teacherReview: 0,
    mobileUnsafe: 0,
    accessibilityRisk: 0
  };
}

function addMetric(metrics, row) {
  metrics.total += 1;
  metrics.standard += row.interactive ? 0 : 1;
  metrics.interactive += row.interactive ? 1 : 0;
  metrics.authoredInteractive += row.authoredInteractive ? 1 : 0;
  metrics.derivedInteractive += row.derivedInteractive ? 1 : 0;
  metrics.visual += row.visual ? 1 : 0;
  metrics.matching += row.interactionType === 'matching' ? 1 : 0;
  metrics.ordering += row.interactionType === 'ordering' ? 1 : 0;
  metrics.dragDrop += row.interactionType === 'dragDrop' ? 1 : 0;
  metrics.fillBlank += row.interactionType === 'fillBlank' ? 1 : 0;
  metrics.imageChoice += row.interactionType === 'imageChoice' ? 1 : 0;
  metrics.teacherReview += row.classification === 'TEACHER_REVIEW' ? 1 : 0;
  metrics.mobileUnsafe += row.mobileIssues.length ? 1 : 0;
  metrics.accessibilityRisk += row.accessibilityIssues.length ? 1 : 0;
  return metrics;
}

function visualNodes(config = {}) {
  return [
    config.visual,
    ...(config.options || []).map(option => option.visual),
    ...(config.items || []).map(item => item.visual)
  ].filter(Boolean);
}

function hasSemanticVisualLabel(visual = {}) {
  if (String(visual.label || '').trim()) return true;
  return ['equalGroups', 'numberLine', 'array', 'placeValue', 'ruler'].includes(visual.kind);
}

function normalized(value) {
  return String(value || '').trim().toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ');
}

function acceptedAnswers(question = {}) {
  return [...new Set([question.answer, ...(question.accepted || [])].map(normalized).filter(Boolean))];
}

function hiddenVisualAnswerLeak(question, config) {
  const accepted = acceptedAnswers(question).filter(answer => answer.length >= 2);
  return (config.options || []).some(option => {
    if (!option.visual || smartCheck(option.value, question).status !== 'correct') return false;
    const visibleLabel = normalized(option.label);
    const semanticLabel = normalized(option.visual.label);
    const genericVisibleLabel = /^(?:jam|kad|pilihan|gambar|simbol)\s*[a-z0-9]+$/i.test(visibleLabel);
    return genericVisibleLabel && accepted.some(answer => semanticLabel.includes(answer));
  });
}

function mobileIssuesFor(config) {
  if (!config) return [];
  const issues = validateInteractiveQuestionConfig(config).map(issue => `schema:${issue}`);
  if ((config.options || []).length > 6) issues.push('too_many_options_for_mobile');
  if ((config.items || []).length > 6) issues.push('too_many_items_for_mobile');
  if ((config.targets || []).length > 6) issues.push('too_many_targets_for_mobile');
  if ((config.zones || []).length > 4) issues.push('too_many_drop_zones_for_mobile');
  return [...new Set(issues)];
}

function accessibilityIssuesFor(question, config) {
  if (!config) return [];
  const issues = [];
  if (!String(config.instruction || '').trim()) issues.push('missing_instruction');
  if (visualNodes(config).some(visual => !hasSemanticVisualLabel(visual))) issues.push('visual_missing_semantic_label');
  if (visualNodes(config).some(visual => /[\u0600-\u06ff]/u.test(String(visual.symbol || ''))
    && (visual.lang !== 'ar' || visual.dir !== 'rtl'))) issues.push('arabic_or_jawi_missing_language_direction');
  if (hiddenVisualAnswerLeak(question, config)) issues.push('hidden_visual_label_reveals_answer');
  if (config.type === 'ordering' && !(config.items || []).every(item => String(item.label || '').trim())) issues.push('ordering_item_missing_name');
  return [...new Set(issues)];
}

function serializeAuthoredSolution(question, config) {
  if (singleChoiceTypes.has(config.type)) {
    const correctOptions = (config.options || []).filter(option => smartCheck(option.value, question).status === 'correct');
    return correctOptions.length === 1 ? String(correctOptions[0].value) : '';
  }
  if (config.type === 'ordering') return serializeOrderingResponse(config, config.correctOrder);
  if (config.type === 'multiSelect') return serializeMultiSelectResponse(config, config.correctOptionIds);
  if (config.type === 'matching') {
    return serializeMatchingResponse(config, Object.fromEntries(config.items.map(item => [item.id, item.targetId])));
  }
  if (config.type === 'dragDrop') {
    const assignments = {};
    for (const zone of config.zones || []) for (const itemId of zone.acceptedItemIds || []) assignments[itemId] = zone.id;
    return serializeDragDropResponse(config, assignments);
  }
  if (config.type === 'hotspot') {
    return String(config.hotspots.find(hotspot => hotspot.id === config.correctHotspotId)?.value || '');
  }
  if (config.type === 'money') return serializeMoneyResponse(config.targetSen);
  return '';
}

const rows = [];
for (const subject of subjects) {
  for (const topic of subject.topics || []) {
    for (const question of topic.questions || []) {
      const config = getInteractiveQuestionConfig(question);
      const suitability = classifyInteractiveSuitability(question, { subjectId: subject.id, topicId: topic.id });
      const classification = config
        ? 'AUTO_SAFE'
        : suitability.category === 'teacher_review'
          ? 'TEACHER_REVIEW'
          : 'KEEP_STANDARD';
      const interactionType = config?.type || 'standard';
      const row = {
        questionId: question.id,
        subjectId: subject.id,
        subjectTitle: subject.title,
        topicId: topic.id,
        topicTitle: topic.title,
        questionType: question.questionType || question.type || 'unspecified',
        classification,
        suitabilityCategory: suitability.category,
        recommendedType: suitability.recommendedType,
        interactionType,
        interactive: Boolean(config),
        authoredInteractive: Boolean(question.interaction),
        derivedInteractive: Boolean(config && !question.interaction),
        visual: Boolean(config && (visualTypes.has(config.type) || visualNodes(config).length)),
        mobileIssues: mobileIssuesFor(config),
        accessibilityIssues: accessibilityIssuesFor(question, config)
      };
      rows.push(row);
    }
  }
}

function breakdownBy(key, labelKeys = []) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key] || 'unspecified';
    if (!map.has(value)) {
      map.set(value, {
        [key]: value,
        ...Object.fromEntries(labelKeys.map(labelKey => [labelKey, row[labelKey]])),
        ...metricTemplate()
      });
    }
    addMetric(map.get(value), row);
  }
  return [...map.values()].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
}

const topicMap = new Map();
for (const row of rows) {
  const key = `${row.subjectId}/${row.topicId}`;
  if (!topicMap.has(key)) topicMap.set(key, {
    subjectId: row.subjectId,
    subjectTitle: row.subjectTitle,
    topicId: row.topicId,
    topicTitle: row.topicTitle,
    ...metricTemplate()
  });
  addMetric(topicMap.get(key), row);
}

const summary = rows.reduce(addMetric, metricTemplate());
const classifications = rows.reduce((counts, row) => {
  counts[row.classification] = (counts[row.classification] || 0) + 1;
  return counts;
}, { AUTO_SAFE: 0, TEACHER_REVIEW: 0, KEEP_STANDARD: 0 });
const engineSource = fs.readFileSync(path.join(root, 'src/components/questions/InteractiveQuestionEngine.jsx'), 'utf8');
const visualSource = fs.readFileSync(path.join(root, 'src/components/questions/QuestionVisual.jsx'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'src/styles/style.css'), 'utf8');
const globalAccessibilityChecks = {
  labelledActivity: engineSource.includes('aria-labelledby={instructionId}') && engineSource.includes('aria-describedby={helpId}'),
  keyboardChoice: engineSource.includes("['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']"),
  dragTapFallback: engineSource.includes('selectedItemId') && engineSource.includes('onDragStart') && engineSource.includes('onClick'),
  orderingButtonFallback: engineSource.includes('ke atas') && engineSource.includes('ke bawah'),
  semanticSelectionRoles: engineSource.includes('role="radiogroup"') && engineSource.includes('role="checkbox"'),
  liveProgress: engineSource.includes('aria-live="polite"'),
  arabicDirection: visualSource.includes('lang={visual.lang}') && visualSource.includes('dir={visual.dir}'),
  visibleFocus: styleSource.includes('button:focus-visible') && styleSource.includes('.interactive-choice:focus-visible'),
  reducedMotion: styleSource.includes('@media (prefers-reduced-motion: reduce)')
};
const mobileViewportChecks = [320, 375, 430].map(width => ({
  width,
  responsiveRulePresent: styleSource.includes('@media (max-width: 650px)'),
  singleColumnChoices: styleSource.includes('.interactive-choice-grid,') && styleSource.includes('grid-template-columns: 1fr;'),
  minimumTouchTarget: styleSource.includes('min-height: 48px')
}));

for (const question of subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions)).filter(question => question.interaction)) {
  const solution = serializeAuthoredSolution(question, question.interaction);
  assert.ok(solution, `${question.id} must expose a complete reviewed solution.`);
  assert.equal(smartCheck(solution, question).status, 'correct', `${question.id} reviewed interaction must preserve an accepted original answer.`);
}

assert.equal(rows.length, 4530, 'Interactive content conversion must not add or remove bank questions.');
assert.deepEqual(classifications, { AUTO_SAFE: 1208, TEACHER_REVIEW: 2714, KEEP_STANDARD: 608 }, 'Every question must follow exactly one approved interactive-content decision path.');
assert.equal(summary.authoredInteractive, 216, 'All reviewed authored interactions must be counted once.');
assert.equal(summary.derivedInteractive, 992, 'Only safe existing objective options may be derived automatically.');
assert.equal(summary.interactive, 1208, 'Reviewed and derived interactions must be counted exactly once.');
assert.equal(summary.standard, 3322, 'All remaining questions must stay on the standard response path.');
assert.equal(summary.mobileUnsafe, 0, 'No published interaction may fail the static mobile-safety contract.');
assert.equal(summary.accessibilityRisk, 0, 'No published interaction may have a known per-question accessibility risk.');
assert.ok(Object.values(globalAccessibilityChecks).every(Boolean), 'The interactive engine must satisfy every global accessibility contract.');
assert.ok(mobileViewportChecks.every(check => check.responsiveRulePresent && check.singleColumnChoices && check.minimumTouchTarget), 'The 320px, 375px and 430px mobile contracts must be present.');
assert.ok([...q4Ids].every(id => rows.find(row => row.questionId === id)?.classification === 'AUTO_SAFE'), 'Every selected Q4 conversion must be valid and teacher reviewed.');
assert.equal(batch1Ids.size, 15, 'Interactive Content Batch 1 must contain exactly fifteen approved question IDs.');
assert.ok([...batch1Ids].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Interactive Content Batch 1 question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(batch2Ids.size, 15, 'Interactive Content Batch 2 must contain exactly fifteen approved question IDs.');
assert.equal(new Set([...batch1Ids, ...batch2Ids]).size, 30, 'Interactive Content Batches 1 and 2 must not contain duplicate IDs.');
assert.ok([...batch2Ids].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Interactive Content Batch 2 question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(languageFillBlankBatch3Ids.size, 16, 'Language FillBlank Batch 3 must contain exactly sixteen approved question IDs.');
assert.equal(new Set([...batch1Ids, ...batch2Ids, ...languageFillBlankBatch3Ids]).size, batch1Ids.size + batch2Ids.size + languageFillBlankBatch3Ids.size, 'Language FillBlank Batch 3 must remain disjoint from Interactive Content Batches 1 and 2.');
assert.ok([...languageFillBlankBatch3Ids].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactionType === 'fillBlank'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Language FillBlank Batch 3 question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(scienceFillBlankPilotIds.size, 10, 'Science FillBlank Pilot must contain exactly ten approved question IDs.');
assert.equal(
  new Set([...batch1Ids, ...batch2Ids, ...languageFillBlankBatch3Ids, ...scienceFillBlankPilotIds, ...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds]).size,
  batch1Ids.size + batch2Ids.size + languageFillBlankBatch3Ids.size + scienceFillBlankPilotIds.size + equalGroupsPilotIds.size + arrayPilotIds.size + numberLinePilotIds.size,
  'Science FillBlank Pilot must remain disjoint from every existing content batch and visual pilot.'
);
assert.ok([...scienceFillBlankPilotIds].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactionType === 'fillBlank'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Science FillBlank Pilot question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(scienceChoiceMiniPilotIds.size, 6, 'Science Choice Mini-Pilot must contain exactly six approved question IDs.');
assert.equal(
  new Set([...batch1Ids, ...batch2Ids, ...languageFillBlankBatch3Ids, ...scienceFillBlankPilotIds, ...scienceChoiceMiniPilotIds, ...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds]).size,
  batch1Ids.size + batch2Ids.size + languageFillBlankBatch3Ids.size + scienceFillBlankPilotIds.size + scienceChoiceMiniPilotIds.size + equalGroupsPilotIds.size + arrayPilotIds.size + numberLinePilotIds.size,
  'Science Choice Mini-Pilot must remain disjoint from every existing content batch and visual pilot.'
);
assert.ok([...scienceChoiceMiniPilotIds].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactionType === 'choice'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Science Choice Mini-Pilot question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(rows.filter(row => row.subjectId === 'sains' && row.authoredInteractive).length, 43, 'Science must contain exactly 43 reviewed interactions after the Choice Mini-Pilot.');
assert.equal(rows.filter(row => row.subjectId === 'sains' && row.authoredInteractive && row.interactionType === 'choice').length, 6, 'Science must contain exactly six reviewed authored Choice interactions.');
assert.equal(rows.filter(row => row.subjectId === 'sains' && row.classification === 'TEACHER_REVIEW').length, 447, 'Science must retain exactly 447 teacher-review questions.');
for (const id of rejectedScienceChoiceIds) {
  const row = rows.find(item => item.questionId === id);
  assert.equal(row?.classification, 'TEACHER_REVIEW', `${id} must remain in teacher review.`);
  assert.equal(row?.authoredInteractive, false, `${id} must remain unauthored.`);
}
assert.equal(equalGroupsPilotIds.size, 8, 'The Equal Groups pilot must contain exactly eight approved question IDs.');
assert.ok([...equalGroupsPilotIds].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactionType === 'visualMath'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Equal Groups pilot question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(arrayPilotIds.size, 2, 'The Array pilot must contain exactly two approved question IDs.');
assert.equal(new Set([...equalGroupsPilotIds, ...arrayPilotIds, ...numberLinePilotIds]).size, equalGroupsPilotIds.size + arrayPilotIds.size + numberLinePilotIds.size, 'Equal Groups, Array and Number Line pilot IDs must remain disjoint.');
assert.ok([...arrayPilotIds].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactionType === 'visualMath'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Array pilot question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions)).filter(question => question.interaction?.visual?.kind === 'array').length, 2, 'No third question may receive an authored Array overlay in this pilot.');
assert.equal(numberLinePilotIds.size, 7, 'The Number Line pilot must contain exactly seven approved question IDs.');
assert.ok([...numberLinePilotIds].every(id => {
  const row = rows.find(item => item.questionId === id);
  return row?.classification === 'AUTO_SAFE'
    && row.interactionType === 'visualMath'
    && row.interactive
    && row.authoredInteractive
    && row.mobileIssues.length === 0
    && row.accessibilityIssues.length === 0;
}), 'Every Number Line pilot question must be authored, valid, accessible and AUTO_SAFE.');
assert.equal(rows.find(row => row.questionId === 'MATH-BAHAGI-PILOT-020')?.classification, 'TEACHER_REVIEW', 'The unsupported unknown-step division construct must remain in teacher review.');
for (const id of [
  'MATH-DARAB-PILOT-007', 'MATH-DARAB-PILOT-010', 'MATH-DARAB-PILOT-017',
  'MATH-DARAB-PILOT-021', 'MATH-DARAB-PILOT-022', 'MATH-DARAB-PILOT-023',
  'MATH-DARAB-PILOT-024', 'MATH-DARAB-PILOT-028', 'MATH-DARAB-PILOT-038',
  'MATH-DARAB-PILOT-039', 'MATH-DARAB-PILOT-040', 'MATH-DARAB-PILOT-060'
]) {
  const question = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions)).find(item => item.id === id);
  assert.notEqual(question?.interaction?.visual?.kind, 'array', `${id} must remain outside the exact two-question Array pilot.`);
}
assert.equal(rows.find(row => row.questionId === 'MATH-MASA-PILOT-021')?.classification, 'KEEP_STANDARD', 'Constructed-response time reasoning must remain standard.');

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    AUTO_SAFE: 'Interaksi telah disemak guru atau pilihan asal boleh dipaparkan secara interaktif tanpa mengubah jawapan.',
    TEACHER_REVIEW: 'Calon interaktif yang memerlukan visual, distraktor atau pemetaan manusia sebelum diterbitkan.',
    KEEP_STANDARD: 'Respons terbuka, berstruktur, KBAT atau rubrik dikekalkan bagi menjaga evidens pentaksiran.',
    dragDrop: 'Seret dan lepas hanya digunakan apabila pengelasan ialah kemahiran sebenar dan sentiasa mempunyai alternatif ketik/papan kekunci.'
  },
  summary: { ...summary, classifications },
  globalAccessibilityChecks,
  mobileViewportChecks,
  bySubject: breakdownBy('subjectId', ['subjectTitle']),
  byTopic: [...topicMap.values()].sort((left, right) => `${left.subjectId}/${left.topicId}`.localeCompare(`${right.subjectId}/${right.topicId}`)),
  byQuestionType: breakdownBy('questionType'),
  q4Conversions: rows.filter(row => q4Ids.has(row.questionId)),
  batch1Conversions: rows.filter(row => batch1Ids.has(row.questionId)),
  batch2Conversions: rows.filter(row => batch2Ids.has(row.questionId)),
  risks: rows.filter(row => row.mobileIssues.length || row.accessibilityIssues.length),
  teacherReviewQueue: rows.filter(row => row.classification === 'TEACHER_REVIEW').slice(0, 250),
  classifications: rows
};

function markdown() {
  const subjectRows = report.bySubject.map(row => `| ${row.subjectTitle} | ${row.total} | ${row.standard} | ${row.interactive} | ${row.visual} | ${row.matching} | ${row.ordering} | ${row.dragDrop} | ${row.fillBlank} | ${row.imageChoice} | ${row.teacherReview} | ${row.mobileUnsafe} | ${row.accessibilityRisk} |`).join('\n');
  const q4Rows = report.q4Conversions.map(row => `| ${row.questionId} | ${row.subjectTitle} | ${row.topicTitle} | ${row.interactionType} | ${row.classification} |`).join('\n');
  const batch1Rows = report.batch1Conversions.map(row => `| ${row.questionId} | ${row.subjectTitle} | ${row.topicTitle} | ${row.interactionType} | ${row.classification} |`).join('\n');
  const batch2Rows = report.batch2Conversions.map(row => `| ${row.questionId} | ${row.subjectTitle} | ${row.topicTitle} | ${row.interactionType} | ${row.classification} |`).join('\n');
  return `# Audit Liputan dan Kualiti Interaktif\n\n`
    + `## Ringkasan\n\n`
    + `- Jumlah soalan: ${summary.total}\n`
    + `- Standard: ${summary.standard}\n`
    + `- Interaktif: ${summary.interactive} (${summary.authoredInteractive} disemak, ${summary.derivedInteractive} auto selamat)\n`
    + `- Visual: ${summary.visual}\n`
    + `- Matching: ${summary.matching}\n`
    + `- Ordering: ${summary.ordering}\n`
    + `- Drag/drop: ${summary.dragDrop}\n`
    + `- Fill blank: ${summary.fillBlank}\n`
    + `- Image choice: ${summary.imageChoice}\n`
    + `- Teacher review: ${summary.teacherReview}\n`
    + `- Mobile unsafe: ${summary.mobileUnsafe}\n`
    + `- Accessibility risk: ${summary.accessibilityRisk}\n\n`
    + `## Pecahan subjek\n\n`
    + `| Subjek | Jumlah | Standard | Interaktif | Visual | Matching | Ordering | Drag/drop | Fill blank | Image choice | Semakan guru | Mobile tidak selamat | Risiko aksesibiliti |\n`
    + `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${subjectRows}\n\n`
    + `## Penukaran Q4 yang diluluskan\n\n`
    + `| ID | Subjek | Topik | Format | Keputusan |\n|---|---|---|---|---|\n${q4Rows}\n\n`
    + `## Interactive Content Batch 1 yang diluluskan\n\n`
    + `| ID | Subjek | Topik | Format | Keputusan |\n|---|---|---|---|---|\n${batch1Rows}\n\n`
    + `## Interactive Content Batch 2 yang diluluskan\n\n`
    + `| ID | Subjek | Topik | Format | Keputusan |\n|---|---|---|---|---|\n${batch2Rows}\n\n`
    + `## Keputusan pedagogi\n\n`
    + `- Interaksi digunakan hanya apabila tindakan murid mengukur kemahiran yang sama dengan soalan asal.\n`
    + `- Soalan berstruktur dan respons terbuka kekal standard.\n`
    + `- Label visual tidak boleh membocorkan jawapan yang disembunyikan daripada label kad.\n`
    + `- Semua visual Arab/Jawi membawa \`lang="ar"\` dan \`dir="rtl"\`.\n`
    + `- Susunan dan seret/lepas mempunyai alternatif sentuhan serta papan kekunci.\n`;
}

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, 'interactive-coverage-quality-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDirectory, 'interactive-coverage-quality-report.md'), markdown(), 'utf8');

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Interactive Coverage Quality',
  ...report.summary,
  reports: [
    'reports/validation/interactive-coverage-quality-report.json',
    'reports/validation/interactive-coverage-quality-report.md'
  ],
  questionBatchQ5Implemented: true,
  interactiveContentBatch1Implemented: true,
  interactiveContentBatch2Implemented: true
}, null, 2));
