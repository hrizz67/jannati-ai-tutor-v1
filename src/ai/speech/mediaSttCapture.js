const READING_MAX_DURATION_MS = 20000;
const SPEAKING_MAX_DURATION_MS = 25000;
const DEFAULT_CAPTURE_DURATION_MS = READING_MAX_DURATION_MS;
const MIN_CAPTURE_DURATION_MS = 4000;
const MAX_CAPTURE_DURATION_MS = SPEAKING_MAX_DURATION_MS;
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_STOP_TIMEOUT_MS = 3000;

const IOS_AUDIO_MIME_TYPE = 'audio/mp4;codecs=mp4a.40.2';
const AUDIO_MIME_CANDIDATES = Object.freeze([
  IOS_AUDIO_MIME_TYPE,
  'audio/mp4',
  'audio/webm;codecs=opus',
  'audio/webm'
]);

export const MEDIA_STT_ERROR_CODES = Object.freeze([
  'unsupported',
  'permission-denied',
  'capture-timeout',
  'no-audio',
  'no-speech',
  'stt-unavailable',
  'stt-timeout',
  'stt-rate-limited',
  'stt-error',
  'cancelled'
]);

const VALID_ERROR_CODES = new Set(MEDIA_STT_ERROR_CODES);

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedDuration(value) {
  return Math.min(
    MAX_CAPTURE_DURATION_MS,
    Math.max(MIN_CAPTURE_DURATION_MS, finiteNumber(value, DEFAULT_CAPTURE_DURATION_MS))
  );
}

function safeMimeType(value) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 160)
    : '';
}

export class MediaSttError extends Error {
  constructor(code = 'stt-error', reason = '') {
    const normalizedCode = VALID_ERROR_CODES.has(code) ? code : 'stt-error';
    super(normalizedCode);
    this.name = 'MediaSttError';
    this.code = normalizedCode;
    this.reason = typeof reason === 'string' ? reason.slice(0, 80) : '';
  }
}

export function normalizeMediaSttError(error, fallback = 'stt-error') {
  if (error instanceof MediaSttError) return error;
  const name = typeof error?.name === 'string' ? error.name : '';
  if (name === 'AbortError') return new MediaSttError('cancelled', 'abort-signal');
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new MediaSttError('permission-denied', name);
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return new MediaSttError('no-audio', name);
  }
  return new MediaSttError(VALID_ERROR_CODES.has(fallback) ? fallback : 'stt-error', name);
}

export function selectMediaRecorderMimeType(Recorder) {
  if (typeof Recorder?.isTypeSupported !== 'function') return '';
  return AUDIO_MIME_CANDIDATES.find(candidate => {
    try {
      return Recorder.isTypeSupported(candidate);
    } catch {
      return false;
    }
  }) || '';
}

export function supportsMediaSttCapture({ getWindow, getNavigator } = {}) {
  const browserWindow = getWindow?.() || (typeof window !== 'undefined' ? window : null);
  const browserNavigator = getNavigator?.() || (typeof navigator !== 'undefined' ? navigator : null);
  return typeof browserNavigator?.mediaDevices?.getUserMedia === 'function'
    && typeof browserWindow?.MediaRecorder === 'function';
}

