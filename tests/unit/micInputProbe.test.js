import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  abortNativeSpeechProbe,
  clearSpeechDiagnosticTrace,
  getMicInputProbeState,
  getNativeSpeechProbeState,
  getSpeechDiagnosticSnapshot,
  initializeSpeechDiagnostics,
  startMicInputProbe,
  startNativeSpeechProbe,
  stopMicInputProbe
} from '../../src/ai/speech/speechDiagnostics.js';
import { createMemorySessionStorage } from '../helpers/sharedNativeSpeechBackend.js';

class FakeTrack {
  constructor(name = 'audio') {
    this.kind = 'audio';
    this.readyState = 'live';
    this.enabled = true;
    this.muted = false;
    this.label = 'SECRET DEVICE LABEL ' + name;
    this.id = 'SECRET-DEVICE-ID-' + name;
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

  emitEnded() {
    this.readyState = 'ended';
    Array.from(this.listeners.get('ended') || []).forEach(listener => listener());
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

class FakeAudioContext {
  static instances = [];
  static signalLevel = 0.1;
  static throwDuringSample = false;

  static reset({ signalLevel = 0.1, throwDuringSample = false } = {}) {
    FakeAudioContext.instances = [];
    FakeAudioContext.signalLevel = signalLevel;
    FakeAudioContext.throwDuringSample = throwDuringSample;
  }

  constructor() {
    this.state = 'running';
    this.closeCalls = 0;
    this.source = null;
    this.analyser = null;
    FakeAudioContext.instances.push(this);
  }

  get destination() {
    throw new Error('Mic probe must never access the audio destination');
  }

  createMediaStreamSource(stream) {
    this.source = {
      stream,
      connections: [],
      disconnectCalls: 0,
      connect: node => this.source.connections.push(node),
      disconnect: () => { this.source.disconnectCalls += 1; }
    };
    return this.source;
  }

  createAnalyser() {
    this.analyser = {
      fftSize: 2048,
      disconnectCalls: 0,
      getFloatTimeDomainData(buffer) {
        if (FakeAudioContext.throwDuringSample) throw new Error('SECRET PCM FAILURE');
        for (let index = 0; index < buffer.length; index += 1) {
          buffer[index] = index % 2 === 0
            ? FakeAudioContext.signalLevel
            : -FakeAudioContext.signalLevel;
        }
      },
      disconnect() {
        this.disconnectCalls += 1;
      }
    };
    return this.analyser;
  }

  close() {
    this.closeCalls += 1;
    this.state = 'closed';
    return Promise.resolve();
  }
}

class FakeRawRecognition {
  static instances = [];

  constructor() {
    this.startCalls = 0;
    this.abortCalls = 0;
    FakeRawRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
  }

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

  append(...children) {
    this.children.push(...children);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  replaceChildren(...children) {
    this.children = children;
  }

  remove() {}

  select() {}

  click() {
    return this.listeners.get('click')?.({ target: this });
  }
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
  diagnostics = true,
  stream = new FakeStream(),
  getUserMedia,
  audioContext = FakeAudioContext,
  document = null,
  captureTimers = false
} = {}) {
  FakeRawRecognition.instances = [];
  FakeAudioContext.reset();
  const search = diagnostics ? '?speechDiag=1&speechMode=native-probe' : '';
  const eventListeners = new Map();
  const scheduledTimers = [];
  const localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
  const mediaDevices = {
    getUserMedia: getUserMedia || vi.fn(() => Promise.resolve(stream))
  };
  const browserWindow = {
    SpeechRecognition: FakeRawRecognition,
    webkitSpeechRecognition: null,
    speechSynthesis: { cancel: vi.fn(), speak: vi.fn() },
    location: {
      search,
      href: 'https://example.test/jannati-ai-tutor-v1/' + search,
      assign: vi.fn()
    },
    localStorage,
    sessionStorage: createMemorySessionStorage(),
    setTimeout: captureTimers
      ? vi.fn((callback, delay) => {
        const timer = { callback, delay, id: globalThis.setTimeout(callback, delay) };
        scheduledTimers.push(timer);
        return timer.id;
      })
      : globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    addEventListener: vi.fn((type, listener) => eventListeners.set(type, listener)),
    matchMedia: () => ({ matches: false }),
    URL: globalThis.URL
  };
  if (audioContext) browserWindow.AudioContext = audioContext;
  globalThis.window = browserWindow;
  if (document) globalThis.document = document;
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X)',
    maxTouchPoints: 5,
    mediaDevices,
    serviceWorker: { controller: null }
  });
  clearSpeechDiagnosticTrace();
  return {
    eventListeners,
    localStorage,
    mediaDevices,
    scheduledTimers,
    stream,
    synthesis: browserWindow.speechSynthesis
  };
}

