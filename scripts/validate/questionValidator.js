const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT_DIR = path.resolve('reports/validation');
const REPORT_PATH = path.join(REPORT_DIR, 'question-report.json');
const VALID_DIFFICULTIES = new Set(['mudah', 'sederhana', 'sukar', 'easy', 'medium', 'hard']);

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function loadSubjects() {
  const modulePath = path.resolve('src/data/subjects/index.js');
  const subjectsModule = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  return subjectsModule.loadAllSubjects();
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function getQuestionText(question = {}) {
  return question.q || question.question || question.stem || '';
}

function hasAnswer(question = {}) {
  if (question.answer !== undefined && String(question.answer).trim() !== '') return true;
  if (Array.isArray(question.accepted) && question.accepted.some(item => String(item).trim() !== '')) return true;
  if (Number.isInteger(question.answerIndex) || Number.isInteger(question.answer_index) || Number.isInteger(question.correctIndex)) return true;
  return false;
}

function validateAnswerIndex(question = {}, options = []) {
  const index = question.answerIndex ?? question.answer_index ?? question.correctIndex;
  if (index === undefined || index === null) return null;
  if (!Number.isInteger(index)) return 'Answer index must be an integer.';
  if (!Array.isArray(options) || options.length === 0) return 'Answer index is present but options are missing.';
  if (index < 0 || index >= options.length) return `Answer index ${index} is outside options length ${options.length}.`;
  return null;
}

async function runQuestionValidation() {
  ensureReportDir();
  const subjects = await loadSubjects();
  const issues = [];
  const seenIds = new Map();
  const seenStems = new Map();
  const difficultyCounts = {};
  let totalQuestions = 0;

  subjects.forEach(subject => {
    (subject.topics || []).forEach(topic => {
      (topic.questions || []).forEach((question, questionIndex) => {
        totalQuestions += 1;
        const context = {
          subjectId: subject.id,
          topicId: topic.id,
          questionId: question.id || null,
          questionIndex
        };
        const idKey = question.id ? `${subject.id}:${question.id}` : '';
        const globalId = question.id || '';
        const stem = normalizeText(getQuestionText(question));
        const options = question.options || question.choices;
        const difficulty = question.difficulty || topic.difficulty;

        if (!question.id || !String(question.id).trim()) {
          issues.push(issue('error', 'EMPTY_ID', 'Question is missing an id.', context));
        } else if (seenIds.has(globalId)) {
          issues.push(issue('error', 'DUPLICATE_ID', 'Duplicate question id found.', { ...context, duplicateOf: seenIds.get(globalId) }));
        } else {
          seenIds.set(globalId, idKey);
        }

        if (!stem) {
          issues.push(issue('error', 'EMPTY_QUESTION', 'Question stem is empty.', context));
        } else if (seenStems.has(stem)) {
          issues.push(issue('warning', 'DUPLICATE_STEM', 'Duplicate question stem found.', { ...context, duplicateOf: seenStems.get(stem) }));
        } else {
          seenStems.set(stem, idKey || `${subject.id}:${topic.id}:${questionIndex}`);
        }

        if (Array.isArray(options) && (options.length === 0 || options.some(option => String(option).trim() === ''))) {
          issues.push(issue('error', 'EMPTY_OPTIONS', 'Question options are empty or contain blank values.', context));
        }

        if (!hasAnswer(question)) {
          issues.push(issue('error', 'EMPTY_ANSWER', 'Question answer is empty.', context));
        }

        const answerIndexProblem = validateAnswerIndex(question, options);
        if (answerIndexProblem) {
          issues.push(issue('error', 'INVALID_ANSWER_INDEX', answerIndexProblem, context));
        }

        if (!question.hint || !String(question.hint).trim()) {
          issues.push(issue('warning', 'MISSING_HINT', 'Question is missing a hint.', context));
        }

        if (!question.explanation || !String(question.explanation).trim()) {
          issues.push(issue('warning', 'MISSING_EXPLANATION', 'Question is missing an explanation.', context));
        }

        if (difficulty) {
          const normalizedDifficulty = normalizeText(difficulty);
          difficultyCounts[normalizedDifficulty] = (difficultyCounts[normalizedDifficulty] || 0) + 1;
          if (!VALID_DIFFICULTIES.has(normalizedDifficulty)) {
            issues.push(issue('error', 'INVALID_DIFFICULTY', `Invalid difficulty: ${difficulty}`, context));
          }
        } else {
          issues.push(issue('warning', 'MISSING_DIFFICULTY', 'Question is missing difficulty metadata.', context));
        }
      });
    });
  });

  const errors = issues.filter(item => item.severity === 'error');
  const warnings = issues.filter(item => item.severity === 'warning');
  const infos = issues.filter(item => item.severity === 'info');
  const report = {
    validator: 'questions',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    totals: {
      subjects: subjects.length,
      questions: totalQuestions,
      infos: infos.length,
      errors: errors.length,
      warnings: warnings.length
    },
    difficultyCounts,
    issues
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (require.main === module) {
  runQuestionValidation()
    .then(report => {
      console.log(`Question validation ${report.status}: ${report.totals.errors} errors, ${report.totals.warnings} warnings, ${report.totals.infos} info.`);
      process.exit(report.totals.errors ? 1 : 0);
    })
    .catch(error => {
      ensureReportDir();
      fs.writeFileSync(REPORT_PATH, `${JSON.stringify({
        validator: 'questions',
        generatedAt: new Date().toISOString(),
        status: 'error',
        fatal: String(error.stack || error)
      }, null, 2)}\n`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runQuestionValidation };
