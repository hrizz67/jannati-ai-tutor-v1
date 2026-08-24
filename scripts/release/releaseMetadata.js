const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const PACKAGE_PATH = path.join(ROOT_DIR, 'package.json');
const LOCK_PATH = path.join(ROOT_DIR, 'package-lock.json');
const VERSION_PATH = path.join(ROOT_DIR, 'docs/releases/VERSION.json');
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required release file is missing: ${path.relative(ROOT_DIR, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function wait(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function writeTextWithRetry(filePath, content, attempts = 10) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      fs.writeFileSync(filePath, content);
      return;
    } catch (error) {
      lastError = error;
      if (!['EBUSY', 'EPERM', 'EACCES', 'UNKNOWN'].includes(error.code) || attempt === attempts) throw error;
      wait(attempt * 75);
    }
  }
  throw lastError;
}

function assertValidVersion(version) {
  if (typeof version !== 'string' || !SEMVER_PATTERN.test(version)) {
    throw new Error(`Invalid semantic version: ${version || '(empty)'}`);
  }
  return version;
}

function deriveReleaseStatus(version) {
  const match = assertValidVersion(version).match(SEMVER_PATTERN);
  const prerelease = match?.[4] || '';
  if (!prerelease) return 'stable';
  if (/^alpha(?:\.|$)/i.test(prerelease)) return 'alpha';
  if (/^beta(?:\.|$)/i.test(prerelease)) return 'beta';
  if (/^rc(?:\.|$)/i.test(prerelease)) return 'release-candidate';
  return 'prerelease';
}

function normalizeTag(tag = '') {
  return String(tag)
    .trim()
    .replace(/^refs\/tags\//, '')
    .replace(/^v(?=\d)/, '');
}

function getReleaseMetadata() {
  const packageJson = readJson(PACKAGE_PATH);
  const packageLock = readJson(LOCK_PATH);
  const version = assertValidVersion(packageJson.version);

  return {
    name: packageJson.name,
    version,
    status: deriveReleaseStatus(version),
    expectedTag: `v${version}`,
    homepage: packageJson.homepage,
    packageJson,
    packageLock
  };
}

function assertVersionAlignment(options = {}) {
  const metadata = getReleaseMetadata();
  const lockVersion = metadata.packageLock.version;
  const lockRootVersion = metadata.packageLock.packages?.['']?.version;

  if (lockVersion !== metadata.version || lockRootVersion !== metadata.version) {
    throw new Error(
      `Version mismatch: package.json=${metadata.version}, package-lock.json=${lockVersion || '(missing)'}, package-lock root=${lockRootVersion || '(missing)'}.`
    );
  }

  const suppliedTag = options.tag || '';
  if (suppliedTag && normalizeTag(suppliedTag) !== metadata.version) {
    throw new Error(`Tag ${suppliedTag} does not match package version ${metadata.version}.`);
  }

  if (options.artifacts) {
    const versionData = readJson(VERSION_PATH);
    if (versionData.version !== metadata.version) {
      throw new Error(
        `Generated release artifact version ${versionData.version || '(missing)'} does not match package version ${metadata.version}.`
      );
    }
    if (versionData.tag !== metadata.expectedTag || versionData.status !== metadata.status) {
      throw new Error('Generated release tag or status does not match package metadata.');
    }
    const artifactWarnings = versionData.validation?.warnings || 0;
    if (
      versionData.validation?.errors !== 0
      || versionData.validation?.status !== 'pass'
      || (metadata.status === 'stable' && artifactWarnings > 0)
    ) {
      throw new Error('Generated release artifacts do not contain a passing validation result.');
    }
  }

  return metadata;
}

module.exports = {
  LOCK_PATH,
  PACKAGE_PATH,
  ROOT_DIR,
  SEMVER_PATTERN,
  VERSION_PATH,
  assertValidVersion,
  assertVersionAlignment,
  deriveReleaseStatus,
  getReleaseMetadata,
  normalizeTag,
  readJson,
  writeTextWithRetry
};
