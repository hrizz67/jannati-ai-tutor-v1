import React, { useEffect, useMemo, useRef, useState } from 'react';
import { subjectList, loadSubjectData, loadAllSubjects } from './data/subjects';
import { smartCheck } from './utils/smartCheck';
import { speakText, beep } from './utils/speech';
import AIExplainModal from './components/ai/AIExplainModal';
import AITeacherModal from './components/ai/AITeacherModal';
import { explainAnswer } from './ai/explainEngine';
import { buildRecommendation, isWeakTopic, updateStoredRecommendation } from './ai/recommendationEngine';
import { buildAdaptiveRecommendation } from './ai/adaptiveEngine';
import { buildMasteryMap, summarizeMastery, MASTERY_STATUS } from './ai/adaptive/masteryEngine';
import { buildLessonPlan } from './ai/adaptive/lessonPlanner';
import { getBlockedPrerequisites, getDependencyArrow, isTopicUnlockedByGraph } from './ai/adaptive/knowledgeGraph';
import { teachAnswer } from './ai/teacherEngine';
import { formatStudyTime, loadAIMemory, saveQuizMemory, saveReadingMemory, saveListeningMemory, saveSpeakingMemory, saveWritingMemory } from './ai/memoryEngine';
import { buildTeacherPortalSnapshot } from './curriculum/curriculumEngine';
import { buildCurriculumCoverage } from './curriculum/coverageEngine';
import { recommendMissingSkSp, summarizeUasaCoverage } from './curriculum/uasaEngine';

const PROFILE_KEY = 'jannati_v151_profile';
const RESUME_KEY = 'jannati_v151_resume';
const LEGACY_PROFILE_KEYS = ['jannati_v150_profile', 'jannati_v140_profile'];
const LEGACY_RESUME_KEYS = ['jannati_v150_resume', 'jannati_v140_resume'];

const defaultProfile = {
  name: '',
  avatar: '👦',
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

function loadProfile() {
  const saved = localStorage.getItem(PROFILE_KEY);
  if (saved) return JSON.parse(saved);

  for (const key of LEGACY_PROFILE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) {
      localStorage.setItem(PROFILE_KEY, legacy);
      return JSON.parse(legacy);
    }
  }

  return defaultProfile;
}

function loadResume() {
  const saved = localStorage.getItem(RESUME_KEY);
  if (saved) return JSON.parse(saved);

  for (const key of LEGACY_RESUME_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) {
      localStorage.setItem(RESUME_KEY, legacy);
      return JSON.parse(legacy);
    }
  }

  return null;
}

function saveResume(data) {
  localStorage.setItem(RESUME_KEY, JSON.stringify(data));
}

function clearResume() {
  localStorage.removeItem(RESUME_KEY);
  LEGACY_RESUME_KEYS.forEach(key => localStorage.removeItem(key));
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function getStars(score = 0) {
  if (score >= 90) return '⭐⭐⭐';
  if (score >= 70) return '⭐⭐';
  if (score >= 50) return '⭐';
  return '☆☆☆';
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
  if ((profile.streak || 0) >= 3) badges.add('Streak 3 Hari');
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
  const all = [];
  subject.topics.forEach(topic => {
    topic.questions.forEach(question => {
      all.push({ ...question, topicId: topic.id, topicTitle: topic.title, subjectId: subject.id, subjectTitle: subject.title });
    });
  });
  return shuffleArray(all).slice(0, Math.min(count, all.length));
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
    return `Untuk UASA ${selectedSubject.short}, purata sekarang ${avg}%. Cuba latihan topik dahulu, kemudian buat UASA Simulator.`;
  }
  if (text.includes('lemah') || text.includes('ulang')) {
    return `Saya cadangkan ulang ${recommended.title}. Sasarkan sekurang-kurangnya 80%.`;
  }
  return `Hari ini saya cadangkan belajar ${recommended.title}. Guna Hint jika susah.`;
}

function printReport() {
  window.print();
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [resume, setResume] = useState(loadResume);
  const [screen, setScreen] = useState(profile.name ? 'dashboard' : 'login');
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
  const [quizStartedAt, setQuizStartedAt] = useState(Date.now());

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

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

  async function startProfile(name, avatar) {
    setProfile({ ...defaultProfile, name: name || 'Anak', avatar });
    setScreen('dashboard');
  }

  function resetProfile() {
    if (confirm('Reset semua rekod murid?')) {
      localStorage.removeItem(PROFILE_KEY);
      LEGACY_PROFILE_KEYS.forEach(key => localStorage.removeItem(key));
      clearResume();
      setProfile(defaultProfile);
      setResume(null);
      setScreen('login');
    }
  }

  function startTopic(topic, subject = selectedSubject, options = {}) {
    const questions = options.questions || shuffleArray(topic.questions);
    const startIndex = options.questionIndex || 0;
    const startSession = options.session || { correct: 0, almost: 0, wrong: 0, xp: 0, coins: 0, percent: 0, stars: '☆☆☆', answers: [] };

    setActiveSubject(subject);
    setActiveTopic({ ...topic, questions });
    setQuestionIndex(startIndex);
    setAnswer('');
    setFeedback(null);
    setExplainOpen(false);
    setExplainData(null);
    setTeacherOpen(false);
    setTeacherData(null);
    setQuizStartedAt(Date.now());
    setSession(startSession);
    setScreen('quiz');

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
      session: resume.session
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
    const remainingQuestions = topic.questions.filter(question => question.id !== questionId);
    const questions = targetQuestion ? [targetQuestion, ...shuffleArray(remainingQuestions)] : shuffleArray(topic.questions);
    startTopic(topic, subject, { questions });
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
        history: [{ date: result.date, subject: result.subjectShort, topic: 'UASA Simulator', percent: result.score, stars: getStars(result.score) }, ...(prev.history || [])].slice(0, 50)
      };
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
  }

  function finishReading(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Reading', topic: result?.title || 'Reading Coach', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveReadingMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  function finishListening(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Listening', topic: result?.title || 'Listening Lab', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveListeningMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  function finishSpeaking(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Speaking', topic: result?.title || 'Speaking Coach', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveSpeakingMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  function finishWriting(result) {
    const score = result?.score || 0;
    const today = todayKey();
    const memoryResult = { ...result, date: new Date().toISOString() };
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Writing', topic: result?.title || 'Writing Coach', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
      saveWritingMemory(memoryResult, updatedProfile, allSubjects);
      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
    setScreen('dashboard');
  }

  const chatWidget = chatOpen && selectedSubject ? <AiTutorChat profile={profile} selectedSubject={selectedSubject} onClose={() => setChatOpen(false)} /> : null;

  if (screen === 'login') return <Login onStart={startProfile} />;

  if (loadingSubject || !selectedSubject) return <main className="app"><section className="card"><h1>Loading subject...</h1></section></main>;

  if (screen === 'quiz') {
    const question = currentQuestion();
    const bookmarkId = question && activeSubject && activeTopic ? `${activeSubject.id}_${activeTopic.id}_${question.id}` : '';
    const isBookmarked = (profile.bookmarks || []).some(item => item.id === bookmarkId);
    return <><Quiz subject={activeSubject} topic={activeTopic} questionIndex={questionIndex} answer={answer} feedback={feedback} isBookmarked={isBookmarked} onAnswerChange={setAnswer} onCheckAnswer={checkAnswer} onNextQuestion={nextQuestion} onTryAgain={tryAgainQuestion} onExplain={openExplain} onBack={() => setScreen('dashboard')} onHint={() => setFeedback({ status: 'hint', title: 'Hint', message: currentQuestion().hint })} onSpeak={() => speakText(currentQuestion().q.replaceAll('________', ' kosong '))} onBookmark={toggleBookmark} onOpenAi={() => setChatOpen(true)} /><AIExplainModal open={explainOpen} data={explainData} question={question} onClose={() => setExplainOpen(false)} onTryAgain={tryAgainQuestion} onTeach={openTeacher} /><AITeacherModal open={teacherOpen} data={teacherData} onClose={() => setTeacherOpen(false)} onPractice={tryAgainQuestion} />{chatWidget}</>;
  }

  if (screen === 'finish') {
    const nextTopic = getNextTopic(activeSubject, activeTopic);
    return <Finish profile={profile} session={session} topic={activeTopic} nextTopic={nextTopic} onDashboard={() => setScreen('dashboard')} onRetry={() => activeTopic && activeSubject && startTopic(activeTopic, activeSubject)} onNextTopic={() => nextTopic && activeSubject && startTopic(nextTopic, activeSubject)} onOpenAi={() => setChatOpen(true)} />;
  }
  if (screen === 'reading') return <ReadingCoach profile={profile} onBack={() => setScreen('dashboard')} onFinish={finishReading} />;
  if (screen === 'listening') return <ListeningLab onBack={() => setScreen('dashboard')} onFinish={finishListening} />;
  if (screen === 'speaking') return <SpeakingCoach onBack={() => setScreen('dashboard')} onFinish={finishSpeaking} />;
  if (screen === 'writing') return <WritingCoach onBack={() => setScreen('dashboard')} onFinish={finishWriting} />;
  if (screen === 'parent') return <ParentDashboard profile={profile} allSubjects={allSubjects} onBack={() => setScreen('dashboard')} />;
  if (screen === 'uasa') return <UasaSimulator profile={profile} subject={selectedSubject} onBack={() => setScreen('dashboard')} onSave={saveUasaResult} />;

  return <><Dashboard profile={profile} subjectList={subjectList} allSubjects={allSubjects} selectedSubject={selectedSubject} selectedSubjectId={selectedSubjectId} totalQuestions={totalQuestions} resume={resume} dailyChallenge={buildDailyChallenge()} onSelectSubject={setSelectedSubjectId} onStartTopic={(topic) => startTopic(topic, selectedSubject)} onStartAdaptiveLesson={startAdaptiveLesson} onStartReading={() => setScreen('reading')} onStartListening={() => setScreen('listening')} onStartSpeaking={() => setScreen('speaking')} onStartWriting={() => setScreen('writing')} onOpenParent={() => setScreen('parent')} onOpenUasa={() => setScreen('uasa')} onOpenAi={() => setChatOpen(true)} onReset={resetProfile} onResume={startResume} onRestartResume={restartResume} onCompleteDaily={completeDailyChallenge} onToggleFavourite={toggleFavourite} />{chatWidget}</>;
}

