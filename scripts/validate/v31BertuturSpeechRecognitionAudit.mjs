import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCommunicationSpeechSession, getCommunicationSpeechErrorMessage } from '../../src/ai/speech/communicationSpeech.js';
import { cancelActiveSpeechRecognition, extractSpeechTranscript } from '../../src/ai/speech/speechEngine.js';
import { supportsSpeechRecognition } from '../../src/ai/speech/speechCapability.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const engine = fs.readFileSync('src/ai/speech/speechEngine.js', 'utf8');
const communication = fs.readFileSync('src/ai/speech/communicationSpeech.js', 'utf8');
const bertuturSource = app.slice(app.indexOf('function BertuturCoach'), app.indexOf('const writingSets'));

assert.match(app, /createCommunicationSpeechSession/);
assert.match(app, /onTranscript\(nextTranscript\)/);
assert.match(app, /stopRecognitionSilently\(\)/);
assert.match(app, /formatScopeLabel\(rawSetTitle\)/);
assert.doesNotMatch(bertuturSource, /new SpeechRecognition|recognition\.onresult|recognition\.onerror/);
for (const errorCode of ['not-allowed', 'audio-capture', 'no-speech', 'network', 'language-not-supported', 'unknown']) {
  assert.match(getCommunicationSpeechErrorMessage(errorCode), /taip|menaip/i, `${errorCode} must retain manual fallback guidance`);
}
assert.match(engine, /export function extractSpeechTranscript/);
assert.match(communication, /createReadingSpeechSession/);

class MockRecognition {
  constructor() { MockRecognition.instances.push(this); }
  start() { this.started = true; this.onstart?.(); }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }
}
MockRecognition.instances = [];
globalThis.window = { SpeechRecognition: MockRecognition, setTimeout, clearTimeout };

for (const [id, lang, transcript] of [
  ['bm', 'ms-MY', 'Saya makan nasi'],
  ['english', 'en-US', 'I eat rice'],
  ['arab', 'ar-SA', 'أنا آكل الأرز']
]) {
  const captured = [];
  const candidates = [];
  const contextKey = `speaking:${id}`;
  const session = createCommunicationSpeechSession({
    activity: 'speaking',
    selectedSet: { id, speechLang: lang },
    contextKey,
    getCurrentContextKey: () => contextKey,
    resultFactory: value => ({ status: 'captured', transcript: value }),
    onTranscript: value => captured.push(value),
    onCandidate: review => candidates.push(review.candidate)
  });
  session.start();
  const recognition = session.recognition;
  assert.equal(recognition.started, true);
  assert.equal(recognition.lang, lang);
  const result = [{ transcript }];
  result.isFinal = true;
  recognition.onresult?.({ resultIndex: 0, results: [result] });
  recognition.onend?.();
  assert.equal(captured.at(-1), transcript);
  assert.equal(candidates.at(-1)?.text, transcript);
}

assert.equal(extractSpeechTranscript({ results: [{ length: 1, 0: { transcript: 'satu' } }, { length: 1, 0: { transcript: 'dua' } }] }), 'satu dua');
cancelActiveSpeechRecognition();
globalThis.window = { webkitSpeechRecognition: MockRecognition };
assert.equal(supportsSpeechRecognition(), true);
delete globalThis.window;
console.log('v31BertuturSpeechRecognitionAudit: PASS');
