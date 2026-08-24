function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function groupBy(items = [], keyFn = () => '') {
  const map = new Map();
  items.forEach(item => {
    const key = keyFn(item);
    if (!key) return;
    const bucket = map.get(key) || [];
    bucket.push(item);
    map.set(key, bucket);
  });
  return map;
}

function buildGroupSummary(key, items = []) {
  const sample = items[0] || {};
  return {
    key,
    count: items.length,
    subject: sample.subject || sample.subjectId || '',
    topic: sample.topic || sample.topicId || '',
    mistakeType: sample.mistakeType || sample.detectedPattern || '',
    teacherSuggestion: sample.teacherSuggestion || '',
    recommendedPractice: sample.recommendedPractice || '',
    latestTimestamp: items.reduce((latest, item) => {
      if (!latest) return item.timestamp || '';
      return String(item.timestamp || '') > String(latest) ? item.timestamp || latest : latest;
    }, ''),
    recentItems: items.slice(-3)
  };
}

function computeImprovementTrend(records = []) {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 7 * 86400000);
  const previousStart = new Date(now.getTime() - 14 * 86400000);
  const currentCount = records.filter(item => {
    const date = safeDate(item.timestamp);
    return date && date >= currentStart;
  }).length;
  const previousCount = records.filter(item => {
    const date = safeDate(item.timestamp);
    return date && date < currentStart && date >= previousStart;
  }).length;
  if (previousCount === 0) {
    return currentCount === 0 ? 0 : -100;
  }
  return Math.round(((previousCount - currentCount) / Math.max(1, previousCount)) * 100);
}

export function buildMistakeStatistics(records = []) {
  const rows = (Array.isArray(records) ? records : [records]).filter(Boolean).map(row => clone(row));
  const total = rows.length;
  const uniqueKeys = new Set(rows.map(row => row.mistakeId || `${row.subject || row.subjectId}:${row.topic || row.topicId}:${row.mistakeType || row.detectedPattern}`));
  const repeatedMistakeCount = Math.max(0, total - uniqueKeys.size);
  const byType = [...groupBy(rows, item => item.mistakeType || item.detectedPattern).entries()]
    .map(([key, items]) => buildGroupSummary(key, items))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const bySubject = [...groupBy(rows, item => item.subject || item.subjectId).entries()]
    .map(([key, items]) => buildGroupSummary(key, items))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const byTopic = [...groupBy(rows, item => `${item.subject || item.subjectId}:${item.topic || item.topicId}`).entries()]
    .map(([key, items]) => buildGroupSummary(key, items))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const recentMistakes = rows.slice().sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || ''))).slice(0, 20);
  const weeklyMistakes = rows.filter(item => {
    const date = safeDate(item.timestamp);
    return date && date >= new Date(Date.now() - 7 * 86400000);
  });
  const monthlyMistakes = rows.filter(item => {
    const date = safeDate(item.timestamp);
    return date && date >= new Date(Date.now() - 30 * 86400000);
  });
  const topMistakes = byType.slice(0, 10);
  const improvementTrend = computeImprovementTrend(rows);

  return {
    total,
    repeatedMistakes: repeatedMistakeCount,
    uniqueMistakeTypes: uniqueKeys.size,
    topMistakes,
    recentMistakes,
    weeklyMistakes,
    monthlyMistakes,
    byType,
    bySubject,
    byTopic,
    improvementTrend,
    generatedAt: new Date().toISOString()
  };
}

export function buildMistakeReport(records = []) {
  const stats = buildMistakeStatistics(records);
  return {
    ...stats,
    weeklyMistakes: stats.weeklyMistakes.slice(-10),
    monthlyMistakes: stats.monthlyMistakes.slice(-10),
    top10: stats.topMistakes.slice(0, 10)
  };
}

export function summarizeMistakeImprovement(records = []) {
  const stats = buildMistakeStatistics(records);
  return {
    improvementTrend: stats.improvementTrend,
    repeatedMistakes: stats.repeatedMistakes,
    total: stats.total
  };
}

export function bucketMistakeByDay(records = []) {
  const rows = Array.isArray(records) ? records : [records];
  const map = new Map();
  rows.forEach(row => {
    const date = safeDate(row?.timestamp);
    const key = dayKey(date || new Date());
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(row);
  });
  return map;
}

export default {
  buildMistakeStatistics,
  buildMistakeReport,
  summarizeMistakeImprovement,
  bucketMistakeByDay
};
