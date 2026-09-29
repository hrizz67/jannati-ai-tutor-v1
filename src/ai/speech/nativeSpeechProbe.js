const DEFAULT_TIMEOUT_MS = 12000;
const PROBE_LANGUAGE = 'ms-MY';

function countResultMetadata(event) {
  const results = event?.results ? Array.from(event.results) : [];
  let finalResultCount = 0;
  let interimResultCount = 0;
  let alternativeCount = 0;
  let nonEmptyTranscriptCount = 0;
  let totalCharacterCount = 0;

  results.forEach(result => {
    if (!result) return;
    if (result.isFinal) finalResultCount += 1;
    else interimResultCount += 1;
    Array.from(result).forEach(alternative => {
      alternativeCount += 1;
      const transcript = typeof alternative?.transcript === 'string'
        ? alternative.transcript.trim()
        : '';
      if (!transcript) return;
      nonEmptyTranscriptCount += 1;
      totalCharacterCount += transcript.length;
    });
  });

  return {
    resultIndex: Number.isInteger(event?.resultIndex) ? event.resultIndex : 0,
    resultsLength: results.length,
    finalResultCount,
    interimResultCount,
    alternativeCount,
    nonEmptyTranscriptCount,
    totalCharacterCount
  };
}

function createProbeId(now, sequence) {
  return 'native-probe-' + now.toString(36) + '-' + sequence.toString(36);
}

