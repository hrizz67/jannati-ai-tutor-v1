import React, { useEffect, useMemo, useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import IconGlyph from '../components/IconGlyph.jsx';
import SubjectBadge from '../components/SubjectBadge.jsx';
import GameBadge from '../components/GameBadge.jsx';
import bellBadge from '../assets/icons/3d/bell-badge.webp';
import MascotCard from '../components/MascotCard';
import JannaAvatar from '../components/JannaAvatar';
import { getStudentDisplayName } from '../utils/displayFormatter';
import {
  formatStudyTime,
  loadAIMemory,
  buildRecommendation,
  isWeakTopic,
  buildAdaptiveRecommendation,
  buildMasteryMap,
  summarizeMastery,
  MASTERY_STATUS,
  buildLessonPlan,
  getBlockedPrerequisites,
  getDependencyArrow,
  isTopicUnlockedByGraph,
  rankStrongTopics,
  rankWeakTopics,
  explainWeakness,
  generateRecommendation,
  getWeeklySummary,
  getAllSubjectAnalytics,
  getBestSubject,
  getWeakestSubject,
  getSubjectAttentionSummary,
  generateParentReport,
  getTodayRevision,
  getReviewQueue,
  getRecommendedDifficulty,
  buildDifficultyPlan,
  buildMixedRevisionSession,
  buildRevisionCalendar,
  buildStudentIntelligence,
  getStudentLevel
} from '../ai/index.js';
import { recommendMissingSkSp, summarizeUasaCoverage } from '../curriculum/uasaEngine';
import { buildCurriculumCoverage } from '../curriculum/coverageEngine';
import { buildTeacherPortalSnapshot } from '../curriculum/curriculumEngine';
import { PERSONALITY_MESSAGES, getPersonalityForSubject } from '../brand/personalities';
import { formatStatus, formatSubjectName, formatTopicName } from '../utils/displayFormatter';

export function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

export function getStars(score = 0) {
  if (score >= 90) return '★★★';
  if (score >= 70) return '★★';
  if (score >= 50) return '★';
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
  return Math.max(0, Math.min(100, Math.round(total / subject.topics.length)));
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
  const average = rows.length ? Math.max(0, Math.min(100, Math.round(rows.reduce((sum, item) => sum + (item.percent || 0), 0) / rows.length))) : 0;
  return { count: rows.length, average };
}

export function buildParentRecommendation(memory, profile) {
  if (memory.weakTopics?.length) {
    return `Fokus ulang kaji ${memory.weakTopics[0].title}. Topik ini masih perlukan latihan kerana skor terbaik belum mencapai 80%.`;
  }
  if ((profile.history || []).length === 0) {
    return 'Mulakan dengan satu sesi pendek hari ini. Sasarkan 5 hingga 10 soalan dahulu.';
  }
  return 'Kemajuan stabil. Teruskan rutin latihan harian dan cuba pentaksiran sumatif sekali seminggu.';
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
  const percent = Math.max(0, Math.min(100, Number(best) || 0));
  return Math.max(0, Math.round((percent / 100) * (Array.isArray(topic.questions) ? topic.questions.length : 0)));
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

export function EmptyState({ title, message, actionLabel, onAction, showMascot = true }) {
  return <div className="empty-state">{showMascot ? <MascotCard character="janna" mood="encouraging" size="sm" message="Belum ada rekod lagi. Jom mula sedikit demi sedikit." /> : null}<b>{title}</b><p>{message}</p>{actionLabel && onAction && <button type="button" className="secondary" onClick={onAction}>{actionLabel}</button>}</div>;
}

export function DashboardHeader({ profile, level, levelProgress }) {
  const studentYear = profile.year || 'Tahun 2';
  const studentName = getStudentDisplayName(profile, 'Murid');
  return <header className="brand-app-header">
    <div className="brand-student-strip">
      <JannaAvatar size={48} className="student-avatar" />
      <div><b title={studentName}>{studentName}</b><small>{studentYear}</small></div>
      <span className="achievement-chip">Tahap {level}</span>
      <span className="achievement-chip">Bintang {getStars(levelProgress)}</span>
      <span className="achievement-chip">Streak {profile.streak || 0}</span>
      <button type="button" className="icon-button" aria-label="Notifikasi">
        <GameBadge src={bellBadge} />
      </button>
    </div>
  </header>;
}

export function Stat({ icon, label, value }) {
  return <div className="stat"><span className="stat-icon">{icon}</span><b>{value}</b><span>{label}</span></div>;
}

export function SubjectIllustration({ subject }) {
  return <span className="subject-illustration" aria-hidden="true"><SubjectBadge className="subject-illustration-badge" subjectId={subject?.id} /></span>;
}

export function SettingsPanel({ onExportBetaReport, onImportLearningData, onRecoverLearningData, onSyncLearningData, onLoadLearningData, cloudSyncStatus, onReset }) {
  return <section className="card settings-card">
    <p className="eyebrow">Tetapan Beta</p>
    <h2>Kesediaan Beta Tertutup</h2>
    <p>Backup ini mengandungi data pembelajaran mentah untuk pemulihan akaun. Gunakan laporan pilot tanpa nama di bahagian analitik apabila berkongsi data dengan guru.</p>
    <div className="settings-actions">
      <button type="button" className="secondary" onClick={onExportBetaReport}>Backup Data Pembelajaran JSON</button>
      <label className="secondary settings-file-button">Import Data Pembelajaran JSON<input type="file" accept="application/json,.json" onChange={onImportLearningData} /></label>
      <button type="button" className="secondary" onClick={onRecoverLearningData}>Pulihkan Backup Lama</button>
      <button type="button" className="secondary" onClick={onSyncLearningData}>Sync Sekarang</button>
      <button type="button" className="secondary" onClick={onLoadLearningData}>Muat dari Cloud</button>
      <button type="button" className="danger-action" onClick={onReset}>Reset Semua Data</button>
    </div>
    <p className="autosave-note" role="status">Status sync: {({ idle: 'Belum diuji', syncing: 'Sedang sync...', saved: 'Berjaya disimpan', loaded: 'Data cloud dimuat', empty: 'Cloud masih kosong', offline: 'Menunggu sambungan internet', error: 'Sync gagal' })[cloudSyncStatus] || cloudSyncStatus}</p>
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

  return <section className="card learning-path-card"><div className="path-card-head"><div><p className="eyebrow">Laluan Belajar</p><h2><SubjectBadge className="learning-path-subject-badge" subjectId={subject.id} /> {formatSubjectName(subject.id)}</h2><p>{subject.topics.length} topik • {totalQuestions} soalan</p></div><span className="path-summary">{completed}/{subject.topics.length} siap</span></div><div className="learning-path">{sections.map(section => { const isCollapsed = collapsedSections[section.title]; return <section className="path-section" key={`${subject.id}-${section.title}`}><button type="button" className="path-section-toggle" onClick={() => toggleSection(section.title)} aria-expanded={!isCollapsed}><span>{section.title}</span><small>Topik {section.start + 1}-{section.start + section.topics.length}</small><b>{isCollapsed ? '+' : '-'}</b></button>{!isCollapsed && <div className="path-section-body">{section.topics.map((topic, topicOffset) => { const index = section.start + topicOffset; const best = profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0; const mastery = topicMastery?.[progressKey(subject.id, topic.id)]; const masteryStatus = mastery?.status || MASTERY_STATUS.NOT_STARTED; const done = masteryStatus === MASTERY_STATUS.MASTERED; const needRevision = masteryStatus === MASTERY_STATUS.NEEDS_PRACTICE || isWeakTopic(profile, subject, topic); const blockedBy = getBlockedPrerequisites(subject, topic.id, topicMastery); const unlocked = isTopicUnlockedByGraph(subject, topic.id, topicMastery); const dependencyArrow = getDependencyArrow(subject, topic.id); const isNewUnlock = index === nextUnlockedIndex && unlocked && !done; const favId = `${subject.id}_${topic.id}`; const isFav = (profile.favourites || []).some(f => f.id === favId); const questionsCompleted = getTopicQuestionsCompleted(topic, best); const hasResume = resume?.subjectId === subject.id && resume?.topicId === topic.id; const inProgress = hasResume || masteryStatus === MASTERY_STATUS.LEARNING; const status = formatStatus(masteryStatus); const masteryClass = `mastery-${masteryStatus.toLowerCase().replaceAll('_', '-')}`; return <div className="path-row" key={topic.id}>{dependencyArrow && <div className="dependency-arrow"><IconGlyph name="arrowDown" decorative /></div>}<article className={`path-node ${masteryClass} ${done ? 'path-done' : ''} ${unlocked && !done ? 'path-open' : ''} ${!unlocked ? 'path-locked' : ''} ${isNewUnlock ? 'path-new-unlock' : ''} ${needRevision ? 'path-revision' : ''}`}><button type="button" className={`fav-icon ${isFav ? 'active' : ''}`} onClick={() => onToggleFavourite(subject.id, topic.id, topic.title)} aria-label={isFav ? 'Buang kegemaran' : 'Tambah kegemaran'} aria-pressed={isFav}><IconGlyph name="star" active={isFav} decorative /></button><button type="button" className="path-main" onClick={() => unlocked ? (hasResume ? onResume() : onStartTopic(topic)) : alert(`Kuasai syarat terdahulu: ${blockedBy.map(item => formatTopicName(item)).join(', ')}`)}><span className="path-icon"><IconGlyph name={unlocked ? (done ? 'medal' : 'check') : 'lock'} decorative />{!done && unlocked && <span className="path-index">{index + 1}</span>}</span><span className="path-copy"><b>{formatTopicName(topic.title || topic.id)}</b>{needRevision && <em className="revision-badge">Perlu Ulang Kaji</em>}<small>{mastery?.masteryScore || best}% penguasaan • {getStars(best)} • {questionsCompleted}/{topic.questions.length} soalan</small><span className="mini-progress"><span style={{ width: `${mastery?.masteryScore || best}%` }} /></span></span></button><div className="path-actions"><span className={`path-status ${masteryStatus.toLowerCase().replaceAll('_', '-')}`}>{status}</span>{unlocked && <button type="button" className="path-cta" onClick={() => hasResume ? onResume() : onStartTopic(topic)}>{needRevision ? 'Latih Semula' : inProgress ? 'Sambung' : done ? 'Ulang' : 'Mula'}</button>}</div></article>{index < subject.topics.length - 1 && <div className="path-line"><IconGlyph name="arrowDown" decorative /></div>}</div> })}</div>}</section> })}<div className="path-trophy"><IconGlyph name="trophy" decorative /> Tamat {formatSubjectName(subject.id)}</div></div></section>;
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