function Login({ onStart }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const avatars = ['👦', '👧', '🧒', '👩‍🎓', '👨‍🎓'];
  return <main className="app login"><section className="hero"><div className="bot">🤖</div><h1>Jannati AI Tutor</h1><p>Belajar Macam Bermain</p></section><section className="card"><label>Nama anak</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Fayyadh" /><label>Pilih avatar</label><div className="avatar-row">{avatars.map(item => <button key={item} className={`avatar-choice ${avatar === item ? 'selected' : ''}`} onClick={() => setAvatar(item)}>{item}</button>)}</div><button className="full" onClick={() => onStart(name, avatar)}>Mula Belajar</button></section></main>;
}

function Dashboard({ profile, subjectList, allSubjects, selectedSubject, selectedSubjectId, totalQuestions, resume, dailyChallenge, onSelectSubject, onStartTopic, onStartAdaptiveLesson, onStartReading, onStartListening, onStartSpeaking, onStartWriting, onOpenParent, onOpenUasa, onOpenAi, onReset, onResume, onRestartResume, onCompleteDaily, onToggleFavourite }) {
  const topics = selectedSubject.topics;
  const level = Math.floor((profile.xp || 0) / 100) + 1;
  const levelProgress = (profile.xp || 0) % 100;
  const recommended = getRecommendedTopic(profile, selectedSubject);
  const today = todayKey();
  const dailyDone = profile.daily?.[today]?.completed;
  const completed = topics.filter(topic => (profile.progress?.[progressKey(selectedSubject.id, topic.id)]?.best || 0) >= 80).length;
  const averageScore = getSubjectAverage(profile, selectedSubject);
  const aiRecommendation = profile.recommendations?.[selectedSubject.id] || buildRecommendation(profile, selectedSubject);
  const recommendedPracticeTopic = topics.find(topic => topic.id === aiRecommendation.recommendedTopicId) || recommended;
  const aiMemory = loadAIMemory();
  const adaptiveSubjects = allSubjects?.length ? allSubjects : [selectedSubject];
  const topicMastery = {
    ...(aiMemory.topicMastery || {}),
    ...buildMasteryMap(profile, adaptiveSubjects, aiMemory)
  };
  const curriculumCoverage = buildCurriculumCoverage(profile, adaptiveSubjects);
  const missingSkSpRecommendation = recommendMissingSkSp(curriculumCoverage);
  const masterySummary = summarizeMastery(topicMastery);
  const effectiveMemory = { ...aiMemory, topicMastery, masterySummary, mastery: masterySummary.masteryScore, curriculumCoverage };
  const smartLesson = buildAdaptiveRecommendation({ profile, memory: effectiveMemory, subjects: adaptiveSubjects });
  const learningJourney = buildLessonPlan({ subjects: adaptiveSubjects, topicMastery });
  const smartSubject = adaptiveSubjects.find(subject => subject.id === smartLesson.nextSubject) || selectedSubject;
  const smartTopic = smartSubject?.topics?.find(topic => topic.id === smartLesson.nextTopic);
  const readingHistory = aiMemory.readingHistory || [];
  const readingAverage = readingHistory.length ? Math.round(readingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / readingHistory.length) : 0;
  const listeningHistory = aiMemory.listeningHistory || [];
  const listeningAverage = listeningHistory.length ? Math.round(listeningHistory.reduce((sum, item) => sum + (item.score || 0), 0) / listeningHistory.length) : 0;
  const speakingHistory = aiMemory.speakingHistory || [];
  const speakingAverage = speakingHistory.length ? Math.round(speakingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / speakingHistory.length) : 0;
  const writingHistory = aiMemory.writingHistory || [];
  const writingAverage = writingHistory.length ? Math.round(writingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / writingHistory.length) : 0;

  return <main className="dashboard-shell"><aside className="sidebar"><div className="brand"><div className="bot medium">🤖</div><div><h2>Jannati</h2><p>AI Tutor Split</p></div></div><button className="nav active">🏠 Dashboard</button><button className="nav" onClick={onOpenAi}>🤖 AI Tutor</button><button className="nav" onClick={onOpenUasa}>🏆 UASA</button><button className="nav" onClick={onOpenParent}>👨‍👩‍👧 Parent</button><div className="sidebar-note"><b>⚡ Split Data</b><p>Data dimuat ikut subjek supaya lebih ringan.</p></div></aside><section className="dashboard-main">
    <section className="profile hero-card"><div className="avatar-large">{profile.avatar || '👦'}</div><div><p className="eyebrow">Subject Split Edition</p><h1>Assalamualaikum, {profile.name} 😊</h1><p>AI cadangkan belajar <b>{recommended?.title}</b> hari ini.</p><div className="level-line"><span>Level {level}</span><div className="progress-wrap"><div className="progress" style={{ width: `${levelProgress}%` }} /></div><span>{levelProgress}/100 XP</span></div></div><button className="ghost" onClick={onReset}>Reset</button></section>
    <section className="stats"><Stat label="XP" value={profile.xp || 0} icon="⭐" /><Stat label="Level" value={level} icon="🏆" /><Stat label="Coins" value={profile.coins || 0} icon="💰" /><Stat label="Streak" value={profile.streak || 0} icon="🔥" /></section>
    <section className="quick-actions"><button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)}>▶ Sambung Belajar</button><button className="secondary" onClick={onOpenAi}>🤖 Tanya AI</button><button className="secondary" onClick={onOpenUasa}>🏆 UASA Simulator</button><button className="secondary" onClick={onStartReading}>🎤 Reading</button><button className="secondary" onClick={onStartListening}>🎧 Listening</button><button className="secondary" onClick={onStartSpeaking}>🗣️ Speaking</button><button className="secondary" onClick={onStartWriting}>✍️ Writing</button><button className="secondary" onClick={onOpenParent}>👨‍👩‍👧 Parent</button></section>
    {resume && <section className="card resume-card"><p className="eyebrow">Auto Resume</p><h2>▶ Sambung Latihan</h2><p>Subjek: <b>{resume.subjectId}</b><br/>Soalan: <b>{resume.questionIndex + 1}</b></p><div className="actions"><button onClick={onResume}>▶ Sambung</button><button className="secondary" onClick={onRestartResume}>🔄 Mula Semula</button></div></section>}
    <section className="card mastery-summary-card"><p className="eyebrow">Mastery Summary</p><h2>Topic Mastery</h2><div className="mastery-summary-grid"><div><b>{masterySummary.masteryScore}%</b><span>Mastery Score</span></div><div><b>{masterySummary.mastered}</b><span>Mastered</span></div><div><b>{masterySummary.learning}</b><span>Learning</span></div><div><b>{masterySummary.needsPractice}</b><span>Needs Practice</span></div></div></section>
    <section className="card curriculum-coverage-card"><p className="eyebrow">Curriculum Coverage</p><h2>DSKP + UASA Intelligence</h2><div className="mastery-summary-grid"><div><b>{curriculumCoverage.summary.coveragePercent}%</b><span>SK/SP Covered</span></div><div><b>{curriculumCoverage.summary.masteryPercent}%</b><span>SK/SP Mastery</span></div><div><b>{curriculumCoverage.summary.missing}</b><span>Missing SK/SP</span></div><div><b>{curriculumCoverage.summary.estimatedMinutes}</b><span>Est. Minutes</span></div></div>{missingSkSpRecommendation && <p className="memory-last">{missingSkSpRecommendation.reason}</p>}</section>
    <section className="card smart-lesson-card"><p className="eyebrow">Today's Learning Journey</p><h2>{learningJourney.todayLesson?.title || smartTopic?.title || 'Adaptive Learning Engine'}</h2><p>{learningJourney.reason || smartLesson.reason}</p><div className="journey-steps"><div><span>Today</span><b>{learningJourney.todayLesson?.subject || smartSubject?.short}</b><small>{learningJourney.todayLesson?.masteryStatus || 'READY'}</small></div><div><span>Next</span><b>{learningJourney.nextLesson?.title || 'After mastery'}</b><small>{learningJourney.nextLesson?.masteryStatus || 'LOCKED'}</small></div><div><span>Review</span><b>{learningJourney.recommendedReview?.title || 'No review due'}</b><small>{learningJourney.recommendedReview?.masteryStatus || 'CLEAR'}</small></div></div><div className="recommend-meta"><span>{learningJourney.blockedTopics.length} blocked topics</span><span>AI: {smartLesson.priority}</span><span>{learningJourney.recommendedReview?.title || 'Review stable'}</span></div><button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!learningJourney.todayLesson && !smartLesson.nextQuestionId}>Start Journey</button></section>
    <section className="card ai-recommend-card"><p className="eyebrow">AI Recommendation</p><h2>🤖 Cadangan Belajar</h2><p>{aiRecommendation.reason}</p>{aiMemory.lastLesson && <p className="memory-last">Last lesson: <b>{aiMemory.lastLesson.title}</b> • {aiMemory.lastLesson.score}%</p>}<div className="recommend-meta"><span>{aiMemory.weakTopics.length || aiRecommendation.weakTopics.length} weak topics</span><span>{aiMemory.strongTopics.length} strong topics</span><span>Mastery {aiMemory.mastery}%</span><span>Study {formatStudyTime(aiMemory.studyTime)}</span><span>Streak {aiMemory.studyStreak}</span><span>{recommendedPracticeTopic?.title || 'Semua topik selesai'}</span></div><button onClick={() => recommendedPracticeTopic && onStartTopic(recommendedPracticeTopic)}>Practice Again</button></section>
    <section className="card reading-progress-card"><p className="eyebrow">Reading Progress</p><h2>Reading Coach</h2><div className="mastery-summary-grid"><div><b>{readingAverage}%</b><span>Average</span></div><div><b>{readingHistory.length}</b><span>Sessions</span></div><div><b>{readingHistory[0]?.score || 0}%</b><span>Latest</span></div><div><b>{readingHistory[0]?.language || '-'}</b><span>Last Language</span></div></div><button onClick={onStartReading}>Start Reading Coach</button></section>
    <section className="card listening-progress-card"><p className="eyebrow">Listening Progress</p><h2>Listening Lab</h2><div className="mastery-summary-grid"><div><b>{listeningAverage}%</b><span>Average</span></div><div><b>{listeningHistory.length}</b><span>Sessions</span></div><div><b>{listeningHistory[0]?.score || 0}%</b><span>Latest</span></div><div><b>{listeningHistory[0]?.language || '-'}</b><span>Last Language</span></div></div><button onClick={onStartListening}>Start Listening Lab</button></section>
    <section className="card speaking-progress-card"><p className="eyebrow">Speaking Progress</p><h2>Speaking Coach</h2><div className="mastery-summary-grid"><div><b>{speakingAverage}%</b><span>Average</span></div><div><b>{speakingHistory.length}</b><span>Sessions</span></div><div><b>{speakingHistory[0]?.score || 0}%</b><span>Latest</span></div><div><b>{speakingHistory[0]?.language || '-'}</b><span>Last Language</span></div></div><button onClick={onStartSpeaking}>Start Speaking Coach</button></section>
    <section className="card writing-progress-card"><p className="eyebrow">Writing Progress</p><h2>Writing Coach</h2><div className="mastery-summary-grid"><div><b>{writingAverage}%</b><span>Average</span></div><div><b>{writingHistory.length}</b><span>Sessions</span></div><div><b>{writingHistory[0]?.score || 0}%</b><span>Latest</span></div><div><b>{writingHistory[0]?.language || '-'}</b><span>Last Language</span></div></div><button onClick={onStartWriting}>Start Writing Coach</button></section>
    <section className="card daily-card"><p className="eyebrow">Daily Challenge</p><h2>🎯 Cabaran Hari Ini</h2><div className="challenge-list">{dailyChallenge.map(item => <span key={item.subjectId}>✅ {item.label}</span>)}</div><button disabled={dailyDone} onClick={onCompleteDaily}>{dailyDone ? '✅ Daily Challenge Selesai' : '🎁 Claim Bonus +50 XP +20 Coins'}</button></section>
    <section className="card"><p className="eyebrow">Pilih Subjek</p><h2>📚 Subjek Tahun 2</h2><div className="subject-grid">{subjectList.map(subject => <button key={subject.id} className={`subject-card ${selectedSubjectId === subject.id ? 'selected-subject' : ''}`} onClick={() => onSelectSubject(subject.id)}><span>{subject.icon}</span><b>{subject.title}</b><small>{subject.questionCount} soalan</small></button>)}</div></section>
    <section className="card stats-panel"><p className="eyebrow">Statistik {selectedSubject.short}</p><h2>📊 Ringkasan Kemajuan</h2><div className="insight-grid"><div className="insight"><b>{averageScore}%</b><span>Purata</span></div><div className="insight"><b>{completed}</b><span>Topik Siap</span></div><div className="insight"><b>{totalQuestions}</b><span>Soalan</span></div></div></section>
    <section className="card uasa-card"><p className="eyebrow">UASA Practice</p><h2>🏆 UASA Simulator {selectedSubject.short}</h2><p>Latihan campuran mengikut topik.</p><button onClick={onOpenUasa}>Mula UASA Simulator</button></section>
    <LearningPath profile={profile} subject={selectedSubject} topicMastery={topicMastery} totalQuestions={totalQuestions} completed={completed} resume={resume} onStartTopic={onStartTopic} onResume={onResume} onToggleFavourite={onToggleFavourite} />
  </section></main>;
}

