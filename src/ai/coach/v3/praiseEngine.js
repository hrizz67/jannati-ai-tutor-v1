import { getSubjectStrategy } from './subjectStrategies.js';

export function buildPraise({ subjectId, topicId, knowledgePack = null, context = {} } = {}) {
  const strategy = getSubjectStrategy(subjectId);
  const source = knowledgePack || {};
  const correctMessages = Array.isArray(source.encouragement?.correct) ? source.encouragement.correct : [];
  const retryMessages = Array.isArray(source.encouragement?.retry) ? source.encouragement.retry : [];
  const excellentMessages = Array.isArray(source.encouragement?.excellent) ? source.encouragement.excellent : [];

  const mastery = Number(context.mastery || 0);
  const status = context.correct ? (mastery >= 85 ? 'excellent' : 'correct') : 'retry';
  const pool = status === 'excellent' ? excellentMessages : status === 'correct' ? correctMessages : retryMessages;

  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    status,
    praise: pool[0] || strategy.praiseLead
  };
}

export default {
  buildPraise
};
