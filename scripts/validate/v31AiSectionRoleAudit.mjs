import assert from 'node:assert/strict';
import { explainAnswer } from '../../src/ai/explainEngine.js';

const math = explainAnswer({ question: { subjectId: 'math', q: 'Berapakah nombor selepas 113?', answer: '114' }, topic: { subjectId: 'math', id: 'nombor' }, result: { status: 'wrong' } });
const sections = math.sections;
assert.match(sections.focus, /nombor|kemahiran/i);
assert.match(sections.hint, /tambah|tolak/i);
assert.equal(sections.steps.length, 3);
assert.match(sections.steps[0], /113/);
assert.match(sections.example, /25.*26/);
assert.match(sections.commonMistake, /tolak|arah|urutan/i);
assert.match(sections.memoryTip, /selepas|sebelum/i);
assert.doesNotMatch(sections.coachMessage, /Jawapan:/i);
assert.doesNotMatch(JSON.stringify(math).toLowerCase(), /padang|hospital|kedai|pasar/);
console.log('v31AiSectionRoleAudit: PASS');
