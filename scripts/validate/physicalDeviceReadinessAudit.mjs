import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

function assertIncludes(source, expected, message) {
  assert.equal(source.includes(expected), true, message);
}

const [
  indexHtml,
  app,
  styles,
  connectivityNotice,
  dashboardHelpers,
  main,
  serviceWorker,
  manifestSource,
  voiceButton,
  protocol
] = await Promise.all([
  read('index.html'),
  read('src/App.jsx'),
  read('src/styles/style.css'),
  read('src/components/ConnectivityNotice.jsx'),
  read('src/dashboard/dashboardHelpers.jsx'),
  read('src/main.jsx'),
  read('public/service-worker.js'),
  read('public/manifest.webmanifest'),
  read('src/components/VoiceButton.jsx'),
  read('docs/PHYSICAL_DEVICE_ACCEPTANCE_V1_PROTOCOL.md')
]);

const manifest = JSON.parse(manifestSource);
const checks = [];
function check(name, assertion) {
  assertion();
  checks.push(name);
}

check('ios-viewport-contract', () => {
  assert.match(indexHtml, /name=['"]viewport['"][^>]+viewport-fit=cover/i, 'iOS safe-area viewport-fit=cover is required.');
  assert.doesNotMatch(indexHtml, /maximum-scale|user-scalable\s*=\s*no/i, 'Viewport zoom must not be disabled.');
});

check('installable-mobile-metadata', () => {
  assert.match(indexHtml, /rel=['"]manifest['"][^>]+\/manifest\.webmanifest/i, 'The web manifest must use a Vite public-root path.');
  for (const asset of ['manifest.webmanifest', 'brand/icons/favicon.ico', 'brand/icons/apple-touch-icon.png']) {
    assertIncludes(indexHtml, `/${asset}`, `Mobile metadata asset must use a Vite public-root path: ${asset}`);
  }
  assertIncludes(indexHtml, "name='apple-mobile-web-app-capable' content='yes'", 'Apple standalone metadata is missing.');
  assertIncludes(indexHtml, "rel='apple-touch-icon'", 'Apple touch icon is missing.');
  assert.equal(manifest.display, 'standalone', 'Manifest display mode must remain standalone.');
  assert.equal(manifest.orientation, 'portrait', 'Primary physical-device orientation must remain portrait.');
  for (const size of ['192x192', '512x512']) {
    assert.equal(manifest.icons.some(icon => icon.sizes === size), true, `Manifest icon ${size} is missing.`);
  }
  assert.equal(manifest.icons.some(icon => String(icon.purpose || '').includes('maskable')), true, 'A maskable app icon is required.');
});

check('offline-shell-contract', () => {
  assertIncludes(main, '`${import.meta.env.BASE_URL}service-worker.js?v=19`', 'Service-worker registration must use the build base URL and current cache version.');
  assertIncludes(main, 'import.meta.env.PROD', 'Service worker must not cache source modules during local development.');
  assertIncludes(serviceWorker, "CACHE_NAME = 'jannati-ai-tutor-device-v19'", 'Physical-device cache version is missing.');
  for (const token of ['manifest.webmanifest', "self.addEventListener('install'", "self.addEventListener('activate'", "self.addEventListener('fetch'", 'caches.match(BASE)']) {
    assertIncludes(serviceWorker, token, `Offline shell token is missing: ${token}`);
  }
});

check('safe-area-and-dynamic-viewport', () => {
  for (const inset of ['top', 'right', 'bottom', 'left']) {
    assertIncludes(styles, `safe-area-inset-${inset}`, `Safe-area ${inset} handling is missing.`);
  }
  assertIncludes(styles, '100dvh', 'Dynamic mobile viewport units are required for full-height surfaces.');
  assert.match(styles, /\.connectivity-notice\s*\{[^}]*min-height:\s*44px/s, 'Connectivity notice must meet the 44px mobile target.');
});

check('connectivity-announcement', () => {
  for (const token of ["addEventListener('offline'", "addEventListener('online'", 'role="status"', 'aria-live="polite"', 'aria-atomic="true"']) {
    assertIncludes(connectivityNotice, token, `Connectivity accessibility token is missing: ${token}`);
  }
  assertIncludes(connectivityNotice, 'simpanan pada peranti masih boleh diteruskan', 'Offline continuation copy is missing.');
  assertIncludes(connectivityNotice, 'Perubahan akaun akan disegerakkan semula', 'Reconnect copy is missing.');
});

check('offline-cloud-deferral', () => {
  assertIncludes(app, 'pendingOfflineCloudSaveRef', 'Pending offline cloud state is missing.');
  assertIncludes(app, 'navigator.onLine === false', 'Cloud operations must guard offline state.');
  assertIncludes(app, "addEventListener('online', retryPendingCloudSave)", 'Pending cloud writes must retry after reconnect.');
  assertIncludes(dashboardHelpers, "offline: 'Menunggu sambungan internet'", 'Settings must explain deferred sync status.');
});

check('speech-and-audio-fallback', () => {
  assertIncludes(voiceButton, 'supportsVoice()', 'Audio controls must detect device voice support.');
  assertIncludes(voiceButton, 'Voice bahasa ini tiada pada peranti.', 'Unavailable device voice needs a visible fallback.');
  assertIncludes(app, 'isIOSSafari', 'iOS Safari speech handling is missing.');
  assertIncludes(app, 'Gunakan transkrip manual.', 'Safari speech failure must expose manual transcription.');
  assertIncludes(app, 'Pelayar ini tidak menyokong pengecaman suara. Taip bacaan kamu di bawah.', 'Unsupported recognition must retain manual input.');
});

check('reduced-motion-contract', () => {
  assertIncludes(styles, '@media (prefers-reduced-motion: reduce)', 'Reduced-motion support is required.');
  assert.match(styles, /animation:\s*none\s*!important/, 'Reduced-motion mode must stop non-essential animation.');
});

check('hardware-evidence-protocol', () => {
  for (const token of ['NOT RUN', 'iPhone Safari', 'Android Chrome', 'VoiceOver', 'TalkBack', 'Airplane mode', 'Screenshot / video', 'OS and browser version']) {
    assertIncludes(protocol, token, `Physical-device protocol is missing: ${token}`);
  }
  assertIncludes(protocol, 'Automated readiness is not physical-device acceptance', 'Protocol must not overstate simulated coverage.');
});

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Physical-device Readiness V1',
  checks: checks.length,
  boundary: 'Hardware execution remains NOT RUN until evidence is recorded.',
  coverage: {
    iosMetadataAndSafeArea: true,
    pwaAndOfflineShell: true,
    networkRecovery: true,
    speechFallbacks: true,
    reducedMotion: true,
    hardwareProtocol: true
  }
}, null, 2));
