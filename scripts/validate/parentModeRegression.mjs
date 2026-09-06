import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  PARENT_SECURITY_STORAGE_PREFIX,
  canRecoverParentPin,
  clearParentPinAttempts,
  getParentPinAttemptState,
  hasParentPin,
  recordParentPinFailure,
  replaceParentPinAfterReauthentication,
  requestParentPinRecovery,
  saveParentPin,
  verifyParentPin
} from '../../src/services/parentAccess.js';
import { buildAdaptivePracticeSession } from '../../src/ai/adaptive/adaptivePracticeEngine.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

const localStorage = new MemoryStorage();
const sessionStorage = new MemoryStorage();
const accountA = 'parent-account-a';
const accountB = 'parent-account-b';
const pin = '2468';

await saveParentPin(accountA, pin, { localStorage });
assert.equal(hasParentPin(accountA, { localStorage }), true, 'Parent PIN verifier should exist for its account.');
assert.equal(await verifyParentPin(accountA, pin, { localStorage }), true, 'Correct PIN should verify.');
assert.equal(await verifyParentPin(accountA, '1357', { localStorage }), false, 'Wrong PIN must not verify.');
assert.equal(await verifyParentPin(accountB, pin, { localStorage }), false, 'PIN must not unlock another account.');

const storedPinRecord = localStorage.getItem(`${PARENT_SECURITY_STORAGE_PREFIX}${accountA}`);
assert.ok(storedPinRecord, 'A salted verifier record should be stored.');
assert.equal(storedPinRecord.includes(`\"${pin}\"`), false, 'Plaintext PIN must never be stored.');
assert.match(storedPinRecord, /PBKDF2-SHA-256/, 'PIN should use the declared PBKDF2 verifier.');

recordParentPinFailure(accountA, { sessionStorage, now: 1000 });
recordParentPinFailure(accountA, { sessionStorage, now: 1000 });
const blocked = recordParentPinFailure(accountA, { sessionStorage, now: 1000 });
assert.equal(blocked.isBlocked, true, 'Third repeated failure should trigger a temporary lock.');
assert.ok(getParentPinAttemptState(accountA, { sessionStorage, now: 2000 }).remainingMs > 0, 'Rate limit should expose remaining lock time.');
clearParentPinAttempts(accountA, { sessionStorage });
assert.equal(getParentPinAttemptState(accountA, { sessionStorage, now: 2000 }).isBlocked, false, 'Successful verification can clear the rate limit.');

requestParentPinRecovery(accountA, '2026-09-05T01:00:00.000Z', { sessionStorage, now: Date.parse('2026-09-05T01:05:00.000Z') });
assert.equal(canRecoverParentPin(accountA, '2026-09-05T01:00:00.000Z', { sessionStorage }), false, 'Recovery must not be available in the same auth session.');
assert.equal(canRecoverParentPin(accountA, '2026-09-05T01:10:00.000Z', { sessionStorage }), true, 'A later login should authorize PIN recovery.');
await replaceParentPinAfterReauthentication(accountA, '8642', '2026-09-05T01:10:00.000Z', { localStorage, sessionStorage });
assert.equal(await verifyParentPin(accountA, '8642', { localStorage }), true, 'Recovered PIN should replace the old verifier.');
assert.equal(await verifyParentPin(accountA, pin, { localStorage }), false, 'Old PIN should stop working after recovery.');

const bank = [
  {
    id: 'bm', title: 'Bahasa Melayu', topics: [
      { id: 'kata-nama', title: 'Kata Nama', questions: [{ id: 'bm-1', q: 'Pilih kata nama.', a: 'buku' }] },
      { id: 'kata-kerja', title: 'Kata Kerja', questions: [{ id: 'bm-2', q: 'Pilih kata kerja.', a: 'lari' }] }
    ]
  },
  {
    id: 'math', title: 'Matematik', topics: [
      { id: 'nombor', title: 'Nombor', questions: [{ id: 'math-1', q: 'Satu tambah satu.', a: '2' }] }
    ]
  }
];
const focusedSession = buildAdaptivePracticeSession({}, bank, {
  questionCount: 3,
  subjectId: 'bm',
  topicId: 'kata-nama',
  difficulty: 'easy',
  seed: 'parent-cta-test'
});
assert.ok(focusedSession.questions.length > 0, 'Parent CTA should produce a focused session.');
assert.ok(focusedSession.questions.every(question => question.subjectId === 'bm' && question.topicId === 'kata-nama'), 'Parent CTA must keep the requested subject and topic.');
assert.equal(focusedSession.metadata.requestedTopicId, 'kata-nama', 'Focused session should retain its requested context.');

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const boundarySource = fs.readFileSync(path.join(root, 'src/components/parent/ParentModeBoundary.jsx'), 'utf8');
const gateSource = fs.readFileSync(path.join(root, 'src/components/parent/ParentAccessGate.jsx'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(root, 'src/dashboard/ParentDashboard.jsx'), 'utf8');
const printSource = fs.readFileSync(path.join(root, 'src/utils/printReport.js'), 'utf8');
const syncSource = fs.readFileSync(path.join(root, 'src/services/learningSync.js'), 'utf8');
const cssSource = fs.readFileSync(path.join(root, 'src/styles/style.css'), 'utf8');

assert.match(appSource, /ParentModeBoundary/, 'Parent route should use the adult boundary.');
assert.match(appSource, /requestedChildId[\s\S]*requestedChildId !== currentChildId/, 'Parent actions must reject a stale child context.');
assert.match(appSource, /!key\.startsWith\(PARENT_SECURITY_STORAGE_PREFIX\)/, 'Account snapshots must exclude Parent security records.');
assert.match(syncSource, /delete next\[key\]/, 'Imported or cloud payloads must strip Parent security records.');
assert.match(boundarySource, /PARENT_INACTIVITY_MS = 10 \* 60 \* 1000/, 'Parent unlock should expire after inactivity.');
assert.match(boundarySource, /setUnlockedAccountId\(''\)/, 'Parent session should support explicit locking.');
assert.match(gateSource, /type="password"/, 'PIN entry should not reveal entered digits.');
assert.match(gateSource, /Lupa PIN\? Log keluar/, 'PIN recovery should require a logout/login path.');
assert.match(dashboardSource, /Belum cukup data untuk analisis\./, 'New child state should avoid a false negative label.');
assert.match(dashboardSource, /Data masih terlalu sedikit untuk membuat kesimpulan\./, 'Low-evidence state should be explicit.');
assert.match(dashboardSource, /Latih topik ini/, 'Weak-topic recommendations should expose an action.');
assert.match(dashboardSource, /childId: activeChildId[\s\S]*subjectId,[\s\S]*topicId,[\s\S]*difficulty:/, 'CTA should retain child, subject, topic and difficulty context.');
assert.match(dashboardSource, /parent-print-report/, 'Printed output should be scoped to the Parent report.');
assert.match(printSource, /data-sensitive/, 'Print helper should reject sensitive content.');
assert.doesNotMatch(dashboardSource, /accountId|accountEmail|cloudSyncRevision|serverUpdatedAt/, 'Printable dashboard should not render account or raw cloud identifiers.');
assert.match(cssSource, /@page[\s\S]*A4 portrait/, 'Parent print CSS should target A4.');
assert.match(cssSource, /@media \(max-width: 430px\)/, 'Parent UI should include narrow mobile handling.');

console.log('Parent mode regression passed: hashed PIN, account/child isolation, actionable recommendations, safe empty states, print privacy and responsive accessibility.');
