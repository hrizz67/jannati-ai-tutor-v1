import assert from 'node:assert/strict';
import fs from 'node:fs';

const jsx = fs.readFileSync('src/components/ai/TutorAIModal.jsx', 'utf8');
const app = fs.readFileSync('src/App.jsx', 'utf8');

assert.match(jsx, /\[open, sessionKey, speechSupported\]/);
assert.match(jsx, /setMessages\(current => current\.length \? current : \[\{/);
assert.match(jsx, /buildNaturalGreeting\(\{/);
assert.match(jsx, /requestIdRef/);
assert.match(jsx, /setPendingPedagogicalStep\(null\)/, 'Pending Tutor step must reset with modal context.');
assert.match(jsx, /speechSessionRef\.current\?\.cancel\?\.\(\)/, 'Active microphone session must be cancelled on reset.');
assert.match(jsx, /history: messages\.slice\(-TUTOR_ENGINE_HISTORY_LIMIT\)/, 'Inference history must remain bounded.');
assert.match(app, /setAnswer\(''\)|setAnswer\(""\)/);
assert.match(app, /setFeedback\(null\)/);

console.log('PASS v31TutorStateResetAudit');
