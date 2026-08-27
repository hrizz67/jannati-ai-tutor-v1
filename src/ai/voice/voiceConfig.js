export const CANONICAL_LANGUAGES = Object.freeze({
  MALAY: 'ms',
  ENGLISH: 'en',
  ARABIC: 'ar'
});

export const LANGUAGE_CONFIG = Object.freeze({
  ms: Object.freeze({
    language: 'ms',
    locale: 'ms-MY',
    localePriority: Object.freeze(['ms-MY', 'ms-SG', 'ms-BN', 'ms']),
    preferredNames: Object.freeze(['Yasmin', 'Osman']),
    rate: 0.9,
    pitch: 1,
    volume: 1
  }),
  en: Object.freeze({
    language: 'en',
    locale: 'en-GB',
    localePriority: Object.freeze(['en-GB', 'en-US', 'en-AU', 'en']),
    preferredNames: Object.freeze([]),
    rate: 0.92,
    pitch: 1,
    volume: 1
  }),
  ar: Object.freeze({
    language: 'ar',
    locale: 'ar-SA',
    localePriority: Object.freeze(['ar-SA', 'ar-EG', 'ar-AE', 'ar-KW', 'ar-QA', 'ar-JO', 'ar']),
    preferredNames: Object.freeze([]),
    rate: 0.82,
    pitch: 1,
    volume: 1
  })
});

export const SUBJECT_LANGUAGE_MAP = Object.freeze({
  bm: 'ms',
  math: 'ms',
  english: 'en',
  sains: 'ms',
  arab: 'ar',
  islam: 'ms',
  pj: 'ms',
  pk: 'ms'
});

// Reserved for a future provider without coupling the browser engine to a paid API.
export const FUTURE_NEURAL_VOICES = Object.freeze({
  ms: null,
  en: null,
  ar: null
});

export const VOICE_RESULT_CODES = Object.freeze({
  SPOKEN: 'SPOKEN',
  EMPTY_TEXT: 'EMPTY_TEXT',
  SPEECH_NOT_SUPPORTED: 'SPEECH_NOT_SUPPORTED',
  VOICE_NOT_AVAILABLE: 'VOICE_NOT_AVAILABLE',
  CANCELLED: 'CANCELLED',
  SPEECH_ERROR: 'SPEECH_ERROR'
});

export function clampVoiceNumber(value, fallback, minimum = 0.5, maximum = 1.5) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(maximum, Math.max(minimum, numeric));
}

export function getLanguageConfig(language = 'ms') {
  return LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.ms;
}

export default LANGUAGE_CONFIG;
