import React from 'react';
import LearningHub from '../components/LearningHub.jsx';

export default function LearningDashboard({ profile, selectedSubject, allSubjects, mode = 'nota', onModeChange, onStartTopic, onOpenAi, onBack }) {
  return <main className="app learning-page">
    <div className="topbar"><button type="button" className="ghost" onClick={onBack}>Papan Utama</button><span className="pill">Pusat Belajar</span></div>
    <LearningHub selectedSubject={selectedSubject} allSubjects={allSubjects} profile={profile} activeMode={mode} onModeChange={onModeChange} onStartTopic={onStartTopic} onOpenAi={onOpenAi} />
  </main>;
}
