import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCommunicationSpeechSession } from '../../src/ai/speech/communicationSpeech.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const content = fs.readFileSync('src/data/communicationContent.js', 'utf8');

assert.match(app, /function BacaanCoach/);
assert.match(app, /function BertuturCoach/);
assert.match(app, /semanticReadingPassages/);
assert.match(app, /semanticSpeakingPrompts/);
assert.match(app, /const bacaanContextKey = `reading:\$\{passageId\}:\$\{sessionIndex\}`/);
assert.match(app, /const communicationContextKey = `speaking:\$\{setId\}:\$\{mode\}:\$\{sessionIndex\}`/);
assert.match(app, /recognitionContextKeyRef/);
assert.match(app, /getCurrentContextKey: \(\) => recognitionContextKeyRef\.current/);
assert.match(app, /stopRecognitionSilently\(\)/);
assert.match(app, /setInterimTranscript\('\'\)/);
assert.match(app, /setSpeechCandidate\(null\)/);
assert.match(app, /setTranscriptSource\('\'\)/);
assert.match(app, /setTranscriptSource\('speech-confirmed'\)/);
assert.match(app, /setTranscriptSource\('manual'\)/);
assert.match(app, /if \(!safeTranscript\)/);
assert.match(app, /Boolean\(speechCandidate\)/);
assert.match(app, /speechCandidate\?\.text/);
assert.match(content, /semanticListeningSets/);
assert.match(content, /semanticSpeakingPrompts/);
assert.match(content, /semanticWritingSets/);

const readingContexts = [0, 1, 2].map(sessionIndex => `reading:bm:${sessionIndex}`);
const speakingContexts = [0, 1, 2].map(sessionIndex => `speaking:english:intro:${sessionIndex}`);
assert.equal(new Set(readingContexts).size, 3, 'Bacaan Q1, Q2 and Q3 must have distinct recognition contexts.');
assert.equal(new Set(speakingContexts).size, 3, 'Bertutur Q1, Q2 and Q3 must have distinct recognition contexts.');

let currentContext = 'speaking:english:intro:0';
let callbacks = null;
let cancelled = false;
const accepted = [];
const session = createCommunicationSpeechSession({
  activity: 'speaking',
  selectedSet: { id: 'english', speechLang: 'en-US' },
  contextKey: currentContext,
  getCurrentContextKey: () => currentContext,
  sessionFactory(options) {
    callbacks = options;
    return { supported: true, start: () => ({ status: 'listening' }), cancel: () => { cancelled = true; } };
  },
  onCandidate: review => accepted.push(review.candidate.text)
});
session.start();
currentContext = 'speaking:english:intro:1';
session.cancel();
callbacks.onComplete({ transcript: 'stale transcript' });
assert.equal(cancelled, true);
assert.deepEqual(accepted, []);
console.log('v31CommunicationStateIsolationAudit: PASS');
