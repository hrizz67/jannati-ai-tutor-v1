import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import { teachAnswer } from '../../src/ai/teacherEngine.js';

const question = { subjectId: 'bm', q: 'Lengkapkan ayat ini: ____ sedang menyiapkan kerja kelas di meja belajar.', answer: 'Saya' };
const topic = { subjectId: 'bm', id: 'kata_ganti_nama', title: 'Kata Ganti Nama' };
const teacher = explainAnswer({ question, topic, result: { status: 'correct' } });
const taught = teachAnswer({ question, topic, explanationData: teacher });
const janna = teacher.encouragement;
const coach = teacher.sections.coachMessage;
assert.match(janna, /Bagus\.|betul/i);
assert.match(teacher.simpleExplanation, /Gunakan “Saya”/);
assert.match(coach, /Bagus\.|betul/i);
assert.notEqual(teacher.simpleExplanation, janna);
assert.ok(janna.length <= 90 && teacher.simpleExplanation.length <= 90 && coach.length <= 90);
assert.doesNotMatch(JSON.stringify({ teacher, taught }).toLowerCase(), /jawapan yang tepat|contoh yang sepadan|maksud ayat/);
assert.match(taught.explanation, /Gunakan “Saya”|kata ganti nama/i);
console.log('v31BmToneConsistencyAudit: PASS');
