import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import worker, {
  handleRequest,
  STT_WORKER_MAX_AUDIO_BYTES,
  STT_WORKER_MODEL
} from '../../workers/stt/src/index.js';

const ALLOWED_ORIGIN = 'https://hrizz67.github.io';

function environment(run = vi.fn(), limit = vi.fn(async () => ({ success: true }))) {
  return {
    AI: { run },
    STT_RATE_LIMITER: { limit },
    CORS_ALLOW_ORIGINS: `${ALLOWED_ORIGIN},http://localhost:5173`
  };
}

function audioRequest({
  origin = ALLOWED_ORIGIN,
  language = 'ms-MY',
  contentType = 'audio/mp4;codecs=mp4a.40.2',
  body = new Uint8Array([97, 98, 99]),
  contentLength
} = {}) {
  const headers = {
    Origin: origin,
    'Content-Type': contentType,
    'X-STT-Language': language
  };
  if (contentLength != null) headers['Content-Length'] = String(contentLength);
  return new Request('https://jannati-stt.example.workers.dev/v1/transcribe', {
    method: 'POST',
    headers,
    body
  });
}

describe('P1.10 Cloudflare Workers AI STT Worker', () => {
  it('exposes a storage-free health check and the configured Whisper model', async () => {
    const response = await worker.fetch(new Request('https://worker.example/health'), {});
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, model: STT_WORKER_MODEL });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('handles an allowed preflight with a narrow CORS policy', async () => {
    const response = await handleRequest(new Request('https://worker.example/v1/transcribe', {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-stt-language'
      }
    }), environment());
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('content-type, x-stt-language');
  });

  it('rejects preflights that request additional browser headers', async () => {
    const response = await handleRequest(new Request('https://worker.example/v1/transcribe', {
      method: 'OPTIONS',
      headers: {
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type,x-stt-language'
      }
    }), environment());
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'headers-not-allowed' });
  });

  it('rejects missing and disallowed origins before reading audio or calling AI', async () => {
    const run = vi.fn();
    const missingOrigin = audioRequest({ origin: '' });
    const disallowedOrigin = audioRequest({ origin: 'https://attacker.example' });
    await expect(handleRequest(missingOrigin, environment(run))).resolves.toMatchObject({ status: 403 });
    await expect(handleRequest(disallowedOrigin, environment(run))).resolves.toMatchObject({ status: 403 });
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    ['ms-MY', 'ms'],
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['ar-SA', 'ar']
  ])('maps %s to the model language %s and returns a safe normalized result', async (requested, mapped) => {
    const run = vi.fn(async () => ({
      text: '  Ucapan   sebenar  ',
      transcription_info: { language_probability: 0.875 }
    }));
    const response = await handleRequest(audioRequest({ language: requested }), environment(run));
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      transcript: 'Ucapan sebenar',
      confidence: 87.5,
      provider: 'cloudflare-workers-ai',
      metadata: { model: STT_WORKER_MODEL, language: mapped }
    });
    expect(run).toHaveBeenCalledWith(STT_WORKER_MODEL, {
      audio: 'YWJj',
      task: 'transcribe',
      language: mapped,
      vad_filter: true,
      condition_on_previous_text: false
    });
  });

  it.each([
    [{ contentType: 'application/json' }, 415, 'unsupported-audio-type'],
    [{ language: 'fr-FR' }, 400, 'unsupported-language'],
    [{ body: new Uint8Array() }, 400, 'empty-audio'],
    [{ contentLength: STT_WORKER_MAX_AUDIO_BYTES + 1 }, 413, 'audio-too-large']
  ])('guards invalid requests before AI inference', async (options, status, error) => {
    const run = vi.fn();
    const response = await handleRequest(audioRequest(options), environment(run));
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error });
    expect(run).not.toHaveBeenCalled();
  });

  it('fails safely when the AI binding is absent or the provider rejects', async () => {
    const unavailable = await handleRequest(audioRequest(), {
      CORS_ALLOW_ORIGINS: ALLOWED_ORIGIN,
      STT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) }
    });
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toEqual({ error: 'stt-unavailable' });

    const providerFailure = await handleRequest(audioRequest(), environment(vi.fn(async () => {
      const error = new Error('SECRET upstream content');
      error.status = 429;
      throw error;
    })));
    expect(providerFailure.status).toBe(429);
    await expect(providerFailure.json()).resolves.toEqual({ error: 'stt-rate-limited' });
  });

  it('fails closed when rate limiting is absent and rejects exhausted origin capacity before AI', async () => {
    const run = vi.fn();
    const missingBinding = await handleRequest(audioRequest(), {
      AI: { run },
      CORS_ALLOW_ORIGINS: ALLOWED_ORIGIN
    });
    expect(missingBinding.status).toBe(503);
    await expect(missingBinding.json()).resolves.toEqual({ error: 'rate-limit-unavailable' });

    const limit = vi.fn(async () => ({ success: false }));
    const exhausted = await handleRequest(audioRequest(), environment(run, limit));
    expect(exhausted.status).toBe(429);
    await expect(exhausted.json()).resolves.toEqual({ error: 'stt-rate-limited' });
    expect(limit).toHaveBeenCalledWith({ key: `stt:${ALLOWED_ORIGIN}` });
    expect(run).not.toHaveBeenCalled();
  });

  it('contains no storage, credential, request-body logging or external fetch path', () => {
    const source = readFileSync(new URL('../../workers/stt/src/index.js', import.meta.url), 'utf8');
    [
      'console.',
      'localStorage',
      'sessionStorage',
      'env.KV',
      'env.R2',
      'env.DB',
      'Authorization',
      'apiToken',
      'apiKey',
      'fetch('
    ].forEach(forbidden => expect(source).not.toContain(forbidden));
  });
});
