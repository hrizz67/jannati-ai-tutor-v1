import { getSpeechRecognitionConstructor } from './speechCapability.js';
import { matchSpeechAnswer } from './speechMatcher.js';

let activeSpeechRecognitionCancel = null;

function createState() {
  return {
    status: 'idle',
    transcript: '',
    confidence: 0,
    correct: false,
    error: '',
    result: null,
    recoveryReason: '',
    recoveryAttempt: 0
  };
}

function createEmptySpeechResult(errorCode = 'no-result', message = 'Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.') {
  return {
    status: 'empty',
    transcript: '',
    correct: false,
    confidence: 0,
    matched: [],
    matchedKeywords: [],
    tertinggal: [],
    missingWords: [],
    missed: [],
    words: [],
    errorCode,
    message
  };
}

function defaultResultFactory(transcript, expectedAnswer, acceptedAnswers) {
  return matchSpeechAnswer(transcript, expectedAnswer, acceptedAnswers);
}

// Android Chrome may resend an earlier final fragment with a new result
// index, or return an interim fragment that already contains the final text.
// Merge by token overlap so those revisions replace/extend text instead of
// duplicating it in the learner's transcript.
export function mergeSpeechTranscript(existing = '', incoming = '') {
  const left = typeof existing === 'string' ? existing.trim() : '';
  const right = typeof incoming === 'string' ? incoming.trim() : '';
  if (!left) return right;
  if (!right) return left;
  const leftTokens = left.split(/\s+/).filter(Boolean);
  const rightTokens = right.split(/\s+/).filter(Boolean);
  const lowerLeft = leftTokens.map(token => token.toLocaleLowerCase());
  const lowerRight = rightTokens.map(token => token.toLocaleLowerCase());
  if (lowerLeft.join(' ') === lowerRight.join(' ')) return left;
  if (lowerLeft.join(' ').includes(lowerRight.join(' '))) return left;
  if (lowerRight.join(' ').includes(lowerLeft.join(' '))) return right;
  const maxOverlap = Math.min(leftTokens.length, rightTokens.length, 24);
  for (let size = maxOverlap; size > 0; size -= 1) {
    const leftTail = lowerLeft.slice(-size).join(' ');
    const rightHead = lowerRight.slice(0, size).join(' ');
    if (leftTail === rightHead) {
      return [...leftTokens, ...rightTokens.slice(size)].join(' ');
    }
  }
  return `${left} ${right}`.replace(/\s+/g, ' ').trim();
}

export function extractSpeechTranscript(event) {
  const results = event?.results ? Array.from(event.results) : [];
  return results
    .flatMap(result => (result ? Array.from(result) : []))
    .map(alternative => typeof alternative?.transcript === 'string' ? alternative.transcript.trim() : '')
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function collectSpeechTranscriptFragments(event, seenResultKeys = new Set(), startIndex = 0) {
  const results = event?.results ? Array.from(event.results) : [];
  const safeStartIndex = Number.isInteger(startIndex) && startIndex > 0 ? startIndex : 0;
  const nextFinalFragments = [];
  let interimTranscript = '';

  results.slice(safeStartIndex).forEach((result, offset) => {
    if (!result) return;
    const absoluteIndex = safeStartIndex + offset;
    const alternatives = Array.from(result);
    const transcript = alternatives
      .map(alternative => typeof alternative?.transcript === 'string' ? alternative.transcript.trim() : '')
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!transcript) return;
    const key = `${result.isFinal ? '1' : '0'}|${transcript}`;
    if (seenResultKeys?.has?.(key)) return;
    seenResultKeys?.add?.(key);
    if (result.isFinal) {
      nextFinalFragments.push(transcript);
      return;
    }
    interimTranscript = transcript;
  });

  return {
    nextFinalFragments,
    interimTranscript,
    hasTranscript: Boolean(nextFinalFragments.length || interimTranscript)
  };
}

const disposedRecognitionInstances = new WeakSet();

function disposeRecognitionInstance(instance, { abort = false } = {}) {
  if (!instance) return;
  if (disposedRecognitionInstances.has(instance)) return;
  disposedRecognitionInstances.add(instance);
  try {
    instance.onstart = null;
    instance.onresult = null;
    instance.onerror = null;
    instance.onend = null;
    instance.onnomatch = null;
  } catch {
    // Ignore handler cleanup errors.
  }
  if (!abort) return;
  try {
    instance.abort?.();
  } catch {
    // Ignore abort errors.
  }
}

