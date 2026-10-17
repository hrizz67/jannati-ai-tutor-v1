import assert from 'node:assert/strict';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QA_PREVIEW_BASE_PATH, requireQaPreviewRevision } from './qaPreviewPolicy.mjs';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');
const distDirectory = path.join(projectRoot, 'dist');
const outputDirectory = path.join(projectRoot, 'qa-preview-site');
const nestedApplicationDirectory = path.join(
  outputDirectory,
  QA_PREVIEW_BASE_PATH.replace(/^\/+|\/+$/g, '')
);

assert.equal(path.dirname(outputDirectory), projectRoot, 'QA preview output must stay directly inside the project root.');

const revision = requireQaPreviewRevision(process.env.VITE_BUILD_REVISION || process.env.GITHUB_SHA || '');
const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(nestedApplicationDirectory, { recursive: true });
await cp(distDirectory, nestedApplicationDirectory, { recursive: true });

const headers = `/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-store, max-age=0
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Permissions-Policy: camera=(), geolocation=(), microphone=(self)
  Content-Security-Policy: default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; manifest-src 'self'; media-src 'self' blob: data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:
`;

const redirects = `/ ${QA_PREVIEW_BASE_PATH} 302
${QA_PREVIEW_BASE_PATH.slice(0, -1)} ${QA_PREVIEW_BASE_PATH} 302
`;

const previewManifest = {
  schemaVersion: 1,
  application: packageJson.name,
  version: packageJson.version,
  revision,
  basePath: QA_PREVIEW_BASE_PATH,
  backend: {
    supabaseConfigured: false,
    sttConfigured: false,
    cloudWritesEnabled: false
  },
  qa: {
    exactIdHarnessEnabled: false,
    r3aEnabled: false,
    r3bEnabled: false
  }
};

await Promise.all([
  writeFile(path.join(outputDirectory, '_headers'), headers, 'utf8'),
  writeFile(path.join(outputDirectory, '_redirects'), redirects, 'utf8'),
  writeFile(path.join(outputDirectory, 'qa-preview-manifest.json'), `${JSON.stringify(previewManifest, null, 2)}\n`, 'utf8')
]);

console.log(`QA preview artifact prepared for ${revision} at qa-preview-site/.`);
