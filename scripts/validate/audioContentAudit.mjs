import fs from 'node:fs';
const app = fs.readFileSync('src/App.jsx', 'utf8');
const speech = fs.readFileSync('src/ai/speech/speechEngine.js', 'utf8');
const checks = {
  readingData: /readingPassages/.test(app),
  listeningData: /listening|Mendengar/.test(app),
  speakingData: /Bertutur|speaking/i.test(app),
  writingData: /Menulis|writing/i.test(app),
  speechFallback: /speechSynthesis|supportsSpeech|unsupported/i.test(`${app}\n${speech}`),
  cancellation: /cancel\(|abort\(|stop/.test(`${app}\n${speech}`),
  noEmptyAudioSource: !/audioSrc:\s*['"]['"]|src:\s*['"]['"]/.test(app)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures, note: 'Audio hardware and Safari playback still require manual device testing.' };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/audio-content-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
