import React from 'react';
import LearningHub from '../components/LearningHub.jsx';

export default function LearningDashboard({ profile, selectedSubject, allSubjects, mode = 'nota', resume, onModeChange, onStartTopic, onResume, onMarkMaterial, onOpenAi, onBack }) {
  const hasActiveResume = Boolean(resume && !resume.completed);
  return <main className="app learning-page">
    <div className="topbar learning-page-topbar"><div className="learning-page-nav-actions"><button type="button" className="ghost" onClick={onBack}>← Papan Utama</button>{hasActiveResume ? <button type="button" onClick={() => onResume?.(resume)}>Sambung Latihan</button> : null}</div><span className="pill">Pusat Belajar</span></div>
    <LearningHub selectedSubject={selectedSubject} allSubjects={allSubjects} profile={profile} activeMode={mode} onModeChange={onModeChange} onStartTopic={onStartTopic} onMarkMaterial={onMarkMaterial} onOpenAi={onOpenAi} />
  </main>;
}
