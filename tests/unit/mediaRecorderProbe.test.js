import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  abortNativeSpeechProbe,
  clearSpeechDiagnosticTrace,
  getMediaRecorderProbeState,
  getNativeSpeechProbeState,
  getSpeechDiagnosticSnapshot,
  initializeSpeechDiagnostics,
  startMediaRecorderProbe,
  startMicInputProbe,
  startNativeSpeechProbe,
  stopMediaRecorderProbe,
  stopMicInputProbe
} from '../../src/ai/speech/speechDiagnostics.js';
import { createMemorySessionStorage } from '../helpers/sharedNativeSpeechBackend.js';

class FakeTrack {
  constructor(name = 'audio') {
    this.kind = 'audio';
    this.readyState = 'live';
    this.enabled = true;
    this.muted = false;
    this.label = 'SECRET LABEL ' + name;
    this.id = 'SECRET-ID-' + name;
    this.stopCalls = 0;
    this.listeners = new Map();
    this.removedEndedListeners = [];
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
    if (type === 'ended') this.removedEndedListeners.push(listener);
  }

  stop() {
    this.stopCalls += 1;
    this.readyState = 'ended';
  }
}

class FakeStream {
  constructor(tracks = [new FakeTrack()]) {
    this.tracks = tracks;
  }

  get active() {
    return this.tracks.some(track => track.readyState === 'live');
  }

  getTracks() {
    return this.tracks;
  }

  getAudioTracks() {
    return this.tracks.filter(track => track.kind === 'audio');
  }
}

class FakeMediaRecorder {
  static instances = [];
  static chunks = [{ size: 256, type: 'audio/mp4' }];
  static throwOnStart = false;
  static throwOnStop = false;
  static autoStopEvent = true;

  static reset({
    chunks = [{ size: 256, type: 'audio/mp4' }],
    throwOnStart = false,
    throwOnStop = false,
    autoStopEvent = true
  } = {}) {
    FakeMediaRecorder.instances = [];
    FakeMediaRecorder.chunks = chunks;
    FakeMediaRecorder.throwOnStart = throwOnStart;
    FakeMediaRecorder.throwOnStop = throwOnStop;
    FakeMediaRecorder.autoStopEvent = autoStopEvent;
  }

  constructor(stream) {
    this.stream = stream;
    this.state = 'inactive';
    this.mimeType = 'audio/mp4';
    this.listeners = new Map();
    this.removedListeners = [];
    FakeMediaRecorder.instances.push(this);
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
    this.removedListeners.push({ type, listener });
  }

  emit(type, payload = {}) {
    Array.from(this.listeners.get(type) || []).forEach(listener => listener(payload));
  }

  start() {
    if (FakeMediaRecorder.throwOnStart) {
      const error = new Error('SECRET start failure');
      error.name = 'NotSupportedError';
      throw error;
    }
    this.state = 'recording';
  }

  stop() {
    if (FakeMediaRecorder.throwOnStop) {
      const error = new Error('SECRET stop failure');
      error.name = 'InvalidStateError';
      throw error;
    }
    this.state = 'inactive';
    FakeMediaRecorder.chunks.forEach(chunk => this.emit('dataavailable', {
      data: { ...chunk, secretBytes: 'SECRET AUDIO BYTES' }
    }));
    if (FakeMediaRecorder.autoStopEvent) this.emit('stop');
  }
}

class FakeRecognition {
  static instances = [];

  constructor() {
    this.abortCalls = 0;
    FakeRecognition.instances.push(this);
  }

  start() {}
  stop() {}

  abort() {
    this.abortCalls += 1;
  }

  emitEnd() {
    this.onend?.();
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this.listeners = new Map();
    this.textContent = '';
    this.disabled = false;
    this.id = '';
    this.value = '';
  }

  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this[name] = value; }
  replaceChildren(...children) { this.children = children; }
  remove() {}
  select() {}
  click() { return this.listeners.get('click')?.({ target: this }); }
}

function findElement(root, text) {
  if (root?.textContent === text) return root;
  for (const child of root?.children || []) {
    const match = findElement(child, text);
    if (match) return match;
  }
  return null;
}

