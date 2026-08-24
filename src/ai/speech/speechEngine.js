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
    result: null
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

function disposeRecognitionInstance(instance, { delayAbortMs = 0 } = {}) {
  if (!instance) return;
  try {
    instance.onstart = null;
    instance.onresult = null;
    instance.onerror = null;
    instance.onend = null;
    instance.onnomatch = null;
  } catch {
    // Ignore handler cleanup errors.
  }
  try {
    instance.stop?.();
  } catch {
    // Ignore stop errors.
  }
  if (delayAbortMs > 0) {
    setTimeout(() => {
      try {
        instance.abort?.();
      } catch {
        // Ignore delayed abort errors.
      }
    }, delayAbortMs);
    return;
  }
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
  silenceDelayMs = 9000,
  hardTimeoutMs = 9000,
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

  function clearTimers() {
    if (silenceTimeoutId) {
      clearTimeout(silenceTimeoutId);
      silenceTimeoutId = null;
    }
    if (hardTimeoutId) {
      clearTimeout(hardTimeoutId);
      hardTimeoutId = null;
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

  function finalize(transcript = '', reason = 'completed') {
    if (finalized) return state.result || createEmptySpeechResult();
    finalized = true;
    clearTimers();
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
    disposeRecognitionInstance(recognition, { delayAbortMs: multiUtterance ? 150 : 0 });
    recognition = null;
    onStopped?.(reason);
    return result;
  }

  function emitEmptyResult(message, errorCode = 'no-result') {
    if (finalized || emptyResultEmitted) return state.result || createEmptySpeechResult(errorCode, message);
    emptyResultEmitted = true;
    finalized = true;
    clearTimers();
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
    disposeRecognitionInstance(recognition, { delayAbortMs: multiUtterance ? 150 : 0 });
    recognition = null;
    onStopped?.('empty');
    return result;
  }

  function cleanup() {
    if (activeSpeechRecognitionCancel === cancel) {
      activeSpeechRecognitionCancel = null;
    }
    disposeRecognitionInstance(recognition);
    recognition = null;
  }

  function stop() {
    try {
      recognition?.stop?.();
    } catch {
      // Ignore stop errors.
    }
  }

  function cancel() {
    try {
      clearTimers();
    } catch {
      // Ignore abort errors.
    }
    finalized = true;
    transcriptBuffer = '';
    finalFragments = [];
    interimTranscript = '';
    resultFragmentsByIndex = new Map();
    seenResultKeys = new Set();
    disposeRecognitionInstance(recognition, { delayAbortMs: multiUtterance ? 150 : 0 });
    cleanup();
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

    try {
      activeSpeechRecognitionCancel?.();
    } catch {
      // Ignore global cancellation errors.
    }
    activeSpeechRecognitionCancel = cancel;
    receivedResult = false;
    transcriptBuffer = '';
    finalFragments = [];
    interimTranscript = '';
    resultFragmentsByIndex = new Map();
    seenResultKeys = new Set();
    finalized = false;
    emptyResultEmitted = false;
    const nextRecognition = new Recognition();
    recognition = nextRecognition;
    nextRecognition.lang = lang;
    nextRecognition.interimResults = multiUtterance ? true : Boolean(interimResults);
    nextRecognition.continuous = multiUtterance ? true : Boolean(continuous);
    nextRecognition.maxAlternatives = 1;

    nextRecognition.onstart = () => {
      emit({ status: 'listening', error: '' });
      onListening?.(state);
    };
    nextRecognition.onresult = event => {
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
          emitEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.', 'no-result');
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
      const error = event?.error || 'unknown_error';
      if (error === 'aborted') {
        emit({ status: 'idle', error: '' });
        onError?.(error);
        return;
      }
      if (error === 'no-speech' && !receivedResult) {
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
      clearTimers();
      if (finalized) {
        cleanup();
        return;
      }
      const bufferedTranscript = getBufferedTranscript();
      if (bufferedTranscript) {
        finalize(bufferedTranscript, 'completed');
      } else if (!receivedResult || state.status === 'listening' || state.status === 'processing') {
        emitEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.', 'no-result');
      } else {
        emit({ status: 'idle' });
      }
      cleanup();
    };

    try {
      hardTimeoutId = setTimeout(() => {
        if (finalized) return;
        const bufferedTranscript = getBufferedTranscript();
        if (bufferedTranscript) {
          try {
            recognition?.stop?.();
          } catch {
            // Ignore timeout stop errors.
          }
          return;
        }
        if (state.status === 'listening' && !receivedResult) {
          emitEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.', 'no-result');
        }
      }, Math.max(0, Number(hardTimeoutMs) || 0));
      nextRecognition.start();
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'start_failed';
      clearTimers();
      emit({ status: 'idle', error: message });
      onError?.(message);
      cleanup();
      return state;
    }
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
  try {
    activeSpeechRecognitionCancel?.();
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
