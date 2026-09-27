import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearSpeechDiagnosticTrace,
  createSpeechResultMetadata,
  getSpeechDiagnosticSnapshot,
  resolveSpeechDiagnosticCaptureMode,
  traceSpeechDiagnostic
} from '../../src/ai/speech/speechDiagnostics.js';
import {
  cancelActiveSpeechRecognition,
  createSpeechSession
} from '../../src/ai/speech/speechEngine.js';
import { createReadingSpeechSession } from '../../src/ai/speech/speechSession.js';
import {
  cancelBrowserSpeech,
  speakBrowserSegment
} from '../../src/ai/voice/browserVoiceProvider.js';
import {
  createMemorySessionStorage,
  SharedNativeOwnerSpeechRecognition
} from '../helpers/sharedNativeSpeechBackend.js';

const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

class SequencedLifecycleRecognition {
  static instances = [];
  static behaviors = [];

  static reset(behaviors = []) {
    SequencedLifecycleRecognition.instances = [];
    SequencedLifecycleRecognition.behaviors = [...behaviors];
  }

  constructor() {
    this.lang = '';
    this.interimResults = false;
    this.continuous = false;
    this.maxAlternatives = 0;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    this.behavior = SequencedLifecycleRecognition.behaviors.shift() || 'capture';
    SequencedLifecycleRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.onstart?.();
    if (this.behavior === 'capture') this.onaudiostart?.();
  }

  stop() {
    this.stopCalls += 1;
  }

  abort() {
    this.abortCalls += 1;
  }

  emitResult(transcript) {
    const result = [{ transcript, confidence: 0.9 }];
    result.isFinal = true;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }

  emitEnd() {
    this.onend?.();
  }
}

function installEnvironment({
  mode = 'current',
  diagnostics = true,
  userAgent = ANDROID_UA,
  maxTouchPoints = 5,
  recognition = SharedNativeOwnerSpeechRecognition,
  serviceWorkerController = null,
  standalone = false
} = {}) {
  SharedNativeOwnerSpeechRecognition.reset();
  const sessionStorage = createMemorySessionStorage();
  const search = diagnostics
    ? '?speechDiag=1&speechMode=' + mode
    : '?speechMode=' + mode;
  globalThis.window = {
    SpeechRecognition: recognition,
    webkitSpeechRecognition: null,
    location: {
      search,
      href: 'https://example.test/jannati-ai-tutor-v1/' + search,
      assign() {}
    },
    sessionStorage,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener() {},
    matchMedia: () => ({ matches: standalone }),
    URL: globalThis.URL
  };
  vi.stubGlobal('navigator', {
    userAgent,
    maxTouchPoints,
    standalone,
    serviceWorker: { controller: serviceWorkerController }
  });
  clearSpeechDiagnosticTrace();
  return sessionStorage;
}

function completeQuestion({ language, contextKey, transcript }) {
  const session = createReadingSpeechSession({
    activity: 'reading',
    contextKey,
    lang: language,
    resultFactory: value => ({ status: 'completed', transcript: value, correct: true })
  });
  session.start();
  const recognition = session.recognition;
  recognition.emitSoundStart();
  recognition.emitSpeechStart();
  recognition.emitResult(transcript);
  recognition.emitEnd();
  return recognition;
}

