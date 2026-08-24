import {
  classifySeverity,
  countWords,
  detectAnswerQuality,
  detectDifficultyQuality,
  detectLanguageQuality,
  detectQuestionCompleteness,
  detectRepetitionQuality,
  getQuestionText,
  listAnswers,
  normalizeText,
  qualityScoreFromIssues,
  splitAlternatives
} from './questionAuditRules.js';
import { createEmptyStats, finalizeStats, recordPattern } from './questionAuditStatistics.js';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getOptions(question = {}) {
  return ensureArray(question.options || question.choices || question.answerOptions || question.answers);
}

function isExplicitBinaryChoice(question = {}, options = []) {
  if (options.length !== 2) return false;
  const type = String(question.questionType || question.type || '').toLowerCase();
  if (['boolean', 'binary', 'true_false', 'true-false', 'yes_no', 'yes-no'].includes(type)) return true;

  const normalized = options.map(item => normalizeText(item));
  const pair = new Set(normalized);
  const knownPairs = [
    ['betul', 'salah'],
    ['benar', 'palsu'],
    ['true', 'false'],
    ['ya', 'tidak'],
    ['yes', 'no']
  ];
  if (knownPairs.some(values => values.every(value => pair.has(value)))) return true;

  const text = getQuestionText(question);
  return /\b(antara|atau|pilih|manakah|yang mana|adakah|lengkapkan)\b/i.test(text);
}

function detectUnclearDistractors(question = {}) {
  const options = getOptions(question);
  if (!options.length) return [];
  const populated = options.filter(item => String(item ?? '').trim());
  const normalized = populated.map(item => normalizeText(item)).filter(Boolean);
  const unique = new Set(normalized);
  const issues = [];
  if (unique.size !== normalized.length) issues.push('duplicate_answer_options');
  if (populated.length < 2) issues.push('unclear_distractors');
  if (populated.length === 2 && !isExplicitBinaryChoice(question, populated)) issues.push('unclear_distractors');
  return issues;
}

function detectMathMultipleAnswer(question = {}) {
  const answer = String(question.answer ?? '').trim();
  const accepted = listAnswers(question);
  const issues = [];
  if (accepted.length === 0 && !answer) issues.push('no_correct_answer');
  return [...new Set(issues)];
}

function buildIssueRecord(question = {}, context = {}, issueType = '', explanation = '', suggestion = '', severity = 'Low') {
  return {
    questionId: String(question.id || question.questionId || '').trim(),
    subject: String(context.subject || context.subjectId || question.subjectId || 'unknown').trim(),
    topic: String(context.topic || context.topicId || question.topicId || 'unknown').trim(),
    severity,
    issueType,
    explanation,
    suggestion
  };
}

function analyzeQuestion(question = {}, context = {}) {
  const text = getQuestionText(question);
  const issues = [];
  const languageIssues = detectLanguageQuality(question, context.subjectId);
  const completenessIssues = detectQuestionCompleteness(question);
  const answerIssues = detectAnswerQuality(question);
  const difficultyIssues = detectDifficultyQuality(question, context.subjectId);
  const repetitionIssues = detectRepetitionQuality(question, context);
  const optionIssues = detectUnclearDistractors(question);
  const mathExtra = context.subjectId === 'math' ? detectMathMultipleAnswer(question) : [];

  for (const issue of completenessIssues) {
    const severity = issue === 'empty_question_text'
      ? 'Critical'
      : issue === 'missing_instruction'
        ? 'High'
        : issue === 'missing_context'
          ? 'Medium'
          : 'High';
    issues.push(buildIssueRecord(
      question,
      context,
      issue,
      'Question text is incomplete or missing context.',
      'Add a complete sentence and clear instruction.',
      severity
    ));
  }

  for (const issue of answerIssues) {
    const severity = issue === 'no_correct_answer'
      ? 'Critical'
      : issue === 'answer_not_matching_options'
        ? 'High'
        : issue === 'duplicate_answer_options'
          ? 'High'
          : issue === 'answer_without_question'
            ? 'High'
            : 'Medium';
    issues.push(buildIssueRecord(
      question,
      context,
      issue,
      'Answer set does not look reliable.',
      'Align the correct answer and accepted answers with the intended response.',
      severity
    ));
  }

  for (const issue of optionIssues) {
    issues.push(buildIssueRecord(
      question,
      context,
      issue,
      'Answer options or distractors may be unclear.',
      'Use distinct distractors and ensure only one correct answer unless multiple answers are intended.',
      'Medium'
    ));
  }

  for (const issue of languageIssues) {
    const severity = /inaccurate_concept/.test(issue)
      ? 'High'
      : /missing_arabic_text|grammar_error|incorrect_tense|ambiguous_operation/.test(issue)
        ? 'Medium'
        : /too_long|missing_context|unsafe_context|awkward_malay_structure/.test(issue)
          ? 'Low'
          : 'Low';
    issues.push(buildIssueRecord(
      question,
      context,
      issue,
      'Question language needs review for Year 2 suitability.',
      'Rewrite to match the target subject language and Year 2 level.',
      severity
    ));
  }

  for (const issue of difficultyIssues) {
    issues.push(buildIssueRecord(
      question,
      context,
      issue,
      'Question difficulty may not match the target topic level.',
      'Adjust the question so the reasoning level matches the Year 2 topic.',
      /kbat_without_enough_information/.test(issue) ? 'High' : 'Medium'
    ));
  }

  for (const issue of repetitionIssues) {
    issues.push(buildIssueRecord(
      question,
      context,
      issue,
      'Question appears to repeat a pattern too often.',
      'Vary the wording and opening structure.',
      'Low'
    ));
  }

  for (const issue of mathExtra) {
    issues.push(buildIssueRecord(
      question,
      context,
      issue,
      'Math question may have more than one valid interpretation.',
      'Add clearer operations and units.',
      'Medium'
    ));
  }

  const severity = classifySeverity(issues.map(item => item.issueType));
  const qualityScore = qualityScoreFromIssues(issues.map(item => item.severity));
  const topIssue = issues[0] || null;
  return {
    questionId: String(question.id || question.questionId || '').trim(),
    subject: String(context.subject || context.subjectId || question.subjectId || 'unknown').trim(),
    topic: String(context.topic || context.topicId || question.topicId || 'unknown').trim(),
    severity,
    issueType: topIssue?.issueType || 'none',
    explanation: topIssue?.explanation || 'Question is acceptable.',
    suggestion: topIssue?.suggestion || 'No action required.',
    qualityScore,
    issues
  };
}