afterEach(() => {
  stopMicInputProbe('test-cleanup');
  if (getNativeSpeechProbeState().active) {
    abortNativeSpeechProbe();
    FakeRawRecognition.instances.at(-1)?.emitEnd();
  }
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.window;
  delete globalThis.document;
});

describe('P1.7 diagnostic-only mic input isolation probe', () => {
  it('samples non-zero input, reports safe signal metadata, and releases every resource', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T02:00:00.000Z'));
    const tracks = [new FakeTrack('one'), new FakeTrack('two')];
    const stream = new FakeStream(tracks);
    const environment = installEnvironment({ stream });

    const start = startMicInputProbe();
    expect(start).toMatchObject({ started: true, reason: '' });
    expect(environment.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    expect(environment.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(getMicInputProbeState().status).toBe('requesting');

    await flushPromises();
    expect(getMicInputProbeState().status).toBe('signal-detected');
    vi.advanceTimersByTime(4000);
    await flushPromises();

    const context = FakeAudioContext.instances[0];
    const snapshot = getSpeechDiagnosticSnapshot();
    const events = snapshot.events.filter(event => event.activity === 'mic-input-probe');
    const summary = events.find(event => event.event === 'mic-probe-sample-summary');
    expect(events.map(event => event.event)).toEqual(expect.arrayContaining([
      'mic-probe-request',
      'mic-probe-granted',
      'mic-probe-context-created',
      'mic-probe-sampling-start',
      'mic-probe-sample-summary',
      'mic-probe-stop',
      'mic-probe-cleanup'
    ]));
    expect(summary).toMatchObject({
      peakLevel: 0.1,
      averageRms: 0.1,
      activityPercentage: 100,
      trackReadyState: 'live',
      contextAvailable: true,
      captureOnly: false
    });
    expect(summary.sampleCount).toBeGreaterThan(1);
    expect(getMicInputProbeState()).toMatchObject({
      status: 'completed',
      active: false,
      outcome: 'signal-detected',
      activityPercentage: 100
    });
    expect(tracks.map(track => track.stopCalls)).toEqual([1, 1]);
    expect(context.closeCalls).toBe(1);
    expect(context.source.connections).toEqual([context.analyser]);
    expect(context.source.disconnectCalls).toBe(1);
    expect(context.analyser.disconnectCalls).toBe(1);
    expect(environment.synthesis.cancel).not.toHaveBeenCalled();
    expect(environment.synthesis.speak).not.toHaveBeenCalled();
    expect(environment.localStorage.setItem).not.toHaveBeenCalled();
  });

  it('classifies near-zero input as no-signal without inventing activity', async () => {
    vi.useFakeTimers();
    const stream = new FakeStream();
    installEnvironment({ stream });
    FakeAudioContext.signalLevel = 0.001;

    startMicInputProbe();
    await flushPromises();
    expect(getMicInputProbeState().status).toBe('capturing');
    vi.advanceTimersByTime(4000);
    await flushPromises();

    expect(getMicInputProbeState()).toMatchObject({
      status: 'completed',
      outcome: 'no-signal',
      activitySampleCount: 0,
      activityPercentage: 0,
      peakLevel: 0.001,
      averageRms: 0.001
    });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(FakeAudioContext.instances[0].closeCalls).toBe(1);
  });

  it('records permission denial by error name only', async () => {
    vi.useFakeTimers();
    const denied = new Error('SECRET permission explanation');
    denied.name = 'NotAllowedError';
    installEnvironment({ getUserMedia: vi.fn(() => Promise.reject(denied)) });

    startMicInputProbe();
    await flushPromises();

    const snapshot = getSpeechDiagnosticSnapshot();
    expect(getMicInputProbeState()).toMatchObject({
      status: 'error',
      active: false,
      outcome: 'NotAllowedError'
    });
    expect(snapshot.events.find(event => event.event === 'mic-probe-error')).toMatchObject({
      errorCode: 'NotAllowedError'
    });
    expect(JSON.stringify(snapshot)).not.toContain('SECRET permission explanation');
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it('times out a pending permission request and stops a stream that arrives late', async () => {
    vi.useFakeTimers();
    const deferred = createDeferred();
    const stream = new FakeStream([new FakeTrack('late')]);
    installEnvironment({ getUserMedia: vi.fn(() => deferred.promise) });

    startMicInputProbe();
    vi.advanceTimersByTime(10000);
    expect(getMicInputProbeState()).toMatchObject({ status: 'error', outcome: 'request-timeout' });

    deferred.resolve(stream);
    await flushPromises();
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(FakeAudioContext.instances).toHaveLength(0);
    expect(getMicInputProbeState()).toMatchObject({ status: 'error', outcome: 'request-timeout' });
  });

  it('stops pending and active probes manually with complete cleanup', async () => {
    vi.useFakeTimers();
    const pending = createDeferred();
    installEnvironment({ getUserMedia: vi.fn(() => pending.promise) });
    startMicInputProbe();
    expect(stopMicInputProbe('manual-stop')).toBe(true);
    const lateStream = new FakeStream([new FakeTrack('manual-late')]);
    pending.resolve(lateStream);
    await flushPromises();
    expect(lateStream.getTracks()[0].stopCalls).toBe(1);

    const activeStream = new FakeStream([new FakeTrack('active')]);
    navigator.mediaDevices.getUserMedia = vi.fn(() => Promise.resolve(activeStream));
    startMicInputProbe();
    await flushPromises();
    expect(stopMicInputProbe('manual-stop')).toBe(true);
    expect(activeStream.getTracks()[0].stopCalls).toBe(1);
    expect(FakeAudioContext.instances.at(-1).closeCalls).toBe(1);
    expect(getMicInputProbeState()).toMatchObject({
      status: 'completed',
      active: false,
      outcome: 'manual-stop'
    });
  });

  it('cleans up on sampling failure and records no error message or sample buffer', async () => {
    vi.useFakeTimers();
    const stream = new FakeStream();
    installEnvironment({ stream });
    FakeAudioContext.throwDuringSample = true;

    startMicInputProbe();
    await flushPromises();

    const snapshot = getSpeechDiagnosticSnapshot();
    expect(getMicInputProbeState()).toMatchObject({ status: 'error', active: false });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(FakeAudioContext.instances[0].closeCalls).toBe(1);
    expect(JSON.stringify(snapshot)).not.toContain('SECRET PCM FAILURE');
    expect(JSON.stringify(snapshot)).not.toContain('floatBuffer');
    expect(JSON.stringify(snapshot)).not.toContain('byteBuffer');
  });

  it('records track-ended metadata then releases all tracks and the context', async () => {
    vi.useFakeTimers();
    const tracks = [new FakeTrack('ended'), new FakeTrack('other')];
    const stream = new FakeStream(tracks);
    installEnvironment({ stream });

    startMicInputProbe();
    await flushPromises();
    tracks[0].emitEnded();

    const events = getSpeechDiagnosticSnapshot().events;
    expect(events.some(event => event.event === 'mic-probe-track-ended')).toBe(true);
    expect(tracks.map(track => track.stopCalls)).toEqual([1, 1]);
    expect(FakeAudioContext.instances[0].closeCalls).toBe(1);
    expect(getMicInputProbeState()).toMatchObject({ status: 'error', active: false });
  });

  it('fails soft as capture-only when AudioContext is unavailable', async () => {
    vi.useFakeTimers();
    const stream = new FakeStream();
    installEnvironment({ stream, audioContext: null });

    startMicInputProbe();
    await flushPromises();
    expect(getMicInputProbeState()).toMatchObject({
      status: 'capture-only',
      active: true,
      captureOnly: true,
      contextAvailable: false
    });
    vi.advanceTimersByTime(4000);

    expect(getMicInputProbeState()).toMatchObject({
      status: 'completed',
      active: false,
      outcome: 'capture-only',
      sampleCount: 0,
      peakLevel: null,
      averageRms: null
    });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(getSpeechDiagnosticSnapshot().events.some(event => (
      event.event === 'mic-probe-context-unavailable'
    ))).toBe(true);
  });

  it('makes native SpeechRecognition and mic capture mutually exclusive', async () => {
    vi.useFakeTimers();
    const environment = installEnvironment();

    expect(startNativeSpeechProbe().started).toBe(true);
    expect(startMicInputProbe()).toMatchObject({
      started: false,
      reason: 'native-probe-active'
    });
    expect(environment.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    abortNativeSpeechProbe();
    FakeRawRecognition.instances[0].emitEnd();

    expect(startMicInputProbe().started).toBe(true);
    await flushPromises();
    expect(startNativeSpeechProbe()).toMatchObject({
      started: false,
      reason: 'mic-probe-active'
    });
    expect(FakeRawRecognition.instances).toHaveLength(1);
    stopMicInputProbe('manual-stop');
  });

  it('keeps metadata-only snapshots free of audio, device, identity, and arbitrary fields', async () => {
    vi.useFakeTimers();
    const stream = new FakeStream([new FakeTrack('private')]);
    installEnvironment({ stream });

    startMicInputProbe();
    await flushPromises();
    vi.advanceTimersByTime(4000);
    const snapshot = getSpeechDiagnosticSnapshot();
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.privacy).toMatchObject({
      remoteUpload: false,
      transcriptIncluded: false,
      audioIncluded: false,
      audioSamplesIncluded: false,
      learnerIdentityIncluded: false,
      deviceIdentifiersIncluded: false,
      deviceLabelsIncluded: false
    });
    expect(serialized).not.toContain('SECRET DEVICE LABEL');
    expect(serialized).not.toContain('SECRET-DEVICE-ID');
    expect(serialized).not.toContain('Float32Array');
    expect(serialized).not.toContain('Uint8Array');
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'transcript'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'deviceId'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'groupId'))).toBe(true);
    expect(snapshot.events.every(event => !Object.hasOwn(event, 'label'))).toBe(true);
  });

  it('cannot let a stale track callback or sample timer alter a newer run', async () => {
    vi.useFakeTimers();
    const firstTrack = new FakeTrack('first');
    const secondTrack = new FakeTrack('second');
    const streams = [new FakeStream([firstTrack]), new FakeStream([secondTrack])];
    const environment = installEnvironment({
      getUserMedia: vi.fn(() => Promise.resolve(streams.shift())),
      captureTimers: true
    });

    startMicInputProbe();
    await flushPromises();
    const staleSample = environment.scheduledTimers.find(timer => timer.delay === 50)?.callback;
    stopMicInputProbe('manual-stop');
    const staleEnded = firstTrack.removedEndedListeners[0];

    startMicInputProbe();
    await flushPromises();
    const currentState = getMicInputProbeState();
    staleSample?.();
    staleEnded?.();

    expect(getMicInputProbeState()).toEqual(currentState);
    expect(getMicInputProbeState()).toMatchObject({ active: true, probeId: currentState.probeId });
    stopMicInputProbe('manual-stop');
  });

  it('has no TTS or shared speech-engine dependency in the mic probe module', () => {
    const source = readFileSync(
      new URL('../../src/ai/speech/micInputProbe.js', import.meta.url),
      'utf8'
    );

    expect(source).not.toContain('speechEngine');
    expect(source).not.toContain('speechSession');
    expect(source).not.toContain('voiceEngine');
    expect(source).not.toContain('createSpeechSession');
    expect(source).not.toContain('speechSynthesis');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('enumerateDevices');
    expect(source).not.toContain('.destination');
  });

  it('keeps the mic probe UI and execution path absent without explicit opt-in', () => {
    vi.useFakeTimers();
    const document = createFakeDocument();
    const environment = installEnvironment({ diagnostics: false, document });

    expect(initializeSpeechDiagnostics()).toBe(false);
    expect(startMicInputProbe()).toMatchObject({
      started: false,
      reason: 'diagnostic-disabled'
    });
    expect(document.body.children).toHaveLength(0);
    expect(environment.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('mounts explicit controls, reflects exclusivity, and cleans up on pagehide', async () => {
    vi.useFakeTimers();
    const document = createFakeDocument();
    const stream = new FakeStream();
    const environment = installEnvironment({ document, stream });

    expect(initializeSpeechDiagnostics()).toBe(true);
    await flushPromises();
    const panel = document.getElementById('jannati-speech-diagnostic-panel');
    const nativeStart = findElement(panel, 'Start Native Probe');
    const micStart = findElement(panel, 'Run Mic Input Probe');
    const micStop = findElement(panel, 'Stop Mic Probe');
    expect(panel).not.toBeNull();
    expect(nativeStart).not.toBeNull();
    expect(micStart).not.toBeNull();
    expect(micStop.disabled).toBe(true);

    nativeStart.click();
    expect(micStart.disabled).toBe(true);
    abortNativeSpeechProbe();
    FakeRawRecognition.instances[0].emitEnd();
    expect(micStart.disabled).toBe(false);

    micStart.click();
    await flushPromises();
    expect(nativeStart.disabled).toBe(true);
    expect(micStop.disabled).toBe(false);
    environment.eventListeners.get('pagehide')?.({ persisted: false });

    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(FakeAudioContext.instances[0].closeCalls).toBe(1);
    expect(getMicInputProbeState()).toMatchObject({
      status: 'completed',
      active: false,
      outcome: 'pagehide'
    });
    expect(micStop.disabled).toBe(true);
  });
});
