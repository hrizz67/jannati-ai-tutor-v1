import assert from 'node:assert/strict';
import fs from 'node:fs';
import { explainAnswer } from '../../src/ai/explainEngine.js';

const data = explainAnswer({
  question: { subjectId: 'math', q: 'Berapakah nombor selepas 113?', answer: '114' },
  topic: { subjectId: 'math', id: 'nombor' },
  result: { status: 'correct' }
});
const values = [data.sections.focus, data.sections.simpleExplanation, data.sections.whyCorrect, data.sections.hint, data.sections.example, data.sections.commonMistake, data.sections.memoryTip, data.sections.coachMessage].map(String);
assert.equal(new Set(values.map(value => value.toLowerCase())).size, values.length);
assert.notEqual(data.sections.coachMessage, data.sections.whyCorrect);
assert.notEqual(data.sections.hint, data.sections.simpleExplanation);
assert.notEqual(data.sections.memoryTip, data.sections.focus);
assert.match(data.sections.example, /25.*26/);
assert.ok(data.sections.whyCorrect.length < 100);
assert.ok(data.sections.coachMessage.length < 100);
assert.doesNotMatch(fs.readFileSync('src/components/ai/AIExplainModal.jsx', 'utf8'), /renderTextSection\('Petunjuk', hint\)/);
assert.doesNotMatch(fs.readFileSync('src/components/ai/AITeacherModal.jsx', 'utf8'), /renderTextSection\('Kenapa jawapan itu betul', whyCorrect\)/);
console.log('v31AiModalRedundancyAudit: PASS');
