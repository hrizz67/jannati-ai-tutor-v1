import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import ParentAccessGate from '../../src/components/parent/ParentAccessGate.jsx';
import ParentModeBoundary from '../../src/components/parent/ParentModeBoundary.jsx';
import {
  PARENT_SECURITY_STORAGE_PREFIX, createParentPinSubmission, getParentAccessMessage,
  probeParentAccessCapabilities, saveParentPin, verifyParentPin
} from '../../src/services/parentAccess.js';

const results = document.getElementById('results');
const button = document.getElementById('run-checks');
const fixture = document.getElementById('fixture');
const root = createRoot(fixture);
const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
const assert = (condition, label) => { if (!condition) throw new Error(label); };
async function until(predicate, label, timeout = 5000) {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout) throw new Error(label);
    await wait(20);
  }
}
function render(element) { flushSync(() => root.render(element)); }
function fill(selector, value) {
  const input = fixture.querySelector(selector);
  assert(input, 'Input must exist');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
  flushSync(() => input.dispatchEvent(new Event('input', { bubbles: true })));
}
function submit() {
  const form = fixture.querySelector('form');
  assert(form, 'PIN form must exist');
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}
async function enterPin(setupMode = false) {
  await until(() => fixture.querySelector('#parent-pin'), 'PIN input ready');
  fill('#parent-pin', '2468');
  if (setupMode) fill('#parent-pin-confirm', '2468');
  submit();
}

