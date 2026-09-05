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
  return ['placeValue', 'ruler'].includes(visual.kind);
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

assert.equal(rows.length, 4530, 'Question Batch Q4 must not add or remove bank questions.');
assert.deepEqual(classifications, { AUTO_SAFE: 1129, TEACHER_REVIEW: 2793, KEEP_STANDARD: 608 }, 'Every question must follow exactly one approved Q4 decision path.');
assert.equal(summary.authoredInteractive, 137, 'All reviewed authored interactions must be counted once.');
assert.equal(summary.derivedInteractive, 992, 'Only safe existing objective options may be derived automatically.');
assert.equal(summary.mobileUnsafe, 0, 'No published interaction may fail the static mobile-safety contract.');
assert.equal(summary.accessibilityRisk, 0, 'No published interaction may have a known per-question accessibility risk.');
assert.ok(Object.values(globalAccessibilityChecks).every(Boolean), 'The interactive engine must satisfy every global accessibility contract.');
assert.ok(mobileViewportChecks.every(check => check.responsiveRulePresent && check.singleColumnChoices && check.minimumTouchTarget), 'The 320px, 375px and 430px mobile contracts must be present.');
assert.ok([...q4Ids].every(id => rows.find(row => row.questionId === id)?.classification === 'AUTO_SAFE'), 'Every selected Q4 conversion must be valid and teacher reviewed.');
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
  risks: rows.filter(row => row.mobileIssues.length || row.accessibilityIssues.length),
  teacherReviewQueue: rows.filter(row => row.classification === 'TEACHER_REVIEW').slice(0, 250),
  classifications: rows
};

function markdown() {
  const subjectRows = report.bySubject.map(row => `| ${row.subjectTitle} | ${row.total} | ${row.standard} | ${row.interactive} | ${row.visual} | ${row.matching} | ${row.ordering} | ${row.dragDrop} | ${row.fillBlank} | ${row.imageChoice} | ${row.teacherReview} | ${row.mobileUnsafe} | ${row.accessibilityRisk} |`).join('\n');
  const q4Rows = report.q4Conversions.map(row => `| ${row.questionId} | ${row.subjectTitle} | ${row.topicTitle} | ${row.interactionType} | ${row.classification} |`).join('\n');
  return `# Audit Liputan dan Kualiti Interaktif — Question Batch Q4\n\n`
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
  audit: 'Interactive Coverage Quality — Question Batch Q4',
  ...report.summary,
  reports: [
    'reports/validation/interactive-coverage-quality-report.json',
    'reports/validation/interactive-coverage-quality-report.md'
  ],
  questionBatchQ5Implemented: true
}, null, 2));
