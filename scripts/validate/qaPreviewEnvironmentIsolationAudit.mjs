import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { requireQaPreviewRevision } from '../preview/qaPreviewPolicy.mjs';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');
const viteBinary = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const prepareScript = path.join(projectRoot, 'scripts', 'preview', 'prepareQaPreview.mjs');
const isolationAuditScript = path.join(projectRoot, 'scripts', 'validate', 'qaPreviewIsolationAudit.mjs');
const revision = requireQaPreviewRevision(process.env.VITE_BUILD_REVISION || process.env.GITHUB_SHA || '');

const inheritedSentinels = Object.freeze({
  VITE_SUPABASE_URL: 'https://inherited-backend-sentinel.invalid',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_inherited_sentinel_do_not_ship',
  VITE_STT_ENDPOINT: 'https://inherited-stt-sentinel.invalid/v1/transcribe',
  VITE_QUIZ_STT_ENDPOINT: 'https://inherited-quiz-stt-sentinel.invalid/v1/quiz/transcribe',
  VITE_QUIZ_MOBILE_STT_PILOT_ENABLED: 'inherited-pilot-enable-sentinel-do-not-ship',
  VITE_QUIZ_MOBILE_STT_AUTO_ENABLED: 'inherited-auto-enable-sentinel-do-not-ship'
});
const localFileSentinels = Object.freeze({
  VITE_SUPABASE_URL: 'https://local-file-backend-sentinel.invalid',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_file_sentinel_do_not_ship',
  VITE_STT_ENDPOINT: 'https://local-file-stt-sentinel.invalid/v1/transcribe',
  VITE_QUIZ_STT_ENDPOINT: 'https://local-file-quiz-stt-sentinel.invalid/v1/quiz/transcribe',
  VITE_QUIZ_MOBILE_STT_PILOT_ENABLED: 'local-file-pilot-enable-sentinel-do-not-ship',
  VITE_QUIZ_MOBILE_STT_AUTO_ENABLED: 'local-file-auto-enable-sentinel-do-not-ship'
});
const forbiddenSentinelFragments = [
  ...Object.values(inheritedSentinels),
  ...Object.values(localFileSentinels),
  'inherited-backend-sentinel.invalid',
  'inherited-stt-sentinel.invalid',
  'inherited-quiz-stt-sentinel.invalid',
  'local-file-backend-sentinel.invalid',
  'local-file-stt-sentinel.invalid',
  'local-file-quiz-stt-sentinel.invalid'
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function runNode(args, env, label) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    env,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n');
    throw new Error(`${label} failed.${detail ? `\n${detail}` : ''}`, { cause: result.error });
  }
}

function createBuildEnvironment(envDirectory, overrides = {}) {
  const env = {
    ...process.env,
    QA_PREVIEW_ENV_DIR: envDirectory,
    VITE_BUILD_REVISION: revision,
    ...overrides
  };
  return env;
}

async function assertSentinelsAbsent(label) {
  const roots = [path.join(projectRoot, 'dist'), path.join(projectRoot, 'qa-preview-site')];
  const files = (await Promise.all(roots.map(collectFiles))).flat();
  for (const file of files) {
    const content = await readFile(file);
    for (const sentinel of forbiddenSentinelFragments) {
      assert.equal(
        content.includes(Buffer.from(sentinel)),
        false,
        `${label} leaked dummy sentinel ${sentinel} into ${path.relative(projectRoot, file)}`
      );
    }
  }
}

async function buildPackageAndAudit(label, env) {
  runNode([viteBinary, 'build', '--mode', 'qa-preview'], env, `${label} Vite build`);
  runNode([prepareScript], env, `${label} artifact packaging`);
  runNode([isolationAuditScript], env, `${label} isolation and asset audit`);
  await assertSentinelsAbsent(label);
}

const temporaryEnvDirectory = await mkdtemp(path.join(tmpdir(), 'jannati-qa-preview-env-'));
try {
  const envLocal = Object.entries(localFileSentinels)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  await writeFile(path.join(temporaryEnvDirectory, '.env.local'), `${envLocal}\n`, 'utf8');

  const loadableLocalEnv = loadEnv('qa-preview', temporaryEnvDirectory, '');
  for (const [key, value] of Object.entries(localFileSentinels)) {
    assert.equal(loadableLocalEnv[key], value, `.env.local sentinel ${key} must be loadable by Vite before the negative build.`);
  }

  await buildPackageAndAudit(
    'Inherited environment sentinel build',
    createBuildEnvironment(temporaryEnvDirectory, inheritedSentinels)
  );

  const localFileEnvironment = createBuildEnvironment(temporaryEnvDirectory);
  for (const key of Object.keys(localFileSentinels)) delete localFileEnvironment[key];
  await buildPackageAndAudit('.env.local sentinel build', localFileEnvironment);
} finally {
  await rm(temporaryEnvDirectory, { recursive: true, force: true });
}

console.log('Environment isolation PASS: inherited environment and .env.local dummy sentinels are absent from JavaScript, HTML and preview configuration.');
