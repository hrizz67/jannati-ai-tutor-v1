// Explicitly local, build-artifact-only QA route. Never deploy from this script.
// The process environment is reconstructed to prevent unrelated inherited VITE_*
// variables (or .env.local) from silently enabling production integrations.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateQuizSttQaConfig } from './quizSttQaPolicy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = validateQuizSttQaConfig(process.env);
const passThrough = [
  'PATH', 'Path', 'PATHEXT', 'SystemRoot', 'WINDIR', 'HOME', 'USERPROFILE',
  'TMP', 'TEMP', 'TMPDIR', 'CI', 'GITHUB_ACTIONS', 'NODE_OPTIONS'
];
const clean = {};
for (const key of passThrough) {
  if (typeof process.env[key] === 'string') clean[key] = process.env[key];
}
for (const name of [
  'VITE_BUILD_REVISION', 'QUIZ_STT_QA_CONFIRM', 'QUIZ_STT_QA_ORIGIN',
  'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_QUIZ_STT_ENDPOINT'
]) clean[name] = process.env[name];

console.log('Building isolated Quiz STT QA artifact for revision ' + config.revision + ' (no deployment).');
const vite = path.join(root, 'node_modules/vite/bin/vite.js');
const build = spawnSync(process.execPath, [vite, 'build', '--mode', 'quiz-stt-qa'], {
  cwd: root, stdio: 'inherit', env: clean
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status || 1);

const prepare = path.join(root, 'scripts/preview/prepareQuizSttQa.mjs');
const packaging = spawnSync(process.execPath, [prepare], {
  cwd: root, stdio: 'inherit', env: clean
});
if (packaging.error) throw packaging.error;
if (packaging.status !== 0) process.exit(packaging.status || 1);
console.log('QA build only. No hosting, Cloudflare Worker update or production release was performed.');
