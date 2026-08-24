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
assert.equal(report.summary.categories.reviewed_interactive, 72, 'Semua interaksi yang ditulis dan disemak mesti kekal dilindungi.');
assert.equal(report.summary.categories.auto_safe, 978, 'Semua soalan objektif dengan pilihan selamat mesti menerima kad pilihan automatik.');

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

const reviewedBlank = classifyInteractiveSuitability(questionMap.get('ENG-NOUNS-001'), { subjectId: 'english', topicId: 'nouns' });
assert.equal(reviewedBlank.category, 'teacher_review');
assert.equal(reviewedBlank.recommendedType, 'fillBlank');

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
