const DEFAULT_BUILD_REVISION = typeof __APP_BUILD_REVISION__ !== 'undefined'
  ? __APP_BUILD_REVISION__
  : '';

export function getServiceWorkerUrl(baseUrl = '/', appVersion = '0.0.0', buildRevision = '') {
  const normalizedBase = String(baseUrl || '/').endsWith('/')
    ? String(baseUrl || '/')
    : `${String(baseUrl || '/')}/`;
  const version = String(appVersion || '0.0.0');
  const revision = String(buildRevision || '').trim();
  const cacheIdentity = revision ? `${version}-${revision}` : version;
  return `${normalizedBase}service-worker.js?v=${encodeURIComponent(cacheIdentity)}`;
}

export async function registerAppServiceWorker({
  serviceWorker = typeof navigator !== 'undefined' ? navigator.serviceWorker : null,
  baseUrl = import.meta.env.BASE_URL,
  appVersion = __APP_VERSION__,
  buildRevision = DEFAULT_BUILD_REVISION,
  diagnostics = import.meta.env.DEV,
  logger = console
} = {}) {
  if (!serviceWorker?.register) return null;
  try {
    return await serviceWorker.register(getServiceWorkerUrl(baseUrl, appVersion, buildRevision));
  } catch (error) {
    if (diagnostics) logger?.warn?.('[Jannati] Service worker tidak dapat didaftarkan.', error);
    return null;
  }
}

export default registerAppServiceWorker;
