import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const {
  assertVersionAlignment,
  deriveReleaseStatus,
  getReleaseMetadata
} = require('../release/releaseMetadata');

const read = relativePath => fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');
const metadata = getReleaseMetadata();
const packageJson = JSON.parse(read('package.json'));
const deployWorkflow = read('.github/workflows/deploy.yml');
const ciWorkflow = read('.github/workflows/ci.yml');
const versionGenerator = read('scripts/release/generateVersion.js');
const smokeTest = read('scripts/release/smokeTestDeployment.mjs');

assert.equal(assertVersionAlignment().version, packageJson.version, 'Package and lock versions must align.');
assert.equal(assertVersionAlignment({ tag: metadata.expectedTag }).version, metadata.version, 'Expected release tag must pass.');
assert.throws(
  () => assertVersionAlignment({ tag: 'v0.0.0-release-audit-mismatch' }),
  /does not match package version/,
  'A mismatched tag must fail closed.'
);
assert.equal(deriveReleaseStatus('3.2.22'), 'stable');
assert.equal(deriveReleaseStatus('3.3.0-rc.1'), 'release-candidate');
assert.equal(packageJson.scripts?.release, 'node scripts/release/prepareRelease.js');
assert.equal(packageJson.scripts?.['release:check'], 'node scripts/release/verifyReleaseVersion.js');
assert.equal(packageJson.scripts?.['release:build-check'], 'node scripts/release/verifyBuildOutput.js');
assert.equal(packageJson.scripts?.['release:smoke'], 'node scripts/release/smokeTestDeployment.mjs');
assert.match(ciWorkflow, /actions\/checkout@v7/, 'CI must use the current Node 24 checkout action.');
assert.match(deployWorkflow, /actions\/checkout@v7/, 'Deploy must use the current Node 24 checkout action.');
assert.match(ciWorkflow, /actions\/setup-node@v7/, 'CI must use the current setup-node action.');
assert.match(deployWorkflow, /actions\/setup-node@v7/, 'Deploy must use the current setup-node action.');
assert.match(ciWorkflow, /node-version:\s*24/, 'CI must validate and build on Node.js 24.');
assert.match(deployWorkflow, /node-version:\s*24/, 'Deploy must validate and build on Node.js 24.');
assert.match(ciWorkflow, /actions\/upload-artifact@v7/, 'CI must upload QA reports with the current artifact action.');
assert.match(deployWorkflow, /peaceiris\/actions-gh-pages@v4/, 'Deploy must use the Node 24 GitHub Pages action.');
assert.match(deployWorkflow, /tags:\s*(?:\r?\n\s*-\s*)?['"]v\*['"]/m, 'Deploy workflow must be triggered by version tags.');
assert.match(deployWorkflow, /release:check[^\n]*--tag[^\n]*--artifacts/, 'Deploy must verify tag and generated artifacts.');
assert.ok(
  deployWorkflow.indexOf('npm run validate') < deployWorkflow.indexOf('peaceiris/actions-gh-pages'),
  'Validation must run before deployment.'
);
assert.ok(
  deployWorkflow.indexOf('npm run build') < deployWorkflow.indexOf('peaceiris/actions-gh-pages'),
  'Production build must run before deployment.'
);
assert.match(deployWorkflow, /npm run release:smoke/, 'Deploy workflow must smoke-test production.');
assert.match(deployWorkflow, /npm run release:build-check/, 'Deploy workflow must verify local build assets.');
assert.match(deployWorkflow, /secrets\.VITE_SUPABASE_URL/, 'Deploy must receive the production Supabase URL from GitHub Secrets.');
assert.match(deployWorkflow, /secrets\.VITE_SUPABASE_PUBLISHABLE_KEY/, 'Deploy must receive the production Supabase key from GitHub Secrets.');
assert.match(smokeTest, /assetUrl\.pathname !== expectedAssetPath/, 'Smoke test must reject a stale production entry hash.');
assert.match(ciWorkflow, /npm run release:check/, 'CI must validate release metadata.');
assert.doesNotMatch(versionGenerator, /2\.0\.0-alpha\.1/, 'Version generation must not contain the retired hardcoded version.');

console.log(`releasePipelineAudit validation passed for ${metadata.expectedTag}`);
