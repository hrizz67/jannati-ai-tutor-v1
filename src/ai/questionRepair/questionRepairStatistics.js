function createEmptyRepairStats() {
  return {
    totalRepairSuggestions: 0,
    suggestionsBySubject: {},
    suggestionsByIssueType: {},
    repairPriorityCounts: { P1: 0, P2: 0, P3: 0 },
    p1RepairList: [],
    topRecurringProblems: [],
    estimatedCleanupPriority: 'LOW'
  };
}

function finalizeRepairStats(stats = {}, suggestions = []) {
  const totalRepairSuggestions = Array.isArray(suggestions) ? suggestions.length : 0;
  const priorityCounts = stats.repairPriorityCounts || { P1: 0, P2: 0, P3: 0 };
  const p1Count = priorityCounts.P1 || 0;
  const p2Count = priorityCounts.P2 || 0;
  const estimatedCleanupPriority = p1Count > 50 ? 'HIGH' : p1Count > 10 || p2Count > 50 ? 'MEDIUM' : 'LOW';
  return {
    ...stats,
    totalRepairSuggestions,
    repairPriorityCounts: priorityCounts,
    estimatedCleanupPriority
  };
}

function recordRecurringProblem(map, repair = {}) {
  const key = `${repair.subject || 'unknown'}::${repair.issueType || 'unknown'}::${repair.priority || 'P3'}`;
  const entry = map.get(key) || {
    subject: repair.subject || 'unknown',
    issueType: repair.issueType || 'unknown',
    priority: repair.priority || 'P3',
    count: 0
  };
  entry.count += 1;
  map.set(key, entry);
}

export {
  createEmptyRepairStats,
  finalizeRepairStats,
  recordRecurringProblem
};

export default {
  createEmptyRepairStats,
  finalizeRepairStats,
  recordRecurringProblem
};
