import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import MascotCard from '../components/MascotCard';
import IconGlyph, { SubjectIcon } from '../components/IconGlyph.jsx';
import JannaAvatar from '../components/JannaAvatar';
import GamificationSummary from '../components/GamificationSummary.jsx';
import ResumePracticeCard from '../components/ResumePracticeCard.jsx';
import VoiceButton from '../components/VoiceButton.jsx';
import DashboardLayout from './DashboardLayout.jsx';
const StudentDashboard = React.lazy(() => import('./StudentDashboard.jsx'));
const RevisionDashboard = React.lazy(() => import('./RevisionDashboard.jsx'));
const AnalyticsDashboard = React.lazy(() => import('./AnalyticsDashboard.jsx'));
import { buildRecommendation, buildAdaptiveRecommendation, loadAIMemory, buildStudentIntelligence, buildMasteryMap, summarizeMastery, buildLessonPlan } from '../ai/index.js';
import { buildCurriculumCoverage, getCurriculumCoverageState } from '../curriculum/coverageEngine';
import { recommendMissingSkSp } from '../curriculum/uasaEngine';
import { EmptyState, getRecommendedTopic, getSubjectAverage, progressKey, todayKey } from './dashboardHelpers.jsx';
import { getPersonalityForSubject } from '../brand/personalities';
import {
  clampPercent,
  formatDuration,
  formatDurationLabel,
  formatFallbackState,
  formatPriority,
  formatRecommendationCta,
  formatResumeTitle,
  formatScopeLabel,
  formatStatus,
  formatStreakLabel,
  formatSubjectName,
  formatSubjectYearLabel,
  formatTopicName,
  getStudentDisplayName,
  isCrossSubjectTarget
} from '../utils/displayFormatter';
import { getAnalyticsNoData, getCanonicalAnalytics } from '../utils/canonicalAnalytics.js';
import { createCanonicalGamification } from '../utils/canonicalGamification.js';
import { isInteractiveQuestion, prioritizeInteractiveQuestions } from '../utils/interactiveQuestion.js';
import tutorAiBadge from '../assets/icons/3d/tutor-ai-badge.webp';
import uasaBadge from '../assets/icons/3d/uasa-badge.webp';
import ibuBapaBadge from '../assets/icons/3d/ibu-bapa-badge.webp';
import homeBadge from '../assets/icons/3d/home-badge.webp';
import notaBadge from '../assets/icons/3d/nota-badge.webp';
import bukuTeksBadge from '../assets/icons/3d/buku-teks-badge.webp';
import bmBadge from '../assets/icons/3d/bm-badge.webp';
import mathBadge from '../assets/icons/3d/math-badge.webp';
import englishBadge from '../assets/icons/3d/english-badge.webp';
import sainsBadge from '../assets/icons/3d/sains-badge.webp';
import arabBadge from '../assets/icons/3d/arab-badge.webp';
import islamBadge from '../assets/icons/3d/islam-badge.webp';
import pjBadge from '../assets/icons/3d/pj-badge.webp';
import pkBadge from '../assets/icons/3d/pk-badge.webp';
import bacaanBadge from '../assets/icons/3d/bacaan-badge.webp';
import mendengarBadge from '../assets/icons/3d/mendengar-badge.webp';
import bertuturBadge from '../assets/icons/3d/bertutur-badge.webp';
import menulisBadge from '../assets/icons/3d/menulis-badge.webp';
import ganjaranBadge from '../assets/icons/3d/ganjaran-badge.webp';
import targetBadge from '../assets/icons/3d/target-badge.webp';
import clockBadge from '../assets/icons/3d/clock-badge.webp';
import fireBadge from '../assets/icons/3d/fire-badge.webp';
import bellBadge from '../assets/icons/3d/bell-badge.webp';

// Legacy motion tokens remain documented while the resume UI uses the 3D replacements: IconGlyph name="play" and IconGlyph name="repeat".

function GameBadge({ src, alt = '', className = '' }) {
  return <img className={`game-badge-icon ${className}`.trim()} src={src} alt={alt} aria-hidden={!alt} loading="lazy" decoding="async" draggable="false" />;
}

const subjectBadges = { bm: bmBadge, math: mathBadge, english: englishBadge, sains: sainsBadge, arab: arabBadge, islam: islamBadge, pj: pjBadge, pk: pkBadge };

function SubjectBadge({ subjectId }) {
  const key = String(subjectId || '').toLowerCase();
  const source = subjectBadges[key];
  return source ? <GameBadge src={source} /> : <SubjectIcon subjectId={subjectId} size={18} />;
}

