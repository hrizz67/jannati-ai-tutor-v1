import React, { Suspense, useMemo } from 'react';
import BrandLogo from '../components/BrandLogo';
import MascotCard from '../components/MascotCard';
import JannaAvatar from '../components/JannaAvatar';
import VoiceButton from '../components/VoiceButton.jsx';
import DashboardLayout from './DashboardLayout.jsx';
const StudentDashboard = React.lazy(() => import('./StudentDashboard.jsx'));
const RevisionDashboard = React.lazy(() => import('./RevisionDashboard.jsx'));
const AnalyticsDashboard = React.lazy(() => import('./AnalyticsDashboard.jsx'));
import { buildRecommendation } from '../ai/recommendationEngine';
import { buildAdaptiveRecommendation } from '../ai/adaptiveEngine';
import { loadAIMemory, formatStudyTime } from '../ai/memoryEngine';
import { buildStudentIntelligence, getStudentLevel } from '../ai/studentIntelligence';
import { buildMasteryMap, summarizeMastery } from '../ai/adaptive/masteryEngine';
import { buildLessonPlan } from '../ai/adaptive/lessonPlanner';
import { buildCurriculumCoverage } from '../curriculum/coverageEngine';
import { recommendMissingSkSp } from '../curriculum/uasaEngine';
import { getRecommendedTopic, getSubjectAverage, progressKey, todayKey } from './dashboardHelpers.jsx';
import { getPersonalityForSubject } from '../brand/personalities';
import { clampPercent, formatPriority, formatStatus, formatSubjectName, formatTopicName } from '../utils/displayFormatter';

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
  const topics = selectedSubject?.topics || [];
  const aiMemory = useMemo(() => loadAIMemory(), [profile.history, profile.progress, profile.xp]);
  const adaptiveSubjects = useMemo(() => (allSubjects?.length ? allSubjects : [selectedSubject].filter(Boolean)), [allSubjects, selectedSubject]);
  const studentCore = useMemo(() => buildStudentIntelligence(profile, adaptiveSubjects, aiMemory), [profile, adaptiveSubjects, aiMemory]);
  const levelInfo = getStudentLevel(adaptiveStore.xp || profile.xp || 0);
  const level = adaptiveStore.level || studentCore.level || levelInfo.level;
  const levelProgress = clampPercent(studentCore.xpProgress ?? levelInfo.levelXp);
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
  const missingSkSpRecommendation = recommendMissingSkSp(curriculumCoverage);
  const resumeModeLabel = resume?.metadata?.displayTitle || (
    resume?.mode === 'uasa' ? 'Simulator UASA'
      : resume?.mode === 'reading' ? 'Bacaan'
        : resume?.mode === 'listening' ? 'Mendengar'
          : resume?.mode === 'speaking' ? 'Bertutur'
            : resume?.mode === 'writing' ? 'Menulis'
              : resume?.mode === 'adaptive-practice' ? 'Latihan AI'
                : resume?.mode === 'adaptive-lesson' ? 'Laluan Belajar'
                  : resume?.mode === 'quiz' ? 'Latihan'
                    : 'Sambung Latihan'
  );
  const resumeProgress = Number.isInteger(resume?.currentIndex) ? resume.currentIndex : Number.isInteger(resume?.questionIndex) ? resume.questionIndex : null;
  const resumeSubjectLabel = resume?.metadata?.subjectTitle || (resume?.subjectId ? formatSubjectName(resume.subjectId) : 'Mod aktif');

  const studentData = {
    profile,
    adaptiveProfile: adaptiveStore,
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
    onStartAdaptivePractice
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
    adaptiveProfile: adaptiveStore,
    weeklyAnalytics: { totals: { questions: 0, accuracy: 0, studyMinutes: 0, activeDays: 0 }, daily: [], trend: { direction: 'insufficient_data', message: 'Belum ada data.' } },
    statsCards: [
      { label: 'XP', value: adaptiveStore.xp || 0, icon: '⭐' },
      { label: 'Tahap', value: level, icon: '🏆' },
      { label: 'Soalan', value: adaptiveStore.totalQuestions || 0, icon: '📝' },
      { label: 'Ketepatan', value: `${clampPercent(studentData.overallAccuracy)}%`, icon: '🎯' },
      { label: 'Masa Belajar', value: formatStudyTime(adaptiveStore.studyMinutes || 0), icon: '⏱️' },
      { label: 'Streak', value: adaptiveStore.streak || 0, icon: '🔥' }
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
        <button className="nav active">🏠 Papan Utama</button>
        <button className="nav" onClick={onOpenAi}>🤖 Tutor AI</button>
        <button className="nav" onClick={onOpenUasa}>🏆 UASA</button>
        <button className="nav" onClick={onOpenParent}>👨‍👩‍👧 Ibu Bapa</button>
        <div className="sidebar-note"><b>⚡ Data Ringan</b><p>Data dimuat ikut subjek supaya lebih ringan.</p></div>
      </aside>
      <section className="dashboard-main">
        <header className="brand-app-header">
          <div className="brand-app-title"><BrandLogo horizontal size="sm" /><div><p className="eyebrow">Tahun 2</p><h1>Jannati AI Tutor</h1></div></div>
          <div className="brand-student-strip"><JannaAvatar size={48} className="student-avatar" /><div><b>{profile.name || 'Anak'}</b><small>Tahun 2</small></div><span className="achievement-chip">Tahap {level}</span><span className="achievement-chip">Bintang {levelProgress}</span><span className="achievement-chip">Streak {adaptiveStore.streak || 0}</span><button type="button" className="icon-button" aria-label="Notifikasi">!</button></div>
        </header>
        <section className="profile hero-card"><MascotCard character={dashboardCharacter} mood={personalityMood} size="md" animation="gentle" message={personalityMotivation} /><div className="avatar-large"><JannaAvatar size={84} /></div><div><p className="eyebrow">Edisi Data Ringan</p><h1>{personalityGreeting || `Assalamualaikum, ${profile.name || 'Anak'}`}</h1><p>{personalityMotivation}</p><VoiceButton text={voiceGreetingText || personalityGreeting || personalityMotivation} label="Dengar Salam" title="Dengar salam" /><div className="level-line"><span>Tahap {level}</span><div className="progress-wrap"><div className="progress" style={{ width: `${levelProgress}%` }} /></div><span>{levelProgress}/100 XP</span></div></div></section>
        <Suspense fallback={<section className="card"><p className="eyebrow">Memuat</p><h2>Dashboard sedang dimuat</h2><p>Sebentar ya, kandungan sedang disiapkan.</p></section>}>
          <StudentDashboard {...studentData} />
          <RevisionDashboard {...revisionData} />
          <AnalyticsDashboard {...analyticsData} />
        </Suspense>
        <section className="card"><button type="button" className="full" onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)}>▶ Sambung Belajar</button></section>
        <section className="quick-actions"><button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)}>▶ Sambung Belajar</button><button className="secondary" onClick={onOpenAi}>🤖 Tutor AI</button><button className="secondary" onClick={onOpenUasa}>🏆 Simulator UASA</button><button className="secondary" onClick={onStartBacaan}>🎤 Bacaan</button><button className="secondary" onClick={onStartMendengar}>🎧 Mendengar</button><button className="secondary" onClick={onStartBertutur}>🗣️ Bertutur</button><button className="secondary" onClick={onStartMenulis}>✍️ Menulis</button><button className="secondary" onClick={onOpenParent}>👨‍👩‍👧 Ibu Bapa</button></section>
        <section className="card adaptive-practice-card"><p className="eyebrow">Latihan AI</p><h2>Latihan AI</h2><p>{adaptivePracticePreview?.summary?.metadata?.insufficientEvidence ? 'Belum cukup data. Latihan permulaan seimbang akan digunakan.' : 'Fokus diberikan pada topik yang paling memerlukan perhatian.'}</p><div className="mastery-summary-grid"><div><b>{adaptivePracticePreview?.summary?.totalQuestions || adaptivePracticeCount}</b><span>Soalan</span></div><div><b>{adaptivePracticePreview?.summary?.estimatedMinutes || 0}</b><span>Masa</span></div><div><b>{adaptivePracticePreview?.summary?.focusTopics?.length || 0}</b><span>Topik Fokus</span></div><div><b>{adaptivePracticePreview?.summary?.metadata?.fallbackUsed ? 'Ya' : 'Tidak'}</b><span>Pengganti</span></div></div><div className="actions"><button type="button" className={adaptivePracticeCount === 10 ? '' : 'secondary'} onClick={() => onAdaptivePracticeCountChange(10)}>10 Soalan</button><button type="button" className={adaptivePracticeCount === 20 ? '' : 'secondary'} onClick={() => onAdaptivePracticeCountChange(20)}>20 Soalan</button><button type="button" className="full" onClick={() => onStartAdaptivePractice(adaptivePracticeCount)} disabled={!adaptivePracticePreview?.session?.questions?.length}>Mula Latihan AI</button></div><VoiceButton text={voiceMissionText || adaptivePracticePreview?.summary?.focusTopics?.slice(0, 3).map(topic => `${formatSubjectName(topic.subjectId)} ${formatTopicName(topic.topicId)}`).join('. ') || ''} label="Dengar Misi" title="Dengar misi hari ini" /><div className="recommend-meta">{(adaptivePracticePreview?.summary?.focusTopics || []).slice(0, 3).map(topic => <span key={`${topic.subjectId}-${topic.topicId}`}>{formatSubjectName(topic.subjectId)} • {formatTopicName(topic.topicId)}</span>)}</div></section>
        {resume && <section className="card resume-card"><p className="eyebrow">Sambung Automatik</p><h2>▶ Sambung Latihan</h2><p>{resumeModeLabel}<br />Subjek: <b>{resumeSubjectLabel}</b>{resumeProgress !== null && <><br />Soalan: <b>{resumeProgress + 1}</b></>}</p><div className="actions"><button onClick={onResume}>▶ Sambung</button><button className="secondary" onClick={onRestartResume}>🔄 Mula Semula</button></div></section>}
        <section className="card mastery-summary-card"><p className="eyebrow">Ringkasan Penguasaan</p><h2>Penguasaan Topik</h2><div className="mastery-summary-grid"><div><b>{clampPercent(masterySummary.masteryScore)}%</b><span>Skor Penguasaan</span></div><div><b>{masterySummary.dikuasai}</b><span>Dikuasai</span></div><div><b>{masterySummary.learning}</b><span>Sedang Belajar</span></div><div><b>{masterySummary.needsPractice}</b><span>Perlu Latihan</span></div></div></section>
        <section className="card curriculum-coverage-card"><p className="eyebrow">Liputan Kurikulum</p><h2>Analisis DSKP + UASA</h2><div className="mastery-summary-grid"><div><b>{clampPercent(curriculumCoverage.summary.coveragePercent)}%</b><span>SK/SP Diliputi</span></div><div><b>{clampPercent(curriculumCoverage.summary.masteryPercent)}%</b><span>Penguasaan SK/SP</span></div><div><b>{curriculumCoverage.summary.missing}</b><span>SK/SP Belum Cukup</span></div><div><b>{curriculumCoverage.summary.estimatedMinutes}</b><span>Anggaran Minit</span></div></div>{missingSkSpRecommendation && <p className="memory-last">{missingSkSpRecommendation.reason}</p>}</section>
        <section className="card smart-lesson-card"><p className="eyebrow">Laluan Belajar Hari Ini</p><h2>{learningJourney.todayLesson?.title || smartTopic?.title || 'Enjin Pembelajaran Adaptif'}</h2><p>{learningJourney.reason || smartLesson?.reason || 'Teruskan dengan langkah yang seimbang.'}</p><div className="journey-steps"><div><span>Hari Ini</span><b>{learningJourney.todayLesson?.subject || formatSubjectName(smartSubject?.id)}</b><small>{formatStatus(learningJourney.todayLesson?.masteryStatus || 'ready')}</small></div><div><span>Seterusnya</span><b>{learningJourney.nextLesson?.title || 'Selepas dikuasai'}</b><small>{formatStatus(learningJourney.nextLesson?.masteryStatus || 'locked')}</small></div><div><span>Ulang Kaji</span><b>{learningJourney.recommendedReview?.title || 'Tiada ulang kaji'}</b><small>{formatStatus(learningJourney.recommendedReview?.masteryStatus || 'clear')}</small></div></div><div className="recommend-meta"><span>{learningJourney.blockedTopics?.length || 0} topik terkunci</span><span>AI: {formatPriority(smartLesson?.priority || 'normal')}</span><span>{learningJourney.recommendedReview?.title || 'Ulang kaji stabil'}</span></div><button onClick={() => onStartAdaptiveLesson(learningJourney.todayLesson || smartLesson)} disabled={!learningJourney.todayLesson && !smartLesson?.nextQuestionId}>Mula Laluan</button></section>
        <section className="card ai-recommend-card"><p className="eyebrow">Cadangan Guru AI</p><h2>Cadangan Guru AI</h2><p>{aiRecommendation.reason}</p>{aiMemory.lastLesson && <p className="memory-last">Latihan terakhir: <b>{aiMemory.lastLesson.title}</b> • {clampPercent(aiMemory.lastLesson.score)}%</p>}<div className="recommend-meta"><span>{aiMemory.weakTopics.length || aiRecommendation.weakTopics.length} topik lemah</span><span>{aiMemory.strongTopics.length} topik kuat</span><span>Penguasaan {clampPercent(aiMemory.mastery)}%</span><span>Masa belajar {formatStudyTime(aiMemory.studyTime)}</span><span>Hari berturut {aiMemory.studyStreak}</span><span>{recommendedPracticeTopic?.title || 'Semua topik selesai'}</span></div><button onClick={() => recommendedPracticeTopic && onStartTopic(recommendedPracticeTopic)}>Latih Semula</button></section>
      </section>
    </DashboardLayout>
  );
}
