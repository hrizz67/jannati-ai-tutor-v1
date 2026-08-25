const fs = require('fs');
const path = require('path');
const { RELEASE_DIR, VERSION } = require('./generateVersion');
const { writeTextWithRetry } = require('./releaseMetadata');

const RELEASE_NOTES_PATH = path.join(RELEASE_DIR, 'RELEASE_NOTES.md');

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function generateReleaseNotes(versionData = readJson(path.join(RELEASE_DIR, 'VERSION.json'))) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const summary = readJson(path.resolve('reports/validation/summary.json'));
  const curriculum = readJson(path.resolve('reports/validation/curriculum-report.json'));
  const coverage = curriculum.coverageSummary || {};
  const difficulty = curriculum.difficultyBalance || {};
  const lines = [
    `# Jannati AI Tutor ${versionData.version || VERSION} Release Notes`,
    '',
    `Status: ${versionData.status || 'unknown'}`,
    `Tag: ${versionData.tag || `v${versionData.version || VERSION}`}`,
    `Build date: ${versionData.buildDate || new Date().toISOString()}`,
    '',
    '## Release Readiness',
    '',
    '- Package, lockfile, release tag, and generated metadata are version-aligned.',
    '- Question-bank regression and release-pipeline audits run before the main validator suite.',
    '- Tagged deployment verifies production configuration, validation, build, and local asset integrity before publishing.',
    '- Production smoke testing waits for the deployed JavaScript entry hash to match the new build.',
    '',
    '## Content Quality',
    '',
    '- All eight Year 2 subjects are included in the release validation scope.',
    '- Questions, curriculum metadata, storage schemas, and content-quality rules are validated together.',
    '',
    '## Validation Summary',
    '',
    `- Status: ${summary.status || 'unknown'}`,
    `- Info: ${summary.totals?.infos || 0}`,
    `- Warnings: ${summary.totals?.warnings || 0}`,
    `- Errors: ${summary.totals?.errors || 0}`,
    '',
    '## Curriculum Coverage',
    '',
    `- Subjects: ${coverage.subjects || 0}`,
    `- Topics: ${coverage.topics || 0}`,
    `- Questions: ${coverage.questions || 0}`,
    `- Unique SK/SP pairs: ${coverage.uniqueSkSpPairs || 0}`,
    `- Curriculum coverage: ${versionData.curriculumCoverage || '0%'}`,
    `- Difficulty balance: mudah ${difficulty.mudah || 0}, sederhana ${difficulty.sederhana || 0}, sukar ${difficulty.sukar || 0}`,
    '',
    '## Known Follow-ups',
    '',
    '- Large JavaScript chunks remain a performance improvement target.',
    '- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.'
  ];

  writeTextWithRetry(RELEASE_NOTES_PATH, `${lines.join('\n')}\n`);
  return RELEASE_NOTES_PATH;
}

if (require.main === module) {
  console.log(`Generated ${generateReleaseNotes()}.`);
}

module.exports = { RELEASE_NOTES_PATH, generateReleaseNotes };
