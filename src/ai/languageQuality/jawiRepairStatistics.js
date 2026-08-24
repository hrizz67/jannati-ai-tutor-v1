function createEmptyJawiRepairStats() {
  return {
    totalQuestionsChecked: 0,
    repairedQuestionsCount: 0,
    ambiguousQuestionsCount: 0,
    issuesByCategory: {},
    issuesByTopic: {},
    highestImpactFixes: [],
    recommendedCleanupOrder: [],
    beforeAfterExamples: []
  };
}

function finalizeJawiRepairStats(stats = {}, findings = []) {
  return {
    ...stats,
    totalFindings: Array.isArray(findings) ? findings.length : 0,
    repairedQuestionsCount: Number(stats.repairedQuestionsCount || 0),
    highestImpactFixes: Array.isArray(stats.highestImpactFixes) ? stats.highestImpactFixes.slice(0, 50) : [],
    recommendedCleanupOrder: Array.isArray(stats.recommendedCleanupOrder) ? stats.recommendedCleanupOrder : [],
    beforeAfterExamples: Array.isArray(stats.beforeAfterExamples) ? stats.beforeAfterExamples.slice(0, 10) : []
  };
}

function recordJawiIssue(stats = {}, item = {}) {
  stats.issuesByCategory[item.issueType] = (stats.issuesByCategory[item.issueType] || 0) + 1;
  const topicKey = `${item.subject} / ${item.topic}`;
  stats.issuesByTopic[topicKey] = (stats.issuesByTopic[topicKey] || 0) + 1;
}

export {
  createEmptyJawiRepairStats,
  finalizeJawiRepairStats,
  recordJawiIssue
};

export default {
  createEmptyJawiRepairStats,
  finalizeJawiRepairStats,
  recordJawiIssue
};
