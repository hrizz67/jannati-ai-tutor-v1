import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createVerifiedBuildManifest,
  smokeTestDeployment
} from '../../scripts/release/smokeTestDeployment.mjs';

const homepage = 'https://example.test/app/';
const projectUrl = 'https://abcdefghijklmnopqrst.supabase.co';
const publishableKey = 'sb_publishable_ZYXWVUTSRQPONMLKJIHGFEDCBA987654321';
const validConfig = `${projectUrl} ${publishableKey}`;
const temporaryDirectories = [];

function createFixture({ entrySource = 'entry-runtime', lazySource = validConfig } = {}) {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jannati-smoke-'));
  temporaryDirectories.push(distDir);
  fs.mkdirSync(path.join(distDir, 'assets'));
  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    '<!doctype html><script type="module" src="/app/assets/index-entry123.js"></script>'
  );
  fs.writeFileSync(path.join(distDir, 'assets/index-entry123.js'), entrySource);
  fs.writeFileSync(path.join(distDir, 'assets/lazy-config456.js'), lazySource);
  return distDir;
}

function createFetch({
  entrySource = 'entry-runtime',
  lazySource = validConfig,
  htmlEntryReference = '/app/assets/index-entry123.js',
  missingPath = '',
  authStatus = 200,
  allowOrigin = 'https://example.test'
} = {}) {
  const requests = [];
  const fetchImpl = vi.fn(async input => {
    const url = new URL(String(input));
    requests.push(url);
    if (url.hostname === 'abcdefghijklmnopqrst.supabase.co') {
      return new Response('', {
        status: authStatus,
        headers: allowOrigin ? { 'access-control-allow-origin': allowOrigin } : {}
      });
    }
    if (url.pathname === '/app/') {
      return new Response(`<!doctype html><script type="module" src="${htmlEntryReference}"></script>`);
    }
    if (url.pathname === missingPath) return new Response('', { status: 404 });
    if (url.pathname === '/app/assets/index-entry123.js') return new Response(entrySource);
    if (url.pathname === '/app/assets/lazy-config456.js') return new Response(lazySource);
    return new Response('', { status: 404 });
  });
  return { fetchImpl, requests };
}

async function runSmoke(distDir, fetchImpl, target = homepage) {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const logging = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    return await smokeTestDeployment(
      ['--url', target, '--attempts', '1', '--delay-ms', '0'],
      {
        distDir,
        fetchImpl,
        packageData: { homepage, version: '9.9.9' },
        sleepImpl: vi.fn(),
        now: () => 12345
      }
    );
  } finally {
    warning.mockRestore();
    logging.mockRestore();
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
});

describe('production deployment smoke verification', () => {
  it('accepts Supabase configuration in the verified entry JavaScript', async () => {
    const distDir = createFixture({ entrySource: validConfig, lazySource: 'lazy-runtime' });
    const { fetchImpl } = createFetch({ entrySource: validConfig, lazySource: 'lazy-runtime' });

    await expect(runSmoke(distDir, fetchImpl)).resolves.toMatchObject({
      assetCount: 2,
      supabaseHost: 'abcdefghijklmnopqrst.supabase.co'
    });
  });

  it('accepts Supabase configuration found only in a verified lazy chunk', async () => {
    const distDir = createFixture();
    const { fetchImpl } = createFetch();

    await expect(runSmoke(distDir, fetchImpl)).resolves.toMatchObject({ assetCount: 2 });
  });

  it('rejects a missing expected lazy chunk', async () => {
    const distDir = createFixture();
    const { fetchImpl } = createFetch({ missingPath: '/app/assets/lazy-config456.js' });

    await expect(runSmoke(distDir, fetchImpl)).rejects.toThrow(/returned HTTP 404.*lazy-config456/i);
  });

  it('rejects a stale entry chunk even when the HTML entry name is current', async () => {
    const distDir = createFixture();
    const { fetchImpl } = createFetch({ entrySource: 'stale-entry-runtime' });

    await expect(runSmoke(distDir, fetchImpl)).rejects.toThrow(/stale.*index-entry123/i);
  });

  it('rejects a stale lazy chunk', async () => {
    const distDir = createFixture();
    const { fetchImpl } = createFetch({ lazySource: `${validConfig} stale` });

    await expect(runSmoke(distDir, fetchImpl)).rejects.toThrow(/stale.*lazy-config456/i);
  });

  it('rejects a deployment URL outside the configured production origin', async () => {
    const distDir = createFixture();
    const { fetchImpl } = createFetch();

    await expect(runSmoke(distDir, fetchImpl, 'https://wrong.example/app/'))
      .rejects.toThrow(/must match the configured production origin/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects deployed HTML that points the expected entry path at a different origin', async () => {
    const distDir = createFixture();
    const { fetchImpl, requests } = createFetch({
      htmlEntryReference: 'https://untrusted.example/app/assets/index-entry123.js'
    });

    await expect(runSmoke(distDir, fetchImpl)).rejects.toThrow(/entry JavaScript asset.*expected production origin/i);
    expect(requests).toHaveLength(1);
    expect(requests[0].origin).toBe('https://example.test');
  });

  it('rejects a local build with missing Supabase configuration', () => {
    const distDir = createFixture({ entrySource: 'entry-runtime', lazySource: 'lazy-runtime' });

    expect(() => createVerifiedBuildManifest({ distDir, homepage }))
      .toThrow(/exactly one Supabase project URL; found 0/i);
  });

  it('rejects duplicate conflicting Supabase configuration', () => {
    const secondConfig = 'https://zyxwvutsrqponmlkjihg.supabase.co sb_publishable_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
    const distDir = createFixture({ entrySource: validConfig, lazySource: secondConfig });

    expect(() => createVerifiedBuildManifest({ distDir, homepage }))
      .toThrow(/exactly one Supabase project URL; found 2/i);
  });

  it('rejects forbidden service credentials before any network request', async () => {
    const distDir = createFixture({ lazySource: `${validConfig} sb_secret_forbidden-production-key` });
    const { fetchImpl } = createFetch();

    await expect(runSmoke(distDir, fetchImpl)).rejects.toThrow(/forbidden service credential/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a Supabase Auth health failure without reading its response body', async () => {
    const distDir = createFixture();
    const { fetchImpl } = createFetch({ authStatus: 503 });

    await expect(runSmoke(distDir, fetchImpl)).rejects.toThrow(/Auth health returned HTTP 503/i);
  });

  it('requires Supabase Auth CORS to allow the production origin', async () => {
    const distDir = createFixture();
    const { fetchImpl } = createFetch({ allowOrigin: 'https://wrong.example' });

    await expect(runSmoke(distDir, fetchImpl)).rejects.toThrow(/CORS does not allow the production origin/i);
  });
});
