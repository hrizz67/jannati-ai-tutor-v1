import { MediaSttError, normalizeMediaSttError } from './mediaSttCapture.js';
import { shouldUseIOSMediaStt } from './speechCapability.js';

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_DURATION_MS = 8000;
const CLOUDFLARE_TIMEOUT_MS = 20000;
const MAX_PROVIDER_RESPONSE_LENGTH = 16 * 1024;
const MAX_TRANSCRIPT_LENGTH = 4000;
const MAX_PREVIEW_TRANSCRIPT_LENGTH = 500;
const CLOUDFLARE_PROVIDER = 'cloudflare-workers-ai';

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeString(value, maximum = 160) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum)
    : '';
}

function resolveSearch(search) {
  if (typeof search === 'string') return search;
  return typeof globalThis !== 'undefined' ? globalThis.window?.location?.search || '' : '';
}

function resolveParams(search) {
  try {
    return new URLSearchParams(resolveSearch(search));
  } catch {
    return new URLSearchParams();
  }
}

function normalizeConfidence(value) {
  const number = finiteNumber(value, 0);
  const percentage = number > 0 && number <= 1 ? number * 100 : number;
  return Math.round(Math.max(0, Math.min(100, percentage)) * 100) / 100;
}

function normalizeTranscript(value) {
  return safeString(value, MAX_TRANSCRIPT_LENGTH);
}

function resolveConfiguredEndpoint(endpoint) {
  const value = typeof endpoint === 'string'
    ? endpoint
    : typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_STT_ENDPOINT
      : '';
  const normalized = safeString(value, 2048);
  if (!normalized) return '';
  try {
    const parsed = new URL(normalized);
    const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback)) return '';
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

function mapProviderResponseError(response) {
  if ([408, 504].includes(response?.status)) {
    return new MediaSttError('stt-timeout', 'provider-timeout');
  }
  if ([401, 403, 404].includes(response?.status)) {
    return new MediaSttError('stt-unavailable', 'provider-unavailable');
  }
  return new MediaSttError('stt-error', response?.status === 429 ? 'provider-rate-limited' : 'provider-error');
}

async function parseProviderPayload(response) {
  let responseText = '';
  try {
    responseText = await response.text();
  } catch {
    throw new MediaSttError('stt-error', 'invalid-provider-response');
  }
  if (responseText.length > MAX_PROVIDER_RESPONSE_LENGTH) {
    throw new MediaSttError('stt-error', 'provider-response-too-large');
  }
  try {
    const payload = JSON.parse(responseText);
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  } catch {
    throw new MediaSttError('stt-error', 'invalid-provider-response');
  }
}

function normalizeContext(context) {
  if (typeof context === 'string') return { contextKey: safeString(context, 160) };
  if (!context || typeof context !== 'object') return {};
  return {
    contextKey: safeString(context.contextKey || context.key || '', 160),
    activity: safeString(context.activity || '', 40),
    durationMs: Math.max(0, finiteNumber(context.durationMs, 0))
  };
}

function normalizeProviderMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  const safe = {};
  Object.entries(metadata).slice(0, 20).forEach(([key, value]) => {
    const safeKey = safeString(key, 60);
    if (!safeKey || /(audio|blob|base64|device|transcript|text|payload|bytes?data)/i.test(safeKey)) return;
    if (typeof value === 'boolean') safe[safeKey] = value;
    else if (typeof value === 'number' && Number.isFinite(value)) safe[safeKey] = value;
    else if (typeof value === 'string' && value.length <= 160) safe[safeKey] = safeString(value, 160);
  });
  return safe;
}

function normalizeAdapterError(error, { timedOut = false, externallyAborted = false } = {}) {
  if (timedOut) return new MediaSttError('stt-timeout', 'adapter-timeout');
  if (externallyAborted) return new MediaSttError('cancelled', 'abort-signal');
  const normalized = normalizeMediaSttError(error, 'stt-error');
  if (normalized.code === 'cancelled') return normalized;
  if (normalized.code === 'stt-unavailable' || normalized.code === 'stt-timeout') return normalized;
  return normalized.code === 'no-audio'
    ? normalized
    : new MediaSttError('stt-error', normalized.reason || error?.name || 'provider-error');
}

