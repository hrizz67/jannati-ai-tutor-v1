export function isInternalUiSurfaceEnabled({ dev = import.meta.env.DEV, search } = {}) {
  if (dev) return true;
  const resolvedSearch = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  return new URLSearchParams(resolvedSearch).has('debug');
}
