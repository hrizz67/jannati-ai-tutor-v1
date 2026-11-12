// P2.6-F3 synthetic Chrome/Chromium accessibility viewport regression.
// Run only against an isolated local Vite qa-preview fixture, never production.
// Node 24 built-in fetch/WebSocket, no extra package or backend.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const fixture = 'http://127.0.0.1:4173/jannati-ai-tutor-v1/tests/browser/tutor-accessibility-chrome.html';
const chromeBin = process.env.CHROME_BIN || 'google-chrome';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const cases = [
  { name: 'actual-css-320x640', width: 320, height: 640 },
  { name: 'actual-css-390x844', width: 390, height: 844 },
  { name: 'actual-css-320x480-short', width: 320, height: 480 },
  { name: 'actual-css-640x480-landscape', width: 640, height: 480 },
  { name: 'actual-css-1280x800', width: 1280, height: 800 },
  // Reflow proxy: 640 CSS-wide layout reduced to half available CSS width,
  // plus larger root text. NOT a claim that native browser zoom was tested.
  { name: 'reflow-proxy-200pct-text-320x800', width: 320, height: 800, rootFontScale: '200%' }
];

function assert(value, message) {
  if (!value) throw new Error(message);
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.id = 0;
    this.pending = new Map();
    socket.addEventListener('message', event => {
      let data;
      try { data = JSON.parse(String(event.data)); }
      catch { return; }
      if (typeof data.id !== 'number') return;
      const waiter = this.pending.get(data.id);
      if (!waiter) return;
      this.pending.delete(data.id);
      clearTimeout(waiter.timer);
      if (data.error) waiter.reject(new Error(JSON.stringify(data.error)));
      else waiter.resolve(data.result || {});
    });
    socket.addEventListener('close', () => {
      for (const waiter of this.pending.values()) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error('CDP socket closed'));
      }
      this.pending.clear();
    });
  }
  call(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('CDP timed out: ' + method));
      }, 10000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.socket.close(); }
}

async function chromeDebugPort(dir) {
  const file = path.join(dir, 'DevToolsActivePort');
  for (let n = 0; n < 80; n++) {
    try {
      const lines = (await readFile(file, 'utf8')).trim().split('\n');
      const port = Number(lines[0]);
      if (port > 0) return port;
    } catch { /* Chrome starting */ }
    await sleep(100);
  }
  throw new Error('Chrome remote-debugging port did not initialize');
}

async function waitForWebsocket(url) {
  const socket = new WebSocket(url);
  await Promise.race([
    new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error('CDP websocket failed')), { once: true });
    }),
    sleep(8000).then(() => { throw new Error('CDP websocket opening timed out'); })
  ]);
  return socket;
}

async function inspect(client, testCase) {
  await client.call('Emulation.setDeviceMetricsOverride', {
    width: testCase.width,
    height: testCase.height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: testCase.width,
    screenHeight: testCase.height,
    scale: 1
  });
  await client.call('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  if (testCase.rootFontScale) {
    await client.call('Page.addScriptToEvaluateOnNewDocument', {
      source: 'document.addEventListener("DOMContentLoaded",function(){document.documentElement.style.fontSize='
        + JSON.stringify(testCase.rootFontScale) + ';},{once:true});'
    });
  }
  await client.call('Page.navigate', { url: fixture });
  let last;
  for (let n = 0; n < 80; n++) {
    const raw = await client.call('Runtime.evaluate', {
      expression: '(() => { const r=document.querySelector("#results");'
        + 'return { state:r?.dataset.browserSmoke||"pending",'
        + 'text:r?.textContent||"",'
        + 'width:innerWidth,height:innerHeight,'
        + 'rootFontSize:getComputedStyle(document.documentElement).fontSize,'
        + 'scrollWidth:document.documentElement.scrollWidth,'
        + 'devicePixelRatio:devicePixelRatio }; })()',
      returnByValue: true,
      awaitPromise: false
    });
    last = raw.result?.value;
    if (last?.state === 'pass' || last?.state === 'fail') break;
    await sleep(150);
  }
  assert(last?.state === 'pass', testCase.name + ' FAILED: ' + JSON.stringify(last));
  assert(last.width === testCase.width && last.height === testCase.height,
    testCase.name + ' CDP viewport mismatch: ' + JSON.stringify(last));
  assert(last.scrollWidth <= last.width + 2,
    testCase.name + ' document horizontal overflow: ' + JSON.stringify(last));
  if (testCase.rootFontScale) {
    assert(Number.parseFloat(last.rootFontSize) >= 30,
      testCase.name + ' root text did not scale 200%: ' + JSON.stringify(last));
  }
  process.stdout.write('CHROMIUM_CDP_PASS ' + testCase.name + ' '
    + last.width + 'x' + last.height + ' font=' + last.rootFontSize
    + ' scrollWidth=' + last.scrollWidth + '\n');
}

const tmp = await mkdtemp(path.join(tmpdir(), 'jannati-cdp-f3-'));
const browser = spawn(chromeBin, [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--disable-background-networking', '--disable-extensions',
  '--no-first-run', '--no-default-browser-check', '--disable-sync',
  '--remote-debugging-port=0', '--remote-allow-origins=*',
  '--user-data-dir=' + tmp, '--window-size=1000,1000', 'about:blank'
], { stdio: 'ignore' });

let client;
try {
  const port = await chromeDebugPort(tmp);
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
  const target = targets.find(t => t.type === 'page');
  assert(target?.webSocketDebuggerUrl, 'Chrome has no browser page target');
  client = new CdpClient(await waitForWebsocket(target.webSocketDebuggerUrl));
  await client.call('Page.enable');
  await client.call('Runtime.enable');
  for (const testCase of cases) await inspect(client, testCase);
  process.stdout.write('CHROMIUM_CDP_ALL_PASS ' + cases.length + ' exact-viewport checks\n');
} finally {
  client?.close();
  browser.kill('SIGTERM');
  await rm(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
