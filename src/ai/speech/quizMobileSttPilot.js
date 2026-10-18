import { resolveMobileMediaSttActivation } from './speechCapability.js';

export const QUIZ_MOBILE_STT_PILOT_PARAM = 'quizMobileSttPilot';
export const QUIZ_MOBILE_STT_CAPTURE_DURATION_MS = 8000;

function readSearch() {
  return typeof window !== 'undefined' ? window.location?.search || '' : '';
}

function supportsMediaCapture() {
  return typeof window !== 'undefined'
    && typeof window.MediaRecorder === 'function'
    && typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getUserMedia === 'function';
}

/**
 * Explicit, temporary QA-only opt-in for the shared MediaRecorder -> STT route.
 * This URL switch is NOT an access control, authentication or rate limit.
 */
export function resolveQuizMobileSttPilot({
  search = readSearch(),
  userAgent,
  maxTouchPoints,
  endpoint,
  mediaCaptureSupported
} = {}) {
  let requested = false;
  try {
    requested = new URLSearchParams(search).get(QUIZ_MOBILE_STT_PILOT_PARAM) === '1';
  } catch {
    // Invalid URL parameters must never activate an audio capture path.
  }
  const captureSupported = typeof mediaCaptureSupported === 'boolean'
    ? mediaCaptureSupported
    : supportsMediaCapture();
  const mobile = resolveMobileMediaSttActivation({
    search,
    userAgent,
    maxTouchPoints,
    endpoint,
    mediaCaptureSupported: captureSupported
  });
  return {
    requested,
    enabled: requested && captureSupported && mobile.active && mobile.endpointConfigured,
    platformFamily: mobile.platformFamily,
    endpointConfigured: mobile.endpointConfigured,
    captureSupported
  };
}
