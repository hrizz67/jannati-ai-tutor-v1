import { MASTERY_STATUS } from './adaptive/masteryEngine.js';
import { isTopicUnlockedByGraph } from './adaptive/knowledgeGraph.js';

function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function topicProgress(profile = {}, subjectId, topicId) {
  return profile.progress?.[progressKey(subjectId, topicId)] || {};
}

function recentTopicIds(profile = {}, limit = 8) {
  return (profile.history || [])
    .slice(0, limit)
    .map(item => `${item.subjectId || item.subject}_${item.topicId || item.topic}`)
    .filter(Boolean);
}

function recentMistakeIds(profile = {}, memory = {}) {
  const weakFromHistory = (profile.history || [])
    .slice(0, 12)
    .filter(item => (item.percent || 0) < 80)
    .map(item => `${item.subjectId || item.subject}_${item.topicId || item.topic}`);

  const lastLesson = memory.lastLesson && (memory.lastLesson.score || 0) < 80
    ? [`${memory.lastLesson.subjectId}_${memory.lastLesson.topicId}`]
    : [];

  return new Set([...lastLesson, ...weakFromHistory].filter(Boolean));
}

function pickQuestion(topic = {}, profile = {}, subjectId) {
  const questions = topic.questions || [];
  if (!questions.length) return null;

  const recentQuestionIds = new Set(
    (profile.history || [])
      .slice(0, 10)
      .filter(item => item.subjectId === subjectId && item.topicId === topic.id)
      .map(item => item.questionId)
      .filter(Boolean)
  );

  return questions.find(question => !recentQuestionIds.has(question.id)) || questions[0];
}

function describeReason(candidate, memory = {}) {
  if (!candidate) return 'Mulakan satu sesi pendek untuk membina rekod pembelajaran.';

  if (candidate.recentMistake) {
    return `Ulang ${candidate.topic.title} supaya kamu lebih yakin pada topik ini.`;
  }

  if (candidate.isWeak) {
    return `Fokus ${candidate.topic.title}; skor terbaik masih ${candidate.best}% dan belum mencapai sasaran 80%.`;
  }

  if (candidate.isNew) {
    return `Cuba topik baharu ${candidate.topic.title} untuk meluaskan kemajuan hari ini.`;
  }

  if ((memory.studyStreak || 0) >= 3 && candidate.isStrong) {
    return `Streak sedang baik, jadi kekalkan momentum dengan cabaran ${candidate.topic.title}.`;
  }

  return `Latihan ${candidate.topic.title} dipilih kerana sesuai dengan kemajuan semasa kamu.`;
}

function priorityLabel(score) {
  if (score >= 95) return 'high';
  if (score >= 68) return 'medium';
  return 'low';
}

export function buildAdaptiveRecommendation({ profile = {}, memory = {}, subjects = [] } = {}) {
  const usableSubjects = (subjects || []).filter(subject => subject?.topics?.length);
  const mistakes = recentMistakeIds(profile, memory);
  const recentTopics = new Set(recentTopicIds(profile));
  const weakMemory = new Set((memory.weakTopics || []).map(topic => `${topic.subjectId}_${topic.topicId}`));
  const strongMemory = new Set((memory.strongTopics || []).map(topic => `${topic.subjectId}_${topic.topicId}`));
  const mastery = clamp(memory.mastery || 0, 0, 100);
  const streak = memory.studyStreak || profile.streak || 0;

  const candidates = usableSubjects.flatMap(subject => (subject.topics || []).map(topic => {
    const progress = topicProgress(profile, subject.id, topic.id);
    const best = progress.best || 0;
    const last = progress.last || 0;
    const attempts = progress.attempts || 0;
    const key = `${subject.id}_${topic.id}`;
    const isWeak = attempts > 0 && best < 80;
    const isStrong = best >= 80 || strongMemory.has(key);
    const isNew = attempts === 0;
    const recentMistake = mistakes.has(key) || last < 60 && attempts > 0;
    const recentlyStudied = recentTopics.has(key);
    const masteryStatus = memory.topicMastery?.[key]?.status;
    const unlocked = isTopicUnlockedByGraph(subject, topic.id, memory.topicMastery || {});
    const skspGap = memory.curriculumCoverage?.topicGaps?.[key];

    let score = 35;
    score += (100 - mastery) * 0.16;
    if (isWeak) score += 34 + (80 - best) * 0.45;
    if (weakMemory.has(key)) score += 18;
    if (masteryStatus === MASTERY_STATUS.NEEDS_PRACTICE) score += 30;
    if (masteryStatus === MASTERY_STATUS.LEARNING) score += 10;
    if (masteryStatus === MASTERY_STATUS.MASTERED) score -= 22;
    if (skspGap) score += 28;
    if (recentMistake) score += 24;
    if (isNew) score += mastery < 45 ? 14 : 8;
    if (isStrong) score += streak >= 3 ? 6 : -12;
    if (recentlyStudied) score -= 10;
    score += clamp(streak, 0, 7) * 1.5;
    score -= Math.min(attempts, 5) * 1.2;

    return {
      subject,
      topic,
      question: pickQuestion(topic, profile, subject.id),
      score,
      best,
      isWeak,
      isStrong,
      isNew,
      recentMistake,
      unlocked,
      skspGap
    };
  })).filter(candidate => candidate.question && candidate.unlocked);

  const selected = candidates.sort((a, b) => b.score - a.score)[0];
  if (!selected) {
    return {
      nextSubject: null,
      nextTopic: null,
      nextQuestionId: null,
      reason: 'Tiada soalan tersedia untuk dicadangkan.',
      priority: 'low'
    };
  }

  return {
    nextSubject: selected.subject.id,
    nextTopic: selected.topic.id,
    nextQuestionId: selected.question.id,
    reason: selected.skspGap ? `Fokus pada ${selected.topic.title} kerana ${selected.skspGap.SK} / ${selected.skspGap.SP} belum dikuasai.` : describeReason(selected, memory),
    priority: priorityLabel(selected.score)
  };
}