button.addEventListener('click', async () => {
  if (!import.meta.env.DEV || button.disabled) return;
  button.disabled = true;
  const ids = [];
  const lines = [];
  const makeId = () => { const id = 'parent-runtime-' + crypto.randomUUID(); ids.push(id); return id; };
  const pass = label => { lines.push('PASS: ' + label); results.textContent = lines.join('\n'); };
  const originalRemove = Storage.prototype.removeItem;
  const originalTimeout = window.setTimeout;
  try {
    results.textContent = 'Running in real browser…';
    const capabilities = probeParentAccessCapabilities();
    assert(Object.values(capabilities).every(Boolean), 'Browser crypto/storage capabilities');
    pass('Secure context, Web Crypto, localStorage and sessionStorage round trips');

    const account = makeId();
    await saveParentPin(account, '2468');
    assert(await verifyParentPin(account, '2468'), 'Native storage PIN verifies');
    assert(!await verifyParentPin(account, '1357'), 'Wrong PIN rejected');
    assert(!localStorage.getItem(PARENT_SECURITY_STORAGE_PREFIX + account).includes('"2468"'), 'No plaintext PIN');
    pass('Native PBKDF2 save, readback, correct/wrong PIN and plaintext exclusion');

    const cleanupAccount = makeId();
    Storage.prototype.removeItem = function (key) {
      if (this === sessionStorage && key === 'jannati_parent_rate:' + cleanupAccount) throw new Error('injected cleanup restriction');
      return originalRemove.call(this, key);
    };
    let cleanupUnlocks = 0;
    render(<ParentAccessGate key={cleanupAccount} accountId={cleanupAccount} authMarker="diagnostic-auth" activeChildId="child-a" onUnlock={() => { cleanupUnlocks += 1; }} />);
    await enterPin(true);
    await until(() => cleanupUnlocks === 1, 'Gate unlock despite cleanup error');
    assert(await verifyParentPin(cleanupAccount, '2468'), 'Saved PIN remains valid');
    pass('Real Gate saves and opens despite injected session cleanup failure');
    Storage.prototype.removeItem = originalRemove;

    const callbackAccount = makeId();
    render(<ParentAccessGate key={callbackAccount} accountId={callbackAccount} authMarker="diagnostic-auth" onUnlock={() => { throw new Error('injected unlock failure'); }} />);
    await enterPin(true);
    await until(() => fixture.textContent.includes(getParentAccessMessage('parent_pin_saved_unlock_failed')), 'Specific saved/unlock failure message');
    assert(await verifyParentPin(callbackAccount, '2468'), 'Callback error preserves PIN');
    assert(!fixture.textContent.includes('PIN tidak dapat disimpan'), 'No false save error');
    pass('Real Gate shows saved-but-not-opened message for throwing callback');

    const duplicateAccount = makeId();
    let duplicateUnlocks = 0;
    render(<ParentAccessGate key={duplicateAccount} accountId={duplicateAccount} authMarker="diagnostic-auth" onUnlock={() => { duplicateUnlocks += 1; }} />);
    fill('#parent-pin', '2468'); fill('#parent-pin-confirm', '2468');
    submit(); submit();
    await until(() => duplicateUnlocks > 0, 'Duplicate submit finishes');
    await wait(200);
    assert(duplicateUnlocks === 1, 'Only one unlock');
    pass('Duplicate DOM submissions unlock only once');

    const staleAccount = makeId();
    let staleUnlocks = 0;
    const staleCallback = () => { staleUnlocks += 1; };
    render(<ParentAccessGate key="stale-fixture" accountId={staleAccount} authMarker="auth-a" onUnlock={staleCallback} />);
    await enterPin(true);
    render(<ParentAccessGate key="stale-fixture" accountId={makeId()} authMarker="auth-b" onUnlock={staleCallback} />);
    await wait(800);
    assert(staleUnlocks === 0, 'Stale account must not unlock');
    pass('Account changes during PBKDF2 cannot unlock the new Gate');

    const boundaryProps = { accountId: account, activeChildId: 'child-a', authMarker: 'auth-a', allSubjects: [], profile: { name: 'Diagnostic', history: [] }, adaptiveProfile: {}, adaptivePracticeCount: 0, readiness: {} };
    render(<ParentModeBoundary {...boundaryProps} />);
    await enterPin();
    await until(() => fixture.querySelector('.parent-unlocked-session'), 'Boundary opens');
    [...fixture.querySelectorAll('button')].find(item => item.textContent === 'Kunci Sekarang').click();
    await until(() => fixture.querySelector('#parent-pin'), 'Explicit lock');
    pass('Existing stored PIN opens real Parent Dashboard; Kunci Sekarang relocks');
    await enterPin();
    await until(() => fixture.querySelector('.parent-unlocked-session'), 'Boundary reopens');
    render(<ParentModeBoundary {...boundaryProps} activeChildId="child-b" />);
    assert(!fixture.querySelector('.parent-unlocked-session'), 'Child switch relocks synchronously');
    pass('Child switch relocks before another report renders');
    await enterPin();
    await until(() => fixture.querySelector('.parent-unlocked-session'), 'Child B opens');
    render(<ParentModeBoundary {...boundaryProps} activeChildId="child-b" authMarker="auth-b" />);
    assert(!fixture.querySelector('.parent-unlocked-session'), 'Auth switch relocks');
    pass('Auth-session switch relocks');
    await enterPin();
    await until(() => fixture.querySelector('.parent-unlocked-session'), 'Session reopens');
    render(<ParentModeBoundary {...boundaryProps} accountId={makeId()} />);
    assert(!fixture.querySelector('.parent-unlocked-session'), 'Account switch relocks');
    pass('Account switch relocks');

    // Accelerate only the known inactivity timer in this isolated test page.
    window.setTimeout = function (callback, ms, ...args) { return originalTimeout.call(window, callback, ms === 600000 ? 400 : ms, ...args); };
    render(<ParentModeBoundary {...boundaryProps} />);
    await enterPin();
    await until(() => fixture.querySelector('.parent-unlocked-session'), 'Timed session opens');
    await until(() => fixture.textContent.includes('10 minit tidak aktif'), 'Inactivity callback relocks');
    assert(!fixture.querySelector('.parent-unlocked-session'), 'Inactivity hides report');
    pass('Inactivity auto-lock callback (10-minute timer accelerated in fixture only)');

    const noStorageUnlock = await createParentPinSubmission().submit({ accountId: makeId(), pin: '2468', confirmPin: '2468', setupMode: true, options: { localStorage: null }, onUnlock() { throw new Error('must not unlock'); } });
    assert(noStorageUnlock.code === 'parent_pin_storage_unavailable', 'Unavailable storage fails closed');
    pass('Unavailable storage cannot unlock');
    results.textContent = 'BROWSER SMOKE PASS (' + lines.length + ' checks)\n' + lines.join('\n');
  } catch (error) {
    results.textContent = 'BROWSER SMOKE FAIL: ' + (error.code || error.message || 'diagnostic failure') + '\n' + lines.join('\n');
  } finally {
    Storage.prototype.removeItem = originalRemove;
    window.setTimeout = originalTimeout;
    render(null);
    for (const id of ids) {
      localStorage.removeItem(PARENT_SECURITY_STORAGE_PREFIX + id);
      sessionStorage.removeItem('jannati_parent_rate:' + id);
      sessionStorage.removeItem('jannati_parent_recovery:' + id);
    }
    button.disabled = false;
  }
});
