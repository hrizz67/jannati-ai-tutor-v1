import React, { useEffect, useMemo, useRef, useState } from 'react';
import { subjectList, loadSubjectData, loadAllSubjects } from './data/subjects';
import { smartCheck } from './utils/smartCheck';
import { speakText, beep } from './utils/speech';
import AIExplainModal from './components/ai/AIExplainModal';
import AITeacherModal from './components/ai/AITeacherModal';
import BrandLogo from './components/BrandLogo';
import Mascot from './components/Mascot';
import MascotCard from './components/MascotCard';
import { explainAnswer } from './ai/explainEngine';
import { buildRecommendation, isWeakTopic, updateStoredRecommendation } from './ai/recommendationEngine';
import { buildAdaptiveRecommendation } from './ai/adaptiveEngine';
import { loadProfile as loadAdaptiveStudentProfile } from './ai/adaptive/storageEngine';
import { rankStrongTopics, rankWeakTopics, explainWeakness } from './ai/adaptive/weakTopicEngine';
import { generateRecommendation } from './ai/adaptive/recommendationEngine';
import { getWeeklySummary } from './ai/adaptive/weeklyAnalyticsEngine';
import { getAllSubjectAnalytics, getBestSubject, getWeakestSubject, getSubjectAttentionSummary } from './ai/adaptive/subjectAnalyticsEngine';
import { generateParentReport } from './ai/adaptive/parentReportEngine';
import { getTodayRevision } from './ai/revision/revisionPlannerEngine';
import { getReviewQueue } from './ai/revision/spacedRepetitionEngine';
import { getRecommendedDifficulty, buildDifficultyPlan } from './ai/revision/difficultyEngine';
import { buildMixedRevisionSession } from './ai/revision/mixedRevisionEngine';
import { buildRevisionCalendar } from './ai/revision/revisionCalendarEngine';
import { buildMasteryMap, summarizeMastery, MASTERY_STATUS } from './ai/adaptive/masteryEngine';
import { buildAdaptivePracticeSession, getAdaptivePracticeSummary } from './ai/adaptive/adaptivePracticeEngine';
import { buildLessonPlan } from './ai/adaptive/lessonPlanner';
import { getBlockedPrerequisites, getDependencyArrow, isTopicUnlockedByGraph } from './ai/adaptive/knowledgeGraph';
import { getAdaptiveProfile, recordQuestionResult, recordSessionEnd, recordSessionStart } from './ai/adaptive/adaptiveSessionEngine';
import { teachAnswer } from './ai/teacherEngine';
import { formatStudyTime, loadAIMemory, saveQuizMemory, saveQuestionHistory, saveReadingMemory, saveListeningMemory, saveSpeakingMemory, saveWritingMemory } from './ai/memoryEngine';
import { printParentReport } from './utils/printReport';
import { buildStudentIntelligence, getStudentLevel, loadStudentCore, saveStudentCore } from './ai/studentIntelligence';
import { buildQuestionSession } from './ai/question/questionEngine';
import { buildTeacherPortalSnapshot } from './curriculum/curriculumEngine';
import { buildCurriculumCoverage } from './curriculum/coverageEngine';
import { recommendMissingSkSp, summarizeUasaCoverage } from './curriculum/uasaEngine';
import { PERSONALITY_MESSAGES, getPersonalityForSubject } from './brand/personalities';
import HomeDashboard from './dashboard/HomeDashboard';
import ParentDashboardPage from './dashboard/ParentDashboard';
import { EmptyState } from './dashboard/dashboardHelpers.jsx';

const PROFILE_KEY = 'jannati_v151_profile';
const RESUME_KEY = 'jannati_v151_resume';
const FEEDBACK_KEY = 'jannati_beta_feedback';
const ONBOARDING_KEY = 'jannati_closed_beta_onboarding_v1';
const AI_MEMORY_KEYS = ['jannati_v151_ai_memory', 'jannati_v150_ai_memory', 'jannati_v140_ai_memory'];
const LEGACY_PROFILE_KEYS = ['jannati_v150_profile', 'jannati_v140_profile'];
const LEGACY_RESUME_KEYS = ['jannati_v150_resume', 'jannati_v140_resume'];
const BETA_STATUS = 'Persediaan Beta Tertutup';
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'local';
const APP_BUILD_DATE = typeof __APP_BUILD_DATE__ !== 'undefined' ? __APP_BUILD_DATE__ : new Date().toISOString();
const storageRecoveryEvents = [];

const defaultProfile = {
  name: '',
  avatar: '??',
  year: 'Tahun 2',
  isDemo: false,
  xp: 0,
  coins: 0,
  streak: 0,
  lastStudy: '',
  badges: [],
  progress: {},
  history: [],
  daily: {},
  bookmarks: [],
  favourites: [],
  recommendations: {},
  uasaHistory: []
};

function createDemoProfile() {
  return {
    ...defaultProfile,
    name: 'Demo Murid',
    avatar: '??',
    year: 'Tahun 2',
    isDemo: true,
    createdAt: new Date().toISOString()
  };
}

function loadProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) return { ...defaultProfile, ...JSON.parse(saved) };

    for (const key of LEGACY_PROFILE_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        const parsed = { ...defaultProfile, ...JSON.parse(legacy) };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch {
    storageRecoveryEvents.push('Data profil telah dipulihkan kerana simpanan peranti rosak.');
    localStorage.removeItem(PROFILE_KEY);
    LEGACY_PROFILE_KEYS.forEach(key => localStorage.removeItem(key));
  }

  const demoProfile = createDemoProfile();
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(demoProfile));
  } catch {
    storageRecoveryEvents.push('Profil demo beta tidak dapat disimpan pada peranti ini.');
  }
  return demoProfile;
}

