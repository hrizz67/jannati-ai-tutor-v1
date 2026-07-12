import React from 'react';
import { EmptyState, SettingsPanel, Stat, SubjectIllustration } from './dashboardHelpers.jsx';
import { formatStudyTime } from '../ai/memoryEngine';
import MetricCard from '../components/MetricCard.jsx';
import { clampPercent, formatAttentionLevel, formatActivityStatus, formatPriority, formatStatus, formatSubjectName, formatTopicName } from '../utils/displayFormatter';

export default function AnalyticsDashboard({
  profile = {},
  selectedSubject = {},
  selectedSubjectId,
  totalQuestions = 0,
  subjectList = [],
  allSubjects = [],
  adaptiveProfile = {},
  studentCore = { activity: { totalSessions: 0 }, streakStatus: 'inactive', xpToNextLevel: 0, subjectCount: 0, topicCompletionRate: 0 },
  curriculumCoverage = { summary: { coveragePercent: 0, masteryPercent: 0, missing: 0, estimatedMinutes: 0 } },
  missingSkSpRecommendation = null,
  masterySummary = { masteryScore: 0, dikuasai: 0, learning: 0, needsPractice: 0 },
  smartLesson = null,
  learningJourney = { blockedTopics: [], recommendedReview: null, todayLesson: null, nextLesson: null },
  smartSubject = null,
  smartTopic = null,
  aiMemory = { weakTopics: [], strongTopics: [], mastery: 0, studyTime: 0, studyStreak: 0, readingHistory: [], listeningHistory: [], speakingHistory: [], writingHistory: [] },
  averageScore = 0,
  completed = 0,
  readingHistory = [],
  listeningHistory = [],
  speakingHistory = [],
  writingHistory = [],
  statsCards = [],
  dailyChallenge = [],
  dailyDone = false,
  adaptivePracticePreview = null,
  adaptivePracticeCount = 10,
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
  onSelectSubject,
  onOpenAi,
  onReset,
  onExportBetaReport,
  onToggleFavourite,
  resume = null,
  onResume,
  onRestartResume,
  dashboardCharacter,
  welcomeTopic
}) {
  const readingPurata = readingHistory.length ? Math.round(readingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / readingHistory.length) : 0;
  const listeningPurata = listeningHistory.length ? Math.round(listeningHistory.reduce((sum, item) => sum + (item.score || 0), 0) / listeningHistory.length) : 0;
  const speakingPurata = speakingHistory.length ? Math.round(speakingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / speakingHistory.length) : 0;
  const writingPurata = writingHistory.length ? Math.round(writingHistory.reduce((sum, item) => sum + (item.score || 0), 0) / writingHistory.length) : 0;
  const studyRecommendation = aiMemory.reason || smartLesson?.reason || 'Cadangan akan muncul apabila data mencukupi.';
  const learningTitle = learningJourney.todayLesson?.title || formatTopicName(smartTopic?.topicId || smartTopic?.id || smartTopic?.title) || 'Enjin Pembelajaran Adaptif';
  const readinessMessage = curriculumCoverage.summary.missing > 0
    ? 'Perlu lebih latihan sebelum ke tahap seterusnya.'
    : 'Sedia meneruskan pembelajaran.';

  return (
    <>
      <section className="stats">
        {statsCards.map(item => <Stat key={item.label} icon={item.icon} label={item.label} value={item.value} />)}
      </section>

      <section className="card student-core-card">
        <p className="eyebrow">Inteligens Murid</p>
        <h2>Ringkasan Profil Murid</h2>
        <div className="metric-grid">
          <MetricCard value={studentCore.completedTopics} label="Topik Dikuasai" />
          <MetricCard value={studentCore.attemptedTopics} label="Topik Dicuba" />
          <MetricCard value={studentCore.activity?.totalSessions || 0} label="Sesi Tersimpan" />
          <MetricCard value={formatStatus(studentCore.streakStatus)} label="Status Streak" />
        </div>
      </section>

      <section className="card mastery-summary-card">
        <p className="eyebrow">Ringkasan Penguasaan</p>
        <h2>Penguasaan Topik</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(masterySummary.masteryScore)}%`} label="Skor Penguasaan" />
          <MetricCard value={masterySummary.dikuasai} label="Dikuasai" />
          <MetricCard value={masterySummary.learning} label="Sedang Belajar" />
          <MetricCard value={masterySummary.needsPractice} label="Perlu Latihan" />
        </div>
      </section>

      <section className="card curriculum-coverage-card">
        <p className="eyebrow">Liputan Kurikulum</p>
        <h2>Analisis DSKP + UASA</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(curriculumCoverage.summary.coveragePercent)}%`} label="SK/SP Diliputi" />
          <MetricCard value={`${clampPercent(curriculumCoverage.summary.masteryPercent)}%`} label="Penguasaan SK/SP" />
          <MetricCard value={curriculumCoverage.summary.missing} label="SK/SP Belum Cukup" />
          <MetricCard value={curriculumCoverage.summary.estimatedMinutes} label="Anggaran Minit" />
        </div>
        {missingSkSpRecommendation && <p className="memory-last">{missingSkSpRecommendation.reason}</p>}
      </section>

      <section className="card smart-lesson-card">
        <p className="eyebrow">Laluan Belajar Hari Ini</p>
        <h2>{learningTitle}</h2>
        <p>{learningJourney.reason || smartLesson?.reason || 'Teruskan dengan langkah yang seimbang.'}</p>
        <div className="metric-grid">
          <MetricCard value={learningJourney.todayLesson?.subject || formatSubjectName(smartSubject?.id)} label="Hari Ini" subtitle={formatStatus(learningJourney.todayLesson?.masteryStatus || 'ready')} />
          <MetricCard value={learningJourney.nextLesson?.title || 'Selepas dikuasai'} label="Seterusnya" subtitle={formatStatus(learningJourney.nextLesson?.masteryStatus || 'locked')} />
          <MetricCard value={learningJourney.recommendedReview?.title || 'Tiada ulang kaji'} label="Ulang Kaji" subtitle={formatStatus(learningJourney.recommendedReview?.masteryStatus || 'clear')} />
          <MetricCard value={formatPriority(smartLesson?.priority || 'normal')} label="Keutamaan AI" subtitle={studyRecommendation} />
        </div>
        <div className="recommend-meta">
          <span>{learningJourney.blockedTopics?.length || 0} topik terkunci</span>
          <span>{learningJourney.recommendedReview?.title || 'Ulang kaji stabil'}</span>
          <span>{smartTopic ? formatTopicName(smartTopic.topicId || smartTopic.id || smartTopic.title) : 'Semua topik selesai'}</span>
        </div>
        <button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!learningJourney.todayLesson && !smartLesson?.nextQuestionId}>Mula Laluan</button>
      </section>

      <section className="card ai-recommend-card">
        <p className="eyebrow">Cadangan Guru AI</p>
        <h2>Cadangan Guru AI</h2>
        <div className="metric-grid">
          <MetricCard value={`${adaptivePracticePreview?.summary?.estimatedMinutes || 0} min`} label="Cadangan Latihan" subtitle={studyRecommendation} />
          <MetricCard value={aiMemory.weakTopics.length || 0} label="Topik Lemah" subtitle={aiMemory.weakTopics[0] ? formatTopicName(aiMemory.weakTopics[0].topicId) : 'Tiada'} />
          <MetricCard value={aiMemory.strongTopics.length || 0} label="Topik Kuat" subtitle={aiMemory.strongTopics[0] ? formatTopicName(aiMemory.strongTopics[0].topicId) : 'Tiada'} />
          <MetricCard value={`${clampPercent(aiMemory.mastery)}%`} label="Penguasaan" subtitle={`Masa belajar ${formatStudyTime(aiMemory.studyTime)}`} />
        </div>
        {aiMemory.lastLesson && <p className="memory-last">Latihan terakhir: <b>{aiMemory.lastLesson.title}</b> • {aiMemory.lastLesson.score}%</p>}
        <div className="recommend-meta">
          <span>{aiMemory.weakTopics.length || 0} topik lemah</span>
          <span>{aiMemory.strongTopics.length} topik kuat</span>
          <span>Penguasaan {clampPercent(aiMemory.mastery)}%</span>
          <span>Masa belajar {formatStudyTime(aiMemory.studyTime)}</span>
          <span>Hari berturut {aiMemory.studyStreak}</span>
          <span>{smartTopic ? formatTopicName(smartTopic.topicId || smartTopic.id || smartTopic.title) : 'Semua topik selesai'}</span>
        </div>
        <button onClick={() => smartTopic && onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!smartTopic && !learningJourney.todayLesson}>Latih Semula</button>
      </section>

      <section className="card reading-progress-card">
        <p className="eyebrow">Kemajuan Bacaan</p>
        <h2>Jurulatih Bacaan</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(readingPurata)}%`} label="Purata" />
          <MetricCard value={readingHistory.length} label="Sesi" />
          <MetricCard value={`${clampPercent(readingHistory[0]?.score || 0)}%`} label="Terkini" />
          <MetricCard value={readingHistory[0]?.language || '-'} label="Bahasa Terakhir" />
        </div>
        <button onClick={onStartBacaan}>Mula Latihan Bacaan</button>
      </section>

      <section className="card listening-progress-card">
        <p className="eyebrow">Kemajuan Mendengar</p>
        <h2>Makmal Mendengar</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(listeningPurata)}%`} label="Purata" />
          <MetricCard value={listeningHistory.length} label="Sesi" />
          <MetricCard value={`${clampPercent(listeningHistory[0]?.score || 0)}%`} label="Terkini" />
          <MetricCard value={listeningHistory[0]?.language || '-'} label="Bahasa Terakhir" />
        </div>
        <button onClick={onStartMendengar}>Mula Latihan Mendengar</button>
      </section>

      <section className="card speaking-progress-card">
        <p className="eyebrow">Kemajuan Bertutur</p>
        <h2>Jurulatih Bertutur</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(speakingPurata)}%`} label="Purata" />
          <MetricCard value={speakingHistory.length} label="Sesi" />
          <MetricCard value={`${clampPercent(speakingHistory[0]?.score || 0)}%`} label="Terkini" />
          <MetricCard value={speakingHistory[0]?.language || '-'} label="Bahasa Terakhir" />
        </div>
        <button onClick={onStartBertutur}>Mula Latihan Bertutur</button>
      </section>

      <section className="card writing-progress-card">
        <p className="eyebrow">Kemajuan Menulis</p>
        <h2>Jurulatih Menulis</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(writingPurata)}%`} label="Purata" />
          <MetricCard value={writingHistory.length} label="Sesi" />
          <MetricCard value={`${clampPercent(writingHistory[0]?.score || 0)}%`} label="Terkini" />
          <MetricCard value={writingHistory[0]?.language || '-'} label="Bahasa Terakhir" />
        </div>
        <button onClick={onStartMenulis}>Mula Latihan Menulis</button>
      </section>

      <section className="card daily-card">
        <p className="eyebrow">Cabaran Harian</p>
        <h2>Cabaran Hari Ini</h2>
        <div className="challenge-list">{dailyChallenge.map(item => <span key={item.subjectId}>✅ {item.label}</span>)}</div>
        <button disabled={dailyDone} onClick={onCompleteDaily}>{dailyDone ? '✅ Cabaran Harian Selesai' : '🎁 Tebus Bonus +50 XP +20 Syiling'}</button>
      </section>

      <section className="card">
        <p className="eyebrow">Pilih Subjek</p>
        <h2>📚 Subjek Tahun 2</h2>
        <div className="subject-grid">{subjectList.map(subject => {
          const loadedSubject = allSubjects.find(item => item.id === subject.id);
          const progress = loadedSubject ? Math.round((loadedSubject.topics.filter(topic => (profile.progress?.[`${loadedSubject.id}_${topic.id}`]?.best || 0) >= 80).length / Math.max(1, loadedSubject.topics.length)) * 100) : 0;
          const completedTopics = loadedSubject ? loadedSubject.topics.filter(topic => (profile.progress?.[`${loadedSubject.id}_${topic.id}`]?.best || 0) >= 80).length : 0;
          return (
            <button key={subject.id} className={`subject-card ${selectedSubjectId === subject.id ? 'selected-subject' : ''} ${progress >= 80 ? 'subject-complete' : ''}`} onClick={() => onSelectSubject(subject.id)}>
              <SubjectIllustration subject={subject} />
              <b>{subject.title || formatSubjectName(subject.id)}</b>
              <small>{completedTopics}/{loadedSubject?.topics?.length || 0} topik siap</small>
              <span className="subject-progress"><span style={{ width: `${clampPercent(progress)}%` }} /></span>
              <em>{clampPercent(progress)}% penguasaan</em>
              <strong>Mula</strong>
            </button>
          );
        })}</div>
      </section>

      <section className="card stats-panel">
        <p className="eyebrow">Statistik {formatSubjectName(selectedSubject?.id)}</p>
        <h2>📊 Ringkasan Kemajuan</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(averageScore)}%`} label="Purata" />
          <MetricCard value={completed} label="Topik Siap" />
          <MetricCard value={totalQuestions} label="Soalan" />
          <MetricCard value={formatActivityStatus(averageScore)} label="Status" />
        </div>
      </section>

      <SettingsPanel onExportBetaReport={onExportBetaReport} onReset={onReset} />

      <section className="card uasa-card">
        <p className="eyebrow">Latihan UASA</p>
        <h2>🏆 Simulator UASA {formatSubjectName(selectedSubject?.id)}</h2>
        <p>Latihan campuran mengikut topik.</p>
        <button onClick={onOpenUasa}>Mula Simulator UASA</button>
      </section>

      <section className="card">
        <p className="eyebrow">Sambung Automatik</p>
        <h2>▶ Sambung Latihan</h2>
        <p>Subjek: <b>{resume?.subjectId ? formatSubjectName(resume.subjectId) : '-'}</b><br />Soalan: <b>{(resume?.questionIndex || 0) + 1}</b></p>
        <div className="actions"><button onClick={onResume}>▶ Sambung</button><button className="secondary" onClick={onRestartResume}>🔄 Mula Semula</button></div>
      </section>
    </>
  );
}