function LearningPath({ profile, subject, topicMastery, totalQuestions, completed, resume, onStartTopic, onResume, onToggleFavourite }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const sections = buildLearningPathSections(subject.topics);
  const nextUnlockedIndex = subject.topics.findIndex((topic, index) => {
    const best = profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0;
    return isTopicUnlocked(profile, subject, index) && best < 80;
  });

  function toggleSection(sectionTitle) {
    setCollapsedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  }

  return <section className="card learning-path-card"><div className="path-card-head"><div><p className="eyebrow">Learning Path</p><h2>{subject.icon} {subject.title}</h2><p>{subject.topics.length} topik • {totalQuestions} soalan</p></div><span className="path-summary">{completed}/{subject.topics.length} siap</span></div><div className="learning-path">{sections.map(section => { const isCollapsed = collapsedSections[section.title]; return <section className="path-section" key={`${subject.id}-${section.title}`}><button type="button" className="path-section-toggle" onClick={() => toggleSection(section.title)} aria-expanded={!isCollapsed}><span>{section.title}</span><small>Topik {section.start + 1}-{section.start + section.topics.length}</small><b>{isCollapsed ? '+' : '-'}</b></button>{!isCollapsed && <div className="path-section-body">{section.topics.map((topic, topicOffset) => { const index = section.start + topicOffset; const best = profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0; const mastery = topicMastery?.[progressKey(subject.id, topic.id)]; const masteryStatus = mastery?.status || MASTERY_STATUS.NOT_STARTED; const done = masteryStatus === MASTERY_STATUS.MASTERED; const needRevision = masteryStatus === MASTERY_STATUS.NEEDS_PRACTICE || isWeakTopic(profile, subject, topic); const blockedBy = getBlockedPrerequisites(subject, topic.id, topicMastery); const unlocked = isTopicUnlockedByGraph(subject, topic.id, topicMastery); const dependencyArrow = getDependencyArrow(subject, topic.id); const isNewUnlock = index === nextUnlockedIndex && unlocked && !done; const favId = `${subject.id}_${topic.id}`; const isFav = (profile.favourites || []).some(f => f.id === favId); const questionsCompleted = getTopicQuestionsCompleted(topic, best); const hasResume = resume?.subjectId === subject.id && resume?.topicId === topic.id; const inProgress = hasResume || masteryStatus === MASTERY_STATUS.LEARNING; const status = masteryStatus.replaceAll('_', ' '); const masteryClass = `mastery-${masteryStatus.toLowerCase().replaceAll('_', '-')}`; return <div className="path-row" key={topic.id}>{dependencyArrow && <div className="dependency-arrow">{dependencyArrow}</div>}<article className={`path-node ${masteryClass} ${done ? 'path-done' : ''} ${unlocked && !done ? 'path-open' : ''} ${!unlocked ? 'path-locked' : ''} ${isNewUnlock ? 'path-new-unlock' : ''} ${needRevision ? 'path-revision' : ''}`}><button type="button" className={`fav-icon ${isFav ? 'active' : ''}`} onClick={() => onToggleFavourite(subject.id, topic.id, topic.title)} aria-label={isFav ? 'Remove favourite' : 'Add favourite'} aria-pressed={isFav}>{isFav ? '❤️' : '♡'}</button><button type="button" className="path-main" onClick={() => unlocked ? (hasResume ? onResume() : onStartTopic(topic)) : alert(`Master prerequisite first: ${blockedBy.join(', ')}`)}><span className="path-icon">{unlocked ? (done ? '🏅' : index + 1) : '🔒'}</span><span className="path-copy"><b>{topic.title}</b>{needRevision && <em className="revision-badge">Need Revision</em>}<small>{mastery?.masteryScore || best}% mastery • {getStars(best)} • {questionsCompleted}/{topic.questions.length} soalan</small><span className="mini-progress"><span style={{ width: `${mastery?.masteryScore || best}%` }} /></span></span></button><div className="path-actions"><span className={`path-status ${masteryStatus.toLowerCase().replaceAll('_', '-')}`}>{status}</span>{unlocked && <button type="button" className="path-cta" onClick={() => hasResume ? onResume() : onStartTopic(topic)}>{needRevision ? 'Practice Again' : inProgress ? 'Continue' : done ? 'Ulang' : 'Mula'}</button>}</div></article>{index < subject.topics.length - 1 && <div className="path-line">↓</div>}</div> })}</div>}</section> })}<div className="path-trophy">🏆 Tamat {subject.short}</div></div></section>;
}

