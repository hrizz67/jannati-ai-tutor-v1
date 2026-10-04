import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const requiredFiles = [
  '.env.example',
  'vite.config.mjs',
  'src/ai/speech/sttAdapter.js',
  'workers/stt/src/index.js',
  'workers/stt/wrangler.jsonc'
];

const productionSource = requiredFiles
  .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');

const distDirectory = path.join(root, 'dist', 'assets');
const bundleSource = fs.existsSync(distDirectory)
  ? fs.readdirSync(distDirectory)
    .filter(file => file.endsWith('.js'))
    .map(file => fs.readFileSync(path.join(distDirectory, file), 'utf8'))
    .join('\n')
  : '';

const checkedSource = `${productionSource}\n${bundleSource}`;

[
  /CLOUDFLARE_API_TOKEN\s*=/i,
  /CF_API_TOKEN\s*=/i,
  /VITE_(?:CLOUDFLARE|CF|WORKERS)[A-Z0-9_]*(?:TOKEN|KEY)/i,
  /Authorization\s*[:=]\s*["']?Bearer\s+[A-Za-z0-9._~-]{16,}/i,
  /api\.cloudflare\.com\/client\/v4\/accounts/i
].forEach(pattern => {
  assert.doesNotMatch(checkedSource, pattern, `STT credential safety failed for ${pattern}.`);
});

const adapterSource = fs.readFileSync(path.join(root, 'src/ai/speech/sttAdapter.js'), 'utf8');
assert.match(adapterSource, /credentials:\s*'omit'/, 'Browser STT requests must omit credentials.');
assert.doesNotMatch(adapterSource, /['"]Authorization['"]\s*:/, 'Browser STT must not send an authorization header.');

const workerSource = fs.readFileSync(path.join(root, 'workers/stt/src/index.js'), 'utf8');
assert.doesNotMatch(workerSource, /console\./, 'Worker must not log audio or transcript content.');
assert.doesNotMatch(workerSource, /\b(?:KV|R2|D1|DurableObject)\b/, 'Worker must not add persistent storage bindings.');

console.log('P1.10 STT credential safety audit: PASS');