function ChildProfileSwitcher({ profiles = [], activeChildId = '', onSelectChild, onCreateChild, onDeleteChild }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [year, setYear] = useState('Tahun 2');
  const activeChild = profiles.find(child => child.id === activeChildId) || profiles[0];

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    const created = onCreateChild?.({ name: name.trim(), year, avatar: 'janna' });
    if (created === false) return;
    setName('');
    setYear('Tahun 2');
    setIsAdding(false);
  }

  return (
    <section className="child-profile-switcher" aria-label="Profil anak">
      <div className="child-profile-switcher-heading">
        <div><p className="eyebrow">Akaun keluarga</p><b>Profil anak</b><small>{activeChild?.name || 'Murid'} · {activeChild?.year || 'Tahun 2'}</small></div>
        <button type="button" className="secondary" onClick={() => setIsAdding(value => !value)}>{isAdding ? 'Tutup' : 'Tambah anak'}</button>
      </div>
      <select aria-label="Pilih profil anak" value={activeChildId || activeChild?.id || ''} onChange={event => onSelectChild?.(event.target.value)}>
        {profiles.map(child => <option key={child.id} value={child.id}>{child.name} · {child.year || 'Tahun 2'}</option>)}
      </select>
      {profiles.length > 1 ? <button type="button" className="secondary child-profile-delete" disabled aria-disabled="true" title="Pemadaman dihentikan sementara sehingga arkib server dan fungsi undo tersedia.">Profil dilindungi · tidak boleh dipadam</button> : null}
      {isAdding ? (
        <form className="child-profile-form" onSubmit={submit}>
          <label>Nama anak<input value={name} onChange={event => setName(event.target.value)} placeholder="Contoh: Aina" autoFocus /></label>
          <label>Tahun<select value={year} onChange={event => setYear(event.target.value)}>{['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6'].map(item => <option key={item}>{item}</option>)}</select></label>
          <button type="button" onClick={() => submit({ preventDefault: () => {} })} disabled={!name.trim()}>Simpan profil anak</button>
        </form>
      ) : null}
    </section>
  );
}

function getCloudSyncPresentation(hasAccountSession, status, revision = 0, serverUpdatedAt = '') {
  if (!hasAccountSession) return { label: 'Cloud tidak aktif', tone: 'inactive', detail: 'Log masuk akaun yang sama pada desktop dan mobile untuk sync.', retryable: true };
  const presentation = {
    syncing: { label: 'Sedang sync', tone: 'syncing', detail: 'Perubahan sedang dihantar menggunakan revision server.', retryable: false },
    saved: { label: 'Telah sync', tone: 'saved', detail: 'Server telah mengakui revision terkini peranti ini.', retryable: false },
    loaded: { label: 'Cloud terkini', tone: 'saved', detail: 'Peranti ini menggunakan revision cloud terkini.', retryable: false },
    empty: { label: 'Cloud baharu', tone: 'syncing', detail: 'Data pertama sedang disediakan untuk akaun ini.', retryable: false },
    offline: { label: 'Menunggu internet', tone: 'offline', detail: 'Data kekal dalam outbox peranti. Tekan untuk cuba semula.', retryable: true },
    error: { label: 'Sync gagal', tone: 'error', detail: 'Tekan untuk cuba menghantar perubahan tertangguh sahaja.', retryable: true },
    conflict: { label: 'Menyelaras konflik', tone: 'syncing', detail: 'Server mengesan revision baharu dan sedang menyelaraskan semula.', retryable: true },
    'upgrade-required': { label: 'Sync dilindungi', tone: 'offline', detail: 'Migration Data Integrity v3 perlu dipasang. Perubahan tidak akan dihantar melalui RPC lama.', retryable: false },
    idle: { label: 'Cloud bersedia', tone: 'idle', detail: 'Sync revisioned aktif untuk akaun ini.', retryable: false }
  }[status] || { label: 'Cloud bersedia', tone: 'idle', detail: 'Sync revisioned aktif untuk akaun ini.', retryable: false };
  const safeRevision = Math.max(0, Number(revision) || 0);
  const updatedLabel = serverUpdatedAt && !Number.isNaN(Date.parse(serverUpdatedAt))
    ? new Date(serverUpdatedAt).toLocaleString('ms-MY')
    : '';
  if (safeRevision > 0) {
    presentation.label = `${presentation.label} · r${safeRevision}`;
    presentation.detail = `${presentation.detail} Revision server: ${safeRevision}${updatedLabel ? ` · ${updatedLabel}` : ''}.`;
  }
  return presentation;
}

