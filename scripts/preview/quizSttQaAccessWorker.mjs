// Generates the Cloudflare Pages advanced-mode gate for the isolated Quiz STT
// QA artifact. Credentials are runtime-only Pages secrets and are never
// embedded in the uploaded artifact.
export const QUIZ_STT_QA_ACCESS_BINDINGS = Object.freeze({
  username: 'QA_ACCESS_USERNAME',
  password: 'QA_ACCESS_PASSWORD'
});

export function buildQuizSttQaAccessWorker({ supabaseOrigin, workerOrigin }) {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self' ${supabaseOrigin} ${workerOrigin}`,
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "manifest-src 'self'",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:"
  ].join('; ');

  return `// Generated QA-only Cloudflare Pages gate. Do not edit or reuse in production.
const SECURITY_HEADERS = ${JSON.stringify({
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Cache-Control': 'private, no-store, max-age=0',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
    'Content-Security-Policy': contentSecurityPolicy
  })};

function secureEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (a.charCodeAt(index % Math.max(a.length, 1)) || 0)
      ^ (b.charCodeAt(index % Math.max(b.length, 1)) || 0);
  }
  return mismatch === 0;
}

function unauthorized() {
  return new Response('QA access required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Jannati Quiz STT QA", charset="UTF-8"',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    }
  });
}

function credentials(request) {
  const value = request.headers.get('Authorization') || '';
  if (!value.startsWith('Basic ')) return null;
  try {
    const decoded = atob(value.slice(6));
    const separator = decoded.indexOf(':');
    if (separator < 1) return null;
    return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const expectedUsername = String(env.${QUIZ_STT_QA_ACCESS_BINDINGS.username} || '');
    const expectedPassword = String(env.${QUIZ_STT_QA_ACCESS_BINDINGS.password} || '');
    if (!expectedUsername || !expectedPassword) {
      return new Response('QA access is not configured.', {
        status: 503,
        headers: { 'Cache-Control': 'private, no-store, max-age=0' }
      });
    }
    const supplied = credentials(request);
    if (!supplied || !secureEqual(supplied.username, expectedUsername)
      || !secureEqual(supplied.password, expectedPassword)) return unauthorized();

    const assetResponse = await env.ASSETS.fetch(request);
    const response = new Response(assetResponse.body, assetResponse);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
    return response;
  }
};
`;
}
