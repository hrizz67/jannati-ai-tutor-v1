const fs = require('fs');
const path = require('path');
const { RELEASE_DIR, VERSION } = require('./generateVersion');
const { writeTextWithRetry } = require('./releaseMetadata');

const CHANGELOG_PATH = path.join(RELEASE_DIR, 'CHANGELOG.md');

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function generateChangelog(versionData = readJson(path.join(RELEASE_DIR, 'VERSION.json'))) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const summary = readJson(path.resolve('reports/validation/summary.json'));
  const curriculum = readJson(path.resolve('reports/validation/curriculum-report.json'));
  const coverage = curriculum.coverageSummary || {};
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Changelog',
    '',
    `## ${versionData.version || VERSION} - ${date}`,
    '',
    '### Release controls',
    '',
    '- Package metadata is the single source of truth for version and release status.',
    '- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.',
    '- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.',
    '',
    '### Quality snapshot',
    '',
    `- ${coverage.subjects || 0} subjects, ${coverage.topics || 0} topics, and ${coverage.questions || versionData.questionCount || 0} questions validated.`,
    `- Validation result: ${summary.totals?.errors || 0} error(s), ${summary.totals?.warnings || 0} warning(s), ${summary.totals?.infos || 0} informational item(s).`,
    '- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.',
    '',
    '### Follow-up work',
    '',
    '- Continue reducing large production chunks through route and subject-level code splitting.',
    '- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.'
  ];

  writeTextWithRetry(CHANGELOG_PATH, `${lines.join('\n')}\n`);
  return CHANGELOG_PATH;
}

if (require.main === module) {
  console.log(`Generated ${generateChangelog()}.`);
}

module.exports = { CHANGELOG_PATH, generateChangelog };