function loadResume() {
  try {
    const saved = localStorage.getItem(RESUME_KEY);
    if (saved) return JSON.parse(saved);

    for (const key of LEGACY_RESUME_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        localStorage.setItem(RESUME_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch {
    storageRecoveryEvents.push('Data sambung latihan telah dipulihkan kerana simpanan peranti rosak.');
    clearResume();
  }

  return null;
}

function saveResume(data) {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(data));
  } catch {
    storageRecoveryEvents.push('Simpanan automatik latihan tidak dapat dibuat kerana simpanan peranti tidak tersedia.');
  }
}

function clearResume() {
  localStorage.removeItem(RESUME_KEY);
  LEGACY_RESUME_KEYS.forEach(key => localStorage.removeItem(key));
}

function loadFeedbackItems() {
  try {
    const saved = localStorage.getItem(FEEDBACK_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    storageRecoveryEvents.push('Data maklum balas telah dipulihkan kerana simpanan peranti rosak.');
    localStorage.removeItem(FEEDBACK_KEY);
    return [];
  }
}

function saveFeedbackItem(item) {
  try {
    const items = loadFeedbackItems();
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify([item, ...items].slice(0, 100)));
  } catch {
    storageRecoveryEvents.push('Maklum balas tidak dapat disimpan kerana simpanan peranti tidak tersedia.');
  }
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function getStars(score = 0) {
  if (score >= 90) return '???';
  if (score >= 70) return '??';
  if (score >= 50) return '?';
  return '???';
}

function getGrade(score = 0) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isTopicUnlocked(profile, subject, topicIndex) {
  if (topicIndex === 0) return true;
  const previousTopic = subject.topics[topicIndex - 1];
  const previousProgress = profile.progress?.[progressKey(subject.id, previousTopic.id)];
  return (previousProgress?.best || 0) >= 80;
}

function getSubjectAverage(profile, subject) {
  if (!subject?.topics?.length) return 0;
  const total = subject.topics.reduce((sum, topic) => {
    return sum + (profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0);
  }, 0);
  return Math.round(total / subject.topics.length);
}

function hasAdaptiveEvidence(profile = {}) {
  if (!profile || typeof profile !== 'object') return false;
  if ((profile.totalQuestions || 0) > 0) return true;
  if ((profile.correctQuestions || 0) > 0) return true;
  if ((profile.studyMinutes || 0) > 0) return true;
  const topicGroups = Object.values(profile.topics || {});
  return topicGroups.some(subjectTopics => Object.values(subjectTopics || {}).some(record => (record?.total || 0) > 0));
}

function getAdaptiveBestStreak(profile = {}) {
  return Number(profile.bestStreak || profile.longestStreak || profile.maxStreak || profile.streak || 0);
}

function getAdaptiveSubjectSummary(profile = {}, subjectId) {
  const subjectRecord = profile.subjects?.[subjectId] || {};
  return {
    accuracy: Number(subjectRecord.accuracy || 0),
    correct: Number(subjectRecord.correct || 0),
    total: Number(subjectRecord.total || 0)
  };
}

function getAdaptiveMotivation(streak = 0) {
  if (streak >= 7) return '?? Hebat!';
  if (streak >= 3) return '?? Teruskan!';
  return '?? Belajar lagi hari ini!';
}

function getRecommendedTopic(profile, subject) {
  return subject.topics.find((topic, index) => {
    const progress = profile.progress?.[progressKey(subject.id, topic.id)];
    return isTopicUnlocked(profile, subject, index) && (progress?.best || 0) < 80;
  }) || subject.topics[0];
}

function autoBadges(profile) {
  const badges = new Set(profile.badges || []);
  const completed = Object.values(profile.progress || {}).filter(p => p.best >= 80).length;
  if ((profile.xp || 0) >= 100) badges.add('100 XP Pertama');
  if ((profile.xp || 0) >= 500) badges.add('Pejuang 500 XP');
  if ((profile.streak || 0) >= 3) badges.add('Hari berturut 3 Hari');
  if (completed >= 1) badges.add('Topik Pertama Siap');
  if ((profile.uasaHistory || []).some(x => x.score >= 80)) badges.add('UASA A');
  return [...badges];
}

function buildDailyChallenge() {
  return [
    { subjectId: 'bm', count: 5, label: '5 soalan BM' },
    { subjectId: 'math', count: 5, label: '5 soalan Matematik' },
    { subjectId: 'english', count: 3, label: '3 soalan English' },
    { subjectId: 'sains', count: 2, label: '2 soalan Sains' }
  ];
}

function buildUasaSet(subject, count = 20) {
  return buildQuestionSession({
    subject,
    topics: subject.topics,
    count,
    memory: loadAIMemory(),
    sessionSeed: Date.now()
  }).questions;
}

const PATH_CATEGORIES = ['Tatabahasa', 'Pemahaman', 'Penulisan'];

function buildLearningPathSections(topics) {
  const size = Math.ceil(topics.length / PATH_CATEGORIES.length);
  return PATH_CATEGORIES.map((title, index) => {
    const start = index * size;
    const sectionTopics = topics.slice(start, start + size);
    return { title, start, topics: sectionTopics };
  }).filter(section => section.topics.length);
}

function getTopicQuestionsCompleted(topic, best = 0) {
  return Math.round((topic.questions.length * best) / 100);
}

function getNextTopic(subject, topic) {
  if (!subject || !topic) return null;
  const currentIndex = subject.topics.findIndex(item => item.id === topic.id);
  return currentIndex >= 0 ? subject.topics[currentIndex + 1] || null : null;
}

function aiReply(message, profile, selectedSubject) {
  const text = message.toLowerCase();
  const avg = getSubjectAverage(profile, selectedSubject);
  const recommended = getRecommendedTopic(profile, selectedSubject);
  if (text.includes('uasa') || text.includes('peperiksaan')) {
    return `Untuk UASA ${selectedSubject.short}, purata sekarang ${avg}%. Cuba latihan topik dahulu, kemudian buat Simulator UASA.`;
  }
  if (text.includes('lemah') || text.includes('ulang')) {
    return `Saya cadangkan ulang ${recommended.title}. Sasarkan sekurang-kurangnya 80%.`;
  }
  return `Hari ini saya cadangkan belajar ${recommended.title}. Guna Petunjuk jika susah.`;
}

export default function App() {
  const [profile, setProfile] = useState(() => loadStudentCore(loadProfile()));
  const [resume, setResume] = useState(loadResume);
  const [recoveryMessages, setRecoveryMessages] = useState(() => [...storageRecoveryEvents]);
  const [screen, setScreen] = useState(profile.name ? 'dashboard' : 'login');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) !== 'done';
    } catch {
      return true;
    }
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState('bm');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [session, setSession] = useState({ correct: 0, almost: 0, wrong: 0, xp: 0, coins: 0, percent: 0, stars: '???', answers: [] });
  const [chatOpen, setChatOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainData, setExplainData] = useState(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [quizStartedAt, setQuizStartedAt] = useState(Date.now());
  const [adaptivePracticeCount, setAdaptivePracticeCount] = useState(10);
  const adaptiveSessionRef = useRef(null);
  const questionStartedAtRef = useRef(Date.now());
  const quizSubmitKeyRef = useRef('');

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      saveStudentCore(profile, allSubjects, loadAIMemory());
    } catch {
      setRecoveryMessages(prev => [...prev, 'Perubahan profil tidak dapat disimpan kerana simpanan peranti tidak tersedia.']);
    }
  }, [profile, allSubjects]);

  useEffect(() => {
    let alive = true;
    setLoadingSubject(true);
    loadSubjectData(selectedSubjectId).then(subject => {
      if (!alive) return;
      setSelectedSubject(subject);
      setLoadingSubject(false);
    });
    return () => { alive = false; };
  }, [selectedSubjectId]);

  useEffect(() => {
    loadAllSubjects().then(setAllSubjects);
  }, []);

  const totalQuestions = useMemo(() => {
    return selectedSubject?.topics?.reduce((sum, topic) => sum + topic.questions.length, 0) || 0;
  }, [selectedSubject]);

  const adaptivePracticePreview = useMemo(() => {
    if (!allSubjects.length) return null;
    const session = buildAdaptivePracticeSession(profile, allSubjects, {
      questionCount: adaptivePracticeCount,
      mode: 'balanced',
      subjectId: selectedSubjectId,
      seed: 'preview'
    });
    return {
      session,
      summary: getAdaptivePracticeSummary(session)
    };
  }, [profile, allSubjects, adaptivePracticeCount, selectedSubjectId]);

  async function startProfile(name, avatar) {
    setProfile({ ...defaultProfile, name: name || 'Anak', avatar, year: 'Tahun 2' });
    setScreen('dashboard');
  }

  function completeOnboarding({ name, year }) {
    const nextName = name?.trim() || profile.name || 'Demo Murid';
    const nextYear = year || profile.year || 'Tahun 2';
    setProfile(prev => ({ ...prev, name: nextName, year: nextYear, isDemo: false }));
    try {
      localStorage.setItem(ONBOARDING_KEY, 'done');
    } catch {
      setRecoveryMessages(prev => [...prev, 'Status permulaan pertama tidak dapat disimpan pada peranti ini.']);
    }
    setShowOnboarding(false);
    setScreen('dashboard');
  }

  function resetProfile() {
    if (confirm('Reset semua data beta pada peranti ini? Tindakan ini tidak boleh dibatalkan.')) {
      try {
        localStorage.removeItem(PROFILE_KEY);
        LEGACY_PROFILE_KEYS.forEach(key => localStorage.removeItem(key));
        clearResume();
        localStorage.removeItem(FEEDBACK_KEY);
        localStorage.removeItem(ONBOARDING_KEY);
        AI_MEMORY_KEYS.forEach(key => localStorage.removeItem(key));
      } catch {
        setRecoveryMessages(prev => [...prev, 'Sebahagian data tidak dapat dipadam kerana simpanan peranti tidak tersedia.']);
      }
      const demoProfile = createDemoProfile();
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(demoProfile));
      } catch {
        setRecoveryMessages(prev => [...prev, 'Profil demo beta tidak dapat disimpan selepas reset.']);
      }
      setProfile(demoProfile);
      setResume(null);
      setShowOnboarding(true);
      setScreen('dashboard');
    }
  }

  function exportBetaReport() {
    const aiMemory = loadAIMemory();
    const subjects = allSubjects?.length ? allSubjects : (selectedSubject ? [selectedSubject] : []);
    const topicMastery = {
      ...(aiMemory.topicMastery || {}),
      ...buildMasteryMap(profile, subjects, aiMemory)
    };
    const masterySummary = summarizeMastery(topicMastery);
    const report = {
      metadata: {
        app: 'Jannati AI Tutor',
        status: 'CLOSED BETA',
        version: APP_VERSION,
        buildDate: APP_BUILD_DATE,
        generatedAt: new Date().toISOString()
      },
      profile: {
        name: profile.name,
        year: profile.year || 'Tahun 2',
        isDemo: Boolean(profile.isDemo),
        xp: profile.xp || 0,
        coins: profile.coins || 0,
        streak: profile.streak || 0
      },
      progress: profile.progress || {},
      mastery: {
        summary: masterySummary,
        topics: topicMastery,
        weakTopics: aiMemory.weakTopics || [],
        strongTopics: aiMemory.strongTopics || []
      },
      history: profile.history || [],
      feedback: loadFeedbackItems(),
      reading: aiMemory.readingHistory || [],
      listening: aiMemory.listeningHistory || [],
      speaking: aiMemory.speakingHistory || [],
      writing: aiMemory.writingHistory || []
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jannati-closed-beta-report-${todayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function startTopic(topic, subject = selectedSubject, options = {}) {
    const sourceQuestions = options.questions || topic.questions;
    const diversity = options.preserveQuestions
      ? { questions: sourceQuestions, score: null, debug: [], duplicateIssues: [] }
      : buildQuestionSession({
        subject,
        topic,
        questions: sourceQuestions,
        count: sourceQuestions.length,
        memory: loadAIMemory(),
        allowReinforcement: Boolean(options.allowReinforcement),
        allowAdaptiveOverride: Boolean(options.allowAdaptiveOverride),
        sessionSeed: Date.now()
      });
    const questions = diversity.questions;
    const startIndex = options.questionIndex || 0;
    const adaptiveSessionId = options.session?.adaptiveSessionId || `adaptive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startSession = { correct: 0, almost: 0, wrong: 0, xp: 0, coins: 0, percent: 0, stars: '???', answers: [], questions: [], diversityScore: diversity.score, diversityDebug: diversity.debug, ...(options.session || {}) };
    startSession.adaptiveSessionId = adaptiveSessionId;

    setActiveSubject(subject);
    setActiveTopic({ ...topic, questions, qdeScore: diversity.score, qipScore: diversity.score, qdeDebug: diversity.debug, qipDebug: diversity.debug, qdeDuplicateIssues: diversity.duplicateIssues || [], qipDuplicateIssues: diversity.duplicateIssues || [] });
    setQuestionIndex(startIndex);
    setAnswer('');
    setFeedback(null);
    setExplainOpen(false);
    setExplainData(null);
    setTeacherOpen(false);
    setTeacherData(null);
    setQuizStartedAt(Date.now());
    questionStartedAtRef.current = Date.now();
    setSession(startSession);
    setScreen('quiz');
    adaptiveSessionRef.current = {
      sessionId: adaptiveSessionId,
      subjectId: subject.id,
      topicId: topic.id,
      startedAt: new Date().toISOString()
    };
    recordSessionStart(getAdaptiveProfile(), {
      sessionId: adaptiveSessionId,
      startedAt: adaptiveSessionRef.current.startedAt,
      subjectId: subject.id,
      topicId: topic.id,
      questions: questions.map(item => item.id).filter(Boolean)
    });

    const resumeData = {
      subjectId: subject.id,
      topicId: topic.id,
      questionIndex: startIndex,
      questions,
      session: startSession,
      updatedAt: new Date().toISOString()
    };
    saveResume(resumeData);
    setResume(resumeData);
  }

  async function startResume() {
    if (!resume) return;
    const subject = await loadSubjectData(resume.subjectId);
    const topic = subject?.topics.find(t => t.id === resume.topicId);
    if (!subject || !topic) return;
    startTopic(topic, subject, {
      questions: resume.questions,
      questionIndex: resume.questionIndex,
      session: resume.session,
      preserveQuestions: true
    });
  }

  async function restartResume() {
    if (!resume) return;
    const subject = await loadSubjectData(resume.subjectId);
    const topic = subject?.topics.find(t => t.id === resume.topicId);
    clearResume();
    setResume(null);
    if (subject && topic) startTopic(topic, subject);
  }

  async function startAdaptiveLesson(recommendation) {
    const subjectId = recommendation?.nextSubject || recommendation?.subjectId;
    const topicId = recommendation?.nextTopic || recommendation?.topicId;
    const questionId = recommendation?.nextQuestionId || recommendation?.questionId;
    if (!subjectId || !topicId) return;
    const subject = allSubjects.find(item => item.id === subjectId) || await loadSubjectData(subjectId);
    const topic = subject?.topics.find(item => item.id === topicId);
    if (!subject || !topic) return;

    const targetQuestion = topic.questions.find(question => question.id === questionId);
    const remainingSoalan = topic.questions.filter(question => question.id !== questionId);
    const questions = targetQuestion ? [targetQuestion, ...shuffleArray(remainingSoalan)] : shuffleArray(topic.questions);
    startTopic(topic, subject, { questions, preserveQuestions: true, allowReinforcement: true, allowAdaptiveOverride: true });
  }

  async function startAdaptivePractice(questionCount = adaptivePracticeCount) {
    if (!allSubjects.length) return;
    const session = buildAdaptivePracticeSession(profile, allSubjects, {
      questionCount,
      mode: 'balanced',
      subjectId: selectedSubjectId,
      seed: Date.now()
    });
    if (!session.questions.length) return;

    const practiceSubject = {
      id: 'adaptive',
      title: 'Latihan AI',
      short: 'AI',
      icon: '??',
      topics: [
        {
          id: `adaptive_${session.sessionId}`,
          title: 'Latihan AI',
          note: session.metadata?.fallbackUsed ? 'Latihan permulaan seimbang' : 'Latihan adaptif berfokus',
          questions: session.questions,
          adaptivePractice: true,
          adaptiveSessionId: session.sessionId,
          adaptivePlan: session.plan,
          adaptiveMetadata: session.metadata
        }
      ]
    };
    const practiceTopic = practiceSubject.topics[0];
    startTopic(practiceTopic, practiceSubject, {
      questions: session.questions,
      preserveQuestions: true,
      session: {
        adaptivePractice: true,
        adaptiveSessionId: session.sessionId,
        adaptivePracticeMode: session.mode,
        adaptivePracticeMetadata: session.metadata,
        requestedQuestions: session.requestedQuestions,
        estimatedMinutes: session.estimatedMinutes
      }
    });
  }

  function currentQuestion() {
    return activeTopic?.questions?.[questionIndex];
  }

  function autoSave(nextIndex = questionIndex, nextSession = session) {
    if (!activeSubject || !activeTopic) return;
    const resumeData = {
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      questionIndex: nextIndex,
      questions: activeTopic.questions,
      session: nextSession,
      updatedAt: new Date().toISOString()
    };
    saveResume(resumeData);
    setResume(resumeData);
  }

  function toggleBookmark() {
    const question = currentQuestion();
    if (!question || !activeTopic || !activeSubject) return;
    const bookmarkId = `${activeSubject.id}_${activeTopic.id}_${question.id}`;
    setProfile(prev => {
      const existing = prev.bookmarks || [];
      const exists = existing.some(item => item.id === bookmarkId);
      const nextBookmarks = exists
        ? existing.filter(item => item.id !== bookmarkId)
        : [{ id: bookmarkId, subjectId: activeSubject.id, subject: activeSubject.short, topicId: activeTopic.id, topic: activeTopic.title, questionId: question.id, question: question.q, answer: question.answer, date: todayKey() }, ...existing];
      return { ...prev, bookmarks: nextBookmarks.slice(0, 100) };
    });
  }

  function toggleFavourite(subjectId, topicId, title) {
    const favId = `${subjectId}_${topicId}`;
    setProfile(prev => {
      const existing = prev.favourites || [];
      const exists = existing.some(item => item.id === favId);
      const nextFavourites = exists
        ? existing.filter(item => item.id !== favId)
        : [{ id: favId, subjectId, topicId, title, date: todayKey() }, ...existing];
      return { ...prev, favourites: nextFavourites.slice(0, 50) };
    });
  }

  function checkAnswer() {
    const question = currentQuestion();
    const result = smartCheck(answer, question);
    let xp = 0;
    let coins = 0;
    const nextSession = { ...session, answers: [...(session.answers || [])] };
    const answeredAt = new Date().toISOString();
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    const attemptNumber = (nextSession.answers || []).filter(item => item.questionId === question.id).length + 1;
    const sessionId = session.adaptiveSessionId || adaptiveSessionRef.current?.sessionId;
    const submitKey = [sessionId || 'session', question.id || 'question', attemptNumber].join('|');
    if (quizSubmitKeyRef.current === submitKey) return;
    quizSubmitKeyRef.current = submitKey;

    if (result.status === 'correct') {
      xp = 10; coins = 5; nextSession.correct += 1; beep('good');
    } else if (result.status === 'almost') {
      xp = 5; coins = 2; nextSession.almost += 1; beep('mid');
    } else {
      nextSession.wrong += 1; beep('bad');
    }

    nextSession.xp += xp;
    nextSession.coins += coins;
    nextSession.answers.push({ questionId: question.id, answer, status: result.status, correctAnswer: question.answer });
    nextSession.questions = [...(nextSession.questions || []), question];
    saveQuestionHistory(question);
    const adaptiveSubjectId = question.subjectId || activeSubject?.id;
    const adaptiveTopicId = question.topicId || activeTopic?.id;
    recordQuestionResult(getAdaptiveProfile(), {
      sessionId,
      questionId: question.id,
      subjectId: adaptiveSubjectId,
      topicId: adaptiveTopicId,
      attemptNumber,
      correct: result.status === 'correct',
      difficulty: question?.difficulty || question?.level || activeTopic?.difficulty || 'medium',
      timeSpent,
      answeredAt
    });

    setSession(nextSession);
    autoSave(questionIndex, nextSession);
    setExplainData(explainAnswer({ question, topic: activeTopic, result, userAnswer: answer }));
    setFeedback({ ...result, xp, coins, correctAnswer: question.answer, explanation: question.explanation || question.hint });
  }

  function openExplain() {
    const question = currentQuestion();
    if (!question || !feedback) return;
    setExplainData(explainAnswer({ question, topic: activeTopic, result: feedback, userAnswer: answer }));
    setExplainOpen(true);
  }

  function openTeacher() {
    const question = currentQuestion();
    if (!question) return;
    const nextExplainData = explainData || explainAnswer({ question, topic: activeTopic, result: feedback || {}, userAnswer: answer });
    setExplainData(nextExplainData);
    setTeacherData(teachAnswer({ question, topic: activeTopic, explanationData: nextExplainData }));
    setTeacherOpen(true);
  }

  function tryAgainQuestion() {
    questionStartedAtRef.current = Date.now();
    setAnswer('');
    setFeedback(null);
    setExplainOpen(false);
    setExplainData(null);
    setTeacherOpen(false);
    setTeacherData(null);
  }

  function nextQuestion() {
    if (questionIndex + 1 >= activeTopic.questions.length) {
      finishTopic();
      return;
    }
    const nextIndex = questionIndex + 1;
    questionStartedAtRef.current = Date.now();
    setQuestionIndex(nextIndex);
    setAnswer('');
    setFeedback(null);
    setExplainOpen(false);
    setExplainData(null);
    setTeacherOpen(false);
    setTeacherData(null);
    autoSave(nextIndex, session);
  }

  function finishTopic() {
    const total = activeTopic.questions.length;
    const score = session.correct + session.almost * 0.5;
    const percent = Math.round((score / total) * 100);
    const stars = getStars(percent);
    const today = todayKey();
    const key = progressKey(activeSubject.id, activeTopic.id);
    const studySeconds = Math.max(1, Math.round((Date.now() - quizStartedAt) / 1000));
    recordSessionEnd(getAdaptiveProfile(), {
      sessionId: session.adaptiveSessionId || adaptiveSessionRef.current?.sessionId,
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      questions: (session.answers || []).map(item => item.questionId).filter(Boolean),
      correct: session.correct || 0,
      wrong: session.wrong || 0,
      durationSeconds: studySeconds,
      endedAt: new Date().toISOString()
    });
    adaptiveSessionRef.current = null;

    setProfile(prev => {
      const badges = new Set(prev.badges || []);
      if (percent >= 80) badges.add(`${activeSubject.short}: ${activeTopic.title}`);
      if (percent >= 100) badges.add(`Skor Penuh: ${activeTopic.title}`);
      const oldProgress = prev.progress?.[key] || {};
      const updatedProfile = updateStoredRecommendation({
        ...prev,
        xp: (prev.xp || 0) + session.xp,
        coins: (prev.coins || 0) + session.coins,
        streak: prev.lastStudy === today ? prev.streak : (prev.streak || 0) + 1,
        lastStudy: today,
        badges: [...badges],
        history: [{ date: today, subjectId: activeSubject.id, subject: activeSubject.short, topicId: activeTopic.id, topic: activeTopic.title, percent, stars }, ...(prev.history || [])].slice(0, 50),
        progress: { ...prev.progress, [key]: { subjectId: activeSubject.id, topicId: activeTopic.id, best: Math.max(oldProgress.best || 0, percent), last: percent, stars, attempts: (oldProgress.attempts || 0) + 1, lastDate: today } }
      }, activeSubject);
      saveQuizMemory({ profile: updatedProfile, subject: activeSubject, topic: activeTopic, percent, session, studySeconds });
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });

    setSession({ ...session, percent, stars });
    clearResume();
    setResume(null);
    setScreen('finish');
  }

  function completeDailyChallenge() {
    const today = todayKey();
    setProfile(prev => {
      if (prev.daily?.[today]?.completed) return prev;
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + 50, coins: (prev.coins || 0) + 20, daily: { ...(prev.daily || {}), [today]: { completed: true, xp: 50, coins: 20 } } };
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
  }

  function saveUasaResult(result) {
    setProfile(prev => {
      const badges = new Set(prev.badges || []);
      if (result.score >= 80) badges.add('UASA A');
      const updatedProfile = {
        ...prev,
        xp: (prev.xp || 0) + Math.round(result.score / 2),
        coins: (prev.coins || 0) + Math.round(result.score / 10),
        badges: [...badges],
        uasaHistory: [result, ...(prev.uasaHistory || [])].slice(0, 20),
        history: [{ date: result.date, subject: result.subjectShort, topic: 'Simulator UASA', percent: result.score, stars: getStars(result.score) }, ...(prev.history || [])].slice(0, 50)
      };
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
  }

  function finishBacaan(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Bacaan', topic: result?.title || 'Jurulatih Bacaan', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveReadingMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  function finishMendengar(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Mendengar', topic: result?.title || 'Makmal Mendengar', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveListeningMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  function finishBertutur(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Bertutur', topic: result?.title || 'Jurulatih Bertutur', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveSpeakingMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  function finishMenulis(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Menulis', topic: result?.title || 'Jurulatih Menulis', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveWritingMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  const chatWidget = chatOpen && selectedSubject ? <AiTutorChat profile={profile} selectedSubject={selectedSubject} onTutup={() => setChatOpen(false)} /> : null;

  if (showOnboarding) return <BetaChrome recoveryMessages={recoveryMessages}><FirstRunWizard profile={profile} onComplete={completeOnboarding} /></BetaChrome>;

  if (screen === 'login') return <BetaChrome recoveryMessages={recoveryMessages}><Login onStart={startProfile} /></BetaChrome>;

  if (loadingSubject || !selectedSubject) return <BetaChrome recoveryMessages={recoveryMessages}><LoadingSkeleton /></BetaChrome>;

  if (screen === 'quiz') {
    const question = currentQuestion();
    const bookmarkId = question && activeSubject && activeTopic ? `${activeSubject.id}_${activeTopic.id}_${question.id}` : '';
    const isBookmarked = (profile.bookmarks || []).some(item => item.id === bookmarkId);
    return <BetaChrome recoveryMessages={recoveryMessages}><Quiz subject={activeSubject} topic={activeTopic} questionIndex={questionIndex} answer={answer} feedback={feedback} isBookmarked={isBookmarked} onAnswerChange={setAnswer} onCheckAnswer={checkAnswer} onNextQuestion={nextQuestion} onTryAgain={tryAgainQuestion} onExplain={openExplain} onBack={() => setScreen('dashboard')} onPetunjuk={() => setFeedback({ status: 'hint', title: 'Petunjuk', message: currentQuestion().hint })} onSpeak={() => speakText(currentQuestion().q.replaceAll('________', ' kosong '))} onBookmark={toggleBookmark} onOpenAi={() => setChatOpen(true)} /><AIExplainModal open={explainOpen} data={explainData} question={question} character={getPersonalityForSubject(activeSubject)} onTutup={() => setExplainOpen(false)} onTryAgain={tryAgainQuestion} onTeach={openTeacher} /><AITeacherModal open={teacherOpen} data={teacherData} character={getPersonalityForSubject(activeSubject)} onTutup={() => setTeacherOpen(false)} onLatih={tryAgainQuestion} />{chatWidget}</BetaChrome>;
  }

  if (screen === 'finish') {
    const nextTopic = getNextTopic(activeSubject, activeTopic);
    return <BetaChrome recoveryMessages={recoveryMessages}><Finish profile={profile} session={session} topic={activeTopic} nextTopic={nextTopic} onDashboard={() => setScreen('dashboard')} onRetry={() => activeTopic && activeSubject && startTopic(activeTopic, activeSubject)} onNextTopic={() => nextTopic && activeSubject && startTopic(nextTopic, activeSubject)} onOpenAi={() => setChatOpen(true)} /></BetaChrome>;
  }
  if (screen === 'reading') return <BetaChrome recoveryMessages={recoveryMessages}><BacaanCoach profile={profile} onBack={() => setScreen('dashboard')} onFinish={finishBacaan} /></BetaChrome>;
  if (screen === 'listening') return <BetaChrome recoveryMessages={recoveryMessages}><MendengarLab onBack={() => setScreen('dashboard')} onFinish={finishMendengar} /></BetaChrome>;
  if (screen === 'speaking') return <BetaChrome recoveryMessages={recoveryMessages}><BertuturCoach onBack={() => setScreen('dashboard')} onFinish={finishBertutur} /></BetaChrome>;
  if (screen === 'writing') return <BetaChrome recoveryMessages={recoveryMessages}><MenulisCoach onBack={() => setScreen('dashboard')} onFinish={finishMenulis} /></BetaChrome>;
  if (screen === 'parent') return <BetaChrome recoveryMessages={recoveryMessages}><ParentDashboardPage profile={profile} allSubjects={allSubjects} adaptivePracticeCount={adaptivePracticeCount} onStartAdaptivePractice={startAdaptivePractice} onBack={() => setScreen('dashboard')} /></BetaChrome>;
  if (screen === 'uasa') return <BetaChrome recoveryMessages={recoveryMessages}><UasaSimulator profile={profile} subject={selectedSubject} onBack={() => setScreen('dashboard')} onSave={saveUasaResult} /></BetaChrome>;

    return <BetaChrome recoveryMessages={recoveryMessages}><HomeDashboard profile={profile} subjectList={subjectList} allSubjects={allSubjects} selectedSubject={selectedSubject} selectedSubjectId={selectedSubjectId} totalQuestions={totalQuestions} resume={resume} dailyChallenge={buildDailyChallenge()} adaptivePracticePreview={adaptivePracticePreview} adaptivePracticeCount={adaptivePracticeCount} onAdaptivePracticeCountChange={setAdaptivePracticeCount} onSelectSubject={setSelectedSubjectId} onStartTopic={(topic) => startTopic(topic, selectedSubject)} onStartAdaptiveLesson={startAdaptiveLesson} onStartAdaptivePractice={startAdaptivePractice} onStartBacaan={() => setScreen('reading')} onStartMendengar={() => setScreen('listening')} onStartBertutur={() => setScreen('speaking')} onStartMenulis={() => setScreen('writing')} onOpenParent={() => setScreen('parent')} onOpenUasa={() => setScreen('uasa')} onOpenAi={() => setChatOpen(true)} onReset={resetProfile} onExportBetaReport={exportBetaReport} onResume={startResume} onRestartResume={restartResume} onCompleteDaily={completeDailyChallenge} onToggleFavourite={toggleFavourite} />{chatWidget}</BetaChrome>;
  }

function BetaChrome({ children, recoveryMessages = [] }) {
  return <>
    <BrandSplash />
    {children}
    {recoveryMessages.length > 0 && <StorageRecoveryNotice messages={recoveryMessages} />}
    <BetaFeedbackButton />
    <AppVersiFooter />
  </>;
}

function AppVersiFooter() {
  const buildDate = new Date(APP_BUILD_DATE);
  const displayDate = Number.isNaN(buildDate.getTime()) ? APP_BUILD_DATE : buildDate.toLocaleString();
  return <footer className="app-version-footer" aria-label="Maklumat versi aplikasi">
    <BrandLogo horizontal size="sm" className="footer-brand-logo" />    <span className="closed-beta-badge">CLOSED BETA</span>    <span><b>Versi</b> {APP_VERSION}</span>    <span><b>Build</b> {displayDate}</span>    <span><b>Maklum Balas</b> Butang beta tersedia</span>    <span><b>Hak Cipta</b> Jannati AI Tutor</span>
  </footer>;
}

function StorageRecoveryNotice({ messages }) {
  const uniqueMessages = [...new Set(messages)];
  return <aside className="storage-recovery" role="status">
    <b>Simpanan dipulihkan</b>
    <span>{uniqueMessages.join(' ')}</span>
  </aside>;
}

function FirstRunWizard({ profile, onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile.name || 'Demo Murid');
  const [year, setYear] = useState(profile.year || 'Tahun 2');
  const years = ['Tahun 1', 'Tahun 2', 'Tahun 3'];
  const steps = [
    'Selamat datang ke Jannati AI Tutor.',
    'Pilih nama murid.',
    'Pilih Tahun.',
    'Jom mula belajar!'
  ];
  const canContinue = step !== 2 || name.trim().length > 0;

  return <main className="first-run-shell">
    <section className="first-run-card" aria-labelledby="first-run-title">
      <BrandLogo full size="lg" />
      <div className="wizard-progress" aria-label="Langkah permulaan pertama">
        {steps.map((item, index) => <span key={item} className={step === index + 1 ? 'active' : step > index + 1 ? 'done' : ''}>{index + 1}</span>)}
      </div>
      {step === 1 && <div className="wizard-panel">
        <p className="eyebrow">Permulaan Beta</p>
        <h1 id="first-run-title">Selamat datang ke Jannati AI Tutor.</h1>
        <p>Pembelajaran kamu sudah sedia. Profil demo juga tersedia supaya aplikasi boleh terus diuji.</p>
      </div>}
      {step === 2 && <div className="wizard-panel">
        <p className="eyebrow">Profil Murid</p>
        <h1>Pilih nama murid.</h1>
        <label htmlFor="onboarding-name">Nama murid</label>
        <input id="onboarding-name" value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Fayyadh" autoFocus />
      </div>}
      {step === 3 && <div className="wizard-panel">
        <p className="eyebrow">Tahun Pembelajaran</p>
        <h1>Pilih Tahun.</h1>
        <div className="wizard-choice-grid">
          {years.map(item => <button key={item} type="button" className={year === item ? '' : 'secondary'} onClick={() => setYear(item)}>{item}</button>)}
        </div>
      </div>}
      {step === 4 && <div className="wizard-panel">
        <p className="eyebrow">Sedia</p>
        <h1>Jom mula belajar!</h1>
        <p>{name.trim() || 'Demo Murid'} akan menggunakan {year}. Kamu boleh reset data beta dari tetapan bila perlu.</p>
      </div>}
      <div className="wizard-actions">
        <button type="button" className="secondary" onClick={() => setStep(current => Math.max(1, current - 1))} disabled={step === 1}>Kembali</button>
        {step < 4
          ? <button type="button" onClick={() => setStep(current => Math.min(4, current + 1))} disabled={!canContinue}>Seterusnya</button>
          : <button type="button" onClick={() => onComplete({ name, year })}>Mula Belajar</button>}
      </div>
    </section>
  </main>;
}

function BetaFeedbackButton() {
  const categories = ['Pepijat', 'Cadangan', 'Kandungan', 'AI', 'Pengalaman'];
  const [open, setOpen] = useState(false);
  const [category, setKategori] = useState('Pepijat');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [screenshotDescription, setScreenshotDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function submitFeedback() {
    const trimmed = comment.trim();
    if (!trimmed) return;
    saveFeedbackItem({
      id: `feedback_${Date.now()}`,
      category,
      rating: Number(rating),
      comment: trimmed,
      message: trimmed,
      screenshotDescription: screenshotDescription.trim(),
      status: BETA_STATUS,
      version: APP_VERSION,
      buildDate: APP_BUILD_DATE,
      screen: window.location.hash || window.location.pathname,
      createdAt: new Date().toISOString()
    });
    setComment('');
    setScreenshotDescription('');
    setRating(5);
    setSaved(true);
    setTimeout(() => setOpen(false), 900);
  }

  return <>
    <button type="button" className="beta-feedback-fab" onClick={() => { setSaved(false); setOpen(true); }}>Maklum Balas Beta</button>
    {open && <div className="beta-feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="beta-feedback-title">
      <section className="beta-feedback-panel">
        <div className="beta-feedback-head"><div className="modal-brand-title"><BrandLogo iconOnly size="sm" /><div><p className="eyebrow">Beta Tertutup</p><h2 id="beta-feedback-title">Maklum Balas</h2></div></div><button ref={closeRef} type="button" className="ghost" onClick={() => setOpen(false)}>Tutup</button></div>
        <label id="feedback-category-label">Kategori</label>
        <div className="feedback-category-grid" role="group" aria-labelledby="feedback-category-label">{categories.map(item => <button type="button" key={item} className={category === item ? '' : 'secondary'} aria-pressed={category === item} onClick={() => setKategori(item)}>{item}</button>)}</div>
        <label id="feedback-rating-label">Rating</label>
        <div className="feedback-rating-grid" role="group" aria-labelledby="feedback-rating-label">{[1, 2, 3, 4, 5].map(item => <button type="button" key={item} className={rating === item ? '' : 'secondary'} aria-pressed={rating === item} onClick={() => setRating(item)}>{item}</button>)}</div>
        <label htmlFor="feedback-comment">Komen</label>
        <textarea id="feedback-comment" value={comment} onChange={event => setComment(event.target.value)} placeholder="Apa yang berlaku? Apa yang patut diperbaiki?" />
        <label htmlFor="feedback-screenshot-description">Deskripsi screenshot</label>
        <textarea id="feedback-screenshot-description" value={screenshotDescription} onChange={event => setScreenshotDescription(event.target.value)} placeholder="Terangkan apa yang kelihatan dalam screenshot, jika ada." />
        {saved && <p className="autosave-note">Maklum balas disimpan pada peranti ini.</p>}
        <button type="button" className="full" onClick={submitFeedback} disabled={!comment.trim()}>Simpan Maklum Balas</button>
      </section>
    </div>}
  </>;
}

function LoadingSkeleton() {
  return <main className="dashboard-shell skeleton-shell">
    <aside className="sidebar"><BrandLogo horizontal size="sm" /><div className="jannati-skeleton skeleton-card" /><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line" /></aside>
    <section className="dashboard-main"><section className="profile hero-card"><MascotCard character="janna" mood="waiting" size="md" animation="pulse" message={PERSONALITY_MESSAGES.loading} /><div><div className="jannati-skeleton skeleton-line wide" /><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line short" /></div></section><section className="stats">{[1, 2, 3, 4].map(item => <div className="stat" key={item}><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line short" /></div>)}</section><section className="card"><div className="jannati-skeleton skeleton-card" /></section></section>
  </main>;
}

function Quiz({ subject, topic, questionIndex, answer, feedback, isBookmarked, onAnswerChange, onCheckAnswer, onNextQuestion, onTryAgain, onExplain, onBack, onPetunjuk, onSpeak, onBookmark, onOpenAi }) {
  const question = topic.questions[questionIndex];
  const progress = Math.round(((questionIndex + 1) / topic.questions.length) * 100);
  const debugRow = question?.qde || {};
  const qipRow = question?.qip || {};
  const diversityScore = topic.qdeScore || {};
  const quizCharacter = getPersonalityForSubject(subject);
  const feedbackMood = feedback?.status === 'correct' ? 'celebrating' : feedback?.status === 'hint' ? 'thinking' : 'encouraging';
  const feedbackMessage = feedback?.status === 'correct'
    ? 'Syabas! Kamu berjaya menjawab soalan ini.'
    : feedback?.status === 'almost'
      ? 'Hampir betul. Jom kemaskan jawapan sedikit lagi.'
      : feedback?.status === 'hint'
        ? 'Fikir perlahan-lahan. Kamu boleh cuba.'
        : 'Tak mengapa. Mari kita cuba sekali lagi.';
  const feedbackTitle = feedback?.status === 'correct' ? 'Syabas!' : feedback?.status === 'almost' ? 'Hampir betul' : feedback?.status === 'hint' ? 'Petunjuk lembut' : 'Tak mengapa.';
  return <main className="app"><div className="topbar"><button className="ghost" type="button" onClick={onBack}>Papan Utama</button><span className="pill">{subject.icon} {questionIndex + 1}/{topic.questions.length}</span></div><section className="card tutor-card"><BrandLogo iconOnly /><div><p className="eyebrow">{subject.title}</p><h2>{topic.title}</h2><p>{topic.note}</p></div></section><section className="card"><div className="progress-wrap"><div className="progress" style={{ width: `${progress}%` }} /></div><h1 className="question">{question.q}</h1><input value={answer} onChange={e => onAnswerChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); feedback ? onNextQuestion() : onCheckAnswer(); } }} placeholder="Tulis jawapan di sini" autoFocus /><div className="actions"><button className="secondary" type="button" onClick={onSpeak}>Baca Soalan</button><button className="secondary" type="button" onClick={onPetunjuk}>Petunjuk</button></div><div className="actions"><button className="secondary" type="button" onClick={onBookmark}>{isBookmarked ? 'Ditanda' : 'Tanda Soalan'}</button><button className="secondary" type="button" onClick={onOpenAi}>Tanya Guru AI</button></div><button className="full" type="button" onClick={onCheckAnswer}>Semak Jawapan</button><details className="qde-debug-panel"><summary>Developer Debug</summary><dl><dt>Selected Question</dt><dd>{qipRow.metadata?.questionId || question.id || '-'}</dd><dt>Selection Reason</dt><dd>{qipRow.reasonSelected || debugRow.reason || '-'}</dd><dt>History Result</dt><dd>{JSON.stringify(qipRow.historyCheck || { historyMatch: Boolean(qipRow.historyMatch || debugRow.historyMatch) })}</dd><dt>Duplicate Result</dt><dd>{(qipRow.duplicateCheck || debugRow.duplicateCheck || ['pass']).join(', ')}</dd><dt>Diversity Score</dt><dd>{diversityScore.overallDiversity || 0}%</dd><dt>Original Stem</dt><dd>{qipRow.originalStem || question.question || '-'}</dd><dt>Selected Stem</dt><dd>{qipRow.selectedStem || question.q || '-'}</dd><dt>Variation Group</dt><dd>{qipRow.variationGroup || '-'}</dd><dt>Stem Reason</dt><dd>{qipRow.stemSelectionReason || '-'}</dd><dt>Stem Reuse</dt><dd>{qipRow.stemReuseCount || 0}</dd><dt>Original Context</dt><dd>{qipRow.originalContext || '-'}</dd><dt>Selected Context</dt><dd>{qipRow.selectedContext || '-'}</dd><dt>Context Group</dt><dd>{qipRow.contextGroup || '-'}</dd><dt>Context Reason</dt><dd>{qipRow.contextSelectionReason || '-'}</dd><dt>Context Reuse</dt><dd>{qipRow.contextReuseCount || 0}</dd><dt>Context Diversity</dt><dd>{diversityScore.contextDiversity || 0}%</dd><dt>Template</dt><dd>{qipRow.metadata?.templateId || qipRow.templateId || debugRow.templateId || debugRow.templateUsed || '-'}</dd><dt>Difficulty</dt><dd>{qipRow.metadata?.difficulty || qipRow.difficulty || debugRow.difficulty || question.difficulty || '-'}</dd></dl></details><p className="autosave-note">Simpanan automatik aktif.</p></section>{feedback && <section className={`feedback ${feedback.status}`}><MascotCard character={quizCharacter} mood={feedbackMood} size="sm" animation="gentle" message={feedbackMessage} /><h2>{feedbackTitle}</h2><p>{feedback.message}</p>{feedback.correctAnswer && <p>Jawapan tepat: <b>{feedback.correctAnswer}</b></p>}{feedback.explanation && <div className="explain-box"><b>Jannati AI Tutor</b><p>{feedback.explanation}</p></div>}{feedback.status !== 'hint' && <div className="actions"><button className="secondary" type="button" onClick={onExplain}>Terangkan</button><button className="secondary" type="button" onClick={onTryAgain}>Cuba Lagi</button><button type="button" onClick={onNextQuestion}>Seterusnya</button></div>}</section>}</main>;
}

function Finish({ profile, session, topic, nextTopic, onDashboard, onRetry, onNextTopic, onOpenAi }) {
  const passed = (session.percent || 0) >= 80;
  const finishMessage = passed ? PERSONALITY_MESSAGES.completed : PERSONALITY_MESSAGES.retry;
  return <main className="app reward-page"><section className="card finish reward-card"><MascotCard character="janna" mood={passed ? 'celebrating' : 'encouraging'} size="lg" animation="bounce" message={finishMessage} /><div className="big bounce">{passed ? '\u{1F389}' : '\u{1F4AA}'}</div><p className="eyebrow">{topic?.title || 'Topik Selesai'}</p><h1>{passed ? 'Hebat!' : 'Tak mengapa.'}</h1><p>{passed ? 'Kamu telah menamatkan latihan ini.' : 'Mari kita cuba sekali lagi dengan tenang.'}</p><div className="result-score"><b>{session.percent || 0}%</b><span>{session.stars || '\u2606\u2606\u2606'}</span></div><div className="finish-rewards"><div><b>{session.stars || '\u2606\u2606\u2606'}</b><span>Bintang</span></div><div><b>{session.xp || 0}</b><span>XP diterima</span></div><div><b>{profile?.streak || 0}</b><span>Streak</span></div></div><div className="actions"><button onClick={passed && nextTopic ? onNextTopic : onRetry}>{passed && nextTopic ? 'Teruskan Belajar' : 'Cuba Lagi'}</button><button className="secondary" onClick={onDashboard}>Papan Utama</button><button className="secondary" onClick={onOpenAi}>Tanya Guru AI</button></div></section></main>;
}

const readingPassages = [
  {
    id: 'bm-1',
    language: 'bm',
    label: 'Bahasa Melayu',
    speechLang: 'ms-MY',
    title: 'Kucing Saya',
    text: 'Saya ada seekor kucing. Kucing saya suka makan ikan dan tidur di tepi tingkap.'
  },
  {
    id: 'en-1',
    language: 'english',
    label: 'English',
    speechLang: 'en-US',
    title: 'My Garden',
    text: 'I water the flowers every morning. The small garden looks bright and happy.'
  },
  {
    id: 'arab-1',
    language: 'arab',
    label: 'Bahasa Arab',
    speechLang: 'ar-SA',
    title: '?????',
    text: '??? ?????. ??? ???? ?? ?????. ??? ??? ????? ?????.'
  }
];

function normalizeBacaanWord(word = '') {
  return word
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function splitBacaanWords(text = '') {
  return text.split(/\s+/).map(word => ({
    raw: word,
    normalized: normalizeBacaanWord(word)
  })).filter(word => word.normalized);
}

function compareBacaan(targetText = '', transcript = '') {
  const targetWords = splitBacaanWords(targetText);
  const spokenWords = splitBacaanWords(transcript);
  const used = new Set();
  let correct = 0;
  let tertinggal = 0;

  const words = targetWords.map((word, index) => {
    const exactIndex = spokenWords.findIndex((spoken, spokenIndex) => !used.has(spokenIndex) && spoken.normalized === word.normalized);
    if (exactIndex >= 0) {
      used.add(exactIndex);
      correct += 1;
      return { text: word.raw, status: 'correct' };
    }

    const nearIndex = spokenWords.findIndex((spoken, spokenIndex) => {
      return !used.has(spokenIndex) && Math.abs(spokenIndex - index) <= 2 && spoken.normalized === word.normalized;
    });
    if (nearIndex >= 0) {
      used.add(nearIndex);
      correct += 1;
      return { text: word.raw, status: 'correct' };
    }

    tertinggal += 1;
    return { text: word.raw, status: 'missed' };
  });

  const incorrectWords = spokenWords.filter((_, index) => !used.has(index));
  const score = targetWords.length ? Math.max(0, Math.round((correct / targetWords.length) * 100 - incorrectWords.length * 2)) : 0;

  return {
    words,
    correct,
    tertinggal,
    incorrect: incorrectWords.length,
    incorrectWords: incorrectWords.map(word => word.raw),
    score
  };
}

function BacaanCoach({ profile, onBack, onFinish }) {
  const [passageId, setPassageId] = useState(readingPassages[0].id);
  const [transcript, setTranscript] = useState('');
  const [listening, setMendengar] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [result, setResult] = useState(null);
  const passage = readingPassages.find(item => item.id === passageId) || readingPassages[0];

  useEffect(() => {
    setRecognitionSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    setTranscript('');
    setResult(null);
  }, [passageId]);

  function startMendengar() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = passage.speechLang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setMendengar(true);
    recognition.onend = () => setMendengar(false);
    recognition.onerror = () => setMendengar(false);
    recognition.onresult = event => {
      const text = Array.from(event.results).map(item => item[0]?.transcript || '').join(' ');
      setTranscript(text);
      setResult(compareBacaan(passage.text, text));
    };
    recognition.start();
  }

  function checkManual() {
    setResult(compareBacaan(passage.text, transcript));
  }

  function saveResult() {
    const nextResult = result || compareBacaan(passage.text, transcript);
    onFinish({
      language: passage.language,
      title: passage.title,
      targetText: passage.text,
      transcript,
      score: nextResult.score,
      correct: nextResult.correct,
      tertinggal: nextResult.missed,
      incorrect: nextResult.incorrect
    });
  }

  return <main className="app reading-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>? Papan Utama</button><span className="pill">Jurulatih Bacaan Luar Talian</span></div><section className="card reading-hero"><div className="bot medium">??</div><div><p className="eyebrow">Jurulatih Bacaan AI</p><h1>{passage.title}</h1><p>Tiada API berbayar. Guna pengecaman suara pelayar jika tersedia, atau taip jawapan secara manual.</p></div></section><section className="card"><p className="eyebrow">Pilih Petikan</p><div className="reading-tabs">{readingPassages.map(item => <button key={item.id} className={item.id === passageId ? '' : 'secondary'} onClick={() => setPassageId(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${passage.language === 'arab' ? 'rtl' : ''}`}>{passage.text}</div><div className="actions"><button onClick={startMendengar} disabled={!recognitionSupported || listening}>{listening ? 'Sedang mendengar...' : 'Mula Bercakap'}</button><button className="secondary" onClick={checkManual}>Semak Teks</button></div>{!recognitionSupported && <p className="autosave-note">Pelayar ini tidak menyokong pengecaman suara. Taip bacaan kamu di bawah.</p>}<label>Transkrip / bacaan manual</label><textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Transkrip suara atau bacaan manual..." /></section>{result && <section className="card reading-result"><p className="eyebrow">Keputusan Bacaan</p><h2>{result.score}%</h2><div className="word-check reading-word-check">{result.words.map((word, index) => <span key={`${word.text}-${index}`} className={word.status === 'correct' ? 'word-good' : 'word-miss'}>{word.text}</span>)}</div>{result.incorrectWords.length > 0 && <p>Perkataan tambahan kurang tepat: <b>{result.incorrectWords.join(', ')}</b></p>}<div className="recommend-meta"><span>{result.correct} betul</span><span>{result.missed} tertinggal</span><span>{result.incorrect} kurang tepat</span></div><button onClick={saveResult}>Simpan Keputusan Bacaan</button></section>}</main>;
}

const listeningSets = [
  { id: 'bm', language: 'BM', speechLang: 'ms-MY', title: 'BM Mendengar', prompt: 'Ibu beli roti dan susu di kedai.', choose: { question: 'Apa yang ibu beli?', options: ['Roti dan susu', 'Buku dan pensel', 'Ikan dan nasi'], answer: 'Roti dan susu' }, arrange: ['Ibu', 'beli', 'roti'], spell: 'susu', answer: { question: 'Di mana ibu membeli barang?', accepted: ['kedai', 'di kedai'] } },
  { id: 'english', language: 'English', speechLang: 'en-US', title: 'English Mendengar', prompt: 'The boy reads a book under the tree.', choose: { question: 'What does the boy read?', options: ['A book', 'A letter', 'A menu'], answer: 'A book' }, arrange: ['The', 'boy', 'reads'], spell: 'tree', answer: { question: 'Where is the boy?', accepted: ['under the tree', 'tree'] } },
  { id: 'arab', language: 'Arabic', speechLang: 'ar-SA', title: 'Arabic Mendengar', prompt: '??? ??? ??? ????.', choose: { question: 'Siapa yang disebut?', options: ['??? ????', '????', '?????'], answer: '??? ????' }, arrange: ['???', '???', '???'], spell: '???', answer: { question: 'Tulis satu perkataan yang didengar.', accepted: ['???', '???', '???', '???'] } }
];

function normalizeMendengar(text = '') {
  return normalizeBacaanWord(text).replace(/\s+/g, '');
}

function MendengarLab({ onBack, onFinish }) {
  const [setId, setSetId] = useState('bm');
  const [mode, setMode] = useState('choose');
  const [choice, setChoice] = useState('');
  const [arranged, setSusund] = useState([]);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState([]);
  const audioRef = useRef(null);
  const item = listeningSets.find(set => set.id === setId) || listeningSets[0];
  const modes = [
    { id: 'choose', label: 'Pilih' },
    { id: 'arrange', label: 'Susun' },
    { id: 'spell', label: 'Eja' },
    { id: 'answer', label: 'Answer' }
  ];

  useEffect(() => {
    setChoice('');
    setSusund([]);
    setTyped('');
    setFeedback(null);
  }, [setId, mode]);

  function playAudio() {
    if (audioRef.current?.src) {
      audioRef.current.play();
      return;
    }
    speakText(item.prompt, item.speechLang);
  }

  function submitMendengar() {
    let correct = false;
    let expected = '';
    let response = '';
    if (mode === 'choose') {
      expected = item.choose.answer;
      response = choice;
      correct = choice === expected;
    }
    if (mode === 'arrange') {
      expected = item.arrange.join(' ');
      response = arranged.join(' ');
      correct = response === expected;
    }
    if (mode === 'spell') {
      expected = item.spell;
      response = typed;
      correct = normalizeMendengar(typed) === normalizeMendengar(expected);
    }
    if (mode === 'answer') {
      expected = item.answer.accepted.join(', ');
      response = typed;
      correct = item.answer.accepted.some(answer => normalizeMendengar(answer) === normalizeMendengar(typed));
    }
    const next = { mode, correct, expected, response };
    setFeedback(next);
    setAnswers(prev => [next, ...prev.filter(answer => answer.mode !== mode)]);
  }

  function saveMendengar() {
    const total = modes.length;
    const correct = answers.filter(answer => answer.correct).length + (feedback?.correct && !answers.some(answer => answer.mode === feedback.mode) ? 1 : 0);
    const score = Math.round((correct / total) * 100);
    onFinish({ language: item.language, title: item.title, mode: 'mixed', score, correct, total });
  }

  const availableWords = item.arrange.filter(word => !arranged.includes(word));

  return <main className="app listening-lab-page"><div className="topbar"><button className="ghost" onClick={onBack}>? Papan Utama</button><span className="pill">Makmal Mendengar Luar Talian</span></div><section className="card reading-hero"><div className="bot medium">??</div><div><p className="eyebrow">Makmal Mendengar</p><h1>{item.title}</h1><p>Mesra luar talian. Audio HTML5 sedia untuk klip tempatan, dengan suara pelayar sebagai pilihan gantian.</p></div></section><section className="card"><p className="eyebrow">Bahasa</p><div className="reading-tabs">{listeningSets.map(set => <button key={set.id} className={set.id === setId ? '' : 'secondary'} onClick={() => setSetId(set.id)}>{set.language}</button>)}</div><audio ref={audioRef} controls preload="tiada" /><button className="full" onClick={playAudio}>Mainkan Audio</button></section><section className="card"><p className="eyebrow">Jenis Soalan</p><div className="reading-tabs">{modes.map(nextMode => <button key={nextMode.id} className={nextMode.id === mode ? '' : 'secondary'} onClick={() => setMode(nextMode.id)}>{nextMode.label}</button>)}</div>{mode === 'choose' && <div><h2>{item.choose.question}</h2><div className="listening-options">{item.choose.options.map(option => <button key={option} className={choice === option ? '' : 'secondary'} onClick={() => setChoice(option)}>{option}</button>)}</div></div>}{mode === 'arrange' && <div><h2>Susun perkataan yang kamu dengar</h2><div className="listening-arrange">{arranged.map(word => <button key={word} onClick={() => setSusund(prev => prev.filter(item => item !== word))}>{word}</button>)}</div><div className="listening-options">{availableWords.map(word => <button className="secondary" key={word} onClick={() => setSusund(prev => [...prev, word])}>{word}</button>)}</div></div>}{mode === 'spell' && <div><h2>Eja perkataan yang kamu dengar</h2><input value={typed} onChange={event => setTyped(event.target.value)} placeholder="Taip perkataan" /></div>}{mode === 'answer' && <div><h2>{item.answer.question}</h2><input value={typed} onChange={event => setTyped(event.target.value)} placeholder="Taip jawapan kamu" /></div>}<div className="actions"><button onClick={submitMendengar}>Semak Jawapan</button><button className="secondary" onClick={saveMendengar}>Simpan Skor Latihan</button></div>{feedback && <div className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}><h2>{feedback.correct ? 'Betul' : 'Cuba lagi'}</h2><p>Jawapan: <b>{feedback.expected}</b></p></div>}</section></main>;
}

const speakingPrompts = [
  {
    id: 'bm',
    language: 'BM',
    speechLang: 'ms-MY',
    title: 'BM Bertutur',
    prompts: {
      intro: { label: 'Kenalkan diri', text: 'Perkenalkan diri kamu.', keywords: ['nama', 'umur', 'saya'] },
      describe: { label: 'Ceritakan gambar atau arahan', text: 'Ceritakan tentang taman yang cantik dengan bunga dan pokok.', keywords: ['taman', 'bunga', 'pokok'] },
      answer: { label: 'Jawab soalan mudah', text: 'Apakah makanan kegemaran kamu?', keywords: ['makanan', 'suka'] },
      repeat: { label: 'Ulang ayat', text: 'Saya suka belajar bersama Jannati AI Tutor.', keywords: ['saya', 'suka', 'belajar', 'jannati'] }
    }
  },
  {
    id: 'english',
    language: 'English',
    speechLang: 'en-US',
    title: 'English Bertutur',
    prompts: {
      intro: { label: 'Kenalkan diri', text: 'Kenalkan diri in one sentence.', keywords: ['name', 'old', 'like'] },
      describe: { label: 'Ceritakan gambar atau arahan', text: 'Describe a sunny park with children playing.', keywords: ['park', 'children', 'sunny'] },
      answer: { label: 'Jawab soalan mudah', text: 'What do you like to read?', keywords: ['read', 'book', 'like'] },
      repeat: { label: 'Ulang ayat', text: 'I can speak clearly and confidently.', keywords: ['speak', 'clearly', 'confidently'] }
    }
  },
  {
    id: 'arab',
    language: 'Arabic',
    speechLang: 'ar-SA',
    title: 'Arabic Bertutur',
    prompts: {
      intro: { label: 'Kenalkan diri', text: '??? ???? ????? ?????.', keywords: ['???', '????'] },
      describe: { label: 'Ceritakan gambar atau arahan', text: '?? ???? ????? ??? ??? ??????.', keywords: ['???', '????', '???'] },
      answer: { label: 'Jawab soalan mudah', text: '???? ????', keywords: ['???', '???'] },
      repeat: { label: 'Ulang ayat', text: '??? ????? ????? ???????.', keywords: ['???', '?????', '???????'] }
    }
  }
];

function scoreBertutur(prompt, transcript) {
  const normalizedTranscript = normalizeBacaanWord(transcript);
  const matched = prompt.keywords.filter(keyword => normalizedTranscript.includes(normalizeBacaanWord(keyword)));
  const keywordScore = prompt.keywords.length ? Math.round((matched.length / prompt.keywords.length) * 80) : 0;
  const lengthBonus = transcript.trim().split(/\s+/).filter(Boolean).length >= Math.min(5, prompt.keywords.length + 2) ? 20 : 8;
  return {
    score: Math.min(100, keywordScore + lengthBonus),
    matched,
    tertinggal: prompt.keywords.filter(keyword => !matched.includes(keyword))
  };
}

function BertuturCoach({ onBack, onFinish }) {
  const [setId, setSetId] = useState('bm');
  const [mode, setMode] = useState('intro');
  const [transcript, setTranscript] = useState('');
  const [listening, setMendengar] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [result, setResult] = useState(null);
  const set = speakingPrompts.find(item => item.id === setId) || speakingPrompts[0];
  const prompt = set.prompts[mode];
  const modes = Object.entries(set.prompts).map(([id, value]) => ({ id, label: value.label }));

  useEffect(() => {
    setRecognitionSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    setTranscript('');
    setResult(null);
  }, [setId, mode]);

  function startBertutur() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = set.speechLang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setMendengar(true);
    recognition.onend = () => setMendengar(false);
    recognition.onerror = () => setMendengar(false);
    recognition.onresult = event => {
      const text = Array.from(event.results).map(item => item[0]?.transcript || '').join(' ');
      setTranscript(text);
      setResult(scoreBertutur(prompt, text));
    };
    recognition.start();
  }

  function checkBertutur() {
    setResult(scoreBertutur(prompt, transcript));
  }

  function saveBertutur() {
    const nextResult = result || scoreBertutur(prompt, transcript);
    onFinish({
      language: set.language,
      title: set.title,
      mode,
      transcript,
      score: nextResult.score,
      matchedKeywords: nextResult.matched.length,
      totalKeywords: prompt.keywords.length
    });
  }

  return <main className="app speaking-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>? Papan Utama</button><span className="pill">Jurulatih Bertutur Luar Talian</span></div><section className="card reading-hero"><div className="bot medium">???</div><div><p className="eyebrow">Jurulatih Bertutur</p><h1>{set.title}</h1><p>Tiada API berbayar. Guna pengecaman suara pelayar jika tersedia, atau taip transkrip secara manual.</p></div></section><section className="card"><p className="eyebrow">Bahasa</p><div className="reading-tabs">{speakingPrompts.map(item => <button key={item.id} className={item.id === setId ? '' : 'secondary'} onClick={() => setSetId(item.id)}>{item.language}</button>)}</div><p className="eyebrow">Jenis Soalan</p><div className="speaking-mode-grid">{modes.map(item => <button key={item.id} className={item.id === mode ? '' : 'secondary'} onClick={() => setMode(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${set.id === 'arab' ? 'rtl' : ''}`}>{prompt.text}</div><div className="actions"><button onClick={startBertutur} disabled={!recognitionSupported || listening}>{listening ? 'Sedang mendengar...' : 'Mula Bercakap'}</button><button className="secondary" onClick={checkBertutur}>Semak Transkrip</button></div>{!recognitionSupported && <p className="autosave-note">Pelayar ini tidak menyokong pengecaman suara. Taip apa yang kamu sebut di bawah.</p>}<label>Transkrip / pertuturan manual</label><textarea value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Transkrip suara atau jawapan manual..." /></section>{result && <section className="card reading-result"><p className="eyebrow">Keputusan Bertutur</p><h2>{result.score}%</h2><div className="recommend-meta"><span>{result.matched.length}/{prompt.keywords.length} kata kunci</span><span>Mod {mode}</span><span>{set.language}</span></div><div className="word-check reading-word-check">{prompt.keywords.map(keyword => <span key={keyword} className={result.matched.includes(keyword) ? 'word-good' : 'word-miss'}>{keyword}</span>)}</div>{result.missed.length > 0 && <p>Cuba masukkan: <b>{result.missed.join(', ')}</b></p>}<button onClick={saveBertutur}>Simpan Keputusan Bertutur</button></section>}</main>;
}

