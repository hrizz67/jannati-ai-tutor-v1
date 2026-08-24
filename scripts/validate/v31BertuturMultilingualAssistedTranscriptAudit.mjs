import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const content = fs.readFileSync('src/data/communicationContent.js', 'utf8');

for (const locale of ["'ms-MY'", "'en-US'", "'ar-SA'"]) assert.ok(content.includes(locale), `missing locale ${locale}`);
assert.match(app, /const latestSpeechLang[\s\S]{0,240}latestSet\?\.speechLang/);
assert.match(app, /recognition\.lang = latestSpeechLang/);
assert.match(app, /const \[recognizedDraft, setRecognizedDraft\]/);
assert.match(app, /const \[confirmedTranscript, setConfirmedTranscript\]/);
assert.match(app, /const \[manualTranscript, setManualTranscript\]/);
assert.match(app, /const \[transcriptSource, setTranscriptSource\]/);
assert.match(app, /speech-confirmed/);
assert.match(app, /setTranscriptSource\('manual'\)/);
assert.match(app, /collectBertuturSpeechResults/);
assert.match(app, /setRecognizedDraft\(nextCandidate\.text\)/);
assert.match(app, /setSpeechCandidate\(nextCandidate\)/);
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
assert.match(app, /setRecognizedDraft\('\'\)/);
assert.match(app, /recognition\.maxAlternatives = 3/);
assert.match(app, /event\.resultIndex/);
assert.match(app, /result\.isFinal/);
assert.match(app, /getBertuturSpeechErrorMessage/);

const resultHandler = app.slice(app.indexOf('recognition.onresult = event =>'), app.indexOf('recognition.onend = () =>', app.indexOf('recognition.onresult = event =>')));
assert.doesNotMatch(resultHandler, /recordCommunicationScore|scoreBertutur|finalizeBertuturSession/);
const endHandler = app.slice(app.indexOf('recognition.onend = () =>'), app.indexOf('try {', app.indexOf('recognition.onend = () =>')));
assert.doesNotMatch(endHandler, /recordCommunicationScore|scoreBertutur/);
console.log('v31BertuturMultilingualAssistedTranscriptAudit: PASS');
