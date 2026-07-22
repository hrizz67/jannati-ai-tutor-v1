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
  formatStatus,
  formatStudyMinutes,
  formatSubjectName,
  formatTopicName,
  formatFriendlyDate
} from '../utils/displayFormatter';
import MetricCard from '../components/MetricCard.jsx';
import StudyPlannerPanel from '../components/studyPlanner/StudyPlannerPanel.jsx';
import { createStudyPlannerPayload } from '../studyPlanner/index.js';
import { subjectList as registrySubjectList } from '../data/subjects/index.js';
import { getStudentDisplayName } from '../utils/displayFormatter';
import { createCanonicalProgress, toParentProgressProfile } from '../utils/canonicalProgress.js';

const RECOMMENDATION_TEXT = {
  review: 'Perlu ulang kaji',
  normal_practice: 'Teruskan latihan',
  increase_difficulty: 'Bersedia untuk tahap seterusnya'
};

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

function formatRelativeTiming(item = {}) {
  if (!item) return 'Tarikh belum tersedia';
  if (item.isOverdue) {
    const overdueDays = Math.max(1, safeNumber(item.overdueDays, 1));
    return `Lewat ${overdueDays} hari`;
  }
  const dueInDays = Math.max(0, safeNumber(item.dueInDays, 0));
  if (dueInDays === 0) return 'Hari ini';
  if (dueInDays === 1) return 'Esok';
  return `${dueInDays} hari lagi`;
}

