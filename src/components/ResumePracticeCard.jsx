import React from 'react';
import GameBadge from './GameBadge.jsx';
import ganjaranBadge from '../assets/icons/3d/ganjaran-badge.webp';
import targetBadge from '../assets/icons/3d/target-badge.webp';
import { formatResumeTitle, formatSubjectName, formatTopicName, isCrossSubjectTarget } from '../utils/displayFormatter';

const COMMUNICATION_RESUME_MODES = new Set(['reading', 'listening', 'speaking', 'writing']);

export default function ResumePracticeCard({ resume, selectedSubjectId, onResume, onRestartResume, resumeTitle, crossSubjectLabel = 'Sambung lintas subjek' }) {
  if (!resume || resume.completed) return null;
  const progress = Number.isInteger(resume.currentIndex) ? resume.currentIndex : Number.isInteger(resume.questionIndex) ? resume.questionIndex : null;
  // The scoped IDs own the resume identity; stored metadata may describe an older activity.
  const subjectLabel = formatSubjectName(resume.subjectId || 'Mod aktif');
  const topicLabel = COMMUNICATION_RESUME_MODES.has(resume.mode)
    ? ''
    : formatTopicName(resume.topicId || '', { subjectId: resume.subjectId });
  const crossSubject = isCrossSubjectTarget(selectedSubjectId, resume.subjectId);
  return (
    <section className="card resume-card">
      <p className="eyebrow">Sambung Automatik</p>
      <h2><GameBadge className="resume-action-badge" src={ganjaranBadge} /> <span>Sambung Latihan</span></h2>
      <p>{resumeTitle || formatResumeTitle(resume)}<br />Subjek: <b>{subjectLabel}</b>{crossSubject ? <><br /><span className="badge cross-subject-badge">{crossSubjectLabel}</span></> : null}{topicLabel ? <><br />Topik: <b>{topicLabel}</b></> : null}{progress !== null ? <><br />Soalan: <b>{progress + 1}</b></> : null}</p>
      <div className="actions"><button type="button" onClick={() => onResume?.(resume)}><GameBadge className="resume-action-badge" src={ganjaranBadge} /> <span>Sambung</span></button><button type="button" className="secondary" onClick={onRestartResume}><GameBadge className="resume-action-badge" src={targetBadge} /> <span>Mula Semula</span></button></div>
    </section>
  );
}
