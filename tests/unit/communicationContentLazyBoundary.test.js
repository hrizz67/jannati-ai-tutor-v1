import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CommunicationContentErrorFallback from '../../src/components/communication/CommunicationContentErrorFallback.jsx';
import {
  createCommunicationContentLoader,
  loadCommunicationContent
} from '../../src/data/loadCommunicationContent.js';

function collectElements(element, predicate, matches = []) {
  if (!React.isValidElement(element)) return matches;
  if (predicate(element)) matches.push(element);
  React.Children.forEach(element.props?.children, child => collectElements(child, predicate, matches));
  return matches;
}

describe('communication content lazy boundary', () => {
  it('loads each semantic communication bank on demand through one cached promise', async () => {
    const firstLoad = loadCommunicationContent();
    expect(loadCommunicationContent()).toBe(firstLoad);

    const content = await firstLoad;
    expect(content.semanticListeningSets).toHaveLength(3);
    expect(content.semanticSpeakingPrompts).toHaveLength(3);
    expect(content.semanticReadingPassages).toHaveLength(3);
    expect(content.semanticWritingSets).toHaveLength(3);
  });

  it('keeps the App root free of a static communication-content import', () => {
    const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const gateSource = fs.readFileSync(new URL('../../src/components/communication/CommunicationContentGate.jsx', import.meta.url), 'utf8');

    expect(appSource).toContain("const CommunicationContentGate = React.lazy(() => import('./components/communication/CommunicationContentGate.jsx'));");
    expect(appSource).not.toContain("from './data/communicationContent.js'");
    expect(gateSource).toContain('use(loadCommunicationContent())');
  });

  it('offers a full reload for every communication screen after a cached import failure', () => {
    const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const fallbackSource = fs.readFileSync(new URL('../../src/components/communication/CommunicationContentErrorFallback.jsx', import.meta.url), 'utf8');

    expect(appSource).toContain("import CommunicationContentErrorFallback from './components/communication/CommunicationContentErrorFallback.jsx';");
    expect(fallbackSource).toContain('window.location.reload()');
    expect(fallbackSource).toContain('Muat semula aplikasi');
    expect(fallbackSource).toContain('Kembali ke Papan Utama untuk belajar perkara lain');
    expect(appSource).not.toContain('Sila kembali dan cuba semula.');
    expect((appSource.match(/fallback={<CommunicationContentErrorFallback/g) || [])).toHaveLength(4);
  });

  it('caches a rejected import without automatically retrying forever', async () => {
    let attempts = 0;
    const failure = new Error('simulated chunk failure');
    const loader = createCommunicationContentLoader(async () => {
      attempts += 1;
      throw failure;
    });

    const firstLoad = loader.load();
    expect(loader.load()).toBe(firstLoad);
    await expect(firstLoad).rejects.toBe(failure);
    await expect(loader.load()).rejects.toBe(failure);
    expect(attempts).toBe(1);
  });

  it('renders a recoverable fallback with dashboard and user-controlled reload actions', () => {
    const onDashboard = vi.fn();
    const onReload = vi.fn();
    const fallback = CommunicationContentErrorFallback({
      title: 'Latihan Bacaan tidak dapat dimuatkan.',
      onDashboard,
      onReload
    });
    const markup = renderToStaticMarkup(React.createElement(CommunicationContentErrorFallback, {
      title: 'Latihan Bacaan tidak dapat dimuatkan.',
      onDashboard,
      onReload
    }));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Latihan Bacaan tidak dapat dimuatkan.');
    expect(markup).toContain('Papan Utama');
    expect(markup).toContain('Muat semula aplikasi');
    expect(markup.match(/<button/g)).toHaveLength(2);

    const buttons = collectElements(fallback, element => element.type === 'button');
    buttons[0].props.onClick();
    buttons[1].props.onClick();
    expect(onDashboard).toHaveBeenCalledOnce();
    expect(onReload).toHaveBeenCalledOnce();
  });

  it('can recover on a fresh page loader after the import becomes available', async () => {
    let available = false;
    const importModule = async () => {
      if (!available) throw new Error('offline');
      return { semanticReadingPassages: ['restored'] };
    };

    const failedPageLoader = createCommunicationContentLoader(importModule);
    await expect(failedPageLoader.load()).rejects.toThrow('offline');

    available = true;
    const freshPageLoader = createCommunicationContentLoader(importModule);
    await expect(freshPageLoader.load()).resolves.toEqual({ semanticReadingPassages: ['restored'] });
  });
});
