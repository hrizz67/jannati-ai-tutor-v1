function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function topicProgress(profile = {}, subjectId, topicId) {
  return profile.progress?.[progressKey(subjectId, topicId)] || {};
}

export function isWeakTopic(profile = {}, subject = {}, topic = {}) {
  const progress = topicProgress(profile, subject.id, topic.id);
  return (progress.attempts || 0) > 0 && (progress.best || 0) < 80;
}

export function buildRecommendation(profile = {}, subject = {}) {
  const topics = subject.topics || [];
  const weakTopics = topics
    .map((topic, index) => {
      const progress = topicProgress(profile, subject.id, topic.id);
      return {
        id: topic.id,
        title: topic.title,
        index,
        best: progress.best || 0,
        last: progress.last || 0,
        attempts: progress.attempts || 0,
        questionCount: topic.questions?.length || 0
      };
    })
    .filter(topic => topic.attempts > 0 && topic.best < 80)
    .sort((a, b) => a.best - b.best || b.attempts - a.attempts);

  const untouchedTopic = topics.find(topic => {
    const progress = topicProgress(profile, subject.id, topic.id);
    return !progress.attempts;
  });
  const recommended = weakTopics[0] || (untouchedTopic ? {
    id: untouchedTopic.id,
    title: untouchedTopic.title,
    best: 0,
    last: 0,
    attempts: 0,
    questionCount: untouchedTopic.questions?.length || 0
  } : null);

  return {
    subjectId: subject.id,
    subjectTitle: subject.title,
    weakTopics,
    recommendedTopicId: recommended?.id || null,
    recommendedTitle: recommended?.title || 'Semua topik selesai',
    reason: weakTopics.length
      ? `Ulang ${weakTopics[0].title} kerana skor terbaik masih ${weakTopics[0].best}%.`
      : untouchedTopic
        ? `Cuba topik baharu: ${untouchedTopic.title}.`
        : 'Tiada topik lemah dikesan sekarang.',
    updatedAt: new Date().toISOString()
  };
}

export function updateStoredRecommendation(profile = {}, subject = {}) {
  const recommendation = buildRecommendation(profile, subject);
  return {
    ...profile,
    recommendations: {
      ...(profile.recommendations || {}),
      [subject.id]: recommendation
    }
  };
}
