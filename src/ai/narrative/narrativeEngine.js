import { buildDailyGreetingNarrative } from './dailyGreetingNarrative.js';
import { buildProgressNarrative } from './progressNarrative.js';
import { buildAchievementNarrative } from './achievementNarrative.js';
import { buildEncouragementNarrative } from './encouragementNarrative.js';
import { buildLearningJourneyNarrative } from './learningJourneyNarrative.js';

export function buildNarrativeBundle(profile = {}, memory = {}, observation = {}, context = {}) {
  return {
    greeting: buildDailyGreetingNarrative(profile, memory, observation, context),
    progress: buildProgressNarrative(observation, context),
    achievement: buildAchievementNarrative(profile, memory, observation, context),
    encouragement: buildEncouragementNarrative(profile, memory, observation, context),
    journeySummary: buildLearningJourneyNarrative(profile, memory, observation, context),
    dailyMission: observation?.dailyMission || { title: 'Hari Ini', items: [] }
  };
}

export default {
  buildNarrativeBundle
};
