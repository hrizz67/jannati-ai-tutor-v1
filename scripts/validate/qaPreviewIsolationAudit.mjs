import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QA_PREVIEW_BASE_PATH, requireQaPreviewRevision } from '../preview/qaPreviewPolicy.mjs';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');
const outputDirectory = path.join(projectRoot, 'qa-preview-site');
const applicationDirectory = path.join(outputDirectory, QA_PREVIEW_BASE_PATH.replace(/^\/+|\/+$/g, ''));
const productionOriginPattern = /https?:\/\/hrizz67\.github\.io(?:\/|$)/i;
const assetExtensionPattern = /\.(?:css|gif|html?|ico|jpe?g|js|json|m4a|mp3|ogg|otf|png|svg|ttf|wav|webmanifest|webp|woff2?)(?:[?#].*)?$/i;
const textAssetPattern = /\.(?:css|html?|js|json|svg|txt|webmanifest)$/i;

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

function stripQueryAndHash(reference = '') {
  return String(reference).trim().split(/[?#]/, 1)[0];
}

function isRemoteReference(reference = '') {
  return /^(?:https?:)?\/\//i.test(String(reference).trim());
}

function resolveApplicationReference(reference, sourceFile) {
  const cleanReference = stripQueryAndHash(reference);
  assert.ok(cleanReference, `Asset reference in ${path.relative(applicationDirectory, sourceFile)} must not be empty.`);
  assert.equal(isRemoteReference(cleanReference), false, `Remote asset reference is not allowed: ${reference}`);

  let resolved;
  if (cleanReference.startsWith('/')) {
    assert.ok(
      cleanReference.startsWith(QA_PREVIEW_BASE_PATH),
      `Root asset reference must stay under ${QA_PREVIEW_BASE_PATH}: ${reference}`
    );
    resolved = path.resolve(applicationDirectory, cleanReference.slice(QA_PREVIEW_BASE_PATH.length));
  } else if (/^(?:assets|brand)\//i.test(cleanReference)) {
    resolved = path.resolve(applicationDirectory, cleanReference);
  } else {
    resolved = path.resolve(path.dirname(sourceFile), cleanReference);
  }

  const relative = path.relative(applicationDirectory, resolved);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `Asset reference escapes the preview application: ${reference}`);
  return resolved;
}

function addReference(referenceMap, sourceFile, reference, kind) {
  const normalized = String(reference || '').trim();
  if (!normalized || normalized.startsWith('data:') || normalized.startsWith('blob:') || normalized.startsWith('#')) return;
  if (!assetExtensionPattern.test(normalized) && kind !== 'service-worker-precache') return;
  const key = `${sourceFile}\0${normalized}`;
  if (!referenceMap.has(key)) referenceMap.set(key, { sourceFile, reference: normalized, kind });
}

function collectTextReferences(referenceMap, sourceFile, source) {
  const extension = path.extname(sourceFile).toLowerCase();
  const htmlAttributePattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  const cssUrlPattern = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  const moduleImportPattern = /\b(?:from\s*|import\s*\(\s*)["'`]([^"'`]+)["'`]/g;
  const quotedAssetPattern = /["'`]((?:(?:https?:)?\/\/|\/jannati-ai-tutor-v1\/|\.\.?\/|assets\/)[^"'`\s]+?\.(?:css|gif|html?|ico|jpe?g|js|json|m4a|mp3|ogg|otf|png|svg|ttf|wav|webmanifest|webp|woff2?)(?:[?#][^"'`\s]*)?)["'`]/gi;

  if (extension === '.html' || extension === '.htm') {
    for (const match of source.matchAll(htmlAttributePattern)) addReference(referenceMap, sourceFile, match[1], 'html');
  }
  if (extension === '.css') {
    for (const match of source.matchAll(cssUrlPattern)) addReference(referenceMap, sourceFile, match[1], 'css');
  }
  if (extension === '.js') {
    for (const match of source.matchAll(moduleImportPattern)) addReference(referenceMap, sourceFile, match[1], 'javascript');
  }
  for (const match of source.matchAll(quotedAssetPattern)) addReference(referenceMap, sourceFile, match[1], 'embedded');
}

function collectJsonReferences(referenceMap, sourceFile, value) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonReferences(referenceMap, sourceFile, item);
    return;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectJsonReferences(referenceMap, sourceFile, item);
    return;
  }
  if (typeof value === 'string') addReference(referenceMap, sourceFile, value, 'manifest-or-json');
}

async function assertManifestIntegrity(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, `${path.basename(manifestPath)} must declare icons.`);
  for (const icon of manifest.icons) {
    const resolved = resolveApplicationReference(icon.src, manifestPath);
    assert.equal((await stat(resolved)).isFile(), true, `Manifest icon is missing: ${icon.src}`);
  }
  for (const key of ['start_url', 'scope']) {
    const reference = String(manifest[key] || '');
    assert.equal(isRemoteReference(reference), false, `Manifest ${key} must not use a remote origin.`);
    const cleanReference = stripQueryAndHash(reference);
    const resolved = cleanReference === './' || cleanReference === QA_PREVIEW_BASE_PATH
      ? applicationDirectory
      : resolveApplicationReference(cleanReference, manifestPath);
    assert.equal((await stat(resolved)).isDirectory(), true, `Manifest ${key} must resolve to the preview application.`);
  }
}

async function auditAssetIntegrity(artifactFiles, serviceWorker) {
  const referenceMap = new Map();
  const textFiles = artifactFiles.filter(file => textAssetPattern.test(file));

  for (const file of textFiles) {
    const source = await readFile(file, 'utf8');
    collectTextReferences(referenceMap, file, source);
    if (/\.(?:json|webmanifest)$/i.test(file)) {
      try {
        collectJsonReferences(referenceMap, file, JSON.parse(source.replace(/^\uFEFF/, '')));
      } catch (error) {
        throw new Error(`Invalid JSON asset ${path.relative(applicationDirectory, file)}: ${error.message}`);
      }
    }
  }

  for (const match of serviceWorker.matchAll(/\$\{BASE\}([^`'"}]+)/g)) {
    addReference(referenceMap, path.join(applicationDirectory, 'service-worker.js'), `${QA_PREVIEW_BASE_PATH}${match[1]}`, 'service-worker-precache');
  }

  const counts = { html: 0, javascript: 0, css: 0, manifestOrJson: 0, serviceWorkerPrecache: 0, embedded: 0 };
  for (const { sourceFile, reference, kind } of referenceMap.values()) {
    const resolved = resolveApplicationReference(reference, sourceFile);
    assert.equal((await stat(resolved)).isFile(), true, `Referenced ${kind} asset is missing: ${reference}`);
    if (kind === 'manifest-or-json') counts.manifestOrJson += 1;
    else if (kind === 'service-worker-precache') counts.serviceWorkerPrecache += 1;
    else counts[kind] += 1;
  }

  await assertManifestIntegrity(path.join(applicationDirectory, 'manifest.webmanifest'));
  await assertManifestIntegrity(path.join(applicationDirectory, 'manifest.json'));
  const references = [...referenceMap.values()];
  assert.ok(references.some(({ reference }) => /\.js(?:[?#].*)?$/i.test(reference)), 'Asset audit must inspect JavaScript and lazy-chunk references.');
  assert.ok(references.some(({ reference }) => /\.css(?:[?#].*)?$/i.test(reference)), 'Asset audit must inspect CSS references.');
  assert.ok(counts.manifestOrJson > 0, 'Asset audit must inspect manifest or JSON asset references.');
  assert.ok(counts.serviceWorkerPrecache > 0, 'Asset audit must inspect service-worker precache references.');

  return { references: referenceMap.size, ...counts };
}

const expectedRevision = requireQaPreviewRevision(process.env.VITE_BUILD_REVISION || process.env.GITHUB_SHA || '');
const manifestPath = path.join(outputDirectory, 'qa-preview-manifest.json');
const headersPath = path.join(outputDirectory, '_headers');
const redirectsPath = path.join(outputDirectory, '_redirects');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const headers = await readFile(headersPath, 'utf8');
const redirects = await readFile(redirectsPath, 'utf8');
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
assert.doesNotMatch(`${headers}\n${redirects}\n${JSON.stringify(manifest)}`, productionOriginPattern, 'Preview configuration must not reference the production origin.');

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

const assetIntegrity = await auditAssetIntegrity(artifactFiles, serviceWorker);
console.log(`QA preview isolation PASS: ${artifactFiles.length} app files, revision ${expectedRevision}.`);
console.log('Backend isolation PASS: Supabase, STT, cloud writes, R3A and R3B are disabled.');
console.log(`Asset integrity PASS: ${assetIntegrity.references} references across HTML, JS/lazy chunks, CSS, manifests/icons and service-worker precache.`);
