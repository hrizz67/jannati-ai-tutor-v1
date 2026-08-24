import {
    hasBorrow,
    hasCarry,
    patternGroup,
    pairSignature,
    equationSignature
} from "./numberPatterns.js";

function percent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function equationKey(operation, values = []) {
  const normalizedOperation = String(operation || 'add').toLowerCase();
  const first = Number(values[0] ?? 0);
  const second = Number(values[1] ?? 0);
  return `${normalizedOperation}:${first}:${second}`;
}

export function calculateNumberAnalytics(questions = []) {
  const entries = questions
    .map((question) => question.qip?.numberEngine)
    .filter(Boolean);

  if (!entries.length) {
    return {
      numberDiversity: 0,
      patternDiversity: 0,
      rangeCoverage: 0,
      overallNumberScore: 0,
      bucketCoverage: 0,
      candidateScoreDistribution: {},
      memoryDecayEffectiveness: 0,
      explorationRate: 0
    };
  }

  const pairs = entries.map((entry) => `${entry.selectedNumbers?.[0] ?? 0}|${entry.selectedNumbers?.[1] ?? 0}`);
  const uniquePairs = new Set(pairs);
  const patterns = entries.map((entry) => entry.patternGroup || 'general');
  const uniquePatterns = new Set(patterns);
  const values = entries.flatMap((entry) => entry.selectedNumbers || []);
  const maxSeen = Math.max(...values, 0);
  const minSeen = Math.min(...values, 0);
  const span = Math.max(1, maxSeen - minSeen + 1);
  const rangeCoverage = percent((span / 100) * 100);

  const bucketCoverage = entries.some((entry) => entry.bucketLabel)
    ? new Set(entries.map((entry) => entry.bucketLabel).filter(Boolean)).size / 5
    : 0;

  const scoreDistribution = {};
  for (const entry of entries) {
    const bucket = Math.max(0, Math.min(10, Math.floor((entry.score || 0) / 5)));
    scoreDistribution[bucket] = (scoreDistribution[bucket] || 0) + 1;
  }

  const memoryDecayEffectiveness = entries.some((entry) => Number.isFinite(entry.memoryDecayPenalty))
    ? percent((1 - (entries.reduce((sum, entry) => sum + (entry.memoryDecayPenalty || 0), 0) / Math.max(1, entries.length * 6))) * 100)
    : 100;

  const explorationRate = percent((entries.filter((entry) => entry.explorationUsed).length / entries.length) * 100);

  const numberDiversity = percent((uniquePairs.size / entries.length) * 100);
  const patternDiversity = percent((uniquePatterns.size / Math.max(1, Math.min(12, entries.length))) * 100);

  const overallNumberScore = percent(
    (numberDiversity * 0.35) +
    (patternDiversity * 0.25) +
    (rangeCoverage * 0.2) +
    (bucketCoverage * 100 * 0.1) +
    (memoryDecayEffectiveness * 0.1)
  );

  return {
    numberDiversity,
    patternDiversity,
    rangeCoverage,
    overallNumberScore,
    bucketCoverage: percent(bucketCoverage * 100),
    candidateScoreDistribution: scoreDistribution,
    memoryDecayEffectiveness,
    explorationRate
  };
}

export function createNumberAnalytics() {
  return {
    entries: [],
    counters: {
      pairs: new Map(),
      patterns: new Map(),
      carry: 0,
      borrow: 0
    },
    recentPatternGroups: [],
    bucketUsage: new Map(),
    scoreDistribution: new Map(),
    explorationCount: 0,
    decayPenaltyTotal: 0
  };
}

