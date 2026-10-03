const DEFAULT_CAPTURE_DURATION_MS = 4000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_STOP_TIMEOUT_MS = 5000;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function errorName(error, fallback = 'unknown-error') {
  const name = error instanceof Error && error.name ? error.name : '';
  return name && name !== 'Error' ? name : fallback;
}

function createProbeId(now, sequence) {
  return 'media-probe-' + now.toString(36) + '-' + sequence.toString(36);
}

function safeMimeType(value) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120)
    : '';
}

export function createMediaRecorderProbeController({
  getWindow,
  getNavigator,
  isEnabled,
  isNativeProbeActive,
  isMicProbeActive,
  trace,
  onStateChange,
  captureDurationMs = DEFAULT_CAPTURE_DURATION_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  stopTimeoutMs = DEFAULT_STOP_TIMEOUT_MS,
  now = () => Date.now()
} = {}) {
  let sequence = 0;
  let activeRun = null;
  let state = {
    status: 'idle',
    probeId: '',
    active: false,
    supported: null,
    outcome: 'idle',
    elapsedMs: 0,
    durationMs: 0,
    chunkCount: 0,
    totalBytes: 0,
    mimeType: '',
    trackReadyState: '',
    trackEnabled: null,
    trackMuted: null,
    streamActive: null,
    recorderState: '',
    recorderStates: ''
  };

  function readTrackSummary(run) {
    return {
      trackReadyState: typeof run?.primaryTrack?.readyState === 'string'
        ? run.primaryTrack.readyState
        : '',
      trackEnabled: typeof run?.primaryTrack?.enabled === 'boolean'
        ? run.primaryTrack.enabled
        : null,
      trackMuted: typeof run?.primaryTrack?.muted === 'boolean'
        ? run.primaryTrack.muted
        : null,
      streamActive: typeof run?.stream?.active === 'boolean'
        ? run.stream.active
        : null
    };
  }

  function readSummary(run) {
    const elapsedMs = run ? Math.max(0, now() - run.startedAtMs) : 0;
    return {
      elapsedMs,
      durationMs: run?.recordingStartedAtMs
        ? Math.max(0, now() - run.recordingStartedAtMs)
        : 0,
      chunkCount: Math.max(0, finiteNumber(run?.chunkCount, 0)),
      totalBytes: Math.max(0, finiteNumber(run?.totalBytes, 0)),
      mimeType: safeMimeType(run?.mimeType || ''),
      ...readTrackSummary(run),
      recorderState: typeof run?.recorder?.state === 'string'
        ? run.recorder.state
        : '',
      recorderStates: Array.isArray(run?.recorderStates)
        ? run.recorderStates.join('>')
        : ''
    };
  }

  function publish(run, status, updates = {}) {
    if (run && activeRun !== run) return false;
    const summary = run ? readSummary(run) : {};
    state = {
      ...state,
      ...summary,
      ...updates,
      status,
      active: Boolean(activeRun)
    };
    onStateChange?.({ ...state });
    return true;
  }

  function record(run, event, details = {}) {
    if (!run || activeRun !== run || run.cleaned) return null;
    return trace?.(event, {
      activity: 'media-recorder-probe',
      sessionId: run.probeId,
      attempt: run.sequence,
      recognitionState: state.status,
      speechMode: 'media-recorder-probe',
      probeId: run.probeId,
      probeElapsedMs: Math.max(0, now() - run.startedAtMs),
      ...readSummary(run),
      ...details
    }) || null;
  }

  function clearTimer(run, key) {
    const timerId = run?.[key];
    if (timerId == null) return;
    getWindow?.()?.clearTimeout?.(timerId);
    run[key] = null;
  }

  function transition(run, nextState) {
    if (!run || activeRun !== run || run.cleaned) return;
    const normalized = typeof nextState === 'string' ? nextState : '';
    if (!normalized || run.recorderStates.at(-1) === normalized) return;
    run.recorderStates.push(normalized);
  }

  function stopUnclaimedStream(stream) {
    try {
      stream?.getTracks?.().forEach(track => track?.stop?.());
    } catch {
      // A late stream must never revive or mutate a completed run.
    }
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
        // Best-effort listener cleanup only.
      }
    });
    if (run) run.listeners = [];
  }

  function addListener(run, target, type, listener) {
    if (typeof target?.addEventListener === 'function') {
      target.addEventListener(type, listener);
      run.listeners.push({ target, type, listener, property: '' });
      return;
    }
    const property = 'on' + type;
    target[property] = listener;
    run.listeners.push({ target, type, listener, property });
  }

  function cleanup(run, {
    reason = 'cleanup',
    finalStatus = 'completed',
    outcome = run?.outcome || reason,
    stopRecorder = false
  } = {}) {
    if (!run || run.cleaned || activeRun !== run) return false;
    clearTimer(run, 'requestTimeoutId');
    clearTimer(run, 'captureTimerId');
    clearTimer(run, 'stopTimeoutId');
    if (stopRecorder) detachListeners(run);
    if (stopRecorder && run.recorder?.state === 'recording') {
      try {
        run.recorder.stop();
      } catch {
        // Track cleanup below remains authoritative.
      }
    }
    transition(run, run.recorder?.state || 'inactive');
    if (!stopRecorder) detachListeners(run);
    run.trackListeners.forEach(({ track, listener }) => {
      try {
        track?.removeEventListener?.('ended', listener);
      } catch {
        // Best-effort listener cleanup only.
      }
    });
    run.trackListeners = [];
    stopUnclaimedStream(run.stream);
    record(run, 'media-probe-cleanup', { reason, ...readSummary(run) });
    const finalSummary = readSummary(run);
    run.cleaned = true;
    activeRun = null;
    state = {
      ...state,
      ...finalSummary,
      status: finalStatus,
      active: false,
      supported: true,
      outcome
    };
    onStateChange?.({ ...state });
    run.stream = null;
    run.primaryTrack = null;
    run.recorder = null;
    return true;
  }

  function fail(run, error, reason = 'error') {
    if (!run || activeRun !== run || run.cleaned) return false;
    const outcome = errorName(error, reason);
    run.outcome = outcome;
    record(run, 'media-probe-error', {
      reason,
      errorCode: outcome
    });
    return cleanup(run, {
      reason,
      finalStatus: 'error',
      outcome,
      stopRecorder: true
    });
  }

  function complete(run) {
    if (!run || activeRun !== run || run.cleaned) return false;
    transition(run, run.recorder?.state || 'inactive');
    const captured = run.totalBytes > 0 && run.chunkCount > 0;
    run.outcome = captured ? 'capture-detected' : 'no-data';
    const summary = readSummary(run);
    record(run, 'media-probe-complete', summary);
    return cleanup(run, {
      reason: run.stopReason || 'duration-complete',
      finalStatus: 'completed',
      outcome: run.outcome
    });
  }

  function requestStop(run, reason = 'duration-complete') {
    if (!run || activeRun !== run || run.cleaned || run.stopRequested) return false;
    run.stopRequested = true;
    run.stopReason = reason;
    clearTimer(run, 'captureTimerId');
    record(run, 'media-probe-stop', { reason });
    publish(run, 'stopping', { outcome: 'stopping' });
    if (!run.recorder || run.recorder.state === 'inactive') {
      complete(run);
      return true;
    }
    const recorder = run.recorder;
    try {
      recorder.stop();
      if (activeRun === run && !run.cleaned) {
        transition(run, recorder.state || 'inactive');
      }
    } catch (error) {
      fail(run, error, 'stop-error');
      return false;
    }
    if (activeRun !== run || run.cleaned) return true;
    run.stopTimeoutId = getWindow?.()?.setTimeout?.(() => {
      if (activeRun !== run || run.cleaned) return;
      fail(run, new Error('TimeoutError'), 'stop-timeout');
    }, Math.max(0, finiteNumber(stopTimeoutMs, DEFAULT_STOP_TIMEOUT_MS)));
    return true;
  }

  function handleGrantedStream(run, stream) {
    if (activeRun !== run || run.cleaned) {
      stopUnclaimedStream(stream);
      return;
    }
    clearTimer(run, 'requestTimeoutId');
    run.stream = stream;
    const tracks = typeof stream?.getTracks === 'function' ? stream.getTracks() : [];
    const audioTracks = typeof stream?.getAudioTracks === 'function' ? stream.getAudioTracks() : [];
    run.primaryTrack = audioTracks[0] || tracks[0] || null;
    tracks.forEach(track => {
      const listener = () => {
        if (activeRun !== run || run.cleaned || run.stopRequested) return;
        fail(run, new Error('TrackEndedError'), 'track-ended');
      };
      try {
        track?.addEventListener?.('ended', listener);
        run.trackListeners.push({ track, listener });
      } catch {
        // Track state is still captured in metadata summaries.
      }
    });
    record(run, 'media-probe-granted');
    if (!run.primaryTrack) {
      fail(run, new Error('NoAudioTrackError'), 'no-audio-track');
      return;
    }

    const Recorder = getWindow?.()?.MediaRecorder;
    let recorder;
    try {
      recorder = new Recorder(stream);
      run.recorder = recorder;
      run.mimeType = safeMimeType(recorder?.mimeType || '');
      transition(run, recorder?.state || 'inactive');
      record(run, 'media-probe-recorder-created');
    } catch (error) {
      fail(run, error, 'recorder-create-error');
      return;
    }

    addListener(run, recorder, 'dataavailable', event => {
      if (activeRun !== run || run.cleaned) return;
      const byteLength = Math.max(0, finiteNumber(event?.data?.size, 0));
      run.chunkCount += 1;
      run.totalBytes += byteLength;
      const eventMimeType = safeMimeType(event?.data?.type || '');
      if (!run.mimeType && eventMimeType) run.mimeType = eventMimeType;
      record(run, 'media-probe-dataavailable', { byteLength });
      publish(run, state.status, { outcome: state.outcome });
    });
    addListener(run, recorder, 'stop', () => {
      if (activeRun !== run || run.cleaned) return;
      clearTimer(run, 'stopTimeoutId');
      transition(run, recorder?.state || 'inactive');
      complete(run);
    });
    addListener(run, recorder, 'error', event => {
      if (activeRun !== run || run.cleaned) return;
      fail(run, event?.error instanceof Error ? event.error : new Error('RecorderError'), 'recorder-error');
    });

    try {
      recorder.start();
      run.recordingStartedAtMs = now();
      transition(run, recorder?.state || 'recording');
      record(run, 'media-probe-start');
      publish(run, 'recording', { outcome: 'recording' });
    } catch (error) {
      fail(run, error, 'start-error');
      return;
    }

    run.captureTimerId = getWindow?.()?.setTimeout?.(
      () => requestStop(run, 'duration-complete'),
      Math.max(0, finiteNumber(captureDurationMs, DEFAULT_CAPTURE_DURATION_MS))
    );
  }

  function start() {
    if (!isEnabled?.()) {
      return { started: false, reason: 'diagnostic-disabled', state: { ...state } };
    }
    if (activeRun) {
      return { started: false, reason: 'media-probe-active', state: { ...state } };
    }
    if (isNativeProbeActive?.()) {
      return { started: false, reason: 'native-probe-active', state: { ...state } };
    }
    if (isMicProbeActive?.()) {
      return { started: false, reason: 'mic-probe-active', state: { ...state } };
    }

    const browserWindow = getWindow?.();
    const mediaDevices = getNavigator?.()?.mediaDevices;
    if (
      typeof mediaDevices?.getUserMedia !== 'function'
      || typeof browserWindow?.MediaRecorder !== 'function'
    ) {
      state = {
        ...state,
        status: 'error',
        active: false,
        supported: false,
        outcome: 'unsupported',
        elapsedMs: 0
      };
      onStateChange?.({ ...state });
      return { started: false, reason: 'unsupported', state: { ...state } };
    }

    sequence += 1;
    const startedAtMs = now();
    const run = {
      sequence,
      probeId: createProbeId(startedAtMs, sequence),
      startedAtMs,
      recordingStartedAtMs: 0,
      requestTimeoutId: null,
      captureTimerId: null,
      stopTimeoutId: null,
      stream: null,
      primaryTrack: null,
      recorder: null,
      listeners: [],
      trackListeners: [],
      recorderStates: [],
      chunkCount: 0,
      totalBytes: 0,
      mimeType: '',
      stopRequested: false,
      stopReason: '',
      cleaned: false,
      outcome: 'requesting'
    };
    activeRun = run;
    state = {
      ...state,
      status: 'requesting',
      probeId: run.probeId,
      active: true,
      supported: true,
      outcome: 'requesting',
      elapsedMs: 0,
      durationMs: 0,
      chunkCount: 0,
      totalBytes: 0,
      mimeType: '',
      trackReadyState: '',
      trackEnabled: null,
      trackMuted: null,
      streamActive: null,
      recorderState: '',
      recorderStates: ''
    };
    onStateChange?.({ ...state });
    record(run, 'media-probe-request');

    run.requestTimeoutId = browserWindow.setTimeout(() => {
      if (activeRun !== run || run.cleaned) return;
      fail(run, new Error('TimeoutError'), 'request-timeout');
    }, Math.max(0, finiteNumber(requestTimeoutMs, DEFAULT_REQUEST_TIMEOUT_MS)));

    let request;
    try {
      request = mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      fail(run, error, 'request-error');
      return { started: false, reason: errorName(error, 'request-error'), state: { ...state } };
    }
    Promise.resolve(request).then(
      stream => handleGrantedStream(run, stream),
      error => fail(run, error, 'request-error')
    );
    return { started: true, reason: '', state: { ...state } };
  }

  function stop(reason = 'manual-stop', { immediate = false } = {}) {
    const run = activeRun;
    if (!run || run.cleaned) return false;
    if (immediate || !run.recorder || run.recorder.state !== 'recording') {
      record(run, 'media-probe-stop', { reason });
      return cleanup(run, {
        reason,
        finalStatus: 'completed',
        outcome: reason,
        stopRecorder: true
      });
    }
    return requestStop(run, reason);
  }

  function getState() {
    return { ...state };
  }

  return {
    getState,
    start,
    stop
  };
}

export const MEDIA_RECORDER_PROBE_CAPTURE_DURATION_MS = DEFAULT_CAPTURE_DURATION_MS;
export const MEDIA_RECORDER_PROBE_REQUEST_TIMEOUT_MS = DEFAULT_REQUEST_TIMEOUT_MS;
export const MEDIA_RECORDER_PROBE_STOP_TIMEOUT_MS = DEFAULT_STOP_TIMEOUT_MS;

export default {
  createMediaRecorderProbeController,
  MEDIA_RECORDER_PROBE_CAPTURE_DURATION_MS,
  MEDIA_RECORDER_PROBE_REQUEST_TIMEOUT_MS,
  MEDIA_RECORDER_PROBE_STOP_TIMEOUT_MS
};
