import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const capability = fs.readFileSync('src/ai/speech/speechCapability.js', 'utf8');
const engine = fs.readFileSync('src/ai/speech/speechEngine.js', 'utf8');
const voice = fs.readFileSync('src/ai/voice/voiceQueue.js', 'utf8');
const content = fs.readFileSync('src/data/communicationContent.js', 'utf8');
const communicationSources = `${app}\n${content}`;

assert.match(capability, /window\.SpeechRecognition\s*\|\|\s*window\.webkitSpeechRecognition/);
assert.match(app, /createSpeechSession/);
assert.match(app, /speechSynthesis\?\.cancel\?\./);
assert.match(voice, /speechSynthesis/);
assert.match(voice, /cancel\(\)/);
assert.match(app, /textarea[^>]*value=\{transcript\}/);
for (const lang of ['ms-MY', 'en-US', 'ar-SA']) assert.ok(communicationSources.includes(`'${lang}'`), `missing language mapping: ${lang}`);
assert.doesNotMatch(app, /new Audio\(/);
assert.doesNotMatch(app, /navigator\.mediaDevices\.getUserMedia\(\)/);
assert.match(engine, /disposeRecognitionInstance/);
assert.match(engine, /cancelActiveSpeechRecognition/);
console.log('v31CommunicationHardwareAudit: PASS');
