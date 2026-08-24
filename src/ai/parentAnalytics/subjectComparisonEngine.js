import { getAllSubjectAnalytics } from '../adaptive/subjectAnalyticsEngine.js';
import { formatSubjectName, formatTrend } from '../../utils/displayFormatter.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getImprovementScore(subject = {}) {
  const trendWeight = {
    improving: 30,
    stable: 15,
    declining: -10,
    insufficient_data: 0
  }[subject.trend?.direction] ?? 0;
  return trendWeight + toNumber(subject.mastery, 0) * 0.45 + toNumber(subject.confidence, 0) * 0.25 + toNumber(subject.accuracy, 0) * 0.3;
}

function getAttentionScore(subject = {}) {
  const attentionWeight = {
    high: 30,
    medium: 20,
    low: 10,
    none: 0
  }[subject.attentionLevel] ?? 0;
  return attentionWeight + (100 - toNumber(subject.mastery, 0)) * 0.4 + (100 - toNumber(subject.confidence, 0)) * 0.2;
}

function selectDevelopingSubject(subjects = []) {
  return [...subjects].sort((a, b) => {
    const aScore = Math.abs(toNumber(a.mastery, 0) - 60) + Math.abs(toNumber(a.confidence, 0) - 60);
    const bScore = Math.abs(toNumber(b.mastery, 0) - 60) + Math.abs(toNumber(b.confidence, 0) - 60);
    return aScore - bScore || a.subjectId.localeCompare(b.subjectId);
  })[0] || null;
}

export function buildSubjectComparison(profile = {}, context = {}) {
  const analytics = getAllSubjectAnalytics(profile, context);
  const rankedByStrength = [...analytics].sort((a, b) => (
    toNumber(b.mastery, 0) - toNumber(a.mastery, 0) ||
    toNumber(b.confidence, 0) - toNumber(a.confidence, 0) ||
    toNumber(b.accuracy, 0) - toNumber(a.accuracy, 0) ||
    a.subjectId.localeCompare(b.subjectId)
  ));
  const rankedByAttention = [...analytics].sort((a, b) => (
    getAttentionScore(b) - getAttentionScore(a) ||
    toNumber(b.accuracy, 0) - toNumber(a.accuracy, 0) ||
    a.subjectId.localeCompare(b.subjectId)
  ));
  const strongest = rankedByStrength[0] || null;
  const developing = selectDevelopingSubject(analytics) || rankedByStrength[1] || strongest || null;
  const needsAttention = rankedByAttention[0] || null;
  const ranking = [...analytics].sort((a, b) => (
    getImprovementScore(b) - getImprovementScore(a) ||
    toNumber(b.mastery, 0) - toNumber(a.mastery, 0) ||
    a.subjectId.localeCompare(b.subjectId)
  ));

  const summary = analytics.length
    ? `${formatSubjectName(strongest?.subjectId)} paling kukuh, ${formatSubjectName(developing?.subjectId)} masih berkembang dan ${formatSubjectName(needsAttention?.subjectId)} perlu perhatian.`
    : 'Belum cukup data untuk analisis subjek.';

  return {
    strongest,
    developing,
    needsAttention,
    ranking,
    summary,
    hasData: analytics.length > 0,
    cards: [
      strongest && {
        label: 'Subjek Terbaik',
        subjectId: strongest.subjectId,
        title: formatSubjectName(strongest.subjectId),
        value: `${Math.max(0, Math.min(100, Math.round(strongest.mastery || strongest.accuracy || 0)))}%`,
        subtitle: formatTrend(strongest.trend?.direction || 'insufficient_data')
      },
      developing && {
        label: 'Sedang Berkembang',
        subjectId: developing.subjectId,
        title: formatSubjectName(developing.subjectId),
        value: `${Math.max(0, Math.min(100, Math.round(developing.mastery || developing.accuracy || 0)))}%`,
        subtitle: formatTrend(developing.trend?.direction || 'insufficient_data')
      },
      needsAttention && {
        label: 'Perlu Diberi Perhatian',
        subjectId: needsAttention.subjectId,
        title: formatSubjectName(needsAttention.subjectId),
        value: `${Math.max(0, Math.min(100, Math.round(needsAttention.mastery || needsAttention.accuracy || 0)))}%`,
        subtitle: formatTrend(needsAttention.trend?.direction || 'insufficient_data')
      }
    ].filter(Boolean)
  };
}

export default {
  buildSubjectComparison
};
