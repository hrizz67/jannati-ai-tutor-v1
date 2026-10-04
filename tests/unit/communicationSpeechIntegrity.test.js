import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assessCommunicationText,
  confirmCommunicationSpeechCandidate,
  createCommunicationSpeechErrorResult,
  createCommunicationSpeechSession,
  createSpeechReviewCandidate,
  getCommunicationSpeechErrorMessage,
  playCommunicationAudio,
  resolveCommunicationSpeechLocale
} from '../../src/ai/speech/communicationSpeech.js';
import { cancelActiveSpeechRecognition } from '../../src/ai/speech/speechEngine.js';
import {
  isAndroidBrowser,
  isIOSWebKitBrowser,
  shouldRecoverMobileSpeechStartup
} from '../../src/ai/speech/speechCapability.js';
import { createReadingSpeechSession } from '../../src/ai/speech/speechSession.js';
import {
  appendUniqueCommunicationResult,
  normalizeCommunicationResult
} from '../../src/utils/communicationResult.js';

class FakeSpeechRecognition {
  static instances = [];

  constructor() {
    this.lang = '';
    this.interimResults = false;
    this.continuous = false;
    this.maxAlternatives = 0;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.onstart?.();
  }

  stop() {
    this.stopCalls += 1;
  }

  abort() {
    this.abortCalls += 1;
  }

  emitResult(transcript, { isFinal = true, confidence = 0.9 } = {}) {
    const result = [{ transcript, confidence }];
    result.isFinal = isFinal;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }

  emitError(error) {
    this.onerror?.({ error });
  }

  emitEnd() {
    this.onend?.();
  }
}

function installRecognition() {
  FakeSpeechRecognition.instances = [];
  globalThis.window = {
    SpeechRecognition: FakeSpeechRecognition,
    webkitSpeechRecognition: null,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout
  };
}

function completeRecognition(session, transcript) {
  session.start();
  const recognition = session.recognition;
  recognition.emitResult(transcript);
  recognition.emitEnd();
  return recognition;
}

beforeEach(() => {
  installRecognition();
});

