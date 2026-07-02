const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT_DIR = path.resolve('reports/validation');
const REPORT_PATH = path.join(REPORT_DIR, 'metadata-report.json');
const SUBJECT_DIR = path.resolve('src/data/subjects');
const VALID_DIFFICULTIES = new Set(['mudah', 'sederhana', 'sukar', 'easy', 'medium', 'hard']);

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function loadSubjects() {
  const modulePath = path.resolve('src/data/subjects/index.js');
  const subjectsModule = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  return subjectsModule.loadAllSubjects();
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function hasBalancedModuleSyntax(source) {
  return /export\s+default\s+/m.test(source) || /export\s+const\s+/m.test(source);
}

async function runMetadataValidation() {
  ensureReportDir();
  const issues = [];
  const files = fs.readdirSync(SUBJECT_DIR).filter(file => file.endsWith('.js'));

  files.forEach(file => {
    const fullPath = path.join(SUBJECT_DIR, file);
    const source = fs.readFileSync(fullPath, 'utf8');
    if (!hasBalancedModuleSyntax(source)) {
      issues.push(issue('error', 'INVALID_JSON', 'Subject data module does not expose an expected export.', { file }));
    }
  });

  let subjects = [];
  try {
    subjects = await loadSubjects();
  } catch (error) {
    issues.push(issue('error', 'INVALID_JSON', 'Subject data could not be imported.', { error: String(error.message || error) }));
  }

  let totalTopics = 0;
  let totalQuestions = 0;

  subjects.forEach((subject, subjectIndex) => {
    if (!subject?.id || !subject?.title || !subject?.short) {
      issues.push(issue('error', 'INVALID_SUBJECT', 'Subject is missing required metadata.', { subjectIndex, subjectId: subject?.id || null }));
    }

    if (!Array.isArray(subject.topics)) {
      issues.push(issue('error', 'INVALID_SUBJECT', 'Subject topics must be an array.', { subjectId: subject?.id || null }));
      return;
    }

    subject.topics.forEach((topic, topicIndex) => {
      totalTopics += 1;
      if (!topic?.id || !topic?.title || !Array.isArray(topic.questions)) {
        issues.push(issue('error', 'INVALID_TOPIC', 'Topic is missing required metadata.', { subjectId: subject.id, topicIndex, topicId: topic?.id || null }));
        return;
      }

      topic.questions.forEach((question, questionIndex) => {
        totalQuestions += 1;
        const context = { subjectId: subject.id, topicId: topic.id, questionId: question.id || null, questionIndex };
        const difficulty = question.difficulty || topic.difficulty;
        const estimatedTime = question.estimatedTime || question.estimated_time;

        if (difficulty && !VALID_DIFFICULTIES.has(String(difficulty).toLowerCase())) {
          issues.push(issue('error', 'INVALID_DIFFICULTY', `Invalid difficulty: ${difficulty}`, context));
        }

        if (estimatedTime !== undefined && (!Number.isFinite(Number(estimatedTime)) || Number(estimatedTime) <= 0)) {
          issues.push(issue('error', 'INVALID_ESTIMATED_TIME', 'estimatedTime must be a positive number when provided.', { ...context, estimatedTime }));
        }
      });
    });
  });

  const errors = issues.filter(item => item.severity === 'error');
  const warnings = issues.filter(item => item.severity === 'warning');
  const infos = issues.filter(item => item.severity === 'info');
  const report = {
    validator: 'metadata',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    totals: {
      files: files.length,
      subjects: subjects.length,
      topics: totalTopics,
      questions: totalQuestions,
      infos: infos.length,
      errors: errors.length,
      warnings: warnings.length
    },
    issues
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (require.main === module) {
  runMetadataValidation()
    .then(report => {
      console.log(`Metadata validation ${report.status}: ${report.totals.errors} errors, ${report.totals.warnings} warnings, ${report.totals.infos} info.`);
      process.exit(report.totals.errors ? 1 : 0);
    })
    .catch(error => {
      ensureReportDir();
      fs.writeFileSync(REPORT_PATH, `${JSON.stringify({
        validator: 'metadata',
        generatedAt: new Date().toISOString(),
        status: 'error',
        fatal: String(error.stack || error)
      }, null, 2)}\n`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMetadataValidation };
