import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';
import { getStudentStrengthSummary } from './studentStrengthEngine.js';
import { getStudentWeaknessSummary } from './studentWeaknessEngine.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sortByScoreDesc(rows = []) {
  return [...rows].sort((a, b) => b.score - a.score || (a.topicId || '').localeCompare(b.topicId || ''));
}

function sortByScoreAsc(rows = []) {
  return [...rows].sort((a, b) => a.score - b.score || (a.topicId || '').localeCompare(b.topicId || ''));
}

function localDayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function buildTopicRows(profile = {}, memory = {}) {
  const rows = [];
  const subjectTopics = profile.topics && typeof profile.topics === 'object' ? profile.topics : {};

  Object.entries(subjectTopics).forEach(([subjectId, topics]) => {
    Object.entries(topics || {}).forEach(([topicId, topic]) => {
      const memoryTopic = memory.topics?.[subjectId]?.[topicId] || {};
      const dailyMistakes = memory.mistakes?.[subjectId]?.[topicId] || {};
      const mastery = toNumber(topic.mastery, toNumber(memoryTopic.masterySnapshot, 0));
      const confidence = toNumber(topic.confidence, toNumber(memoryTopic.confidenceSnapshot, 0));
      const total = toNumber(topic.total, 0);
      const correct = toNumber(topic.correct, 0);
      const wrong = toNumber(topic.wrong, 0);
      const reviewCount = toNumber(memoryTopic.reviewCount, 0);
      const wrongCount = Math.max(wrong, toNumber(memoryTopic.wrongCount, 0), toNumber(dailyMistakes.totalMistakes, 0));
      const lastPlayed = topic.lastPlayed || memoryTopic.lastAnsweredAt || null;
      const recencyDays = lastPlayed
        ? Math.max(0, Math.min(30, Math.round((Date.now() - new Date(lastPlayed).getTime()) / 86400000)))
        : 30;
      const consistency = total > 0 ? Math.round((correct / Math.max(1, total)) * 100) : 0;
      const score = Math.max(0, Math.round(
        (100 - mastery) * 0.35 +
        (100 - confidence) * 0.2 +
        wrongCount * 6 +
        reviewCount * 2 +
        recencyDays * 1.2 -
        consistency * 0.1
      ));

      rows.push({
        subjectId,
        topicId,
        title: topic.title || formatTopicName(topicId),
        mastery,
        confidence,
        total,
        correct,
        wrong,
        wrongCount,
        reviewCount,
        lastPlayed,
        score,
        consistency,
        subjectName: formatSubjectName(subjectId)
      });
    });
  });

  return rows;
}

function getTrendLabel(value) {
  if (value > 8) return 'semakin baik';
  if (value < -8) return 'menurun';
  return 'stabil';
}

function buildMission(topics = []) {
  const rows = sortByScoreDesc(topics);
  const first = rows[0] || null;
  const second = rows[1] || null;
  const mission = [];

  const bmCount = rows.filter(item => item.subjectId === 'bm').length;
  const mathCount = rows.filter(item => item.subjectId === 'math').length;

  if (bmCount) {
    mission.push(`10 soalan BM`);
  } else if (first) {
    mission.push(`10 soalan ${first.subjectName}`);
  }

  if (mathCount) {
    mission.push('5 soalan Matematik');
  } else if (second && second.subjectId !== first?.subjectId) {
    mission.push(`5 soalan ${second.subjectName}`);
  }

  mission.push('Ketepatan >80%');
  if (first) {
    mission.push(`Ulang ${first.title}`);
  }

  return mission;
}

function buildMemorySpeech(profile = {}, memory = {}, insight = {}) {
  const today = localDayKey(profile.lastStudyDate || profile.lastAnsweredAt || new Date());
  const lastSnapshot = (memory.dailySnapshots || []).find(item => item?.date === today) || (memory.dailySnapshots || [])[0] || null;
  const strongest = insight.strongestTopic;
  const weakness = insight.weakestTopic;

  if (lastSnapshot && strongest?.title) {
    return `Semalam kamu berjaya menguasai ${strongest.title}.`;
  }
  if (weakness?.title) {
    return `Minggu ini kamu masih perlu perhatian pada ${weakness.title}.`;
  }
  return 'Saya nampak kemajuan kamu.';
}

