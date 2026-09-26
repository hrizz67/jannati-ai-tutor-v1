import { createReadingSpeechSession } from './speechSession.js';

export const COMMUNICATION_SPEECH_LOCALES = Object.freeze({
  bm: 'ms-MY',
  english: 'en-US',
  arab: 'ar-SA'
});

function normalizeTranscript(value = '') {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function resolveCommunicationSpeechLocale(selectedSet = {}, fallbackId = 'bm') {
  const explicitLocale = typeof selectedSet?.speechLang === 'string'
    ? selectedSet.speechLang.trim()
    : '';
  if (explicitLocale) return explicitLocale;
  const languageId = typeof selectedSet?.id === 'string' && selectedSet.id
    ? selectedSet.id
    : fallbackId;
  return COMMUNICATION_SPEECH_LOCALES[languageId] || COMMUNICATION_SPEECH_LOCALES.bm;
}

export function getCommunicationSpeechErrorMessage(errorCode = '') {
  switch (String(errorCode || '').toLowerCase()) {
    case 'not-allowed':
    case 'service-not-allowed':
    case 'permission-denied':
      return 'Mikrofon tidak dibenarkan. Benarkan akses mikrofon dalam tetapan peranti. Anda masih boleh menaip jawapan secara manual.';
    case 'no-speech':
    case 'no-result':
      return 'Tiada suara dikesan. Cuba bercakap semula atau taip jawapan secara manual.';
    case 'audio-capture':
      return 'Mikrofon tidak dapat dikesan. Semak mikrofon dan tetapan sistem, atau taip jawapan secara manual.';
    case 'network':
      return 'Perkhidmatan pengecaman suara tidak dapat dihubungi. Semak sambungan internet atau taip jawapan secara manual.';
    case 'language-not-supported':
    case 'language-unavailable':
      return 'Bahasa suara ini tidak disokong oleh pelayar atau peranti. Cuba pelayar lain atau taip jawapan secara manual.';
    case 'bad-grammar':
      return 'Perkhidmatan pengecaman tidak dapat memproses bahasa ini. Cuba semula atau taip jawapan secara manual.';
    case 'speech-unavailable':
    case 'start-failed':
      return 'Pengecaman suara tidak tersedia pada pelayar ini. Anda masih boleh menaip jawapan secara manual.';
    default:
      return 'Pengecaman suara menghadapi masalah. Cuba semula atau taip jawapan secara manual.';
  }
}

export function createCommunicationSpeechErrorResult(errorCode = 'unknown_error', message = '') {
  const normalizedCode = String(errorCode || 'unknown_error').toLowerCase();
  const status = normalizedCode === 'no-speech' || normalizedCode === 'no-result'
    ? 'empty'
    : normalizedCode === 'not-allowed' || normalizedCode === 'service-not-allowed' || normalizedCode === 'permission-denied'
      ? 'permission-denied'
      : 'technical-error';
  return {
    status,
    transcript: '',
    correct: false,
    confidence: 0,
    matched: [],
    matchedKeywords: [],
    tertinggal: [],
    missingWords: [],
    missed: [],
    words: [],
    errorCode: normalizedCode,
    message: message || getCommunicationSpeechErrorMessage(normalizedCode),
    score: null,
    isAssessed: false,
    manualFallbackAvailable: true
  };
}

export function createSpeechReviewCandidate(result = {}) {
  const text = normalizeTranscript(result?.transcript);
  if (!text) return null;
  const confidence = Number.isFinite(Number(result?.confidence)) ? Number(result.confidence) : 0;
  return {
    candidate: { text, confidence },
    result: {
      status: 'needs-confirmation',
      transcript: '',
      score: null,
      correct: false,
      confidence,
      matched: [],
      matchedKeywords: [],
      tertinggal: [],
      missingWords: [],
      missed: [],
      words: [],
      errorCode: '',
      message: '',
      isAssessed: false
    }
  };
}

export function confirmCommunicationSpeechCandidate(candidate = {}, scoreFactory = null) {
  return assessCommunicationText(candidate?.text, scoreFactory, 'speech-confirmed');
}

export function assessCommunicationText(value = '', scoreFactory = null, source = 'manual') {
  const transcript = normalizeTranscript(value);
  if (!transcript) return null;
  const score = typeof scoreFactory === 'function' ? scoreFactory(transcript) : {};
  return {
    ...(score && typeof score === 'object' ? score : {}),
    status: 'completed',
    transcript,
    source
  };
}

export function createCommunicationSpeechSession({
  activity = 'reading',
  selectedSet = {},
  fallbackId = 'bm',
  contextKey = '',
  getCurrentContextKey = null,
  resultFactory = undefined,
  sessionFactory = createReadingSpeechSession,
  onChange = null,
  onTranscript = null,
  onResult = null,
  onCandidate = null,
  onFailure = null,
  onStopped = null
} = {}) {
  const speechLang = resolveCommunicationSpeechLocale(selectedSet, fallbackId);
  let active = true;
  let failureEmitted = false;
  let session = null;

  const isCurrent = () => active && (
    typeof getCurrentContextKey !== 'function'
    || getCurrentContextKey() === contextKey
  );

  const emitFailure = errorCode => {
    if (!isCurrent() || failureEmitted) return null;
    failureEmitted = true;
    const failure = createCommunicationSpeechErrorResult(errorCode);
    onFailure?.(failure);
    return failure;
  };

  session = sessionFactory({
    lang: speechLang,
    resultFactory,
    onChange(nextState) {
      if (isCurrent()) onChange?.(nextState);
    },
    onTranscript(nextTranscript, nextState) {
      if (isCurrent()) onTranscript?.(normalizeTranscript(nextTranscript), nextState);
    },
    onComplete(nextResult) {
      if (!isCurrent()) return;
      if (activity === 'speaking') {
        const review = createSpeechReviewCandidate(nextResult);
        if (review) onCandidate?.(review);
        else emitFailure('no-result');
        return;
      }
      onResult?.(nextResult);
    },
    onEmpty(nextResult) {
      emitFailure(nextResult?.errorCode || 'no-result');
    },
    onError(errorCode) {
      if (errorCode === 'aborted' || !isCurrent()) return;
      emitFailure(errorCode || 'unknown_error');
      active = false;
      session?.cancel?.();
    },
    onStopped(reason) {
      if (isCurrent()) onStopped?.(reason);
    }
  });

  return {
    supported: Boolean(session?.supported),
    speechLang,
    start() {
      active = true;
      failureEmitted = false;
      const started = session?.start?.();
      if (started?.unsupported) emitFailure('speech-unavailable');
      return started;
    },
    stop() {
      session?.stop?.();
    },
    cancel() {
      active = false;
      session?.cancel?.();
    },
    getState() {
      return session?.getState?.() || null;
    },
    get recognition() {
      return session?.recognition || null;
    }
  };
}

export async function playCommunicationAudio({ item = {}, languageLabel = '', speak: speakText } = {}) {
  try {
    const played = await speakText?.(item?.prompt || '', { language: item?.speechLang });
    if (played?.success) return { success: true, message: '', speechLang: item?.speechLang || '' };
    const label = languageLabel || 'bahasa yang dipilih';
    return {
      success: false,
      speechLang: item?.speechLang || '',
      message: `Suara ${label} tidak tersedia pada peranti ini. Pasang voice pack ${label} dalam tetapan Text-to-speech peranti atau cuba Chrome/Edge yang terkini.`
    };
  } catch {
    return {
      success: false,
      speechLang: item?.speechLang || '',
      message: 'Audio tidak dapat dimainkan sekarang. Semak volume, voice pack dan kebenaran bunyi peranti.'
    };
  }
}

export default {
  COMMUNICATION_SPEECH_LOCALES,
  assessCommunicationText,
  confirmCommunicationSpeechCandidate,
  createCommunicationSpeechErrorResult,
  createCommunicationSpeechSession,
  createSpeechReviewCandidate,
  getCommunicationSpeechErrorMessage,
  playCommunicationAudio,
  resolveCommunicationSpeechLocale
};
