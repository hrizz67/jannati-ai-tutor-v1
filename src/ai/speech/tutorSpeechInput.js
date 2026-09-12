import { createSpeechSession, mergeSpeechTranscript } from './speechEngine.js';
import { stop as stopVoice } from '../voice/voiceEngine.js';

function clean(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function mergeTutorSpeechDraft(currentDraft = '', transcript = '') {
  return mergeSpeechTranscript(clean(currentDraft), clean(transcript));
}

export function createTutorSpeechInputSession({
  contextKey = '',
  getCurrentContextKey = () => '',
  getDraft = () => '',
  lang = 'ms-MY',
  onDraftChange = null,
  onStateChange = null,
  onMessage = null,
  sessionFactory = createSpeechSession,
  stopSpeaking = stopVoice
} = {}) {
  const startedContextKey = clean(contextKey);
  let active = true;

  const isCurrent = () => active && startedContextKey === clean(getCurrentContextKey?.());
  const setState = state => {
    if (isCurrent()) onStateChange?.(state);
  };

  const session = sessionFactory({
    lang,
    resultFactory(transcript) {
      return {
        correct: false,
        confidence: 100,
        transcript: clean(transcript),
        normalizedTranscript: clean(transcript),
        matchedAnswer: '',
        acceptedAnswers: []
      };
    },
    onChange(nextState = {}) {
      if (!isCurrent()) return;
      const status = nextState.status === 'completed' && nextState.transcript
        ? 'ready'
        : nextState.status || 'idle';
      setState(status);
    },
    onResult(result = {}) {
      if (!isCurrent()) return;
      if (result.unsupported) {
        setState('unsupported');
        return;
      }
      const transcript = clean(result.transcript);
      if (!transcript) return;
      onDraftChange?.(mergeTutorSpeechDraft(getDraft?.(), transcript));
      onMessage?.('Transkrip sudah dimasukkan. Semak dahulu sebelum hantar.');
      setState('ready');
    },
    onEmpty(result = {}) {
      if (!isCurrent()) return;
      onMessage?.(clean(result.message) || 'Suara belum dapat dikesan. Cuba sekali lagi.');
      setState('error');
    },
    onError(error = '') {
      if (!isCurrent() || error === 'aborted') return;
      onMessage?.('Mikrofon tidak dapat digunakan sekarang. Kamu masih boleh menaip jawapan.');
      setState('error');
    }
  });

  return {
    supported: Boolean(session?.supported),
    start() {
      if (!active) return null;
      stopSpeaking?.();
      return session?.start?.();
    },
    stop() {
      if (!active) return;
      session?.stop?.();
    },
    cancel() {
      if (!active) return;
      active = false;
      session?.cancel?.();
    },
    getState() {
      return session?.getState?.() || { status: 'idle' };
    }
  };
}

export default {
  createTutorSpeechInputSession,
  mergeTutorSpeechDraft
};
