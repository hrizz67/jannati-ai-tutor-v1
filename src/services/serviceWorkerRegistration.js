export function getServiceWorkerUrl(baseUrl = '/', appVersion = '0.0.0') {
  const normalizedBase = String(baseUrl || '/').endsWith('/')
    ? String(baseUrl || '/')
    : `${String(baseUrl || '/')}/`;
  return `${normalizedBase}service-worker.js?v=${encodeURIComponent(String(appVersion || '0.0.0'))}`;
}

export async function registerAppServiceWorker({
  serviceWorker = typeof navigator !== 'undefined' ? navigator.serviceWorker : null,
  baseUrl = import.meta.env.BASE_URL,
  appVersion = __APP_VERSION__,
  diagnostics = import.meta.env.DEV,
  logger = console
} = {}) {
  if (!serviceWorker?.register) return null;
  try {
    return await serviceWorker.register(getServiceWorkerUrl(baseUrl, appVersion));
  } catch (error) {
    if (diagnostics) logger?.warn?.('[Jannati] Service worker tidak dapat didaftarkan.', error);
    return null;
  }
}

export default registerAppServiceWorker;
