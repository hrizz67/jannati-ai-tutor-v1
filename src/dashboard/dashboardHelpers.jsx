import React, { useEffect, useMemo, useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import MascotCard from '../components/MascotCard';
import JannaAvatar from '../components/JannaAvatar';
import { formatStudyTime, loadAIMemory } from '../ai/memoryEngine';
import { buildRecommendation, isWeakTopic } from '../ai/recommendationEngine';
import { buildAdaptiveRecommendation } from '../ai/adaptiveEngine';
import { buildMasteryMap, summarizeMastery, MASTERY_STATUS } from '../ai/adaptive/masteryEngine';
import { buildLessonPlan } from '../ai/adaptive/lessonPlanner';
import { getBlockedPrerequisites, getDependencyArrow, isTopicUnlockedByGraph } from '../ai/adaptive/knowledgeGraph';
import { rankStrongTopics, rankWeakTopics, explainWeakness } from '../ai/adaptive/weakTopicEngine';
import { generateRecommendation } from '../ai/adaptive/recommendationEngine';
import { getWeeklySummary } from '../ai/adaptive/weeklyAnalyticsEngine';
import { getAllSubjectAnalytics, getBestSubject, getWeakestSubject, getSubjectAttentionSummary } from '../ai/adaptive/subjectAnalyticsEngine';
import { generateParentReport } from '../ai/adaptive/parentReportEngine';
import { getTodayRevision } from '../ai/revision/revisionPlannerEngine';
import { getReviewQueue } from '../ai/revision/spacedRepetitionEngine';
import { getRecommendedDifficulty, buildDifficultyPlan } from '../ai/revision/difficultyEngine';
import { buildMixedRevisionSession } from '../ai/revision/mixedRevisionEngine';
import { buildRevisionCalendar } from '../ai/revision/revisionCalendarEngine';
import { buildStudentIntelligence, getStudentLevel } from '../ai/studentIntelligence';
import { recommendMissingSkSp, summarizeUasaCoverage } from '../curriculum/uasaEngine';
import { buildCurriculumCoverage } from '../curriculum/coverageEngine';
import { buildTeacherPortalSnapshot } from '../curriculum/curriculumEngine';
import { PERSONALITY_MESSAGES, getPersonalityForSubject } from '../brand/personalities';
import { formatStatus, formatSubjectName } from '../utils/displayFormatter';

export function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

export function getStars(score = 0) {
  if (score >= 90) return '⭐⭐⭐';
  if (score >= 70) return '⭐⭐';
  if (score >= 50) return '⭐';
  return '☆☆☆';
}

export function getGrade(score = 0) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getSubjectAverage(profile, subject) {
  if (!subject?.topics?.length) return 0;
  const total = subject.topics.reduce((sum, topic) => sum + (profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0), 0);
  return Math.round(total / subject.topics.length);
}

export function hasAdaptiveEvidence(profile = {}) {
  if (!profile || typeof profile !== 'object') return false;
  if ((profile.totalQuestions || 0) > 0) return true;
  if ((profile.correctQuestions || 0) > 0) return true;
  if ((profile.studyMinutes || 0) > 0) return true;
  const topicGroups = Object.values(profile.topics || {});
  return topicGroups.some(subjectTopics => Object.values(subjectTopics || {}).some(record => (record?.total || 0) > 0));
}

export function getAdaptiveBestStreak(profile = {}) {
  return Number(profile.bestStreak || profile.longestStreak || profile.maxStreak || profile.streak || 0);
}

export function getAdaptiveMotivation(streak = 0) {
  if (streak >= 30) return 'Hebat! Teruskan usaha ini.';
  if (streak >= 7) return 'Bagus! Streak kamu semakin kukuh.';
  if (streak >= 3) return 'Bagus, jangan berhenti.';
  return 'Teruskan langkah kecil hari ini.';
}

export function summarizeHistory(history = [], days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const rows = history.filter(item => item.date && new Date(item.date) >= cutoff);
  const average = rows.length ? Math.round(rows.reduce((sum, item) => sum + (item.percent || 0), 0) / rows.length) : 0;
  return { count: rows.length, average };
}

export function buildParentRecommendation(memory, profile) {
  if (memory.weakTopics?.length) {
    return `Fokus ulang kaji ${memory.weakTopics[0].title}. Topik ini masih perlukan latihan kerana skor terbaik belum mencapai 80%.`;
  }
  if ((profile.history || []).length === 0) {
    return 'Mulakan dengan satu sesi pendek hari ini. Sasarkan 5 hingga 10 soalan dahulu.';
  }
  return 'Kemajuan stabil. Teruskan rutin latihan harian dan cuba Simulator UASA sekali seminggu.';
}

export function buildLearningPathSections(topics = []) {
  const sectionSize = 4;
  const sections = [];
  for (let index = 0; index < topics.length; index += sectionSize) {
    sections.push({
      title: `Bahagian ${Math.floor(index / sectionSize) + 1}`,
      start: index,
      topics: topics.slice(index, index + sectionSize)
    });
  }
  return sections;
}

export function getTopicQuestionsCompleted(topic, best = 0) {
  return Math.max(0, Math.round((best / 100) * (Array.isArray(topic.questions) ? topic.questions.length : 0)));
}

export function getRecommendedTopic(profile, subject) {
  if (!subject?.topics?.length) return null;
  const weakTopics = rankWeakTopics(profile, { limit: 1, subjectId: subject.id, includeLowConfidence: true });
  if (weakTopics.length) {
    return subject.topics.find(topic => topic.id === weakTopics[0].topicId) || subject.topics[0];
  }
  return subject.topics.find(topic => (profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0) < 80) || subject.topics[0];
}

export function isTopicUnlocked(profile, subject, index) {
  if (index === 0) return true;
  const topic = subject.topics[index];
  const prev = subject.topics[index - 1];
  const best = profile.progress?.[progressKey(subject.id, prev.id)]?.best || 0;
  return best >= 80 || isWeakTopic(profile, subject, topic);
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return <div className="empty-state"><MascotCard character="janna" mood="encouraging" size="sm" message="Belum ada rekod lagi. Jom mula sedikit demi sedikit." /><b>{title}</b><p>{message}</p>{actionLabel && onAction && <button type="button" className="secondary" onClick={onAction}>{actionLabel}</button>}</div>;
}

export function DashboardHeader({ profile, level, levelProgress }) {
  const studentYear = profile.year || 'Tahun 2';
  return <header className="brand-app-header">
    <div className="brand-app-title"><BrandLogo horizontal size="sm" /><div><p className="eyebrow">{studentYear}</p><h1>Jannati AI Tutor</h1></div></div>
    <div className="brand-student-strip">
      <JannaAvatar size={48} className="student-avatar" />
      <div><b>{profile.name || 'Anak'}</b><small>{studentYear}</small></div>
      <span className="achievement-chip">Tahap {level}</span>
      <span className="achievement-chip">Bintang {getStars(levelProgress)}</span>
      <span className="achievement-chip">Streak {profile.streak || 0}</span>
      <button type="button" className="icon-button" aria-label="Notifikasi">!</button>
    </div>
  </header>;
}

export function Stat({ icon, label, value }) {
  return <div className="stat"><span className="stat-icon">{icon}</span><b>{value}</b><span>{label}</span></div>;
}

export function SubjectIllustration({ subject }) {
  const labels = { bm: 'BM', math: '123', english: 'ABC', sains: 'SCI', islam: 'PI', arab: 'AR', pj: 'PJ', pk: 'PK' };
  return <span className="subject-illustration" aria-hidden="true">{labels[subject.id] || subject.short || subject.icon || formatSubjectName(subject.id)}</span>;
}

export function SettingsPanel({ onExportBetaReport, onReset }) {
  return <section className="card settings-card">
    <p className="eyebrow">Tetapan Beta</p>
    <h2>Kesediaan Beta Tertutup</h2>
    <p>Eksport laporan ujian atau reset semua data pada peranti ini sebelum sesi ujian baharu.</p>
    <div className="settings-actions">
      <button type="button" className="secondary" onClick={onExportBetaReport}>Eksport Laporan Beta JSON</button>
      <button type="button" className="danger-action" onClick={onReset}>Reset Semua Data</button>
    </div>
  </section>;
}

export function LearningPath({ profile, subject, topicMastery, totalQuestions, completed, resume, onStartTopic, onResume, onToggleFavourite }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const sections = buildLearningPathSections(subject.topics);
  const nextUnlockedIndex = subject.topics.findIndex((topic, index) => {
    const best = profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0;
    return isTopicUnlocked(profile, subject, index) && best < 80;
  });

  function toggleSection(sectionTitle) {
    setCollapsedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
  }

  return <section className="card learning-path-card"><div className="path-card-head"><div><p className="eyebrow">Laluan Belajar</p><h2>{subject.icon} {subject.title}</h2><p>{subject.topics.length} topik • {totalQuestions} soalan</p></div><span className="path-summary">{completed}/{subject.topics.length} siap</span></div><div className="learning-path">{sections.map(section => { const isCollapsed = collapsedSections[section.title]; return <section className="path-section" key={`${subject.id}-${section.title}`}><button type="button" className="path-section-toggle" onClick={() => toggleSection(section.title)} aria-expanded={!isCollapsed}><span>{section.title}</span><small>Topik {section.start + 1}-{section.start + section.topics.length}</small><b>{isCollapsed ? '+' : '-'}</b></button>{!isCollapsed && <div className="path-section-body">{section.topics.map((topic, topicOffset) => { const index = section.start + topicOffset; const best = profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0; const mastery = topicMastery?.[progressKey(subject.id, topic.id)]; const masteryStatus = mastery?.status || MASTERY_STATUS.NOT_STARTED; const done = masteryStatus === MASTERY_STATUS.MASTERED; const needRevision = masteryStatus === MASTERY_STATUS.NEEDS_PRACTICE || isWeakTopic(profile, subject, topic); const blockedBy = getBlockedPrerequisites(subject, topic.id, topicMastery); const unlocked = isTopicUnlockedByGraph(subject, topic.id, topicMastery); const dependencyArrow = getDependencyArrow(subject, topic.id); const isNewUnlock = index === nextUnlockedIndex && unlocked && !done; const favId = `${subject.id}_${topic.id}`; const isFav = (profile.favourites || []).some(f => f.id === favId); const questionsCompleted = getTopicQuestionsCompleted(topic, best); const hasResume = resume?.subjectId === subject.id && resume?.topicId === topic.id; const inProgress = hasResume || masteryStatus === MASTERY_STATUS.LEARNING; const status = formatStatus(masteryStatus); const masteryClass = `mastery-${masteryStatus.toLowerCase().replaceAll('_', '-')}`; return <div className="path-row" key={topic.id}>{dependencyArrow && <div className="dependency-arrow">{dependencyArrow}</div>}<article className={`path-node ${masteryClass} ${done ? 'path-done' : ''} ${unlocked && !done ? 'path-open' : ''} ${!unlocked ? 'path-locked' : ''} ${isNewUnlock ? 'path-new-unlock' : ''} ${needRevision ? 'path-revision' : ''}`}><button type="button" className={`fav-icon ${isFav ? 'active' : ''}`} onClick={() => onToggleFavourite(subject.id, topic.id, topic.title)} aria-label={isFav ? 'Buang kegemaran' : 'Tambah kegemaran'} aria-pressed={isFav}>{isFav ? '❤️' : '♡'}</button><button type="button" className="path-main" onClick={() => unlocked ? (hasResume ? onResume() : onStartTopic(topic)) : alert(`Kuasai syarat terdahulu: ${blockedBy.join(', ')}`)}><span className="path-icon">{unlocked ? (done ? '🏅' : index + 1) : '🔒'}</span><span className="path-copy"><b>{topic.title}</b>{needRevision && <em className="revision-badge">Perlu Ulang Kaji</em>}<small>{mastery?.masteryScore || best}% penguasaan • {getStars(best)} • {questionsCompleted}/{topic.questions.length} soalan</small><span className="mini-progress"><span style={{ width: `${mastery?.masteryScore || best}%` }} /></span></span></button><div className="path-actions"><span className={`path-status ${masteryStatus.toLowerCase().replaceAll('_', '-')}`}>{status}</span>{unlocked && <button type="button" className="path-cta" onClick={() => hasResume ? onResume() : onStartTopic(topic)}>{needRevision ? 'Latih Semula' : inProgress ? 'Sambung' : done ? 'Ulang' : 'Mula'}</button>}</div></article>{index < subject.topics.length - 1 && <div className="path-line">↓</div>}</div> })}</div>}</section> })}<div className="path-trophy">🏆 Tamat {subject.short}</div></div></section>;
}

export function DashboardLayout({ sidebar, children, className = '' }) {
  return <main className={`dashboard-shell ${className}`.trim()}>{sidebar}{children}</main>;
}

export {
  buildAdaptiveRecommendation,
  buildCurriculumCoverage,
  buildDifficultyPlan,
  buildLessonPlan,
  buildMasteryMap,
  buildMixedRevisionSession,
  buildRevisionCalendar,
  buildStudentIntelligence,
  buildTeacherPortalSnapshot,
  buildRecommendation,
  generateParentReport,
  generateRecommendation,
  getAllSubjectAnalytics,
  getBestSubject,
  getBlockedPrerequisites,
  getDependencyArrow,
  getRecommendedDifficulty,
  getReviewQueue,
  getSubjectAttentionSummary,
  getStudentLevel,
  getTodayRevision,
  getWeakestSubject,
  getWeeklySummary,
  recommendMissingSkSp,
  summarizeMastery,
  summarizeUasaCoverage,
  PERSONALITY_MESSAGES,
  getPersonalityForSubject,
  MASTERY_STATUS,
  formatStudyTime,
  loadAIMemory
};