export function createMediaSttCaptureController({
  getWindow = () => typeof window !== 'undefined' ? window : null,
  getNavigator = () => typeof navigator !== 'undefined' ? navigator : null,
  captureDurationMs = DEFAULT_CAPTURE_DURATION_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  stopTimeoutMs = DEFAULT_STOP_TIMEOUT_MS,
  now = () => Date.now(),
  onStateChange = null
} = {}) {
  let activeRun = null;
  let sequence = 0;
  const stoppedTracks = new WeakSet();
  let state = {
    status: 'ready',
    active: false,
    sequence: 0,
    mimeType: '',
    durationMs: 0,
    totalBytes: 0,
    chunkCount: 0,
    errorCode: ''
  };

  function publish(run, status, updates = {}) {
    if (run && activeRun !== run) return false;
    state = {
      ...state,
      ...updates,
      status,
      active: Boolean(activeRun)
    };
    onStateChange?.({ ...state });
    return true;
  }

  function clearTimer(run, key) {
    if (run?.[key] == null) return;
    getWindow()?.clearTimeout?.(run[key]);
    run[key] = null;
  }

  function stopTracks(stream) {
    let tracks = [];
    try {
      tracks = typeof stream?.getTracks === 'function' ? stream.getTracks() : [];
    } catch {
      tracks = [];
    }
    tracks.forEach(track => {
      if (!track || stoppedTracks.has(track)) return;
      stoppedTracks.add(track);
      try {
        track.stop?.();
      } catch {
        // Track release is best effort and must not mask the primary outcome.
      }
    });
  }

  function addListener(run, target, type, listener) {
    if (!target) return;
    if (typeof target.addEventListener === 'function') {
      target.addEventListener(type, listener);
      run.listeners.push({ target, type, listener, property: '' });
      return;
    }
    const property = 'on' + type;
    target[property] = listener;
    run.listeners.push({ target, type, listener, property });
  }

  function detachListeners(run) {
    run?.listeners?.forEach(({ target, type, listener, property }) => {
      try {
        if (typeof target?.removeEventListener === 'function') {
          target.removeEventListener(type, listener);
        } else if (property && target?.[property] === listener) {
          target[property] = null;
        }
      } catch {
        // Listener cleanup is best effort.
      }
    });
    if (run) run.listeners = [];
  }

  function release(run, { stopRecorder = false } = {}) {
    if (!run || run.cleaned) return;
    run.cleaned = true;
    clearTimer(run, 'requestTimeoutId');
    clearTimer(run, 'captureTimerId');
    clearTimer(run, 'stopTimeoutId');
    detachListeners(run);
    if (run.abortSignal && run.abortListener) {
      run.abortSignal.removeEventListener?.('abort', run.abortListener);
    }
    if (stopRecorder && run.recorder?.state === 'recording') {
      try {
        run.recorder.stop();
      } catch {
        // Track release below is authoritative.
      }
    }
    stopTracks(run.stream);
    run.stream = null;
    run.recorder = null;
    run.chunks = [];
  }

  function rejectRun(run, error, { stopRecorder = true } = {}) {
    if (!run || activeRun !== run || run.settled) return false;
    const normalized = normalizeMediaSttError(error);
    run.settled = true;
    release(run, { stopRecorder });
    activeRun = null;
    publish(null, 'error', {
      sequence: run.sequence,
      errorCode: normalized.code,
      durationMs: Math.max(0, now() - (run.recordingStartedAtMs || run.startedAtMs)),
      totalBytes: run.totalBytes,
      chunkCount: run.chunkCount,
      mimeType: run.mimeType
    });
    run.reject(normalized);
    return true;
  }

  function resolveRun(run) {
    if (!run || activeRun !== run || run.settled) return false;
    clearTimer(run, 'stopTimeoutId');
    const BlobConstructor = getWindow()?.Blob || globalThis.Blob;
    const mimeType = safeMimeType(run.mimeType || run.chunks.find(chunk => chunk?.type)?.type || '');
    let blob;
    try {
      blob = new BlobConstructor(run.chunks, mimeType ? { type: mimeType } : undefined);
    } catch (error) {
      return rejectRun(run, error);
    }
    const durationMs = Math.max(
      0,
      (run.stoppedAtMs || now()) - (run.recordingStartedAtMs || run.startedAtMs)
    );
    if (!blob || blob.size <= 0 || run.totalBytes <= 0) {
      return rejectRun(run, new MediaSttError('no-audio', 'empty-capture'), { stopRecorder: false });
    }
    run.settled = true;
    release(run);
    activeRun = null;
    const resolvedMimeType = safeMimeType(blob.type || mimeType);
    publish(null, 'ready', {
      sequence: run.sequence,
      errorCode: '',
      durationMs,
      totalBytes: blob.size,
      chunkCount: run.chunkCount,
      mimeType: resolvedMimeType
    });
    run.resolve({
      blob,
      mimeType: resolvedMimeType,
      durationMs,
      captureDurationMs: run.captureDurationMs,
      stopReason: run.stopReason,
      size: blob.size
    });
    return true;
  }

  function requestStop(run, reason = 'duration-complete') {
    if (!run || activeRun !== run || run.settled) return false;
    if (run.stopRequested) return true;
    run.stopRequested = true;
    run.stopReason = reason;
    run.stoppedAtMs = now();
    clearTimer(run, 'captureTimerId');
    publish(run, 'stopping', { durationMs: Math.max(0, now() - run.recordingStartedAtMs) });
    if (!run.recorder || run.recorder.state === 'inactive') return resolveRun(run);
    try {
      run.recorder.stop();
    } catch (error) {
      return rejectRun(run, normalizeMediaSttError(error, 'stt-error'));
    }
    if (activeRun !== run || run.settled) return true;
    run.stopTimeoutId = getWindow()?.setTimeout?.(() => {
      rejectRun(run, new MediaSttError('capture-timeout', 'recorder-stop-timeout'));
    }, Math.max(0, finiteNumber(stopTimeoutMs, DEFAULT_STOP_TIMEOUT_MS)));
    return true;
  }

  function handleStream(run, stream) {
    if (activeRun !== run || run.settled) {
      stopTracks(stream);
      return;
    }
    clearTimer(run, 'requestTimeoutId');
    run.stream = stream;
    const audioTracks = typeof stream?.getAudioTracks === 'function' ? stream.getAudioTracks() : [];
    if (!audioTracks.length) {
      rejectRun(run, new MediaSttError('no-audio', 'no-audio-track'));
      return;
    }
    audioTracks.forEach(track => addListener(run, track, 'ended', () => {
      if (activeRun === run && !run.settled && !run.stopRequested) {
        rejectRun(run, new MediaSttError('no-audio', 'audio-track-ended'));
      }
    }));

    const Recorder = getWindow()?.MediaRecorder;
    const requestedMimeType = selectMediaRecorderMimeType(Recorder);
    try {
      run.recorder = requestedMimeType
        ? new Recorder(stream, { mimeType: requestedMimeType })
        : new Recorder(stream);
      run.mimeType = safeMimeType(run.recorder?.mimeType || requestedMimeType);
    } catch (error) {
      rejectRun(run, normalizeMediaSttError(error, 'stt-error'));
      return;
    }

    addListener(run, run.recorder, 'dataavailable', event => {
      if (activeRun !== run || run.settled) return;
      const chunk = event?.data;
      if (!chunk || finiteNumber(chunk.size, 0) <= 0) return;
      run.chunks.push(chunk);
      run.chunkCount += 1;
      run.totalBytes += Math.max(0, finiteNumber(chunk.size, 0));
      if (!run.mimeType) run.mimeType = safeMimeType(chunk.type || '');
      publish(run, state.status, {
        totalBytes: run.totalBytes,
        chunkCount: run.chunkCount,
        mimeType: run.mimeType
      });
    });
    addListener(run, run.recorder, 'stop', () => resolveRun(run));
    addListener(run, run.recorder, 'error', event => {
      rejectRun(run, normalizeMediaSttError(event?.error, 'stt-error'));
    });

    try {
      run.recorder.start();
    } catch (error) {
      rejectRun(run, normalizeMediaSttError(error, 'stt-error'));
      return;
    }
    run.recordingStartedAtMs = now();
    publish(run, 'recording', { mimeType: run.mimeType });
    run.captureTimerId = getWindow()?.setTimeout?.(
      () => requestStop(run),
      run.captureDurationMs
    );
  }

  function capture({ durationMs = captureDurationMs, signal } = {}) {
    if (activeRun) {
      return Promise.reject(new MediaSttError('stt-error', 'capture-active'));
    }
    if (!supportsMediaSttCapture({ getWindow, getNavigator })) {
      publish(null, 'error', { errorCode: 'unsupported' });
      return Promise.reject(new MediaSttError('unsupported'));
    }
    if (signal?.aborted) {
      return Promise.reject(new MediaSttError('cancelled', 'abort-signal'));
    }

    return new Promise((resolve, reject) => {
      sequence += 1;
      const run = {
        sequence,
        startedAtMs: now(),
        recordingStartedAtMs: 0,
        stoppedAtMs: 0,
        captureDurationMs: boundedDuration(durationMs),
        requestTimeoutId: null,
        captureTimerId: null,
        stopTimeoutId: null,
        stream: null,
        recorder: null,
        listeners: [],
        chunks: [],
        chunkCount: 0,
        totalBytes: 0,
        mimeType: '',
        stopRequested: false,
        stopReason: '',
        settled: false,
        cleaned: false,
        abortSignal: signal || null,
        abortListener: null,
        resolve,
        reject
      };
      activeRun = run;
      publish(run, 'requesting', {
        sequence,
        errorCode: '',
        durationMs: 0,
        totalBytes: 0,
        chunkCount: 0,
        mimeType: ''
      });

      run.abortListener = () => rejectRun(run, new MediaSttError('cancelled', 'abort-signal'));
      signal?.addEventListener?.('abort', run.abortListener, { once: true });
      addListener(run, getWindow(), 'pagehide', () => {
        rejectRun(run, new MediaSttError('cancelled', 'pagehide'));
      });
      run.requestTimeoutId = getWindow()?.setTimeout?.(() => {
        rejectRun(run, new MediaSttError('capture-timeout', 'media-request-timeout'));
      }, Math.max(0, finiteNumber(requestTimeoutMs, DEFAULT_REQUEST_TIMEOUT_MS)));

      let request;
      try {
        request = getNavigator().mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        rejectRun(run, normalizeMediaSttError(error));
        return;
      }
      Promise.resolve(request).then(
        stream => handleStream(run, stream),
        error => rejectRun(run, normalizeMediaSttError(error))
      );
    });
  }

  function stop(reason = 'manual-stop') {
    if (!activeRun) return false;
    return requestStop(activeRun, reason);
  }

  function cancel(reason = 'manual-cancel') {
    if (!activeRun) return false;
    return rejectRun(activeRun, new MediaSttError('cancelled', reason));
  }

  return {
    capture,
    start: capture,
    stop,
    cancel,
    getState: () => ({ ...state })
  };
}

