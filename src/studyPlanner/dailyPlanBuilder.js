import { buildStudyPriorityMap, getSubjectLabel } from './studyPriority.js';
import { allocateDurations, getAvailableStudyDuration } from './durationAllocator.js';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function uniqueKey(item = {}) {
  return `${item.subjectId || ''}:${item.topicId || ''}`;
}

function normalizeBlock(block = {}) {
  return {
    subject: safeText(block.subject, 'Subjek'),
    topic: safeText(block.topic, 'Topik'),
    reason: safeText(block.reason, 'Perlu latihan seimbang.'),
    durationMinutes: Math.max(5, Math.min(60, Number(block.durationMinutes) || 10)),
    priority: ['high', 'medium', 'low'].includes(block.priority) ? block.priority : 'medium',
    recommendationKey: safeText(block.recommendationKey, 'review'),
    activityType: safeText(block.activityType, 'practice'),
    subjectId: safeText(block.subjectId, ''),
    topicId: safeText(block.topicId, ''),
    onboarding: Boolean(block.onboarding)
  };
}

function buildOnboardingBlocks(availableMinutes = 20) {
  const durations = allocateDurations(2, availableMinutes);
  const blocks = [
    {
      subjectId: 'math',
      subject: getSubjectLabel('math'),
      topicId: 'asas',
      topic: 'Mathematics basics',
      reason: 'Onboarding: mulakan dengan nombor asas.',
      durationMinutes: durations[0] || 10,
      priority: 'high',
      recommendationKey: 'review',
      activityType: 'review',
      onboarding: true
    },
    {
      subjectId: 'bm',
      subject: getSubjectLabel('bm'),
      topicId: 'reading',
      topic: 'Bahasa Melayu reading',
      reason: 'Onboarding: bina asas bacaan dan ayat ringkas.',
      durationMinutes: durations[1] || 10,
      priority: 'high',
      recommendationKey: 'review',
      activityType: 'practice',
      onboarding: true
    }
  ];
  return blocks.map(normalizeBlock);
}

export function buildDailyStudyPlan(signals = {}, options = {}) {
  const availableMinutes = getAvailableStudyDuration(options, options.date || new Date());
  const prioritized = buildStudyPriorityMap(signals.candidates || [], {
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

  const maxBlocks = availableMinutes <= 10 ? 1 : availableMinutes <= 15 ? 1 : availableMinutes <= 20 ? 2 : availableMinutes <= 30 ? 3 : 4;
  const filtered = unique.filter(item => item.subjectId && item.topicId);
  const challengeCandidate = prioritized.find(item => item.recommendationKey === 'increase_difficulty' || item.activityType === 'challenge');
  const selected = filtered.slice(0, maxBlocks);
  const selectedHasChallenge = selected.some(item => item.recommendationKey === 'increase_difficulty' || item.activityType === 'challenge');
  if (availableMinutes >= 30 && challengeCandidate && !selectedHasChallenge) {
    if (selected.length < maxBlocks) {
      selected.push(challengeCandidate);
    } else if (selected.length) {
      selected[selected.length - 1] = challengeCandidate;
    }
  }
  const finalCandidates = selected.slice(0, maxBlocks);
  if (!finalCandidates.length) {
    return {
      onboarding: true,
      availableMinutes,
      blocks: buildOnboardingBlocks(availableMinutes)
    };
  }

  const blockDurations = allocateDurations(Math.min(4, finalCandidates.length), availableMinutes);
  const blocks = finalCandidates.slice(0, blockDurations.length).map((item, index) => ({
    subjectId: item.subjectId,
    subject: getSubjectLabel(item.subjectId),
    topicId: item.topicId,
    topic: safeText(item.topicLabel, item.topicId),
    reason: safeText(item.reason, item.isOverdue ? 'Perlu ulang segera.' : item.mastery < 60 ? 'Penguasaan masih rendah.' : 'Latihan seimbang sesuai cadangan.'),
    durationMinutes: blockDurations[index] || 10,
    priority: item.priority,
    recommendationKey: item.recommendationKey || 'review',
    activityType: item.activityType || (item.isOverdue ? 'revision' : item.mastery < 60 ? 'review' : 'practice')
  })).map(normalizeBlock);

  return {
    onboarding: false,
    availableMinutes,
    blocks
  };
}

export default {
  buildDailyStudyPlan
};
