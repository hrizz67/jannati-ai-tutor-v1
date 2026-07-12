import { buildMasteryMap, summarizeMastery } from './adaptive/masteryEngine';
import { buildCurriculumCoverage } from '../curriculum/coverageEngine';
import { rememberQuestionHistory } from './diversity/sessionHistoryEngine';
import { rememberQuestionIntelligenceHistory } from './question/questionEngine.js';
import { loadMemory as loadStudentMemory } from './memory/memoryStorage.js';

const MEMORY_KEY = 'jannati_v151_ai_memory';
const LEGACY_MEMORY_KEYS = ['jannati_v150_ai_memory', 'jannati_v140_ai_memory'];

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
    topicMastery: {},
    masterySummary: null,
    readingHistory: [],
    listeningHistory: [],
    speakingHistory: [],
    writingHistory: [],
    questionHistory: [],
    qipHistory: {
      questions: [],
      stems: [],
      topics: [],
      templates: [],
      contexts: [],
      names: [],
      objects: []
    },
    curriculumCoverage: null,
    topicHistory: {},
    mistakeHistory: {},
    dailySnapshots: [],
    recommendationScores: {},
    learningHistory: [],
    memoryUpdatedAt: '',
    updatedAt: ''
  };
}

export function loadAIMemory() {
  try {
    const studentMemory = loadStudentMemory();
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) {
      return {
        ...emptyMemory(),
        ...JSON.parse(saved),
        topicHistory: studentMemory.topics || {},
        mistakeHistory: studentMemory.mistakes || {},
        dailySnapshots: Array.isArray(studentMemory.dailySnapshots) ? [...studentMemory.dailySnapshots] : [],
        recommendationScores: studentMemory.recommendationScores || {},
        learningHistory: Array.isArray(studentMemory.learningHistory) ? [...studentMemory.learningHistory] : [],
        memoryUpdatedAt: studentMemory.updatedAt || ''
      };
    }

    for (const key of LEGACY_MEMORY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        localStorage.setItem(MEMORY_KEY, legacy);
        return {
          ...emptyMemory(),
          ...JSON.parse(legacy),
          topicHistory: studentMemory.topics || {},
          mistakeHistory: studentMemory.mistakes || {},
          dailySnapshots: Array.isArray(studentMemory.dailySnapshots) ? [...studentMemory.dailySnapshots] : [],
          recommendationScores: studentMemory.recommendationScores || {},
          learningHistory: Array.isArray(studentMemory.learningHistory) ? [...studentMemory.learningHistory] : [],
          memoryUpdatedAt: studentMemory.updatedAt || ''
        };
      }
    }

    return {
      ...emptyMemory(),
      topicHistory: studentMemory.topics || {},
      mistakeHistory: studentMemory.mistakes || {},
      dailySnapshots: Array.isArray(studentMemory.dailySnapshots) ? [...studentMemory.dailySnapshots] : [],
      recommendationScores: studentMemory.recommendationScores || {},
      learningHistory: Array.isArray(studentMemory.learningHistory) ? [...studentMemory.learningHistory] : [],
      memoryUpdatedAt: studentMemory.updatedAt || ''
    };
  } catch {
    localStorage.removeItem(MEMORY_KEY);
    LEGACY_MEMORY_KEYS.forEach(key => localStorage.removeItem(key));
    const studentMemory = loadStudentMemory();
    return {
      ...emptyMemory(),
      topicHistory: studentMemory.topics || {},
      mistakeHistory: studentMemory.mistakes || {},
      dailySnapshots: Array.isArray(studentMemory.dailySnapshots) ? [...studentMemory.dailySnapshots] : [],
      recommendationScores: studentMemory.recommendationScores || {},
      learningHistory: Array.isArray(studentMemory.learningHistory) ? [...studentMemory.learningHistory] : [],
      memoryUpdatedAt: studentMemory.updatedAt || ''
    };
  }
}

