import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const require = createRequire(import.meta.url);
const { inspectProductionSupabaseBundle } = require('./supabaseProductionGuard.cjs');

function readOption(argv, name, fallback = '') {
  const direct = argv.find(value => value.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] || fallback : fallback;
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const digest = source => createHash('sha256').update(source).digest('hex');

function extractEntryAssetPath(html, baseUrl) {
  const match = String(html || '').match(/<script[^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["']/i);
  if (!match) throw new Error('HTML does not reference a hashed index JavaScript asset.');
  const expectedBaseUrl = new URL(baseUrl);
  const entryUrl = new URL(match[1], expectedBaseUrl);
  if (entryUrl.origin !== expectedBaseUrl.origin) {
    throw new Error('HTML entry JavaScript asset must use the expected production origin.');
  }
  return entryUrl.pathname;
}

function listJavaScriptFiles(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...listJavaScriptFiles(absolutePath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(absolutePath);
    }
  }
  return results.sort((left, right) => left.localeCompare(right));
}

function createVerifiedBuildManifest({ distDir, homepage }) {
  const indexPath = path.join(distDir, 'index.html');
  const assetsDirectory = path.join(distDir, 'assets');
  if (!fs.existsSync(indexPath)) throw new Error('Local dist/index.html is required before deployment smoke testing.');
  if (!fs.existsSync(assetsDirectory)) throw new Error('Local dist/assets is required before deployment smoke testing.');

  const productionUrl = new URL(homepage);
  const localHtml = fs.readFileSync(indexPath, 'utf8');
  const expectedEntryPath = extractEntryAssetPath(localHtml, productionUrl);
  const files = listJavaScriptFiles(assetsDirectory);
  if (files.length === 0) throw new Error('Local production build contains no JavaScript assets.');

  const assets = files.map(absolutePath => {
    const relativePath = path.relative(distDir, absolutePath).split(path.sep).join('/');
    const baseUrl = productionUrl.href.endsWith('/')
      ? productionUrl
      : new URL(`${productionUrl.pathname}/`, productionUrl);
    const assetUrl = new URL(relativePath, baseUrl);
    if (assetUrl.origin !== productionUrl.origin) throw new Error('Local build produced a cross-origin JavaScript asset.');
    const source = fs.readFileSync(absolutePath);
    return Object.freeze({
      pathname: assetUrl.pathname,
      digest: digest(source),
      source
    });
  });

  if (!assets.some(asset => asset.pathname === expectedEntryPath)) {
    throw new Error(`Local production entry ${expectedEntryPath} is absent from the verified JavaScript assets.`);
  }

  const localSupabase = inspectProductionSupabaseBundle(Buffer.concat(assets.map(asset => asset.source)).toString('utf8'));
  return Object.freeze({
    expectedEntryPath,
    assets,
    supabaseHost: localSupabase.hostname
  });
}

function assertExpectedProductionTarget(target, homepage) {
  const targetUrl = new URL(target);
  const productionUrl = new URL(homepage);
  const normalizePath = value => value.replace(/\/+$/, '') || '/';
  if (targetUrl.origin !== productionUrl.origin || normalizePath(targetUrl.pathname) !== normalizePath(productionUrl.pathname)) {
    throw new Error('Deployment URL must match the configured production origin and application path.');
  }
  return { targetUrl, productionUrl };
}

function assertSameOriginAssetUrl(assetUrl, productionUrl, expectedPath) {
  const expectedAssetsBase = `${productionUrl.pathname.replace(/\/+$/, '')}/assets/`;
  if (assetUrl.origin !== productionUrl.origin || assetUrl.pathname !== expectedPath || !assetUrl.pathname.startsWith(expectedAssetsBase)) {
    throw new Error(`Production asset path is outside the verified build manifest (${expectedPath}).`);
  }
}

async function fetchVerifiedAsset({ asset, productionUrl, fetchImpl, releaseIdentity }) {
  const assetUrl = new URL(asset.pathname, productionUrl);
  assertSameOriginAssetUrl(assetUrl, productionUrl, asset.pathname);
  assetUrl.searchParams.set('release', releaseIdentity);
  const response = await fetchImpl(assetUrl, {
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(8000)
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Production JavaScript asset redirected unexpectedly (${asset.pathname}).`);
  }
  if (!response.ok) throw new Error(`Production JavaScript asset returned HTTP ${response.status} (${asset.pathname}).`);
  const responseUrl = response.url ? new URL(response.url) : assetUrl;
  assertSameOriginAssetUrl(responseUrl, productionUrl, asset.pathname);
  const source = Buffer.from(await response.arrayBuffer());
  if (digest(source) !== asset.digest) {
    throw new Error(`Production JavaScript asset is stale or does not match the verified build (${asset.pathname}).`);
  }
  return source;
}

async function fetchVerifiedAssets({ assets, productionUrl, fetchImpl, releaseIdentity, concurrency = 8 }) {
  const sources = new Array(assets.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < assets.length) {
      const index = nextIndex;
      nextIndex += 1;
      sources[index] = await fetchVerifiedAsset({
        asset: assets[index],
        productionUrl,
        fetchImpl,
        releaseIdentity
      });
    }
  };
  const workerCount = Math.min(Math.max(1, concurrency), assets.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return sources;
}

async function verifyDeploymentAttempt({
  target,
  homepage,
  version,
  manifest,
  fetchImpl = fetch,
  now = Date.now
}) {
  const { targetUrl, productionUrl } = assertExpectedProductionTarget(target, homepage);
  const releaseIdentity = `${version}-${now()}`;
  const pageUrl = new URL(targetUrl);
  pageUrl.searchParams.set('release', releaseIdentity);
  const pageResponse = await fetchImpl(pageUrl, { redirect: 'manual', cache: 'no-store' });
  if (pageResponse.status >= 300 && pageResponse.status < 400) {
    throw new Error('Production HTML redirected unexpectedly.');
  }
  if (!pageResponse.ok) throw new Error(`HTML returned HTTP ${pageResponse.status}.`);
  const responseUrl = pageResponse.url ? new URL(pageResponse.url) : pageUrl;
  if (responseUrl.origin !== productionUrl.origin || responseUrl.pathname !== targetUrl.pathname) {
    throw new Error('Production HTML was returned from an unexpected origin or application path.');
  }

  const html = await pageResponse.text();
  const deployedEntryPath = extractEntryAssetPath(html, responseUrl);
  if (deployedEntryPath !== manifest.expectedEntryPath) {
    throw new Error(`Production entry asset ${deployedEntryPath} has not reached expected ${manifest.expectedEntryPath}.`);
  }

  const sources = await fetchVerifiedAssets({
    assets: manifest.assets,
    productionUrl,
    fetchImpl,
    releaseIdentity
  });
  const supabase = inspectProductionSupabaseBundle(Buffer.concat(sources).toString('utf8'));
  if (supabase.hostname !== manifest.supabaseHost) {
    throw new Error('Production Supabase project does not match the verified local build.');
  }

  const authHealthUrl = new URL('/auth/v1/health', supabase.url);
  const authHealthResponse = await fetchImpl(authHealthUrl, {
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
    headers: {
      apikey: supabase.publishableKey,
      Origin: productionUrl.origin
    }
  });
  if (authHealthResponse.status >= 300 && authHealthResponse.status < 400) {
    throw new Error(`Supabase Auth health redirected unexpectedly from ${supabase.hostname}.`);
  }
  if (!authHealthResponse.ok) {
    throw new Error(`Supabase Auth health returned HTTP ${authHealthResponse.status} from ${supabase.hostname}.`);
  }
  const allowOrigin = authHealthResponse.headers.get('access-control-allow-origin');
  if (!allowOrigin || !['*', productionUrl.origin].includes(allowOrigin)) {
    throw new Error('Supabase Auth CORS does not allow the production origin.');
  }

  return {
    pageUrl: responseUrl.href,
    assetUrl: new URL(manifest.expectedEntryPath, productionUrl).href,
    assetCount: manifest.assets.length,
    supabaseHost: supabase.hostname
  };
}

async function smokeTestDeployment(argv = process.argv.slice(2), options = {}) {
  const runtimePackage = options.packageData || packageJson;
  const target = readOption(argv, '--url', runtimePackage.homepage);
  const attempts = Math.max(1, Number(readOption(argv, '--attempts', '12')) || 12);
  const delayMs = Math.max(0, Number(readOption(argv, '--delay-ms', '10000')) || 10000);
  const distDir = options.distDir || path.join(ROOT_DIR, 'dist');
  const fetchImpl = options.fetchImpl || fetch;
  const sleepImpl = options.sleepImpl || sleep;
  const now = options.now || Date.now;

  if (!target) throw new Error('Deployment URL is required through --url or package.json homepage.');
  const manifest = createVerifiedBuildManifest({ distDir, homepage: runtimePackage.homepage });

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await verifyDeploymentAttempt({
        target,
        homepage: runtimePackage.homepage,
        version: runtimePackage.version,
        manifest,
        fetchImpl,
        now
      });
      console.log(`Deployment smoke test PASS: ${result.pageUrl}`);
      console.log(`Verified JavaScript assets PASS: ${result.assetCount} (entry ${result.assetUrl}).`);
      console.log(`Supabase Auth PASS: ${result.supabaseHost}.`);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Smoke test attempt ${attempt}/${attempts} failed: ${error.message || error}`);
      if (attempt < attempts) await sleepImpl(delayMs);
    }
  }

  throw new Error(`Deployment smoke test failed: ${lastError?.message || lastError}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  smokeTestDeployment().catch(error => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

export {
  assertExpectedProductionTarget,
  createVerifiedBuildManifest,
  extractEntryAssetPath,
  readOption,
  smokeTestDeployment,
  verifyDeploymentAttempt
};