afterEach(() => {
  cancelActiveSpeechRecognition();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe('iOS WebKit browser detection', () => {
  it.each([
    ['Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'],
    ['Chrome', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1'],
    ['Firefox', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 FxiOS/131.0 Mobile/15E148 Safari/605.1.15'],
    ['Edge', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 EdgiOS/130.0 Mobile/15E148 Safari/605.1.15'],
    ['Opera', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 OPiOS/5.0 Mobile/15E148 Safari/9537.53']
  ])('treats iPhone %s as the iOS WebKit family', (_browser, userAgent) => {
    expect(isIOSWebKitBrowser(userAgent, 5)).toBe(true);
  });

  it('recognizes iPad desktop-mode user agents without classifying desktop Safari', () => {
    const desktopSafari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
    expect(isIOSWebKitBrowser(desktopSafari, 0)).toBe(false);
    expect(isIOSWebKitBrowser(desktopSafari, 5)).toBe(true);
  });

  it('leaves Android Chrome outside the iOS recovery policy', () => {
    const androidChrome = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
    expect(isIOSWebKitBrowser(androidChrome, 5)).toBe(false);
  });
});

describe('Android mobile browser detection', () => {
  const androidChrome = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';

  it.each([
    ['Chrome', androidChrome],
    ['Samsung Internet', 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36 SamsungBrowser/26.0'],
    ['Edge', 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36 EdgA/130.0']
  ])('recognizes Android %s user agents', (_browser, userAgent) => {
    expect(isAndroidBrowser(userAgent)).toBe(true);
    expect(shouldRecoverMobileSpeechStartup(userAgent, 5)).toBe(true);
  });

  it('does not classify iPhone or desktop browsers as Android', () => {
    const iPhone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
    const desktopChrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

    expect(isAndroidBrowser(iPhone)).toBe(false);
    expect(isAndroidBrowser(desktopChrome)).toBe(false);
    expect(shouldRecoverMobileSpeechStartup(iPhone, 5)).toBe(true);
    expect(shouldRecoverMobileSpeechStartup(desktopChrome, 0)).toBe(false);
  });
});

describe('communication speech locale integrity', () => {
  it.each([
    ['bm', 'ms-MY'],
    ['english', 'en-US'],
    ['arab', 'ar-SA']
  ])('passes %s locale %s to the active recognition instance', (id, speechLang) => {
    const session = createReadingSpeechSession({ lang: speechLang });
    session.start();
    expect(session.recognition.lang).toBe(speechLang);
    expect(session.recognition.continuous).toBe(true);
    expect(session.recognition.interimResults).toBe(true);
    session.cancel();
  });

  it('honours explicit speechLang instead of inferring from a label', () => {
    expect(resolveCommunicationSpeechLocale({ id: 'english', language: 'BM', speechLang: 'en-US' })).toBe('en-US');
  });

  it('uses the language id mapping only when explicit speechLang is absent', () => {
    expect(resolveCommunicationSpeechLocale({ id: 'arab', language: 'English' })).toBe('ar-SA');
  });
});

describe('Bacaan recognition flow', () => {
  it.each([
    ['bm', 'ms-MY', 'Saya membaca buku'],
    ['english', 'en-US', 'I read a book'],
    ['arab', 'ar-SA', 'أنا أقرأ كتابا']
  ])('streams and completes %s transcript through the shared session', (id, speechLang, spokenText) => {
    const transcripts = [];
    const results = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id, speechLang },
      contextKey: `reading:${id}`,
      getCurrentContextKey: () => `reading:${id}`,
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onTranscript: transcript => transcripts.push(transcript),
      onResult: result => results.push(result)
    });

    const recognition = completeRecognition(session, spokenText);
    expect(recognition.lang).toBe(speechLang);
    expect(transcripts.at(-1)).toBe(spokenText);
    expect(results).toHaveLength(1);
    expect(results[0].transcript).toBe(spokenText);
  });
});

describe('Android transcript revision integrity', () => {
  it('replaces revised result indexes and de-duplicates overlapping final fragments', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
      maxTouchPoints: 5
    });
    const transcripts = [];
    const results = [];
    const session = createReadingSpeechSession({
      lang: 'ms-MY',
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onTranscript: transcript => transcripts.push(transcript),
      onComplete: result => results.push(result)
    });
    const speechResult = transcript => {
      const result = [{ transcript, confidence: 0.9 }];
      result.isFinal = true;
      return result;
    };

    session.start();
    const recognition = session.recognition;
    const first = speechResult('Saya membaca');
    recognition.onresult?.({ resultIndex: 0, results: [first] });
    recognition.onresult?.({
      resultIndex: 1,
      results: [first, speechResult('membaca buku')]
    });
    recognition.onresult?.({
      resultIndex: 1,
      results: [first, speechResult('membaca buku baharu')]
    });
    recognition.emitEnd();

    expect(transcripts.at(-1)).toBe('Saya membaca buku baharu');
    expect(results).toHaveLength(1);
    expect(results[0].transcript).toBe('Saya membaca buku baharu');
  });
});

describe('Bertutur review and confirmation flow', () => {
  it.each([
    ['bm', 'ms-MY', 'Saya makan nasi'],
    ['english', 'en-US', 'I eat rice'],
    ['arab', 'ar-SA', 'أنا آكل الأرز']
  ])('keeps %s recognition non-assessed until explicit confirmation', (id, speechLang, spokenText) => {
    const reviews = [];
    let history = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id, speechLang },
      contextKey: `speaking:${id}:intro`,
      getCurrentContextKey: () => `speaking:${id}:intro`,
      resultFactory: transcript => ({ status: 'captured', transcript, confidence: 0.8 }),
      onCandidate: review => reviews.push(review)
    });

    const recognition = completeRecognition(session, spokenText);
    expect(recognition.lang).toBe(speechLang);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].candidate.text).toBe(spokenText);
    expect(normalizeCommunicationResult(reviews[0].result).isAssessed).toBe(false);
    expect(history).toEqual([]);

    const confirmed = confirmCommunicationSpeechCandidate(
      reviews[0].candidate,
      transcript => ({ score: transcript === spokenText ? 100 : 0, correct: true })
    );
    history = appendUniqueCommunicationResult(history, confirmed, { itemKey: `${id}:intro:0` });
    expect(confirmed.source).toBe('speech-confirmed');
    expect(history).toEqual([100]);
  });

  it('allows a review candidate to be edited or cleared without assessing it', () => {
    const review = createSpeechReviewCandidate({ transcript: 'draft text', confidence: 0.5 });
    review.candidate.text = 'edited text';
    expect(review.candidate.text).toBe('edited text');
    expect(normalizeCommunicationResult(review.result).isAssessed).toBe(false);
    expect(createSpeechReviewCandidate({ transcript: '' })).toBeNull();
  });

  it('keeps manual typing available when recognition is unsupported', () => {
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      sessionFactory: options => ({
        supported: false,
        start() {
          const unsupported = { unsupported: true, transcript: '' };
          options.onChange?.({ status: 'unsupported', result: unsupported });
          return unsupported;
        },
        cancel() {}
      }),
      onFailure: result => failures.push(result)
    });
    session.start();
    const manual = assessCommunicationText('typed answer', () => ({ score: 100, correct: true }));
    expect(failures[0].manualFallbackAvailable).toBe(true);
    expect(manual.source).toBe('manual');
    expect(normalizeCommunicationResult(manual).isAssessed).toBe(true);
  });
});

