const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT_DIR = path.resolve('reports/validation');
const REPORT_PATH = path.join(REPORT_DIR, 'curriculum-report.json');
const VALID_DIFFICULTIES = new Set(['mudah', 'sederhana', 'sukar', 'easy', 'medium', 'hard']);
const VALID_QUESTION_TYPES = new Set(['short_answer', 'objective', 'multiple_response', 'matching', 'ordering', 'fill_blank', 'true_false', 'structured', 'oral', 'practical']);
const VALID_COGNITIVE_LEVELS = new Set(['mengingat', 'memahami', 'mengaplikasi', 'menganalisis', 'menilai', 'mencipta']);
const KBAT_COGNITIVE_LEVELS = new Set(['mengaplikasi', 'menganalisis', 'menilai', 'mencipta']);

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function loadSubjects() {
  const modulePath = path.resolve('src/data/subjects/index.js');
  const subjectsModule = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  return subjectsModule.loadAllSubjects();
}

function cleanCode(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function inferSKSP({ subject = {}, topic = {}, topicIndex = 0, question = {}, questionIndex = 0 } = {}) {
  const subjectCode = cleanCode(subject.short || subject.id || 'SUBJECT');
  const topicCode = cleanCode(topic.id || topic.title || `TOPIC_${topicIndex + 1}`);
  const band = Math.floor(questionIndex / 10) + 1;
  return {
    SK: question.SK || question.sk || topic.SK || topic.sk || `${subjectCode}.SK.${topicIndex + 1}`,
    SP: question.SP || question.sp || topic.SP || topic.sp || `${subjectCode}.SP.${topicIndex + 1}.${band}`,
    strand: question.strand || topic.strand || topic.title || topicCode
  };
}

function estimatedTimeFor(question = {}) {
  if (question.estimatedTime || question.estimated_time) return question.estimatedTime || question.estimated_time;
  const difficulty = String(question.difficulty || '').toLowerCase();
  if (difficulty.includes('sukar') || difficulty.includes('hard')) return 90;
  if (difficulty.includes('sederhana') || difficulty.includes('medium')) return 60;
  return 40;
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

async function runCurriculumValidation() {
  ensureReportDir();
  const subjects = await loadSubjects();
  const issues = [];
  const difficultyBalance = {};
  const coverageKeys = new Set();
  let totalTopics = 0;
  let totalQuestions = 0;
  let explicitSK = 0;
  let explicitSP = 0;
  let explicitEstimatedTime = 0;
  let explicitLearningOutcomes = 0;
  let explicitCognitiveLevels = 0;
  let inferredCognitiveLevels = 0;
  let explicitQuestionTypes = 0;
  let uasaTagged = 0;

  subjects.forEach((subject, subjectIndex) => {
    if (!subject?.id || !subject?.title) {
      issues.push(issue('error', 'MISSING_SUBJECT', 'Subject is missing id or title.', { subjectIndex }));
    }

    if (!Array.isArray(subject.topics) || subject.topics.length === 0) {
      issues.push(issue('error', 'MISSING_TOPIC', 'Subject has no topics.', { subjectId: subject?.id || null }));
      return;
    }

    subject.topics.forEach((topic, topicIndex) => {
      totalTopics += 1;
      if (!topic?.id || !topic?.title) {
        issues.push(issue('error', 'MISSING_TOPIC', 'Topic is missing id or title.', { subjectId: subject.id, topicIndex }));
      }

      if (!Array.isArray(topic.questions) || topic.questions.length === 0) {
        issues.push(issue('error', 'MISSING_TOPIC_QUESTIONS', 'Topic has no questions.', { subjectId: subject.id, topicId: topic?.id || null }));
        return;
      }

      topic.questions.forEach((question, questionIndex) => {
        totalQuestions += 1;
        const context = { subjectId: subject.id, topicId: topic.id, questionId: question.id || null, questionIndex };
        const sksp = inferSKSP({ subject, topic, topicIndex, question, questionIndex });
        const difficulty = String(question.difficulty || topic.difficulty || '').toLowerCase();
        const estimatedTime = estimatedTimeFor(question);
        const uasa = question.UASA || question.uasa || topic.UASA || topic.uasa;
        const metadataReview = question.metadataReview || {};
        const rawQuestionType = metadataReview.questionType === 'authored' || (!question.metadataReview && (question.questionType || question.type))
          ? question.questionType || question.type
          : '';
        const rawCognitiveLevel = metadataReview.cognitiveLevel === 'authored' || (!question.metadataReview && (question.cognitiveLevel || question.cognitive_level))
          ? String(question.cognitiveLevel || question.cognitive_level || '').toLowerCase()
          : '';
        const rawLearningOutcome = question.learningOutcome || question.learning_outcome || topic.learningOutcome || topic.learning_outcome;

        if (question.SK || question.sk || topic.SK || topic.sk) explicitSK += 1;
        else issues.push(issue('info', 'INFERRED_SK', 'Explicit SK is missing; inferred SK will be used.', { ...context, inferredSK: sksp.SK }));

        if (question.SP || question.sp || topic.SP || topic.sp) explicitSP += 1;
        else issues.push(issue('info', 'INFERRED_SP', 'Explicit SP is missing; inferred SP will be used.', { ...context, inferredSP: sksp.SP }));

        if (!uasa) {
          issues.push(issue('warning', 'MISSING_UASA_TAG', 'UASA tag is missing.', context));
        } else {
          uasaTagged += 1;
        }

        if (metadataReview.estimatedTime === 'authored' || (!question.metadataReview && (question.estimatedTime || question.estimated_time))) {
          explicitEstimatedTime += 1;
        } else {
          issues.push(issue('info', 'INFERRED_ESTIMATED_TIME', 'Explicit estimatedTime is missing; inferred time will be used.', { ...context, inferredEstimatedTime: estimatedTime }));
        }

        if (rawLearningOutcome) explicitLearningOutcomes += 1;
        else issues.push(issue('info', 'MISSING_LEARNING_OUTCOME', 'Explicit learning outcome is missing; topic/question objective must be added.', context));

        if (metadataReview.cognitiveLevel === 'pilot-rule') inferredCognitiveLevels += 1;

        if (rawCognitiveLevel) {
          explicitCognitiveLevels += 1;
          if (!VALID_COGNITIVE_LEVELS.has(rawCognitiveLevel)) {
            issues.push(issue('error', 'INVALID_COGNITIVE_LEVEL', `Invalid cognitive level: ${rawCognitiveLevel}`, context));
          }
        } else if (metadataReview.cognitiveLevel === 'pilot-rule') {
          issues.push(issue('info', 'PILOT_INFERRED_COGNITIVE_LEVEL', 'Cognitive level is provisionally assigned by the pilot rule and requires teacher review.', { ...context, cognitiveLevel: question.cognitiveLevel }));
        } else {
          issues.push(issue('info', 'MISSING_COGNITIVE_LEVEL', 'Cognitive level is missing; add an intentional Bloom/KBAT level.', context));
        }

        if (rawQuestionType) {
          explicitQuestionTypes += 1;
          if (!VALID_QUESTION_TYPES.has(String(rawQuestionType).toLowerCase())) {
            issues.push(issue('error', 'INVALID_QUESTION_TYPE', `Invalid question type: ${rawQuestionType}`, context));
          }
        } else {
          issues.push(issue('info', metadataReview.questionType === 'pilot-default' ? 'PILOT_DEFAULT_QUESTION_TYPE' : 'INFERRED_QUESTION_TYPE', 'Question type is inferred from the available fields.', context));
        }

        const displayedCognitiveLevel = String(question.cognitiveLevel || question.cognitive_level || '').toLowerCase();
        const kbatLabel = /kbat/i.test(String(question.q || question.question || '')) || /kbat/i.test(String(uasa || ''));
        if (topic.contentStatus === 'pilot' && kbatLabel && !KBAT_COGNITIVE_LEVELS.has(displayedCognitiveLevel)) {
          issues.push(issue('warning', 'KBAT_COGNITIVE_MISMATCH', 'A question labelled KBAT must target at least the application level.', { ...context, cognitiveLevel: displayedCognitiveLevel || null }));
        }

        if (!sksp.SK) issues.push(issue('error', 'MISSING_NORMALIZED_SK', 'Normalized SK is missing.', context));
        if (!sksp.SP) issues.push(issue('error', 'MISSING_NORMALIZED_SP', 'Normalized SP is missing.', context));
        if (!Number.isFinite(Number(estimatedTime)) || Number(estimatedTime) <= 0) {
          issues.push(issue('error', 'INVALID_ESTIMATED_TIME', 'Estimated time must be a positive number.', { ...context, estimatedTime }));
        }

        const normalizedDifficulty = difficulty || 'missing';
        difficultyBalance[normalizedDifficulty] = (difficultyBalance[normalizedDifficulty] || 0) + 1;
        if (difficulty && !VALID_DIFFICULTIES.has(difficulty)) {
          issues.push(issue('error', 'INVALID_DIFFICULTY', `Invalid difficulty: ${difficulty}`, context));
        }

        coverageKeys.add(`${subject.id}:${sksp.SK}:${sksp.SP}`);
      });
    });
  });

  const errors = issues.filter(item => item.severity === 'error');
  const warnings = issues.filter(item => item.severity === 'warning');
  const infos = issues.filter(item => item.severity === 'info');
  const coverageSummary = {
    subjects: subjects.length,
    topics: totalTopics,
    questions: totalQuestions,
    uniqueSkSpPairs: coverageKeys.size,
    explicitSK,
    explicitSP,
    inferredSK: totalQuestions - explicitSK,
    inferredSP: totalQuestions - explicitSP,
    uasaTagged,
    explicitEstimatedTime,
    inferredEstimatedTime: totalQuestions - explicitEstimatedTime,
    explicitLearningOutcomes,
    missingLearningOutcomes: totalQuestions - explicitLearningOutcomes,
    explicitCognitiveLevels,
    missingCognitiveLevels: totalQuestions - explicitCognitiveLevels,
    inferredCognitiveLevels,
    explicitQuestionTypes,
    inferredQuestionTypes: totalQuestions - explicitQuestionTypes
  };
  const report = {
    validator: 'curriculum',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    totals: {
      infos: infos.length,
      errors: errors.length,
      warnings: warnings.length
    },
    coverageSummary,
    difficultyBalance,
    issues
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (require.main === module) {
  runCurriculumValidation()
    .then(report => {
      console.log(`Curriculum validation ${report.status}: ${report.totals.errors} errors, ${report.totals.warnings} warnings, ${report.totals.infos} info.`);
      process.exit(report.totals.errors ? 1 : 0);
    })
    .catch(error => {
      ensureReportDir();
      fs.writeFileSync(REPORT_PATH, `${JSON.stringify({
        validator: 'curriculum',
        generatedAt: new Date().toISOString(),
        status: 'error',
        fatal: String(error.stack || error)
      }, null, 2)}\n`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runCurriculumValidation };
