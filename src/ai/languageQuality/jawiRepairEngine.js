import { createEmptyJawiRepairStats, finalizeJawiRepairStats, recordJawiIssue } from './jawiRepairStatistics.js';
import {
  classifyJawiSeverity,
  detectJawiIssues,
  getJawiLearningImpact,
  getJawiRepairSuggestion,
  normalizeJawiQuestion
} from './jawiRepairRules.js';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getJawiQuestionId(question = {}) {
  return String(question.id || question.questionId || '').trim();
}

function buildJawiRepairRecord(question = {}, topicMeta = {}) {
  const normalized = normalizeJawiQuestion(question);
  const issues = detectJawiIssues({
    ...question,
    ...normalized
  });
  if (!issues.length) {
    return null;
  }
  const issueType = issues[0];
  const severity = classifyJawiSeverity(issueType);
  const currentIssue = getJawiLearningImpact(issueType);
  const suggestedFix = getJawiRepairSuggestion(issueType);
  return {
    questionId: getJawiQuestionId(question),
    subject: 'Pendidikan Islam Tahun 2',
    topic: String(topicMeta.title || topicMeta.id || 'Jawi').trim(),
    language: 'jawi',
    issueType,
    severity,
    currentIssue,
    suggestedFix,
    learningImpact: currentIssue,
    question: normalized.question,
    rumiWord: normalized.rumiWord,
    jawiText: normalized.jawiText || normalized.jawiAnswer,
    jawiAnswer: normalized.jawiAnswer,
    acceptedAnswers: normalized.acceptedAnswers,
    pronunciationHint: normalized.pronunciationHint,
    explanation: normalized.explanation,
    commonMistake: normalized.commonMistake,
    memoryTip: normalized.memoryTip
  };
}

function analyzeJawiCleanup(questionBank = {}, repairQueueReport = {}, auditReport = {}) {
  const topics = ensureArray(questionBank.topics);
  const jawiTopic = topics.find(topic => String(topic.id || '').toLowerCase() === 'jawi' || /jawi/i.test(String(topic.title || '')));
  const questions = ensureArray(jawiTopic?.questions);
  const repairFindings = ensureArray(repairQueueReport.findings);
  const auditFindings = ensureArray(auditReport.findings);
  const queueLookup = new Map();
  for (const item of repairFindings) {
    if (item.questionId) queueLookup.set(item.questionId, item);
  }
  const auditLookup = new Map();
  for (const item of auditFindings) {
    if (item.questionId) auditLookup.set(item.questionId, item);
  }

  const stats = createEmptyJawiRepairStats();
  stats.repairedQuestionsCount = questions.length;
  const findings = [];

  for (const question of questions) {
    stats.totalQuestionsChecked += 1;
    const queueItem = queueLookup.get(getJawiQuestionId(question)) || {};
    const auditItem = auditLookup.get(getJawiQuestionId(question)) || {};
    const mergedQuestion = {
      ...question,
      ...queueItem,
      ...auditItem
    };
    const record = buildJawiRepairRecord(mergedQuestion, jawiTopic);
    if (!record) continue;
    findings.push(record);
    if (record.issueType === 'multiple_possible_answers') stats.ambiguousQuestionsCount += 1;
    recordJawiIssue(stats, record);
    stats.highestImpactFixes.push({
      ...record,
      impactScore: record.severity === 'Critical' ? 100 : record.severity === 'High' ? 70 : record.severity === 'Medium' ? 40 : 10
    });
    stats.recommendedCleanupOrder.push(record.questionId);
    if (stats.beforeAfterExamples.length < 10) {
      stats.beforeAfterExamples.push({
        questionId: record.questionId,
        before: {
          question: String(question.q || question.question || '').trim(),
          answer: String(question.answer || '').trim(),
          acceptedAnswers: ensureArray(question.accepted)
        },
        after: {
          question: record.question,
          rumiWord: record.rumiWord,
          jawiText: record.jawiText,
          jawiAnswer: record.jawiAnswer,
          acceptedAnswers: record.acceptedAnswers,
          pronunciationHint: record.pronunciationHint || 'sebutan mudah',
          explanation: record.explanation || 'Semak ejaan Jawi dengan teliti.',
          commonMistake: record.commonMistake || 'Jangan tertukar bentuk huruf.'
        }
      });
    }
  }

  stats.highestImpactFixes = stats.highestImpactFixes
    .sort((left, right) => {
      const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (rank[right.severity] || 1) - (rank[left.severity] || 1);
    })
    .slice(0, 50);

  return {
    findings,
    statistics: finalizeJawiRepairStats(stats, findings)
  };
}

export {
  analyzeJawiCleanup,
  buildJawiRepairRecord,
  getJawiQuestionId
};

export default {
  analyzeJawiCleanup,
  buildJawiRepairRecord,
  getJawiQuestionId
};
