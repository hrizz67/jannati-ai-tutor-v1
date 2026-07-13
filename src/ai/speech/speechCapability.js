export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function supportsSpeechRecognition() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function isMalaySpeechSupported() {
  return supportsSpeechRecognition();
}

export default {
  getSpeechRecognitionConstructor,
  isMalaySpeechSupported,
  supportsSpeechRecognition
};
