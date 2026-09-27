export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function resolveBrowserSignals(userAgent, maxTouchPoints) {
  const browserNavigator = typeof globalThis !== 'undefined' ? globalThis.navigator : null;
  return {
    userAgent: typeof userAgent === 'string'
      ? userAgent
      : String(browserNavigator?.userAgent || ''),
    maxTouchPoints: Number.isFinite(Number(maxTouchPoints))
      ? Number(maxTouchPoints)
      : Number(browserNavigator?.maxTouchPoints) || 0
  };
}

export function isAndroidBrowser(userAgent) {
  const signals = resolveBrowserSignals(userAgent);
  return /Android/i.test(signals.userAgent);
}

export function isIOSWebKitBrowser(userAgent, maxTouchPoints) {
  const signals = resolveBrowserSignals(userAgent, maxTouchPoints);
  const explicitIOSDevice = /iP(hone|ad|od)/i.test(signals.userAgent);
  const desktopModeIPad = /Macintosh/i.test(signals.userAgent) && signals.maxTouchPoints > 1;
  return explicitIOSDevice || desktopModeIPad;
}

export function shouldRecoverMobileSpeech(userAgent, maxTouchPoints) {
  return isIOSWebKitBrowser(userAgent, maxTouchPoints) || isAndroidBrowser(userAgent);
}

export function shouldRecoverMobileSpeechStartup(userAgent, maxTouchPoints) {
  return shouldRecoverMobileSpeech(userAgent, maxTouchPoints);
}

export function supportsSpeechRecognition() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function isMalaySpeechSupported() {
  return supportsSpeechRecognition();
}

export default {
  getSpeechRecognitionConstructor,
  isAndroidBrowser,
  isIOSWebKitBrowser,
  isMalaySpeechSupported,
  shouldRecoverMobileSpeech,
  shouldRecoverMobileSpeechStartup,
  supportsSpeechRecognition
};
