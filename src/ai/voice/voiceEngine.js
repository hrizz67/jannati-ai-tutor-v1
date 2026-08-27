import browserVoiceProvider, { selectBestVoice } from './browserVoiceProvider.js';
import { clampVoiceNumber, getLanguageConfig, LANGUAGE_CONFIG, SUBJECT_LANGUAGE_MAP, VOICE_RESULT_CODES } from './voiceConfig.js';
import { resolveVoiceLanguage, segmentMixedLanguageText } from './languageDetector.js';
import { cancelActiveSpeechRecognition } from '../speech/speechEngine.js';

let sessionId = 0;
let cancellationGeneration = 0;
let activePromise = null;
let activeStatus = {
  state: 'idle',
  language: '',
  voiceName: '',
  voiceLanguage: '',
  code: '',
  text: ''
};
let lastRequest = null;

function result(code, details = {}) {
  const success = code === VOICE_RESULT_CODES.SPOKEN;
  return { ok: success, success, code, ...details };
}

function stopCurrentSession({ recognition = true } = {}) {
  sessionId += 1;
  cancellationGeneration += 1;
  if (recognition) cancelActiveSpeechRecognition();
  browserVoiceProvider.cancel();
  activeStatus = { ...activeStatus, state: 'idle', code: VOICE_RESULT_CODES.CANCELLED };
}

function buildSpeechSettings(language, options = {}) {
  const defaults = getLanguageConfig(language);
  return {
    rate: clampVoiceNumber(options.rate, defaults.rate),
    pitch: clampVoiceNumber(options.pitch, defaults.pitch),
    volume: clampVoiceNumber(options.volume, defaults.volume, 0, 1)
  };
}

async function executeSpeech(text, options, currentSession) {
  if (!browserVoiceProvider.isSupported()) {
    const unavailable = result(VOICE_RESULT_CODES.SPEECH_NOT_SUPPORTED, { message: 'Peranti ini tidak menyokong bacaan suara.' });
    options.onError?.(unavailable);
    return unavailable;
  }

  const language = resolveVoiceLanguage(text, options);
  const segments = segmentMixedLanguageText(text, language);
  const voices = await browserVoiceProvider.loadVoices({ timeoutMs: options.voiceTimeoutMs });
  if (currentSession !== sessionId) return result(VOICE_RESULT_CODES.CANCELLED, { language });

  const requiredLanguages = [...new Set(segments.map(segment => segment.language))];
  const selectedVoices = Object.fromEntries(requiredLanguages.map(segmentLanguage => [
    segmentLanguage,
    selectBestVoice(voices, segmentLanguage)
  ]));
  const missingLanguage = requiredLanguages.find(segmentLanguage => !selectedVoices[segmentLanguage]);
  if (missingLanguage) {
    const config = getLanguageConfig(missingLanguage);
    const unavailable = result(VOICE_RESULT_CODES.VOICE_NOT_AVAILABLE, {
      language: missingLanguage,
      message: `Voice pack ${config.locale} tidak tersedia pada peranti ini.`
    });
    activeStatus = { ...activeStatus, state: 'error', language: missingLanguage, code: unavailable.code };
    options.onError?.(unavailable);
    return unavailable;
  }

  lastRequest = { text, options: { ...options, onStart: undefined, onEnd: undefined, onError: undefined } };
  activeStatus = { state: 'speaking', language, voiceName: '', voiceLanguage: '', code: '', text };
  let hasStarted = false;

  for (const segment of segments) {
    if (currentSession !== sessionId) return result(VOICE_RESULT_CODES.CANCELLED, { language });
    const settings = buildSpeechSettings(segment.language, options);
    const spoken = await browserVoiceProvider.speakSegment(segment.text, {
      ...settings,
      language: segment.language,
      voices,
      voice: selectedVoices[segment.language],
      onStart: details => {
        if (!hasStarted) {
          hasStarted = true;
          options.onStart?.({ language, segments: segments.length });
        }
        activeStatus = {
          ...activeStatus,
          state: 'speaking',
          language: segment.language,
          voiceName: details.voice?.name || '',
          voiceLanguage: details.voice?.lang || ''
        };
      }
    });
    if (!spoken.success) {
      activeStatus = { ...activeStatus, state: spoken.code === VOICE_RESULT_CODES.CANCELLED ? 'idle' : 'error', code: spoken.code };
      if (spoken.code !== VOICE_RESULT_CODES.CANCELLED) options.onError?.(spoken);
      return spoken;
    }
  }

  const completed = result(VOICE_RESULT_CODES.SPOKEN, { language, segments: segments.length });
  activeStatus = { ...activeStatus, state: 'idle', language, code: completed.code };
  options.onEnd?.(completed);
  return completed;
}

