import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/App.jsx', 'utf8');
assert.match(app, /recognition\.continuous = longSpeechMode/);
assert.match(app, /if \(!longSpeechMode\) setMendengar\(false\)/);
assert.match(app, /recognition\.onend = \(\) =>/);
assert.match(app, /setMendengar\(false\)/);
assert.match(app, /reviewCopy\.warning/);
assert.match(app, /speechCandidate\?\.text/);
assert.match(app, /disabled=\{listening \|\| !safeTranscript \|\| Boolean\(speechCandidate\)/);
assert.match(app, /function retrySpeechRecognition/);
assert.match(app, /function acceptSpeechCandidate/);
assert.match(app, /function editSpeechCandidate/);
assert.match(app, /function clearSpeechCandidate/);
assert.match(app, /reviewCopy\.retry/);
assert.match(app, /reviewCopy\.clear/);
assert.match(app, /speechFinalTranscriptRef\.current/);
console.log('v31BertuturListeningStateAudit: PASS');
