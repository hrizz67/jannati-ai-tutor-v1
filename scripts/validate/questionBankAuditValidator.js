const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(ROOT, 'reports', 'validation');
const REPORT_JSON = path.join(REPORT_DIR, 'question-bank-audit-report.json');
const REPORT_DOC = path.join(ROOT, 'docs', 'QUESTION_BANK_AUDIT_ENGINE_V1_REPORT.md');

async function loadSubjects() {
  const modulePath = path.join(ROOT, 'src/data/subjects/index.js');
  const mod = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  return mod.loadAllSubjects();
}

async function loadAuditEngine() {
  const modulePath = path.join(ROOT, 'src/ai/questionAudit/index.js');
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

function issueToSummary(issue = {}) {
  return {
    questionId: issue.questionId,
    subject: issue.subject,
    topic: issue.topic,
    severity: issue.severity,
    issueType: issue.issueType,
    explanation: issue.explanation,
    suggestion: issue.suggestion
  };
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const subjects = await loadSubjects();
  const audit = await loadAuditEngine();
  const result = audit.auditQuestionBank(subjects);
  const issues = Array.isArray(result.issues) ? result.issues : [];
  const stats = result.statistics || {};
  const issuesBySubject = { ...(stats.issuesBySubject || {}) };
  const issuesByCategory = { ...(stats.issuesByCategory || {}) };

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalQuestionsScanned: stats.totalQuestions || 0,
      averageQualityScore: stats.averageQualityScore || 0,
      issuesBySubject,
      issuesByCategory,
      topRepeatedPatterns: stats.topRepeatedPatterns || [],
      criticalQuestions: (stats.criticalQuestions || []).map(issueToSummary),
      severityCounts: stats.severityCounts || { Critical: 0, High: 0, Medium: 0, Low: 0 }
    },
    findings: issues.map(issueToSummary),
    statistics: stats
  };

  const subjectRows = Object.entries(issuesBySubject)
    .sort((a, b) => b[1] - a[1])
    .map(([subject, count]) => `| ${subject} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const categoryRows = Object.entries(issuesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const topPatternRows = (report.summary.topRepeatedPatterns || []).length
    ? report.summary.topRepeatedPatterns.map(item => `- \`${item.pattern}\`: ${item.count}`).join('\n')
    : '- None found.';

  const criticalList = (report.summary.criticalQuestions || [])
    .slice(0, 20)
    .map(item => `- [${item.subject} / ${item.topic}] ${item.questionId} - ${item.issueType}: ${item.explanation} (${item.suggestion})`)
    .join('\n') || '- None found.';

  const doc = `# Question Bank Audit Engine v1 Report\n\n## Summary\n\n- Total questions scanned: ${report.summary.totalQuestionsScanned}\n- Average quality score: ${report.summary.averageQualityScore}\n- Critical: ${(report.summary.severityCounts || {}).Critical || 0}\n- High: ${(report.summary.severityCounts || {}).High || 0}\n- Medium: ${(report.summary.severityCounts || {}).Medium || 0}\n- Low: ${(report.summary.severityCounts || {}).Low || 0}\n\n## Issues by Subject\n\n| Subject | Issue Count |\n| --- | ---: |\n${subjectRows}\n\n## Issues by Category\n\n| Category | Issue Count |\n| --- | ---: |\n${categoryRows}\n\n## Top Repeated Pattern Signals\n\nThese counts are diagnostic signals, not audit findings by themselves.\n\n${topPatternRows}\n\n## Critical Questions\n\n${criticalList}\n\n## Audit Readiness\n\n${(report.summary.severityCounts || {}).Critical === 0 && (report.summary.severityCounts || {}).High === 0 ? 'READY FOR EXPANSION' : 'NOT READY'}\n`;

  await fs.writeFile(REPORT_JSON, JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(REPORT_DOC, doc, 'utf8');

  console.log(`Total questions scanned: ${report.summary.totalQuestionsScanned}`);
  console.log(`Critical: ${(report.summary.severityCounts || {}).Critical || 0}`);
  console.log(`High: ${(report.summary.severityCounts || {}).High || 0}`);
  console.log(`Medium: ${(report.summary.severityCounts || {}).Medium || 0}`);
  console.log(`Low: ${(report.summary.severityCounts || {}).Low || 0}`);
  console.log(`Report written to ${REPORT_JSON}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
