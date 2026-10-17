import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QA_PREVIEW_BASE_PATH, requireQaPreviewRevision } from '../preview/qaPreviewPolicy.mjs';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');
const outputDirectory = path.join(projectRoot, 'qa-preview-site');
const applicationDirectory = path.join(outputDirectory, QA_PREVIEW_BASE_PATH.replace(/^\/+|\/+$/g, ''));

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

const expectedRevision = requireQaPreviewRevision(process.env.VITE_BUILD_REVISION || process.env.GITHUB_SHA || '');
const manifest = JSON.parse(await readFile(path.join(outputDirectory, 'qa-preview-manifest.json'), 'utf8'));
const headers = await readFile(path.join(outputDirectory, '_headers'), 'utf8');
const redirects = await readFile(path.join(outputDirectory, '_redirects'), 'utf8');
const indexHtml = await readFile(path.join(applicationDirectory, 'index.html'), 'utf8');
const serviceWorker = await readFile(path.join(applicationDirectory, 'service-worker.js'), 'utf8');

assert.equal(manifest.revision, expectedRevision, 'Preview manifest must identify the exact immutable source SHA.');
assert.equal(manifest.basePath, QA_PREVIEW_BASE_PATH, 'Preview manifest base path must match the production-compatible application path.');
assert.deepEqual(manifest.backend, {
  supabaseConfigured: false,
  sttConfigured: false,
  cloudWritesEnabled: false
}, 'Preview backend integrations must be disabled.');
assert.deepEqual(manifest.qa, {
  exactIdHarnessEnabled: false,
  r3aEnabled: false,
  r3bEnabled: false
}, 'P1.16F must not activate the deferred R3A/R3B harness.');

assert.match(headers, /X-Robots-Tag:\s*noindex, nofollow, noarchive/i, 'Cloudflare Pages headers must block indexing.');
assert.match(headers, /connect-src 'self'/i, 'Preview CSP must block remote backend connections.');
assert.match(headers, /frame-ancestors 'none'/i, 'Preview must not be embeddable by another site.');
assert.match(redirects, new RegExp(`^/ ${QA_PREVIEW_BASE_PATH.replaceAll('/', '\\/')} 302`, 'm'), 'Preview root must redirect to the established base path.');

assert.match(indexHtml, new RegExp(`${QA_PREVIEW_BASE_PATH.replaceAll('/', '\\/')}assets\/index-[^"']+\\.js`), 'Preview entry must retain the established base path.');
assert.match(serviceWorker, /const BASE = '\/jannati-ai-tutor-v1\/'/, 'Service worker scope must remain inside the preview origin base path.');

const artifactFiles = await collectFiles(applicationDirectory);
const scriptFiles = artifactFiles.filter(file => file.endsWith('.js'));
assert.ok(scriptFiles.length > 0, 'QA preview artifact must include built JavaScript.');
const scripts = (await Promise.all(scriptFiles.map(file => readFile(file, 'utf8')))).join('\n');
assert.match(scripts, /PRATONTON QA TERASING/, 'QA preview must visibly identify itself.');
assert.match(scripts, /Backend dimatikan/, 'QA preview must state that backend integrations are disabled.');
assert.doesNotMatch(scripts, /https?:\/\/[a-z0-9-]+\.supabase\.co/i, 'QA preview must not embed a Supabase project URL.');
assert.doesNotMatch(scripts, /sb_(?:publishable|secret)_[a-z0-9_-]+/i, 'QA preview must not embed a Supabase key.');
assert.doesNotMatch(scripts, /workers\.dev\/v1\/transcribe/i, 'QA preview must not embed the production STT endpoint.');
assert.doesNotMatch(scripts, /ci-placeholder\.supabase\.co/i, 'QA preview must not inherit CI placeholder configuration.');

const emptyFiles = [];
for (const file of artifactFiles) {
  if ((await stat(file)).size === 0) emptyFiles.push(path.relative(applicationDirectory, file));
}
assert.deepEqual(emptyFiles, [], `QA preview contains empty build files: ${emptyFiles.join(', ')}`);

console.log(`QA preview isolation PASS: ${artifactFiles.length} app files, revision ${expectedRevision}.`);
console.log('Backend isolation PASS: Supabase, STT, cloud writes, R3A and R3B are disabled.');
