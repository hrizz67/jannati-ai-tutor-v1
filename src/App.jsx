import React, { useEffect, useMemo, useState } from 'react';
import { subjectList, loadSubjectData, loadAllSubjects } from './data/subjects';
import { smartCheck } from './utils/smartCheck';
import { speakText, beep } from './utils/speech';
import AIExplainModal from './components/ai/AIExplainModal';
import AITeacherModal from './components/ai/AITeacherModal';
import { explainAnswer } from './ai/explainEngine';
import { buildRecommendation, isWeakTopic, updateStoredRecommendation } from './ai/recommendationEngine';
import { teachAnswer } from './ai/teacherEngine';
import { formatStudyTime, loadAIMemory, saveQuizMemory } from './ai/memoryEngine';

const PROFILE_KEY = 'jannati_v140_profile';
const RESUME_KEY = 'jannati_v140_resume';

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
  return saved ? JSON.parse(saved) : defaultProfile;
}

function loadResume() {
  const saved = localStorage.getItem(RESUME_KEY);
  return saved ? JSON.parse(saved) : null;
}

function saveResume(data) {
  localStorage.setItem(RESUME_KEY, JSON.stringify(data));
}

function clearResume() {
  localStorage.removeItem(RESUME_KEY);
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

  function finishReading(score, spoken, targetText) {
    const today = todayKey();
    setProfile(prev => {
      const updatedProfile = { ...prev, xp: (prev.xp || 0) + Math.round(score / 2), coins: (prev.coins || 0) + Math.round(score / 10), lastStudy: today, history: [{ date: today, subject: 'Reading', topic: 'Reading Coach', percent: score, stars: getStars(score) }, ...(prev.history || [])].slice(0, 50) };
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
  if (screen === 'parent') return <ParentDashboard profile={profile} allSubjects={allSubjects} onBack={() => setScreen('dashboard')} />;
  if (screen === 'uasa') return <UasaSimulator profile={profile} subject={selectedSubject} onBack={() => setScreen('dashboard')} onSave={saveUasaResult} />;

  return <><Dashboard profile={profile} subjectList={subjectList} selectedSubject={selectedSubject} selectedSubjectId={selectedSubjectId} totalQuestions={totalQuestions} resume={resume} dailyChallenge={buildDailyChallenge()} onSelectSubject={setSelectedSubjectId} onStartTopic={(topic) => startTopic(topic, selectedSubject)} onStartReading={() => setScreen('reading')} onOpenParent={() => setScreen('parent')} onOpenUasa={() => setScreen('uasa')} onOpenAi={() => setChatOpen(true)} onReset={resetProfile} onResume={startResume} onRestartResume={restartResume} onCompleteDaily={completeDailyChallenge} onToggleFavourite={toggleFavourite} />{chatWidget}</>;
}

function Login({ onStart }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const avatars = ['👦', '👧', '🧒', '👩‍🎓', '👨‍🎓'];
  return <main className="app login"><section className="hero"><div className="bot">🤖</div><h1>Jannati AI Tutor</h1><p>Belajar Macam Bermain</p></section><section className="card"><label>Nama anak</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Fayyadh" /><label>Pilih avatar</label><div className="avatar-row">{avatars.map(item => <button key={item} className={`avatar-choice ${avatar === item ? 'selected' : ''}`} onClick={() => setAvatar(item)}>{item}</button>)}</div><button className="full" onClick={() => onStart(name, avatar)}>Mula Belajar</button></section></main>;
}

function Dashboard({ profile, subjectList, selectedSubject, selectedSubjectId, totalQuestions, resume, dailyChallenge, onSelectSubject, onStartTopic, onStartReading, onOpenParent, onOpenUasa, onOpenAi, onReset, onResume, onRestartResume, onCompleteDaily, onToggleFavourite }) {
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

  return <main className="dashboard-shell"><aside className="sidebar"><div className="brand"><div className="bot medium">🤖</div><div><h2>Jannati</h2><p>AI Tutor Split</p></div></div><button className="nav active">🏠 Dashboard</button><button className="nav" onClick={onOpenAi}>🤖 AI Tutor</button><button className="nav" onClick={onOpenUasa}>🏆 UASA</button><button className="nav" onClick={onOpenParent}>👨‍👩‍👧 Parent</button><div className="sidebar-note"><b>⚡ Split Data</b><p>Data dimuat ikut subjek supaya lebih ringan.</p></div></aside><section className="dashboard-main">
    <section className="profile hero-card"><div className="avatar-large">{profile.avatar || '👦'}</div><div><p className="eyebrow">Subject Split Edition</p><h1>Assalamualaikum, {profile.name} 😊</h1><p>AI cadangkan belajar <b>{recommended?.title}</b> hari ini.</p><div className="level-line"><span>Level {level}</span><div className="progress-wrap"><div className="progress" style={{ width: `${levelProgress}%` }} /></div><span>{levelProgress}/100 XP</span></div></div><button className="ghost" onClick={onReset}>Reset</button></section>
    <section className="stats"><Stat label="XP" value={profile.xp || 0} icon="⭐" /><Stat label="Level" value={level} icon="🏆" /><Stat label="Coins" value={profile.coins || 0} icon="💰" /><Stat label="Streak" value={profile.streak || 0} icon="🔥" /></section>
    <section className="quick-actions"><button onClick={() => recommended && onStartTopic(recommended)}>▶ Sambung Belajar</button><button className="secondary" onClick={onOpenAi}>🤖 Tanya AI</button><button className="secondary" onClick={onOpenUasa}>🏆 UASA Simulator</button><button className="secondary" onClick={onStartReading}>🎤 Reading</button><button className="secondary" onClick={onOpenParent}>👨‍👩‍👧 Parent</button></section>
    {resume && <section className="card resume-card"><p className="eyebrow">Auto Resume</p><h2>▶ Sambung Latihan</h2><p>Subjek: <b>{resume.subjectId}</b><br/>Soalan: <b>{resume.questionIndex + 1}</b></p><div className="actions"><button onClick={onResume}>▶ Sambung</button><button className="secondary" onClick={onRestartResume}>🔄 Mula Semula</button></div></section>}
    <section className="card ai-recommend-card"><p className="eyebrow">AI Recommendation</p><h2>🤖 Cadangan Belajar</h2><p>{aiRecommendation.reason}</p>{aiMemory.lastLesson && <p className="memory-last">Last lesson: <b>{aiMemory.lastLesson.title}</b> • {aiMemory.lastLesson.score}%</p>}<div className="recommend-meta"><span>{aiMemory.weakTopics.length || aiRecommendation.weakTopics.length} weak topics</span><span>{aiMemory.strongTopics.length} strong topics</span><span>Mastery {aiMemory.mastery}%</span><span>Study {formatStudyTime(aiMemory.studyTime)}</span><span>Streak {aiMemory.studyStreak}</span><span>{recommendedPracticeTopic?.title || 'Semua topik selesai'}</span></div><button onClick={() => recommendedPracticeTopic && onStartTopic(recommendedPracticeTopic)}>Practice Again</button></section>
    <section className="card daily-card"><p className="eyebrow">Daily Challenge</p><h2>🎯 Cabaran Hari Ini</h2><div className="challenge-list">{dailyChallenge.map(item => <span key={item.subjectId}>✅ {item.label}</span>)}</div><button disabled={dailyDone} onClick={onCompleteDaily}>{dailyDone ? '✅ Daily Challenge Selesai' : '🎁 Claim Bonus +50 XP +20 Coins'}</button></section>
    <section className="card"><p className="eyebrow">Pilih Subjek</p><h2>📚 Subjek Tahun 2</h2><div className="subject-grid">{subjectList.map(subject => <button key={subject.id} className={`subject-card ${selectedSubjectId === subject.id ? 'selected-subject' : ''}`} onClick={() => onSelectSubject(subject.id)}><span>{subject.icon}</span><b>{subject.title}</b><small>{subject.questionCount} soalan</small></button>)}</div></section>
    <section className="card stats-panel"><p className="eyebrow">Statistik {selectedSubject.short}</p><h2>📊 Ringkasan Kemajuan</h2><div className="insight-grid"><div className="insight"><b>{averageScore}%</b><span>Purata</span></div><div className="insight"><b>{completed}</b><span>Topik Siap</span></div><div className="insight"><b>{totalQuestions}</b><span>Soalan</span></div></div></section>
    <section className="card uasa-card"><p className="eyebrow">UASA Practice</p><h2>🏆 UASA Simulator {selectedSubject.short}</h2><p>Latihan campuran mengikut topik.</p><button onClick={onOpenUasa}>Mula UASA Simulator</button></section>
    <LearningPath profile={profile} subject={selectedSubject} totalQuestions={totalQuestions} completed={completed} resume={resume} onStartTopic={onStartTopic} onResume={onResume} onToggleFavourite={onToggleFavourite} />
  </section></main>;
}

function LearningPath({ profile, subject, totalQuestions, completed, resume, onStartTopic, onResume, onToggleFavourite }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const sections = buildLearningPathSections(subject.topics);
  const nextUnlockedIndex = subject.topics.findIndex((topic, index) => {
    const best = profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0;
    return isTopicUnlocked(profile, subject, index) && best < 80;
  });

  function toggleSection(sectionTitle) {
    setCollapsedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  }

  return <section className="card learning-path-card"><div className="path-card-head"><div><p className="eyebrow">Learning Path</p><h2>{subject.icon} {subject.title}</h2><p>{subject.topics.length} topik • {totalQuestions} soalan</p></div><span className="path-summary">{completed}/{subject.topics.length} siap</span></div><div className="learning-path">{sections.map(section => { const isCollapsed = collapsedSections[section.title]; return <section className="path-section" key={`${subject.id}-${section.title}`}><button type="button" className="path-section-toggle" onClick={() => toggleSection(section.title)} aria-expanded={!isCollapsed}><span>{section.title}</span><small>Topik {section.start + 1}-{section.start + section.topics.length}</small><b>{isCollapsed ? '+' : '-'}</b></button>{!isCollapsed && <div className="path-section-body">{section.topics.map((topic, topicOffset) => { const index = section.start + topicOffset; const best = profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0; const done = best >= 80; const needRevision = isWeakTopic(profile, subject, topic); const unlocked = isTopicUnlocked(profile, subject, index); const isNewUnlock = index === nextUnlockedIndex && unlocked && !done; const favId = `${subject.id}_${topic.id}`; const isFav = (profile.favourites || []).some(f => f.id === favId); const questionsCompleted = getTopicQuestionsCompleted(topic, best); const hasResume = resume?.subjectId === subject.id && resume?.topicId === topic.id; const inProgress = hasResume || (best > 0 && best < 80); const status = done ? 'Siap' : unlocked ? 'Unlocked' : 'Locked'; return <div className="path-row" key={topic.id}><article className={`path-node ${done ? 'path-done' : ''} ${unlocked && !done ? 'path-open' : ''} ${!unlocked ? 'path-locked' : ''} ${isNewUnlock ? 'path-new-unlock' : ''} ${needRevision ? 'path-revision' : ''}`}><button type="button" className={`fav-icon ${isFav ? 'active' : ''}`} onClick={() => onToggleFavourite(subject.id, topic.id, topic.title)} aria-label={isFav ? 'Remove favourite' : 'Add favourite'} aria-pressed={isFav}>{isFav ? '❤️' : '♡'}</button><button type="button" className="path-main" onClick={() => unlocked ? (hasResume ? onResume() : onStartTopic(topic)) : alert('Dapatkan 80% pada topik sebelumnya.')}><span className="path-icon">{unlocked ? (done ? '🏅' : index + 1) : '🔒'}</span><span className="path-copy"><b>{topic.title}</b>{needRevision && <em className="revision-badge">Need Revision</em>}<small>{best}% • {getStars(best)} • {questionsCompleted}/{topic.questions.length} soalan</small><span className="mini-progress"><span style={{ width: `${best}%` }} /></span></span></button><div className="path-actions"><span className={`path-status ${done ? 'done' : unlocked ? 'open' : 'locked'}`}>{status}</span>{unlocked && <button type="button" className="path-cta" onClick={() => hasResume ? onResume() : onStartTopic(topic)}>{needRevision ? 'Practice Again' : inProgress ? 'Continue' : done ? 'Ulang' : 'Mula'}</button>}</div></article>{index < subject.topics.length - 1 && <div className="path-line">↓</div>}</div> })}</div>}</section> })}<div className="path-trophy">🏆 Tamat {subject.short}</div></div></section>;
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

  return <main className="app parent-page"><div className="topbar"><button className="ghost" onClick={onBack}>← Dashboard</button><button onClick={printReport}>🖨️ Cetak / Save PDF</button></div><section className="card parent-hero"><div className="bot medium">👨‍👩‍👧</div><div><p className="eyebrow">Parent Dashboard Pro</p><h1>Laporan Pembelajaran {profile.name || 'Anak'}</h1><p>Ringkasan kemajuan, topik lemah, topik kuat dan cadangan AI offline.</p></div></section><section className="parent-summary-grid"><div className="parent-metric"><span>Minggu Ini</span><b>{weekly.average}%</b><small>{weekly.count} aktiviti</small></div><div className="parent-metric"><span>Bulan Ini</span><b>{monthly.average}%</b><small>{monthly.count} aktiviti</small></div><div className="parent-metric"><span>Mastery</span><b>{memory.mastery || 0}%</b><small>{strongTopics.length} topik kuat</small></div><div className="parent-metric"><span>Study Time</span><b>{formatStudyTime(memory.studyTime || 0)}</b><small>Direkod offline</small></div></section><section className="card parent-ai-card"><p className="eyebrow">AI Recommendation for Parent</p><h2>🤖 Cadangan Ibu Bapa</h2><p>{recommendation}</p><div className="recommend-meta"><span>XP {profile.xp || 0}</span><span>Coins {profile.coins || 0}</span><span>Streak {profile.streak || 0}</span></div></section><section className="card"><h2>📚 Kemajuan Mengikut Subjek</h2><div className="subject-report-grid">{subjectRows.map(row => <div className="report-box" key={row.id}><h3>{row.icon} {row.short}</h3><b>{row.average}%</b><div className="mini-progress"><div style={{ width: `${row.average}%` }} /></div><span>{row.completed}/{row.total} topik siap</span></div>)}</div></section><section className="parent-two-col"><section className="card"><h2>⚠️ Weak Topics</h2><div className="parent-topic-list">{weakTopics.length ? weakTopics.slice(0, 8).map(topic => <div className="parent-topic-item" key={`${topic.subjectId}-${topic.topicId}`}><b>{topic.title}</b><span>{topic.subject} • {topic.best}%</span></div>) : <p>Tiada topik lemah direkod.</p>}</div></section><section className="card"><h2>🌟 Strong Topics</h2><div className="parent-topic-list">{strongTopics.length ? strongTopics.slice(0, 8).map(topic => <div className="parent-topic-item strong" key={`${topic.subjectId}-${topic.topicId}`}><b>{topic.title}</b><span>{topic.subject} • {topic.best}%</span></div>) : <p>Belum ada topik kuat direkod.</p>}</div></section></section><section className="card"><h2>🏆 UASA History</h2><div className="timeline">{(profile.uasaHistory || []).length ? profile.uasaHistory.slice(0, 8).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{item.subjectShort || item.subjectId} - Gred {item.grade}</b><em>{item.score}% • {item.total} soalan</em></div>) : <p>Belum ada rekod UASA.</p>}</div></section><section className="card"><h2>📅 Aktiviti Terkini</h2><div className="timeline">{(profile.history || []).length === 0 ? <p>Belum ada aktiviti.</p> : profile.history.slice(0, 10).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{item.subject} - {item.topic}</b><em>{item.percent}% {item.stars}</em></div>)}</div></section></main>;
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

function ReadingCoach({ profile, onBack, onFinish }) {
  const [score] = useState(80);
  return <main className="app"><button className="ghost" onClick={onBack}>← Dashboard</button><section className="card"><h1>🎤 Reading Coach</h1><p>Mod bacaan asas dikekalkan.</p><button onClick={() => onFinish(score, '', '')}>Simpan Skor 80%</button></section></main>;
}

function Stat({ icon, label, value }) {
  return <div className="stat"><span className="stat-icon">{icon}</span><b>{value}</b><span>{label}</span></div>;
}
