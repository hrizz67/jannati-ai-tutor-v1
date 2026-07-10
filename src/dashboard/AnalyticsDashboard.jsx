import React from 'react';
import { EmptyState, SettingsPanel, Stat, SubjectIllustration } from './dashboardHelpers.jsx';

export default function AnalyticsDashboard({
  profile,
  selectedSubject,
  selectedSubjectId,
  totalQuestions,
  subjectList,
  allSubjects,
  adaptiveProfile,
  studentCore,
  curriculumCoverage,
  missingSkSpRecommendation,
  masterySummary,
  smartLesson,
  learningJourney,
  smartSubject,
  smartTopic,
  aiMemory,
  averageScore,
  completed,
  readingHistory,
  listeningHistory,
  speakingHistory,
  writingHistory,
  statsCards,
  dailyChallenge,
  adaptivePracticePreview,
  adaptivePracticeCount,
  onAdaptivePracticeCountChange,
  onStartAdaptivePractice,
  onStartAdaptiveLesson,
  onStartBacaan,
  onStartMendengar,
  onStartBertutur,
  onStartMenulis,
  onCompleteDaily,
  onOpenUasa,
  onOpenParent,
  onOpenAi,
  onReset,
  onExportBetaReport,
  onToggleFavourite,
  resume,
  onResume,
  onRestartResume,
  dashboardCharacter,
  welcomeTopic
}) {
  const readingPurata = readingHistory.length ? Math.round(readingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / readingHistory.length) : 0;
  const listeningPurata = listeningHistory.length ? Math.round(listeningHistory.reduce((sum, item) => sum + (item.score || 0), 0) / listeningHistory.length) : 0;
  const speakingPurata = speakingHistory.length ? Math.round(speakingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / speakingHistory.length) : 0;
  const writingPurata = writingHistory.length ? Math.round(writingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / writingHistory.length) : 0;

  return <>
    <section className="stats">
      {statsCards.map(item => <div className="stat" key={item.label}><span className="stat-icon">{item.icon}</span><b>{item.value}</b><span>{item.label}</span></div>)}
    </section>

    <section className="card student-core-card">
      <p className="eyebrow">Student Intelligence Core</p>
      <h2>Ringkasan Profil Murid</h2>
      <div className="mastery-summary-grid">
        <div><b>{studentCore.completedTopics}</b><span>Topik Dikuasai</span></div>
        <div><b>{studentCore.attemptedTopics}</b><span>Topik Dicuba</span></div>
        <div><b>{studentCore.activity.totalSessions}</b><span>Sesi Tersimpan</span></div>
        <div><b>{studentCore.streakStatus}</b><span>Status Streak</span></div>
      </div>
      <p className="memory-last">XP ke tahap seterusnya: {studentCore.xpToNextLevel} • {studentCore.subjectCount} subjek dikesan • {studentCore.topicCompletionRate}% liputan topik</p>
    </section>

    <section className="card mastery-summary-card">
      <p className="eyebrow">Ringkasan Penguasaan</p>
      <h2>Penguasaan Topik</h2>
      <div className="mastery-summary-grid">
        <div><b>{masterySummary.masteryScore}%</b><span>Skor Penguasaan</span></div>
        <div><b>{masterySummary.dikuasai}</b><span>Dikuasai</span></div>
        <div><b>{masterySummary.learning}</b><span>Sedang Belajar</span></div>
        <div><b>{masterySummary.needsPractice}</b><span>Perlu Latihan</span></div>
      </div>
    </section>

    <section className="card curriculum-coverage-card">
      <p className="eyebrow">Liputan Kurikulum</p>
      <h2>Analisis DSKP + UASA</h2>
      <div className="mastery-summary-grid">
        <div><b>{curriculumCoverage.summary.coveragePercent}%</b><span>SK/SP Diliputi</span></div>
        <div><b>{curriculumCoverage.summary.masteryPercent}%</b><span>Penguasaan SK/SP</span></div>
        <div><b>{curriculumCoverage.summary.missing}</b><span>SK/SP Belum Cukup</span></div>
        <div><b>{curriculumCoverage.summary.estimatedMinutes}</b><span>Anggaran Minit</span></div>
      </div>
      {missingSkSpRecommendation && <p className="memory-last">{missingSkSpRecommendation.reason}</p>}
    </section>

    <section className="card smart-lesson-card">
      <p className="eyebrow">Laluan Belajar Hari Ini</p>
      <h2>{learningJourney.todayLesson?.title || smartTopic?.title || 'Enjin Pembelajaran Adaptif'}</h2>
      <p>{learningJourney.reason || smartLesson.reason}</p>
      <div className="journey-steps">
        <div><span>Hari Ini</span><b>{learningJourney.todayLesson?.subject || smartSubject?.short}</b><small>{learningJourney.todayLesson?.masteryStatus || 'READY'}</small></div>
        <div><span>Seterusnya</span><b>{learningJourney.nextLesson?.title || 'Selepas dikuasai'}</b><small>{learningJourney.nextLesson?.masteryStatus || 'LOCKED'}</small></div>
        <div><span>Ulang Kaji</span><b>{learningJourney.recommendedReview?.title || 'Tiada ulang kaji'}</b><small>{learningJourney.recommendedReview?.masteryStatus || 'CLEAR'}</small></div>
      </div>
      <div className="recommend-meta"><span>{learningJourney.blockedTopics.length} topik terkunci</span><span>AI: {smartLesson.priority}</span><span>{learningJourney.recommendedReview?.title || 'Ulang kaji stabil'}</span></div>
      <button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!learningJourney.todayLesson && !smartLesson.nextQuestionId}>Mula Laluan</button>
    </section>

    <section className="card ai-recommend-card">
      <p className="eyebrow">Cadangan Guru AI</p>
      <h2>Cadangan Guru AI</h2>
      <p>{aiMemory.reason}</p>
      {aiMemory.lastLesson && <p className="memory-last">Latihan terakhir: <b>{aiMemory.lastLesson.title}</b> • {aiMemory.lastLesson.score}%</p>}
      <div className="recommend-meta">
        <span>{aiMemory.weakTopics.length || 0} topik lemah</span>
        <span>{aiMemory.strongTopics.length} topik kuat</span>
        <span>Penguasaan {aiMemory.mastery}%</span>
        <span>Masa belajar {aiMemory.studyTime}</span>
        <span>Hari berturut {aiMemory.studyStreak}</span>
        <span>{smartTopic?.title || 'Semua topik selesai'}</span>
      </div>
      <button onClick={() => smartTopic && onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)}>Latih Semula</button>
    </section>

    <section className="card reading-progress-card">
      <p className="eyebrow">Kemajuan Bacaan</p>
      <h2>Jurulatih Bacaan</h2>
      <div className="mastery-summary-grid">
        <div><b>{readingPurata}%</b><span>Purata</span></div>
        <div><b>{readingHistory.length}</b><span>Sesi</span></div>
        <div><b>{readingHistory[0]?.score || 0}%</b><span>Terkini</span></div>
        <div><b>{readingHistory[0]?.language || '-'}</b><span>Bahasa Terakhir</span></div>
      </div>
      <button onClick={onStartBacaan}>Mula Latihan Bacaan</button>
    </section>

    <section className="card listening-progress-card">
      <p className="eyebrow">Kemajuan Mendengar</p>
      <h2>Makmal Mendengar</h2>
      <div className="mastery-summary-grid">
        <div><b>{listeningPurata}%</b><span>Purata</span></div>
        <div><b>{listeningHistory.length}</b><span>Sesi</span></div>
        <div><b>{listeningHistory[0]?.score || 0}%</b><span>Terkini</span></div>
        <div><b>{listeningHistory[0]?.language || '-'}</b><span>Bahasa Terakhir</span></div>
      </div>
      <button onClick={onStartMendengar}>Mula Latihan Mendengar</button>
    </section>

    <section className="card speaking-progress-card">
      <p className="eyebrow">Kemajuan Bertutur</p>
      <h2>Jurulatih Bertutur</h2>
      <div className="mastery-summary-grid">
        <div><b>{speakingPurata}%</b><span>Purata</span></div>
        <div><b>{speakingHistory.length}</b><span>Sesi</span></div>
        <div><b>{speakingHistory[0]?.score || 0}%</b><span>Terkini</span></div>
        <div><b>{speakingHistory[0]?.language || '-'}</b><span>Bahasa Terakhir</span></div>
      </div>
      <button onClick={onStartBertutur}>Mula Latihan Bertutur</button>
    </section>

    <section className="card writing-progress-card">
      <p className="eyebrow">Kemajuan Menulis</p>
      <h2>Jurulatih Menulis</h2>
      <div className="mastery-summary-grid">
        <div><b>{writingPurata}%</b><span>Purata</span></div>
        <div><b>{writingHistory.length}</b><span>Sesi</span></div>
        <div><b>{writingHistory[0]?.score || 0}%</b><span>Terkini</span></div>
        <div><b>{writingHistory[0]?.language || '-'}</b><span>Bahasa Terakhir</span></div>
      </div>
      <button onClick={onStartMenulis}>Mula Latihan Menulis</button>
    </section>

    <section className="card daily-card">
      <p className="eyebrow">Cabaran Harian</p>
      <h2>🎯 Cabaran Hari Ini</h2>
      <div className="challenge-list">{dailyChallenge.map(item => <span key={item.subjectId}>✅ {item.label}</span>)}</div>
      <button disabled={dailyDone} onClick={onCompleteDaily}>{dailyDone ? '✅ Cabaran Harian Selesai' : '🎁 Tebus Bonus +50 XP +20 Syiling'}</button>
    </section>

    <section className="card">
      <p className="eyebrow">Pilih Subjek</p>
      <h2>📚 Subjek Tahun 2</h2>
      <div className="subject-grid">{subjectList.map(subject => { const loadedSubject = allSubjects.find(item => item.id === subject.id); const progress = loadedSubject ? Math.round((loadedSubject.topics.filter(topic => (profile.progress?.[`${loadedSubject.id}_${topic.id}`]?.best || 0) >= 80).length / Math.max(1, loadedSubject.topics.length)) * 100) : 0; const completedTopics = loadedSubject ? loadedSubject.topics.filter(topic => (profile.progress?.[`${loadedSubject.id}_${topic.id}`]?.best || 0) >= 80).length : 0; return <button key={subject.id} className={`subject-card ${selectedSubjectId === subject.id ? 'selected-subject' : ''} ${progress >= 80 ? 'subject-complete' : ''}`} onClick={() => onOpenParent ? onOpenParent(subject.id) : null}><SubjectIllustration subject={subject} /><b>{subject.title}</b><small>{completedTopics}/{loadedSubject?.topics?.length || 0} topik siap</small><span className="subject-progress"><span style={{ width: `${progress}%` }} /></span><em>{progress}% penguasaan</em><strong>Mula</strong></button> })}</div>
    </section>

    <section className="card stats-panel">
      <p className="eyebrow">Statistik {selectedSubject.short}</p>
      <h2>📊 Ringkasan Kemajuan</h2>
      <div className="insight-grid"><div className="insight"><b>{averageScore}%</b><span>Purata</span></div><div className="insight"><b>{completed}</b><span>Topik Siap</span></div><div className="insight"><b>{totalQuestions}</b><span>Soalan</span></div></div>
    </section>

    <SettingsPanel onExportBetaReport={onExportBetaReport} onReset={onReset} />

    <section className="card uasa-card">
      <p className="eyebrow">Latihan UASA</p>
      <h2>🏆 Simulator UASA {selectedSubject.short}</h2>
      <p>Latihan campuran mengikut topik.</p>
      <button onClick={onOpenUasa}>Mula Simulator UASA</button>
    </section>

    <section className="card">
      <p className="eyebrow">Sambung Automatik</p>
      <h2>▶ Sambung Latihan</h2>
      <p>Subjek: <b>{resume?.subjectId || '-'}</b><br />Soalan: <b>{(resume?.questionIndex || 0) + 1}</b></p>
      <div className="actions"><button onClick={onResume}>▶ Sambung</button><button className="secondary" onClick={onRestartResume}>🔄 Mula Semula</button></div>
    </section>
  </>;
}