function AiTutorChat({ profile, selectedSubject, onClose }) {
  const [messages, setMessages] = useState([{ role: 'ai', text: `Assalamualaikum ${profile.name || 'Anak'} 😊 Saya AI Tutor.` }]);
  const [input, setInput] = useState('');
  function sendMessage(text = input) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }, { role: 'ai', text: aiReply(text, profile, selectedSubject) }]);
    setInput('');
  }
  return <div className="ai-chat-overlay"><section className="ai-chat"><div className="ai-chat-head"><div><b>🤖 Jannati AI Tutor</b><span>Offline smart tutor asas</span></div><button className="ghost" onClick={onClose}>✕</button></div><div className="ai-chat-body">{messages.map((msg, index) => <div key={index} className={`chat-bubble ${msg.role === 'ai' ? 'ai' : 'user'}`}>{msg.text}</div>)}</div><div className="quick-prompts"><button onClick={() => sendMessage('Apa saya perlu belajar hari ini?')}>Apa nak belajar?</button><button onClick={() => sendMessage('Topik mana saya lemah?')}>Topik lemah</button><button onClick={() => sendMessage('Saya nak persediaan UASA')}>UASA</button></div><div className="ai-chat-input"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Tanya AI Tutor..." /><button onClick={() => sendMessage()}>Hantar</button></div></section></div>;
}

function UasaSimulator({ subject, onBack, onSave }) {
  const [questions] = useState(() => buildUasaSet(subject, 20));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const question = questions[index];
  function submitAnswer() {
    if (!question) return;
    const result = smartCheck(answer, question);
    const next = [...answers, { questionId: question.id, topicId: question.topicId, topic: question.topicTitle, answer, correctAnswer: question.answer, status: result.status }];
    setAnswers(next); setAnswer('');
    if (index + 1 >= questions.length) setFinished(true); else setIndex(index + 1);
  }
  const correctCount = answers.filter(a => a.status === 'correct').length;
  const almostCount = answers.filter(a => a.status === 'almost').length;
  const score = questions.length ? Math.round(((correctCount + almostCount * 0.5) / questions.length) * 100) : 0;
  const grade = getGrade(score);
  function saveResult() {
    if (saved) return;
    onSave({ date: todayKey(), subjectId: subject.id, subjectShort: subject.short, subjectTitle: subject.title, score, grade, total: questions.length, correct: correctCount, weakTopics: [] });
    setSaved(true);
  }
  if (finished) return <main className="app uasa-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><span className="pill">UASA {subject.short}</span></div><section className="card reward-card"><div className="big">🏆</div><h1>Keputusan UASA</h1><div className="result-score"><b>{score}%</b><span>Gred {grade} • {getStars(score)}</span></div><div className="actions"><button disabled={saved} onClick={saveResult}>{saved ? '✅ Disimpan' : 'Simpan Keputusan'}</button><button className="secondary" onClick={onBack}>Kembali</button></div></section></main>;
  return <main className="app uasa-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><span className="pill">UASA {subject.short} {index + 1}/{questions.length}</span></div><section className="card"><h1 className="question">{question.q}</h1><input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAnswer()} placeholder="Tulis jawapan" autoFocus /><div className="actions"><button className="secondary" onClick={() => speakText(question.q.replaceAll('________', ' kosong '))}>🔊 Baca Soalan</button><button onClick={submitAnswer}>Jawab</button></div></section></main>;
}

function summarizeHistory(history = [], days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const rows = history.filter(item => item.date && new Date(item.date) >= cutoff);
  const average = rows.length ? Math.round(rows.reduce((sum, item) => sum + (item.percent || 0), 0) / rows.length) : 0;
  return { count: rows.length, average };
}

function buildParentRecommendation(memory, profile) {
  if (memory.weakTopics?.length) {
    return `Fokus ulang kaji ${memory.weakTopics[0].title}. Topik ini masih perlukan latihan kerana skor terbaik belum mencapai 80%.`;
  }
  if ((profile.history || []).length === 0) {
    return 'Mulakan dengan satu sesi pendek hari ini. Sasarkan 5 hingga 10 soalan dahulu.';
  }
  return 'Kemajuan stabil. Teruskan rutin latihan harian dan cuba UASA Simulator sekali seminggu.';
}

