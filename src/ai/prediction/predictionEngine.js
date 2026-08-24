import { getPredictionProfile } from './predictionProfile.js';
import { getReadiness } from './readinessEngine.js';
import { buildStudyPlan } from './studyPlanEngine.js';
import { forecastMastery } from './masteryForecastEngine.js';

export function buildPrediction(profile = {}, memory = null, context = {}) {
  const predictionProfile = getPredictionProfile(profile, memory, context);
  const readiness = getReadiness(profile, memory, context);
  const studyPlan = buildStudyPlan(profile, memory, context);
  const masteryForecast = forecastMastery(profile, memory, context);

  return {
    predictionProfile,
    readiness,
    studyPlan,
    masteryForecast
  };
}

export function getPrediction(profile = {}, memory = null, context = {}) {
  return buildPrediction(profile, memory, context);
}

export default {
  buildPrediction,
  getPrediction
};