export function createSttAdapter({
  provider = 'unconfigured',
  request = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxBytes = DEFAULT_MAX_BYTES,
  maxDurationMs = DEFAULT_MAX_DURATION_MS
} = {}) {
  const normalizedProvider = safeString(provider, 80) || 'unconfigured';

  async function transcribe({ blob, mimeType, language, context, signal } = {}) {
    if (signal?.aborted) throw new MediaSttError('cancelled', 'abort-signal');
    if (!blob || !Number.isFinite(Number(blob.size)) || Number(blob.size) <= 0) {
      throw new MediaSttError('no-audio', 'empty-blob');
    }
    const size = Number(blob.size);
    if (size > Math.max(1, finiteNumber(maxBytes, DEFAULT_MAX_BYTES))) {
      throw new MediaSttError('stt-error', 'max-size-exceeded');
    }
    const safeContext = normalizeContext(context);
    if (safeContext.durationMs > Math.max(1, finiteNumber(maxDurationMs, DEFAULT_MAX_DURATION_MS))) {
      throw new MediaSttError('stt-error', 'max-duration-exceeded');
    }
    if (typeof request !== 'function') {
      throw new MediaSttError('stt-unavailable', 'adapter-unconfigured');
    }

    const controller = new AbortController();
    let timeoutId = null;
    let timedOut = false;
    let externallyAborted = false;
    let abortReject = null;
    const abortPromise = new Promise((resolve, reject) => {
      void resolve;
      abortReject = reject;
    });
    const handleExternalAbort = () => {
      externallyAborted = true;
      controller.abort();
      abortReject?.(new MediaSttError('cancelled', 'abort-signal'));
    };
    signal?.addEventListener?.('abort', handleExternalAbort, { once: true });

    const safeMimeType = safeString(mimeType || blob.type || '', 160);
    const safeLanguage = safeString(language, 40);
    try {
      const timeoutPromise = new Promise((resolve, reject) => {
        void resolve;
        timeoutId = globalThis.setTimeout(() => {
          timedOut = true;
          controller.abort();
          reject(new MediaSttError('stt-timeout', 'adapter-timeout'));
        }, Math.max(1, finiteNumber(timeoutMs, DEFAULT_TIMEOUT_MS)));
      });
      const response = await Promise.race([
        Promise.resolve(request({
          blob,
          mimeType: safeMimeType,
          language: safeLanguage,
          context,
          signal: controller.signal
        })),
        timeoutPromise,
        abortPromise
      ]);
      if (signal?.aborted || externallyAborted) throw new MediaSttError('cancelled', 'abort-signal');
      const transcript = normalizeTranscript(response?.transcript);
      if (!transcript) throw new MediaSttError('no-audio', 'empty-transcript');
      return {
        transcript,
        confidence: normalizeConfidence(response?.confidence),
        provider: safeString(response?.provider, 80) || normalizedProvider,
        metadata: {
          ...normalizeProviderMetadata(response?.metadata),
          language: safeLanguage,
          contextKey: safeContext.contextKey,
          activity: safeContext.activity,
          durationMs: safeContext.durationMs,
          size,
          mimeType: safeMimeType
        }
      };
    } catch (error) {
      throw normalizeAdapterError(error, { timedOut, externallyAborted: externallyAborted || signal?.aborted });
    } finally {
      if (timeoutId != null) globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener?.('abort', handleExternalAbort);
    }
  }

  return { provider: normalizedProvider, transcribe };
}

export function createUnavailableSttAdapter() {
  return createSttAdapter({ provider: 'unavailable' });
}