const writingSets = [
  {
    id: 'bm',
    language: 'BM',
    title: 'BM Menulis',
    dictionary: ['saya', 'makan', 'nasi', 'di', 'rumah', 'kucing', 'tidur', 'atas', 'tikar', 'ibu', 'beli', 'roti', 'suka', 'belajar', 'kerana', 'seronok', 'taman', 'bunga', 'cantik'],
    tasks: {
      arrange: { label: 'Susun ayat', prompt: 'Susun ayat.', words: ['Saya', 'makan', 'nasi'], answer: 'Saya makan nasi', keywords: ['saya', 'makan', 'nasi'] },
      blank: { label: 'Isi tempat kosong', prompt: 'Saya ____ nasi di rumah.', answer: 'makan', keywords: ['makan'] },
      short: { label: 'Jawapan pendek', prompt: 'Apakah haiwan kesukaan kamu?', keywords: ['suka', 'kucing'] },
      build: { label: 'Bina ayat', prompt: 'Bina ayat dengan perkataan: taman, bunga.', keywords: ['taman', 'bunga'] },
      paragraph: { label: 'Perenggan mudah', prompt: 'Tulis 2 ayat tentang belajar.', keywords: ['saya', 'belajar', 'seronok'] }
    }
  },
  {
    id: 'english',
    language: 'English',
    title: 'English Menulis',
    dictionary: ['i', 'like', 'books', 'read', 'school', 'garden', 'flowers', 'sunny', 'cat', 'sleeps', 'on', 'mat', 'learn', 'because', 'happy', 'play', 'friend'],
    tasks: {
      arrange: { label: 'Susun ayat', prompt: 'Susun the sentence.', words: ['I', 'like', 'books'], answer: 'I like books', keywords: ['i', 'like', 'books'] },
      blank: { label: 'Isi tempat kosong', prompt: 'The cat sleeps ____ the mat.', answer: 'on', keywords: ['on'] },
      short: { label: 'Jawapan pendek', prompt: 'What do you like to read?', keywords: ['like', 'read', 'book'] },
      build: { label: 'Bina ayat', prompt: 'Build a sentence with: garden, flowers.', keywords: ['garden', 'flowers'] },
      paragraph: { label: 'Perenggan mudah', prompt: 'Write 2 sentences about school.', keywords: ['school', 'learn', 'friend'] }
    }
  },
  {
    id: 'arab',
    language: 'Arabic',
    title: 'Arabic Menulis',
    dictionary: ['???', '???', '???', '???', '????', '????', '??', '?????', '?????', '???????', '????', '???', '?????'],
    tasks: {
      arrange: { label: 'Susun ayat', prompt: '??? ??????.', words: ['???', '???', '???'], answer: '??? ??? ???', keywords: ['???', '???', '???'] },
      blank: { label: 'Isi tempat kosong', prompt: '??? ____ ???????.', answer: '?????', keywords: ['?????'] },
      short: { label: 'Jawapan pendek', prompt: '???? ????', keywords: ['???'] },
      build: { label: 'Bina ayat', prompt: '???? ???? ????: ???? ????.', keywords: ['???', '????'] },
      paragraph: { label: 'Perenggan mudah', prompt: '???? ?????? ?? ???????.', keywords: ['?????', '????'] }
    }
  }
];

