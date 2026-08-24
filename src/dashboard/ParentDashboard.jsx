import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from './dashboardHelpers.jsx';
import {
  buildParentSummary,
  buildRecommendationSummary,
  buildRevisionSummary,
  createMockParentProfile,
  readSubjectInsight,
  resolveParentProfile
} from '../parentInsights/index.js';
import { printParentReport } from '../utils/printReport';
import {
  clampPercent,
  formatActivityStatus,
  formatModeLabel,
  formatRecommendationKey,
  formatReviewQueueMeta,
  formatScopeLabel,
  formatStatus,
  formatStudyMinutes,
  formatStreakLabel,
  formatSubjectName,
  formatTopicName,
  formatFriendlyDate
} from '../utils/displayFormatter';
import MetricCard from '../components/MetricCard.jsx';
import IconGlyph from '../components/IconGlyph.jsx';
import GamificationSummary from '../components/GamificationSummary.jsx';
import StudyPlannerPanel from '../components/studyPlanner/StudyPlannerPanel.jsx';
import { createStudyPlannerPayload } from '../studyPlanner/index.js';
import { subjectList as registrySubjectList } from '../data/subjects/index.js';
import { getStudentDisplayName } from '../utils/displayFormatter';
import { createCanonicalProgress, toParentProgressProfile } from '../utils/canonicalProgress.js';
import { getCanonicalAnalytics } from '../utils/canonicalAnalytics.js';
import { createCanonicalGamification } from '../utils/canonicalGamification.js';

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safePercent(value) {
  return clampPercent(Math.max(0, Math.min(100, safeNumber(value, 0))));
}

function safeText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function buildMockGuardProfile(profile, allowMock) {
  const safeProfile = profile && typeof profile === 'object' ? profile : null;
  if (safeProfile) return safeProfile;
  return allowMock ? createMockParentProfile() : null;
}

function resolveInitialSubjectId(profile = null, subjects = []) {
  if (profile && typeof profile === 'object') {
    for (const subject of subjects) {
      const topicMap = profile?.subjects?.[subject.id]?.topics;
      if (topicMap && typeof topicMap === 'object' && Object.keys(topicMap).length > 0) {
        return subject.id;
      }
      const legacyTopics = profile?.topics?.[subject.id];
      if (legacyTopics && typeof legacyTopics === 'object' && Object.keys(legacyTopics).length > 0) {
        return subject.id;
      }
    }
  }
  return subjects[0]?.id || 'bm';
}

function buildRecommendationKey(analytics) {
  if (!analytics?.hasEvidence) return null;
  if (analytics.masteryPercent < 60) return 'review';
  if (analytics.masteryPercent >= 85) return 'increase_difficulty';
  return 'normal_practice';
}

function buildSubjectTimelineCopy(subjectAnalytics) {
  if (!subjectAnalytics?.hasEvidence) {
    return {
      headline: 'Belum ada penguasaan',
      meta: 'Tiada data tersedia',
      body: 'Murid belum mempunyai rekod untuk subjek ini.'
    };
  }

  return {
    headline: `${safePercent(subjectAnalytics.masteryPercent)}% penguasaan`,
    meta: `${subjectAnalytics.totalQuestions} soalan - ${safePercent(subjectAnalytics.accuracy)}% ketepatan`,
    body: `Topik tersedia: ${subjectAnalytics.availableTopics.length}`
  };
}

