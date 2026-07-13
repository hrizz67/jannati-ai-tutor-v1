import VOICE_DEFAULTS from './voiceSettings.js';
import { enqueueVoice, clearVoiceQueue, pauseVoice, resumeVoice, isVoiceSpeaking } from './voiceQueue.js';
import { cancelActiveSpeechRecognition } from '../speech/speechEngine.js';

export function speak(text, options = {}) {
  cancelActiveSpeechRecognition();
  clearVoiceQueue();
  return enqueueVoice(text, { ...VOICE_DEFAULTS, ...options });
}

export function stop() {
  clearVoiceQueue();
}

export function pause() {
  pauseVoice();
}

export function resume() {
  resumeVoice();
}

export function isSpeaking() {
  return isVoiceSpeaking();
}

export function cancel() {
  clearVoiceQueue();
}

export default {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  cancel
};
