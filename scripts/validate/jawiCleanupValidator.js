const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(ROOT, 'reports', 'validation');
const QUEUE_REPORT = path.join(REPORT_DIR, 'question-repair-queue-report.json');
const AUDIT_REPORT = path.join(REPORT_DIR, 'question-bank-audit-report.json');
const QUESTION_BANK = path.join(ROOT, 'src', 'data', 'subjects', 'islam.js');
const OUTPUT_JSON = path.join(REPORT_DIR, 'jawi-cleanup-report.json');
const OUTPUT_DOC = path.join(ROOT, 'docs', 'JAWI_CLEANUP_BATCH_V1_REPORT.md');

async function loadModule(relPath) {
  const modulePath = path.join(ROOT, relPath);
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

async function loadIslamSubject() {
  const mod = await import(`${pathToFileURL(QUESTION_BANK).href}?v=${Date.now()}`);
  return mod.default;
}

function validateRecord(record = {}) {
  const required = ['questionId', 'subject', 'topic', 'language', 'issueType', 'severity', 'currentIssue', 'suggestedFix', 'learningImpact'];
  const missing = required.filter(key => String(record[key] ?? '').trim() === '');
  const validSeverity = ['Critical', 'High', 'Medium', 'Low'].includes(String(record.severity || '').trim());
  const validLanguage = String(record.language || '').trim() === 'jawi';
  return missing.length === 0 && validSeverity && validLanguage;
}

function formatExample(example = {}) {
  const before = example.before || {};
  const after = example.after || {};
  return {
    questionId: String(example.questionId || '').trim(),
    before,
    after
  };
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const engine = await loadModule('src/ai/languageQuality/index.js');
  const repairQueueReport = JSON.parse(await fs.readFile(QUEUE_REPORT, 'utf8'));
  const auditReport = JSON.parse(await fs.readFile(AUDIT_REPORT, 'utf8'));
  const islam = await loadIslamSubject();

  const result = engine.analyzeJawiCleanup(islam, repairQueueReport, auditReport);
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const statistics = result.statistics || {};
  const invalidItems = findings.filter(item => !validateRecord(item));
  if (invalidItems.length > 0) {
    throw new Error(`Invalid Jawi repair records found: ${invalidItems.length}`);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalQuestionsChecked: statistics.totalQuestionsChecked || 0,
      ambiguousQuestionsCount: statistics.ambiguousQuestionsCount || 0,
      issuesByCategory: statistics.issuesByCategory || {},
      issuesByTopic: statistics.issuesByTopic || {},
      highestImpactFixes: (statistics.highestImpactFixes || []).slice(0, 50),
      recommendedCleanupOrder: statistics.recommendedCleanupOrder || [],
      beforeAfterExamples: (statistics.beforeAfterExamples || []).slice(0, 10)
    },
    findings
  };

  const categoryRows = Object.entries(output.summary.issuesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const topicRows = Object.entries(output.summary.issuesByTopic)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => `| ${topic} | ${count} |`)
    .join('\n') || '| None | 0 |';

  const topRows = (output.summary.highestImpactFixes || []).length
    ? output.summary.highestImpactFixes.slice(0, 15).map(item => `- ${item.questionId} | ${item.issueType} | ${item.severity} | ${item.currentIssue} -> ${item.suggestedFix}`).join('\n')
    : '- None found.';

  const exampleRows = (output.summary.beforeAfterExamples || []).length
    ? output.summary.beforeAfterExamples.slice(0, 5).map(formatExample).map(example => `- ${example.questionId}\n  - Before: ${JSON.stringify(example.before)}\n  - After: ${JSON.stringify(example.after)}`).join('\n')
    : '- None found.';

  const readiness = output.summary.ambiguousQuestionsCount > 0 ? 'NEEDS CLEANUP' : 'READY';

  const doc = `# Jawi Cleanup Batch v1 Report\n\n## Summary\n\n- Total questions checked: ${output.summary.totalQuestionsChecked}\n- Ambiguous questions count: ${output.summary.ambiguousQuestionsCount}\n- Remaining issues: ${findings.length}\n\n## Repaired Suggestions\n\n${topRows}\n\n## Remaining Issues\n\n| Category | Count |\n| --- | ---: |\n${categoryRows}\n\n## Before / After Examples\n\n${exampleRows}\n\n## Top Priority Fixes\n\n1. Jawi multiple possible answers\n2. Arabic missing text\n3. Arabic pronunciation support\n4. Arabic translation accuracy\n5. Learning example expansion\n\n## Current Status\n\n${readiness}\n`;

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  await fs.writeFile(OUTPUT_DOC, doc, 'utf8');

  console.log(`Total questions checked: ${output.summary.totalQuestionsChecked}`);
  console.log(`Ambiguous questions count: ${output.summary.ambiguousQuestionsCount}`);
  console.log(`Report written to ${OUTPUT_JSON}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