function buildRiskLevel(insight = {}) {
  const weak = insight.weakestTopic;
  const strong = insight.strongestTopic;
  const confidence = toNumber(insight.confidence, 0);
  const consistency = toNumber(insight.studyConsistency, 0);
  const recurringMistake = Boolean(weak?.recurringMistake);

  if (recurringMistake || confidence < 40 || consistency < 35) return 'HIGH';
  if ((weak?.wrongCount || 0) >= 2 || confidence < 65 || consistency < 60) return 'MEDIUM';
  if ((strong?.mastery || 0) >= 80 && confidence >= 70) return 'LOW';
  return 'MEDIUM';
}

export function buildLearningInsight(profile = {}, memory = {}) {
  const rows = buildTopicRows(profile, memory);
  const sortedDesc = sortByScoreDesc(rows);
  const sortedAsc = sortByScoreAsc(rows);
  const strongestTopic = sortedDesc[0] ? getStudentStrengthSummary(sortedDesc[0], { improvement: sortedDesc[1] ? sortedDesc[0].mastery - sortedDesc[1].mastery : 0 }) : null;
  const weakestTopic = sortedAsc[0] ? getStudentWeaknessSummary(sortedAsc[0]) : null;
  const improvingTopic = sortedDesc.find(row => row.lastPlayed && row.mastery >= 60 && row.confidence >= 50) || null;
  const decliningTopic = sortedAsc.find(row => row.wrongCount >= 2 || row.confidence < 50) || null;
  const confidence = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) : 0;
  const studyConsistency = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.consistency, 0) / rows.length)
    : 0;
  const learningTrend = confidence >= 75 && studyConsistency >= 70
    ? 'semakin baik'
    : confidence >= 55 || studyConsistency >= 55
      ? 'stabil'
      : 'perlu perhatian';

  return {
    strongestTopic,
    weakestTopic,
    improvingTopic: improvingTopic ? {
      subjectId: improvingTopic.subjectId,
      topicId: improvingTopic.topicId,
      title: improvingTopic.title,
      subjectName: improvingTopic.subjectName,
      mastery: improvingTopic.mastery,
      confidence: improvingTopic.confidence
    } : null,
    decliningTopic: decliningTopic ? {
      subjectId: decliningTopic.subjectId,
      topicId: decliningTopic.topicId,
      title: decliningTopic.title,
      subjectName: decliningTopic.subjectName,
      mastery: decliningTopic.mastery,
      confidence: decliningTopic.confidence
    } : null,
    confidence,
    studyConsistency,
    learningTrend
  };
}

export function buildLearningObservation(profile = {}, memory = {}, options = {}) {
  const insight = buildLearningInsight(profile, memory);
  const strongest = insight.strongestTopic;
  const weakest = insight.weakestTopic;
  const topRows = buildTopicRows(profile, memory);
  const risk = buildRiskLevel(insight);
  const mission = buildMission(topRows);
  const recommendation = weakest?.topicId
    ? `Ulang ${weakest.title}.`
    : strongest?.topicId
      ? `Teruskan ${strongest.title}.`
      : 'Teruskan BM.';

  return {
    generatedAt: new Date().toISOString(),
    strongestTopic: strongest,
    weakestTopic: weakest,
    improvingTopic: insight.improvingTopic,
    decliningTopic: insight.decliningTopic,
    confidence: insight.confidence,
    studyConsistency: insight.studyConsistency,
    learningTrend: insight.learningTrend,
    riskLevel: risk,
    dailyMission: {
      title: 'Hari Ini',
      items: mission.length ? mission : ['10 soalan BM', 'Ketepatan >80%', 'Ulang topik lemah']
    },
    memorySpeech: buildMemorySpeech(profile, memory, insight),
    recommendation,
    nextAction: weakest?.topicId ? `Latih ${weakest.title}` : `Teruskan ${strongest?.title || 'BM'}`,
    summary: {
      strongestTopic: strongest?.title || 'Belum cukup data',
      weakestTopic: weakest?.title || 'Belum cukup data',
      learningTrend: insight.learningTrend,
      confidence: insight.confidence,
      studyConsistency: insight.studyConsistency,
      riskLevel: risk
    }
  };
}

export default {
  buildLearningInsight,
  buildLearningObservation
};