export function recordSelection(analytics = {}, selection = {}) {
  const entry = {
    operation: selection.operation || 'add',
    values: Array.isArray(selection.values) ? selection.values : [],
    answer: selection.answer,
    patternGroup: selection.patternGroup || 'general',
    profileId: selection.profileId || null,
    difficultyProfile: selection.difficultyProfile || 'easy',
    reuseCount: Number(selection.reuseCount || 0),
    carry: Boolean(selection.carry),
    borrow: Boolean(selection.borrow),
    score: Number(selection.score || 0),
    bucketLabel: selection.bucketLabel || null,
    candidateCount: Number(selection.candidateCount || 0),
    explorationUsed: Boolean(selection.explorationUsed),
    memoryDecayPenalty: Number(selection.memoryDecayPenalty || 0),
    createdAt: Date.now()
  };

  entry.equationKey = equationKey(entry.operation, entry.values);

  analytics.entries = analytics.entries || [];
  analytics.entries.push(entry);

  if (analytics.entries.length > 5000) {
    analytics.entries.shift();
  }

  const counters = analytics.counters || {};
  const pairCounter = counters.pairs || new Map();
  const patternCounter = counters.patterns || new Map();

  const pairKey = `${entry.values[0]}|${entry.values[1]}`;
  pairCounter.set(pairKey, (pairCounter.get(pairKey) || 0) + 1);

  patternCounter.set(entry.patternGroup, (patternCounter.get(entry.patternGroup) || 0) + 1);

  if (entry.carry) counters.carry = (counters.carry || 0) + 1;
  if (entry.borrow) counters.borrow = (counters.borrow || 0) + 1;

  analytics.counters = {
    pairs: pairCounter,
    patterns: patternCounter,
    carry: counters.carry || 0,
    borrow: counters.borrow || 0
  };

  if (entry.bucketLabel) {
    analytics.bucketUsage = analytics.bucketUsage || new Map();
    analytics.bucketUsage.set(entry.bucketLabel, (analytics.bucketUsage.get(entry.bucketLabel) || 0) + 1);
  }

  if (typeof entry.score === 'number') {
    const scoreBucket = Math.max(0, Math.min(10, Math.floor(entry.score / 5)));
    analytics.scoreDistribution = analytics.scoreDistribution || new Map();
    analytics.scoreDistribution.set(scoreBucket, (analytics.scoreDistribution.get(scoreBucket) || 0) + 1);
  }

  if (entry.explorationUsed) {
    analytics.explorationCount = (analytics.explorationCount || 0) + 1;
  }

  analytics.decayPenaltyTotal = (analytics.decayPenaltyTotal || 0) + entry.memoryDecayPenalty;

  analytics.recentPatternGroups = [...(analytics.recentPatternGroups || []), entry.patternGroup].slice(-8);

  return entry;
}

function deriveRangeCoverage(entries = []) {
  const values = entries.flatMap((entry) => entry.values || []);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const span = Math.max(1, maxValue - minValue + 1);

  if (span <= 20) return 1;
  if (span <= 50) return 0.75;
  if (span <= 100) return 0.5;
  return 0.25;
}

export function summarizeNumberAnalytics(analytics = {}) {
  const entries = analytics.entries || [];
  const total = entries.length || 1;

  const uniquePairs = new Set(entries.map((entry) => `${entry.values[0]}|${entry.values[1]}`));
  const uniqueEquationKeys = new Set(entries.map((entry) => entry.equationKey || equationKey(entry.operation, entry.values)));
  const uniquePatternGroups = new Set(entries.map((entry) => entry.patternGroup));

  const carryCount = entries.filter((entry) => entry.carry).length;
  const borrowCount = entries.filter((entry) => entry.borrow).length;
  const totalCarryBorrow = carryCount + borrowCount || 1;

  const numberDiversity = uniquePairs.size / total;
  const patternDiversity = uniqueEquationKeys.size / total;
  const carryBorrowBalance = totalCarryBorrow > 0 ? 1 - Math.abs(carryCount - borrowCount) / totalCarryBorrow : 1;
  const rangeCoverage = deriveRangeCoverage(entries);
  const reuseRate = entries.filter((entry) => entry.reuseCount > 0).length / total;

  const bucketCoverageValue = analytics.bucketUsage
    ? (analytics.bucketUsage.size / Math.max(1, 5))
    : 0;

  const scoreDistributionObject = {};
  for (const [key, value] of (analytics.scoreDistribution || new Map()).entries()) {
    scoreDistributionObject[key] = value;
  }

  const memoryDecayEffectiveness = total > 0
    ? Math.max(0, 1 - Math.min(1, (analytics.decayPenaltyTotal || 0) / Math.max(1, total * 6)))
    : 1;

  const explorationRate = total > 0 ? (analytics.explorationCount || 0) / total : 0;

  const overallNumberScore = Math.max(0, Math.min(100, Math.round(
    ((numberDiversity * 100) * 0.35) +
    ((patternDiversity * 100) * 0.25) +
    ((rangeCoverage * 100) * 0.2) +
    (bucketCoverageValue * 100 * 0.1) +
    (memoryDecayEffectiveness * 100 * 0.1)
  )));

  return {
    numberDiversity,
    patternDiversity,
    patternReuse: 1 - patternDiversity,
    carryBorrowBalance,
    rangeCoverage,
    reuseRate,
    overallNumberScore,
    bucketCoverage: bucketCoverageValue,
    candidateScoreDistribution: scoreDistributionObject,
    memoryDecayEffectiveness,
    explorationRate,
    uniqueEquationCount: uniqueEquationKeys.size,
    uniquePairCount: uniquePairs.size,
    uniquePatternCount: uniquePatternGroups.size
  };
}
