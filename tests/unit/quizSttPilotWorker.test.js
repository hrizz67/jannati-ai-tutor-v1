import { describe, expect, it, vi } from 'vitest';
import { handleRequest, QUIZ_STT_MAX_AUDIO_BYTES } from '../../workers/quiz-stt/src/index.js';

const ORIGIN = 'https://hrizz67.github.io';
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const TOKEN = 'a'.repeat(64);
const URL = 'https://quiz-pilot.example.workers.dev/v1/quiz/transcribe';

function env(overrides = {}) {
  return {
    QUIZ_STT_PILOT_ENABLED: 'true',
    CORS_ALLOW_ORIGINS: ORIGIN,
    SUPABASE_URL: 'https://jannati-test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    QUIZ_PILOT_ALLOWED_USER_IDS: USER,
    AI: { run: vi.fn(async () => ({ text: '  kucing  ', language_probability: 0.87 })) },
    QUIZ_ACCOUNT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    QUIZ_GLOBAL_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    ...overrides
  };
}
function request(path = URL, {
  origin = ORIGIN, token = TOKEN, type = 'audio/mp4;codecs=mp4a.40.2',
  language = 'ms-MY', contentLength, body = new Uint8Array([1, 2, 3])
} = {}) {
  const headers = {
    Origin: origin,
    'Content-Type': type,
    'X-STT-Language': language
  };
  if (token != null) headers.Authorization = 'Bearer ' + token;
  if (contentLength != null) headers['Content-Length'] = String(contentLength);
  return new Request(path, { method: 'POST', headers, body });
}
const auth = (user = USER, status = 200) => vi.fn(async () => new Response(
  status === 200 ? JSON.stringify({ id: user }) : '{}',
  { status, headers: { 'Content-Type': 'application/json' } }
));
async function send(options = {}, override = {}, fetchImpl = auth()) {
  const bindings = env(override);
  const response = await handleRequest(request(URL, options), bindings, { fetchImpl });
  return { response, bindings, fetchImpl };
}

