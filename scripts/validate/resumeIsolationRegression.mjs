import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  RESUME_KEY,
  RESUME_SLOTS_KEY,
  clearResume,
  loadResume,
  saveResume
} from '../../src/utils/resumeStorage.js';

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function questionResume({ mode = 'quiz', subjectId = 'bm', topicId = 'kata_nama_am', id, updatedAt }) {
  return {
    version: 1,
    mode,
    subjectId,
    topicId,
    questions: [{ id, q: `Soalan ${id}`, answer: 'jawapan' }],
    currentIndex: 1,
    updatedAt,
    state: {}
  };
}

function communicationResume(mode, updatedAt) {
  return {
    version: 1,
    mode,
    subjectId: mode,
    topicId: `${mode}_set_1`,
    updatedAt,
    state: { setId: `${mode}_set_1`, title: `Latihan ${mode}` }
  };
}

const storage = new MemoryStorage();
const quiz = questionResume({ id: 'BM-QUIZ-001', updatedAt: '2026-08-14T08:00:00.000Z' });
const adaptive = questionResume({ mode: 'adaptive-practice', topicId: 'adaptive_bm', id: 'BM-AI-001', updatedAt: '2026-08-14T08:01:00.000Z' });
const uasaBm = questionResume({ mode: 'uasa', topicId: 'uasa_bm', id: 'BM-UASA-001', updatedAt: '2026-08-14T08:02:00.000Z' });
const uasaMath = questionResume({ mode: 'uasa', subjectId: 'math', topicId: 'uasa_math', id: 'MATH-UASA-001', updatedAt: '2026-08-14T08:03:00.000Z' });
const reading = communicationResume('reading', '2026-08-14T08:04:00.000Z');

[quiz, adaptive, uasaBm, uasaMath, reading].forEach(item => saveResume(item, storage));

assert.equal(loadResume({ mode: 'quiz', subjectId: 'bm', topicId: 'kata_nama_am' }, storage)?.questions?.[0]?.id, 'BM-QUIZ-001');
assert.equal(loadResume({ mode: 'adaptive-practice', subjectId: 'bm' }, storage)?.questions?.[0]?.id, 'BM-AI-001');
assert.equal(loadResume({ mode: 'uasa', subjectId: 'bm' }, storage)?.questions?.[0]?.id, 'BM-UASA-001');
assert.equal(loadResume({ mode: 'uasa', subjectId: 'math' }, storage)?.questions?.[0]?.id, 'MATH-UASA-001');
assert.equal(loadResume({ mode: 'reading' }, storage)?.mode, 'reading');
assert.equal(loadResume({}, storage)?.mode, 'reading', 'Kad resume utama mesti menunjukkan sesi terkini.');
assert.equal(Object.keys(JSON.parse(storage.getItem(RESUME_SLOTS_KEY))).length, 5, 'Semua resume perlu kekal dalam slot berasingan.');

clearResume({ mode: 'uasa', subjectId: 'bm' }, storage);
assert.equal(loadResume({ mode: 'uasa', subjectId: 'bm' }, storage), null, 'Menamatkan UASA BM mesti memadam slot UASA BM sahaja.');
assert.equal(loadResume({ mode: 'quiz', subjectId: 'bm', topicId: 'kata_nama_am' }, storage)?.questions?.[0]?.id, 'BM-QUIZ-001');
assert.equal(loadResume({ mode: 'uasa', subjectId: 'math' }, storage)?.questions?.[0]?.id, 'MATH-UASA-001');
assert.equal(loadResume({ mode: 'reading' }, storage)?.mode, 'reading');

const legacyStorage = new MemoryStorage({ [RESUME_KEY]: JSON.stringify(quiz) });
assert.equal(loadResume({ mode: 'quiz', subjectId: 'bm' }, legacyStorage)?.questions?.[0]?.id, 'BM-QUIZ-001');
assert.ok(legacyStorage.getItem(RESUME_SLOTS_KEY), 'Resume lama mesti dimigrasikan kepada storan berbilang slot.');

const restrictedStorage = new MemoryStorage();
restrictedStorage.setItem = () => { throw new Error('storage denied'); };
restrictedStorage.removeItem = () => { throw new Error('storage denied'); };
assert.doesNotThrow(() => saveResume(quiz, restrictedStorage), 'Sekatan storan tidak boleh merosakkan aliran latihan.');
assert.doesNotThrow(() => clearResume(undefined, restrictedStorage), 'Pembersihan resume mesti selamat apabila storan disekat.');

const app = fs.readFileSync('src/App.jsx', 'utf8');
const resumeCard = fs.readFileSync('src/components/ResumePracticeCard.jsx', 'utf8');
assert.match(app, /resume\?\.mode === 'uasa' && resume\?\.subjectId === selectedSubject\?\.id/);
assert.match(app, /storedSubjectResume\?\.mode === 'uasa'/);
assert.match(app, /options\.restoreFromResume\s*\?\s*\{\s*questions:\s*sourceQuestions/, 'Resume mesti mengekalkan susunan soalan asal sesi.');
for (const mode of ['reading', 'listening', 'speaking', 'writing']) {
  assert.ok(app.includes(`resume?.mode === '${mode}' ? resume : null`), `${mode} mesti menerima resume modnya sahaja.`);
  assert.ok(app.includes(`clearResumeData(setResume, { mode: '${mode}' })`), `${mode} mesti memadam slotnya sahaja.`);
}
assert.ok(resumeCard.includes('onResume?.(resume)'), 'Butang Sambung mesti menghantar rekod resume, bukan objek acara klik.');

console.log('Resume isolation regression: PASS');