function createFakeDocument() {
  const body = new FakeElement('body');
  return {
    body,
    readyState: 'complete',
    visibilityState: 'visible',
    createElement: tagName => new FakeElement(tagName),
    addEventListener: vi.fn(),
    execCommand: vi.fn(() => true),
    getElementById(id) {
      const visit = element => {
        if (element.id === id) return element;
        for (const child of element.children || []) {
          const match = visit(child);
          if (match) return match;
        }
        return null;
      };
      return visit(body);
    }
  };
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function installEnvironment({
  mode = 'media-recorder-probe',
  diagnostics = true,
  recorder = FakeMediaRecorder,
  streams = [new FakeStream()],
  getUserMedia,
  document = null
} = {}) {
  FakeRecognition.instances = [];
  FakeMediaRecorder.reset();
  const search = diagnostics ? '?speechDiag=1&speechMode=' + mode : '';
  const eventListeners = new Map();
  const queue = [...streams];
  const mediaDevices = {
    getUserMedia: getUserMedia || vi.fn(() => Promise.resolve(queue.shift()))
  };
  const browserWindow = {
    SpeechRecognition: FakeRecognition,
    webkitSpeechRecognition: null,
    MediaRecorder: recorder,
    location: {
      search,
      href: 'https://example.test/jannati-ai-tutor-v1/' + search,
      assign: vi.fn()
    },
    localStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
    sessionStorage: createMemorySessionStorage(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener: vi.fn((type, listener) => eventListeners.set(type, listener)),
    matchMedia: () => ({ matches: false }),
    URL: globalThis.URL
  };
  globalThis.window = browserWindow;
  if (document) globalThis.document = document;
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X)',
    maxTouchPoints: 5,
    mediaDevices,
    serviceWorker: { controller: null }
  });
  clearSpeechDiagnosticTrace();
  return { browserWindow, eventListeners, mediaDevices };
}

afterEach(() => {
  stopMediaRecorderProbe('test-cleanup', { immediate: true });
  stopMicInputProbe('test-cleanup');
  if (getNativeSpeechProbeState().active) {
    abortNativeSpeechProbe();
    FakeRecognition.instances.at(-1)?.emitEnd();
  }
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.window;
  delete globalThis.document;
});