export function createSpeechSession({
  expectedAnswer = '',
  acceptedAnswers = [],
  lang = 'ms-MY',
  continuous = false,
  interimResults = false,
  multiUtterance = false,
  startTimeoutMs = 9000,
  startRetryLimit = 0,
  startRetryDelayMs = 250,
  postStartRetryLimit = 0,
  postStartRetryDelayMs = startRetryDelayMs,
  silenceDelayMs = 9000,
  hardTimeoutMs = 9000,
  canRecover = null,
  resultFactory = defaultResultFactory,
  onChange = null,
  onListening = null,
  onTranscript = null,
  onResult = null,
  onComplete = null,
  onEmpty = null,
  onStopped = null,
  onError = null
} = {}) {
  const Recognition = getSpeechRecognitionConstructor();
  const supported = Boolean(Recognition);
  let recognition = null;
  let state = createState();
  let receivedResult = false;
  let transcriptBuffer = '';
  let finalFragments = [];
  let interimTranscript = '';
  // Android speech recognition can resend the same result index (sometimes
  // with a slightly revised transcript). Keep one current fragment per index
  // so a repeated event replaces the old text instead of appending it again.
  let resultFragmentsByIndex = new Map();
  let seenResultKeys = new Set();
  let finalized = false;
  let emptyResultEmitted = false;
  let startTimeoutId = null;
  let retryTimeoutId = null;
  let silenceTimeoutId = null;
  let hardTimeoutId = null;

  function emit(nextState) {
    state = {
      ...state,
      ...nextState
    };
    onChange?.(state);
  }

  function emitTranscript(transcript = '') {
    const safeTranscript = typeof transcript === 'string' ? transcript.trim() : '';
    emit({
      status: safeTranscript ? 'processing' : state.status,
      transcript: safeTranscript,
      error: ''
    });
    onTranscript?.(safeTranscript, state);
    return safeTranscript;
  }

  function clearStartTimeout() {
    if (startTimeoutId) {
      clearTimeout(startTimeoutId);
      startTimeoutId = null;
    }
  }

  function clearAttemptTimers() {
    clearStartTimeout();
    if (silenceTimeoutId) {
      clearTimeout(silenceTimeoutId);
      silenceTimeoutId = null;
    }
    if (hardTimeoutId) {
      clearTimeout(hardTimeoutId);
      hardTimeoutId = null;
    }
  }

  function clearTimers() {
    clearAttemptTimers();
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }
  }

  function getBufferedTranscript() {
    if (!multiUtterance) {
      return typeof transcriptBuffer === 'string' ? transcriptBuffer.trim() : '';
    }
    const finalTranscript = finalFragments.reduce((merged, fragment) => mergeSpeechTranscript(merged, fragment), '').trim();
    const safeInterim = typeof interimTranscript === 'string' ? interimTranscript.trim() : '';
    if (!finalTranscript) return safeInterim;
    if (!safeInterim) return finalTranscript;
    return mergeSpeechTranscript(finalTranscript, safeInterim);
  }

  function buildResult(transcript) {
    try {
      const nextResult = resultFactory?.(transcript, expectedAnswer, acceptedAnswers);
      if (nextResult && typeof nextResult === 'object') {
        return nextResult;
      }
    } catch {
      // Fall back to the default matcher below.
    }
    return defaultResultFactory(transcript, expectedAnswer, acceptedAnswers);
  }

  function clearActiveCancellation() {
    if (activeSpeechRecognitionCancel === cancel) {
      activeSpeechRecognitionCancel = null;
    }
  }

  function releaseRecognition(instance = recognition, { abort = false } = {}) {
    if (recognition === instance) recognition = null;
    clearActiveCancellation();
    disposeRecognitionInstance(instance, { abort });
  }

  function finalize(transcript = '', reason = 'completed') {
    if (finalized) return state.result || createEmptySpeechResult();
    finalized = true;
    clearTimers();
    const completedRecognition = recognition;
    releaseRecognition(completedRecognition);
    const safeTranscript = typeof transcript === 'string' ? transcript.trim() : '';
    transcriptBuffer = safeTranscript;
    const result = safeTranscript ? buildResult(safeTranscript) : createEmptySpeechResult();
    const nextState = safeTranscript
      ? {
          status: reason,
          transcript: typeof result.transcript === 'string' ? result.transcript : safeTranscript,
          confidence: Number.isFinite(Number(result.confidence)) ? Number(result.confidence) : 0,
          correct: Boolean(result.correct),
          error: '',
          result
        }
      : {
          status: 'empty',
          transcript: '',
          confidence: 0,
          correct: false,
          error: result.errorCode || 'no-result',
          result
        };
    emit(nextState);
    onResult?.(result);
    if (safeTranscript) {
      onComplete?.(result);
    } else {
      onEmpty?.(result);
    }
    onStopped?.(reason);
    return result;
  }

  function emitEmptyResult(message, errorCode = 'no-result', { abort = false } = {}) {
    if (finalized || emptyResultEmitted) return state.result || createEmptySpeechResult(errorCode, message);
    emptyResultEmitted = true;
    finalized = true;
    clearTimers();
    const completedRecognition = recognition;
    releaseRecognition(completedRecognition, { abort });
    const result = createEmptySpeechResult(errorCode, message);
    emit({
      status: 'empty',
      transcript: '',
      confidence: 0,
      correct: false,
      error: errorCode,
      result
    });
    onResult?.(result);
    onEmpty?.(result);
    onStopped?.('empty');
    return result;
  }

  function cleanup({ abort = false, instance = recognition } = {}) {
    releaseRecognition(instance, { abort });
  }

  function stop() {
    try {
      recognition?.stop?.();
    } catch {
      // Ignore stop errors.
    }
  }

  function cancel() {
    clearTimers();
    const cancelledRecognition = recognition;
    finalized = true;
    transcriptBuffer = '';
    finalFragments = [];
    interimTranscript = '';
    resultFragmentsByIndex = new Map();
    seenResultKeys = new Set();
    cleanup({ abort: true, instance: cancelledRecognition });
    emit({ status: 'idle' });
    onStopped?.('cancelled');
  }

  function start() {
    if (!supported) {
      const unsupported = {
        correct: false,
        confidence: 0,
        transcript: '',
        normalizedTranscript: '',
        normalizedExpected: '',
        matchedAnswer: '',
        acceptedAnswers: [],
        unsupported: true
      };
      emit({ status: 'unsupported', result: unsupported });
      onResult?.(unsupported);
      return unsupported;
    }

    const previousCancel = activeSpeechRecognitionCancel;
    activeSpeechRecognitionCancel = null;
    try {
      previousCancel?.();
    } catch {
      // Ignore global cancellation errors.
    }
    clearTimers();
    receivedResult = false;
    transcriptBuffer = '';
    finalFragments = [];
    interimTranscript = '';
    resultFragmentsByIndex = new Map();
    seenResultKeys = new Set();
    finalized = false;
    emptyResultEmitted = false;

    const startupTimeout = Math.max(0, Number(startTimeoutMs) || 0);
    const retryDelay = Math.max(0, Number(startRetryDelayMs) || 0);
    const postStartRetryDelay = Math.max(0, Number(postStartRetryDelayMs) || 0);
    const maximumStartRetries = Math.min(1, Math.max(0, Math.trunc(Number(startRetryLimit) || 0)));
    const maximumPostStartRetries = Math.min(1, Math.max(0, Math.trunc(Number(postStartRetryLimit) || 0)));
    // Startup and post-start recovery share one automatic retry budget.
    // A question therefore creates at most two recognition instances.
    const maximumAutomaticRecoveries = Math.min(1, Math.max(maximumStartRetries, maximumPostStartRetries));
    const recognitionHardTimeout = Math.max(0, Number(hardTimeoutMs) || 0);
    let startRetriesUsed = 0;
    let postStartRetriesUsed = 0;
    let automaticRecoveryCount = 0;

    function acknowledgeLifecycleEvent(instance) {
      if (recognition !== instance || finalized) return false;
      clearStartTimeout();
      return true;
    }

    function recoveryContextIsCurrent() {
      if (typeof canRecover !== 'function') return true;
      try {
        return Boolean(canRecover());
      } catch {
        return false;
      }
    }

    function scheduleRecognitionRetry(stalledRecognition, {
      kind = 'post-start',
      reason = 'post-start-timeout',
      abort = false
    } = {}) {
      if (
        recognition !== stalledRecognition
        || finalized
        || receivedResult
        || getBufferedTranscript()
        || !recoveryContextIsCurrent()
        || automaticRecoveryCount >= maximumAutomaticRecoveries
      ) {
        return false;
      }

      if (kind === 'startup') {
        if (startRetriesUsed >= maximumStartRetries) return false;
        startRetriesUsed += 1;
      } else {
        if (postStartRetriesUsed >= maximumPostStartRetries) return false;
        postStartRetriesUsed += 1;
      }

      clearAttemptTimers();
      releaseRecognition(stalledRecognition, { abort });
      automaticRecoveryCount += 1;
      emit({
        status: 'starting',
        transcript: '',
        error: '',
        recoveryReason: reason,
        recoveryAttempt: automaticRecoveryCount
      });
      activeSpeechRecognitionCancel = cancel;
      retryTimeoutId = setTimeout(() => {
        retryTimeoutId = null;
        if (finalized || !recoveryContextIsCurrent()) return;
        startRecognitionAttempt();
      }, kind === 'startup' ? retryDelay : postStartRetryDelay);
      return true;
    }

    function handleStartTimeout(stalledRecognition) {
      if (recognition !== stalledRecognition || finalized) return;
      if (scheduleRecognitionRetry(stalledRecognition, {
        kind: 'startup',
        reason: 'start-timeout-retry',
        abort: true
      })) {
        return;
      }

      clearAttemptTimers();
      releaseRecognition(stalledRecognition, { abort: true });
      emitEmptyResult(
        'Mikrofon tidak berjaya dimulakan. Cuba sekali lagi atau gunakan jawapan manual.',
        'start-timeout'
      );
    }

    function startRecognitionAttempt() {
      if (finalized) return state;
      let nextRecognition = null;
      let lifecycleStarted = false;

      try {
        nextRecognition = new Recognition();
        recognition = nextRecognition;
        activeSpeechRecognitionCancel = cancel;
        nextRecognition.lang = lang;
        nextRecognition.interimResults = multiUtterance ? true : Boolean(interimResults);
        nextRecognition.continuous = multiUtterance ? true : Boolean(continuous);
        nextRecognition.maxAlternatives = 1;

        nextRecognition.onstart = () => {
          if (!acknowledgeLifecycleEvent(nextRecognition)) return;
          lifecycleStarted = true;
          emit({ status: 'listening', error: '' });
          onListening?.(state);
        };
        nextRecognition.onresult = event => {
          if (!acknowledgeLifecycleEvent(nextRecognition)) return;
          if (multiUtterance) {
            const results = event?.results ? Array.from(event.results) : [];
            const safeStartIndex = Number.isInteger(event?.resultIndex) && event.resultIndex > 0 ? event.resultIndex : 0;
            const eventFragmentKeys = new Set();
            let hasTranscript = false;
            results.slice(safeStartIndex).forEach((result, offset) => {
              if (!result) return;
              const absoluteIndex = safeStartIndex + offset;
              const transcript = Array.from(result)
                .map(alternative => typeof alternative?.transcript === 'string' ? alternative.transcript.trim() : '')
                .filter(Boolean)
                .join(' ')
                .trim();
              if (!transcript) return;
              const fragmentKey = `${result.isFinal ? '1' : '0'}|${transcript}`;
              if (eventFragmentKeys.has(fragmentKey)) return;
              eventFragmentKeys.add(fragmentKey);
              hasTranscript = true;
              resultFragmentsByIndex.set(absoluteIndex, {
                transcript,
                isFinal: Boolean(result.isFinal)
              });
            });
            if (!hasTranscript) return;
            receivedResult = true;
            const orderedFragments = [...resultFragmentsByIndex.entries()]
              .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
              .map(([, fragment]) => fragment);
            finalFragments = orderedFragments.filter(fragment => fragment.isFinal).map(fragment => fragment.transcript);
            interimTranscript = orderedFragments.filter(fragment => !fragment.isFinal).map(fragment => fragment.transcript).join(' ').trim();
            transcriptBuffer = getBufferedTranscript();
            emitTranscript(transcriptBuffer);
            if (silenceTimeoutId) {
              clearTimeout(silenceTimeoutId);
            }
            silenceTimeoutId = setTimeout(() => {
              if (finalized || recognition !== nextRecognition) return;
              const bufferedTranscript = getBufferedTranscript();
              if (bufferedTranscript) {
                try {
                  nextRecognition.stop?.();
                } catch {
                  // Ignore silence-stop errors.
                }
                return;
              }
              emitEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.', 'no-result', { abort: true });
            }, Math.max(0, Number(silenceDelayMs) || 0));
            return;
          }
          const transcript = extractSpeechTranscript(event);
          if (transcript) {
            receivedResult = true;
            transcriptBuffer = mergeSpeechTranscript(transcriptBuffer, transcript);
            emit({ status: 'processing', transcript: transcriptBuffer });
            emitTranscript(transcriptBuffer);
            finalize(transcriptBuffer, 'completed');
            return;
          }
          emit({ status: 'processing', transcript: transcriptBuffer });
        };
        nextRecognition.onerror = event => {
          if (!acknowledgeLifecycleEvent(nextRecognition)) return;
          const error = event?.error || 'unknown_error';
          if (error === 'aborted') {
            emit({ status: 'idle', error: '' });
            onError?.(error);
            return;
          }
          if (error === 'no-speech' && !receivedResult) {
            if (lifecycleStarted && scheduleRecognitionRetry(nextRecognition, {
              reason: 'post-start-no-speech',
              abort: true
            })) {
              return;
            }
            emitEmptyResult('Suara belum dapat dikesan. Cuba sekali lagi.', 'no-speech');
            return;
          }
          if (error === 'audio-capture') {
            emitEmptyResult('Mikrofon tidak dapat digunakan.', 'audio-capture');
            return;
          }
          if (error === 'not-allowed' || error === 'service-not-allowed') {
            emitEmptyResult('Kebenaran mikrofon diperlukan untuk latihan ini.', error);
            return;
          }
          if (multiUtterance && transcriptBuffer) {
            try {
              nextRecognition.stop?.();
            } catch {
              // Ignore soft stop errors.
            }
            return;
          }
          emit({ status: 'error', error });
          onError?.(error);
        };
        nextRecognition.onend = () => {
          if (recognition !== nextRecognition) return;
          clearStartTimeout();
          clearTimers();
          if (finalized) {
            cleanup({ instance: nextRecognition });
            return;
          }
          const bufferedTranscript = getBufferedTranscript();
          if (bufferedTranscript) {
            finalize(bufferedTranscript, 'completed');
          } else if (!receivedResult || state.status === 'listening' || state.status === 'processing' || state.status === 'starting') {
            if (lifecycleStarted && scheduleRecognitionRetry(nextRecognition, {
              reason: 'post-start-end'
            })) {
              return;
            }
            emitEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.', 'no-result');
          } else {
            emit({ status: 'idle' });
          }
          cleanup({ instance: nextRecognition });
        };

        if (startupTimeout > 0) {
          startTimeoutId = setTimeout(() => {
            handleStartTimeout(nextRecognition);
          }, startupTimeout);
        }
        hardTimeoutId = setTimeout(() => {
          if (finalized || recognition !== nextRecognition) return;
          const bufferedTranscript = getBufferedTranscript();
          if (bufferedTranscript) {
            try {
              nextRecognition.stop?.();
            } catch {
              // Ignore timeout stop errors.
            }
            return;
          }
          if (lifecycleStarted && state.status === 'listening' && !receivedResult) {
            if (scheduleRecognitionRetry(nextRecognition, {
              reason: 'post-start-timeout',
              abort: true
            })) {
              return;
            }
            emitEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.', 'no-result', { abort: true });
          }
        }, recognitionHardTimeout);
        emit({
          status: 'starting',
          error: '',
          recoveryReason: automaticRecoveryCount > 0 ? state.recoveryReason : '',
          recoveryAttempt: automaticRecoveryCount
        });
        nextRecognition.start();
        return state;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'start_failed';
        clearAttemptTimers();
        emit({ status: 'idle', error: message });
        onError?.(message);
        cleanup({ abort: true, instance: nextRecognition });
        return state;
      }
    }

    return startRecognitionAttempt();
  }

  function getState() {
    return { ...state };
  }

  return {
    supported,
    start,
    stop,
    cancel,
    getState,
    get recognition() {
      return recognition;
    }
  };
}

export function cancelActiveSpeechRecognition() {
  const cancel = activeSpeechRecognitionCancel;
  activeSpeechRecognitionCancel = null;
  try {
    cancel?.();
  } catch {
    // Ignore cancellation errors.
  }
}

export function isSpeechAvailable() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function supportsSpeechRecognition() {
  return isSpeechAvailable();
}

export function speakAnswerPrompt() {
  return isSpeechAvailable();
}

export default {
  createSpeechSession,
  cancelActiveSpeechRecognition,
  extractSpeechTranscript,
  collectSpeechTranscriptFragments,
  isSpeechAvailable,
  supportsSpeechRecognition,
  speakAnswerPrompt
};