export function createNativeSpeechProbeController({
  getWindow,
  isEnabled,
  trace,
  onStateChange,
  timeoutMs = DEFAULT_TIMEOUT_MS,
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
    elapsedMs: 0
  };

  function publish(run, status, updates = {}) {
    if (run && activeRun !== run) return false;
    const elapsedMs = run ? Math.max(0, now() - run.startedAtMs) : 0;
    state = {
      ...state,
      ...updates,
      status,
      elapsedMs: Number.isFinite(updates.elapsedMs) ? updates.elapsedMs : elapsedMs,
      active: Boolean(activeRun)
    };
    onStateChange?.({ ...state });
    return true;
  }

  function record(run, event, details = {}) {
    if (!run || activeRun !== run) return null;
    const elapsedMs = Math.max(0, now() - run.startedAtMs);
    return trace?.(event, {
      activity: 'native-probe',
      sessionId: run.probeId,
      attempt: 1,
      language: PROBE_LANGUAGE,
      requestedContinuous: false,
      appliedContinuous: false,
      requestedInterim: false,
      appliedInterim: false,
      multiUtterance: false,
      recognitionState: state.status,
      speechMode: 'native-probe',
      probeId: run.probeId,
      probeElapsedMs: elapsedMs,
      ...details
    }) || null;
  }

  function clearSafetyTimeout(run) {
    if (!run?.timeoutId) return;
    const browserWindow = getWindow?.();
    browserWindow?.clearTimeout?.(run.timeoutId);
    run.timeoutId = null;
  }

  function setStatus(run, status, updates = {}) {
    if (!publish(run, status, updates)) return;
    run.lastStatus = status;
  }

  function finish(run, outcome = run.outcome || 'ended') {
    if (activeRun !== run) return;
    clearSafetyTimeout(run);
    run.outcome = outcome;
    activeRun = null;
    publish(null, 'ended', {
      probeId: run.probeId,
      active: false,
      supported: true,
      outcome,
      elapsedMs: Math.max(0, now() - run.startedAtMs)
    });
  }

  function start() {
    if (!isEnabled?.()) {
      return { started: false, reason: 'diagnostic-disabled', state: { ...state } };
    }
    if (activeRun) {
      return { started: false, reason: 'probe-active', state: { ...state } };
    }

    const browserWindow = getWindow?.();
    const Recognition = browserWindow?.SpeechRecognition || browserWindow?.webkitSpeechRecognition;
    if (typeof Recognition !== 'function') {
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
      recognition: null,
      timeoutId: null,
      abortIssued: false,
      stopIssued: false,
      outcome: 'running',
      lastStatus: 'starting'
    };
    activeRun = run;
    state = {
      status: 'starting',
      probeId: run.probeId,
      active: true,
      supported: true,
      outcome: 'running',
      elapsedMs: 0
    };
    onStateChange?.({ ...state });

    let recognition;
    try {
      recognition = new Recognition();
      run.recognition = recognition;
      recognition.lang = PROBE_LANGUAGE;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      record(run, 'probe-create');
    } catch (error) {
      record(run, 'probe-create-error', {
        errorCode: error instanceof Error && error.name ? error.name : 'constructor-error'
      });
      activeRun = null;
      publish(null, 'error', {
        probeId: run.probeId,
        active: false,
        supported: true,
        outcome: 'constructor-error',
        elapsedMs: Math.max(0, now() - startedAtMs)
      });
      return { started: false, reason: 'constructor-error', state: { ...state } };
    }

    recognition.onstart = () => {
      if (activeRun !== run) return;
      setStatus(run, 'starting');
      record(run, 'onstart');
    };
    recognition.onaudiostart = () => {
      if (activeRun !== run) return;
      setStatus(run, 'audio-capture');
      record(run, 'onaudiostart');
    };
    recognition.onsoundstart = () => {
      if (activeRun !== run) return;
      setStatus(run, 'sound-detected');
      record(run, 'onsoundstart');
    };
    recognition.onspeechstart = () => {
      if (activeRun !== run) return;
      setStatus(run, 'speech-detected');
      record(run, 'onspeechstart');
    };
    recognition.onresult = event => {
      if (activeRun !== run) return;
      const metadata = countResultMetadata(event);
      run.outcome = 'result-received';
      setStatus(run, 'result-received', { outcome: run.outcome });
      record(run, 'onresult', metadata);
    };
    recognition.onspeechend = () => {
      if (activeRun !== run) return;
      record(run, 'onspeechend');
    };
    recognition.onsoundend = () => {
      if (activeRun !== run) return;
      record(run, 'onsoundend');
    };
    recognition.onaudioend = () => {
      if (activeRun !== run) return;
      record(run, 'onaudioend');
    };
    recognition.onnomatch = () => {
      if (activeRun !== run) return;
      run.outcome = 'no-match';
      record(run, 'onnomatch');
    };
    recognition.onerror = event => {
      if (activeRun !== run) return;
      const errorCode = typeof event?.error === 'string' && event.error
        ? event.error
        : 'unknown-error';
      const outcome = run.abortIssued && errorCode === 'aborted'
        ? run.outcome
        : errorCode;
      run.outcome = outcome;
      setStatus(run, 'error', { outcome });
      record(run, 'onerror', { errorCode });
    };
    recognition.onend = () => {
      if (activeRun !== run) return;
      record(run, 'onend');
      finish(run);
    };

    const safetyTimeout = Math.max(0, Number(timeoutMs) || DEFAULT_TIMEOUT_MS);
    run.timeoutId = browserWindow.setTimeout(() => {
      if (activeRun !== run || run.abortIssued) return;
      run.outcome = 'timeout';
      record(run, 'probe-timeout');
      setStatus(run, 'error', { outcome: 'timeout' });
      run.abortIssued = true;
      record(run, 'probe-abort-call', { reason: 'safety-timeout' });
      try {
        recognition.abort?.();
      } catch (error) {
        record(run, 'probe-abort-error', {
          errorCode: error instanceof Error && error.name ? error.name : 'abort-error'
        });
      }
    }, safetyTimeout);

    try {
      record(run, 'probe-start-call');
      recognition.start();
      record(run, 'probe-start-return');
      return { started: true, reason: '', state: { ...state } };
    } catch (error) {
      clearSafetyTimeout(run);
      record(run, 'probe-start-error', {
        errorCode: error instanceof Error && error.name ? error.name : 'start-error'
      });
      activeRun = null;
      publish(null, 'error', {
        probeId: run.probeId,
        active: false,
        supported: true,
        outcome: 'start-error',
        elapsedMs: Math.max(0, now() - startedAtMs)
      });
      return { started: false, reason: 'start-error', state: { ...state } };
    }
  }

  function stop() {
    const run = activeRun;
    if (!run || run.stopIssued) return false;
    run.stopIssued = true;
    run.outcome = 'manual-stop';
    record(run, 'probe-manual-stop');
    try {
      run.recognition?.stop?.();
    } catch (error) {
      record(run, 'probe-stop-error', {
        errorCode: error instanceof Error && error.name ? error.name : 'stop-error'
      });
    }
    return true;
  }

  function abort() {
    const run = activeRun;
    if (!run || run.abortIssued) return false;
    run.abortIssued = true;
    run.outcome = 'manual-abort';
    record(run, 'probe-manual-abort');
    try {
      run.recognition?.abort?.();
    } catch (error) {
      record(run, 'probe-abort-error', {
        errorCode: error instanceof Error && error.name ? error.name : 'abort-error'
      });
    }
    return true;
  }

  function getState() {
    return { ...state };
  }

  return {
    abort,
    getState,
    start,
    stop
  };
}

export const NATIVE_SPEECH_PROBE_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

export default {
  createNativeSpeechProbeController,
  NATIVE_SPEECH_PROBE_TIMEOUT_MS
};