function ParentDashboard({ profile, allSubjects, onBack }) {
  const memory = loadAIMemory();
  const weekly = summarizeHistory(profile.history, 7);
  const monthly = summarizeHistory(profile.history, 30);
  const subjectRows = allSubjects.map(subject => ({ id: subject.id, title: subject.title, short: subject.short, icon: subject.icon, average: getSubjectAverage(profile, subject), completed: subject.topics.filter(t => (profile.progress?.[progressKey(subject.id, t.id)]?.best || 0) >= 80).length, total: subject.topics.length }));
  const weakTopics = memory.weakTopics?.length ? memory.weakTopics : subjectRows.flatMap(subject => []).slice(0, 0);
  const strongTopics = memory.strongTopics || [];
  const recommendation = buildParentRecommendation(memory, profile);
  const curriculumCoverage = buildCurriculumCoverage(profile, allSubjects);
  const teacherSnapshot = buildTeacherPortalSnapshot(allSubjects, curriculumCoverage);
  const uasaCoverage = summarizeUasaCoverage(curriculumCoverage);
  const readingHistory = (memory.readingHistory || []).slice(0, 6);
  const listeningHistory = (memory.listeningHistory || []).slice(0, 6);
  const speakingHistory = (memory.speakingHistory || []).slice(0, 6);
  const writingHistory = (memory.writingHistory || []).slice(0, 6);

  return <main className="app parent-page">
    <div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><button onClick={printReport}>🖨️ Cetak / Save PDF</button></div>
    <section className="card parent-hero"><div className="bot medium">👨‍👩‍👧</div><div><p className="eyebrow">Parent Dashboard Pro</p><h1>Laporan Pembelajaran {profile.name || 'Anak'}</h1><p>Ringkasan kemajuan, topik lemah, topik kuat dan cadangan AI offline.</p></div></section>
    <section className="parent-summary-grid"><div className="parent-metric"><span>Minggu Ini</span><b>{weekly.average}%</b><small>{weekly.count} aktiviti</small></div><div className="parent-metric"><span>Bulan Ini</span><b>{monthly.average}%</b><small>{monthly.count} aktiviti</small></div><div className="parent-metric"><span>Mastery</span><b>{memory.mastery || 0}%</b><small>{strongTopics.length} topik kuat</small></div><div className="parent-metric"><span>Study Time</span><b>{formatStudyTime(memory.studyTime || 0)}</b><small>Direkod offline</small></div></section>
    <section className="card"><p className="eyebrow">SK/SP Mastery</p><h2>Curriculum Intelligence</h2><div className="mastery-summary-grid"><div><b>{curriculumCoverage.summary.coveragePercent}%</b><span>Coverage</span></div><div><b>{curriculumCoverage.summary.masteryPercent}%</b><span>Mastery</span></div><div><b>{uasaCoverage.uasaQuestions}</b><span>UASA Items</span></div><div><b>{curriculumCoverage.summary.missing}</b><span>Missing</span></div></div><div className="timeline">{curriculumCoverage.missingSkSp.slice(0, 6).map((item, index) => <div className="timeline-item" key={`${item.subjectId}-${item.SK}-${item.SP}-${index}`}><span>{item.subject}</span><b>{item.SK} / {item.SP}</b><em>{item.coverage}% covered • {item.mastery}% mastered</em></div>)}</div></section>
    <section className="card teacher-snapshot-card"><p className="eyebrow">Teacher Snapshot</p><h2>Classroom View</h2><div className="mastery-summary-grid"><div><b>{teacherSnapshot.subjects.length}</b><span>Subjects</span></div><div><b>{teacherSnapshot.subjects.reduce((sum, subject) => sum + subject.topics, 0)}</b><span>Topics</span></div><div><b>{teacherSnapshot.subjects.reduce((sum, subject) => sum + subject.questions, 0)}</b><span>Questions</span></div><div><b>{teacherSnapshot.skSpRows.length}</b><span>SK/SP Rows</span></div></div><p className="memory-last">Generated {teacherSnapshot.generatedAt.slice(0, 10)} for teacher review.</p></section>
    <section className="card parent-ai-card"><p className="eyebrow">AI Recommendation for Parent</p><h2>🤖 Cadangan Ibu Bapa</h2><p>{recommendation}</p><div className="recommend-meta"><span>XP {profile.xp || 0}</span><span>Coins {profile.coins || 0}</span><span>Streak {profile.streak || 0}</span></div></section>
    <section className="card"><h2>🎤 Reading Coach History</h2><div className="timeline">{readingHistory.length ? readingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.correct} correct • {item.missed} missed</em></div>) : <p>Belum ada rekod bacaan.</p>}</div></section>
    <section className="card"><h2>🎧 Listening Lab History</h2><div className="timeline">{listeningHistory.length ? listeningHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.correct}/{item.total} • {item.mode}</em></div>) : <p>Belum ada rekod listening.</p>}</div></section>
    <section className="card"><h2>🗣️ Speaking Coach History</h2><div className="timeline">{speakingHistory.length ? speakingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.matchedKeywords}/{item.totalKeywords} keywords • {item.mode}</em></div>) : <p>Belum ada rekod speaking.</p>}</div></section>
    <section className="card"><h2>✍️ Writing Coach History</h2><div className="timeline">{writingHistory.length ? writingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.matchedKeywords}/{item.totalKeywords} keywords • {item.spellingIssues} spelling</em></div>) : <p>Belum ada rekod writing.</p>}</div></section>
    <section className="card"><h2>📚 Kemajuan Mengikut Subjek</h2><div className="subject-report-grid">{subjectRows.map(row => <div className="report-box" key={row.id}><h3>{row.icon} {row.short}</h3><b>{row.average}%</b><div className="mini-progress"><div style={{ width: `${row.average}%` }} /></div><span>{row.completed}/{row.total} topik siap</span></div>)}</div></section>
    <section className="parent-two-col"><section className="card"><h2>⚠️ Weak Topics</h2><div className="parent-topic-list">{weakTopics.length ? weakTopics.slice(0, 8).map(topic => <div className="parent-topic-item" key={`${topic.subjectId}-${topic.topicId}`}><b>{topic.title}</b><span>{topic.subject} • {topic.best}%</span></div>) : <p>Tiada topik lemah direkod.</p>}</div></section><section className="card"><h2>🌟 Strong Topics</h2><div className="parent-topic-list">{strongTopics.length ? strongTopics.slice(0, 8).map(topic => <div className="parent-topic-item strong" key={`${topic.subjectId}-${topic.topicId}`}><b>{topic.title}</b><span>{topic.subject} • {topic.best}%</span></div>) : <p>Belum ada topik kuat direkod.</p>}</div></section></section>
    <section className="card"><h2>🏆 UASA History</h2><div className="timeline">{(profile.uasaHistory || []).length ? profile.uasaHistory.slice(0, 8).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{item.subjectShort || item.subjectId} - Gred {item.grade}</b><em>{item.score}% • {item.total} soalan</em></div>) : <p>Belum ada rekod UASA.</p>}</div></section>
    <section className="card"><h2>📅 Aktiviti Terkini</h2><div className="timeline">{(profile.history || []).length === 0 ? <p>Belum ada aktiviti.</p> : profile.history.slice(0, 10).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{item.subject} - {item.topic}</b><em>{item.percent}% {item.stars}</em></div>)}</div></section>
  </main>;
}

function Quiz({ subject, topic, questionIndex, answer, feedback, isBookmarked, onAnswerChange, onCheckAnswer, onNextQuestion, onTryAgain, onExplain, onBack, onHint, onSpeak, onBookmark, onOpenAi }) {
  const question = topic.questions[questionIndex];
  const progress = Math.round(((questionIndex + 1) / topic.questions.length) * 100);
  return <main className="app"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><span className="pill">{subject.icon} {questionIndex + 1}/{topic.questions.length}</span></div><section className="card tutor-card"><div className="bot small">🤖</div><div><p className="eyebrow">{subject.title}</p><h2>{topic.title}</h2><p>{topic.note}</p></div></section><section className="card"><div className="progress-wrap"><div className="progress" style={{ width: `${progress}%` }} /></div><h1 className="question">{question.q}</h1><input value={answer} onChange={e => onAnswerChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') feedback ? onNextQuestion() : onCheckAnswer(); }} placeholder="Tulis jawapan di sini" autoFocus /><div className="actions"><button className="secondary" onClick={onSpeak}>🔊 Baca Soalan</button><button className="secondary" onClick={onHint}>💡 Hint</button></div><div className="actions"><button className="secondary" onClick={onBookmark}>{isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}</button><button className="secondary" onClick={onOpenAi}>🤖 Tanya AI</button></div><button className="full" onClick={onCheckAnswer}>Semak Jawapan</button><p className="autosave-note">💾 Auto Save aktif.</p></section>{feedback && <section className={`feedback ${feedback.status}`}><h2>{feedback.status === 'correct' ? '🟢' : feedback.status === 'almost' ? '🟡' : feedback.status === 'hint' ? '💡' : '🔴'} {feedback.title}</h2><p>{feedback.message}</p>{feedback.correctAnswer && <p>Jawapan tepat: <b>{feedback.correctAnswer}</b></p>}{feedback.explanation && <div className="explain-box"><b>AI Tutor</b><p>{feedback.explanation}</p></div>}{feedback.status !== 'hint' && <div className="actions"><button className="secondary" onClick={onExplain}>🤖 Terangkan</button><button className="secondary" onClick={onTryAgain}>Cuba Lagi</button><button onClick={onNextQuestion}>Seterusnya</button></div>}</section>}</main>;
}

function Finish({ session, topic, nextTopic, onDashboard, onRetry, onNextTopic, onOpenAi }) {
  const passed = (session.percent || 0) >= 80;
  return <main className="app reward-page"><section className="card finish reward-card"><div className="big bounce">{passed ? '🎉' : '💪'}</div><p className="eyebrow">{topic?.title || 'Topic Complete'}</p><h1>{passed ? 'Tahniah!' : 'Bagus mencuba!'}</h1><div className="result-score"><b>{session.percent || 0}%</b><span>{session.stars || '☆☆☆'}</span></div><div className="finish-rewards"><div><b>{session.xp || 0}</b><span>XP gained</span></div><div><b>{session.coins || 0}</b><span>Coins gained</span></div><div><b>{passed ? 'Unlocked' : 'Locked'}</b><span>{passed && nextTopic ? nextTopic.title : passed ? 'Semua topik siap' : 'Cuba capai 80%'}</span></div></div><div className="actions"><button onClick={passed && nextTopic ? onNextTopic : onRetry}>{passed && nextTopic ? 'Next Topic' : 'Ulang Topik'}</button><button className="secondary" onClick={onDashboard}>Dashboard</button><button className="secondary" onClick={onOpenAi}>🤖 Tanya AI</button></div></section></main>;
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
    title: 'أسرتي',
    text: 'هذه أسرتي. أبي وأمي في البيت. أنا أحب أسرتي كثيرا.'
  }
];

