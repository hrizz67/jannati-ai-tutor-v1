import React, { useEffect, useMemo, useState } from 'react';
import { subjects } from './data/subjects';
import { smartCheck } from './utils/smartCheck';
import { speakText, beep } from './utils/speech';

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
  favourites: []
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isTopicUnlocked(profile, subject, topicIndex) {
  if (topicIndex === 0) return true;
  const previousTopic = subject.topics[topicIndex - 1];
  const previousProgress = profile.progress?.[progressKey(subject.id, previousTopic.id)];
  return (previousProgress?.best || 0) >= 80;
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
  if (completed >= 5) badges.add('BM Champion');
  if (profile.daily?.[todayKey()]?.completed) badges.add('Daily Challenge');

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

function getSubjectAverage(profile, subject) {
  if (!subject?.topics?.length) return 0;
  const total = subject.topics.reduce((sum, topic) => {
    return sum + (profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0);
  }, 0);
  return Math.round(total / subject.topics.length);
}

function getAllTopicStats(profile) {
  const rows = [];
  subjects.forEach(subject => {
    subject.topics.forEach(topic => {
      const p = profile.progress?.[progressKey(subject.id, topic.id)] || {};
      rows.push({
        subjectId: subject.id,
        subject: subject.short,
        subjectTitle: subject.title,
        topicId: topic.id,
        topic: topic.title,
        best: p.best || 0,
        attempts: p.attempts || 0,
        lastDate: p.lastDate || '',
        questions: topic.questions.length,
        dskp: topic.questions?.[0]?.dskp || '-',
        uasa: topic.questions?.[0]?.uasa || '-'
      });
    });
  });
  return rows;
}

function printReport() {
  window.print();
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [resume, setResume] = useState(loadResume);
  const [screen, setScreen] = useState(profile.name ? 'dashboard' : 'login');
  const [selectedSubjectId, setSelectedSubjectId] = useState('bm');
  const [activeSubject, setActiveSubject] = useState(subjects[0]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [session, setSession] = useState({ correct: 0, almost: 0, wrong: 0, xp: 0, coins: 0, percent: 0, stars: '☆☆☆', answers: [] });

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const totalQuestions = useMemo(() => selectedSubject.topics.reduce((sum, topic) => sum + topic.questions.length, 0), [selectedSubjectId]);

  function startProfile(name, avatar) {
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

  function startResume() {
    if (!resume) return;
    const subject = subjects.find(s => s.id === resume.subjectId);
    const topic = subject?.topics.find(t => t.id === resume.topicId);
    if (!subject || !topic) return;
    startTopic(topic, subject, {
      questions: resume.questions,
      questionIndex: resume.questionIndex,
      session: resume.session
    });
  }

  function restartResume() {
    if (!resume) return;
    const subject = subjects.find(s => s.id === resume.subjectId);
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
        : [{
            id: bookmarkId,
            subjectId: activeSubject.id,
            subject: activeSubject.short,
            topicId: activeTopic.id,
            topic: activeTopic.title,
            questionId: question.id,
            question: question.q,
            answer: question.answer,
            date: todayKey()
          }, ...existing];

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
      xp = 10;
      coins = 5;
      nextSession.correct += 1;
      beep('good');
    } else if (result.status === 'almost') {
      xp = 5;
      coins = 2;
      nextSession.almost += 1;
      beep('mid');
    } else {
      nextSession.wrong += 1;
      beep('bad');
    }

    nextSession.xp += xp;
    nextSession.coins += coins;
    nextSession.answers.push({
      questionId: question.id,
      answer,
      status: result.status,
      correctAnswer: question.answer
    });

    setSession(nextSession);
    autoSave(questionIndex, nextSession);

    setFeedback({
      ...result,
      xp,
      coins,
      correctAnswer: question.answer,
      explanation: question.explanation || question.hint
    });
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
    autoSave(nextIndex, session);
  }

  function finishTopic() {
    const total = activeTopic.questions.length;
    const score = session.correct + session.almost * 0.5;
    const percent = Math.round((score / total) * 100);
    const stars = getStars(percent);
    const today = todayKey();
    const key = progressKey(activeSubject.id, activeTopic.id);
    const finalSession = { ...session, percent, stars };
    setSession(finalSession);

    setProfile(prev => {
      const badges = new Set(prev.badges || []);
      if (percent >= 80) badges.add(`${activeSubject.short}: ${activeTopic.title}`);
      if (percent >= 100) badges.add(`Skor Penuh: ${activeTopic.title}`);

      const oldProgress = prev.progress?.[key] || {};
      const historyItem = {
        date: today,
        subjectId: activeSubject.id,
        subject: activeSubject.short,
        topicId: activeTopic.id,
        topic: activeTopic.title,
        percent,
        stars
      };

      const updatedProfile = {
        ...prev,
        xp: (prev.xp || 0) + session.xp,
        coins: (prev.coins || 0) + session.coins,
        streak: prev.lastStudy === today ? prev.streak : (prev.streak || 0) + 1,
        lastStudy: today,
        badges: [...badges],
        history: [historyItem, ...(prev.history || [])].slice(0, 50),
        progress: {
          ...prev.progress,
          [key]: {
            subjectId: activeSubject.id,
            topicId: activeTopic.id,
            best: Math.max(oldProgress.best || 0, percent),
            last: percent,
            stars,
            attempts: (oldProgress.attempts || 0) + 1,
            lastDate: today
          }
        }
      };

      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });

    clearResume();
    setResume(null);
    setScreen('finish');
  }

  function completeDailyChallenge() {
    const today = todayKey();

    setProfile(prev => {
      if (prev.daily?.[today]?.completed) return prev;

      const updatedProfile = {
        ...prev,
        xp: (prev.xp || 0) + 50,
        coins: (prev.coins || 0) + 20,
        daily: {
          ...(prev.daily || {}),
          [today]: { completed: true, xp: 50, coins: 20 }
        }
      };

      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });
  }

  function finishReading(score, spoken, targetText) {
    const today = todayKey();

    setProfile(prev => {
      const badges = new Set(prev.badges || []);
      if (score >= 80) badges.add('Pembaca Hebat');

      const updatedProfile = {
        ...prev,
        xp: (prev.xp || 0) + Math.round(score / 2),
        coins: (prev.coins || 0) + Math.round(score / 10),
        streak: prev.lastStudy === today ? prev.streak : (prev.streak || 0) + 1,
        lastStudy: today,
        badges: [...badges],
        history: [{
          date: today,
          subject: 'Reading',
          topic: 'Reading Coach',
          percent: score,
          stars: getStars(score)
        }, ...(prev.history || [])].slice(0, 50)
      };

      return { ...updatedProfile, badges: autoBadges(updatedProfile) };
    });

    setScreen('dashboard');
  }

  if (screen === 'login') return <Login onStart={startProfile} />;

  if (screen === 'quiz') {
    const question = currentQuestion();
    const bookmarkId = question && activeSubject && activeTopic ? `${activeSubject.id}_${activeTopic.id}_${question.id}` : '';
    const isBookmarked = (profile.bookmarks || []).some(item => item.id === bookmarkId);

    return (
      <Quiz
        subject={activeSubject}
        topic={activeTopic}
        questionIndex={questionIndex}
        answer={answer}
        feedback={feedback}
        isBookmarked={isBookmarked}
        onAnswerChange={setAnswer}
        onCheckAnswer={checkAnswer}
        onNextQuestion={nextQuestion}
        onBack={() => setScreen('dashboard')}
        onHint={() => setFeedback({ status: 'hint', title: 'Hint', message: currentQuestion().hint })}
        onSpeak={() => speakText(currentQuestion().q.replaceAll('________', ' kosong '))}
        onBookmark={toggleBookmark}
      />
    );
  }

  if (screen === 'finish') return <Finish profile={profile} session={session} onDashboard={() => setScreen('dashboard')} />;

  if (screen === 'reading') return <ReadingCoach profile={profile} onBack={() => setScreen('dashboard')} onFinish={finishReading} />;

  if (screen === 'parent') return <ParentDashboard profile={profile} onBack={() => setScreen('dashboard')} />;

  return (
    <Dashboard
      profile={profile}
      subjects={subjects}
      selectedSubject={selectedSubject}
      selectedSubjectId={selectedSubjectId}
      totalQuestions={totalQuestions}
      resume={resume}
      dailyChallenge={buildDailyChallenge()}
      onSelectSubject={setSelectedSubjectId}
      onStartTopic={(topic) => startTopic(topic, selectedSubject)}
      onStartReading={() => setScreen('reading')}
      onOpenParent={() => setScreen('parent')}
      onReset={resetProfile}
      onResume={startResume}
      onRestartResume={restartResume}
      onCompleteDaily={completeDailyChallenge}
      onToggleFavourite={toggleFavourite}
    />
  );
}

function Login({ onStart }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const avatars = ['👦', '👧', '🧒', '👩‍🎓', '👨‍🎓'];

  return (
    <main className="app login">
      <section className="hero">
        <div className="bot">🤖</div>
        <h1>Jannati AI Tutor</h1>
        <p>Belajar Macam Bermain</p>
      </section>

      <section className="card">
        <label>Nama anak</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Fayyadh" />

        <label>Pilih avatar</label>
        <div className="avatar-row">
          {avatars.map(item => (
            <button key={item} className={`avatar-choice ${avatar === item ? 'selected' : ''}`} onClick={() => setAvatar(item)}>
              {item}
            </button>
          ))}
        </div>

        <button className="full" onClick={() => onStart(name, avatar)}>Mula Belajar</button>
      </section>
    </main>
  );
}

function Dashboard({
  profile,
  subjects,
  selectedSubject,
  selectedSubjectId,
  totalQuestions,
  resume,
  dailyChallenge,
  onSelectSubject,
  onStartTopic,
  onStartReading,
  onOpenParent,
  onReset,
  onResume,
  onRestartResume,
  onCompleteDaily,
  onToggleFavourite
}) {
  const topics = selectedSubject.topics;
  const level = Math.floor((profile.xp || 0) / 100) + 1;
  const levelProgress = (profile.xp || 0) % 100;
  const recommended = getRecommendedTopic(profile, selectedSubject);
  const today = todayKey();
  const dailyDone = profile.daily?.[today]?.completed;

  const completed = topics.filter(topic => {
    const progress = profile.progress?.[progressKey(selectedSubject.id, topic.id)];
    return (progress?.best || 0) >= 80;
  }).length;

  const averageScore = getSubjectAverage(profile, selectedSubject);
  const resumeSubject = resume ? subjects.find(s => s.id === resume.subjectId) : null;
  const resumeTopic = resumeSubject?.topics.find(t => t.id === resume?.topicId);

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="bot medium">🤖</div>
          <div><h2>Jannati</h2><p>AI Tutor V1.4 P3A</p></div>
        </div>

        <button className="nav active">🏠 Dashboard</button>
        <button className="nav">📚 Subjek</button>
        <button className="nav" onClick={onOpenParent}>👨‍👩‍👧 Parent</button>
        <button className="nav">🏅 Lencana</button>

        <div className="sidebar-note">
          <b>📊 Parent Dashboard</b>
          <p>Lihat topik kuat, lemah dan sejarah belajar.</p>
        </div>
      </aside>

      <section className="dashboard-main">
        <section className="profile hero-card">
          <div className="avatar-large">{profile.avatar || '👦'}</div>
          <div>
            <p className="eyebrow">Parent Analytics Edition</p>
            <h1>Assalamualaikum, {profile.name} 😊</h1>
            <p>AI cadangkan belajar <b>{recommended?.title}</b> hari ini.</p>
            <div className="level-line">
              <span>Level {level}</span>
              <div className="progress-wrap"><div className="progress" style={{ width: `${levelProgress}%` }} /></div>
              <span>{levelProgress}/100 XP</span>
            </div>
          </div>
          <button className="ghost" onClick={onReset}>Reset</button>
        </section>

        <section className="stats">
          <Stat label="XP" value={profile.xp || 0} icon="⭐" />
          <Stat label="Level" value={level} icon="🏆" />
          <Stat label="Coins" value={profile.coins || 0} icon="💰" />
          <Stat label="Streak" value={profile.streak || 0} icon="🔥" />
        </section>

        <section className="quick-actions">
          <button onClick={() => recommended && onStartTopic(recommended)}>▶ Sambung Belajar</button>
          <button className="secondary" onClick={onStartReading}>🎤 Reading Coach</button>
          <button className="secondary" onClick={onOpenParent}>👨‍👩‍👧 Parent Dashboard</button>
        </section>

        {resume && resumeTopic && (
          <section className="card resume-card">
            <p className="eyebrow">Auto Resume</p>
            <h2>▶ Sambung Latihan</h2>
            <p>
              {resumeSubject.icon} <b>{resumeSubject.title}</b><br />
              Topik: <b>{resumeTopic.title}</b><br />
              Soalan: <b>{Math.min(resume.questionIndex + 1, resume.questions.length)} / {resume.questions.length}</b>
            </p>
            <div className="actions">
              <button onClick={onResume}>▶ Sambung</button>
              <button className="secondary" onClick={onRestartResume}>🔄 Mula Semula</button>
            </div>
          </section>
        )}

        <section className="card daily-card">
          <p className="eyebrow">Daily Challenge</p>
          <h2>🎯 Cabaran Hari Ini</h2>
          <p>Lengkapkan misi harian untuk bonus XP dan Coins.</p>
          <div className="challenge-list">
            {dailyChallenge.map(item => <span key={item.subjectId}>✅ {item.label}</span>)}
          </div>
          <button disabled={dailyDone} onClick={onCompleteDaily}>
            {dailyDone ? '✅ Daily Challenge Selesai' : '🎁 Claim Bonus +50 XP +20 Coins'}
          </button>
        </section>

        <section className="card">
          <p className="eyebrow">Pilih Subjek</p>
          <h2>📚 Subjek Tahun 2</h2>
          <div className="subject-grid">
            {subjects.map(subject => (
              <button
                key={subject.id}
                className={`subject-card ${selectedSubjectId === subject.id ? 'selected-subject' : ''}`}
                onClick={() => onSelectSubject(subject.id)}
              >
                <span>{subject.icon}</span>
                <b>{subject.title}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="card stats-panel">
          <p className="eyebrow">Statistik {selectedSubject.short}</p>
          <h2>📊 Ringkasan Kemajuan</h2>
          <div className="insight-grid">
            <div className="insight"><b>{averageScore}%</b><span>Purata</span></div>
            <div className="insight"><b>{completed}</b><span>Topik Siap</span></div>
            <div className="insight"><b>{totalQuestions}</b><span>Soalan</span></div>
          </div>
        </section>

        <section className="card learning-path-card">
          <p className="eyebrow">Learning Path</p>
          <h2>{selectedSubject.icon} {selectedSubject.title}</h2>
          <p>{topics.length} topik • {totalQuestions} soalan</p>

          <div className="learning-path">
            {topics.map((topic, index) => {
              const progress = profile.progress?.[progressKey(selectedSubject.id, topic.id)];
              const best = progress?.best || 0;
              const unlocked = isTopicUnlocked(profile, selectedSubject, index);
              const stars = getStars(best);
              const favId = `${selectedSubject.id}_${topic.id}`;
              const isFav = (profile.favourites || []).some(f => f.id === favId);

              return (
                <div className="path-row" key={topic.id}>
                  <button
                    className={`path-node ${best >= 80 ? 'path-done' : ''} ${!unlocked ? 'path-locked' : ''}`}
                    onClick={() => unlocked ? onStartTopic(topic) : alert('Dapatkan 80% pada topik sebelumnya untuk buka topik ini.')}
                  >
                    <span className="path-icon">{unlocked ? (best >= 80 ? '🏅' : index + 1) : '🔒'}</span>
                    <div>
                      <b>{topic.title}</b>
                      <small>{topic.questions.length} soalan • {best}% • {stars}</small>
                      <div className="mini-progress"><div style={{ width: `${best}%` }} /></div>
                    </div>
                  </button>
                  <button className="fav-btn" onClick={() => onToggleFavourite(selectedSubject.id, topic.id, topic.title)}>
                    {isFav ? '❤️ Favourite' : '🤍 Favourite'}
                  </button>
                  {index < topics.length - 1 && <div className="path-line">↓</div>}
                </div>
              );
            })}
            <div className="path-trophy">🏆 Tamat {selectedSubject.short}</div>
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">History Belajar</p>
          <h2>📖 Aktiviti Terkini</h2>
          <div className="history-list">
            {(profile.history || []).length === 0
              ? <p>Belum ada rekod belajar.</p>
              : profile.history.slice(0, 6).map((item, index) => (
                <div className="history-item" key={index}>
                  <b>{item.subject} - {item.topic}</b>
                  <span>{item.percent}% {item.stars}</span>
                </div>
              ))}
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">Pencapaian</p>
          <h2>🏅 Lencana</h2>
          <div className="badges">
            {(profile.badges || []).length === 0
              ? <p>Belum ada lencana. Cuba siapkan satu topik.</p>
              : profile.badges.map(badge => <span key={badge} className="badge">🏅 {badge}</span>)}
          </div>
        </section>
      </section>
    </main>
  );
}

function ParentDashboard({ profile, onBack }) {
  const topicStats = getAllTopicStats(profile);
  const attempted = topicStats.filter(t => t.attempts > 0);
  const strong = attempted.filter(t => t.best >= 80).sort((a, b) => b.best - a.best).slice(0, 5);
  const weak = attempted.filter(t => t.best > 0 && t.best < 80).sort((a, b) => a.best - b.best).slice(0, 5);
  const totalCompleted = attempted.filter(t => t.best >= 80).length;
  const average = attempted.length ? Math.round(attempted.reduce((sum, t) => sum + t.best, 0) / attempted.length) : 0;

  const subjectRows = subjects.map(subject => ({
    id: subject.id,
    title: subject.title,
    short: subject.short,
    icon: subject.icon,
    average: getSubjectAverage(profile, subject),
    completed: subject.topics.filter(t => (profile.progress?.[progressKey(subject.id, t.id)]?.best || 0) >= 80).length,
    total: subject.topics.length
  }));

  return (
    <main className="app parent-page">
      <div className="topbar">
        <button className="ghost" onClick={onBack}>← Dashboard</button>
        <button onClick={printReport}>🖨️ Cetak / Save PDF</button>
      </div>

      <section className="card parent-hero">
        <div className="bot medium">👨‍👩‍👧</div>
        <div>
          <p className="eyebrow">Parent Dashboard</p>
          <h1>Laporan Pembelajaran {profile.name || 'Anak'}</h1>
          <p>Lihat kemajuan, topik kuat, topik lemah dan aktiviti terkini.</p>
        </div>
      </section>

      <section className="stats">
        <Stat label="Purata" value={`${average}%`} icon="📊" />
        <Stat label="Topik Siap" value={totalCompleted} icon="✅" />
        <Stat label="Bookmark" value={(profile.bookmarks || []).length} icon="🔖" />
        <Stat label="Favourite" value={(profile.favourites || []).length} icon="❤️" />
      </section>

      <section className="card">
        <p className="eyebrow">Ringkasan Subjek</p>
        <h2>📚 Kemajuan Mengikut Subjek</h2>
        <div className="subject-report-grid">
          {subjectRows.map(row => (
            <div className="report-box" key={row.id}>
              <h3>{row.icon} {row.short}</h3>
              <b>{row.average}%</b>
              <div className="mini-progress"><div style={{ width: `${row.average}%` }} /></div>
              <span>{row.completed}/{row.total} topik siap</span>
            </div>
          ))}
        </div>
      </section>

      <section className="parent-grid">
        <div className="card">
          <p className="eyebrow">Topik Kuat</p>
          <h2>✅ Dikuasai</h2>
          {strong.length === 0 ? <p>Belum ada topik melebihi 80%.</p> : strong.map(item => (
            <div className="report-row" key={`${item.subjectId}_${item.topicId}`}>
              <b>{item.subject} - {item.topic}</b>
              <span>{item.best}%</span>
            </div>
          ))}
        </div>

        <div className="card">
          <p className="eyebrow">Topik Lemah</p>
          <h2>🔁 Perlu Ulang</h2>
          {weak.length === 0 ? <p>Belum ada topik lemah direkodkan.</p> : weak.map(item => (
            <div className="report-row weak" key={`${item.subjectId}_${item.topicId}`}>
              <b>{item.subject} - {item.topic}</b>
              <span>{item.best}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Weekly Report</p>
        <h2>📅 Aktiviti Terkini</h2>
        <div className="timeline">
          {(profile.history || []).length === 0 ? <p>Belum ada aktiviti.</p> : profile.history.slice(0, 10).map((item, index) => (
            <div className="timeline-item" key={index}>
              <span>{item.date}</span>
              <b>{item.subject} - {item.topic}</b>
              <em>{item.percent}% {item.stars}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="parent-grid">
        <div className="card">
          <p className="eyebrow">Bookmark</p>
          <h2>🔖 Soalan Ditanda</h2>
          {(profile.bookmarks || []).length === 0 ? <p>Belum ada soalan bookmark.</p> : profile.bookmarks.slice(0, 8).map(item => (
            <div className="bookmark-item" key={item.id}>
              <b>{item.subject} - {item.topic}</b>
              <p>{item.question}</p>
              <small>Jawapan: {item.answer}</small>
            </div>
          ))}
        </div>

        <div className="card">
          <p className="eyebrow">Favourite</p>
          <h2>❤️ Topik Kegemaran</h2>
          {(profile.favourites || []).length === 0 ? <p>Belum ada topik favourite.</p> : profile.favourites.slice(0, 8).map(item => (
            <div className="report-row" key={item.id}>
              <b>{item.title}</b>
              <span>{item.date}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">DSKP / UASA</p>
        <h2>📌 Statistik Standard Pembelajaran</h2>
        <div className="table-like">
          <div className="table-head">
            <b>Subjek</b><b>Topik</b><b>DSKP</b><b>UASA</b><b>Markah</b>
          </div>
          {topicStats.slice(0, 16).map(item => (
            <div className="table-row" key={`${item.subjectId}_${item.topicId}`}>
              <span>{item.subject}</span>
              <span>{item.topic}</span>
              <span>{item.dskp}</span>
              <span>{item.uasa}</span>
              <span>{item.best}%</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Quiz({
  subject,
  topic,
  questionIndex,
  answer,
  feedback,
  isBookmarked,
  onAnswerChange,
  onCheckAnswer,
  onNextQuestion,
  onBack,
  onHint,
  onSpeak,
  onBookmark
}) {
  const question = topic.questions[questionIndex];
  const progress = Math.round(((questionIndex + 1) / topic.questions.length) * 100);

  return (
    <main className="app">
      <div className="topbar">
        <button className="ghost" onClick={onBack}>← Dashboard</button>
        <span className="pill">{subject.icon} {questionIndex + 1}/{topic.questions.length}</span>
      </div>

      <section className="card tutor-card">
        <div className="bot small">🤖</div>
        <div>
          <p className="eyebrow">{subject.title}</p>
          <h2>{topic.title}</h2>
          <p>{topic.note}</p>
        </div>
      </section>

      <section className="card">
        <div className="progress-wrap"><div className="progress" style={{ width: `${progress}%` }} /></div>
        <span className="pill">Soalan {questionIndex + 1}</span>
        <h1 className="question">{question.q}</h1>

        <input
          value={answer}
          onChange={e => onAnswerChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') feedback ? onNextQuestion() : onCheckAnswer();
          }}
          placeholder="Tulis jawapan di sini"
          autoFocus
        />

        <div className="actions">
          <button className="secondary" onClick={onSpeak}>🔊 Baca Soalan</button>
          <button className="secondary" onClick={onHint}>💡 Hint</button>
        </div>

        <div className="actions">
          <button className="secondary" onClick={onBookmark}>{isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark Soalan'}</button>
          <button className="full" onClick={onCheckAnswer}>Semak Jawapan</button>
        </div>

        <p className="autosave-note">💾 Auto Save aktif. Latihan boleh disambung kemudian.</p>
      </section>

      {feedback && (
        <section className={`feedback ${feedback.status}`}>
          <h2>{feedback.status === 'correct' ? '🟢' : feedback.status === 'almost' ? '🟡' : feedback.status === 'hint' ? '💡' : '🔴'} {feedback.title}</h2>
          <p>{feedback.message}</p>
          {feedback.correctAnswer && <p>Jawapan tepat: <b>{feedback.correctAnswer}</b></p>}
          {feedback.explanation && <div className="explain-box"><b>AI Tutor</b><p>{feedback.explanation}</p></div>}
          {(feedback.xp || feedback.coins) ? <p className="reward-line">⭐ +{feedback.xp} XP • 💰 +{feedback.coins} coins</p> : null}
          {feedback.status !== 'hint' && <button onClick={onNextQuestion}>Seterusnya</button>}
        </section>
      )}
    </main>
  );
}

function Finish({ profile, session, onDashboard }) {
  const level = Math.floor((profile.xp || 0) / 100) + 1;
  const passed = (session.percent || 0) >= 80;

  return (
    <main className="app reward-page">
      <section className="card finish reward-card">
        <div className="big bounce">{passed ? '🎉' : '💪'}</div>
        <p className="eyebrow">Topik Selesai</p>
        <h1>{passed ? 'Tahniah!' : 'Bagus mencuba!'}</h1>
        <p>{passed ? 'Topik seterusnya telah dibuka.' : 'Cuba ulang semula untuk capai 80% dan buka topik seterusnya.'}</p>

        <div className="result-score">
          <b>{session.percent || 0}%</b>
          <span>{session.stars || '☆☆☆'}</span>
        </div>

        <div className="reward-grid">
          <div className="reward-box"><span>⭐</span><b>+{session.xp}</b><small>XP</small></div>
          <div className="reward-box"><span>💰</span><b>+{session.coins}</b><small>Coins</small></div>
          <div className="reward-box"><span>🏆</span><b>{level}</b><small>Level</small></div>
        </div>

        <div className="explain-box">
          <b>🤖 AI Tutor</b>
          <p>{passed ? 'Hebat! Teruskan ke topik seterusnya dalam Learning Path.' : 'Jangan risau. Ulang sekali lagi dan cuba guna Hint apabila perlu.'}</p>
        </div>

        <button onClick={onDashboard}>Kembali ke Dashboard</button>
      </section>
    </main>
  );
}

function ReadingCoach({ profile, onBack, onFinish }) {
  const readingTexts = [
    'Ali bermain bola di padang.',
    'Ibu membeli sayur di pasar.',
    'Saya suka membaca buku cerita.',
    'Kucing putih tidur di bawah meja.',
    'Ayah memandu kereta ke pejabat.'
  ];

  const [textIndex, setTextIndex] = useState(0);
  const [spoken, setSpoken] = useState('');
  const [score, setScore] = useState(null);
  const [result, setResult] = useState([]);

  const targetText = readingTexts[textIndex];

  function clean(word) {
    return word.toLowerCase().replace(/[.,!?]/g, '').trim();
  }

  function compare(transcript) {
    const targetWords = targetText.split(' ').map(clean).filter(Boolean);
    const spokenWords = transcript.split(' ').map(clean).filter(Boolean);
    const compared = targetWords.map(word => ({ word, matched: spokenWords.includes(word) }));
    const matched = compared.filter(x => x.matched).length;
    setResult(compared);
    setScore(Math.round((matched / targetWords.length) * 100));
  }

  function speakSample() {
    speakText(targetText);
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser ini belum menyokong speech recognition. Cuba guna Chrome di laptop atau Android.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ms-MY';
    recognition.interimResults = false;

    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      setSpoken(transcript);
      compare(transcript);
    };

    recognition.start();
  }

  return (
    <main className="app">
      <div className="topbar">
        <button className="ghost" onClick={onBack}>← Dashboard</button>
        <span className="pill">Reading Coach</span>
      </div>

      <section className="card reading-hero">
        <div className="bot medium">🎤</div>
        <div>
          <p className="eyebrow">AI Reading Coach</p>
          <h1>Jom baca, {profile.name} 😊</h1>
          <p>Dengar contoh, kemudian baca ayat ini.</p>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Teks Bacaan</p>
        <h1 className="reading-text">{targetText}</h1>

        <div className="actions">
          <button className="secondary" onClick={speakSample}>🔊 Dengar Contoh</button>
          <button onClick={startListening}>🎤 Mula Baca</button>
        </div>
      </section>

      {spoken && (
        <section className="card feedback correct">
          <p className="eyebrow">Bacaan Dikesan</p>
          <h2>{spoken}</h2>
          <div className="result-score">
            <b>{score}%</b>
            <span>{getStars(score)}</span>
          </div>
          <div className="word-check">
            {result.map(item => <span key={item.word} className={item.matched ? 'word-good' : 'word-miss'}>{item.matched ? '🟢' : '🔴'} {item.word}</span>)}
          </div>
          <div className="explain-box">
            <b>🤖 AI Tutor</b>
            <p>{score >= 80 ? 'Bagus! Bacaan kamu jelas.' : 'Cuba ulang perkataan yang merah dengan lebih perlahan.'}</p>
          </div>
          <div className="actions">
            <button className="secondary" onClick={() => {
              setTextIndex((textIndex + 1) % readingTexts.length);
              setSpoken('');
              setScore(null);
              setResult([]);
            }}>Ayat Seterusnya</button>
            <button onClick={() => onFinish(score || 0, spoken, targetText)}>Simpan Skor</button>
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
