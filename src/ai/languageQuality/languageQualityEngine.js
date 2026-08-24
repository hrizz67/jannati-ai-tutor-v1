import { classifyArabicSeverity, getArabicLearningImpact, getArabicSuggestion } from './arabicQualityRules.js';
import { classifyJawiSeverity, getJawiLearningImpact, getJawiSuggestion } from './jawiQualityRules.js';
import { createEmptyLanguageQualityStats, finalizeLanguageQualityStats, recordLanguageIssue } from './languageQualityStatistics.js';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isArabicSubject(subject = '') {
  return String(subject || '').toLowerCase().includes('bahasa arab');
}

function isJawiItem(item = {}) {
  const subject = String(item.subject || '').toLowerCase();
  const topic = String(item.topic || '').toLowerCase();
  return subject.includes('pendidikan islam') && topic.includes('jawi');
}

function buildLanguageQualityRecord(item = {}) {
  const subject = String(item.subject || 'unknown').trim();
  const topic = String(item.topic || 'unknown').trim();
  const issueType = String(item.issueType || 'unknown').trim();
  const language = isArabicSubject(subject) ? 'arabic' : isJawiItem(item) ? 'jawi' : 'unknown';
  let severity = String(item.severity || 'Low').trim() || 'Low';
  let currentIssue = String(item.reason || item.currentProblem || 'Language quality issue requires review.').trim();
  let suggestedFix = String(item.suggestedAction || item.repairSuggestion || 'Semak semula kandungan.').trim();
  let learningImpact = 'Language support needs review.';

  if (language === 'arabic') {
    severity = classifyArabicSeverity(issueType);
    currentIssue = getArabicLearningImpact(issueType);
    suggestedFix = getArabicSuggestion(issueType);
    learningImpact = getArabicLearningImpact(issueType);
  } else if (language === 'jawi') {
    severity = classifyJawiSeverity(issueType);
    currentIssue = getJawiLearningImpact(issueType);
    suggestedFix = getJawiSuggestion(issueType);
    learningImpact = getJawiLearningImpact(issueType);
  }

  return {
    questionId: String(item.questionId || '').trim(),
    subject,
    topic,
    language,
    issueType,
    severity,
    currentIssue,
    suggestedFix,
    learningImpact
  };
}

function analyzeLanguageQuality(repairQueue = {}, auditReport = {}) {
  const queueItems = ensureArray(repairQueue.findings);
  const auditIssues = ensureArray(auditReport.findings);
  const auditLookup = new Map();
  for (const issue of auditIssues) {
    if (!issue.questionId) continue;
    auditLookup.set(issue.questionId, issue);
  }

  const findings = [];
  const stats = createEmptyLanguageQualityStats();

  for (const item of queueItems) {
    const audit = auditLookup.get(item.questionId) || {};
    const combined = {
      ...audit,
      ...item,
      subject: item.subject || audit.subject,
      topic: item.topic || audit.topic,
      issueType: item.issueType || audit.issueType,
      severity: item.severity || audit.severity
    };
    const relevantLanguage = isArabicSubject(combined.subject) ? 'arabic' : isJawiItem(combined) ? 'jawi' : 'other';
    if (relevantLanguage === 'other') continue;
    const record = buildLanguageQualityRecord(combined);
    if (record.language === 'arabic') stats.totalArabicQuestionsChecked += 1;
    if (record.language === 'jawi') stats.totalJawiQuestionsChecked += 1;
    findings.push(record);
    recordLanguageIssue(stats, record);
    stats.highestImpactFixes.push({ ...record, impactScore: record.severity === 'Critical' ? 100 : record.severity === 'High' ? 70 : record.severity === 'Medium' ? 40 : 10 });
    stats.recommendedCleanupOrder.push(record.questionId);
  }

  stats.highestImpactFixes = stats.highestImpactFixes
    .sort((left, right) => {
      const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (rank[right.severity] || 1) - (rank[left.severity] || 1);
    })
    .slice(0, 50);

  return {
    findings,
    statistics: finalizeLanguageQualityStats(stats, findings)
  };
}

export {
  analyzeLanguageQuality,
  buildLanguageQualityRecord,
  isArabicSubject,
  isJawiItem
};

export default {
  analyzeLanguageQuality,
  buildLanguageQualityRecord,
  isArabicSubject,
  isJawiItem
};
