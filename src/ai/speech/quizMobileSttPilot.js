import { resolveMobileMediaSttActivation } from './speechCapability.js';
import { getConfiguredSttEndpoint } from './sttEndpoint.js';

export const QUIZ_MOBILE_STT_PILOT_PARAM = 'quizMobileSttPilot';
export const QUIZ_MOBILE_STT_CAPTURE_DURATION_MS = 8000;
export const QUIZ_MOBILE_STT_BUILD_ENABLED =
  import.meta.env?.VITE_QUIZ_MOBILE_STT_PILOT_ENABLED === 'true';
export const QUIZ_MOBILE_STT_AUTO_ENABLED =
  import.meta.env?.VITE_QUIZ_MOBILE_STT_AUTO_ENABLED === 'true';

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
 * Resolve the dedicated Quiz MediaRecorder -> STT route. The legacy URL flag
 * remains an explicit QA opt-in; production activation is a separate build
 * permit and is still enforced by server authentication, access policy and
 * the Worker kill switch.
 */
export function resolveQuizMobileSttPilot({
  search = readSearch(),
  userAgent,
  maxTouchPoints,
  endpoint = import.meta.env?.VITE_QUIZ_STT_ENDPOINT,
  mediaCaptureSupported,
  buildEnabled = QUIZ_MOBILE_STT_BUILD_ENABLED,
  autoEnabled = QUIZ_MOBILE_STT_AUTO_ENABLED
} = {}) {
  let explicitRequested = false;
  try {
    explicitRequested = new URLSearchParams(search).get(QUIZ_MOBILE_STT_PILOT_PARAM) === '1';
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
  const productionRequested = autoEnabled && mobile.platformFamily !== 'desktop'
    && captureSupported && mobile.active && mobile.endpointConfigured;
  const requested = explicitRequested || productionRequested;
  const permitted = productionRequested || (explicitRequested && buildEnabled);
  return {
    requested,
    explicitRequested,
    buildEnabled,
    autoEnabled,
    activationReason: explicitRequested
      ? 'explicit-quiz-media-stt-flag'
      : productionRequested ? 'production-mobile-auto' : 'inactive',
    enabled: permitted && captureSupported && mobile.active && mobile.endpointConfigured,
    platformFamily: mobile.platformFamily,
    endpointConfigured: mobile.endpointConfigured,
    captureSupported
  };
}
