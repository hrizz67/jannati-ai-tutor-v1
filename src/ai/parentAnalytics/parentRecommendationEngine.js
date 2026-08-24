import { formatTopicName } from '../../utils/displayFormatter.js';

export function buildParentRecommendation(profile = {}, context = {}) {
  const predictionProfile = context.predictionProfile || {};
  const studyPlan = predictionProfile.studyPlan || {};
  const readiness = predictionProfile.readiness || context.readiness || {};
  const observation = context.observation || {};
  const weakest = observation.weakestTopic || null;
  const topicId = weakest?.topicId || studyPlan.topicId || studyPlan.focusTopicId || null;
  const topicName = topicId ? formatTopicName(weakest?.title || topicId) : 'Latihan berfokus';
  const estimatedMinutes = Number(studyPlan.estimatedMinutes) || 0;

  const summary = topicId
    ? `Ulang kaji ${topicName} selama ${estimatedMinutes > 0 ? `${estimatedMinutes} minit` : '15 minit'}.`
    : 'Teruskan latihan harian untuk mengukuhkan pembelajaran.';

  return {
    subjectId: weakest?.subjectId || studyPlan.subjectId || null,
    topicId,
    topicName,
    estimatedMinutes: estimatedMinutes || 15,
    readinessLevel: readiness.level || 'needs_support',
    summary,
    hasData: Boolean(topicId || estimatedMinutes),
    compact: {
      topic: topicName,
      minutes: `${estimatedMinutes || 15} min`,
      readiness: readiness.message || 'Masih memerlukan sokongan.'
    }
  };
}

export default {
  buildParentRecommendation
};
