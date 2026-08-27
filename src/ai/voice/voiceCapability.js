export function supportsVoice() {
  return typeof window !== 'undefined'
    && Boolean(window.speechSynthesis)
    && typeof window.SpeechSynthesisUtterance === 'function';
}

export default {
  supportsVoice
};