afterEach(() => {
  try {
    cancelActiveSpeechRecognition('test-cleanup');
    cancelBrowserSpeech();
  } catch {
    // Best-effort cleanup for deliberately failing lifecycle callbacks.
  }
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe('diagnostic capture mode matrix', () => {
  it.each([
    ['iOS current', IOS_UA, 'current', true, true],
    ['iOS single-interim', IOS_UA, 'single-interim', false, true],
    ['iOS single-final', IOS_UA, 'single-final', false, false],
    ['Android current', ANDROID_UA, 'current', true, true],
    ['Android single-interim', ANDROID_UA, 'single-interim', false, true],
    ['Android single-final', ANDROID_UA, 'single-final', false, false]
  ])('runs Q1 through Q3 in %s without coupling aggregation to native flags',
    (_label, userAgent, mode, expectedContinuous, expectedInterim) => {
      installEnvironment({ mode, userAgent });
      const recognitions = [
        completeQuestion({
          language: 'ms-MY',
          contextKey: 'reading:bm:0',
          transcript: 'jawapan satu'
        }),
        completeQuestion({
          language: 'en-US',
          contextKey: 'reading:english:1',
          transcript: 'answer two'
        }),
        completeQuestion({
          language: 'ms-MY',
          contextKey: 'reading:bm:2',
          transcript: 'jawapan tiga'
        })
      ];

      expect(recognitions).toHaveLength(3);
      recognitions.forEach(recognition => {
        expect(recognition.continuous).toBe(expectedContinuous);
        expect(recognition.interimResults).toBe(expectedInterim);
        expect(recognition.hasCapture).toBe(true);
      });

      const startEvents = getSpeechDiagnosticSnapshot().events
        .filter(event => event.event === 'start-call');
      expect(startEvents.map(event => event.language)).toEqual(['ms-MY', 'en-US', 'ms-MY']);
      expect(startEvents.every(event => event.multiUtterance === true)).toBe(true);
      expect(startEvents.every(event => event.appliedContinuous === expectedContinuous)).toBe(true);
      expect(startEvents.every(event => event.appliedInterim === expectedInterim)).toBe(true);
    });

  it('keeps single-final query inert without the explicit speechDiag flag', () => {
    installEnvironment({ mode: 'single-final', diagnostics: false });
    const session = createReadingSpeechSession({ lang: 'ms-MY' });
    session.start();
    expect(session.recognition.continuous).toBe(true);
    expect(session.recognition.interimResults).toBe(true);
    expect(getSpeechDiagnosticSnapshot().events).toEqual([]);
    session.cancel();
  });

  it('keeps desktop on the current native settings as a control', () => {
    installEnvironment({
      mode: 'single-final',
      userAgent: DESKTOP_UA,
      maxTouchPoints: 0
    });
    const capture = resolveSpeechDiagnosticCaptureMode({
      continuous: true,
      interimResults: true,
      multiUtterance: true
    });
    expect(capture.platform).toBe('desktop');
    expect(capture.appliedContinuous).toBe(true);
    expect(capture.appliedInterim).toBe(true);
  });
});

describe('current-mode mobile no-lifecycle reproduction', () => {
  it('keeps the v3.13.8 15s retry and terminal result at about 30.3s when Q2 only emits onstart', () => {
    vi.useFakeTimers();
    SequencedLifecycleRecognition.reset(['capture', 'onstart-only', 'onstart-only']);
    installEnvironment({
      mode: 'current',
      userAgent: IOS_UA,
      recognition: SequencedLifecycleRecognition
    });

    const q1 = createReadingSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:0',
      questionIndex: 0,
      lang: 'ms-MY',
      startTimeoutMs: 6000,
      startRetryDelayMs: 300,
      postStartRetryDelayMs: 300,
      hardTimeoutMs: 15000
    });
    q1.start();
    q1.recognition.emitResult('jawapan satu');
    q1.recognition.emitEnd();

    const q2 = createReadingSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:1',
      questionIndex: 1,
      lang: 'ms-MY',
      startTimeoutMs: 6000,
      startRetryDelayMs: 300,
      postStartRetryDelayMs: 300,
      hardTimeoutMs: 15000
    });
    q2.start();
    vi.advanceTimersByTime(15000);
    vi.advanceTimersByTime(300);
    vi.advanceTimersByTime(15000);

    expect(q2.getState().status).toBe('empty');
    const q2Instances = SequencedLifecycleRecognition.instances.slice(1);
    expect(q2Instances).toHaveLength(2);
    expect(q2Instances.map(instance => instance.abortCalls)).toEqual([1, 1]);

    const events = getSpeechDiagnosticSnapshot().events
      .filter(event => event.contextKey === 'reading:bm:1');
    const starts = events.filter(event => event.event === 'start-call');
    const hardTimeouts = events.filter(event => event.event === 'hard-timeout-fired');
    expect(starts).toHaveLength(2);
    expect(events.filter(event => event.event === 'onstart')).toHaveLength(2);
    expect(events.filter(event => event.event === 'onaudiostart')).toHaveLength(0);
    expect(starts[1].relativeMs - starts[0].relativeMs).toBe(15300);
    expect(hardTimeouts[0].relativeMs - starts[0].relativeMs).toBe(15000);
    expect(hardTimeouts[1].relativeMs - starts[0].relativeMs).toBe(30300);
  });
});

