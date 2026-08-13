const fs = require('fs');
const {
  LOCK_PATH,
  PACKAGE_PATH,
  assertValidVersion,
  assertVersionAlignment,
  readJson,
  writeTextWithRetry
} = require('./releaseMetadata');

function resolveTargetVersion(argv = process.argv.slice(2)) {
  const versionOption = argv.find(value => value.startsWith('--version='));
  if (versionOption) return versionOption.slice('--version='.length);
  const optionIndex = argv.indexOf('--version');
  if (optionIndex >= 0) return argv[optionIndex + 1] || '';
  return argv.find(value => !value.startsWith('-')) || '';
}

function writeJson(filePath, value) {
  writeTextWithRetry(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function setPackageVersion(version) {
  const safeVersion = assertValidVersion(version);
  const packageJson = readJson(PACKAGE_PATH);
  const packageLock = readJson(LOCK_PATH);

  packageJson.version = safeVersion;
  packageLock.version = safeVersion;
  packageLock.packages = packageLock.packages || {};
  packageLock.packages[''] = packageLock.packages[''] || {};
  packageLock.packages[''].version = safeVersion;

  writeJson(PACKAGE_PATH, packageJson);
  writeJson(LOCK_PATH, packageLock);
  return assertVersionAlignment();
}

function prepareRelease(argv = process.argv.slice(2)) {
  const targetVersion = resolveTargetVersion(argv);
  if (!targetVersion) {
    throw new Error('Target version is required. Example: npm run release -- 3.2.23');
  }

  const originalPackage = fs.readFileSync(PACKAGE_PATH, 'utf8');
  const originalLock = fs.readFileSync(LOCK_PATH, 'utf8');

  try {
    const metadata = setPackageVersion(targetVersion);
    console.log(`Preparing ${metadata.expectedTag} from package metadata.`);
    const { runRelease } = require('./release');
    return runRelease();
  } catch (error) {
    try {
      writeTextWithRetry(PACKAGE_PATH, originalPackage);
      writeTextWithRetry(LOCK_PATH, originalLock);
    } catch (rollbackError) {
      throw new Error(
        `${error.message || error} Rollback also failed: ${rollbackError.message || rollbackError}`
      );
    }
    throw error;
  }
}

if (require.main === module) {
  try {
    prepareRelease();
  } catch (error) {
    console.error(`Release preparation failed: ${error.message || error}`);
    process.exit(1);
  }
}

module.exports = { prepareRelease, resolveTargetVersion, setPackageVersion };
