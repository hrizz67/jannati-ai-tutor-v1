import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const validators = [
  'subjectIsolationAudit.mjs',
  'uasaSubjectSwitchAudit.mjs',
  'canonicalProgressAudit.mjs',
  'parentAnalyticsAggregationAudit.mjs',
  'aiLiveInteractionAudit.mjs',
  'communicationModulesAudit.mjs',
  'multipleAcceptedAnswersAudit.mjs',
  'mobileOverlayAudit.mjs',
  'audioContentAudit.mjs'
];
const results = validators.map(file => {
  const run = spawnSync(process.execPath, [`scripts/validate/${file}`], { encoding: 'utf8' });
  let parsed = null;
  try { parsed = JSON.parse((run.stdout || '').trim().split(/\r?\n/).filter(Boolean).at(-1) || '{}'); } catch {}
  return { file, status: run.status === 0 ? 'PASS' : 'FAIL', report: parsed };
});
const failures = results.filter(item => item.status !== 'PASS');
const report = {
  status: failures.length ? 'FAIL' : 'PASS',
  validators: results,
  manualDeviceTestingRequired: ['iPhone Safari microphone/audio', 'keyboard and safe-area layout', 'print preview']
};
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/live-mobile-release-blocker-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, failures: failures.map(item => item.file), manualDeviceTestingRequired: report.manualDeviceTestingRequired }, null, 2));
if (failures.length) process.exitCode = 1;