function normalizeReadingWord(word = '') {
  return word
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function splitReadingWords(text = '') {
  return text.split(/\s+/).map(word => ({
    raw: word,
    normalized: normalizeReadingWord(word)
  })).filter(word => word.normalized);
}

function compareReading(targetText = '', transcript = '') {
  const targetWords = splitReadingWords(targetText);
  const spokenWords = splitReadingWords(transcript);
  const used = new Set();
  let correct = 0;
  let missed = 0;

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

    missed += 1;
    return { text: word.raw, status: 'missed' };
  });

  const incorrectWords = spokenWords.filter((_, index) => !used.has(index));
  const score = targetWords.length ? Math.max(0, Math.round((correct / targetWords.length) * 100 - incorrectWords.length * 2)) : 0;

  return {
    words,
    correct,
    missed,
    incorrect: incorrectWords.length,
    incorrectWords: incorrectWords.map(word => word.raw),
    score
  };
}

function ReadingCoach({ profile, onBack, onFinish }) {
  const [passageId, setPassageId] = useState(readingPassages[0].id);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
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

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = passage.speechLang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = event => {
      const text = Array.from(event.results).map(item => item[0]?.transcript || '').join(' ');
      setTranscript(text);
      setResult(compareReading(passage.text, text));
    };
    recognition.start();
  }

  function checkManual() {
    setResult(compareReading(passage.text, transcript));
  }

  function saveResult() {
    const nextResult = result || compareReading(passage.text, transcript);
    onFinish({
      language: passage.language,
      title: passage.title,
      targetText: passage.text,
      transcript,
      score: nextResult.score,
      correct: nextResult.correct,
      missed: nextResult.missed,
      incorrect: nextResult.incorrect
    });
  }

  return <main className="app reading-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><span className="pill">Offline Reading Coach</span></div><section className="card reading-hero"><div className="bot medium">🎤</div><div><p className="eyebrow">Reading Coach AI</p><h1>{passage.title}</h1><p>No paid API. Uses browser speech recognition when available, with manual input fallback.</p></div></section><section className="card"><p className="eyebrow">Choose Passage</p><div className="reading-tabs">{readingPassages.map(item => <button key={item.id} className={item.id === passageId ? '' : 'secondary'} onClick={() => setPassageId(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${passage.language === 'arab' ? 'rtl' : ''}`}>{passage.text}</div><div className="actions"><button onClick={startListening} disabled={!recognitionSupported || listening}>{listening ? 'Listening...' : 'Start Speaking'}</button><button className="secondary" onClick={checkManual}>Check Text</button></div>{!recognitionSupported && <p className="autosave-note">SpeechRecognition is not supported in this browser. Type what was read below.</p>}<label>Transcript / manual reading</label><textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Speech transcript or manual reading..." /></section>{result && <section className="card reading-result"><p className="eyebrow">Reading Result</p><h2>{result.score}%</h2><div className="word-check reading-word-check">{result.words.map((word, index) => <span key={`${word.text}-${index}`} className={word.status === 'correct' ? 'word-good' : 'word-miss'}>{word.text}</span>)}</div>{result.incorrectWords.length > 0 && <p>Incorrect extra words: <b>{result.incorrectWords.join(', ')}</b></p>}<div className="recommend-meta"><span>{result.correct} correct</span><span>{result.missed} missed</span><span>{result.incorrect} incorrect</span></div><button onClick={saveResult}>Save Reading Result</button></section>}</main>;
}

const listeningSets = [
  { id: 'bm', language: 'BM', speechLang: 'ms-MY', title: 'BM Listening', prompt: 'Ibu beli roti dan susu di kedai.', choose: { question: 'Apa yang ibu beli?', options: ['Roti dan susu', 'Buku dan pensel', 'Ikan dan nasi'], answer: 'Roti dan susu' }, arrange: ['Ibu', 'beli', 'roti'], spell: 'susu', answer: { question: 'Di mana ibu membeli barang?', accepted: ['kedai', 'di kedai'] } },
  { id: 'english', language: 'English', speechLang: 'en-US', title: 'English Listening', prompt: 'The boy reads a book under the tree.', choose: { question: 'What does the boy read?', options: ['A book', 'A letter', 'A menu'], answer: 'A book' }, arrange: ['The', 'boy', 'reads'], spell: 'tree', answer: { question: 'Where is the boy?', accepted: ['under the tree', 'tree'] } },
  { id: 'arab', language: 'Arabic', speechLang: 'ar-SA', title: 'Arabic Listening', prompt: 'أنا أحب أمي وأبي.', choose: { question: 'Siapa yang disebut?', options: ['أمي وأبي', 'قطتي', 'صديقي'], answer: 'أمي وأبي' }, arrange: ['أنا', 'أحب', 'أمي'], spell: 'أبي', answer: { question: 'Tulis satu perkataan yang didengar.', accepted: ['أمي', 'أبي', 'احب', 'أحب'] } }
];

function normalizeListening(text = '') {
  return normalizeReadingWord(text).replace(/\s+/g, '');
}

