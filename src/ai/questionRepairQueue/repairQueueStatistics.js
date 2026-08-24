function createEmptyQueueStats() {
  return {
    totalRepairQueueItems: 0,
    itemsByPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
    itemsBySubject: {},
    itemsByIssueType: {},
    top50HighestImpactRepairs: [],
    recommendedCleanupOrder: []
  };
}

function finalizeQueueStats(stats = {}, items = []) {
  return {
    ...stats,
    totalRepairQueueItems: Array.isArray(items) ? items.length : 0,
    top50HighestImpactRepairs: Array.isArray(stats.top50HighestImpactRepairs) ? stats.top50HighestImpactRepairs.slice(0, 50) : [],
    recommendedCleanupOrder: Array.isArray(stats.recommendedCleanupOrder) ? stats.recommendedCleanupOrder : []
  };
}

function recordQueueItem(stats = {}, item = {}) {
  stats.itemsByPriority[item.priority] = (stats.itemsByPriority[item.priority] || 0) + 1;
  stats.itemsBySubject[item.subject] = (stats.itemsBySubject[item.subject] || 0) + 1;
  stats.itemsByIssueType[item.issueType] = (stats.itemsByIssueType[item.issueType] || 0) + 1;
}

export {
  createEmptyQueueStats,
  finalizeQueueStats,
  recordQueueItem
};

export default {
  createEmptyQueueStats,
  finalizeQueueStats,
  recordQueueItem
};
