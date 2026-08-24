import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSpeechSession, extractSpeechTranscript } from '../../src/ai/speech/speechEngine.js';
import { supportsSpeechRecognition } from '../../src/ai/speech/speechCapability.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const engine = fs.readFileSync('src/ai/speech/speechEngine.js', 'utf8');

assert.match(app, /window\.SpeechRecognition\s*\|\|\s*window\.webkitSpeechRecognition/);
assert.match(app, /recognitionRef\.current\s*=\s*recognition/);
for (const token of ['recognition.onstart', 'recognition.onresult', 'recognition.onerror', 'recognition.onend', 'recognition.start()']) assert.match(app, new RegExp(token.replace(/[.()]/g, '\\$&')));
assert.match(app, /extractSpeechTranscript\s*=\s*extractSpeechTranscriptShared/);
assert.match(app, /setTranscript\(nextTranscript\)/);
assert.match(app, /stopRecognitionSilently\(\)/);
assert.match(app, /formatScopeLabel\(rawSetTitle\)/);
for (const message of [
  'Mikrofon tidak dibenarkan. Benarkan akses mikrofon dalam tetapan pelayar.',
  'Mikrofon tidak dapat dikesan. Semak mikrofon dan tetapan sistem.',
  'Tiada suara dikesan. Cuba bercakap semula.',
  'Perkhidmatan pengecaman suara tidak dapat dihubungi. Semak sambungan internet dan cuba semula.'
]) assert.ok(app.includes(message), `missing mapped message: ${message}`);
assert.match(engine, /export function extractSpeechTranscript/);

class MockRecognition {
  start() { this.started = true; }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }
}
globalThis.window = { SpeechRecognition: MockRecognition };
const captured = [];
const session = createSpeechSession({ lang: 'ms-MY', onTranscript: value => captured.push(value) });
assert.equal(session.supported, true);
session.start();
assert.equal(session.recognition.started, true);
session.recognition.onstart?.();
session.recognition.onresult?.({ results: [{ isFinal: true, length: 1, 0: { transcript: 'Saya makan nasi' } }] });
assert.equal(captured.at(-1), 'Saya makan nasi');
assert.equal(session.getState().transcript, 'Saya makan nasi');
assert.equal(extractSpeechTranscript({ results: [{ length: 1, 0: { transcript: 'satu' } }, { length: 1, 0: { transcript: 'dua' } }] }), 'satu dua');
session.recognition?.onend?.();

globalThis.window = { webkitSpeechRecognition: MockRecognition };
assert.equal(supportsSpeechRecognition(), true);
console.log('v31BertuturSpeechRecognitionAudit: PASS');
