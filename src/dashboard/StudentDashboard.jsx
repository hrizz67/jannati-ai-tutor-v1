import React from 'react';
import { EmptyState, getAdaptiveBestStreak, getAdaptiveMotivation } from './dashboardHelpers.jsx';
import { buildAdaptiveLearningSnapshot, explainWeakness } from '../ai/index.js';
import { clampPercent, formatDataConfidence, formatDurationLabel, formatScopeLabel, formatStatus, formatStudyMinutes, formatStreakLabel, formatSubjectName, formatTopicName, getStudentDisplayName } from '../utils/displayFormatter';
import GamificationSummary from '../components/GamificationSummary.jsx';
import { MetricValue } from '../components/MetricCard.jsx';
import SubjectBadge from '../components/SubjectBadge.jsx';
import { getCanonicalAnalytics } from '../utils/canonicalAnalytics.js';
import { createCanonicalGamification } from '../utils/canonicalGamification.js';

export default function StudentDashboard({
  profile = {},
  adaptiveProfile = {},
  canonicalAnalytics = null,
  adaptiveHasEvidence = false,
  overallAccuracy = 0,
  adaptivePracticeCount = 10,
  adaptivePracticePreview = null,
  studyPlan = null,
  adaptiveWeakTopics = [],
  adaptiveStrongTopics = [],
  adaptiveRecommendation = { summary: { weakTopics: 0, strongTopics: 0 }, plan: { totalQuestions: 0, estimatedMinutes: 0 } },
  adaptiveRecommendationFocus = null,
  streakBest,
  streakMessage,
  gamificationProfile = null,
  canonicalGamification = null,
  onStartAdaptivePractice
}) {
  const analytics = canonicalAnalytics || getCanonicalAnalytics({ profile, adaptiveProfile });
  const gamification = canonicalGamification || createCanonicalGamification({ profile, adaptiveProfile, gamificationProfile });
  const name = getStudentDisplayName([profile, adaptiveProfile], 'Murid');
  const subjectRows = Array.isArray(analytics.subjectRows) ? analytics.subjectRows : [];
  const topWeak = analytics.hasEvidence ? analytics.weakTopics.slice(0, 5) : adaptiveWeakTopics.slice(0, 5);
  const topStrong = analytics.hasEvidence ? analytics.strongTopics.slice(0, 5) : adaptiveStrongTopics.slice(0, 5);
  const summaryAccuracy = clampPercent(analytics.accuracy ?? overallAccuracy);
  const summaryStreak = analytics.currentStreak ?? adaptiveProfile.streak ?? 0;
  const summaryBestStreak = analytics.bestStreak || streakBest || getAdaptiveBestStreak(adaptiveProfile);

  const adaptiveSnapshot = React.useMemo(() => {
    const focus = adaptiveRecommendationFocus || topWeak[0] || null;
    if (!focus?.subjectId || !focus?.topicId) return null;
    return buildAdaptiveLearningSnapshot(adaptiveProfile || profile, focus.subjectId, focus.topicId);
  }, [adaptiveProfile, profile, adaptiveRecommendationFocus, topWeak]);

  const recommendationLead = studyPlan?.notes || adaptiveSnapshot?.reason || 'Ikuti latihan yang seimbang hari ini.';
  const recommendationFocusText = adaptiveRecommendationFocus
    ? `Fokus utama: ${formatSubjectName(adaptiveRecommendationFocus.subjectId)} - ${formatTopicName(adaptiveRecommendationFocus.topicId)}`
    : '';

  return (
    <>
      <section className="card adaptive-overview-card">
        {(analytics.hasEvidence ?? adaptiveHasEvidence) ? (
          <>
            <p className="memory-last">{formatScopeLabel(analytics.scopeLabel)}</p>
            <div className="mastery-summary-grid">
              <div><MetricValue value={name}>{name}</MetricValue><span>Nama Murid</span></div>
              <div><MetricValue value={analytics.weakTopics.length} /><span>Topik Perlu Diperbaiki</span></div>
              <div><MetricValue value={analytics.strongTopics.length} /><span>Topik Dikuasai</span></div>
              <div><MetricValue value={formatStatus(analytics.status)} /><span>Status Semasa</span></div>
            </div>
            <GamificationSummary profile={gamificationProfile} canonical={gamification} className="student-gamification-summary" />
            <div className="progress-wrap" role="progressbar" aria-label="Ketepatan keseluruhan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summaryAccuracy}>
              <div className="progress" aria-hidden="true" style={{ width: `${summaryAccuracy}%` }} />
            </div>
            <div className="mastery-summary-grid">
              <div><MetricValue value={analytics.totalQuestions ?? adaptiveProfile.totalQuestions ?? 0} /><span>Soalan</span></div>
              <div><MetricValue value={analytics.correctQuestions ?? adaptiveProfile.correctQuestions ?? 0} /><span>Betul</span></div>
              <div><MetricValue value={`${summaryAccuracy}%`} /><span>Ketepatan</span></div>
              <div><MetricValue value={formatStudyMinutes(analytics.studyMinutes ?? adaptiveProfile.studyMinutes ?? 0)} /><span>Masa Belajar</span></div>
            </div>
          </>
        ) : (
          <EmptyState
            title="Belum ada rekod pembelajaran."
            message="Mulakan dengan Latihan AI untuk membina profil adaptif."
            actionLabel="Mula Latihan AI"
            onAction={() => onStartAdaptivePractice(adaptivePracticeCount)}
          />
        )}
      </section>

      <section className="card">
        <h2>Prestasi Subjek</h2>
        {subjectRows.length ? <div className="subject-report-grid">
          {subjectRows.map(subject => (
            <div className="report-box" key={`student-${subject.id}`}>
              <h3><SubjectBadge subjectId={subject.id} /> {subject.title || formatSubjectName(subject.id)}</h3>
              <b>{clampPercent(subject.accuracy)}%</b>
              <div className="mini-progress"><div style={{ width: `${clampPercent(subject.accuracy)}%` }} /></div>
              <span>{subject.total} soalan dicuba</span>
            </div>
          ))}
        </div> : <EmptyState title="Belum ada prestasi subjek." message="Lengkapkan latihan untuk melihat prestasi setiap subjek." />}
      </section>

      <section className="card">
        <h2>Topik Perlu Diperbaiki</h2>
        {topWeak.length ? (
          <div className="timeline">
            {topWeak.map(topic => {
              const explanation = explainWeakness(topic);
              return (
                <div className="timeline-item" key={`${topic.subjectId}-${topic.topicId}`}>
                  <span>{formatSubjectName(topic.subjectId)}</span>
                  <b>{formatTopicName(topic.topicId)}</b>
                  <em>{formatStatus(topic.status)} - Penguasaan {clampPercent(topic.mastery)}% - Keyakinan Data {formatDataConfidence(topic.confidence)}</em>
                  <p>{explanation.message}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Belum cukup data." message="Mula beberapa latihan untuk melihat topik yang perlu diperbaiki." />
        )}
      </section>

      <section className="card">
        <h2>Topik Dikuasai</h2>
        {topStrong.length ? (
          <div className="timeline">
            {topStrong.map(topic => (
              <div className="timeline-item" key={`${topic.subjectId}-${topic.topicId}`}>
                <span>{formatSubjectName(topic.subjectId)}</span>
                <b>{formatTopicName(topic.topicId)}</b>
                <em>Penguasaan {clampPercent(topic.mastery)}% - Keyakinan Data {formatDataConfidence(topic.confidence)}</em>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum cukup data." message="Topik dikuasai akan muncul selepas beberapa sesi." />
        )}
      </section>

      <section className="card adaptive-recommendation-card">
        <h2>Cadangan Hari Ini</h2>
        <p>
          {studyPlan
            ? `${recommendationLead}${recommendationFocusText ? ` ${recommendationFocusText}` : ''}`
            : adaptiveRecommendationFocus
              ? `Fokus utama: ${formatSubjectName(adaptiveRecommendationFocus.subjectId)} - ${formatTopicName(adaptiveRecommendationFocus.topicId)}`
              : 'Fokus utama belum tersedia.'}
        </p>
        <div className="mastery-summary-grid">
          <div><MetricValue value={studyPlan?.focusCount || adaptiveRecommendation?.plan?.totalQuestions || adaptivePracticePreview?.summary?.totalQuestions || adaptivePracticeCount} /><span>Soalan</span></div>
          <div><MetricValue value={formatDurationLabel(studyPlan?.estimatedMinutes || adaptiveRecommendation?.plan?.estimatedMinutes || adaptivePracticePreview?.summary?.estimatedMinutes || 0)} /><span>Masa</span></div>
          <div><MetricValue value={analytics.hasEvidence ? analytics.weakTopics.length : adaptiveRecommendation?.summary?.weakTopics || 0} /><span>Topik Perlu Diperbaiki</span></div>
          <div><MetricValue value={analytics.hasEvidence ? analytics.strongTopics.length : adaptiveRecommendation?.summary?.strongTopics || 0} /><span>Topik Dikuasai</span></div>
        </div>
        <button type="button" className="full" onClick={() => onStartAdaptivePractice(adaptivePracticeCount)}>
          Mula Latihan AI
        </button>
      </section>

      <section className="card streak-summary-card">
        <h2>Streak Pembelajaran</h2>
        <div className="mastery-summary-grid">
          <div><MetricValue value={formatStreakLabel(summaryStreak)} /><span>Streak Semasa</span></div>
          <div><MetricValue value={formatStreakLabel(summaryBestStreak)} /><span>Streak Terbaik</span></div>
          <div><MetricValue value={adaptiveProfile.lastStudyDate || '-'} /><span>Tarikh Belajar Terakhir</span></div>
          <div><MetricValue value={streakMessage || getAdaptiveMotivation(summaryStreak)} /><span>Motivasi</span></div>
        </div>
      </section>
    </>
  );
}
