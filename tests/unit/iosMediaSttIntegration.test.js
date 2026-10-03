import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommunicationSpeechSession } from '../../src/ai/speech/communicationSpeech.js';
import { createIOSMediaSttSession } from '../../src/ai/speech/iosMediaSttSession.js';
import { MediaSttError } from '../../src/ai/speech/mediaSttCapture.js';
import {
  isIOSMediaSttRequested,
  shouldUseIOSMediaStt
} from '../../src/ai/speech/speechCapability.js';
import {
  clearSpeechDiagnosticTrace,
  getSpeechDiagnosticSnapshot
} from '../../src/ai/speech/speechDiagnostics.js';
import { createMemorySessionStorage } from '../helpers/sharedNativeSpeechBackend.js';

const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

class FakeWindow {
  constructor(search = '') {
    this.location = { search };
    this.listeners = new Map();
    this.MediaRecorder = class {};
    this.Blob = Blob;
    this.SpeechRecognition = vi.fn();
    this.webkitSpeechRecognition = null;
    this.sessionStorage = createMemorySessionStorage();
    this.setTimeout = globalThis.setTimeout;
    this.clearTimeout = globalThis.clearTimeout;
    this.matchMedia = () => ({ matches: false });
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type, payload = {}) {
    [...(this.listeners.get(type) || [])].forEach(listener => listener(payload));
  }
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function installEnvironment({ search = '?iosSpeechMode=media-stt', userAgent = IOS_UA, maxTouchPoints = 5 } = {}) {
  const browserWindow = new FakeWindow(search);
  const browserNavigator = {
    userAgent,
    maxTouchPoints,
    mediaDevices: { getUserMedia: vi.fn() },
    serviceWorker: { controller: null }
  };
  globalThis.window = browserWindow;
  vi.stubGlobal('navigator', browserNavigator);
  clearSpeechDiagnosticTrace();
  return { browserNavigator, browserWindow };
}

function successfulCaptureFactory(overrides = {}) {
  const capture = vi.fn(async () => ({
    blob: new Blob(['audio'], { type: 'audio/mp4;codecs=mp4a.40.2' }),
    mimeType: 'audio/mp4;codecs=mp4a.40.2',
    durationMs: 6000,
    ...overrides
  }));
  return {
    factory: vi.fn(() => ({ capture, stop: vi.fn(() => true), cancel: vi.fn(() => true) })),
    capture
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe('P1.9 iOS media-STT integration', () => {
  it('activates only for an explicit iOS/iPadOS WebKit query flag', () => {
    expect(isIOSMediaSttRequested('?iosSpeechMode=media-stt')).toBe(true);
    expect(isIOSMediaSttRequested('?iosSpeechMode=default')).toBe(false);
    expect(shouldUseIOSMediaStt({ search: '?iosSpeechMode=media-stt', userAgent: IOS_UA, maxTouchPoints: 5 })).toBe(true);
    expect(shouldUseIOSMediaStt({ search: '?iosSpeechMode=media-stt', userAgent: IPAD_DESKTOP_UA, maxTouchPoints: 5 })).toBe(true);
    expect(shouldUseIOSMediaStt({ search: '?iosSpeechMode=media-stt', userAgent: DESKTOP_UA, maxTouchPoints: 0 })).toBe(false);
    expect(shouldUseIOSMediaStt({ search: '', userAgent: IOS_UA, maxTouchPoints: 5 })).toBe(false);
  });

  it.each(['reading', 'speaking'])('%s media mode never creates or starts Web Speech', activity => {
    const { browserWindow } = installEnvironment();
    const sessionFactory = vi.fn();
    const session = createCommunicationSpeechSession({
      activity,
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: activity + ':bm:0',
      sessionFactory
    });

    expect(session).toMatchObject({ supported: false, bypassed: true });
    expect(session.start()).toEqual({ unsupported: true, bypassed: true });
    expect(sessionFactory).not.toHaveBeenCalled();
    expect(browserWindow.SpeechRecognition).not.toHaveBeenCalled();
  });

  it('keeps default iOS and explicit non-iOS behavior on the existing recognizer path', () => {
    const cases = [
      { search: '', userAgent: IOS_UA, maxTouchPoints: 5 },
      { search: '?iosSpeechMode=media-stt', userAgent: DESKTOP_UA, maxTouchPoints: 0 }
    ];
    cases.forEach(environment => {
      installEnvironment(environment);
      const start = vi.fn(() => ({ started: true }));
      const sessionFactory = vi.fn(() => ({
        supported: true,
        start,
        stop: vi.fn(),
        cancel: vi.fn(),
        getState: () => ({ status: 'idle' }),
        recognition: null
      }));
      const session = createCommunicationSpeechSession({
        activity: 'reading',
        selectedSet: { id: 'bm', speechLang: 'ms-MY' },
        sessionFactory
      });
      expect(session.supported).toBe(true);
      expect(sessionFactory).toHaveBeenCalledTimes(1);
      expect(session.start()).toEqual({ started: true });
    });
  });

  it.each(['reading', 'speaking'])('%s publishes recording/transcribing/ready and returns an unscored candidate', async activity => {
    const { browserNavigator, browserWindow } = installEnvironment();
    const capture = successfulCaptureFactory();
    const states = [];
    const onCandidate = vi.fn();
    const adapter = {
      transcribe: vi.fn(async () => ({
        transcript: 'Saya suka membaca',
        confidence: 91,
        provider: 'test-provider',
        metadata: { safe: true }
      }))
    };
    const session = createIOSMediaSttSession({
      activity,
      language: activity === 'reading' ? 'ms-MY' : 'en-US',
      contextKey: activity + ':bm:0',
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => adapter,
      onStateChange: state => states.push(state.status),
      onCandidate
    });

    await expect(session.start()).resolves.toMatchObject({ started: true, transcriptLength: 17 });
    expect(states).toEqual(['recording', 'transcribing', 'ready']);
    expect(onCandidate).toHaveBeenCalledWith(expect.objectContaining({
      text: 'Saya suka membaca',
      confidence: 91,
      provider: 'test-provider'
    }));
    expect(onCandidate.mock.calls[0][0]).not.toHaveProperty('score');
    expect(adapter.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      language: activity === 'reading' ? 'ms-MY' : 'en-US',
      context: expect.objectContaining({ activity, contextKey: activity + ':bm:0', durationMs: 6000 }),
      mimeType: 'audio/mp4;codecs=mp4a.40.2'
    }));
  });

  it('cancels provider work on pagehide and removes the session listener on unmount', async () => {
    const { browserNavigator, browserWindow } = installEnvironment();
    const capture = successfulCaptureFactory();
    const providerStarted = deferred();
    let providerSignal;
    const adapter = {
      transcribe: vi.fn(({ signal }) => {
        providerSignal = signal;
        providerStarted.resolve();
        return new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(new MediaSttError('cancelled', 'abort-signal')), { once: true });
          void resolve;
        });
      })
    };
    const onStopped = vi.fn();
    const session = createIOSMediaSttSession({
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => adapter,
      onStopped
    });
    const start = session.start();
    await providerStarted.promise;
    expect(browserWindow.listeners.get('pagehide')?.size).toBe(1);
    browserWindow.emit('pagehide');
    await start;
    expect(providerSignal.aborted).toBe(true);
    expect(onStopped).toHaveBeenCalledWith('pagehide');
    expect(browserWindow.listeners.get('pagehide')?.size || 0).toBe(0);
    expect(session.getState()).toMatchObject({ status: 'ready', active: false });

    const secondSession = createIOSMediaSttSession({
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => ({ transcribe: () => new Promise(() => {}) })
    });
    void secondSession.start();
    await flush();
    expect(secondSession.cancel('component-unmount')).toBe(true);
    expect(browserWindow.listeners.get('pagehide')?.size || 0).toBe(0);
  });

  it('cleans a stale context completion and allows a fresh retry without an active-state trap', async () => {
    const { browserNavigator, browserWindow } = installEnvironment();
    const capture = successfulCaptureFactory();
    const firstResponse = deferred();
    let call = 0;
    const adapter = {
      transcribe: vi.fn(() => {
        call += 1;
        return call === 1
          ? firstResponse.promise
          : Promise.resolve({ transcript: 'fresh retry', confidence: 80, provider: 'test' });
      })
    };
    let currentContext = 'reading:bm:0';
    const onCandidate = vi.fn();
    const session = createIOSMediaSttSession({
      contextKey: 'reading:bm:0',
      getCurrentContextKey: () => currentContext,
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => adapter,
      onCandidate
    });
    const firstStart = session.start();
    await flush();
    currentContext = 'reading:bm:1';
    firstResponse.resolve({ transcript: 'stale text', confidence: 90, provider: 'test' });
    await expect(firstStart).resolves.toMatchObject({ stale: true });
    expect(session.getState()).toMatchObject({ status: 'ready', active: false });
    expect(onCandidate).not.toHaveBeenCalled();

    currentContext = 'reading:bm:0';
    await expect(session.start()).resolves.toMatchObject({ transcriptLength: 11 });
    expect(onCandidate).toHaveBeenCalledWith(expect.objectContaining({ text: 'fresh retry' }));
  });

  it('keeps diagnostics length-only and excludes transcript, Blob/audio/base64 and device identity', async () => {
    const { browserNavigator, browserWindow } = installEnvironment({
      search: '?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=SECRET%20transcript'
    });
    const capture = successfulCaptureFactory();
    const session = createIOSMediaSttSession({
      activity: 'reading',
      contextKey: 'reading:bm:0',
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => ({
        transcribe: async () => ({ transcript: 'SECRET transcript', confidence: 90, provider: 'test' })
      })
    });
    await session.start();
    const snapshot = getSpeechDiagnosticSnapshot();
    const serialized = JSON.stringify(snapshot);
    expect(snapshot.diagnostic.iosMediaStt).toEqual({
      requested: true,
      active: true,
      mockTranscriptConfigured: true,
      scope: 'reading-speaking-only'
    });
    expect(snapshot.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: 'media-stt-transcribe-complete',
        totalCharacterCount: 17,
        recognizerCreated: false
      })
    ]));
    expect(serialized).not.toContain('SECRET transcript');
    expect(serialized).not.toContain('base64');
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'transcript'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'blob'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'deviceId'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'label'))).toBe(true);
  });

  it('wires Bacaan and Bertutur confirmation/manual fallbacks without storage clearing or alternate TTS', () => {
    const appSource = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const bacaan = appSource.slice(appSource.indexOf('function BacaanCoach('), appSource.indexOf('\nconst listeningSets ='));
    const bertutur = appSource.slice(appSource.indexOf('function BertuturCoach('), appSource.indexOf('\nfunction getBertuturReviewCopy('));
    const alternateStart = bacaan.slice(
      bacaan.indexOf('function startBacaanMediaStt()'),
      bacaan.indexOf('\n  function startMendengar()')
    );
    const newSources = [
      '../../src/ai/speech/mediaSttCapture.js',
      '../../src/ai/speech/sttAdapter.js',
      '../../src/ai/speech/iosMediaSttSession.js'
    ].map(path => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');

    expect(bacaan).toContain('if (iosMediaSttEnabled)');
    expect(bertutur).toContain('if (iosMediaSttEnabled)');
    expect(bacaan).toContain('acceptBacaanSpeechCandidate');
    expect(bertutur).toContain('acceptSpeechCandidate');
    expect(bacaan).toContain('if (speechCandidate?.text) return;');
    expect(bacaan).toContain('disabled={listening || Boolean(speechCandidate)}');
    expect(bacaan).toContain("clearBacaanSession('manual-edit')");
    expect(bertutur).toContain("stopRecognitionSilently('manual-edit')");
    expect(bacaan).toContain('<textarea');
    expect(bertutur).toContain('id="bertutur-transcript"');
    expect(bacaan).toContain('data-speech-state={mediaSpeechStatus}');
    expect(bertutur).toContain('data-speech-state={mediaSpeechStatus}');
    expect(alternateStart).not.toContain('stopVoice');
    expect(alternateStart).not.toContain('createCommunicationSpeechSession');
    expect(newSources).not.toContain('SpeechRecognition');
    expect(newSources).not.toContain('speechSynthesis');
    expect(newSources).not.toContain('voiceEngine');
    expect(newSources).not.toContain('localStorage');
    expect(newSources).not.toContain('sessionStorage');
    expect(newSources).not.toContain('.clear()');
    expect(newSources).not.toContain('clearResume');
    expect(newSources).not.toContain('onClearResume');
  });
});
