// Separate, never-auto-deployed QA hosting artifact for physical audio tests.
// Protected hosting and exact Worker CORS are mandatory external gates.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  QUIZ_STT_QA_BASE_PATH, QUIZ_STT_QA_OUTPUT, validateQuizSttQaConfig
} from './quizSttQaPolicy.mjs';
import {
  QUIZ_STT_QA_ACCESS_BINDINGS,
  buildQuizSttQaAccessWorker
} from './quizSttQaAccessWorker.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = validateQuizSttQaConfig(process.env);
const dist = path.join(root, 'dist');
const output = path.join(root, QUIZ_STT_QA_OUTPUT);
const nested = path.join(output, QUIZ_STT_QA_BASE_PATH.replace(/^\/+|\/+$/g, ''));
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const workerOrigin = new URL(config.quizEndpoint).origin;

await rm(output, { recursive: true, force: true });
await mkdir(nested, { recursive: true });
await cp(dist, nested, { recursive: true });

const headers = `/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-store, max-age=0
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Permissions-Policy: camera=(), geolocation=(), microphone=(self)
  Content-Security-Policy: default-src 'self'; base-uri 'self'; connect-src 'self' ${config.supabaseOrigin} ${workerOrigin}; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; manifest-src 'self'; media-src 'self' blob: data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:
`;
const redirects = `/ ${QUIZ_STT_QA_BASE_PATH} 302
${QUIZ_STT_QA_BASE_PATH.slice(0, -1)} ${QUIZ_STT_QA_BASE_PATH} 302
`;
const accessWorker = buildQuizSttQaAccessWorker({
  supabaseOrigin: config.supabaseOrigin,
  workerOrigin
});

await Promise.all([
  writeFile(path.join(output, '_headers'), headers, 'utf8'),
  writeFile(path.join(output, '_redirects'), redirects, 'utf8'),
  writeFile(path.join(output, '_worker.js'), accessWorker, 'utf8'),
  writeFile(path.join(output, 'qa-quiz-stt-manifest.json'), JSON.stringify({
    schemaVersion: 1,
    appVersion: packageJson.version,
    revision: config.revision,
    intendedOrigin: config.qaOrigin,
    basePath: QUIZ_STT_QA_BASE_PATH,
    buildType: 'isolated-private-quiz-stt-test-artifact-not-deployed',
    activation: {
      serverKillSwitchRequired: true,
      userAllowlistRequired: true,
      siteAccessGateRequired: true,
      siteAccessMode: 'pages-function-basic-auth',
      siteAccessBindings: Object.values(QUIZ_STT_QA_ACCESS_BINDINGS),
      queryOptInRequired: true
    },
    integrations: {
      testSupabaseAuth: true,
      isolatedQuizSttWorker: true,
      sharedReadingSpeakingStt: false
    }
  }, null, 2) + '\n', 'utf8')
]);
// Prove the generated browser JS actually points at the dedicated QA Worker
// and test Supabase project. A successful Vite exit alone cannot prove routing.
const assetDirectory = path.join(nested, 'assets');
const jsFiles = (await readdir(assetDirectory)).filter(name => name.endsWith('.js'));
const browserCode = (await Promise.all(jsFiles.map(name => readFile(path.join(assetDirectory, name), 'utf8')))).join('\\n');
if (!jsFiles.length || !browserCode.includes(config.quizEndpoint) ||
    !browserCode.includes(config.supabaseOrigin) ||
    !browserCode.includes(config.publishableKey)) {
  throw new Error('QA artifact routing mismatch: missing dedicated Worker or test Supabase bootstrap.');
}
// Normal application logic may legitimately contain the string "service_role";
// only reject actual server-only secret-key shapes here.
if (/sb_secret_[A-Za-z0-9_-]{8,}/.test(browserCode)) {
  throw new Error('QA artifact contains a server-only Supabase secret key.');
}
const configText = (await readFile(path.join(output, 'qa-quiz-stt-manifest.json'), 'utf8'))
  + (await readFile(path.join(output, '_headers'), 'utf8'))
  + (await readFile(path.join(output, '_worker.js'), 'utf8'));
if (configText.includes('sb_publishable_') || configText.includes(config.quizEndpoint)) {
  throw new Error('QA packaging must never write publishable keys or precise endpoint paths into metadata.');
}
if (!accessWorker.includes(QUIZ_STT_QA_ACCESS_BINDINGS.username)
    || !accessWorker.includes(QUIZ_STT_QA_ACCESS_BINDINGS.password)
    || /Basic\s+[A-Za-z0-9+/=]{16,}/.test(accessWorker)) {
  throw new Error('QA site access gate is missing or contains embedded credentials.');
}
console.log('Prepared private QA-only site artifact at ' + QUIZ_STT_QA_OUTPUT + '/.');
console.log('Not deployed. Pages access secrets, Worker secret setup and learner consent remain operator gates.');
