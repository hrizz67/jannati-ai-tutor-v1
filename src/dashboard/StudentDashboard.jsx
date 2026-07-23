import React from 'react';
import { EmptyState, getAdaptiveBestStreak, getAdaptiveMotivation } from './dashboardHelpers.jsx';
import { buildAdaptiveLearningSnapshot, explainWeakness } from '../ai/index.js';
import { clampPercent, formatDataConfidence, formatStatus, formatStudyMinutes, formatSubjectName, formatTopicName, getStudentDisplayName } from '../utils/displayFormatter';
import GamificationSummary from '../components/GamificationSummary.jsx';
import { SubjectIcon } from '../components/IconGlyph.jsx';

export default function StudentDashboard({
  profile = {},
  adaptiveProfile = {},
  adaptiveHasEvidence = false,
  overallAccuracy = 0,
  adaptivePracticeCount = 10,
  adaptivePracticePreview = null,
  studyPlan = null,
  adaptiveWeakTopics = [],
  adaptiveStrongTopics = [],
  adaptiveRecommendation = { subjectRows: [], summary: { weakTopics: 0, strongTopics: 0 }, plan: { totalQuestions: 0, estimatedMinutes: 0 } },
  adaptiveRecommendationFocus = null,
  streakBest,
  streakMessage,
  gamificationProfile = null,
  onStartAdaptivePractice
}) {
  const name = getStudentDisplayName(adaptiveProfile?.name ? adaptiveProfile : profile, 'Murid');
  const topWeak = adaptiveWeakTopics.slice(0, 5);
  const topStrong = adaptiveStrongTopics.slice(0, 5);
  const adaptiveSnapshot = React.useMemo(() => {
    const focus = adaptiveRecommendationFocus || topWeak[0] || null;
    if (!focus?.subjectId || !focus?.topicId) return null;
    return buildAdaptiveLearningSnapshot(adaptiveProfile || profile, focus.subjectId, focus.topicId);
  }, [adaptiveProfile, profile, adaptiveRecommendationFocus, topWeak]);
  const recommendationLead = studyPlan?.notes || adaptiveSnapshot?.reason || 'Ikuti latihan yang seimbang hari ini.';
  const recommendationFocusText = adaptiveRecommendationFocus
    ? `Fokus utama: ${formatSubjectName(adaptiveRecommendationFocus.subjectId)} — ${formatTopicName(adaptiveRecommendationFocus.topicId)}`
    : '';

  return (
    <>
      <section className="card adaptive-overview-card">
        <p className="eyebrow">Ringkasan Murid</p>
        <h2>Ringkasan Murid</h2>
        {adaptiveHasEvidence ? (
          <>
          <div className="mastery-summary-grid">
            <div><b>{name}</b><span>Nama Murid</span></div>
            <div><b>{adaptiveProfile.level || 1}</b><span>Tahap Semasa</span></div>
            <div><b>{adaptiveProfile.xp || 0}</b><span>XP Semasa</span></div>
            <div><b>{adaptiveProfile.streak || 0}</b><span>Streak Semasa</span></div>
          </div>
          {gamificationProfile && <GamificationSummary profile={gamificationProfile} className="student-gamification-summary" />}
          <div className="progress-wrap"><div className="progress" style={{ width: `${clampPercent(overallAccuracy)}%` }} /></div>
            <div className="mastery-summary-grid">
              <div><b>{adaptiveProfile.totalQuestions || 0}</b><span>Soalan</span></div>
              <div><b>{adaptiveProfile.correctQuestions || 0}</b><span>Betul</span></div>
              <div><b>{clampPercent(overallAccuracy)}%</b><span>Ketepatan</span></div>
              <div><b>{formatStudyMinutes(adaptiveProfile.studyMinutes || 0)}</b><span>Masa Belajar</span></div>
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
        <p className="eyebrow">Prestasi Subjek</p>
        <h2>Prestasi Subjek</h2>
        <div className="subject-report-grid">
          {(adaptiveRecommendation?.subjectRows || []).map(subject => (
            <div className="report-box" key={`student-${subject.id}`}>
              <h3><SubjectIcon subjectId={subject.id} motion="hover" /> {subject.title || formatSubjectName(subject.id)}</h3>
              <b>{clampPercent(subject.accuracy)}%</b>
              <div className="mini-progress"><div style={{ width: `${clampPercent(subject.accuracy)}%` }} /></div>
              <span>{subject.total} soalan dicuba</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Topik Perlu Diperbaiki</p>
        <h2>Topik Perlu Diperbaiki</h2>
        {topWeak.length ? (
          <div className="timeline">
            {topWeak.map(topic => {
              const explanation = explainWeakness(topic);
              return (
                <div className="timeline-item" key={`${topic.subjectId}-${topic.topicId}`}>
                  <span>{formatSubjectName(topic.subjectId)}</span>
                  <b>{formatTopicName(topic.topicId)}</b>
                  <em>{formatStatus(topic.status)} • Penguasaan {clampPercent(topic.mastery)}% • Keyakinan Data {formatDataConfidence(topic.confidence)}</em>
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
        <p className="eyebrow">Topik Dikuasai</p>
        <h2>Topik Dikuasai</h2>
        {topStrong.length ? (
          <div className="timeline">
            {topStrong.map(topic => (
              <div className="timeline-item" key={`${topic.subjectId}-${topic.topicId}`}>
                <span>{formatSubjectName(topic.subjectId)}</span>
                <b>{formatTopicName(topic.topicId)}</b>
                <em>Penguasaan {clampPercent(topic.mastery)}% • Keyakinan Data {formatDataConfidence(topic.confidence)}</em>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum cukup data." message="Topik dikuasai akan muncul selepas beberapa sesi." />
        )}
      </section>

      <section className="card adaptive-recommendation-card">
        <p className="eyebrow">Cadangan Hari Ini</p>
        <h2>Cadangan Hari Ini</h2>
        <p>
          {studyPlan
            ? `${recommendationLead}${recommendationFocusText ? ` ${recommendationFocusText}` : ''}`
            : adaptiveRecommendationFocus
              ? `Fokus utama: ${formatSubjectName(adaptiveRecommendationFocus.subjectId)} — ${formatTopicName(adaptiveRecommendationFocus.topicId)}`
              : 'Fokus utama belum tersedia.'}
        </p>
        <div className="mastery-summary-grid">
          <div><b>{studyPlan?.focusCount || adaptiveRecommendation?.plan?.totalQuestions || adaptivePracticePreview?.summary?.totalQuestions || adaptivePracticeCount}</b><span>Soalan</span></div>
          <div><b>{studyPlan?.estimatedMinutes || adaptiveRecommendation?.plan?.estimatedMinutes || adaptivePracticePreview?.summary?.estimatedMinutes || 0}</b><span>Masa</span></div>
          <div><b>{adaptiveRecommendation?.summary?.weakTopics || 0}</b><span>Topik Perlu Diperbaiki</span></div>
          <div><b>{adaptiveRecommendation?.summary?.strongTopics || 0}</b><span>Topik Dikuasai</span></div>
        </div>
        <button type="button" className="full" onClick={() => onStartAdaptivePractice(adaptivePracticeCount)}>
          Mula Latihan AI
        </button>
      </section>

      <section className="card">
        <p className="eyebrow">Streak Pembelajaran</p>
        <h2>Streak Pembelajaran</h2>
        <div className="mastery-summary-grid">
          <div><b>{adaptiveProfile.streak || 0}</b><span>Streak Semasa</span></div>
          <div><b>{streakBest || getAdaptiveBestStreak(adaptiveProfile)}</b><span>Streak Terbaik</span></div>
          <div><b>{adaptiveProfile.lastStudyDate || '-'}</b><span>Tarikh Belajar Terakhir</span></div>
          <div><b>{streakMessage || getAdaptiveMotivation(adaptiveProfile.streak || 0)}</b><span>Motivasi</span></div>
        </div>
      </section>
    </>
  );
}
