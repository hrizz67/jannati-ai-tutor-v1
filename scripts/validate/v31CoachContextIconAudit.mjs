import fs from 'node:fs';
import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import { teachAnswer } from '../../src/ai/teacherEngine.js';
import { normalizeCoachPayloadForAudit } from '../../src/ai/coach/coachAdapter.js';
import { matchesCoachContext, resolveCoachContextSnapshot } from '../../src/ai/coach/contextSnapshot.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const icons = fs.readFileSync('src/components/IconGlyph.jsx', 'utf8');
const dashboard = fs.readFileSync('src/dashboard/dashboardHelpers.jsx', 'utf8');
const home = fs.readFileSync('src/dashboard/HomeDashboard.jsx', 'utf8');
const parent = fs.readFileSync('src/dashboard/ParentDashboard.jsx', 'utf8');
const student = fs.readFileSync('src/dashboard/StudentDashboard.jsx', 'utf8');
const analytics = fs.readFileSync('src/dashboard/AnalyticsDashboard.jsx', 'utf8');
const css = fs.readFileSync('src/styles/style.css', 'utf8');

const subjects = [
  { id: 'bm', title: 'Bahasa Melayu', topics: [{ id: 'kata_kerja', title: 'Kata Kerja' }] },
  { id: 'math', title: 'Matematik', topics: [{ id: 'darab', title: 'Darab' }] },
  { id: 'english', title: 'English', topics: [{ id: 'nouns', title: 'Nouns' }] },
  { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'Mufradat' }] }
];

const math = resolveCoachContextSnapshot({
  requestId: 1,
  question: { id: 'math-1', subjectId: 'math', topicId: 'darab', q: '3 × 4 = ?', answer: '12', options: ['10', '12'] },
  activeSubject: subjects[0],
  activeTopic: subjects[0].topics[0],
  allSubjects: subjects,
  learnerAnswer: '12'
});
assert.equal(math.subjectId, 'math');
assert.equal(math.topicId, 'darab');
assert.deepEqual(math.acceptedAnswers, ['12']);

const adaptive = resolveCoachContextSnapshot({
  requestId: 2,
  question: { id: 'adaptive-1', metadata: { subjectId: 'english', topicId: 'nouns' }, q: 'Find the noun.', answer: 'cat' },
  activeSubject: subjects[0],
  activeTopic: subjects[0].topics[0],
  allSubjects: subjects
});
assert.equal(adaptive.subjectId, 'english');
assert.equal(adaptive.topicId, 'nouns');

const staleData = normalizeCoachPayloadForAudit('explain', {
  subjectId: 'arab', topicId: 'mufradat', question: { id: 'arab-1', q: 'ما هذا؟', answer: 'كتاب' },
  coachData: { explanation: 'كتاب bermaksud buku.', steps: ['Baca perkataan.'], hint: 'Perhatikan tulisan Arab.', praise: 'Bagus!', learningTip: 'Baca dari kanan ke kiri.' }
});
assert.equal(matchesCoachContext(adaptive, staleData, { requestId: adaptive.requestId, mode: 'explain' }), false);
assert.equal(matchesCoachContext(adaptive, staleData, { requestId: adaptive.requestId, mode: 'explain', currentSnapshot: math, currentOpen: true }), false);

const teacher = normalizeCoachPayloadForAudit('teach', {
  subjectId: math.subjectId, topicId: math.topicId, question: { id: math.questionId, q: math.questionText, answer: math.expectedAnswer },
  coachData: { explanation: 'Kira 3 kumpulan 4.', steps: ['Bina 3 kumpulan.', 'Tambah 4 tiga kali.'], hint: 'Gunakan kumpulan sama banyak.', praise: 'Bagus!', learningTip: 'Semak kiraan.' }
});
assert.equal(teacher.generatedMode, 'teach');
assert.ok(teacher.steps.length >= 2);

const generic = explainAnswer({ question: { q: 'Ali memilih kata kerja.', answer: 'berlari' }, topic: { id: 'kata_kerja' }, questionText: 'Ali memilih kata kerja.' });
assert.ok(!generic.explanation.toLowerCase().startsWith('jawapan ini sesuai dengan soalan'));

assert.match(icons, /<svg[\s\S]*viewBox="0 0 24 24"/);
assert.match(dashboard, /<SubjectIcon subjectId=/);
assert.match(app, /subjectId: snapshot\.subjectId/);
assert.match(app, /topicId: snapshot\.topicId/);
assert.match(app, /isCurrentCoachResponse\(snapshot, nextData, 'explain'\)/);
assert.match(app, /isCurrentCoachResponse\(snapshot, nextData, 'teach'\)/);
assert.match(app, /const coachSubject = allSubjects\.find\(item => item\.id === coachSnapshot\?\.subjectId\)/);
assert.match(home, /<SubjectIcon subjectId=/);
assert.doesNotMatch(home, /subject-quick-pill-icon[^\n]*subject\?\.icon/);
assert.doesNotMatch(parent, /🌟|👍|📘/);
for (const surface of [home, parent, student, analytics, dashboard]) {
  assert.doesNotMatch(surface, /(?:>\s*)?(?:🌟|👍|📘|🔥|🏆|🎯|🎖️)(?:\s*<|\s|$)/u);
}
for (const motion of ['pulse', 'celebrate', 'shine', 'sound', 'breath', 'hover']) {
  assert.match(css, new RegExp(`data-motion=['"]${motion}['"]|icon-glyph\\[data-motion=['"]${motion}['"]`));
}
assert.match(css, /quickActionEnter/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /quick-actions button:active/);

console.log(JSON.stringify({
  status: 'PASS',
  contextResolution: { math: 'math/darab', adaptiveOverride: 'english/nouns', staleResponseRejected: true },
  teacherContract: { generatedMode: teacher.generatedMode, steps: teacher.steps.length },
  genericFallbackIsContextual: true,
  iconSystem: 'SVG IconGlyph/SubjectIcon',
  motionValues: ['pulse', 'celebrate', 'shine', 'sound', 'breath', 'hover'],
  reducedMotion: true
}, null, 2));
