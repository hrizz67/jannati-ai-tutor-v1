const fs = require('fs');
const path = require('path');
const { runQuestionValidation } = require('./questionValidator');
const { runCurriculumValidation } = require('./curriculumValidator');
const { runMetadataValidation } = require('./metadataValidator');
const { runStorageValidation } = require('./storageValidator');

const REPORT_DIR = path.resolve('reports/validation');
const SUMMARY_JSON = path.join(REPORT_DIR, 'summary.json');
const SUMMARY_MD = path.join(REPORT_DIR, 'summary.md');
const VALIDATION_SUMMARY_MD = path.join(REPORT_DIR, 'validation-summary.md');
const ROOT_VALIDATION_SUMMARY_MD = path.resolve('validation-summary.md');

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function summarizeReport(report) {
  return {
    validator: report.validator,
    status: report.status,
    infos: report.totals?.infos || 0,
    errors: report.totals?.errors || 0,
    warnings: report.totals?.warnings || 0,
    reportFile: `reports/validation/${report.validator === 'questions' ? 'question' : report.validator}-report.json`
  };
}

function writeMarkdownSummary(summary) {
  const lines = [
    '# Validation Summary',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    `Overall status: ${summary.status.toUpperCase()}`,
    '',
    '| Validator | Status | Info | Warnings | Errors | Report |',
    '| --- | --- | ---: | ---: | ---: | --- |',
    ...summary.validators.map(item => `| ${item.validator} | ${item.status} | ${item.infos} | ${item.warnings} | ${item.errors} | ${item.reportFile} |`),
    '',
    `Total info: ${summary.totals.infos}`,
    `Total warnings: ${summary.totals.warnings}`,
    `Total errors: ${summary.totals.errors}`,
    '',
    'CI failure rule: only ERROR severity fails the build.',
    ''
  ];
  fs.writeFileSync(SUMMARY_MD, `${lines.join('\n')}\n`);
  fs.writeFileSync(VALIDATION_SUMMARY_MD, `${lines.join('\n')}\n`);
  fs.writeFileSync(ROOT_VALIDATION_SUMMARY_MD, `${lines.join('\n')}\n`);
}

async function runMasterValidation() {
  ensureReportDir();
  const reports = [];

  reports.push(await runQuestionValidation());
  reports.push(await runCurriculumValidation());
  reports.push(await runMetadataValidation());
  reports.push(await runStorageValidation());

  const validators = reports.map(summarizeReport);
  const totals = validators.reduce((acc, item) => ({
    infos: acc.infos + item.infos,
    errors: acc.errors + item.errors,
    warnings: acc.warnings + item.warnings
  }), { infos: 0, errors: 0, warnings: 0 });
  const summary = {
    validator: 'master',
    generatedAt: new Date().toISOString(),
    status: totals.errors ? 'fail' : 'pass',
    totals,
    validators
  };

  fs.writeFileSync(SUMMARY_JSON, `${JSON.stringify(summary, null, 2)}\n`);
  writeMarkdownSummary(summary);
  return summary;
}

if (require.main === module) {
  runMasterValidation()
    .then(summary => {
      console.log(`Validation ${summary.status}: ${summary.totals.errors} errors, ${summary.totals.warnings} warnings, ${summary.totals.infos} info.`);
      console.log(`Summary written to ${SUMMARY_JSON}, ${SUMMARY_MD}, and ${VALIDATION_SUMMARY_MD}.`);
      process.exit(summary.totals.errors ? 1 : 0);
    })
    .catch(error => {
      ensureReportDir();
      const summary = {
        validator: 'master',
        generatedAt: new Date().toISOString(),
        status: 'error',
        fatal: String(error.stack || error)
      };
      fs.writeFileSync(SUMMARY_JSON, `${JSON.stringify(summary, null, 2)}\n`);
      fs.writeFileSync(SUMMARY_MD, `# Validation Summary\n\nStatus: ERROR\n\n\`\`\`\n${summary.fatal}\n\`\`\`\n`);
      fs.writeFileSync(VALIDATION_SUMMARY_MD, `# Validation Summary\n\nStatus: ERROR\n\n\`\`\`\n${summary.fatal}\n\`\`\`\n`);
      fs.writeFileSync(ROOT_VALIDATION_SUMMARY_MD, `# Validation Summary\n\nStatus: ERROR\n\n\`\`\`\n${summary.fatal}\n\`\`\`\n`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMasterValidation };
