import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCommunicationSpeechSession
} from '../../src/ai/speech/communicationSpeech.js';
import {
  isIOSWebSpeechBypassRequested,
  shouldAvoidIOSWebSpeech,
  shouldBypassIOSWebSpeech
} from '../../src/ai/speech/speechCapability.js';
import {
  clearSpeechDiagnosticTrace,
  getSpeechDiagnosticSnapshot
} from '../../src/ai/speech/speechDiagnostics.js';
import { createMemorySessionStorage } from '../helpers/sharedNativeSpeechBackend.js';

const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

function installEnvironment({
  search = '?speechDiag=1&iosSpeechBypass=1',
  userAgent = IOS_UA,
  maxTouchPoints = 5
} = {}) {
  const recognitionConstructor = vi.fn();
  globalThis.window = {
    SpeechRecognition: recognitionConstructor,
    webkitSpeechRecognition: null,
    location: { search },
    sessionStorage: createMemorySessionStorage(),
    matchMedia: () => ({ matches: false })
  };
  vi.stubGlobal('navigator', {
    userAgent,
    maxTouchPoints,
    serviceWorker: { controller: null }
  });
  clearSpeechDiagnosticTrace();
  return { recognitionConstructor };
}

function createSessionFactory() {
  const start = vi.fn(() => ({ started: true }));
  const factory = vi.fn(() => ({
    supported: true,
    start,
    stop: vi.fn(),
    cancel: vi.fn(),
    getState: vi.fn(() => ({ status: 'idle' })),
    recognition: null
  }));
  return { factory, start };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe('P1.12 iOS Web Speech exclusion and explicit bypass', () => {
  it('requires both the explicit flag and an iOS/iPadOS WebKit environment', () => {
    expect(isIOSWebSpeechBypassRequested('?iosSpeechBypass=1')).toBe(true);
    expect(isIOSWebSpeechBypassRequested('?iosSpeechBypass=0')).toBe(false);
    expect(shouldBypassIOSWebSpeech({
      search: '?iosSpeechBypass=1',
      userAgent: IOS_UA,
      maxTouchPoints: 5
    })).toBe(true);
    expect(shouldBypassIOSWebSpeech({
      search: '?iosSpeechBypass=1',
      userAgent: DESKTOP_UA,
      maxTouchPoints: 0
    })).toBe(false);
    expect(shouldBypassIOSWebSpeech({
      search: '',
      userAgent: IOS_UA,
      maxTouchPoints: 5
    })).toBe(false);
    expect(shouldAvoidIOSWebSpeech({
      search: '',
      userAgent: IOS_UA,
      maxTouchPoints: 5
    })).toBe(true);
  });

  it.each(['reading', 'speaking'])('%s does not create or start a recognizer when flag + iOS are active', activity => {
    const environment = installEnvironment();
    const { factory, start } = createSessionFactory();

    const session = createCommunicationSpeechSession({
      activity,
      contextKey: activity + ':bm:0',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      sessionFactory: factory
    });
    const result = session.start();

    expect(session).toMatchObject({ supported: false, bypassed: true });
    expect(result).toEqual({ unsupported: true, bypassed: true });
    expect(factory).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
    expect(environment.recognitionConstructor).not.toHaveBeenCalled();
    const bypassEvents = getSpeechDiagnosticSnapshot().events.filter(event => (
      event.activity === activity && event.iosSpeechBypass
    ));
    expect(bypassEvents.length).toBeGreaterThanOrEqual(2);
    expect(bypassEvents.every(event => event.recognizerCreated === false)).toBe(true);
    expect(getSpeechDiagnosticSnapshot().diagnostic.iosSpeechBypass).toEqual({
      requested: true,
      active: true,
      scope: 'reading-speaking-only'
    });
  });

  it('uses manual fallback without creating Web Speech when the endpoint is absent on iOS', () => {
    const environment = installEnvironment({
      search: '?speechDiag=1',
      userAgent: IOS_UA,
      maxTouchPoints: 5
    });
    const { factory, start } = createSessionFactory();
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:0',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      sessionFactory: factory
    });

    expect(session).toMatchObject({ supported: false, bypassed: true });
    expect(session.start()).toEqual({ unsupported: true, bypassed: true });
    expect(factory).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
    expect(environment.recognitionConstructor).not.toHaveBeenCalled();
  });

  it('keeps non-iOS behavior unchanged when the explicit iOS bypass flag is present', () => {
    installEnvironment({
      search: '?speechDiag=1&iosSpeechBypass=1',
      userAgent: DESKTOP_UA,
      maxTouchPoints: 0
    });
    const { factory, start } = createSessionFactory();
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:0',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      sessionFactory: factory
    });

    expect(session.bypassed).toBe(false);
    expect(session.supported).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(session.start()).toEqual({ started: true });
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('keeps manual inputs visible and guards both UI start paths before session creation', () => {
    const appSource = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const bacaan = appSource.slice(
      appSource.indexOf('function BacaanCoach('),
      appSource.indexOf('\nconst listeningSets =')
    );
    const bertutur = appSource.slice(
      appSource.indexOf('function BertuturCoach('),
      appSource.indexOf('\nfunction getBertuturReviewCopy(')
    );

    expect(bacaan).toContain('if (!recognitionSupported || iosSpeechBypassEnabled) return;');
    expect(bertutur).toContain('if (!recognitionSupported || iosSpeechBypassEnabled ||');
    expect(bacaan).toContain('Rakaman suara belum tersedia. Kamu masih boleh menaip jawapan.');
    expect(bertutur).toContain('Rakaman suara belum tersedia. Kamu masih boleh menaip jawapan.');
    expect(bacaan).toContain('<textarea');
    expect(bacaan).toContain('onClick={checkManual}');
    expect(bertutur).toContain('id="bertutur-transcript"');
    expect(bertutur).toContain('onClick={checkBertutur}');
    expect(bacaan.indexOf('iosSpeechBypassEnabled) return;')).toBeLessThan(
      bacaan.indexOf('createCommunicationSpeechSession({')
    );
    expect(bertutur.indexOf('iosSpeechBypassEnabled ||')).toBeLessThan(
      bertutur.indexOf('createCommunicationSpeechSession({')
    );
  });

  it('does not clear learner progress or persistent storage as part of bypass', () => {
    const capabilitySource = readFileSync(
      new URL('../../src/ai/speech/speechCapability.js', import.meta.url),
      'utf8'
    );
    const communicationSource = readFileSync(
      new URL('../../src/ai/speech/communicationSpeech.js', import.meta.url),
      'utf8'
    );
    const bypassSource = capabilitySource + communicationSource;
    expect(bypassSource).not.toContain('localStorage');
    expect(bypassSource).not.toContain('.clear()');
    expect(bypassSource).not.toContain('resetProfile');
    expect(bypassSource).not.toContain('clearResume');
    expect(bypassSource).not.toContain('onClearResume');
  });
});
