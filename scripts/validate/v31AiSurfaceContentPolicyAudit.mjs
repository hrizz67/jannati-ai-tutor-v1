import assert from 'node:assert/strict';
import fs from 'node:fs';

const explain = fs.readFileSync('src/components/ai/AIExplainModal.jsx', 'utf8');
const teacher = fs.readFileSync('src/components/ai/AITeacherModal.jsx', 'utf8');
const tutor = fs.readFileSync('src/components/ai/TutorAIModal.jsx', 'utf8');
assert.match(explain, /Penerangan mudah/);
assert.match(explain, /Kenapa jawapan itu betul/);
assert.match(explain, /Kesilapan biasa/);
assert.match(teacher, /Langkah demi langkah/);
assert.match(teacher, /Latih semula/);
assert.doesNotMatch(teacher, /renderTextSection\('Kenapa jawapan itu betul', whyCorrect\)/);
assert.doesNotMatch(explain, /renderTextSection\('Petunjuk', hint\)/);
assert.match(tutor, /wrong_answer_coaching/);
assert.doesNotMatch(tutor, /JSON\.stringify\(data\)/);
console.log('v31AiSurfaceContentPolicyAudit: PASS');