describe('shared native recognition ownership harness', () => {
  it('reproduces abort then 300ms retry starting before native onend and stalling without capture', () => {
    vi.useFakeTimers();
    installEnvironment({ mode: 'current', userAgent: ANDROID_UA });
    SharedNativeOwnerSpeechRecognition.releaseDelayMs = 500;

    const q1 = createReadingSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:0',
      questionIndex: 0,
      lang: 'ms-MY'
    });
    q1.start();
    q1.recognition.emitResult('jawapan satu');
    q1.recognition.emitEnd();

    const q2 = createReadingSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:1',
      questionIndex: 1,
      lang: 'ms-MY',
      startTimeoutMs: 6000,
      startRetryDelayMs: 300,
      postStartRetryDelayMs: 300,
      hardTimeoutMs: 15000
    });
    q2.start();
    const firstAttempt = q2.recognition;
    expect(firstAttempt.hasCapture).toBe(true);

    vi.advanceTimersByTime(15000);
    expect(firstAttempt.abortCalls).toBe(1);
    expect(SharedNativeOwnerSpeechRecognition.ownerState).toBe('releasing');

    vi.advanceTimersByTime(300);
    const secondAttempt = q2.recognition;
    expect(secondAttempt).not.toBe(firstAttempt);
    expect(secondAttempt.startCalls).toBe(1);
    expect(secondAttempt.stalledDuringRelease).toBe(true);
    expect(secondAttempt.hasCapture).toBe(false);

    let q2Events = getSpeechDiagnosticSnapshot().events
      .filter(event => event.contextKey === 'reading:bm:1');
    expect(q2Events.some(event => event.event === 'onstart' && event.attempt === 2)).toBe(true);
    expect(q2Events.some(event => event.event === 'onaudiostart' && event.attempt === 2)).toBe(false);
    expect(q2Events.find(event => event.event === 'retry-started')).toMatchObject({
      nativeEndAcknowledged: false,
      retryBeforeOldOnend: true
    });

    vi.advanceTimersByTime(200);
    expect(SharedNativeOwnerSpeechRecognition.ownerState).toBe('idle');
    q2Events = getSpeechDiagnosticSnapshot().events
      .filter(event => event.contextKey === 'reading:bm:1');
    expect(q2Events.some(event => (
      event.event === 'onend'
      && event.attempt === 1
      && event.nativeEndAcknowledged === true
    ))).toBe(true);

    vi.advanceTimersByTime(14800);
    expect(q2.getState().status).toBe('empty');
    expect(secondAttempt.abortCalls).toBe(1);

    q2Events = getSpeechDiagnosticSnapshot().events
      .filter(event => event.contextKey === 'reading:bm:1');
    const firstStart = q2Events.find(event => event.event === 'start-call' && event.attempt === 1);
    const retryStart = q2Events.find(event => event.event === 'start-call' && event.attempt === 2);
    const hardTimeouts = q2Events.filter(event => event.event === 'hard-timeout-fired');
    expect(retryStart.relativeMs - firstStart.relativeMs).toBe(15300);
    expect(hardTimeouts[0].relativeMs - firstStart.relativeMs).toBe(15000);
    expect(hardTimeouts[1].relativeMs - firstStart.relativeMs).toBe(30300);
  });

  it('shows that waiting for delayed native onend before a new start avoids the modelled stall', () => {
    vi.useFakeTimers();
    SharedNativeOwnerSpeechRecognition.reset({ releaseDelayMs: 500 });
    const first = new SharedNativeOwnerSpeechRecognition();
    const second = new SharedNativeOwnerSpeechRecognition();
    first.start();
    first.onend = () => second.start();

    first.abort();
    vi.advanceTimersByTime(499);
    expect(second.startCalls).toBe(0);
    expect(SharedNativeOwnerSpeechRecognition.ownerState).toBe('releasing');

    vi.advanceTimersByTime(1);
    expect(second.startCalls).toBe(1);
    expect(second.hasCapture).toBe(true);
    expect(second.stalledDuringRelease).toBe(false);
    expect(SharedNativeOwnerSpeechRecognition.ownerState).toBe('active');
  });
});

