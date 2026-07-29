import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildCoachResponse } from '../../src/ai/coach/v3/coachController.js';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import { teachAnswer } from '../../src/ai/teacherEngine.js';

const engineSource = await fs.readFile('src/ai/coach/v3/explanationEngine.js', 'utf8');
const declaration = engineSource.indexOf('const explanation =');
assert.notEqual(declaration, -1, 'Coach explanation source declaration is missing');
assert.equal(engineSource.slice(0, declaration).includes('${explanation}'), false, 'Coach references explanation before declaration');
assert.equal(engineSource.includes('${explanation}${subjectFocus}'), true, 'Coach contextual explanation uses the declared explanation source');

const question = { q: 'Ali ada tiga buku.', answer: 'buku', subjectId: 'bm', topicId: 'kata_nama', explanation: 'Buku ialah nama benda.' };
const topic = { id: 'kata_nama', subjectId: 'bm', title: 'Kata Nama' };

const coach = await buildCoachResponse({
  subjectId: 'bm',
  topicId: 'kata_nama',
  question,
  result: { correct: true },
  userAnswer: 'buku',
  context: { questionText: question.q, expectedAnswer: question.answer },
  mode: 'explain'
});

assert.equal(typeof coach.explanation?.explanation, 'string');
assert.ok(coach.explanation.explanation.length > 0, 'Coach explanation should be populated');
assert.equal(typeof coach.hint?.hint, 'string');
assert.equal(typeof coach.praise?.praise, 'string');

const coachKeys = Object.keys(coach).sort();
assert.deepEqual(coachKeys, ['correctAnswer', 'explanation', 'hint', 'knowledge', 'learningTip', 'mode', 'praise', 'ready', 'steps', 'subjectId', 'subjectLabel', 'tips', 'topicId'].sort(), 'Coach output schema changed');
assert.deepEqual(Object.keys(coach.explanation).sort(), ['examples', 'explanation', 'learningStep', 'simpleExplanation', 'subjectId', 'subjectLabel', 'subjectVoice', 'topicId'].sort(), 'Explanation output schema changed');

const explain = explainAnswer({ question, topic, result: { status: 'correct' }, questionText: question.q });
assert.equal(typeof explain.explanation, 'string');
assert.ok(explain.explanation.length > 0, 'Explain path should still return an explanation');

const teacher = teachAnswer({ question, topic, explanationData: explain, questionText: question.q });
assert.equal(typeof teacher.explanation, 'string');
assert.ok(teacher.explanation.length > 0, 'Teacher path should still return an explanation');

console.log('Coach explanation crash audit PASS');
console.log(JSON.stringify({
  coachExplanation: coach.explanation.explanation,
  explainPath: explain.explanation,
  teacherPath: teacher.explanation,
  coachSchemaKeys: coachKeys
}, null, 2));
