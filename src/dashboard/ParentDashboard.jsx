import React, { useMemo, useState } from 'react';
import { EmptyState } from './dashboardHelpers.jsx';
import { loadAIMemory } from '../ai/memoryEngine';
import { getAllSubjectAnalytics, getBestSubject, getWeakestSubject, getSubjectAttentionSummary } from '../ai/adaptive/subjectAnalyticsEngine';
import { rankStrongTopics, rankWeakTopics, explainWeakness } from '../ai/adaptive/weakTopicEngine';
import { buildParentAnalytics } from '../ai/parentAnalytics/parentAnalyticsEngine';
import { printParentReport } from '../utils/printReport';
import { clampPercent, formatActivityStatus, formatAttentionLevel, formatStatus, formatStudyMinutes, formatSubjectName, formatTopicName, formatTrend } from '../utils/displayFormatter';
import MetricCard from '../components/MetricCard.jsx';

function getOverallAccuracy(profile = {}) {
  const total = Number(profile.totalQuestions || 0);
  const correct = Number(profile.correctQuestions || 0);
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function getParentStatusBadge(accuracy) {
  if (accuracy >= 90) return '🌟 Cemerlang';
  if (accuracy >= 75) return '👍 Baik';
  return '📘 Perlu Ditingkatkan';
}

function compactTopicList(items = []) {
  return items.slice(0, 3).map(item => formatTopicName(item.title || item.topicId)).join(', ') || '-';
}

export default function ParentDashboard({
  profile,
  adaptiveProfile,
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
  const [selectedSubjectId, setSelectedSubjectId] = useState(allSubjects[0]?.id || 'bm');
  const memory = aiMemory || loadAIMemory();
  const activeAdaptiveProfile = useMemo(() => adaptiveProfile || profile.adaptiveProfile || profile, [adaptiveProfile, profile]);

  const parentAnalytics = useMemo(() => buildParentAnalytics(activeAdaptiveProfile, {
    memory,
    observation: learningObservation || {},
    predictionProfile: predictionProfile || {},
    narrativeBundle: narrativeBundle || {},
    gamificationProfile: gamificationProfile || {},
    readiness: readiness || {}
  }), [activeAdaptiveProfile, memory, learningObservation, predictionProfile, narrativeBundle, gamificationProfile, readiness]);

  const subjectAnalytics = useMemo(() => getAllSubjectAnalytics(activeAdaptiveProfile), [activeAdaptiveProfile]);
  const bestSubject = useMemo(() => parentAnalytics.subjectComparison.strongest || getBestSubject(activeAdaptiveProfile), [parentAnalytics.subjectComparison.strongest, activeAdaptiveProfile]);
  const weakestSubject = useMemo(() => parentAnalytics.subjectComparison.needsAttention || getWeakestSubject(activeAdaptiveProfile), [parentAnalytics.subjectComparison.needsAttention, activeAdaptiveProfile]);
  const selectedSubjectAnalytics = subjectAnalytics.find(subject => subject.subjectId === selectedSubjectId) || subjectAnalytics[0] || null;
  const selectedAttention = selectedSubjectAnalytics ? getSubjectAttentionSummary(activeAdaptiveProfile, selectedSubjectAnalytics.subjectId) : null;
  const weakTopics = useMemo(() => rankWeakTopics(activeAdaptiveProfile, { limit: 8 }), [activeAdaptiveProfile]);
  const strongTopics = useMemo(() => rankStrongTopics(activeAdaptiveProfile, { limit: 8 }), [activeAdaptiveProfile]);
  const reportHasData = parentAnalytics.weeklyTrend.hasData || parentAnalytics.subjectComparison.hasData || parentAnalytics.studyHabit.hasData || parentAnalytics.timeline.hasData;
  const overallAccuracy = getOverallAccuracy(activeAdaptiveProfile);
  const statusBadge = getParentStatusBadge(overallAccuracy);
  const consistencyLevel = parentAnalytics.studyHabit.consistencyScore === 'Konsisten'
    ? 'good'
    : parentAnalytics.studyHabit.consistencyScore === 'Sederhana'
      ? 'developing'
      : parentAnalytics.studyHabit.consistencyScore === 'Rendah'
        ? 'needs_attention'
        : 'insufficient_data';
  const readingHistory = memory.readingHistory || [];
  const listeningHistory = memory.listeningHistory || [];
  const speakingHistory = memory.speakingHistory || [];
  const writingHistory = memory.writingHistory || [];

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
          <MetricCard value={profile.name || activeAdaptiveProfile.name || 'Murid'} label="Nama Murid" />
          <MetricCard value={formatStatus(readiness?.level || 'needs_support')} label="Tahap" subtitle={readiness?.message || 'Masih memerlukan sokongan.'} />
          <MetricCard value={Number(activeAdaptiveProfile.xp || profile.xp || 0)} label="XP" />
          <MetricCard value={Number(activeAdaptiveProfile.streak || profile.streak || 0)} label="Streak" />
          <MetricCard value={Number(activeAdaptiveProfile.totalQuestions || 0)} label="Jumlah Soalan" />
          <MetricCard value={Number(activeAdaptiveProfile.correctQuestions || 0)} label="Jumlah Betul" />
          <MetricCard value={`${clampPercent(overallAccuracy)}%`} label="Ketepatan" />
          <MetricCard value={formatStudyMinutes(activeAdaptiveProfile.studyMinutes || 0)} label="Masa Belajar" />
        </div>
        <div className="status-badge-row">
          <span className="badge">{statusBadge}</span>
          <span className="badge">{parentAnalytics.weeklyTrend.trend?.message || 'Belum cukup data untuk analisis trend.'}</span>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Trend Mingguan</p>
        <h2>Trend Mingguan</h2>
        <div className="metric-grid">
          <MetricCard value={parentAnalytics.weeklyTrend.totals.questions} label="Soalan 7 Hari" subtitle={parentAnalytics.weeklyTrend.compact.questionsLabel} />
          <MetricCard value={`${clampPercent(parentAnalytics.weeklyTrend.totals.accuracy)}%`} label="Ketepatan 7 Hari" subtitle={parentAnalytics.weeklyTrend.compact.accuracyLabel} />
          <MetricCard value={formatStudyMinutes(parentAnalytics.weeklyTrend.totals.studyMinutes)} label="Masa Belajar" subtitle={parentAnalytics.weeklyTrend.compact.studyMinutesLabel} />
          <MetricCard value={parentAnalytics.weeklyTrend.totals.activeDays} label="Hari Aktif" subtitle={parentAnalytics.weeklyTrend.compact.missionsLabel} />
          <MetricCard value={formatTrend(parentAnalytics.weeklyTrend.trend?.direction || 'insufficient_data')} label="Trend" subtitle={parentAnalytics.weeklyTrend.compact.trendLabel} />
        </div>
        <div className="timeline" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.5rem' }}>
          {parentAnalytics.weeklyTrend.daily.map(day => (
            <div className="report-box" key={day.date} style={{ padding: '0.75rem' }}>
              <h3 style={{ marginBottom: '0.25rem' }}>{day.date.slice(5)}</h3>
              <b>{day.questions}</b>
              <span>{day.active ? `${clampPercent(day.accuracy)}%` : 'Aktif'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Perbandingan Subjek</p>
        <h2>Perbandingan Subjek</h2>
        {subjectAnalytics.length ? (
          <>
            <div className="metric-grid">
              <MetricCard value={formatSubjectName(bestSubject?.subjectId)} label="Subjek Terbaik" subtitle={bestSubject ? `${clampPercent(bestSubject.mastery)}%` : 'Belum cukup data'} />
              <MetricCard value={formatSubjectName(parentAnalytics.subjectComparison.developing?.subjectId || weakestSubject?.subjectId)} label="Sedang Berkembang" subtitle={parentAnalytics.subjectComparison.developing ? `${clampPercent(parentAnalytics.subjectComparison.developing.mastery)}%` : 'Belum cukup data'} />
              <MetricCard value={formatSubjectName(weakestSubject?.subjectId)} label="Perlu Perhatian" subtitle={weakestSubject ? `${clampPercent(weakestSubject.mastery)}%` : 'Belum cukup data'} />
              <MetricCard value={formatAttentionLevel(selectedAttention?.attentionLevel)} label="Keutamaan" subtitle={selectedAttention?.message || 'Belum cukup data'} />
            </div>
            <div className="subject-report-grid">
              {subjectAnalytics.map(subject => (
                <button
                  type="button"
                  key={subject.subjectId}
                  className={`report-box ${selectedSubjectId === subject.subjectId ? 'selected-subject' : ''}`}
                  onClick={() => setSelectedSubjectId(subject.subjectId)}
                >
                  <h3>{formatSubjectName(subject.subjectId)}</h3>
                  {subject.totalQuestions > 0 ? (
                    <b>{clampPercent(subject.accuracy)}%</b>
                  ) : (
                    <span className="subject-status-empty">Belum Dimulakan</span>
                  )}
                  <div className="mini-progress"><div style={{ width: `${clampPercent(subject.accuracy)}%` }} /></div>
                  <span>{subject.totalQuestions > 0 ? `${subject.totalQuestions} soalan` : '0 soalan'} • {formatAttentionLevel(subject.attentionLevel)}</span>
                </button>
              ))}
            </div>
            {selectedSubjectAnalytics && (
              <div className="timeline">
                <div className="timeline-item">
                  <span>{formatSubjectName(selectedSubjectAnalytics.subjectId)}</span>
                  <b>{formatStatus(selectedSubjectAnalytics.status)}</b>
                  <em>Penguasaan {clampPercent(selectedSubjectAnalytics.mastery)}% • Keyakinan {clampPercent(selectedSubjectAnalytics.confidence)}%</em>
                  <p>{formatTrend(selectedSubjectAnalytics.trend.direction)} • {selectedSubjectAnalytics.trend.message}</p>
                </div>
                <div className="timeline-item">
                  <span>Topik Lemah</span>
                  <b>{compactTopicList(selectedSubjectAnalytics.weakTopics)}</b>
                  <em>{selectedSubjectAnalytics.weakTopics.length} topik</em>
                  <p>{selectedSubjectAnalytics.weakTopics[0] ? explainWeakness(selectedSubjectAnalytics.weakTopics[0]).message : 'Belum cukup data untuk analisis subjek.'}</p>
                </div>
                <div className="timeline-item">
                  <span>Topik Kuat</span>
                  <b>{compactTopicList(selectedSubjectAnalytics.strongTopics)}</b>
                  <em>{selectedSubjectAnalytics.strongTopics.length} topik</em>
                  <p>{selectedSubjectAnalytics.trend.message}</p>
                </div>
                <div className="timeline-item">
                  <span>Cadangan Fokus</span>
                  <b>{formatTopicName(selectedSubjectAnalytics.weakTopics[0]?.topicId) || '-'}</b>
                  <em>{formatAttentionLevel(selectedSubjectAnalytics.attentionLevel)}</em>
                  <p>{selectedSubjectAnalytics.weakTopics[0] ? 'Fokus pada topik ini dahulu.' : 'Belum cukup data untuk analisis subjek.'}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="Belum cukup data untuk analisis subjek." message="Mulakan latihan untuk melihat analisis subjek." actionLabel="Mula Latihan AI" onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />
        )}
      </section>

      <section className="card">
        <p className="eyebrow">Tabiat Belajar</p>
        <h2>Tabiat Belajar</h2>
        <div className="metric-grid">
          <MetricCard className="study-habit-card" value={parentAnalytics.studyHabit.studyFrequency} label="Hari Aktif" subtitle={parentAnalytics.studyHabit.summary} />
          <MetricCard className="study-habit-card" value={parentAnalytics.studyHabit.averageSessionLabel} label="Purata Sesi" subtitle="Masa purata setiap sesi." />
          <MetricCard className="study-habit-card study-habit-card-status" value={formatStatus(consistencyLevel)} label="Konsistensi" subtitle="Prestasi semakin stabil." />
          <MetricCard className="study-habit-card" value={parentAnalytics.timeline.items.length} label="Aktiviti Terkini" subtitle={`${parentAnalytics.timeline.items.length} aktiviti telah direkodkan.`} />
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Cadangan AI</p>
        <h2>Cadangan AI</h2>
        <div className="metric-grid">
          <MetricCard value={formatTopicName(parentAnalytics.recommendation.topicName)} label="Topik Disyorkan" subtitle={parentAnalytics.recommendation.summary} />
          <MetricCard value={parentAnalytics.recommendation.estimatedMinutes ? `${parentAnalytics.recommendation.estimatedMinutes} min` : '15 min'} label="Anggaran Masa" subtitle={parentAnalytics.recommendation.compact.readiness} />
          <MetricCard value={formatStatus(parentAnalytics.recommendation.readinessLevel)} label="Kesediaan" subtitle={parentAnalytics.recommendation.compact.topic} />
          <MetricCard value={parentAnalytics.improvement.strongestTopic?.title || 'Belum cukup data'} label="Topik Terbaik" subtitle={parentAnalytics.improvement.summary} />
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Laporan AI</p>
        <h2>Laporan AI</h2>
        {reportHasData ? (
          <>
            <div className="metric-grid">
              <MetricCard value={`${parentAnalytics.weeklyTrend.totals.questions}`} label="Ringkasan Mingguan" subtitle={parentAnalytics.summary} />
              <MetricCard value={`${parentAnalytics.subjectComparison.ranking.length}`} label="Subjek Dianalisis" subtitle={parentAnalytics.subjectComparison.strongest ? formatSubjectName(parentAnalytics.subjectComparison.strongest.subjectId) : 'Belum cukup data'} />
              <MetricCard value={`${parentAnalytics.improvement.weakestTopic ? '1' : '0'}`} label="Perlu Diperbaiki" subtitle={parentAnalytics.improvement.summary || 'Belum cukup data'} />
              <MetricCard value={parentAnalytics.recommendation.estimatedMinutes ? `${parentAnalytics.recommendation.estimatedMinutes} min` : '15 min'} label="Cadangan AI" subtitle={parentAnalytics.recommendation.summary} />
            </div>
            <div className="timeline">{parentAnalytics.timeline.items.slice(0, 3).map((item, index) => <div className="timeline-item" key={`timeline-${index}`}><span>{item.title}</span><b>{item.subtitle}</b><em>{item.message}</em></div>)}</div>
            <div className="timeline">
              <div className="timeline-item"><span>Galakan</span><b>{narrativeBundle?.encouragement || parentAnalytics.summary}</b><em>Motivasi Harian</em></div>
              <div className="timeline-item"><span>Matlamat Seterusnya</span><b>{parentAnalytics.recommendation.topicName ? `Ulang kaji ${parentAnalytics.recommendation.topicName}` : 'Mulakan latihan harian'}</b><em>{parentAnalytics.recommendation.estimatedMinutes} min</em></div>
            </div>
          </>
        ) : (
          <EmptyState title="Belum ada rekod pembelajaran." message="AI memerlukan lebih banyak data pembelajaran sebelum laporan boleh dijana." actionLabel="Mula Latihan AI" onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />
        )}
      </section>

      <section className="card">
        <h2>Sejarah Bacaan</h2>
        <div className="timeline">
          {readingHistory.length ? readingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.correct} betul • {item.missed} tertinggal</em></div>) : <EmptyState title="Belum ada rekod bacaan" message="Sesi bacaan yang disimpan akan muncul di sini untuk semakan ibu bapa." />}
        </div>
      </section>

      <section className="card">
        <h2>Sejarah Mendengar</h2>
        <div className="timeline">
          {listeningHistory.length ? listeningHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.correct}/{item.total} betul • {item.mode}</em></div>) : <EmptyState title="Belum ada rekod mendengar" message="Keputusan latihan mendengar akan muncul selepas percubaan pertama disimpan." />}
        </div>
      </section>

      <section className="card">
        <h2>Sejarah Bertutur</h2>
        <div className="timeline">
          {speakingHistory.length ? speakingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.matchedKeywords}/{item.totalKeywords} kata kunci • {item.mode}</em></div>) : <EmptyState title="Belum ada rekod bertutur" message="Latihan bertutur akan disenaraikan di sini selepas disimpan." />}
        </div>
      </section>

      <section className="card">
        <h2>Sejarah Menulis</h2>
        <div className="timeline">
          {writingHistory.length ? writingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.matchedKeywords}/{item.totalKeywords} kata kunci • {item.spellingIssues} isu ejaan</em></div>) : <EmptyState title="Belum ada rekod menulis" message="Keputusan latihan menulis akan muncul selepas sesi disimpan." />}
        </div>
      </section>

      <section className="parent-two-col">
        <section className="card">
          <h2>Topik Lemah</h2>
          <div className="parent-topic-list">
            {weakTopics.length ? weakTopics.slice(0, 8).map(topic => <div className="parent-topic-item" key={`${topic.subjectId}-${topic.topicId}`}><b>{formatTopicName(topic.title || topic.topicId)}</b><span>{formatSubjectName(topic.subject || topic.subjectId)} • {topic.best}%</span></div>) : <EmptyState title="Belum ada topik lemah" message="Topik lemah akan muncul selepas murid membuat lebih banyak latihan." />}
          </div>
        </section>
        <section className="card">
          <h2>Topik Kuat</h2>
          <div className="parent-topic-list">
            {strongTopics.length ? strongTopics.slice(0, 8).map(topic => <div className="parent-topic-item strong" key={`${topic.subjectId}-${topic.topicId}`}><b>{formatTopicName(topic.title || topic.topicId)}</b><span>{formatSubjectName(topic.subject || topic.subjectId)} • {topic.best}%</span></div>) : <EmptyState title="Belum ada topik kuat" message="Topik kuat akan muncul apabila skor mencapai tahap penguasaan." />}
          </div>
        </section>
      </section>

      <section className="card">
        <h2>Sejarah UASA</h2>
        <div className="timeline">
          {(profile.uasaHistory || []).length ? profile.uasaHistory.slice(0, 8).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{formatSubjectName(item.subjectShort || item.subjectId)} - Gred {item.grade}</b><em>{clampPercent(item.score)}% • {item.total} soalan</em></div>) : <EmptyState title="Belum ada sejarah UASA" message="Percubaan simulator yang disimpan akan muncul di sini." />}
        </div>
      </section>

      <section className="card">
        <h2>Aktiviti Terkini</h2>
        <div className="timeline">
          {(profile.history || []).length === 0 ? <EmptyState title="Belum ada aktiviti" message="Latihan terkini dan sesi kemahiran yang disimpan akan muncul di sini." /> : profile.history.slice(0, 10).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{formatSubjectName(item.subject)} - {item.topic}</b><em>{Number.isFinite(Number(item.percent)) ? `${clampPercent(item.percent)}% ${formatActivityStatus(item.percent)}` : 'Belum cukup data'}</em></div>)}
        </div>
      </section>

      <section className="card">
        <button type="button" className="full" onClick={() => printParentReport()}>Cetak Laporan</button>
      </section>
    </main>
  );
}
