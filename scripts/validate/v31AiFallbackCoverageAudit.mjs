import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';
import fs from 'node:fs';
const subjects = ['math', 'bm', 'english', 'sains', 'islam', 'arab', 'pj', 'pk'];
for (const subjectId of subjects) {
  const result = explainAnswer({ question: { subjectId, q: 'Choose the best answer.', answer: 'A' }, topic: { subjectId, id: 'sample', title: 'Sample topic' }, questionText: 'Choose the best answer.', result: { status: 'correct' } });
  assert.ok(result.simpleExplanation && result.focus && result.whyCorrect, `${subjectId}: missing fallback fields`);
  assert.ok(!/^Soalan:/i.test(result.simpleExplanation), `${subjectId}: question echo leaked into simple explanation`);
}
const adapter = fs.readFileSync('src/ai/coach/knowledge/knowledgeAdapter.js', 'utf8');
assert.match(adapter, /questionIdentity/, 'knowledge adapter must retain question identity context');
console.log('PASS v31AiFallbackCoverageAudit: subject fallback fields and question-context guard are present.');
