const TOP_LEVEL_CUMULATIVE_FIELDS = Object.freeze([
  'bestStreak',
  'completedActivities',
  'completedQuestions',
  'completedTopics',
  'attemptedTopics',
  'totalAttempts',
  'totalQuestions',
  'correctQuestions',
  'incorrectQuestions',
  'totalCorrect',
  'totalWrong',
  'studyMinutes',
  'totalStudySeconds'
]);

const PROGRESS_CUMULATIVE_FIELDS = Object.freeze([
  'attempts',
  'correct',
  'wrong',
  'completed',
  'completedCount',
  'best',
  'bestScore',
  'stars'
]);

const PROFILE_COLLECTION_FIELDS = Object.freeze([
  'badges',
  'achievements',
  'history',
  'uasaHistory',
  'dailyRewards',
  'processedEventKeys',
  'processedRewardKeys'
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function identityPart(source = {}, keys = []) {
  for (const key of keys) {
    const value = String(source?.[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function matchesIdentity(source = {}, identity = {}) {
  if (!isObject(source)) return false;
  const expectedAccountId = String(identity.accountId || '').trim();
  const expectedChildId = String(identity.childId || identity.studentId || '').trim();
  const accountId = identityPart(source, ['accountId', 'account_id']);
  const childId = identityPart(source, ['childId', 'studentId', 'child_id', 'student_id']);
  if (expectedAccountId && accountId && accountId !== expectedAccountId) return false;
  if (expectedChildId && childId && childId !== expectedChildId) return false;
  return true;
}

function collectionItemKey(item) {
  if (!isObject(item)) return `${typeof item}:${String(item)}`;
  const explicit = item.id || item.key || item.eventKey || item.sessionId || item.questionId;
  if (explicit) return `id:${String(explicit)}`;
  try {
    return `json:${JSON.stringify(item)}`;
  } catch {
    return '';
  }
}

function mergeCollections(...collections) {
  const merged = [];
  const seen = new Set();
  collections.forEach(collection => {
    (Array.isArray(collection) ? collection : []).forEach(item => {
      const key = collectionItemKey(item);
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
  });
  return merged;
}

function maxNumericField(records = [], field = '') {
  return Math.max(0, ...records.map(record => nonNegativeNumber(record?.[field])));
}

function mergeProgressRecord(current = {}, incoming = {}, { preferIncoming = false } = {}) {
  const left = isObject(current) ? current : {};
  const right = isObject(incoming) ? incoming : {};
  const merged = preferIncoming ? { ...left, ...right } : { ...right, ...left };
  PROGRESS_CUMULATIVE_FIELDS.forEach(field => {
    const leftValue = left[field];
    const rightValue = right[field];
    if (!Number.isFinite(Number(leftValue)) && !Number.isFinite(Number(rightValue))) return;
    merged[field] = Math.max(nonNegativeNumber(leftValue), nonNegativeNumber(rightValue));
  });
  return merged;
}

function mergeProgressMaps(base = {}, sources = [], patch = {}) {
  const merged = { ...(isObject(base) ? base : {}) };
  sources.forEach(source => {
    Object.entries(isObject(source) ? source : {}).forEach(([key, value]) => {
      merged[key] = mergeProgressRecord(merged[key], value);
    });
  });
  Object.entries(isObject(patch) ? patch : {}).forEach(([key, value]) => {
    merged[key] = mergeProgressRecord(merged[key], value, { preferIncoming: true });
  });
  return merged;
}

function mergeDailyMaps(base = {}, sources = [], patch = {}) {
  const merged = { ...(isObject(base) ? base : {}) };
  [...sources, patch].forEach(source => {
    Object.entries(isObject(source) ? source : {}).forEach(([date, value]) => {
      const current = isObject(merged[date]) ? merged[date] : {};
      const incoming = isObject(value) ? value : {};
      merged[date] = {
        ...current,
        ...incoming,
        completed: Boolean(current.completed || incoming.completed),
        xp: Math.max(nonNegativeNumber(current.xp), nonNegativeNumber(incoming.xp)),
        coins: Math.max(nonNegativeNumber(current.coins), nonNegativeNumber(incoming.coins))
      };
    });
  });
  return merged;
}

function mergeLearningMaterials(base = {}, sources = [], patch = {}) {
  const records = [base, ...sources, patch].filter(isObject);
  return records.reduce((merged, record) => ({
    ...merged,
    ...record,
    notes: { ...(merged.notes || {}), ...(record.notes || {}) },
    textbooks: { ...(merged.textbooks || {}), ...(record.textbooks || {}) },
    updatedAt: Date.parse(record.updatedAt || 0) > Date.parse(merged.updatedAt || 0)
      ? record.updatedAt
      : merged.updatedAt || record.updatedAt || ''
  }), { version: 1, notes: {}, textbooks: {}, updatedAt: '' });
}

function collectProfileSources(input = {}) {
  const studentCore = isObject(input.studentCore) ? input.studentCore : {};
  const candidates = [
    input.profile,
    input.adaptiveProfile,
    input.gamificationProfile,
    input.aiMemory,
    studentCore.profile,
    studentCore.core,
    ...(Array.isArray(input.sources) ? input.sources : [])
  ];
  return candidates.filter(source => matchesIdentity(source, input.identity || {}));
}

export function resolveCanonicalRewardBaseline(input = {}) {
  const records = collectProfileSources(input);
  const xp = Math.max(0, ...records.flatMap(record => [
    nonNegativeNumber(record?.xp),
    nonNegativeNumber(record?.totalXp)
  ]));
  const coins = Math.max(0, ...records.flatMap(record => [
    nonNegativeNumber(record?.coins),
    nonNegativeNumber(record?.stars),
    nonNegativeNumber(record?.starCount)
  ]));
  const collections = Object.fromEntries(PROFILE_COLLECTION_FIELDS.map(field => [
    field,
    mergeCollections(...records.map(record => record?.[field]))
  ]));
  const processedRewardKeys = mergeCollections(
    collections.processedRewardKeys,
    collections.processedEventKeys
  ).map(String).filter(Boolean).slice(-500);
  const progress = mergeProgressMaps(input.profile?.progress, records.slice(1).map(record => record?.progress));
  const daily = mergeDailyMaps(input.profile?.daily, records.slice(1).map(record => record?.daily));
  const learningMaterials = mergeLearningMaterials(
    input.profile?.learningMaterials,
    records.slice(1).map(record => record?.learningMaterials)
  );
  const cumulative = Object.fromEntries(TOP_LEVEL_CUMULATIVE_FIELDS.map(field => [field, maxNumericField(records, field)]));

  return {
    xp,
    coins,
    ...cumulative,
    badges: collections.badges,
    achievements: collections.achievements,
    history: collections.history,
    uasaHistory: collections.uasaHistory,
    dailyRewards: collections.dailyRewards,
    processedEventKeys: collections.processedEventKeys.map(String).filter(Boolean).slice(-500),
    processedRewardKeys,
    progress,
    daily,
    learningMaterials
  };
}

export function reconcileCumulativeLearnerProfile(input = {}) {
  const profile = isObject(input.profile) ? input.profile : {};
  const baseline = resolveCanonicalRewardBaseline(input);
  const next = {
    ...profile,
    xp: Math.max(nonNegativeNumber(profile.xp), baseline.xp),
    coins: Math.max(nonNegativeNumber(profile.coins), baseline.coins),
    badges: mergeCollections(profile.badges, baseline.badges),
    achievements: mergeCollections(profile.achievements, baseline.achievements),
    history: mergeCollections(profile.history, baseline.history).slice(0, 50),
    uasaHistory: mergeCollections(profile.uasaHistory, baseline.uasaHistory).slice(0, 20),
    dailyRewards: mergeCollections(profile.dailyRewards, baseline.dailyRewards),
    processedEventKeys: mergeCollections(profile.processedEventKeys, baseline.processedEventKeys).map(String).slice(-500),
    processedRewardKeys: mergeCollections(profile.processedRewardKeys, baseline.processedRewardKeys).map(String).slice(-500),
    progress: mergeProgressMaps(profile.progress, [baseline.progress]),
    daily: mergeDailyMaps(profile.daily, [baseline.daily]),
    learningMaterials: mergeLearningMaterials(profile.learningMaterials, [baseline.learningMaterials])
  };
  TOP_LEVEL_CUMULATIVE_FIELDS.forEach(field => {
    const current = profile[field];
    const canonical = baseline[field];
    if (!Number.isFinite(Number(current)) && canonical <= 0) return;
    next[field] = Math.max(nonNegativeNumber(current), canonical);
  });
  return next;
}

export function applyCanonicalLearnerReward(input = {}, reward = {}) {
  const baseline = resolveCanonicalRewardBaseline(input);
  const reconciled = reconcileCumulativeLearnerProfile(input);
  const eventKey = String(reward.eventKey || '').trim();
  const processedRewardKeys = new Set(baseline.processedRewardKeys);
  const alreadyCredited = Boolean(eventKey && processedRewardKeys.has(eventKey));
  const patch = isObject(reward.patch) ? reward.patch : {};
  const patched = {
    ...reconciled,
    ...patch,
    badges: mergeCollections(reconciled.badges, patch.badges),
    achievements: mergeCollections(reconciled.achievements, patch.achievements),
    history: mergeCollections(patch.history, reconciled.history).slice(0, 50),
    uasaHistory: mergeCollections(patch.uasaHistory, reconciled.uasaHistory).slice(0, 20),
    dailyRewards: mergeCollections(reconciled.dailyRewards, patch.dailyRewards),
    progress: mergeProgressMaps(reconciled.progress, [], patch.progress),
    daily: mergeDailyMaps(reconciled.daily, [], patch.daily),
    learningMaterials: mergeLearningMaterials(reconciled.learningMaterials, [], patch.learningMaterials)
  };

  if (!alreadyCredited && eventKey) processedRewardKeys.add(eventKey);
  patched.processedRewardKeys = [...processedRewardKeys].slice(-500);
  patched.xp = alreadyCredited ? baseline.xp : baseline.xp + nonNegativeNumber(reward.xp);
  patched.coins = alreadyCredited ? baseline.coins : baseline.coins + nonNegativeNumber(reward.coins);

  return {
    activityType: String(reward.activityType || 'activity'),
    eventKey,
    credited: !alreadyCredited,
    baseline,
    profile: patched
  };
}

export default {
  applyCanonicalLearnerReward,
  reconcileCumulativeLearnerProfile,
  resolveCanonicalRewardBaseline
};
