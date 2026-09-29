import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommunicationSpeechSession } from '../../src/ai/speech/communicationSpeech.js';
import { cancelActiveSpeechRecognition } from '../../src/ai/speech/speechEngine.js';
import {
  clearSpeechDiagnosticTrace,
  getSpeechDiagnosticMode,
  getSpeechDiagnosticSnapshot
} from '../../src/ai/speech/speechDiagnostics.js';
import { createReadingSpeechSession } from '../../src/ai/speech/speechSession.js';
import { createMemorySessionStorage } from '../helpers/sharedNativeSpeechBackend.js';

const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';

class LegacySimpleRecognition {
  static instances = [];

  constructor() {
    this.lang = '';
    this.interimResults = true;
    this.continuous = true;
    this.maxAlternatives = 0;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    LegacySimpleRecognition.instances.push(this);
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

  emitEnd() {
    this.onend?.();
  }
}

function installEnvironment({
  diagnostics = true,
  mode = 'legacy-simple',
  userAgent = IOS_UA
} = {}) {
  LegacySimpleRecognition.instances = [];
  const params = new URLSearchParams();
  if (diagnostics) params.set('speechDiag', '1');
  if (mode) params.set('speechMode', mode);
  globalThis.window = {
    SpeechRecognition: LegacySimpleRecognition,
    webkitSpeechRecognition: null,
    location: { search: '?' + params.toString() },
    sessionStorage: createMemorySessionStorage(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout
  };
  vi.stubGlobal('navigator', {
    userAgent,
    maxTouchPoints: 5,
    serviceWorker: { controller: null }
  });
  clearSpeechDiagnosticTrace();
}

function createCommunicationSession(activity, index, accepted, failures = []) {
  const contextKey = activity + ':bm:' + index;
  return createCommunicationSpeechSession({
    activity,
    selectedSet: { id: 'bm', speechLang: 'ms-MY' },
    contextKey,
    getCurrentContextKey: () => contextKey,
    resultFactory: transcript => ({
      status: 'completed',
      transcript,
      confidence: 0.9,
      score: 100,
      correct: true
    }),
    onResult: result => accepted.push(result.transcript),
    onCandidate: review => accepted.push(review.candidate.text),
    onFailure: result => failures.push(result)
  });
}

afterEach(() => {
  try {
    cancelActiveSpeechRecognition('test-cleanup');
    clearSpeechDiagnosticTrace();
  } catch {
    // Best-effort cleanup for deliberately stale lifecycle callbacks.
  }
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe('legacy-simple diagnostic speech lifecycle', () => {
  it('keeps legacy-simple inert without the explicit diagnostic opt-in', () => {
    installEnvironment({ diagnostics: false });
    expect(getSpeechDiagnosticMode()).toBe('current');

    const session = createReadingSpeechSession({
      activity: 'reading',
      lang: 'ms-MY'
    });
    session.start();

    expect(session.recognition).toMatchObject({
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    });
    expect(getSpeechDiagnosticSnapshot().events).toEqual([]);
    session.cancel();
  });

  it.each(['reading', 'speaking'])(
    'uses one fresh legacy-simple Recognition instance for %s Q1 through Q3',
    activity => {
      installEnvironment();
      const accepted = [];
      const transcripts = ['jawapan satu', 'jawapan dua', 'jawapan tiga'];

      transcripts.forEach((transcript, index) => {
        const session = createCommunicationSession(activity, index, accepted);
        session.start();
        const recognition = session.recognition;

        expect(recognition).toBe(LegacySimpleRecognition.instances[index]);
        expect(recognition).toMatchObject({
          lang: 'ms-MY',
          continuous: false,
          interimResults: false,
          maxAlternatives: 1,
          startCalls: 1
        });

        recognition.emitResult(transcript);
        expect(session.recognition).toBeNull();
        recognition.emitEnd();
      });

      expect(LegacySimpleRecognition.instances).toHaveLength(3);
      expect(new Set(LegacySimpleRecognition.instances).size).toBe(3);
      expect(accepted).toEqual(transcripts);
      expect(LegacySimpleRecognition.instances.every(instance => instance.abortCalls === 0)).toBe(true);

      expect(getSpeechDiagnosticMode()).toBe('legacy-simple');
      const events = getSpeechDiagnosticSnapshot().events.filter(event => event.activity === activity);
      expect(events.filter(event => event.event === 'session-create')).toHaveLength(3);
      const starts = events.filter(event => event.event === 'start-call');
      expect(starts).toHaveLength(3);
      expect(starts.every(event => (
        event.speechMode === 'legacy-simple'
        && event.requestedContinuous === false
        && event.appliedContinuous === false
        && event.requestedInterim === false
        && event.appliedInterim === false
        && event.multiUtterance === false
      ))).toBe(true);
      expect(events.filter(event => event.event === 'onresult')).toHaveLength(3);
      expect(events.filter(event => event.event === 'finalize')).toHaveLength(3);
      expect(events.filter(event => event.event === 'onend')).toHaveLength(3);
      expect(events.some(event => event.event === 'retry-started')).toBe(false);
      const expectedContexts = [0, 1, 2].map(index => activity + ':bm:' + index);
      expect(events.map(event => event.contextKey).filter(Boolean)).toEqual(
        expect.arrayContaining(expectedContexts)
      );
      expect(JSON.stringify(getSpeechDiagnosticSnapshot())).not.toContain('jawapan satu');
    }
  );

  it('times out at 9000ms without startup or post-start retry', () => {
    vi.useFakeTimers();
    installEnvironment();
    const failures = [];
    const session = createCommunicationSession('reading', 0, [], failures);

    session.start();
    const recognition = session.recognition;
    vi.advanceTimersByTime(8999);
    expect(failures).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(LegacySimpleRecognition.instances).toHaveLength(1);
    expect(recognition.abortCalls).toBe(1);
    expect(session.recognition).toBeNull();
    expect(failures).toHaveLength(1);
    expect(failures[0].errorCode).toBe('no-result');

    vi.runOnlyPendingTimers();
    expect(LegacySimpleRecognition.instances).toHaveLength(1);
    expect(getSpeechDiagnosticSnapshot().events.some(event => event.event === 'retry-started')).toBe(false);
  });

  it('finalizes the first non-empty result and ignores stale callbacks after Q2 starts', () => {
    installEnvironment();
    const accepted = [];
    const q1 = createCommunicationSession('reading', 0, accepted);
    q1.start();
    const q1Recognition = q1.recognition;
    const staleResult = q1Recognition.onresult;
    const staleEnd = q1Recognition.onend;

    q1Recognition.emitResult('jawapan pertama');
    q1Recognition.emitEnd();

    const q2 = createCommunicationSession('reading', 1, accepted);
    q2.start();
    const q2Recognition = q2.recognition;

    const stalePayload = [{ transcript: 'callback lama', confidence: 0.1 }];
    stalePayload.isFinal = true;
    staleResult?.({ resultIndex: 0, results: [stalePayload] });
    staleEnd?.();

    expect(q2.recognition).toBe(q2Recognition);
    expect(accepted).toEqual(['jawapan pertama']);

    q2Recognition.emitResult('jawapan kedua');
    q2Recognition.emitEnd();
    expect(accepted).toEqual(['jawapan pertama', 'jawapan kedua']);
    expect(LegacySimpleRecognition.instances).toHaveLength(2);
  });

  it('keeps cancel and abort instance-scoped in the diagnostic trace', () => {
    installEnvironment();
    const session = createCommunicationSession('speaking', 2, []);
    session.start();
    const recognition = session.recognition;

    session.cancel('component-unmount');

    expect(recognition.abortCalls).toBe(1);
    expect(session.recognition).toBeNull();
    expect(LegacySimpleRecognition.instances).toHaveLength(1);
    const events = getSpeechDiagnosticSnapshot().events;
    expect(events.some(event => event.event === 'cancel-call')).toBe(true);
    expect(events.some(event => event.event === 'abort-call')).toBe(true);
    expect(events.some(event => event.event === 'retry-started')).toBe(false);
  });

  it('leaves current diagnostic mode on the existing multi-utterance lifecycle', () => {
    installEnvironment({ mode: 'current' });
    const completed = [];
    const session = createReadingSpeechSession({
      activity: 'reading',
      lang: 'ms-MY',
      resultFactory: transcript => ({ status: 'completed', transcript }),
      onComplete: result => completed.push(result.transcript)
    });

    session.start();
    const recognition = session.recognition;
    expect(recognition).toMatchObject({
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    });

    recognition.emitResult('current mode result');
    expect(session.recognition).toBe(recognition);
    expect(completed).toEqual([]);

    recognition.emitEnd();
    expect(session.recognition).toBeNull();
    expect(completed).toEqual(['current mode result']);
  });
});
