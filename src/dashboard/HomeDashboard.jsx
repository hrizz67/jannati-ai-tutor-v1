import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import BrandLogo from '../components/BrandLogo';
import MascotCard from '../components/MascotCard';
import IconGlyph, { SubjectIcon } from '../components/IconGlyph.jsx';
import JannaAvatar from '../components/JannaAvatar';
import GamificationSummary from '../components/GamificationSummary.jsx';
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

export default function HomeDashboard(props) {
  const {
    profile,
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
    onResume,
    onRestartResume,
    onCompleteDaily,
    onToggleFavourite
  } = props;

  const adaptiveStore = adaptiveProfile || profile;
  const studentName = getStudentDisplayName(adaptiveProfile?.name ? adaptiveProfile : profile, 'Murid');
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const subjectRailRef = useRef(null);
  const subjectButtonRefs = useRef(new Map());
  const topics = selectedSubject?.topics || [];
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
  const smartSubject = adaptiveSubjects.find(subject => subject.id === smartLesson?.nextSubject) || selectedSubject;
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
  const resumeModeLabel = formatResumeTitle(resume);
  const resumeProgress = Number.isInteger(resume?.currentIndex) ? resume.currentIndex : Number.isInteger(resume?.questionIndex) ? resume.questionIndex : null;
  const resumeSubjectLabel = formatSubjectName(resume?.metadata?.subjectTitle || resume?.subjectId || 'Mod aktif');
  const selectedSubjectIndex = useMemo(() => visibleSubjects.findIndex(subject => subject?.id === selectedSubjectId), [visibleSubjects, selectedSubjectId]);
  const smartTargetSubjectId = smartLesson?.nextSubject || smartLesson?.subjectId || smartSubject?.id || learningJourney?.todayLesson?.subjectId || '';
  const smartTargetTopicLabel = learningJourney.todayLesson?.title || smartTopic?.title || formatTopicName(smartLesson?.nextTopic || smartLesson?.topicId || '');
  const smartTargetSubjectLabel = formatSubjectYearLabel(smartTargetSubjectId || smartSubject?.id || selectedSubjectId);
  const smartCrossSubject = isCrossSubjectTarget(selectedSubjectId, smartTargetSubjectId);
  const resumeTopicLabel = formatTopicName(resume?.metadata?.topicTitle || resume?.topicId || '', { subjectId: resume?.subjectId });
  const resumeCrossSubject = isCrossSubjectTarget(selectedSubjectId, resume?.subjectId);
  const recommendationMinutes = adaptivePracticePreview?.summary?.estimatedMinutes || 0;
  const recommendationUsesResume = Boolean(resume && !resume.completed && resume.subjectId === selectedSubjectId && resume.topicId === recommendedPracticeTopic?.id);
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
      { label: 'XP', value: canonicalGamification.globalXp, icon: <IconGlyph name="star" /> },
      { label: 'Tahap', value: canonicalGamification.globalLevel, icon: <IconGlyph name="trophy" /> },
      { label: 'Soalan', value: adaptiveStore.totalQuestions || 0, icon: <IconGlyph name="book" /> },
      { label: 'Ketepatan', value: `${clampPercent(studentData.overallAccuracy)}%`, icon: <IconGlyph name="target" /> },
      { label: 'Masa Belajar', value: formatDuration(adaptiveStore.studyMinutes || 0, { unit: 'minutes' }), icon: <IconGlyph name="clock" /> },
      { label: 'Streak', value: canonicalGamification.currentStreak, icon: <IconGlyph name="fire" motion="breath" /> }
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
    resume,
    onResume,
    onRestartResume,
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
        <button className="nav active"><IconGlyph name="home" motion="hover" /> <span>Papan Utama</span></button>
        <button className="nav" onClick={onOpenAi}><IconGlyph name="bot" motion="pulse" /> <span>Tutor AI</span></button>
        <button className="nav" onClick={onOpenUasa}><IconGlyph name="trophy" motion="celebrate" /> <span>UASA</span></button>
        <button className="nav" onClick={onOpenParent}><IconGlyph name="family" motion="hover" /> <span>Ibu Bapa</span></button>
        <div className="sidebar-note"><b><IconGlyph name="spark" motion="shine" /> <span>Data Ringan</span></b><p>Data dimuat ikut subjek supaya lebih ringan.</p></div>
      </aside>
      <section className="dashboard-main">
        <header className="brand-app-header">
          <div className="brand-app-title"><BrandLogo horizontal size="sm" /><div><p className="eyebrow">Tahun 2</p><h1>Jannati AI Tutor</h1></div></div>
          <div className="brand-student-strip"><JannaAvatar size={48} className="student-avatar" /><div><b title={studentName}>{studentName}</b><small>Tahun 2</small></div><span className="achievement-chip">Tahap {canonicalGamification.globalLevel}</span><span className="achievement-chip">XP {canonicalGamification.globalXp}</span>{canonicalGamification.starCount > 0 ? <span className="achievement-chip">Bintang {canonicalGamification.starCount}</span> : null}<span className="achievement-chip">Streak {canonicalGamification.currentStreak}</span><span className="achievement-chip">Akurasi {clampPercent(studentData.overallAccuracy)}%</span><button type="button" className="icon-button" aria-label="Notifikasi"><IconGlyph name="bell" /></button></div>
        </header>
        <section className="profile hero-card"><MascotCard character={dashboardCharacter} mood={personalityMood} size="md" animation="gentle" message={personalityMotivation} /><div className="avatar-large"><JannaAvatar size={84} /></div><div><p className="eyebrow">Edisi Data Ringan</p><h1>{personalityGreeting || `Assalamualaikum, ${studentName}`}</h1><p>{personalityMotivation}</p><VoiceButton text={voiceGreetingText || personalityGreeting || personalityMotivation} label="Dengar Salam" title="Dengar salam" /><GamificationSummary profile={gamificationProfile} canonical={canonicalGamification} className="home-gamification-summary" /></div></section>
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
            const subjectTitle = subject?.title || formatSubjectName(subject?.id);
            const isActive = selectedSubjectId === subject?.id;
            return (
              <button
                key={subject?.id}
                type="button"
                className={`subject-quick-pill ${isActive ? 'active' : ''}`}
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
                <span className="subject-quick-pill-icon" aria-hidden="true"><SubjectIcon subjectId={subject?.id} size={18} /></span>
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
            <summary><span>Analitik & Kemajuan</span><small>Subjek, kemahiran bahasa, gamifikasi dan UASA</small></summary>
            <AnalyticsDashboard {...analyticsData} />
          </details>
        </Suspense>

        <section className="quick-actions"><button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)}><IconGlyph name="play" motion="hover" /> <span>Sambung Belajar</span></button><button className="secondary" onClick={onOpenAi}><IconGlyph name="bot" motion="pulse" /> <span>Tutor AI</span></button><button className="secondary" onClick={onOpenUasa}><IconGlyph name="trophy" motion="celebrate" /> <span>Simulator UASA</span></button><button className="secondary" onClick={onStartBacaan}><IconGlyph name="headphones" motion="sound" /> <span>Bacaan</span></button><button className="secondary" onClick={onStartMendengar}><IconGlyph name="headphones" motion="sound" /> <span>Mendengar</span></button><button className="secondary" onClick={onStartBertutur}><IconGlyph name="mic" motion="pulse" /> <span>Bertutur</span></button><button className="secondary" onClick={onStartMenulis}><IconGlyph name="pen" motion="hover" /> <span>Menulis</span></button><button className="secondary" onClick={onOpenParent}><IconGlyph name="family" motion="hover" /> <span>Ibu Bapa</span></button></section>
        <section className="card adaptive-practice-card">
          <p className="eyebrow">Latihan AI</p>
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
        {resume && (
          <section className="card resume-card">
            <p className="eyebrow">Sambung Automatik</p>
            <h2><IconGlyph name="play" motion="hover" /> <span>Sambung Latihan</span></h2>
            <p>
              {resumeModeLabel}
              <br />
              Subjek: <b>{resumeSubjectLabel}</b>
              {resumeCrossSubject && <><br /><span className="badge cross-subject-badge">Sambung lintas subjek</span></>}
              {resumeTopicLabel && <><br />Topik: <b>{resumeTopicLabel}</b></>}
              {resumeProgress !== null && <><br />Soalan: <b>{resumeProgress + 1}</b></>}
            </p>
            <div className="actions">
              <button onClick={onResume}><IconGlyph name="play" motion="hover" /> <span>Sambung</span></button>
              <button className="secondary" onClick={onRestartResume}><IconGlyph name="repeat" motion="hover" /> <span>Mula Semula</span></button>
            </div>
          </section>
        )}
        <section className="card mastery-summary-card"><p className="eyebrow">Ringkasan Penguasaan</p><h2>Penguasaan Topik</h2><p className="memory-last">{formatScopeLabel(canonicalAnalytics.scopeLabel)}</p>{canonicalAnalytics.hasEvidence ? <div className="mastery-summary-grid"><div><b>{canonicalAnalytics.masteryPercent}%</b><span>Skor Penguasaan</span></div><div><b>{canonicalAnalytics.masteredTopics.length}</b><span>Dikuasai</span></div><div><b>{canonicalAnalytics.learningTopics.length}</b><span>Sedang Belajar</span></div><div><b>{canonicalAnalytics.weakTopics.length}</b><span>Perlu Latihan</span></div></div> : <EmptyState title={dashboardNoData.title} message={dashboardNoData.message} actionLabel={dashboardNoData.actionLabel} onAction={() => onStartAdaptivePractice(adaptivePracticeCount)} />}</section>
        <section className="card curriculum-coverage-card"><p className="eyebrow">Liputan Kurikulum</p><h2>Analisis DSKP + UASA</h2>{curriculumCoverageState.state === 'available' || curriculumCoverageState.state === 'partial' ? <><div className="mastery-summary-grid">{curriculumCoverageState.metrics.map(metric => <div key={metric.label}><b>{metric.value}</b><span>{metric.label}</span>{metric.subtitle ? <small>{metric.subtitle}</small> : null}</div>)}</div>{curriculumCoverageState.message ? <p className="memory-last">{curriculumCoverageState.message}</p> : null}{missingSkSpRecommendation && curriculumCoverageState.state === 'available' && <p className="memory-last">{missingSkSpRecommendation.reason}</p>}</> : <div className="curriculum-coverage-state" data-state={curriculumCoverageState.state} role="status" aria-live="polite"><p>{curriculumCoverageState.message || curriculumNoMappingMessage}</p></div>}</section>
        <section className="card smart-lesson-card">
          <p className="eyebrow">Laluan Belajar Hari Ini</p>
          <h2>{smartTargetTopicLabel || 'Enjin Pembelajaran Adaptif'}</h2>
          <p>{learningJourney.reason || smartLesson?.reason || 'Teruskan dengan langkah yang seimbang.'}</p>
          <div className="recommend-meta">
            {smartCrossSubject && <span className="badge cross-subject-badge">Cadangan lintas subjek</span>}
            <span className="badge target-subject-badge"><SubjectIcon subjectId={smartTargetSubjectId || smartSubject?.id} size={16} /> {smartTargetSubjectLabel}</span>
            <span>Keyakinan AI {formatPriority(smartLesson?.priority || 'normal')}</span>
            <span>{learningJourney.blockedTopics?.length || 0} topik terkunci</span>
          </div>
          <div className="journey-steps">
            <div><span>Hari Ini</span><b>{learningJourney.todayLesson?.subject || formatSubjectName(smartSubject?.id)}</b><small>{formatStatus(learningJourney.todayLesson?.masteryStatus || 'ready')}</small></div>
            <div><span>Seterusnya</span><b>{learningJourney.nextLesson?.title || 'Selepas dikuasai'}</b><small>{formatStatus(learningJourney.nextLesson?.masteryStatus || 'locked')}</small></div>
            <div><span>Ulang Kaji</span><b>{learningJourney.recommendedReview?.title || 'Tiada ulang kaji'}</b><small>{formatStatus(learningJourney.recommendedReview?.masteryStatus || 'clear')}</small></div>
          </div>
          <button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!learningJourney.todayLesson && !smartLesson?.nextQuestionId}>{smartLessonCta}</button>
        </section>
        <section className="card ai-recommend-card">
          <p className="eyebrow">Cadangan Guru AI</p>
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
          <button onClick={() => recommendationUsesResume ? onResume() : (recommendedPracticeTopic && onStartTopic(recommendedPracticeTopic))} disabled={!recommendedPracticeTopic && !recommendationUsesResume}>{aiRecommendationCta}</button>
        </section>
      </section>
    </DashboardLayout>
  );
}

