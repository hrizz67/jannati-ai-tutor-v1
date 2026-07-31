import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { subjectList, loadSubjectData, loadAllSubjects } from './data/subjects';
import { smartCheck } from './utils/smartCheck';
import { beep } from './utils/speech';
const AIExplainModal = React.lazy(() => import('./components/ai/AIExplainModal'));
const AITeacherModal = React.lazy(() => import('./components/ai/AITeacherModal'));
import BrandLogo from './components/BrandLogo';
import MascotCard from './components/MascotCard';
import JannaAvatar from './components/JannaAvatar';
import JatiAvatar from './components/JatiAvatar';
import VoiceButton from './components/VoiceButton.jsx';
import GamificationSummary from './components/GamificationSummary.jsx';
import TutorAIModal from './components/ai/TutorAIModal.jsx';
import IconGlyph from './components/IconGlyph.jsx';
import { explainAnswer } from './ai/explainEngine';
import { updateStoredRecommendation } from './ai/recommendationEngine';
import { buildAdaptiveRecommendation } from './ai/adaptiveEngine';
import { loadProfile as loadAdaptiveStudentProfile, resetProfile as resetAdaptiveStudentProfile } from './ai/adaptive/storageEngine';
import { rankStrongTopics, rankWeakTopics } from './ai/adaptive/weakTopicEngine';
import { getPredictionProfile } from './ai/prediction/predictionProfile';
import { getReadiness } from './ai/prediction/readinessEngine';
import { buildStudyPlan } from './ai/prediction/studyPlanEngine';
import { forecastMastery } from './ai/prediction/masteryForecastEngine';
import { buildCoachingDecision } from './ai/coach/coachingEngine';
import { buildTeachingStrategy } from './ai/coach/adaptiveTeachingEngine';
import { buildCoachAdapterData, getCoachExplainData, getCoachTeacherData } from './ai/coach/coachAdapter';
import { buildPersonalityResponse } from './ai/personality/personalityEngine.js';
import { buildLearningObservation } from './ai/observation/learningObservationEngine.js';
import { buildNarrativeBundle } from './ai/narrative/narrativeEngine.js';
import { speak, stop as stopVoice } from './ai/voice/voiceEngine.js';
import { buildMasteryMap, summarizeMastery } from './ai/adaptive/masteryEngine';
import { buildAdaptivePracticeSession, getAdaptivePracticeSummary } from './ai/adaptive/adaptivePracticeEngine';
import { loadGamificationProfile as loadGamificationState, recordGamificationEvent, resetGamificationProfile } from './ai/gamification/gamificationEngine';
import { getAdaptiveProfile, recordQuestionResult, recordSessionEnd, recordSessionStart } from './ai/adaptive/adaptiveSessionEngine';
import { buildSmartQuestionSession, createSmartQuestionSeed, loadSmartQuestionState, recordSmartQuestionState, resetSmartQuestionState } from './ai/questionGenerator/smartQuestionGenerator';
import { createSpeechSession, extractSpeechTranscript as extractSpeechTranscriptShared, supportsSpeechRecognition } from './ai/speech/speechEngine.js';
import { createReadingSpeechSession } from './ai/speech/speechSession.js';
import { teachAnswer } from './ai/teacherEngine';
import { sanitizeAiText } from './ai/learningCopy';
import { loadAIMemory, saveQuizMemory, saveQuestionHistory, saveReadingMemory, saveListeningMemory, saveSpeakingMemory, saveWritingMemory } from './ai/memoryEngine';
import { loadStudentCore, saveStudentCore } from './ai/studentIntelligence';
import { buildQuestionSession } from './ai/question/questionEngine';
import { PERSONALITY_MESSAGES, getPersonalityForSubject } from './brand/personalities';
import { clampPercent, formatScopeLabel, formatStatus, formatTopicName, getStudentDisplayName } from './utils/displayFormatter';
import { readSubjectScoped, writeSubjectScoped, clearSubjectScoped } from './utils/subjectScopedStorage.js';
import { createCanonicalProgress } from './utils/canonicalProgress.js';
import { matchesCoachContext, resolveCoachContextSnapshot } from './ai/coach/contextSnapshot.js';
import { getAcceptedAnswers } from './utils/acceptedAnswers.js';
import {
  appendUniqueCommunicationResult,
  buildCommunicationSessionSummary,
  normalizeCommunicationAttempt,
  normalizeCommunicationResult,
  sanitizeCommunicationScoreHistory
} from './utils/communicationResult.js';
import { semanticListeningSets, semanticSpeakingPrompts, semanticWritingSets, semanticReadingPassages } from './data/communicationContent.js';
const HomeDashboard = React.lazy(() => import('./dashboard/HomeDashboard'));
const ParentDashboardPage = React.lazy(() => import('./dashboard/ParentDashboard'));
import { EmptyState } from './dashboard/dashboardHelpers.jsx';
import ProductionErrorBoundary from './components/ProductionErrorBoundary.jsx';

const PROFILE_KEY = 'jannati_v151_profile';
const RESUME_KEY = 'jannati_v151_resume';
const FEEDBACK_KEY = 'jannati_beta_feedback';
const ONBOARDING_KEY = 'jannati_closed_beta_onboarding_v1';
const AI_MEMORY_KEYS = ['jannati_v151_ai_memory', 'jannati_v150_ai_memory', 'jannati_v140_ai_memory'];
const LEGACY_PROFILE_KEYS = ['jannati_v150_profile', 'jannati_v140_profile'];
const LEGACY_RESUME_KEYS = ['jannati_v150_resume', 'jannati_v140_resume'];
const BETA_STATUS = 'Beta Tertutup';
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'local';
const APP_BUILD_DATE = typeof __APP_BUILD_DATE__ !== 'undefined' ? __APP_BUILD_DATE__ : new Date().toISOString();
const storageRecoveryEvents = [];

const defaultProfile = {
  name: '',
  avatar: 'janna',
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
    avatar: 'janna',
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
    if (saved) {
      const parsed = normalizeResumeData(JSON.parse(saved));
      if (parsed) return parsed;
      clearResume();
    }

    for (const key of LEGACY_RESUME_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        const parsed = normalizeResumeData(JSON.parse(legacy));
        if (parsed) {
          localStorage.setItem(RESUME_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    }
  } catch {
    storageRecoveryEvents.push('Data sambung latihan telah dipulihkan kerana simpanan peranti rosak.');
    clearResume();
  }

  return null;
}

function normalizeStars(value) {
  const text = String(value ?? '').replace(/\s+/g, '').trim();
  if (!text) return '☆☆☆';
  if (/^[★☆]+$/.test(text)) return text;
  const score = Number(text);
  if (Number.isFinite(score)) return getStars(score);
  const count = (text.match(/[★⭐]/g) || []).length;
  if (count >= 3) return '★★★';
  if (count === 2) return '★★';
  if (count === 1) return '★';
  return '☆☆☆';
}

function getTopicDisplayName(topic = {}, fallback = '-') {
  const raw = topic?.title || topic?.topicId || topic?.id || '';
  const label = formatTopicName(raw);
  return label && label !== ' ' ? label : fallback;
}

function saveResume(data) {
  try {
    const normalized = normalizeResumeData(data);
    if (!normalized) return;
    localStorage.setItem(RESUME_KEY, JSON.stringify(normalized));
  } catch {
    storageRecoveryEvents.push('Simpanan automatik latihan tidak dapat dibuat kerana simpanan peranti tidak tersedia.');
  }
}

function clearResume() {
  localStorage.removeItem(RESUME_KEY);
  LEGACY_RESUME_KEYS.forEach(key => localStorage.removeItem(key));
}

function normalizeResumeData(value) {
  if (!value || typeof value !== 'object') return null;
  const state = value.state && typeof value.state === 'object' ? value.state : {};
  const session = value.session && typeof value.session === 'object'
    ? value.session
    : state.session && typeof state.session === 'object'
      ? state.session
      : null;
  const questions = Array.isArray(value.questions)
    ? [...value.questions]
    : Array.isArray(value.questionIds)
      ? [...value.questionIds]
      : Array.isArray(state.questions)
        ? [...state.questions]
        : Array.isArray(state.questionIds)
          ? [...state.questionIds]
          : null;
  const subjectId = value.subjectId || value.subject || state.subjectId || state.subject || null;
  const topicId = value.topicId || value.topic || state.topicId || state.topic || null;
  const mode = value.mode || value.screen || state.mode || state.screen || 'quiz';
  const questionIndexValue = Number.isInteger(value.currentIndex)
    ? value.currentIndex
    : Number.isInteger(value.questionIndex)
      ? value.questionIndex
      : Number.isInteger(state.currentIndex)
        ? state.currentIndex
        : Number.isInteger(state.questionIndex)
          ? state.questionIndex
          : 0;
  const answers = Array.isArray(value.answers)
    ? [...value.answers]
    : Array.isArray(state.answers)
      ? [...state.answers]
      : Array.isArray(session?.answers)
        ? [...session.answers]
        : [];
  const metadata = {
    ...(state.metadata || {}),
    ...(value.metadata || {})
  };
  const normalized = {
    version: Number(value.version || state.version || 1),
    mode,
    screen: value.screen || state.screen || mode,
    sessionId: value.sessionId || session?.adaptiveSessionId || state.sessionId || state.adaptiveSessionId || null,
    subjectId,
    topicId,
    questions,
    questionIds: Array.isArray(value.questionIds)
      ? [...value.questionIds]
      : Array.isArray(state.questionIds)
        ? [...state.questionIds]
        : questions?.map(item => item?.id).filter(Boolean) || [],
    currentIndex: questionIndexValue,
    questionIndex: questionIndexValue,
    answers,
    score: Number(value.score ?? state.score ?? session?.percent ?? 0),
    correct: Number(value.correct ?? state.correct ?? session?.correct ?? 0),
    wrong: Number(value.wrong ?? state.wrong ?? session?.wrong ?? 0),
    xp: Number(value.xp ?? state.xp ?? session?.xp ?? 0),
    coins: Number(value.coins ?? state.coins ?? session?.coins ?? 0),
    attemptNumber: Number(value.attemptNumber ?? state.attemptNumber ?? session?.attemptNumber ?? 0),
    metadata,
    startedAt: value.startedAt || state.startedAt || session?.startedAt || new Date().toISOString(),
    updatedAt: value.updatedAt || state.updatedAt || new Date().toISOString(),
    completed: Boolean(value.completed ?? state.completed ?? false),
    session,
    state: {
      ...state,
      ...value.state,
      session,
      metadata
    }
  };
  if (!mode) return null;
  const questionModes = new Set(['quiz', 'adaptive-practice', 'adaptive-lesson']);
  if (questionModes.has(mode)) {
    if (!subjectId || !topicId || !normalized.questions?.length) return null;
  } else if (mode === 'uasa') {
    if (!subjectId || !normalized.questions?.length) return null;
  } else if (['reading', 'listening', 'speaking', 'writing'].includes(mode)) {
    const hasState = Boolean(normalized.state?.passageId || normalized.state?.setId || normalized.state?.task || normalized.state?.prompt || normalized.state?.title);
    if (!hasState) return null;
  }
  return normalized;
}

function persistResumeData(data, setResume) {
  const normalized = normalizeResumeData(data);
  if (!normalized) return null;
  saveResume(normalized);
  setResume(normalized);
  return normalized;
}

function clearResumeData(setResume) {
  clearResume();
  setResume(null);
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
  if (score >= 90) return '★★★';
  if (score >= 70) return '★★';
  if (score >= 50) return '★';
  return '☆☆☆';
}

function RewardBadgeIcon({ className = '' }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      width="1em"
      height="1em"
    >
      <path d="M20 6h10l2 12-12 8-12-8 2-12h10Z" fill="#E2A81B" />
      <path d="M34 6h10l2 12-12 8-12-8 2-12h10Z" fill="#F4B400" />
      <circle cx="32" cy="34" r="20" fill="#F7C948" />
      <path
        d="M32 22l3.58 7.25 8 1.16-5.79 5.64 1.37 7.97L32 39.25l-7.16 3.77 1.37-7.97-5.79-5.64 8-1.16L32 22Z"
        fill="#FFF8D6"
      />
      <circle cx="32" cy="34" r="19" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="1.5" />
    </svg>
  );
}

function AdaptivePracticeBadgeIcon({ className = '' }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      width="1em"
      height="1em"
    >
      <path
        d="M32 8l5.4 13.3L51 27l-13.6 5.8L32 46l-5.4-13.2L13 27l13.6-5.7L32 8Z"
        fill="#3CB371"
      />
      <path d="M32 18l3.1 7.6L43 29l-7.9 3.4L32 40l-3.1-7.6L21 29l7.9-3.4L32 18Z" fill="#FFF" opacity=".9" />
      <circle cx="49" cy="15" r="3" fill="#F4D35E" />
      <circle cx="14" cy="50" r="2.5" fill="#F4D35E" />
    </svg>
  );
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
  if (streak >= 7) return 'Hebat! Teruskan usaha ini.';
  if (streak >= 3) return 'Bagus! Teruskan langkah ini.';
  return 'Belajar lagi hari ini.';
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

function buildDailyChallenge(observation = null) {
  const mission = observation?.dailyMission?.items || [];
  if (mission.length) {
    return mission.map((label, index) => ({ subjectId: `mission-${index}`, count: 0, label }));
  }
  return [
    { subjectId: 'bm', count: 5, label: '5 soalan BM' },
    { subjectId: 'math', count: 5, label: '5 soalan Matematik' },
    { subjectId: 'english', count: 3, label: '3 soalan Bahasa Inggeris' },
    { subjectId: 'sains', count: 2, label: '2 soalan Sains' }
  ];
}

