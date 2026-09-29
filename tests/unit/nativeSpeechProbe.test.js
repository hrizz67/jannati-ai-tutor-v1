import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  abortNativeSpeechProbe,
  clearSpeechDiagnosticTrace,
  getNativeSpeechProbeState,
  getSpeechDiagnosticSnapshot,
  initializeSpeechDiagnostics,
  startNativeSpeechProbe,
  stopNativeSpeechProbe
} from '../../src/ai/speech/speechDiagnostics.js';
import { createMemorySessionStorage } from '../helpers/sharedNativeSpeechBackend.js';

class FakeRawRecognition {
  static instances = [];

  static reset() {
    FakeRawRecognition.instances = [];
  }

  constructor() {
    this.lang = '';
    this.continuous = true;
    this.interimResults = true;
    this.maxAlternatives = 0;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    FakeRawRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
  }

  stop() {
    this.stopCalls += 1;
  }

  abort() {
    this.abortCalls += 1;
  }

  emitStart() {
    this.onstart?.();
  }

  emitAudioStart() {
    this.onaudiostart?.();
  }

  emitSoundStart() {
    this.onsoundstart?.();
  }

  emitSpeechStart() {
    this.onspeechstart?.();
  }

  emitResult(results, resultIndex = 0) {
    this.onresult?.({ resultIndex, results });
  }

  emitSpeechEnd() {
    this.onspeechend?.();
  }

  emitSoundEnd() {
    this.onsoundend?.();
  }

  emitAudioEnd() {
    this.onaudioend?.();
  }

  emitNoMatch() {
    this.onnomatch?.();
  }

  emitError(error) {
    this.onerror?.({ error, message: 'must not be recorded' });
  }

  emitEnd() {
    this.onend?.();
  }
}

function installEnvironment({ diagnostics = true, mode = 'native-probe' } = {}) {
  FakeRawRecognition.reset();
  const search = diagnostics
    ? '?speechDiag=1&speechMode=' + mode
    : '?speechMode=' + mode;
  const speechSynthesis = {
    cancel: vi.fn(),
    speak: vi.fn()
  };
  globalThis.window = {
    SpeechRecognition: FakeRawRecognition,
    webkitSpeechRecognition: null,
    speechSynthesis,
    location: {
      search,
      href: 'https://example.test/jannati-ai-tutor-v1/' + search,
      assign: vi.fn()
    },
    sessionStorage: createMemorySessionStorage(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener: vi.fn(),
    matchMedia: () => ({ matches: false }),
    URL: globalThis.URL
  };
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X)',
    maxTouchPoints: 5,
    serviceWorker: { controller: null }
  });
  clearSpeechDiagnosticTrace();
  return speechSynthesis;
}

function createResult(transcript, isFinal) {
  const result = [{ transcript, confidence: 0.9 }];
  result.isFinal = isFinal;
  return result;
}

afterEach(() => {
  const active = getNativeSpeechProbeState().active;
  if (active) {
    abortNativeSpeechProbe();
    FakeRawRecognition.instances.at(-1)?.emitEnd();
  }
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.window;
  delete globalThis.document;
});

