import { resolveMobileMediaSttActivation } from './speechCapability.js';
import { getConfiguredSttEndpoint } from './sttEndpoint.js';

export const QUIZ_MOBILE_STT_PILOT_PARAM = 'quizMobileSttPilot';
export const QUIZ_MOBILE_STT_CAPTURE_DURATION_MS = 8000;
export const QUIZ_MOBILE_STT_BUILD_ENABLED =
  import.meta.env?.VITE_QUIZ_MOBILE_STT_PILOT_ENABLED === 'true';

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
  endpoint = import.meta.env?.VITE_QUIZ_STT_ENDPOINT,
  mediaCaptureSupported,
  buildEnabled = QUIZ_MOBILE_STT_BUILD_ENABLED
} = {}) {
  let requested = false;
  try {
    requested = new URLSearchParams(search).get(QUIZ_MOBILE_STT_PILOT_PARAM) === '1';
  } catch {
    // Invalid URL parameters must never activate an audio capture path.
  }
  // A dedicated /v1/quiz/transcribe endpoint is mandatory. Never fall back
  // to the shared reading/speaking /v1/transcribe Worker.
  const configuredEndpoint = getConfiguredSttEndpoint(endpoint);
  let isolatedEndpoint = '';
  try {
    if (new URL(configuredEndpoint).pathname === '/v1/quiz/transcribe') isolatedEndpoint = configuredEndpoint;
  } catch {
    // Unconfigured pilots remain disabled even when the query flag is present.
  }
  const captureSupported = typeof mediaCaptureSupported === 'boolean'
    ? mediaCaptureSupported
    : supportsMediaCapture();
  const mobile = resolveMobileMediaSttActivation({
    search,
    userAgent,
    maxTouchPoints,
    endpoint: isolatedEndpoint,
    mediaCaptureSupported: captureSupported
  });
  return {
    requested,
    buildEnabled,
    enabled: buildEnabled && requested && captureSupported && mobile.active && mobile.endpointConfigured,
    platformFamily: mobile.platformFamily,
    endpointConfigured: mobile.endpointConfigured,
    captureSupported
  };
}