export function createDeterministicSttAdapter({
  transcript = '',
  confidence = 96,
  delayMs = 0
} = {}) {
  const fixedTranscript = normalizeTranscript(transcript);
  return createSttAdapter({
    provider: 'deterministic-preview',
    request: async ({ signal }) => {
      if (signal?.aborted) throw new MediaSttError('cancelled', 'abort-signal');
      const delay = Math.max(0, finiteNumber(delayMs, 0));
      if (delay > 0) {
        await new Promise((resolve, reject) => {
          const handleAbort = () => {
            globalThis.clearTimeout(timerId);
            signal?.removeEventListener?.('abort', handleAbort);
            reject(new MediaSttError('cancelled', 'abort-signal'));
          };
          const timerId = globalThis.setTimeout(() => {
            signal?.removeEventListener?.('abort', handleAbort);
            resolve();
          }, delay);
          signal?.addEventListener?.('abort', handleAbort, { once: true });
        });
      }
      return {
        transcript: fixedTranscript,
        confidence,
        provider: 'deterministic-preview',
        metadata: { deterministic: true }
      };
    }
  });
}

export function getConfiguredSttEndpoint(endpoint) {
  return resolveConfiguredEndpoint(endpoint);
}

export function isCloudflareSttConfigured(endpoint) {
  return Boolean(resolveConfiguredEndpoint(endpoint));
}

export function createCloudflareWorkersAiSttAdapter({
  endpoint,
  fetchImpl = globalThis.fetch,
  timeoutMs = CLOUDFLARE_TIMEOUT_MS
} = {}) {
  const resolvedEndpoint = resolveConfiguredEndpoint(endpoint);
  if (!resolvedEndpoint || typeof fetchImpl !== 'function') return createUnavailableSttAdapter();

  return createSttAdapter({
    provider: CLOUDFLARE_PROVIDER,
    timeoutMs,
    request: async ({ blob, mimeType, language, signal }) => {
      let response;
      try {
        response = await fetchImpl(resolvedEndpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': mimeType || blob.type || 'application/octet-stream',
            'X-STT-Language': language
          },
          body: blob,
          cache: 'no-store',
          credentials: 'omit',
          mode: 'cors',
          referrerPolicy: 'no-referrer',
          signal
        });
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') throw error;
        throw new MediaSttError('stt-unavailable', 'network-error');
      }
      if (!response?.ok) throw mapProviderResponseError(response);
      const payload = await parseProviderPayload(response);
      return {
        transcript: payload.transcript,
        confidence: payload.confidence,
        provider: CLOUDFLARE_PROVIDER,
        metadata: payload.metadata
      };
    }
  });
}

export function getDeterministicSttPreviewTranscript(search) {
  const params = resolveParams(search);
  if (params.get('speechDiag') !== '1') return '';
  return safeString(params.get('mockSpeechTranscript') || '', MAX_PREVIEW_TRANSCRIPT_LENGTH);
}

export function isDeterministicSttPreviewRequested({
  search,
  userAgent,
  maxTouchPoints
} = {}) {
  const resolvedSearch = resolveSearch(search);
  return shouldUseIOSMediaStt({ search: resolvedSearch, userAgent, maxTouchPoints })
    && Boolean(getDeterministicSttPreviewTranscript(resolvedSearch));
}

export function createRuntimeSttAdapter(options = {}) {
  const search = resolveSearch(options.search);
  if (isDeterministicSttPreviewRequested({ ...options, search })) {
    return createDeterministicSttAdapter({
      transcript: getDeterministicSttPreviewTranscript(search)
    });
  }
  return createCloudflareWorkersAiSttAdapter({
    endpoint: options.endpoint,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs
  });
}

export const STT_ADAPTER_DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;
export const STT_CLOUDFLARE_TIMEOUT_MS = CLOUDFLARE_TIMEOUT_MS;
export const STT_ADAPTER_MAX_BYTES = DEFAULT_MAX_BYTES;
export const STT_ADAPTER_MAX_DURATION_MS = DEFAULT_MAX_DURATION_MS;

export default {
  createCloudflareWorkersAiSttAdapter,
  createDeterministicSttAdapter,
  createRuntimeSttAdapter,
  createSttAdapter,
  createUnavailableSttAdapter,
  getDeterministicSttPreviewTranscript,
  getConfiguredSttEndpoint,
  isCloudflareSttConfigured,
  isDeterministicSttPreviewRequested,
  STT_ADAPTER_DEFAULT_TIMEOUT_MS,
  STT_CLOUDFLARE_TIMEOUT_MS,
  STT_ADAPTER_MAX_BYTES,
  STT_ADAPTER_MAX_DURATION_MS
};