export function speak(text, options = {}) {
  const value = String(text ?? '').trim();
  if (!value) return Promise.resolve(result(VOICE_RESULT_CODES.EMPTY_TEXT, { message: 'Tiada teks untuk dibaca.' }));

  const interrupt = options.interrupt !== false;
  if (interrupt) stopCurrentSession();
  const waitingFor = interrupt ? Promise.resolve() : (activePromise || Promise.resolve());
  const queuedGeneration = cancellationGeneration;

  const request = waitingFor.then(() => {
    if (!interrupt && queuedGeneration !== cancellationGeneration) return result(VOICE_RESULT_CODES.CANCELLED);
    cancelActiveSpeechRecognition();
    const currentSession = ++sessionId;
    return executeSpeech(value, options, currentSession);
  });
  const trackedPromise = request.finally(() => {
    if (activePromise === trackedPromise) activePromise = null;
  });
  activePromise = trackedPromise;
  return request;
}

export function stop() {
  stopCurrentSession();
}

export function cancel() {
  stopCurrentSession();
}

export function pause() {
  browserVoiceProvider.pause();
  activeStatus = { ...activeStatus, state: 'paused' };
}

export function resume() {
  browserVoiceProvider.resume();
  if (browserVoiceProvider.isSpeaking()) activeStatus = { ...activeStatus, state: 'speaking' };
}

export function replay(options = {}) {
  if (!lastRequest) return Promise.resolve(result(VOICE_RESULT_CODES.EMPTY_TEXT, { message: 'Belum ada bacaan untuk diulang.' }));
  return speak(lastRequest.text, { ...lastRequest.options, interrupt: true, ...options });
}

export function isSpeaking() {
  return browserVoiceProvider.isSpeaking();
}

export async function getAvailableVoices() {
  const voices = await browserVoiceProvider.loadVoices();
  return voices.map(voice => ({
    name: voice.name || '',
    lang: voice.lang || '',
    localService: Boolean(voice.localService),
    default: Boolean(voice.default)
  }));
}

export async function getVoiceAvailability(language = 'ms') {
  const resolvedLanguage = resolveVoiceLanguage('', { language });
  const voices = await browserVoiceProvider.loadVoices();
  const voice = selectBestVoice(voices, resolvedLanguage);
  return {
    supported: browserVoiceProvider.isSupported(),
    available: Boolean(voice),
    language: resolvedLanguage,
    voiceName: voice?.name || '',
    voiceLanguage: voice?.lang || ''
  };
}

export function getVoiceStatus() {
  return { ...activeStatus, speaking: isSpeaking(), hasReplay: Boolean(lastRequest) };
}

function installDevelopmentHelper() {
  if (typeof window === 'undefined' || !import.meta.env?.DEV) return;
  window.__JANNATI_VOICE_DEBUG__ = Object.freeze({
    speak,
    stop,
    pause,
    resume,
    replay,
    isSpeaking,
    getAvailableVoices,
    getVoiceStatus,
    config: LANGUAGE_CONFIG,
    subjectLanguages: SUBJECT_LANGUAGE_MAP
  });
}

installDevelopmentHelper();

export { VOICE_RESULT_CODES };

export default {
  speak,
  stop,
  cancel,
  pause,
  resume,
  replay,
  isSpeaking,
  getAvailableVoices,
  getVoiceAvailability,
  getVoiceStatus
};