export default function HomeDashboard(props) {
  const {
    profile,
    accessProfile,
    adaptiveProfile,
    subjectList,
    allSubjects,
    selectedSubject,
    selectedSubjectId,
    totalQuestions,
    personality,
    gamificationProfile,
    resume,
    dailyChallenge,
    voiceGreetingText,
    voiceMissionText,
    adaptivePracticePreview,
    adaptivePracticeCount,
    studyPlan,
    predictionGreeting,
    onAdaptivePracticeCountChange,
    onSelectSubject,
    onStartTopic,
    onStartAdaptiveLesson,
    onStartAdaptivePractice,
    onStartBacaan,
    onStartMendengar,
    onStartBertutur,
    onStartMenulis,
    onOpenParent,
    onOpenUasa,
    onOpenAi,
    onReset,
    onExportBetaReport,
    onImportLearningData,
    onRecoverLearningData,
    onSyncLearningData,
    cloudSyncStatus,
    cloudSyncRevision,
    cloudSyncUpdatedAt,
    onLoadLearningData,
    onResume,
    onRestartResume,
    onCompleteDaily,
    onToggleFavourite,
    onLogout,
    onExitLocalProfile,
    hasAccountSession,
    childProfiles,
    activeChildId,
    onSelectChild,
    onCreateChild,
    onDeleteChild
  } = props;

  const adaptiveStore = adaptiveProfile || profile;
  const studentName = getStudentDisplayName([profile, adaptiveProfile], 'Murid');
  const isPremiumAccount = Boolean(hasAccountSession && accessProfile?.isPremium);
  const accessLabel = accessProfile?.accessLabel || (isPremiumAccount ? 'Premium aktif' : 'Versi Free');
  const cloudSyncPresentation = getCloudSyncPresentation(hasAccountSession, cloudSyncStatus, cloudSyncRevision, cloudSyncUpdatedAt);
  const cloudSyncActionEnabled = !hasAccountSession || cloudSyncPresentation.retryable;
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const subjectRailRef = useRef(null);
  const subjectButtonRefs = useRef(new Map());
  const topics = selectedSubject?.topics || [];
  const reviewedInteractiveActivitySource = topics.find(topic => (
    (topic.questions || []).some(question => question.interaction && isInteractiveQuestion(question))
  ));
  const interactiveActivitySource = reviewedInteractiveActivitySource || topics.find(topic => (
    (topic.questions || []).some(isInteractiveQuestion)
  )) || null;
  const interactiveActivityTopic = interactiveActivitySource ? {
    ...interactiveActivitySource,
    questions: prioritizeInteractiveQuestions(interactiveActivitySource.questions)
  } : null;
  const aiMemory = useMemo(() => loadAIMemory(), [profile.history, profile.progress, profile.xp]);
  const adaptiveSubjects = useMemo(() => (Array.isArray(allSubjects) && allSubjects.length ? allSubjects : [selectedSubject].filter(Boolean)), [allSubjects, selectedSubject]);
  const visibleSubjects = useMemo(() => (Array.isArray(subjectList) && subjectList.length ? subjectList : adaptiveSubjects), [subjectList, adaptiveSubjects]);
  const studentCore = useMemo(() => buildStudentIntelligence(profile, adaptiveSubjects, aiMemory), [profile, adaptiveSubjects, aiMemory]);
  const recommended = getRecommendedTopic(profile, selectedSubject);
  const today = todayKey();
  const dailyDone = Boolean(profile.daily?.[today]?.completed);
  const completed = topics.filter(topic => (profile.progress?.[progressKey(selectedSubject?.id, topic.id)]?.best || 0) >= 80).length;
  const averageScore = getSubjectAverage(profile, selectedSubject);
  const aiRecommendation = profile.recommendations?.[selectedSubject?.id] || buildRecommendation(profile, selectedSubject || {});
  const recommendedPracticeTopic = topics.find(topic => topic.id === aiRecommendation.recommendedTopicId) || recommended;
  const topicMastery = useMemo(() => ({ ...(aiMemory.topicMastery || {}), ...buildMasteryMap(profile, adaptiveSubjects, aiMemory) }), [profile, adaptiveSubjects, aiMemory]);
  const masterySummary = useMemo(() => summarizeMastery(topicMastery), [topicMastery]);
  const effectiveMemory = useMemo(() => ({ ...aiMemory, topicMastery, masterySummary, mastery: masterySummary.masteryScore }), [aiMemory, topicMastery, masterySummary]);
  const smartLesson = useMemo(() => buildAdaptiveRecommendation({ profile, memory: effectiveMemory, subjects: adaptiveSubjects }), [profile, effectiveMemory, adaptiveSubjects]);
  const learningJourney = useMemo(() => buildLessonPlan({ subjects: adaptiveSubjects, topicMastery }), [adaptiveSubjects, topicMastery]);
  const todayLesson = learningJourney.todayLesson || null;
  const smartTargetId = todayLesson?.subjectId || smartLesson?.nextSubject || '';
  const smartSubject = adaptiveSubjects.find(subject => subject.id === smartTargetId) || selectedSubject;
  const smartTopic = smartSubject?.topics?.find(topic => topic.id === smartLesson?.nextTopic);
  const dashboardCharacter = getPersonalityForSubject(selectedSubject || {});
  const welcomeTopic = recommended?.title || learningJourney?.todayLesson?.title || smartTopic?.title || 'topik pilihan';
  const personalityGreeting = personality?.greeting || predictionGreeting;
  const personalityMotivation = personality?.motivation || `Hari ini kita akan belajar ${welcomeTopic}. Jom mulakan!`;
  const personalityMood = personality?.emotion?.label || 'happy';
  const curriculumCoverage = aiMemory.curriculumCoverage || buildCurriculumCoverage(profile, adaptiveSubjects);
  const canonicalAnalytics = useMemo(() => getCanonicalAnalytics({ profile, adaptiveProfile: adaptiveStore, selectedSubject }), [profile, adaptiveStore, selectedSubject]);
  const canonicalGamification = useMemo(() => createCanonicalGamification({
    profile,
    adaptiveProfile: adaptiveStore,
    gamificationProfile,
    subjectId: selectedSubjectId
  }), [profile, adaptiveStore, gamificationProfile, selectedSubjectId]);
  const dashboardNoData = canonicalAnalytics.noData || getAnalyticsNoData(selectedSubject?.id ? 'subject-not-started' : 'no-attempts');
  const missingSkSpRecommendation = recommendMissingSkSp(curriculumCoverage);
  const curriculumNoMappingMessage = 'Data liputan kurikulum belum tersedia untuk subjek ini.';
  const curriculumCoverageState = useMemo(() => getCurriculumCoverageState(curriculumCoverage.summary), [curriculumCoverage.summary]);
  const selectedSubjectIndex = useMemo(() => visibleSubjects.findIndex(subject => subject?.id === selectedSubjectId), [visibleSubjects, selectedSubjectId]);
  const smartTargetSubjectId = todayLesson?.subjectId || smartLesson?.nextSubject || smartLesson?.subjectId || smartSubject?.id || selectedSubjectId || '';
  const smartTargetTopicLabel = todayLesson?.title || smartTopic?.title || formatTopicName(smartLesson?.nextTopic || smartLesson?.topicId || '');
  const smartTargetSubjectLabel = formatSubjectYearLabel(smartTargetSubjectId || smartSubject?.id || selectedSubjectId);
  const smartCrossSubject = isCrossSubjectTarget(selectedSubjectId, smartTargetSubjectId);
  const recommendationMinutes = adaptivePracticePreview?.summary?.estimatedMinutes || 0;
  const recommendationUsesResume = Boolean(resume && !resume.completed && resume.subjectId === selectedSubjectId && resume.topicId === recommendedPracticeTopic?.id);
  const resumeTitle = resume ? formatResumeTitle(resume) : '';
  const resumeCrossSubjectLabel = isCrossSubjectTarget(selectedSubjectId, resume?.subjectId) ? 'Sambung lintas subjek' : '';
  const aiRecommendationCta = formatRecommendationCta({
    reason: aiRecommendation?.reason,
    recommendationKey: /^Ulang/i.test(aiRecommendation?.reason || '') ? 'review' : '',
    isNewTopic: /^Cuba topik baharu:/i.test(aiRecommendation?.reason || ''),
    isIncompleteSession: recommendationUsesResume,
    defaultLabel: 'Mula Latihan'
  });
  const smartLessonCta = formatRecommendationCta({
    subjectId: smartTargetSubjectId,
    isCrossSubject: smartCrossSubject,
    reason: smartLesson?.reason,
    recommendationKey: smartLesson?.recommendationKey,
    defaultLabel: 'Mula Laluan'
  });

  useEffect(() => {
    const selectedElement = subjectButtonRefs.current.get(selectedSubjectId);
    if (selectedElement && typeof selectedElement.scrollIntoView === 'function') {
      selectedElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [selectedSubjectId, prefersReducedMotion]);

  function scrollSubjectSwitcher(delta = 1) {
    const rail = subjectRailRef.current;
    if (!rail) return;
    const distance = Math.max(rail.clientWidth * 0.8, 240) * delta;
    rail.scrollBy({ left: distance, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function goToAdjacentSubject(delta = 1) {
    if (!visibleSubjects.length) return;
    const nextIndex = Math.max(0, Math.min(visibleSubjects.length - 1, (selectedSubjectIndex >= 0 ? selectedSubjectIndex : 0) + delta));
    const nextSubject = visibleSubjects[nextIndex];
    if (nextSubject?.id && nextSubject.id !== selectedSubjectId) {
      onSelectSubject(nextSubject.id);
    } else {
      scrollSubjectSwitcher(delta);
    }
  }

  const studentData = {
    profile,
    adaptiveProfile: adaptiveStore,
    gamificationProfile,
    canonicalGamification,
    adaptiveHasEvidence: (adaptiveStore.totalQuestions || 0) > 0 || (adaptiveStore.correctQuestions || 0) > 0 || (adaptiveStore.studyMinutes || 0) > 0,
    overallAccuracy: adaptiveStore.totalQuestions ? Math.round((adaptiveStore.correctQuestions / adaptiveStore.totalQuestions) * 100) : 0,
    adaptivePracticeCount,
    adaptivePracticePreview,
    adaptiveWeakTopics: [],
    adaptiveStrongTopics: [],
    adaptiveRecommendation: { plan: { totalQuestions: 0, estimatedMinutes: 0 }, summary: { weakTopics: 0, strongTopics: 0, recommendedFocus: [] }, subjectRows: [] },
    adaptiveRecommendationFocus: null,
    streakBest: Number(adaptiveStore.bestStreak || adaptiveStore.longestStreak || adaptiveStore.maxStreak || adaptiveStore.streak || 0),
    streakMessage: 'Teruskan langkah kecil hari ini.',
    onStartAdaptivePractice,
    canonicalAnalytics
  };

  const revisionData = {
    todayRevision: { totalQuestions: 0, summary: 'Tiada data', estimatedMinutes: 0, subjects: [], priorityTopics: [] },
    revisionDifficulty: { recommendedDifficulty: 'mudah', reason: '-', score: 0, distribution: { mudah: 0, sederhana: 0, sukar: 0 } },
    reviewQueue: { dueTopics: [], upcomingTopics: [], overdueTopics: [], today },
    mixedRevisionSession: { totalQuestions: adaptivePracticeCount, subjects: [], estimatedMinutes: 0 },
    difficultyPlan: { distribution: { mudah: 0, sederhana: 0, sukar: 0 } },
    revisionCalendar: { calendar: [], summary: { studyDays: 0, revisionDays: 0, missedDays: 0, totalDays: 0 }, weeklyGoals: { questions: 0, studyDays: 0, accuracy: 0, studyMinutes: 0 }, goalProgress: { questions: 0, studyDays: 0, accuracy: 0, studyMinutes: 0 }, milestones: [] },
    adaptivePracticeCount,
    onStartAdaptivePractice
  };

  const analyticsData = {
    profile,
    canonicalAnalytics,
    canonicalGamification,
    adaptiveProfile: adaptiveStore,
    gamificationProfile,
    weeklyAnalytics: { totals: { questions: 0, accuracy: 0, studyMinutes: 0, activeDays: 0 }, daily: [], trend: { direction: 'insufficient_data', message: 'Belum ada data.' } },
    statsCards: [
      { label: 'XP', value: canonicalGamification.globalXp, icon: <GameBadge src={ganjaranBadge} /> },
      { label: 'Tahap', value: canonicalGamification.globalLevel, icon: <GameBadge src={uasaBadge} /> },
      { label: 'Soalan', value: adaptiveStore.totalQuestions || 0, icon: <GameBadge src={bukuTeksBadge} /> },
      { label: 'Ketepatan', value: `${clampPercent(studentData.overallAccuracy)}%`, icon: <GameBadge src={targetBadge} /> },
      { label: 'Masa Belajar', value: formatDuration(adaptiveStore.studyMinutes || 0, { unit: 'minutes' }), icon: <GameBadge src={clockBadge} /> },
      { label: 'Streak', value: canonicalGamification.currentStreak, icon: <GameBadge src={fireBadge} /> }
    ],
    studentCore,
    masterySummary,
    curriculumCoverage: { summary: { coveragePercent: 0, masteryPercent: 0, missing: 0, estimatedMinutes: 0 } },
    missingSkSpRecommendation,
    smartLesson,
    learningJourney,
    smartSubject,
    smartTopic,
    aiMemory,
    averageScore,
    completed,
    readingHistory: aiMemory.readingHistory || [],
    listeningHistory: aiMemory.listeningHistory || [],
    speakingHistory: aiMemory.speakingHistory || [],
    writingHistory: aiMemory.writingHistory || [],
    dailyChallenge,
    dailyDone,
    adaptivePracticePreview,
    adaptivePracticeCount,
    onAdaptivePracticeCountChange,
    onStartAdaptivePractice,
    onStartAdaptiveLesson,
    onStartBacaan,
    onStartMendengar,
    onStartBertutur,
    onStartMenulis,
    onCompleteDaily,
    onOpenUasa,
    onOpenParent,
    onOpenAi,
    onReset,
    onExportBetaReport,
    onImportLearningData,
    onRecoverLearningData,
    onSyncLearningData,
    cloudSyncStatus,
    onLoadLearningData,
    dashboardCharacter,
    welcomeTopic,
    selectedSubject,
    selectedSubjectId,
    subjectList,
    allSubjects,
    totalQuestions,
    onSelectSubject,
    onStartTopic,
    onToggleFavourite
  };

  return (
    <DashboardLayout>
      <aside className="sidebar">
        <div className="brand"><BrandLogo iconOnly /><div><h2>Jannati</h2><p>AI Tutor Rasmi</p></div></div>
        <button type="button" className="nav active"><GameBadge src={homeBadge} /> <span>Papan Utama</span></button>
        <button type="button" className="nav nav-learning" onClick={() => props.onOpenLearning?.('nota')}><GameBadge src={notaBadge} /> <span>Nota</span></button>
        <button type="button" className="nav nav-learning" onClick={() => props.onOpenLearning?.('buku')}><GameBadge src={bukuTeksBadge} /> <span>Buku Teks</span></button>
        <button type="button" className="nav" onClick={onOpenAi}><GameBadge src={tutorAiBadge} /> <span>Tutor AI</span></button>
        <button type="button" className="nav" onClick={onOpenUasa}><GameBadge src={uasaBadge} /> <span>Pentaksiran</span></button>
        <button type="button" className="nav" onClick={onOpenParent}><GameBadge src={ibuBapaBadge} /> <span>Ibu Bapa</span></button>
      </aside>
      <section className="dashboard-main">
        <header className="brand-app-header">
          <div className="brand-student-strip">
            <div className="student-identity">
              <JannaAvatar size={48} className="student-avatar" />
              <div className="student-identity-copy"><b title={studentName}>{studentName}</b><small>{profile?.year || 'Tahun 2'}</small></div>
            </div>
            <div className="student-achievement-chips">
              <span className="achievement-chip">Tahap {canonicalGamification.globalLevel}</span>
              <span className="achievement-chip">XP {canonicalGamification.globalXp}</span>
              {canonicalGamification.starCount > 0 ? <span className="achievement-chip">Bintang {canonicalGamification.starCount}</span> : null}
              <span className="achievement-chip">Streak {canonicalGamification.currentStreak}</span>
              <span className="achievement-chip">Akurasi {clampPercent(studentData.overallAccuracy)}%</span>
              <span className={`access-chip ${isPremiumAccount ? 'premium' : 'free'}`} title="Status akses akaun">
                <span aria-hidden="true">{isPremiumAccount ? '✦' : '•'}</span>{accessLabel}
              </span>
              <button type="button" className={`cloud-sync-chip ${cloudSyncPresentation.tone}`} title={cloudSyncPresentation.detail} onClick={hasAccountSession ? onSyncLearningData : onLogout} disabled={!cloudSyncActionEnabled}>{cloudSyncPresentation.label}</button>
              <button type="button" className="icon-button" aria-label="Notifikasi"><GameBadge src={bellBadge} /></button>
              {hasAccountSession
                ? <button type="button" className="secondary header-account-action" onClick={onLogout}>Log keluar</button>
                : <>
                  <button type="button" className="secondary header-account-action" onClick={onLogout}>Log masuk untuk Sync</button>
                  <button type="button" className="secondary header-account-action local-exit-action" onClick={onExitLocalProfile}>Keluar Free</button>
                </>}
            </div>
          </div>
        </header>
        {childProfiles?.length ? <ChildProfileSwitcher profiles={childProfiles} activeChildId={activeChildId} onSelectChild={onSelectChild} onCreateChild={onCreateChild} onDeleteChild={onDeleteChild} /> : null}
        <section className="profile hero-card"><MascotCard character={dashboardCharacter} mood={personalityMood} size="md" animation="gentle" message={personalityMotivation} /><div><h2>{personalityGreeting || `Assalamualaikum, ${studentName}`}</h2><p>{personalityMotivation}</p><VoiceButton text={voiceGreetingText || personalityGreeting || personalityMotivation} label="Dengar Salam" title="Dengar salam" /></div></section>
        <GamificationSummary profile={gamificationProfile} canonical={canonicalGamification} className="home-gamification-summary" />
        <div className="subject-rail-wrap">
        <div className="subject-quick-switch-shell">
          <button
            type="button"
            className="subject-switch-arrow"
            aria-label="Subjek sebelumnya"
            disabled={selectedSubjectIndex <= 0}
            onClick={() => goToAdjacentSubject(-1)}
          >
            {'\u2039'}
          </button>
          <nav className="subject-quick-switch" aria-label="Pilih subjek" ref={subjectRailRef}>
          {visibleSubjects.map(subject => {
            const subjectTitle = formatSubjectName(subject?.title || subject?.id);
            const isActive = selectedSubjectId === subject?.id;
            return (
              <button
                key={subject?.id}
                type="button"
                className={`subject-quick-pill subject-quick-pill--${subject?.id || 'default'} ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
                onClick={() => onSelectSubject(subject?.id)}
                ref={element => {
                  if (element) {
                    subjectButtonRefs.current.set(subject?.id, element);
                  } else if (subject?.id) {
                    subjectButtonRefs.current.delete(subject.id);
                  }
                }}
              >
                <span className="subject-quick-pill-icon" aria-hidden="true"><SubjectBadge subjectId={subject?.id} /></span>
                <span className="subject-quick-pill-text">{subjectTitle}</span>
              </button>
            );
          })}
          </nav>
          <button
            type="button"
            className="subject-switch-arrow"
            aria-label="Subjek seterusnya"
            disabled={selectedSubjectIndex < 0 || selectedSubjectIndex >= visibleSubjects.length - 1}
            onClick={() => goToAdjacentSubject(1)}
          >
            {'\u203A'}
          </button>
        </div>
        <p className="subject-rail-hint" aria-live="polite">Leret atau guna anak panah untuk subjek lain.</p>
        </div>
        <Suspense fallback={<section className="card"><p className="eyebrow">Memuat</p><h2><IconGlyph name="spark" motion="load" /> <span>Dashboard sedang dimuat</span></h2><p>Sebentar ya, kandungan sedang disiapkan.</p></section>}>
          <details className="dashboard-disclosure" open>
            <summary><span>Ringkasan Murid</span><small>Maklumat utama, prestasi dan cadangan hari ini</small></summary>
            <StudentDashboard {...studentData} />
          </details>
          <details className="dashboard-disclosure">
            <summary><span>Jadual Ulang Kaji</span><small>Topik perlu ulang kaji dan keutamaan harian</small></summary>
            <RevisionDashboard {...revisionData} />
          </details>
          <details className="dashboard-disclosure">
            <summary><span>Analitik & Kemajuan</span><small>Subjek, kemahiran bahasa, gamifikasi dan pentaksiran</small></summary>
            <AnalyticsDashboard {...analyticsData} />
          </details>
        </Suspense>

        <ResumePracticeCard resume={resume} selectedSubjectId={selectedSubjectId} resumeTitle={resumeTitle} crossSubjectLabel={resumeCrossSubjectLabel || 'Sambung lintas subjek'} onResume={onResume} onRestartResume={onRestartResume} />
        <section className="quick-actions" aria-label="Aktiviti pembelajaran">
          {!resume || resume.completed ? <button type="button" onClick={() => onStartAdaptiveLesson(todayLesson || smartLesson)}><span className="quick-action-icon"><GameBadge src={ganjaranBadge} /></span><span>Mula Belajar</span></button> : null}
          {interactiveActivityTopic ? <button type="button" className="secondary interactive-practice-action" onClick={() => onStartTopic(interactiveActivityTopic, selectedSubject, { restoreFromResume: true, preserveQuestions: true, displayTitle: `Aktiviti Interaktif: ${interactiveActivityTopic.title}` })}><span className="quick-action-icon"><GameBadge src={ganjaranBadge} /></span><span>Aktiviti Interaktif</span></button> : null}
          <button type="button" className="secondary" onClick={onStartBacaan}><span className="quick-action-icon"><GameBadge src={bacaanBadge} /></span><span>Bacaan</span></button>
          <button type="button" className="secondary" onClick={onStartMendengar}><span className="quick-action-icon"><GameBadge src={mendengarBadge} /></span><span>Mendengar</span></button>
          <button type="button" className="secondary" onClick={onStartBertutur}><span className="quick-action-icon"><GameBadge src={bertuturBadge} /></span><span>Bertutur</span></button>
          <button type="button" className="secondary" onClick={onStartMenulis}><span className="quick-action-icon"><GameBadge src={menulisBadge} /></span><span>Menulis</span></button>
        </section>
        <section className="card adaptive-practice-card">
          <h2>Latihan AI</h2>
          <p>{adaptivePracticePreview?.summary?.metadata?.insufficientEvidence ? 'Belum cukup data. Latihan permulaan seimbang akan digunakan.' : 'Fokus diberikan pada topik yang paling memerlukan perhatian.'}</p>
          <div className="mastery-summary-grid">
            <div><b>{adaptivePracticePreview?.summary?.totalQuestions || adaptivePracticeCount}</b><span>Soalan</span></div>
            <div><b>{formatDurationLabel(recommendationMinutes)}</b><span>Masa</span></div>
            <div><b>{adaptivePracticePreview?.summary?.focusTopics?.length || 0}</b><span>Topik Fokus</span></div>
            <div><b>{adaptivePracticePreview?.summary?.metadata?.fallbackUsed ? 'Aktif' : 'Tidak Aktif'}</b><span>Mod Pengganti</span></div>
          </div>
          <div className="actions">
            <button type="button" className={adaptivePracticeCount === 10 ? '' : 'secondary'} onClick={() => onAdaptivePracticeCountChange(10)}>10 Soalan</button>
            <button type="button" className={adaptivePracticeCount === 20 ? '' : 'secondary'} onClick={() => onAdaptivePracticeCountChange(20)}>20 Soalan</button>
            <button type="button" className="full" onClick={() => onStartAdaptivePractice(adaptivePracticeCount)} disabled={!adaptivePracticePreview?.session?.questions?.length}>Mula Latihan AI</button>
          </div>
          <VoiceButton text={voiceMissionText || adaptivePracticePreview?.summary?.focusTopics?.slice(0, 3).map(topic => `${formatSubjectName(topic.subjectId)} ${formatTopicName(topic.topicId)}`).join('. ') || ''} label="Dengar Misi" title="Dengar misi hari ini" />
          <div className="recommend-meta">
            <span>{formatFallbackState(adaptivePracticePreview?.summary?.metadata?.fallbackUsed)}</span>
            {(adaptivePracticePreview?.summary?.focusTopics || []).slice(0, 3).map(topic => (
              <span key={`${topic.subjectId}-${topic.topicId}`}>{formatSubjectName(topic.subjectId)} · {formatTopicName(topic.topicId)}</span>
            ))}
          </div>
        </section>
        <section className="card mastery-summary-card"><p className="eyebrow">Ringkasan Penguasaan</p><h2>Penguasaan Topik</h2><p className="memory-last">{formatScopeLabel(canonicalAnalytics.scopeLabel)}</p>{canonicalAnalytics.hasEvidence ? <div className="mastery-summary-grid"><div><b>{canonicalAnalytics.masteryPercent}%</b><span>Skor Penguasaan</span></div><div><b>{canonicalAnalytics.masteredTopics.length}</b><span>Dikuasai</span></div><div><b>{canonicalAnalytics.learningTopics.length}</b><span>Sedang Belajar</span></div><div><b>{canonicalAnalytics.weakTopics.length}</b><span>Perlu Latihan</span></div></div> : <EmptyState title={dashboardNoData.title} message={dashboardNoData.message} actionLabel={dashboardNoData.actionLabel} onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />}</section>
        <section className="card curriculum-coverage-card"><p className="eyebrow">Liputan Kurikulum</p><h2>Analisis DSKP + PBD</h2>{curriculumCoverageState.state === 'available' || curriculumCoverageState.state === 'partial' ? <><div className="mastery-summary-grid">{curriculumCoverageState.metrics.map(metric => <div key={metric.label}><b>{metric.value}</b><span>{metric.label}</span>{metric.subtitle ? <small>{metric.subtitle}</small> : null}</div>)}</div>{curriculumCoverageState.message ? <p className="memory-last">{curriculumCoverageState.message}</p> : null}{missingSkSpRecommendation && curriculumCoverageState.state === 'available' && <p className="memory-last">{missingSkSpRecommendation.reason}</p>}</> : <div className="curriculum-coverage-state" data-state={curriculumCoverageState.state} role="status" aria-live="polite"><p>{curriculumCoverageState.message || curriculumNoMappingMessage}</p></div>}</section>
        <section className="card smart-lesson-card">
          <p className="eyebrow">Laluan Belajar Hari Ini</p>
          <h2>{smartTargetTopicLabel || 'Enjin Pembelajaran Adaptif'}</h2>
          <p>{learningJourney.reason || smartLesson?.reason || 'Teruskan dengan langkah yang seimbang.'}</p>
          <div className="recommend-meta">
            {smartCrossSubject && <span className="badge cross-subject-badge">Cadangan lintas subjek</span>}
            <span className="badge target-subject-badge"><SubjectBadge className="target-subject-badge-icon" subjectId={smartTargetSubjectId || smartSubject?.id} /> {smartTargetSubjectLabel}</span>
            <span>Keyakinan AI {formatPriority(smartLesson?.priority || 'normal')}</span>
            <span>{learningJourney.blockedTopics?.length || 0} topik terkunci</span>
          </div>
          <div className="journey-steps">
            <div><span>Hari Ini</span><b>{learningJourney.todayLesson?.subject || formatSubjectName(smartSubject?.id)}</b><small>{formatStatus(learningJourney.todayLesson?.masteryStatus || 'ready')}</small></div>
            <div><span>Seterusnya</span><b>{learningJourney.nextLesson?.title || 'Selepas dikuasai'}</b><small>{formatStatus(learningJourney.nextLesson?.masteryStatus || 'locked')}</small></div>
            <div><span>Ulang Kaji</span><b>{learningJourney.recommendedReview?.title || 'Tiada ulang kaji'}</b><small>{formatStatus(learningJourney.recommendedReview?.masteryStatus || 'clear')}</small></div>
          </div>
          <button type="button" onClick={() => onStartAdaptiveLesson(todayLesson || smartLesson)} disabled={!todayLesson && !smartLesson?.nextQuestionId}>{smartLessonCta}</button>
        </section>
        <section className="card ai-recommend-card">
          <h2>Cadangan Guru AI</h2>
          <p>{aiRecommendation.reason}</p>
          <p className="memory-last">{formatScopeLabel(canonicalAnalytics.scopeLabel)}</p>
          {aiMemory.lastLesson && <p className="memory-last">Latihan terakhir: <b>{aiMemory.lastLesson.title}</b> · {clampPercent(aiMemory.lastLesson.score)}%</p>}
          {canonicalAnalytics.hasEvidence ? (
            <div className="recommend-meta">
              <span>{canonicalAnalytics.weakTopics.length} topik lemah</span>
              <span>{canonicalAnalytics.strongTopics.length} topik kuat</span>
              <span>Penguasaan {canonicalAnalytics.masteryPercent}%</span>
              <span>Masa belajar {formatDuration(canonicalAnalytics.studyMinutes, { unit: 'minutes' })}</span>
              <span>{formatStreakLabel(canonicalAnalytics.currentStreak)}</span>
              <span>Streak terbaik: {canonicalAnalytics.bestStreak} hari</span>
              {canonicalAnalytics.latestScore !== null && canonicalAnalytics.latestScore !== undefined ? <span>Skor terkini {canonicalAnalytics.latestScore}%</span> : null}
              {canonicalAnalytics.latestTopic ? <span>Topik terkini {formatTopicName(canonicalAnalytics.latestTopic)}</span> : null}
              {recommendedPracticeTopic?.title ? <span>{recommendedPracticeTopic.title}</span> : <span>Tiada cadangan tambahan</span>}
            </div>
          ) : (
            <EmptyState title={dashboardNoData.title} message={dashboardNoData.message} actionLabel={dashboardNoData.actionLabel} onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />
          )}
          <button type="button" onClick={() => recommendationUsesResume ? onResume() : (recommendedPracticeTopic && onStartTopic(recommendedPracticeTopic))} disabled={!recommendedPracticeTopic && !recommendationUsesResume}>{aiRecommendationCta}</button>
        </section>
      </section>
    </DashboardLayout>
  );
}

