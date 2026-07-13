import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function normalizeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function pushItem(items, item) {
  if (!item || !item.date) return;
  items.push({
    ...item,
    date: normalizeDate(item.date)
  });
}

export function buildLearningTimeline(profile = {}, context = {}) {
  const memory = context.memory || {};
  const gamification = context.gamificationProfile || {};
  const observation = context.observation || {};
  const items = [];

  (Array.isArray(profile.learningHistory) ? profile.learningHistory : []).forEach(entry => {
    pushItem(items, {
      type: 'session',
      date: entry.answeredAt || entry.date || entry.createdAt || entry.updatedAt,
      title: formatSubjectName(entry.subjectId || entry.subject),
      subtitle: formatTopicName(entry.topicId || entry.topic || entry.title || ''),
      message: Number.isFinite(Number(entry.percent)) ? `${Math.max(0, Math.min(100, Math.round(Number(entry.percent))))}%` : 'Rekod pembelajaran'
    });
  });

  (Array.isArray(profile.sessionHistory) ? profile.sessionHistory : []).forEach(entry => {
    pushItem(items, {
      type: 'sesi',
      date: entry.endedAt || entry.startedAt || entry.date || entry.createdAt,
      title: 'Sesi Pembelajaran',
      subtitle: formatSubjectName(entry.subjectId || entry.subject || ''),
      message: entry.durationSeconds ? `${Math.max(1, Math.round(Number(entry.durationSeconds) / 60))} minit` : 'Sesi disimpan'
    });
  });

  (Array.isArray(memory.dailySnapshots) ? memory.dailySnapshots : []).forEach(entry => {
    pushItem(items, {
      type: 'snapshot',
      date: entry.date,
      title: 'Ringkasan Harian',
      subtitle: observation.learningTrend || 'Aktiviti Harian',
      message: entry.summary || `Masa belajar ${entry.studyMinutes || 0} minit`
    });
  });

  (Array.isArray(gamification.badges) ? gamification.badges : []).forEach(entry => {
    pushItem(items, {
      type: 'lencana',
      date: entry.earnedAt || entry.updatedAt || entry.date || new Date().toISOString(),
      title: 'Lencana Baharu',
      subtitle: entry.label || entry.name || entry.title || 'Lencana',
      message: entry.description || 'Pencapaian baharu berjaya dibuka.'
    });
  });

  (Array.isArray(gamification.achievements) ? gamification.achievements : []).forEach(entry => {
    pushItem(items, {
      type: 'pencapaian',
      date: entry.earnedAt || entry.updatedAt || entry.date || new Date().toISOString(),
      title: 'Pencapaian',
      subtitle: entry.label || entry.name || entry.title || 'Pencapaian',
      message: entry.description || 'Pencapaian baharu direkodkan.'
    });
  });

  (Array.isArray(gamification.dailyRewards) ? gamification.dailyRewards : []).forEach(entry => {
    pushItem(items, {
      type: 'hadiah-harian',
      date: entry.date || entry.earnedAt || new Date().toISOString(),
      title: 'Hadiah Harian',
      subtitle: 'Ganjaran Konsisten',
      message: entry.label || 'Ganjaran harian diterima.'
    });
  });

  const sorted = items
    .filter(item => item.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const summary = sorted.length
    ? `Aktiviti terbaru menunjukkan ${sorted[0].title.toLowerCase()} yang terkini.`
    : 'Belum ada aktiviti pembelajaran.';

  return {
    items: sorted.slice(0, 12),
    summary,
    hasData: sorted.length > 0
  };
}

export default {
  buildLearningTimeline
};
