function createEmptyStats() {
  return {
    totalQuestions: 0,
    averageQualityScore: 0,
    issuesBySubject: {},
    issuesByCategory: {},
    topRepeatedPatterns: [],
    criticalQuestions: [],
    severityCounts: {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0
    }
  };
}

function increment(map, key, amount = 1) {
  const normalized = String(key || 'unknown').trim() || 'unknown';
  map[normalized] = (map[normalized] || 0) + amount;
  return map;
}

function addIssue(stats, issue = {}) {
  const subject = String(issue.subject || issue.subjectId || 'unknown').trim() || 'unknown';
  const category = String(issue.issueType || 'unknown').trim() || 'unknown';
  const severity = String(issue.severity || 'Low');
  stats.totalQuestions += issue.count ? 0 : 1;
  increment(stats.issuesBySubject, subject);
  increment(stats.issuesByCategory, category);
  stats.severityCounts[severity] = (stats.severityCounts[severity] || 0) + 1;
  if (severity === 'Critical') {
    stats.criticalQuestions.push({
      questionId: issue.questionId,
      subject: issue.subject,
      topic: issue.topic,
      issueType: issue.issueType,
      explanation: issue.explanation
    });
  }
}

function finalizeStats(stats = createEmptyStats(), qualityScores = []) {
  const total = Array.isArray(qualityScores) ? qualityScores.length : 0;
  const averageQualityScore = total
    ? Math.round(qualityScores.reduce((sum, value) => sum + Number(value || 0), 0) / total)
    : 0;
  return {
    ...stats,
    averageQualityScore
  };
}

function recordPattern(stats, pattern, count = 1) {
  if (!pattern) return;
  const existing = stats.topRepeatedPatterns.find(item => item.pattern === pattern);
  if (existing) {
    existing.count += count;
    return;
  }
  stats.topRepeatedPatterns.push({ pattern, count });
}

export {
  addIssue,
  createEmptyStats,
  finalizeStats,
  increment,
  recordPattern
};

export default {
  addIssue,
  createEmptyStats,
  finalizeStats,
  increment,
  recordPattern
};
