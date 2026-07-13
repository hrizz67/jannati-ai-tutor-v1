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

  function emit(nextState) {
    state = {
      ...state,
      ...nextState
    };
    onChange?.(state);
  }

  function finalize(transcript = '', reason = 'completed') {
    const result = matchSpeechAnswer(transcript, expectedAnswer, acceptedAnswers);
    const nextState = {
      status: reason,
      transcript: result.transcript,
      confidence: result.confidence,
      correct: result.correct,
      result
    };
    emit(nextState);
    onResult?.(result);
    return result;
  }

  function cleanup() {
    if (activeSpeechRecognitionCancel === cancel) {
      activeSpeechRecognitionCancel = null;
    }
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition = null;
    }
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
      recognition?.abort?.();
    } catch {
      // Ignore abort errors.
    }
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

    cancel();
    activeSpeechRecognitionCancel = cancel;
    const nextRecognition = new Recognition();
    recognition = nextRecognition;
    nextRecognition.lang = lang;
    nextRecognition.interimResults = false;
    nextRecognition.continuous = false;
    nextRecognition.maxAlternatives = 1;

    nextRecognition.onstart = () => emit({ status: 'listening', error: '' });
    nextRecognition.onresult = event => {
      const results = Array.isArray(event?.results) ? event.results : [];
      const startIndex = Number.isInteger(event?.resultIndex) ? Math.max(0, event.resultIndex) : 0;
      const transcript = results
        .slice(startIndex)
        .map(result => String(result?.[0]?.transcript || '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();
      emit({ status: 'processing', transcript });
      finalize(transcript, 'completed');
    };
    nextRecognition.onerror = event => {
      const error = event?.error || 'unknown_error';
      emit({ status: 'idle', error });
      onError?.(error);
    };
    nextRecognition.onend = () => {
      if (state.status === 'listening') {
        emit({ status: 'idle' });
      }
      cleanup();
    };

    try {
      nextRecognition.start();
      return state;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'start_failed';
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
  isSpeechAvailable,
  supportsSpeechRecognition,
  speakAnswerPrompt
};
