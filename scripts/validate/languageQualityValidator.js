const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(ROOT, 'reports', 'validation');
const REPAIR_QUEUE_REPORT = path.join(REPORT_DIR, 'question-repair-queue-report.json');
const AUDIT_REPORT = path.join(REPORT_DIR, 'question-bank-audit-report.json');
const OUTPUT_JSON = path.join(REPORT_DIR, 'language-quality-report.json');
const OUTPUT_DOC = path.join(ROOT, 'docs', 'ARABIC_JAWI_QUALITY_UPGRADE_V1_REPORT.md');

async function loadModule(relPath) {
  const modulePath = path.join(ROOT, relPath);
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

function validateRecord(record = {}) {
  const required = ['questionId', 'subject', 'topic', 'language', 'issueType', 'severity', 'currentIssue', 'suggestedFix', 'learningImpact'];
  const missing = required.filter(key => String(record[key] ?? '').trim() === '');
  const validSeverity = ['Critical', 'High', 'Medium', 'Low'].includes(String(record.severity || '').trim());
  const validLanguage = ['arabic', 'jawi'].includes(String(record.language || '').trim());
  return missing.length === 0 && validSeverity && validLanguage;
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const languageModule = await loadModule('src/ai/languageQuality/index.js');
  const repairQueueReport = JSON.parse(await fs.readFile(REPAIR_QUEUE_REPORT, 'utf8'));
  const auditReport = JSON.parse(await fs.readFile(AUDIT_REPORT, 'utf8'));

  const result = languageModule.analyzeLanguageQuality(repairQueueReport, auditReport);
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const statistics = result.statistics || {};
  const invalidRecords = findings.filter(item => !validateRecord(item));
  if (invalidRecords.length > 0) {
    throw new Error(`Invalid language quality records found: ${invalidRecords.length}`);
  }

  const arabicFindings = findings.filter(item => item.language === 'arabic');
  const jawiFindings = findings.filter(item => item.language === 'jawi');

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalArabicQuestionsChecked: statistics.totalArabicQuestionsChecked || 0,
      totalJawiQuestionsChecked: statistics.totalJawiQuestionsChecked || 0,
      issuesByCategory: statistics.issuesByCategory || {},
      issuesByTopic: statistics.issuesByTopic || {},
      highestImpactFixes: (statistics.highestImpactFixes || []).slice(0, 50),
      recommendedCleanupOrder: statistics.recommendedCleanupOrder || []
    },
    findings,
    arabicFindings,
    jawiFindings
  };

  const categoryRows = Object.entries(output.summary.issuesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const topicRows = Object.entries(output.summary.issuesByTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([topic, count]) => `| ${topic} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const topRows = (output.summary.highestImpactFixes || []).length
    ? output.summary.highestImpactFixes.slice(0, 15).map(item => `- [${item.language.toUpperCase()}] ${item.questionId} (${item.subject} / ${item.topic}) ${item.issueType}: ${item.currentIssue} -> ${item.suggestedFix}`).join('\n')
    : '- None found.';

  const cleanupOrder = (output.summary.recommendedCleanupOrder || []).length
    ? output.summary.recommendedCleanupOrder.slice(0, 25).map((item, index) => `${index + 1}. ${item}`).join('\n')
    : '1. None';

  const doc = `# Arabic & Jawi Quality Upgrade v1 Report\n\n## Summary\n\n- Total Arabic questions checked: ${output.summary.totalArabicQuestionsChecked}\n- Total Jawi questions checked: ${output.summary.totalJawiQuestionsChecked}\n- Highest impact fixes: ${(output.summary.highestImpactFixes || []).length}\n\n## Issues by Category\n\n| Category | Count |\n| --- | ---: |\n${categoryRows}\n\n## Issues by Topic\n\n| Topic | Count |\n| --- | ---: |\n${topicRows}\n\n## Highest Impact Fixes\n\n${topRows}\n\n## Recommended Cleanup Order\n\n${cleanupOrder}\n\n## Current Status\n\nREADY FOR CLEANUP PHASE\n`;

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  await fs.writeFile(OUTPUT_DOC, doc, 'utf8');

  console.log(`Total Arabic questions checked: ${output.summary.totalArabicQuestionsChecked}`);
  console.log(`Total Jawi questions checked: ${output.summary.totalJawiQuestionsChecked}`);
  console.log(`Report written to ${OUTPUT_JSON}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
