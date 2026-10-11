const PUBLIC_INFO_ROUTE_NAMES = Object.freeze(['privacy', 'terms', 'support']);

export function resolvePublicInfoRoute(hash = '') {
  const normalizedHash = String(hash || '').trim();
  const route = PUBLIC_INFO_ROUTE_NAMES.find(name => normalizedHash === `#/${name}`);
  return route || '';
}

export function getSafePublicInfoReturnHash(hash = '') {
  const normalizedHash = String(hash || '').trim();
  return ['', '#/premium', '#/admin', '#/admin/premium'].includes(normalizedHash)
    ? normalizedHash
    : '';
}

export const PUBLIC_INFO_ROUTES = PUBLIC_INFO_ROUTE_NAMES;
