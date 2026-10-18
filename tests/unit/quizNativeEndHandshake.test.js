import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cancelActiveSpeechRecognition, createSpeechSession } from '../../src/ai/speech/speechEngine.js';

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';

class DelayedNativeEndRecognizer {
  static currentOwner = null;
  static releaseDelay = 500;
  static instances = [];
  static noNativeEnd = false;

  static reset({ releaseDelay = 500, noNativeEnd = false } = {}) {
    this.currentOwner = null;
    this.releaseDelay = releaseDelay;
    this.instances = [];
    this.noNativeEnd = noNativeEnd;
  }

  constructor() {
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    this.hasCapture = false;
    this.stalled = false;
    DelayedNativeEndRecognizer.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.onstart?.();
    if (DelayedNativeEndRecognizer.currentOwner) {
      this.stalled = true;
      return;
    }
    DelayedNativeEndRecognizer.currentOwner = this;
    this.hasCapture = true;
    this.onaudiostart?.();
  }

  stop() {
    this.stopCalls += 1;
    if (DelayedNativeEndRecognizer.noNativeEnd) return;
    globalThis.setTimeout(() => {
      if (DelayedNativeEndRecognizer.currentOwner !== this) return;
      DelayedNativeEndRecognizer.currentOwner = null;
      this.hasCapture = false;
      this.onaudioend?.();
      this.onend?.();
    }, DelayedNativeEndRecognizer.releaseDelay);
  }

  abort() {
    this.abortCalls += 1;
    if (DelayedNativeEndRecognizer.currentOwner === this) {
      DelayedNativeEndRecognizer.currentOwner = null;
      this.hasCapture = false;
    }
  }

  emitResult(transcript) {
    if (!this.hasCapture) return;
    const result = [{ transcript, confidence: 0.95 }];
    result.isFinal = true;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }
}

function environment(userAgent, opts) {
  DelayedNativeEndRecognizer.reset(opts);
  vi.stubGlobal('window', {
    SpeechRecognition: DelayedNativeEndRecognizer,
    webkitSpeechRecognition: null,
    location: { search: '', href: 'https://example.test/quiz' },
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener() {},
    matchMedia: () => ({ matches: false })
  });
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints: 5 });
}

function quizSession(contextKey, events = []) {
  return createSpeechSession({
    activity: 'quiz',
    contextKey,
    expectedAnswer: 'guru',
    abortOnTranscriptComplete: true,
    awaitNativeEndOnTranscript: true,
    nativeEndWaitTimeoutMs: 4000,
    onResult: result => events.push(result)
  });
}

afterEach(() => {
  try { cancelActiveSpeechRecognition('test-cleanup'); } catch { /* best effort */ }
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('P1.17-V04 native end handshake on quiz', () => {
  it.each([['iPhone Safari', IOS], ['Android Chrome', ANDROID]])(
    '%s keeps Q1 processing until native onend, then Q2 starts with capture on first tap',
    (_device, userAgent) => {
      vi.useFakeTimers();
      environment(userAgent);
      const q1Accepted = [];
      const q1 = quizSession('quiz:bm:Q1', q1Accepted);
      q1.start();
      const first = q1.recognition;
      first.emitResult('guru');

      expect(first.stopCalls).toBe(1);
      expect(first.abortCalls).toBe(0);
      expect(first.hasCapture).toBe(true);
      expect(q1.getState().status).toBe('processing');
      expect(q1Accepted).toEqual([]);

      vi.advanceTimersByTime(499);
      expect(q1Accepted).toEqual([]);
      expect(q1.getState().status).toBe('processing');
      vi.advanceTimersByTime(1);

      expect(first.hasCapture).toBe(false);
      expect(first.abortCalls).toBe(0);
      expect(q1.getState().status).toBe('completed');
      expect(q1Accepted).toHaveLength(1);
      expect(q1Accepted[0].transcript).toBe('guru');

      const q2Accepted = [];
      const q2 = quizSession('quiz:bm:Q2', q2Accepted);
      expect(DelayedNativeEndRecognizer.instances).toHaveLength(1);
      q2.start();
      const second = q2.recognition;
      expect(second.stalled).toBe(false);
      expect(second.hasCapture).toBe(true);
      second.emitResult('guru');
      vi.advanceTimersByTime(500);
      expect(q2Accepted).toHaveLength(1);
      expect(q2.getState().status).toBe('completed');
      expect(DelayedNativeEndRecognizer.currentOwner).toBe(null);
    }
  );

  it('provides a bounded explicit fallback if Safari never emits native onend', () => {
    vi.useFakeTimers();
    environment(IOS, { noNativeEnd: true });
    const events = [];
    const q1 = quizSession('quiz:bm:no-end', events);
    q1.start();
    const first = q1.recognition;
    first.emitResult('guru');
    vi.advanceTimersByTime(3999);
    expect(q1.getState().status).toBe('processing');
    expect(events).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(first.abortCalls).toBe(1);
    expect(first.hasCapture).toBe(false);
    expect(q1.getState()).toMatchObject({ status: 'empty', error: 'native-end-timeout' });
    expect(events).toHaveLength(1);
    expect(events[0].transcript).toBe('');
  });

  it('cancels the pending native handshake on context change without stale Q1 transcript', () => {
    vi.useFakeTimers();
    environment(IOS);
    const events = [];
    const q1 = quizSession('quiz:bm:old', events);
    q1.start();
    const first = q1.recognition;
    first.emitResult('guru');
    q1.cancel('context-changed');
    expect(first.abortCalls).toBe(1);
    vi.advanceTimersByTime(5000);
    expect(events).toEqual([]);
    expect(q1.getState().status).toBe('idle');
  });

  it('keeps legacy desktop and communication speech completion immediate by default', () => {
    vi.useFakeTimers();
    environment(ANDROID);
    const results = [];
    const communication = createSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:Q1',
      expectedAnswer: 'guru',
      onResult: result => results.push(result)
    });
    communication.start();
    const native = communication.recognition;
    native.emitResult('guru');
    expect(results).toHaveLength(1);
    expect(communication.getState().status).toBe('completed');
    expect(native.stopCalls).toBe(0);
    expect(native.abortCalls).toBe(0);
  });

  it('preserves the native onend engine behavior while the Quiz explicitly switches to manual Selesai', () => {
    const src = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const quiz = src.split('function Quiz({')[1].split('function UasaSimulator(')[0];
    expect(quiz).toContain('manualQuizStop: true');
    expect(quiz).toContain('awaitNativeEndOnTranscript: false');
    expect(quiz).toContain('abortOnTranscriptComplete: true');
    expect(quiz).toContain("['starting', 'stopping', 'processing'].includes(speechState)");
    expect(quiz).toContain('getCurrentContextKey: () => activeSpeechContextRef.current');
  });
});
