import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';
const result = explainAnswer({ subjectId: 'bm', question: { subjectId: 'bm', q: 'Apakah maksud simpulan bahasa "ringan tulang"?', answer: 'rajin membantu' }, topic: { subjectId: 'bm', id: 'simpulan_bahasa', title: 'Simpulan Bahasa' }, questionText: 'Apakah maksud simpulan bahasa "ringan tulang"?', result: { status: 'wrong' } });
assert.match(result.simpleExplanation, /rajin bekerja|suka membantu/);
assert.equal(result.correctAnswer, '');
assert.match(result.sections.example, /membantu ibu mengemas rumah/);
console.log('PASS v31SimpulanBahasaExplanationAudit');