function getSubjectMastery(subjectInsight = {}) {
  const topics = Array.isArray(subjectInsight.topics) ? subjectInsight.topics : [];
  if (!topics.length) return 0;
  const total = topics.reduce((sum, topic) => sum + safeNumber(topic.mastery, 0), 0);
  return safePercent(Math.round(total / topics.length));
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

export default function ParentDashboard({
  profile,
  adaptiveProfile, // retained for compatibility; data now flows through Parent Insights only
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
  const sourceProfile = useMemo(() => buildMockGuardProfile(toParentProgressProfile(progress, profile), allowMock), [progress, profile, allowMock]);
  const insightsProfile = useMemo(() => resolveParentProfile(sourceProfile, { allowMock }), [sourceProfile, allowMock]);
  const summary = useMemo(() => buildParentSummary(insightsProfile), [insightsProfile]);
  const recommendationSummary = useMemo(() => buildRecommendationSummary(insightsProfile), [insightsProfile]);
  const revisionSummary = useMemo(() => buildRevisionSummary(insightsProfile), [insightsProfile]);
  const subjectCatalog = useMemo(() => (Array.isArray(allSubjects) && allSubjects.length ? allSubjects : registrySubjectList), [allSubjects]);
  const studentName = getStudentDisplayName(insightsProfile || sourceProfile, 'Murid');
  const studyPlannerPayload = useMemo(() => {
    try {
      return createStudyPlannerPayload(insightsProfile, {
        availableStudyMinutes: summary.studyTime || 20,
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
  }, [insightsProfile, summary.studyTime, summary]);
  const initialSelectedSubjectId = useMemo(() => resolveInitialSubjectId(insightsProfile || sourceProfile, subjectCatalog), [insightsProfile, sourceProfile, subjectCatalog]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSelectedSubjectId);

  const subjectInsights = useMemo(() => subjectCatalog.map(subject => {
    const insight = readSubjectInsight(insightsProfile, subject.id, { allowMock });
    const topics = Array.isArray(insight.topics) ? insight.topics : [];
    const mastery = getSubjectMastery(insight);
    const attempts = safeNumber(insight.performance?.attempts, 0);
    const accuracy = attempts > 0
      ? safePercent(Math.round((safeNumber(insight.performance?.correct, 0) / attempts) * 100))
      : 0;
    return {
      ...subject,
      insight,
      topics,
      mastery,
      accuracy,
      attempts,
      hasData: topics.length > 0 || attempts > 0
    };
  }), [insightsProfile, allowMock, subjectCatalog]);

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

  const weakTopics = recommendationSummary.weakestSubjects || [];
  const strongSubjects = recommendationSummary.strongestSubjects || [];
  const focusTopics = recommendationSummary.focusTopics || [];
  const aiRecommendations = recommendationSummary.aiRecommendations || [];
  const overdueReviews = Array.isArray(revisionSummary.overdueReviews) ? [...revisionSummary.overdueReviews] : [];
  const upcomingReviews = Array.isArray(revisionSummary.upcomingReviewSchedule) ? [...revisionSummary.upcomingReviewSchedule] : [];
  const revisionItems = [...overdueReviews, ...upcomingReviews].sort((left, right) => {
    if (left.isOverdue !== right.isOverdue) return left.isOverdue ? -1 : 1;
    if (left.isOverdue && right.isOverdue) return (right.overdueDays || 0) - (left.overdueDays || 0);
    if ((left.dueInDays || 0) !== (right.dueInDays || 0)) return (left.dueInDays || 0) - (right.dueInDays || 0);
    return String(left.subjectId || '').localeCompare(String(right.subjectId || ''));
  });
  const reportHasData = Boolean(summary.questionsAnswered || summary.correct || summary.wrong || subjectInsights.some(subject => subject.hasData));

  const overallAccuracy = summary.accuracy || 0;
  const statusBadge = overallAccuracy >= 90 ? '🌟 Cemerlang' : overallAccuracy >= 75 ? '👍 Baik' : '📘 Perlu Ditingkatkan';

  return (
    <main className="app">
      <div className="topbar">
        <button className="ghost" onClick={onBack}>Papan Utama</button>
        <span className="pill">Laporan Ibu Bapa</span>
      </div>

      <section className="card">
        <p className="eyebrow">Ringkasan Prestasi Anak</p>
        <h2>Ringkasan Prestasi Anak</h2>
        <div className="metric-grid">
          <MetricCard value={safeText(summary.name || studentName, 'Murid')} label="Nama Murid" />
          <MetricCard value={formatStatus(readiness?.level || 'needs_support')} label="Tahap" subtitle={safeText(readiness?.message, 'Masih memerlukan sokongan.')} />
          <MetricCard value={safeNumber(summary.questionsAnswered, 0)} label="Soalan Dijawab" />
          <MetricCard value={`${safePercent(summary.accuracy)}%`} label="Ketepatan" />
          <MetricCard value={formatStudyMinutes(summary.studyTime || 0)} label="Masa Belajar" />
          <MetricCard value={safeNumber(summary.streak?.current, 0)} label="Streak Semasa" />
          <MetricCard value={safeNumber(summary.streak?.longest, 0)} label="Streak Terpanjang" />
          <MetricCard value={safeNumber(adaptivePracticeCount, 0)} label="Latihan Adaptif" />
        </div>
        <div className="status-badge-row">
          <span className="badge">{statusBadge}</span>
          <span className="badge">{reportHasData ? 'Data tersedia untuk analisis.' : 'Belum cukup data untuk analisis terperinci.'}</span>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Subjek dan Penguasaan</p>
        <h2>Subjek dan Penguasaan</h2>
        {subjectInsights.some(subject => subject.hasData) ? (
          <>
            <div className="metric-grid">
              {subjectInsights.map(subject => (
                <MetricCard
                  key={subject.id}
                  value={subject.hasData ? `${safePercent(subject.mastery)}%` : '—'}
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
                    aria-label={`${subject.label} mastery`}
                  >
                    <div style={{ width: `${subject.hasData ? safePercent(subject.mastery) : 0}%` }} />
                  </div>
                  <span>{subject.hasData ? `${subject.attempts} soalan` : '0 soalan'} • {subject.hasData ? `Penguasaan ${safePercent(subject.mastery)}%` : 'Belum ada data'}</span>
                </button>
              ))}
            </div>
            {selectedSubject && (
              <div className="timeline">
                <div className="timeline-item">
                  <span>{selectedSubject.label}</span>
                  <b>{selectedSubject.hasData ? `${safePercent(selectedSubject.mastery)}% penguasaan` : 'Belum ada penguasaan'}</b>
                  <em>{selectedSubject.hasData ? `${selectedSubject.attempts} soalan • ${safePercent(selectedSubject.accuracy)}% ketepatan` : 'Tiada data tersedia'}</em>
                  <p>{selectedSubject.hasData ? `Topik tersedia: ${selectedSubject.topics.length}` : 'Murid belum mempunyai rekod untuk subjek ini.'}</p>
                </div>
                <div className="timeline-item">
                  <span>Topik Lemah</span>
                  <b>{selectedSubject.topics.length ? selectedSubject.topics.slice(0, 3).map(topic => formatTopicName(topic.topicId)).join(', ') : 'Belum ada topik lemah'}</b>
                  <em>{selectedSubject.topics.length} topik</em>
                  <p>{selectedSubject.topics[0] ? `Fokus pada ${formatTopicName(selectedSubject.topics[0].topicId)}.` : 'Topik lemah akan muncul selepas murid membuat lebih banyak latihan.'}</p>
                </div>
                <div className="timeline-item">
                  <span>Cadangan Ibu Bapa</span>
                  <b>{selectedSubject.hasData ? (selectedSubject.mastery >= 85 ? 'Naik aras latihan' : selectedSubject.mastery >= 60 ? 'Teruskan latihan' : 'Ulang kaji') : 'Belum ada cadangan'}</b>
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
          />
        )}
      </section>

      <section className="card">
        <p className="eyebrow">Fokus dan Cadangan</p>
        <h2>Fokus dan Cadangan</h2>
        <div className="metric-grid">
          <MetricCard value={safeText(weakTopics[0]?.subjectId ? formatSubjectName(weakTopics[0].subjectId) : '', '—')} label="Subjek Paling Lemah" subtitle={weakTopics[0] ? `${safePercent(weakTopics[0].mastery)}%` : 'Tiada data'} />
          <MetricCard value={safeText(strongSubjects[0]?.subjectId ? formatSubjectName(strongSubjects[0].subjectId) : '', '—')} label="Subjek Terkuat" subtitle={strongSubjects[0] ? `${safePercent(strongSubjects[0].mastery)}%` : 'Tiada data'} />
          <MetricCard value={safeText(focusTopics[0]?.topicId ? formatTopicName(focusTopics[0].topicId) : '', '—')} label="Topik Fokus" subtitle={focusTopics[0] ? `${safePercent(focusTopics[0].mastery)}%` : 'Tiada data'} />
          <MetricCard value={RECOMMENDATION_TEXT[aiRecommendations[0]?.recommendationKey] || '—'} label="Cadangan AI" subtitle={aiRecommendations[0]?.recommendation || 'Tiada cadangan'} />
        </div>
        {focusTopics.length ? (
          <div className="parent-topic-list">
            {focusTopics.slice(0, 4).map(topic => (
              <div className="parent-topic-item" key={`${topic.subjectId}-${topic.topicId}`}>
                <b>{formatTopicName(topic.topicId)}</b>
                <span>{formatSubjectName(topic.subjectId)} • {RECOMMENDATION_TEXT[topic.recommendationKey] || topic.recommendation}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada topik fokus" message="Cadangan fokus akan muncul selepas murid mengumpul lebih banyak data." />
        )}
      </section>

      <section className="card">
        <p className="eyebrow">Jadual Ulang Kaji</p>
        <h2>Jadual Ulang Kaji</h2>
        {revisionItems.length ? (
          <div className="parent-topic-list">
            {revisionItems.slice(0, 8).map(item => (
              <div className={`parent-topic-item ${item.isOverdue ? 'strong' : ''}`} key={`${item.subjectId}-${item.topicId}-${item.nextReviewAt}`}>
                <b>{formatTopicName(item.topicId)}</b>
                <span>{formatSubjectName(item.subjectId)} • {formatRelativeTiming(item)}</span>
                <span>Keutamaan {safePercent(item.priority)}%</span>
                <em>{item.isOverdue ? `Lewat ${Math.max(1, safeNumber(item.overdueDays, 1))} hari` : item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString('ms-MY') : 'Tarikh belum tersedia'}</em>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada jadual ulang kaji" message="Jadual akan muncul selepas murid mempunyai data penguasaan." />
        )}
      </section>

      <StudyPlannerPanel planner={studyPlannerPayload} />

      <section className="card">
        <p className="eyebrow">Sejarah UASA</p>
        <h2>Sejarah UASA</h2>
        <div className="timeline">
          {(sourceProfile?.uasaHistory || sourceProfile?.uasa?.history || []).length ? (sourceProfile.uasaHistory || sourceProfile.uasa.history).slice(0, 8).map((item, index) => (
            <div className="timeline-item" key={index}>
              <span>{formatFriendlyDate(item.date)}</span>
              <b>{formatSubjectName(item.subjectShort || item.subjectId)} - Gred {safeText(item.grade)}</b>
              <em>{safePercent(item.score)}% • {safeNumber(item.total, 0)} soalan</em>
            </div>
          )) : (
            <EmptyState title="Belum ada sejarah UASA" message="Percubaan simulator yang disimpan akan muncul di sini." />
          )}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Aktiviti Terkini</p>
        <h2>Aktiviti Terkini</h2>
        <div className="timeline">
          {(sourceProfile?.history || []).length === 0 ? (
            <EmptyState title="Belum ada aktiviti" message="Latihan terkini dan sesi kemahiran yang disimpan akan muncul di sini." />
          ) : (
            sourceProfile.history.slice(0, 10).map((item, index) => (
              <div className="timeline-item" key={index}>
                <span>{formatFriendlyDate(item.date)}</span>
                <b>{formatSubjectName(item.subject)} - {safeText(item.topic)}</b>
                <em>{Number.isFinite(Number(item.percent)) ? `${safePercent(item.percent)}% ${formatActivityStatus(item.percent)}` : 'Belum cukup data'}</em>
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
