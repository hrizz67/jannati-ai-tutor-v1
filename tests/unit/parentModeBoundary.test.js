import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const boundarySource = fs.readFileSync(new URL('../../src/components/parent/ParentModeBoundary.jsx', import.meta.url), 'utf8');
const gateSource = fs.readFileSync(new URL('../../src/components/parent/ParentAccessGate.jsx', import.meta.url), 'utf8');

describe('Parent mode session boundary', () => {
  it('keeps the explicit Kunci Sekarang action session-only', () => {
    expect(boundarySource).toMatch(/Kunci Sekarang/);
    expect(boundarySource).toMatch(/onClick=\{\(\) => setUnlockedAccountId\(''\)\}/);
    expect(boundarySource).not.toMatch(/localStorage[\s\S]*unlockedAccountId/);
  });

  it('keeps the ten-minute inactivity relock and resets it only on user activity', () => {
    expect(boundarySource).toMatch(/PARENT_INACTIVITY_MS = 10 \* 60 \* 1000/);
    expect(boundarySource).toMatch(/window\.setTimeout\(lock, PARENT_INACTIVITY_MS\)/);
    expect(boundarySource).toMatch(/\['pointerdown', 'keydown', 'touchstart'\]/);
  });

  it('relocks by remounting for account, child or auth changes', () => {
    expect(boundarySource).toMatch(/props\.accountId[\s\S]*props\.activeChildId[\s\S]*props\.authMarker/);
    expect(boundarySource).toMatch(/ParentModeSession key=\{sessionKey\}/);
  });

  it('refreshes shared rate-limit state on cross-tab storage events', () => {
    expect(gateSource).toMatch(/window\.addEventListener\('storage', refreshStatus\)/);
    expect(gateSource).toMatch(/setTick\(Date\.now\(\)\)/);
    expect(gateSource).toMatch(/window\.removeEventListener\('storage', refreshStatus\)/);
  });
});
