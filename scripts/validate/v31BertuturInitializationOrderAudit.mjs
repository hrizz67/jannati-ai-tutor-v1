import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const keyIndex = app.indexOf('const communicationContextKey =');
const setIndex = app.indexOf('const set = rawSet');
const rawSetIndex = app.indexOf('const rawSet =');
assert.ok(keyIndex > rawSetIndex && keyIndex > setIndex, 'context key must follow rawSet/set initialization');
assert.match(app, /recognitionContextKeyRef\.current = communicationContextKey/);
assert.match(app, /recognitionContextKeyRef\.current !== recognitionContextKey/);
assert.match(app, /const latestSpeechLang/);
assert.match(app, /recognition\.lang = latestSpeechLang/);
assert.match(app, /const \[recognizedDraft, setRecognizedDraft\]/);
assert.match(app, /const \[confirmedTranscript, setConfirmedTranscript\]/);
assert.match(app, /const \[manualTranscript, setManualTranscript\]/);

const distDir = 'dist/assets';
const bundles = fs.existsSync(distDir)
  ? fs.readdirSync(distDir).filter(file => /^index-.*\.js$/.test(file)).map(file => path.join(distDir, file))
  : [];
if (bundles.length) {
  const newest = bundles.map(file => ({ file, mtime: fs.statSync(file).mtimeMs })).sort((a, b) => b.mtime - a.mtime)[0].file;
  const bundle = fs.readFileSync(newest, 'utf8');
  assert.doesNotMatch(bundle, /Cannot access .* before initialization/);
}
console.log('v31BertuturInitializationOrderAudit: PASS');