function ListeningLab({ onBack, onFinish }) {
  const [setId, setSetId] = useState('bm');
  const [mode, setMode] = useState('choose');
  const [choice, setChoice] = useState('');
  const [arranged, setArranged] = useState([]);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState([]);
  const audioRef = useRef(null);
  const item = listeningSets.find(set => set.id === setId) || listeningSets[0];
  const modes = [
    { id: 'choose', label: 'Choose' },
    { id: 'arrange', label: 'Arrange' },
    { id: 'spell', label: 'Spell' },
    { id: 'answer', label: 'Answer' }
  ];

  useEffect(() => {
    setChoice('');
    setArranged([]);
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

  function submitListening() {
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
      correct = normalizeListening(typed) === normalizeListening(expected);
    }
    if (mode === 'answer') {
      expected = item.answer.accepted.join(', ');
      response = typed;
      correct = item.answer.accepted.some(answer => normalizeListening(answer) === normalizeListening(typed));
    }
    const next = { mode, correct, expected, response };
    setFeedback(next);
    setAnswers(prev => [next, ...prev.filter(answer => answer.mode !== mode)]);
  }

  function saveListening() {
    const total = modes.length;
    const correct = answers.filter(answer => answer.correct).length + (feedback?.correct && !answers.some(answer => answer.mode === feedback.mode) ? 1 : 0);
    const score = Math.round((correct / total) * 100);
    onFinish({ language: item.language, title: item.title, mode: 'mixed', score, correct, total });
  }

  const availableWords = item.arrange.filter(word => !arranged.includes(word));

  return <main className="app listening-lab-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><span className="pill">Offline Listening Lab</span></div><section className="card reading-hero"><div className="bot medium">🎧</div><div><p className="eyebrow">Listening Lab</p><h1>{item.title}</h1><p>Offline first. HTML5 audio is ready for local clips, with browser voice playback as fallback.</p></div></section><section className="card"><p className="eyebrow">Language</p><div className="reading-tabs">{listeningSets.map(set => <button key={set.id} className={set.id === setId ? '' : 'secondary'} onClick={() => setSetId(set.id)}>{set.language}</button>)}</div><audio ref={audioRef} controls preload="none" /><button className="full" onClick={playAudio}>Play Listening Audio</button></section><section className="card"><p className="eyebrow">Question Type</p><div className="reading-tabs">{modes.map(nextMode => <button key={nextMode.id} className={nextMode.id === mode ? '' : 'secondary'} onClick={() => setMode(nextMode.id)}>{nextMode.label}</button>)}</div>{mode === 'choose' && <div><h2>{item.choose.question}</h2><div className="listening-options">{item.choose.options.map(option => <button key={option} className={choice === option ? '' : 'secondary'} onClick={() => setChoice(option)}>{option}</button>)}</div></div>}{mode === 'arrange' && <div><h2>Arrange the words you hear</h2><div className="listening-arrange">{arranged.map(word => <button key={word} onClick={() => setArranged(prev => prev.filter(item => item !== word))}>{word}</button>)}</div><div className="listening-options">{availableWords.map(word => <button className="secondary" key={word} onClick={() => setArranged(prev => [...prev, word])}>{word}</button>)}</div></div>}{mode === 'spell' && <div><h2>Spell the word you hear</h2><input value={typed} onChange={event => setTyped(event.target.value)} placeholder="Type the word" /></div>}{mode === 'answer' && <div><h2>{item.answer.question}</h2><input value={typed} onChange={event => setTyped(event.target.value)} placeholder="Type your answer" /></div>}<div className="actions"><button onClick={submitListening}>Check Answer</button><button className="secondary" onClick={saveListening}>Save Lab Score</button></div>{feedback && <div className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}><h2>{feedback.correct ? 'Correct' : 'Try again'}</h2><p>Answer: <b>{feedback.expected}</b></p></div>}</section></main>;
}

const speakingPrompts = [
  {
    id: 'bm',
    language: 'BM',
    speechLang: 'ms-MY',
    title: 'BM Speaking',
    prompts: {
      intro: { label: 'Introduce yourself', text: 'Perkenalkan diri kamu.', keywords: ['nama', 'umur', 'saya'] },
      describe: { label: 'Describe picture/text prompt', text: 'Ceritakan tentang taman yang cantik dengan bunga dan pokok.', keywords: ['taman', 'bunga', 'pokok'] },
      answer: { label: 'Answer simple question', text: 'Apakah makanan kegemaran kamu?', keywords: ['makanan', 'suka'] },
      repeat: { label: 'Repeat sentence', text: 'Saya suka belajar bersama Jannati AI Tutor.', keywords: ['saya', 'suka', 'belajar', 'jannati'] }
    }
  },
  {
    id: 'english',
    language: 'English',
    speechLang: 'en-US',
    title: 'English Speaking',
    prompts: {
      intro: { label: 'Introduce yourself', text: 'Introduce yourself in one sentence.', keywords: ['name', 'old', 'like'] },
      describe: { label: 'Describe picture/text prompt', text: 'Describe a sunny park with children playing.', keywords: ['park', 'children', 'sunny'] },
      answer: { label: 'Answer simple question', text: 'What do you like to read?', keywords: ['read', 'book', 'like'] },
      repeat: { label: 'Repeat sentence', text: 'I can speak clearly and confidently.', keywords: ['speak', 'clearly', 'confidently'] }
    }
  },
  {
    id: 'arab',
    language: 'Arabic',
    speechLang: 'ar-SA',
    title: 'Arabic Speaking',
    prompts: {
      intro: { label: 'Introduce yourself', text: 'عرف نفسك بجملة قصيرة.', keywords: ['أنا', 'اسمي'] },
      describe: { label: 'Describe picture/text prompt', text: 'صف بيتا جميلا فيه باب ونافذة.', keywords: ['بيت', 'جميل', 'باب'] },
      answer: { label: 'Answer simple question', text: 'ماذا تحب؟', keywords: ['أحب', 'انا'] },
      repeat: { label: 'Repeat sentence', text: 'أنا أتعلم اللغة العربية.', keywords: ['أنا', 'أتعلم', 'العربية'] }
    }
  }
];

function scoreSpeaking(prompt, transcript) {
  const normalizedTranscript = normalizeReadingWord(transcript);
  const matched = prompt.keywords.filter(keyword => normalizedTranscript.includes(normalizeReadingWord(keyword)));
  const keywordScore = prompt.keywords.length ? Math.round((matched.length / prompt.keywords.length) * 80) : 0;
  const lengthBonus = transcript.trim().split(/\s+/).filter(Boolean).length >= Math.min(5, prompt.keywords.length + 2) ? 20 : 8;
  return {
    score: Math.min(100, keywordScore + lengthBonus),
    matched,
    missed: prompt.keywords.filter(keyword => !matched.includes(keyword))
  };
}

function SpeakingCoach({ onBack, onFinish }) {
  const [setId, setSetId] = useState('bm');
  const [mode, setMode] = useState('intro');
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
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

  function startSpeaking() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = set.speechLang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = event => {
      const text = Array.from(event.results).map(item => item[0]?.transcript || '').join(' ');
      setTranscript(text);
      setResult(scoreSpeaking(prompt, text));
    };
    recognition.start();
  }

  function checkSpeaking() {
    setResult(scoreSpeaking(prompt, transcript));
  }

  function saveSpeaking() {
    const nextResult = result || scoreSpeaking(prompt, transcript);
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

  return <main className="app speaking-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><span className="pill">Offline Speaking Coach</span></div><section className="card reading-hero"><div className="bot medium">🗣️</div><div><p className="eyebrow">Speaking Coach</p><h1>{set.title}</h1><p>No paid API. Uses browser speech recognition when available, with manual transcript fallback.</p></div></section><section className="card"><p className="eyebrow">Language</p><div className="reading-tabs">{speakingPrompts.map(item => <button key={item.id} className={item.id === setId ? '' : 'secondary'} onClick={() => setSetId(item.id)}>{item.language}</button>)}</div><p className="eyebrow">Question Type</p><div className="speaking-mode-grid">{modes.map(item => <button key={item.id} className={item.id === mode ? '' : 'secondary'} onClick={() => setMode(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${set.id === 'arab' ? 'rtl' : ''}`}>{prompt.text}</div><div className="actions"><button onClick={startSpeaking} disabled={!recognitionSupported || listening}>{listening ? 'Listening...' : 'Start Speaking'}</button><button className="secondary" onClick={checkSpeaking}>Check Transcript</button></div>{!recognitionSupported && <p className="autosave-note">SpeechRecognition is not supported in this browser. Type what was spoken below.</p>}<label>Transcript / manual speaking</label><textarea value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Speech transcript or manual response..." /></section>{result && <section className="card reading-result"><p className="eyebrow">Speaking Result</p><h2>{result.score}%</h2><div className="recommend-meta"><span>{result.matched.length}/{prompt.keywords.length} keywords</span><span>Mode {mode}</span><span>{set.language}</span></div><div className="word-check reading-word-check">{prompt.keywords.map(keyword => <span key={keyword} className={result.matched.includes(keyword) ? 'word-good' : 'word-miss'}>{keyword}</span>)}</div>{result.missed.length > 0 && <p>Try to include: <b>{result.missed.join(', ')}</b></p>}<button onClick={saveSpeaking}>Save Speaking Result</button></section>}</main>;
}

const writingSets = [
  {
    id: 'bm',
    language: 'BM',
    title: 'BM Writing',
    dictionary: ['saya', 'makan', 'nasi', 'di', 'rumah', 'kucing', 'tidur', 'atas', 'tikar', 'ibu', 'beli', 'roti', 'suka', 'belajar', 'kerana', 'seronok', 'taman', 'bunga', 'cantik'],
    tasks: {
      arrange: { label: 'Arrange sentence', prompt: 'Susun ayat.', words: ['Saya', 'makan', 'nasi'], answer: 'Saya makan nasi', keywords: ['saya', 'makan', 'nasi'] },
      blank: { label: 'Fill in blanks', prompt: 'Saya ____ nasi di rumah.', answer: 'makan', keywords: ['makan'] },
      short: { label: 'Short answer', prompt: 'Apakah haiwan kesukaan kamu?', keywords: ['suka', 'kucing'] },
      build: { label: 'Build sentence', prompt: 'Bina ayat dengan perkataan: taman, bunga.', keywords: ['taman', 'bunga'] },
      paragraph: { label: 'Simple paragraph', prompt: 'Tulis 2 ayat tentang belajar.', keywords: ['saya', 'belajar', 'seronok'] }
    }
  },
  {
    id: 'english',
    language: 'English',
    title: 'English Writing',
    dictionary: ['i', 'like', 'books', 'read', 'school', 'garden', 'flowers', 'sunny', 'cat', 'sleeps', 'on', 'mat', 'learn', 'because', 'happy', 'play', 'friend'],
    tasks: {
      arrange: { label: 'Arrange sentence', prompt: 'Arrange the sentence.', words: ['I', 'like', 'books'], answer: 'I like books', keywords: ['i', 'like', 'books'] },
      blank: { label: 'Fill in blanks', prompt: 'The cat sleeps ____ the mat.', answer: 'on', keywords: ['on'] },
      short: { label: 'Short answer', prompt: 'What do you like to read?', keywords: ['like', 'read', 'book'] },
      build: { label: 'Build sentence', prompt: 'Build a sentence with: garden, flowers.', keywords: ['garden', 'flowers'] },
      paragraph: { label: 'Simple paragraph', prompt: 'Write 2 sentences about school.', keywords: ['school', 'learn', 'friend'] }
    }
  },
  {
    id: 'arab',
    language: 'Arabic',
    title: 'Arabic Writing',
    dictionary: ['أنا', 'أحب', 'أمي', 'أبي', 'بيتي', 'جميل', 'في', 'البيت', 'أتعلم', 'العربية', 'كتاب', 'قلم', 'مدرسة'],
    tasks: {
      arrange: { label: 'Arrange sentence', prompt: 'رتب الجملة.', words: ['أنا', 'أحب', 'أمي'], answer: 'أنا أحب أمي', keywords: ['أنا', 'أحب', 'أمي'] },
      blank: { label: 'Fill in blanks', prompt: 'أنا ____ العربية.', answer: 'أتعلم', keywords: ['أتعلم'] },
      short: { label: 'Short answer', prompt: 'ماذا تحب؟', keywords: ['أحب'] },
      build: { label: 'Build sentence', prompt: 'اكتب جملة فيها: بيت، جميل.', keywords: ['بيت', 'جميل'] },
      paragraph: { label: 'Simple paragraph', prompt: 'اكتب جملتين عن المدرسة.', keywords: ['مدرسة', 'كتاب'] }
    }
  }
];

function scoreWriting(task, answer, dictionary = []) {
  const normalizedAnswer = normalizeReadingWord(answer);
  const matched = task.keywords.filter(keyword => normalizedAnswer.includes(normalizeReadingWord(keyword)));
  const words = splitReadingWords(answer);
  const spellingIssues = words.filter(word => {
    if (!dictionary.length || word.normalized.length <= 1) return false;
    return !dictionary.some(item => normalizeReadingWord(item) === word.normalized);
  });
  const grammarHints = [];
  if (answer.trim() && !/[.!؟?]$/.test(answer.trim())) grammarHints.push('Add ending punctuation.');
  if (task.label === 'Simple paragraph' && answer.split(/[.!؟?]+/).filter(sentence => sentence.trim()).length < 2) grammarHints.push('Write at least two short sentences.');
  if (task.label !== 'Fill in blanks' && words.length < Math.max(2, task.keywords.length)) grammarHints.push('Make the answer a little longer.');
  const keywordScore = task.keywords.length ? Math.round((matched.length / task.keywords.length) * 60) : 0;
  const spellingScore = Math.max(0, 20 - spellingIssues.length * 5);
  const grammarScore = Math.max(0, 20 - grammarHints.length * 6);
  const exactBonus = task.answer && normalizeReadingWord(answer) === normalizeReadingWord(task.answer) ? 20 : 0;
  const score = Math.min(100, keywordScore + spellingScore + grammarScore + exactBonus);
  const explanation = matched.length === task.keywords.length
    ? 'Good writing. You included the important ideas and the sentence is easy to check.'
    : `Try to include these key ideas: ${task.keywords.filter(keyword => !matched.includes(keyword)).join(', ') || 'none'}.`;
  return { score, matched, spellingIssues, grammarHints, explanation };
}

function WritingCoach({ onBack, onFinish }) {
  const [setId, setSetId] = useState('bm');
  const [mode, setMode] = useState('arrange');
  const [answer, setAnswer] = useState('');
  const [arranged, setArranged] = useState([]);
  const [result, setResult] = useState(null);
  const set = writingSets.find(item => item.id === setId) || writingSets[0];
  const task = set.tasks[mode];
  const modes = Object.entries(set.tasks).map(([id, value]) => ({ id, label: value.label }));

  useEffect(() => {
    setAnswer('');
    setArranged([]);
    setResult(null);
  }, [setId, mode]);

  function currentAnswer() {
    return mode === 'arrange' ? arranged.join(' ') : answer;
  }

  function checkWriting() {
    setResult(scoreWriting(task, currentAnswer(), set.dictionary));
  }

  function saveWriting() {
    const nextResult = result || scoreWriting(task, currentAnswer(), set.dictionary);
    onFinish({
      language: set.language,
      title: set.title,
      mode,
      answer: currentAnswer(),
      score: nextResult.score,
      matchedKeywords: nextResult.matched.length,
      totalKeywords: task.keywords.length,
      spellingIssues: nextResult.spellingIssues.length,
      grammarHints: nextResult.grammarHints
    });
  }

  const availableWords = (task.words || []).filter(word => !arranged.includes(word));

  return <main className="app writing-coach-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><span className="pill">Offline Writing Coach</span></div><section className="card reading-hero"><div className="bot medium">✍️</div><div><p className="eyebrow">Writing Coach</p><h1>{set.title}</h1><p>No paid API. Rule-based keyword checks, spelling validation, grammar hints, and AI-style explanation.</p></div></section><section className="card"><p className="eyebrow">Language</p><div className="reading-tabs">{writingSets.map(item => <button key={item.id} className={item.id === setId ? '' : 'secondary'} onClick={() => setSetId(item.id)}>{item.language}</button>)}</div><p className="eyebrow">Question Type</p><div className="writing-mode-grid">{modes.map(item => <button key={item.id} className={item.id === mode ? '' : 'secondary'} onClick={() => setMode(item.id)}>{item.label}</button>)}</div><div className={`reading-target ${set.id === 'arab' ? 'rtl' : ''}`}>{task.prompt}</div>{mode === 'arrange' ? <><div className="listening-arrange">{arranged.map(word => <button key={word} onClick={() => setArranged(prev => prev.filter(item => item !== word))}>{word}</button>)}</div><div className="listening-options">{availableWords.map(word => <button className="secondary" key={word} onClick={() => setArranged(prev => [...prev, word])}>{word}</button>)}</div></> : <textarea value={answer} onChange={event => setAnswer(event.target.value)} placeholder={mode === 'blank' ? 'Type the missing word' : 'Write your answer here'} /> }<div className="actions"><button onClick={checkWriting}>Check Writing</button><button className="secondary" onClick={saveWriting}>Save Writing Result</button></div></section>{result && <section className="card reading-result"><p className="eyebrow">Writing Result</p><h2>{result.score}%</h2><div className="recommend-meta"><span>{result.matched.length}/{task.keywords.length} keywords</span><span>{result.spellingIssues.length} spelling issues</span><span>{result.grammarHints.length} grammar hints</span></div><div className="word-check reading-word-check">{task.keywords.map(keyword => <span key={keyword} className={result.matched.includes(keyword) ? 'word-good' : 'word-miss'}>{keyword}</span>)}</div>{result.spellingIssues.length > 0 && <p>Check spelling: <b>{result.spellingIssues.map(word => word.raw).join(', ')}</b></p>}{result.grammarHints.length > 0 && <div className="explain-box"><b>Grammar hints</b><p>{result.grammarHints.join(' ')}</p></div>}<div className="explain-box"><b>AI Explanation</b><p>{result.explanation}</p></div></section>}</main>;
}

function Stat({ icon, label, value }) {
  return <div className="stat"><span className="stat-icon">{icon}</span><b>{value}</b><span>{label}</span></div>;
}
