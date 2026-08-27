import { getLanguageConfig, VOICE_RESULT_CODES } from './voiceConfig.js';
import { normalizeVoiceLanguage } from './languageDetector.js';

let activeSpeech = null;

function getSynthesis() {
  if (typeof window === 'undefined') return null;
  if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return null;
  return window.speechSynthesis;
}

function normalizeLocale(value = '') {
  return String(value || '').trim().replaceAll('_', '-').toLowerCase();
}

function localeRank(locale, priorities) {
  const normalized = normalizeLocale(locale);
  const exactIndex = priorities.findIndex(priority => normalizeLocale(priority) === normalized);
  if (exactIndex >= 0) return exactIndex;
  const base = normalized.split('-')[0];
  const baseIndex = priorities.findIndex(priority => normalizeLocale(priority) === base);
  return baseIndex >= 0 ? baseIndex : Number.MAX_SAFE_INTEGER;
}

function nameRank(name, preferredNames) {
  const normalized = String(name || '').toLowerCase();
  const index = preferredNames.findIndex(preferredName => normalized.includes(preferredName.toLowerCase()));
  return index >= 0 ? index : preferredNames.length + 1;
}

export function selectBestVoice(voices = [], requestedLanguage = 'ms') {
  const language = normalizeVoiceLanguage(requestedLanguage) || 'ms';
  const config = getLanguageConfig(language);
  const matching = Array.from(voices || []).filter(voice => normalizeVoiceLanguage(voice?.lang) === language);
  if (!matching.length) return null;

  return [...matching].sort((left, right) => {
    const localeDifference = localeRank(left.lang, config.localePriority) - localeRank(right.lang, config.localePriority);
    if (localeDifference) return localeDifference;
    const nameDifference = nameRank(left.name, config.preferredNames) - nameRank(right.name, config.preferredNames);
    if (nameDifference) return nameDifference;
    if (Boolean(left.localService) !== Boolean(right.localService)) return left.localService ? -1 : 1;
    return String(left.name || '').localeCompare(String(right.name || ''));
  })[0];
}

export function isBrowserVoiceSupported() {
  return Boolean(getSynthesis());
}

export async function loadBrowserVoices({ timeoutMs = 1200 } = {}) {
  const synth = getSynthesis();
  if (!synth || typeof synth.getVoices !== 'function') return [];
  const immediate = synth.getVoices() || [];
  if (immediate.length) return Array.from(immediate);

  return new Promise(resolve => {
    let settled = false;
    const timers = [];
    const finish = voices => {
      if (settled) return;
      settled = true;
      timers.forEach(timer => window.clearTimeout(timer));
      synth.removeEventListener?.('voiceschanged', check);
      resolve(Array.from(voices || []));
    };
    const check = () => {
      const voices = synth.getVoices?.() || [];
      if (voices.length) finish(voices);
    };

    synth.addEventListener?.('voiceschanged', check);
    [80, 240, 520, 850].filter(delay => delay < timeoutMs).forEach(delay => {
      timers.push(window.setTimeout(check, delay));
    });
    timers.push(window.setTimeout(() => finish(synth.getVoices?.() || []), timeoutMs));
  });
}

export function cancelBrowserSpeech() {
  const synth = getSynthesis();
  const current = activeSpeech;
  activeSpeech = null;
  try {
    synth?.cancel?.();
  } catch {}
  current?.settle?.({
    ok: false,
    success: false,
    code: VOICE_RESULT_CODES.CANCELLED,
    message: 'Bacaan suara dihentikan.'
  });
}

export function pauseBrowserSpeech() {
  try {
    getSynthesis()?.pause?.();
  } catch {}
}

export function resumeBrowserSpeech() {
  try {
    getSynthesis()?.resume?.();
  } catch {}
}

export function isBrowserSpeaking() {
  const synth = getSynthesis();
  return Boolean(activeSpeech || synth?.speaking || synth?.pending);
}

export async function speakBrowserSegment(text, options = {}) {
  const synth = getSynthesis();
  if (!synth) {
    return { ok: false, success: false, code: VOICE_RESULT_CODES.SPEECH_NOT_SUPPORTED, message: 'Peranti ini tidak menyokong bacaan suara.' };
  }

  const language = normalizeVoiceLanguage(options.language || options.lang) || 'ms';
  const config = getLanguageConfig(language);
  const voices = options.voices || await loadBrowserVoices(options);
  const voice = options.voice || selectBestVoice(voices, language);
  if (!voice) {
    return {
      ok: false,
      success: false,
      code: VOICE_RESULT_CODES.VOICE_NOT_AVAILABLE,
      language,
      message: `Voice pack ${config.locale} tidak tersedia pada peranti ini.`
    };
  }

  return new Promise(resolve => {
    let settled = false;
    let utterance;
    const settle = result => {
      if (settled) return;
      settled = true;
      if (activeSpeech?.utterance === utterance) activeSpeech = null;
      resolve(result);
    };
    utterance = new window.SpeechSynthesisUtterance(String(text || ''));
    utterance.lang = voice.lang || config.locale;
    utterance.voice = voice;
    utterance.rate = options.rate;
    utterance.pitch = options.pitch;
    utterance.volume = options.volume;
    utterance.onstart = () => options.onStart?.({ language, voice });
    utterance.onend = () => settle({
      ok: true,
      success: true,
      code: VOICE_RESULT_CODES.SPOKEN,
      language,
      voiceName: voice.name || '',
      voiceLanguage: voice.lang || config.locale
    });
    utterance.onerror = event => settle({
      ok: false,
      success: false,
      code: event?.error === 'canceled' || event?.error === 'interrupted'
        ? VOICE_RESULT_CODES.CANCELLED
        : VOICE_RESULT_CODES.SPEECH_ERROR,
      language,
      error: event?.error || 'speech-error',
      message: 'Bacaan suara tidak dapat dimainkan.'
    });

    activeSpeech = { utterance, settle };
    try {
      synth.speak(utterance);
    } catch (error) {
      settle({
        ok: false,
        success: false,
        code: VOICE_RESULT_CODES.SPEECH_ERROR,
        language,
        error: error?.message || 'speech-error',
        message: 'Bacaan suara tidak dapat dimulakan.'
      });
    }
  });
}

export default {
  isSupported: isBrowserVoiceSupported,
  loadVoices: loadBrowserVoices,
  selectVoice: selectBestVoice,
  speakSegment: speakBrowserSegment,
  cancel: cancelBrowserSpeech,
  pause: pauseBrowserSpeech,
  resume: resumeBrowserSpeech,
  isSpeaking: isBrowserSpeaking
};