describe('visible controlled recognition failures', () => {
  it.each([
    ['not-allowed', 'Mikrofon tidak dibenarkan'],
    ['service-not-allowed', 'Mikrofon tidak dibenarkan'],
    ['no-speech', 'Tiada suara dikesan'],
    ['no-result', 'Tiada suara dikesan'],
    ['audio-capture', 'Mikrofon tidak dapat dikesan'],
    ['network', 'Semak sambungan internet'],
    ['language-not-supported', 'Bahasa suara ini tidak disokong'],
    ['bad-grammar', 'tidak dapat memproses bahasa'],
    ['unknown-provider-error', 'Pengecaman suara menghadapi masalah']
  ])('maps %s to an actionable manual-fallback message', (errorCode, expectedText) => {
    const result = createCommunicationSpeechErrorResult(errorCode);
    expect(result.message).toContain(expectedText);
    expect(result.message.toLowerCase()).toMatch(/taip|menaip/);
    expect(result.isAssessed).toBe(false);
    expect(result.manualFallbackAvailable).toBe(true);
  });

  it.each([
    ['english', 'en-US'],
    ['arab', 'ar-SA']
  ])('surfaces a generic %s recognition error without an assessed result', (id, speechLang) => {
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id, speechLang },
      contextKey: `speaking:${id}`,
      getCurrentContextKey: () => `speaking:${id}`,
      onFailure: result => failures.push(result)
    });
    session.start();
    session.recognition.emitError('network');
    expect(failures).toHaveLength(1);
    expect(failures[0].message).toContain('taip jawapan secara manual');
    expect(normalizeCommunicationResult(failures[0]).isAssessed).toBe(false);
  });

  it('surfaces engine-specific permission and capture errors once', () => {
    for (const errorCode of ['not-allowed', 'audio-capture']) {
      const failures = [];
      const session = createCommunicationSpeechSession({
        activity: 'reading',
        selectedSet: { id: 'bm', speechLang: 'ms-MY' },
        onFailure: result => failures.push(result)
      });
      session.start();
      session.recognition.emitError(errorCode);
      expect(failures).toHaveLength(1);
      expect(failures[0].errorCode).toBe(errorCode);
    }
  });

  it('never appends empty or technical speech failures to score history', () => {
    const empty = createCommunicationSpeechErrorResult('no-speech');
    const technical = createCommunicationSpeechErrorResult('network');
    let history = appendUniqueCommunicationResult([], empty, { itemKey: 'empty' });
    history = appendUniqueCommunicationResult(history, technical, { itemKey: 'technical' });
    expect(history).toEqual([]);
  });

  it('keeps the public error copy actionable for unknown locale/provider failures', () => {
    expect(getCommunicationSpeechErrorMessage('language-unavailable')).toContain('pelayar atau peranti');
    expect(getCommunicationSpeechErrorMessage('unexpected')).toContain('taip jawapan secara manual');
  });
});

