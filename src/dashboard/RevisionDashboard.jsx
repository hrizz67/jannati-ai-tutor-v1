import React from 'react';
import { EmptyState } from './dashboardHelpers.jsx';
import { formatDifficulty, formatPriority, formatSubjectName, formatTopicName } from '../utils/displayFormatter';

export default function RevisionDashboard({
  todayRevision,
  revisionDifficulty,
  reviewQueue,
  mixedRevisionSession,
  difficultyPlan,
  adaptivePracticeCount,
  onStartAdaptivePractice
}) {
  return (
    <>
      <section className="card revision-today-card">
        <p className="eyebrow">Hari Ini</p>
        <h2>Hari Ini</h2>
        {todayRevision.totalQuestions > 0 ? (
          <>
            <p>{todayRevision.summary}</p>
            <div className="mastery-summary-grid">
              <div><b>{todayRevision.totalQuestions}</b><span>Soalan Hari Ini</span></div>
              <div><b>{todayRevision.estimatedMinutes}</b><span>Anggaran Masa</span></div>
              <div><b>{todayRevision.subjects.length}</b><span>Subjek</span></div>
              <div><b>{todayRevision.priorityTopics.length}</b><span>Topik Keutamaan</span></div>
              <div><b>{formatDifficulty(revisionDifficulty.recommendedDifficulty)}</b><span>Tahap Cadangan</span></div>
              <div><b className={`difficulty-badge difficulty-${revisionDifficulty.recommendedDifficulty}`}>{formatDifficulty(revisionDifficulty.recommendedDifficulty)}</b><span>Tahap Kesukaran</span></div>
            </div>
            <div className="timeline">
              <div className="timeline-item">
                <span>Sebab Cadangan</span>
                <b>{revisionDifficulty.reason}</b>
                <em>Skor {revisionDifficulty.score}%</em>
                <p>
                  {formatDifficulty('mudah')} {revisionDifficulty.distribution.mudah}% •{' '}
                  {formatDifficulty('sederhana')} {revisionDifficulty.distribution.sederhana}% •{' '}
                  {formatDifficulty('sukar')} {revisionDifficulty.distribution.sukar}%
                </p>
              </div>
            </div>
            <div className="subject-report-grid">
              {todayRevision.subjects.map(subject => (
                <div className="report-box" key={`revision-${subject.subjectId}`}>
                  <h3>{formatSubjectName(subject.subjectId)}</h3>
                  <b>{subject.questions}</b>
                  <div className="mini-progress">
                    <div style={{ width: `${Math.min(100, Math.round((subject.questions / Math.max(1, todayRevision.totalQuestions)) * 100))}%` }} />
                  </div>
                  <span>{subject.topics.length} topik • {subject.estimatedMinutes} min</span>
                </div>
              ))}
            </div>
            <button type="button" className="full" onClick={() => onStartAdaptivePractice(todayRevision.totalQuestions || adaptivePracticeCount)}>Mulakan Ulang Kaji</button>
          </>
        ) : (
          <EmptyState title="Belum ada data pembelajaran." message="Mulakan beberapa latihan dahulu untuk menjana pelan ulang kaji." actionLabel="Mulakan Ulang Kaji" onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />
        )}
      </section>

      <section className="card revision-queue-card">
        <p className="eyebrow">Jadual Ulang Kaji</p>
        <h2>Jadual Ulang Kaji</h2>
        {reviewQueue.dueTopics.length || reviewQueue.upcomingTopics.length || reviewQueue.overdueTopics.length ? (
          <>
            <div className="mastery-summary-grid">
              <div><b>{reviewQueue.dueTopics.length}</b><span>Perlu Hari Ini</span></div>
              <div><b>{reviewQueue.upcomingTopics.length}</b><span>Akan Datang</span></div>
              <div><b>{reviewQueue.overdueTopics.length}</b><span>Tertunggak</span></div>
              <div><b>{reviewQueue.today}</b><span>Tarikh</span></div>
            </div>
            <div className="parent-two-col">
              <section className="card">
                <p className="eyebrow">Perlu Hari Ini</p>
                <div className="timeline">
                  {reviewQueue.dueTopics.length ? reviewQueue.dueTopics.slice(0, 5).map(topic => (
                    <div className="timeline-item" key={`due-${topic.subjectId}-${topic.topicId}`}>
                      <span>{formatSubjectName(topic.subjectId)}</span>
                      <b>{formatTopicName(topic.topicId)}</b>
                      <em>Keutamaan {formatPriority(topic.priority)} • {topic.nextReview}</em>
                      <p>Penguasaan {topic.mastery}% • Keyakinan Data {topic.confidence}%</p>
                    </div>
                  )) : <EmptyState title="Tiada ulang kaji diperlukan hari ini." message="Semua topik telah dijadualkan dengan baik." />}
                </div>
              </section>
              <section className="card">
                <p className="eyebrow">Akan Datang</p>
                <div className="timeline">
                  {reviewQueue.upcomingTopics.length ? reviewQueue.upcomingTopics.slice(0, 5).map(topic => (
                    <div className="timeline-item" key={`upcoming-${topic.subjectId}-${topic.topicId}`}>
                      <span>{formatSubjectName(topic.subjectId)}</span>
                      <b>{formatTopicName(topic.topicId)}</b>
                      <em>Keutamaan {formatPriority(topic.priority)} • {topic.nextReview}</em>
                    </div>
                  )) : <EmptyState title="Tiada topik akan datang." message="Topik baharu akan muncul selepas lebih banyak latihan." />}
                </div>
              </section>
            </div>
            <section className="card">
              <p className="eyebrow">Tertunggak</p>
              <div className="timeline">
                {reviewQueue.overdueTopics.length ? reviewQueue.overdueTopics.slice(0, 5).map(topic => (
                  <div className="timeline-item" key={`overdue-${topic.subjectId}-${topic.topicId}`}>
                    <span>{formatSubjectName(topic.subjectId)}</span>
                    <b>{formatTopicName(topic.topicId)}</b>
                    <em>Keutamaan {formatPriority(topic.priority)} • {topic.nextReview}</em>
                  </div>
                )) : <EmptyState title="Tiada topik tertunggak." message="Teruskan rutin yang stabil." />}
              </div>
            </section>
            <button type="button" className="full" onClick={() => onStartAdaptivePractice(adaptivePracticeCount)}>Mula Latihan AI</button>
          </>
        ) : (
          <EmptyState title="Tiada ulang kaji diperlukan hari ini." message="Mulakan beberapa latihan dahulu untuk menjana jadual ulang kaji." actionLabel="Mulakan Ulang Kaji" onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />
        )}
      </section>

      <section className="card revision-mixed-card">
        <p className="eyebrow">Sesi Ulang Kaji AI</p>
        <h2>Sesi Ulang Kaji AI</h2>
        <div className="mastery-summary-grid">
          <div><b>{mixedRevisionSession.totalQuestions}</b><span>Jumlah Soalan</span></div>
          <div><b>{mixedRevisionSession.subjects.length}</b><span>Subjek</span></div>
          <div><b>{difficultyPlan.distribution.mudah}% / {difficultyPlan.distribution.sederhana}% / {difficultyPlan.distribution.sukar}%</b><span>Tahap</span></div>
          <div><b>{mixedRevisionSession.estimatedMinutes}</b><span>Masa</span></div>
        </div>
        <div className="subject-report-grid">
          {mixedRevisionSession.subjects.map(subject => (
            <div className="report-box" key={`mixed-${subject.subjectId}`}>
              <h3>{formatSubjectName(subject.subjectId)}</h3>
              <b>{subject.questions}</b>
              <div className="mini-progress"><div style={{ width: `${Math.min(100, Math.round((subject.questions / Math.max(1, mixedRevisionSession.totalQuestions)) * 100))}%` }} /></div>
              <span>{subject.topics.length} topik</span>
            </div>
          ))}
        </div>
        <button type="button" className="full" onClick={() => onStartAdaptivePractice(mixedRevisionSession.totalQuestions || adaptivePracticeCount)}>Mula Sesi AI</button>
      </section>
    </>
  );
}
