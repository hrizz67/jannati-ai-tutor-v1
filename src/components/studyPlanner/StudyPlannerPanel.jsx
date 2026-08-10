import React from 'react';
import DailyPlanCard from './DailyPlanCard.jsx';
import WeeklyPlanList from './WeeklyPlanList.jsx';
import { formatDurationLabel, formatPlannerBoolean } from '../../utils/displayFormatter.js';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildSectionMessage(planner = {}) {
  if (planner?.onboarding) return 'Ini ialah pelan permulaan untuk membantu murid memulakan rutin belajar.';
  if (planner?.dailyPlan?.blocks?.length) return 'Pelan ini disusun menggunakan data penguasaan dan jadual ulang kaji semasa.';
  return 'Tiada pelan tersedia pada masa ini.';
}

export default function StudyPlannerPanel({ planner = null, className = '' }) {
  const titleId = 'study-planner-panel-title';
  const dailyPlan = planner?.dailyPlan || null;
  const weeklyPlan = planner?.weeklyPlan || null;
  const onboarding = Boolean(planner?.onboarding);
  const availableMinutes = safeNumber(planner?.availableStudyMinutes, 0);
  const dailyBlocks = Array.isArray(dailyPlan?.blocks) ? dailyPlan.blocks : [];
  const weeklyDays = Array.isArray(weeklyPlan?.days) ? weeklyPlan.days : [];
  const parentSummary = planner?.parentSummary || {};
  const plannerError = planner?.error || null;

  if (!planner) {
    return (
      <section className={`card study-planner-panel ${className}`.trim()} aria-labelledby={titleId}>
        <h2 id={titleId}>Pelan Belajar</h2>
        <p className="memory-last" role="status">Pelan belajar belum tersedia.</p>
      </section>
    );
  }

  return (
    <section className={`card study-planner-panel ${className}`.trim()} aria-labelledby={titleId}>
      <h2 id={titleId}>Pelan Belajar</h2>
      <p className="memory-last" role="status">{buildSectionMessage(planner)}</p>
      {plannerError && (
        <p className="memory-last" role="status">
          {safeText(plannerError.message, 'Pelan belajar tidak dapat dijana buat masa ini.')}
        </p>
      )}

      <div className="mastery-summary-grid study-planner-summary">
        <div><b>{formatDurationLabel(availableMinutes)}</b><span>Masa Belajar</span></div>
        <div><b>{dailyBlocks.length}</b><span>Blok Hari Ini</span></div>
        <div><b>{weeklyDays.length}</b><span>Hari Dirancang</span></div>
        <div><b>{onboarding ? 'Aktif' : 'Tidak'}</b><span>Pelan Permulaan</span></div>
      </div>

      <DailyPlanCard plan={dailyPlan} />
      <WeeklyPlanList weeklyPlan={weeklyPlan} />

      <div className="recommend-meta study-planner-notes">
        <span>Ringkasan ibu bapa: <b>{safeText(parentSummary.name || 'Murid', 'Murid')}</b></span>
        <span>Soalan dijawab: <b>{safeNumber(parentSummary.questionsAnswered, 0)}</b></span>
        <span>Ketepatan: <b>{safeNumber(parentSummary.accuracy, 0)}%</b></span>
        <span><b>{formatPlannerBoolean('Pelan permulaan', onboarding)}</b></span>
      </div>
    </section>
  );
}
