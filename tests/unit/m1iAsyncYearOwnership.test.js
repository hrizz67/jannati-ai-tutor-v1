import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createYear2AsyncOwnerGate } from '../../src/services/yearOwnedAsyncSubjectGate.js';

const app = readFileSync('src/App.jsx', 'utf8');
const owner = { accountId: 'synthetic-account', childId: 'child-a', year: 'Tahun 2' };

describe('M1-I fail-closed async subject-load ownership', () => {
  it('accepts a Year 2 request only for its unchanged account/child/year and generation', () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const lease = gate.capture();
    expect(gate.isCurrent(lease)).toBe(true);
    expect(gate.setOwner({ ...owner })).toBe(false);
    expect(gate.isCurrent(lease)).toBe(true);
    expect(gate.setOwner({ ...owner, childId: 'child-b' })).toBe(true);
    expect(gate.isCurrent(lease)).toBe(false);
    expect(gate.isCurrent(gate.capture())).toBe(true);
  });

  it('blocks an unsupported year even if the child/account remain unchanged', () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const previous = gate.capture();
    gate.setOwner({ ...owner, year: 'Tahun 3' });
    expect(gate.isCurrent(previous)).toBe(false);
    expect(gate.isCurrent(gate.capture())).toBe(false);
    gate.setOwner({ ...owner, year: 'Tahun 1' });
    expect(gate.isCurrent(gate.capture())).toBe(false);
    gate.setOwner(owner);
    expect(gate.isCurrent(previous)).toBe(false);
    expect(gate.isCurrent(gate.capture())).toBe(true);
  });

  it('refuses an earlier account request after logout and account replacement', () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const token = gate.capture();
    gate.setOwner({ ...owner, accountId: 'synthetic-other-account' });
    expect(gate.isCurrent(token)).toBe(false);
    expect(gate.isCurrent(gate.capture())).toBe(true);
  });

  it('cancels in-flight work immediately before a child snapshot switch has rendered', () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const pending = gate.capture();
    gate.invalidate();
    expect(gate.isCurrent(pending)).toBe(false);
    expect(gate.isCurrent(gate.capture())).toBe(true);
  });

  it('prevents stale async promises from committing a subject after a child changes', async () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const token = gate.capture();
    let finish;
    const load = new Promise(resolve => { finish = resolve; });
    const commit = load.then(subject => gate.isCurrent(token) ? subject : null);
    gate.setOwner({ ...owner, childId: 'child-b' });
    finish({ id: 'bm', title: 'PRIVATE_YEAR2_QUESTIONS' });
    expect(await commit).toBeNull();
  });

  it('blocks stale old-year replies after switching away then returning to the same child and year', async () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const token = gate.capture();
    gate.setOwner({ ...owner, year: 'Tahun 3' });
    gate.setOwner(owner);
    expect(gate.isCurrent(token)).toBe(false);
    expect(gate.isCurrent(gate.capture())).toBe(true);
  });

  it('places gate checks on every legacy direct subject-load and adaptive resume pathway', () => {
    expect(app).toContain("import { createYear2AsyncOwnerGate } from './services/yearOwnedAsyncSubjectGate.js'");
    expect(app).toContain('subjectLoadGateRef.current.setOwner({');
    expect(app).toContain('subjectLoadGateRef.current.invalidate();');
    expect(app).toContain('async function loadYear2SubjectForLease(subjectId, lease = subjectLoadGateRef.current.capture())');
    expect((app.match(/loadSubjectData\(/g) || [])).toHaveLength(1); // internal wrapper only
    expect(app).toContain('const subject = await loadYear2SubjectForLease(targetResume.subjectId, lease);');
    expect(app).toContain('const subject = allSubjects.find(item => item.id === subjectId)');
    expect(app).toContain('|| await loadYear2SubjectForLease(subjectId, lease)');
    expect(app).toContain('if (!subjectLoadGateRef.current.isCurrent(lease)) return false;');
    expect(app).toContain("if (!subjectLoadGateRef.current.isCurrent(lease)) return;");
    expect(app).toContain('await startInteractivePracticeResume(targetResume, {}, lease)');
    expect(app).toContain('await startInteractivePracticeResume(targetResume, { restart: true }, lease)');
    expect(app).toContain('if (!subjectLoadGateRef.current.isCurrent(lease)) return false;\n      if (loadedSubjects.length)');
    expect(app).not.toContain('await loadSubjectData(targetResume.subjectId)');
    expect(app).toContain('const subject = await loadSubjectData(subjectId);'); // only inside the guarded wrapper
  });

  it('invalidates only after a successful child snapshot switch, keeping failed switches responsive', () => {
    const start = app.indexOf('function handleSelectChild(childId) {');
    const end = app.indexOf('function handleCreateChild(', start);
    const handler = app.slice(start, end);
    expect(handler).toContain('if (!restoreChildSnapshot(snapshot, target.id))');
    expect(handler).toContain('subjectLoadGateRef.current.invalidate();');
    expect(handler.indexOf('subjectLoadGateRef.current.invalidate();'))
      .toBeGreaterThan(handler.indexOf('if (!restoreChildSnapshot(snapshot, target.id))'));
    expect(handler.indexOf('subjectLoadGateRef.current.invalidate();'))
      .toBeLessThan(handler.indexOf('setActiveChildId(target.id);'));
    expect(app).toContain('subjectLoadGateRef.current.invalidate();\n    setSelectedSubjectId(subjectId);');
    expect(app).toContain('localStorage.setItem(ACTIVE_CHILD_KEY, nextChild.id);\n      subjectLoadGateRef.current.invalidate();');
  });

  it('keeps the selected subject effect scoped by account, child and year without changing the canonical bank', () => {
    expect(app).toContain(
      '[selectedSubjectId, activeYearBankReady, activeChildId, accountUser?.id, activeStudentYear]'
    );
    expect(app).toContain('if (!alive || !subject || !subjectLoadGateRef.current.isCurrent(lease)) return;');
    expect(app).toContain('if (!subjectLoadGateRef.current.isCurrent(lease)) return [];');
    expect(app).not.toContain('yearScopedResumePolicy');
    expect(app).not.toContain('multiYearCloudBoundaryAudit');
  });
});