function buildUasaSet(subject, count = 20) {
  const profile = loadAdaptiveStudentProfile();
  const memory = loadAIMemory();
  const gamificationProfile = loadGamificationState();
  const subjectQuestions = (subject?.topics || []).flatMap(topic => (topic?.questions || []).map(question => ({
    ...question,
    subjectId: subject.id,
    subjectTitle: subject.title,
    topicId: topic.id,
    topicTitle: topic.title
  })));
  const learningObservation = buildLearningObservation(profile, memory, { subjects: [subject], profile });
  const predictionProfile = getPredictionProfile(profile, memory, { subjectId: subject?.id });
  const readiness = getReadiness(profile, memory, { subjectId: subject?.id });
  const smartSet = buildSmartQuestionSession(subjectQuestions, {
    mode: 'uasa',
    subject,
    profile,
    memory,
    learningObservation,
    predictionProfile,
    readiness,
    gamificationProfile,
    count,
    smartState: loadSmartQuestionState()
  });
  const orderedQuestions = smartSet.questions.length ? smartSet.questions : subjectQuestions;
  const sessionSeed = smartSet.variationSeed || createSmartQuestionSeed([
    subject?.id || '',
    subject?.title || '',
    count,
    profile.totalQuestions || 0,
    profile.streak || 0,
    memory?.history?.length || 0
  ]);
  return buildQuestionSession({
    subject,
    questions: orderedQuestions,
    count,
    memory,
    sessionSeed
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

function buildPredictionGreeting(profile, predictionProfile, readiness, studyPlan) {
  const name = getStudentDisplayName(profile, 'Murid');
  const readinessText = readiness?.message || 'Teruskan usaha kamu hari ini.';
  const focusText = studyPlan?.notes || 'Ikut cadangan latihan yang seimbang.';
  const teachingStyle = predictionProfile?.teachingStrategy?.teachingStyle || 'guided';
  const teachingStyleLabel = {
    guided: 'berpandu',
    discussion: 'perbincangan',
    challenge: 'cabaran',
    independent: 'kendiri',
    visual: 'visual',
    auditory: 'pendengaran',
    practice: 'latihan',
    balanced: 'seimbang'
  }[teachingStyle] || teachingStyle;
  return `Assalamualaikum, ${name}. ${readinessText} Gaya belajar hari ini ialah ${teachingStyleLabel}. ${focusText}`;
}

export default function App() {
  const [profile, setProfile] = useState(() => loadStudentCore(loadProfile()));
  const [adaptiveProfile, setAdaptiveProfile] = useState(() => loadAdaptiveStudentProfile());
  const [gamificationProfile, setGamificationProfile] = useState(() => loadGamificationState());
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
  const [session, setSession] = useState({ correct: 0, almost: 0, wrong: 0, xp: 0, coins: 0, percent: 0, stars: '☆☆☆', answers: [] });
  const [chatOpen, setChatOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainData, setExplainData] = useState(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [coachKnowledgeData, setCoachKnowledgeData] = useState(null);
  const coachRequestRef = useRef({ requestId: 0, open: false, mode: '', snapshot: null });
  const [quizStartedAt, setQuizStartedAt] = useState(Date.now());
  const [adaptivePracticeCount, setAdaptivePracticeCount] = useState(10);
  const modalOpen = chatOpen || explainOpen || teacherOpen;
  const canonicalProgress = useMemo(() => createCanonicalProgress({
    ...(profile || {}),
    ...(adaptiveProfile || {}),
    history: profile?.history || adaptiveProfile?.events || [],
    subjects: adaptiveProfile?.subjects || profile?.subjects,
    topics: adaptiveProfile?.topics || profile?.topics
  }), [profile, adaptiveProfile]);
  const adaptiveSessionRef = useRef(null);
  const questionStartedAtRef = useRef(Date.now());
  const quizSubmitKeyRef = useRef('');
  const aiMemory = useMemo(() => loadAIMemory(), [profile.history, profile.progress, profile.xp, adaptiveProfile.updatedAt, adaptiveProfile.totalQuestions, adaptiveProfile.studyMinutes]);
  const learningObservation = useMemo(() => buildLearningObservation(adaptiveProfile, aiMemory, { subjects: allSubjects, profile }), [adaptiveProfile, aiMemory, allSubjects, profile]);
  const predictionProfile = useMemo(() => getPredictionProfile(adaptiveProfile, aiMemory, { subjectId: selectedSubject?.id, topicId: activeTopic?.id }), [adaptiveProfile, aiMemory, selectedSubject?.id, activeTopic?.id]);
  const readiness = useMemo(() => getReadiness(adaptiveProfile, aiMemory, { subjectId: selectedSubject?.id, topicId: activeTopic?.id }), [adaptiveProfile, aiMemory, selectedSubject?.id, activeTopic?.id]);
  const studyPlan = useMemo(() => buildStudyPlan(adaptiveProfile, aiMemory, { subjectId: selectedSubject?.id, topicId: activeTopic?.id }), [adaptiveProfile, aiMemory, selectedSubject?.id, activeTopic?.id]);
  const masteryForecast = useMemo(() => forecastMastery(adaptiveProfile, aiMemory, { subjectId: selectedSubject?.id, topicId: activeTopic?.id }), [adaptiveProfile, aiMemory, selectedSubject?.id, activeTopic?.id]);
  const narrativeBundle = useMemo(() => buildNarrativeBundle(adaptiveProfile, aiMemory, learningObservation, {
    timeOfDay: new Date(),
    streak: adaptiveProfile.streak || 0,
    mastery: predictionProfile?.evidence?.mastery || adaptiveProfile.mastery || 0,
    readiness,
    session,
    subjectId: activeSubject?.id,
    topicId: activeTopic?.id
  }), [adaptiveProfile, aiMemory, learningObservation, predictionProfile, readiness, session, activeSubject?.id, activeTopic?.id]);
  const coachingDecision = useMemo(() => {
    if (!activeSubject || !activeTopic) return null;
    return buildCoachingDecision(adaptiveProfile, aiMemory, {
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      mastery: activeTopic.mastery || activeTopic.masteryScore || 0,
      confidence: activeTopic.confidence || 0
    });
  }, [adaptiveProfile, aiMemory, activeSubject, activeTopic]);
  const teachingStrategy = useMemo(() => {
    if (!activeSubject || !activeTopic) return null;
    return buildTeachingStrategy(adaptiveProfile, aiMemory, {
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      mastery: activeTopic.mastery || activeTopic.masteryScore || 0,
      confidence: activeTopic.confidence || 0
    });
  }, [adaptiveProfile, aiMemory, activeSubject, activeTopic]);
  const smartLesson = useMemo(() => {
    if (!allSubjects.length) return null;
    return buildAdaptiveRecommendation({ profile: adaptiveProfile, memory: aiMemory, subjects: allSubjects });
  }, [adaptiveProfile, aiMemory, allSubjects]);
  const smartSubject = useMemo(() => {
    if (!smartLesson?.nextSubject) return selectedSubject || null;
    return allSubjects.find(subject => subject?.id === smartLesson.nextSubject) || selectedSubject || null;
  }, [allSubjects, selectedSubject, smartLesson?.nextSubject]);
  const smartTopic = useMemo(() => {
    const topicId = smartLesson?.nextTopic || smartLesson?.topicId || smartLesson?.todayLesson?.topicId || null;
    if (!topicId) return smartLesson?.todayLesson || smartLesson?.nextLesson || null;
    return smartSubject?.topics?.find(topic => topic?.id === topicId) || smartLesson?.todayLesson || smartLesson?.nextLesson || null;
  }, [smartLesson, smartSubject]);
  const homePersonality = useMemo(() => {
    const base = buildPersonalityResponse(adaptiveProfile, aiMemory, {
    timeOfDay: new Date(),
    streak: adaptiveProfile.streak || 0,
    mastery: predictionProfile?.evidence?.mastery || adaptiveProfile.mastery || 0,
    readiness,
    predictionProfile,
    coachDecision: predictionProfile?.coachingDecision || coachingDecision,
    topicStrength: smartLesson?.mastery || smartTopic?.mastery || smartTopic?.masteryScore || predictionProfile?.evidence?.mastery || 0
    });
    return {
      ...base,
      greeting: narrativeBundle.greeting || base.greeting,
      motivation: narrativeBundle.progress || base.motivation,
      achievementMessage: narrativeBundle.achievement || base.achievementMessage,
      farewell: narrativeBundle.encouragement || base.farewell,
      journeySummary: narrativeBundle.journeySummary || null
    };
  }, [adaptiveProfile, aiMemory, predictionProfile, readiness, coachingDecision, smartLesson, smartTopic, narrativeBundle]);
  const quizPersonality = useMemo(() => buildPersonalityResponse(adaptiveProfile, aiMemory, {
    timeOfDay: new Date(),
    subjectId: activeSubject?.id,
    topicId: activeTopic?.id,
    streak: adaptiveProfile.streak || 0,
    mastery: activeTopic?.mastery || activeTopic?.masteryScore || predictionProfile?.evidence?.mastery || 0,
    readiness,
    predictionProfile,
    coachDecision: coachingDecision,
    topicStrength: activeTopic?.mastery || activeTopic?.masteryScore || 0
  }), [adaptiveProfile, aiMemory, activeSubject?.id, activeTopic?.id, activeTopic?.mastery, activeTopic?.masteryScore, predictionProfile, readiness, coachingDecision]);
  const finishPersonality = useMemo(() => {
    const base = buildPersonalityResponse(adaptiveProfile, aiMemory, {
    timeOfDay: new Date(),
    subjectId: activeSubject?.id,
    topicId: activeTopic?.id,
    streak: profile.streak || adaptiveProfile.streak || 0,
    mastery: masteryForecast?.projected || predictionProfile?.evidence?.mastery || 0,
    readiness,
    predictionProfile,
    coachDecision: coachingDecision,
    topicStrength: masteryForecast?.projected || smartLesson?.mastery || activeTopic?.mastery || activeTopic?.masteryScore || 0
    });
    return {
      ...base,
      greeting: narrativeBundle.greeting || base.greeting,
      achievementMessage: narrativeBundle.achievement || base.achievementMessage,
      farewell: narrativeBundle.encouragement || base.farewell,
      journeySummary: narrativeBundle.journeySummary || null
    };
  }, [adaptiveProfile, aiMemory, activeSubject?.id, activeTopic?.id, profile.streak, adaptiveProfile.streak, masteryForecast, predictionProfile, readiness, coachingDecision, smartLesson, activeTopic?.mastery, activeTopic?.masteryScore, narrativeBundle]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      saveStudentCore(profile, allSubjects, loadAIMemory());
    } catch {
      setRecoveryMessages(prev => [...prev, 'Perubahan profil tidak dapat disimpan kerana simpanan peranti tidak tersedia.']);
    }
  }, [profile, allSubjects]);

  function refreshAdaptiveProfile() {
    setAdaptiveProfile(loadAdaptiveStudentProfile());
  }

  function recordGamification(event = {}, sourceProfile = adaptiveProfile, context = {}) {
    const updated = recordGamificationEvent(gamificationProfile, aiMemory, {
      profile: sourceProfile || adaptiveProfile,
      adaptiveProfile,
      learningObservation,
      predictionProfile,
      readiness,
      studyPlan,
      narrativeBundle,
      today: new Date(),
      ...context
    }, event);
    setGamificationProfile(updated);
  }

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
    setGamificationProfile(resetGamificationProfile());
    resetSmartQuestionState();
    refreshAdaptiveProfile();
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
      resetAdaptiveStudentProfile();
      setGamificationProfile(resetGamificationProfile());
      resetSmartQuestionState();
      refreshAdaptiveProfile();
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

  function isQuestionResumeMode(mode) {
    return ['quiz', 'adaptive-practice', 'adaptive-lesson'].includes(mode);
  }

  function startTopic(topic, subject = selectedSubject, options = {}) {
    const resumeMode = options.mode || 'quiz';
    if (!options.restoreFromResume && resume && !resume.completed && resume.mode === resumeMode && isQuestionResumeMode(resumeMode)) {
      const sameSubject = resume.subjectId === subject.id;
      const sameTopic = resume.topicId === topic.id;
      const hasResumeQuestions = Array.isArray(resume.questions) && resume.questions.length > 0;
      if (sameSubject && sameTopic && hasResumeQuestions) {
        startResume();
        return;
      }
    }
    const sourceQuestions = options.questions || topic.questions;
    const smartSession = buildSmartQuestionSession(sourceQuestions, {
      mode: resumeMode,
      subject,
      topic,
      profile: adaptiveProfile,
      memory: aiMemory,
      learningObservation,
      predictionProfile,
      readiness,
      studyPlan,
      masteryForecast,
      narrativeBundle,
      gamificationProfile,
      count: sourceQuestions.length,
      smartState: loadSmartQuestionState()
    });
    const orderedQuestions = smartSession.questions.length ? smartSession.questions : sourceQuestions;
    const diversity = options.preserveQuestions
      ? { questions: orderedQuestions, score: null, debug: [], duplicateIssues: [] }
      : buildQuestionSession({
        subject,
        topic,
        questions: orderedQuestions,
        count: orderedQuestions.length,
        memory: loadAIMemory(),
        allowReinforcement: Boolean(options.allowReinforcement),
        allowAdaptiveOverride: Boolean(options.allowAdaptiveOverride),
        sessionSeed: smartSession.variationSeed || createSmartQuestionSeed([
          subject?.id || '',
          topic?.id || '',
          orderedQuestions.map(item => item.id || item.questionId || item.q || item.question || '').join('|'),
          adaptiveProfile.totalQuestions || 0,
          adaptiveProfile.correctQuestions || 0,
          adaptiveProfile.streak || 0
        ])
      });
    const questions = diversity.questions;
    const startIndex = options.questionIndex || 0;
    const adaptiveSessionId = options.session?.adaptiveSessionId || `adaptive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startSession = { mode: resumeMode, correct: 0, almost: 0, wrong: 0, xp: 0, coins: 0, percent: 0, stars: '☆☆☆', answers: [], questions: [], diversityScore: diversity.score, diversityDebug: diversity.debug, ...(options.session || {}) };
    startSession.adaptiveSessionId = adaptiveSessionId;

    setActiveSubject(subject);
    setActiveTopic({ ...topic, questions, resumeMode, qdeScore: diversity.score, qipScore: diversity.score, qdeDebug: diversity.debug, qipDebug: diversity.debug, qdeDuplicateIssues: diversity.duplicateIssues || [], qipDuplicateIssues: diversity.duplicateIssues || [] });
    setQuestionIndex(startIndex);
    setAnswer('');
    setFeedback(null);
    setExplainOpen(false);
    setExplainData(null);
    setTeacherOpen(false);
    setTeacherData(null);
    setQuizStartedAt(Date.now());
    questionStartedAtRef.current = Date.now();
    quizSubmitKeyRef.current = '';
    setSession(startSession);
    setScreen('quiz');
    adaptiveSessionRef.current = {
      sessionId: adaptiveSessionId,
      subjectId: subject.id,
      topicId: topic.id,
      startedAt: new Date().toISOString()
    };
    if (!options.restoreFromResume && smartSession?.question) {
      recordSmartQuestionState(loadSmartQuestionState(), smartSession, {
        mode: resumeMode,
        subjectId: subject.id,
        topicId: topic.id,
        revisionQueue: smartSession.revisionQueue,
        timestamp: new Date().toISOString()
      });
    }
    recordSessionStart(getAdaptiveProfile(), {
      sessionId: adaptiveSessionId,
      startedAt: adaptiveSessionRef.current.startedAt,
      subjectId: subject.id,
      topicId: topic.id,
      questions: questions.map(item => item.id).filter(Boolean)
    });

    const resumeData = {
      version: 1,
      mode: resumeMode,
      screen: resumeMode,
      sessionId: adaptiveSessionId,
      subjectId: subject.id,
      topicId: topic.id,
      currentIndex: startIndex,
      questionIndex: startIndex,
      questions,
      session: startSession,
      answers: startSession.answers,
      score: startSession.percent,
      correct: startSession.correct,
      wrong: startSession.wrong,
      xp: startSession.xp,
      coins: startSession.coins,
      attemptNumber: startSession.answers.length || 0,
      metadata: {
        displayTitle: options.displayTitle || topic.title || subject.title || 'Latihan',
        displayNote: options.displayNote || topic.note || subject.short || '',
        subjectTitle: subject.title,
        topicTitle: topic.title,
        mode: resumeMode,
        diversityScore: diversity.score,
        diversityDebug: diversity.debug,
        preserveQuestions: Boolean(options.preserveQuestions),
        allowReinforcement: Boolean(options.allowReinforcement),
        allowAdaptiveOverride: Boolean(options.allowAdaptiveOverride)
      },
      startedAt: startSession.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    persistResumeData(resumeData, setResume);
  }

  async function startResume() {
    if (!resume) return;
    if (resume.completed) return;
    if (isQuestionResumeMode(resume.mode || 'quiz')) {
      if ((resume.mode || 'quiz') === 'adaptive-practice') {
        const practiceSubject = {
          id: resume.subjectId || 'adaptive',
          title: resume.metadata?.displayTitle || 'Latihan AI',
          short: 'AI',
          icon: <AdaptivePracticeBadgeIcon />,
          topics: [
            {
              id: resume.topicId || `adaptive_${resume.sessionId || resume.session?.adaptiveSessionId || 'resume'}`,
              title: resume.metadata?.displayTitle || 'Latihan AI',
              note: resume.metadata?.displayNote || 'Latihan adaptif berfokus',
              questions: resume.questions || [],
              adaptivePractice: true,
              adaptiveSessionId: resume.sessionId || resume.session?.adaptiveSessionId || null,
              adaptivePlan: resume.metadata?.adaptivePlan || null,
              adaptiveMetadata: resume.metadata?.adaptiveMetadata || resume.metadata || null
            }
          ]
        };
        const practiceTopic = practiceSubject.topics[0];
        syncSelectedSubjectState(practiceSubject);
        startTopic(practiceTopic, practiceSubject, {
          questions: resume.questions,
          questionIndex: Number.isInteger(resume.currentIndex) ? resume.currentIndex : resume.questionIndex,
          session: resume.session,
          preserveQuestions: true,
          mode: 'adaptive-practice',
          restoreFromResume: true
        });
        return;
      }
      const subject = await loadSubjectData(resume.subjectId);
      const topic = subject?.topics.find(t => t.id === resume.topicId);
      if (!subject || !topic) return;
      syncSelectedSubjectState(subject);
      startTopic(topic, subject, {
        questions: resume.questions,
        questionIndex: Number.isInteger(resume.currentIndex) ? resume.currentIndex : resume.questionIndex,
        session: resume.session,
        preserveQuestions: true,
        mode: resume.mode || 'quiz',
        restoreFromResume: true
      });
      return;
    }
    if (['uasa', 'reading', 'listening', 'speaking', 'writing'].includes(resume.mode)) {
      setScreen(resume.mode);
    }
  }

  async function restartResume() {
    if (!resume) return;
    const mode = resume.mode || 'quiz';
    clearResumeData(setResume);
    if (mode === 'adaptive-practice') {
      await startAdaptivePractice(resume.session?.requestedQuestions || resume.metadata?.requestedQuestions || adaptivePracticeCount, { forceFresh: true });
      return;
    }
    if (isQuestionResumeMode(mode)) {
      const subject = await loadSubjectData(resume.subjectId);
      const topic = subject?.topics.find(t => t.id === resume.topicId);
      if (subject && topic) {
        syncSelectedSubjectState(subject);
        startTopic(topic, subject, { mode, restoreFromResume: true });
      }
      return;
    }
    if (['uasa', 'reading', 'listening', 'speaking', 'writing'].includes(mode)) {
      setScreen(mode);
    }
  }

  async function startAdaptiveLesson(recommendation) {
    const subjectId = recommendation?.nextSubject || recommendation?.subjectId;
    const topicId = recommendation?.nextTopic || recommendation?.topicId;
    const questionId = recommendation?.nextQuestionId || recommendation?.questionId;
    if (!subjectId || !topicId) return;
    const subject = allSubjects.find(item => item.id === subjectId) || await loadSubjectData(subjectId);
    const topic = subject?.topics.find(item => item.id === topicId);
    if (!subject || !topic) return;
    syncSelectedSubjectState(subject);

    const targetQuestion = topic.questions.find(question => question.id === questionId);
    const remainingSoalan = topic.questions.filter(question => question.id !== questionId);
    const smartLessonQuestions = targetQuestion ? [targetQuestion, ...remainingSoalan] : [...topic.questions];
    const smartSession = buildSmartQuestionSession(smartLessonQuestions, {
      mode: 'adaptive-lesson',
      preferredQuestionId: questionId,
      profile: adaptiveProfile,
      memory: aiMemory,
      learningObservation,
      predictionProfile,
      readiness,
      studyPlan,
      masteryForecast,
      narrativeBundle,
      gamificationProfile,
      subject,
      topic,
      count: smartLessonQuestions.length,
      smartState: loadSmartQuestionState()
    });
    const questions = smartSession.questions.length ? smartSession.questions : smartLessonQuestions;
    startTopic(topic, subject, { questions, preserveQuestions: true, allowReinforcement: true, allowAdaptiveOverride: true, mode: 'adaptive-lesson' });
  }

  async function startAdaptivePractice(questionCount = adaptivePracticeCount, options = {}) {
    if (!options.forceFresh && resume && !resume.completed && resume.mode === 'adaptive-practice' && Array.isArray(resume.questions) && resume.questions.length) {
      await startResume();
      return;
    }
    if (!allSubjects.length) return;
    const session = buildAdaptivePracticeSession(profile, allSubjects, {
      questionCount,
      mode: 'balanced',
      subjectId: selectedSubjectId,
      seed: createSmartQuestionSeed([
        profile.totalQuestions || 0,
        profile.correctQuestions || 0,
        profile.streak || 0,
        adaptiveProfile.totalQuestions || 0,
        adaptiveProfile.correctQuestions || 0,
        adaptiveProfile.streak || 0,
        selectedSubjectId || '',
        questionCount,
        allSubjects.length,
        aiMemory?.history?.length || 0
      ])
    });
    if (!session.questions.length) return;
    const smartSession = buildSmartQuestionSession(session.questions, {
      mode: 'adaptive-practice',
      profile: adaptiveProfile,
      memory: aiMemory,
      learningObservation,
      predictionProfile,
      readiness,
      studyPlan,
      masteryForecast,
      narrativeBundle,
      gamificationProfile,
      count: session.questions.length,
      smartState: loadSmartQuestionState()
    });
    const orderedQuestions = smartSession.questions.length ? smartSession.questions : session.questions;

    const practiceSubject = {
      id: 'adaptive',
      title: 'Latihan AI',
      short: 'AI',
      icon: <AdaptivePracticeBadgeIcon />,
      topics: [
        {
          id: `adaptive_${session.sessionId}`,
          title: 'Latihan AI',
          note: session.metadata?.fallbackUsed ? 'Latihan permulaan seimbang' : 'Latihan adaptif berfokus',
          questions: orderedQuestions,
          adaptivePractice: true,
          adaptiveSessionId: session.sessionId,
          adaptivePlan: session.plan,
          adaptiveMetadata: session.metadata
        }
      ]
    };
    const practiceTopic = practiceSubject.topics[0];
    startTopic(practiceTopic, practiceSubject, {
      questions: orderedQuestions,
      preserveQuestions: true,
      mode: 'adaptive-practice',
      displayTitle: 'Latihan AI',
      displayNote: session.metadata?.fallbackUsed ? 'Latihan permulaan seimbang' : 'Latihan adaptif berfokus',
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

  useEffect(() => {
    let cancelled = false;
    const question = currentQuestion();

    if (screen !== 'quiz' || !activeSubject?.id || !activeTopic?.id || !question) {
      setCoachKnowledgeData(null);
      return undefined;
    }

    void buildCoachAdapterData('explain', {
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      question,
      result: feedback || {},
      userAnswer: answer,
      topic: activeTopic
    }).then(nextData => {
      if (cancelled) return;
      if (nextData) setCoachKnowledgeData(nextData);
    });

    return () => {
      cancelled = true;
    };
  }, [screen, activeSubject?.id, activeTopic?.id, questionIndex, feedback?.status]);

  function autoSave(nextIndex = questionIndex, nextSession = session) {
    if (!activeSubject || !activeTopic) return;
    const mode = nextSession.mode || activeTopic.resumeMode || (nextSession.adaptivePractice ? 'adaptive-practice' : 'quiz');
    const resumeData = {
      version: 1,
      mode,
      screen: mode,
      sessionId: nextSession.adaptiveSessionId || adaptiveSessionRef.current?.sessionId || null,
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      currentIndex: nextIndex,
      questionIndex: nextIndex,
      questions: activeTopic.questions,
      answers: nextSession.answers || [],
      score: nextSession.percent || 0,
      correct: nextSession.correct || 0,
      wrong: nextSession.wrong || 0,
      xp: nextSession.xp || 0,
      coins: nextSession.coins || 0,
      attemptNumber: (nextSession.answers || []).length || 0,
      metadata: {
        diversityScore: activeTopic.qdeScore || activeTopic.qipScore || null,
        diversityDebug: activeTopic.qdeDebug || activeTopic.qipDebug || [],
        preserveQuestions: true
      },
      session: {
        ...nextSession,
        mode,
        adaptiveSessionId: nextSession.adaptiveSessionId || adaptiveSessionRef.current?.sessionId || null
      },
      startedAt: session.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    persistResumeData(resumeData, setResume);
  }

  function handleQuizBack() {
    autoSave(questionIndex, session);
    setScreen('dashboard');
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

  function handleSelectSubject(subjectId) {
    if (!subjectId) return;
    setSelectedSubjectId(subjectId);
    setScreen('dashboard');
  }

  function syncSelectedSubjectState(subject) {
    if (!subject?.id) return;
    flushSync(() => {
      setSelectedSubjectId(subject.id);
      setSelectedSubject(subject);
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
    nextSession.answers.push({
      questionId: question.id,
      subjectId: question.subjectId || activeSubject?.id || null,
      subjectTitle: question.subjectTitle || activeSubject?.title || null,
      subjectShort: question.subjectShort || activeSubject?.short || null,
      topicId: question.topicId || activeTopic?.id || null,
      topicTitle: question.topicTitle || activeTopic?.title || null,
      answer,
      status: result.status,
      correctAnswer: question.answer,
      attemptNumber,
      timeSpentMs: timeSpent * 1000,
      answeredAt
    });
    nextSession.questions = [...(nextSession.questions || []), question];
    saveQuestionHistory(question);
    const adaptiveSubjectId = question.subjectId || activeSubject?.id;
    const adaptiveTopicId = question.topicId || activeTopic?.id;
    const adaptiveResult = recordQuestionResult(getAdaptiveProfile(), {
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
    recordGamification({
      type: 'quiz-answer',
      sessionId,
      questionId: question.id,
      attemptNumber,
      date: answeredAt,
      answeredAt
    }, adaptiveResult?.profile || getAdaptiveProfile(), {
      questionId: question.id,
      sessionId,
      attemptNumber,
      eventType: 'quiz-answer'
    });
    refreshAdaptiveProfile();

    setSession(nextSession);
    autoSave(questionIndex, nextSession);
    setExplainData(explainAnswer({ question, topic: activeTopic, result, userAnswer: answer }));
    setFeedback({ ...result, xp, coins, correctAnswer: question.answer, acceptedAnswers: getAcceptedAnswers(question), explanation: sanitizeAiText(question.explanation || question.hint) });
  }

  function createCoachSnapshot(mode, question = currentQuestion()) {
    const requestId = coachRequestRef.current.requestId + 1;
    const snapshot = resolveCoachContextSnapshot({
      requestId,
      question,
      activeSubject,
      activeTopic,
      allSubjects,
      learnerAnswer: answer,
      feedback,
      explanationMode: feedback?.status || ''
    });
    coachRequestRef.current = { requestId, open: true, mode, snapshot };
    return snapshot;
  }

  function closeCoachSurface(setOpen, setData) {
    coachRequestRef.current = { ...coachRequestRef.current, open: false };
    setOpen(false);
    setData?.(null);
  }

  function decorateCoachData(data, snapshot, mode) {
    return {
      ...(data || {}),
      sourceQuestionId: snapshot.questionId,
      sourceSubjectId: snapshot.subjectId,
      sourceTopicId: snapshot.topicId,
      sourceLanguage: snapshot.sourceLanguage,
      generatedMode: mode
    };
  }

  function isCurrentCoachResponse(snapshot, data, mode) {
    const current = coachRequestRef.current;
    const currentSnapshot = current.snapshot;
    return Boolean(
      current.open &&
      current.mode === mode &&
      current.requestId === snapshot?.requestId &&
      currentSnapshot?.requestId === snapshot?.requestId &&
      currentSnapshot?.questionId === snapshot?.questionId &&
      currentSnapshot?.subjectId === snapshot?.subjectId &&
      currentSnapshot?.topicId === snapshot?.topicId &&
      matchesCoachContext(snapshot, data, {
        requestId: current.requestId,
        mode,
        currentSnapshot,
        currentOpen: current.open
      })
    );
  }

  function openExplain() {
    const question = currentQuestion();
    if (!question || !feedback) return;
    const snapshot = createCoachSnapshot('explain', question);
    const questionText = snapshot.questionText;
    const instruction = snapshot.instruction;
    const options = snapshot.options;
    const expectedAnswer = snapshot.expectedAnswer;
    const acceptedAnswers = snapshot.acceptedAnswers;
    const learnerAnswer = snapshot.learnerAnswer;
    const explanationMode = snapshot.explanationMode;
    const currentLearningObjective = snapshot.learningObjective;
    const snapshotSubject = allSubjects.find(item => item.id === snapshot.subjectId) || activeSubject;
    const snapshotTopic = snapshotSubject?.topics?.find(item => item.id === snapshot.topicId) || activeTopic;
    const attemptCount = currentQuestion() ? ((session.answers || []).filter(item => item.questionId === currentQuestion()?.id).length + 1) : 0;
    const fallbackData = explainAnswer({
      question,
      topic: snapshotTopic,
      result: feedback,
      userAnswer: answer,
      questionText,
      instruction,
      currentLearningObjective,
      attemptCount,
      explanationMode
    });
    setExplainData(decorateCoachData(fallbackData, snapshot, 'explain'));
    setExplainOpen(true);
    void getCoachExplainData({
      subjectId: snapshot.subjectId,
      topicId: snapshot.topicId,
      question,
      result: feedback,
      userAnswer: answer,
      topic: snapshotTopic,
      questionText,
      instruction,
      options,
      expectedAnswer,
      acceptedAnswers,
      learnerAnswer,
      explanationMode,
      currentLearningObjective,
      attemptCount,
      hintsUsed: feedback?.status === 'hint' ? 1 : 0
      ,sourceLanguage: snapshot.sourceLanguage
    }).then(nextData => {
      if (nextData && isCurrentCoachResponse(snapshot, nextData, 'explain')) setExplainData(nextData);
    });
  }

  function openTeacher() {
    const question = currentQuestion();
    if (!question) return;
    const snapshot = createCoachSnapshot('teach', question);
    const questionText = snapshot.questionText;
    const instruction = snapshot.instruction;
    const options = snapshot.options;
    const expectedAnswer = snapshot.expectedAnswer;
    const acceptedAnswers = snapshot.acceptedAnswers;
    const learnerAnswer = snapshot.learnerAnswer;
    const explanationMode = snapshot.explanationMode;
    const currentLearningObjective = snapshot.learningObjective;
    const snapshotSubject = allSubjects.find(item => item.id === snapshot.subjectId) || activeSubject;
    const snapshotTopic = snapshotSubject?.topics?.find(item => item.id === snapshot.topicId) || activeTopic;
    const attemptCount = currentQuestion() ? ((session.answers || []).filter(item => item.questionId === currentQuestion()?.id).length + 1) : 0;
    const fallbackExplainData = explainAnswer({
      question,
      topic: snapshotTopic,
      result: feedback || {},
      userAnswer: answer,
      questionText,
      instruction,
      currentLearningObjective,
      attemptCount,
      explanationMode
    });
    const fallbackTeacherData = teachAnswer({
      question,
      topic: snapshotTopic,
      explanationData: fallbackExplainData,
      questionText,
      instruction,
      currentLearningObjective,
      attemptCount,
      explanationMode
    });
    setTeacherData(decorateCoachData(fallbackTeacherData, snapshot, 'teach'));
    setExplainOpen(false);
    setTeacherOpen(true);
    void getCoachTeacherData({
      subjectId: snapshot.subjectId,
      topicId: snapshot.topicId,
      question,
      result: feedback || {},
      userAnswer: answer,
      topic: activeTopic,
      questionText,
      instruction,
      options,
      expectedAnswer,
      acceptedAnswers,
      learnerAnswer,
      explanationMode,
      currentLearningObjective,
      attemptCount,
      hintsUsed: feedback?.status === 'hint' ? 1 : 0
      ,sourceLanguage: snapshot.sourceLanguage
    }).then(nextData => {
      if (!nextData) return;
      if (isCurrentCoachResponse(snapshot, nextData, 'teach')) setTeacherData(nextData);
    });
  }

  function tryAgainQuestion() {
    coachRequestRef.current = { ...coachRequestRef.current, open: false };
    questionStartedAtRef.current = Date.now();
    setAnswer('');
    setFeedback(null);
    setExplainOpen(false);
    setExplainData(null);
    setTeacherOpen(false);
    setTeacherData(null);
  }

  function nextQuestion() {
    coachRequestRef.current = { ...coachRequestRef.current, open: false };
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
    const finishedSessionId = session.adaptiveSessionId || adaptiveSessionRef.current?.sessionId || '';
    const adaptiveSessionResult = recordSessionEnd(getAdaptiveProfile(), {
      sessionId: finishedSessionId,
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      questions: (session.answers || []).map(item => item.questionId).filter(Boolean),
      correct: session.correct || 0,
      wrong: session.wrong || 0,
      durationSeconds: studySeconds,
      endedAt: new Date().toISOString()
    });
    adaptiveSessionRef.current = null;
    recordGamification({
      type: 'session-complete',
      sessionId: finishedSessionId,
      date: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }, adaptiveSessionResult, {
      sessionId: finishedSessionId,
      eventType: 'session-complete',
      sessionCompleted: true
    });

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
    refreshAdaptiveProfile();
  }

  function completeDailyChallenge() {
    const today = todayKey();
    if (profile.daily?.[today]?.completed) return;
    const updatedProfile = { ...profile, xp: (profile.xp || 0) + 50, coins: (profile.coins || 0) + 20, daily: { ...(profile.daily || {}), [today]: { completed: true, xp: 50, coins: 20 } } };
    setProfile({ ...updatedProfile, badges: autoBadges(updatedProfile) });
    recordGamification({
      type: 'daily-mission',
      date: today,
      completedAt: new Date().toISOString(),
      key: `daily-mission::${today}`
    }, adaptiveProfile, {
      dailyMissionCompleted: true,
      eventType: 'daily-mission',
      today: new Date(today)
    });
  }

  function saveUasaResult(result) {
    const badges = new Set(profile.badges || []);
    if (result.score >= 80) badges.add('UASA A');
    const updatedProfile = {
      ...profile,
      xp: (profile.xp || 0) + Math.round(result.score / 2),
      coins: (profile.coins || 0) + Math.round(result.score / 10),
      badges: [...badges],
      uasaHistory: [result, ...(profile.uasaHistory || [])].slice(0, 20),
      history: [{ date: result.date, subject: result.subjectShort, topic: 'Simulator UASA', percent: result.score, stars: getStars(result.score) }, ...(profile.history || [])].slice(0, 50)
    };
    setProfile({ ...updatedProfile, badges: autoBadges(updatedProfile) });
    recordGamification({
      type: 'uasa-result',
      sessionId: `uasa::${result?.date || todayKey()}`,
      questionId: `uasa::${result?.subjectShort || 'subjek'}`,
      date: result?.date || todayKey(),
      key: `uasa-result::${result?.date || todayKey()}::${result?.subjectShort || 'subjek'}`
    }, { ...adaptiveProfile, ...updatedProfile, studyMinutes: adaptiveProfile.studyMinutes || 0 }, {
      eventType: 'uasa-result',
      sessionCompleted: true,
      today: new Date(result?.date || todayKey())
    });
    clearResumeData(setResume);
  }

  function finishBacaan(result) {
    const score = Number.isFinite(Number(result?.score)) ? Number(result.score) : 0;
    const scoreHistory = Array.isArray(result?.scoreHistory)
      ? result.scoreHistory.map(value => Number(value)).filter(Number.isFinite)
      : [];
    const completedPassages = Number.isFinite(Number(result?.completedPassages))
      ? Number(result.completedPassages)
      : scoreHistory.length;
    const aggregateScores = scoreHistory.length ? scoreHistory : (completedPassages > 0 ? [score] : []);
    const averageScore = aggregateScores.length
      ? Math.round(aggregateScores.reduce((sum, value) => sum + value, 0) / aggregateScores.length)
      : 0;
    const bestScore = aggregateScores.length ? Math.max(...aggregateScores) : 0;
    const passedCount = aggregateScores.filter(value => value >= 80).length;
    const today = todayKey();
    const memoryResult = { ...result, score, scoreHistory: aggregateScores, completedPassages, averageScore, bestScore, passedCount, finalItemScore: score, date: new Date().toISOString() };
    const updatedProfile = { ...profile, xp: (profile.xp || 0) + Math.round(score / 2), coins: (profile.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Bacaan', topic: result?.title || 'Jurulatih Bacaan', percent: score, stars: getStars(score) }, ...(profile.history || [])].slice(0, 50) };
    saveReadingMemory(memoryResult, updatedProfile, allSubjects);
    setProfile({ ...updatedProfile, badges: autoBadges(updatedProfile) });
    recordGamification({
      type: 'reading-session',
      sessionId: `reading::${today}::${result?.title || 'Jurulatih Bacaan'}`,
      date: memoryResult.date,
      key: `reading-session::${today}::${result?.title || 'Jurulatih Bacaan'}`
    }, { ...adaptiveProfile, ...updatedProfile, studyMinutes: (adaptiveProfile.studyMinutes || 0) + Math.max(1, Math.round(score / 2)) }, {
      eventType: 'reading-session',
      sessionCompleted: true,
      completedPassages,
      averageScore,
      bestScore,
      passedCount,
      today: new Date()
    });
    clearResumeData(setResume);
    setScreen('dashboard');
  }

  function finishMendengar(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    const updatedProfile = { ...profile, xp: (profile.xp || 0) + Math.round(score / 2), coins: (profile.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Mendengar', topic: result?.title || 'Makmal Mendengar', percent: score, stars: getStars(score) }, ...(profile.history || [])].slice(0, 50) };
    saveListeningMemory(memoryResult, updatedProfile, allSubjects);
    setProfile({ ...updatedProfile, badges: autoBadges(updatedProfile) });
    recordGamification({
      type: 'listening-session',
      sessionId: `listening::${today}::${result?.title || 'Makmal Mendengar'}`,
      date: memoryResult.date,
      key: `listening-session::${today}::${result?.title || 'Makmal Mendengar'}`
    }, { ...adaptiveProfile, ...updatedProfile, studyMinutes: (adaptiveProfile.studyMinutes || 0) + Math.max(1, Math.round(score / 2)) }, {
      eventType: 'listening-session',
      sessionCompleted: true,
      today: new Date()
    });
    clearResumeData(setResume);
    setScreen('dashboard');
  }

  function finishBertutur(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    const updatedProfile = { ...profile, xp: (profile.xp || 0) + Math.round(score / 2), coins: (profile.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Bertutur', topic: result?.title || 'Jurulatih Bertutur', percent: score, stars: getStars(score) }, ...(profile.history || [])].slice(0, 50) };
    saveSpeakingMemory(memoryResult, updatedProfile, allSubjects);
    setProfile({ ...updatedProfile, badges: autoBadges(updatedProfile) });
    recordGamification({
      type: 'speaking-session',
      sessionId: `speaking::${today}::${result?.title || 'Jurulatih Bertutur'}`,
      date: memoryResult.date,
      key: `speaking-session::${today}::${result?.title || 'Jurulatih Bertutur'}`
    }, { ...adaptiveProfile, ...updatedProfile, studyMinutes: (adaptiveProfile.studyMinutes || 0) + Math.max(1, Math.round(score / 2)) }, {
      eventType: 'speaking-session',
      sessionCompleted: true,
      today: new Date()
    });
    clearResumeData(setResume);
    setScreen('dashboard');
  }

  function finishMenulis(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    const updatedProfile = { ...profile, xp: (profile.xp || 0) + Math.round(score / 2), coins: (profile.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Menulis', topic: result?.title || 'Jurulatih Menulis', percent: score, stars: getStars(score) }, ...(profile.history || [])].slice(0, 50) };
    saveWritingMemory(memoryResult, updatedProfile, allSubjects);
    setProfile({ ...updatedProfile, badges: autoBadges(updatedProfile) });
    recordGamification({
      type: 'writing-session',
      sessionId: `writing::${today}::${result?.title || 'Jurulatih Menulis'}`,
      date: memoryResult.date,
      key: `writing-session::${today}::${result?.title || 'Jurulatih Menulis'}`
    }, { ...adaptiveProfile, ...updatedProfile, studyMinutes: (adaptiveProfile.studyMinutes || 0) + Math.max(1, Math.round(score / 2)) }, {
      eventType: 'writing-session',
      sessionCompleted: true,
      today: new Date()
    });
    clearResumeData(setResume);
    setScreen('dashboard');
  }

  const tutorWeakTopics = rankWeakTopics(adaptiveProfile, { limit: 5, includeLowConfidence: true });
  const tutorStrongTopics = rankStrongTopics(adaptiveProfile, { limit: 5 });
  const tutorQuestion = currentQuestion();
  const tutorSubjectId = tutorQuestion?.subjectId || activeTopic?.subjectId || '';
  const chatSubject = activeSubject?.id === 'adaptive'
    ? allSubjects.find(item => item.id === tutorSubjectId) || selectedSubject || activeSubject
    : activeSubject || selectedSubject;
  const chatTopic = activeTopic?.id?.startsWith('adaptive_')
    ? chatSubject?.topics?.find(item => item.id === (tutorQuestion?.topicId || tutorQuestion?.metadata?.topicId)) || activeTopic
    : activeTopic;
  const coachSnapshot = coachRequestRef.current.snapshot;
  const coachSubject = allSubjects.find(item => item.id === coachSnapshot?.subjectId) || activeSubject;
  const chatWidget = chatOpen && chatSubject ? (
    <TutorAIModal
      open={chatOpen}
      profile={profile}
      adaptiveProfile={adaptiveProfile}
      selectedSubject={chatSubject}
      selectedTopic={chatTopic}
      question={tutorQuestion}
      answer={answer}
      feedback={feedback}
      questionText={tutorQuestion?.q || tutorQuestion?.question || tutorQuestion?.stem || tutorQuestion?.text || ''}
      instruction={tutorQuestion?.instruction || tutorQuestion?.direction || tutorQuestion?.prompt || ''}
      options={Array.isArray(tutorQuestion?.options) ? tutorQuestion.options : Array.isArray(tutorQuestion?.choices) ? tutorQuestion.choices : []}
       expectedAnswer={tutorQuestion?.answer || tutorQuestion?.correctAnswer || ''}
       acceptedAnswers={getAcceptedAnswers(tutorQuestion)}
      learnerAnswer={answer}
      explanationMode={feedback?.status || (feedback?.correct ? 'correct_answer_reinforcement' : '')}
      currentLearningObjective={chatTopic?.learningObjective || chatTopic?.objective || tutorQuestion?.learningObjective || tutorQuestion?.objective || ''}
      attemptCount={tutorQuestion ? ((session.answers || []).filter(item => item.questionId === tutorQuestion?.id).length + 1) : 0}
      hintsUsed={feedback?.status === 'hint' ? 1 : 0}
      learningObservation={learningObservation}
      predictionProfile={predictionProfile}
      readiness={readiness}
      studyPlan={studyPlan}
      gamificationProfile={gamificationProfile}
      weakTopics={tutorWeakTopics}
      strongTopics={tutorStrongTopics}
      onTutup={() => setChatOpen(false)}
    />
  ) : null;
  const predictionGreeting = buildPredictionGreeting(profile, predictionProfile, readiness, studyPlan);
  const aiSummary = {
    strongestTopic: learningObservation?.strongestTopic || rankStrongTopics(adaptiveProfile, { limit: 1 })[0] || null,
    weakestTopic: learningObservation?.weakestTopic || rankWeakTopics(adaptiveProfile, { limit: 1, includeLowConfidence: true })[0] || null,
    studyRecommendation: learningObservation?.recommendation || studyPlan?.notes || readiness?.message || 'Teruskan usaha kamu hari ini.',
    readinessLevel: readiness?.level || 'needs_support',
    readinessMessage: readiness?.message || 'Teruskan usaha kamu hari ini.',
    learningTrend: learningObservation?.learningTrend || null,
    riskLevel: learningObservation?.riskLevel || null,
    memorySpeech: learningObservation?.memorySpeech || null,
    dailyMission: learningObservation?.dailyMission || null,
    forecast: masteryForecast
  };

  if (showOnboarding) return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><FirstRunWizard profile={profile} onComplete={completeOnboarding} /></BetaChrome>;

  if (screen === 'login') return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><Login onStart={startProfile} /></BetaChrome>;

  if (loadingSubject) return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><LoadingSkeleton /></BetaChrome>;
  if (!selectedSubject) return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><main className="app"><EmptyState title="Subjek tidak dijumpai." message="Pilih semula subjek daripada Papan Utama." actionLabel="Kembali ke Papan Utama" onAction={() => { setSelectedSubjectId('bm'); setScreen('dashboard'); }} /></main></BetaChrome>;

  if (screen === 'quiz') {
    const question = currentQuestion();
    const safeHint = sanitizeAiText(coachKnowledgeData?.hint || coachingDecision?.hint || teachingStrategy?.hint || question?.hint || 'Baca soalan perlahan-lahan dan cari kata kunci.');
    const bookmarkId = question && activeSubject && activeTopic ? `${activeSubject.id}_${activeTopic.id}_${question.id}` : '';
    const isBookmarked = (profile.bookmarks || []).some(item => item.id === bookmarkId);
    return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><ProductionErrorBoundary fallback={<EmptyState title="Soalan tidak dapat dipaparkan." message="Kembali ke Papan Utama dan cuba sekali lagi." actionLabel="Papan Utama" onAction={() => setScreen('dashboard')} />}><React.Suspense fallback={<div className="card"><p className="eyebrow">Memuat</p><h2>Soalan sedang dimuat</h2><p>Sebentar ya.</p></div>}><Quiz subject={activeSubject} topic={activeTopic} questionIndex={questionIndex} answer={answer} feedback={feedback} isBookmarked={isBookmarked} coachKnowledgeData={coachKnowledgeData} onAnswerChange={setAnswer} onCheckAnswer={checkAnswer} onNextQuestion={nextQuestion} onTryAgain={tryAgainQuestion} onExplain={openExplain} onBack={handleQuizBack} onPetunjuk={() => setFeedback({ status: 'hint', title: 'Petunjuk', message: safeHint, teachingStyle: teachingStrategy?.teachingStyle || 'guided', explanationDepth: teachingStrategy?.explanationDepth || 1 })} onSpeak={() => speak(currentQuestion().q.replaceAll('________', ' kosong '))} onBookmark={toggleBookmark} onOpenAi={() => setChatOpen(true)} coachDecision={coachingDecision} teachingStrategy={teachingStrategy} personality={quizPersonality} /><AIExplainModal open={explainOpen} data={explainData} context={coachSnapshot} question={question} character={getPersonalityForSubject(coachSubject)} onTutup={() => closeCoachSurface(setExplainOpen, setExplainData)} onTryAgain={tryAgainQuestion} onTeach={openTeacher} /><AITeacherModal open={teacherOpen} data={teacherData} context={coachSnapshot} character={getPersonalityForSubject(coachSubject)} onTutup={() => closeCoachSurface(setTeacherOpen, setTeacherData)} onLatih={tryAgainQuestion} /></React.Suspense>{chatWidget}</ProductionErrorBoundary></BetaChrome>;
  }

  if (screen === 'finish') {
    const nextTopic = getNextTopic(activeSubject, activeTopic);
    return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><ProductionErrorBoundary fallback={<EmptyState title="Keputusan tidak dapat dipaparkan." message="Kembali ke Papan Utama untuk meneruskan sesi." actionLabel="Papan Utama" onAction={() => setScreen('dashboard')} />}><React.Suspense fallback={<div className="card"><p className="eyebrow">Memuat</p><h2>Ringkasan sedang dimuat</h2><p>Sebentar ya.</p></div>}><Finish profile={profile} session={session} topic={activeTopic} nextTopic={nextTopic} aiSummary={aiSummary} personality={finishPersonality} voiceSummaryText={[finishPersonality?.achievementMessage, finishPersonality?.farewell, aiSummary?.studyRecommendation, aiSummary?.journeySummary].filter(Boolean).join('. ')} gamificationProfile={gamificationProfile} onDashboard={() => setScreen('dashboard')} onRetry={() => activeTopic && activeSubject && startTopic(activeTopic, activeSubject)} onNextTopic={() => nextTopic && activeSubject && startTopic(nextTopic, activeSubject)} onOpenAi={() => setChatOpen(true)} /></React.Suspense></ProductionErrorBoundary></BetaChrome>;
  }
  if (screen === 'reading') return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><ProductionErrorBoundary fallback={<EmptyState title="Latihan Bacaan tidak dapat dimuatkan." message="Sila kembali dan cuba semula." actionLabel="Papan Utama" onAction={() => setScreen('dashboard')} />}><BacaanCoach profile={profile} resume={resume} onResumeChange={(nextResume) => persistResumeData(nextResume, setResume)} onClearResume={() => clearResumeData(setResume)} onBack={() => setScreen('dashboard')} onFinish={finishBacaan} /></ProductionErrorBoundary></BetaChrome>;
  if (screen === 'listening') return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><MendengarLab resume={resume} onResumeChange={(nextResume) => persistResumeData(nextResume, setResume)} onClearResume={() => clearResumeData(setResume)} onBack={() => setScreen('dashboard')} onFinish={finishMendengar} /></BetaChrome>;
  if (screen === 'speaking') return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><BertuturCoach resume={resume} onResumeChange={(nextResume) => persistResumeData(nextResume, setResume)} onClearResume={() => clearResumeData(setResume)} onBack={() => setScreen('dashboard')} onFinish={finishBertutur} /></BetaChrome>;
  if (screen === 'writing') return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><ProductionErrorBoundary fallback={<EmptyState title="Latihan Menulis tidak dapat dimuatkan." message="Sila kembali dan cuba semula." actionLabel="Papan Utama" onAction={() => setScreen('dashboard')} />}><MenulisCoach resume={resume} onResumeChange={(nextResume) => persistResumeData(nextResume, setResume)} onClearResume={() => clearResumeData(setResume)} onBack={() => setScreen('dashboard')} onFinish={finishMenulis} /></ProductionErrorBoundary></BetaChrome>;
  if (screen === 'parent') return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><ProductionErrorBoundary fallback={<EmptyState title="Laporan ibu bapa tidak dapat dipaparkan." message="Kembali ke Papan Utama dan cuba lagi." actionLabel="Papan Utama" onAction={() => setScreen('dashboard')} />}><React.Suspense fallback={<div className="card"><p className="eyebrow">Memuat</p><h2>Laporan sedang dimuat</h2><p>Sebentar ya.</p></div>}><ParentDashboardPage profile={profile} adaptiveProfile={adaptiveProfile} canonicalProgress={canonicalProgress} aiMemory={aiMemory} learningObservation={learningObservation} predictionProfile={predictionProfile} narrativeBundle={narrativeBundle} gamificationProfile={gamificationProfile} allSubjects={allSubjects} adaptivePracticeCount={adaptivePracticeCount} readiness={readiness} onStartAdaptivePractice={startAdaptivePractice} onBack={() => setScreen('dashboard')} /></React.Suspense></ProductionErrorBoundary></BetaChrome>;
  if (screen === 'uasa') return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><UasaSimulator profile={profile} subject={selectedSubject} resume={resume} onResumeChange={(nextResume) => persistResumeData(nextResume, setResume)} onClearResume={() => clearResumeData(setResume)} onBack={() => setScreen('dashboard')} onSave={saveUasaResult} /></BetaChrome>;

  if (screen === 'dashboard') {
    return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><ProductionErrorBoundary fallback={<EmptyState title="Papan Utama tidak dapat dipaparkan." message="Sila muat semula atau kembali ke skrin ini." actionLabel="Muat Semula" onAction={() => window.location.reload()} />}><React.Suspense fallback={<div className="card"><p className="eyebrow">Memuat</p><h2>Papan Utama sedang dimuat</h2><p>Sebentar ya.</p></div>}><HomeDashboard profile={profile} adaptiveProfile={adaptiveProfile} gamificationProfile={gamificationProfile} subjectList={subjectList} allSubjects={allSubjects} selectedSubject={selectedSubject} selectedSubjectId={selectedSubjectId} totalQuestions={totalQuestions} personality={homePersonality} resume={resume} dailyChallenge={buildDailyChallenge(narrativeBundle)} voiceGreetingText={narrativeBundle.greeting || homePersonality?.greeting || predictionGreeting} voiceMissionText={(narrativeBundle.dailyMission?.items || []).join('. ') || learningObservation?.memorySpeech || ''} adaptivePracticePreview={adaptivePracticePreview} adaptivePracticeCount={adaptivePracticeCount} predictionProfile={predictionProfile} predictionGreeting={predictionGreeting} studyPlan={studyPlan} onAdaptivePracticeCountChange={setAdaptivePracticeCount} onSelectSubject={handleSelectSubject} onStartTopic={(topic) => startTopic(topic, selectedSubject)} onStartAdaptiveLesson={startAdaptiveLesson} onStartAdaptivePractice={startAdaptivePractice} onStartBacaan={() => setScreen('reading')} onStartMendengar={() => setScreen('listening')} onStartBertutur={() => setScreen('speaking')} onStartMenulis={() => setScreen('writing')} onOpenParent={() => setScreen('parent')} onOpenUasa={() => setScreen('uasa')} onOpenAi={() => setChatOpen(true)} onReset={resetProfile} onExportBetaReport={exportBetaReport} onResume={startResume} onRestartResume={restartResume} onCompleteDaily={completeDailyChallenge} onToggleFavourite={toggleFavourite} /></React.Suspense></ProductionErrorBoundary>{chatWidget}</BetaChrome>;
  }

  return <BetaChrome recoveryMessages={recoveryMessages} modalOpen={modalOpen} currentScreen={screen}><main className="app"><EmptyState title="Paparan tidak dijumpai." message="Kembali ke Papan Utama untuk meneruskan sesi." actionLabel="Kembali ke Papan Utama" onAction={() => setScreen('dashboard')} /></main></BetaChrome>;
  }

function BetaChrome({ children, recoveryMessages = [], modalOpen = false, currentScreen = '' }) {
  const feedbackSuppressed = modalOpen || ['quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'finish', 'parent'].includes(currentScreen);
  return <>
    <BrandSplash />
    <div className="app-chrome-shell" data-modal-open={modalOpen ? 'true' : 'false'} aria-hidden={modalOpen ? 'true' : undefined} inert={modalOpen ? '' : undefined}>
      <div className="app-page-shell" data-screen={currentScreen}>{children}</div>
      {recoveryMessages.length > 0 && <StorageRecoveryNotice messages={recoveryMessages} />}
      <BetaFeedbackButton suppressed={feedbackSuppressed} />
      <AppVersiFooter />
    </div>
  </>;
}

function BrandSplash() {
  return <div className="brand-splash" aria-label="Jannati AI Tutor sedang dimuat">
    <BrandLogo horizontal size="lg" className="brand-logo-full" />
    <h1>Jannati AI Tutor</h1>
    <p>AI Tutor Rasmi</p>
    <div className="brand-loading-dot" aria-hidden="true" />
  </div>;
}

function AppVersiFooter() {
  const buildDate = new Date(APP_BUILD_DATE);
  const displayDate = Number.isNaN(buildDate.getTime()) ? APP_BUILD_DATE : buildDate.toLocaleString();
  const showBuildTimestamp = import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');
  return <footer className="app-version-footer" aria-label="Maklumat versi aplikasi">
    <BrandLogo horizontal size="sm" className="footer-brand-logo" />    <span className="closed-beta-badge">CLOSED BETA</span>    <span><b>Versi</b> {APP_VERSION}</span>    {showBuildTimestamp && <span><b>Build</b> {displayDate}</span>}    <span><b>Hak Cipta</b> Jannati AI Tutor</span>
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

function BetaFeedbackButton({ suppressed = false }) {
  if (suppressed) return null;
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
    <button type="button" className="beta-feedback-fab" aria-label="Maklum Balas Beta" title="Maklum Balas Beta" onClick={() => { setSaved(false); setOpen(true); }}><IconGlyph name="message" decorative /><span>Maklum Balas Beta</span></button>
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

function Login({ onStart }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('janna');
  const avatars = [
    { id: 'janna', label: 'Janna', icon: <JannaAvatar size={36} /> },
    { id: 'jati', label: 'Jati', icon: <JatiAvatar size={36} /> }
  ];

  return <main className="app login-page"><section className="card"><p className="eyebrow">Beta Tertutup</p><h1>Selamat datang</h1><p>Masukkan nama murid untuk mula belajar.</p><label>Nama Murid</label><input value={name} onChange={event => setName(event.target.value)} placeholder="Nama murid" autoFocus /><label>Avatar</label><div className="reading-tabs">{avatars.map(item => <button key={item.id} type="button" className={item.id === avatar ? '' : 'secondary'} onClick={() => setAvatar(item.id)} aria-label={item.label}>{item.icon}<span>{item.label}</span></button>)}</div><button type="button" className="full" onClick={() => onStart(name.trim(), avatar)} disabled={!name.trim()}>Mula Belajar</button></section></main>;
}

function LoadingSkeleton() {
  return <main className="dashboard-shell skeleton-shell">
    <aside className="sidebar"><BrandLogo horizontal size="sm" /><div className="jannati-skeleton skeleton-card" /><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line" /></aside>
    <section className="dashboard-main"><section className="profile hero-card"><MascotCard character="janna" mood="waiting" size="md" animation="pulse" message={PERSONALITY_MESSAGES.loading} /><div><div className="jannati-skeleton skeleton-line wide" /><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line short" /></div></section><section className="stats">{[1, 2, 3, 4].map(item => <div className="stat" key={item}><div className="jannati-skeleton skeleton-line" /><div className="jannati-skeleton skeleton-line short" /></div>)}</section><section className="card"><div className="jannati-skeleton skeleton-card" /></section></section>
  </main>;
}

function Quiz({ subject, topic, questionIndex, answer, feedback, isBookmarked, coachDecision, teachingStrategy, personality, coachKnowledgeData, onAnswerChange, onCheckAnswer, onNextQuestion, onTryAgain, onExplain, onBack, onPetunjuk, onSpeak, onBookmark, onOpenAi }) {
  const question = topic.questions[questionIndex];
  const progress = Math.round(((questionIndex + 1) / topic.questions.length) * 100);
  const debugRow = question?.qde || {};
  const qipRow = question?.qip || {};
  const diversityScore = topic.qdeScore || {};
  const quizCharacter = getPersonalityForSubject(subject);
  const feedbackMood = personality?.emotion?.label || (feedback?.status === 'correct' ? 'celebrating' : feedback?.status === 'hint' ? 'thinking' : 'encouraging');
  const coachToneLabel = personality?.coachTone?.includes('analitikal')
    ? 'Analitikal'
    : personality?.coachTone?.includes('ceria')
      ? 'Ceria'
      : personality?.coachTone?.includes('tenang')
        ? 'Tenang'
        : 'Berpanduan';
  const teachingStyleLabel = {
    guided: 'berpandu',
    discussion: 'perbincangan',
    challenge: 'cabaran',
    independent: 'kendiri',
    visual: 'visual',
    auditory: 'pendengaran',
    practice: 'latihan',
    balanced: 'seimbang'
  }[teachingStrategy?.teachingStyle] || 'berpandu';
  const feedbackMessage = feedback?.status === 'correct'
    ? personality?.achievementMessage || 'Syabas! Kamu berjaya menjawab soalan ini.'
    : feedback?.status === 'almost'
      ? personality?.motivation || 'Hampir betul. Jom kemaskan jawapan sedikit lagi.'
      : feedback?.status === 'hint'
        ? `Petunjuk ${coachToneLabel}`
        : personality?.farewell || 'Tak mengapa. Mari kita cuba sekali lagi.';
  const feedbackTitle = feedback?.status === 'correct'
    ? 'Syabas!'
    : feedback?.status === 'almost'
      ? 'Hampir betul'
      : feedback?.status === 'hint'
        ? `Petunjuk ${coachToneLabel}`
      : 'Tak mengapa.';
  const progressWidth = clampPercent(progress);
  const safeCoachingDecision = coachDecision || teachingStrategy?.coachingDecision || null;
  const safeHint = sanitizeAiText(coachKnowledgeData?.hint || safeCoachingDecision?.hint || question?.hint || 'Cari kata kunci penting.');
  const safeQuestionExplanation = sanitizeAiText(question?.explanation || question?.hint || '');
  const [speechState, setSpeechState] = useState('idle');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechResult, setSpeechResult] = useState(null);
  const speechSessionRef = useRef(null);
  const speechSupported = useMemo(() => supportsSpeechRecognition(), []);
  const speechAnswer = useMemo(() => {
    return getAcceptedAnswers(question)[0] || '';
  }, [question]);

  useEffect(() => () => {
    speechSessionRef.current?.cancel?.();
  }, []);

  useEffect(() => {
    speechSessionRef.current?.cancel?.();
    setSpeechState('idle');
    setSpeechTranscript('');
    setSpeechResult(null);
  }, [question?.id]);

  function handleSpeechStart() {
    if (!speechSupported || !speechAnswer) return;
    stopVoice();
    speechSessionRef.current?.cancel?.();
    const session = createSpeechSession({
      expectedAnswer: speechAnswer,
      acceptedAnswers: getAcceptedAnswers(question),
      onChange(nextState) {
        setSpeechState(nextState.status || 'idle');
        setSpeechTranscript(nextState.transcript || '');
        if (nextState.result) setSpeechResult(nextState.result);
      },
      onResult(result) {
        setSpeechTranscript(result.transcript || '');
        setSpeechResult(result);
        onAnswerChange(result.transcript || '');
        setSpeechState(result?.status || 'completed');
      },
      onError() {
        setSpeechState('idle');
      }
    });
    speechSessionRef.current = session;
    const started = session.start();
    if (started?.unsupported) {
      setSpeechState('unsupported');
    }
  }

  const speechStatusLabel = {
    idle: 'Sedia',
    listening: 'Mendengar',
    processing: 'Memproses',
    completed: 'Selesai',
    empty: 'Cuba Lagi',
    error: 'Ralat',
    unsupported: 'Tidak disokong'
  }[speechState] || 'Sedia';

  const speechButtonLabel = {
    idle: 'Mikrofon',
    listening: 'Mendengar',
    processing: 'Memproses',
    completed: 'Cuba Lagi',
    empty: 'Cuba Lagi',
    error: 'Cuba Lagi',
    unsupported: 'Mikrofon'
  }[speechState] || 'Mikrofon';
  const speechMessage = typeof speechResult?.message === 'string' ? speechResult.message : '';

  return <main className="app"><div className="topbar"><button className="ghost" type="button" onClick={onBack}>Papan Utama</button><span className="pill">Soalan {questionIndex + 1} / {topic.questions.length}</span></div><section className="card tutor-card"><BrandLogo iconOnly /><div><p className="eyebrow">{subject.title}</p><h2>{topic.title}</h2><p>{topic.note}</p></div></section><section className="card"><div className="progress-wrap"><div className="progress" style={{ width: `${progressWidth}%` }} /></div><h1 className="question">{question.q}</h1><input value={answer} onChange={e => onAnswerChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); feedback ? onNextQuestion() : onCheckAnswer(); } }} placeholder="Tulis jawapan di sini" autoFocus /><div className="actions"><VoiceButton text={question?.q?.replaceAll('________', ' kosong ')} label="Baca Soalan" title="Baca soalan" className="secondary" />{speechSupported && <button className="secondary" type="button" onClick={handleSpeechStart} aria-label="Mikrofon">{speechButtonLabel}</button>}<button className="secondary" type="button" onClick={onPetunjuk}>Petunjuk</button></div>{speechSupported && <p className="speech-status" aria-live="polite"><b>{speechStatusLabel}</b>{speechTranscript ? <span>{speechTranscript}</span> : <span>Ucapkan jawapan kamu.</span>}</p>}{speechMessage && <p className="autosave-note" aria-live="polite">{speechMessage}</p>}{speechResult && <p className={`speech-result ${speechResult.correct ? 'correct' : 'wrong'}`}>{speechResult.correct ? 'Betul' : 'Cuba lagi'} · Keyakinan {speechResult.confidence}%</p>}<div className="actions"><button className="secondary" type="button" onClick={onBookmark}>{isBookmarked ? 'Ditanda' : 'Tanda Soalan'}</button><button className="secondary" type="button" onClick={onOpenAi}>Tanya Guru AI</button></div><button className="full" type="button" onClick={onCheckAnswer}>Semak Jawapan</button><details className="qde-debug-panel"><summary>Panel Bantuan</summary><dl><dt>Soalan Dipilih</dt><dd>{qipRow.metadata?.questionId || question.id || '-'}</dd><dt>Sebab Dipilih</dt><dd>{qipRow.reasonSelected || debugRow.reason || '-'}</dd><dt>Keputusan Sejarah</dt><dd>{JSON.stringify(qipRow.historyCheck || { historyMatch: Boolean(qipRow.historyMatch || debugRow.historyMatch) })}</dd><dt>Keputusan Pendua</dt><dd>{(qipRow.duplicateCheck || debugRow.duplicateCheck || ['pass']).join(', ')}</dd><dt>Skor Kepelbagaian</dt><dd>{diversityScore.overallDiversity || 0}%</dd><dt>Stem Asal</dt><dd>{qipRow.originalStem || question.question || '-'}</dd><dt>Stem Dipilih</dt><dd>{qipRow.selectedStem || question.q || '-'}</dd><dt>Kumpulan Variasi</dt><dd>{qipRow.variationGroup || '-'}</dd><dt>Sebab Stem</dt><dd>{qipRow.stemSelectionReason || '-'}</dd><dt>Penggunaan Semula Stem</dt><dd>{qipRow.stemReuseCount || 0}</dd><dt>Konteks Asal</dt><dd>{qipRow.originalContext || '-'}</dd><dt>Konteks Dipilih</dt><dd>{qipRow.selectedContext || '-'}</dd><dt>Kumpulan Konteks</dt><dd>{qipRow.contextGroup || '-'}</dd><dt>Sebab Konteks</dt><dd>{qipRow.contextSelectionReason || '-'}</dd><dt>Penggunaan Semula Konteks</dt><dd>{qipRow.contextReuseCount || 0}</dd><dt>Kepelbagaian Konteks</dt><dd>{diversityScore.contextDiversity || 0}%</dd><dt>Templat</dt><dd>{qipRow.metadata?.templateId || qipRow.templateId || debugRow.templateId || debugRow.templateUsed || '-'}</dd><dt>Tahap Kesukaran</dt><dd>{qipRow.metadata?.difficulty || qipRow.difficulty || debugRow.difficulty || question.difficulty || '-'}</dd></dl></details><p className="autosave-note">Simpanan automatik aktif.</p></section>{feedback && <section className={`feedback ${feedback.status}`}><MascotCard character={quizCharacter} mood={feedbackMood} size="sm" animation="gentle" message={feedbackMessage} /><h2>{feedbackTitle}</h2><p>{feedback.message}</p>{feedback.correctAnswer && <p>Jawapan tepat: <b>{feedback.correctAnswer}</b></p>}{(feedback.explanation || safeQuestionExplanation) && <div className="explain-box"><b>Janna</b><p>{feedback.explanation || safeQuestionExplanation}</p></div>}{feedback.status === 'hint' && <VoiceButton text={safeHint} label="Baca Petunjuk" title="Baca petunjuk" className="secondary" />}{feedback.status !== 'hint' && <div className="actions"><button className="secondary" type="button" onClick={onExplain}>Terangkan</button><button className="secondary" type="button" onClick={onTryAgain}>Cuba Lagi</button><button type="button" onClick={onNextQuestion}>Seterusnya</button></div>}</section>}</main>;
}

function Finish({ profile, session, topic, nextTopic, aiSummary, personality, voiceSummaryText, gamificationProfile, onDashboard, onRetry, onNextTopic, onOpenAi }) {
  const scorePercent = clampPercent(session.percent);
  const passed = scorePercent >= 80;
  const finishMessage = passed ? PERSONALITY_MESSAGES.completed : PERSONALITY_MESSAGES.retry;
  const stars = normalizeStars(session.stars);
  const strongestTopic = aiSummary?.strongestTopic || null;
  const weakestTopic = aiSummary?.weakestTopic || null;
  const projectedMastery = Number.isFinite(Number(aiSummary?.forecast?.projected)) ? `${clampPercent(aiSummary.forecast.projected)}%` : '-';
  const journeySummary = personality?.journeySummary || aiSummary?.journeySummary || '';
  const summaryCards = [
    {
      label: 'Topik Terkuat',
      value: strongestTopic ? getTopicDisplayName(strongestTopic, '-') : 'Belum ada data'
    },
    {
      label: 'Topik Terlemah',
      value: weakestTopic ? getTopicDisplayName(weakestTopic, '-') : 'Belum ada data'
    },
    {
      label: 'Cadangan Belajar',
      value: aiSummary?.studyRecommendation || 'Belum ada cadangan.'
    },
    {
      label: 'Kesediaan',
      value: formatStatus(aiSummary?.readinessLevel || 'needs_support')
    },
    {
      label: 'Penguasaan Dijangka',
      value: projectedMastery
    }
  ];

  return <main className="app reward-page"><section className="card finish reward-card"><MascotCard character="janna" mood={personality?.emotion?.label || (passed ? 'celebrating' : 'encouraging')} size="lg" animation="bounce" message={personality?.achievementMessage || finishMessage} /><div className="big bounce"><RewardBadgeIcon /></div><p className="eyebrow">{getTopicDisplayName(topic, 'Topik Selesai')}</p><h1>{passed ? (personality?.achievementMessage || 'Hebat!') : (personality?.farewell || 'Tak mengapa. Cuba lagi.')}</h1><p>{passed ? 'Kamu telah menamatkan latihan ini.' : (personality?.farewell || 'Tak mengapa. Mari kita cuba sekali lagi dengan tenang.')}</p>{journeySummary && <p className="memory-last">{journeySummary}</p>}<VoiceButton text={voiceSummaryText || journeySummary || personality?.farewell || personality?.achievementMessage || ''} label="Baca Ringkasan" title="Baca ringkasan akhir" className="voice-inline" /><div className="result-score"><b>{scorePercent}%</b><span>{stars}</span></div>{gamificationProfile && <GamificationSummary profile={gamificationProfile} source={{ profile, gamificationProfile }} className="finish-gamification-summary" />}<div className="finish-rewards"><div><b>{stars}</b><span>Bintang</span></div><div><b>{Number(session.xp) || 0}</b><span>XP diterima</span></div><div><b>{Number(profile?.streak) || 0}</b><span>Streak</span></div></div><div className="finish-summary-grid">{summaryCards.map(card => <div className="finish-summary-card" key={card.label}><span>{card.label}</span><b>{card.value}</b></div>)}</div><div className="actions"><button onClick={passed && nextTopic ? onNextTopic : onRetry}>{passed && nextTopic ? 'Teruskan Belajar' : 'Cuba Lagi'}</button><button className="secondary" onClick={onDashboard}>Papan Utama</button><button className="secondary" onClick={onOpenAi}>Tanya Guru AI</button></div></section></main>;
}

function UasaSimulator({ profile, subject, resume, onBack, onSave, onResumeChange, onClearResume }) {
  const subjectResume = resume?.subjectId === subject?.id
    ? resume
    : readSubjectScoped(subject?.id, profile?.year || 'Tahun 2', 'uasaSession', null);
  const questions = useMemo(() => Array.isArray(subjectResume?.questions) && subjectResume.questions.length ? subjectResume.questions : buildUasaSet(subject, 50), [subject?.id, subjectResume?.sessionId]);
  const [questionIndex, setQuestionIndex] = useState(() => Number.isInteger(subjectResume?.currentIndex) ? subjectResume.currentIndex : Number.isInteger(subjectResume?.questionIndex) ? subjectResume.questionIndex : 0);
  const [answer, setAnswer] = useState(() => subjectResume?.state?.answer || '');
  const [result, setResult] = useState(() => subjectResume?.state?.result || null);
  const [score, setScore] = useState(() => subjectResume?.state?.score || { correct: Number(subjectResume?.correct || 0), wrong: Number(subjectResume?.wrong || 0) });
  const [uasaStateSubjectId, setUasaStateSubjectId] = useState(() => subject?.id || '');
  const completedRef = useRef(Boolean(resume?.completed));

  useEffect(() => {
    setUasaStateSubjectId(null);
    setQuestionIndex(Number.isInteger(subjectResume?.currentIndex) ? subjectResume.currentIndex : Number.isInteger(subjectResume?.questionIndex) ? subjectResume.questionIndex : 0);
    setAnswer(subjectResume?.state?.answer || '');
    setResult(subjectResume?.state?.result || null);
    setScore(subjectResume?.state?.score || { correct: Number(subjectResume?.correct || 0), wrong: Number(subjectResume?.wrong || 0) });
    completedRef.current = Boolean(subjectResume?.completed);
  }, [subject?.id]);

  useEffect(() => {
    if (!uasaStateSubjectId && subject?.id) setUasaStateSubjectId(subject.id);
  }, [subject?.id, uasaStateSubjectId]);

  const question = questions[questionIndex];

  useEffect(() => {
    if (completedRef.current) return;
    if (!onResumeChange || !subject) return;
    if (uasaStateSubjectId !== subject.id) return;
    if (subjectResume?.subjectId && subjectResume.subjectId !== subject.id) return;
    const nextResume = {
      version: 1,
      mode: 'uasa',
      screen: 'uasa',
      sessionId: subjectResume?.sessionId || subjectResume?.session?.sessionId || `uasa_${subject.id}_${questions.length}`,
      subjectId: subject.id,
      topicId: subjectResume?.topicId || `uasa_${subject.id}`,
      questions,
      currentIndex: questionIndex,
      questionIndex,
      answers: subjectResume?.answers || [],
      score: Math.round((score.correct / Math.max(1, questions.length)) * 100),
      correct: score.correct,
      wrong: score.wrong,
      metadata: {
        displayTitle: 'Simulator UASA',
        subjectTitle: subject.title
      },
      startedAt: subjectResume?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: Boolean(result && questionIndex + 1 >= questions.length),
      session: {
        ...(subjectResume?.session || {}),
        mode: 'uasa',
        subjectId: subject.id
      },
      state: {
        questionIndex,
        answer,
        result,
        score
      }
    };
    writeSubjectScoped(subject.id, profile?.year || 'Tahun 2', 'uasaSession', nextResume);
    onResumeChange(nextResume);
  }, [answer, questionIndex, questions, result, score, subject, onResumeChange, uasaStateSubjectId, subjectResume?.subjectId]);

  if (!subject) {
    return <main className="app"><EmptyState title="Subjek tidak dijumpai." message="Kembali ke Papan Utama untuk memilih subjek." actionLabel="Papan Utama" onAction={onBack} /></main>;
  }

  function submitAnswer() {
    if (!question) return;
    if (result) return;
    const checked = smartCheck(answer, question);
    const correct = checked.status === 'correct';
    const nextScore = {
      correct: score.correct + (correct ? 1 : 0),
      wrong: score.wrong + (correct ? 0 : 1)
    };
    setScore(nextScore);
    setResult({
      correct,
      expected: getAcceptedAnswers(question).join(' / ') || question.answer,
      explanation: question.explanation || question.hint || '',
      message: checked.message
    });
    if (questionIndex + 1 >= questions.length) {
      const total = questions.length;
      const percent = Math.round((nextScore.correct / Math.max(1, total)) * 100);
      completedRef.current = true;
      onSave({
        date: todayKey(),
        subjectId: subject.id,
        subjectShort: subject.short,
        grade: getGrade(percent),
        score: percent,
        total,
        correct: nextScore.correct,
        wrong: nextScore.wrong
      });
      clearSubjectScoped(subject.id, profile?.year || 'Tahun 2', 'uasaSession');
      onClearResume?.();
      return;
    }
  }

  function nextQuestion() {
    if (!result) return;
    if (questionIndex + 1 >= questions.length) {
      completedRef.current = true;
      clearSubjectScoped(subject.id, profile?.year || 'Tahun 2', 'uasaSession');
      onClearResume?.();
      onBack();
      return;
    }
    setQuestionIndex(index => index + 1);
    setAnswer('');
    setResult(null);
  }

  return <main className="app uasa-page"><div className="topbar"><button className="ghost" type="button" onClick={onBack}>Papan Utama</button><span className="pill">Simulator UASA</span></div><section className="card uasa-card"><p className="eyebrow">Latihan UASA</p><h1>Simulator UASA {subject.title}</h1><p>Jawab soalan campuran daripada topik subjek ini.</p><div className="mastery-summary-grid"><div><b>Soalan {questionIndex + 1} / {questions.length}</b><span>Soalan</span></div><div><b>{score.correct}</b><span>Betul</span></div><div><b>{score.wrong}</b><span>Salah</span></div><div><b>{profile?.uasaHistory?.length || 0}</b><span>Sejarah</span></div></div></section>{question ? <section className="card"><p className="eyebrow">Soalan {questionIndex + 1}</p><h2>{question.q}</h2><input value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Tulis jawapan kamu" autoFocus /><div className="actions"><button type="button" onClick={submitAnswer} disabled={Boolean(result)}>Semak Jawapan</button><button type="button" className="secondary" onClick={nextQuestion} disabled={!result}>Seterusnya</button></div>{result && <div className={`feedback ${result.correct ? 'correct' : 'wrong'}`} aria-live="polite"><h2>{result.correct ? 'Betul' : 'Cuba lagi'}</h2><p>Jawapan diterima: <b>{result.expected}</b></p>{result.explanation && <p>{result.explanation}</p>}</div>}</section> : <EmptyState title="Tiada soalan UASA." message="Pilih subjek lain untuk mencuba simulasi." actionLabel="Papan Utama" onAction={onBack} />}</main>;
}

const readingPassages = semanticReadingPassages;

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

function containsArabicText(value = '') {
  return /[\p{Script=Arabic}]/u.test(String(value ?? ''));
}

function safeArabicCoachText(value, fallback = '') {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  return containsArabicText(text) ? text : fallback;
}

function compareBacaan(targetText = '', transcript = '') {
  const targetWords = splitBacaanWords(targetText);
  const spokenWords = splitBacaanWords(transcript);
  const rows = Array.from({ length: targetWords.length + 1 }, () => Array(spokenWords.length + 1).fill(0));
  for (let i = targetWords.length - 1; i >= 0; i -= 1) {
    for (let j = spokenWords.length - 1; j >= 0; j -= 1) {
      rows[i][j] = targetWords[i].normalized === spokenWords[j].normalized ? rows[i + 1][j + 1] + 1 : Math.max(rows[i + 1][j], rows[i][j + 1]);
    }
  }
  const matchedTargetIndexes = new Set();
  const matchedSpokenIndexes = new Set();
  let i = 0;
  let j = 0;
  while (i < targetWords.length && j < spokenWords.length) {
    if (targetWords[i].normalized === spokenWords[j].normalized) { matchedTargetIndexes.add(i); matchedSpokenIndexes.add(j); i += 1; j += 1; }
    else if (rows[i + 1][j] >= rows[i][j + 1]) i += 1;
    else j += 1;
  }
  const correct = matchedTargetIndexes.size;
  const words = targetWords.map((word, index) => ({ text: word.raw, status: matchedTargetIndexes.has(index) ? 'correct' : 'missed' }));
  const missed = targetWords.filter((_, index) => !matchedTargetIndexes.has(index)).map(word => word.raw);
  const extraWords = spokenWords.filter((_, index) => !matchedSpokenIndexes.has(index)).map(word => word.raw);
  const score = targetWords.length ? Math.max(0, Math.round((correct / targetWords.length) * 100 - extraWords.length * 2 - missed.length)) : 0;
  return { words, correct, tertinggal: missed.length, missed, incorrect: extraWords.length, incorrectWords: extraWords, extraWords, totalTargetWords: targetWords.length, matchedWordCount: correct, missedWordCount: missed.length, extraWordCount: extraWords.length, passed: score >= 80, score };
}

function nextCommunicationSessionIndex(currentIndex, size) {
  const safeSize = Math.max(1, Number(size) || 1);
  const safeIndex = Number.isInteger(currentIndex) ? currentIndex : 0;
  return (safeIndex + 1) % safeSize;
}

function BacaanCoach({ profile, resume, onResumeChange, onClearResume, onBack, onFinish }) {
  const initialPassageId = readingPassages.find(item => item.id === resume?.state?.passageId)?.id || readingPassages[0]?.id || 'bm';
  const [passageId, setPassageId] = useState(() => (resume?.mode === 'reading' && initialPassageId) || initialPassageId);
  const [sessionIndex, setSessionIndex] = useState(() => Number.isInteger(resume?.state?.sessionIndex) ? resume.state.sessionIndex : 0);
  const [transcript, setTranscript] = useState(() => resume?.state?.transcript || '');
  const [listening, setMendengar] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [result, setResult] = useState(() => {
    if (resume?.state?.result && typeof resume.state.result === 'object') {
      return normalizeBacaanResult(resume.state.result);
    }
    return null;
  });
  const [scoreHistory, setScoreHistory] = useState(() => sanitizeCommunicationScoreHistory(resume?.state?.scoreHistory));
  const recordedSessionRef = useRef(new Set());
  const speechSessionRef = useRef(null);
  const passageChangeRef = useRef(passageId);
  const resumeChangeRef = useRef(onResumeChange);
  const resumeSignatureRef = useRef('');
  const passageBase = readingPassages.find(item => item.id === passageId) || readingPassages[0] || {
    id: 'bm',
    language: 'BM',
    speechLang: 'ms-MY',
    title: 'Bacaan',
    text: '',
    questions: []
  };
  const passage = passageBase.sessionItems?.[sessionIndex % passageBase.sessionItems.length] || passageBase;
  const safeResult = normalizeBacaanResult(result);
  const communicationResult = normalizeCommunicationResult(result);
  const hasResult = Boolean(result);
  const sessionSummary = buildCommunicationSessionSummary(scoreHistory);
  const safePassageText = passage?.language === 'arab'
    ? safeArabicCoachText(passage?.text, 'Tiada petikan bacaan tersedia buat masa ini.')
    : typeof passage?.text === 'string' ? passage.text : '';
  const safeTranscript = typeof transcript === 'string' ? transcript : '';
  const safeWords = Array.isArray(safeResult.words) ? safeResult.words : [];
  const safeMissed = Array.isArray(safeResult.missed) ? safeResult.missed : [];
  const safeMissingWords = Array.isArray(safeResult.missingWords) ? safeResult.missingWords : safeMissed;
  const safeExtraWords = Array.isArray(safeResult.extraWords) ? safeResult.extraWords : [];
  const createBacaanResult = (spokenTranscript = '') => {
    const comparison = compareBacaan(passage.text, spokenTranscript);
    const words = Array.isArray(comparison.words) ? comparison.words : [];
    const matchedWords = words.filter(item => item?.status === 'correct').map(item => item?.text).filter(Boolean);
    const missedWords = words.filter(item => item?.status === 'missed').map(item => item?.text).filter(Boolean);
    return normalizeBacaanResult({
      status: typeof spokenTranscript === 'string' && spokenTranscript.trim() ? 'completed' : 'empty',
      transcript: spokenTranscript,
      score: Number.isFinite(Number(comparison.score)) ? Number(comparison.score) : 0,
      correct: Number(comparison.score) >= 80,
      confidence: Math.max(0, Math.min(100, Number(comparison.score) || 0)),
      words,
      matched: matchedWords,
      matchedWords,
      missed: missedWords,
      missingWords: missedWords,
      extraWords: Array.isArray(comparison.extraWords) ? comparison.extraWords : [],
      totalTargetWords: comparison.totalTargetWords,
      matchedWordCount: comparison.matchedWordCount,
      missedWordCount: comparison.missedWordCount,
      extraWordCount: comparison.extraWordCount,
      passed: comparison.passed,
      message: typeof spokenTranscript === 'string' && spokenTranscript.trim()
        ? ''
        : 'Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.',
      errorCode: typeof spokenTranscript === 'string' && spokenTranscript.trim() ? '' : 'no-result'
    });
  };

  const clearBacaanSession = () => {
    speechSessionRef.current?.cancel?.();
    speechSessionRef.current = null;
    setMendengar(false);
  };

  const resetBacaanState = () => {
    setTranscript('');
    setResult(null);
    setMendengar(false);
  };

  const recordBacaanResult = nextResult => {
    const normalized = normalizeBacaanResult(nextResult);
    const itemIdentity = `${passageId}:${sessionIndex}`;
    setResult(normalized);
    recordCommunicationScore({
      ref: recordedSessionRef,
      itemKey: itemIdentity,
      result: normalized,
      setScoreHistory
    });
  };

  useEffect(() => {
    setRecognitionSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (passageChangeRef.current === passageId) return;
    passageChangeRef.current = passageId;
    clearBacaanSession();
    setSessionIndex(current => nextCommunicationSessionIndex(current, passageBase.sessionItems?.length || 1));
    resetBacaanState();
  }, [passageId]);

  useEffect(() => {
    resumeChangeRef.current = onResumeChange;
  }, [onResumeChange]);

  useEffect(() => {
    if (!resumeChangeRef.current) return;
    const nextSignature = [
      'reading',
      passageId,
      safeTranscript,
      safeResult.status,
      safeResult.score,
      safeResult.correct ? '1' : '0',
      safeResult.message,
      safeResult.errorCode,
      safeResult.words.length,
      safeResult.matched.length,
      safeResult.missingWords.length,
      safeResult.extraWords.length
    ].join('|');
    if (resumeSignatureRef.current === nextSignature) return;
    resumeSignatureRef.current = nextSignature;
    resumeChangeRef.current({
      version: 1,
      mode: 'reading',
      screen: 'reading',
      sessionId: resume?.sessionId || `reading_${passage.id}`,
      subjectId: resume?.subjectId || 'reading',
      topicId: resume?.topicId || passage.id,
      metadata: {
        displayTitle: 'Bacaan',
        subjectTitle: passage.title
      },
      startedAt: resume?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
      state: {
        passageId,
        sessionIndex,
        transcript: safeTranscript,
        result: safeResult,
        scoreHistory
      }
    });
  }, [passageId, sessionIndex, safeTranscript, safeResult.status, safeResult.score, safeResult.correct, safeResult.message, safeResult.errorCode, safeResult.words.length, safeResult.matched.length, safeResult.missingWords.length, safeResult.extraWords.length, scoreHistory, passage.id, passage.title]);

  useEffect(() => () => {
    clearBacaanSession();
  }, []);

  function startMendengar() {
    if (!recognitionSupported) return;
    stopVoice();
    clearBacaanSession();
    resetBacaanState();
    const session = createReadingSpeechSession({
      lang: passage.speechLang,
      resultFactory: spokenTranscript => createBacaanResult(spokenTranscript),
      onChange(nextState) {
        const safeTranscript = typeof nextState?.transcript === 'string' ? nextState.transcript : '';
        setTranscript(safeTranscript);
        setMendengar(nextState?.status === 'listening' || nextState?.status === 'processing');
        if (nextState?.result && typeof nextState.result === 'object') {
          setResult(normalizeBacaanResult(nextState.result));
        }
      },
      onTranscript(nextTranscript) {
        setTranscript(typeof nextTranscript === 'string' ? nextTranscript : '');
      },
      onResult(nextResult) {
          recordBacaanResult(nextResult);
        setMendengar(false);
      },
      onEmpty(nextResult) {
        setResult(normalizeBacaanResult(nextResult));
        setTranscript('');
        setMendengar(false);
      },
      onError(error) {
        if (error === 'aborted') return;
        setMendengar(false);
      },
      onStopped() {
        setMendengar(false);
      }
    });
    speechSessionRef.current = session;
    const started = session.start();
    if (started?.unsupported) {
      setRecognitionSupported(false);
      setMendengar(false);
    }
  }

  function checkManual() {
    stopVoice();
    clearBacaanSession();
    if (!String(transcript || '').trim()) {
      setResult(createEmptyBacaanResult('Taip atau baca petikan sebelum menyemak.'));
      setMendengar(false);
      return;
    }
    const nextResult = compareBacaan(passage.text, transcript);
    recordBacaanResult({
      ...nextResult,
      status: 'completed',
      transcript,
      confidence: Number.isFinite(Number(nextResult.score)) && nextResult.score > 0 ? nextResult.score : 0,
      matched: Array.isArray(nextResult.words) ? nextResult.words.filter(item => item?.status === 'correct').map(item => item?.text).filter(Boolean) : [],
      matchedWords: Array.isArray(nextResult.words) ? nextResult.words.filter(item => item?.status === 'correct').map(item => item?.text).filter(Boolean) : [],
      missed: Array.isArray(nextResult.words) ? nextResult.words.filter(item => item?.status === 'missed').map(item => item?.text).filter(Boolean) : [],
      missingWords: Array.isArray(nextResult.words) ? nextResult.words.filter(item => item?.status === 'missed').map(item => item?.text).filter(Boolean) : [],
      extraWords: Array.isArray(nextResult.incorrectWords) ? nextResult.incorrectWords : []
    });
    setMendengar(false);
  }

  function nextBacaan() {
    if (!communicationResult.canAdvance) {
      retryBacaan();
      return;
    }
    clearBacaanSession();
    resetBacaanState();
    setSessionIndex(current => nextCommunicationSessionIndex(current, passageBase.sessionItems?.length || 1));
  }

  function retryBacaan() {
    clearBacaanSession();
    resetBacaanState();
  }

  function saveResult() {
    const nextResult = result && typeof result === 'object'
      ? normalizeBacaanResult(result)
      : compareBacaan(passage.text, transcript);
    const contract = normalizeCommunicationResult(nextResult);
    const completedScores = sanitizeCommunicationScoreHistory(scoreHistory);
    if (!contract.isAssessed || !completedScores.length) {
      onClearResume?.();
      onBack?.();
      return;
    }
    const averageScore = Math.round(completedScores.reduce((sum, value) => sum + Number(value || 0), 0) / completedScores.length);
    const passedCount = completedScores.filter(value => Number(value) >= 80).length;
    onFinish({
      language: passage.language,
      title: passage.title,
      targetText: passage.text,
      transcript,
      score: nextResult.score,
      correct: nextResult.correct,
      passed: nextResult.passed,
      totalTargetWords: nextResult.totalTargetWords,
      matchedWordCount: nextResult.matchedWordCount,
      missedWordCount: nextResult.missedWordCount,
      extraWordCount: nextResult.extraWordCount,
      tertinggal: Array.isArray(nextResult.missed) ? nextResult.missed : [],
      incorrect: Number(nextResult.incorrect) || 0,
      isAssessed: true,
      scoreHistory: completedScores,
      completedPassages: completedScores.length,
      averageScore,
      bestScore: Math.max(...completedScores),
      passedCount,
      latestPercent: completedScores[completedScores.length - 1],
      finalItemScore: nextResult.score
    });
    onClearResume?.();
  }

  return <main className="app reading-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Papan Utama</button><span className="pill">Jurulatih Bacaan Luar Talian</span></div><section className="card reading-hero"><div className="communication-hero-icon" aria-hidden="true"><IconGlyph name="book" /></div><div><p className="eyebrow">Jurulatih Bacaan AI</p><h1>{passage.title}</h1><p>Tiada API berbayar. Guna pengecaman suara pelayar jika tersedia, atau taip jawapan secara manual.</p></div></section><section className="card"><p className="eyebrow">Pilih Petikan</p><div className="reading-tabs">{readingPassages.map(item => <button key={item.id} className={item.id === passageId ? '' : 'secondary'} onClick={() => setPassageId(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${passage.language === 'arab' ? 'rtl' : ''}`} lang={passage.language === 'arab' ? 'ar' : undefined} dir={passage.language === 'arab' ? 'rtl' : undefined}>{safePassageText || 'Tiada petikan bacaan tersedia buat masa ini.'}</div><div className="actions"><button onClick={startMendengar} disabled={!recognitionSupported || listening}>{listening ? 'Sedang mendengar...' : 'Mula Bercakap'}</button><button className="secondary" onClick={checkManual}>Semak Teks</button></div>{!recognitionSupported && <p className="autosave-note">Pelayar ini tidak menyokong pengecaman suara. Taip bacaan kamu di bawah.</p>}<label>Transkrip / bacaan manual</label><textarea lang={passage.language === 'arab' ? 'ar' : undefined} dir={passage.language === 'arab' ? 'rtl' : 'auto'} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Transkrip suara atau bacaan manual..." /></section>{hasResult && <section className="card reading-result"><p className="eyebrow">Keputusan Bacaan</p>{communicationResult.isAssessed ? <><h2>{clampPercent(safeResult.score)}%</h2><div className="word-check reading-word-check" lang={passage.language === 'arab' ? 'ar' : undefined} dir={passage.language === 'arab' ? 'rtl' : undefined}>{safeWords.map((word, index) => <span key={`${word.text}-${index}`} className={word.status === 'correct' ? 'word-good' : 'word-miss'}>{word.text}</span>)}</div>{safeExtraWords.length > 0 && <p>Perkataan tambahan kurang tepat: <b>{safeExtraWords.join(', ')}</b></p>}<div className="recommend-meta"><span>{safeResult.matchedWordCount}/{safeResult.totalTargetWords} perkataan betul</span><span>{safeResult.missedWordCount} tertinggal</span><span>{safeResult.extraWordCount} tambahan</span><span>{safeResult.passed ? 'Lulus' : 'Belum lulus'}</span></div><div className="actions"><button onClick={nextBacaan}>Seterusnya</button><button className="secondary" onClick={saveResult}>Tamatkan Sesi</button></div></> : <><h2>Belum dinilai</h2><p>{safeResult.message || 'Jawapan belum diterima.'}</p><div className="actions"><button className="secondary" onClick={retryBacaan}>Cuba Lagi</button><button className="secondary" onClick={saveResult}>Tamatkan Sesi</button></div></>}</section>}{sessionSummary.hasEvidence ? <section className="card reading-result"><p className="eyebrow">Ringkasan Sesi</p><p>{sessionSummary.completedItems} petikan selesai • Purata {sessionSummary.averagePercent}% • Terbaik {sessionSummary.bestPercent}%</p></section> : <section className="card reading-result"><p className="eyebrow">Ringkasan Sesi</p><p>Belum ada sesi direkodkan.</p><p className="memory-last">Lengkapkan sekurang-kurangnya satu latihan yang dinilai untuk melihat ringkasan.</p></section>}</main>;
}
const listeningSets = semanticListeningSets;

function normalizeMendengar(text = '') {
  return normalizeBacaanWord(text).replace(/\s+/g, '');
}

function normalizeListeningAcceptedAnswers(values = []) {
  const variants = new Set();
  (Array.isArray(values) ? values : [values]).forEach(value => {
    const normalized = normalizeMendengar(value);
    if (!normalized) return;
    variants.add(normalized);
    if (normalized.startsWith('di') && normalized.length > 2) variants.add(normalized.slice(2));
    if (normalized.startsWith('inthe') && normalized.length > 5) variants.add(normalized.slice(5));
    if (normalized.startsWith('in') && normalized.length > 2) variants.add(normalized.slice(2));
    if (normalized.startsWith('the') && normalized.length > 3) variants.add(normalized.slice(3));
  });
  return variants;
}

function recordCommunicationScore({ ref, itemKey, result, setScoreHistory }) {
  const normalized = normalizeCommunicationAttempt(result, { itemKey });
  if (!normalized.shouldAppendHistory) return false;
  if (!(ref.current instanceof Set)) ref.current = new Set();
  if (normalized.attemptKey && ref.current.has(normalized.attemptKey)) return false;
  if (normalized.attemptKey) ref.current.add(normalized.attemptKey);
  setScoreHistory(history => appendUniqueCommunicationResult(history, normalized));
  return true;
}

// Deprecated listening implementation removed; MendengarLab is the sole active surface.
const speakingPrompts = semanticSpeakingPrompts;

function scoreBertutur(prompt, transcript) {
  const safePrompt = prompt && typeof prompt === 'object' ? prompt : { keywords: [], text: '', title: '' };
  const safeTranscript = typeof transcript === 'string' ? transcript : '';
  const safeKeywords = Array.isArray(safePrompt.keywords) ? safePrompt.keywords : [];
  const normalizedTranscript = normalizeBacaanWord(safeTranscript);
  const matched = safeKeywords.filter(keyword => normalizedTranscript.includes(normalizeBacaanWord(keyword)));
  const transcriptWords = safeTranscript.trim().split(/\s+/).filter(Boolean);
  const keywordScore = safeKeywords.length ? Math.round((matched.length / safeKeywords.length) * 80) : 0;
  const lengthBonus = transcriptWords.length >= Math.min(5, safeKeywords.length + 2) ? 20 : 8;
  const missed = safeKeywords.filter(keyword => !matched.includes(keyword));
  return {
    score: Math.min(100, keywordScore + lengthBonus),
    matched,
    matchedKeywords: matched,
    tertinggal: missed,
    missingWords: missed,
    missed,
    words: safeKeywords.map(keyword => ({ text: keyword, status: matched.includes(keyword) ? 'correct' : 'missed' })),
    transcript: safeTranscript
  };
}

function normalizeBacaanResult(value) {
  const safeValue = value && typeof value === 'object' ? value : {};
  const words = Array.isArray(safeValue.words) ? safeValue.words : [];
  const matched = Array.isArray(safeValue.matched) ? safeValue.matched : [];
  const matchedWords = Array.isArray(safeValue.matchedWords) ? safeValue.matchedWords : matched;
  const missed = Array.isArray(safeValue.missed) ? safeValue.missed : [];
  const missingWords = Array.isArray(safeValue.missingWords) ? safeValue.missingWords : missed;
  const extraWords = Array.isArray(safeValue.extraWords) ? safeValue.extraWords : [];
  const score = Number.isFinite(Number(safeValue.score)) ? Number(safeValue.score) : 0;
  const metric = (candidate, fallback) => Number.isFinite(Number(candidate)) ? Math.max(0, Number(candidate)) : fallback;
  return {
    status: typeof safeValue.status === 'string' ? safeValue.status : 'idle',
    transcript: typeof safeValue.transcript === 'string' ? safeValue.transcript : '',
    score,
    correct: score >= 80,
    confidence: Number.isFinite(Number(safeValue.confidence)) ? Number(safeValue.confidence) : 0,
    words,
    matched,
    matchedWords,
    missed,
    missingWords,
    extraWords,
    totalTargetWords: metric(safeValue.totalTargetWords, 0),
    matchedWordCount: metric(safeValue.matchedWordCount, matchedWords.length),
    missedWordCount: metric(safeValue.missedWordCount, missed.length),
    extraWordCount: metric(safeValue.extraWordCount, extraWords.length),
    passed: score >= 80,
    message: typeof safeValue.message === 'string' ? safeValue.message : '',
    errorCode: typeof safeValue.errorCode === 'string' ? safeValue.errorCode : ''
  };
}

function createEmptyBacaanResult(message = '') {
  return normalizeBacaanResult({
    status: 'empty',
    transcript: '',
    score: 0,
    correct: false,
    confidence: 0,
    words: [],
    matched: [],
    matchedWords: [],
    missed: [],
    missingWords: [],
    extraWords: [],
    message,
    errorCode: 'no-result'
  });
}

function BertuturCoach({ resume, onResumeChange, onClearResume, onBack, onFinish }) {
  const [setId, setSetId] = useState(() => (resume?.mode === 'speaking' && resume?.state?.setId) || 'bm');
  const [sessionIndex, setSessionIndex] = useState(() => Number.isInteger(resume?.state?.sessionIndex) ? resume.state.sessionIndex : 0);
  const [mode, setMode] = useState(() => resume?.state?.mode || 'intro');
  const [transcript, setTranscript] = useState(() => resume?.state?.transcript || '');
  const [confirmedTranscript, setConfirmedTranscript] = useState(() => resume?.state?.transcript || '');
  const [manualTranscript, setManualTranscript] = useState(() => resume?.state?.transcript || '');
  const [recognizedDraft, setRecognizedDraft] = useState('');
  const [transcriptSource, setTranscriptSource] = useState(() => resume?.state?.transcript ? 'manual' : '');
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechCandidate, setSpeechCandidate] = useState(null);
  const [listening, setMendengar] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [result, setResult] = useState(() => resume?.state?.result || null);
  const [scoreHistory, setScoreHistory] = useState(() => sanitizeCommunicationScoreHistory(resume?.state?.scoreHistory));
  const recordedSessionRef = useRef(new Set());
  const modeResetRef = useRef({ setId, mode });
  const languageInitializedRef = useRef(false);
  const resumeChangeRef = useRef(onResumeChange);
  const recognitionRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const receivedResultRef = useRef(false);
  const finalizedRef = useRef(false);
  const abortedRef = useRef(false);
  const speechSeenResultKeysRef = useRef(new Set());
  const speechFinalTranscriptRef = useRef('');
  const speechFinalCandidateRef = useRef(null);
  const recognitionContextKeyRef = useRef('');
  const communicationContextKey = `speaking:${setId}:${mode}:${rawSet?.id || sessionIndex}`;
  recognitionContextKeyRef.current = communicationContextKey;
  const safariEmptyFailureRef = useRef(0);
  const [safariMicDisabled, setSafariMicDisabled] = useState(false);
  const setBase = speakingPrompts.find(item => item.id === setId) || speakingPrompts[0];
  const rawSet = setBase?.sessionItems?.[sessionIndex % setBase.sessionItems.length]
    ? { ...setBase.sessionItems[sessionIndex % setBase.sessionItems.length], id: setBase.id }
    : setBase;
  const rawSetTitle = rawSet?.title || '';
  const set = rawSet ? { ...rawSet, title: formatScopeLabel(rawSetTitle) } : rawSet;
  const isIOSSafari = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iP(hone|ad|od)/i.test(ua)
      && /Safari/i.test(ua)
      && !/(CriOS|FxiOS|EdgiOS|OPiOS|Android)/i.test(ua);
  }, []);
  const promptBank = useMemo(() => (set?.prompts && typeof set.prompts === 'object' ? set.prompts : {}), [set?.id]);
  const safeModeKeys = useMemo(() => Object.keys(promptBank).filter(key => promptBank?.[key]), [promptBank]);
  const safeModeKey = safeModeKeys.join('|');
  const prompt = promptBank?.[mode] || promptBank?.intro || Object.values(promptBank)[0] || { label: 'Soalan', text: '', keywords: [] };
  const safePrompt = prompt && typeof prompt === 'object' ? prompt : { label: 'Soalan', text: '', keywords: [] };
  const safePromptText = set?.id === 'arab'
    ? safeArabicCoachText(safePrompt?.text, 'Latihan Bertutur tidak mempunyai arahan yang sah buat masa ini.')
    : typeof safePrompt?.text === 'string' ? safePrompt.text : '';
  const safeKeywords = Array.isArray(safePrompt.keywords) ? safePrompt.keywords : [];
  const safeTranscript = typeof transcript === 'string' ? transcript.trim() : '';
  const safeResult = result && typeof result === 'object'
    ? result
    : { status: 'idle', score: 0, matched: [], matchedKeywords: [], tertinggal: [], missingWords: [], missed: [], words: [], transcript: '', confidence: 0, correct: false, errorCode: '', message: '' };
  const communicationResult = normalizeCommunicationResult(result);
  const sessionSummary = buildCommunicationSessionSummary(scoreHistory);
  const safeMatched = Array.isArray(safeResult.matched)
    ? safeResult.matched
    : Array.isArray(safeResult.matchedKeywords)
      ? safeResult.matchedKeywords
      : [];
  const safeMissing = Array.isArray(safeResult.missed)
    ? safeResult.missed
    : Array.isArray(safeResult.tertinggal)
      ? safeResult.tertinggal
      : Array.isArray(safeResult.missingWords)
        ? safeResult.missingWords
        : [];
  const safeWords = Array.isArray(safeResult.words) ? safeResult.words : [];
  const speechMessage = typeof safeResult.message === 'string' ? safeResult.message : '';
  const reviewCopy = getBertuturReviewCopy(set?.id || setId);
  const selectedRecognitionLanguage = set?.speechLang || (setId === 'bm' ? 'ms-MY' : setId === 'english' ? 'en-US' : 'ar-SA');
  const modes = useMemo(() => safeModeKeys.map(id => ({ id, label: promptBank?.[id]?.label || id })), [promptBank, safeModeKey]);
  const createEmptySpeechResult = (errorCode = 'no-result', message = 'Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.') => ({
    status: 'empty',
    transcript: '',
    correct: false,
    confidence: 0,
    matched: [],
    matchedKeywords: [],
    tertinggal: [],
    missingWords: [],
    missed: [],
    words: [],
    errorCode,
    message,
    score: 0
  });

  const extractSpeechTranscript = extractSpeechTranscriptShared;

  const clearSpeechTimeout = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  };

  const disposeRecognition = () => {
    const recognition = recognitionRef.current;
    clearSpeechTimeout();
    if (!recognition) return;
    try {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onnomatch = null;
    } catch {}
    try {
      recognition.stop?.();
    } catch {}
    try {
      recognition.abort?.();
    } catch {}
    recognitionRef.current = null;
  };

  const resetSpeechSession = () => {
    clearSpeechTimeout();
    receivedResultRef.current = false;
    finalizedRef.current = false;
    abortedRef.current = false;
    speechSeenResultKeysRef.current = new Set();
    speechFinalTranscriptRef.current = '';
    speechFinalCandidateRef.current = null;
    setInterimTranscript('');
    setSpeechCandidate(null);
    setRecognizedDraft('');
    setRecognitionConfidence(0);
  };

  const stopRecognitionSilently = () => {
    abortedRef.current = true;
    finalizedRef.current = true;
    setMendengar(false);
    disposeRecognition();
  };

  const finishSpeechSession = nextResult => {
    finalizedRef.current = true;
    clearSpeechTimeout();
    return nextResult;
  };

  const finalizeBertuturSession = (nextResult, nextTranscript = '', shouldCountFailure = false) => {
    finalizedRef.current = true;
    clearSpeechTimeout();
    if (shouldCountFailure && isIOSSafari) {
      safariEmptyFailureRef.current += 1;
      if (safariEmptyFailureRef.current >= 2) setSafariMicDisabled(true);
    } else if (isIOSSafari && (typeof nextResult?.transcript === 'string' ? nextResult.transcript.trim() : Boolean(nextResult?.correct))) {
      safariEmptyFailureRef.current = 0;
    }
    setTranscript(nextTranscript);
    setMendengar(false);
    const normalized = { ...nextResult, status: nextResult?.status || 'completed' };
    if (typeof normalized.transcript === 'string' && normalized.transcript.trim()) {
      recordCommunicationScore({
        ref: recordedSessionRef,
        itemKey: `${setId}:${mode}:${sessionIndex}`,
        result: normalized,
        setScoreHistory
      });
    }
    setResult(normalized);
    disposeRecognition();
  };

  useEffect(() => {
    setRecognitionSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (modeResetRef.current.setId === setId && modeResetRef.current.mode === mode) return;
    modeResetRef.current = { setId, mode };
    stopRecognitionSilently();
    setTranscript('');
    setResult(null);
    setRecognizedDraft('');
    setSpeechCandidate(null);
    setInterimTranscript('');
  }, [setId, mode]);

  useEffect(() => {
    if (!languageInitializedRef.current) {
      languageInitializedRef.current = true;
      return;
    }
    stopRecognitionSilently();
    setRecognizedDraft('');
    setSpeechCandidate(null);
    setInterimTranscript('');
    setRecognitionConfidence(0);
    setTranscript('');
    setTranscriptSource('');
    setResult(null);
  }, [setId]);

  useEffect(() => {
    setSessionIndex(current => nextCommunicationSessionIndex(current, setBase?.sessionItems?.length || 1));
  }, [setId]);

  useEffect(() => {
    resumeChangeRef.current = onResumeChange;
  }, [onResumeChange]);

  useEffect(() => {
    const fallbackMode = safeModeKeys[0] || '';
    if (!fallbackMode) return;
    if (safeModeKeys.includes(mode)) return;
    if (fallbackMode !== mode) setMode(fallbackMode);
  }, [mode, safeModeKey]);

  useEffect(() => {
    if (!resumeChangeRef.current) return;
    resumeChangeRef.current({
      version: 1,
      mode: 'speaking',
      screen: 'speaking',
      sessionId: resume?.sessionId || `speaking_${setId}_${mode}`,
      subjectId: resume?.subjectId || 'speaking',
      topicId: resume?.topicId || `${setId}_${mode}`,
      metadata: {
        displayTitle: 'Bertutur',
        subjectTitle: rawSetTitle,
        setId,
        sessionIndex,
        questionMode: mode
      },
      startedAt: resume?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
      state: {
        setId,
        mode,
        transcript,
        result,
        scoreHistory
      }
    });
  }, [setId, sessionIndex, mode, transcript, result, scoreHistory, set.title, safeModeKey]);

  useEffect(() => () => {
    stopRecognitionSilently();
  }, []);

  const commitBertuturTranscript = nextTranscript => {
    const normalizedTranscript = normalizeBertuturTranscript(nextTranscript);
    if (!normalizedTranscript) return;
    setSpeechCandidate(null);
    setInterimTranscript('');
    setRecognizedDraft(normalizedTranscript);
    setRecognitionConfidence(0);
    setTranscriptSource('speech-confirmed');
    setTranscript(normalizedTranscript);
    setConfirmedTranscript(normalizedTranscript);
    const normalized = { ...scoreBertutur(safePrompt, normalizedTranscript), status: 'completed', transcript: normalizedTranscript };
    recordCommunicationScore({
      ref: recordedSessionRef,
      itemKey: `${setId}:${mode}:${sessionIndex}`,
      result: normalized,
      setScoreHistory
    });
    setResult(normalized);
  };

  const offerSpeechCandidate = candidate => {
    const nextCandidate = {
      text: normalizeBertuturTranscript(candidate?.text),
      confidence: Number.isFinite(Number(candidate?.confidence)) ? Number(candidate.confidence) : 0
    };
    if (!nextCandidate.text) return;
    setRecognizedDraft(nextCandidate.text);
    setRecognitionConfidence(nextCandidate.confidence);
    setSpeechCandidate(nextCandidate);
    setResult({ status: 'needs-confirmation', transcript: '', score: 0, correct: false, matched: [], matchedKeywords: [], tertinggal: [], missingWords: [], missed: [], words: [], confidence: nextCandidate.confidence, errorCode: 'low-confidence', message: '' });
  };

  function startBertutur() {
    const latestSet = speakingPrompts.find(item => item.id === setId) || setBase;
    const latestSpeechLang = latestSet?.speechLang || (setId === 'bm' ? 'ms-MY' : setId === 'english' ? 'en-US' : 'ar-SA');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || (isIOSSafari && safariMicDisabled)) return;
    stopRecognitionSilently();
    resetSpeechSession();
    setTranscript('');
    setResult(null);
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    const recognitionContextKey = communicationContextKey;
    const longSpeechMode = /huraikan|ceritakan|terangkan|jelaskan|describe|explain|talk|tell/i.test(`${mode} ${safePrompt?.label || ''} ${safePrompt?.text || ''}`);
    recognition.lang = latestSpeechLang;
    recognition.interimResults = true;
    recognition.continuous = longSpeechMode;
    recognition.maxAlternatives = 3;
    if (import.meta?.env?.DEV) console.debug('[Bertutur speech]', { selectedLanguage: latestSpeechLang, recognitionLanguage: recognition.lang, continuous: recognition.continuous, interimResults: recognition.interimResults, maxAlternatives: recognition.maxAlternatives });
    recognition.onstart = () => {
      setMendengar(true);
    };
    recognition.onerror = event => {
      if (recognitionContextKeyRef.current !== recognitionContextKey) return;
      if (finalizedRef.current || abortedRef.current) return;
      const error = event?.error || 'unknown_error';
      if (import.meta?.env?.DEV) console.debug('[Bertutur speech error]', error);
      if (error === 'aborted') {
        abortedRef.current = true;
        return;
      }
      if (error === 'no-speech' && !receivedResultRef.current) {
        finalizeBertuturSession(createEmptySpeechResult('no-speech', getBertuturSpeechErrorMessage('no-speech')), '', true);
        return;
      }
      if (error === 'audio-capture') {
        finalizeBertuturSession({ ...createEmptySpeechResult('audio-capture', getBertuturSpeechErrorMessage('audio-capture')), status: 'technical-error' });
        return;
      }
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        finalizeBertuturSession(createEmptySpeechResult(error, getBertuturSpeechErrorMessage(error)));
        return;
      }
      finalizeBertuturSession({
        status: 'technical-error',
        score: 0,
        matched: [],
        matchedKeywords: [],
        tertinggal: [],
        missingWords: [],
        missed: [],
        words: [],
        transcript: '',
        confidence: 0,
        correct: false,
        errorCode: error,
        message: getBertuturSpeechErrorMessage(error)
      });
    };
    recognition.onresult = event => {
      if (recognitionContextKeyRef.current !== recognitionContextKey) return;
      if (finalizedRef.current || abortedRef.current) return;
      const extracted = collectBertuturSpeechResults(event, speechSeenResultKeysRef.current);
      if (import.meta?.env?.DEV) console.debug('[Bertutur speech result]', { resultIndex: event?.resultIndex, alternatives: [...extracted.finalCandidates, ...extracted.interimCandidates], isFinal: extracted.finalCandidates.length > 0 });
      if (extracted.interimText) setInterimTranscript(extracted.interimText);
      if (!extracted.finalCandidates.length) return;
      receivedResultRef.current = true;
      const candidate = chooseBertuturCandidate(extracted.finalCandidates, { languageId: set.id, prompt: safePrompt });
      speechFinalCandidateRef.current = candidate;
      speechFinalTranscriptRef.current = normalizeBertuturTranscript([speechFinalTranscriptRef.current, candidate.text].filter(Boolean).join(' '));
      if (!longSpeechMode) offerSpeechCandidate({ ...candidate, text: speechFinalTranscriptRef.current });
      if (!longSpeechMode) setMendengar(false);
    };
    recognition.onend = () => {
      if (recognitionContextKeyRef.current !== recognitionContextKey) return;
      clearSpeechTimeout();
      if (import.meta?.env?.DEV) console.debug('[Bertutur speech end]', { transcript: speechFinalTranscriptRef.current });
      if (finalizedRef.current || abortedRef.current) {
        recognitionRef.current = null;
        return;
      }
      if (receivedResultRef.current && speechFinalTranscriptRef.current) {
        const candidate = speechFinalCandidateRef.current || {};
        offerSpeechCandidate({ ...candidate, text: speechFinalTranscriptRef.current });
        recognitionRef.current = null;
        return;
      }
      if (!receivedResultRef.current) {
        finalizedRef.current = true;
        setMendengar(false);
        setResult(createEmptySpeechResult('no-result', getBertuturSpeechErrorMessage('no-result')));
        disposeRecognition();
      }
      recognitionRef.current = null;
    };
    try {
      speechTimeoutRef.current = window.setTimeout(() => {
        if (!receivedResultRef.current && !finalizedRef.current) {
          try {
            recognition?.stop?.();
          } catch {}
          finalizedRef.current = true;
          setMendengar(false);
          setResult(createEmptySpeechResult('no-result', getBertuturSpeechErrorMessage('no-result')));
          disposeRecognition();
          recognitionRef.current = null;
        }
      }, 9000);
      recognition.start();
    } catch {
      clearSpeechTimeout();
      recognitionRef.current = null;
      setMendengar(false);
      setResult({ ...createEmptySpeechResult('speech-unavailable', getBertuturSpeechErrorMessage('speech-unavailable')), status: 'technical-error' });
    }
  }

  function acceptSpeechCandidate() {
    if (!speechCandidate?.text) return;
    commitBertuturTranscript(speechCandidate.text);
  }

  function editSpeechCandidate() {
    if (!speechCandidate?.text) return;
    setTranscript(speechCandidate.text);
    setManualTranscript(speechCandidate.text);
    setTranscriptSource('manual');
    setSpeechCandidate(null);
    setResult(null);
  }

  function clearSpeechCandidate() {
    setSpeechCandidate(null);
    setRecognizedDraft('');
    setRecognitionConfidence(0);
    setResult(null);
  }

  function retrySpeechRecognition() {
    setSpeechCandidate(null);
    setResult(null);
    setInterimTranscript('');
    setTranscript('');
    setManualTranscript('');
    setConfirmedTranscript('');
    resetSpeechSession();
    startBertutur();
  }

  function checkBertutur() {
    stopRecognitionSilently();
    const normalizedTranscript = normalizeBertuturTranscript(safeTranscript);
    if (!safeTranscript) {
      setResult(createEmptySpeechResult('empty', 'Taip atau sebut jawapan sebelum menyemak.'));
      return;
    }
    setTranscript(normalizedTranscript);
    setManualTranscript(normalizedTranscript);
    setTranscriptSource('manual');
    const normalized = { ...scoreBertutur(safePrompt, normalizedTranscript), status: 'completed', transcript: normalizedTranscript };
    recordCommunicationScore({
      ref: recordedSessionRef,
      itemKey: `${setId}:${mode}:${sessionIndex}`,
      result: normalized,
      setScoreHistory
    });
    setResult(normalized);
  }

  function nextBertutur() {
    if (!communicationResult.canAdvance || !safeTranscript) return;
    stopRecognitionSilently();
    setTranscript('');
    setResult(null);
    resetSpeechSession();
    setSessionIndex(current => nextCommunicationSessionIndex(current, setBase?.sessionItems?.length || 1));
  }

  function saveBertutur() {
    const nextResult = safeResult && typeof safeResult === 'object' ? safeResult : scoreBertutur(safePrompt, safeTranscript);
    const contract = normalizeCommunicationResult(nextResult);
    const completedScores = sanitizeCommunicationScoreHistory(scoreHistory);
    if (!contract.isAssessed || !completedScores.length) {
      onClearResume?.();
      onBack?.();
      return;
    }
    onFinish({
      language: set.language,
      title: rawSetTitle,
      mode,
      transcript: safeTranscript,
      score: nextResult.score,
      isAssessed: true,
      scoreHistory: completedScores,
      completedItems: completedScores.length,
      averageScore: Math.round(completedScores.reduce((sum, value) => sum + value, 0) / completedScores.length),
      bestScore: Math.max(...completedScores),
      latestPercent: completedScores[completedScores.length - 1],
      matchedKeywords: Array.isArray(nextResult.matchedKeywords) ? nextResult.matchedKeywords.length : Array.isArray(nextResult.matched) ? nextResult.matched.length : 0,
      totalKeywords: safeKeywords.length
    });
    onClearResume?.();
  }

  return <main className="app speaking-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Papan Utama</button><span className="pill">Jurulatih Bertutur Luar Talian</span></div><section className="card reading-hero"><div className="communication-hero-icon" aria-hidden="true"><IconGlyph name="mic" /></div><div><p className="eyebrow">Jurulatih Bertutur</p><h1>{set.title}</h1><p>Tiada API berbayar. Guna pengecaman suara pelayar jika tersedia, atau taip transkrip secara manual.</p></div></section><section className="card"><p className="eyebrow">Bahasa</p><div className="reading-tabs">{speakingPrompts.map(item => <button key={item.id} className={item.id === setId ? '' : 'secondary'} onClick={() => setSetId(item.id)}>{item.language}</button>)}</div><p className="eyebrow">Jenis Soalan</p><div className="speaking-mode-grid">{modes.map(item => <button key={item.id} className={item.id === mode ? '' : 'secondary'} onClick={() => setMode(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${set.id === 'arab' ? 'rtl' : ''}`} lang={set.id === 'arab' ? 'ar' : undefined} dir={set.id === 'arab' ? 'rtl' : undefined}>{safePromptText}</div><div className="actions"><button onClick={startBertutur} disabled={!recognitionSupported || listening || (isIOSSafari && safariMicDisabled)} aria-label={reviewCopy.title}>{listening ? 'Sedang mendengar...' : 'Mula Bercakap'}</button><button className="secondary" onClick={checkBertutur} disabled={listening || !safeTranscript || Boolean(speechCandidate) || !['manual', 'speech-confirmed'].includes(transcriptSource)}>{reviewCopy.confirmed === 'Transkrip disahkan' ? 'Semak Transkrip' : reviewCopy.confirmed === 'Transcript confirmed' ? 'Check transcript' : 'فحص النص'}</button></div>{!recognitionSupported && <p className="autosave-note" lang={set.id === 'arab' ? 'ar' : set.id === 'english' ? 'en' : 'ms'}>{reviewCopy.manual}</p>}{isIOSSafari && safariMicDisabled && <p className="autosave-note">Pengecaman suara automatik tidak stabil pada Safari. Gunakan transkrip manual.</p>}{interimTranscript && <p className="autosave-note" aria-live="polite">Sedang mendengar: {interimTranscript}</p>}{speechMessage && <p className="autosave-note" aria-live="polite">{speechMessage}</p>}{speechCandidate?.text && <section className="speech-candidate" lang={set.id === 'arab' ? 'ar' : set.id === 'english' ? 'en' : 'ms'} dir={set.id === 'arab' ? 'rtl' : 'ltr'} aria-live="polite"><h2>{reviewCopy.title}</h2><p>{reviewCopy.helper}</p><p className="autosave-note">{reviewCopy.warning}</p><textarea aria-label={reviewCopy.title} value={speechCandidate.text} onChange={event => setSpeechCandidate(current => ({ ...current, text: event.target.value }))} /><div className="actions"><button onClick={acceptSpeechCandidate}>{reviewCopy.use}</button><button className="secondary" onClick={editSpeechCandidate}>{reviewCopy.edit}</button><button className="secondary" onClick={retrySpeechRecognition}>{reviewCopy.retry}</button><button className="secondary" onClick={clearSpeechCandidate}>{reviewCopy.clear}</button></div></section>}<label htmlFor="bertutur-transcript">{set.id === 'arab' ? 'النص اليدوي' : set.id === 'english' ? 'Manual transcript' : 'Transkrip / pertuturan manual'}</label><textarea id="bertutur-transcript" lang={set.id === 'arab' ? 'ar' : set.id === 'english' ? 'en' : 'ms'} dir={set.id === 'arab' ? 'rtl' : 'ltr'} value={transcript} onChange={event => { setTranscript(event.target.value); setManualTranscript(event.target.value); setTranscriptSource('manual'); }} placeholder={reviewCopy.manual} /></section>{result && <section className="card reading-result"><p className="eyebrow">Keputusan Bertutur</p>{communicationResult.isAssessed ? <><h2>{clampPercent(safeResult.score)}%</h2><div className="recommend-meta"><span>{safeMatched.length}/{safeKeywords.length} kata kunci</span><span>Mod {mode}</span><span>{set.language}</span></div><div className="word-check reading-word-check" lang={set.id === 'arab' ? 'ar' : undefined} dir={set.id === 'arab' ? 'rtl' : undefined}>{safeWords.length ? safeWords.map(word => <span key={word.text || word} className={word.status === 'correct' ? 'word-good' : 'word-miss'}>{word.text || word}</span>) : safeKeywords.map(keyword => <span key={keyword} className={safeMatched.includes(keyword) ? 'word-good' : 'word-miss'}>{keyword}</span>)}</div>{safeMissing.length > 0 && <p>Cuba masukkan: <b>{safeMissing.join(', ')}</b></p>}{speechMessage && <p>{speechMessage}</p>}<div className="actions"><button onClick={nextBertutur}>Seterusnya</button><button className="secondary" onClick={saveBertutur}>Tamatkan Sesi</button></div></> : <><h2>Belum dinilai</h2><p>{speechMessage || 'Jawapan belum diterima.'}</p><div className="actions"><button className="secondary" onClick={saveBertutur}>Tamatkan Sesi</button></div></>}</section>}{sessionSummary.hasEvidence ? <section className="card reading-result"><p className="eyebrow">Ringkasan Sesi</p><p>{sessionSummary.completedItems} item selesai • Purata {sessionSummary.averagePercent}% • Terbaik {sessionSummary.bestPercent}%</p></section> : <section className="card reading-result"><p className="eyebrow">Ringkasan Sesi</p><p>Belum ada sesi direkodkan.</p><p className="memory-last">Lengkapkan sekurang-kurangnya satu latihan yang dinilai untuk melihat ringkasan.</p></section>}</main>;
}