export default function ParentDashboard({
  profile,
  adaptiveProfile,
  canonicalProgress = null,
  aiMemory = null,
  learningObservation = null,
  predictionProfile = null,
  narrativeBundle = null,
  gamificationProfile = null,
  allSubjects,
  adaptivePracticeCount,
  readiness,
  onStartAdaptivePractice,
  onBack
}) {
  const allowMock = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

  const progress = useMemo(() => canonicalProgress || createCanonicalProgress({
    ...(profile || {}),
    ...(adaptiveProfile || {}),
    history: profile?.history || adaptiveProfile?.events || [],
    subjects: adaptiveProfile?.subjects || profile?.subjects,
    topics: adaptiveProfile?.topics || profile?.topics
  }), [canonicalProgress, profile, adaptiveProfile]);

  const canonicalAnalytics = useMemo(() => getCanonicalAnalytics({ canonicalProgress: progress }), [progress]);
  const canonicalGamification = useMemo(() => createCanonicalGamification({
    profile,
    adaptiveProfile,
    gamificationProfile,
    canonicalProgress: progress
  }), [profile, adaptiveProfile, gamificationProfile, progress]);
  const sourceProfile = useMemo(() => buildMockGuardProfile(toParentProgressProfile(progress, profile), allowMock), [progress, profile, allowMock]);
  const insightsProfile = useMemo(() => resolveParentProfile(sourceProfile, { allowMock }), [sourceProfile, allowMock]);
  const summary = useMemo(() => buildParentSummary(insightsProfile), [insightsProfile]);
  const recommendationSummary = useMemo(() => buildRecommendationSummary(insightsProfile), [insightsProfile]);
  const revisionSummary = useMemo(() => buildRevisionSummary(insightsProfile), [insightsProfile]);
  const subjectCatalog = useMemo(() => (Array.isArray(allSubjects) && allSubjects.length ? allSubjects : registrySubjectList), [allSubjects]);
  const studentName = getStudentDisplayName([sourceProfile, insightsProfile], 'Murid');

  const studyPlannerPayload = useMemo(() => {
    try {
      return createStudyPlannerPayload(insightsProfile, {
        availableStudyMinutes: canonicalAnalytics.studyMinutes || summary.studyTime || 20,
        date: new Date()
      });
    } catch (error) {
      return {
        plannerVersion: 1,
        generatedAt: new Date().toISOString(),
        onboarding: false,
        availableStudyMinutes: 0,
        parentSummary: summary,
        dailyPlan: { onboarding: false, availableMinutes: 0, blocks: [] },
        weeklyPlan: { startDate: new Date().toISOString(), days: [] },
        parentSummaryText: 'Pelan belajar tidak dapat dijana.',
        recentActivity: [],
        signals: { candidateCount: 0, focusCount: 0, overdueCount: 0 },
        error: {
          code: 'study_planner_unavailable',
          message: safeText(error?.message, 'Pelan belajar tidak dapat dijana.')
        }
      };
    }
  }, [insightsProfile, canonicalAnalytics.studyMinutes, summary]);

  const initialSelectedSubjectId = useMemo(
    () => resolveInitialSubjectId(insightsProfile || sourceProfile, subjectCatalog),
    [insightsProfile, sourceProfile, subjectCatalog]
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSelectedSubjectId);

  const subjectInsights = useMemo(() => subjectCatalog.map(subject => {
    const insight = readSubjectInsight(insightsProfile, subject.id, { allowMock });
    const subjectAnalytics = getCanonicalAnalytics({
      canonicalProgress: progress,
      subjectId: subject.id,
      selectedSubject: subject
    });
    return {
      ...subject,
      label: subject.title || formatSubjectName(subject.id),
      insight,
      analytics: subjectAnalytics,
      topics: subjectAnalytics.availableTopics,
      mastery: subjectAnalytics.masteryPercent,
      accuracy: subjectAnalytics.accuracy,
      attempts: subjectAnalytics.totalQuestions,
      hasData: subjectAnalytics.hasEvidence
    };
  }), [insightsProfile, allowMock, subjectCatalog, progress]);

  const selectedSubject = subjectInsights.find(subject => subject.id === selectedSubjectId)
    || subjectInsights[0]
    || null;

  useEffect(() => {
    if (!subjectInsights.length) return;
    const selectedHasData = subjectInsights.some(subject => subject.id === selectedSubjectId && subject.hasData);
    if (!selectedHasData) {
      const firstWithData = subjectInsights.find(subject => subject.hasData);
      if (firstWithData && firstWithData.id !== selectedSubjectId) {
        setSelectedSubjectId(firstWithData.id);
      }
    }
  }, [subjectInsights, selectedSubjectId]);

  const strongestSubject = [...subjectInsights].filter(subject => subject.hasData).sort((left, right) => right.mastery - left.mastery)[0] || null;
  const weakestSubject = [...subjectInsights].filter(subject => subject.hasData).sort((left, right) => left.mastery - right.mastery)[0] || null;
  const focusTopics = canonicalAnalytics.weakTopics.slice(0, 4);
  const selectedRecommendationKey = buildRecommendationKey(selectedSubject?.analytics);
  const overallRecommendationKey = buildRecommendationKey(canonicalAnalytics);
  const aiRecommendationText = overallRecommendationKey
    ? formatRecommendationKey(overallRecommendationKey)
    : 'Belum ada cadangan';

  const overdueReviews = Array.isArray(revisionSummary.overdueReviews) ? [...revisionSummary.overdueReviews] : [];
  const upcomingReviews = Array.isArray(revisionSummary.upcomingReviewSchedule) ? [...revisionSummary.upcomingReviewSchedule] : [];
  const revisionItems = [...overdueReviews, ...upcomingReviews].sort((left, right) => {
    if (left.isOverdue !== right.isOverdue) return left.isOverdue ? -1 : 1;
    if (left.isOverdue && right.isOverdue) return (right.overdueDays || 0) - (left.overdueDays || 0);
    if ((left.dueInDays || 0) !== (right.dueInDays || 0)) return (left.dueInDays || 0) - (right.dueInDays || 0);
    return String(left.subjectId || '').localeCompare(String(right.subjectId || ''));
  });

  const reportHasData = canonicalAnalytics.hasEvidence || subjectInsights.some(subject => subject.hasData);
  const statusBadge = canonicalAnalytics.status === 'Dikuasai'
    ? { icon: 'medal', label: 'Cemerlang' }
    : canonicalAnalytics.status === 'Berkembang Baik' || canonicalAnalytics.status === 'Hampir Menguasai'
      ? { icon: 'check', label: 'Baik' }
      : { icon: 'book', label: 'Perlu Ditingkatkan' };

  const selectedTimeline = buildSubjectTimelineCopy(selectedSubject?.analytics);

  return (
    <main className="app parent-page">
      <div className="topbar">
        <button type="button" className="ghost" onClick={onBack}>Papan Utama</button>
        <span className="pill">Laporan Ibu Bapa</span>
      </div>

      <section className="card">
        <h2>Ringkasan Prestasi Anak</h2>
        {reportHasData && (weakestSubject || strongestSubject || focusTopics.length || overallRecommendationKey) ? (
          <>
            <p className="memory-last">{formatScopeLabel(canonicalAnalytics.scopeLabel)}</p>
            <div className="metric-grid parent-primary-metrics">
              <MetricCard value={safeText(summary.name || studentName, 'Murid')} label="Nama Murid" />
              <MetricCard value={formatStatus(readiness?.level || 'needs_support')} label="Tahap" subtitle={safeText(readiness?.message, 'Masih memerlukan sokongan.')} />
              <MetricCard value={`${safePercent(canonicalAnalytics.accuracy)}%`} label="Ketepatan" />
              <MetricCard value={`${safePercent(canonicalAnalytics.masteryPercent)}%`} label="Penguasaan" />
              <MetricCard value={formatStudyMinutes(canonicalAnalytics.studyMinutes || 0)} label="Masa Belajar" />
              <MetricCard value={formatStreakLabel(canonicalAnalytics.currentStreak)} label="Streak Semasa" />
            </div>
            <div className="status-badge-row">
              <span className="badge"><IconGlyph name={statusBadge.icon} size={16} aria-hidden="true" /> {statusBadge.label}</span>
              <span className="badge">Data tersedia untuk analisis.</span>
            </div>
            <details className="parent-secondary-disclosure">
              <summary><span>Butiran kemajuan tambahan</span><small>Aktiviti, streak terbaik dan ganjaran</small></summary>
              <div className="metric-grid parent-secondary-metrics">
                <MetricCard value={canonicalAnalytics.totalQuestions} label="Soalan Dijawab" />
                <MetricCard value={canonicalAnalytics.correctQuestions} label="Jawapan Betul" />
                <MetricCard value={formatStreakLabel(canonicalAnalytics.bestStreak)} label="Streak Terpanjang" />
                <MetricCard value={safeNumber(adaptivePracticeCount, 0)} label="Latihan Adaptif" />
              </div>
              <GamificationSummary
                profile={gamificationProfile}
                canonical={canonicalGamification}
                className="parent-gamification-summary"
              />
            </details>
          </>
        ) : (
          <EmptyState
            title="Belum ada penguasaan subjek"
            message={allowMock
              ? 'Mod pembangunan menggunakan data mock apabila profil sebenar belum tersedia.'
              : 'Profil murid belum mempunyai data penguasaan. Selesaikan beberapa latihan dahulu.'}
            showMascot={false}
          />
        )}
      </section>

      <section className="card">
        <h2>Subjek dan Penguasaan</h2>
        {subjectInsights.some(subject => subject.hasData) ? (
          <>
            <div className="metric-grid">
              {subjectInsights.map(subject => (
                <MetricCard
                  key={subject.id}
                  value={subject.hasData ? `${safePercent(subject.mastery)}%` : 'Belum tersedia'}
                  label={subject.label}
                  subtitle={subject.hasData ? `${subject.attempts} soalan` : 'Belum ada penguasaan'}
                />
              ))}
            </div>
            <div className="subject-report-grid">
              {subjectInsights.map(subject => (
                <button
                  type="button"
                  key={subject.id}
                  className={`report-box ${selectedSubjectId === subject.id ? 'selected-subject' : ''}`}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  aria-pressed={selectedSubjectId === subject.id}
                >
                  <h3>{subject.label}</h3>
                  {subject.hasData ? (
                    <b>{safePercent(subject.mastery)}%</b>
                  ) : (
                    <span className="subject-status-empty">Belum Dimulakan</span>
                  )}
                  <div
                    className="mini-progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={subject.hasData ? safePercent(subject.mastery) : 0}
                    aria-label={`${subject.label} penguasaan`}
                  >
                    <div style={{ width: `${subject.hasData ? safePercent(subject.mastery) : 0}%` }} />
                  </div>
                  <span>{subject.hasData ? `${subject.attempts} soalan - Penguasaan ${safePercent(subject.mastery)}%` : '0 soalan - Belum ada data'}</span>
                </button>
              ))}
            </div>
            {selectedSubject && (
              <div className="timeline">
                <div className="timeline-item">
                  <span>{selectedSubject.label}</span>
                  <b>{selectedTimeline.headline}</b>
                  <em>{selectedTimeline.meta}</em>
                  <p>{selectedTimeline.body}</p>
                </div>
                <div className="timeline-item">
                  <span>Topik Lemah</span>
                  <b>{selectedSubject.analytics.weakTopics.length ? selectedSubject.analytics.weakTopics.slice(0, 3).map(topic => formatTopicName(topic.topicId)).join(', ') : 'Belum ada topik lemah'}</b>
                  <em>{selectedSubject.analytics.weakTopics.length} topik</em>
                  <p>{selectedSubject.analytics.weakTopics[0] ? `Fokus pada ${formatTopicName(selectedSubject.analytics.weakTopics[0].topicId)}.` : 'Topik lemah akan muncul selepas murid membuat lebih banyak latihan.'}</p>
                </div>
                <div className="timeline-item">
                  <span>Cadangan Ibu Bapa</span>
                  <b>{selectedRecommendationKey ? formatRecommendationKey(selectedRecommendationKey) : 'Belum ada cadangan'}</b>
                  <em>{selectedSubject.hasData ? `${safePercent(selectedSubject.mastery)}% penguasaan` : 'Tiada data'}</em>
                  <p>{selectedSubject.hasData ? 'Gunakan maklumat ini untuk sokongan di rumah.' : 'Murid perlu mula menjawab soalan untuk cadangan muncul.'}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Belum ada penguasaan subjek"
            message={allowMock
              ? 'Mod pembangunan menggunakan data mock apabila profil sebenar belum tersedia.'
              : 'Profil murid belum mempunyai data penguasaan. Selesaikan beberapa latihan dahulu.'}
            showMascot={false}
          />
        )}
      </section>

      <section className="card">
        <h2>Fokus dan Cadangan</h2>
        {reportHasData && (weakestSubject || strongestSubject || focusTopics.length || overallRecommendationKey) ? (
          <>
            <p className="memory-last">{formatScopeLabel(canonicalAnalytics.scopeLabel)}</p>
            <div className="metric-grid">
              <MetricCard value={safeText(weakestSubject?.label, 'Belum tersedia')} label="Subjek Paling Lemah" subtitle={weakestSubject ? `${safePercent(weakestSubject.mastery)}%` : 'Tiada data'} />
              <MetricCard value={safeText(strongestSubject?.label, 'Belum tersedia')} label="Subjek Terkuat" subtitle={strongestSubject ? `${safePercent(strongestSubject.mastery)}%` : 'Tiada data'} />
              <MetricCard value={safeText(focusTopics[0]?.topicId ? formatTopicName(focusTopics[0].topicId) : '', 'Belum tersedia')} label="Topik Fokus" subtitle={focusTopics[0] ? `${safePercent(focusTopics[0].mastery)}%` : 'Tiada data'} />
              <MetricCard value={aiRecommendationText || 'Belum tersedia'} label="Cadangan AI" subtitle={canonicalAnalytics.status} />
            </div>
            {focusTopics.length ? (
              <div className="parent-topic-list">
                {focusTopics.map(topic => (
                  <div className="parent-topic-item" key={`${topic.subjectId}-${topic.topicId}`}>
                    <b>{formatTopicName(topic.topicId)}</b>
                    <span>{formatSubjectName(topic.subjectId)} · {formatRecommendationKey('review')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Belum ada topik fokus" message="Cadangan fokus akan muncul selepas murid mengumpul lebih banyak data." showMascot={false} />
            )}
          </>
        ) : (
          <EmptyState title="Belum ada topik fokus" message="Cadangan fokus akan muncul selepas murid mengumpul lebih banyak data." showMascot={false} />
        )}
      </section>

      <section className="card">
        <h2>Jadual Ulang Kaji</h2>
        {revisionItems.length ? (
          <div className="parent-topic-list">
            {revisionItems.slice(0, 8).map(item => (
              <div className={`parent-topic-item ${item.isOverdue ? 'strong' : ''}`} key={`${item.subjectId}-${item.topicId}-${item.nextReviewAt}`}>
                <b>{formatTopicName(item.topicId)}</b>
                <span>{formatSubjectName(item.subjectId)}</span>
                <em>{formatReviewQueueMeta(item)}</em>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada jadual ulang kaji" message="Jadual akan muncul selepas murid mempunyai data penguasaan." showMascot={false} />
        )}
      </section>

      <StudyPlannerPanel planner={studyPlannerPayload} />

      <section className="card">
        <h2>Sejarah Pentaksiran</h2>
        <div className="timeline">
          {(sourceProfile?.uasaHistory || sourceProfile?.uasa?.history || []).length ? (sourceProfile.uasaHistory || sourceProfile.uasa.history).slice(0, 8).map((item, index) => (
            <div className="timeline-item" key={index}>
              <span>{formatFriendlyDate(item.date)}</span>
              <b>{formatSubjectName(item.subjectShort || item.subjectId)} - Gred {safeText(item.grade)}</b>
              <em>{safePercent(item.score)}% · {safeNumber(item.total, 0)} soalan · {formatModeLabel('uasa')}</em>
            </div>
          )) : (
            <EmptyState title="Belum ada sejarah pentaksiran" message="Percubaan pentaksiran yang disimpan akan muncul di sini." showMascot={false} />
          )}
        </div>
      </section>

      <section className="card">
        <h2>Aktiviti Terkini</h2>
        <div className="timeline">
          {(sourceProfile?.history || []).length === 0 ? (
            <EmptyState title="Belum ada aktiviti" message="Latihan terkini dan sesi kemahiran yang disimpan akan muncul di sini." showMascot={false} />
          ) : (
            sourceProfile.history.slice(0, 10).map((item, index) => (
              <div className="timeline-item" key={index}>
                <span>{formatFriendlyDate(item.date)}</span>
                <b>{formatSubjectName(item.subject || item.subjectId)} - {formatTopicName(item.topicId || item.topic)}</b>
                <em>{Number.isFinite(Number(item.percent)) ? `${safePercent(item.percent)}% · ${formatActivityStatus(item.percent)}` : 'Belum cukup data'}</em>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <button type="button" className="full" onClick={() => printParentReport()}>Cetak Laporan</button>
      </section>
    </main>
  );
}
