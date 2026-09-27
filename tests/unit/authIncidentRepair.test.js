import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_ERROR_KIND,
  classifyAccountError,
  describeAccountError,
  formatAccountError,
  getAccountConnectivityForErrorKind
} from '../../src/services/accountErrorMessages.js';
import { getServiceWorkerUrl } from '../../src/services/serviceWorkerRegistration.js';

const require = createRequire(import.meta.url);
const {
  assertNoServiceCredentials,
  inspectProductionSupabaseBundle
} = require('../../scripts/release/supabaseProductionGuard.cjs');
const appSource = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const connectivitySource = readFileSync(new URL('../../src/components/ConnectivityNotice.jsx', import.meta.url), 'utf8');

const validBundle = [
  'https://abcdefghijklmnopqrst.supabase.co',
  'sb_publishable_ZYXWVUTSRQPONMLKJIHGFEDCBA987654321'
].join(' ');

describe('account error copy', () => {
  it('preserves the credential-specific message', () => {
    expect(formatAccountError(new Error('Invalid login credentials')))
      .toBe('E-mel atau kata laluan tidak betul. Semak semula dan cuba lagi.');
  });

  it('turns online fetch failures into actionable account-server copy', () => {
    const result = describeAccountError(new TypeError('Failed to fetch'), { online: true });
    expect(result.kind).toBe(ACCOUNT_ERROR_KIND.SERVER_UNREACHABLE);
    expect(result.connectivity).toBe('unreachable');
    expect(result.message).toContain('pelayan akaun');
    expect(result.message).not.toContain('Failed to fetch');
  });

  it('distinguishes offline, dynamic module, rate-limit and server failures', () => {
    expect(classifyAccountError(new TypeError('Failed to fetch'), { online: false }))
      .toBe(ACCOUNT_ERROR_KIND.OFFLINE);
    expect(classifyAccountError(new TypeError('Failed to fetch dynamically imported module'), { online: true }))
      .toBe(ACCOUNT_ERROR_KIND.MODULE_LOAD);
    expect(classifyAccountError({ message: 'Too many requests', status: 429 }))
      .toBe(ACCOUNT_ERROR_KIND.RATE_LIMITED);
    expect(classifyAccountError({ message: 'Service unavailable', status: 503 }))
      .toBe(ACCOUNT_ERROR_KIND.SERVER_FAILURE);
    expect(getAccountConnectivityForErrorKind(ACCOUNT_ERROR_KIND.INVALID_CREDENTIALS)).toBe('reachable');
  });

  it('keeps Free mode independent from account-server availability', () => {
    expect(appSource).toMatch(/Mula Belajar Free<\/button>/);
    expect(appSource).toMatch(/disabled=\{!name\.trim\(\)\}/);
    expect(connectivitySource).toContain('Mod Free pada peranti masih boleh digunakan.');
  });
});

describe('production Supabase guard', () => {
  it('allows explicit CI fixtures only through the credential-safety check', () => {
    expect(() => assertNoServiceCredentials(
      'https://ci-placeholder.supabase.co sb_publishable_ci-placeholder'
    )).not.toThrow();
    expect(() => inspectProductionSupabaseBundle(
      'https://ci-placeholder.supabase.co sb_publishable_ci-placeholder'
    )).toThrow(/placeholder/i);
  });

  it('accepts one canonical HTTPS host and one browser publishable key', () => {
    const result = inspectProductionSupabaseBundle(validBundle);
    expect(result.hostname).toBe('abcdefghijklmnopqrst.supabase.co');
    expect(result.keyFormat).toBe('sb_publishable');
  });

  it.each([
    'https://ci-placeholder.supabase.co sb_publishable_ci-placeholder',
    'https://your-project.supabase.co sb_publishable_your-key'
  ])('rejects placeholder production configuration', bundle => {
    expect(() => inspectProductionSupabaseBundle(bundle)).toThrow(/placeholder/i);
  });

  it('rejects empty configuration and service-role credentials', () => {
    expect(() => inspectProductionSupabaseBundle('')).toThrow(/exactly one Supabase project URL/i);
    expect(() => inspectProductionSupabaseBundle(`${validBundle} sb_secret_forbidden-production-key`))
      .toThrow(/service credential/i);

    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
    const serviceRoleJwt = `${header}.${payload}.abcdefghijklmnop`;
    expect(() => inspectProductionSupabaseBundle(`${validBundle} ${serviceRoleJwt}`))
      .toThrow(/service credential/i);
  });
});

describe('service worker build revision', () => {
  it('keeps the version fallback and adds a per-build cache identity', () => {
    expect(getServiceWorkerUrl('/jannati-ai-tutor-v1/', '3.13.4'))
      .toBe('/jannati-ai-tutor-v1/service-worker.js?v=3.13.4');
    expect(getServiceWorkerUrl('/jannati-ai-tutor-v1/', '3.13.4', 'commit-abc123'))
      .toBe('/jannati-ai-tutor-v1/service-worker.js?v=3.13.4-commit-abc123');
  });
});
