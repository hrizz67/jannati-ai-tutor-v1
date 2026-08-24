import { createEmptyRepairStats, finalizeRepairStats, recordRecurringProblem } from './questionRepairStatistics.js';
import {
  getIssueExplanation,
  getRepairPriority,
  getRepairSuggestion,
  getSubjectLabel,
  loadAuditReport,
  normalizeIssueType
} from './questionRepairRules.js';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildRepairRecord(issue = {}) {
  const issueType = normalizeIssueType(issue.issueType);
  const severity = String(issue.severity || 'Low').trim() || 'Low';
  const subject = getSubjectLabel(issue.subject);
  const topic = String(issue.topic || 'unknown').trim() || 'unknown';
  const currentProblem = String(issue.explanation || getIssueExplanation(issueType)).trim();
  const repairSuggestion = String(issue.suggestion || getRepairSuggestion(issueType)).trim();
  const priority = getRepairPriority(severity);

  return {
    questionId: String(issue.questionId || '').trim(),
    subject,
    topic,
    issueType,
    severity,
    currentProblem,
    repairSuggestion,
    priority
  };
}

function analyzeRepairRecommendations(auditReport = {}) {
  const findings = ensureArray(auditReport.findings);
  const repairSuggestions = [];
  const stats = createEmptyRepairStats();
  const recurring = new Map();

  for (const issue of findings) {
    const repair = buildRepairRecord(issue);
    repairSuggestions.push(repair);
    stats.totalRepairSuggestions += 1;
    stats.suggestionsBySubject[repair.subject] = (stats.suggestionsBySubject[repair.subject] || 0) + 1;
    stats.suggestionsByIssueType[repair.issueType] = (stats.suggestionsByIssueType[repair.issueType] || 0) + 1;
    stats.repairPriorityCounts[repair.priority] = (stats.repairPriorityCounts[repair.priority] || 0) + 1;
    if (repair.priority === 'P1') {
      stats.p1RepairList.push(repair);
    }
    recordRecurringProblem(recurring, repair);
  }

  stats.topRecurringProblems = Array.from(recurring.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 20);

  return {
    findings: repairSuggestions,
    statistics: finalizeRepairStats(stats, repairSuggestions)
  };
}

function repairQuestionBankFromAudit(reportPath) {
  const auditReport = loadAuditReport(reportPath);
  return analyzeRepairRecommendations(auditReport);
}

export {
  analyzeRepairRecommendations,
  buildRepairRecord,
  repairQuestionBankFromAudit
};

export default {
  analyzeRepairRecommendations,
  buildRepairRecord,
  repairQuestionBankFromAudit
};