describe('P1.6 diagnostic-only native Web Speech probe', () => {
  it('records a successful full raw lifecycle with metadata-only results', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T12:00:00.000Z'));
    const synthesis = installEnvironment();

    const started = startNativeSpeechProbe();
    const recognition = FakeRawRecognition.instances[0];

    expect(started.started).toBe(true);
    expect(FakeRawRecognition.instances).toHaveLength(1);
    expect(recognition).toMatchObject({
      lang: 'ms-MY',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      startCalls: 1
    });

    vi.advanceTimersByTime(100);
    recognition.emitStart();
    vi.advanceTimersByTime(100);
    recognition.emitAudioStart();
    vi.advanceTimersByTime(100);
    recognition.emitSoundStart();
    vi.advanceTimersByTime(100);
    recognition.emitSpeechStart();
    vi.advanceTimersByTime(100);
    recognition.emitNoMatch();
    vi.advanceTimersByTime(100);
    recognition.emitResult([
      createResult('RAHSIA MURID', true),
      createResult('kedua', false)
    ], 1);
    recognition.emitSpeechEnd();
    recognition.emitSoundEnd();
    recognition.emitAudioEnd();
    recognition.emitEnd();

    const snapshot = getSpeechDiagnosticSnapshot();
    const events = snapshot.events.filter(event => event.activity === 'native-probe');
    expect(events.map(event => event.event)).toEqual([
      'probe-create',
      'probe-start-call',
      'probe-start-return',
      'onstart',
      'onaudiostart',
      'onsoundstart',
      'onspeechstart',
      'onnomatch',
      'onresult',
      'onspeechend',
      'onsoundend',
      'onaudioend',
      'onend'
    ]);
    expect(events.find(event => event.event === 'onresult')).toMatchObject({
      resultIndex: 1,
      resultsLength: 2,
      finalResultCount: 1,
      interimResultCount: 1,
      alternativeCount: 2,
      nonEmptyTranscriptCount: 2,
      totalCharacterCount: 17,
      probeElapsedMs: 600
    });
    expect(getNativeSpeechProbeState()).toMatchObject({
      status: 'ended',
      active: false,
      outcome: 'result-received',
      elapsedMs: 600
    });
    expect(JSON.stringify(snapshot)).not.toContain('RAHSIA MURID');
    expect(JSON.stringify(snapshot)).not.toContain('kedua');
    expect(synthesis.cancel).not.toHaveBeenCalled();
    expect(synthesis.speak).not.toHaveBeenCalled();
  });

  it('times out once after onstart and onaudiostart, aborts once, waits for onend and never retries', () => {
    vi.useFakeTimers();
    installEnvironment();

    startNativeSpeechProbe();
    const recognition = FakeRawRecognition.instances[0];
    recognition.emitStart();
    recognition.emitAudioStart();
    expect(getNativeSpeechProbeState().status).toBe('audio-capture');

    vi.advanceTimersByTime(11999);
    expect(recognition.abortCalls).toBe(0);
    vi.advanceTimersByTime(1);

    expect(recognition.abortCalls).toBe(1);
    expect(FakeRawRecognition.instances).toHaveLength(1);
    expect(getNativeSpeechProbeState()).toMatchObject({
      status: 'error',
      active: true,
      outcome: 'timeout'
    });
    vi.advanceTimersByTime(12000);
    expect(recognition.abortCalls).toBe(1);
    expect(FakeRawRecognition.instances).toHaveLength(1);

    recognition.emitEnd();
    expect(getNativeSpeechProbeState()).toMatchObject({
      status: 'ended',
      active: false,
      outcome: 'timeout',
      elapsedMs: 24000
    });
    const events = getSpeechDiagnosticSnapshot().events
      .filter(event => event.activity === 'native-probe');
    expect(events.filter(event => event.event === 'probe-timeout')).toHaveLength(1);
    expect(events.filter(event => event.event === 'probe-abort-call')).toHaveLength(1);
    expect(events.some(event => event.event === 'onsoundstart')).toBe(false);
    expect(events.some(event => event.event === 'onspeechstart')).toBe(false);
    expect(events.some(event => event.event === 'onresult')).toBe(false);
  });

  it('cannot let a stale callback from a prior probe mutate the active probe status', () => {
    vi.useFakeTimers();
    installEnvironment();

    startNativeSpeechProbe();
    const first = FakeRawRecognition.instances[0];
    first.emitStart();
    first.emitAudioStart();
    first.emitEnd();

    startNativeSpeechProbe();
    const second = FakeRawRecognition.instances[1];
    const secondState = getNativeSpeechProbeState();
    expect(secondState).toMatchObject({ status: 'starting', active: true });

    first.emitSpeechStart();
    first.emitResult([createResult('DATA LAMA', true)]);
    first.emitError('network');
    first.emitEnd();

    expect(getNativeSpeechProbeState()).toEqual(secondState);
    expect(JSON.stringify(getSpeechDiagnosticSnapshot())).not.toContain('DATA LAMA');
    second.emitEnd();
  });

  it('logs explicit manual stop and abort controls without creating extra instances', () => {
    vi.useFakeTimers();
    installEnvironment();

    startNativeSpeechProbe();
    const first = FakeRawRecognition.instances[0];
    expect(stopNativeSpeechProbe()).toBe(true);
    expect(first.stopCalls).toBe(1);
    first.emitEnd();

    startNativeSpeechProbe();
    const second = FakeRawRecognition.instances[1];
    expect(abortNativeSpeechProbe()).toBe(true);
    expect(second.abortCalls).toBe(1);
    second.emitEnd();

    expect(FakeRawRecognition.instances).toHaveLength(2);
    const events = getSpeechDiagnosticSnapshot().events;
    expect(events.filter(event => event.event === 'probe-manual-stop')).toHaveLength(1);
    expect(events.filter(event => event.event === 'probe-manual-abort')).toHaveLength(1);
  });

  it('contains no shared speech engine or TTS dependency in the raw probe module', () => {
    const source = readFileSync(
      new URL('../../src/ai/speech/nativeSpeechProbe.js', import.meta.url),
      'utf8'
    );

    expect(source).not.toContain('speechEngine');
    expect(source).not.toContain('speechSession');
    expect(source).not.toContain('voiceEngine');
    expect(source).not.toContain('createSpeechSession');
    expect(source).not.toContain('createCommunicationSpeechSession');
    expect(source).not.toContain('speechSynthesis');
  });

  it('keeps the probe UI and execution path absent without explicit diagnostic opt-in', () => {
    vi.useFakeTimers();
    installEnvironment({ diagnostics: false });
    const appendChild = vi.fn();
    vi.stubGlobal('document', {
      body: { appendChild },
      getElementById: vi.fn()
    });

    expect(initializeSpeechDiagnostics()).toBe(false);
    const start = startNativeSpeechProbe();

    expect(start).toMatchObject({ started: false, reason: 'diagnostic-disabled' });
    expect(FakeRawRecognition.instances).toHaveLength(0);
    expect(appendChild).not.toHaveBeenCalled();
    expect(getSpeechDiagnosticSnapshot().events).toEqual([]);
  });
});
