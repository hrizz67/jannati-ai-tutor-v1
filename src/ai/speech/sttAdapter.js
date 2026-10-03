import { MediaSttError, normalizeMediaSttError } from './mediaSttCapture.js';
import { shouldUseIOSMediaStt } from './speechCapability.js';

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_DURATION_MS = 8000;
const MAX_TRANSCRIPT_LENGTH = 4000;
const MAX_PREVIEW_TRANSCRIPT_LENGTH = 500;

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
  if (!isDeterministicSttPreviewRequested({ ...options, search })) {
    return createUnavailableSttAdapter();
  }
  return createDeterministicSttAdapter({
    transcript: getDeterministicSttPreviewTranscript(search)
  });
}

export const STT_ADAPTER_DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;
export const STT_ADAPTER_MAX_BYTES = DEFAULT_MAX_BYTES;
export const STT_ADAPTER_MAX_DURATION_MS = DEFAULT_MAX_DURATION_MS;

export default {
  createDeterministicSttAdapter,
  createRuntimeSttAdapter,
  createSttAdapter,
  createUnavailableSttAdapter,
  getDeterministicSttPreviewTranscript,
  isDeterministicSttPreviewRequested,
  STT_ADAPTER_DEFAULT_TIMEOUT_MS,
  STT_ADAPTER_MAX_BYTES,
  STT_ADAPTER_MAX_DURATION_MS
};
