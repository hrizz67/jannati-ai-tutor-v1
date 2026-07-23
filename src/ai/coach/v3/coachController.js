import { fetchCoachKnowledgeData } from '../knowledge/knowledgeAdapter.js';
import { buildExplanation } from './explanationEngine.js';
import { buildHint } from './hintEngine.js';
import { buildPraise } from './praiseEngine.js';
import { buildLearningTips } from './learningTips.js';
import { getSubjectStrategy } from './subjectStrategies.js';

export async function buildCoachResponse({ subjectId, topicId, question = {}, result = {}, userAnswer = '', context = {}, mode = 'explain' } = {}) {
  const knowledge = await fetchCoachKnowledgeData({
    subjectId,
    topicId,
    question,
    result,
    userAnswer
  });

  const teachingContext = { ...context, mode };
  const explanation = buildExplanation({ subjectId, topicId, knowledgePack: knowledge, context: teachingContext });
  const hint = buildHint({ subjectId, topicId, knowledgePack: knowledge, context: teachingContext });
  const praise = buildPraise({ subjectId, topicId, knowledgePack: knowledge, context: teachingContext });
  const tips = buildLearningTips({ subjectId, topicId, knowledgePack: knowledge, context: teachingContext });
  const strategy = getSubjectStrategy(subjectId);
  const steps = [
    explanation.learningStep,
    tips.spotlight,
    ...(tips.tips || []).slice(0, 2),
    ...(tips.memoryTips || []).slice(0, 1)
  ].filter(Boolean);

  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    knowledge: knowledge || null,
    explanation,
    hint,
    praise,
    tips,
    steps,
    learningTip: tips.spotlight || strategy.tipLead,
    correctAnswer: question?.answer || '',
    ready: Boolean(knowledge),
    mode
  };
}

export function getCoachPreview({ subjectId, topicId, question = {}, context = {} } = {}) {
  const strategy = getSubjectStrategy(subjectId);
  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    preview: {
      explanation: strategy.explanationLead,
      hint: strategy.hintLead,
      praise: strategy.praiseLead,
      learningTip: strategy.tipLead
    },
    question,
    context
  };
}

export default {
  buildCoachResponse,
  getCoachPreview
};
