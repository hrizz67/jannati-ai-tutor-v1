const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(ROOT, 'reports', 'validation');
const INPUT_REPORT = path.join(REPORT_DIR, 'question-bank-audit-report.json');
const OUTPUT_JSON = path.join(REPORT_DIR, 'question-repair-report.json');
const OUTPUT_DOC = path.join(ROOT, 'docs', 'QUESTION_REPAIR_ENGINE_V1_REPORT.md');

async function loadRepairEngine() {
  const modulePath = path.join(ROOT, 'src/ai/questionRepair/index.js');
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

function validateRepairRecord(record = {}) {
  const required = ['questionId', 'subject', 'topic', 'issueType', 'severity', 'currentProblem', 'repairSuggestion', 'priority'];
  const missing = required.filter(key => String(record[key] || '').trim() === '');
  const validPriority = ['P1', 'P2', 'P3'].includes(String(record.priority || '').trim());
  const validSeverity = ['Critical', 'High', 'Medium', 'Low'].includes(String(record.severity || '').trim());
  return {
    valid: missing.length === 0 && validPriority && validSeverity,
    missing,
    validPriority,
    validSeverity
  };
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const engine = await loadRepairEngine();
  const { repairQuestionBankFromAudit } = engine;
  const result = repairQuestionBankFromAudit(INPUT_REPORT);
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const statistics = result.statistics || {};

  const validation = findings.reduce((acc, item) => {
    const check = validateRepairRecord(item);
    if (!check.valid) acc.invalidRecords.push({ item, ...check });
    return acc;
  }, { invalidRecords: [] });

  if (validation.invalidRecords.length > 0) {
    throw new Error(`Invalid repair records found: ${validation.invalidRecords.length}`);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRepairSuggestions: statistics.totalRepairSuggestions || 0,
      suggestionsBySubject: statistics.suggestionsBySubject || {},
      suggestionsByIssueType: statistics.suggestionsByIssueType || {},
      repairPriorityCounts: statistics.repairPriorityCounts || { P1: 0, P2: 0, P3: 0 },
      p1RepairList: (statistics.p1RepairList || []).slice(0, 100),
      topRecurringProblems: statistics.topRecurringProblems || [],
      estimatedCleanupPriority: statistics.estimatedCleanupPriority || 'LOW'
    },
    findings,
    validation: {
      invalidRecords: []
    }
  };

  const subjectRows = Object.entries(output.summary.suggestionsBySubject)
    .sort((a, b) => b[1] - a[1])
    .map(([subject, count]) => `| ${subject} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const issueRows = Object.entries(output.summary.suggestionsByIssueType)
    .sort((a, b) => b[1] - a[1])
    .map(([issueType, count]) => `| ${issueType} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const p1Rows = (output.summary.p1RepairList || []).length
    ? output.summary.p1RepairList.slice(0, 25).map(item => `- [${item.subject} / ${item.topic}] ${item.questionId} - ${item.issueType}: ${item.currentProblem} -> ${item.repairSuggestion}`).join('\n')
    : '- None found.';

  const recurringRows = (output.summary.topRecurringProblems || []).length
    ? output.summary.topRecurringProblems.map(item => `- ${item.subject} / ${item.issueType} (${item.priority}): ${item.count}`).join('\n')
    : '- None found.';

  const doc = `# Question Repair Engine v1 Report\n\n## Summary\n\n- Total repair suggestions: ${output.summary.totalRepairSuggestions}\n- P1 repair list: ${(output.summary.p1RepairList || []).length}\n- P2/P3 suggestions: ${(output.summary.totalRepairSuggestions || 0) - ((output.summary.p1RepairList || []).length)}\n- Estimated cleanup priority: ${output.summary.estimatedCleanupPriority}\n\n## Suggestions by Subject\n\n| Subject | Suggestion Count |\n| --- | ---: |\n${subjectRows}\n\n## Suggestions by Issue Type\n\n| Issue Type | Suggestion Count |\n| --- | ---: |\n${issueRows}\n\n## Top P1 Repair List\n\n${p1Rows}\n\n## Top Recurring Problems\n\n${recurringRows}\n\n## Repair Readiness\n\nREADY FOR REPAIR PLANNING\n`;

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  await fs.writeFile(OUTPUT_DOC, doc, 'utf8');

  console.log(`Total repair suggestions: ${output.summary.totalRepairSuggestions}`);
  console.log(`P1 repair list: ${(output.summary.p1RepairList || []).length}`);
  console.log(`Estimated cleanup priority: ${output.summary.estimatedCleanupPriority}`);
  console.log(`Report written to ${OUTPUT_JSON}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
