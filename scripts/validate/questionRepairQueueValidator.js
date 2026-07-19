const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(ROOT, 'reports', 'validation');
const REPAIR_REPORT = path.join(REPORT_DIR, 'question-repair-report.json');
const AUDIT_REPORT = path.join(REPORT_DIR, 'question-bank-audit-report.json');
const OUTPUT_JSON = path.join(REPORT_DIR, 'question-repair-queue-report.json');
const OUTPUT_DOC = path.join(ROOT, 'docs', 'QUESTION_REPAIR_QUEUE_V1_REPORT.md');

async function loadModule(relPath) {
  const modulePath = path.join(ROOT, relPath);
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

function validateQueueItem(item = {}) {
  const required = ['questionId', 'subject', 'topic', 'issueType', 'severity', 'priority', 'impactScore', 'reason', 'suggestedAction'];
  const missing = required.filter(key => String(item[key] ?? '').trim() === '');
  const validSeverity = ['Critical', 'High', 'Medium', 'Low'].includes(String(item.severity || '').trim());
  const validPriority = ['P0', 'P1', 'P2', 'P3'].includes(String(item.priority || '').trim());
  const validImpact = Number.isFinite(Number(item.impactScore)) && Number(item.impactScore) >= 0 && Number(item.impactScore) <= 100;
  return missing.length === 0 && validSeverity && validPriority && validImpact;
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const repairModule = await loadModule('src/ai/questionRepair/index.js');
  const queueModule = await loadModule('src/ai/questionRepairQueue/index.js');
  const repairReport = JSON.parse(await fs.readFile(REPAIR_REPORT, 'utf8'));
  const auditReport = JSON.parse(await fs.readFile(AUDIT_REPORT, 'utf8'));

  const queue = queueModule.buildQueueFromReports(repairReport, auditReport);
  const findings = Array.isArray(queue.findings) ? queue.findings : [];
  const statistics = queue.statistics || {};

  const invalidItems = findings.filter(item => !validateQueueItem(item));
  if (invalidItems.length > 0) {
    throw new Error(`Invalid queue items found: ${invalidItems.length}`);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRepairQueueItems: statistics.totalRepairQueueItems || 0,
      itemsByPriority: statistics.itemsByPriority || { P0: 0, P1: 0, P2: 0, P3: 0 },
      itemsBySubject: statistics.itemsBySubject || {},
      itemsByIssueType: statistics.itemsByIssueType || {},
      top50HighestImpactRepairs: (statistics.top50HighestImpactRepairs || []).slice(0, 50),
      recommendedCleanupOrder: statistics.recommendedCleanupOrder || [],
      readiness: queue.readiness || 'READY_FOR_PHASED_CLEANUP'
    },
    findings,
    sourceIntegrity: {
      repairReportLoaded: Boolean(repairReport),
      auditReportLoaded: Boolean(auditReport),
      repairModuleLoaded: Boolean(repairModule)
    }
  };

  const subjectRows = Object.entries(output.summary.itemsBySubject)
    .sort((a, b) => b[1] - a[1])
    .map(([subject, count]) => `| ${subject} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const issueRows = Object.entries(output.summary.itemsByIssueType)
    .sort((a, b) => b[1] - a[1])
    .map(([issueType, count]) => `| ${issueType} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const priorityRows = Object.entries(output.summary.itemsByPriority)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([priority, count]) => `| ${priority} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const topRows = (output.summary.top50HighestImpactRepairs || []).length
    ? output.summary.top50HighestImpactRepairs.slice(0, 10).map(item => `- [${item.priority}] ${item.questionId} (${item.subject} / ${item.topic}) score=${item.impactScore}: ${item.reason} -> ${item.suggestedAction}`).join('\n')
    : '- None found.';

  const readinessText = output.summary.readiness === 'BLOCKED'
    ? 'Question bank has blocking issues and is not ready for expansion.'
    : output.summary.readiness === 'NEEDS_ATTENTION'
      ? 'Question bank can be cleaned up in phases, but high-impact repairs remain.'
      : 'Question bank is ready for phased cleanup planning.';

  const doc = `# Question Repair Queue v1 Report\n\n## Executive Summary\n\n- Total repair queue items: ${output.summary.totalRepairQueueItems}\n- Readiness: ${output.summary.readiness}\n- ${readinessText}\n\n## Current Question Bank Readiness\n\n- Repair-ready status: ${output.summary.readiness}\n- Audit source loaded: yes\n- Repair source loaded: yes\n\n## Priority Queue\n\n| Priority | Count |\n| --- | ---: |\n${priorityRows}\n\n## Subject Cleanup Roadmap\n\n| Subject | Queue Items |\n| --- | ---: |\n${subjectRows}\n\n## Issue Type Breakdown\n\n| Issue Type | Queue Items |\n| --- | ---: |\n${issueRows}\n\n## Top 50 Highest Impact Repairs\n\n${topRows}\n\n## Recommended Next Sprint\n\n${output.summary.readiness === 'BLOCKED' ? 'Fix the P0 queue first, then move to the highest-impact P1 math and Arabic items.' : 'Tackle P1 items first, then clear repeated patterns in P2 subjects.'}\n`;

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  await fs.writeFile(OUTPUT_DOC, doc, 'utf8');

  console.log(`Total repair queue items: ${output.summary.totalRepairQueueItems}`);
  console.log(`Readiness: ${output.summary.readiness}`);
  console.log(`Report written to ${OUTPUT_JSON}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
