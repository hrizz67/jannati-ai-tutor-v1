import VOICE_DEFAULTS from './voiceSettings.js';
import { enqueueVoice, getVoiceAvailability, clearVoiceQueue, pauseVoice, resumeVoice, isVoiceSpeaking } from './voiceQueue.js';
import { cancelActiveSpeechRecognition } from '../speech/speechEngine.js';

export { getVoiceAvailability };

export function speak(text, options = {}) {
  cancelActiveSpeechRecognition();
  clearVoiceQueue();
  return enqueueVoice(text, { ...VOICE_DEFAULTS, ...options });
}

export function stop() {
  cancelActiveSpeechRecognition();
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
  cancelActiveSpeechRecognition();
  clearVoiceQueue();
}

export default {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  getVoiceAvailability,
  cancel
};
