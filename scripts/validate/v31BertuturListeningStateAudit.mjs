import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCommunicationSpeechSession } from '../../src/ai/speech/communicationSpeech.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const sessionSource = fs.readFileSync('src/ai/speech/speechSession.js', 'utf8');
assert.match(sessionSource, /continuous: true/);
assert.match(sessionSource, /interimResults: true/);
assert.match(sessionSource, /multiUtterance: true/);
assert.match(app, /createCommunicationSpeechSession\(\{/);
assert.match(app, /onTranscript\(nextTranscript\)/);
assert.match(app, /onCandidate\(review\)/);
assert.match(app, /onFailure\(nextResult\)/);
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

let capturedOptions = null;
const session = createCommunicationSpeechSession({
  activity: 'speaking',
  selectedSet: { id: 'english', speechLang: 'en-US' },
  sessionFactory(options) {
    capturedOptions = options;
    return { supported: true, start: () => ({ status: 'listening' }), cancel() {} };
  }
});
session.start();
assert.equal(capturedOptions.lang, 'en-US');
capturedOptions.onTranscript('long speech transcript');
console.log('v31BertuturListeningStateAudit: PASS');
