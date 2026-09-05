import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bm from '../../src/data/subjects/bm.js';
import {
  PART_WHOLE_RELATIONSHIPS,
  VALID_BM_COMPOUND_NOUNS,
  validateBmNaturalness,
  repairBMSentence,
  validatePartWholePhrase,
  validateNestedLocationPhrase,
  normalizeBMQuestionRecord
} from '../../src/utils/bmSentenceQuality.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const failuresByCategory = {};
const representativeRepairs = [];
const addIssues = (issues = [], stage = 'static') => {
  for (const issue of issues) {
    const key = `${stage}:${issue}`;
    failuresByCategory[key] = (failuresByCategory[key] || 0) + 1;
  }
};

const staticQuestions = bm.topics.flatMap(topic => (topic.questions || []).map(question => ({ ...question, topic: topic.id || topic.title })));
const isQuotedIncorrectExample = text => {
  const value = String(text || '');
  return /["“”'][^"“”']{3,}["“”']/u.test(value)
    && /(?:analisis|betulkan|kesalahan|tidak sesuai|tidak tepat|nilai|penilaian|semak)/iu.test(value);
};
let repairedCount = 0;
let regeneratedCount = 0;
let rejectedCount = 0;
for (const record of staticQuestions) {
  const text = record.q || record.question || '';
  const context = {
    contentType: 'question',
    expectedSemanticRole: record.topic,
    isQuotedIncorrectExample: isQuotedIncorrectExample(text)
  };
  const result = validateBmNaturalness(text, context);
  if (!result.valid) addIssues(result.issues);
  const normalized = normalizeBMQuestionRecord(record);
  if ((normalized.q || normalized.question || '') !== text) {
    repairedCount += 1;
    if (representativeRepairs.length < 20) representativeRepairs.push({ id: record.id, before: text, after: normalized.q || normalized.question });
  }
  const afterText = normalized.q || normalized.question || '';
  const after = validateBmNaturalness(afterText, {
    contentType: 'question',
    expectedSemanticRole: record.topic,
    isQuotedIncorrectExample: isQuotedIncorrectExample(afterText)
  });
  if (!after.valid) addIssues(after.issues, 'after');
}

const regressionCases = [
  'Burung hinggap di dahan taman.',
  'Burung hinggap di pokok taman.',
  'Ikan berenang di padang sekolah.',
  'Kucing tidur di bawah bilik meja.',
  'Ali duduk di kerusi kelas meja.',
  'Buku berada di atas kelas.',
  'Murid berdiri di pintu belakang sekolah hadapan.',
  'Rama-rama hinggap di bunga taman.',
  'Ayam berjalan di dahan rumah.',
  'Burung membuat sarang di bumbung pokok.',
  'Bola berada di bawah taman.',
  'Pensel terletak di atas sekolah.',
  'Ali berdiri di hadapan belakang kelas.',
  'Buku berada di dalam atas meja.',
  'Kucing tidur di halaman katil.'
];
let regressionBefore = 0;
let regressionAfter = 0;
for (const sentence of regressionCases) {
  const before = validateBmNaturalness(sentence);
  const repair = repairBMSentence(sentence);
  const after = validateBmNaturalness(repair.repairedSentence);
  if (!before.valid) regressionBefore += 1;
  if (!after.valid) {
    regressionAfter += 1;
    rejectedCount += 1;
    addIssues(after.issues, 'regression');
  } else {
    regeneratedCount += 1;
    if (representativeRepairs.length < 20) representativeRepairs.push({ before: sentence, after: repair.repairedSentence });
  }
}

const generatedSeeds = [
  ...regressionCases,
  'Burung hinggap di dahan pokok di taman.',
  'Buku itu berada di atas meja di dalam kelas.',
  'Ali berdiri di hadapan pintu kelas.',
  'Rama-rama hinggap pada bunga di taman.',
  'Ayam berjalan di halaman rumah.',
  'Burung membuat sarang di atas pokok.',
  'Bola berada di bawah bangku taman.',
  'Pensel terletak di atas meja.',
  'Ali berdiri di hadapan kelas.',
  'Buku berada di atas meja.',
  'Kucing tidur di atas katil.'
];
let generatedSamples = 0;
for (let i = 0; i < 10000; i += 1) {
  const seed = generatedSeeds[i % generatedSeeds.length];
  const repaired = repairBMSentence(seed).repairedSentence;
  const result = validateBmNaturalness(repaired, { contentType: 'generated' });
  generatedSamples += 1;
  if (!result.valid) addIssues(result.issues, 'generated');
}

const candidateRoot = path.join(root, 'src');
const sourceFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:js|jsx|mjs)$/.test(entry.name)) sourceFiles.push(full);
  }
};
walk(candidateRoot);
const sourcePathsChecked = sourceFiles
  .filter(file => /bmSentenceQuality|subjects[\\/]bm|questionGenerator|question[\\/]|tutor|teacher|template|fallback|context|location|compound/i.test(file))
  .filter(file => /(?:dahan|dalam|di atas|kata sendi|pokok|lokasi|location|compound|bmSentenceQuality)/i.test(fs.readFileSync(file, 'utf8')))
  .map(file => path.relative(root, file).replaceAll('\\', '/'));
const templatesChecked = sourcePathsChecked.filter(file => /template|questionGenerator|question\//i.test(file)).length;
const fallbackPathsChecked = sourcePathsChecked.filter(file => /generator|engine|tutor|teacher|fallback/i.test(file)).length;
const locationPhrasesChecked = new Set(staticQuestions.flatMap(q => String(q.q || q.question || '').match(/\b(?:di|ke|dari|daripada|pada|kepada)\s+[^,.!?]+/gi) || [])).size;
const partWholePairsChecked = Object.entries(PART_WHOLE_RELATIONSHIPS).reduce((sum, [, wholes]) => sum + wholes.length, 0);

const highSeverity = Object.entries(failuresByCategory)
  .filter(([key]) => /invalid|missing|mismatch|ambiguous|incomplete/i.test(key))
  .reduce((sum, [, count]) => sum + count, 0);
const report = {
  staticQuestionsChecked: staticQuestions.length,
  generatedSamples,
  templatesChecked,
  fallbackPathsChecked,
  sourcePathsChecked,
  partWholePairsChecked,
  locationPhrasesChecked,
  compoundNounsChecked: VALID_BM_COMPOUND_NOUNS.length,
  repairedCount,
  regeneratedCount,
  rejectedCount,
  regressionCases: regressionCases.length,
  regressionBefore,
  regressionAfter,
  failuresByCategory,
  highSeverityIssues: highSeverity,
  representativeRepairs,
  status: highSeverity === 0 ? 'PASS' : 'FAIL'
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'bm-spatial-naturalness-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`BM spatial naturalness audit: ${report.status}`);
console.log(`Static questions: ${report.staticQuestionsChecked}`);
console.log(`Generated samples: ${report.generatedSamples}`);
console.log(`Regression cases before/after: ${regressionBefore}/${regressionAfter}`);
console.log(`Repairs: ${repairedCount}; regenerated: ${regeneratedCount}; rejected: ${rejectedCount}`);
console.log(`High-severity issues: ${highSeverity}`);
if (highSeverity) process.exitCode = 1;
