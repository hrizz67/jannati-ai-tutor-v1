/** @vitest-environment jsdom */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import UnsupportedYearScreen from '../../src/components/learning/UnsupportedYearScreen.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const source = readFileSync('src/App.jsx', 'utf8');
let host;
let root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

async function renderScreen(props) {
  await act(async () => root.render(<UnsupportedYearScreen {...props} />));
}

describe('M1-C blocked-grade profile switch recovery', () => {
  it('offers an existing Year 2 sibling and uses the provided safe switch handler', async () => {
    const onSelectChild = vi.fn();
    await renderScreen({
      year: 'Tahun 3',
      activeChildId: 'child-3',
      profiles: [
        { id: 'child-3', name: 'Murid 3', year: 'Tahun 3' },
        { id: 'child-2', name: 'Murid 2', year: 'Tahun 2' },
        { id: 'child-1', name: 'Murid 1', year: 'Tahun 1' }
      ],
      onSelectChild
    });
    expect(host.querySelector('h1')?.textContent).toContain('Tahun belum tersedia');
    expect(host.textContent).toContain('Bank soalan tahun ini belum diluluskan');
    expect(host.textContent).toContain('Murid 2');
    expect(host.textContent).not.toContain('Murid 1');
    const eligible = [...host.querySelectorAll('button')].find(button => button.textContent.includes('Murid 2'));
    await act(async () => eligible.click());
    expect(onSelectChild).toHaveBeenCalledExactlyOnceWith('child-2');
  });

  it('allows a legacy child with no stored year, without updating stored profile data', async () => {
    const profiles = [{ id: 'child-old', name: 'Murid lama' }];
    const onSelectChild = vi.fn();
    await renderScreen({ year: 'Tahun 1', activeChildId: 'unsupported', profiles, onSelectChild });
    await act(async () => host.querySelector('li button').click());
    expect(onSelectChild).toHaveBeenCalledWith('child-old');
    expect(profiles[0]).not.toHaveProperty('year');
  });

  it('offers login/recovery when no ready sibling is available, without inventing a Year 2 profile', async () => {
    const onAccountLogin = vi.fn();
    const onSelectChild = vi.fn();
    await renderScreen({
      year: 'Tahun 1',
      activeChildId: 'child-1',
      profiles: [{ id: 'child-1', name: 'Murid 1', year: 'Tahun 1' }],
      onAccountLogin, onSelectChild
    });
    expect(host.textContent).toContain('Tiada profil Tahun 2 lain');
    expect(host.querySelectorAll('li button')).toHaveLength(0);
    await act(async () => host.querySelector('button').click());
    expect(onAccountLogin).toHaveBeenCalledTimes(1);
    expect(onSelectChild).not.toHaveBeenCalled();
  });

  it('handles malformed profile input and never interprets child names as HTML', async () => {
    await renderScreen({
      year: 'Tahun 3',
      activeChildId: 'x',
      profiles: [
        null,
        { id: 'safe', year: 'Tahun 2', name: '<script>alert(1)</script>' },
        { name: 'Missing child id', year: 'Tahun 2' },
        { id: 'other-year', year: 'Tahun 3', name: 'Not ready' }
      ]
    });
    expect(host.querySelector('script')).toBeNull();
    expect(host.textContent).toContain('<script>alert(1)</script>');
    expect(host.querySelectorAll('li button')).toHaveLength(1);
  });

  it('App isolates the unavailable-year screen in a lazy chunk and reuses handleSelectChild', () => {
    expect(source).toContain("React.lazy(() => import('./components/learning/UnsupportedYearScreen.jsx'))");
    expect(source).toContain('onSelectChild={handleSelectChild}');
    expect(source).toContain('activeChildId={activeChildId}');
    expect(source).toContain('profiles={childProfiles}');
    expect(source).toContain('if (!activeYearBankReady && !showAccountLogin && !adminRouteActive && !premiumSalesRouteActive)');
    expect(source.indexOf('if (!activeYearBankReady && !showAccountLogin')).toBeLessThan(
      source.indexOf('if (showOnboarding && !showAccountLogin)')
    );
  });
});
