import { supportsVoice } from './voiceCapability.js';

const queue = [];
let activeUtterance = null;
let speakAttempt = 0;

function getSynth() {
  if (!supportsVoice()) return null;
  return window.speechSynthesis || null;
}

function normalizeLanguage(language = '') {
  return String(language || '').trim().toLowerCase().replace('_', '-');
}

function selectVoice(synth, language) {
  const voices = typeof synth?.getVoices === 'function' ? synth.getVoices() : [];
  if (!voices.length) return null;

  const requested = normalizeLanguage(language);
  const base = requested.split('-')[0];
  const matching = voices.filter(voice => {
    const voiceLanguage = normalizeLanguage(voice.lang);
    return voiceLanguage === requested || voiceLanguage.split('-')[0] === base;
  });
  if (!matching.length) return null;

  // Prefer a local, well-known system voice. This avoids PC/Android silently
  // falling back to an unrelated default voice when the language is available.
  const qualityScore = voice => {
    const name = String(voice.name || '').toLowerCase();
    let score = 0;
    if (normalizeLanguage(voice.lang) === requested) score += 40;
    if (voice.localService) score += 20;
    if (/microsoft|google|samsung|enhanced|natural|premium/.test(name)) score += 10;
    if (/compact|espeak|festival|default/.test(name)) score -= 5;
    return score;
  };
  return [...matching].sort((left, right) => qualityScore(right) - qualityScore(left))[0];
}

function waitForVoices(synth) {
  const voices = typeof synth?.getVoices === 'function' ? synth.getVoices() : [];
  if (voices.length || typeof synth?.addEventListener !== 'function') return Promise.resolve();

  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener?.('voiceschanged', finish);
      resolve();
    };
    synth.addEventListener('voiceschanged', finish, { once: true });
    window.setTimeout(finish, 700);
  });
}

async function speakNext() {
  const synth = getSynth();
  if (!synth || activeUtterance || queue.length === 0) return;
  const next = queue.shift();
  if (!next) return;

  const attempt = ++speakAttempt;
  activeUtterance = { starting: true };
  await waitForVoices(synth);
  if (attempt !== speakAttempt) {
    activeUtterance = null;
    return;
  }

  const language = next.options?.lang || 'ms-MY';
  const voice = selectVoice(synth, language);
  if (!voice) {
    activeUtterance = null;
    next.resolve?.(false);
    speakNext();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(next.text);
  utterance.lang = language;
  utterance.voice = voice;
  utterance.rate = Number(next.options?.rate) || 0.88;
  utterance.pitch = Number(next.options?.pitch) || 1;
  utterance.volume = Number(next.options?.volume) || 1;
  utterance.onend = () => {
    activeUtterance = null;
    next.resolve?.(true);
    speakNext();
  };
  utterance.onerror = () => {
    activeUtterance = null;
    next.resolve?.(false);
    speakNext();
  };

  activeUtterance = utterance;
  synth.speak(utterance);
}

export function enqueueVoice(text, options = {}) {
  if (!supportsVoice()) return Promise.resolve(false);
  const value = String(text ?? '').trim();
  if (!value) return Promise.resolve(false);
  return new Promise(resolve => {
    queue.push({ text: value, options, resolve });
    speakNext();
  });
}

export function getVoiceAvailability(language = 'ms-MY') {
  const synth = getSynth();
  const voice = synth ? selectVoice(synth, language) : null;
  return {
    supported: Boolean(synth),
    available: Boolean(voice),
    language,
    voiceName: voice?.name || '',
    voiceLanguage: voice?.lang || ''
  };
}

export function clearVoiceQueue() {
  const synth = getSynth();
  speakAttempt += 1;
  queue.length = 0;
  if (synth?.speaking || synth?.pending) synth.cancel();
  activeUtterance = null;
}

export function pauseVoice() {
  const synth = getSynth();
  if (synth?.speaking) synth.pause();
}

export function resumeVoice() {
  const synth = getSynth();
  if (synth?.paused) synth.resume();
}

export function isVoiceSpeaking() {
  const synth = getSynth();
  return Boolean(synth?.speaking);
}

export default {
  enqueueVoice,
  getVoiceAvailability,
  clearVoiceQueue,
  pauseVoice,
  resumeVoice,
  isVoiceSpeaking
};
