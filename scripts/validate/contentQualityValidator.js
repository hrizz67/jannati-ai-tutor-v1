const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT_DIR = path.resolve('reports/validation');
const REPORT_PATH = path.join(REPORT_DIR, 'content-quality-report.json');
const REQUIRED_COGNITIVE_LEVELS = ['mengingat', 'memahami', 'mengaplikasi', 'menganalisis', 'menilai'];

async function loadSubjects() {
  const modulePath = path.resolve('src/data/subjects/index.js');
  const subjectsModule = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  return subjectsModule.loadAllSubjects();
}

function issue(severity, code, message, context = {}) {
  return { severity, code, message, context };
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function acceptedAnswersFor(question = {}) {
  if (Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length) return question.acceptedAnswers;
  if (Array.isArray(question.accepted) && question.accepted.length) return question.accepted;
  return hasText(String(question.answer ?? '')) ? [question.answer] : [];
}

function normalizeComparable(value) {
  return String(value ?? '')
    .toLocaleLowerCase('ms-MY')
    .replace(/[“”'’.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMathTemplate(value) {
  return normalizeComparable(value)
    .replace(/\b\d+\b/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

function moneyCalculationResult(operation, operands = []) {
  const values = Array.isArray(operands) ? operands.map(Number) : [];
  if (values.length < 2 || values.some(value => !Number.isFinite(value))) return Number.NaN;
  if (operation === 'identity') return values[0];
  if (operation === 'addition') return values.reduce((sum, value) => sum + value, 0);
  if (operation === 'subtraction') return values.slice(1).reduce((result, value) => result - value, values[0]);
  if (operation === 'multiplication') return values.reduce((product, value) => product * value, 1);
  if (operation === 'maximum') return Math.max(...values);
  if (operation === 'minimum') return Math.min(...values);
  if (operation === 'difference') return Math.max(...values) - Math.min(...values);
  return Number.NaN;
}

function requiresDirectComprehensionEvidence(questionText) {
  return /(?:siapakah yang melakukan|apakah perkataan bagi benda|di manakah perbuatan|mengapakah watak|bilakah perbuatan|dengan siapakah watak)/i.test(questionText);
}

function punctuationCompletionStem(questionText) {
  const match = String(questionText).match(/Lengkapkan ayat ini dengan tanda baca yang sesuai:\s*(.+)___/i);
  return match?.[1]?.trim() || '';
}

async function runContentQualityValidation() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const subjects = await loadSubjects();
  const issues = [];
  const pilotTopics = [];

  subjects.forEach(subject => {
    const isYearTwoSubject = /(?:Tahun|Year)\s*2\b/i.test(String(subject.title || ''));
    if (isYearTwoSubject) {
      (subject.topics || []).forEach(topic => {
        const context = { subjectId: subject.id, topicId: topic.id };
        if (/\bUASA\b/i.test(String(topic.title || ''))) {
          issues.push(issue('error', 'YEAR_TWO_UASA_TOPIC_MISLABEL', 'Year 2 topic must use PBD or pentaksiran sumatif terminology, not UASA.', context));
        }
        (topic.questions || []).forEach((question, questionIndex) => {
          if (/\bUASA\b/i.test(String(question.uasa || '')) || /\bUASA\b/i.test(String(question.assessment || ''))) {
            issues.push(issue('error', 'YEAR_TWO_UASA_QUESTION_MISLABEL', 'Year 2 question must not be classified as an official UASA item.', {
              ...context,
              questionId: question.id || null,
              questionIndex
            }));
          }
        });
      });
    }

    (subject.topics || []).filter(topic => topic.contentStatus === 'pilot').forEach(topic => {
      const context = { subjectId: subject.id, topicId: topic.id };
      const questions = topic.questions || [];
      const cognitiveDistribution = questions.reduce((acc, question) => {
        const level = String(question.cognitiveLevel || '').toLowerCase() || 'missing';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      if (!hasText(topic.learningObjective)) {
        issues.push(issue('error', 'MISSING_PILOT_OBJECTIVE', 'Pilot topic requires an explicit learning objective.', context));
      }
      if (!hasText(topic.learningOutcome)) {
        issues.push(issue('error', 'MISSING_PILOT_OUTCOME', 'Pilot topic requires an explicit learning outcome.', context));
      }
      if (questions.length < 50) {
        issues.push(issue('error', 'INSUFFICIENT_PILOT_QUESTIONS', 'Pilot topic requires at least 50 questions.', { ...context, questionCount: questions.length }));
      }

      REQUIRED_COGNITIVE_LEVELS.forEach(level => {
        if (!cognitiveDistribution[level]) {
          issues.push(issue('error', 'MISSING_COGNITIVE_BAND', `Pilot topic has no questions at cognitive level: ${level}.`, { ...context, level }));
        }
      });

      if (topic.id === 'bina_ayat') {
        const seenPrompts = new Map();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_BINA_AYAT_PROMPT', 'Bina Ayat questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
      }
      if (topic.id === 'simpulan_bahasa') {
        const seenPrompts = new Map();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_SIMPULAN_PROMPT', 'Simpulan Bahasa questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
      }
      if (topic.id === 'uasa_kbat') {
        const seenPrompts = new Map();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_SUMMATIVE_PROMPT', 'Summative assessment questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_SUMMATIVE_QUESTION_COUNT', 'The Year 2 summative pilot requires exactly 60 integrated questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_SUMMATIVE_CREATE_BAND', 'The Year 2 summative pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 10) {
          issues.push(issue('error', 'INSUFFICIENT_SUMMATIVE_SKILL_COVERAGE', 'The Year 2 summative pilot requires at least 10 integrated language skills.', { ...context, skillCount }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))
          || !/bukan\s+(?:simulasi\s+)?UASA/i.test(String(topic.note || ''))) {
          issues.push(issue('error', 'INVALID_YEAR_TWO_ASSESSMENT_FRAMEWORK', 'The Year 2 summative topic requires an official KPM source and an explicit non-UASA scope note.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'nombor') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_NUMBER_PROMPT', 'Number questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_NUMBER_QUESTION_COUNT', 'The Mathematics number pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_NUMBER_CREATE_BAND', 'The Mathematics number pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 25) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_NUMBER_SKILL_COVERAGE', 'The Mathematics number pilot requires at least 25 number-sense skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 30) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_NUMBER_TEMPLATE_DIVERSITY', 'The Mathematics number pilot requires at least 30 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_CURRICULUM_FRAMEWORK', 'The Mathematics pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'tambah') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_ADDITION_PROMPT', 'Addition questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_ADDITION_QUESTION_COUNT', 'The Mathematics addition pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_ADDITION_CREATE_BAND', 'The Mathematics addition pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_ADDITION_SKILL_COVERAGE', 'The Mathematics addition pilot requires at least 40 addition skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_ADDITION_TEMPLATE_DIVERSITY', 'The Mathematics addition pilot requires at least 40 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_ADDITION_CURRICULUM_FRAMEWORK', 'The Mathematics addition pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'tolak') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_SUBTRACTION_PROMPT', 'Subtraction questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_SUBTRACTION_QUESTION_COUNT', 'The Mathematics subtraction pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_SUBTRACTION_CREATE_BAND', 'The Mathematics subtraction pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_SUBTRACTION_SKILL_COVERAGE', 'The Mathematics subtraction pilot requires at least 40 subtraction skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_SUBTRACTION_TEMPLATE_DIVERSITY', 'The Mathematics subtraction pilot requires at least 40 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_SUBTRACTION_CURRICULUM_FRAMEWORK', 'The Mathematics subtraction pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'darab') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_MULTIPLICATION_PROMPT', 'Multiplication questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_MULTIPLICATION_QUESTION_COUNT', 'The Mathematics multiplication pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_MULTIPLICATION_CREATE_BAND', 'The Mathematics multiplication pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_MULTIPLICATION_SKILL_COVERAGE', 'The Mathematics multiplication pilot requires at least 40 multiplication skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_MULTIPLICATION_TEMPLATE_DIVERSITY', 'The Mathematics multiplication pilot requires at least 40 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_MULTIPLICATION_CURRICULUM_FRAMEWORK', 'The Mathematics multiplication pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'bahagi') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_DIVISION_PROMPT', 'Division questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_DIVISION_QUESTION_COUNT', 'The Mathematics division pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_DIVISION_CREATE_BAND', 'The Mathematics division pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_DIVISION_SKILL_COVERAGE', 'The Mathematics division pilot requires at least 40 division skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 40) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_DIVISION_TEMPLATE_DIVERSITY', 'The Mathematics division pilot requires at least 40 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_DIVISION_CURRICULUM_FRAMEWORK', 'The Mathematics division pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'wang') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_MONEY_PROMPT', 'Money questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_MONEY_QUESTION_COUNT', 'The Mathematics money pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_MONEY_CREATE_BAND', 'The Mathematics money pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 50) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_MONEY_SKILL_COVERAGE', 'The Mathematics money pilot requires at least 50 money skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 45) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_MONEY_TEMPLATE_DIVERSITY', 'The Mathematics money pilot requires at least 45 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_MONEY_CURRICULUM_FRAMEWORK', 'The Mathematics money pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'masa') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_TIME_PROMPT', 'Time questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_TIME_QUESTION_COUNT', 'The Mathematics time pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_TIME_CREATE_BAND', 'The Mathematics time pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 50) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_TIME_SKILL_COVERAGE', 'The Mathematics time pilot requires at least 50 time skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 45) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_TIME_TEMPLATE_DIVERSITY', 'The Mathematics time pilot requires at least 45 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_TIME_CURRICULUM_FRAMEWORK', 'The Mathematics time pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'panjang') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_LENGTH_PROMPT', 'Length questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_LENGTH_QUESTION_COUNT', 'The Mathematics length pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_LENGTH_CREATE_BAND', 'The Mathematics length pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 50) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_LENGTH_SKILL_COVERAGE', 'The Mathematics length pilot requires at least 50 measurement skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 45) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_LENGTH_TEMPLATE_DIVERSITY', 'The Mathematics length pilot requires at least 45 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_LENGTH_CURRICULUM_FRAMEWORK', 'The Mathematics length pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'jisim_isi_padu') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_MEASUREMENT_PROMPT', 'Mass and liquid-volume questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        const massCount = questions.filter(question => question.metadata?.measurementKind === 'mass').length;
        const volumeCount = questions.filter(question => question.metadata?.measurementKind === 'volume').length;
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_MEASUREMENT_QUESTION_COUNT', 'The Mathematics mass and liquid-volume pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_MEASUREMENT_CREATE_BAND', 'The Mathematics mass and liquid-volume pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 50) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_MEASUREMENT_SKILL_COVERAGE', 'The Mathematics measurement pilot requires at least 50 distinct skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 45) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_MEASUREMENT_TEMPLATE_DIVERSITY', 'The Mathematics measurement pilot requires at least 45 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (massCount < 25 || volumeCount < 25) {
          issues.push(issue('error', 'UNBALANCED_MATH_MEASUREMENT_COVERAGE', 'The Mathematics measurement pilot requires substantial coverage of both mass and liquid volume.', { ...context, massCount, volumeCount }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_MEASUREMENT_CURRICULUM_FRAMEWORK', 'The Mathematics measurement pilot requires an official KPM curriculum source.', context));
        }
      }
      if (subject.id === 'math' && topic.id === 'bentuk') {
        const seenPrompts = new Map();
        const templateCount = new Set();
        questions.forEach((question, questionIndex) => {
          const promptKey = normalizeComparable(question.q || question.question);
          const templateKey = normalizeMathTemplate(question.q || question.question);
          if (templateKey) templateCount.add(templateKey);
          if (!promptKey) return;
          if (seenPrompts.has(promptKey)) {
            issues.push(issue('error', 'DUPLICATE_MATH_GEOMETRY_PROMPT', 'Geometry questions must not repeat the same prompt.', {
              ...context,
              questionId: question.id || null,
              questionIndex,
              duplicateOf: seenPrompts.get(promptKey)
            }));
          } else {
            seenPrompts.set(promptKey, question.id || questionIndex);
          }
        });
        const skillCount = new Set(questions.map(question => question.metadata?.skill).filter(Boolean)).size;
        const domainCounts = ['2d', '3d', 'spatial'].reduce((acc, domain) => {
          acc[domain] = questions.filter(question => question.metadata?.geometryDomain === domain).length;
          return acc;
        }, {});
        if (questions.length !== 60) {
          issues.push(issue('error', 'INVALID_MATH_GEOMETRY_QUESTION_COUNT', 'The Mathematics geometry pilot requires exactly 60 questions.', { ...context, questionCount: questions.length }));
        }
        if (!cognitiveDistribution.mencipta) {
          issues.push(issue('error', 'MISSING_MATH_GEOMETRY_CREATE_BAND', 'The Mathematics geometry pilot requires a creating cognitive band.', context));
        }
        if (skillCount < 50) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_GEOMETRY_SKILL_COVERAGE', 'The Mathematics geometry pilot requires at least 50 geometry skills.', { ...context, skillCount }));
        }
        if (templateCount.size < 45) {
          issues.push(issue('error', 'INSUFFICIENT_MATH_GEOMETRY_TEMPLATE_DIVERSITY', 'The Mathematics geometry pilot requires at least 45 distinct wording templates.', { ...context, templateCount: templateCount.size }));
        }
        if (domainCounts['2d'] < 12 || domainCounts['3d'] < 20 || domainCounts.spatial < 10) {
          issues.push(issue('error', 'UNBALANCED_MATH_GEOMETRY_COVERAGE', 'The Mathematics geometry pilot requires substantial 2D, 3D and spatial-reasoning coverage.', { ...context, domainCounts }));
        }
        if (topic.assessmentFramework?.authority !== 'Kementerian Pendidikan Malaysia'
          || !/^https:\/\/www\.moe\.gov\.my\//i.test(String(topic.assessmentFramework?.sourceUrl || ''))) {
          issues.push(issue('error', 'INVALID_MATH_GEOMETRY_CURRICULUM_FRAMEWORK', 'The Mathematics geometry pilot requires an official KPM curriculum source.', context));
        }
      }

      questions.forEach((question, questionIndex) => {
        const questionContext = { ...context, questionId: question.id || null, questionIndex };
        const questionText = String(question.q || question.question || '');
        if (!hasText(question.q || question.question)) issues.push(issue('error', 'MISSING_QUESTION_TEXT', 'Question text is required.', questionContext));
        if (!hasText(String(question.answer ?? ''))) issues.push(issue('error', 'MISSING_ANSWER', 'A canonical answer is required.', questionContext));
        if (!acceptedAnswersFor(question).length) issues.push(issue('error', 'MISSING_ACCEPTED_ANSWERS', 'At least one accepted answer is required.', questionContext));
        if (!hasText(question.hint)) issues.push(issue('error', 'MISSING_HINT', 'A child-safe hint is required.', questionContext));
        if (!hasText(question.explanation)) issues.push(issue('error', 'MISSING_EXPLANATION', 'An answer explanation is required.', questionContext));
        if (!hasText(question.questionType)) issues.push(issue('error', 'MISSING_QUESTION_TYPE', 'Question type is required.', questionContext));
        if (!hasText(question.cognitiveLevel)) issues.push(issue('error', 'MISSING_COGNITIVE_LEVEL', 'Cognitive level is required.', questionContext));
        if (!Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0) issues.push(issue('error', 'INVALID_MARKS', 'Marks must be a positive number.', questionContext));
        if (!Number.isFinite(Number(question.estimatedTime)) || Number(question.estimatedTime) <= 0) issues.push(issue('error', 'INVALID_ESTIMATED_TIME', 'Estimated time must be a positive number.', questionContext));
        if (topic.id === 'pemahaman_penulisan' && requiresDirectComprehensionEvidence(questionText)) {
          const normalizedQuestion = normalizeComparable(questionText);
          const normalizedAnswer = normalizeComparable(question.answer);
          if (normalizedAnswer && !normalizedQuestion.includes(normalizedAnswer)) {
            issues.push(issue('error', 'UNSUPPORTED_COMPREHENSION_ANSWER', 'Direct comprehension answer must be stated in the displayed text.', questionContext));
          }
        }
        if (topic.id === 'ayat') {
          const stem = punctuationCompletionStem(questionText);
          if (stem) {
            const answerWithoutTerminalPunctuation = String(question.answer || '').replace(/[.!?]+$/g, '').trim();
            if (normalizeComparable(stem) !== normalizeComparable(answerWithoutTerminalPunctuation)) {
              issues.push(issue('error', 'PUNCTUATION_TASK_MUTATES_SENTENCE', 'A punctuation-only task must not change the sentence wording.', questionContext));
            }
          }
        }
        if (topic.id === 'tatabahasa' && /_{2,}/.test(questionText)) {
          const completedSentence = questionText.replace(/_{2,}/, String(question.answer || ''));
          const repeatedWord = completedSentence.match(/\b([\p{L}][\p{L}'-]*)\s+\1\b/iu);
          if (repeatedWord) {
            issues.push(issue('error', 'DUPLICATE_WORD_AFTER_FILL', `Filling the blank creates a repeated word: "${repeatedWord[0]}".`, questionContext));
          }
        }
        if (topic.id === 'bina_ayat' && String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
          const criteria = question.rubric?.criteria;
          const modelAnswer = String(question.answer || '').trim();
          const quotedKeywords = [...questionText.matchAll(/["“”']([^"“”']+)["“”']/g)];
          if (!Array.isArray(criteria) || criteria.length < 3 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
            issues.push(issue('error', 'INVALID_BINA_AYAT_RUBRIC', 'Creative sentence tasks require a three-criterion rubric whose total matches the question marks.', questionContext));
          }
          if (quotedKeywords.length < 2) {
            issues.push(issue('error', 'INSUFFICIENT_BINA_AYAT_KEYWORDS', 'Creative sentence tasks require at least two clearly quoted keywords.', questionContext));
          }
          if (!/^\p{Lu}/u.test(modelAnswer) || !/[.!?]$/u.test(modelAnswer)) {
            issues.push(issue('error', 'INVALID_BINA_AYAT_MODEL_SENTENCE', 'The model sentence must begin with a capital letter and end with punctuation.', questionContext));
          }
          if (/\b([\p{L}][\p{L}'-]*)\s+\1\b/iu.test(modelAnswer)) {
            issues.push(issue('error', 'REPEATED_WORD_IN_BINA_AYAT_MODEL', 'The model sentence must not contain an accidental repeated word.', questionContext));
          }
        }
        if (topic.id === 'uasa_kbat' && String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
          const criteria = question.rubric?.criteria;
          const modelAnswer = String(question.answer || '').trim();
          const semanticCues = Array.isArray(question.responseRules?.semanticCues) ? question.responseRules.semanticCues : [];
          const normalizedModel = normalizeComparable(modelAnswer);
          const quotedKeywords = [...questionText.matchAll(/["“”']([^"“”']+)["“”']/g)];
          if (!Array.isArray(criteria) || criteria.length < 3 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
            issues.push(issue('error', 'INVALID_SUMMATIVE_CREATE_RUBRIC', 'Creative summative tasks require a three-criterion rubric whose total matches the question marks.', questionContext));
          }
          if (quotedKeywords.length < 2) {
            issues.push(issue('error', 'INSUFFICIENT_SUMMATIVE_CREATE_KEYWORDS', 'Creative summative tasks require at least two clearly quoted keywords.', questionContext));
          }
          if (!semanticCues.length || !semanticCues.some(value => normalizedModel.includes(normalizeComparable(value)))) {
            issues.push(issue('error', 'MISSING_SUMMATIVE_CREATE_CONTEXT', 'Creative summative tasks require semantic context cues demonstrated by the model answer.', questionContext));
          }
          if (!/^\p{Lu}/u.test(modelAnswer) || !/[.!?]$/u.test(modelAnswer)) {
            issues.push(issue('error', 'INVALID_SUMMATIVE_MODEL_SENTENCE', 'The model sentence must begin with a capital letter and end with punctuation.', questionContext));
          }
          if (/\b([\p{L}][\p{L}'-]*)\s+\1\b/iu.test(modelAnswer)) {
            issues.push(issue('error', 'REPEATED_WORD_IN_SUMMATIVE_MODEL', 'The model sentence must not contain an accidental repeated word.', questionContext));
          }
        }
        if (subject.id === 'math' && topic.id === 'nombor') {
          const displayedNumbers = questionText.match(/\b\d+\b/g)?.map(Number) || [];
          if (displayedNumbers.some(value => value > 1000)) {
            issues.push(issue('error', 'MATH_NUMBER_OUT_OF_YEAR_TWO_RANGE', 'Number-sense prompts must remain within 1000 for this Year 2 topic.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_CONSTRUCTION_RUBRIC', 'Number-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'tambah') {
          const calculations = question.metadata?.calculations;
          const calculationResults = question.metadata?.calculationResults;
          const numericAnswer = Number(question.metadata?.numericAnswer);
          if (question.metadata?.operation !== 'addition') {
            issues.push(issue('error', 'INVALID_MATH_ADDITION_OPERATION', 'Addition questions require explicit addition-operation metadata.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_ADDITION_NUMBERS', 'Curated addition questions must preserve authored numbers, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationResults) || calculationResults.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_ADDITION_CALCULATION', 'Addition questions require auditable calculation operands and results.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              const expected = values.reduce((sum, value) => sum + value, 0);
              if (values.length < 2 || values.some(value => !Number.isInteger(value) || value < 0 || value > 1000)) {
                issues.push(issue('error', 'INVALID_MATH_ADDITION_OPERANDS', 'Each addition calculation requires two or three whole-number operands within 1000.', { ...questionContext, calculationIndex }));
              }
              if (expected > 1000) {
                issues.push(issue('error', 'MATH_ADDITION_SUM_OUT_OF_RANGE', 'Addition calculation results must remain within 1000.', { ...questionContext, calculationIndex, expected }));
              }
              if (Number(calculationResults[calculationIndex]) !== expected) {
                issues.push(issue('error', 'MATH_ADDITION_RESULT_MISMATCH', 'Stored addition result does not match its operands.', { ...questionContext, calculationIndex, expected, actual: calculationResults[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 1000) {
            issues.push(issue('error', 'INVALID_MATH_ADDITION_NUMERIC_ANSWER', 'Addition questions require an auditable numeric answer within 1000.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = question.responseRules?.requiredNumbers;
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_ADDITION_CREATE_RUBRIC', 'Addition-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (!Array.isArray(requiredNumbers) || requiredNumbers.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_ADDITION_RESPONSE_RULES', 'Addition-construction tasks require explicit numeric response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'tolak') {
          const calculations = question.metadata?.calculations;
          const calculationResults = question.metadata?.calculationResults;
          const numericAnswer = Number(question.metadata?.numericAnswer);
          if (question.metadata?.operation !== 'subtraction') {
            issues.push(issue('error', 'INVALID_MATH_SUBTRACTION_OPERATION', 'Subtraction questions require explicit subtraction-operation metadata.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_SUBTRACTION_NUMBERS', 'Curated subtraction questions must preserve authored numbers, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationResults) || calculationResults.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_SUBTRACTION_CALCULATION', 'Subtraction questions require auditable calculation operands and results.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              let current = values[0];
              let hasNegativeIntermediate = false;
              values.slice(1).forEach(value => {
                current -= value;
                if (current < 0) hasNegativeIntermediate = true;
              });
              if (values.length < 2 || values.length > 3 || values.some(value => !Number.isInteger(value) || value < 0 || value > 1000)) {
                issues.push(issue('error', 'INVALID_MATH_SUBTRACTION_OPERANDS', 'Each subtraction calculation requires two or three whole-number operands within 1000.', { ...questionContext, calculationIndex }));
              }
              if (hasNegativeIntermediate || current > 1000) {
                issues.push(issue('error', 'MATH_SUBTRACTION_RESULT_OUT_OF_RANGE', 'Subtraction calculations must remain within whole numbers from 0 to 1000.', { ...questionContext, calculationIndex, expected: current }));
              }
              if (Number(calculationResults[calculationIndex]) !== current) {
                issues.push(issue('error', 'MATH_SUBTRACTION_RESULT_MISMATCH', 'Stored subtraction result does not match its operands.', { ...questionContext, calculationIndex, expected: current, actual: calculationResults[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 1000) {
            issues.push(issue('error', 'INVALID_MATH_SUBTRACTION_NUMERIC_ANSWER', 'Subtraction questions require an auditable numeric answer within 1000.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = question.responseRules?.requiredNumbers;
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_SUBTRACTION_CREATE_RUBRIC', 'Subtraction-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (!Array.isArray(requiredNumbers) || requiredNumbers.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_SUBTRACTION_RESPONSE_RULES', 'Subtraction-construction tasks require explicit numeric response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'darab') {
          const calculations = question.metadata?.calculations;
          const calculationResults = question.metadata?.calculationResults;
          const numericAnswer = Number(question.metadata?.numericAnswer);
          if (question.metadata?.operation !== 'multiplication') {
            issues.push(issue('error', 'INVALID_MATH_MULTIPLICATION_OPERATION', 'Multiplication questions require explicit multiplication-operation metadata.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_MULTIPLICATION_NUMBERS', 'Curated multiplication questions must preserve authored factors, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationResults) || calculationResults.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_MULTIPLICATION_CALCULATION', 'Multiplication questions require auditable factors and products.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              const expected = values.reduce((product, value) => product * value, 1);
              if (values.length < 2 || values.length > 3 || values.some(value => !Number.isInteger(value) || value < 0 || value > 10)) {
                issues.push(issue('error', 'INVALID_MATH_MULTIPLICATION_FACTORS', 'Each multiplication calculation requires two or three whole-number factors from 0 to 10.', { ...questionContext, calculationIndex }));
              }
              if (expected < 0 || expected > 1000) {
                issues.push(issue('error', 'MATH_MULTIPLICATION_PRODUCT_OUT_OF_RANGE', 'Multiplication products must remain within 1000.', { ...questionContext, calculationIndex, expected }));
              }
              if (Number(calculationResults[calculationIndex]) !== expected) {
                issues.push(issue('error', 'MATH_MULTIPLICATION_RESULT_MISMATCH', 'Stored multiplication product does not match its factors.', { ...questionContext, calculationIndex, expected, actual: calculationResults[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 1000) {
            issues.push(issue('error', 'INVALID_MATH_MULTIPLICATION_NUMERIC_ANSWER', 'Multiplication questions require an auditable numeric answer within 1000.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = question.responseRules?.requiredNumbers;
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_MULTIPLICATION_CREATE_RUBRIC', 'Multiplication-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (!Array.isArray(requiredNumbers) || requiredNumbers.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_MULTIPLICATION_RESPONSE_RULES', 'Multiplication-construction tasks require explicit numeric response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'bahagi') {
          const calculations = question.metadata?.calculations;
          const calculationResults = question.metadata?.calculationResults;
          const numericAnswer = Number(question.metadata?.numericAnswer);
          if (question.metadata?.operation !== 'division') {
            issues.push(issue('error', 'INVALID_MATH_DIVISION_OPERATION', 'Division questions require explicit division-operation metadata.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_DIVISION_NUMBERS', 'Curated division questions must preserve authored numbers, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationResults) || calculationResults.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_DIVISION_CALCULATION', 'Division questions require auditable dividends, divisors and quotients.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              const dividend = values[0];
              const divisor = values[1];
              const expected = divisor ? dividend / divisor : Number.NaN;
              if (values.length !== 2
                || !Number.isInteger(dividend) || dividend < 0 || dividend > 100
                || !Number.isInteger(divisor) || divisor < 1 || divisor > 10) {
                issues.push(issue('error', 'INVALID_MATH_DIVISION_OPERANDS', 'Each division calculation requires a whole-number dividend from 0 to 100 and a divisor from 1 to 10.', { ...questionContext, calculationIndex }));
              }
              if (!Number.isInteger(expected) || expected < 0 || expected > 10) {
                issues.push(issue('error', 'MATH_DIVISION_QUOTIENT_OUT_OF_RANGE', 'Division quotients must be whole numbers from 0 to 10.', { ...questionContext, calculationIndex, expected }));
              }
              if (Number(calculationResults[calculationIndex]) !== expected) {
                issues.push(issue('error', 'MATH_DIVISION_RESULT_MISMATCH', 'Stored division quotient does not match its dividend and divisor.', { ...questionContext, calculationIndex, expected, actual: calculationResults[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 100) {
            issues.push(issue('error', 'INVALID_MATH_DIVISION_NUMERIC_ANSWER', 'Division questions require an auditable whole-number answer within 100.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = question.responseRules?.requiredNumbers;
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_DIVISION_CREATE_RUBRIC', 'Division-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (!Array.isArray(requiredNumbers) || requiredNumbers.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_DIVISION_RESPONSE_RULES', 'Division-construction tasks require explicit numeric response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'wang') {
          const calculations = question.metadata?.calculations;
          const calculationOperations = question.metadata?.calculationOperations;
          const calculationResultsCents = question.metadata?.calculationResultsCents;
          const numericAnswerCents = Number(question.metadata?.numericAnswerCents);
          if (question.metadata?.operation !== 'money' || question.metadata?.moneyUnit !== 'sen') {
            issues.push(issue('error', 'INVALID_MATH_MONEY_OPERATION', 'Money questions require explicit money-operation metadata using sen as the internal unit.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_MONEY_VALUES', 'Curated money questions must preserve authored values, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!/\b(?:RM|sen|ringgit|wang|bayaran|harga|baki|bajet)\b/i.test(`${questionText} ${question.answer}`)) {
            issues.push(issue('error', 'MISSING_MATH_MONEY_CONTEXT', 'Money questions must explicitly identify a monetary value or context.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationOperations) || calculationOperations.length !== calculations.length
            || !Array.isArray(calculationResultsCents) || calculationResultsCents.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_MONEY_CALCULATION', 'Money questions require auditable calculations, operation types and results in sen.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              const operation = calculationOperations[calculationIndex];
              const expected = moneyCalculationResult(operation, values);
              if (values.length < 2 || values.length > 4
                || values.some(value => !Number.isInteger(value) || value < 0 || value > 10000)) {
                issues.push(issue('error', 'INVALID_MATH_MONEY_AMOUNTS', 'Money calculations require two to four non-negative whole-number values no greater than 10000 sen.', { ...questionContext, calculationIndex }));
              }
              if (!['identity', 'addition', 'subtraction', 'multiplication', 'maximum', 'minimum', 'difference'].includes(operation)) {
                issues.push(issue('error', 'INVALID_MATH_MONEY_CALCULATION_TYPE', 'Money calculations use an unsupported operation type.', { ...questionContext, calculationIndex, operation }));
              }
              if (!Number.isInteger(expected) || expected < 0 || expected > 10000) {
                issues.push(issue('error', 'MATH_MONEY_RESULT_OUT_OF_RANGE', 'Money calculation results must remain between 0 and RM 100.', { ...questionContext, calculationIndex, expected }));
              }
              if (Number(calculationResultsCents[calculationIndex]) !== expected) {
                issues.push(issue('error', 'MATH_MONEY_RESULT_MISMATCH', 'Stored money result does not match its values and operation.', { ...questionContext, calculationIndex, expected, actual: calculationResultsCents[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswerCents) || numericAnswerCents < 0 || numericAnswerCents > 10000) {
            issues.push(issue('error', 'INVALID_MATH_MONEY_NUMERIC_ANSWER', 'Money questions require an auditable answer from 0 to 10000 sen.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = question.responseRules?.requiredNumbers;
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_MONEY_CREATE_RUBRIC', 'Money-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (!Array.isArray(requiredNumbers) || requiredNumbers.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_MONEY_RESPONSE_RULES', 'Money-construction tasks require explicit numeric response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'masa') {
          const calculations = question.metadata?.calculations;
          const calculationOperations = question.metadata?.calculationOperations;
          const calculationResults = question.metadata?.calculationResultsMinutes;
          const numericAnswer = Number(question.metadata?.numericAnswerMinutes);
          if (question.metadata?.operation !== 'time') {
            issues.push(issue('error', 'INVALID_MATH_TIME_OPERATION', 'Time questions require explicit time-operation metadata.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_TIME_VALUES', 'Curated time questions must preserve authored values, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!/\b(?:pukul|jam|minit|hari|minggu|bulan|tahun|waktu|tempoh|tarikh|kalendar|jadual|jarum)\b/i.test(`${questionText} ${question.answer}`)) {
            issues.push(issue('error', 'MISSING_MATH_TIME_CONTEXT', 'Time questions must explicitly identify a time, duration or calendar context.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationOperations) || calculationOperations.length !== calculations.length
            || !Array.isArray(calculationResults) || calculationResults.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_TIME_CALCULATION', 'Time questions require auditable values, operation types and results.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              const operation = calculationOperations[calculationIndex];
              const expected = moneyCalculationResult(operation, values);
              if (values.length < 2 || values.length > 4
                || values.some(value => !Number.isInteger(value) || value < 0 || value > 1440)) {
                issues.push(issue('error', 'INVALID_MATH_TIME_VALUES', 'Time calculations require two to four non-negative whole-number values no greater than 1440.', { ...questionContext, calculationIndex }));
              }
              if (!['identity', 'addition', 'subtraction', 'multiplication', 'maximum', 'minimum', 'difference'].includes(operation)) {
                issues.push(issue('error', 'INVALID_MATH_TIME_CALCULATION_TYPE', 'Time calculations use an unsupported operation type.', { ...questionContext, calculationIndex, operation }));
              }
              if (!Number.isInteger(expected) || expected < 0 || expected > 1440) {
                issues.push(issue('error', 'MATH_TIME_RESULT_OUT_OF_RANGE', 'Time calculation results must remain whole numbers from 0 to 1440.', { ...questionContext, calculationIndex, expected }));
              }
              if (Number(calculationResults[calculationIndex]) !== expected) {
                issues.push(issue('error', 'MATH_TIME_RESULT_MISMATCH', 'Stored time result does not match its values and operation.', { ...questionContext, calculationIndex, expected, actual: calculationResults[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 1440) {
            issues.push(issue('error', 'INVALID_MATH_TIME_NUMERIC_ANSWER', 'Time questions require an auditable whole-number result from 0 to 1440.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = Array.isArray(question.responseRules?.requiredNumbers) ? question.responseRules.requiredNumbers : [];
            const requiredWords = Array.isArray(question.responseRules?.requiredWords) ? question.responseRules.requiredWords : [];
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_TIME_CREATE_RUBRIC', 'Time-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (requiredNumbers.length + requiredWords.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_TIME_RESPONSE_RULES', 'Time-construction tasks require explicit numeric or calendar response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'panjang') {
          const calculations = question.metadata?.calculations;
          const calculationOperations = question.metadata?.calculationOperations;
          const calculationResults = question.metadata?.calculationResultsCm;
          const numericAnswer = Number(question.metadata?.numericAnswerCm);
          if (question.metadata?.operation !== 'length' || question.metadata?.lengthUnit !== 'cm') {
            issues.push(issue('error', 'INVALID_MATH_LENGTH_OPERATION', 'Length questions require explicit length-operation metadata using cm as the internal unit.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_LENGTH_VALUES', 'Curated length questions must preserve authored measurements, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!/\b(?:cm|sentimeter|m|meter|panjang|tinggi|lebar|jarak|pembaris|pita ukur|skala)\b/i.test(`${questionText} ${question.answer}`)) {
            issues.push(issue('error', 'MISSING_MATH_LENGTH_CONTEXT', 'Length questions must explicitly identify a unit, measurement, scale or measuring tool.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationOperations) || calculationOperations.length !== calculations.length
            || !Array.isArray(calculationResults) || calculationResults.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_LENGTH_CALCULATION', 'Length questions require auditable measurements, operation types and results in cm.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              const operation = calculationOperations[calculationIndex];
              const expected = moneyCalculationResult(operation, values);
              if (values.length < 2 || values.length > 4
                || values.some(value => !Number.isInteger(value) || value < 0 || value > 10000)) {
                issues.push(issue('error', 'INVALID_MATH_LENGTH_VALUES', 'Length calculations require two to four non-negative whole-number values no greater than 10000 cm.', { ...questionContext, calculationIndex }));
              }
              if (!['identity', 'addition', 'subtraction', 'multiplication', 'maximum', 'minimum', 'difference'].includes(operation)) {
                issues.push(issue('error', 'INVALID_MATH_LENGTH_CALCULATION_TYPE', 'Length calculations use an unsupported operation type.', { ...questionContext, calculationIndex, operation }));
              }
              if (!Number.isInteger(expected) || expected < 0 || expected > 10000) {
                issues.push(issue('error', 'MATH_LENGTH_RESULT_OUT_OF_RANGE', 'Length calculation results must remain whole numbers from 0 to 10000 cm.', { ...questionContext, calculationIndex, expected }));
              }
              if (Number(calculationResults[calculationIndex]) !== expected) {
                issues.push(issue('error', 'MATH_LENGTH_RESULT_MISMATCH', 'Stored length result does not match its measurements and operation.', { ...questionContext, calculationIndex, expected, actual: calculationResults[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 10000) {
            issues.push(issue('error', 'INVALID_MATH_LENGTH_NUMERIC_ANSWER', 'Length questions require an auditable whole-number result from 0 to 10000 cm.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = Array.isArray(question.responseRules?.requiredNumbers) ? question.responseRules.requiredNumbers : [];
            const requiredWords = Array.isArray(question.responseRules?.requiredWords) ? question.responseRules.requiredWords : [];
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_LENGTH_CREATE_RUBRIC', 'Length-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (requiredNumbers.length + requiredWords.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_LENGTH_RESPONSE_RULES', 'Length-construction tasks require explicit measurement response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'jisim_isi_padu') {
          const calculations = question.metadata?.calculations;
          const calculationOperations = question.metadata?.calculationOperations;
          const calculationResults = question.metadata?.calculationResultsBase;
          const numericAnswer = Number(question.metadata?.numericAnswerBase);
          const measurementKind = question.metadata?.measurementKind;
          const measurementUnit = question.metadata?.measurementUnit;
          const hasMeasurementContext = measurementKind === 'mass'
            ? /\b(?:g|gram|kg|kilogram|jisim|penimbang|berat|ringan)\b/i.test(`${questionText} ${question.answer}`)
            : /\b(?:mL|mililiter|L|liter|isi padu|cecair|jag|silinder|sukat|air|jus)\b/i.test(`${questionText} ${question.answer}`);
          if (question.metadata?.operation !== 'measurement'
            || !['mass', 'volume'].includes(measurementKind)
            || (measurementKind === 'mass' && measurementUnit !== 'g')
            || (measurementKind === 'volume' && measurementUnit !== 'mL')) {
            issues.push(issue('error', 'INVALID_MATH_MEASUREMENT_OPERATION', 'Measurement questions require a valid mass or volume kind with g or mL as the internal unit.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_MEASUREMENT_VALUES', 'Curated measurement questions must preserve authored values, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!hasMeasurementContext) {
            issues.push(issue('error', 'MISSING_MATH_MEASUREMENT_CONTEXT', 'Measurement questions must explicitly identify a unit, quantity or measuring tool.', questionContext));
          }
          if (!Array.isArray(calculations) || !calculations.length
            || !Array.isArray(calculationOperations) || calculationOperations.length !== calculations.length
            || !Array.isArray(calculationResults) || calculationResults.length !== calculations.length) {
            issues.push(issue('error', 'MISSING_MATH_MEASUREMENT_CALCULATION', 'Measurement questions require auditable values, operation types and results in the base unit.', questionContext));
          } else {
            calculations.forEach((operands, calculationIndex) => {
              const values = Array.isArray(operands) ? operands.map(Number) : [];
              const operation = calculationOperations[calculationIndex];
              const expected = moneyCalculationResult(operation, values);
              if (values.length < 2 || values.length > 4
                || values.some(value => !Number.isInteger(value) || value < 0 || value > 100000)) {
                issues.push(issue('error', 'INVALID_MATH_MEASUREMENT_VALUES', 'Measurement calculations require two to four non-negative whole-number values no greater than 100000 base units.', { ...questionContext, calculationIndex }));
              }
              if (!['identity', 'addition', 'subtraction', 'multiplication', 'maximum', 'minimum', 'difference'].includes(operation)) {
                issues.push(issue('error', 'INVALID_MATH_MEASUREMENT_CALCULATION_TYPE', 'Measurement calculations use an unsupported operation type.', { ...questionContext, calculationIndex, operation }));
              }
              if (!Number.isInteger(expected) || expected < 0 || expected > 100000) {
                issues.push(issue('error', 'MATH_MEASUREMENT_RESULT_OUT_OF_RANGE', 'Measurement results must remain whole numbers from 0 to 100000 base units.', { ...questionContext, calculationIndex, expected }));
              }
              if (Number(calculationResults[calculationIndex]) !== expected) {
                issues.push(issue('error', 'MATH_MEASUREMENT_RESULT_MISMATCH', 'Stored measurement result does not match its values and operation.', { ...questionContext, calculationIndex, expected, actual: calculationResults[calculationIndex] }));
              }
            });
          }
          if (!Number.isInteger(numericAnswer) || numericAnswer < 0 || numericAnswer > 100000) {
            issues.push(issue('error', 'INVALID_MATH_MEASUREMENT_NUMERIC_ANSWER', 'Measurement questions require an auditable whole-number result in the base unit.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = Array.isArray(question.responseRules?.requiredNumbers) ? question.responseRules.requiredNumbers : [];
            const requiredWords = Array.isArray(question.responseRules?.requiredWords) ? question.responseRules.requiredWords : [];
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_MEASUREMENT_CREATE_RUBRIC', 'Measurement-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (requiredNumbers.length + requiredWords.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_MEASUREMENT_RESPONSE_RULES', 'Measurement-construction tasks require explicit numeric or unit response rules.', questionContext));
            }
          }
        }
        if (subject.id === 'math' && topic.id === 'bentuk') {
          const geometryDomain = question.metadata?.geometryDomain;
          const shape = String(question.metadata?.shape || '').trim();
          const factType = String(question.metadata?.factType || '').trim();
          const answerTokens = Array.isArray(question.metadata?.answerTokens) ? question.metadata.answerTokens : [];
          const answerComparable = normalizeComparable(`${question.answer} ${question.explanation}`);
          if (question.metadata?.operation !== 'geometry' || !['2d', '3d', 'spatial'].includes(geometryDomain)) {
            issues.push(issue('error', 'INVALID_MATH_GEOMETRY_OPERATION', 'Geometry questions require explicit geometry-operation metadata and a valid domain.', questionContext));
          }
          if (question.metadata?.numberVariationPolicy !== 'authored_locked') {
            issues.push(issue('error', 'UNPROTECTED_MATH_GEOMETRY_CONTENT', 'Curated geometry questions must preserve authored shapes, hints, explanations and response rules at runtime.', questionContext));
          }
          if (!shape || !factType || !answerTokens.length) {
            issues.push(issue('error', 'MISSING_MATH_GEOMETRY_FACT_METADATA', 'Geometry questions require a shape, fact type and answer evidence tokens.', questionContext));
          }
          if (!/\b(?:bentuk|2D|3D|sisi|bucu|permukaan|bulatan|segi|kubus|kuboid|silinder|kon|sfera|piramid|pola|bentangan|objek)\b/i.test(`${questionText} ${question.answer}`)) {
            issues.push(issue('error', 'MISSING_MATH_GEOMETRY_CONTEXT', 'Geometry questions must explicitly identify a shape, feature, pattern or spatial object.', questionContext));
          }
          if (answerTokens.length && !answerTokens.every(token => answerComparable.includes(normalizeComparable(token)))) {
            issues.push(issue('error', 'MATH_GEOMETRY_ANSWER_EVIDENCE_MISMATCH', 'The geometry answer or explanation does not demonstrate every required answer token.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const requiredNumbers = Array.isArray(question.responseRules?.requiredNumbers) ? question.responseRules.requiredNumbers : [];
            const requiredWords = Array.isArray(question.responseRules?.requiredWords) ? question.responseRules.requiredWords : [];
            if (!Array.isArray(criteria) || criteria.length < 2 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_MATH_GEOMETRY_CREATE_RUBRIC', 'Geometry-construction tasks require a rubric whose total matches the question marks.', questionContext));
            }
            if (requiredNumbers.length + requiredWords.length < 3) {
              issues.push(issue('error', 'MISSING_MATH_GEOMETRY_RESPONSE_RULES', 'Geometry-construction tasks require explicit shape or feature response rules.', questionContext));
            }
          }
        }
        if (topic.id === 'simpulan_bahasa') {
          const responseKind = String(question.metadata?.responseKind || '').toLowerCase();
          const sourcePhrase = normalizeComparable(question.source?.phrase);
          const accepted = acceptedAnswersFor(question).map(normalizeComparable);
          if (question.source?.authority !== 'DBP PRPM' || !/^https:\/\/prpm\.dbp\.gov\.my\//i.test(String(question.source?.url || '')) || !sourcePhrase) {
            issues.push(issue('error', 'INVALID_SIMPULAN_SOURCE', 'Each Simpulan Bahasa question requires a phrase and an official DBP PRPM source URL.', questionContext));
          }
          if (responseKind === 'phrase' && !accepted.includes(sourcePhrase)) {
            issues.push(issue('error', 'SIMPULAN_RESPONSE_TYPE_MISMATCH', 'A question that asks for the idiom must accept the idiom itself, not only its meaning.', questionContext));
          }
          if (String(question.cognitiveLevel).toLowerCase() === 'mencipta') {
            const criteria = question.rubric?.criteria;
            const variants = Array.isArray(question.responseRules?.requiredVariants) ? question.responseRules.requiredVariants : [];
            const semanticCues = Array.isArray(question.responseRules?.semanticCues) ? question.responseRules.semanticCues : [];
            const modelAnswer = String(question.answer || '').trim();
            const normalizedModel = normalizeComparable(modelAnswer);
            if (!Array.isArray(criteria) || criteria.length < 3 || Number(question.rubric?.totalMarks) !== Number(question.marks)) {
              issues.push(issue('error', 'INVALID_SIMPULAN_USAGE_RUBRIC', 'Creative idiom usage requires a three-criterion rubric whose total matches the question marks.', questionContext));
            }
            if (!variants.length || !semanticCues.length) {
              issues.push(issue('error', 'MISSING_SIMPULAN_RESPONSE_RULES', 'Creative idiom usage requires phrase variants and semantic context cues.', questionContext));
            }
            if (variants.length && !variants.some(value => normalizedModel.includes(normalizeComparable(value)))) {
              issues.push(issue('error', 'MODEL_MISSING_SIMPULAN', 'The model sentence must use the required idiom or an approved inflected variant.', questionContext));
            }
            if (semanticCues.length && !semanticCues.some(value => normalizedModel.includes(normalizeComparable(value)))) {
              issues.push(issue('error', 'MODEL_MISSING_SIMPULAN_CONTEXT', 'The model sentence must contain context that demonstrates the idiomatic meaning.', questionContext));
            }
            if (!/^\p{Lu}/u.test(modelAnswer) || !/[.!?]$/u.test(modelAnswer)) {
              issues.push(issue('error', 'INVALID_SIMPULAN_MODEL_SENTENCE', 'The model usage sentence must begin with a capital letter and end with punctuation.', questionContext));
            }
          }
        }
      });

      pilotTopics.push({
        subjectId: subject.id,
        topicId: topic.id,
        title: topic.title,
        questionCount: questions.length,
        cognitiveDistribution
      });
    });
  });

  if (!pilotTopics.length) {
    issues.push(issue('error', 'NO_PILOT_TOPICS', 'At least one pilot topic must be configured.'));
  }

  const errors = issues.filter(item => item.severity === 'error');
  const warnings = issues.filter(item => item.severity === 'warning');
  const infos = issues.filter(item => item.severity === 'info');
  const report = {
    validator: 'content-quality',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    totals: { infos: infos.length, warnings: warnings.length, errors: errors.length },
    summary: {
      pilotTopicCount: pilotTopics.length,
      pilotQuestionCount: pilotTopics.reduce((sum, topic) => sum + topic.questionCount, 0)
    },
    pilotTopics,
    issues
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (require.main === module) {
  runContentQualityValidation()
    .then(report => {
      console.log(`Content quality validation ${report.status}: ${report.totals.errors} errors, ${report.totals.warnings} warnings.`);
      process.exit(report.totals.errors ? 1 : 0);
    })
    .catch(error => {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
      fs.writeFileSync(REPORT_PATH, `${JSON.stringify({
        validator: 'content-quality',
        generatedAt: new Date().toISOString(),
        status: 'error',
        fatal: String(error.stack || error)
      }, null, 2)}\n`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runContentQualityValidation };
