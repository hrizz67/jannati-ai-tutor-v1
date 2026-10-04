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

export function resolveIOSMediaSttActivation({
  search,
  userAgent,
  maxTouchPoints,
  endpoint
} = {}) {
  const iosWebKit = isIOSWebKitBrowser(userAgent, maxTouchPoints);
  const explicitRequested = isIOSMediaSttRequested(search);
  const manualBypassRequested = isIOSWebSpeechBypassRequested(search);
  const webSpeechDiagnosticOverride = iosWebKit
    && !explicitRequested
    && !manualBypassRequested
    && isIOSWebSpeechDiagnosticOverrideRequested(search);
  const endpointConfigured = isSttEndpointConfigured(endpoint);
  const active = iosWebKit
    && !manualBypassRequested
    && !webSpeechDiagnosticOverride
    && (explicitRequested || endpointConfigured);
  const activationReason = !active
    ? ''
    : explicitRequested
      ? 'explicit-ios-media-stt-flag'
      : 'production-ios-auto';
  return {
    active,
    activationReason,
    endpointConfigured,
    manualBypassRequested,
    manualFallback: iosWebKit && !active && !webSpeechDiagnosticOverride
  };
}

export function shouldUseIOSMediaStt({
  search,
  userAgent,
  maxTouchPoints,
  endpoint
} = {}) {
  return resolveIOSMediaSttActivation({ search, userAgent, maxTouchPoints, endpoint }).active;
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
  resolveIOSMediaSttActivation,
  shouldAvoidIOSWebSpeech,
  shouldBypassIOSWebSpeech,
  shouldUseIOSMediaStt,
  shouldRecoverMobileSpeech,
  shouldRecoverMobileSpeechStartup,
  supportsSpeechRecognition
};
