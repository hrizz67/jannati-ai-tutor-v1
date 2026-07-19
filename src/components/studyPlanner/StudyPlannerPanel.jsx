import React from 'react';
import DailyPlanCard from './DailyPlanCard.jsx';
import WeeklyPlanList from './WeeklyPlanList.jsx';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatStudyDuration(minutes = 0) {
  const value = Math.max(0, safeNumber(minutes, 0));
  if (value >= 60) return '1 jam';
  return `${value} minit`;
}

function buildSectionMessage(planner = {}) {
  if (planner?.onboarding) return 'Ini ialah starter plan untuk membantu murid memulakan rutin belajar.';
  if (planner?.dailyPlan?.blocks?.length) return 'Pelan ini disusun menggunakan data penguasaan dan jadual ulang kaji semasa.';
  return 'Tiada pelan tersedia pada masa ini.';
}

export default function StudyPlannerPanel({ planner = null, className = '' }) {
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
      <section className={`card study-planner-panel ${className}`.trim()} aria-labelledby="study-planner-title">
        <p className="eyebrow">Pelan Belajar</p>
        <h2 id="study-planner-title">Pelan Belajar</h2>
        <p className="memory-last" role="status">Pelan belajar belum tersedia.</p>
      </section>
    );
  }

  return (
    <section className={`card study-planner-panel ${className}`.trim()} aria-labelledby="study-planner-title">
      <p className="eyebrow">Pelan Belajar</p>
      <h2 id="study-planner-title">Pelan Belajar</h2>
      <p className="memory-last" role="status">{buildSectionMessage(planner)}</p>
      {plannerError && (
        <p className="memory-last" role="status">
          {safeText(plannerError.message, 'Pelan belajar tidak dapat dijana buat masa ini.')}
        </p>
      )}

      <div className="mastery-summary-grid study-planner-summary">
        <div><b>{formatStudyDuration(availableMinutes)}</b><span>Masa Belajar</span></div>
        <div><b>{dailyBlocks.length}</b><span>Blok Hari Ini</span></div>
        <div><b>{weeklyDays.length}</b><span>Hari Mingguan</span></div>
        <div><b>{onboarding ? 'Ya' : 'Tidak'}</b><span>Starter Plan</span></div>
      </div>

      <DailyPlanCard plan={dailyPlan} />
      <WeeklyPlanList weeklyPlan={weeklyPlan} />

      <div className="recommend-meta study-planner-notes">
        <span>Ringkasan ibu bapa: <b>{safeText(parentSummary.name || 'Murid', 'Murid')}</b></span>
        <span>Soalan dijawab: <b>{safeNumber(parentSummary.questionsAnswered, 0)}</b></span>
        <span>Ketepatan: <b>{safeNumber(parentSummary.accuracy, 0)}%</b></span>
      </div>
    </section>
  );
}
