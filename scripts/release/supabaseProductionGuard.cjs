const PLACEHOLDER_VALUES = Object.freeze([
  'ci-placeholder.supabase.co',
  'sb_publishable_ci-placeholder',
  'your-project.supabase.co',
  'sb_publishable_your-key'
]);

const CANONICAL_SUPABASE_HOST = /^[a-z0-9]{20}\.supabase\.co$/;
const SUPABASE_URL_PATTERN = /https:\/\/[a-z0-9-]+\.supabase\.co/gi;
const PUBLISHABLE_KEY_PATTERN = /sb_publishable_[a-zA-Z0-9_-]{12,}/g;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;

function unique(values) {
  return [...new Set(values)];
}

function decodeJwtPayload(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function findServiceRoleCredential(source) {
  if (/sb_secret_[a-zA-Z0-9_-]+/.test(source)) return 'sb_secret';
  for (const token of source.match(JWT_PATTERN) || []) {
    if (decodeJwtPayload(token)?.role === 'service_role') return 'service_role_jwt';
  }
  return null;
}

function inspectProductionSupabaseBundle(source) {
  const bundle = String(source || '');
  const serviceCredential = findServiceRoleCredential(bundle);
  if (serviceCredential) {
    throw new Error(`Production bundle contains a forbidden service credential (${serviceCredential}).`);
  }

  const foundPlaceholder = PLACEHOLDER_VALUES.find(value => bundle.includes(value));
  if (foundPlaceholder) {
    throw new Error(`Production bundle contains forbidden placeholder configuration (${foundPlaceholder}).`);
  }

  const urls = unique(bundle.match(SUPABASE_URL_PATTERN) || []);
  if (urls.length !== 1) {
    throw new Error(`Production bundle must contain exactly one Supabase project URL; found ${urls.length}.`);
  }

  const parsedUrl = new URL(urls[0]);
  if (parsedUrl.protocol !== 'https:' || !CANONICAL_SUPABASE_HOST.test(parsedUrl.hostname)) {
    throw new Error(`Production Supabase URL is not a canonical HTTPS project endpoint (${parsedUrl.hostname || 'unknown'}).`);
  }

  const publishableKeys = unique(bundle.match(PUBLISHABLE_KEY_PATTERN) || []);
  const anonJwtKeys = unique((bundle.match(JWT_PATTERN) || []).filter(token => decodeJwtPayload(token)?.role === 'anon'));
  const keys = [...publishableKeys, ...anonJwtKeys];
  if (keys.length !== 1) {
    throw new Error(`Production bundle must contain exactly one browser publishable key; found ${keys.length}.`);
  }

  return {
    mode: 'production',
    url: parsedUrl.origin,
    hostname: parsedUrl.hostname,
    publishableKey: keys[0],
    keyFormat: publishableKeys.length ? 'sb_publishable' : 'legacy_anon_jwt'
  };
}

module.exports = {
  CANONICAL_SUPABASE_HOST,
  PLACEHOLDER_VALUES,
  inspectProductionSupabaseBundle
};
