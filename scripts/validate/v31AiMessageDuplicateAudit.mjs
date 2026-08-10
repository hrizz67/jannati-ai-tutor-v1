import assert from 'node:assert/strict';
import fs from 'node:fs';
const jsx = fs.readFileSync('src/components/ai/TutorAIModal.jsx', 'utf8');
assert.match(jsx, /normalizeForDuplicate/);
assert.match(jsx, /normalizeForDuplicate\(prev\.at\(-1\)\?\.text\)/);
assert.doesNotMatch(jsx, /error && !loading && <MessageBubble/);
assert.match(jsx, /setMessages\(\[\{ role: 'ai', text: INITIAL_GREETING/);
console.log('PASS v31AiMessageDuplicateAudit');