const BERTUTUR_RELEVANCE_WORDS = {
  bm: new Set('saya makan minum nasi roti susu sarapan pagi telur mee mi buah cerita bilik darjah kucing sekolah makanan sihat'.split(/\s+/)),
  english: new Set('i eat drink bread milk breakfast morning egg eggs fruit school classroom cat food'.split(/\s+/)),
  arab: new Set()
};

function getBertuturReviewCopy(languageId = 'bm') {
  if (languageId === 'english') return {
    title: 'Recognised text',
    helper: 'Check this text first because speech recognition may not be fully accurate.',
    use: 'Use this transcript',
    edit: 'Edit first',
    retry: 'Try again',
    clear: 'Clear',
    warning: 'Speech recognition may be inaccurate. Edit the text or try again.',
    uncertain: 'Speech recognition may have misheard a word. Check and correct the text before confirming.',
    confirmed: 'Transcript confirmed',
    manual: 'Type your answer below.'
  };
  if (languageId === 'arab') return {
    title: 'النص الذي تم التعرّف عليه',
    helper: 'تحقق من النص أولاً لأن التعرف على الصوت قد لا يكون دقيقاً تماماً.',
    use: 'استخدم هذا النص',
    edit: 'عدّل النص أولاً',
    retry: 'حاول مرة أخرى',
    clear: 'مسح',
    warning: 'قد لا يكون التعرف على الصوت دقيقاً. عدّل النص أو حاول مرة أخرى.',
    uncertain: 'قد يكون التعرف على الصوت قد أخطأ في كلمة. تحقق من النص وصححه قبل التأكيد.',
    confirmed: 'تم تأكيد النص',
    manual: 'اكتب إجابتك أدناه.'
  };
  return {
    title: 'Teks yang dikesan',
    helper: 'Semak teks ini dahulu kerana pengecaman suara mungkin kurang tepat.',
    use: 'Guna transkrip ini',
    edit: 'Betulkan dahulu',
    retry: 'Cuba semula',
    clear: 'Padam',
    warning: 'Pengecaman mungkin kurang tepat. Betulkan teks atau cuba semula.',
    uncertain: 'Pengecaman suara mungkin tersalah perkataan. Semak dan betulkan teks sebelum mengesahkan.',
    confirmed: 'Transkrip disahkan',
    manual: 'Taip jawapan kamu di bawah.'
  };
}