function scoreMenulis(task, answer, dictionary = []) {
  const normalizedAnswer = normalizeBacaanWord(answer);
  const matched = task.keywords.filter(keyword => normalizedAnswer.includes(normalizeBacaanWord(keyword)));
  const words = splitBacaanWords(answer);
  const spellingIssues = words.filter(word => {
    if (!dictionary.length || word.normalized.length <= 1) return false;
    return !dictionary.some(item => normalizeBacaanWord(item) === word.normalized);
  });
  const grammarPetunjuks = [];
  if (answer.trim() && !/[.!??]$/.test(answer.trim())) grammarPetunjuks.push('Tambah tanda noktah di hujung ayat.');
  if (task.label === 'Perenggan mudah' && answer.split(/[.!??]+/).filter(sentence => sentence.trim()).length < 2) grammarPetunjuks.push('Tulis sekurang-kurangnya dua ayat pendek.');
  if (task.label !== 'Isi tempat kosong' && words.length < Math.max(2, task.keywords.length)) grammarPetunjuks.push('Panjangkan jawapan sedikit lagi.');
  const keywordScore = task.keywords.length ? Math.round((matched.length / task.keywords.length) * 60) : 0;
  const spellingScore = Math.max(0, 20 - spellingIssues.length * 5);
  const grammarScore = Math.max(0, 20 - grammarPetunjuks.length * 6);
  const exactBonus = task.answer && normalizeBacaanWord(answer) === normalizeBacaanWord(task.answer) ? 20 : 0;
  const score = Math.min(100, keywordScore + spellingScore + grammarScore + exactBonus);
  const explanation = matched.length === task.keywords.length
    ? 'Bagus. Kamu masukkan idea penting dan ayat mudah disemak.'
    : `Cuba masukkan idea penting ini: ${task.keywords.filter(keyword => !matched.includes(keyword)).join(', ') || 'tiada'}.`;
  return { score, matched, spellingIssues, grammarPetunjuks, explanation };
}

