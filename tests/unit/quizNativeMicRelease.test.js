import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSpeechSession, cancelActiveSpeechRecognition } from '../../src/ai/speech/speechEngine.js';

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';

class MockNativeRecognizer {
  static instances = [];

  constructor() {
    this.abortCalls = 0;
    this.stopCalls = 0;
    this.startCalls = 0;
    this.nativeCaptureActive = false;
    MockNativeRecognizer.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.nativeCaptureActive = true;
    this.onstart?.();
    this.onaudiostart?.();
  }

  stop() {
    this.stopCalls += 1;
    this.nativeCaptureActive = false;
  }

  abort() {
    this.abortCalls += 1;
    this.nativeCaptureActive = false;
  }

  emitResult(transcript = 'guru') {
    const result = [{ transcript, confidence: 0.95 }];
    result.isFinal = true;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }

  emitEnd() {
    this.nativeCaptureActive = false;
    this.onend?.();
  }
}

function install(userAgent) {
  MockNativeRecognizer.instances = [];
  vi.stubGlobal('window', {
    SpeechRecognition: MockNativeRecognizer,
    webkitSpeechRecognition: null,
    location: { search: '', href: 'https://example.test/quiz' },
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener: () => {},
    matchMedia: () => ({ matches: false })
  });
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints: 5 });
}

afterEach(() => {
  cancelActiveSpeechRecognition('test-cleanup');
  vi.unstubAllGlobals();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('P1.17-V03 native quiz mic termination', () => {
  it.each([['iOS Safari', IOS], ['Android Chrome', ANDROID]])(
    '%s releases Q1 native capture after successful transcript before Q2 is started',
    (_label, userAgent) => {
      install(userAgent);
      const accepted = [];
      const q1 = createSpeechSession({
        activity: 'quiz',
        questionIndex: 0,
        contextKey: 'quiz:bm:Q1',
        expectedAnswer: 'guru',
        abortOnTranscriptComplete: true,
        onResult: result => accepted.push(result.transcript)
      });
      expect(MockNativeRecognizer.instances).toHaveLength(0);
      q1.start();
      const nativeQ1 = q1.recognition;
      expect(nativeQ1.nativeCaptureActive).toBe(true);
      const staleResult = nativeQ1.onresult;
      const staleEnd = nativeQ1.onend;
      nativeQ1.emitResult('guru');

      expect(accepted).toEqual(['guru']);
      expect(nativeQ1.abortCalls).toBe(1);
      expect(nativeQ1.nativeCaptureActive).toBe(false);
      expect(q1.recognition).toBe(null);
      expect(q1.getState().transcript).toBe('guru');

      const q2 = createSpeechSession({
        activity: 'quiz',
        questionIndex: 1,
        contextKey: 'quiz:bm:Q2',
        expectedAnswer: 'kucing',
        abortOnTranscriptComplete: true,
        onResult: result => accepted.push(result.transcript)
      });
      expect(MockNativeRecognizer.instances).toHaveLength(1);
      q2.start();
      const nativeQ2 = q2.recognition;
      expect(nativeQ2).not.toBe(nativeQ1);
      expect(nativeQ2.nativeCaptureActive).toBe(true);
      staleResult?.({ resultIndex: 0, results: [[{ transcript: 'lama' }]] });
      staleEnd?.();
      expect(accepted).toEqual(['guru']);
      expect(q2.recognition).toBe(nativeQ2);
      nativeQ2.emitResult('kucing');
      expect(accepted).toEqual(['guru', 'kucing']);
      expect(nativeQ2.abortCalls).toBe(1);
      expect(nativeQ1.abortCalls).toBe(1);
    }
  );

  it('preserves default communication/diagnostic successful-finalize semantics', () => {
    install(IOS);
    const session = createSpeechSession({
      activity: 'reading',
      contextKey: 'reading:bm:0',
      expectedAnswer: 'guru'
    });
    session.start();
    const native = session.recognition;
    native.emitResult('guru');
    expect(native.abortCalls).toBe(0);
    expect(session.getState().transcript).toBe('guru');
    native.emitEnd();
  });

  it('does not abort native capture again when onend already acknowledged', () => {
    install(ANDROID);
    const session = createSpeechSession({
      activity: 'quiz',
      contextKey: 'quiz:bm:Q3',
      abortOnTranscriptComplete: true,
      expectedAnswer: 'guru'
    });
    session.start();
    const native = session.recognition;
    native.emitEnd();
    expect(native.abortCalls).toBe(0);
    expect(session.recognition).toBe(null);
  });

  it('aborts an unfinished quiz when context changes and prevents late transcript', () => {
    install(IOS);
    const accepted = [];
    const session = createSpeechSession({
      activity: 'quiz',
      contextKey: 'quiz:bm:Q1',
      abortOnTranscriptComplete: true,
      onResult: result => accepted.push(result?.transcript || '')
    });
    session.start();
    const native = session.recognition;
    const lateResult = native.onresult;
    session.cancel('context-changed');
    expect(native.abortCalls).toBe(1);
    expect(native.nativeCaptureActive).toBe(false);
    lateResult?.({ resultIndex: 0, results: [[{ transcript: 'stale' }]] });
    expect(accepted).toEqual([]);
  });

  it.each(['no-speech', 'not-allowed', 'audio-capture', 'network'])(
    'closes native mic on terminal quiz error %s without waiting for onend',
    errorCode => {
      install(IOS);
      const session = createSpeechSession({
        activity: 'quiz',
        contextKey: 'quiz:bm:error',
        abortOnTranscriptComplete: true
      });
      session.start();
      const native = session.recognition;
      expect(native.nativeCaptureActive).toBe(true);
      native.onerror?.({ error: errorCode });
      expect(native.abortCalls).toBe(1);
      expect(native.nativeCaptureActive).toBe(false);
      expect(session.recognition).toBe(null);
    }
  );

  it('wires native termination and question context guards only on public quiz Web Speech', () => {
    const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const quiz = app.split('function Quiz({')[1].split('function UasaSimulator(')[0];
    expect(quiz).toContain('abortOnTranscriptComplete: true');
    expect(quiz).toContain("activity: 'quiz'");
    expect(quiz).toContain('contextKey,');
    expect(quiz).toContain('canRecover: isCurrent');
    expect(quiz).toContain("speechSessionRef.current?.cancel?.('context-changed')");
    expect(quiz).toContain('generation === speechStartGenerationRef.current');
    expect(quiz).toContain('activeSpeechContextRef.current === contextKey');
    expect(quiz).toContain('if (!isCurrent()) return;');
  });
});
