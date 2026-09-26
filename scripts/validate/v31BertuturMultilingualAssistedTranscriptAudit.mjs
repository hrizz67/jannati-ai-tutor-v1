import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  confirmCommunicationSpeechCandidate,
  createCommunicationSpeechSession
} from '../../src/ai/speech/communicationSpeech.js';
import { normalizeCommunicationResult } from '../../src/utils/communicationResult.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const content = fs.readFileSync('src/data/communicationContent.js', 'utf8');
const bertuturSource = app.slice(app.indexOf('function BertuturCoach'), app.indexOf('const writingSets'));

for (const locale of ["'ms-MY'", "'en-US'", "'ar-SA'"]) assert.ok(content.includes(locale), `missing locale ${locale}`);
assert.match(app, /const \[transcriptSource, setTranscriptSource\]/);
assert.match(app, /speech-confirmed/);
assert.match(app, /setTranscriptSource\('manual'\)/);
assert.match(app, /setSpeechCandidate\(review\.candidate\)/);
assert.match(app, /function acceptSpeechCandidate/);
assert.match(app, /function editSpeechCandidate/);
assert.match(app, /function clearSpeechCandidate/);
assert.match(app, /Guna transkrip ini/);
assert.match(app, /Use this transcript/);
assert.match(app, /استخدم هذا النص/);
assert.match(app, /dir=\{set\.id === 'arab' \? 'rtl'/);
assert.match(app, /lang=\{set\.id === 'arab' \? 'ar' : set\.id === 'english' \? 'en' : 'ms'\}/);
assert.match(app, /disabled=\{listening \|\| !safeTranscript \|\| Boolean\(speechCandidate\)/);
assert.match(app, /setTranscriptSource\('manual'\)/);
assert.match(app, /createCommunicationSpeechSession\(\{/);
assert.doesNotMatch(bertuturSource, /new SpeechRecognition|recognition\.maxAlternatives/);

for (const [id, speechLang, transcript] of [
  ['bm', 'ms-MY', 'Saya makan nasi'],
  ['english', 'en-US', 'I eat rice'],
  ['arab', 'ar-SA', 'أنا آكل الأرز']
]) {
  let callbacks = null;
  let review = null;
  const session = createCommunicationSpeechSession({
    activity: 'speaking',
    selectedSet: { id, speechLang },
    contextKey: id,
    getCurrentContextKey: () => id,
    sessionFactory(options) {
      callbacks = options;
      return { supported: true, start: () => ({ status: 'listening' }), cancel() {} };
    },
    onCandidate: nextReview => { review = nextReview; }
  });
  session.start();
  assert.equal(callbacks.lang, speechLang);
  callbacks.onComplete({ transcript, confidence: 0.8 });
  assert.equal(review.candidate.text, transcript);
  assert.equal(normalizeCommunicationResult(review.result).isAssessed, false);
  const confirmed = confirmCommunicationSpeechCandidate(review.candidate, () => ({ score: 100, correct: true }));
  assert.equal(normalizeCommunicationResult(confirmed).isAssessed, true);
}
console.log('v31BertuturMultilingualAssistedTranscriptAudit: PASS');