describe('session isolation and retry', () => {
  it('keeps Q1, Q2 and Q3 recognition isolated from an older delayed abort', () => {
    vi.useFakeTimers();

    class SharedPipelineSpeechRecognition extends FakeSpeechRecognition {
      static instances = [];
      static activeInstance = null;

      constructor() {
        super();
        SharedPipelineSpeechRecognition.instances.push(this);
        this.blockedByStaleAbort = false;
      }

      start() {
        this.startCalls += 1;
        SharedPipelineSpeechRecognition.activeInstance = this;
        this.onstart?.();
      }

      abort() {
        this.abortCalls += 1;
        const activeInstance = SharedPipelineSpeechRecognition.activeInstance;
        if (activeInstance && activeInstance !== this) {
          activeInstance.blockedByStaleAbort = true;
        }
        if (activeInstance === this) SharedPipelineSpeechRecognition.activeInstance = null;
      }

      emitResult(transcript, options) {
        if (this.blockedByStaleAbort) return;
        super.emitResult(transcript, options);
      }

      emitEnd() {
        if (SharedPipelineSpeechRecognition.activeInstance === this) {
          SharedPipelineSpeechRecognition.activeInstance = null;
        }
        super.emitEnd();
      }
    }

    globalThis.window.SpeechRecognition = SharedPipelineSpeechRecognition;
    const transcripts = [];
    const sessions = [];

    for (let sessionIndex = 0; sessionIndex < 3; sessionIndex += 1) {
      const contextKey = `reading:bm:${sessionIndex}`;
      const session = createCommunicationSpeechSession({
        activity: 'reading',
        selectedSet: { id: 'bm', speechLang: 'ms-MY' },
        contextKey,
        getCurrentContextKey: () => contextKey,
        resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
        onTranscript: transcript => transcripts.push(transcript)
      });
      sessions.push(session);
      session.start();

      if (sessionIndex > 0) vi.advanceTimersByTime(150);
      session.recognition.emitResult(`jawapan ${sessionIndex + 1}`);
      session.recognition.emitEnd();
      session.cancel();
    }

    vi.runOnlyPendingTimers();
    expect(SharedPipelineSpeechRecognition.instances).toHaveLength(3);
    expect(transcripts).toEqual(['jawapan 1', 'jawapan 2', 'jawapan 3']);
    expect(sessions.every(session => session.recognition === null)).toBe(true);
  });

  it('cancels a changed context and ignores its stale transcript and completion callbacks', () => {
    let currentContext = 'speaking:english:intro';
    let callbacks = null;
    let cancelCalls = 0;
    const transcripts = [];
    const candidates = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: currentContext,
      getCurrentContextKey: () => currentContext,
      sessionFactory(options) {
        callbacks = options;
        return {
          supported: true,
          start: () => ({ status: 'listening' }),
          cancel: () => { cancelCalls += 1; }
        };
      },
      onTranscript: transcript => transcripts.push(transcript),
      onCandidate: candidate => candidates.push(candidate)
    });
    session.start();
    currentContext = 'speaking:arab:intro';
    session.cancel();
    callbacks.onTranscript('stale English');
    callbacks.onComplete({ transcript: 'stale English' });
    expect(cancelCalls).toBe(1);
    expect(transcripts).toEqual([]);
    expect(candidates).toEqual([]);
  });

  it('starts a fresh retry and prevents old results from overwriting it', () => {
    const runs = [];
    const createFakeSession = options => {
      const run = { options, cancelled: false };
      runs.push(run);
      return {
        supported: true,
        start: () => ({ status: 'listening' }),
        cancel: () => { run.cancelled = true; }
      };
    };
    const accepted = [];
    const first = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'retry-context',
      getCurrentContextKey: () => 'retry-context',
      sessionFactory: createFakeSession,
      onCandidate: review => accepted.push(review.candidate.text)
    });
    first.start();
    first.cancel();
    const second = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'retry-context',
      getCurrentContextKey: () => 'retry-context',
      sessionFactory: createFakeSession,
      onCandidate: review => accepted.push(review.candidate.text)
    });
    second.start();
    runs[0].options.onComplete({ transcript: 'old result' });
    runs[1].options.onComplete({ transcript: 'fresh result' });
    expect(runs[0].cancelled).toBe(true);
    expect(accepted).toEqual(['fresh result']);
  });
});

