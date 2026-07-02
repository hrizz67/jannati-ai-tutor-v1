const fs = require('fs');
const path = require('path');

const RELEASE_DIR = path.resolve('docs/releases');
const VERSION_PATH = path.join(RELEASE_DIR, 'VERSION.json');
const VERSION = '2.0.0-alpha.1';
const STATUS = 'alpha';

function readJson(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureReleaseDir() {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
}

function calculateCoverage(curriculumReport = {}) {
  const coverage = curriculumReport.coverageSummary || {};
  const questions = coverage.questions || 0;
  const inferredSK = coverage.inferredSK || 0;
  const explicitSK = coverage.explicitSK || 0;
  const inferredSP = coverage.inferredSP || 0;
  const explicitSP = coverage.explicitSP || 0;
  if (!questions) return '0%';
  const normalizedPairs = Math.min(inferredSK + explicitSK, inferredSP + explicitSP);
  return `${Math.round((normalizedPairs / questions) * 100)}%`;
}

function buildVersionData() {
  const summary = readJson(path.resolve('reports/validation/summary.json'));
  const curriculum = readJson(path.resolve('reports/validation/curriculum-report.json'));
  const coverage = curriculum.coverageSummary || {};

  return {
    version: VERSION,
    status: STATUS,
    buildDate: new Date().toISOString(),
    questionCount: coverage.questions || 0,
    curriculumCoverage: calculateCoverage(curriculum),
    validation: {
      status: summary.status || 'unknown',
      info: summary.totals?.infos || 0,
      warnings: summary.totals?.warnings || 0,
      errors: summary.totals?.errors || 0
    }
  };
}

function generateVersion() {
  ensureReleaseDir();
  const versionData = buildVersionData();
  fs.writeFileSync(VERSION_PATH, `${JSON.stringify(versionData, null, 2)}\n`);
  return versionData;
}

if (require.main === module) {
  const versionData = generateVersion();
  console.log(`Generated ${VERSION_PATH} for ${versionData.version}.`);
}

module.exports = {
  VERSION,
  STATUS,
  RELEASE_DIR,
  VERSION_PATH,
  calculateCoverage,
  generateVersion
};
