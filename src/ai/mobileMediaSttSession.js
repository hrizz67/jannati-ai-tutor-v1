import {
  createMediaSttCaptureController,
  MEDIA_STT_READING_MAX_DURATION_MS,
  MEDIA_STT_SPEAKING_MAX_DURATION_MS,
  normalizeMediaSttError,
  supportsMediaSttCapture
} from './speech/mediaSttCapture.js';
import { createRuntimeSttAdapter } from './speech/sttAdapter.js';
import { traceSpeechDiagnostic } from './speech/speechDiagnostics.js';

function normalizeTranscript(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function resolveQuestionIndex(contextKey = '') {
  const segments = String(contextKey || '').split(':');
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const value = Number(segments[index]);
    if (Number.isInteger(value) && value >= 0) return value;
  }
  return null;
}

function resolveCaptureDurationMs(activity, captureDurationMs) {
  const configured = Number(captureDurationMs);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return activity === 'speaking'
    ? MEDIA_STT_SPEAKING_MAX_DURATION_MS
    : MEDIA_STT_READING_MAX_DURATION_MS;
}

export function createMobileMediaSttSession({
  activity = 'reading',
  language = 'ms-MY',
  platformFamily = 'desktop',
  contextKey = '',
  getCurrentContextKey = null,
  captureDurationMs = null,
  captureFactory = createMediaSttCaptureController,
  adapterFactory = createRuntimeSttAdapter,
  getWindow = () => typeof window !== 'undefined' ? window : null,
  getNavigator = () => typeof navigator !== 'undefined' ? navigator : null,
  onStateChange = null,
  onTranscript = null,
  onCandidate = null,
  onFailure = null,
  onStopped = null
} = {}) {
  let runSequence = 0;
  let activeRun = null;
  let state = {
    status: 'ready',
    active: false,
    errorCode: '',
    transcriptLength: 0,
    provider: ''
  };
  const supported = supportsMediaSttCapture({ getWindow, getNavigator });
  const resolvedCaptureDurationMs = resolveCaptureDurationMs(activity, captureDurationMs);
  const adapter = adapterFactory?.() || createRuntimeSttAdapter();

  const isCurrent = run => Boolean(
    run
    && activeRun === run
    && !run.cancelled
    && (
      typeof getCurrentContextKey !== 'function'
      || getCurrentContextKey() === contextKey
    )
  );
  const captureController = captureFactory({
    getWindow,
    getNavigator,
    captureDurationMs: resolvedCaptureDurationMs,
    onStateChange(nextCaptureState) {
      const run = activeRun;
      if (!isCurrent(run)) return;
      if (nextCaptureState?.status === 'recording' && state.status !== 'recording') {
        publish(run, 'recording');
      } else if (nextCaptureState?.status === 'stopping' && state.status !== 'stopping') {
        publish(run, 'stopping', {
          durationMs: Math.max(0, Number(nextCaptureState.durationMs) || 0)
        });
      }
    }
  });

  function publish(run, status, updates = {}) {
    if (run && !isCurrent(run)) return false;
    state = {
      ...state,
      ...updates,
      status,
      active: Boolean(activeRun)
    };
    onStateChange?.({ ...state });
    return true;
  }

  function trace(event, details = {}) {
    traceSpeechDiagnostic(event, {
      activity,
      contextKey,
      questionIndex: resolveQuestionIndex(contextKey),
      language,
      speechMode: 'media-stt',
      recognitionState: state.status,
      platformFamily,
      iosSpeechBypass: platformFamily === 'ios',
      recognizerCreated: false,
      ...details
    });
  }

  function finishRun(run) {
    if (activeRun !== run) return false;
    if (run.pagehideListener) {
      getWindow()?.removeEventListener?.('pagehide', run.pagehideListener);
      run.pagehideListener = null;
    }
    activeRun = null;
    state = { ...state, active: false };
    return true;
  }

  function finishStaleRun(run, reason = 'context-changed') {
    if (activeRun !== run) return { started: true, stale: true };
    run.cancelled = true;
    run.controller.abort();
    captureController.cancel(reason);
    finishRun(run);
    state = { ...state, status: 'ready', active: false, errorCode: '' };
    trace('media-stt-stale', { attempt: run.sequence, reason });
    return { started: true, stale: true };
  }

  async function start() {
    if (activeRun) return { started: false, reason: 'media-stt-active' };
    if (!supported) {
      publish(null, 'error', { errorCode: 'unsupported', transcriptLength: 0, provider: '' });
      onFailure?.({ errorCode: 'unsupported' });
      return { started: false, reason: 'unsupported' };
    }

    runSequence += 1;
    const run = {
      sequence: runSequence,
      controller: new AbortController(),
      cancelled: false,
      pagehideListener: null
    };
    activeRun = run;
    run.pagehideListener = () => cancel('pagehide');
    getWindow()?.addEventListener?.('pagehide', run.pagehideListener, { once: true });
    publish(run, 'recording', { errorCode: '', transcriptLength: 0, provider: '' });
    trace('media-stt-capture-start', { attempt: run.sequence, reason: 'explicit-user-gesture' });

    try {
      const captured = await captureController.capture({
        durationMs: resolvedCaptureDurationMs,
        signal: run.controller.signal
      });
      if (!isCurrent(run)) return finishStaleRun(run);
      publish(run, 'transcribing', { errorCode: '' });
      trace('media-stt-transcribe-start', {
        attempt: run.sequence,
        durationMs: captured.durationMs,
        totalBytes: captured.blob.size,
        mimeType: captured.mimeType
      });
      const response = await adapter.transcribe({
        blob: captured.blob,
        mimeType: captured.mimeType,
        language,
        context: {
          activity,
          contextKey,
          durationMs: captured.durationMs,
          captureDurationMs: captured.captureDurationMs,
          stopReason: captured.stopReason
        },
        signal: run.controller.signal
      });
      if (!isCurrent(run)) return finishStaleRun(run);
      const transcript = normalizeTranscript(response?.transcript);
      if (!transcript) throw normalizeMediaSttError(null, 'no-audio');
      const provider = typeof response?.provider === 'string' ? response.provider : '';
      trace('media-stt-transcribe-complete', {
        attempt: run.sequence,
        reason: 'transcript-length-only',
        nonEmptyTranscriptCount: 1,
        totalCharacterCount: transcript.length,
        durationMs: captured.durationMs,
        totalBytes: captured.blob.size,
        mimeType: captured.mimeType
      });
      finishRun(run);
      publish(null, 'review', {
        errorCode: '',
        transcriptLength: transcript.length,
        provider
      });
      onTranscript?.(transcript, response);
      onCandidate?.({
        text: transcript,
        confidence: Number.isFinite(Number(response?.confidence)) ? Number(response.confidence) : 0,
        provider,
        metadata: response?.metadata && typeof response.metadata === 'object' ? response.metadata : {}
      });
      return { started: true, transcriptLength: transcript.length, provider };
    } catch (error) {
      const normalized = normalizeMediaSttError(error, 'stt-error');
      if (activeRun !== run) return { started: true, stale: true };
      if (!isCurrent(run)) return finishStaleRun(run);
      finishRun(run);
      trace('media-stt-error', {
        attempt: run.sequence,
        reason: normalized.reason,
        errorCode: normalized.code
      });
      if (normalized.code === 'cancelled') {
        publish(null, 'ready', { errorCode: '', transcriptLength: 0, provider: '' });
        onStopped?.(normalized.reason || 'cancelled');
        return { started: true, cancelled: true };
      }
      publish(null, 'error', { errorCode: normalized.code, transcriptLength: 0, provider: '' });
      onFailure?.({ errorCode: normalized.code });
      return { started: true, errorCode: normalized.code };
    }
  }

  function stop(reason = 'manual-stop') {
    if (!activeRun) return false;
    if (state.status === 'stopping') return true;
    if (state.status !== 'recording') return false;
    const run = activeRun;
    const stopped = captureController.stop(reason);
    if (stopped && isCurrent(run)) {
      if (state.status !== 'stopping') publish(run, 'stopping');
      trace('media-stt-capture-stop', { attempt: run.sequence, reason });
    }
    return stopped;
  }

  function cancel(reason = 'communication-cancel') {
    const run = activeRun;
    if (!run) return false;
    run.cancelled = true;
    run.controller.abort();
    captureController.cancel(reason);
    finishRun(run);
    publish(null, 'ready', { errorCode: '', transcriptLength: 0, provider: '' });
    onStopped?.(reason);
    return true;
  }

  return {
    supported,
    start,
    stop,
    cancel,
    getState: () => ({ ...state }),
    get recognition() {
      return null;
    }
  };
}

export const createIOSMediaSttSession = createMobileMediaSttSession;

export default {
  createMobileMediaSttSession,
  createIOSMediaSttSession
};