describe('mobile speech startup recovery', () => {
  function installSequencedRecognition(startBehaviors = []) {
    class SequencedSpeechRecognition extends FakeSpeechRecognition {
      static instances = [];
      static startBehaviors = [...startBehaviors];

      constructor() {
        super();
        SequencedSpeechRecognition.instances.push(this);
      }

      start() {
        this.startCalls += 1;
        const behavior = SequencedSpeechRecognition.startBehaviors.shift() || 'started';
        if (behavior === 'started') this.onstart?.();
      }
    }

    globalThis.window.SpeechRecognition = SequencedSpeechRecognition;
    return SequencedSpeechRecognition;
  }

  const speechOptions = {
    startTimeoutMs: 40,
    startRetryDelayMs: 20,
    hardTimeoutMs: 1000
  };

  function installAndroidNavigator() {
    globalThis.window.location = { search: '?speechDiag=1&speechMode=single-final' };
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
      maxTouchPoints: 5
    });
  }

  it('accepts a normal Android startup without retrying or aborting', () => {
    vi.useFakeTimers();
    installAndroidNavigator();
    const Recognition = installSequencedRecognition(['started']);
    const accepted = [];
    const session = createReadingSpeechSession({
      ...speechOptions,
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onComplete: result => accepted.push(result.transcript)
    });

    session.start();
    const active = session.recognition;
    active.emitResult('jawapan android');
    active.emitEnd();
    vi.runOnlyPendingTimers();

    expect(Recognition.instances).toHaveLength(1);
    expect(active.abortCalls).toBe(0);
    expect(accepted).toEqual(['jawapan android']);
  });

  it('recovers Android Bacaan Q1 success then Q2 silent startup with one fresh instance', () => {
    vi.useFakeTimers();
    installAndroidNavigator();
    const Recognition = installSequencedRecognition(['started', 'silent', 'started']);
    const accepted = [];
    const options = {
      ...speechOptions,
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onComplete: result => accepted.push(result.transcript)
    };

    const q1 = createReadingSpeechSession(options);
    q1.start();
    q1.recognition.emitResult('jawapan 1');
    q1.recognition.emitEnd();

    const q2 = createReadingSpeechSession(options);
    q2.start();
    const stalledQ2 = q2.recognition;
    vi.advanceTimersByTime(speechOptions.startTimeoutMs);
    expect(stalledQ2.abortCalls).toBe(1);
    vi.advanceTimersByTime(speechOptions.startRetryDelayMs);

    const recoveredQ2 = q2.recognition;
    expect(recoveredQ2).not.toBe(stalledQ2);
    recoveredQ2.emitResult('jawapan 2');
    recoveredQ2.emitEnd();

    expect(Recognition.instances).toHaveLength(3);
    expect(accepted).toEqual(['jawapan 1', 'jawapan 2']);
    expect(recoveredQ2.abortCalls).toBe(0);
  });

  it('ends two silent Android startups with start-timeout and manual fallback', () => {
    vi.useFakeTimers();
    installAndroidNavigator();
    const Recognition = installSequencedRecognition(['silent', 'silent']);
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'android:reading:0',
      getCurrentContextKey: () => 'android:reading:0',
      speechOptions,
      onFailure: result => failures.push(result)
    });

    session.start();
    vi.advanceTimersByTime(speechOptions.startTimeoutMs);
    vi.advanceTimersByTime(speechOptions.startRetryDelayMs);
    vi.advanceTimersByTime(speechOptions.startTimeoutMs);

    expect(Recognition.instances).toHaveLength(2);
    expect(Recognition.instances.map(instance => instance.abortCalls)).toEqual([1, 1]);
    expect(session.recognition).toBeNull();
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      errorCode: 'start-timeout',
      manualFallbackAvailable: true
    });

    vi.runOnlyPendingTimers();
    expect(Recognition.instances).toHaveLength(2);
  });

  it('does not retry Android permission-denied errors after startup begins', () => {
    vi.useFakeTimers();
    installAndroidNavigator();
    const Recognition = installSequencedRecognition(['started']);
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'android:permission',
      getCurrentContextKey: () => 'android:permission',
      speechOptions,
      onFailure: result => failures.push(result)
    });

    session.start();
    session.recognition.emitError('not-allowed');
    vi.runOnlyPendingTimers();

    expect(Recognition.instances).toHaveLength(1);
    expect(Recognition.instances[0].abortCalls).toBe(0);
    expect(failures).toHaveLength(1);
    expect(failures[0].errorCode).toBe('not-allowed');
  });

  it('fails a silent startup without leaving the recognition instance stuck', () => {
    vi.useFakeTimers();
    const Recognition = installSequencedRecognition(['silent']);
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'reading:bm:0',
      getCurrentContextKey: () => 'reading:bm:0',
      speechOptions: { ...speechOptions, startRetryLimit: 0 },
      onFailure: result => failures.push(result)
    });

    session.start();
    const stalled = session.recognition;
    expect(stalled.startCalls).toBe(1);

    vi.advanceTimersByTime(speechOptions.startTimeoutMs);

    expect(stalled.abortCalls).toBe(1);
    expect(session.recognition).toBeNull();
    expect(session.getState()?.status).toBe('empty');
    expect(failures).toHaveLength(1);
    expect(failures[0].errorCode).toBe('start-timeout');
    expect(failures[0].manualFallbackAvailable).toBe(true);

    vi.runOnlyPendingTimers();
    expect(Recognition.instances).toHaveLength(1);
    expect(stalled.abortCalls).toBe(1);
    expect(failures).toHaveLength(1);
  });

  it('recovers Bacaan Q1 success then Q2 silent startup with one fresh instance', () => {
    vi.useFakeTimers();
    const Recognition = installSequencedRecognition(['started', 'silent', 'started']);
    const accepted = [];

    const q1 = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'reading:bm:0',
      getCurrentContextKey: () => 'reading:bm:0',
      speechOptions: { ...speechOptions, startRetryLimit: 1 },
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onResult: result => accepted.push(result.transcript)
    });
    q1.start();
    q1.recognition.emitResult('jawapan 1');
    q1.recognition.emitEnd();

    const q2 = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'reading:bm:1',
      getCurrentContextKey: () => 'reading:bm:1',
      speechOptions: { ...speechOptions, startRetryLimit: 1 },
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onResult: result => accepted.push(result.transcript)
    });
    q2.start();
    const stalledQ2 = q2.recognition;

    vi.advanceTimersByTime(speechOptions.startTimeoutMs);
    expect(stalledQ2.abortCalls).toBe(1);
    vi.advanceTimersByTime(speechOptions.startRetryDelayMs);

    const recoveredQ2 = q2.recognition;
    expect(recoveredQ2).not.toBe(stalledQ2);
    recoveredQ2.emitResult('jawapan 2');
    recoveredQ2.emitEnd();

    expect(Recognition.instances).toHaveLength(3);
    expect(accepted).toEqual(['jawapan 1', 'jawapan 2']);
    expect(recoveredQ2.abortCalls).toBe(0);
    expect(q2.recognition).toBeNull();
  });

  it('recovers Bertutur from one silent startup before offering the transcript candidate', () => {
    vi.useFakeTimers();
    const Recognition = installSequencedRecognition(['silent', 'started']);
    const candidates = [];
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'speaking:english:intro:1',
      getCurrentContextKey: () => 'speaking:english:intro:1',
      speechOptions: { ...speechOptions, startRetryLimit: 1 },
      resultFactory: transcript => ({ status: 'captured', transcript }),
      onCandidate: review => candidates.push(review.candidate.text),
      onFailure: result => failures.push(result)
    });

    session.start();
    const stalled = session.recognition;
    vi.advanceTimersByTime(speechOptions.startTimeoutMs);
    vi.advanceTimersByTime(speechOptions.startRetryDelayMs);

    const recovered = session.recognition;
    recovered.emitResult('I read a book');
    recovered.emitEnd();

    expect(Recognition.instances).toHaveLength(2);
    expect(stalled.abortCalls).toBe(1);
    expect(recovered.abortCalls).toBe(0);
    expect(candidates).toEqual(['I read a book']);
    expect(failures).toEqual([]);
  });

  it('stops after one Bertutur restart and exposes manual fallback when both startups stall', () => {
    vi.useFakeTimers();
    const Recognition = installSequencedRecognition(['silent', 'silent']);
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'speaking:english:intro:2',
      getCurrentContextKey: () => 'speaking:english:intro:2',
      speechOptions: { ...speechOptions, startRetryLimit: 1 },
      onFailure: result => failures.push(result)
    });

    session.start();
    vi.advanceTimersByTime(speechOptions.startTimeoutMs);
    vi.advanceTimersByTime(speechOptions.startRetryDelayMs);
    vi.advanceTimersByTime(speechOptions.startTimeoutMs);

    expect(Recognition.instances).toHaveLength(2);
    expect(Recognition.instances.map(instance => instance.abortCalls)).toEqual([1, 1]);
    expect(session.recognition).toBeNull();
    expect(failures).toHaveLength(1);
    expect(failures[0].errorCode).toBe('start-timeout');
    expect(failures[0].manualFallbackAvailable).toBe(true);

    vi.runOnlyPendingTimers();
    expect(Recognition.instances).toHaveLength(2);
    expect(failures).toHaveLength(1);
  });
});