describe('safe diagnostic trace', () => {
  it('keeps a bounded 300-event buffer and drops transcript-like extra fields', () => {
    installEnvironment();
    for (let index = 0; index < 305; index += 1) {
      traceSpeechDiagnostic('onresult', {
        activity: 'reading',
        contextKey: 'reading:bm:0',
        reason: 'event-' + index,
        transcript: 'RAHSIA MURID',
        totalCharacterCount: 12
      });
    }
    const snapshot = getSpeechDiagnosticSnapshot();
    expect(snapshot.events).toHaveLength(300);
    expect(snapshot.events[0].reason).toBe('event-5');
    expect(JSON.stringify(snapshot)).not.toContain('RAHSIA MURID');
    expect(snapshot.privacy).toMatchObject({
      remoteUpload: false,
      transcriptIncluded: false,
      audioIncluded: false,
      learnerIdentityIncluded: false,
      maximumEvents: 300
    });
  });

  it('records result counts and lengths without returning raw transcript text', () => {
    const finalResult = [{ transcript: 'hello', confidence: 0.9 }];
    finalResult.isFinal = true;
    const interimResult = [{ transcript: 'world', confidence: 0.7 }, { transcript: '', confidence: 0.1 }];
    interimResult.isFinal = false;
    const metadata = createSpeechResultMetadata({
      resultIndex: 1,
      results: [finalResult, interimResult]
    });
    expect(metadata).toEqual({
      resultIndex: 1,
      resultsLength: 2,
      finalResultCount: 1,
      interimResultCount: 1,
      alternativeCount: 3,
      nonEmptyTranscriptCount: 2,
      totalCharacterCount: 10
    });
    expect(JSON.stringify(metadata)).not.toContain('hello');
    expect(JSON.stringify(metadata)).not.toContain('world');
  });

  it('distinguishes native onresult, parser success and a UI callback that fails to return', () => {
    installEnvironment();
    const session = createSpeechSession({
      activity: 'quiz',
      contextKey: 'quiz:bm:7',
      questionIndex: 7,
      lang: 'ms-MY',
      onTranscript() {
        throw new Error('modelled UI callback failure');
      }
    });
    session.start();
    expect(() => session.recognition.emitResult('metadata exists')).toThrow('modelled UI callback failure');

    const events = getSpeechDiagnosticSnapshot().events
      .filter(event => event.contextKey === 'quiz:bm:7');
    expect(events.some(event => event.event === 'onresult')).toBe(true);
    expect(events.some(event => event.event === 'transcript-parsed')).toBe(true);
    expect(events.some(event => event.event === 'ui-callback-start')).toBe(true);
    expect(events.some(event => event.event === 'ui-callback-return')).toBe(false);
    session.cancel();
  });

  it('exposes PWA controller and runtime-versus-baseline version fields', () => {
    installEnvironment({
      standalone: true,
      serviceWorkerController: {
        scriptURL: 'https://example.test/jannati-ai-tutor-v1/service-worker.js?build=old',
        state: 'activated'
      }
    });
    traceSpeechDiagnostic('session-create', { activity: 'reading' });
    const snapshot = getSpeechDiagnosticSnapshot();
    const event = snapshot.events.at(-1);
    expect(event.displayMode).toBe('standalone');
    expect(event.serviceWorkerScriptUrl).toContain('service-worker.js?build=old');
    expect(event.serviceWorkerControllerState).toBe('activated');
    expect(snapshot.baseline.appVersion).toBe('3.13.8');
    expect(snapshot.runtime).toHaveProperty('versionMatchesBaseline');
    expect(snapshot.runtime).toHaveProperty('buildMatchesBaseline');
  });

  it('marks component unmount separately from cancel and abort', () => {
    installEnvironment();
    const session = createSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:unmount'
    });
    session.start();
    session.cancel('component-unmount');
    const events = getSpeechDiagnosticSnapshot().events
      .filter(event => event.contextKey === 'reading:bm:unmount');
    expect(events.some(event => event.event === 'component-unmount')).toBe(true);
    expect(events.some(event => event.event === 'cancel-call')).toBe(true);
    expect(events.some(event => event.event === 'abort-call')).toBe(true);
  });
});

describe('TTS coupling diagnostics', () => {
  it('traces cancel while idle, active and after end without storing spoken text', async () => {
    installEnvironment();
    class MockUtterance {
      constructor(text) {
        this.text = text;
        this.lang = '';
      }
    }
    const synthesis = {
      speaking: false,
      pending: false,
      lastUtterance: null,
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
      speak(utterance) {
        this.lastUtterance = utterance;
        this.speaking = true;
      },
      cancel() {
        this.speaking = false;
        this.pending = false;
      }
    };
    globalThis.window.SpeechSynthesisUtterance = MockUtterance;
    globalThis.window.speechSynthesis = synthesis;

    cancelBrowserSpeech();

    const activePromise = speakBrowserSegment('private spoken words', {
      language: 'en',
      voices: []
    });
    const activeUtterance = synthesis.lastUtterance;
    activeUtterance.onstart?.();
    cancelBrowserSpeech();
    await activePromise;

    const completedPromise = speakBrowserSegment('second private phrase', {
      language: 'ms',
      voices: []
    });
    const completedUtterance = synthesis.lastUtterance;
    completedUtterance.onstart?.();
    synthesis.speaking = false;
    completedUtterance.onend?.();
    await completedPromise;
    cancelBrowserSpeech();

    const snapshot = getSpeechDiagnosticSnapshot();
    const cancellationReasons = snapshot.events
      .filter(event => event.event === 'tts-cancel')
      .map(event => event.reason);
    expect(cancellationReasons).toEqual(['idle', 'active', 'idle']);
    expect(snapshot.events.some(event => event.event === 'tts-speak-call')).toBe(true);
    expect(snapshot.events.some(event => event.event === 'tts-start')).toBe(true);
    expect(snapshot.events.some(event => event.event === 'tts-end')).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain('private spoken words');
    expect(JSON.stringify(snapshot)).not.toContain('second private phrase');
  });
});
