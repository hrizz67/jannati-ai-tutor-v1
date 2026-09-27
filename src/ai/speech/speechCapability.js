export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isIOSWebKitBrowser(userAgent, maxTouchPoints) {
  const browserNavigator = typeof globalThis !== 'undefined' ? globalThis.navigator : null;
  const resolvedUserAgent = typeof userAgent === 'string'
    ? userAgent
    : String(browserNavigator?.userAgent || '');
  const resolvedTouchPoints = Number.isFinite(Number(maxTouchPoints))
    ? Number(maxTouchPoints)
    : Number(browserNavigator?.maxTouchPoints) || 0;
  const explicitIOSDevice = /iP(hone|ad|od)/i.test(resolvedUserAgent);
  const desktopModeIPad = /Macintosh/i.test(resolvedUserAgent) && resolvedTouchPoints > 1;
  return explicitIOSDevice || desktopModeIPad;
}

export function supportsSpeechRecognition() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function isMalaySpeechSupported() {
  return supportsSpeechRecognition();
}

export default {
  getSpeechRecognitionConstructor,
  isIOSWebKitBrowser,
  isMalaySpeechSupported,
  supportsSpeechRecognition
};
