import React, { useMemo, useState } from 'react';
import { EmptyState } from './dashboardHelpers.jsx';
import { loadAIMemory } from '../ai/memoryEngine';
import { getWeeklySummary } from '../ai/adaptive/weeklyAnalyticsEngine';
import { getAllSubjectAnalytics, getBestSubject, getWeakestSubject, getSubjectAttentionSummary } from '../ai/adaptive/subjectAnalyticsEngine';
import { generateParentReport } from '../ai/adaptive/parentReportEngine';
import { explainWeakness, rankStrongTopics, rankWeakTopics } from '../ai/adaptive/weakTopicEngine';
import { printParentReport } from '../utils/printReport';
import { clampPercent, formatActivityStatus, formatAttentionLevel, formatStatus, formatStudyMinutes, formatSubjectName, formatTopicName, formatTrend } from '../utils/displayFormatter';
import MetricCard from '../components/MetricCard.jsx';

export default function ParentDashboard({ profile, adaptiveProfile, allSubjects, adaptivePracticeCount, readiness, onStartAdaptivePractice, onBack }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(allSubjects[0]?.id || 'bm');
  const memory = loadAIMemory();
  const activeAdaptiveProfile = useMemo(() => adaptiveProfile || profile.adaptiveProfile || profile, [adaptiveProfile, profile]);
  const weeklyAnalytics = useMemo(() => getWeeklySummary(activeAdaptiveProfile, { days: 7 }), [activeAdaptiveProfile]);
  const subjectAnalytics = useMemo(() => getAllSubjectAnalytics(activeAdaptiveProfile), [activeAdaptiveProfile]);
  const bestSubject = useMemo(() => getBestSubject(activeAdaptiveProfile), [activeAdaptiveProfile]);
  const weakestSubject = useMemo(() => getWeakestSubject(activeAdaptiveProfile), [activeAdaptiveProfile]);
  const selectedSubjectAnalytics = subjectAnalytics.find(subject => subject.subjectId === selectedSubjectId) || subjectAnalytics[0] || null;
  const selectedAttention = selectedSubjectAnalytics ? getSubjectAttentionSummary(activeAdaptiveProfile, selectedSubjectAnalytics.subjectId) : null;
  const parentReport = useMemo(() => generateParentReport(activeAdaptiveProfile), [activeAdaptiveProfile]);
  const reportHasData = parentReport.summary !== 'AI memerlukan lebih banyak data pembelajaran sebelum laporan boleh dijana.';
  const reportWeakTopic = parentReport.improvements[0] || 'Belum ada topik yang memerlukan perhatian.';
  const reportAdvice = parentReport.advice.length ? parentReport.advice : ['Cadangan akan muncul apabila data mencukupi.'];
  const weakTopics = useMemo(() => rankWeakTopics(activeAdaptiveProfile, { limit: 8 }), [activeAdaptiveProfile]);
  const strongTopics = useMemo(() => rankStrongTopics(activeAdaptiveProfile, { limit: 8 }), [activeAdaptiveProfile]);
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
        <p className="eyebrow">Trend Mingguan</p>
        <h2>Trend Mingguan</h2>
        {weeklyAnalytics.totals.questions > 0 ? (
          <>
            <div className="metric-grid">
              <MetricCard value={weeklyAnalytics.totals.questions} label="Soalan Minggu Ini" />
              <MetricCard value={`${clampPercent(weeklyAnalytics.totals.accuracy)}%`} label="Ketepatan" />
              <MetricCard value={formatTrend(weeklyAnalytics.trend.direction)} label="Trend" subtitle={weeklyAnalytics.trend.message} />
              <MetricCard value={weeklyAnalytics.totals.activeDays} label="Hari Aktif" />
              <MetricCard value={formatStudyMinutes(weeklyAnalytics.totals.studyMinutes)} label="Masa Belajar" />
            </div>
            <div className="timeline" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.5rem' }}>
              {weeklyAnalytics.daily.map(day => (
                <div className="report-box" key={day.date} style={{ padding: '0.75rem' }}>
                  <h3 style={{ marginBottom: '0.25rem' }}>{day.date.slice(5)}</h3>
                  <b>{day.questions}</b>
                  <span>{day.active ? `${clampPercent(day.accuracy)}%` : 'Aktif'}</span>
                </div>
              ))}
            </div>
            <p className="memory-last">{weeklyAnalytics.trend.message}</p>
          </>
        ) : (
          <EmptyState title="Belum ada aktiviti dalam 7 hari terakhir." message="Mulakan latihan untuk melihat trend mingguan." actionLabel="Mula Latihan AI" onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />
        )}
      </section>

      <section className="card">
        <p className="eyebrow">Kesediaan UASA</p>
        <h2>Kesediaan UASA</h2>
        <div className="metric-grid">
          <MetricCard value={`${clampPercent(readiness?.score)}%`} label="Skor Kesediaan" />
          <MetricCard value={formatStatus(readiness?.level || 'needs_support')} label="Tahap" />
          <MetricCard value={formatTrend(clampPercent(readiness?.score) >= 80 ? 'improving' : clampPercent(readiness?.score) >= 55 ? 'stable' : 'declining')} label="Trend" subtitle={readiness?.message || 'Perlu lebih latihan sebelum ke tahap seterusnya.'} />
          <MetricCard value={formatAttentionLevel(readiness?.attentionLevel || 'medium')} label="Keperluan Sokongan" />
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Analisis Subjek</p>
        <h2>Analisis Subjek</h2>
        {subjectAnalytics.length ? (
          <>
            <div className="metric-grid">
              <MetricCard value={formatSubjectName(bestSubject?.subjectId)} label="Subjek Terbaik" />
              <MetricCard value={formatSubjectName(weakestSubject?.subjectId)} label="Perlu Diberi Perhatian" />
              <MetricCard value={subjectAnalytics.length} label="Subjek Dinilai" />
              <MetricCard value={formatAttentionLevel(selectedAttention?.attentionLevel)} label="Keutamaan" />
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
                  <em>Penguasaan {clampPercent(selectedSubjectAnalytics.mastery)}% • Keyakinan Data {clampPercent(selectedSubjectAnalytics.confidence)}%</em>
                  <p>{formatTrend(selectedSubjectAnalytics.trend.direction)} • {selectedSubjectAnalytics.trend.message}</p>
                </div>
                <div className="timeline-item">
                  <span>Topik Lemah</span>
                  <b>{selectedSubjectAnalytics.weakTopics.slice(0, 3).map(topic => formatTopicName(topic.topicId)).join(', ') || '-'}</b>
                  <em>{selectedSubjectAnalytics.weakTopics.length} topik</em>
                  <p>{selectedSubjectAnalytics.weakTopics[0] ? explainWeakness(selectedSubjectAnalytics.weakTopics[0]).message : 'Belum cukup data untuk analisis subjek.'}</p>
                </div>
                <div className="timeline-item">
                  <span>Topik Kuat</span>
                  <b>{selectedSubjectAnalytics.strongTopics.slice(0, 3).map(topic => formatTopicName(topic.topicId)).join(', ') || '-'}</b>
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
        <p className="eyebrow">Laporan AI</p>
        <h2>Laporan AI</h2>
        {reportHasData ? (
          <>
            <div className="metric-grid">
              <MetricCard value={weeklyAnalytics.totals.questions} label="Soalan Minggu Ini" subtitle={parentReport.generatedAt.slice(0, 10)} />
              <MetricCard value={`${clampPercent(weeklyAnalytics.totals.accuracy)}%`} label="Ketepatan" subtitle={weeklyAnalytics.trend.message} />
              <MetricCard value={parentReport.achievements.length} label="Pencapaian" subtitle={parentReport.achievements[0] || 'Belum cukup data.'} />
              <MetricCard value={`${parentReport.estimatedStudyTime} min`} label="Cadangan AI" subtitle={reportAdvice[0] || 'Cadangan akan muncul apabila data mencukupi.'} />
            </div>
            <div className="timeline">{parentReport.achievements.slice(0, 3).map((item, index) => <div className="timeline-item" key={`achievement-${index}`}><span>Pencapaian</span><b>{item}</b><em>{parentReport.encouragement}</em></div>)}</div>
            <div className="timeline">{parentReport.improvements.slice(0, 3).map((item, index) => <div className="timeline-item" key={`improvement-${index}`}><span>Perlu Diperbaiki</span><b>{item}</b><em>{parentReport.nextGoal}</em></div>)}</div>
            <div className="timeline">{reportAdvice.slice(0, 3).map((item, index) => <div className="timeline-item" key={`advice-${index}`}><span>Cadangan AI</span><b>{item}</b><em>{parentReport.estimatedStudyTime} min</em></div>)}</div>
            <div className="timeline">
              <div className="timeline-item"><span>Galakan</span><b>{parentReport.encouragement}</b><em>Motivasi Harian</em></div>
              <div className="timeline-item"><span>Matlamat Seterusnya</span><b>{parentReport.nextGoal}</b><em>Matlamat Seterusnya</em></div>
            </div>
          </>
        ) : (
          <EmptyState title="Belum ada rekod pembelajaran." message="AI memerlukan lebih banyak data pembelajaran sebelum laporan boleh dijana." actionLabel="Mula Latihan AI" onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />
        )}
      </section>

      <section className="card">
        <h2>🎤 Sejarah Bacaan</h2>
        <div className="timeline">
          {readingHistory.length ? readingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.correct} betul • {item.missed} tertinggal</em></div>) : <EmptyState title="Belum ada rekod bacaan" message="Sesi bacaan yang disimpan akan muncul di sini untuk semakan ibu bapa." />}
        </div>
      </section>

      <section className="card">
        <h2>🎧 Sejarah Mendengar</h2>
        <div className="timeline">
          {listeningHistory.length ? listeningHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.correct}/{item.total} betul • {item.mode}</em></div>) : <EmptyState title="Belum ada rekod mendengar" message="Keputusan latihan mendengar akan muncul selepas percubaan pertama disimpan." />}
        </div>
      </section>

      <section className="card">
        <h2>🗣️ Sejarah Bertutur</h2>
        <div className="timeline">
          {speakingHistory.length ? speakingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.matchedKeywords}/{item.totalKeywords} kata kunci • {item.mode}</em></div>) : <EmptyState title="Belum ada rekod bertutur" message="Latihan bertutur akan disenaraikan di sini selepas disimpan." />}
        </div>
      </section>

      <section className="card">
        <h2>✍️ Sejarah Menulis</h2>
        <div className="timeline">
          {writingHistory.length ? writingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% • {item.matchedKeywords}/{item.totalKeywords} kata kunci • {item.spellingIssues} isu ejaan</em></div>) : <EmptyState title="Belum ada rekod menulis" message="Keputusan latihan menulis akan muncul selepas sesi disimpan." />}
        </div>
      </section>

      <section className="parent-two-col">
        <section className="card">
          <h2>⚠️ Topik Lemah</h2>
          <div className="parent-topic-list">
            {weakTopics.length ? weakTopics.slice(0, 8).map(topic => <div className="parent-topic-item" key={`${topic.subjectId}-${topic.topicId}`}><b>{formatTopicName(topic.title || topic.topicId)}</b><span>{formatSubjectName(topic.subject || topic.subjectId)} • {topic.best}%</span></div>) : <EmptyState title="Belum ada topik lemah" message="Topik lemah akan muncul selepas murid membuat lebih banyak latihan." />}
          </div>
        </section>
        <section className="card">
          <h2>🌟 Topik Kuat</h2>
          <div className="parent-topic-list">
            {strongTopics.length ? strongTopics.slice(0, 8).map(topic => <div className="parent-topic-item strong" key={`${topic.subjectId}-${topic.topicId}`}><b>{formatTopicName(topic.title || topic.topicId)}</b><span>{formatSubjectName(topic.subject || topic.subjectId)} • {topic.best}%</span></div>) : <EmptyState title="Belum ada topik kuat" message="Topik kuat akan muncul apabila skor mencapai tahap penguasaan." />}
          </div>
        </section>
      </section>

      <section className="card">
        <h2>🏆 Sejarah UASA</h2>
        <div className="timeline">
          {(profile.uasaHistory || []).length ? profile.uasaHistory.slice(0, 8).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{formatSubjectName(item.subjectShort || item.subjectId)} - Gred {item.grade}</b><em>{clampPercent(item.score)}% • {item.total} soalan</em></div>) : <EmptyState title="Belum ada sejarah UASA" message="Percubaan simulator yang disimpan akan muncul di sini." />}
        </div>
      </section>

      <section className="card">
        <h2>📅 Aktiviti Terkini</h2>
        <div className="timeline">
          {(profile.history || []).length === 0 ? <EmptyState title="Belum ada aktiviti" message="Latihan terkini dan sesi kemahiran yang disimpan akan muncul di sini." /> : profile.history.slice(0, 10).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{formatSubjectName(item.subject)} - {item.topic}</b><em>{Number.isFinite(Number(item.percent)) ? `${clampPercent(item.percent)}% ${formatActivityStatus(item.percent)}` : 'Belum cukup data'}</em></div>)}
        </div>
      </section>

      <section className="card">
        <button type="button" className="full" onClick={() => printParentReport()}>🖨️ Cetak Laporan</button>
      </section>
    </main>
  );
}




