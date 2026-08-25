const fs = require('fs');
const path = require('path');
const { RELEASE_DIR, VERSION_PATH } = require('./generateVersion');
const { ROOT_DIR, writeTextWithRetry } = require('./releaseMetadata');

const HEALTH_PATH = path.join(RELEASE_DIR, 'HEALTH.md');
const README_PATH = path.join(ROOT_DIR, 'README.md');

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function badge(label, value, color) {
  return `![${label}](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(value)}-${color})`;
}

function generateHealth(versionData) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
  const summary = readJson(path.join(ROOT_DIR, 'reports/validation/summary.json'));
  const curriculum = readJson(path.join(ROOT_DIR, 'reports/validation/curriculum-report.json'));
  const coverage = curriculum.coverageSummary || {};
  const validationPass = summary.status === 'pass'
    && (summary.totals?.errors || 0) === 0
    && (versionData.status !== 'stable' || (summary.totals?.warnings || 0) === 0);
  const validatorRows = (summary.validators || []).map(item => [
    `Validator: ${item.validator}`,
    item.status === 'pass' && (item.errors || 0) === 0 ? 'PASS' : 'FAIL'
  ]);
  const rows = [
    ['Release metadata', 'PASS'],
    ['Build', 'PASS'],
    ['Build assets', 'PASS'],
    ['Validation', validationPass ? 'PASS' : 'FAIL'],
    ['Coverage', versionData.curriculumCoverage],
    ['Questions', String(coverage.questions || versionData.questionCount || 0)],
    ['Subjects', String(coverage.subjects || 0)],
    ...validatorRows,
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
    `- UASA-tagged questions: ${coverage.uasaTagged || 0}`
  ];

  writeTextWithRetry(HEALTH_PATH, `${lines.join('\n')}\n`);
  return HEALTH_PATH;
}

function updateReadmeBadges(versionData) {
  const releaseBadge = badge('Release', `v${versionData.version}`, 'blue');
  const buildBadge = badge('Build', 'PASS', 'brightgreen');
  const validationPass = versionData.validation?.errors === 0
    && (versionData.status !== 'stable' || versionData.validation?.warnings === 0);
  const validationBadge = badge('Validation', validationPass ? 'PASS' : 'FAIL', validationPass ? 'brightgreen' : 'red');
  const coverageBadge = badge('Coverage', versionData.curriculumCoverage || '0%', 'blue');
  const block = [
    '<!-- release-badges:start -->',
    `${releaseBadge} ${buildBadge} ${validationBadge} ${coverageBadge}`,
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
  writeTextWithRetry(README_PATH, next.endsWith('\n') ? next : `${next}\n`);
}

function generateReleaseHealth() {
  const versionData = readJson(VERSION_PATH);
  if (!versionData.version) throw new Error('Generate VERSION.json before release health artifacts.');
  generateHealth(versionData);
  updateReadmeBadges(versionData);
  console.log(`Generated ${HEALTH_PATH} and refreshed README badges for ${versionData.tag}.`);
  return versionData;
}

if (require.main === module) {
  try {
    generateReleaseHealth();
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

module.exports = {
  HEALTH_PATH,
  generateHealth,
  generateReleaseHealth,
  updateReadmeBadges
};
