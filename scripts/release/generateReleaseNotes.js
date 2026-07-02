const fs = require('fs');
const path = require('path');
const { RELEASE_DIR, VERSION } = require('./generateVersion');

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
    `Status: ${versionData.status || 'alpha'}`,
    `Build date: ${versionData.buildDate || new Date().toISOString()}`,
    '',
    '## New Features',
    '',
    '- Fully automated V2.0 alpha release pipeline.',
    '- Generated release artifacts under `docs/releases/`.',
    '- Release health report with module readiness status.',
    '',
    '## Improvements',
    '',
    '- Validation summary now separates INFO, WARNING, and ERROR severity.',
    '- CI and release gates fail only on ERROR severity validation issues.',
    '- README badges are generated from current release status.',
    '',
    '## Bug Fixes',
    '',
    '- Release metadata is generated from current build and validation outputs instead of hand-maintained values.',
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
    ''
  ];

  fs.writeFileSync(RELEASE_NOTES_PATH, `${lines.join('\n')}\n`);
  return RELEASE_NOTES_PATH;
}

if (require.main === module) {
  console.log(`Generated ${generateReleaseNotes()}.`);
}

module.exports = { RELEASE_NOTES_PATH, generateReleaseNotes };
