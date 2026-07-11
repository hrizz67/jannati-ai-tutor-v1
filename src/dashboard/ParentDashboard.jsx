import React, { useMemo, useState } from 'react';
import { EmptyState } from './dashboardHelpers.jsx';
import { loadAIMemory } from '../ai/memoryEngine';
import { getWeeklySummary } from '../ai/adaptive/weeklyAnalyticsEngine';
import { getAllSubjectAnalytics, getBestSubject, getWeakestSubject, getSubjectAttentionSummary } from '../ai/adaptive/subjectAnalyticsEngine';
import { generateParentReport } from '../ai/adaptive/parentReportEngine';
import { explainWeakness, rankStrongTopics, rankWeakTopics } from '../ai/adaptive/weakTopicEngine';
import { printParentReport } from '../utils/printReport';
import { formatAttentionLevel, formatStatus, formatStudyMinutes, formatSubjectName, formatTopicName, formatTrend } from '../utils/displayFormatter';

export default function ParentDashboard({ profile, adaptiveProfile, allSubjects, adaptivePracticeCount, onStartAdaptivePractice, onBack }) {
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
            <div className="mastery-summary-grid">
              <div><b>{weeklyAnalytics.totals.questions}</b><span>Soalan 7 hari</span></div>
              <div><b>{weeklyAnalytics.totals.accuracy}%</b><span>Ketepatan 7 hari</span></div>
              <div><b>{formatStudyMinutes(weeklyAnalytics.totals.studyMinutes)}</b><span>Masa belajar</span></div>
              <div><b>{weeklyAnalytics.totals.activeDays}</b><span>Hari aktif</span></div>
              <div><b>{formatTrend(weeklyAnalytics.trend.direction)}</b><span>Arah trend</span></div>
            </div>
            <div className="timeline" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.5rem' }}>
              {weeklyAnalytics.daily.map(day => (
                <div className="report-box" key={day.date} style={{ padding: '0.75rem' }}>
                  <h3 style={{ marginBottom: '0.25rem' }}>{day.date.slice(5)}</h3>
                  <b>{day.questions}</b>
                  <span>{day.active ? `${day.accuracy}%` : 'Aktif'}</span>
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
        <p className="eyebrow">Analisis Subjek</p>
        <h2>Analisis Subjek</h2>
        {subjectAnalytics.length ? (
          <>
            <div className="mastery-summary-grid">
              <div><b>{formatSubjectName(bestSubject?.subjectId)}</b><span>Subjek Terbaik</span></div>
              <div><b>{formatSubjectName(weakestSubject?.subjectId)}</b><span>Perlu Diberi Perhatian</span></div>
              <div><b>{subjectAnalytics.length}</b><span>Subjek Dinilai</span></div>
              <div><b>{formatAttentionLevel(selectedAttention?.attentionLevel)}</b><span>Keutamaan</span></div>
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
                  <b>{subject.accuracy}%</b>
                  <div className="mini-progress"><div style={{ width: `${subject.accuracy}%` }} /></div>
                  <span>{subject.totalQuestions} soalan â€¢ {formatAttentionLevel(subject.attentionLevel)}</span>
                </button>
              ))}
            </div>
            {selectedSubjectAnalytics && (
              <div className="timeline">
                <div className="timeline-item">
                  <span>{formatSubjectName(selectedSubjectAnalytics.subjectId)}</span>
                  <b>{formatStatus(selectedSubjectAnalytics.status)}</b>
                  <em>Penguasaan {selectedSubjectAnalytics.mastery}% â€¢ Keyakinan Data {selectedSubjectAnalytics.confidence}%</em>
                  <p>{formatTrend(selectedSubjectAnalytics.trend.direction)} â€¢ {selectedSubjectAnalytics.trend.message}</p>
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
            <div className="parent-summary-grid">
              <div className="parent-metric"><span>Ringkasan Mingguan</span><b>{parentReport.summary}</b><small>{parentReport.generatedAt.slice(0, 10)}</small></div>
              <div className="parent-metric"><span>Pencapaian</span><b>{parentReport.achievements.length}</b><small>{parentReport.achievements[0] || 'Belum cukup data.'}</small></div>
              <div className="parent-metric"><span>Perlu Diperbaiki</span><b>{parentReport.improvements.length}</b><small>{reportWeakTopic}</small></div>
              <div className="parent-metric"><span>Cadangan AI</span><b>{parentReport.estimatedStudyTime} min</b><small>{reportAdvice[0] || 'Cadangan akan muncul apabila data mencukupi.'}</small></div>
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
        <h2>ðŸŽ¤ Sejarah Bacaan</h2>
        <div className="timeline">
          {readingHistory.length ? readingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% â€¢ {item.correct} betul â€¢ {item.missed} tertinggal</em></div>) : <EmptyState title="Belum ada rekod bacaan" message="Sesi bacaan yang disimpan akan muncul di sini untuk semakan ibu bapa." />}
        </div>
      </section>

      <section className="card">
        <h2>ðŸŽ§ Sejarah Mendengar</h2>
        <div className="timeline">
          {listeningHistory.length ? listeningHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% â€¢ {item.correct}/{item.total} betul â€¢ {item.mode}</em></div>) : <EmptyState title="Belum ada rekod mendengar" message="Keputusan latihan mendengar akan muncul selepas percubaan pertama disimpan." />}
        </div>
      </section>

      <section className="card">
        <h2>ðŸ—£ï¸ Sejarah Bertutur</h2>
        <div className="timeline">
          {speakingHistory.length ? speakingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% â€¢ {item.matchedKeywords}/{item.totalKeywords} kata kunci â€¢ {item.mode}</em></div>) : <EmptyState title="Belum ada rekod bertutur" message="Latihan bertutur akan disenaraikan di sini selepas disimpan." />}
        </div>
      </section>

      <section className="card">
        <h2>âœï¸ Sejarah Menulis</h2>
        <div className="timeline">
          {writingHistory.length ? writingHistory.map((item, index) => <div className="timeline-item" key={index}><span>{(item.date || '').slice(0, 10)}</span><b>{item.title} - {item.language}</b><em>{item.score}% â€¢ {item.matchedKeywords}/{item.totalKeywords} kata kunci â€¢ {item.spellingIssues} isu ejaan</em></div>) : <EmptyState title="Belum ada rekod menulis" message="Keputusan latihan menulis akan muncul selepas sesi disimpan." />}
        </div>
      </section>

      <section className="parent-two-col">
        <section className="card">
          <h2>âš ï¸ Topik Lemah</h2>
          <div className="parent-topic-list">
            {weakTopics.length ? weakTopics.slice(0, 8).map(topic => <div className="parent-topic-item" key={`${topic.subjectId}-${topic.topicId}`}><b>{formatTopicName(topic.title || topic.topicId)}</b><span>{formatSubjectName(topic.subject || topic.subjectId)} â€¢ {topic.best}%</span></div>) : <EmptyState title="Belum ada topik lemah" message="Topik lemah akan muncul selepas murid membuat lebih banyak latihan." />}
          </div>
        </section>
        <section className="card">
          <h2>ðŸŒŸ Topik Kuat</h2>
          <div className="parent-topic-list">
            {strongTopics.length ? strongTopics.slice(0, 8).map(topic => <div className="parent-topic-item strong" key={`${topic.subjectId}-${topic.topicId}`}><b>{formatTopicName(topic.title || topic.topicId)}</b><span>{formatSubjectName(topic.subject || topic.subjectId)} â€¢ {topic.best}%</span></div>) : <EmptyState title="Belum ada topik kuat" message="Topik kuat akan muncul apabila skor mencapai tahap penguasaan." />}
          </div>
        </section>
      </section>

      <section className="card">
        <h2>ðŸ† Sejarah UASA</h2>
        <div className="timeline">
          {(profile.uasaHistory || []).length ? profile.uasaHistory.slice(0, 8).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{formatSubjectName(item.subjectShort || item.subjectId)} - Gred {item.grade}</b><em>{item.score}% â€¢ {item.total} soalan</em></div>) : <EmptyState title="Belum ada sejarah UASA" message="Percubaan simulator yang disimpan akan muncul di sini." />}
        </div>
      </section>

      <section className="card">
        <h2>ðŸ“… Aktiviti Terkini</h2>
        <div className="timeline">
          {(profile.history || []).length === 0 ? <EmptyState title="Belum ada aktiviti" message="Latihan terkini dan sesi kemahiran yang disimpan akan muncul di sini." /> : profile.history.slice(0, 10).map((item, index) => <div className="timeline-item" key={index}><span>{item.date}</span><b>{formatSubjectName(item.subject)} - {item.topic}</b><em>{item.percent}% {item.percent >= 100 ? 'Selesai' : 'Betul'}</em></div>)}
        </div>
      </section>

      <section className="card">
        <button type="button" className="full" onClick={() => printParentReport()}>ðŸ–¨ï¸ Cetak Laporan</button>
      </section>
    </main>
  );
}




