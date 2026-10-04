const MAX_ENDPOINT_LENGTH = 2048;

function safeEndpointString(value) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_ENDPOINT_LENGTH)
    : '';
}

function readBuildEndpoint() {
  return typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_STT_ENDPOINT
    : '';
}

export function getConfiguredSttEndpoint(endpoint) {
  const normalized = safeEndpointString(typeof endpoint === 'string' ? endpoint : readBuildEndpoint());
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

export function isSttEndpointConfigured(endpoint) {
  return Boolean(getConfiguredSttEndpoint(endpoint));
}
