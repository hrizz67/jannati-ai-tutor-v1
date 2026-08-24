import { calculateImpactScore, getPriorityForIssue, getPriorityLabel } from './repairPriorityRules.js';
import { createEmptyQueueStats, finalizeQueueStats, recordQueueItem } from './repairQueueStatistics.js';

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function getReadinessLabel(stats = {}) {
  const p0 = stats.itemsByPriority?.P0 || 0;
  const p1 = stats.itemsByPriority?.P1 || 0;
  if (p0 > 0) return 'BLOCKED';
  if (p1 > 75) return 'NEEDS_ATTENTION';
  return 'READY_FOR_PHASED_CLEANUP';
}

function buildQueueItem(issue = {}) {
  const priority = getPriorityForIssue(issue.issueType, issue.severity);
  const impactScore = calculateImpactScore(issue);
  return {
    questionId: String(issue.questionId || '').trim(),
    subject: String(issue.subject || 'unknown').trim(),
    topic: String(issue.topic || 'unknown').trim(),
    issueType: String(issue.issueType || 'unknown').trim(),
    severity: String(issue.severity || 'Low').trim() || 'Low',
    priority,
    impactScore,
    reason: String(issue.explanation || 'Question quality issue requires cleanup.').trim(),
    suggestedAction: String(issue.suggestion || 'Review and improve the question.').trim(),
    priorityLabel: getPriorityLabel(priority)
  };
}

function buildQueueFromReports(questionRepairReport = {}, questionAuditReport = {}) {
  const repairFindings = ensureArray(questionRepairReport.findings);
  const auditFindings = ensureArray(questionAuditReport.findings);
  const issueLookup = new Map();
  for (const item of repairFindings) {
    if (!item.questionId) continue;
    issueLookup.set(item.questionId, item);
  }

  const mergedIssues = [];
  for (const issue of auditFindings) {
    const match = issueLookup.get(issue.questionId);
    if (match) {
      mergedIssues.push({
        ...match,
        subject: match.subject || issue.subject,
        topic: match.topic || issue.topic,
        severity: match.severity || issue.severity
      });
    }
  }
  if (!mergedIssues.length) {
    mergedIssues.push(...repairFindings);
  }

  const stats = createEmptyQueueStats();
  const queueItems = mergedIssues.map(buildQueueItem).sort((left, right) => {
    if (left.priority !== right.priority) return left.priority.localeCompare(right.priority);
    if (right.impactScore !== left.impactScore) return right.impactScore - left.impactScore;
    return left.questionId.localeCompare(right.questionId);
  });

  stats.top50HighestImpactRepairs = [...queueItems]
    .sort((left, right) => right.impactScore - left.impactScore || left.questionId.localeCompare(right.questionId))
    .slice(0, 50);

  for (const item of queueItems) {
    recordQueueItem(stats, item);
    stats.recommendedCleanupOrder.push(item.questionId);
  }

  return {
    findings: queueItems,
    statistics: finalizeQueueStats(stats, queueItems),
    readiness: getReadinessLabel(stats)
  };
}

export {
  buildQueueFromReports,
  buildQueueItem,
  getReadinessLabel
};

export default {
  buildQueueFromReports,
  buildQueueItem,
  getReadinessLabel
};