describe('mobile speech post-start recovery', () => {
  const mobileDevices = [[
    'Android',
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
    5
  ]];
  const postStartOptions = {
    startTimeoutMs: 40,
    startRetryDelayMs: 20,
    postStartRetryDelayMs: 20,
    hardTimeoutMs: 60,
    silenceDelayMs: 30
  };

  function installMobileNavigator(userAgent, maxTouchPoints) {
    globalThis.window.location = { search: '?speechDiag=1&speechMode=single-final' };
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
  }

  function createReadingCommunicationSession({ contextKey, accepted, failures = [], states = [] }) {
    return createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey,
      getCurrentContextKey: () => contextKey,
      speechOptions: postStartOptions,
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onChange: state => states.push({ ...state }),
      onResult: result => accepted.push(result.transcript),
      onFailure: result => failures.push(result)
    });
  }

  it.each(mobileDevices)('recovers %s Bacaan Q2 after onstart/listening produces no transcript',
    (_device, userAgent, maxTouchPoints) => {
      vi.useFakeTimers();
      installMobileNavigator(userAgent, maxTouchPoints);
      const accepted = [];

      const q1 = createReadingCommunicationSession({
        contextKey: 'reading:bm:0',
        accepted
      });
      q1.start();
      q1.recognition.emitResult('jawapan 1');
      q1.recognition.emitEnd();

      const states = [];
      const q2 = createReadingCommunicationSession({
        contextKey: 'reading:bm:1',
        accepted,
        states
      });
      q2.start();
      const stalledQ2 = q2.recognition;
      expect(q2.getState()?.status).toBe('listening');

      vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);
      expect(stalledQ2.abortCalls).toBe(1);
      expect(states.some(state => state.recoveryReason === 'post-start-timeout')).toBe(true);
      vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

      const recoveredQ2 = q2.recognition;
      expect(recoveredQ2).not.toBe(stalledQ2);
      recoveredQ2.emitResult('jawapan 2');
      recoveredQ2.emitEnd();

      expect(FakeSpeechRecognition.instances).toHaveLength(3);
      expect(accepted).toEqual(['jawapan 1', 'jawapan 2']);
      expect(stalledQ2.abortCalls).toBe(1);
      expect(recoveredQ2.abortCalls).toBe(0);
      expect(q2.recognition).toBeNull();
    });

  it.each(mobileDevices)('bounds %s Bacaan post-start recovery to two recognition instances',
    (_device, userAgent, maxTouchPoints) => {
      vi.useFakeTimers();
      installMobileNavigator(userAgent, maxTouchPoints);
      const failures = [];
      const session = createReadingCommunicationSession({
        contextKey: 'reading:bm:double-stall',
        accepted: [],
        failures
      });

      session.start();
      const first = session.recognition;
      expect(session.getState()?.status).toBe('listening');
      vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);
      vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

      const second = session.recognition;
      expect(second).not.toBe(first);
      expect(session.getState()?.status).toBe('listening');
      vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);

      expect(FakeSpeechRecognition.instances).toHaveLength(2);
      expect(FakeSpeechRecognition.instances.map(instance => instance.abortCalls)).toEqual([1, 1]);
      expect(session.recognition).toBeNull();
      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatchObject({
        errorCode: 'no-result',
        manualFallbackAvailable: true
      });

      vi.runOnlyPendingTimers();
      expect(FakeSpeechRecognition.instances).toHaveLength(2);
      expect(failures).toHaveLength(1);
    });

  it('recovers Bertutur after listening stalls before offering the transcript candidate', () => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);
    const candidates = [];
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'speaking:english:intro:post-start',
      getCurrentContextKey: () => 'speaking:english:intro:post-start',
      speechOptions: postStartOptions,
      resultFactory: transcript => ({ status: 'captured', transcript, confidence: 0.8 }),
      onCandidate: review => candidates.push(review.candidate.text),
      onFailure: result => failures.push(result)
    });

    session.start();
    const stalled = session.recognition;
    expect(session.getState()?.status).toBe('listening');
    vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);
    vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

    const recovered = session.recognition;
    recovered.emitResult('I read a book');
    recovered.emitEnd();

    expect(FakeSpeechRecognition.instances).toHaveLength(2);
    expect(stalled.abortCalls).toBe(1);
    expect(recovered.abortCalls).toBe(0);
    expect(candidates).toEqual(['I read a book']);
    expect(failures).toEqual([]);
  });

  it('ends Bertutur with manual fallback after the single post-start retry also stalls', () => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);
    const candidates = [];
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'speaking:english:intro:double-post-start',
      getCurrentContextKey: () => 'speaking:english:intro:double-post-start',
      speechOptions: postStartOptions,
      resultFactory: transcript => ({ status: 'captured', transcript }),
      onCandidate: review => candidates.push(review.candidate.text),
      onFailure: result => failures.push(result)
    });

    session.start();
    vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);
    vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);
    vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);

    expect(FakeSpeechRecognition.instances).toHaveLength(2);
    expect(FakeSpeechRecognition.instances.map(instance => instance.abortCalls)).toEqual([1, 1]);
    expect(candidates).toEqual([]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      errorCode: 'no-result',
      manualFallbackAvailable: true
    });
  });

  it('keeps desktop post-start no-result behavior terminal without an automatic retry', () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
      maxTouchPoints: 0
    });
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'desktop:reading:0',
      getCurrentContextKey: () => 'desktop:reading:0',
      speechOptions: postStartOptions,
      onFailure: result => failures.push(result)
    });

    session.start();
    const stalled = session.recognition;
    expect(session.getState()?.status).toBe('listening');
    vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);
    vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    expect(stalled.abortCalls).toBe(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].errorCode).toBe('no-result');
  });

  it.each([
    'not-allowed',
    'service-not-allowed',
    'audio-capture',
    'network',
    'language-not-supported',
    'bad-grammar'
  ])('does not retry the explicit mobile error %s', errorCode => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'android:explicit-error',
      getCurrentContextKey: () => 'android:explicit-error',
      speechOptions: postStartOptions,
      onFailure: result => failures.push(result)
    });

    session.start();
    session.recognition.emitError(errorCode);
    vi.runOnlyPendingTimers();

    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].errorCode).toBe(errorCode);
  });

  it('does not retry after an explicit user cancel', () => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);
    const failures = [];
    const session = createReadingCommunicationSession({
      contextKey: 'android:cancelled',
      accepted: [],
      failures
    });

    session.start();
    const cancelled = session.recognition;
    session.cancel();
    vi.runOnlyPendingTimers();

    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    expect(cancelled.abortCalls).toBe(1);
    expect(session.recognition).toBeNull();
    expect(failures).toEqual([]);
  });

  it('does not retry a mobile post-start stall after its context becomes stale', () => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);
    let currentContext = 'speaking:english:intro:4';
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: currentContext,
      getCurrentContextKey: () => currentContext,
      speechOptions: postStartOptions,
      onFailure: result => failures.push(result)
    });

    session.start();
    const stale = session.recognition;
    currentContext = 'speaking:english:intro:5';
    vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);
    vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

    expect(FakeSpeechRecognition.instances).toHaveLength(1);
    expect(stale.abortCalls).toBe(1);
    expect(session.recognition).toBeNull();
    expect(failures).toEqual([]);
  });
  it('recovers a mobile no-speech error only after the lifecycle has started', () => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);
    const accepted = [];
    const failures = [];
    const session = createReadingCommunicationSession({
      contextKey: 'android:no-speech-after-start',
      accepted,
      failures
    });

    session.start();
    const stalled = session.recognition;
    stalled.emitError('no-speech');
    expect(stalled.abortCalls).toBe(1);
    vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

    const recovered = session.recognition;
    expect(recovered).not.toBe(stalled);
    recovered.emitResult('jawapan selepas retry');
    recovered.emitEnd();

    expect(FakeSpeechRecognition.instances).toHaveLength(2);
    expect(accepted).toEqual(['jawapan selepas retry']);
    expect(failures).toEqual([]);
  });

  it('recovers when mobile recognition ends after onstart with no transcript', () => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);
    const accepted = [];
    const failures = [];
    const session = createReadingCommunicationSession({
      contextKey: 'ios:end-after-start',
      accepted,
      failures
    });

    session.start();
    const ended = session.recognition;
    ended.emitEnd();
    vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

    const recovered = session.recognition;
    expect(recovered).not.toBe(ended);
    recovered.emitResult('jawapan selepas end');
    recovered.emitEnd();

    expect(FakeSpeechRecognition.instances).toHaveLength(2);
    expect(ended.abortCalls).toBe(0);
    expect(accepted).toEqual(['jawapan selepas end']);
    expect(failures).toEqual([]);
  });

  it('shares one automatic recovery budget across startup and post-start stalls', () => {
    vi.useFakeTimers();
    installMobileNavigator(mobileDevices[0][1], mobileDevices[0][2]);

    class StartupThenListeningRecognition extends FakeSpeechRecognition {
      static instances = [];

      constructor() {
        super();
        StartupThenListeningRecognition.instances.push(this);
      }

      start() {
        this.startCalls += 1;
        if (StartupThenListeningRecognition.instances.length > 1) this.onstart?.();
      }
    }

    globalThis.window.SpeechRecognition = StartupThenListeningRecognition;
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id: 'bm', speechLang: 'ms-MY' },
      contextKey: 'android:shared-recovery-budget',
      getCurrentContextKey: () => 'android:shared-recovery-budget',
      speechOptions: postStartOptions,
      onFailure: result => failures.push(result)
    });

    session.start();
    vi.advanceTimersByTime(postStartOptions.startTimeoutMs);
    vi.advanceTimersByTime(postStartOptions.startRetryDelayMs);
    expect(session.getState()?.status).toBe('listening');
    vi.advanceTimersByTime(postStartOptions.hardTimeoutMs);
    vi.advanceTimersByTime(postStartOptions.postStartRetryDelayMs);

    expect(StartupThenListeningRecognition.instances).toHaveLength(2);
    expect(StartupThenListeningRecognition.instances.map(instance => instance.abortCalls)).toEqual([1, 1]);
    expect(session.recognition).toBeNull();
    expect(failures).toHaveLength(1);
    expect(failures[0].errorCode).toBe('no-result');
  });
});

