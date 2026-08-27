// Compatibility facade for older imports. Browser speech ownership now lives
// in browserVoiceProvider and application orchestration in voiceEngine.
import {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  getVoiceAvailability
} from './voiceEngine.js';

export const enqueueVoice = speak;
export const clearVoiceQueue = stop;
export const pauseVoice = pause;
export const resumeVoice = resume;
export const isVoiceSpeaking = isSpeaking;
export { getVoiceAvailability };

export default {
  enqueueVoice,
  clearVoiceQueue,
  pauseVoice,
  resumeVoice,
  isVoiceSpeaking,
  getVoiceAvailability
};
