import { allocateDurations, getDefaultStudyDuration } from './durationAllocator.js';
import { getSubjectLabel, sortStudyPriorities } from './studyPriority.js';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function cloneDate(date, offsetDays) {
  const next = new Date(date);
  next.setDate(next.getDate() + offsetDays);
  return next;
}

function dayLabel(date) {
  return new Intl.DateTimeFormat('ms-MY', { weekday: 'short' }).format(date);
}

function uniqueKey(item = {}) {
  return `${item.subjectId || ''}:${item.topicId || ''}`;
}

function buildStarterRotation() {
  return [
    { subjectId: 'math', topicId: 'asas', topic: 'Mathematics basics', reason: 'Onboarding: bina asas nombor.', recommendationKey: 'review', activityType: 'review', priority: 'high' },
    { subjectId: 'bm', topicId: 'reading', topic: 'Bahasa Melayu reading', reason: 'Onboarding: baca dan faham ayat ringkas.', recommendationKey: 'review', activityType: 'practice', priority: 'high' },
    { subjectId: 'english', topicId: 'simple_sentences', topic: 'Simple Sentences', reason: 'Onboarding: latihan ayat mudah.', recommendationKey: 'review', activityType: 'practice', priority: 'medium' },
    { subjectId: 'sains', topicId: 'haiwan', topic: 'Haiwan', reason: 'Onboarding: kenali konsep asas sains.', recommendationKey: 'review', activityType: 'practice', priority: 'medium' }
  ];
}

function buildRotation(signals = {}) {
  const prioritized = sortStudyPriorities(signals.candidates || [], {
    recentSubjects: signals.recentSubjects || []
  });
  const unique = [];
  const seen = new Set();
  prioritized.forEach(item => {
    const key = uniqueKey(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });
  return unique.length ? unique : buildStarterRotation();
}

function nextDifferentIndex(rotation, startIndex, subjectId, usedSubjects = new Set()) {
  if (!rotation.length) return -1;
  for (let offset = 0; offset < rotation.length; offset += 1) {
    const index = (startIndex + offset) % rotation.length;
    const candidate = rotation[index];
    if (!candidate) continue;
    if (candidate.subjectId === subjectId) continue;
    if (usedSubjects.has(candidate.subjectId)) continue;
    return index;
  }
  return -1;
}

function createBlock(item = {}, durationMinutes = 10) {
  return {
    subjectId: safeText(item.subjectId, ''),
    subject: getSubjectLabel(item.subjectId),
    topicId: safeText(item.topicId, ''),
    topic: safeText(item.topicLabel || item.topic || item.topicId, 'Topik'),
    reason: safeText(item.reason, 'Latihan seimbang untuk hari ini.'),
    durationMinutes: Math.max(5, Math.min(60, Number(durationMinutes) || 10)),
    priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
    recommendationKey: safeText(item.recommendationKey, 'review'),
    activityType: safeText(item.activityType, 'practice'),
    onboarding: Boolean(item.onboarding)
  };
}

export function buildWeeklyStudyPlan(signals = {}, options = {}) {
  const startDate = options.date ? new Date(options.date) : new Date();
  const rotation = buildRotation(signals);
  const days = [];
  let rotationIndex = 0;
  let lastSubjectId = '';

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const currentDate = cloneDate(startDate, dayOffset);
    const totalMinutes = options.dailyMinutesByDay?.[dayOffset]
      ? Number(options.dailyMinutesByDay[dayOffset])
      : getDefaultStudyDuration(currentDate);
    const normalizedTotal = Math.max(5, Math.min(60, Number(totalMinutes) || getDefaultStudyDuration(currentDate)));
    const blockTarget = normalizedTotal <= 10 ? 1 : normalizedTotal <= 20 ? 2 : normalizedTotal <= 30 ? 3 : 4;
    const blockCount = Math.min(blockTarget, rotation.length || blockTarget);
    const durations = allocateDurations(blockCount, normalizedTotal);
    const blocks = [];
    const usedSubjects = new Set();

    let primaryIndex = rotationIndex % rotation.length;
    let primary = rotation[primaryIndex];
    if (primary && primary.subjectId === lastSubjectId && rotation.length > 1) {
      const alternateIndex = nextDifferentIndex(rotation, primaryIndex + 1, lastSubjectId, usedSubjects);
      if (alternateIndex >= 0) {
        primaryIndex = alternateIndex;
        primary = rotation[primaryIndex];
      }
    }
    if (primary) {
      blocks.push(createBlock(primary, durations[0] || 10));
      usedSubjects.add(primary.subjectId);
      lastSubjectId = primary.subjectId;
    }

    if (blockCount > 1 && rotation.length > 1) {
      const nextIndex = nextDifferentIndex(rotation, primaryIndex + 1, lastSubjectId, usedSubjects);
      if (nextIndex >= 0) {
        const secondary = rotation[nextIndex];
        blocks.push(createBlock(secondary, durations[1] || 10));
        usedSubjects.add(secondary.subjectId);
      }
    }

    if (blockCount > 2 && rotation.length > 2) {
      const nextIndex = nextDifferentIndex(rotation, (primaryIndex + 2) % rotation.length, '', usedSubjects);
      if (nextIndex >= 0) {
        const tertiary = rotation[nextIndex];
        blocks.push(createBlock(tertiary, durations[2] || 10));
        usedSubjects.add(tertiary.subjectId);
      }
    }

    if (!blocks.length) {
      blocks.push(createBlock(rotation[0], normalizedTotal));
    }

    rotationIndex = (primaryIndex + 1) % rotation.length;

    const isLightDay = dayOffset === 2 || dayOffset === 5;
    days.push({
      date: currentDate.toISOString(),
      dayLabel: dayLabel(currentDate),
      totalMinutes: normalizedTotal,
      isLightDay,
      blocks,
      summary: isLightDay ? 'Hari ringan dan ulang kaji pendek.' : 'Sesi seimbang untuk perkembangan berterusan.'
    });
  }

  return {
    startDate: startDate.toISOString(),
    days
  };
}

export default {
  buildWeeklyStudyPlan
};
