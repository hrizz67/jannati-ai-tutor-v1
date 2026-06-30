const MEMORY_KEY = 'jannati_v150_ai_memory';

function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function emptyMemory() {
  return {
    weakTopics: [],
    strongTopics: [],
    lastLesson: null,
    studyStreak: 0,
    studyTime: 0,
    xp: 0,
    coins: 0,
    mastery: 0,
    updatedAt: ''
  };
}

export function loadAIMemory() {
  try {
    const saved = localStorage.getItem(MEMORY_KEY);
    return saved ? { ...emptyMemory(), ...JSON.parse(saved) } : emptyMemory();
  } catch {
    return emptyMemory();
  }
}

export function saveAIMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify({ ...emptyMemory(), ...memory, updatedAt: new Date().toISOString() }));
}

function buildTopicRows(profile = {}, subjects = []) {
  return subjects.flatMap(subject => (subject?.topics || []).map(topic => {
    const progress = profile.progress?.[progressKey(subject.id, topic.id)] || {};
    return {
      subjectId: subject.id,
      subject: subject.short || subject.title,
      topicId: topic.id,
      title: topic.title,
      best: progress.best || 0,
      last: progress.last || 0,
      attempts: progress.attempts || 0
    };
  }));
}

export function buildAIMemory(profile = {}, subjects = [], previousMemory = loadAIMemory()) {
  const rows = buildTopicRows(profile, subjects);
  const attempted = rows.filter(row => row.attempts > 0);
  const weakTopics = attempted.filter(row => row.best < 80).sort((a, b) => a.best - b.best).slice(0, 12);
  const strongTopics = attempted.filter(row => row.best >= 80).sort((a, b) => b.best - a.best).slice(0, 12);
  const mastery = rows.length ? Math.round((strongTopics.length / rows.length) * 100) : previousMemory.mastery || 0;

  return {
    ...previousMemory,
    weakTopics,
    strongTopics,
    studyStreak: profile.streak || 0,
    xp: profile.xp || 0,
    coins: profile.coins || 0,
    mastery
  };
}

export function saveQuizMemory({ profile = {}, subject = {}, topic = {}, percent = 0, session = {}, studySeconds = 0 }) {
  const previous = loadAIMemory();
  const next = buildAIMemory(profile, [subject], previous);
  const lesson = {
    subjectId: subject.id,
    subject: subject.short || subject.title,
    topicId: topic.id,
    title: topic.title,
    score: percent,
    xp: session.xp || 0,
    coins: session.coins || 0,
    date: new Date().toISOString()
  };

  saveAIMemory({
    ...next,
    lastLesson: lesson,
    studyTime: Math.max(0, previous.studyTime || 0) + Math.max(0, studySeconds || 0)
  });
}

export function formatStudyTime(seconds = 0) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}j ${rest}m` : `${hours}j`;
}
