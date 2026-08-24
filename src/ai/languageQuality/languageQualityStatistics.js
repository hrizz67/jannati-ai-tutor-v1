function createEmptyLanguageQualityStats() {
  return {
    totalArabicQuestionsChecked: 0,
    totalJawiQuestionsChecked: 0,
    issuesByCategory: {},
    issuesByTopic: {},
    highestImpactFixes: [],
    recommendedCleanupOrder: []
  };
}

function finalizeLanguageQualityStats(stats = {}, findings = []) {
  return {
    ...stats,
    totalIssues: Array.isArray(findings) ? findings.length : 0,
    highestImpactFixes: Array.isArray(stats.highestImpactFixes) ? stats.highestImpactFixes.slice(0, 50) : [],
    recommendedCleanupOrder: Array.isArray(stats.recommendedCleanupOrder) ? stats.recommendedCleanupOrder : []
  };
}

function recordLanguageIssue(stats = {}, item = {}) {
  stats.issuesByCategory[item.issueType] = (stats.issuesByCategory[item.issueType] || 0) + 1;
  const topicKey = `${item.subject} / ${item.topic}`;
  stats.issuesByTopic[topicKey] = (stats.issuesByTopic[topicKey] || 0) + 1;
}

export {
  createEmptyLanguageQualityStats,
  finalizeLanguageQualityStats,
  recordLanguageIssue
};

export default {
  createEmptyLanguageQualityStats,
  finalizeLanguageQualityStats,
  recordLanguageIssue
};
