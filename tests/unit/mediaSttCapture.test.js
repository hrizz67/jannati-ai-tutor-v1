import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMediaSttCaptureController,
  MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS,
  MEDIA_STT_CAPTURE_MAX_DURATION_MS,
  MEDIA_STT_CAPTURE_MIN_DURATION_MS,
  MEDIA_STT_READING_MAX_DURATION_MS,
  MEDIA_STT_SPEAKING_MAX_DURATION_MS,
  selectMediaRecorderMimeType
} from '../../src/ai/speech/mediaSttCapture.js';

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
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

class FakeTrack extends FakeEventTarget {
  constructor(name = 'track') {
    super();
    this.kind = 'audio';
    this.id = 'SECRET-ID-' + name;
    this.label = 'SECRET-LABEL-' + name;
    this.stopCalls = 0;
  }

  stop() {
    this.stopCalls += 1;
  }
}

class FakeStream {
  constructor(name = 'stream', tracks = [new FakeTrack(name)]) {
    this.name = name;
    this.tracks = tracks;
  }

  getTracks() { return this.tracks; }
  getAudioTracks() { return this.tracks.filter(track => track.kind === 'audio'); }
}

class FakeMediaRecorder extends FakeEventTarget {
  static instances = [];
  static chunks = [new Blob(['audio'], { type: 'audio/mp4;codecs=mp4a.40.2' })];
  static throwOnConstruct = false;
  static throwOnStart = false;
  static throwOnStop = false;
  static autoStopEvent = true;

  static reset() {
    FakeMediaRecorder.instances = [];
    FakeMediaRecorder.chunks = [new Blob(['audio'], { type: 'audio/mp4;codecs=mp4a.40.2' })];
    FakeMediaRecorder.throwOnConstruct = false;
    FakeMediaRecorder.throwOnStart = false;
    FakeMediaRecorder.throwOnStop = false;
    FakeMediaRecorder.autoStopEvent = true;
  }

  static isTypeSupported(value) {
    return value === 'audio/mp4;codecs=mp4a.40.2' || value === 'audio/mp4';
  }

  constructor(stream, options = {}) {
    super();
    if (FakeMediaRecorder.throwOnConstruct) throw new DOMException('private', 'NotSupportedError');
    this.stream = stream;
    this.options = options;
    this.mimeType = options.mimeType || 'audio/mp4';
    this.state = 'inactive';
    this.startCalls = 0;
    this.stopCalls = 0;
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    if (FakeMediaRecorder.throwOnStart) throw new DOMException('private', 'NotSupportedError');
    this.state = 'recording';
  }

  stop() {
    this.stopCalls += 1;
    if (FakeMediaRecorder.throwOnStop) throw new DOMException('private', 'InvalidStateError');
    this.state = 'inactive';
    if (!FakeMediaRecorder.autoStopEvent) return;
    this.deliverStop();
  }

