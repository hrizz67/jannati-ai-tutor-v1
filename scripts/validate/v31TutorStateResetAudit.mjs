import assert from 'node:assert/strict';
import fs from 'node:fs';
const jsx = fs.readFileSync('src/components/ai/TutorAIModal.jsx', 'utf8'); const app = fs.readFileSync('src/App.jsx', 'utf8');
assert.match(jsx, /\[open, sessionKey\]/); assert.match(jsx, /setMessages\(\[\{ role: 'ai', text: INITIAL_GREETING/); assert.match(jsx, /requestIdRef/);
assert.match(app, /setAnswer\(''\)|setAnswer\(\"\"\)/); assert.match(app, /setFeedback\(null\)/);
console.log('PASS v31TutorStateResetAudit');
