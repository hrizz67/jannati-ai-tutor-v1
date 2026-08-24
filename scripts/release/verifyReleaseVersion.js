const { assertVersionAlignment } = require('./releaseMetadata');

function readOption(argv, name) {
  const direct = argv.find(value => value.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] || '' : '';
}

function resolveTag(argv = process.argv.slice(2), env = process.env) {
  const cliTag = readOption(argv, '--tag');
  if (cliTag) return cliTag;
  if (env.RELEASE_TAG) return env.RELEASE_TAG;
  if (env.GITHUB_REF_TYPE === 'tag') return env.GITHUB_REF_NAME || env.GITHUB_REF || '';
  return '';
}

function verifyReleaseVersion(argv = process.argv.slice(2), env = process.env) {
  const artifacts = argv.includes('--artifacts');
  const tag = resolveTag(argv, env);
  const metadata = assertVersionAlignment({ tag, artifacts });
  const tagMessage = tag ? `, tag ${metadata.expectedTag}` : '';
  const artifactMessage = artifacts ? ', generated artifacts verified' : '';
  console.log(`Release metadata PASS: ${metadata.name} ${metadata.version} (${metadata.status})${tagMessage}${artifactMessage}.`);
  return metadata;
}

if (require.main === module) {
  try {
    verifyReleaseVersion();
  } catch (error) {
    console.error(`Release metadata FAIL: ${error.message || error}`);
    process.exit(1);
  }
}

module.exports = { readOption, resolveTag, verifyReleaseVersion };
