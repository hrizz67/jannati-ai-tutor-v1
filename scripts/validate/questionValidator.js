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

async function loadDiversityTools() {
  const qdePath = path.resolve('src/ai/diversity/questionDiversityEngine.js');
  const detectorPath = path.resolve('src/ai/diversity/duplicateDetector.js');
  const qipPath = path.resolve('src/ai/question/questionEngine.js');
  const qipDuplicatePath = path.resolve('src/ai/question/duplicateEngine.js');
  const qipDistractorPath = path.resolve('src/ai/question/distractorEngine.js');
  const qipContextPath = path.resolve('src/ai/question/contextEngine.js');
  const contextValidatorPath = path.resolve('src/ai/question/contextValidator.js');
  const stemValidatorPath = path.resolve('src/ai/question/stemValidator.js');
  const qde = await import(`${pathToFileURL(qdePath).href}?v=${Date.now()}`);
  const detector = await import(`${pathToFileURL(detectorPath).href}?v=${Date.now()}`);
  const qip = await import(`${pathToFileURL(qipPath).href}?v=${Date.now()}`);
  const qipDuplicate = await import(`${pathToFileURL(qipDuplicatePath).href}?v=${Date.now()}`);
  const qipDistractor = await import(`${pathToFileURL(qipDistractorPath).href}?v=${Date.now()}`);
  const qipContext = await import(`${pathToFileURL(qipContextPath).href}?v=${Date.now()}`);
  const contextValidator = await import(`${pathToFileURL(contextValidatorPath).href}?v=${Date.now()}`);
  const stemValidator = await import(`${pathToFileURL(stemValidatorPath).href}?v=${Date.now()}`);
  return { ...qde, ...detector, ...qip, ...qipDuplicate, ...qipDistractor, ...qipContext, ...contextValidator, ...stemValidator };
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

function recordRepeat(map, key, context) {
  if (!key) return null;
  if (map.has(key)) return map.get(key);
  map.set(key, context);
  return null;
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
  const diversityTools = await loadDiversityTools();
  const issues = [];
  const seenIds = new Map();
  const seenStems = new Map();
  const seenTemplates = new Map();
  const seenNumberPatterns = new Map();
  const seenAnswerPatterns = new Map();
  const seenContexts = new Map();
  const seenDistractors = new Map();
  const seenAnswerPositions = new Map();
  const difficultyCounts = {};
  const diversityDiagnostics = {
    repeatedTemplates: 0,
    repeatedNumberPatterns: 0,
    repeatedAnswerPatterns: 0,
    repeatedContexts: 0,
    repeatedDistractors: 0,
    repeatedAnswerPositions: 0,
    simulatedSessions: 0,
    simulatedQuestions: 0,
    failedSessions: 0,
    averageDiversityScore: 0,
    duplicatePercent: 0,
    diagnosticRepeatPercent: 0,
    averageSelectionTimeMs: 0,
    stemDiversity: 0,
    stemReuseRate: 0,
    repeatedStems: 0,
    contextDiversity: 0,
    nameReuseRate: 0,
    objectReuseRate: 0,
    contextReuseRate: 0,
    unsafeContextChanges: 0,
    unusedStemVariationGroups: [],
    brokenStemMappings: 0,
    topicBalance: {},
    difficultyBalance: {}
  };
  let totalQuestions = 0;
  const allQuestions = [];

  subjects.forEach(subject => {
    (subject.topics || []).forEach(topic => {
      (topic.questions || []).forEach((question, questionIndex) => {
        totalQuestions += 1;
        allQuestions.push({ ...question, subjectId: subject.id, topicId: topic.id, topicTitle: topic.title });
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
        const template = diversityTools.templateSignature(question);
        const numberPattern = diversityTools.numberSignature(question);
        const answerPattern = diversityTools.answerPattern(question);
        const contextPattern = diversityTools.contextSignature(question);
        const distractorPattern = diversityTools.distractorSignature(question);
        const answerPositionPattern = diversityTools.answerPositionSignature(question);

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

        if (recordRepeat(seenTemplates, template, idKey || `${subject.id}:${topic.id}:${questionIndex}`)) {
          diversityDiagnostics.repeatedTemplates += 1;
        }
        if (recordRepeat(seenNumberPatterns, numberPattern, idKey || `${subject.id}:${topic.id}:${questionIndex}`)) {
          diversityDiagnostics.repeatedNumberPatterns += 1;
        }
        if (recordRepeat(seenAnswerPatterns, answerPattern, idKey || `${subject.id}:${topic.id}:${questionIndex}`)) {
          diversityDiagnostics.repeatedAnswerPatterns += 1;
        }
        if (recordRepeat(seenContexts, contextPattern, idKey || `${subject.id}:${topic.id}:${questionIndex}`)) {
          diversityDiagnostics.repeatedContexts += 1;
        }
        if (recordRepeat(seenDistractors, distractorPattern, idKey || `${subject.id}:${topic.id}:${questionIndex}`)) {
          diversityDiagnostics.repeatedDistractors += 1;
        }
        if (recordRepeat(seenAnswerPositions, answerPositionPattern, idKey || `${subject.id}:${topic.id}:${questionIndex}`)) {
          diversityDiagnostics.repeatedAnswerPositions += 1;
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

  const stemValidation = diversityTools.validateStemMappings(allQuestions);
  diversityDiagnostics.unusedStemVariationGroups = stemValidation.unusedVariationGroups;
  diversityDiagnostics.brokenStemMappings = stemValidation.issues.filter(item => item.severity === 'error').length;
  stemValidation.issues
    .filter(item => item.severity === 'error')
    .forEach(item => issues.push(issue('error', item.code, 'Stem intelligence mapping is broken.', item)));

  const sessionCount = 5000;
  let diversityTotal = 0;
  let stemDiversityTotal = 0;
  let stemReuseTotal = 0;
  let repeatedStemTotal = 0;
  let contextDiversityTotal = 0;
  let contextReuseTotal = 0;
  let nameReuseTotal = 0;
  let objectReuseTotal = 0;
  let protectedDuplicateEvents = 0;
  let diagnosticDuplicateEvents = 0;
  let selectionTimeTotalMs = 0;
  for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex += 1) {
    const subject = subjects[sessionIndex % subjects.length];
    const topic = subject.topics[(sessionIndex * 7) % subject.topics.length];
    const count = Math.min(20, topic.questions.length);
    const startedAt = process.hrtime.bigint();
    const result = diversityTools.buildQuestionSession({
      subject,
      topic,
      questions: topic.questions,
      count,
      memory: {},
      sessionSeed: 1000 + sessionIndex
    });
    const endedAt = process.hrtime.bigint();
    selectionTimeTotalMs += Number(endedAt - startedAt) / 1000000;
    const selected = result.questions || [];
    diversityDiagnostics.simulatedSessions += 1;
    diversityDiagnostics.simulatedQuestions += selected.length;
    diversityTotal += result.analytics?.overallDiversity || result.score?.overallDiversity || 0;
    stemDiversityTotal += result.analytics?.stemAnalytics?.averageStemDiversity || 0;
    stemReuseTotal += result.analytics?.stemAnalytics?.stemReuseRate || 0;
    repeatedStemTotal += result.analytics?.stemAnalytics?.repeatedStems || 0;
    contextDiversityTotal += result.analytics?.contextAnalytics?.contextDiversity || 0;
    contextReuseTotal += result.analytics?.contextAnalytics?.reuseRate || 0;
    nameReuseTotal += result.analytics?.contextAnalytics?.nameDiversity !== undefined ? 100 - result.analytics.contextAnalytics.nameDiversity : 0;
    objectReuseTotal += result.analytics?.contextAnalytics?.objectDiversity !== undefined ? 100 - result.analytics.contextAnalytics.objectDiversity : 0;
    const contextIssues = diversityTools.validateContextMappings(selected);
    diversityDiagnostics.unsafeContextChanges += contextIssues.filter(item => item.severity === 'error').length;
    contextIssues
      .filter(item => item.severity === 'error')
      .forEach(item => issues.push(issue('error', item.code, 'Context intelligence produced an unsafe change.', item)));
    Object.entries(result.balance?.topics || {}).forEach(([key, value]) => {
      diversityDiagnostics.topicBalance[key] = (diversityDiagnostics.topicBalance[key] || 0) + value;
    });
    Object.entries(result.balance?.difficulties || {}).forEach(([key, value]) => {
      diversityDiagnostics.difficultyBalance[key] = (diversityDiagnostics.difficultyBalance[key] || 0) + value;
    });

    const localSeen = {
      ids: new Set(),
      stems: new Set(),
      templates: new Set(),
      contexts: new Set(),
      numbers: new Set(),
      distractors: new Set(),
      answerPositions: new Set()
    };
    const sessionFailures = [];
    const sessionDiagnostics = [];
    selected.forEach((question, index) => {
      const signature = diversityTools.questionIntelligenceSignature(question);
      [
        ['id', signature.id, localSeen.ids],
        ['stem', signature.stem, localSeen.stems],
        ['template', signature.template, localSeen.templates],
        ['context', signature.context && signature.context !== 'none' ? signature.context : '', localSeen.contexts],
        ['numbers', signature.numbers, localSeen.numbers],
        ['distractors', signature.distractors, localSeen.distractors],
        ['answerPosition', signature.answerPosition, localSeen.answerPositions]
      ].forEach(([kind, key, set]) => {
        if (!key) return;
        if (set.has(key)) {
          const row = { kind, index, questionId: question.id || null };
          if (['answerPosition', 'distractors', 'context'].includes(kind)) {
            sessionDiagnostics.push(row);
          } else {
            sessionFailures.push(row);
          }
        }
        set.add(key);
      });
    });
    protectedDuplicateEvents += sessionFailures.length;
    diagnosticDuplicateEvents += sessionDiagnostics.length;
    diversityDiagnostics.repeatedContexts += sessionDiagnostics.filter(item => item.kind === 'context').length;
    diversityDiagnostics.repeatedDistractors += sessionDiagnostics.filter(item => item.kind === 'distractors').length;
    diversityDiagnostics.repeatedAnswerPositions += sessionDiagnostics.filter(item => item.kind === 'answerPosition').length;

    if (sessionFailures.length) {
      diversityDiagnostics.failedSessions += 1;
      issues.push(issue('error', 'QIP_SESSION_DUPLICATE', 'Question Intelligence Platform generated repeated protected session signatures.', {
        sessionIndex,
        subjectId: subject.id,
        topicId: topic.id,
        failures: sessionFailures.slice(0, 8)
      }));
    }
  }
  diversityDiagnostics.averageDiversityScore = Math.round(diversityTotal / sessionCount);
  diversityDiagnostics.stemDiversity = Math.round(stemDiversityTotal / sessionCount);
  diversityDiagnostics.stemReuseRate = Number((stemReuseTotal / sessionCount).toFixed(2));
  diversityDiagnostics.repeatedStems = repeatedStemTotal;
  diversityDiagnostics.contextDiversity = Math.round(contextDiversityTotal / sessionCount);
  diversityDiagnostics.contextReuseRate = Number((contextReuseTotal / sessionCount).toFixed(2));
  diversityDiagnostics.nameReuseRate = Number((nameReuseTotal / sessionCount).toFixed(2));
  diversityDiagnostics.objectReuseRate = Number((objectReuseTotal / sessionCount).toFixed(2));
  diversityDiagnostics.duplicatePercent = Number(((protectedDuplicateEvents / Math.max(diversityDiagnostics.simulatedQuestions, 1)) * 100).toFixed(2));
  diversityDiagnostics.diagnosticRepeatPercent = Number(((diagnosticDuplicateEvents / Math.max(diversityDiagnostics.simulatedQuestions, 1)) * 100).toFixed(2));
  diversityDiagnostics.averageSelectionTimeMs = Number((selectionTimeTotalMs / sessionCount).toFixed(3));

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
      diversitySessions: diversityDiagnostics.simulatedSessions,
      infos: infos.length,
      errors: errors.length,
      warnings: warnings.length
    },
    difficultyCounts,
    diversityDiagnostics,
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
