import { getSupabaseClient } from '../../services/supabaseClient.js';
import { MediaSttError } from './mediaSttCapture.js';
import { createSttAdapter } from './sttAdapter.js';
import { getConfiguredSttEndpoint } from './sttEndpoint.js';

// Loaded only for the QA opt-in. The dedicated Worker independently verifies
// Auth and pilot membership and applies per-account and global rate limits.
const PILOT_MAX_BYTES = 1024 * 1024;
const PILOT_MAX_DURATION_MS = 8000;
const MAX_RESPONSE_CHARS = 16 * 1024;

export function getQuizSttPilotEndpoint(input = import.meta.env?.VITE_QUIZ_STT_ENDPOINT) {
  const endpoint = getConfiguredSttEndpoint(input);
  if (!endpoint) return '';
  try {
    const url = new URL(endpoint);
    return url.pathname === '/v1/quiz/transcribe' ? endpoint : '';
  } catch {
    return '';
  }
}

function providerError(response) {
  if (response?.status === 429) return new MediaSttError('stt-rate-limited', 'pilot-capacity-exhausted');
  if (response?.status === 408 || response?.status === 504) return new MediaSttError('stt-timeout', 'pilot-timeout');
  if (response?.status === 422) return new MediaSttError('no-speech', 'empty-transcript');
  if ([401, 403].includes(response?.status)) return new MediaSttError('stt-unavailable', 'pilot-access-denied');
  return new MediaSttError('stt-unavailable', 'pilot-unavailable');
}

export function createAuthenticatedQuizSttAdapter({
  endpoint,
  fetchImpl = globalThis.fetch,
  getClient = getSupabaseClient
} = {}) {
  const configuredEndpoint = getQuizSttPilotEndpoint(endpoint);
  return createSttAdapter({
    provider: 'cloudflare-workers-ai',
    timeoutMs: 20000,
    maxBytes: PILOT_MAX_BYTES,
    maxDurationMs: PILOT_MAX_DURATION_MS,
    request: async ({ blob, mimeType, language, signal }) => {
      if (!configuredEndpoint || typeof fetchImpl !== 'function') {
        throw new MediaSttError('stt-unavailable', 'pilot-not-configured');
      }
      const supabase = await getClient();
      if (signal?.aborted) throw new MediaSttError('cancelled', 'abort-signal');
      const session = await supabase?.auth?.getSession?.();
      const accessToken = session?.data?.session?.access_token;
      if (typeof accessToken !== 'string' || !accessToken) {
        throw new MediaSttError('stt-unavailable', 'login-required');
      }
      if (signal?.aborted) throw new MediaSttError('cancelled', 'abort-signal');
      let response;
      try {
        response = await fetchImpl(configuredEndpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': mimeType || blob.type || 'application/octet-stream',
            'X-STT-Language': language
          },
          body: blob,
          cache: 'no-store',
          credentials: 'omit',
          mode: 'cors',
          redirect: 'error',
          referrerPolicy: 'no-referrer',
          signal
        });
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') throw error;
        throw new MediaSttError('stt-unavailable', 'pilot-network-error');
      }
      if (!response?.ok) throw providerError(response);
      let body;
      try {
        const text = await response.text();
        if (text.length > MAX_RESPONSE_CHARS) throw new Error('oversize');
        body = JSON.parse(text);
      } catch {
        throw new MediaSttError('stt-unavailable', 'invalid-pilot-response');
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new MediaSttError('stt-unavailable', 'invalid-pilot-response');
      }
      return {
        transcript: body.transcript,
        confidence: body.confidence,
        provider: 'cloudflare-workers-ai',
        metadata: body.metadata
      };
    }
  });
}
