import { createCanonicalProgress } from './canonicalProgress.js';

const clamp = value => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));
const num = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const getAttemptCount = record => num(record?.attempts ?? record?.total ?? record?.totalQuestions);
const getMasteryScore = record => clamp(record?.mastery ?? record?.masteryScore ?? record?.confidence ?? 0);

function getScopedTopics(progress = {}, selectedId = null) {
  if (selectedId) {
    const topicMastery = progress.subjects?.[selectedId]?.topicMastery;
    return Object.entries(topicMastery && typeof topicMastery === 'object' ? topicMastery : {}).map(([topicId, record]) => ({
      subjectId: selectedId,
      topicId,
      ...record,
      mastery: getMasteryScore(record)
    }));
  }

  return Object.entries(progress.subjects || {}).flatMap(([subjectId, subjectRecord]) => {
    const topicMastery = subjectRecord?.topicMastery;
    return Object.entries(topicMastery && typeof topicMastery === 'object' ? topicMastery : {}).map(([topicId, record]) => ({
      subjectId,
      topicId,
      ...record,
      mastery: getMasteryScore(record)
    }));
  });
}

function getScopedLatestActivity(progress = {}, selectedId = null) {
  const activities = Array.isArray(progress.activities) ? progress.activities : [];
  const filtered = selectedId
    ? activities.filter(item => item?.subject === selectedId || item?.subjectId === selectedId)
    : activities;
  return filtered.length ? filtered[filtered.length - 1] : null;
}

function getScopeLabel(selectedSubject, selectedId) {
  if (!selectedId) return 'Keseluruhan';
  return `Subjek dipilih: ${selectedSubject?.title || selectedId}`;
}

export function deriveAnalyticsStatus(analytics = {}) {
  if (!analytics.hasEvidence) return 'Belum Bermula';
  // Thresholds:
  // <40 mastery/accuracy = needs support, 75+ = nearly mastered, 90+ = mastered.
  if (analytics.accuracy < 40 || analytics.masteryPercent < 40) return analytics.totalQuestions >= 3 ? 'Perlu Sokongan' : 'Sedang Membina Asas';
  if (analytics.masteryPercent >= 90) return 'Dikuasai';
  if (analytics.masteryPercent >= 75) return 'Hampir Menguasai';
  return 'Berkembang Baik';
}

export function getCanonicalAnalytics(input = {}) {
  const progress = input.canonicalProgress || createCanonicalProgress({
    ...(input.profile || {}),
    ...(input.adaptiveProfile || {}),
    history: input.profile?.history || input.adaptiveProfile?.events || [],
    subjects: input.adaptiveProfile?.subjects || input.profile?.subjects,
    topics: input.adaptiveProfile?.topics || input.profile?.topics
  });
  const selectedId = input.subjectId || input.selectedSubject?.id || null;
  const scope = selectedId ? 'subject' : 'overall';
  const subject = selectedId ? progress.subjects?.[selectedId] || {} : progress.global || {};
  const topics = getScopedTopics(progress, selectedId);
  const totalQuestions = num(subject.attempts ?? subject.totalAttempts ?? progress.global?.totalAttempts);
  const correctQuestions = num(subject.correct ?? subject.correctQuestions ?? progress.global?.totalCorrect);
  const accuracy = totalQuestions ? clamp((correctQuestions / totalQuestions) * 100) : 0;
  const hasEvidence = totalQuestions > 0 || topics.some(topic => getAttemptCount(topic) > 0);
  const masteredTopics = topics.filter(topic => topic.mastery >= 85);
  const weakTopics = topics.filter(topic => topic.mastery < 60 && getAttemptCount(topic) > 0);
  const learningTopics = topics.filter(topic => topic.mastery >= 60 && topic.mastery < 85);
  const strongTopics = masteredTopics;
  const latest = getScopedLatestActivity(progress, selectedId);
  const currentStreak = num(progress.global?.streakCurrent);
  const bestStreak = Math.max(currentStreak, num(progress.global?.streakBest));
  const masteryPercent = topics.length ? clamp(topics.reduce((sum, topic) => sum + topic.mastery, 0) / topics.length) : (hasEvidence ? accuracy : 0);
  const output = {
    scope,
    scopeLabel: getScopeLabel(input.selectedSubject, selectedId),
    subjectId: selectedId,
    subjectTitle: input.selectedSubject?.title || selectedId || 'Semua subjek',
    hasEvidence,
    totalQuestions, correctQuestions, accuracy: Math.round(accuracy), masteryPercent: Math.round(masteryPercent),
    masteredTopics, learningTopics, weakTopics, strongTopics, availableTopics: topics,
    currentStreak, bestStreak, studyMinutes: Math.round(num(subject.studySeconds ?? progress.global?.totalStudySeconds) / 60),
    latestScore: latest ? num(latest.score ?? latest.percent) : null, latestTopic: latest?.topicId || null,
    confidence: hasEvidence ? Math.round(accuracy) : null,
    latestActivityAt: latest?.date || latest?.timestamp || null,
    noData: hasEvidence ? null : getAnalyticsNoData(selectedId ? 'subject-not-started' : 'no-attempts')
  };
  return { ...output, status: deriveAnalyticsStatus(output) };
}

export function getAnalyticsNoData(reason = 'no-attempts') {
  const copy = {
    'no-attempts': ['Belum ada data pembelajaran', 'Mulakan satu latihan untuk melihat ringkasan kemajuan.'],
    'insufficient-evidence': ['Data masih dikumpulkan', 'Lengkapkan beberapa latihan untuk cadangan yang lebih tepat.'],
    'subject-not-started': ['Subjek belum bermula', 'Pilih topik untuk mula membina penguasaan.'],
    'metadata-unavailable': ['Data belum tersedia', 'Cuba semula selepas latihan disimpan.']
  }[reason] || ['Belum ada data pembelajaran', 'Mulakan latihan untuk melihat kemajuan.'];
  return { reason, title: copy[0], message: copy[1], actionLabel: 'Mulakan latihan' };
}
