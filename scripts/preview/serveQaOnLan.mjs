// Manual, trusted-LAN-only staging of the immutable *isolated* QA preview.
// Does NOT build/deploy production or enable authentication/STT/cloud/AI.
// Run only after: VITE_BUILD_REVISION=<exact HEAD SHA> npm run build:qa-preview.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../qa-preview-site');
const manifest = JSON.parse(await readFile(path.join(root, 'qa-preview-manifest.json'), 'utf8'));
const revision = String(manifest.revision || '');
assert.match(revision, /^[0-9a-f]{40}$/u, 'QA revision must be a full immutable SHA.');
assert.equal(manifest.basePath, '/jannati-ai-tutor-v1/');
for (const key of ['supabaseConfigured', 'sttConfigured', 'cloudWritesEnabled']) {
  assert.equal(manifest.backend?.[key], false, 'Refusing QA LAN serve: backend ' + key + ' is enabled.');
}
for (const key of ['exactIdHarnessEnabled', 'r3aEnabled', 'r3bEnabled']) {
  assert.equal(manifest.qa?.[key], false, 'Refusing QA LAN serve: disallowed QA flag ' + key + '.');
}
const head = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: path.resolve(root, '..'), encoding: 'utf8'
}).trim().toLowerCase();
assert.equal(revision, head, 'QA preview SHA does not match checked-out git HEAD.');
const port = Number(process.env.JANNATI_QA_LAN_PORT || 4173);
assert(Number.isSafeInteger(port) && port >= 1024 && port <= 65535, 'Invalid QA LAN port.');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg'
};

const server = createServer(async (req, res) => {
  const headers = {
    'Cache-Control': 'private, no-store, max-age=0',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; manifest-src 'self'; media-src 'self' blob: data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:"
  };
  const fail = (status, message) => {
    res.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
  };
  if (!['GET', 'HEAD'].includes(req.method || '')) return fail(405, 'Method not allowed');
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); }
  catch { return fail(400, 'Invalid path'); }
  if (urlPath === '/' || urlPath === '/jannati-ai-tutor-v1') {
    res.writeHead(302, { ...headers, Location: '/jannati-ai-tutor-v1/' });
    res.end();
    return;
  }
  // Only serve the packaged nested QA app and its nonsecret manifest.
  if (urlPath !== '/qa-preview-manifest.json'
    && !urlPath.startsWith('/jannati-ai-tutor-v1/')) return fail(404, 'Not found');
  const filePath = path.resolve(root, '.' + urlPath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) return fail(403, 'Forbidden');
  let target = filePath;
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = path.join(target, 'index.html');
    else if (!info.isFile()) return fail(404, 'Not found');
    const fileInfo = await stat(target);
    const ext = path.extname(target).toLowerCase();
    if (!contentTypes[ext]) return fail(404, 'Unsupported asset');
    res.writeHead(200, {
      ...headers, 'Content-Type': contentTypes[ext], 'Content-Length': fileInfo.size
    });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(target).pipe(res);
  } catch { fail(404, 'Not found'); }
});

server.listen(port, '0.0.0.0', () => {
  process.stdout.write('JANNATI QA ONLY (NO BACKEND) exact SHA ' + revision + '\n');
  process.stdout.write('Use a trusted PRIVATE Wi-Fi/LAN only. Do not expose router ports.\n');
  for (const entries of Object.values(networkInterfaces())) {
    for (const item of entries || []) {
      if (item.family === 'IPv4' && !item.internal) {
        process.stdout.write('Phone URL: http://' + item.address + ':' + port
          + '/jannati-ai-tutor-v1/\n');
      }
    }
  }
  process.stdout.write('Stop with Ctrl+C after device tests. HTTPS-only APIs/voice/STT'
    + ' must remain untested in this LAN fixture.\n');
});
