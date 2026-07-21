import { bmSubject } from '../../src/data/subjects/bm.js';
import { repairBMSentence, validateBMSentence } from '../../src/utils/bmSentenceQuality.js';

const issues = [];
const samples = [
  'Datuk berkebun bersama datuk pada hujung minggu.',
  'Aina bermain dengan Aina di taman.',
  'Ibu menolong ibu memasak.',
  'Ali dan Ali pergi ke sekolah.',
  'Kakak berbual dengan kakak di ruang tamu.',
  'Ayah membantu ayah membaiki basikal.'
];
const people = ['Ali', 'Aina', 'Abu', 'Sara', 'Datuk', 'Nenek', 'Ibu', 'Kakak', 'Ayah', 'Abang'];
for (const first of people) {
  for (const relation of ['bersama', 'dengan', 'dan', 'menolong', 'membantu']) {
    samples.push(`${first} ${relation} ${first} di sekolah.`);
  }
}
for (let index = 0; index < 1000; index += 1) {
  const first = people[index % people.length];
  const second = people[(index + 3) % people.length];
  samples.push(`${first} bermain dengan ${second} di taman.`);
}

for (const sample of samples) {
  const repaired = repairBMSentence(sample, { candidates: people });
  const result = validateBMSentence(repaired.repairedSentence);
  if (!repaired.valid || !result.valid || /\b(BM-|questionId|topicId|adaptive[_-]|set[_-])\S*/i.test(repaired.repairedSentence)) {
    issues.push({ sample, repaired: repaired.repairedSentence, issues: result.issues });
  }
}

const sourceIssues = [];
for (const topic of bmSubject.topics || []) {
  for (const question of topic.questions || []) {
    for (const field of ['q', 'question', 'answer', 'correctAnswer', 'explanation']) {
      if (typeof question[field] !== 'string') continue;
      const result = validateBMSentence(question[field]);
      if (result.issues.includes('duplicate_person_roles') || result.issues.includes('duplicate_consecutive_words') || result.issues.includes('internal_id')) {
        sourceIssues.push({ id: question.id, field, issues: result.issues });
      }
    }
  }
}

const report = {
  status: issues.length || sourceIssues.length ? 'FAIL' : 'PASS',
  generatedSamples: 1000,
  sampleCount: samples.length,
  sourceQuestionsChecked: (bmSubject.topics || []).reduce((sum, topic) => sum + (topic.questions || []).length, 0),
  repairedSampleIssues: issues,
  remainingSourceIssues: sourceIssues
};
console.log(JSON.stringify(report, null, 2));
if (issues.length || sourceIssues.length) process.exitCode = 1;
