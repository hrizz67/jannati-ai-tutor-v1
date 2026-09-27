const fs = require('fs');
const path = require('path');
const { ROOT_DIR, getReleaseMetadata } = require('./releaseMetadata');
const { assertNoServiceCredentials } = require('./supabaseProductionGuard.cjs');

const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_INDEX_PATH = path.join(DIST_DIR, 'index.html');
const DIST_ASSETS_DIR = path.join(DIST_DIR, 'assets');

function extractAssetReferences(html) {
  return [...String(html).matchAll(/(?:src|href)=["']([^"']+\/assets\/[^"']+)["']/gi)]
    .map(match => match[1]);
}

function resolveLocalAsset(assetReference, homepage) {
  const siteUrl = new URL(homepage.endsWith('/') ? homepage : `${homepage}/`);
  const assetUrl = new URL(assetReference, siteUrl);
  const basePath = siteUrl.pathname.replace(/\/$/, '');
  let relativePath = decodeURIComponent(assetUrl.pathname);
  if (basePath && relativePath.startsWith(`${basePath}/`)) {
    relativePath = relativePath.slice(basePath.length + 1);
  } else {
    relativePath = relativePath.replace(/^\/+/, '');
  }

  const resolved = path.resolve(DIST_DIR, relativePath);
  if (resolved !== DIST_DIR && !resolved.startsWith(`${DIST_DIR}${path.sep}`)) {
    throw new Error(`Build asset escapes dist: ${assetReference}`);
  }
  return resolved;
}

function readBuiltJavaScript() {
  if (!fs.existsSync(DIST_ASSETS_DIR)) throw new Error('Build output is missing dist/assets.');
  return fs.readdirSync(DIST_ASSETS_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => fs.readFileSync(path.join(DIST_ASSETS_DIR, file), 'utf8'))
    .join('\n');
}

function verifyBuildStructure() {
  const metadata = getReleaseMetadata();
  if (!fs.existsSync(DIST_INDEX_PATH)) throw new Error('Build output is missing dist/index.html.');

  const html = fs.readFileSync(DIST_INDEX_PATH, 'utf8');
  const assets = extractAssetReferences(html);
  const entryAsset = assets.find(reference => /\/assets\/index-[^/]+\.js(?:\?|$)/i.test(reference));
  if (!entryAsset) throw new Error('dist/index.html does not reference a hashed index JavaScript asset.');
  if (!assets.length) throw new Error('dist/index.html does not reference any build assets.');

  const missing = assets.filter(reference => {
    const localPath = resolveLocalAsset(reference, metadata.homepage);
    return !fs.existsSync(localPath) || fs.statSync(localPath).size === 0;
  });
  if (missing.length) throw new Error(`dist/index.html references missing assets: ${missing.join(', ')}`);

  assertNoServiceCredentials(readBuiltJavaScript());

  console.log(`Build structure PASS: ${assets.length} referenced asset(s), entry ${entryAsset}.`);
  console.log('Credential safety PASS: no service-role credential found in JavaScript assets.');
  return { assets, entryAsset };
}

if (require.main === module) {
  try {
    verifyBuildStructure();
  } catch (error) {
    console.error(`Build structure FAIL: ${error.message || error}`);
    process.exit(1);
  }
}

module.exports = {
  DIST_ASSETS_DIR,
  DIST_DIR,
  DIST_INDEX_PATH,
  extractAssetReferences,
  readBuiltJavaScript,
  resolveLocalAsset,
  verifyBuildStructure
};
