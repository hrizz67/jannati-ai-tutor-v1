import React from 'react';
import { EmptyState, SettingsPanel, Stat, SubjectIllustration } from './dashboardHelpers.jsx';
import IconGlyph from '../components/IconGlyph.jsx';
import GameBadge from '../components/GameBadge.jsx';
import ResumePracticeCard from '../components/ResumePracticeCard.jsx';
import checkBadge from '../assets/icons/3d/check-badge.webp';
import giftBadge from '../assets/icons/3d/gift-badge.webp';
import GamificationSummary from '../components/GamificationSummary.jsx';
import MetricCard from '../components/MetricCard.jsx';
import { clampPercent, formatActivityStatus, formatDuration, formatDurationLabel, formatPriority, formatRecommendationCta, formatResumeTitle, formatScopeLabel, formatStatus, formatStreakLabel, formatSubjectName, formatTopicName } from '../utils/displayFormatter';
import { getCanonicalAnalytics } from '../utils/canonicalAnalytics.js';
import { createCanonicalGamification } from '../utils/canonicalGamification.js';
import { summarizeCommunicationHistory } from '../utils/communicationResult.js';
import { getCurriculumCoverageState } from '../curriculum/coverageEngine';

function CommunicationSummarySection({ eyebrow, title, summary, onStart, buttonLabel }) {
  return (
    <section className="card">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {summary.hasEvidence ? (
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(summary.averagePercent)}%`} label="Purata" />
          <MetricCard value={summary.completedItems} label="Sesi" />
          <MetricCard value={`${clampPercent(summary.latestPercent)}%`} label="Terkini" />
          <MetricCard value={summary.latestLanguage || '-'} label="Bahasa Terakhir" />
        </div>
      ) : (
        <div className="reading-result">
          <p>Belum ada sesi direkodkan.</p>
          <p className="memory-last">Lengkapkan sekurang-kurangnya satu latihan yang dinilai untuk melihat ringkasan.</p>
        </div>
      )}
      <button type="button" onClick={onStart}>{buttonLabel}</button>
    </section>
  );
}

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
  onImportLearningData,
  onRecoverLearningData,
  onSyncLearningData,
  onLoadLearningData,
  cloudSyncStatus,
  onToggleFavourite,
  resume = null,
  onResume,
  onRestartResume,
  dashboardCharacter,
  welcomeTopic,
  canonicalAnalytics: canonicalAnalyticsProp = null,
  canonicalGamification: canonicalGamificationProp = null,
  gamificationProfile = null
}) {
  const canonicalAnalytics = canonicalAnalyticsProp || getCanonicalAnalytics({ profile, adaptiveProfile, selectedSubject });
  const canonicalGamification = canonicalGamificationProp || createCanonicalGamification({
    profile,
    adaptiveProfile,
    gamificationProfile,
    subjectId: selectedSubjectId || selectedSubject?.id
  });
  const readingSummary = summarizeCommunicationHistory(readingHistory);
  const listeningSummary = summarizeCommunicationHistory(listeningHistory);
  const speakingSummary = summarizeCommunicationHistory(speakingHistory);
  const writingSummary = summarizeCommunicationHistory(writingHistory);
  const studyRecommendation = aiMemory.reason || smartLesson?.reason || 'Cadangan akan muncul apabila data mencukupi.';
  const learningTitle = learningJourney.todayLesson?.title || formatTopicName(smartTopic?.topicId || smartTopic?.id || smartTopic?.title) || 'Enjin Pembelajaran Adaptif';
  const coverageState = getCurriculumCoverageState(curriculumCoverage.summary);
  const analyticsRecommendationCta = formatRecommendationCta({
    subjectId: smartSubject?.id || selectedSubjectId,
    isCrossSubject: Boolean(smartSubject?.id && selectedSubjectId && smartSubject.id !== selectedSubjectId),
    reason: smartLesson?.reason,
    recommendationKey: smartLesson?.recommendationKey,
    defaultLabel: 'Mula Latihan'
  });
  const resumeTitle = resume ? formatResumeTitle(resume) : '';

  return (
    <>
      <section className="stats">
        {statsCards.map(item => <Stat key={item.label} icon={item.icon} label={item.label} value={item.value} />)}
      </section>

      <GamificationSummary
        profile={gamificationProfile}
        canonical={canonicalGamification}
        className="analytics-gamification-summary"
      />

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
        <p className="memory-last">{formatScopeLabel(canonicalAnalytics.scopeLabel)}</p>
        {canonicalAnalytics.hasEvidence ? (
          <div className="metric-grid">
            <MetricCard value={`${canonicalAnalytics.masteryPercent}%`} label="Skor Penguasaan" />
            <MetricCard value={canonicalAnalytics.masteredTopics.length} label="Dikuasai" />
            <MetricCard value={canonicalAnalytics.learningTopics.length} label="Sedang Belajar" />
            <MetricCard value={canonicalAnalytics.weakTopics.length} label="Perlu Latihan" />
          </div>
        ) : (
          <EmptyState
            title={canonicalAnalytics.noData?.title || 'Belum ada data pembelajaran'}
            message={canonicalAnalytics.noData?.message || 'Lengkapkan beberapa latihan untuk melihat penguasaan.'}
            actionLabel={canonicalAnalytics.noData?.actionLabel || 'Mulakan latihan'}
            onAction={() => onStartAdaptivePractice(adaptivePracticeCount)}
          />
        )}
      </section>

      <section className="card curriculum-coverage-card">
        <p className="eyebrow">Liputan Kurikulum</p>
        <h2>Analisis DSKP + UASA</h2>
        {coverageState.state === 'available' || coverageState.state === 'partial' ? (
          <>
            <div className="metric-grid">
              {coverageState.metrics.map(metric => (
                <MetricCard
                  key={metric.label}
                  value={metric.value}
                  label={metric.label}
                  subtitle={metric.subtitle || ''}
                />
              ))}
            </div>
            {coverageState.message ? <p className="memory-last">{coverageState.message}</p> : null}
            {missingSkSpRecommendation && coverageState.state === 'available' ? <p className="memory-last">{missingSkSpRecommendation.reason}</p> : null}
          </>
        ) : (
          <div className="curriculum-coverage-state" data-state={coverageState.state} role="status" aria-live="polite">
            <p>{coverageState.message}</p>
          </div>
        )}
      </section>

      <section className="card smart-lesson-card">
        <p className="eyebrow">Laluan Belajar Hari Ini</p>
        <h2>{learningTitle}</h2>
        <p>{learningJourney.reason || smartLesson?.reason || 'Teruskan dengan langkah yang seimbang.'}</p>
        <div className="metric-grid">
          <MetricCard value={learningJourney.todayLesson?.subject || formatSubjectName(smartSubject?.id)} label="Hari Ini" subtitle={formatStatus(learningJourney.todayLesson?.masteryStatus || 'ready')} />
          <MetricCard value={learningJourney.nextLesson?.title || 'Selepas dikuasai'} label="Seterusnya" subtitle={formatStatus(learningJourney.nextLesson?.masteryStatus || 'locked')} />
          <MetricCard value={learningJourney.recommendedReview?.title || 'Tiada ulang kaji'} label="Ulang Kaji" subtitle={formatStatus(learningJourney.recommendedReview?.masteryStatus || 'clear')} />
          <MetricCard value={formatPriority(smartLesson?.priority || 'normal')} label={`Keyakinan AI ${formatPriority(smartLesson?.priority || 'normal')}`} subtitle={studyRecommendation} />
        </div>
        <div className="recommend-meta">
          <span>{learningJourney.blockedTopics?.length || 0} topik terkunci</span>
          <span>{learningJourney.recommendedReview?.title || 'Ulang kaji stabil'}</span>
          <span>{smartTopic ? formatTopicName(smartTopic.topicId || smartTopic.id || smartTopic.title) : 'Semua topik selesai'}</span>
        </div>
        <button type="button" onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!learningJourney.todayLesson && !smartLesson?.nextQuestionId}>Mula Laluan</button>
      </section>

      <section className="card ai-recommend-card">
        <p className="eyebrow">Cadangan Guru AI</p>
        <h2>Cadangan Guru AI</h2>
        <p className="memory-last">{formatScopeLabel(canonicalAnalytics.scopeLabel)}</p>
        {canonicalAnalytics.hasEvidence ? (
          <>
            <div className="metric-grid">
              <MetricCard value={formatDurationLabel(adaptivePracticePreview?.summary?.estimatedMinutes || 0)} label="Cadangan Latihan" subtitle={studyRecommendation} />
              <MetricCard value={canonicalAnalytics.weakTopics.length} label="Topik Lemah" subtitle={canonicalAnalytics.weakTopics[0] ? formatTopicName(canonicalAnalytics.weakTopics[0].topicId) : 'Tiada data'} />
              <MetricCard value={canonicalAnalytics.strongTopics.length} label="Topik Kuat" subtitle={canonicalAnalytics.strongTopics[0] ? formatTopicName(canonicalAnalytics.strongTopics[0].topicId) : 'Tiada data'} />
              <MetricCard value={`${canonicalAnalytics.masteryPercent}%`} label="Penguasaan" subtitle={`Masa belajar ${formatDuration(canonicalAnalytics.studyMinutes, { unit: 'minutes' })}`} />
            </div>
            {aiMemory.lastLesson && <p className="memory-last">Latihan terakhir: <b>{aiMemory.lastLesson.title}</b> - {aiMemory.lastLesson.score}%</p>}
            <div className="recommend-meta">
              <span>{canonicalAnalytics.weakTopics.length} topik lemah</span>
              <span>{canonicalAnalytics.strongTopics.length} topik kuat</span>
              <span>Penguasaan {canonicalAnalytics.masteryPercent}%</span>
              <span>Masa belajar {formatDuration(canonicalAnalytics.studyMinutes, { unit: 'minutes' })}</span>
              <span>{formatStreakLabel(canonicalAnalytics.currentStreak)}</span>
            </div>
          </>
        ) : (
          <EmptyState
            title={canonicalAnalytics.noData?.title || 'Belum ada data pembelajaran'}
            message={canonicalAnalytics.noData?.message || 'Lengkapkan beberapa latihan untuk melihat cadangan AI.'}
            actionLabel={canonicalAnalytics.noData?.actionLabel || 'Mulakan latihan'}
            onAction={() => onStartAdaptivePractice(adaptivePracticeCount)}
          />
        )}
        <button type="button" onClick={() => smartTopic && onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!smartTopic && !learningJourney.todayLesson}>{analyticsRecommendationCta}</button>
      </section>

      <CommunicationSummarySection eyebrow="Kemajuan Bacaan" title="Jurulatih Bacaan" summary={readingSummary} onStart={onStartBacaan} buttonLabel="Mula Latihan Bacaan" />

      <details className="quick-prompts-analytics analytics-communication-options">
        <summary><span>Pilihan kemahiran komunikasi lain</span><small>Mendengar, bertutur dan menulis</small></summary>
        <div className="analytics-communication-options-body">
          <CommunicationSummarySection eyebrow="Kemajuan Mendengar" title="Makmal Mendengar" summary={listeningSummary} onStart={onStartMendengar} buttonLabel="Mula Latihan Mendengar" />
          <CommunicationSummarySection eyebrow="Kemajuan Bertutur" title="Jurulatih Bertutur" summary={speakingSummary} onStart={onStartBertutur} buttonLabel="Mula Latihan Bertutur" />
          <CommunicationSummarySection eyebrow="Kemajuan Menulis" title="Jurulatih Menulis" summary={writingSummary} onStart={onStartMenulis} buttonLabel="Mula Latihan Menulis" />
        </div>
      </details>

      <section className="card daily-card">
        <p className="eyebrow">Cabaran Harian</p>
        <h2>Cabaran Hari Ini</h2>
         <div className="challenge-list">{dailyChallenge.map(item => <span key={item.subjectId}><GameBadge className="daily-action-badge" src={checkBadge} /> <span>{item.label}</span></span>)}</div>
         <button type="button" disabled={dailyDone} onClick={onCompleteDaily}>{dailyDone ? <><GameBadge className="daily-action-badge" src={checkBadge} /> <span>Cabaran Harian Selesai</span></> : <><GameBadge className="daily-action-badge" src={giftBadge} /> <span>Tebus Bonus +50 XP +20 Syiling</span></>}</button>
      </section>

      <section className="card">
        <p className="eyebrow">Pilih Subjek</p>
        <h2><IconGlyph name="book" motion="hover" /> <span>Subjek Tahun 2</span></h2>
        <div className="subject-grid">{subjectList.map(subject => {
          const loadedSubject = allSubjects.find(item => item.id === subject.id);
          const progress = loadedSubject ? Math.round((loadedSubject.topics.filter(topic => (profile.progress?.[`${loadedSubject.id}_${topic.id}`]?.best || 0) >= 80).length / Math.max(1, loadedSubject.topics.length)) * 100) : 0;
          const completedTopics = loadedSubject ? loadedSubject.topics.filter(topic => (profile.progress?.[`${loadedSubject.id}_${topic.id}`]?.best || 0) >= 80).length : 0;
          return (
            <button type="button" key={subject.id} className={`subject-card ${selectedSubjectId === subject.id ? 'selected-subject' : ''} ${progress >= 80 ? 'subject-complete' : ''}`} onClick={() => onSelectSubject(subject.id)}>
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
        <h2><IconGlyph name="chart" motion="hover" /> <span>Ringkasan Kemajuan</span></h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(averageScore)}%`} label="Purata" />
          <MetricCard value={completed} label="Topik Siap" />
          <MetricCard value={totalQuestions} label="Soalan" />
          <MetricCard value={formatActivityStatus(averageScore)} label="Status" />
        </div>
      </section>

      <SettingsPanel onExportBetaReport={onExportBetaReport} onImportLearningData={onImportLearningData} onRecoverLearningData={onRecoverLearningData} onSyncLearningData={onSyncLearningData} onLoadLearningData={onLoadLearningData} cloudSyncStatus={cloudSyncStatus} onReset={onReset} />

      <section className="card uasa-card">
        <p className="eyebrow">Latihan UASA</p>
        <h2><IconGlyph name="trophy" motion="celebrate" /> <span>Simulator UASA {formatSubjectName(selectedSubject?.id)}</span></h2>
        <p>Latihan campuran mengikut topik.</p>
        <button type="button" onClick={onOpenUasa}>Mula Simulator UASA</button>
      </section>

      <ResumePracticeCard resume={resume} selectedSubjectId={selectedSubjectId} resumeTitle={resumeTitle} onResume={onResume} onRestartResume={onRestartResume} />
    </>
  );
}
