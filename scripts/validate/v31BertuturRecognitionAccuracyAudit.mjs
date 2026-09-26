import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createSpeechReviewCandidate,
  getCommunicationSpeechErrorMessage,
  resolveCommunicationSpeechLocale
} from '../../src/ai/speech/communicationSpeech.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const content = fs.readFileSync('src/data/communicationContent.js', 'utf8');
const engine = fs.readFileSync('src/ai/speech/speechEngine.js', 'utf8');
const sessionSource = fs.readFileSync('src/ai/speech/speechSession.js', 'utf8');
const bertuturSource = app.slice(app.indexOf('function BertuturCoach'), app.indexOf('const writingSets'));

assert.match(content, /id === 'bm' \? 'ms-MY'/);
assert.match(content, /id === 'english' \? 'en-US'/);
assert.match(content, /: 'ar-SA'/);
assert.match(app, /speechLang: setBase\.speechLang/);
assert.match(app, /selectedSet: set/);
assert.match(sessionSource, /multiUtterance: true/);
assert.match(sessionSource, /interimResults: true/);
assert.match(engine, /nextRecognition\.maxAlternatives = 1/);
assert.doesNotMatch(bertuturSource, /new SpeechRecognition|collectBertuturSpeechResults|recognition\.maxAlternatives/);
assert.match(app, /normalizeBertuturTranscript/);
assert.match(app, /Pengecaman mungkin kurang tepat|Transkrip mungkin kurang tepat/);
assert.match(app, /Guna transkrip ini/);
assert.match(app, /Cuba semula/);
assert.match(app, /textarea[\s\S]{0,180}value=\{transcript\}/);
assert.match(app, /setTranscript\(normalizedTranscript\)/);
assert.equal(resolveCommunicationSpeechLocale({ id: 'bm', speechLang: 'ms-MY' }), 'ms-MY');
assert.equal(resolveCommunicationSpeechLocale({ id: 'english', speechLang: 'en-US' }), 'en-US');
assert.equal(resolveCommunicationSpeechLocale({ id: 'arab', speechLang: 'ar-SA' }), 'ar-SA');
assert.equal(createSpeechReviewCandidate({ transcript: 'draft' }).result.status, 'needs-confirmation');
assert.match(getCommunicationSpeechErrorMessage('not-allowed'), /Mikrofon tidak dibenarkan/);
assert.match(getCommunicationSpeechErrorMessage('audio-capture'), /Mikrofon tidak dapat dikesan/);
assert.match(getCommunicationSpeechErrorMessage('language-not-supported'), /Bahasa suara ini tidak disokong/);
console.log('v31BertuturRecognitionAccuracyAudit: PASS');
