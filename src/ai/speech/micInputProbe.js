const DEFAULT_SAMPLE_DURATION_MS = 4000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;
const DEFAULT_SAMPLE_INTERVAL_MS = 50;
const DEFAULT_ACTIVITY_THRESHOLD = 0.02;

function createProbeId(now, sequence) {
  return 'mic-probe-' + now.toString(36) + '-' + sequence.toString(36);
}

function errorName(error, fallback = 'unknown-error') {
  return error instanceof Error && error.name && error.name !== 'Error'
    ? error.name
    : fallback;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizedLevel(value) {
  return Math.round(Math.max(0, Math.min(1, finiteNumber(value))) * 1000000) / 1000000;
}

function percentage(value) {
  return Math.round(Math.max(0, Math.min(100, finiteNumber(value))) * 100) / 100;
}

function readTrackSummary(run) {
  const track = run.primaryTrack;
  return {
    streamActive: typeof run.stream?.active === 'boolean' ? run.stream.active : null,
    trackReadyState: typeof track?.readyState === 'string' ? track.readyState : '',
    trackEnabled: typeof track?.enabled === 'boolean' ? track.enabled : null,
    trackMuted: typeof track?.muted === 'boolean' ? track.muted : null
  };
}

function readSignalSummary(run) {
  const sampleCount = Math.max(0, run.sampleCount || 0);
  const activitySampleCount = Math.max(0, run.activitySampleCount || 0);
  return {
    sampleCount,
    peakLevel: sampleCount > 0 ? normalizedLevel(run.peakLevel) : null,
    averageRms: sampleCount > 0 ? normalizedLevel(run.rmsTotal / sampleCount) : null,
    activitySampleCount,
    activityPercentage: sampleCount > 0
      ? percentage((activitySampleCount / sampleCount) * 100)
      : null,
    activityThreshold: normalizedLevel(run.activityThreshold),
    audioContextState: typeof run.audioContext?.state === 'string'
      ? run.audioContext.state
      : '',
    contextAvailable: Boolean(run.audioContext),
    captureOnly: Boolean(run.captureOnly),
    ...readTrackSummary(run)
  };
}

function stopUnclaimedStream(stream) {
  try {
    const tracks = typeof stream?.getTracks === 'function' ? stream.getTracks() : [];
    tracks.forEach(track => {
      try {
        track?.stop?.();
      } catch {
        // A late stream must still release every other track best-effort.
      }
    });
  } catch {
    // No diagnostic data is emitted for a stale, already superseded request.
  }
}

export function createMicInputProbeController({
  getWindow,
  getNavigator,
  isEnabled,
  isNativeProbeActive,
  isMediaProbeActive,
  trace,
  onStateChange,
  sampleDurationMs = DEFAULT_SAMPLE_DURATION_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  sampleIntervalMs = DEFAULT_SAMPLE_INTERVAL_MS,
  activityThreshold = DEFAULT_ACTIVITY_THRESHOLD,
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
    sampleCount: 0,
    peakLevel: null,
    averageRms: null,
    activitySampleCount: 0,
    activityPercentage: null,
    activityThreshold: normalizedLevel(activityThreshold),
    trackReadyState: '',
    trackEnabled: null,
    trackMuted: null,
    streamActive: null,
    audioContextState: '',
    contextAvailable: null,
    captureOnly: false
  };

  function publish(run, status, updates = {}) {
    if (run && activeRun !== run) return false;
    state = {
      ...state,
      ...updates,
      status,
      elapsedMs: run
        ? Math.max(0, now() - run.startedAtMs)
        : Math.max(0, finiteNumber(updates.elapsedMs, state.elapsedMs)),
      active: Boolean(activeRun)
    };
    onStateChange?.({ ...state });
    return true;
  }

  function record(run, event, details = {}) {
    if (!run || activeRun !== run) return null;
    return trace?.(event, {
      activity: 'mic-input-probe',
      sessionId: run.probeId,
      attempt: 1,
      recognitionState: state.status,
      speechMode: 'native-probe',
      probeId: run.probeId,
      probeElapsedMs: Math.max(0, now() - run.startedAtMs),
      ...details
    }) || null;
  }

  function clearTimer(run, key) {
    const timerId = run?.[key];
    if (timerId == null) return;
    getWindow?.()?.clearTimeout?.(timerId);
    run[key] = null;
  }

  function closeAudioContext(run) {
    const audioContext = run.audioContext;
    if (!audioContext || typeof audioContext.close !== 'function') return;
    try {
      const closing = audioContext.close();
      Promise.resolve(closing).catch(() => {
        // Cleanup is best-effort and must not resurrect a completed probe.
      });
    } catch (error) {
      record(run, 'mic-probe-error', { errorCode: errorName(error, 'close-error') });
    }
  }

  function cleanup(run, {
    reason,
    finalStatus = 'completed',
    outcome = reason || 'completed'
  } = {}) {
    if (!run || activeRun !== run || run.cleaned) return false;
    run.cleaned = true;
    run.outcome = outcome;
    clearTimer(run, 'requestTimeoutId');
    clearTimer(run, 'sampleTimerId');
    clearTimer(run, 'captureOnlyTimerId');

    run.trackListeners.forEach(({ track, listener }) => {
      try {
        track?.removeEventListener?.('ended', listener);
      } catch {
        // Continue cleanup for remaining resources.
      }
    });
    run.trackListeners = [];

    try {
      run.source?.disconnect?.();
    } catch {
      // The graph has no destination and can be released independently.
    }
    try {
      run.analyser?.disconnect?.();
    } catch {
      // The graph has no destination and can be released independently.
    }

    const tracks = run.stream && typeof run.stream.getTracks === 'function'
      ? run.stream.getTracks()
      : [];
    tracks.forEach(track => {
      try {
        track?.stop?.();
      } catch (error) {
        record(run, 'mic-probe-error', { errorCode: errorName(error, 'track-stop-error') });
      }
    });
    record(run, 'mic-probe-stop', {
      reason: reason || 'cleanup',
      ...readTrackSummary(run)
    });

    closeAudioContext(run);
    const summary = readSignalSummary(run);
    record(run, 'mic-probe-cleanup', {
      reason: reason || 'cleanup',
      ...summary
    });

    const elapsedMs = Math.max(0, now() - run.startedAtMs);
    activeRun = null;
    publish(null, finalStatus, {
      probeId: run.probeId,
      active: false,
      supported: true,
      outcome,
      elapsedMs,
      ...summary
    });
    return true;
  }

  function fail(run, error, fallback) {
    if (!run || activeRun !== run) return false;
    const code = errorName(error, fallback);
    record(run, 'mic-probe-error', { errorCode: code });
    publish(run, 'error', { outcome: code });
    return cleanup(run, { reason: code, finalStatus: 'error', outcome: code });
  }

  function finishSampling(run) {
    if (!run || activeRun !== run || run.cleaned) return;
    const summary = readSignalSummary(run);
    const detected = summary.activitySampleCount > 0;
    const outcome = detected ? 'signal-detected' : 'no-signal';
    record(run, 'mic-probe-sample-summary', summary);
    publish(run, outcome, { outcome, ...summary });
    cleanup(run, { reason: 'sampling-complete', finalStatus: 'completed', outcome });
  }

  function sample(run) {
    if (!run || activeRun !== run || run.cleaned) return;
    try {
      if (run.floatBuffer && typeof run.analyser?.getFloatTimeDomainData === 'function') {
        run.analyser.getFloatTimeDomainData(run.floatBuffer);
        let squareTotal = 0;
        let peak = 0;
        for (let index = 0; index < run.floatBuffer.length; index += 1) {
          const magnitude = Math.min(1, Math.abs(finiteNumber(run.floatBuffer[index])));
          peak = Math.max(peak, magnitude);
          squareTotal += magnitude * magnitude;
        }
        const rms = run.floatBuffer.length > 0
          ? Math.sqrt(squareTotal / run.floatBuffer.length)
          : 0;
        run.sampleCount += 1;
        run.peakLevel = Math.max(run.peakLevel, peak);
        run.rmsTotal += rms;
        if (rms >= run.activityThreshold) run.activitySampleCount += 1;
      } else if (run.byteBuffer && typeof run.analyser?.getByteTimeDomainData === 'function') {
        run.analyser.getByteTimeDomainData(run.byteBuffer);
        let squareTotal = 0;
        let peak = 0;
        for (let index = 0; index < run.byteBuffer.length; index += 1) {
          const magnitude = Math.min(1, Math.abs((run.byteBuffer[index] - 128) / 128));
          peak = Math.max(peak, magnitude);
          squareTotal += magnitude * magnitude;
        }
        const rms = run.byteBuffer.length > 0
          ? Math.sqrt(squareTotal / run.byteBuffer.length)
          : 0;
        run.sampleCount += 1;
        run.peakLevel = Math.max(run.peakLevel, peak);
        run.rmsTotal += rms;
        if (rms >= run.activityThreshold) run.activitySampleCount += 1;
      } else {
        throw new Error('AnalyserUnavailableError');
      }
    } catch (error) {
      fail(run, error, 'sampling-error');
      return;
    }

    const summary = readSignalSummary(run);
    if (summary.activitySampleCount > 0 && state.status !== 'signal-detected') {
      publish(run, 'signal-detected', { outcome: 'capturing', ...summary });
    } else {
      publish(run, state.status === 'signal-detected' ? 'signal-detected' : 'capturing', {
        outcome: 'capturing',
        ...summary
      });
    }

    if (now() - run.samplingStartedAtMs >= run.sampleDurationMs) {
      finishSampling(run);
      return;
    }
    run.sampleTimerId = getWindow?.()?.setTimeout?.(
      () => sample(run),
      run.sampleIntervalMs
    );
  }

  function finishCaptureOnly(run) {
    if (!run || activeRun !== run || run.cleaned) return;
    const summary = readSignalSummary(run);
    record(run, 'mic-probe-sample-summary', summary);
    cleanup(run, {
      reason: 'capture-only-complete',
      finalStatus: 'completed',
      outcome: 'capture-only'
    });
  }

  async function handleGrantedStream(run, stream) {
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
        if (activeRun !== run || run.cleaned) return;
        record(run, 'mic-probe-track-ended', readTrackSummary(run));
        fail(run, new Error('TrackEndedError'), 'track-ended');
      };
      try {
        track?.addEventListener?.('ended', listener, { once: true });
        run.trackListeners.push({ track, listener });
      } catch {
        // Track lifecycle metadata remains available through readyState.
      }
    });

    record(run, 'mic-probe-granted', readTrackSummary(run));
    if (!run.primaryTrack) {
      fail(run, new Error('NoAudioTrackError'), 'no-audio-track');
      return;
    }

    const browserWindow = getWindow?.();
    const AudioContextConstructor = browserWindow?.AudioContext || browserWindow?.webkitAudioContext;
    if (typeof AudioContextConstructor !== 'function') {
      run.captureOnly = true;
      const summary = readSignalSummary(run);
      record(run, 'mic-probe-context-unavailable', summary);
      publish(run, 'capture-only', { outcome: 'capture-only', ...summary });
      run.captureOnlyTimerId = browserWindow?.setTimeout?.(
        () => finishCaptureOnly(run),
        run.sampleDurationMs
      );
      return;
    }

    try {
      run.audioContext = new AudioContextConstructor();
      record(run, 'mic-probe-context-created', readSignalSummary(run));
      if (run.audioContext.state === 'suspended' && typeof run.audioContext.resume === 'function') {
        await run.audioContext.resume();
      }
      if (activeRun !== run || run.cleaned) return;
      run.source = run.audioContext.createMediaStreamSource(stream);
      run.analyser = run.audioContext.createAnalyser();
      run.analyser.fftSize = 2048;
      run.source.connect(run.analyser);
      const bufferLength = Math.max(1, finiteNumber(run.analyser.fftSize, 2048));
      if (typeof run.analyser.getFloatTimeDomainData === 'function') {
        run.floatBuffer = new Float32Array(bufferLength);
      } else if (typeof run.analyser.getByteTimeDomainData === 'function') {
        run.byteBuffer = new Uint8Array(bufferLength);
      } else {
        throw new Error('AnalyserUnavailableError');
      }
    } catch (error) {
      fail(run, error, 'audio-context-error');
      return;
    }

    run.samplingStartedAtMs = now();
    const summary = readSignalSummary(run);
    publish(run, 'capturing', { outcome: 'capturing', ...summary });
    record(run, 'mic-probe-sampling-start', summary);
    sample(run);
  }

  function start() {
    if (!isEnabled?.()) {
      return { started: false, reason: 'diagnostic-disabled', state: { ...state } };
    }
    if (activeRun) {
      return { started: false, reason: 'mic-probe-active', state: { ...state } };
    }
    if (isNativeProbeActive?.()) {
      return { started: false, reason: 'native-probe-active', state: { ...state } };
    }
    if (isMediaProbeActive?.()) {
      return { started: false, reason: 'media-probe-active', state: { ...state } };
    }

    const mediaDevices = getNavigator?.()?.mediaDevices;
    if (typeof mediaDevices?.getUserMedia !== 'function') {
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
      probeId: createProbeId(startedAtMs, sequence),
      startedAtMs,
      samplingStartedAtMs: 0,
      sampleDurationMs: Math.max(0, finiteNumber(sampleDurationMs, DEFAULT_SAMPLE_DURATION_MS)),
      sampleIntervalMs: Math.max(1, finiteNumber(sampleIntervalMs, DEFAULT_SAMPLE_INTERVAL_MS)),
      activityThreshold: Math.max(0, finiteNumber(activityThreshold, DEFAULT_ACTIVITY_THRESHOLD)),
      requestTimeoutId: null,
      sampleTimerId: null,
      captureOnlyTimerId: null,
      stream: null,
      primaryTrack: null,
      trackListeners: [],
      audioContext: null,
      source: null,
      analyser: null,
      floatBuffer: null,
      byteBuffer: null,
      sampleCount: 0,
      peakLevel: 0,
      rmsTotal: 0,
      activitySampleCount: 0,
      captureOnly: false,
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
      sampleCount: 0,
      peakLevel: null,
      averageRms: null,
      activitySampleCount: 0,
      activityPercentage: null,
      activityThreshold: normalizedLevel(run.activityThreshold),
      trackReadyState: '',
      trackEnabled: null,
      trackMuted: null,
      streamActive: null,
      audioContextState: '',
      contextAvailable: null,
      captureOnly: false
    };
    onStateChange?.({ ...state });
    record(run, 'mic-probe-request');

    const browserWindow = getWindow?.();
    run.requestTimeoutId = browserWindow?.setTimeout?.(() => {
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

  function stop(reason = 'manual-stop') {
    const run = activeRun;
    if (!run || run.cleaned) return false;
    return cleanup(run, { reason, finalStatus: 'completed', outcome: reason });
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

export const MIC_INPUT_PROBE_SAMPLE_DURATION_MS = DEFAULT_SAMPLE_DURATION_MS;
export const MIC_INPUT_PROBE_REQUEST_TIMEOUT_MS = DEFAULT_REQUEST_TIMEOUT_MS;
export const MIC_INPUT_PROBE_ACTIVITY_THRESHOLD = DEFAULT_ACTIVITY_THRESHOLD;

export default {
  createMicInputProbeController,
  MIC_INPUT_PROBE_ACTIVITY_THRESHOLD,
  MIC_INPUT_PROBE_REQUEST_TIMEOUT_MS,
  MIC_INPUT_PROBE_SAMPLE_DURATION_MS
};
