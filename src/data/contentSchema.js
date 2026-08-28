import { alignQuestionDemand, deterministicOptionOrder } from '../utils/questionDemand.js';

export const QUESTION_TYPES = Object.freeze([
  'short_answer',
  'objective',
  'multiple_response',
  'matching',
  'ordering',
  'fill_blank',
  'true_false',
  'structured',
  'oral',
  'practical'
]);

export const COGNITIVE_LEVELS = Object.freeze([
  'mengingat',
  'memahami',
  'mengaplikasi',
  'menganalisis',
  'menilai',
  'mencipta'
]);

export function normalizeQuestionContent(question = {}) {
  const acceptedAnswers = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers
    : Array.isArray(question.accepted)
      ? question.accepted
      : question.answer === undefined || question.answer === null
        ? []
        : [question.answer];
  const hasOptions = Array.isArray(question.options) && question.options.length > 0;

  return {
    ...question,
    acceptedAnswers,
    questionType: question.questionType || question.type || (hasOptions ? 'objective' : 'short_answer'),
    cognitiveLevel: question.cognitiveLevel || question.cognitive_level || '',
    learningOutcome: question.learningOutcome || question.learning_outcome || '',
    marks: Number.isFinite(Number(question.marks)) ? Number(question.marks) : 1,
    estimatedTime: Number.isFinite(Number(question.estimatedTime)) ? Number(question.estimatedTime) : null
  };
}

export function normalizeTopicContent(topic = {}) {
  const pilotDefaults = topic.contentStatus === 'pilot' ? {
    questionType: topic.defaultQuestionType || 'short_answer',
    marks: Number.isFinite(Number(topic.defaultMarks)) ? Number(topic.defaultMarks) : 1
  } : {};

  return {
    ...topic,
    learningObjective: topic.learningObjective || topic.learning_objective || '',
    learningOutcome: topic.learningOutcome || topic.learning_outcome || '',
    questions: (topic.questions || []).map((question, questionIndex) => {
      const normalized = normalizeQuestionContent({ ...pilotDefaults, ...question });
      const inferredCognitiveLevel = topic.contentStatus === 'pilot'
        ? inferPilotCognitiveLevel(topic.id, questionIndex, topic.questions?.length || 0)
        : '';
      const aligned = alignQuestionDemand({
        ...normalized,
        cognitiveLevel: normalized.cognitiveLevel || inferredCognitiveLevel
      });
      const orderedOptions = !aligned.interaction && Array.isArray(aligned.options) && aligned.options.length >= 2
        ? deterministicOptionOrder(aligned.answer, aligned.options, aligned.id || `${topic.id}:${questionIndex}`)
        : aligned.options;
      const canonicalAnswerIndex = Array.isArray(orderedOptions)
        ? orderedOptions.findIndex(option => String(option).trim().toLocaleLowerCase('ms-MY') === String(aligned.answer ?? '').trim().toLocaleLowerCase('ms-MY'))
        : -1;
      const difficulty = String(aligned.difficulty || '').toLowerCase();
      const estimatedTime = normalized.estimatedTime || (
        difficulty.includes('sukar') || difficulty.includes('hard') ? 90
          : difficulty.includes('sederhana') || difficulty.includes('medium') ? 60
            : 40
      );
      return {
        ...aligned,
        options: orderedOptions,
        ...(canonicalAnswerIndex >= 0 ? { answerIndex: canonicalAnswerIndex } : {}),
        estimatedTime,
        metadataReview: {
          questionType: question.questionType || question.type ? 'authored' : 'pilot-default',
          marks: question.marks !== undefined ? 'authored' : 'pilot-default',
          estimatedTime: question.estimatedTime !== undefined ? 'authored' : 'pilot-default',
          cognitiveLevel: aligned.demandAudit?.cognitiveAdjusted
            ? 'canonical-demand-rule'
            : question.cognitiveLevel || question.cognitive_level
            ? 'authored'
            : inferredCognitiveLevel
              ? 'pilot-rule'
              : 'pending-review',
          difficulty: aligned.demandAudit?.difficultyAdjusted ? 'canonical-demand-rule' : 'authored'
        }
      };
    })
  };
}

function inferPilotCognitiveLevel(topicId, questionIndex, questionCount) {
  if (!topicId) return '';
  if (questionCount >= 100) {
    if (questionIndex < 40) return 'mengingat';
    if (questionIndex < 80) return 'memahami';
    return 'mengaplikasi';
  }
  if (questionIndex < 20) return 'mengingat';
  if (questionIndex < 40) return 'memahami';
  return 'mengaplikasi';
}