  deliverStop() {
    FakeMediaRecorder.chunks.forEach(data => this.emit('dataavailable', { data }));
    this.emit('stop');
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

function installEnvironment({ streams = [new FakeStream()], getUserMedia, recorder = FakeMediaRecorder } = {}) {
  FakeMediaRecorder.reset();
  const browserWindow = new FakeEventTarget();
  Object.assign(browserWindow, {
    Blob,
    MediaRecorder: recorder,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout
  });
  const queue = [...streams];
  const mediaDevices = {
    getUserMedia: getUserMedia || vi.fn(() => Promise.resolve(queue.shift()))
  };
  globalThis.window = browserWindow;
  vi.stubGlobal('navigator', { mediaDevices });
  const controller = createMediaSttCaptureController({
    getWindow: () => browserWindow,
    getNavigator: () => globalThis.navigator
  });
  return { browserWindow, controller, mediaDevices };
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe('P1.9 reusable MediaRecorder capture controller', () => {
  it('captures a non-empty in-memory Blob, preserves iPhone MIME codecs and releases tracks', async () => {
    vi.useFakeTimers();
    const stream = new FakeStream('success');
    const { controller, mediaDevices } = installEnvironment({ streams: [stream] });

    const capture = controller.capture();
    await flush();
    expect(controller.getState()).toMatchObject({ status: 'recording', active: true });
    vi.advanceTimersByTime(MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS);
    const result = await capture;

    expect(mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.mimeType).toBe('audio/mp4;codecs=mp4a.40.2');
    expect(result.durationMs).toBe(MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS);
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(FakeMediaRecorder.instances[0].options).toEqual({ mimeType: 'audio/mp4;codecs=mp4a.40.2' });
    expect(controller.getState()).toMatchObject({ status: 'ready', active: false, errorCode: '' });
  });

  it('reports empty capture, permission denial and unsupported capability with public errors', async () => {
    vi.useFakeTimers();
    const emptyEnvironment = installEnvironment();
    FakeMediaRecorder.chunks = [];
    const emptyCapture = emptyEnvironment.controller.capture();
    await flush();
    vi.advanceTimersByTime(MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS);
    await expect(emptyCapture).rejects.toMatchObject({ code: 'no-audio' });

    const denial = new DOMException('SECRET denial detail', 'NotAllowedError');
    const deniedEnvironment = installEnvironment({ getUserMedia: vi.fn(() => Promise.reject(denial)) });
    await expect(deniedEnvironment.controller.capture()).rejects.toMatchObject({ code: 'permission-denied' });

    const unsupportedEnvironment = installEnvironment({ recorder: null });
    await expect(unsupportedEnvironment.controller.capture()).rejects.toMatchObject({ code: 'unsupported' });
    expect(unsupportedEnvironment.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it.each([
    ['construct', 'throwOnConstruct'],
    ['start', 'throwOnStart'],
    ['stop', 'throwOnStop']
  ])('cleans up on recorder %s errors', async (_phase, flag) => {
    vi.useFakeTimers();
    const stream = new FakeStream(flag);
    const { controller } = installEnvironment({ streams: [stream] });
    FakeMediaRecorder[flag] = true;
    const capture = controller.capture();
    await flush();
    if (_phase === 'stop') vi.advanceTimersByTime(MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS);
    await expect(capture).rejects.toMatchObject({ code: 'stt-error' });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
  });

  it('times out a pending request and stops a late stream without reviving stale state', async () => {
    vi.useFakeTimers();
    const request = deferred();
    const { controller } = installEnvironment({ getUserMedia: vi.fn(() => request.promise) });
    const capture = controller.capture();
    vi.advanceTimersByTime(10000);
    await expect(capture).rejects.toMatchObject({ code: 'capture-timeout' });
    const lateStream = new FakeStream('late');
    request.resolve(lateStream);
    await flush();
    expect(lateStream.getTracks()[0].stopCalls).toBe(1);
    expect(controller.getState()).toMatchObject({ active: false, errorCode: 'capture-timeout' });
  });

  it.each([
    ['manual cancel', ({ controller }) => controller.cancel('manual-cancel')],
    ['pagehide', ({ browserWindow }) => browserWindow.emit('pagehide')],
    ['component unmount', ({ controller }) => controller.cancel('component-unmount')]
  ])('cleans an active capture on %s', async (_label, action) => {
    vi.useFakeTimers();
    const stream = new FakeStream(_label);
    const environment = installEnvironment({ streams: [stream] });
    const capture = environment.controller.capture();
    await flush();
    expect(action(environment)).not.toBe(false);
    await expect(capture).rejects.toMatchObject({ code: 'cancelled' });
    expect(stream.getTracks()[0].stopCalls).toBe(1);
    expect(environment.controller.getState()).toMatchObject({ active: false });
  });

  it('uses fresh streams and recorders for Q1, Q2 and Q3 and ignores stale callbacks', async () => {
    vi.useFakeTimers();
    const streams = [1, 2, 3].map(index => new FakeStream('fresh-' + index));
    const environment = installEnvironment({ streams });
    let staleDataListener = null;

    for (let index = 0; index < 3; index += 1) {
      const capture = environment.controller.capture();
      await flush();
      const recorder = FakeMediaRecorder.instances[index];
      if (index === 0) staleDataListener = [...recorder.listeners.get('dataavailable')][0];
      vi.advanceTimersByTime(MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS);
      await capture;
      if (index === 1) {
        const state = environment.controller.getState();
        staleDataListener?.({ data: new Blob(['SECRET AUDIO'], { type: 'audio/secret' }) });
        expect(environment.controller.getState()).toEqual(state);
      }
    }

    expect(FakeMediaRecorder.instances).toHaveLength(3);
    expect(environment.mediaDevices.getUserMedia).toHaveBeenCalledTimes(3);
    expect(new Set(FakeMediaRecorder.instances.map(item => item.stream)).size).toBe(3);
    expect(streams.map(stream => stream.getTracks()[0].stopCalls)).toEqual([1, 1, 1]);
  });

  it('makes stop idempotent and measures duration at stop request rather than delayed stop delivery', async () => {
    vi.useFakeTimers();
    const { controller } = installEnvironment();
    FakeMediaRecorder.autoStopEvent = false;
    const capture = controller.capture({ durationMs: 99999 });
    await flush();
    vi.advanceTimersByTime(MEDIA_STT_CAPTURE_MAX_DURATION_MS);
    const recorder = FakeMediaRecorder.instances[0];
    expect(controller.stop('duplicate-stop')).toBe(true);
    expect(controller.stop('duplicate-stop')).toBe(true);
    expect(recorder.stopCalls).toBe(1);
    vi.advanceTimersByTime(1000);
    recorder.deliverStop();
    const result = await capture;
    expect(result.durationMs).toBe(MEDIA_STT_CAPTURE_MAX_DURATION_MS);
    expect(MEDIA_STT_CAPTURE_MIN_DURATION_MS).toBe(4000);
  });

  it.each([
    ['reading', MEDIA_STT_READING_MAX_DURATION_MS, 12000],
    ['speaking', MEDIA_STT_SPEAKING_MAX_DURATION_MS, 14000]
  ])('%s manual stop returns the real duration below its hard maximum', async (_activity, maximumMs, stopAtMs) => {
    vi.useFakeTimers();
    const { controller } = installEnvironment();
    const capture = controller.capture({ durationMs: maximumMs });
    await flush();
    vi.advanceTimersByTime(stopAtMs);
    expect(controller.stop('manual-stop')).toBe(true);
    await expect(capture).resolves.toMatchObject({ durationMs: stopAtMs });
    expect(FakeMediaRecorder.instances[0].stopCalls).toBe(1);
  });

  it.each([
    ['reading', MEDIA_STT_READING_MAX_DURATION_MS],
    ['speaking', MEDIA_STT_SPEAKING_MAX_DURATION_MS]
  ])('%s auto-stops exactly at its hard maximum', async (_activity, maximumMs) => {
    vi.useFakeTimers();
    const { controller } = installEnvironment();
    const capture = controller.capture({ durationMs: maximumMs });
    await flush();
    vi.advanceTimersByTime(maximumMs - 1);
    expect(controller.getState()).toMatchObject({ status: 'recording', active: true });
    vi.advanceTimersByTime(1);
    await expect(capture).resolves.toMatchObject({ durationMs: maximumMs });
    expect(FakeMediaRecorder.instances[0].stopCalls).toBe(1);
  });

  it('clamps configurable automatic capture below the four-second minimum', async () => {
    vi.useFakeTimers();
    const { controller } = installEnvironment();
    const capture = controller.capture({ durationMs: 1 });
    await flush();
    vi.advanceTimersByTime(3999);
    expect(controller.getState()).toMatchObject({ status: 'recording', active: true });
    vi.advanceTimersByTime(1);
    await expect(capture).resolves.toMatchObject({ durationMs: 4000 });
  });

  it('prefers the iPhone audio/mp4 codec and has no forbidden speech, storage or transport dependency', () => {
    expect(selectMediaRecorderMimeType(FakeMediaRecorder)).toBe('audio/mp4;codecs=mp4a.40.2');
    const source = readFileSync(new URL('../../src/ai/speech/mediaSttCapture.js', import.meta.url), 'utf8');
    [
      'SpeechRecognition',
      'speechSynthesis',
      'voiceEngine',
      'speechEngine',
      'speechSession',
      'localStorage',
      'sessionStorage',
      'fetch(',
      'XMLHttpRequest',
      'createObjectURL',
      'enumerateDevices'
    ].forEach(forbidden => expect(source).not.toContain(forbidden));
  });
});
