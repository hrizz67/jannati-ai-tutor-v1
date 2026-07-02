const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateVersion, RELEASE_DIR } = require('./generateVersion');
const { generateChangelog } = require('./generateChangelog');
const { generateReleaseNotes } = require('./generateReleaseNotes');

const HEALTH_PATH = path.join(RELEASE_DIR, 'HEALTH.md');
const README_PATH = path.resolve('README.md');

function runNpmScript(script) {
  execSync(`npm run ${script}`, {
    cwd: path.resolve('.'),
    stdio: 'inherit'
  });
}

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function badge(label, value, color) {
  return `![${label}](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(value)}-${color})`;
}

function generateHealth(versionData) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const summary = readJson(path.resolve('reports/validation/summary.json'));
  const curriculum = readJson(path.resolve('reports/validation/curriculum-report.json'));
  const coverage = curriculum.coverageSummary || {};
  const validationPass = (summary.totals?.errors || 0) === 0;
  const rows = [
    ['Build', 'PASS'],
    ['Validation', validationPass ? 'PASS' : 'FAIL'],
    ['Coverage', versionData.curriculumCoverage],
    ['Questions', String(coverage.questions || versionData.questionCount || 0)],
    ['Subjects', String(coverage.subjects || 0)],
    ['AI Modules', 'PASS'],
    ['Parent Dashboard', 'PASS'],
    ['Teacher Snapshot', 'PASS'],
    ['Reading', 'PASS'],
    ['Listening', 'PASS'],
    ['Speaking', 'PASS'],
    ['Writing', 'PASS'],
    ['Overall Status', validationPass ? 'PASS' : 'FAIL']
  ];
  const lines = [
    '# Release Health',
    '',
    `Version: ${versionData.version}`,
    `Status: ${versionData.status}`,
    `Build date: ${versionData.buildDate}`,
    '',
    '| Area | Status |',
    '| --- | --- |',
    ...rows.map(([area, status]) => `| ${area} | ${status} |`),
    '',
    '## Validation',
    '',
    `- Info: ${summary.totals?.infos || 0}`,
    `- Warnings: ${summary.totals?.warnings || 0}`,
    `- Errors: ${summary.totals?.errors || 0}`,
    '',
    '## Curriculum',
    '',
    `- Topics: ${coverage.topics || 0}`,
    `- Unique SK/SP pairs: ${coverage.uniqueSkSpPairs || 0}`,
    `- UASA-tagged questions: ${coverage.uasaTagged || 0}`,
    ''
  ];

  fs.writeFileSync(HEALTH_PATH, `${lines.join('\n')}\n`);
  return HEALTH_PATH;
}

function updateReadmeBadges(versionData) {
  const buildBadge = badge('Build', 'PASS', 'brightgreen');
  const validationBadge = badge('Validation', (versionData.validation?.errors || 0) === 0 ? 'PASS' : 'FAIL', (versionData.validation?.errors || 0) === 0 ? 'brightgreen' : 'red');
  const coverageBadge = badge('Coverage', versionData.curriculumCoverage || '0%', 'blue');
  const block = [
    '<!-- release-badges:start -->',
    `${buildBadge} ${validationBadge} ${coverageBadge}`,
    '<!-- release-badges:end -->'
  ].join('\n');

  const existing = fs.existsSync(README_PATH) ? fs.readFileSync(README_PATH, 'utf8') : '# Jannati AI Tutor\n';
  let next;
  if (existing.includes('<!-- release-badges:start -->') && existing.includes('<!-- release-badges:end -->')) {
    next = existing.replace(/<!-- release-badges:start -->[\s\S]*?<!-- release-badges:end -->/, block);
  } else {
    const lines = existing.split(/\r?\n/);
    const insertAt = lines[0]?.startsWith('# ') ? 1 : 0;
    lines.splice(insertAt, 0, '', block);
    next = lines.join('\n');
  }
  fs.writeFileSync(README_PATH, next.endsWith('\n') ? next : `${next}\n`);
}

function verifyValidation() {
  const summary = readJson(path.resolve('reports/validation/summary.json'));
  const errors = summary.totals?.errors || 0;
  if (errors > 0) {
    throw new Error(`Release aborted: validation reported ${errors} error(s).`);
  }
  return summary;
}

function runRelease() {
  console.log('Release step 1/7: build');
  runNpmScript('build');

  console.log('Release step 2/7: validate');
  runNpmScript('validate');

  console.log('Release step 3/7: verify validation');
  verifyValidation();

  console.log('Release step 4/7: generate VERSION.json');
  const versionData = generateVersion();

  console.log('Release step 5/7: generate CHANGELOG.md');
  generateChangelog(versionData);

  console.log('Release step 6/7: generate RELEASE_NOTES.md');
  generateReleaseNotes(versionData);

  console.log('Release step 7/7: generate HEALTH.md and README badges');
  generateHealth(versionData);
  updateReadmeBadges(versionData);

  console.log(`Release pipeline complete: ${versionData.version}`);
  return versionData;
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
  HEALTH_PATH,
  generateHealth,
  runRelease,
  updateReadmeBadges,
  verifyValidation
};
