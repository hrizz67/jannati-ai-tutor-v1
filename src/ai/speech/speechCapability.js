import { isSttEndpointConfigured } from './sttEndpoint.js';

const IOS_WEB_SPEECH_DIAGNOSTIC_MODES = new Set([
  'legacy-simple',
  'single-interim',
  'single-final'
]);

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

function resolveSearchParams(search) {
  const value = typeof search === 'string'
    ? search
    : typeof globalThis !== 'undefined' && globalThis.window?.location
      ? globalThis.window.location.search
      : '';
  try {
    return new URLSearchParams(value || '');
  } catch {
    return new URLSearchParams();
  }
}

export function isIOSWebSpeechBypassRequested(search) {
  return resolveSearchParams(search).get('iosSpeechBypass') === '1';
}

export function isIOSMediaSttRequested(search) {
  return resolveSearchParams(search).get('iosSpeechMode') === 'media-stt';
}

export function isIOSWebSpeechDiagnosticOverrideRequested(search) {
  const params = resolveSearchParams(search);
  return params.get('speechDiag') === '1'
    && IOS_WEB_SPEECH_DIAGNOSTIC_MODES.has(params.get('speechMode'));
}

function supportsMediaCapture(mediaCaptureSupported) {
  if (typeof mediaCaptureSupported === 'boolean') return mediaCaptureSupported;
  return typeof globalThis?.window?.MediaRecorder === 'function'
    && typeof globalThis?.navigator?.mediaDevices?.getUserMedia === 'function';
}

export function resolveMobilePlatformFamily(userAgent, maxTouchPoints) {
  if (isIOSWebKitBrowser(userAgent, maxTouchPoints)) return 'ios';
  if (isAndroidBrowser(userAgent)) return 'android';
  return 'desktop';
}

export function resolveMobileMediaSttActivation({
  search,
  userAgent,
  maxTouchPoints,
  endpoint,
  mediaCaptureSupported
} = {}) {
  const platformFamily = resolveMobilePlatformFamily(userAgent, maxTouchPoints);
  const mobilePlatform = platformFamily !== 'desktop';
  const explicitRequested = platformFamily === 'ios' && isIOSMediaSttRequested(search);
  const manualBypassRequested = platformFamily === 'ios' && isIOSWebSpeechBypassRequested(search);
  const webSpeechDiagnosticOverride = mobilePlatform
    && !explicitRequested
    && !manualBypassRequested
    && isIOSWebSpeechDiagnosticOverrideRequested(search);
  const endpointConfigured = isSttEndpointConfigured(endpoint);
  const active = mobilePlatform
    && !manualBypassRequested
    && !webSpeechDiagnosticOverride
    && (explicitRequested || (
      endpointConfigured
      && (platformFamily === 'ios' || supportsMediaCapture(mediaCaptureSupported))
    ));
  const activationReason = !active
    ? ''
    : explicitRequested
      ? 'explicit-ios-media-stt-flag'
      : platformFamily === 'android'
        ? 'production-android-auto'
        : 'production-ios-auto';
  return {
    active,
    activationReason,
    endpointConfigured,
    manualBypassRequested,
    manualFallback: mobilePlatform && !active && !webSpeechDiagnosticOverride,
    platformFamily
  };
}

export const resolveIOSMediaSttActivation = resolveMobileMediaSttActivation;

export function shouldUseMobileMediaStt(options = {}) {
  return resolveMobileMediaSttActivation(options).active;
}

export function shouldUseIOSMediaStt({
  search,
  userAgent,
  maxTouchPoints,
  endpoint
} = {}) {
  return resolveMobileMediaSttActivation({ search, userAgent, maxTouchPoints, endpoint }).active;
}

export function shouldBypassIOSWebSpeech({
  search,
  userAgent,
  maxTouchPoints
} = {}) {
  return isIOSWebSpeechBypassRequested(search)
    && isIOSWebKitBrowser(userAgent, maxTouchPoints);
}

export function shouldAvoidIOSWebSpeech(options = {}) {
  if (!isIOSWebKitBrowser(options.userAgent, options.maxTouchPoints)) return false;
  if (isIOSWebSpeechBypassRequested(options.search)) return true;
  if (isIOSMediaSttRequested(options.search)) return true;
  return !isIOSWebSpeechDiagnosticOverrideRequested(options.search);
}

export function shouldAvoidMobileWebSpeech(options = {}) {
  const activation = resolveMobileMediaSttActivation(options);
  return activation.active || activation.manualFallback;
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
  isIOSMediaSttRequested,
  isIOSWebKitBrowser,
  isIOSWebSpeechBypassRequested,
  isIOSWebSpeechDiagnosticOverrideRequested,
  isMalaySpeechSupported,
  resolveMobileMediaSttActivation,
  resolveMobilePlatformFamily,
  resolveIOSMediaSttActivation,
  shouldAvoidMobileWebSpeech,
  shouldAvoidIOSWebSpeech,
  shouldBypassIOSWebSpeech,
  shouldUseIOSMediaStt,
  shouldUseMobileMediaStt,
  shouldRecoverMobileSpeech,
  shouldRecoverMobileSpeechStartup,
  supportsSpeechRecognition
};
