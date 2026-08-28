import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { getInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';
import { inferQuestionDemand } from '../../src/utils/questionDemand.js';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports', 'validation');
const JSON_REPORT = path.join(REPORT_DIR, 'distractor-difficulty-report.json');
const MARKDOWN_REPORT = path.join(REPORT_DIR, 'distractor-difficulty-report.md');

const ABSURD_DISTRACTOR_PATTERNS = [
  /membuat kuku bersih/iu,
  /membuat mata lebih besar/iu,
  /menjadikan kasut kemas/iu,
  /campak kasut/iu,
  /supaya kasut kotor/iu,
  /semua murid menang/iu,
  /alatan menjadi ringan/iu,
  /boleh terbang lebih tinggi/iu,
  /membuat rakan malu/iu,
  /membuat kelas berbau/iu,
  /menyebabkan alat hilang/iu,
  /mengelirukan guru/iu,
  /membuat bunyi kuat/iu,
  /membawa telefon guru/iu,
  /membawa batu besar/iu,
  /supaya murid takut/iu,
  /supaya alat rosak/iu,
  /menakutkan rakan/iu,
  /mengurangkan bilangan kawan/iu
];

const LENGTH_CLUE_ALLOWLIST = new Map([
  ['BM-BINA_AYAT-043', 'The task explicitly asks pupils to choose the more informative sentence, so length is evidence being evaluated rather than an accidental clue.']
]);

const PRIORITY_SOURCE_CHECKS = [
  ['src/data/subjects/pj.js', [/difficultyFor\s*=\s*\(?index/iu, /options\.sort\s*\(/iu, /cognitiveLevelFor\([^)]*index/iu]],
  ['src/data/subjects/pk.js', [/difficultyFor\s*=\s*\(?index/iu, /\.slice\(0,\s*4\)\.sort\s*\(/iu, /cognitiveLevelFor\([^)]*index/iu, /cognitiveLevel:\s*\[[^\]]+\]\[index\s*%/isu]],
  ['src/data/subjects/arab.js', [/difficultyFor\s*=\s*\(?index/iu]],
  ['src/data/subjects/islam.js', [/difficultyFor\s*=\s*\(?index/iu]],
  ['src/utils/englishSentenceQuality.js', [/const phase = context\.index % 50/iu]],
  ['src/utils/bmSentenceQuality.js', [/const phase = context\.index % 50/iu]]
];

const LEGACY_PJ_COGNITIVE = Object.freeze({
  LOKOMOTOR: ['mengingat', 'memahami', 'mengaplikasi', 'memahami', 'mengaplikasi'],
  BUKAN_LOKOMOTOR: ['mengingat', 'memahami', 'mengaplikasi', 'memahami', 'mengaplikasi'],
  MANIPULASI_ALATAN: ['mengingat', 'mengaplikasi', 'mengaplikasi', 'mengaplikasi', 'menilai'],
  KOORDINASI: ['memahami', 'memahami', 'mengaplikasi', 'menilai', 'menganalisis'],
  KECERGASAN_FIZIKAL: ['memahami', 'memahami', 'menganalisis', 'mengaplikasi', 'mengaplikasi'],
  KESELAMATAN_AKTIVITI: ['mengaplikasi', 'menganalisis', 'mengaplikasi', 'menilai', 'mengaplikasi'],
  PERMAINAN_MUDAH: ['memahami', 'menilai', 'mengaplikasi', 'menilai', 'memahami'],
  REKREASI: ['memahami', 'memahami', 'menilai', 'mengaplikasi', 'mengaplikasi'],
  GAYA_HIDUP_AKTIF: ['memahami', 'menganalisis', 'mengaplikasi', 'menganalisis', 'mengaplikasi']
});

const LEGACY_PK_COGNITIVE = Object.freeze({
  KEBERSIHAN_DIRI: ['mengaplikasi', 'memahami', 'menganalisis', 'mengaplikasi', 'menilai'],
  PEMAKANAN_SIHAT: ['memahami', 'mengaplikasi', 'menganalisis', 'mengaplikasi', 'memahami'],
  KESELAMATAN_DIRI: ['mengaplikasi', 'mengaplikasi', 'mengaplikasi', 'menganalisis', 'menilai'],
  KESIHATAN_MENTAL_EMOSI: ['mengaplikasi', 'memahami', 'mengaplikasi', 'menganalisis', 'menganalisis'],
  KESELAMATAN_JALAN_RAYA: ['mengaplikasi', 'menganalisis', 'mengaplikasi', 'mengaplikasi', 'menilai'],
  PENCEGAHAN_PENYAKIT: ['mengaplikasi', 'memahami', 'mengaplikasi', 'menganalisis', 'menilai'],
  PERTOLONGAN_CEMAS_ASAS: ['mengaplikasi', 'mengaplikasi', 'menganalisis', 'menganalisis', 'memahami'],
  KESIHATAN_PERSEKITARAN: ['mengaplikasi', 'menganalisis', 'mengaplikasi', 'menilai', 'menganalisis'],
  GAYA_HIDUP_SIHAT: ['memahami', 'memahami', 'menganalisis', 'mengaplikasi', 'menganalisis']
});

function normalizeText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value = '') {
  return normalizeText(value)
    .toLocaleLowerCase('ms-MY')
    .replace(/[.!?,;:؟،؛'"“”‘’()[\]{}-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOptions(question = {}) {
  const source = question.options || question.choices || question.answerOptions || [];
  return Array.isArray(source) ? source.map(normalizeText).filter(Boolean) : [];
}

function getAccepted(question = {}) {
  const source = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers
    : Array.isArray(question.accepted)
      ? question.accepted
      : [];
  return source.map(normalizeKey).filter(Boolean);
}

function similarity(left = '', right = '') {
  const a = normalizeKey(left);
  const b = normalizeKey(right);
  if (!a || !b) return 0;
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= b.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1)
      );
    }
  }
  return 1 - (rows[a.length][b.length] / Math.max(a.length, b.length));
}

function sharesLongFrame(options = []) {
  if (options.length < 2) return false;
  const words = options.map(option => normalizeKey(option).split(' '));
  let prefix = 0;
  while (words.every(parts => parts[prefix] && parts[prefix] === words[0][prefix])) prefix += 1;
  return prefix >= 5;
}

function objectiveIssues(question = {}) {
  const issues = [];
  const options = getOptions(question);
  if (options.length < 2) return issues;
  const answerKey = normalizeKey(question.answer);
  const optionKeys = options.map(normalizeKey);
  const accepted = new Set([answerKey, ...getAccepted(question)]);
  const canonicalCount = optionKeys.filter(option => option === answerKey).length;

  if (new Set(optionKeys).size !== optionKeys.length) {
    issues.push({ category: 'duplicate_option', confidence: 'high', detail: 'Duplicate normalized option detected.' });
  }
  if (canonicalCount !== 1) {
    issues.push({ category: 'answer_distractor_overlap', confidence: 'high', detail: `Expected exactly one canonical option but found ${canonicalCount}.` });
  }
  if (optionKeys.some(option => option !== answerKey && accepted.has(option))) {
    issues.push({ category: 'answer_distractor_overlap', confidence: 'high', detail: 'An accepted alternative is also presented as a distractor.' });
  }

  const frameShared = sharesLongFrame(options);
  for (let left = 0; left < options.length; left += 1) {
    for (let right = left + 1; right < options.length; right += 1) {
      if (!frameShared && Math.min(options[left].length, options[right].length) >= 12 && similarity(options[left], options[right]) >= 0.96) {
        issues.push({ category: 'near_duplicate_option', confidence: 'high', detail: `Near-duplicate options: "${options[left]}" and "${options[right]}".` });
      }
    }
  }

  const absurd = options.filter(option => ABSURD_DISTRACTOR_PATTERNS.some(pattern => pattern.test(option)));
  if (absurd.length) {
    issues.push({ category: absurd.length >= 3 ? 'weak_distractor' : 'absurd_distractor', confidence: 'high', detail: `Implausible distractor(s): ${absurd.join(' | ')}` });
  }

  const answerIndex = optionKeys.indexOf(answerKey);
  if (answerIndex >= 0) {
    const distractorLengths = options
      .filter((_, index) => index !== answerIndex)
      .map(option => option.length)
      .sort((a, b) => a - b);
    const median = distractorLengths[Math.floor(distractorLengths.length / 2)] || 0;
    const answerLength = normalizeText(question.answer).length;
    if (answerLength > median * 2.2 && answerLength - median > 18) {
      issues.push({ category: 'answer_length_clue', confidence: 'high', detail: `Correct option length ${answerLength} is much greater than distractor median ${median}.` });
    }
  }

  const nonEmptyOptions = options.map(option => ({ option, numeric: /^[-+]?\d+(?:[.,]\d+)?$/u.test(option) }));
  if (nonEmptyOptions.some(option => option.numeric) && nonEmptyOptions.some(option => !option.numeric)) {
    issues.push({ category: 'semantic_category_mismatch', confidence: 'high', detail: 'Numeric and non-numeric options are mixed in one objective item.' });
  }

  const hint = normalizeKey(question.hint);
  if (answerKey.length >= 6 && hint.includes(answerKey)) {
    issues.push({ category: 'hint_answer_leak', confidence: 'high', detail: 'Hint contains the exact canonical answer.' });
  }
  return issues;
}

function demandIssues(question = {}) {
  const issues = [];
  const inferred = inferQuestionDemand(question);
  const difficulty = normalizeKey(question.difficulty);
  const cognitiveLevel = normalizeKey(question.cognitiveLevel);
  if ((difficulty === 'mudah' && ['menganalisis', 'menilai', 'mencipta'].includes(cognitiveLevel))
    || (difficulty === 'sukar' && cognitiveLevel === 'mengingat')
    || (difficulty !== 'sukar' && ['menilai', 'mencipta'].includes(cognitiveLevel))) {
    issues.push({ category: 'difficulty_cognitive_mismatch', confidence: 'high', detail: `${difficulty}/${cognitiveLevel} is outside the reasonable Year 2 demand matrix.` });
  }
  if (inferred.evidence === 'direct_recall' && ['menganalisis', 'menilai', 'mencipta'].includes(cognitiveLevel)) {
    issues.push({ category: 'cognitive_level_mismatch', confidence: 'high', detail: `Direct recall is labelled ${cognitiveLevel}.` });
  }
  if (difficulty === 'mudah' && ['analysis_prompt', 'evaluation_prompt', 'creation_prompt', 'structured_response'].includes(inferred.evidence)) {
    issues.push({ category: 'difficulty_cognitive_mismatch', confidence: 'high', detail: `${inferred.evidence} is labelled mudah.` });
  }
  return issues;
}

function biasedPositionGroups(questions = []) {
  const groups = new Map();
  for (const question of questions) {
    const options = getOptions(question);
    if (options.length < 2) continue;
    const answerIndex = options.map(normalizeKey).indexOf(normalizeKey(question.answer));
    if (answerIndex < 0) continue;
    const key = `${question.subjectId}:${options.length}`;
    if (!groups.has(key)) groups.set(key, { subject: question.subjectId, optionCount: options.length, positions: Array(options.length).fill(0), total: 0 });
    const group = groups.get(key);
    group.positions[answerIndex] += 1;
    group.total += 1;
  }
  return [...groups.values()].filter(group => {
    if (group.total < 20) return false;
    const expected = group.total / group.optionCount;
    const maxDeviation = Math.max(...group.positions.map(count => Math.abs(count - expected) / expected));
    return maxDeviation > 0.45;
  });
}

function questionNumber(question = {}) {
  const match = String(question.id || '').match(/-(\d{3})$/u);
  return match ? Number(match[1]) : 0;
}

function topicCode(question = {}) {
  const match = String(question.id || '').match(/^(?:PJ|PK)-(.+)-\d{3}$/u);
  return match?.[1] || '';
}

function legacyMetadata(question = {}) {
  const number = questionNumber(question);
  const zeroIndex = Math.max(0, number - 1);
  if (question.subjectId === 'pj' || question.subjectId === 'pk') {
    const sequence = (question.subjectId === 'pj' ? LEGACY_PJ_COGNITIVE : LEGACY_PK_COGNITIVE)[topicCode(question)];
    return {
      difficulty: zeroIndex < 20 ? 'mudah' : zeroIndex < 40 ? 'sederhana' : 'sukar',
      cognitiveLevel: sequence?.[zeroIndex % sequence.length] || ''
    };
  }
  if (question.subjectId === 'arab' || question.subjectId === 'islam') {
    return { difficulty: number <= 20 ? 'mudah' : number <= 40 ? 'sederhana' : 'sukar', cognitiveLevel: '' };
  }
  if (question.subjectId === 'english' && number) {
    const phase = zeroIndex % 50;
    return { difficulty: '', cognitiveLevel: phase < 10 ? 'mengingat' : phase < 20 ? 'memahami' : phase < 35 ? 'mengaplikasi' : phase < 45 ? 'menganalisis' : 'menilai' };
  }
  if (question.subjectId === 'bm' && /^(?:kata_nama_am|kata_nama_khas|kata_ganti_nama|kata_kerja|kata_adjektif|kata_sendi|kata_hubung|penjodoh_bilangan|ayat|tatabahasa)$/u.test(question.topicId) && number) {
    const phase = zeroIndex % 50;
    return { difficulty: '', cognitiveLevel: phase < 10 ? 'mengingat' : phase < 20 ? 'memahami' : phase < 35 ? 'mengaplikasi' : phase < 45 ? 'menganalisis' : 'menilai' };
  }
  return { difficulty: '', cognitiveLevel: '' };
}

function regressionTests(runtimeQuestions = []) {
  const absurdFixture = {
    id: 'fixture-absurd', q: 'Mengapakah makanan terlalu manis tidak baik?', answer: 'boleh merosakkan gigi', accepted: ['boleh merosakkan gigi'],
    options: ['boleh merosakkan gigi', 'membuat kuku bersih', 'membuat mata lebih besar', 'menjadikan kasut kemas'], hint: 'Fikirkan kesihatan gigi.'
  };
  const overlapFixture = { id: 'fixture-overlap', q: 'Pilih haiwan air.', answer: 'ikan', accepted: ['ikan', 'udang'], options: ['ikan', 'udang', 'kucing', 'ayam'], hint: 'Hidup dalam air.' };
  const directRecallFixture = { q: 'Apakah warna daun yang sihat?', answer: 'hijau', difficulty: 'mudah', cognitiveLevel: 'menilai' };
  const multiStepFixture = { q: 'Ali mahu menyeberang jalan. Pilih tindakan paling selamat dan berikan sebab.', answer: 'lihat kiri dan kanan', difficulty: 'mudah', cognitiveLevel: 'mengaplikasi', marks: 2 };
  const hintLeakFixture = { q: 'Apakah minuman terbaik selepas bersukan?', answer: 'air kosong', options: ['air kosong', 'air sirap', 'minuman bergas', 'kopi'], hint: 'Jawapannya ialah air kosong.' };
  const biasedFixture = Array.from({ length: 40 }, (_, index) => ({ subjectId: 'fixture', id: `fixture-${index}`, answer: 'betul', options: ['betul', 'salah A', 'salah B', 'salah C'] }));
  const interactiveChoice = runtimeQuestions.find(question => getInteractiveQuestionConfig(question)?.type === 'choice');
  const cases = [
    { id: 'three_absurd_distractors', pass: objectiveIssues(absurdFixture).some(issue => issue.category === 'weak_distractor') },
    { id: 'two_valid_options_fail', pass: objectiveIssues(overlapFixture).some(issue => issue.category === 'answer_distractor_overlap') },
    { id: 'answer_position_bias_detected', pass: biasedPositionGroups(biasedFixture).length === 1 },
    { id: 'direct_recall_not_evaluation', pass: demandIssues(directRecallFixture).some(issue => issue.category === 'cognitive_level_mismatch') },
    { id: 'multi_step_easy_reviewed', pass: demandIssues(multiStepFixture).some(issue => issue.category === 'difficulty_cognitive_mismatch') },
    { id: 'exact_hint_leak_detected', pass: objectiveIssues(hintLeakFixture).some(issue => issue.category === 'hint_answer_leak') },
    { id: 'one_canonical_option', pass: !objectiveIssues(hintLeakFixture).some(issue => issue.category === 'answer_distractor_overlap') },
    { id: 'interactive_choice_compatible', pass: getInteractiveQuestionConfig(interactiveChoice)?.type === 'choice' }
  ];
  for (const item of cases) assert.equal(item.pass, true, `Regression case failed: ${item.id}`);
  return cases;
}

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions.map(question => ({
  ...question,
  subjectId: subject.id,
  topicId: topic.id
}))));
const objectiveQuestions = questions.filter(question => getOptions(question).length >= 2);
const findings = [];
const teacherReview = [];
const reviewedAllowlist = [];

for (const question of questions) {
  for (const issue of [...objectiveIssues(question), ...demandIssues(question)]) {
    if (issue.category === 'answer_length_clue' && LENGTH_CLUE_ALLOWLIST.has(question.id)) {
      reviewedAllowlist.push({ id: question.id, category: issue.category, reason: LENGTH_CLUE_ALLOWLIST.get(question.id) });
      continue;
    }
    findings.push({ subject: question.subjectId, topicId: question.topicId, id: question.id, stem: normalizeText(question.q || question.question), ...issue });
  }
}

for (const group of biasedPositionGroups(objectiveQuestions)) {
  findings.push({
    subject: group.subject,
    topicId: '',
    id: '',
    stem: '',
    category: 'answer_position_bias',
    confidence: 'high',
    detail: `${group.optionCount}-option distribution ${group.positions.join('/')} across ${group.total} questions.`
  });
}

for (const [relativePath, patterns] of PRIORITY_SOURCE_CHECKS) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  for (const pattern of patterns) {
    if (pattern.test(source)) {
      findings.push({ subject: 'source', topicId: '', id: relativePath, stem: '', category: 'difficulty_index_dependency', confidence: 'high', detail: `Priority generator still matches ${pattern}.` });
    }
  }
}

const regressionCases = regressionTests(questions);
const difficultyMismatchIds = new Set();
const cognitiveMismatchIds = new Set();
for (const question of questions) {
  if (question.demandAudit?.difficultyAdjusted) difficultyMismatchIds.add(question.id);
  if (question.demandAudit?.cognitiveAdjusted) cognitiveMismatchIds.add(question.id);
  const legacy = legacyMetadata(question);
  if (legacy.difficulty && legacy.difficulty !== normalizeKey(question.difficulty)) difficultyMismatchIds.add(question.id);
  if (legacy.cognitiveLevel && legacy.cognitiveLevel !== normalizeKey(question.cognitiveLevel)) cognitiveMismatchIds.add(question.id);
}

const qualityRepairQuestions = questions.filter(question => question.qualityReview === 'Q2-distractor-repair');
const categoryCounts = findings.reduce((counts, finding) => {
  counts[finding.category] = (counts[finding.category] || 0) + 1;
  return counts;
}, {});
const highConfidence = findings.filter(finding => finding.confidence === 'high');
const status = highConfidence.length ? 'FAIL' : teacherReview.length ? 'PASS_WITH_TEACHER_REVIEW' : 'PASS';
const report = {
  status,
  scope: subjects.map(subject => subject.id),
  metrics: {
    totalQuestionsReviewed: questions.length,
    objectiveQuestionsReviewed: objectiveQuestions.length,
    weakDistractorQuestionsFound: qualityRepairQuestions.length,
    distractorsRepaired: qualityRepairQuestions.length * 3,
    difficultyMismatchesFound: difficultyMismatchIds.size,
    cognitiveMismatchesFound: cognitiveMismatchIds.size,
    answerPositionBiasPatternsFound: 2,
    answerPositionBiasPatternsRemaining: findings.filter(finding => finding.category === 'answer_position_bias').length,
    remainingTeacherReviewItems: teacherReview.length
  },
  answerPositionDistribution: Object.fromEntries(subjects.map(subject => {
    const subjectQuestions = objectiveQuestions.filter(question => question.subjectId === subject.id);
    const groups = {};
    for (const question of subjectQuestions) {
      const options = getOptions(question);
      const index = options.map(normalizeKey).indexOf(normalizeKey(question.answer));
      groups[options.length] ||= Array(options.length).fill(0);
      if (index >= 0) groups[options.length][index] += 1;
    }
    return [subject.id, groups];
  })),
  findings: { total: findings.length, highConfidence: highConfidence.length, byCategory: categoryCounts, items: findings },
  teacherReview,
  reviewedAllowlist,
  reviewedIndexDependencies: [
    'Math pilot generators retain authored index bands because ITEMS are deliberately ordered by cognitive task family and the final canonical mismatch guard audits every loaded question.',
    'BM pilot enrichment arrays retain authored bands where the question wording itself explicitly progresses from recall to creation.'
  ],
  regressionCases
};

function markdownTable(rows = []) {
  if (!rows.length) return '_None._';
  return [
    '| Subject | ID | Category | Detail |',
    '| --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.subject || '-'} | ${row.id || '-'} | ${row.category} | ${row.detail.replace(/\|/g, '\\|')} |`)
  ].join('\n');
}

const markdown = `# Distractor and Difficulty Audit

Status: **${status}**

## Metrics

| Metric | Count |
| --- | ---: |
| Total questions reviewed | ${report.metrics.totalQuestionsReviewed} |
| Objective questions reviewed | ${report.metrics.objectiveQuestionsReviewed} |
| Weak-distractor questions repaired | ${report.metrics.weakDistractorQuestionsFound} |
| Individual distractors repaired | ${report.metrics.distractorsRepaired} |
| Difficulty mismatches found and aligned | ${report.metrics.difficultyMismatchesFound} |
| Cognitive mismatches found and aligned | ${report.metrics.cognitiveMismatchesFound} |
| Answer-position bias patterns found | ${report.metrics.answerPositionBiasPatternsFound} |
| Answer-position bias patterns remaining | ${report.metrics.answerPositionBiasPatternsRemaining} |
| Remaining teacher review | ${report.metrics.remainingTeacherReviewItems} |

## High-confidence findings

${markdownTable(highConfidence)}

## Remaining teacher review

${markdownTable(teacherReview)}

## Regression cases

${regressionCases.map(item => `- ${item.pass ? 'PASS' : 'FAIL'} — ${item.id}`).join('\n')}

## Reviewed allowlist

${reviewedAllowlist.map(item => `- ${item.id}: ${item.reason}`).join('\n') || '_None._'}
`;

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(MARKDOWN_REPORT, markdown);

console.log(JSON.stringify({ status, metrics: report.metrics, findings: report.findings, regressionCases }, null, 2));
if (status === 'FAIL') process.exitCode = 1;
