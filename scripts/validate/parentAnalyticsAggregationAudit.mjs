import fs from 'node:fs';
const parent = fs.readFileSync('src/dashboard/ParentDashboard.jsx', 'utf8');
const service = fs.readFileSync('src/parentInsights/insightsService.js', 'utf8');
const checks = {
  canonicalProgressUsed: /createCanonicalProgress/.test(parent) && /toParentProgressProfile/.test(parent),
  noPseudoMerge: !/mergeCanonicalParentProfile/.test(parent),
  totalsDerived: /questionsAnswered:\s*global\.totalAttempts/.test(fs.readFileSync('src/utils/canonicalProgress.js', 'utf8')),
  historyPreserved: /history:\s*progress\.activities/.test(fs.readFileSync('src/utils/canonicalProgress.js', 'utf8')) && /sourceProfile\.history/.test(parent),
  subjectInsights: /readSubjectInsight/.test(parent),
  emptyState: /Belum ada penguasaan|Belum ada aktiviti/.test(parent),
  finiteNumbers: /safeNumber|safePercent/.test(parent),
  uasaHistory: /uasaHistory|uasa\?\.history/.test(parent),
  revisionData: /buildRevisionSummary|revisionItems/.test(parent),
  serviceSafeFallback: /return \{[\s\S]*performance:[\s\S]*totalQuestions: 0/.test(service)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/parent-analytics-aggregation-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
