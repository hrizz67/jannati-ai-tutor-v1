import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cancelActiveSpeechRecognition, createSpeechSession } from '../../src/ai/speech/speechEngine.js';

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';

class ManualRecognizer {
  static instances = [];
  static currentOwner = null;
  static endDelay = 500;
  static noOnEnd = false;
  static reset({ noOnEnd = false, endDelay = 500 } = {}) {
    this.instances = [];
    this.currentOwner = null;
    this.noOnEnd = noOnEnd;
    this.endDelay = endDelay;
  }
  constructor() {
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    this.captureActive = false;
    this.stalled = false;
    ManualRecognizer.instances.push(this);
  }
  start() {
    this.startCalls++;
    this.onstart?.();
    if (ManualRecognizer.currentOwner) {
      this.stalled = true;
      return;
    }
    this.captureActive = true;
    ManualRecognizer.currentOwner = this;
    this.onaudiostart?.();
  }
  stop() {
    this.stopCalls++;
    if (ManualRecognizer.noOnEnd) return;
    setTimeout(() => this.emitEnd(), ManualRecognizer.endDelay);
  }
  abort() {
    this.abortCalls++;
    if (ManualRecognizer.currentOwner === this) ManualRecognizer.currentOwner = null;
    this.captureActive = false;
  }
  emitResult(value) {
    if (!this.captureActive) return;
    const result = [{ transcript: value, confidence: 0.95 }];
    result.isFinal = true;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }
  emitEnd() {
    if (ManualRecognizer.currentOwner === this) ManualRecognizer.currentOwner = null;
    this.captureActive = false;
    this.onaudioend?.();
    this.onend?.();
  }
}

function environment(userAgent, options) {
  vi.useFakeTimers();
  ManualRecognizer.reset(options);
  vi.stubGlobal('window', {
    SpeechRecognition: ManualRecognizer,
    webkitSpeechRecognition: null,
    location: { search: '', href: 'https://example.test/quiz' },
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener() {},
    matchMedia: () => ({ matches: false })
  });
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints: 5 });
}

function session(contextKey, accepted = []) {
  return createSpeechSession({
    expectedAnswer: 'guru',
    activity: 'quiz',
    contextKey,
    abortOnTranscriptComplete: true,
    manualQuizStop: true,
    awaitNativeEndOnTranscript: false,
    nativeEndWaitTimeoutMs: 4000,
    onResult(result) { accepted.push(result); }
  });
}

