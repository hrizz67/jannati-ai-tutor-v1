import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function createBadge(id, label, reason, earnedAt) {
  return { id, label, reason, earnedAt };
}

function sortByEarnedAtDesc(rows = []) {
  return [...rows].sort((a, b) => `${b.earnedAt || ''}`.localeCompare(`${a.earnedAt || ''}`) || `${a.id || ''}`.localeCompare(`${b.id || ''}`));
}

export function buildBadges(profile = {}, memory = {}, context = {}) {
  const today = localDayKey(context.today || new Date());
  const badges = [];
  const totalQuestions = toNumber(profile.totalQuestions, 0);
  const currentStreak = toNumber(profile.streak, 0);
  const strongest = context.learningObservation?.strongestTopic || context.observation?.strongestTopic || null;
  const strongestMastery = toNumber(strongest?.mastery, 0);
  const topSubject = formatSubjectName(strongest?.subjectId || '');
  const topTopic = formatTopicName(strongest?.topicId || strongest?.title || '');
  const readingHistory = Array.isArray(memory.readingHistory) ? memory.readingHistory : [];
  const listeningHistory = Array.isArray(memory.listeningHistory) ? memory.listeningHistory : [];
  const speakingHistory = Array.isArray(memory.speakingHistory) ? memory.speakingHistory : [];
  const writingHistory = Array.isArray(memory.writingHistory) ? memory.writingHistory : [];

  if (totalQuestions > 0) {
    badges.push(createBadge('latihan-pertama', 'Latihan Pertama', 'Kamu sudah memulakan pembelajaran.', today));
  }

  if (currentStreak >= 3) {
    badges.push(createBadge('belajar-3-hari', 'Belajar 3 Hari', 'Kamu belajar beberapa hari berturut-turut.', today));
  }

  if (strongestMastery >= 90 && topTopic) {
    badges.push(createBadge(`juara-${strongest?.subjectId || 'subjek'}-${strongest?.topicId || 'topik'}`, `Juara ${topTopic}`, `Penguasaan tinggi dalam ${topTopic}${topSubject ? ` (${topSubject})` : ''}.`, today));
  }

  if (readingHistory.length >= 3) {
    badges.push(createBadge('penggemar-buku', 'Penggemar Buku', 'Kamu rajin membaca dan menyimpan sesi bacaan.', today));
  }

  if (listeningHistory.some(item => toNumber(item.score, 0) >= 90) || listeningHistory.length >= 3) {
    badges.push(createBadge('pendengar-hebat', 'Pendengar Hebat', 'Kamu menunjukkan tumpuan yang baik ketika mendengar.', today));
  }

  if (speakingHistory.some(item => toNumber(item.score, 0) >= 90) || writingHistory.some(item => toNumber(item.score, 0) >= 90)) {
    badges.push(createBadge('ai-explorer', 'Peneroka AI', 'Kamu mencuba lebih daripada satu laluan pembelajaran.', today));
  }

  if (context.dailyMissionCompleted) {
    badges.push(createBadge('misi-selesai', 'Misi Selesai', 'Misi harian berjaya diselesaikan.', today));
  }

  if (context.learningObservation?.learningTrend === 'semakin baik') {
    badges.push(createBadge('kemajuan-mingguan', 'Kemajuan Mingguan', 'Prestasi kamu semakin baik minggu ini.', today));
  }

  return sortByEarnedAtDesc(uniqueById(badges));
}

function uniqueById(rows = []) {
  const seen = new Set();
  return rows.filter(item => {
    const id = item?.id || '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export default {
  buildBadges
};
