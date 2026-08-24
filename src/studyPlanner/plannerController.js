import { buildStudyPlanner, buildDailyPlanner, buildWeeklyPlanner, buildPlannerSignals } from './plannerService.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

export function createStudyPlanner(profile = null, options = {}) {
  return buildStudyPlanner(profile, options);
}

export function createDailyPlan(profile = null, options = {}) {
  return buildDailyPlanner(profile, options);
}

export function createWeeklyPlan(profile = null, options = {}) {
  return buildWeeklyPlanner(profile, options);
}

export function createParentSummary(profile = null, options = {}) {
  const planner = buildStudyPlanner(profile, options);
  return {
    summary: planner.parentSummary,
    recommendation: safeText(planner.parentSummaryText, 'Pelan belajar disediakan.'),
    onboarding: Boolean(planner.onboarding)
  };
}

export function createStudyPlannerPayload(profile = null, options = {}) {
  const planner = buildStudyPlanner(profile, options);
  const dailyBlocks = Array.isArray(planner.dailyPlan?.blocks) ? planner.dailyPlan.blocks : [];

  return {
    plannerVersion: planner.plannerVersion,
    generatedAt: planner.generatedAt,
    onboarding: planner.onboarding,
    availableStudyMinutes: toNumber(planner.availableStudyMinutes, 0),
    parentSummary: planner.parentSummary,
    dailyPlan: planner.dailyPlan,
    weeklyPlan: planner.weeklyPlan,
    parentSummaryText: planner.parentSummaryText,
    recentActivity: planner.recentActivity,
    focusSubject: dailyBlocks[0]?.subject || '',
    focusTopic: dailyBlocks[0]?.topic || '',
    signals: planner.signals
  };
}

export function inspectStudyPlanner(profile = null, options = {}) {
  return buildPlannerSignals(profile, options);
}

export default {
  createStudyPlanner,
  createDailyPlan,
  createWeeklyPlan,
  createParentSummary,
  createStudyPlannerPayload,
  inspectStudyPlanner
};