function MenulisCoach({ onBack, onFinish }) {
  const [setId, setSetId] = useState('bm');
  const [mode, setMode] = useState('arrange');
  const [answer, setAnswer] = useState('');
  const [arranged, setSusund] = useState([]);
  const [result, setResult] = useState(null);
  const set = writingSets.find(item => item.id === setId) || writingSets[0];
  const task = set.tasks[mode];
  const modes = Object.entries(set.tasks).map(([id, value]) => ({ id, label: value.label }));

  useEffect(() => {
    setAnswer('');
    setSusund([]);
    setResult(null);
  }, [setId, mode]);

  function currentAnswer() {
    return mode === 'arrange' ? arranged.join(' ') : answer;
  }

  function checkMenulis() {
    setResult(scoreMenulis(task, currentAnswer(), set.dictionary));
  }

  function saveMenulis() {
    const nextResult = result || scoreMenulis(task, currentAnswer(), set.dictionary);
    onFinish({
      language: set.language,
      title: set.title,
      mode,
      answer: currentAnswer(),
      score: nextResult.score,
      matchedKeywords: nextResult.matched.length,
      totalKeywords: task.keywords.length,
      spellingIssues: nextResult.spellingIssues.length,
      grammarPetunjuks: nextResult.grammarPetunjuks
    });
  }

  const availableWords = (task.words || []).filter(word => !arranged.includes(word));

  return <main className="app writing-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>? Papan Utama</button><span className="pill">Jurulatih Menulis Luar Talian</span></div><section className="card reading-hero"><div className="bot medium">??</div><div><p className="eyebrow">Jurulatih Menulis</p><h1>{set.title}</h1><p>Tiada API berbayar. Semakan kata kunci, ejaan, petua tatabahasa dan penerangan gaya AI dibuat secara luar talian.</p></div></section><section className="card"><p className="eyebrow">Bahasa</p><div className="reading-tabs">{writingSets.map(item => <button key={item.id} className={item.id === setId ? '' : 'secondary'} onClick={() => setSetId(item.id)}>{item.language}</button>)}</div><p className="eyebrow">Jenis Soalan</p><div className="writing-mode-grid">{modes.map(item => <button key={item.id} className={item.id === mode ? '' : 'secondary'} onClick={() => setMode(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${set.id === 'arab' ? 'rtl' : ''}`}>{task.prompt}</div>{mode === 'arrange' ? <><div className="listening-arrange">{arranged.map(word => <button key={word} onClick={() => setSusund(prev => prev.filter(item => item !== word))}>{word}</button>)}</div><div className="listening-options">{availableWords.map(word => <button className="secondary" key={word} onClick={() => setSusund(prev => [...prev, word])}>{word}</button>)}</div></> : <textarea value={answer} onChange={event => setAnswer(event.target.value)} placeholder={mode === 'blank' ? 'Taip perkataan yang hilang' : 'Tulis jawapan kamu di sini'} /> }<div className="actions"><button onClick={checkMenulis}>Semak Tulisan</button><button className="secondary" onClick={saveMenulis}>Simpan Keputusan Menulis</button></div></section>{result && <section className="card reading-result"><p className="eyebrow">Keputusan Menulis</p><h2>{result.score}%</h2><div className="recommend-meta"><span>{result.matched.length}/{task.keywords.length} kata kunci</span><span>{result.spellingIssues.length} isu ejaan</span><span>{result.grammarPetunjuks.length} petua tatabahasa</span></div><div className="word-check reading-word-check">{task.keywords.map(keyword => <span key={keyword} className={result.matched.includes(keyword) ? 'word-good' : 'word-miss'}>{keyword}</span>)}</div>{result.spellingIssues.length > 0 && <p>Semak ejaan: <b>{result.spellingIssues.map(word => word.raw).join(', ')}</b></p>}{result.grammarPetunjuks.length > 0 && <div className="explain-box"><b>Petua tatabahasa</b><p>{result.grammarPetunjuks.join(' ')}</p></div>}<div className="explain-box"><b>Penerangan AI</b><p>{result.explanation}</p></div></section>}</main>;
}

function Stat({ icon, label, value }) {
  return <div className="stat"><span className="stat-icon">{icon}</span><b>{value}</b><span>{label}</span></div>;
}