describe('P1.17-V06 isolated authenticated Quiz STT Worker', () => {
  it('defaults to disabled and cannot reach AI with missing or false server flag', async () => {
    const bindings = env({ QUIZ_STT_PILOT_ENABLED: 'false' });
    const response = await handleRequest(request(), bindings, { fetchImpl: auth() });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'pilot-disabled' });
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('rejects missing, forbidden or spoofed origins even with a valid bearer', async () => {
    for (const origin of ['', 'https://evil.example', 'https://hrizz67.github.io.evil.test']) {
      const { response, bindings, fetchImpl } = await send({ origin });
      expect(response.status).toBe(403);
      expect(fetchImpl).not.toHaveBeenCalled();
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('only allows the dedicated quiz transcription path', async () => {
    const bindings = env();
    const response = await handleRequest(request('https://quiz-pilot.example.workers.dev/v1/transcribe'), bindings);
    expect(response.status).toBe(404);
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('allows a restricted preflight with Authorization but no other headers', async () => {
    const bindings = env();
    const response = await handleRequest(new Request(URL, { method: 'OPTIONS', headers: {
      Origin: ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type,x-stt-language'
    } }), bindings);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('authorization');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    const denied = await handleRequest(new Request(URL, { method: 'OPTIONS', headers: {
      Origin: ORIGIN, 'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'x-admin,authorization'
    } }), bindings);
    expect(denied.status).toBe(403);
  });

  it('requires authenticated Supabase session, not an origin or URL flag', async () => {
    const { response, bindings, fetchImpl } = await send({ token: null });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'authentication-required' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('revalidates token with Supabase Auth on the server and allows only whitelisted UUID', async () => {
    const { response, bindings, fetchImpl } = await send();
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledWith('https://jannati-test.supabase.co/auth/v1/user',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ apikey: 'sb_publishable_test', Authorization: 'Bearer ' + TOKEN }),
        cache: 'no-store',
        redirect: 'manual',
        signal: expect.any(AbortSignal)
      }));
    await expect(response.json()).resolves.toEqual({
      transcript: 'kucing', confidence: 87, provider: 'cloudflare-workers-ai',
      metadata: { language: 'ms', model: '@cf/openai/whisper-large-v3-turbo' }
    });
    expect(bindings.AI.run).toHaveBeenCalledTimes(1);
    expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'quiz-account:' + USER });
    expect(bindings.QUIZ_GLOBAL_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'quiz-pilot:global' });
  });

  it('rejects a valid but non-pilot user before inference or quota spend', async () => {
    const { response, bindings } = await send({}, {}, auth(OTHER));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'pilot-access-denied' });
    expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).not.toHaveBeenCalled();
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('rejects invalid, expired or unverifiable bearer tokens without invoking AI', async () => {
    const { response, bindings } = await send({}, {}, auth(USER, 401));
    expect(response.status).toBe(401);
    expect(bindings.AI.run).not.toHaveBeenCalled();
    const unavailable = await send({}, {}, vi.fn(async () => { throw new Error('offline'); }));
    expect(unavailable.response.status).toBe(503);
    expect(unavailable.bindings.AI.run).not.toHaveBeenCalled();
  });

  it('keeps auth diagnostics opt-in and classifies invalid tokens as 401', async () => {
    const hidden = await send({}, {}, auth(USER, 401));
    await expect(hidden.response.json()).resolves.toEqual({ error: 'authentication-required' });

    const visible = await send({}, { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' }, auth(USER, 401));
    expect(visible.response.status).toBe(401);
    await expect(visible.response.json()).resolves.toEqual({
      error: 'authentication-required',
      authDiagnostic: {
        stage: 'upstream-auth-rejected',
        httpStatus: 401,
        elapsedMs: expect.any(Number)
      }
    });
    expect(visible.bindings.AI.run).not.toHaveBeenCalled();
  });

  it.each([301, 302, 303, 307, 308])(
    'rejects upstream HTTP %s redirects without following or exposing their location',
    async status => {
      const location = `https://redirect.example/auth?token=${TOKEN}`;
      const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: USER }), {
        status,
        headers: { Location: location, 'Content-Type': 'application/json' }
      }));
      const { response, bindings } = await send({}, {
        QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true'
      }, fetchImpl);

      expect(response.status).toBe(503);
      const text = await response.text();
      expect(JSON.parse(text)).toEqual({
        error: 'auth-unavailable',
        authDiagnostic: {
          stage: 'upstream-redirect-rejected',
          httpStatus: status,
          elapsedMs: expect.any(Number)
        }
      });
      expect(text).not.toContain(location);
      expect(text).not.toContain(TOKEN);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect: 'manual' }));
      expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).not.toHaveBeenCalled();
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  );

  it('retains the four-second default authentication timeout', async () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    try {
      const { response } = await send();
      expect(response.status).toBe(200);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 4000);
    } finally {
      timeoutSpy.mockRestore();
    }
  });

  it('reports only bounded stage, upstream status and elapsed time for QA auth failures', async () => {
    const secret = 'secret-value-that-must-not-leak';
    const token = 'z'.repeat(64);
    const response = await handleRequest(request(URL, { token }), env({
      QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true',
      SUPABASE_PUBLISHABLE_KEY: secret
    }), {
      now: vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(137),
      fetchImpl: vi.fn(async () => new Response('provider detail with secret', { status: 502 }))
    });
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({
      error: 'auth-unavailable',
      authDiagnostic: {
        stage: 'upstream-service-rejected',
        httpStatus: 502,
        elapsedMs: 37
      }
    });
    for (const sensitive of [secret, token, USER, 'provider detail']) expect(text).not.toContain(sensitive);
  });

  it('distinguishes invalid configuration, malformed upstream responses, fetch errors and timeout', async () => {
    const cases = [
      {
        override: { SUPABASE_URL: '', QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: auth(),
        stage: 'config-invalid',
        httpStatus: null
      },
      {
        override: { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: vi.fn(async () => new Response('{', { status: 200 })),
        stage: 'upstream-response-invalid',
        httpStatus: 200
      },
      {
        override: { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: vi.fn(async () => { throw new Error('network detail'); }),
        stage: 'fetch-failed',
        httpStatus: null
      },
      {
        override: { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: vi.fn((_url, init) => new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
        })),
        stage: 'fetch-timeout',
        httpStatus: null,
        authTimeoutMs: 1
      }
    ];
    for (const testCase of cases) {
      const bindings = env(testCase.override);
      const response = await handleRequest(request(), bindings, {
        fetchImpl: testCase.fetchImpl,
        authTimeoutMs: testCase.authTimeoutMs
      });
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.authDiagnostic).toEqual({
        stage: testCase.stage,
        httpStatus: testCase.httpStatus,
        elapsedMs: expect.any(Number)
      });
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('fails closed when Supabase configuration, user allowlist or rate limiter bindings are missing', async () => {
    const variants = [
      { SUPABASE_URL: '' },
      { SUPABASE_PUBLISHABLE_KEY: '' },
      { QUIZ_PILOT_ALLOWED_USER_IDS: '' },
      { QUIZ_ACCOUNT_RATE_LIMITER: null },
      { QUIZ_GLOBAL_RATE_LIMITER: null }
    ];
    for (const changes of variants) {
      const { response, bindings } = await send({}, changes);
      expect([403, 503]).toContain(response.status);
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('enforces both account and global 429 capacity before AI', async () => {
    const account = await send({}, { QUIZ_ACCOUNT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: false })) } });
    expect(account.response.status).toBe(429);
    expect(account.bindings.AI.run).not.toHaveBeenCalled();
    expect(account.bindings.QUIZ_GLOBAL_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'quiz-pilot:global' });

    const tokenVerifier = auth();
    const global = await send({}, { QUIZ_GLOBAL_RATE_LIMITER: { limit: vi.fn(async () => ({ success: false })) } }, tokenVerifier);
    expect(global.response.status).toBe(429);
    expect(tokenVerifier).not.toHaveBeenCalled(); // Global cap also protects Supabase Auth capacity.
    expect(global.bindings.AI.run).not.toHaveBeenCalled();
  });

  it('rejects invalid content types, languages and oversized audio before inference', async () => {
    for (const options of [
      { type: 'application/json' },
      { language: 'unknown' },
      { contentLength: QUIZ_STT_MAX_AUDIO_BYTES + 1 },
      { body: new Uint8Array() }
    ]) {
      const { response, bindings } = await send(options);
      expect([400, 413, 415]).toContain(response.status);
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('rejects actual oversized uploads even without Content-Length and never infers', async () => {
    const { response, bindings } = await send({
      body: new Uint8Array(QUIZ_STT_MAX_AUDIO_BYTES + 1)
    });
    expect(response.status).toBe(413);
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('does not store or log recordings and does not expose auth data in output', async () => {
    const { response } = await send();
    const body = await response.text();
    expect(body).not.toContain(TOKEN);
    expect(body).not.toContain(USER);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });
});
