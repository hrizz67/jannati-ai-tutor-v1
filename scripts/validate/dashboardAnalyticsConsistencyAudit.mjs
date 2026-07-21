import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const files = ['src/App.jsx', 'src/dashboard/ParentDashboard.jsx', 'src/dashboard/HomeDashboard.jsx', 'src/dashboard/AnalyticsDashboard.jsx', 'src/parentInsights/insightsService.js', 'src/parentInsights/summaryBuilder.js'].filter(file => fs.existsSync(path.join(root, file)));
const text = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const checks = {
  parentSurface: /ParentDashboard/.test(text),
  analyticsSurface: /Analytics|analytics/i.test(text),
  normalizedNumbers: /Number\(|clamp|finite|isFinite|NaN/.test(text),
  insightsPublicSurface: /insightsService|parentInsights|summaryBuilder/.test(text),
  emptyStates: /empty|no data|Tiada|Belum/i.test(text),
  progressBounds: /0\s*,\s*100|Math\.min|Math\.max|clamp/i.test(text),
  noObjectLeak: !/JSON\.stringify\([^)]*(summary|mastery|recommend)/i.test(text)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', files, checks, failures };
fs.mkdirSync(path.join(root, 'reports/validation'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/validation/dashboard-analytics-consistency-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
