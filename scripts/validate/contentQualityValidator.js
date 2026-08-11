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
