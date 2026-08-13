import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditLearningJourneyBank,
  auditTopicJourney
} from '../../src/ai/learningJourney/learningJourneyAlignmentEngine.js';
import { loadKnowledge } from '../../src/ai/coach/knowledge/loader/knowledgeLoader.js';
import { recommendAdaptiveAction } from '../../src/ai/adaptive/recommendationEngine.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');
const reportPath = path.join(projectRoot, 'reports', 'validation', 'learning-journey-alignment.json');

function buildFixture() {
  const questions = Array.from({ length: 10 }, (_, index) => ({
    id: `LJ-FIXTURE-${String(index + 1).padStart(2, '0')}`,
    q: index % 2 === 0 ? 'Kira jumlah 2 + 3.' : 'Gunakan tambah untuk mencari jumlah objek.',
    answer: '5',
    hint: 'Gabungkan kedua-dua kuantiti.',
    explanation: 'Tambah digunakan untuk mencari jumlah keseluruhan.',
    difficulty: index < 5 ? 'mudah' : 'sederhana',
    cognitiveLevel: index < 5 ? 'mengingat' : 'mengaplikasi'
  }));

  return {
    subject: { id: 'math', title: 'Matematik Tahun 2' },
    topic: {
      id: 'fixture_tambah',
      title: 'Tambah',
      note: 'Murid menggabungkan dua kuantiti untuk mencari jumlah.',
      learningObjective: 'Murid dapat mengira hasil tambah dengan betul.',
      questions
    },
    pack: {
      subjectId: 'math',
      topicId: 'fixture_tambah',
      learningObjectives: ['Menggunakan operasi tambah dalam situasi harian.'],
      simpleExplanation: 'Tambah bermaksud menggabungkan kuantiti.',
      teacherExplanation: ['Terangkan maksud tambah.', 'Modelkan kiraan dengan objek.', 'Semak jawapan.', 'Hubungkan dengan situasi harian.'],
      workedExamples: [
        { prompt: '2 + 3', steps: ['Gabung 2 dan 3.'], answer: '5' },
        { prompt: '4 + 1', steps: ['Gabung 4 dan 1.'], answer: '5' },
        { prompt: '5 + 2', steps: ['Gabung 5 dan 2.'], answer: '7' }
      ],
      commonMistakes: ['Menolak nombor.', 'Tidak mengira semua objek.', 'Tersalah menulis jumlah.'],
      wrongAnswerPatterns: ['Memilih beza.', 'Tertinggal satu objek.', 'Menyalin nombor yang salah.'],
      followUpQuestions: ['Cuba 3 + 2.', 'Cuba 4 + 2.', 'Cuba 6 + 1.'],
      relatedTopics: ['nombor', 'tolak'],
      keywords: ['tambah', 'jumlah', 'gabung'],
      curriculum: { SK: 'Operasi tambah', SP: 'Menambah dua nombor' },
      encouragement: { retry: ['Cuba semula.', 'Semak kiraan.', 'Kamu hampir berjaya.'] }
    }
  };
}

function runEngineRegressionChecks() {
  const fixture = buildFixture();
  const healthy = auditTopicJourney(fixture);
  assert.equal(healthy.structuralPassed, true, `Healthy learning journey must pass: ${JSON.stringify(healthy.blockers)}`);
  assert.equal(healthy.blockers.length, 0, 'Healthy learning journey must not create blockers.');

  const missingNotes = auditTopicJourney({
    ...fixture,
    topic: { ...fixture.topic, note: '' },
    pack: { ...fixture.pack, simpleExplanation: '', teacherExplanation: [] }
  });
  assert.equal(missingNotes.stages.notes.passed, false, 'Missing notes must fail the notes stage.');
  assert.equal(missingNotes.blockers.some(issue => issue.code === 'missing_topic_note'), true, 'Missing topic note must be reported.');

  const missingFeedback = auditTopicJourney({
    ...fixture,
    topic: {
      ...fixture.topic,
      questions: fixture.topic.questions.map(question => ({ ...question, explanation: '' }))
    }
  });
  assert.equal(missingFeedback.stages.feedback.passed, false, 'Missing explanations must fail the feedback stage.');
  assert.equal(missingFeedback.blockers.some(issue => issue.code === 'insufficient_explanation_coverage'), true, 'Explanation coverage gap must be reported.');

  const untaughtAssessment = auditTopicJourney({
    ...fixture,
    topic: {
      ...fixture.topic,
      questions: fixture.topic.questions.map((question, index) => ({
        ...question,
        q: index % 2 === 0 ? 'Apakah fungsi klorofil?' : 'Terangkan proses fotosintesis.'
      }))
    },
    pack: {
      ...fixture.pack,
      keywords: [...fixture.pack.keywords, 'klorofil', 'fotosintesis']
    }
  });
  assert.equal(untaughtAssessment.blockers.some(issue => issue.code === 'assessment_concepts_not_taught'), true, 'Assessment concepts absent from teaching must block the journey.');
}

runEngineRegressionChecks();

const adaptiveReview = recommendAdaptiveAction({ mastery: 35, revisionPriority: 80, attempts: 5, incorrect: 4 });
const adaptiveAdvance = recommendAdaptiveAction({ mastery: 92, revisionPriority: 10, attempts: 8, incorrect: 1 });
assert.equal(adaptiveReview.action, 'review', 'Low mastery must retain an adaptive remediation route.');
assert.equal(adaptiveAdvance.action, 'advance', 'High mastery must retain a progression route.');

const subjects = await loadAllSubjects();
const report = await auditLearningJourneyBank(subjects, {
  loadKnowledge,
  adaptiveRouteAvailable: adaptiveReview.action === 'review' && adaptiveAdvance.action === 'advance'
});

assert.equal(report.summary.subjects, 8, `Expected 8 subjects, received ${report.summary.subjects}.`);
assert.equal(report.summary.topics, 84, `Expected 84 topics, received ${report.summary.topics}.`);
assert.equal(report.summary.structuralPassed, 84, `Every topic must pass all seven journey stages: ${JSON.stringify(report.blockers.slice(0, 10))}`);
assert.equal(report.summary.blockers, 0, `Learning journey blockers remain: ${JSON.stringify(report.blockers.slice(0, 10))}`);
assert.equal(report.gatePassed, true, 'Learning Journey Alignment V1 gate must pass.');

if (!process.argv.includes('--no-report')) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(`Learning Journey Alignment V1: ${report.gatePassed ? 'PASSED' : 'FAILED'}`);
console.log(JSON.stringify(report.summary, null, 2));
for (const subject of report.subjects) {
  console.log(`${subject.subjectId}: ${subject.aligned}/${subject.topics} aligned, ${subject.review} review, ${subject.blocked} blocked, score ${subject.averageAlignmentScore}`);
}