function auditQuestionBank(subjects = []) {
  const allIssues = [];
  const stats = createEmptyStats();
  const qualityScores = [];
  const patterns = new Map();

  for (const subject of ensureArray(subjects)) {
    for (const topic of ensureArray(subject.topics)) {
      const recentTexts = [];
      const recentAnswers = [];
      const recentTemplates = [];
      const recentAnswerTemplates = [];
      for (const question of ensureArray(topic.questions)) {
        const context = {
          subjectId: subject.id,
          topicId: topic.id,
          subject: subject.title || subject.id,
          topic: topic.title || topic.id,
          recentTexts,
          recentAnswers,
          recentTemplates,
          recentAnswerTemplates
        };
        const result = analyzeQuestion(question, context);
        qualityScores.push(result.qualityScore);
        allIssues.push(...result.issues);
        stats.issuesBySubject[context.subject] = (stats.issuesBySubject[context.subject] || 0) + result.issues.length;
        for (const issue of result.issues) {
          stats.severityCounts[issue.severity] = (stats.severityCounts[issue.severity] || 0) + 1;
          stats.issuesByCategory[issue.issueType] = (stats.issuesByCategory[issue.issueType] || 0) + 1;
          if (issue.severity === 'Critical') {
            stats.criticalQuestions.push(issue);
          }
        }
        const text = normalizeText(getQuestionText(question));
        const answerKey = normalizeText(splitAlternatives(listAnswers(question).join('|')).join('|'));
        const templateKey = normalizeText(question.qip?.metadata?.templateId || question.templateId || question.questionStyle || '');
        const answerTemplateKey = templateKey && answerKey ? `${templateKey}::${answerKey}` : '';
        if (text) recentTexts.push(text);
        if (answerKey) recentAnswers.push(answerKey);
        if (templateKey) recentTemplates.push(templateKey);
        if (answerTemplateKey) recentAnswerTemplates.push(answerTemplateKey);
        recentTexts.splice(0, Math.max(0, recentTexts.length - 25));
        recentAnswers.splice(0, Math.max(0, recentAnswers.length - 25));
        recentTemplates.splice(0, Math.max(0, recentTemplates.length - 25));
        recentAnswerTemplates.splice(0, Math.max(0, recentAnswerTemplates.length - 25));
        if (text) patterns.set(text, (patterns.get(text) || 0) + 1);
        if (answerKey) patterns.set(`answer:${answerKey}`, (patterns.get(`answer:${answerKey}`) || 0) + 1);
        if (templateKey) patterns.set(`template:${templateKey}`, (patterns.get(`template:${templateKey}`) || 0) + 1);
      }
    }
  }

  stats.totalQuestions = qualityScores.length;
  stats.averageQualityScore = qualityScores.length
    ? Math.round(qualityScores.reduce((sum, value) => sum + Number(value || 0), 0) / qualityScores.length)
    : 0;
  stats.topRepeatedPatterns = Array.from(patterns.entries())
    .filter(([, count]) => count > 1)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 20);

  return {
    issues: allIssues,
    statistics: finalizeStats(stats, qualityScores),
    qualityScores
  };
}

export {
  auditQuestionBank,
  analyzeQuestion,
  buildIssueRecord
};

export default {
  auditQuestionBank,
  analyzeQuestion,
  buildIssueRecord
};
