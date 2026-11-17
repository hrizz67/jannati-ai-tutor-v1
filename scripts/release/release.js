const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { ROOT_DIR, assertVersionAlignment } = require('./releaseMetadata');

const buildOnlySettings = Object.freeze([
  ['RELEASE_BUILD_STT_ENDPOINT', 'VITE_STT_ENDPOINT'],
  ['RELEASE_BUILD_QUIZ_STT_ENDPOINT', 'VITE_QUIZ_STT_ENDPOINT'],
  ['RELEASE_BUILD_QUIZ_MOBILE_STT_PILOT_ENABLED', 'VITE_QUIZ_MOBILE_STT_PILOT_ENABLED']
]);

function getValidationEnvironment(source = process.env) {
  const env = { ...source };
  for (const [, viteName] of buildOnlySettings) delete env[viteName];
  return env;
}

function getReleaseBuildEnvironment(source = process.env) {
  const env = getValidationEnvironment(source);
  for (const [buildName, viteName] of buildOnlySettings) {
    // The explicit release-only input is the sole permitted source. Do not
    // accidentally inherit a developer/CI shell's STT configuration.
    const value = String(source[buildName] || '').trim();
    if (value) env[viteName] = value;
  }
  return env;
}

function runNpmScript(script, args = [], env = process.env) {
  if (!/^[a-z0-9:_-]+$/i.test(script)) throw new Error(`Unsafe npm script name: ${script}`);
  if (!Array.isArray(args) || args.some(arg => !/^--[a-z0-9-]+$/i.test(arg))) {
    throw new Error(`Unsafe npm script arguments: ${args.join(' ')}`);
  }

  const options = { cwd: ROOT_DIR, stdio: 'inherit', env };
  const npmArgs = ['run', script, ...(args.length ? ['--', ...args] : [])];
  const npmCli = process.env.npm_execpath;
  if (npmCli && fs.existsSync(npmCli)) {
    execFileSync(process.execPath, [npmCli, ...npmArgs], options);
    return;
  }

  if (process.platform === 'win32') {
    execFileSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', ['npm.cmd', ...npmArgs].join(' ')],
      options
    );
    return;
  }

  execFileSync('npm', npmArgs, options);
}

function runNodeScript(relativePath) {
  execFileSync(process.execPath, [path.join(ROOT_DIR, relativePath)], {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
}

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function verifyValidation() {
  const summary = readJson(path.join(ROOT_DIR, 'reports/validation/summary.json'));
  const errors = summary.totals?.errors || 0;
  const warnings = summary.totals?.warnings || 0;
  const metadata = assertVersionAlignment();
  if (summary.status !== 'pass' || errors > 0 || (metadata.status === 'stable' && warnings > 0)) {
    throw new Error(
      `Release aborted: validation status=${summary.status || 'unknown'}, errors=${errors}, warnings=${warnings}.`
    );
  }
  return summary;
}

function runRelease() {
  console.log('Release step 1/10: verify package and lock metadata');
  assertVersionAlignment();

  console.log('Release step 2/10: validate');
  runNpmScript('validate', ['--write-reports'], getValidationEnvironment());

  console.log('Release step 3/10: verify validation gate');
  verifyValidation();

  console.log('Release step 4/10: build production bundle');
  runNpmScript('build', [], getReleaseBuildEnvironment());

  console.log('Release step 5/10: verify production build assets');
  runNpmScript('release:build-check');

  console.log('Release step 6/10: generate VERSION.json');
  runNodeScript('scripts/release/generateVersion.js');

  console.log('Release step 7/10: generate CHANGELOG.md');
  runNodeScript('scripts/release/generateChangelog.js');

  console.log('Release step 8/10: generate RELEASE_NOTES.md');
  runNodeScript('scripts/release/generateReleaseNotes.js');

  console.log('Release step 9/10: generate health and README badges');
  runNodeScript('scripts/release/generateHealth.js');

  console.log('Release step 10/10: verify generated artifacts');
  const metadata = assertVersionAlignment({ artifacts: true });

  console.log(`Release pipeline complete: ${metadata.expectedTag}`);
  return metadata;
}

if (require.main === module) {
  try {
    runRelease();
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

module.exports = {
  getValidationEnvironment,
  getReleaseBuildEnvironment,
  runRelease,
  runNodeScript,
  verifyValidation
};
