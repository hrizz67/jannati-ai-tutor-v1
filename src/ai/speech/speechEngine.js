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
    const key = `${absoluteIndex}|${result.isFinal ? '1' : '0'}|${transcript}`;
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

function disposeRecognitionInstance(instance) {
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
  onChange = null,
  onResult = null,
  onError = null
} = {}) {
  const Recognition = getSpeechRecognitionConstructor();
  const supported = Boolean(Recognition);
  let recognition = null;
  let state = createState();
  let receivedResult = false;
  let transcriptBuffer = '';
  let finalized = false;
  let emptyResultEmitted = false;
  let timeoutId = null;

  function emit(nextState) {
    state = {
      ...state,
      ...nextState
    };
    onChange?.(state);
  }

  function finalize(transcript = '', reason = 'completed') {
    if (finalized) return state.result || createEmptySpeechResult();
    finalized = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    const result = matchSpeechAnswer(transcript, expectedAnswer, acceptedAnswers);
    const nextState = {
      status: reason,
      transcript: result.transcript,
      confidence: result.confidence,
      correct: result.correct,
      error: '',
      result
    };
    emit(nextState);
    onResult?.(result);
    disposeRecognitionInstance(recognition);
    recognition = null;
    return result;
  }

  function emitEmptyResult(message, errorCode = 'no-result') {
    if (finalized || emptyResultEmitted) return state.result || createEmptySpeechResult(errorCode, message);
    emptyResultEmitted = true;
    finalized = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
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
    disposeRecognitionInstance(recognition);
    recognition = null;
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
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } catch {
      // Ignore abort errors.
    }
    transcriptBuffer = '';
    disposeRecognitionInstance(recognition);
    cleanup();
    emit({ status: 'idle' });
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
    finalized = false;
    emptyResultEmitted = false;
    const nextRecognition = new Recognition();
    recognition = nextRecognition;
    nextRecognition.lang = lang;
    nextRecognition.interimResults = false;
    nextRecognition.continuous = false;
    nextRecognition.maxAlternatives = 1;

    nextRecognition.onstart = () => emit({ status: 'listening', error: '' });
    nextRecognition.onresult = event => {
      const transcript = extractSpeechTranscript(event);
      if (transcript) {
        receivedResult = true;
        transcriptBuffer = [transcriptBuffer, transcript].filter(Boolean).join(' ').trim();
        emit({ status: 'processing', transcript: transcriptBuffer });
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
      emit({ status: 'error', error });
      onError?.(error);
    };
    nextRecognition.onend = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (finalized) {
        cleanup();
        return;
      }
      const bufferedTranscript = typeof transcriptBuffer === 'string' ? transcriptBuffer.trim() : '';
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
      timeoutId = setTimeout(() => {
        if (!finalized && state.status === 'listening') {
          const bufferedTranscript = typeof transcriptBuffer === 'string' ? transcriptBuffer.trim() : '';
          if (bufferedTranscript) {
            finalize(bufferedTranscript, 'completed');
            return;
          }
        }
        if (!finalized && state.status === 'listening' && !receivedResult) {
          try {
            recognition?.stop?.();
          } catch {
            // Ignore timeout stop errors.
          }
          emitEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.', 'no-result');
        }
      }, 9000);
      nextRecognition.start();
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'start_failed';
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
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
