import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommunicationSpeechSession } from '../../src/ai/speech/communicationSpeech.js';
import { createIOSMediaSttSession } from '../../src/ai/speech/iosMediaSttSession.js';
import {
  MEDIA_STT_READING_MAX_DURATION_MS,
  MEDIA_STT_SPEAKING_MAX_DURATION_MS,
  MediaSttError
} from '../../src/ai/speech/mediaSttCapture.js';
import {
  isIOSMediaSttRequested,
  resolveIOSMediaSttActivation,
  shouldAvoidIOSWebSpeech,
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
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
const VALID_ENDPOINT = 'https://example.workers.dev/v1/transcribe';

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

function controlledCaptureFactory({ durationMs = 10000 } = {}) {
  const pending = deferred();
  let captureSignal = null;
  let settled = false;
  const result = {
    blob: new Blob(['audio'], { type: 'audio/mp4;codecs=mp4a.40.2' }),
    mimeType: 'audio/mp4;codecs=mp4a.40.2',
    durationMs
  };
  const capture = vi.fn(({ signal }) => {
    captureSignal = signal;
    signal?.addEventListener?.('abort', () => {
      if (settled) return;
      settled = true;
      pending.reject(new MediaSttError('cancelled', 'abort-signal'));
    }, { once: true });
    return pending.promise;
  });
  const stop = vi.fn(() => {
    if (!settled) {
      settled = true;
      pending.resolve(result);
    }
    return true;
  });
  const cancel = vi.fn(() => true);
  return {
    factory: vi.fn(() => ({ capture, stop, cancel })),
    capture,
    cancel,
    resolveCapture() {
      if (settled) return;
      settled = true;
      pending.resolve(result);
    },
    get signal() { return captureSignal; },
    stop
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  delete globalThis.window;
});

describe('P1.12 production iOS media-STT integration', () => {
  it('auto-activates on iOS/iPadOS WebKit with a valid endpoint and no query flag', () => {
    expect(isIOSMediaSttRequested('?iosSpeechMode=media-stt')).toBe(true);
    expect(isIOSMediaSttRequested('?iosSpeechMode=default')).toBe(false);
    expect(resolveIOSMediaSttActivation({
      search: '',
      userAgent: IOS_UA,
      maxTouchPoints: 5,
      endpoint: VALID_ENDPOINT
    })).toMatchObject({
      active: true,
      activationReason: 'production-ios-auto',
      endpointConfigured: true
    });
    expect(shouldUseIOSMediaStt({ search: '', userAgent: IOS_UA, maxTouchPoints: 5, endpoint: VALID_ENDPOINT })).toBe(true);
    expect(shouldUseIOSMediaStt({ search: '', userAgent: IPAD_DESKTOP_UA, maxTouchPoints: 5, endpoint: VALID_ENDPOINT })).toBe(true);
  });

  it('keeps the explicit media flag and rejects non-iOS activation', () => {
    expect(shouldUseIOSMediaStt({ search: '?iosSpeechMode=media-stt', userAgent: IOS_UA, maxTouchPoints: 5 })).toBe(true);
    expect(shouldUseIOSMediaStt({ search: '?iosSpeechMode=media-stt', userAgent: IPAD_DESKTOP_UA, maxTouchPoints: 5 })).toBe(true);
    expect(shouldUseIOSMediaStt({ search: '?iosSpeechMode=media-stt', userAgent: DESKTOP_UA, maxTouchPoints: 0 })).toBe(false);
    expect(shouldUseIOSMediaStt({ search: '', userAgent: DESKTOP_UA, maxTouchPoints: 0, endpoint: VALID_ENDPOINT })).toBe(false);
    expect(shouldUseIOSMediaStt({ search: '', userAgent: ANDROID_UA, maxTouchPoints: 5, endpoint: VALID_ENDPOINT })).toBe(false);
  });

  it('uses safe manual fallback on iOS when the endpoint is absent or invalid', () => {
    expect(resolveIOSMediaSttActivation({ search: '', userAgent: IOS_UA, maxTouchPoints: 5 })).toMatchObject({
      active: false,
      endpointConfigured: false,
      manualFallback: true
    });
    expect(shouldUseIOSMediaStt({ search: '', userAgent: IOS_UA, maxTouchPoints: 5, endpoint: 'http://unsafe.example' })).toBe(false);
    expect(shouldAvoidIOSWebSpeech({ search: '', userAgent: IOS_UA, maxTouchPoints: 5 })).toBe(true);
  });

  it('lets the explicit iOS bypass flag override production auto activation', () => {
    expect(resolveIOSMediaSttActivation({
      search: '?iosSpeechBypass=1',
      userAgent: IOS_UA,
      maxTouchPoints: 5,
      endpoint: VALID_ENDPOINT
    })).toMatchObject({ active: false, manualBypassRequested: true, manualFallback: true });
  });

  it('preserves only explicit Web Speech diagnostic modes as a non-production override', () => {
    expect(resolveIOSMediaSttActivation({
      search: '?speechDiag=1&speechMode=legacy-simple',
      userAgent: IOS_UA,
      maxTouchPoints: 5,
      endpoint: VALID_ENDPOINT
    })).toMatchObject({
      active: false,
      manualFallback: false
    });
    expect(shouldAvoidIOSWebSpeech({
      search: '?speechDiag=1&speechMode=legacy-simple',
      userAgent: IOS_UA,
      maxTouchPoints: 5
    })).toBe(false);
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

  it('never creates Web Speech for iOS without an endpoint and keeps desktop/Android recognizers unchanged', () => {
    installEnvironment({ search: '', userAgent: IOS_UA, maxTouchPoints: 5 });
    const iosSessionFactory = vi.fn();
    const iosSession = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      sessionFactory: iosSessionFactory
    });
    expect(iosSession).toMatchObject({ supported: false, bypassed: true });
    expect(iosSessionFactory).not.toHaveBeenCalled();

    const cases = [
      { search: '', userAgent: DESKTOP_UA, maxTouchPoints: 0 },
      { search: '', userAgent: ANDROID_UA, maxTouchPoints: 5 },
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

  it.each([
    ['reading', MEDIA_STT_READING_MAX_DURATION_MS],
    ['speaking', MEDIA_STT_SPEAKING_MAX_DURATION_MS]
  ])('%s publishes recording/transcribing/review and returns an unscored candidate', async (activity, maximumMs) => {
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
    expect(states).toEqual(['recording', 'transcribing', 'review']);
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
    expect(capture.capture).toHaveBeenCalledWith(expect.objectContaining({ durationMs: maximumMs }));
  });

  it.each([
    ['reading', MEDIA_STT_READING_MAX_DURATION_MS, 12000],
    ['speaking', MEDIA_STT_SPEAKING_MAX_DURATION_MS, 14000]
  ])('%s manual stop below %i ms transcribes exactly once and makes double-stop safe', async (activity, maximumMs, durationMs) => {
    const { browserNavigator, browserWindow } = installEnvironment();
    const capture = controlledCaptureFactory({ durationMs });
    const states = [];
    const adapter = {
      transcribe: vi.fn(async () => ({ transcript: 'child paced answer', confidence: 90, provider: 'test' }))
    };
    const session = createIOSMediaSttSession({
      activity,
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => adapter,
      onStateChange: state => states.push(state.status)
    });

    const started = session.start();
    await flush();
    expect(capture.capture).toHaveBeenCalledWith(expect.objectContaining({ durationMs: maximumMs }));
    expect(session.stop('manual-stop')).toBe(true);
    expect(session.stop('manual-stop')).toBe(true);
    await expect(started).resolves.toMatchObject({ transcriptLength: 18 });

    expect(capture.stop).toHaveBeenCalledTimes(1);
    expect(adapter.transcribe).toHaveBeenCalledTimes(1);
    expect(adapter.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({ activity, durationMs })
    }));
    expect(states).toEqual(['recording', 'stopping', 'transcribing', 'review']);
  });

  it.each([
    ['reading', MEDIA_STT_READING_MAX_DURATION_MS],
    ['speaking', MEDIA_STT_SPEAKING_MAX_DURATION_MS]
  ])('%s hard-timeout completion transcribes exactly once', async (activity, maximumMs) => {
    const { browserNavigator, browserWindow } = installEnvironment();
    const capture = controlledCaptureFactory({ durationMs: maximumMs });
    const adapter = {
      transcribe: vi.fn(async () => ({ transcript: 'automatic stop', confidence: 88, provider: 'test' }))
    };
    const session = createIOSMediaSttSession({
      activity,
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => adapter
    });

    const started = session.start();
    await flush();
    capture.resolveCapture();
    await expect(started).resolves.toMatchObject({ transcriptLength: 14 });
    expect(capture.stop).not.toHaveBeenCalled();
    expect(adapter.transcribe).toHaveBeenCalledTimes(1);
    expect(adapter.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({ activity, durationMs: maximumMs })
    }));
  });

  it('cancel aborts capture and never transcribes or uploads audio', async () => {
    const { browserNavigator, browserWindow } = installEnvironment();
    const capture = controlledCaptureFactory();
    const adapter = { transcribe: vi.fn() };
    const session = createIOSMediaSttSession({
      activity: 'reading',
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => adapter
    });

    const started = session.start();
    await flush();
    expect(session.cancel('manual-cancel')).toBe(true);
    await expect(started).resolves.toMatchObject({ stale: true });
    expect(capture.signal.aborted).toBe(true);
    expect(adapter.transcribe).not.toHaveBeenCalled();
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

  it.each([
    ['403/CORS', 'stt-unavailable'],
    ['timeout', 'stt-timeout'],
    ['rate limit', 'stt-rate-limited'],
    ['provider failure', 'stt-error'],
    ['no speech', 'no-speech']
  ])('recovers %s to a retryable manual-safe state with one attempt per gesture', async (_label, errorCode) => {
    const { browserNavigator, browserWindow } = installEnvironment();
    const capture = successfulCaptureFactory();
    const onFailure = vi.fn();
    const adapter = {
      transcribe: vi.fn(async () => { throw new MediaSttError(errorCode, 'private-provider-detail'); })
    };
    const session = createIOSMediaSttSession({
      activity: 'speaking',
      getWindow: () => browserWindow,
      getNavigator: () => browserNavigator,
      captureFactory: capture.factory,
      adapterFactory: () => adapter,
      onFailure
    });

    await expect(session.start()).resolves.toMatchObject({ started: true, errorCode });
    expect(session.getState()).toMatchObject({ status: 'error', active: false, errorCode });
    expect(capture.capture).toHaveBeenCalledTimes(1);
    expect(adapter.transcribe).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledWith({ errorCode });

    await expect(session.start()).resolves.toMatchObject({ started: true, errorCode });
    expect(capture.capture).toHaveBeenCalledTimes(2);
    expect(adapter.transcribe).toHaveBeenCalledTimes(2);
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
      activationReason: 'explicit-ios-media-stt-flag',
      mockTranscriptConfigured: true,
      endpointConfigured: false,
      provider: 'deterministic-preview',
      remoteUpload: false,
      recognizerCreated: false,
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

  it('exports production auto-activation without transcript, audio or identity data', () => {
    installEnvironment({ search: '', userAgent: IOS_UA, maxTouchPoints: 5 });
    vi.stubEnv('VITE_STT_ENDPOINT', VALID_ENDPOINT);

    const snapshot = getSpeechDiagnosticSnapshot();
    expect(snapshot.diagnostic.iosMediaStt).toMatchObject({
      requested: false,
      active: true,
      activationReason: 'production-ios-auto',
      endpointConfigured: true,
      provider: 'cloudflare-workers-ai',
      remoteUpload: true,
      recognizerCreated: false
    });
    expect(snapshot.privacy).toMatchObject({
      remoteUpload: true,
      transcriptIncluded: false,
      audioIncluded: false,
      learnerIdentityIncluded: false
    });
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
    expect(bacaan).toContain('resolveIOSMediaSttActivation()');
    expect(bertutur).toContain('resolveIOSMediaSttActivation()');
    expect(bacaan).toContain('iosMediaSttActivation.manualFallback');
    expect(bertutur).toContain('iosMediaSttActivation.manualFallback');
    expect(bacaan).toContain('Rakaman suara belum tersedia. Kamu masih boleh menaip jawapan.');
    expect(bertutur).toContain('Rakaman suara belum tersedia. Kamu masih boleh menaip jawapan.');
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
    expect(bacaan).toContain('captureDurationMs: MEDIA_STT_READING_MAX_DURATION_MS');
    expect(bertutur).toContain('captureDurationMs: MEDIA_STT_SPEAKING_MAX_DURATION_MS');
    expect(bacaan).toContain("speechSessionRef.current?.stop?.('manual-stop')");
    expect(bertutur).toContain("speechSessionRef.current?.stop?.('manual-stop')");
    expect(bacaan).toContain("? 'Selesai'");
    expect(bertutur).toContain("? 'Selesai'");
    expect(bacaan).toContain("review: 'Semak transkrip.'");
    expect(bertutur).toContain("review: 'Semak transkrip.'");
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