describe('Mendengar TTS locale and failure integrity', () => {
  it.each([
    ['BM', 'ms-MY'],
    ['Bahasa Inggeris', 'en-US'],
    ['Bahasa Arab', 'ar-SA']
  ])('passes %s item locale %s to TTS', async (languageLabel, speechLang) => {
    const calls = [];
    const result = await playCommunicationAudio({
      item: { prompt: 'Prompt', speechLang },
      languageLabel,
      speak: async (text, options) => {
        calls.push({ text, options });
        return { success: true };
      }
    });
    expect(result.success).toBe(true);
    expect(calls).toEqual([{ text: 'Prompt', options: { language: speechLang } }]);
  });

  it('returns an actionable TTS failure without mutating assessed history', async () => {
    const history = [80];
    const result = await playCommunicationAudio({
      item: { prompt: 'Hello', speechLang: 'en-US' },
      languageLabel: 'Bahasa Inggeris',
      speak: async () => ({ success: false })
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain('voice pack Bahasa Inggeris');
    expect(history).toEqual([80]);
  });

  it('contains provider exceptions and returns visible audio guidance', async () => {
    const result = await playCommunicationAudio({
      item: { prompt: 'مرحبا', speechLang: 'ar-SA' },
      languageLabel: 'Bahasa Arab',
      speak: async () => { throw new Error('provider failed'); }
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain('Audio tidak dapat dimainkan');
  });
});