function normalizeBertuturTranscript(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function chooseBertuturCandidate(candidates = [], { languageId = 'bm', prompt = {} } = {}) {
  const safeCandidates = candidates
    .map(candidate => ({ ...candidate, text: normalizeBertuturTranscript(candidate?.text) }))
    .filter(candidate => candidate.text);
  if (!safeCandidates.length) return { text: '', confidence: 0, alternatives: [] };
  const promptWords = new Set((Array.isArray(prompt?.keywords) ? prompt.keywords : [])
    .flatMap(value => String(value).toLowerCase().split(/\s+/))
    .filter(Boolean));
  const vocabulary = new Set([...(BERTUTUR_RELEVANCE_WORDS[languageId] || []), ...promptWords]);
  const ranked = safeCandidates.map((candidate, index) => {
    const words = normalizeBacaanWord(candidate.text).split(/\s+/).filter(Boolean);
    const relevance = words.filter(word => vocabulary.has(word)).length;
    const confidence = Number(candidate.confidence);
    const meaningfulConfidence = Number.isFinite(confidence) && confidence > 0 ? confidence : 0;
    return { ...candidate, index, relevance, confidence: meaningfulConfidence };
  }).sort((a, b) => (b.confidence - a.confidence) || (b.relevance - a.relevance) || (a.index - b.index));
  return { ...ranked[0], alternatives: ranked };
}

function collectBertuturSpeechResults(event, seenKeys = new Set()) {
  const results = event?.results ? Array.from(event.results) : [];
  const startIndex = Number.isInteger(event?.resultIndex) && event.resultIndex >= 0 ? event.resultIndex : 0;
  const finalCandidates = [];
  const interimCandidates = [];
  for (let index = startIndex; index < results.length; index += 1) {
    const result = results[index];
    if (!result) continue;
    const alternatives = Array.from(result).slice(0, 3).map((alternative, alternativeIndex) => ({
      text: normalizeBertuturTranscript(alternative?.transcript),
      confidence: alternative?.confidence,
      alternativeIndex
    })).filter(candidate => candidate.text);
    const key = `${result.isFinal ? 'final' : 'interim'}:${alternatives.map(candidate => candidate.text).join('|')}`;
    if (!alternatives.length || seenKeys.has(key)) continue;
    seenKeys.add(key);
    (result.isFinal ? finalCandidates : interimCandidates).push(...alternatives);
  }
  return {
    finalCandidates,
    interimCandidates,
    interimText: normalizeBertuturTranscript(interimCandidates.map(candidate => candidate.text).join(' '))
  };
}

function getBertuturSpeechErrorMessage(errorCode = '') {
  switch (String(errorCode || '').toLowerCase()) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Mikrofon tidak dibenarkan. Benarkan akses mikrofon dalam tetapan pelayar.';
    case 'no-speech':
    case 'no-result':
      return 'Tiada suara dikesan. Cuba bercakap semula.';
    case 'audio-capture':
      return 'Mikrofon tidak dapat dikesan. Semak mikrofon dan tetapan sistem.';
    case 'network':
      return 'Perkhidmatan pengecaman suara tidak dapat dihubungi. Semak sambungan internet dan cuba semula.';
    case 'aborted':
      return 'Pengecaman suara dihentikan. Cuba bercakap semula.';
    default:
      return 'Perkhidmatan pengecaman suara tidak dapat dihubungi. Semak sambungan internet dan cuba semula.';
  }
}
// Semantic communication banks are the only active source for listening, speaking, and writing.
const writingSets = semanticWritingSets;

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

