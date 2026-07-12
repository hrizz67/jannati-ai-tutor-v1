import { supportsVoice } from './voiceCapability.js';

const queue = [];
let activeUtterance = null;

function getSynth() {
  if (!supportsVoice()) return null;
  return window.speechSynthesis || null;
}

function speakNext() {
  const synth = getSynth();
  if (!synth || activeUtterance || queue.length === 0) return;
  const next = queue.shift();
  if (!next) return;

  const utterance = new SpeechSynthesisUtterance(next.text);
  utterance.lang = next.options?.lang || 'ms-MY';
  utterance.rate = Number(next.options?.rate) || 0.95;
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

export function clearVoiceQueue() {
  const synth = getSynth();
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
  clearVoiceQueue,
  pauseVoice,
  resumeVoice,
  isVoiceSpeaking
};