describe('P1.8 MediaRecorder repeatability probe', () => {
  it('captures non-empty metadata, reports PASS semantics, and releases every track', async () => {
    vi.useFakeTimers();
    const tracks = [new FakeTrack('one'), new FakeTrack('two')];
    const stream = new FakeStream(tracks);
    const environment = installEnvironment({ streams: [stream] });

    expect(startMediaRecorderProbe()).toMatchObject({ started: true, reason: '' });
    expect(environment.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    await flushPromises();
    expect(getMediaRecorderProbeState()).toMatchObject({ status: 'recording', active: true });

    vi.advanceTimersByTime(4000);
    await flushPromises();

    const state = getMediaRecorderProbeState();
    const snapshot = getSpeechDiagnosticSnapshot();
    const events = snapshot.events.filter(event => event.activity === 'media-recorder-probe');
    expect(events.map(event => event.event)).toEqual(expect.arrayContaining([
      'media-probe-request',
      'media-probe-granted',
      'media-probe-recorder-created',
      'media-probe-start',
      'media-probe-dataavailable',
      'media-probe-stop',
      'media-probe-complete',
      'media-probe-cleanup'
    ]));
    expect(state).toMatchObject({
      status: 'completed',
      active: false,
      outcome: 'capture-detected',
      chunkCount: 1,
      totalBytes: 256,
      mimeType: 'audio/mp4'
    });
    expect(state.durationMs).toBe(4000);
    expect(state.recorderStates).toBe('inactive>recording>inactive');
    expect(tracks.map(track => track.stopCalls)).toEqual([1, 1]);
    expect(FakeRecognition.instances).toHaveLength(0);
  });

  it('classifies zero-byte/no-data capture without implying speech accuracy', async () => {
    vi.useFakeTimers();
    installEnvironment();
    FakeMediaRecorder.chunks = [];

    startMediaRecorderProbe();
    await flushPromises();
    vi.advanceTimersByTime(4000);

    expect(getMediaRecorderProbeState()).toMatchObject({
      status: 'completed',
      outcome: 'no-data',
      chunkCount: 0,
      totalBytes: 0
    });
  });

  it('records permission denial by error name only', async () => {
    vi.useFakeTimers();
    const denied = new Error('SECRET permission explanation');
    denied.name = 'NotAllowedError';
    installEnvironment({ getUserMedia: vi.fn(() => Promise.reject(denied)) });

    startMediaRecorderProbe();
    await flushPromises();

    const snapshot = getSpeechDiagnosticSnapshot();
    expect(getMediaRecorderProbeState()).toMatchObject({
      status: 'error',
      outcome: 'NotAllowedError'
    });
    expect(snapshot.events.find(event => event.event === 'media-probe-error')).toMatchObject({
      errorCode: 'NotAllowedError'
    });
    expect(JSON.stringify(snapshot)).not.toContain('SECRET permission explanation');
  });

  it.each([
    ['start', { throwOnStart: true }, 'NotSupportedError'],
    ['stop', { throwOnStop: true }, 'InvalidStateError']
  ])('cleans up when recorder %s fails', async (_phase, behavior, outcome) => {
    vi.useFakeTimers();
    const stream = new FakeStream([new FakeTrack(_phase)]);
    installEnvironment({ streams: [stream] });
    Object.assign(FakeMediaRecorder, behavior);

    startMediaRecorderProbe();
    await flushPromises();
    if (_phase === 'stop') vi.advanceTimersByTime(4000);

    expect(getMediaRecorderProbeState()).toMatchObject({ status: 'error', outcome });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(JSON.stringify(getSpeechDiagnosticSnapshot())).not.toContain('SECRET');
  });

  it('cleans pending requests on timeout/manual stop and stops late streams', async () => {
    vi.useFakeTimers();
    const timedOut = createDeferred();
    installEnvironment({ getUserMedia: vi.fn(() => timedOut.promise) });
    startMediaRecorderProbe();
    vi.advanceTimersByTime(10000);
    expect(getMediaRecorderProbeState()).toMatchObject({ status: 'error', outcome: 'request-timeout' });
    const lateTimeoutStream = new FakeStream([new FakeTrack('timeout-late')]);
    timedOut.resolve(lateTimeoutStream);
    await flushPromises();
    expect(lateTimeoutStream.getTracks()[0].stopCalls).toBe(1);

    const manuallyStopped = createDeferred();
    navigator.mediaDevices.getUserMedia = vi.fn(() => manuallyStopped.promise);
    startMediaRecorderProbe();
    expect(stopMediaRecorderProbe('manual-stop')).toBe(true);
    const lateManualStream = new FakeStream([new FakeTrack('manual-late')]);
    manuallyStopped.resolve(lateManualStream);
    await flushPromises();
    expect(lateManualStream.getTracks()[0].stopCalls).toBe(1);
  });

  it('releases an active recorder immediately on pagehide', async () => {
    vi.useFakeTimers();
    const stream = new FakeStream([new FakeTrack('pagehide')]);
    const environment = installEnvironment({
      streams: [stream],
      document: createFakeDocument()
    });
    initializeSpeechDiagnostics();
    await flushPromises();
    startMediaRecorderProbe();
    await flushPromises();

    environment.eventListeners.get('pagehide')?.({ persisted: false });

    expect(getMediaRecorderProbeState()).toMatchObject({
      status: 'completed',
      active: false,
      outcome: 'pagehide'
    });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(getSpeechDiagnosticSnapshot().events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: 'media-probe-cleanup', reason: 'pagehide' })
    ]));
  });

  it('stops an active run manually after retaining only final chunk metadata', async () => {
    vi.useFakeTimers();
    const stream = new FakeStream([new FakeTrack('manual-active')]);
    installEnvironment({ streams: [stream] });
    startMediaRecorderProbe();
    await flushPromises();

    expect(stopMediaRecorderProbe('manual-stop')).toBe(true);

    expect(getMediaRecorderProbeState()).toMatchObject({
      status: 'completed',
      active: false,
      outcome: 'capture-detected',
      chunkCount: 1,
      totalBytes: 256
    });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(getSpeechDiagnosticSnapshot().events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: 'media-probe-stop', reason: 'manual-stop' }),
      expect.objectContaining({ event: 'media-probe-cleanup', reason: 'manual-stop' })
    ]));
  });

  it('uses fresh streams/recorders for runs 1/2/3 and ignores stale callbacks', async () => {
    vi.useFakeTimers();
    const streams = [1, 2, 3].map(index => new FakeStream([new FakeTrack('run-' + index)]));
    installEnvironment({ streams });

    for (let index = 0; index < 3; index += 1) {
      expect(startMediaRecorderProbe().started).toBe(true);
      await flushPromises();
      const recorder = FakeMediaRecorder.instances[index];
      const staleData = recorder.listeners.get('dataavailable')?.values().next().value;
      vi.advanceTimersByTime(4000);
      expect(getMediaRecorderProbeState()).toMatchObject({
        status: 'completed',
        outcome: 'capture-detected'
      });
      if (index === 0) {
        expect(startMediaRecorderProbe().started).toBe(true);
        await flushPromises();
        const current = getMediaRecorderProbeState();
        staleData?.({ data: { size: 999999, type: 'audio/secret' } });
        expect(getMediaRecorderProbeState()).toEqual(current);
        vi.advanceTimersByTime(4000);
        index += 1;
      }
    }

    expect(FakeMediaRecorder.instances).toHaveLength(3);
    expect(new Set(FakeMediaRecorder.instances.map(item => item.stream)).size).toBe(3);
    expect(streams.flatMap(stream => stream.getTracks()).map(track => track.stopCalls)).toEqual([1, 1, 1]);
  });

  it('keeps snapshots free of blob bytes, audio, transcript and device identity', async () => {
    vi.useFakeTimers();
    installEnvironment({ streams: [new FakeStream([new FakeTrack('private')])] });
    startMediaRecorderProbe();
    await flushPromises();
    vi.advanceTimersByTime(4000);

    const snapshot = getSpeechDiagnosticSnapshot();
    const serialized = JSON.stringify(snapshot);
    expect(snapshot.privacy).toMatchObject({
      remoteUpload: false,
      transcriptIncluded: false,
      audioIncluded: false,
      audioSamplesIncluded: false,
      deviceIdentifiersIncluded: false,
      deviceLabelsIncluded: false
    });
    expect(serialized).not.toContain('SECRET');
    expect(serialized).not.toContain('Blob');
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'transcript'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'data'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'deviceId'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'label'))).toBe(true);
  });

  it('is mutually exclusive with both native and mic probes', async () => {
    vi.useFakeTimers();
    const environment = installEnvironment({ mode: 'native-probe' });
    expect(startNativeSpeechProbe().started).toBe(true);
    environment.browserWindow.location.search = '?speechDiag=1&speechMode=media-recorder-probe';
    expect(startMediaRecorderProbe()).toMatchObject({ started: false, reason: 'native-probe-active' });
    abortNativeSpeechProbe();
    FakeRecognition.instances[0].emitEnd();

    expect(startMediaRecorderProbe().started).toBe(true);
    await flushPromises();
    environment.browserWindow.location.search = '?speechDiag=1&speechMode=native-probe';
    expect(startNativeSpeechProbe()).toMatchObject({ started: false, reason: 'media-probe-active' });
    expect(startMicInputProbe()).toMatchObject({ started: false, reason: 'media-probe-active' });
    expect(FakeRecognition.instances).toHaveLength(1);
    stopMediaRecorderProbe('manual-stop', { immediate: true });

    expect(startMicInputProbe().started).toBe(true);
    environment.browserWindow.location.search = '?speechDiag=1&speechMode=media-recorder-probe';
    expect(startMediaRecorderProbe()).toMatchObject({ started: false, reason: 'mic-probe-active' });
    stopMicInputProbe('manual-stop');
  });

  it('has no Web Speech, TTS, shared-engine, storage or upload dependency', () => {
    const source = readFileSync(
      new URL('../../src/ai/speech/mediaRecorderProbe.js', import.meta.url),
      'utf8'
    );
    expect(source).not.toContain('SpeechRecognition');
    expect(source).not.toContain('speechEngine');
    expect(source).not.toContain('speechSession');
    expect(source).not.toContain('voiceEngine');
    expect(source).not.toContain('speechSynthesis');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('sessionStorage');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('XMLHttpRequest');
    expect(source).not.toContain('createObjectURL');
    expect(source).not.toContain('enumerateDevices');
  });

  it('keeps controls and execution absent without explicit diagnostic mode', async () => {
    vi.useFakeTimers();
    const document = createFakeDocument();
    const environment = installEnvironment({ diagnostics: false, document });
    expect(initializeSpeechDiagnostics()).toBe(false);
    expect(startMediaRecorderProbe()).toMatchObject({
      started: false,
      reason: 'diagnostic-disabled'
    });
    expect(document.body.children).toHaveLength(0);
    expect(environment.mediaDevices.getUserMedia).not.toHaveBeenCalled();

    environment.browserWindow.location.search = '?speechDiag=1&speechMode=native-probe';
    expect(initializeSpeechDiagnostics()).toBe(true);
    await flushPromises();
    const panel = document.getElementById('jannati-speech-diagnostic-panel');
    expect(findElement(panel, 'Run MediaRecorder Probe')).toBeNull();
  });

  it('mounts media-only controls and reports unsupported without fallback', async () => {
    vi.useFakeTimers();
    const document = createFakeDocument();
    const environment = installEnvironment({ document, recorder: null });
    expect(initializeSpeechDiagnostics()).toBe(true);
    await flushPromises();
    const panel = document.getElementById('jannati-speech-diagnostic-panel');
    const mediaStart = findElement(panel, 'Run MediaRecorder Probe');
    expect(mediaStart).not.toBeNull();
    expect(findElement(panel, 'Start Native Probe')).toBeNull();
    mediaStart.click();
    expect(getMediaRecorderProbeState()).toMatchObject({
      status: 'error',
      supported: false,
      outcome: 'unsupported'
    });
    expect(FakeRecognition.instances).toHaveLength(0);
    expect(environment.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });
});