function MenulisCoach({ resume, onResumeChange, onClearResume, onBack, onFinish }) {
  const [setId, setSetId] = useState(() => (resume?.mode === 'writing' && resume?.state?.setId) || 'bm');
  const [sessionIndex, setSessionIndex] = useState(() => Number.isInteger(resume?.state?.sessionIndex) ? resume.state.sessionIndex : 0);
  const [mode, setMode] = useState(() => resume?.state?.mode || 'arrange');
  const [answer, setAnswer] = useState(() => resume?.state?.answer || '');
  const [arranged, setSusund] = useState(() => Array.isArray(resume?.state?.arranged) ? resume.state.arranged : []);
  const [result, setResult] = useState(() => resume?.state?.result || null);
  const [scoreHistory, setScoreHistory] = useState(() => sanitizeCommunicationScoreHistory(resume?.state?.scoreHistory));
  const recordedSessionRef = useRef(new Set());
  const modeResetRef = useRef({ setId, mode });
  const resumeChangeRef = useRef(onResumeChange);
  const resumeSignatureRef = useRef('');
  const setBase = writingSets.find(item => item.id === setId) || writingSets[0] || null;
  const set = setBase?.sessionItems?.[sessionIndex % setBase.sessionItems.length] ? { ...setBase.sessionItems[sessionIndex % setBase.sessionItems.length], id: setBase.id } : setBase;
  const safeTasks = set?.tasks && typeof set.tasks === 'object' ? set.tasks : {};
  const safeModes = Object.entries(safeTasks).map(([id, value]) => ({ id, label: value?.label || id }));
  const safeTask = safeTasks[mode] || safeTasks.arrange || Object.values(safeTasks).find(Boolean) || null;
  const safeTaskPrompt = set?.id === 'arab'
    ? safeArabicCoachText(safeTask?.prompt, 'Latihan Menulis tidak mempunyai tugas yang sah buat masa ini.')
    : typeof safeTask?.prompt === 'string' ? safeTask.prompt : 'Tiada tugas menulis tersedia buat masa ini.';
  const safeMode = safeTasks[mode] ? mode : (safeTasks.arrange ? 'arrange' : Object.keys(safeTasks)[0] || '');
  const safeResult = result && typeof result === 'object' ? {
    score: Number(result.score) || 0,
    matched: Array.isArray(result.matched) ? result.matched : [],
    spellingIssues: Array.isArray(result.spellingIssues) ? result.spellingIssues : [],
    grammarPetunjuks: Array.isArray(result.grammarPetunjuks) ? result.grammarPetunjuks : [],
    explanation: typeof result.explanation === 'string' ? result.explanation : '',
    message: typeof result.message === 'string' ? result.message : '',
    ...result
  } : null;
  const communicationResult = normalizeCommunicationResult(result);
  const sessionSummary = buildCommunicationSessionSummary(scoreHistory);

  useEffect(() => {
    if (modeResetRef.current.setId === setId && modeResetRef.current.mode === mode) return;
    modeResetRef.current = { setId, mode };
    setAnswer('');
    setSusund([]);
    setResult(null);
  }, [setId, mode]);

  useEffect(() => {
    setSessionIndex(current => nextCommunicationSessionIndex(current, setBase?.sessionItems?.length || 1));
  }, [setId]);

  useEffect(() => {
    if (!safeMode || safeMode === mode) return;
    setMode(safeMode);
  }, [safeMode, mode]);

  useEffect(() => {
    resumeChangeRef.current = onResumeChange;
  }, [onResumeChange]);

  useEffect(() => {
    if (!resumeChangeRef.current) return;
    const nextSignature = [
      'writing',
      setId,
      sessionIndex,
      mode,
      safeTask?.label || '',
      answer || '',
      arranged.join(' '),
      result?.score ?? '',
      result?.matched?.length ?? 0,
      result?.spellingIssues?.length ?? 0,
      result?.grammarPetunjuks?.length ?? 0
    ].join('|');
    if (resumeSignatureRef.current === nextSignature) return;
    resumeSignatureRef.current = nextSignature;
    resumeChangeRef.current({
      version: 1,
      mode: 'writing',
      screen: 'writing',
      sessionId: resume?.sessionId || `writing_${setId}_${mode}`,
      subjectId: resume?.subjectId || 'writing',
      topicId: resume?.topicId || `${setId}_${mode}`,
      metadata: {
        displayTitle: 'Menulis',
        subjectTitle: set.title,
        setId,
        questionMode: mode
      },
      startedAt: resume?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
      state: {
        setId,
        mode,
        answer,
        arranged,
        result,
        scoreHistory
      }
    });
  }, [setId, sessionIndex, mode, answer, arranged, result, scoreHistory, safeTask?.label]);

  function currentAnswer() {
    return mode === 'arrange' ? arranged.join(' ') : answer;
  }

  function checkMenulis() {
    try {
      if (!safeTask) return;
      if (!currentAnswer().trim()) {
        setResult({ status: 'empty', score: 0, matched: [], spellingIssues: [], grammarPetunjuks: [], explanation: '', message: 'Jawapan belum diterima.' });
        return;
      }
      const nextResult = { ...scoreMenulis(safeTask, currentAnswer(), set?.dictionary || []), status: 'completed', answer: currentAnswer() };
      recordCommunicationScore({
        ref: recordedSessionRef,
        itemKey: `${setId}:${mode}:${sessionIndex}`,
        result: nextResult,
        setScoreHistory
      });
      setResult(nextResult);
    } catch {
      setResult({
        status: 'technical-error',
        score: 0,
        matched: [],
        spellingIssues: [],
        grammarPetunjuks: [],
        explanation: '',
        message: 'Semakan tulisan tidak dapat dijalankan sekarang.',
        errorCode: 'validation-error'
      });
    }
  }

  function nextMenulis() {
    if (!communicationResult.canAdvance || !currentAnswer().trim()) return;
    setAnswer('');
    setSusund([]);
    setResult(null);
    setSessionIndex(current => nextCommunicationSessionIndex(current, setBase?.sessionItems?.length || 1));
  }

  function saveMenulis() {
    if (!safeTask || !set) return;
    const nextResult = safeResult || scoreMenulis(safeTask, currentAnswer(), set.dictionary || []);
    const contract = normalizeCommunicationResult(nextResult);
    const completedScores = sanitizeCommunicationScoreHistory(scoreHistory);
    if (!contract.isAssessed || !completedScores.length) {
      onClearResume?.();
      onBack?.();
      return;
    }
    onFinish({
      language: set.language,
      title: set.title,
      mode,
      answer: currentAnswer(),
      score: nextResult.score,
      isAssessed: true,
      scoreHistory: completedScores,
      completedItems: completedScores.length,
      averageScore: Math.round(completedScores.reduce((sum, value) => sum + value, 0) / completedScores.length),
      bestScore: Math.max(...completedScores),
      latestPercent: completedScores[completedScores.length - 1],
      matchedKeywords: Array.isArray(nextResult.matched) ? nextResult.matched.length : 0,
      totalKeywords: safeTask?.keywords?.length || 0,
      spellingIssues: Array.isArray(nextResult.spellingIssues) ? nextResult.spellingIssues.length : 0,
      grammarPetunjuks: Array.isArray(nextResult.grammarPetunjuks) ? nextResult.grammarPetunjuks : []
    });
    onClearResume?.();
  }

  if (!set || !safeTask) {
    return <main className="app"><EmptyState title="Tugas menulis tidak dijumpai." message="Kembali ke Papan Utama dan pilih semula latihan menulis." actionLabel="Papan Utama" onAction={onBack} /></main>;
  }

  const availableWords = (Array.isArray(safeTask.words) ? safeTask.words : []).filter(word => !arranged.includes(word));

  return (
    <main className="app writing-coach-page">
      <div className="topbar">
        <button className="ghost" onClick={onBack}>← Papan Utama</button>
        <span className="pill">Jurulatih Menulis Luar Talian</span>
      </div>

      <section className="card reading-hero">
        <div className="communication-hero-icon" aria-hidden="true">
          <IconGlyph name="pen" />
        </div>
        <div>
          <p className="eyebrow">Jurulatih Menulis</p>
          <h1>{set.title}</h1>
          <p>Tiada API berbayar. Semakan kata kunci, ejaan, petua tatabahasa dan penerangan gaya AI dibuat secara luar talian.</p>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Bahasa</p>
        <div className="reading-tabs">
          {writingSets.map(item => (
            <button key={item.id} className={item.id === setId ? '' : 'secondary'} onClick={() => setSetId(item.id)}>
              {item.language}
            </button>
          ))}
        </div>

        <p className="eyebrow">Jenis Soalan</p>
        <div className="writing-mode-grid">
          {safeModes.map(item => (
            <button key={item.id} className={item.id === mode ? '' : 'secondary'} onClick={() => setMode(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className={`reading-target ${set.id === 'arab' ? 'rtl' : ''}`} lang={set.id === 'arab' ? 'ar' : undefined} dir={set.id === 'arab' ? 'rtl' : undefined}>
          {safeTaskPrompt}
        </div>

        {mode === 'arrange' ? (
          <>
            <div className="listening-arrange">
              {arranged.map(word => (
                <button key={word} onClick={() => setSusund(prev => prev.filter(item => item !== word))}>
                  {word}
                </button>
              ))}
            </div>
            <div className="listening-options">
              {availableWords.map(word => (
                <button className="secondary" key={word} onClick={() => setSusund(prev => [...prev, word])}>
                  {word}
                </button>
              ))}
            </div>
          </>
        ) : (
          <textarea
            lang={set.id === 'arab' ? 'ar' : undefined}
            dir={set.id === 'arab' ? 'rtl' : 'auto'}
            value={answer}
            onChange={event => setAnswer(event.target.value)}
            placeholder={mode === 'blank' ? 'Taip perkataan yang hilang' : 'Tulis jawapan kamu di sini'}
          />
        )}

        <div className="actions">
          <button onClick={checkMenulis}>Semak Tulisan</button>
          <button className="secondary" onClick={saveMenulis}>Tamatkan Sesi</button>
        </div>
      </section>

      {safeResult ? (
        <section className="card reading-result">
          <p className="eyebrow">Keputusan Menulis</p>
          {communicationResult.isAssessed ? (
            <>
              <h2>{clampPercent(safeResult.score)}%</h2>
              <div className="recommend-meta">
                <span>{Array.isArray(safeResult.matched) ? safeResult.matched.length : 0}/{safeTask?.keywords?.length || 0} kata kunci</span>
                <span>{Array.isArray(safeResult.spellingIssues) ? safeResult.spellingIssues.length : 0} isu ejaan</span>
                <span>{Array.isArray(safeResult.grammarPetunjuks) ? safeResult.grammarPetunjuks.length : 0} petua tatabahasa</span>
              </div>
              <div className="word-check reading-word-check" lang={set.id === 'arab' ? 'ar' : undefined} dir={set.id === 'arab' ? 'rtl' : undefined}>
                {(safeTask?.keywords || []).map(keyword => (
                  <span key={keyword} className={Array.isArray(safeResult.matched) && safeResult.matched.includes(keyword) ? 'word-good' : 'word-miss'}>
                    {keyword}
                  </span>
                ))}
              </div>
              {Array.isArray(safeResult.spellingIssues) && safeResult.spellingIssues.length > 0 && (
                <p>Semak ejaan: <b>{safeResult.spellingIssues.map(word => word.raw).join(', ')}</b></p>
              )}
              {Array.isArray(safeResult.grammarPetunjuks) && safeResult.grammarPetunjuks.length > 0 && (
                <div className="explain-box">
                  <b>Petua tatabahasa</b>
                  <p>{safeResult.grammarPetunjuks.join(' ')}</p>
                </div>
              )}
              <div className="actions">
                <button onClick={nextMenulis}>Seterusnya</button>
                <button className="secondary" onClick={saveMenulis}>Tamatkan Sesi</button>
              </div>
              <div className="explain-box">
                <b>Penerangan AI</b>
                <p>{safeResult.explanation}</p>
              </div>
            </>
          ) : (
            <>
              <h2>Belum dinilai</h2>
              <p>{safeResult.message || 'Jawapan belum diterima.'}</p>
              <div className="actions">
                <button className="secondary" onClick={saveMenulis}>Tamatkan Sesi</button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="card">
          <p className="eyebrow">Keputusan Menulis</p>
          <h2>Belum ada keputusan.</h2>
          <p>Semak tulisan untuk melihat analisis.</p>
        </section>
      )}

      {sessionSummary.hasEvidence ? (
        <section className="card reading-result">
          <p className="eyebrow">Ringkasan Sesi</p>
          <p>{sessionSummary.completedItems} item selesai • Purata {sessionSummary.averagePercent}% • Terbaik {sessionSummary.bestPercent}%</p>
        </section>
      ) : (
        <section className="card reading-result">
          <p className="eyebrow">Ringkasan Sesi</p>
          <p>Belum ada sesi direkodkan.</p>
          <p className="memory-last">Lengkapkan sekurang-kurangnya satu latihan yang dinilai untuk melihat ringkasan.</p>
        </section>
      )}
    </main>
  );
}

/* Final listening surface: explicit next-item flow with a bounded, non-repeating session. */
function MendengarLab({ resume, onResumeChange, onClearResume, onBack, onFinish }) {
  const [setId, setSetId] = useState(() => resume?.state?.setId || 'bm');
  const base = listeningSets.find(item => item.id === setId) || listeningSets[0];
  const [sessionIndex, setSessionIndex] = useState(() => Number.isInteger(resume?.state?.sessionIndex) ? resume.state.sessionIndex : 0);
  const [mode, setMode] = useState(() => resume?.state?.mode || 'choose');
  const [choice, setChoice] = useState(() => resume?.state?.choice || '');
  const [typed, setTyped] = useState(() => resume?.state?.typed || '');
  const [arranged, setArranged] = useState(() => Array.isArray(resume?.state?.arranged) ? resume.state.arranged : []);
  const [feedback, setFeedback] = useState(() => resume?.state?.feedback || null);
  const [scoreHistory, setScoreHistory] = useState(() => sanitizeCommunicationScoreHistory(resume?.state?.scoreHistory));
  const recordedSessionRef = useRef(new Set());
  const resumeChangeRef = useRef(onResumeChange);
  const resumeSignatureRef = useRef('');
  const communicationResult = normalizeCommunicationResult(feedback);
  const item = { ...(base.sessionItems?.[sessionIndex % base.sessionItems.length] || base), id: base.id };
  const modes = [{ id: 'choose', label: 'Pilih' }, { id: 'arrange', label: 'Susun' }, { id: 'spell', label: 'Eja' }, { id: 'answer', label: 'Jawapan' }];
  const availableWords = (item.arrange || []).filter(word => !arranged.includes(word));
  const sessionSummary = buildCommunicationSessionSummary(scoreHistory);

  useEffect(() => {
    setChoice('');
    setTyped('');
    setArranged([]);
    setFeedback(null);
  }, [sessionIndex, mode, setId]);

  useEffect(() => {
    resumeChangeRef.current = onResumeChange;
  }, [onResumeChange]);

  useEffect(() => {
    if (!resumeChangeRef.current) return;
    const nextSignature = [
      'listening',
      setId,
      sessionIndex,
      mode,
      choice,
      typed,
      arranged.join(' '),
      feedback?.status || '',
      feedback?.score ?? '',
      scoreHistory.join(',')
    ].join('|');
    if (resumeSignatureRef.current === nextSignature) return;
    resumeSignatureRef.current = nextSignature;
    resumeChangeRef.current({
      version: 1,
      mode: 'listening',
      screen: 'listening',
      sessionId: resume?.sessionId || `listening_${setId}`,
      subjectId: 'listening',
      topicId: `${setId}_${sessionIndex}`,
      metadata: {
        displayTitle: 'Mendengar',
        subjectTitle: item.title,
        setId
      },
      startedAt: resume?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
      state: {
        setId,
        sessionIndex,
        mode,
        choice,
        typed,
        arranged,
        feedback,
        scoreHistory
      }
    });
  }, [resume, setId, sessionIndex, mode, choice, typed, arranged, feedback, scoreHistory, item.title]);

  function stopAudio() {
    try {
      window.speechSynthesis?.cancel?.();
    } catch {}
  }

  function playAudio() {
    try {
      stopAudio();
      speak(item.prompt, { lang: item.speechLang });
    } catch {
      setFeedback({
        status: 'technical-error',
        score: 0,
        correct: false,
        expected: '',
        response: '',
        message: 'Audio tidak dapat dimainkan sekarang.',
        errorCode: 'audio-unavailable'
      });
    }
  }

  function submit() {
    try {
      let expected = '';
      let response = '';

      if (mode === 'choose') {
        expected = item.choose.answer;
        response = choice;
      }
      if (mode === 'arrange') {
        expected = item.arrange.join(' ');
        response = arranged.join(' ');
      }
      if (mode === 'spell') {
        expected = item.spell;
        response = typed;
      }
      if (mode === 'answer') {
        expected = item.answer.accepted.join(', ');
        response = typed;
      }

      if (!normalizeMendengar(response)) {
        setFeedback({ status: 'empty', correct: false, expected, response: '', message: 'Belum ada percubaan yang sah.' });
        return;
      }

      const correct = mode === 'answer'
        ? normalizeListeningAcceptedAnswers(item.answer.accepted).has(normalizeMendengar(response))
        : normalizeMendengar(expected) === normalizeMendengar(response);
      const nextFeedback = { status: 'completed', score: correct ? 100 : 0, correct, expected, response };
      recordCommunicationScore({
        ref: recordedSessionRef,
        itemKey: `${setId}:${mode}:${sessionIndex}`,
        result: nextFeedback,
        setScoreHistory
      });
      setFeedback(nextFeedback);
    } catch {
      setFeedback({
        status: 'technical-error',
        score: 0,
        correct: false,
        expected: '',
        response: '',
        message: 'Semakan audio tidak dapat dijalankan sekarang.',
        errorCode: 'validation-error'
      });
    }
  }

  function nextItem() {
    if (!communicationResult.canAdvance) return;
    stopAudio();
    setSessionIndex(current => nextCommunicationSessionIndex(current, base.sessionItems.length));
  }

  function finish() {
    stopAudio();
    const completedScores = sanitizeCommunicationScoreHistory(scoreHistory);
    if (!completedScores.length) {
      onClearResume?.();
      onBack?.();
      return;
    }
    const correct = completedScores.filter(score => score >= 80).length;
    const total = completedScores.length;
    onFinish?.({
      language: base.language,
      title: base.title,
      mode: 'mixed',
      score: Math.round(completedScores.reduce((sum, value) => sum + value, 0) / total),
      correct,
      total,
      isAssessed: true,
      scoreHistory: completedScores,
      completedItems: total,
      averageScore: Math.round(completedScores.reduce((sum, value) => sum + value, 0) / total),
      bestScore: Math.max(...completedScores),
      latestPercent: completedScores[completedScores.length - 1]
    });
    onClearResume?.();
  }

  return (
    <main className="app listening-lab-page">
      <div className="topbar">
        <button className="ghost" onClick={onBack}>← Papan Utama</button>
        <span className="pill">Makmal Mendengar Luar Talian</span>
      </div>

      <section className="card reading-hero">
        <div className="communication-hero-icon" aria-hidden="true">
          <IconGlyph name="headphones" />
        </div>
        <div>
          <p className="eyebrow">Makmal Mendengar</p>
          <h1>{item.title}</h1>
          <p>Dengar arahan menggunakan suara peranti.</p>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Bahasa</p>
        <div className="reading-tabs">
          {listeningSets.map(language => (
            <button
              key={language.id}
              className={language.id === setId ? '' : 'secondary'}
              onClick={() => {
                stopAudio();
                setSetId(language.id);
                setSessionIndex(0);
                setScoreHistory([]);
              }}
            >
              {language.language}
            </button>
          ))}
        </div>
        <button className="full" onClick={playAudio}>Mainkan Audio</button>
      </section>

      <section className="card">
        <p className="eyebrow">Jenis Soalan</p>
        <div className="reading-tabs">
          {modes.map(nextMode => (
            <button key={nextMode.id} className={nextMode.id === mode ? '' : 'secondary'} onClick={() => setMode(nextMode.id)}>
              {nextMode.label}
            </button>
          ))}
        </div>

        {mode === 'choose' && (
          <>
            <h2>{item.choose.question}</h2>
            <div className="listening-options">
              {item.choose.options.map(option => (
                <button key={option} className={choice === option ? '' : 'secondary'} onClick={() => setChoice(option)}>
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'arrange' && (
          <>
            <h2>Susun perkataan yang kamu dengar</h2>
            <div className="listening-arrange">
              {arranged.map(word => (
                <button key={word} onClick={() => setArranged(values => values.filter(value => value !== word))}>
                  {word}
                </button>
              ))}
            </div>
            <div className="listening-options">
              {availableWords.map(word => (
                <button className="secondary" key={word} onClick={() => setArranged(values => [...values, word])}>
                  {word}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'spell' && (
          <>
            <h2>Eja perkataan yang kamu dengar</h2>
            <input value={typed} onChange={event => setTyped(event.target.value)} placeholder="Taip perkataan" />
          </>
        )}

        {mode === 'answer' && (
          <>
            <h2>{item.answer.question}</h2>
            <input value={typed} onChange={event => setTyped(event.target.value)} placeholder="Taip jawapan kamu" />
          </>
        )}

        <div className="actions">
          <button onClick={submit}>Semak Jawapan</button>
          {feedback && communicationResult.canAdvance && <button className="secondary" onClick={nextItem}>Seterusnya</button>}
          <button className="secondary" onClick={finish}>Tamatkan Sesi</button>
        </div>

        {feedback && (
          <div className={`feedback ${communicationResult.isAssessed && feedback.correct ? 'correct' : 'wrong'}`}>
            {communicationResult.isAssessed ? (
              <>
                <h2>{feedback.correct ? 'Betul' : 'Cuba lagi'}</h2>
                <p>Jawapan: <b>{feedback.expected}</b></p>
              </>
            ) : (
              <>
                <h2>Belum dinilai</h2>
                <p>{feedback.message || 'Percubaan belum dapat dinilai lagi.'}</p>
              </>
            )}
          </div>
        )}
      </section>

      {sessionSummary.hasEvidence ? (
        <section className="card reading-result">
          <p className="eyebrow">Ringkasan Sesi</p>
          <p>{sessionSummary.completedItems} item selesai • Purata {sessionSummary.averagePercent}% • Terbaik {sessionSummary.bestPercent}%</p>
        </section>
      ) : (
        <section className="card reading-result">
          <p className="eyebrow">Ringkasan Sesi</p>
          <p>Belum ada sesi direkodkan.</p>
          <p className="memory-last">Lengkapkan sekurang-kurangnya satu latihan yang dinilai untuk melihat ringkasan.</p>
        </section>
      )}
    </main>
  );
}

function Stat({ icon, label, value }) {
  return <div className="stat"><span className="stat-icon">{icon}</span><b>{value}</b><span>{label}</span></div>;
}
