const fs = require('fs');
const path = require('path');
const { RELEASE_DIR, VERSION } = require('./generateVersion');

const CHANGELOG_PATH = path.join(RELEASE_DIR, 'CHANGELOG.md');

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function generateChangelog(versionData = readJson(path.join(RELEASE_DIR, 'VERSION.json'))) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const summary = readJson(path.resolve('reports/validation/summary.json'));
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Changelog',
    '',
    `## ${versionData.version || VERSION} - ${date}`,
    '',
    '### Features',
    '',
    '- V2.0 alpha release pipeline with automated build, validation, version, changelog, release notes, and health outputs.',
    '- Validator suite reports INFO, WARNING, and ERROR severity levels.',
    '- CI release readiness is based on ERROR severity only.',
    '',
    '### Fixes',
    '',
    '- Release generation now reads validation summaries and curriculum coverage directly from generated reports.',
    '- README badges are refreshed from release health data.',
    '',
    '### Known Issues',
    '',
    `- Validation currently reports ${summary.totals?.warnings || 0} warning(s) and ${summary.totals?.infos || 0} info item(s).`,
    '- Curriculum SK, SP, and estimated time values are inferred where explicit metadata is absent.',
    '- Alpha release remains pre-production until Sprint 11 sign-off.',
    ''
  ];

  fs.writeFileSync(CHANGELOG_PATH, `${lines.join('\n')}\n`);
  return CHANGELOG_PATH;
}

if (require.main === module) {
  console.log(`Generated ${generateChangelog()}.`);
}

module.exports = { CHANGELOG_PATH, generateChangelog };