export const MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS = DEFAULT_CAPTURE_DURATION_MS;
export const MEDIA_STT_CAPTURE_MIN_DURATION_MS = MIN_CAPTURE_DURATION_MS;
export const MEDIA_STT_CAPTURE_MAX_DURATION_MS = MAX_CAPTURE_DURATION_MS;
export const MEDIA_STT_READING_MAX_DURATION_MS = READING_MAX_DURATION_MS;
export const MEDIA_STT_SPEAKING_MAX_DURATION_MS = SPEAKING_MAX_DURATION_MS;
export const MEDIA_STT_IOS_MIME_TYPE = IOS_AUDIO_MIME_TYPE;

export default {
  createMediaSttCaptureController,
  MEDIA_STT_CAPTURE_DEFAULT_DURATION_MS,
  MEDIA_STT_CAPTURE_MIN_DURATION_MS,
  MEDIA_STT_CAPTURE_MAX_DURATION_MS,
  MEDIA_STT_READING_MAX_DURATION_MS,
  MEDIA_STT_SPEAKING_MAX_DURATION_MS,
  MEDIA_STT_ERROR_CODES,
  MEDIA_STT_IOS_MIME_TYPE,
  MediaSttError,
  normalizeMediaSttError,
  selectMediaRecorderMimeType,
  supportsMediaSttCapture
};