export function saveAIMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify({ ...emptyMemory(), ...memory, updatedAt: new Date().toISOString() }));
  } catch {
    localStorage.removeItem(MEMORY_KEY);
  }
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
  const topicMastery = {
    ...(previousMemory.topicMastery || {}),
    ...buildMasteryMap(profile, subjects, previousMemory)
  };
  const masterySummary = summarizeMastery(topicMastery);
  const mastery = masterySummary.total ? masterySummary.masteryScore : previousMemory.mastery || 0;
  const curriculumCoverage = buildCurriculumCoverage(profile, subjects);
  const studentMemory = loadStudentMemory();

  return {
    ...previousMemory,
    weakTopics,
    strongTopics,
    studyStreak: profile.streak || 0,
    xp: profile.xp || 0,
    coins: profile.coins || 0,
    mastery,
    topicMastery,
    masterySummary,
    curriculumCoverage,
    topicHistory: studentMemory.topics || previousMemory.topicHistory || {},
    mistakeHistory: studentMemory.mistakes || previousMemory.mistakeHistory || {},
    dailySnapshots: Array.isArray(studentMemory.dailySnapshots) ? [...studentMemory.dailySnapshots] : previousMemory.dailySnapshots || [],
    recommendationScores: studentMemory.recommendationScores || previousMemory.recommendationScores || {},
    learningHistory: Array.isArray(studentMemory.learningHistory) ? [...studentMemory.learningHistory] : previousMemory.learningHistory || [],
    memoryUpdatedAt: studentMemory.updatedAt || previousMemory.memoryUpdatedAt || ''
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

  const historyMemory = rememberQuestionIntelligenceHistory(
    rememberQuestionHistory(next, session.questions || topic.questions || []),
    session.questions || topic.questions || []
  );

  saveAIMemory({
    ...next,
    ...historyMemory,
    lastLesson: lesson,
    studyTime: Math.max(0, previous.studyTime || 0) + Math.max(0, studySeconds || 0)
  });
}

export function saveQuestionHistory(questions = []) {
  const previous = loadAIMemory();
  const rows = Array.isArray(questions) ? questions : [questions];
  saveAIMemory(rememberQuestionIntelligenceHistory(rememberQuestionHistory(previous, rows), rows));
}

function refreshMemoryBase(profile, subjects, previous) {
  return profile ? buildAIMemory(profile, subjects || [], previous) : previous;
}

export function saveReadingMemory(result = {}, profile = null, subjects = []) {
  const previous = loadAIMemory();
  const base = refreshMemoryBase(profile, subjects, previous);
  const readingResult = {
    language: result.language || 'bm',
    title: result.title || 'Reading Coach',
    score: result.score || 0,
    correct: result.correct || 0,
    missed: result.missed || 0,
    incorrect: result.incorrect || 0,
    targetText: result.targetText || '',
    transcript: result.transcript || '',
    date: result.date || new Date().toISOString()
  };

  saveAIMemory({
    ...base,
    readingHistory: [readingResult, ...(base.readingHistory || [])].slice(0, 20)
  });
}

export function saveListeningMemory(result = {}, profile = null, subjects = []) {
  const previous = loadAIMemory();
  const base = refreshMemoryBase(profile, subjects, previous);
  const listeningResult = {
    language: result.language || 'bm',
    title: result.title || 'Listening Lab',
    mode: result.mode || 'choose',
    score: result.score || 0,
    correct: result.correct || 0,
    total: result.total || 0,
    date: result.date || new Date().toISOString()
  };

  saveAIMemory({
    ...base,
    listeningHistory: [listeningResult, ...(base.listeningHistory || [])].slice(0, 20)
  });
}

export function saveSpeakingMemory(result = {}, profile = null, subjects = []) {
  const previous = loadAIMemory();
  const base = refreshMemoryBase(profile, subjects, previous);
  const speakingResult = {
    language: result.language || 'bm',
    title: result.title || 'Speaking Coach',
    mode: result.mode || 'intro',
    score: result.score || 0,
    matchedKeywords: result.matchedKeywords || 0,
    totalKeywords: result.totalKeywords || 0,
    transcript: result.transcript || '',
    date: result.date || new Date().toISOString()
  };

  saveAIMemory({
    ...base,
    speakingHistory: [speakingResult, ...(base.speakingHistory || [])].slice(0, 20)
  });
}

export function saveWritingMemory(result = {}, profile = null, subjects = []) {
  const previous = loadAIMemory();
  const base = refreshMemoryBase(profile, subjects, previous);
  const writingResult = {
    language: result.language || 'bm',
    title: result.title || 'Writing Coach',
    mode: result.mode || 'short',
    score: result.score || 0,
    matchedKeywords: result.matchedKeywords || 0,
    totalKeywords: result.totalKeywords || 0,
    spellingIssues: result.spellingIssues || 0,
    grammarHints: result.grammarHints || [],
    answer: result.answer || '',
    date: result.date || new Date().toISOString()
  };

  saveAIMemory({
    ...base,
    writingHistory: [writingResult, ...(base.writingHistory || [])].slice(0, 20)
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