afterEach(() => {
  cancelActiveSpeechRecognition('test-cleanup');
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('P1.17-V05 explicit quiz microphone finish', () => {
  it.each([['iOS Safari', IOS], ['Android Chrome', ANDROID]])(
    '%s buffers Q1 speech until Selesai and starts Q2 capture on first tap after native end',
    (_name, userAgent) => {
      environment(userAgent);
      const firstResults = [];
      const q1 = session('quiz:bm:Q1', firstResults);
      q1.start();
      const native = q1.recognition;
      native.emitResult('guru');
      expect(q1.getState()).toMatchObject({ status: 'listening', transcript: 'guru' });
      expect(firstResults).toHaveLength(0);
      expect(native.stopCalls).toBe(0);
      expect(native.abortCalls).toBe(0);
      expect(native.captureActive).toBe(true);

      q1.stop('user-finished');
      expect(q1.getState().status).toBe('stopping');
      expect(native.stopCalls).toBe(1);
      q1.stop('user-finished'); // repeated tap must not stop twice
      expect(native.stopCalls).toBe(1);
      vi.advanceTimersByTime(499);
      expect(firstResults).toHaveLength(0);
      vi.advanceTimersByTime(1);
      expect(native.captureActive).toBe(false);
      expect(native.abortCalls).toBe(0);
      expect(firstResults).toHaveLength(1);
      expect(firstResults[0].transcript).toBe('guru');

      const nextResults = [];
      const q2 = session('quiz:bm:Q2', nextResults);
      expect(ManualRecognizer.instances).toHaveLength(1);
      q2.start();
      const nextNative = q2.recognition;
      expect(nextNative.stalled).toBe(false);
      expect(nextNative.captureActive).toBe(true);
      nextNative.emitResult('kucing');
      q2.stop('user-finished');
      vi.advanceTimersByTime(500);
      expect(nextResults).toHaveLength(1);
      expect(nextResults[0].transcript).toBe('kucing');
    }
  );

  it('accepts a delayed onresult emitted after manual Selesai but before native onend', () => {
    environment(IOS);
    const answers = [];
    const q = session('quiz:bm:late', answers);
    q.start();
    const native = q.recognition;
    q.stop('user-finished');
    expect(q.getState().status).toBe('stopping');
    vi.advanceTimersByTime(150);
    native.emitResult('kasut');
    expect(q.getState()).toMatchObject({ status: 'stopping', transcript: 'kasut' });
    expect(answers).toHaveLength(0);
    vi.advanceTimersByTime(350);
    expect(answers.map(x => x.transcript)).toEqual(['kasut']);
  });

  it('accepts a browser-triggered native onend without a Selesai tap', () => {
    environment(IOS);
    const answers = [];
    const q = session('quiz:bm:autoend', answers);
    q.start();
    const native = q.recognition;
    native.emitResult('guru');
    native.emitEnd();
    expect(answers.map(x => x.transcript)).toEqual(['guru']);
    expect(q.getState().status).toBe('completed');
    expect(native.abortCalls).toBe(0);
  });

  it('returns empty and releases the microphone if the user manually stops without speaking', () => {
    environment(ANDROID);
    const answers = [];
    const q = session('quiz:bm:empty', answers);
    q.start();
    const native = q.recognition;
    q.stop('user-finished');
    vi.advanceTimersByTime(500);
    expect(q.getState().status).toBe('empty');
    expect(answers).toHaveLength(1);
    expect(answers[0].transcript).toBe('');
    expect(native.captureActive).toBe(false);
  });

  it('offers retry/manual fallback when Safari never acknowledges manual stop', () => {
    environment(IOS, { noOnEnd: true });
    const answers = [];
    const q = session('quiz:bm:timeout', answers);
    q.start();
    const native = q.recognition;
    native.emitResult('guru');
    q.stop('user-finished');
    vi.advanceTimersByTime(3999);
    expect(q.getState().status).toBe('stopping');
    vi.advanceTimersByTime(1);
    expect(native.abortCalls).toBe(1);
    expect(native.captureActive).toBe(false);
    expect(q.getState()).toMatchObject({ status: 'empty', error: 'native-end-timeout' });
    expect(answers).toHaveLength(1);
  });

  it('cancels recording on question navigation and ignores stale events', () => {
    environment(IOS);
    const answers = [];
    const q = session('quiz:bm:Q1', answers);
    q.start();
    const native = q.recognition;
    const staleResult = native.onresult;
    q.cancel('context-changed');
    expect(native.abortCalls).toBe(1);
    staleResult?.({ resultIndex: 0, results: [[{ transcript: 'stale' }]] });
    expect(answers).toEqual([]);
    expect(native.captureActive).toBe(false);
  });

  it('keeps the old automatic Web Speech default for non-quiz activities', () => {
    environment(ANDROID);
    const accepted = [];
    const reading = createSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:Q1',
      onResult: r => accepted.push(r)
    });
    reading.start();
    reading.recognition.emitResult('guru');
    expect(accepted).toHaveLength(1);
    expect(reading.getState().status).toBe('completed');
  });

  it('wires manual Selesai in Quiz without activating the mobile STT pilot', () => {
    const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const quiz = app.split('function Quiz({')[1].split('function UasaSimulator(')[0];
    expect(quiz).toContain('manualQuizStop: true');
    expect(quiz).toContain('awaitNativeEndOnTranscript: false');
    expect(quiz).toContain("previous.stop('user-finished')");
    expect(quiz).toContain("listening: 'Selesai'");
    expect(quiz).toContain("['starting', 'stopping', 'processing'].includes(speechState)");
    expect(quiz).toContain("['starting', 'listening', 'stopping', 'processing'].includes(speechState)");
    expect(quiz).toContain("e.preventDefault(); if (!quizMobileSttPilot.requested && ['starting', 'listening', 'stopping', 'processing'].includes(speechState)) return;");
    expect(quiz).toContain('if (result?.transcript) onAnswerChange(result.transcript)');
    expect(quiz).toContain("speechSessionRef.current?.cancel?.('context-changed')");
  });
});
